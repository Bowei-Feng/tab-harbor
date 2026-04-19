import './style.css';
import { createAppActions } from '@/lib/app/actions';
import { initialAppState } from '@/lib/app/state';
import { createStore } from '@/lib/app/store';
import { parseWorkspaceSnapshot } from '@/lib/domain/workspace-snapshot';
import { renderNewtab, type SnapshotDialogViewModel } from '@/lib/ui/newtab-render';
import { formatSnapshotDraftName, pickLocale } from '@/lib/i18n';

const root = document.getElementById('app');
const store = createStore(initialAppState);
const actions = createAppActions(store);
let draggingGroupId: string | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let searchCommitTimer: ReturnType<typeof setTimeout> | null = null;
let liveSearchQuery = store.getState().searchQuery;
let hasRenderedOnce = false;
let snapshotDialog: SnapshotDialogViewModel = {
  mode: 'closed',
  name: '',
  note: '',
  tags: '',
  error: '',
  submitting: false
};

function t(english: string, chinese: string): string {
  return pickLocale(store.getState().settings.language, english, chinese);
}

function parseTabIds(raw: string | undefined): number[] | undefined {
  if (!raw) return undefined;
  const ids = raw
    .split(',')
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
  return ids.length ? ids : undefined;
}

function getNavTargets(): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>('[data-nav-target="tab"]')];
}

function focusSearchInput() {
  const input = document.querySelector<HTMLInputElement>('[data-role="tab-search"]');
  if (!input) return;
  input.focus();
  input.select();
}

function moveFocus(direction: 1 | -1) {
  const targets = getNavTargets();
  if (!targets.length) return;

  const active = document.activeElement as HTMLElement | null;
  const currentIndex = targets.findIndex((target) => target === active);
  const nextIndex = currentIndex === -1
    ? direction === 1 ? 0 : targets.length - 1
    : Math.min(Math.max(currentIndex + direction, 0), targets.length - 1);
  targets[nextIndex]?.focus();
}

function triggerSnapshotDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseTagInput(raw: string | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function setToast(message: string) {
  store.setState((state) => ({ ...state, toast: message }));
}

function clearSearchCommitTimer() {
  if (!searchCommitTimer) return;
  clearTimeout(searchCommitTimer);
  searchCommitTimer = null;
}

function commitSearchQuery(value: string) {
  clearSearchCommitTimer();
  liveSearchQuery = value;
  const previousQuery = store.getState().searchQuery;
  actions.setSearchQuery(value);
  if (previousQuery === value) {
    render();
  }
}

function scheduleSearchQuery(value: string, immediate = false) {
  // 搜索框输入先走本地草稿，避免每敲一个字都触发整页重建。
  liveSearchQuery = value;
  if (immediate) {
    actions.setSearchQuery(value);
    return;
  }

  clearSearchCommitTimer();
  searchCommitTimer = setTimeout(() => {
    searchCommitTimer = null;
    actions.setSearchQuery(liveSearchQuery);
  }, 110);
}

function render() {
  if (!root) return;
  const currentSearchInput = document.querySelector<HTMLInputElement>('[data-role="tab-search"]');
  const isSearchFocused = document.activeElement === currentSearchInput;
  const selectionStart = isSearchFocused ? currentSearchInput?.selectionStart ?? null : null;
  const selectionEnd = isSearchFocused ? currentSearchInput?.selectionEnd ?? null : null;
  const searchDraft = isSearchFocused ? currentSearchInput?.value ?? liveSearchQuery : liveSearchQuery;
  liveSearchQuery = searchDraft;

  document.documentElement.lang = store.getState().settings.language;
  renderNewtab(root, store.getState(), snapshotDialog, {
    liveMode: hasRenderedOnce,
    searchDraft
  });
  hasRenderedOnce = true;

  const nextSearchInput = document.querySelector<HTMLInputElement>('[data-role="tab-search"]');
  if (nextSearchInput && nextSearchInput.value !== liveSearchQuery) {
    nextSearchInput.value = liveSearchQuery;
  }

  if (isSearchFocused && nextSearchInput) {
    nextSearchInput.focus({ preventScroll: true });
    if (selectionStart != null && selectionEnd != null) {
      nextSearchInput.setSelectionRange(selectionStart, selectionEnd);
    }
  }
}

function closeSnapshotDialog() {
  snapshotDialog = {
    mode: 'closed',
    name: '',
    note: '',
    tags: '',
    error: '',
    submitting: false
  };
  render();
}

function openExportSnapshotDialog() {
  snapshotDialog = {
    mode: 'export',
    name: formatSnapshotDraftName(store.getState().settings.language, new Date()),
    note: '',
    tags: '',
    error: '',
    submitting: false
  };
  render();
}

function openEditSnapshotDialog(snapshotId: string) {
  const snapshot = store.getState().snapshots.find((item) => item.id === snapshotId);
  if (!snapshot) return;

  snapshotDialog = {
    mode: 'edit',
    snapshotId,
    name: snapshot.name,
    note: snapshot.note,
    tags: snapshot.tags.join(', '),
    error: '',
    submitting: false
  };
  render();
}

function openDeleteSnapshotDialog(snapshotId: string) {
  const snapshot = store.getState().snapshots.find((item) => item.id === snapshotId);
  if (!snapshot) return;

  snapshotDialog = {
    mode: 'delete',
    snapshotId,
    name: snapshot.name,
    note: snapshot.note,
    tags: snapshot.tags.join(', '),
    error: '',
    submitting: false
  };
  render();
}

function updateSnapshotDialogDraft(field: 'name' | 'note' | 'tags', value: string) {
  if (snapshotDialog.mode === 'closed') return;
  snapshotDialog = {
    ...snapshotDialog,
    [field]: value,
    error: ''
  };
}

function syncSnapshotDialogDraft(form: HTMLFormElement) {
  if (snapshotDialog.mode === 'closed') return;
  const data = new FormData(form);
  const name = data.get('name');
  const note = data.get('note');
  const tags = data.get('tags');
  snapshotDialog = {
    ...snapshotDialog,
    name: typeof name === 'string' ? name : snapshotDialog.name,
    note: typeof note === 'string' ? note : snapshotDialog.note,
    tags: typeof tags === 'string' ? tags : snapshotDialog.tags,
    error: ''
  };
}

async function runUiAction(task: () => Promise<void>, failureMessage: string) {
  try {
    await task();
  } catch (error) {
    console.error(error);
    setToast(toErrorMessage(error, failureMessage));
  }
}

document.addEventListener('input', (event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
  if (!target) return;

  if (target.matches('[data-role="tab-search"]')) {
    scheduleSearchQuery(target.value);
    return;
  }

  if (target.matches('[data-role="snapshot-dialog-name"]')) {
    updateSnapshotDialogDraft('name', target.value);
    return;
  }

  if (target.matches('[data-role="snapshot-dialog-tags"]')) {
    updateSnapshotDialogDraft('tags', target.value);
    return;
  }

  if (target.matches('[data-role="snapshot-dialog-note"]')) {
    updateSnapshotDialogDraft('note', target.value);
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches('[data-role="snapshot-dialog-form"]')) return;

  event.preventDefault();
  syncSnapshotDialogDraft(form);
  snapshotDialog = {
    ...snapshotDialog,
    submitting: true,
    error: ''
  };
  render();

  const mode = form.dataset.mode;
  const snapshotId = form.dataset.snapshotId;

  void (async () => {
    try {
      if (mode === 'export') {
        const snapshot = await actions.exportWorkspaceSnapshot({
          name: snapshotDialog.name,
          note: snapshotDialog.note,
          tags: parseTagInput(snapshotDialog.tags)
        });
        triggerSnapshotDownload(
          JSON.stringify(snapshot, null, 2),
          `${snapshot.name}.json`
        );
        closeSnapshotDialog();
        setToast(t('Snapshot exported', '快照已导出'));
        return;
      }

      if (mode === 'edit' && snapshotId) {
        await actions.updateSnapshotMetadata(snapshotId, {
          name: snapshotDialog.name,
          note: snapshotDialog.note,
          tags: parseTagInput(snapshotDialog.tags)
        });
        closeSnapshotDialog();
        return;
      }

      if (mode === 'delete' && snapshotId) {
        await actions.deleteSnapshot(snapshotId);
        closeSnapshotDialog();
        return;
      }

      throw new Error(t('Unknown snapshot dialog action', '未知的快照操作'));
    } catch (error) {
      console.error(error);
      snapshotDialog = {
        ...snapshotDialog,
        submitting: false,
        error: toErrorMessage(error, t('Snapshot action failed', '快照操作失败'))
      };
      render();
      setToast(toErrorMessage(error, t('Snapshot action failed', '快照操作失败')));
    }
  })();
});

document.addEventListener('change', (event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target?.matches('[data-role="snapshot-input"]')) return;

  const file = target.files?.[0];
  target.value = '';
  if (!file) return;

  void runUiAction(async () => {
    const content = await file.text();
    const parsed = JSON.parse(content);
    const snapshot = parseWorkspaceSnapshot(parsed);
    if (!snapshot) {
      throw new Error(t('Invalid snapshot format', '快照文件格式不正确'));
    }

    await actions.importWorkspaceSnapshot(snapshot);
  }, t('Snapshot import failed', '导入快照失败'));
});

