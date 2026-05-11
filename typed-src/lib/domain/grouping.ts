import type { AppTab, BrowserTabLike, TabGroup } from './models';
import type { AppSettings, CustomGroupRule, LandingPageRule } from './settings';
import { cleanTitle, friendlyDomain, smartTitle } from './normalization';

const baseLandingRules: LandingPageRule[] = [
  { hostname: 'mail.google.com', pathExact: ['/mail/u/0/', '/mail/u/0/#inbox'] },
  { hostname: 'x.com', pathExact: ['/home'] },
  { hostname: 'github.com', pathExact: ['/'] },
  { hostname: 'www.youtube.com', pathExact: ['/'] },
  { hostname: 'www.linkedin.com', pathExact: ['/'] }
];

function isInternalUrl(url: string): boolean {
  return (
    !url ||
    url.startsWith('edge://') ||
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:')
  );
}

function matchesLandingRule(url: string, rules: LandingPageRule[]): boolean {
  try {
    const parsed = new URL(url);
    return rules.some((rule) => {
      const hostnameMatch = rule.hostname
        ? parsed.hostname === rule.hostname
        : rule.hostnameEndsWith
          ? parsed.hostname.endsWith(rule.hostnameEndsWith)
          : false;
      if (!hostnameMatch) return false;
      if (rule.pathExact) return rule.pathExact.includes(parsed.pathname);
      if (rule.pathPrefix) return parsed.pathname.startsWith(rule.pathPrefix);
      return parsed.pathname === '/';
    });
  } catch {
    return false;
  }
}

function matchCustomRule(url: string, rules: CustomGroupRule[]): CustomGroupRule | null {
  try {
    const parsed = new URL(url);
    return rules.find((rule) => {
      const hostnameMatch = rule.hostname
        ? parsed.hostname === rule.hostname
        : rule.hostnameEndsWith
          ? parsed.hostname.endsWith(rule.hostnameEndsWith)
          : false;
      if (!hostnameMatch) return false;
      return rule.pathPrefix ? parsed.pathname.startsWith(rule.pathPrefix) : true;
    }) ?? null;
  } catch {
    return null;
  }
}

function duplicateCount(tabs: AppTab[]): number {
  const seen = new Map<string, number>();
  for (const tab of tabs) {
    seen.set(tab.url, (seen.get(tab.url) ?? 0) + 1);
  }
  return [...seen.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
}

function sortTabsWithinGroup(tabs: AppTab[]): AppTab[] {
  const urlCounts = new Map<string, number>();
  for (const tab of tabs) {
    urlCounts.set(tab.url, (urlCounts.get(tab.url) ?? 0) + 1);
  }

  // 组内排序优先把重复 URL 聚在一起，这样用户在一个堆栈里更容易先看到可清理项。
  return [...tabs].sort((a, b) => {
    const aCount = urlCounts.get(a.url) ?? 0;
    const bCount = urlCounts.get(b.url) ?? 0;
    const aDuplicate = Number(aCount > 1);
    const bDuplicate = Number(bCount > 1);

    if (bDuplicate !== aDuplicate) return bDuplicate - aDuplicate;
    if (bCount !== aCount) return bCount - aCount;
    if (a.url !== b.url) return a.url.localeCompare(b.url);
    if (Number(b.active) !== Number(a.active)) return Number(b.active) - Number(a.active);
    if ((b.lastActivatedAt ?? '') !== (a.lastActivatedAt ?? '')) {
      return (b.lastActivatedAt ?? '').localeCompare(a.lastActivatedAt ?? '');
    }

    const aTitle = a.cleanTitle || a.title || a.url;
    const bTitle = b.cleanTitle || b.title || b.url;
    return aTitle.localeCompare(bTitle);
  });
}

export function normalizeTab(raw: BrowserTabLike, settings: AppSettings): AppTab | null {
  const url = raw.url ?? '';
  if (!raw.id || !raw.windowId || isInternalUrl(url)) return null;

  let hostname = 'local-files';
  if (!url.startsWith('file://')) {
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = '';
    }
  }

  if (!hostname || settings.hiddenDomains.includes(hostname)) return null;

  const title = smartTitle(raw.title ?? '', url);
  return {
    id: raw.id,
    url,
    title: raw.title ?? '',
    cleanTitle: cleanTitle(title, hostname),
    hostname,
    active: Boolean(raw.active),
    windowId: raw.windowId,
    favIconUrl: raw.favIconUrl ?? '',
    tabIndex: raw.tabIndex ?? 0,
    windowFocused: raw.windowFocused === true,
    isLandingPage: matchesLandingRule(url, [...baseLandingRules, ...settings.landingPageRules]),
    lastActivatedAt: raw.lastActivatedAt
  };
}

