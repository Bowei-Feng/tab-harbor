import './style.css';
import { createAppActions } from '@/lib/app/actions';
import { parseWorkspaceSnapshot } from '@/lib/domain/workspace-snapshot';
import { initialAppState } from '@/lib/app/state';
import { createStore } from '@/lib/app/store';
import { renderNewtab } from '@/lib/ui/newtab-render';

const root = document.getElementById('app');
const store = createStore(initialAppState);
const actions = createAppActions(store);
let draggingGroupId: string | null = null;

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

function render() {
  if (!root) return;
  renderNewtab(root, store.getState());
}

document.addEventListener('input', (event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target?.matches('[data-role="tab-search"]')) return;
  actions.setSearchQuery(target.value);
});

document.addEventListener('change', async (event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target?.matches('[data-role="snapshot-input"]')) return;

  const file = target.files?.[0];
  target.value = '';
  if (!file) return;

  try {
    const content = await file.text();
    const parsed = JSON.parse(content);
    const snapshot = parseWorkspaceSnapshot(parsed);
    if (!snapshot) {
      throw new Error('Invalid snapshot format');
    }

    await actions.importWorkspaceSnapshot(snapshot);
  } catch {
    store.setState((state) => ({ ...state, toast: 'Snapshot import failed' }));
  }
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

document.addEventListener('drop', async (event) => {
  const target = event.target as HTMLElement | null;
  const dropEl = target?.closest<HTMLElement>('[data-drop-group-id]');
  if (!dropEl) return;

  const targetGroupId = String(dropEl.dataset.dropGroupId);
  const sourceGroupId = draggingGroupId || event.dataTransfer?.getData('text/plain');
  draggingGroupId = null;
  if (!sourceGroupId || sourceGroupId === targetGroupId) return;

  event.preventDefault();
  await actions.reorderGroups(sourceGroupId, targetGroupId);
});

document.addEventListener('dragend', () => {
  draggingGroupId = null;
});

document.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement | null;
  const actionEl = target?.closest<HTMLElement>('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  if (action === 'focus') {
    await actions.focus(Number(actionEl.dataset.tabId), Number(actionEl.dataset.windowId));
    return;
  }

  if (action === 'close-one') {
    await actions.closeOne(Number(actionEl.dataset.tabId));
    return;
  }

  if (action === 'defer') {
    await actions.defer(Number(actionEl.dataset.tabId));
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
    await actions.closeGroup(
      String(actionEl.dataset.groupId),
      parseTabIds(actionEl.dataset.tabIds),
      actionEl.dataset.groupLabel
    );
    return;
  }

  if (action === 'close-all') {
    await actions.closeAll();
    return;
  }

  if (action === 'close-selected') {
    await actions.closeSelected(parseTabIds(actionEl.dataset.tabIds));
    return;
  }

  if (action === 'defer-selected') {
    await actions.deferSelected(parseTabIds(actionEl.dataset.tabIds));
    return;
  }

  if (action === 'move-selected-to-new-window') {
    await actions.moveSelectedToNewWindow(parseTabIds(actionEl.dataset.tabIds));
    return;
  }

  if (action === 'close-duplicates') {
    await actions.closeDuplicates(
      String(actionEl.dataset.groupId),
      parseTabIds(actionEl.dataset.tabIds)
    );
    return;
  }

  if (action === 'complete-deferred') {
    await actions.completeDeferred(String(actionEl.dataset.deferredId));
    return;
  }

  if (action === 'dismiss-deferred') {
    await actions.dismissDeferred(String(actionEl.dataset.deferredId));
    return;
  }

  if (action === 'restore-recent') {
    await actions.restoreRecent(String(actionEl.dataset.recentId));
    return;
  }

  if (action === 'dismiss-recent') {
    await actions.dismissRecent(String(actionEl.dataset.recentId));
    return;
  }

  if (action === 'clear-search') {
    actions.setSearchQuery('');
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
    await actions.togglePinnedGroup(String(actionEl.dataset.groupId));
    return;
  }

  if (action === 'clear-selection') {
    actions.clearSelection();
    return;
  }

  if (action === 'export-snapshot') {
    const name = window.prompt('Snapshot name', `Workspace ${new Date().toLocaleString()}`) ?? '';
    const tags = parseTagInput(window.prompt('Project tags (comma separated)', ''));
    const note = window.prompt('Snapshot note', '') ?? '';
    const snapshot = await actions.exportWorkspaceSnapshot({ name, tags, note });
    triggerSnapshotDownload(
      JSON.stringify(snapshot, null, 2),
      `${snapshot.name}.json`
    );
    store.setState((state) => ({ ...state, toast: 'Snapshot exported' }));
    return;
  }

  if (action === 'import-snapshot') {
    document.querySelector<HTMLInputElement>('[data-role="snapshot-input"]')?.click();
    return;
  }

  if (action === 'restore-snapshot') {
    await actions.restoreSnapshot(String(actionEl.dataset.snapshotId));
    return;
  }

  if (action === 'edit-snapshot') {
    const snapshotId = String(actionEl.dataset.snapshotId);
    const snapshots = store.getState().snapshots;
    const snapshot = snapshots.find((item) => item.id === snapshotId);
    if (!snapshot) return;

    const name = window.prompt('Snapshot name', snapshot.name);
    if (name === null) return;
    const tags = parseTagInput(window.prompt('Project tags (comma separated)', snapshot.tags.join(', ')));
    const note = window.prompt('Snapshot note', snapshot.note);
    if (note === null) return;

    await actions.updateSnapshotMetadata(snapshotId, { name, tags, note });
    return;
  }

  if (action === 'delete-snapshot') {
    const snapshotId = String(actionEl.dataset.snapshotId);
    const snapshot = store.getState().snapshots.find((item) => item.id === snapshotId);
    if (snapshot && !window.confirm(`Delete snapshot "${snapshot.name}"?`)) return;
    await actions.deleteSnapshot(String(actionEl.dataset.snapshotId));
    return;
  }

  if (action === 'set-snapshot-tag-filter') {
    actions.setSnapshotTagFilter(String(actionEl.dataset.snapshotTag ?? ''));
  }
});

document.addEventListener('keydown', (event) => {
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
      actions.setSearchQuery('');
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

store.subscribe(render);
store.subscribe((state) => {
  if (state.toast) {
    setTimeout(() => actions.clearToast(), 1800);
  }
});
render();
void actions.initialize();