document.addEventListener('dragstart', (event) => {
  const target = event.target as HTMLElement | null;
  const dragEl = target?.closest<HTMLElement>('[data-drag-group-id]');
  if (!dragEl) return;

  draggingGroupId = String(dragEl.dataset.dragGroupId);
  event.dataTransfer?.setData('text/plain', draggingGroupId);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
});

document.addEventListener('dragover', (event) => {
  const target = event.target as HTMLElement | null;
  const dropEl = target?.closest<HTMLElement>('[data-drop-group-id]');
  if (!dropEl || !draggingGroupId) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
});

document.addEventListener('drop', (event) => {
  const target = event.target as HTMLElement | null;
  const dropEl = target?.closest<HTMLElement>('[data-drop-group-id]');
  if (!dropEl) return;

  const targetGroupId = String(dropEl.dataset.dropGroupId);
  const sourceGroupId = draggingGroupId || event.dataTransfer?.getData('text/plain');
  draggingGroupId = null;
  if (!sourceGroupId || sourceGroupId === targetGroupId) return;

  event.preventDefault();
  void runUiAction(
    () => actions.reorderGroups(sourceGroupId, targetGroupId),
    t('Unable to reorder stacks', '无法调整堆栈顺序')
  );
});

document.addEventListener('dragend', () => {
  draggingGroupId = null;
});

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  const actionEl = target?.closest<HTMLElement>('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  if (action === 'focus') {
    void runUiAction(
      () => actions.focus(Number(actionEl.dataset.tabId), Number(actionEl.dataset.windowId)),
      t('Unable to focus tab', '无法定位到该标签页')
    );
    return;
  }

  if (action === 'close-one') {
    void runUiAction(() => actions.closeOne(Number(actionEl.dataset.tabId)), t('Unable to close tab', '无法关闭该标签页'));
    return;
  }

  if (action === 'defer') {
    void runUiAction(() => actions.defer(Number(actionEl.dataset.tabId)), t('Unable to move tab to Later', '无法移到稍后处理'));
    return;
  }

  if (action === 'toggle-tab-selection') {
    actions.toggleTabSelection(Number(actionEl.dataset.tabId));
    return;
  }

  if (action === 'set-tab-selection') {
    actions.setTabSelection(
      parseTabIds(actionEl.dataset.tabIds) ?? [],
      actionEl.dataset.selected === 'true'
    );
    return;
  }

  if (action === 'close-group') {
    void runUiAction(
      () => actions.closeGroup(
        String(actionEl.dataset.groupId),
        parseTabIds(actionEl.dataset.tabIds),
        actionEl.dataset.groupLabel
      ),
      t('Unable to close stack', '无法关闭该堆栈')
    );
    return;
  }

  if (action === 'close-all') {
    void runUiAction(() => actions.closeAll(), t('Unable to close open tabs', '无法关闭全部打开标签页'));
    return;
  }

  if (action === 'close-selected') {
    void runUiAction(
      () => actions.closeSelected(parseTabIds(actionEl.dataset.tabIds)),
      t('Unable to close selected tabs', '无法关闭已选标签页')
    );
    return;
  }

  if (action === 'defer-selected') {
    void runUiAction(
      () => actions.deferSelected(parseTabIds(actionEl.dataset.tabIds)),
      t('Unable to move selected tabs to Later', '无法把已选标签页移到稍后处理')
    );
    return;
  }

  if (action === 'move-selected-to-new-window') {
    void runUiAction(
      () => actions.moveSelectedToNewWindow(parseTabIds(actionEl.dataset.tabIds)),
      t('Unable to move selected tabs', '无法把已选标签页移到新窗口')
    );
    return;
  }

  if (action === 'close-duplicates') {
    void runUiAction(
      () => actions.closeDuplicates(
        String(actionEl.dataset.groupId),
        parseTabIds(actionEl.dataset.tabIds)
      ),
      t('Unable to close duplicates', '无法关闭重复标签')
    );
    return;
  }

  if (action === 'complete-deferred') {
    void runUiAction(() => actions.completeDeferred(String(actionEl.dataset.deferredId)), t('Unable to update Later Dock', '无法更新稍后处理列表'));
    return;
  }

  if (action === 'dismiss-deferred') {
    void runUiAction(() => actions.dismissDeferred(String(actionEl.dataset.deferredId)), t('Unable to dismiss item', '无法移除该条目'));
    return;
  }

  if (action === 'restore-recent') {
    void runUiAction(() => actions.restoreRecent(String(actionEl.dataset.recentId)), t('Unable to restore tabs', '无法恢复这些标签页'));
    return;
  }

  if (action === 'dismiss-recent') {
    void runUiAction(() => actions.dismissRecent(String(actionEl.dataset.recentId)), t('Unable to dismiss recent item', '无法移除最近关闭记录'));
    return;
  }

  if (action === 'clear-search') {
    commitSearchQuery('');
    focusSearchInput();
    return;
  }

  if (action === 'set-sort-mode') {
    const mode = actionEl.dataset.sortMode;
    if (mode === 'smart' || mode === 'recent') {
      actions.setSortMode(mode);
    }
    return;
  }

  if (action === 'set-duplicates-only') {
    actions.setDuplicatesOnly(actionEl.dataset.enabled === 'true');
    return;
  }

  if (action === 'set-layout-mode') {
    const mode = actionEl.dataset.layoutMode;
    if (mode === 'merged' || mode === 'windows') {
      actions.setLayoutMode(mode);
    }
    return;
  }

  if (action === 'toggle-pinned-group') {
    void runUiAction(() => actions.togglePinnedGroup(String(actionEl.dataset.groupId)), t('Unable to pin stack', '无法置顶该堆栈'));
    return;
  }

  if (action === 'clear-selection') {
    actions.clearSelection();
    return;
  }

  if (action === 'open-export-snapshot') {
    openExportSnapshotDialog();
    return;
  }

  if (action === 'import-snapshot') {
    document.querySelector<HTMLInputElement>('[data-role="snapshot-input"]')?.click();
    return;
  }

  if (action === 'restore-snapshot') {
    void runUiAction(() => actions.restoreSnapshot(String(actionEl.dataset.snapshotId)), t('Unable to restore snapshot', '无法恢复该快照'));
    return;
  }

  if (action === 'open-edit-snapshot') {
    openEditSnapshotDialog(String(actionEl.dataset.snapshotId));
    return;
  }

  if (action === 'open-delete-snapshot') {
    openDeleteSnapshotDialog(String(actionEl.dataset.snapshotId));
    return;
  }

  if (action === 'close-snapshot-dialog') {
    closeSnapshotDialog();
    return;
  }

  if (action === 'set-snapshot-tag-filter') {
    actions.setSnapshotTagFilter(String(actionEl.dataset.snapshotTag ?? ''));
  }
});

