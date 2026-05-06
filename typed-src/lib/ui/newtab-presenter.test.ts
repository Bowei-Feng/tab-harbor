import { describe, expect, it } from 'vitest';
import type { AppState } from '@/lib/app/state';
import type { AppTab, TabGroup } from '@/lib/domain/models';
import { defaultSettings } from '@/lib/domain/settings';
import { buildVisiblePresentation, buildWorkspaceSummary } from '@/lib/ui/newtab-presenter';

function makeTab(overrides: Partial<AppTab>): AppTab {
  return {
    id: overrides.id ?? 1,
    url: overrides.url ?? 'https://example.com',
    title: overrides.title ?? 'Example',
    cleanTitle: overrides.cleanTitle ?? overrides.title ?? 'Example',
    hostname: overrides.hostname ?? 'example.com',
    active: overrides.active ?? false,
    windowId: overrides.windowId ?? 1,
    favIconUrl: overrides.favIconUrl ?? '',
    tabIndex: overrides.tabIndex ?? 0,
    windowFocused: overrides.windowFocused ?? false,
    isLandingPage: overrides.isLandingPage ?? false,
    lastActivatedAt: overrides.lastActivatedAt
  };
}

function makeGroup(id: string, label: string, tabs: AppTab[], kind: TabGroup['kind'] = 'domain'): TabGroup {
  const counts = new Map<string, number>();
  for (const tab of tabs) {
    counts.set(tab.url, (counts.get(tab.url) ?? 0) + 1);
  }

  return {
    id,
    kind,
    label,
    sourceGroupIds: [id],
    tabs,
    duplicateCount: [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0)
  };
}

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    loading: false,
    tabs: [],
    groups: [],
    deferred: [],
    archive: [],
    recentClosed: [],
    settings: defaultSettings,
    searchQuery: '',
    sortMode: 'smart',
    duplicatesOnly: false,
    layoutMode: 'merged',
    groupOrder: [],
    groupAliases: {},
    pinnedGroupIds: [],
    snapshots: [],
    snapshotTagFilter: '',
    selectedTabIds: [],
    toast: '',
    ...overrides
  };
}

