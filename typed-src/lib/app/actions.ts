import { groupTabs, normalizeTab } from '@/lib/domain/grouping';
import type { DeferredItem } from '@/lib/domain/models';
import { buildWorkspaceSnapshotChangeSignature, buildWorkspaceSnapshotSignature, type WorkspaceSnapshotV1 } from '@/lib/domain/workspace-snapshot';
import type { Store } from '@/lib/app/store';
import type { AppState } from '@/lib/app/state';
import { closeTab, closeTabs, closeWindows, focusTab, listTabs, moveTabsToNewWindow, openTabWindows, openTabs } from '@/lib/platform/tabs-api';
import { deferredRepository } from '@/lib/storage/deferred-repository';
import { groupAliasRepository } from '@/lib/storage/group-alias-repository';
import { groupOrderRepository } from '@/lib/storage/group-order-repository';
import { pinnedGroupRepository } from '@/lib/storage/pinned-group-repository';
import { recentClosedRepository } from '@/lib/storage/recent-closed-repository';
import { settingsRepository } from '@/lib/storage/settings-repository';
import { snapshotRepository } from '@/lib/storage/snapshot-repository';
import { tabActivityRepository } from '@/lib/storage/tab-activity-repository';
import { getAutoSnapshotName, pickLocale } from '@/lib/i18n';

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
  renameGroup(groupId: string, label: string): Promise<void>;
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

  function t(english: string, chinese: string): string {
    return pickLocale(store.getState().settings.language, english, chinese);
  }

  function getSelectedTabsLabel(): string {
    return t('Selected Tabs', '已选标签页');
  }

  function getFullSweepLabel(): string {
    return t('Full Harbor Sweep', '整仓清理');
  }

  function getDuplicateTabsLabel(): string {
    return t('Duplicate Tabs', '重复标签');
  }

  function getBaseGroupId(groupId: string): string {
    return groupId.split('__window__')[0] ?? groupId;
  }

  function uniqueGroupIds(groupIds: string[]): string[] {
    return [...new Set(groupIds.map((groupId) => getBaseGroupId(groupId)).filter(Boolean))];
  }

  async function rememberClosedTabs(
    label: string,
    tabs: Array<{ url: string; title: string }>
  ): Promise<void> {
    if (!tabs.length) return;

    const closedAt = new Date().toISOString();
    await Promise.all([
      recentClosedRepository.push({
        id: `${Date.now()}:${label}`,
        label,
        closedAt,
        tabs
      }),
      deferredRepository.upsertArchive(tabs)
    ]);
  }

  function buildSnapshot(
    data: {
      tabs: AppState['tabs'];
      deferred: AppState['deferred'];
      archive: AppState['archive'];
      recentClosed: AppState['recentClosed'];
      settings: AppState['settings'];
      groupOrder: AppState['groupOrder'];
      groupAliases: AppState['groupAliases'];
      pinnedGroupIds: AppState['pinnedGroupIds'];
    },
    source: WorkspaceSnapshotV1['source'],
    metadata?: { name?: string; note?: string; tags?: string[] }
  ): WorkspaceSnapshotV1 {
    const windows = new Map<number, { tabs: Array<{ url: string; title: string }>; activeTabIndex: number; focused: boolean }>();
    for (const tab of [...data.tabs].sort((a, b) => {
      if (Number(b.windowFocused) !== Number(a.windowFocused)) return Number(b.windowFocused) - Number(a.windowFocused);
      if (a.windowId !== b.windowId) return a.windowId - b.windowId;
      return a.tabIndex - b.tabIndex;
    })) {
      if (!windows.has(tab.windowId)) {
        windows.set(tab.windowId, {
          tabs: [],
          activeTabIndex: 0,
          focused: tab.windowFocused
        });
      }

      const currentWindow = windows.get(tab.windowId)!;
      currentWindow.focused = currentWindow.focused || tab.windowFocused;
      currentWindow.tabs.push({
        url: tab.url,
        title: tab.cleanTitle || tab.title
      });

      if (tab.active) {
        currentWindow.activeTabIndex = currentWindow.tabs.length - 1;
      }
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
      windows: [...windows.values()].map((window) => ({
        tabs: window.tabs,
        activeTabIndex: window.activeTabIndex,
        focused: window.focused
      })),
      deferred: [...data.deferred, ...data.archive],
      recentClosed: data.recentClosed,
      settings: data.settings,
      groupOrder: data.groupOrder,
      groupAliases: data.groupAliases,
      pinnedGroupIds: data.pinnedGroupIds
    };
  }

  function buildAutoSnapshotSignature(data: {
    tabs: AppState['tabs'];
    deferred: AppState['deferred'];
    archive: AppState['archive'];
    settings: AppState['settings'];
    pinnedGroupIds: AppState['pinnedGroupIds'];
    groupOrder: AppState['groupOrder'];
    groupAliases: AppState['groupAliases'];
  }): string {
    return buildWorkspaceSnapshotChangeSignature(buildSnapshot(
      {
        tabs: data.tabs,
        deferred: data.deferred,
        archive: data.archive,
        recentClosed: [],
        settings: data.settings,
        groupOrder: data.groupOrder,
        groupAliases: data.groupAliases,
        pinnedGroupIds: data.pinnedGroupIds
      },
      'auto',
      { name: getAutoSnapshotName(data.settings.language) }
    ));
  }

  async function captureAutoSnapshot(
    data: {
      tabs: AppState['tabs'];
      deferred: AppState['deferred'];
      archive: AppState['archive'];
      recentClosed: AppState['recentClosed'];
      settings: AppState['settings'];
      groupOrder: AppState['groupOrder'];
      groupAliases: AppState['groupAliases'];
      pinnedGroupIds: AppState['pinnedGroupIds'];
    },
    existingSnapshots: WorkspaceSnapshotV1[]
  ) {
    if (!data.tabs.length) return;

    // 自动快照只在内容真正变化时才落库，避免反复打开新标签页把列表刷满。
    const signature = buildAutoSnapshotSignature(data);
    const previousAutoSnapshot = existingSnapshots.find((snapshot) => snapshot.source === 'auto');
    const previousAutoSignature = previousAutoSnapshot
      ? buildWorkspaceSnapshotChangeSignature(previousAutoSnapshot)
      : '';
    if (signature === lastAutoSnapshotSignature || signature === previousAutoSignature) {
      lastAutoSnapshotSignature = previousAutoSignature || signature;

      // 如果内容和上一份自动快照完全一致，只刷新时间戳，不再生成新的最近版本。
      if (previousAutoSnapshot) {
        const refreshedSnapshot: WorkspaceSnapshotV1 = {
          ...previousAutoSnapshot,
          exportedAt: new Date().toISOString()
        };
        await snapshotRepository.save(refreshedSnapshot);
        return await snapshotRepository.list();
      }

      return;
    }
    lastAutoSnapshotSignature = signature;

    const snapshot = buildSnapshot(data, 'auto', { name: getAutoSnapshotName(data.settings.language) });
    await snapshotRepository.save(snapshot);
    return await snapshotRepository.list();
  }

  async function applySnapshot(snapshot: WorkspaceSnapshotV1) {
    const currentIds = store.getState().tabs.map((tab) => tab.id);
    let createdWindowIds: number[] = [];
    try {
      // 恢复采用“两阶段”思路：先尝试创建目标窗口并写入存储，成功后再清掉旧窗口。
      createdWindowIds = await openTabWindows(snapshot.windows);
      await Promise.all([
        settingsRepository.save(snapshot.settings),
        deferredRepository.replace(snapshot.deferred),
        recentClosedRepository.replace(snapshot.recentClosed),
        groupOrderRepository.save(snapshot.groupOrder),
        groupAliasRepository.save(snapshot.groupAliases),
        pinnedGroupRepository.save(snapshot.pinnedGroupIds),
        snapshotRepository.save(snapshot)
      ]);
    } catch (error) {
      if (createdWindowIds.length) {
        await closeWindows(createdWindowIds);
      }
      throw error;
    }

    if (currentIds.length) {
      try {
        await closeTabs(currentIds);
      } catch {}
    }

    await refresh();
    store.setState((state) => ({
      ...state,
      searchQuery: '',
      selectedTabIds: [],
      toast: t(`Imported snapshot: ${snapshot.name}`, `已导入快照：${snapshot.name}`)
    }));
  }

  function resolveGroup(groupId: string) {
    const resolvedId = getBaseGroupId(groupId);
    return store.getState().groups.find((item) => (
      item.id === groupId ||
      item.id === resolvedId ||
      item.sourceGroupIds.includes(resolvedId)
    ));
  }

  function getGroupScopeIds(groupId: string): string[] {
    const group = resolveGroup(groupId);
    if (!group) return uniqueGroupIds([groupId]);
    return uniqueGroupIds(group.sourceGroupIds.length ? group.sourceGroupIds : [group.id]);
  }

  function isGroupScopePinned(scopeIds: string[], pinnedGroupIds: string[]): boolean {
    return scopeIds.some((groupId) => pinnedGroupIds.includes(groupId));
  }

  function mergeVisibleGroupOrder(storedOrder: string[], reorderedVisible: string[], currentVisibleGroupIds: string[]) {
    const visibleSet = new Set(currentVisibleGroupIds);
    let cursor = 0;
    const merged = storedOrder.map((groupId) => (
      visibleSet.has(groupId)
        ? reorderedVisible[cursor++]
        : groupId
    ));
    const missingVisible = reorderedVisible.filter((groupId) => !storedOrder.includes(groupId));
    return uniqueGroupIds([...merged, ...missingVisible]);
  }

  function buildVisibleGroupOrder(storedOrder: string[]): string[] {
    const visibleGroupIds = uniqueGroupIds(store.getState().groups.flatMap((group) => group.sourceGroupIds));
    return [
      ...storedOrder.filter((groupId) => visibleGroupIds.includes(groupId)),
      ...visibleGroupIds.filter((groupId) => !storedOrder.includes(groupId))
    ];
  }

  function moveGroupScopeWithinVisibleOrder(visibleOrder: string[], sourceScopeIds: string[], targetScopeIds: string[]): string[] {
    const sourceScope = uniqueGroupIds([
      ...visibleOrder.filter((groupId) => sourceScopeIds.includes(groupId)),
      ...sourceScopeIds
    ]);
    const targetScope = uniqueGroupIds([
      ...visibleOrder.filter((groupId) => targetScopeIds.includes(groupId)),
      ...targetScopeIds
    ]);
    const sourceSet = new Set(sourceScope);
    const targetSet = new Set(targetScope);
    const remaining = visibleOrder.filter((groupId) => !sourceSet.has(groupId));

    if (!sourceScope.length) return remaining;

    const lastTargetIndex = remaining.reduce((lastIndex, groupId, index) => (
      targetSet.has(groupId) ? index : lastIndex
    ), -1);

    if (lastTargetIndex === -1) {
      return [...remaining, ...sourceScope];
    }

    return [
      ...remaining.slice(0, lastTargetIndex + 1),
      ...sourceScope,
      ...remaining.slice(lastTargetIndex + 1)
    ];
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
    const [rawTabs, settings, deferredItems, recentClosed, activityMap, snapshots, groupOrder, groupAliases, pinnedGroupIds] = await Promise.all([
      listTabs(),
      settingsRepository.load(),
      deferredRepository.list(),
      recentClosedRepository.list(),
      tabActivityRepository.list(),
      snapshotRepository.list(),
      groupOrderRepository.list(),
      groupAliasRepository.list(),
      pinnedGroupRepository.list()
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

    const groups = groupTabs(hydratedTabs, settings, groupAliases);
    const deferredState = partitionDeferred(deferredItems);
    const autoSnapshots = await captureAutoSnapshot({
      tabs,
      recentClosed,
      settings,
      groupOrder,
      groupAliases,
      pinnedGroupIds,
      ...deferredState
    }, snapshots);

    store.setState((state) => ({
      ...state,
      loading: false,
      tabs,
      groups,
      settings,
      recentClosed,
      groupOrder,
      groupAliases,
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
      // 搜索输入会频繁触发，这里先做值相等短路，避免无意义刷新。
      if (store.getState().searchQuery === query) return;
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
    async renameGroup(groupId, label) {
      const group = resolveGroup(groupId);
      if (!group) return;
      const current = store.getState().groupAliases;
      const next = { ...current };
      const trimmed = label.trim();

      for (const sourceGroupId of group.sourceGroupIds) {
        if (trimmed) next[sourceGroupId] = trimmed;
        else delete next[sourceGroupId];
      }

      await groupAliasRepository.save(next);
      await refresh();
    },
    async togglePinnedGroup(groupId) {
      const current = store.getState().pinnedGroupIds;
      const scopeIds = getGroupScopeIds(groupId);
      if (!scopeIds.length) return;

      const scopeSet = new Set(scopeIds);
      const next = isGroupScopePinned(scopeIds, current)
        ? current.filter((id) => !scopeSet.has(id))
        : [...scopeIds, ...current.filter((id) => !scopeSet.has(id))];

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
      const storedOrder = store.getState().groupOrder;
      const sourceScopeIds = getGroupScopeIds(sourceGroupId);
      const targetScopeIds = getGroupScopeIds(targetGroupId);
      if (!sourceScopeIds.length || !targetScopeIds.length) return;
      if (sourceScopeIds.every((groupId) => targetScopeIds.includes(groupId))) return;

      const visibleGroupIds = uniqueGroupIds(store.getState().groups.flatMap((group) => group.sourceGroupIds));
      const visibleOrder = buildVisibleGroupOrder(storedOrder);
      const reorderedVisible = moveGroupScopeWithinVisibleOrder(visibleOrder, sourceScopeIds, targetScopeIds);
      const next = mergeVisibleGroupOrder(storedOrder, reorderedVisible, visibleGroupIds);

      await groupOrderRepository.save(next);
      store.setState((state) => ({ ...state, groupOrder: next }));
    },
    async focus(tabId, windowId) {
      await focusTab(tabId, windowId);
    },
    async closeOne(tabId) {
      await closeTab(tabId);
      await refresh();
      store.setState((state) => ({ ...state, toast: t('Tab closed', '标签页已关闭') }));
    },
    async closeGroup(groupId, visibleTabIds, visibleLabel) {
      const resolved = resolveVisibleTabs(groupId, visibleTabIds);
      if (!resolved || !resolved.tabs.length) return;
      const { group, tabs } = resolved;
      const label = visibleLabel || group.label;

      await rememberClosedTabs(label, tabs.map((tab) => ({
        url: tab.url,
        title: tab.cleanTitle || tab.title
      })));

      await closeTabs(tabs.map((tab) => tab.id));
      await refresh();
      store.setState((state) => ({
        ...state,
        toast: t(
          `Closed ${tabs.length} tabs from ${label}`,
          `已从“${label}”关闭 ${tabs.length} 个标签页`
        )
      }));
    },
    async closeAll() {
      const groups = store.getState().groups;
      if (!groups.length) return;

      const tabs = groups.flatMap((group) => group.tabs);
      await rememberClosedTabs(getFullSweepLabel(), tabs.map((tab) => ({
        url: tab.url,
        title: tab.cleanTitle || tab.title
      })));

      await closeTabs(tabs.map((tab) => tab.id));
      await refresh();
      store.setState((state) => ({ ...state, toast: t('Cleared the harbor', '当前工作区已清空') }));
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

      const duplicateTabs = tabs.filter((tab) => duplicateIds.includes(tab.id));
      await rememberClosedTabs(getDuplicateTabsLabel(), duplicateTabs.map((tab) => ({
        url: tab.url,
        title: tab.cleanTitle || tab.title
      })));

      await closeTabs(duplicateIds);
      await refresh();
      store.setState((state) => ({ ...state, toast: t('Closed duplicates', '重复标签已关闭') }));
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
      store.setState((state) => ({ ...state, toast: t('Moved to Later', '已移到稍后处理') }));
    },
    async closeSelected(tabIds) {
      const ids = selectExistingIds(tabIds);
      if (!ids.length) return;

      const tabs = store.getState().tabs.filter((tab) => ids.includes(tab.id));
      await rememberClosedTabs(getSelectedTabsLabel(), tabs.map((tab) => ({
        url: tab.url,
        title: tab.cleanTitle || tab.title
      })));

      await closeTabs(ids);
      await refresh();
      store.setState((state) => ({
        ...state,
        selectedTabIds: state.selectedTabIds.filter((tabId) => !ids.includes(tabId)),
        toast: t(
          `Closed ${ids.length} selected tabs`,
          `已关闭 ${ids.length} 个已选标签页`
        )
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
        toast: t(
          `Moved ${ids.length} selected tabs to Later`,
          `已将 ${ids.length} 个已选标签页移到稍后处理`
        )
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
        toast: t(
          `Moved ${ids.length} tabs into a new window`,
          `已将 ${ids.length} 个标签页移到新窗口`
        )
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
        toast: t('Snapshot removed', '快照已删除')
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
        toast: t('Snapshot updated', '快照已更新')
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
      store.setState((state) => ({
        ...state,
        toast: t(`Restored ${item.tabs.length} tabs`, `已恢复 ${item.tabs.length} 个标签页`)
      }));
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
