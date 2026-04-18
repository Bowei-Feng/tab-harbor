import { groupTabs, normalizeTab } from '@/lib/domain/grouping';
import type { DeferredItem } from '@/lib/domain/models';
import type { WorkspaceSnapshotV1 } from '@/lib/domain/workspace-snapshot';
import type { Store } from '@/lib/app/store';
import type { AppState } from '@/lib/app/state';
import { listTabs, closeTab, closeTabs, focusTab, moveTabsToNewWindow, openTabWindows, openTabs } from '@/lib/platform/tabs-api';
import { deferredRepository } from '@/lib/storage/deferred-repository';
import { groupOrderRepository } from '@/lib/storage/group-order-repository';
import { pinnedGroupRepository } from '@/lib/storage/pinned-group-repository';
import { recentClosedRepository } from '@/lib/storage/recent-closed-repository';
import { settingsRepository } from '@/lib/storage/settings-repository';
import { snapshotRepository } from '@/lib/storage/snapshot-repository';
import { tabActivityRepository } from '@/lib/storage/tab-activity-repository';

function partitionDeferred(items: DeferredItem[]) {
  const visible = items.filter((item) => !item.dismissed);
  return {
    deferred: visible.filter((item) => !item.completed),
    archive: visible.filter((item) => item.completed)
  };
}

export interface AppActions {
  initialize(): Promise<void>;
  refresh(): Promise<void>;
  setSearchQuery(query: string): void;
  setSnapshotTagFilter(tag: string): void;
  setSortMode(mode: AppState['sortMode']): void;
  setDuplicatesOnly(enabled: boolean): void;
  setLayoutMode(mode: AppState['layoutMode']): void;
  togglePinnedGroup(groupId: string): Promise<void>;
  toggleTabSelection(tabId: number): void;
  setTabSelection(tabIds: number[], selected: boolean): void;
  clearSelection(): void;
  reorderGroups(sourceGroupId: string, targetGroupId: string): Promise<void>;
  focus(tabId: number, windowId: number): Promise<void>;
  closeOne(tabId: number): Promise<void>;
  closeGroup(groupId: string, visibleTabIds?: number[], visibleLabel?: string): Promise<void>;
  closeAll(): Promise<void>;
  closeDuplicates(groupId: string, visibleTabIds?: number[]): Promise<void>;
  defer(tabId: number): Promise<void>;
  closeSelected(tabIds?: number[]): Promise<void>;
  deferSelected(tabIds?: number[]): Promise<void>;
  moveSelectedToNewWindow(tabIds?: number[]): Promise<void>;
  exportWorkspaceSnapshot(metadata?: { name?: string; note?: string; tags?: string[] }): Promise<WorkspaceSnapshotV1>;
  importWorkspaceSnapshot(snapshot: WorkspaceSnapshotV1): Promise<void>;
  restoreSnapshot(id: string): Promise<void>;
  deleteSnapshot(id: string): Promise<void>;
  updateSnapshotMetadata(id: string, metadata: { name: string; note: string; tags: string[] }): Promise<void>;
  completeDeferred(id: string): Promise<void>;
  dismissDeferred(id: string): Promise<void>;
  restoreRecent(id: string): Promise<void>;
  dismissRecent(id: string): Promise<void>;
  clearToast(): void;
}