describe('new tab presenter', () => {
  it('uses pinned groups and manual order in smart mode', () => {
    const githubTabs = [makeTab({ id: 1, url: 'https://github.com/a', title: 'GitHub A' })];
    const docsTabs = [makeTab({ id: 2, url: 'https://docs.google.com/a', title: 'Docs', hostname: 'docs.google.com' })];
    const figmaTabs = [makeTab({ id: 3, url: 'https://www.figma.com/file/1', title: 'Figma', hostname: 'www.figma.com' })];
    const groups = [
      makeGroup('domain:github.com', 'GitHub', githubTabs),
      makeGroup('domain:docs.google.com', 'Docs', docsTabs),
      makeGroup('domain:www.figma.com', 'Figma', figmaTabs)
    ];
    const state = makeState({
      tabs: [...githubTabs, ...docsTabs, ...figmaTabs],
      groups,
      pinnedGroupIds: ['domain:docs.google.com'],
      groupOrder: ['domain:github.com', 'domain:www.figma.com', 'domain:docs.google.com']
    });

    const visible = buildVisiblePresentation(state);

    expect(visible.groups.map((group) => group.id)).toEqual([
      'domain:docs.google.com',
      'domain:github.com',
      'domain:www.figma.com'
    ]);
  });

  it('uses recent order for unpinned groups in recent mode', () => {
    const githubTabs = [makeTab({
      id: 1,
      url: 'https://github.com/a',
      title: 'GitHub A',
      lastActivatedAt: '2026-04-19T08:00:00.000Z'
    })];
    const docsTabs = [makeTab({
      id: 2,
      url: 'https://docs.google.com/a',
      title: 'Docs',
      hostname: 'docs.google.com',
      lastActivatedAt: '2026-04-19T07:00:00.000Z'
    })];
    const figmaTabs = [makeTab({
      id: 3,
      url: 'https://www.figma.com/file/1',
      title: 'Figma',
      hostname: 'www.figma.com',
      lastActivatedAt: '2026-04-19T09:30:00.000Z'
    })];
    const groups = [
      makeGroup('domain:github.com', 'GitHub', githubTabs),
      makeGroup('domain:docs.google.com', 'Docs', docsTabs),
      makeGroup('domain:www.figma.com', 'Figma', figmaTabs)
    ];
    const state = makeState({
      tabs: [...githubTabs, ...docsTabs, ...figmaTabs],
      groups,
      sortMode: 'recent',
      pinnedGroupIds: ['domain:docs.google.com'],
      groupOrder: ['domain:github.com', 'domain:www.figma.com', 'domain:docs.google.com']
    });

    const visible = buildVisiblePresentation(state);

    expect(visible.groups.map((group) => group.id)).toEqual([
      'domain:docs.google.com',
      'domain:www.figma.com',
      'domain:github.com'
    ]);
  });

  it('filters to duplicate tabs and reports active filters in summary', () => {
    const dup1 = makeTab({
      id: 1,
      url: 'https://github.com/openai/openai',
      title: 'OpenAI Repo',
      active: true,
      windowFocused: true
    });
    const dup2 = makeTab({
      id: 2,
      url: 'https://github.com/openai/openai',
      title: 'OpenAI Repo Duplicate'
    });
    const other = makeTab({
      id: 3,
      url: 'https://github.com/openai/codex',
      title: 'Codex Repo'
    });
    const docs = makeTab({
      id: 4,
      url: 'https://docs.microsoft.com',
      title: 'Microsoft Learn',
      hostname: 'docs.microsoft.com'
    });
    const groups = [
      makeGroup('domain:github.com', 'GitHub', [dup1, dup2, other]),
      makeGroup('domain:docs.microsoft.com', 'Microsoft Learn', [docs])
    ];
    const state = makeState({
      tabs: [dup1, dup2, other, docs],
      groups,
      searchQuery: 'github',
      duplicatesOnly: true,
      sortMode: 'recent',
      layoutMode: 'windows',
      snapshotTagFilter: 'client-a',
      selectedTabIds: [1, 2],
      snapshots: [{
        id: 'snap-1',
        version: 1,
        exportedAt: '2026-04-19T08:30:00.000Z',
        name: 'Client A',
        note: '',
        tags: ['client-a'],
        source: 'manual',
        windows: [{ tabs: [{ url: 'https://github.com/openai/openai', title: 'OpenAI Repo' }], activeTabIndex: 0, focused: true }],
        deferred: [],
        recentClosed: [],
        settings: defaultSettings,
        groupOrder: [],
        groupAliases: {},
        pinnedGroupIds: []
      }]
    });

    const visible = buildVisiblePresentation(state);
    const summary = buildWorkspaceSummary(state, visible);

    expect(visible.visibleTabIds).toEqual([1, 2]);
    expect(visible.groups).toHaveLength(1);
    expect(summary.visibleDuplicates).toBe(1);
    expect(summary.activeFilters).toEqual([
      'Search: github',
      'Sort: Recent',
      'Duplicates only',
      'Split by window',
      'Snapshot tag: client-a'
    ]);
    expect(summary.activeWindowLabel).toBe('Window 1');
    expect(summary.selectedTabs).toBe(2);
  });

  it('treats merged alias groups as pinned when any source group is pinned', () => {
    const cloudATab = makeTab({
      id: 1,
      url: 'https://a.cloudlabs.example/app',
      title: 'Cloudlabs A',
      hostname: 'a.cloudlabs.example'
    });
    const cloudBTab = makeTab({
      id: 2,
      url: 'https://b.cloudlabs.example/app',
      title: 'Cloudlabs B',
      hostname: 'b.cloudlabs.example'
    });

    const state = makeState({
      tabs: [cloudATab, cloudBTab],
      groups: [{
        id: 'alias:Cloudlabs',
        kind: 'domain',
        label: 'Cloudlabs',
        sourceGroupIds: ['domain:a.cloudlabs.example', 'domain:b.cloudlabs.example'],
        tabs: [cloudATab, cloudBTab],
        duplicateCount: 0
      }],
      pinnedGroupIds: ['domain:b.cloudlabs.example']
    });

    const visible = buildVisiblePresentation(state);

    expect(visible.groups).toHaveLength(1);
    expect(visible.groups[0]?.pinned).toBe(true);
  });
});
