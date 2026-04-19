import type { AppState } from '@/lib/app/state';
import type { AppTab, TabGroup } from '@/lib/domain/models';

export interface DisplayGroup {
  id: string;
  baseGroupId: string;
  kind: TabGroup['kind'];
  label: string;
  tabs: AppTab[];
  duplicateCount: number;
  windowId?: number;
  pinned: boolean;
}

export interface DisplaySection {
  id: string;
  title: string;
  groups: DisplayGroup[];
}

export interface VisiblePresentation {
  query: string;
  groups: DisplayGroup[];
  sections: DisplaySection[];
  visibleTabCount: number;
  visibleTabIds: number[];
}

export interface WorkspaceSummary {
  totalTabs: number;
  visibleTabs: number;
  totalGroups: number;
  visibleGroups: number;
  totalDuplicates: number;
  visibleDuplicates: number;
  pinnedGroups: number;
  selectedTabs: number;
  deferredCount: number;
  snapshotCount: number;
  windowCount: number;
  activeWindowLabel: string;
  activeFilters: string[];
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function tabMatchesQuery(tab: AppTab, query: string): boolean {
  if (!query) return true;

  const title = `${tab.cleanTitle} ${tab.title}`.toLowerCase();
  return (
    title.includes(query) ||
    tab.url.toLowerCase().includes(query) ||
    tab.hostname.toLowerCase().includes(query)
  );
}

function recentValue(tab: AppTab): number {
  return tab.lastActivatedAt ? new Date(tab.lastActivatedAt).getTime() : 0;
}

function countDuplicates(tabs: AppTab[]): number {
  const seen = new Map<string, number>();
  for (const tab of tabs) {
    seen.set(tab.url, (seen.get(tab.url) ?? 0) + 1);
  }
  return [...seen.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
}

function onlyDuplicateTabs(tabs: AppTab[]): AppTab[] {
  const counts = new Map<string, number>();
  for (const tab of tabs) {
    counts.set(tab.url, (counts.get(tab.url) ?? 0) + 1);
  }
  return tabs.filter((tab) => (counts.get(tab.url) ?? 0) > 1);
}

function sortTabsForDisplay(tabs: AppTab[], sortMode: AppState['sortMode']) {
  if (sortMode === 'smart') return tabs;

  return [...tabs].sort((a, b) => {
    if (Number(b.active) !== Number(a.active)) return Number(b.active) - Number(a.active);

    const diff = recentValue(b) - recentValue(a);
    if (diff !== 0) return diff;

    const aTitle = a.cleanTitle || a.title || a.url;
    const bTitle = b.cleanTitle || b.title || b.url;
    return aTitle.localeCompare(bTitle);
  });
}

function orderRank(group: DisplayGroup, groupOrder: string[]): number {
  const index = groupOrder.indexOf(group.baseGroupId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function pinRank(group: DisplayGroup, pinnedGroupIds: string[]): number {
  const index = pinnedGroupIds.indexOf(group.baseGroupId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function sortGroupsForDisplay(
  groups: DisplayGroup[],
  sortMode: AppState['sortMode'],
  groupOrder: string[],
  pinnedGroupIds: string[]
) {
  // 分组排序始终先尊重“置顶”，然后再根据当前模式决定是手动顺序还是最近活跃。
  const pinnedSorted = [...groups].sort((a, b) => {
    const aPinned = a.pinned ? 1 : 0;
    const bPinned = b.pinned ? 1 : 0;
    if (bPinned !== aPinned) return bPinned - aPinned;

    const pinDiff = pinRank(a, pinnedGroupIds) - pinRank(b, pinnedGroupIds);
    if (pinDiff !== 0) return pinDiff;

    return a.label.localeCompare(b.label);
  });

  if (sortMode === 'smart') {
    return pinnedSorted.sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      if (bPinned !== aPinned) return bPinned - aPinned;

      const pinDiff = pinRank(a, pinnedGroupIds) - pinRank(b, pinnedGroupIds);
      if (pinDiff !== 0) return pinDiff;

      const rankDiff = orderRank(a, groupOrder) - orderRank(b, groupOrder);
      if (rankDiff !== 0) return rankDiff;
      return a.label.localeCompare(b.label);
    });
  }

  return pinnedSorted.sort((a, b) => {
    const aPinned = a.pinned ? 1 : 0;
    const bPinned = b.pinned ? 1 : 0;
    if (bPinned !== aPinned) return bPinned - aPinned;

    const pinDiff = pinRank(a, pinnedGroupIds) - pinRank(b, pinnedGroupIds);
    if (pinDiff !== 0) return pinDiff;

    const aRecent = Math.max(...a.tabs.map(recentValue), 0);
    const bRecent = Math.max(...b.tabs.map(recentValue), 0);
    if (bRecent !== aRecent) return bRecent - aRecent;
    if (b.tabs.length !== a.tabs.length) return b.tabs.length - a.tabs.length;
    return a.label.localeCompare(b.label);
  });
}

function buildWindowSections(groups: DisplayGroup[]): DisplaySection[] {
  const sections = new Map<number, DisplayGroup[]>();

  for (const group of groups) {
    const byWindow = new Map<number, AppTab[]>();
    for (const tab of group.tabs) {
      if (!byWindow.has(tab.windowId)) byWindow.set(tab.windowId, []);
      byWindow.get(tab.windowId)!.push(tab);
    }

    for (const [windowId, tabs] of byWindow.entries()) {
      if (!sections.has(windowId)) sections.set(windowId, []);
      sections.get(windowId)!.push({
        ...group,
        id: `${group.baseGroupId}__window__${windowId}`,
        tabs,
        duplicateCount: countDuplicates(tabs),
        windowId
      });
    }
  }

  return [...sections.entries()]
    .sort((a, b) => {
      const aTabs = a[1].flatMap((group) => group.tabs);
      const bTabs = b[1].flatMap((group) => group.tabs);
      const aActive = aTabs.some((tab) => tab.active) ? 1 : 0;
      const bActive = bTabs.some((tab) => tab.active) ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      const aRecent = Math.max(...aTabs.map(recentValue), 0);
      const bRecent = Math.max(...bTabs.map(recentValue), 0);
      if (bRecent !== aRecent) return bRecent - aRecent;
      return a[0] - b[0];
    })
    .map(([windowId, windowGroups]) => ({
      id: `window-${windowId}`,
      title: `Window ${windowId}`,
      groups: windowGroups
    }));
}

export function buildVisiblePresentation(state: AppState): VisiblePresentation {
  // 这里把“原始状态”投影成“当前界面真正要展示的结果”，方便把搜索、过滤、排序集中在一处。
  const query = normalizeSearchValue(state.searchQuery);

  const baseGroups = state.groups
    .map((group) => {
      let tabs = group.tabs;
      if (state.duplicatesOnly) tabs = onlyDuplicateTabs(tabs);

      if (query) {
        const groupMatches = `${group.label} ${group.kind}`.toLowerCase().includes(query);
        tabs = groupMatches ? tabs : tabs.filter((tab) => tabMatchesQuery(tab, query));
      }

      tabs = sortTabsForDisplay(tabs, state.sortMode);

      return {
        id: group.id,
        baseGroupId: group.id,
        kind: group.kind,
        label: group.label,
        tabs,
        duplicateCount: countDuplicates(tabs),
        pinned: state.pinnedGroupIds.includes(group.id)
      } satisfies DisplayGroup;
    })
    .filter((group) => group.tabs.length > 0);

  const groups = sortGroupsForDisplay(baseGroups, state.sortMode, state.groupOrder, state.pinnedGroupIds);
  const sections = state.layoutMode === 'windows'
    ? buildWindowSections(groups)
    : [{ id: 'merged', title: 'All windows', groups }];

  return {
    query,
    groups,
    sections: sections.filter((section) => section.groups.length > 0),
    visibleTabCount: groups.reduce((sum, group) => sum + group.tabs.length, 0),
    visibleTabIds: groups.flatMap((group) => group.tabs.map((tab) => tab.id))
  };
}

export function buildWorkspaceSummary(state: AppState, presentation: VisiblePresentation): WorkspaceSummary {
  // 顶部摘要和侧边栏都复用这份 summary，避免多个区域各自重复计算。
  const activeWindowId = state.tabs.find((tab) => tab.active)?.windowId;
  const activeFilters: string[] = [];

  if (state.searchQuery.trim()) activeFilters.push(`Search: ${state.searchQuery.trim()}`);
  if (state.sortMode === 'recent') activeFilters.push('Sort: Recent');
  if (state.duplicatesOnly) activeFilters.push('Duplicates only');
  if (state.layoutMode === 'windows') activeFilters.push('Split by window');
  if (state.snapshotTagFilter) activeFilters.push(`Snapshot tag: ${state.snapshotTagFilter}`);

  return {
    totalTabs: state.tabs.length,
    visibleTabs: presentation.visibleTabCount,
    totalGroups: state.groups.length,
    visibleGroups: presentation.groups.length,
    totalDuplicates: state.groups.reduce((sum, group) => sum + group.duplicateCount, 0),
    visibleDuplicates: presentation.groups.reduce((sum, group) => sum + group.duplicateCount, 0),
    pinnedGroups: state.pinnedGroupIds.length,
    selectedTabs: state.selectedTabIds.length,
    deferredCount: state.deferred.length,
    snapshotCount: state.snapshots.length,
    windowCount: new Set(state.tabs.map((tab) => tab.windowId)).size,
    activeWindowLabel: activeWindowId ? `Window ${activeWindowId}` : 'No active tab',
    activeFilters
  };
}