document.addEventListener('keydown', (event) => {
  if (snapshotDialog.mode !== 'closed') {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSnapshotDialog();
    }
    return;
  }

  const target = event.target as HTMLElement | null;
  const isEditable = Boolean(target?.closest('input, textarea, [contenteditable="true"]'));

  if (event.key === '/' && !isEditable) {
    event.preventDefault();
    focusSearchInput();
    return;
  }

  if (event.key === 'Escape') {
    const search = document.querySelector<HTMLInputElement>('[data-role="tab-search"]');
    if (search && search.value) {
      commitSearchQuery('');
      search.focus();
      return;
    }
    if (isEditable) {
      (target as HTMLElement).blur?.();
    }
    return;
  }

  if (isEditable) return;

  if (event.key === 'j' || event.key === 'ArrowDown') {
    event.preventDefault();
    moveFocus(1);
    return;
  }

  if (event.key === 'k' || event.key === 'ArrowUp') {
    event.preventDefault();
    moveFocus(-1);
    return;
  }

  if (event.key.toLowerCase() === 'x') {
    const active = document.activeElement as HTMLElement | null;
    const tabId = active?.dataset.tabId;
    if (!tabId) return;
    event.preventDefault();
    actions.toggleTabSelection(Number(tabId));
  }
});

store.subscribe((state) => {
  if (!searchCommitTimer) {
    liveSearchQuery = state.searchQuery;
  }
  render();
});
store.subscribe((state) => {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  if (state.toast) {
    toastTimer = setTimeout(() => actions.clearToast(), 1800);
  }
});

render();
void runUiAction(() => actions.initialize(), t('Unable to load current tabs', '无法加载当前标签页'));