export function groupTabs(rawTabs: BrowserTabLike[], settings: AppSettings, groupAliases: Record<string, string> = {}): TabGroup[] {
  // 分组策略分三层：先拎出 landing，再套自定义规则，最后回落到按域名分桶。
  const tabs = rawTabs
    .map((tab) => normalizeTab(tab, settings))
    .filter((tab): tab is AppTab => Boolean(tab));

  const landing: AppTab[] = [];
  const grouped = new Map<string, { label: string; kind: TabGroup['kind']; tabs: AppTab[] }>();

  for (const tab of tabs) {
    if (tab.isLandingPage) {
      landing.push(tab);
      continue;
    }

    const custom = matchCustomRule(tab.url, settings.customGroupRules);
    if (custom) {
      const key = `custom:${custom.groupKey}`;
      if (!grouped.has(key)) grouped.set(key, { label: custom.groupLabel, kind: 'custom', tabs: [] });
      grouped.get(key)!.tabs.push(tab);
      continue;
    }

    const key = `domain:${tab.hostname}`;
    if (!grouped.has(key)) grouped.set(key, { label: friendlyDomain(tab.hostname), kind: 'domain', tabs: [] });
    grouped.get(key)!.tabs.push(tab);
  }

  const results: TabGroup[] = [];
  if (landing.length) {
    results.push({
      id: 'landing',
      kind: 'landing',
      label: groupAliases.landing || 'Harbor Deck',
      sourceGroupIds: ['landing'],
      tabs: sortTabsWithinGroup(landing),
      duplicateCount: duplicateCount(landing)
    });
  }

  for (const [id, group] of grouped.entries()) {
    results.push({
      id,
      kind: group.kind,
      label: groupAliases[id] || group.label,
      sourceGroupIds: [id],
      tabs: sortTabsWithinGroup(group.tabs),
      duplicateCount: duplicateCount(group.tabs)
    });
  }

  // 允许“一个分组被改名成另一个分组当前显示名”时也合并。
  // 这样像默认叫 Learn Microsoft 的分组，和另一个被用户改成 Learn Microsoft 的分组，会在刷新后并到一起。
  const labelBuckets = new Map<string, Array<TabGroup & { aliasApplied: boolean }>>();

  for (const group of results) {
    const alias = groupAliases[group.sourceGroupIds[0] ?? group.id]?.trim() ?? '';
    const bucket = labelBuckets.get(group.label) ?? [];
    bucket.push({
      ...group,
      aliasApplied: Boolean(alias)
    });
    labelBuckets.set(group.label, bucket);
  }

  const mergedAliases = [...labelBuckets.entries()].flatMap(([label, groups]) => {
    if (groups.length === 1 || !groups.some((group) => group.aliasApplied)) {
      return groups.map(({ aliasApplied, ...group }) => group);
    }

    const mergedTabs = sortTabsWithinGroup(groups.flatMap((group) => group.tabs));
    const sourceGroupIds = groups.flatMap((group) => group.sourceGroupIds);
    const primary = groups
      .slice()
      .sort((a, b) => {
        if (b.tabs.length !== a.tabs.length) return b.tabs.length - a.tabs.length;
        return a.id.localeCompare(b.id);
      })[0]!;

    return {
      id: `alias:${label}`,
      kind: primary.kind,
      label,
      sourceGroupIds,
      tabs: mergedTabs,
      duplicateCount: duplicateCount(mergedTabs)
    } satisfies TabGroup;
  });

  return mergedAliases.sort((a, b) => {
    if (a.kind === 'landing' && b.kind !== 'landing') return -1;
    if (b.kind === 'landing' && a.kind !== 'landing') return 1;
    return b.tabs.length - a.tabs.length;
  });
}