export function createAppActions(store: Store<AppState>): AppActions {
  let lastAutoSnapshotSignature = '';

  function getBaseGroupId(groupId: string): string {
    return groupId.split('__window__')[0] ?? groupId;
  }

  function buildSnapshot(
    data: {
      tabs: AppState['tabs'];
      deferred: AppState['deferred'];
      archive: AppState['archive'];
      recentClosed: AppState['recentClosed'];
      settings: AppState['settings'];
      groupOrder: AppState['groupOrder'];
      pinnedGroupIds: AppState['pinnedGroupIds'];
    },
    source: WorkspaceSnapshotV1['source'],
    metadata?: { name?: string; note?: string; tags?: string[] }
  ): WorkspaceSnapshotV1 {
    const windows = new Map<number, Array<{ url: string; title: string }>>();
    for (const tab of data.tabs) {
      if (!windows.has(tab.windowId)) windows.set(tab.windowId, []);
      windows.get(tab.windowId)!.push({
        url: tab.url,
        title: tab.cleanTitle || tab.title
      });
    }

    const exportedAt = new Date().toISOString();
    return {
      id: `${exportedAt}:${source}:${Math.random().toString(36).slice(2, 8)}`,
      version: 1,
      exportedAt,
      name: metadata?.name?.trim() || `tab-harbor-${exportedAt.slice(0, 19).replace(/[:T]/g, '-')}`,
      note: metadata?.note?.trim() || '',
      tags: (metadata?.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
      source,
      windows: [...windows.values()].map((tabs) => ({ tabs })),
      deferred: [...data.deferred, ...data.archive],
      recentClosed: data.recentClosed,
      settings: data.settings,
      groupOrder: data.groupOrder,
      pinnedGroupIds: data.pinnedGroupIds
    };
  }

  function buildAutoSnapshotSignature(data: {
    tabs: AppState['tabs'];
    deferred: AppState['deferred'];
    archive: AppState['archive'];
    pinnedGroupIds: AppState['pinnedGroupIds'];
    groupOrder: AppState['groupOrder'];
  }): string {
    return JSON.stringify({
      tabs: data.tabs.map((tab) => [tab.windowId, tab.url]),
      deferred: [...data.deferred, ...data.archive].map((item) => item.url),
      pinned: data.pinnedGroupIds,
      order: data.groupOrder
    });
  }

  async function captureAutoSnapshot(
    data: {
      tabs: AppState['tabs'];
      deferred: AppState['deferred'];
      archive: AppState['archive'];
      recentClosed: AppState['recentClosed'];
      settings: AppState['settings'];
      groupOrder: AppState['groupOrder'];
      pinnedGroupIds: AppState['pinnedGroupIds'];
    }
  ) {
    if (!data.tabs.length) return;

    const signature = buildAutoSnapshotSignature(data);
    if (signature === lastAutoSnapshotSignature) return;
    lastAutoSnapshotSignature = signature;

    const snapshot = buildSnapshot(data, 'auto', { name: 'Auto Snapshot' });
    await snapshotRepository.save(snapshot);
    return await snapshotRepository.list();
  }

  async function applySnapshot(snapshot: WorkspaceSnapshotV1) {
    await Promise.all([
      settingsRepository.save(snapshot.settings),
      deferredRepository.replace(snapshot.deferred),
      recentClosedRepository.replace(snapshot.recentClosed),
      groupOrderRepository.save(snapshot.groupOrder),
      pinnedGroupRepository.save(snapshot.pinnedGroupIds),
      snapshotRepository.save(snapshot)
    ]);

    const currentIds = store.getState().tabs.map((tab) => tab.id);
    if (currentIds.length) {
      await closeTabs(currentIds);
    }

    await openTabWindows(
      snapshot.windows.map((window) => window.tabs.map((tab) => tab.url))
    );

    await refresh();
    store.setState((state) => ({
      ...state,
      searchQuery: '',
      selectedTabIds: [],
      toast: `Imported snapshot: ${snapshot.name}`
    }));
  }

  async function savePrunedGroupOrder(nextGroupIds: string[]) {
    const allowed = new Set(nextGroupIds);
    const order = (await groupOrderRepository.list()).filter((groupId) => allowed.has(groupId));
    await groupOrderRepository.save(order);
    return order;
  }

  async function savePrunedPinnedGroups(nextGroupIds: string[]) {
    const allowed = new Set(nextGroupIds);
    const pinned = (await pinnedGroupRepository.list()).filter((groupId) => allowed.has(groupId));
    await pinnedGroupRepository.save(pinned);
    return pinned;
  }

  function resolveGroup(groupId: string) {
    return store.getState().groups.find((item) => item.id === getBaseGroupId(groupId));
  }

  function resolveVisibleTabs(groupId: string, visibleTabIds?: number[]) {
    const group = resolveGroup(groupId);
    if (!group) return null;

    if (!visibleTabIds?.length) {
      return {
        group,
        tabs: group.tabs
      };
    }

    const visibleSet = new Set(visibleTabIds);
    return {
      group,
      tabs: group.tabs.filter((tab) => visibleSet.has(tab.id))
    };
  }

  function selectExistingIds(tabIds?: number[]): number[] {
    const existing = new Set(store.getState().tabs.map((tab) => tab.id));
    const source = tabIds?.length ? tabIds : store.getState().selectedTabIds;
    return source.filter((tabId) => existing.has(tabId));
  }

  async function refresh() {
    const [rawTabs, settings, deferredItems, recentClosed, activityMap, snapshots] = await Promise.all([
      listTabs(),
      settingsRepository.load(),
      deferredRepository.list(),
      recentClosedRepository.list(),
      tabActivityRepository.list(),
      snapshotRepository.list()
    ]);
    void tabActivityRepository.prune(
      rawTabs
        .map((tab) => tab.id)
        .filter((tabId): tabId is number => typeof tabId === 'number')
    );

    const hydratedTabs = rawTabs.map((tab) => ({
      ...tab,
      lastActivatedAt: tab.id ? activityMap[tab.id] : undefined
    }));

    const tabs = hydratedTabs
      .map((tab) => normalizeTab(tab, settings))
      .filter((tab): tab is NonNullable<typeof tab> => Boolean(tab));

    const groups = groupTabs(hydratedTabs, settings);
    const groupOrder = await savePrunedGroupOrder(groups.map((group) => group.id));
    const pinnedGroupIds = await savePrunedPinnedGroups(groups.map((group) => group.id));
    const deferredState = partitionDeferred(deferredItems);
    const autoSnapshots = await captureAutoSnapshot({
      tabs,
      recentClosed,
      settings,
      groupOrder,
      pinnedGroupIds,
      ...deferredState
    });

    store.setState((state) => ({
      ...state,
      loading: false,
      tabs,
      groups,
      settings,
      recentClosed,
      groupOrder,
      pinnedGroupIds,
      snapshots: autoSnapshots ?? snapshots,
      selectedTabIds: state.selectedTabIds.filter((tabId) => tabs.some((tab) => tab.id === tabId)),
      ...deferredState
    }));
  }

  return {
    async initialize() {
      await refresh();
    },
    async refresh() {
      await refresh();
    },
    setSearchQuery(query) {
      store.setState((state) => ({ ...state, searchQuery: query }));
    },
    setSnapshotTagFilter(tag) {
      store.setState((state) => ({ ...state, snapshotTagFilter: tag }));
    },
    setSortMode(mode) {
      store.setState((state) => ({ ...state, sortMode: mode }));
    },
    setDuplicatesOnly(enabled) {
      store.setState((state) => ({ ...state, duplicatesOnly: enabled }));
    },
    setLayoutMode(mode) {
      store.setState((state) => ({ ...state, layoutMode: mode }));
    },
    async togglePinnedGroup(groupId) {
      const baseGroupId = getBaseGroupId(groupId);
      const current = store.getState().pinnedGroupIds;
      const next = current.includes(baseGroupId)
        ? current.filter((id) => id !== baseGroupId)
        : [baseGroupId, ...current];

      await pinnedGroupRepository.save(next);
      store.setState((state) => ({ ...state, pinnedGroupIds: next }));
    },
    toggleTabSelection(tabId) {
      store.setState((state) => ({
        ...state,
        selectedTabIds: state.selectedTabIds.includes(tabId)
          ? state.selectedTabIds.filter((id) => id !== tabId)
          : [...state.selectedTabIds, tabId]
      }));
    },
    setTabSelection(tabIds, selected) {
      const uniqueIds = [...new Set(tabIds)];
      store.setState((state) => {
        const current = new Set(state.selectedTabIds);
        for (const tabId of uniqueIds) {
          if (selected) current.add(tabId);
          else current.delete(tabId);
        }
        return {
          ...state,
          selectedTabIds: [...current]
        };
      });
    },
    clearSelection() {
      store.setState((state) => ({ ...state, selectedTabIds: [] }));
    },
    async reorderGroups(sourceGroupId, targetGroupId) {
      const sourceId = getBaseGroupId(sourceGroupId);
      const targetId = getBaseGroupId(targetGroupId);
      if (!sourceId || !targetId || sourceId === targetId) return;

      const currentIds = store.getState().groups.map((group) => group.id);
      const ordered = [
        ...store.getState().groupOrder.filter((groupId) => currentIds.includes(groupId)),
        ...currentIds.filter((groupId) => !store.getState().groupOrder.includes(groupId))
      ];

      const sourceIndex = ordered.indexOf(sourceId);
      const targetIndex = ordered.indexOf(targetId);
      if (sourceIndex === -1 || targetIndex === -1) return;

      const next = [...ordered];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);

      await groupOrderRepository.save(next);
      store.setState((state) => ({ ...state, groupOrder: next }));
    },
    async focus(tabId, windowId) {
      await focusTab(tabId, windowId);
    },
    async closeOne(tabId) {
      await closeTab(tabId);
      await refresh();
      store.setState((state) => ({ ...state, toast: 'Tab closed' }));
    },
    async closeGroup(groupId, visibleTabIds, visibleLabel) {
      const resolved = resolveVisibleTabs(groupId, visibleTabIds);
      if (!resolved || !resolved.tabs.length) return;
      const { group, tabs } = resolved;
      const label = visibleLabel || group.label;

      await recentClosedRepository.push({
        id: `${Date.now()}:${group.id}`,
        label,
        closedAt: new Date().toISOString(),
        tabs: tabs.map((tab) => ({
          url: tab.url,
          title: tab.cleanTitle || tab.title
        }))
      });

      await closeTabs(tabs.map((tab) => tab.id));
      await refresh();
      store.setState((state) => ({
        ...state,
        toast: `Closed ${tabs.length} tabs from ${label}`
      }));
    },
    async closeAll() {
      const groups = store.getState().groups;
      if (!groups.length) return;

      const tabs = groups.flatMap((group) => group.tabs);
      await recentClosedRepository.push({
        id: `${Date.now()}:full-sweep`,
        label: 'Full Harbor Sweep',
        closedAt: new Date().toISOString(),
        tabs: tabs.map((tab) => ({
          url: tab.url,
          title: tab.cleanTitle || tab.title
        }))
      });

      await closeTabs(tabs.map((tab) => tab.id));
      await refresh();
      store.setState((state) => ({ ...state, toast: 'Cleared the harbor' }));
    },
    async closeDuplicates(groupId, visibleTabIds) {
      const resolved = resolveVisibleTabs(groupId, visibleTabIds);
      if (!resolved || !resolved.tabs.length) return;
      const { tabs } = resolved;

      const seen = new Set<string>();
      const duplicateIds: number[] = [];
      for (const tab of tabs) {
        if (seen.has(tab.url)) duplicateIds.push(tab.id);
        else seen.add(tab.url);
      }

      await closeTabs(duplicateIds);
      await refresh();
      store.setState((state) => ({ ...state, toast: 'Closed duplicates' }));
    },
    async defer(tabId) {
      const tab = store.getState().tabs.find((item) => item.id === tabId);
      if (!tab) return;

      await deferredRepository.add({
        id: `${Date.now()}:${tab.id}`,
        url: tab.url,
        title: tab.cleanTitle || tab.title,
        createdAt: new Date().toISOString(),
        completed: false,
        dismissed: false
      });

      await closeTab(tab.id);
      await refresh();
      store.setState((state) => ({ ...state, toast: 'Moved to Later' }));
    },
    async closeSelected(tabIds) {
      const ids = selectExistingIds(tabIds);
      if (!ids.length) return;

      const tabs = store.getState().tabs.filter((tab) => ids.includes(tab.id));
      await recentClosedRepository.push({
        id: `${Date.now()}:selected`,
        label: 'Selected Tabs',
        closedAt: new Date().toISOString(),
        tabs: tabs.map((tab) => ({
          url: tab.url,
          title: tab.cleanTitle || tab.title
        }))
      });

      await closeTabs(ids);
      await refresh();
      store.setState((state) => ({
        ...state,
        selectedTabIds: state.selectedTabIds.filter((tabId) => !ids.includes(tabId)),
        toast: `Closed ${ids.length} selected tabs`
      }));
    },
    async deferSelected(tabIds) {
      const ids = selectExistingIds(tabIds);
      if (!ids.length) return;

      const tabs = store.getState().tabs.filter((tab) => ids.includes(tab.id));
      for (const tab of tabs) {
        await deferredRepository.add({
          id: `${Date.now()}:${tab.id}`,
          url: tab.url,
          title: tab.cleanTitle || tab.title,
          createdAt: new Date().toISOString(),
          completed: false,
          dismissed: false
        });
      }

      await closeTabs(ids);
      await refresh();
      store.setState((state) => ({
        ...state,
        selectedTabIds: state.selectedTabIds.filter((tabId) => !ids.includes(tabId)),
        toast: `Moved ${ids.length} selected tabs to Later`
      }));
    },
    async moveSelectedToNewWindow(tabIds) {
      const ids = selectExistingIds(tabIds);
      if (!ids.length) return;

      await moveTabsToNewWindow(ids);
      await refresh();
      store.setState((state) => ({
        ...state,
        selectedTabIds: state.selectedTabIds.filter((tabId) => !ids.includes(tabId)),
        toast: `Moved ${ids.length} tabs into a new window`
      }));
    },
    async exportWorkspaceSnapshot(metadata) {
      const state = store.getState();
      const snapshot = buildSnapshot(state, 'manual', metadata);
      await snapshotRepository.save(snapshot);
      store.setState((current) => ({
        ...current,
        snapshots: [snapshot, ...current.snapshots.filter((item) => item.id !== snapshot.id)].slice(0, 8)
      }));
      return snapshot;
    },
    async importWorkspaceSnapshot(snapshot) {
      await applySnapshot({
        ...snapshot,
        source: snapshot.source ?? 'imported'
      });
    },
    async restoreSnapshot(id) {
      const snapshot = store.getState().snapshots.find((item) => item.id === id);
      if (!snapshot) return;
      await applySnapshot(snapshot);
    },
    async deleteSnapshot(id) {
      await snapshotRepository.remove(id);
      store.setState((state) => ({
        ...state,
        snapshots: state.snapshots.filter((item) => item.id !== id),
        toast: 'Snapshot removed'
      }));
    },
    async updateSnapshotMetadata(id, metadata) {
      const snapshot = store.getState().snapshots.find((item) => item.id === id);
      if (!snapshot) return;

      const nextSnapshot: WorkspaceSnapshotV1 = {
        ...snapshot,
        name: metadata.name.trim() || snapshot.name,
        note: metadata.note.trim(),
        tags: metadata.tags.map((tag) => tag.trim()).filter(Boolean)
      };

      await snapshotRepository.save(nextSnapshot);
      store.setState((state) => ({
        ...state,
        snapshots: [nextSnapshot, ...state.snapshots.filter((item) => item.id !== id)].slice(0, 8),
        toast: 'Snapshot updated'
      }));
    },
    async completeDeferred(id) {
      await deferredRepository.complete(id);
      await refresh();
    },
    async dismissDeferred(id) {
      await deferredRepository.dismiss(id);
      await refresh();
    },
    async restoreRecent(id) {
      const item = store.getState().recentClosed.find((entry) => entry.id === id);
      if (!item) return;

      await openTabs(item.tabs.map((tab) => tab.url));
      await recentClosedRepository.remove(id);
      await refresh();
      store.setState((state) => ({ ...state, toast: `Restored ${item.tabs.length} tabs` }));
    },
    async dismissRecent(id) {
      await recentClosedRepository.remove(id);
      await refresh();
    },
    clearToast() {
      store.setState((state) => ({ ...state, toast: '' }));
    }
  };
}
