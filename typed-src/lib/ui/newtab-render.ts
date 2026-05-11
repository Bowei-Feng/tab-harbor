import type { AppState } from '@/lib/app/state';
import {
  buildVisiblePresentation,
  buildWorkspaceSummary,
  type DisplayGroup,
  type DisplaySection,
  type WorkspaceSummary
} from '@/lib/ui/newtab-presenter';
import { getNewtabCopy, type NewtabCopy } from '@/lib/ui/newtab-copy';
import { renderBrandLockup } from '@/lib/ui/shared/brand';
import { escapeHtml } from '@/lib/ui/shared/html';
import { formatRelativeTime, getSnapshotSourceLabel } from '@/lib/i18n';

export interface SnapshotDialogViewModel {
  mode: 'closed' | 'export' | 'edit' | 'delete';
  snapshotId?: string;
  name: string;
  note: string;
  tags: string;
  error: string;
  submitting: boolean;
}

export interface NewtabRenderOptions {
  liveMode?: boolean;
  searchDraft?: string;
}

const STACK_PREVIEW_LIMIT = 6;

function renderHighlightedText(value: string, query: string): string {
  if (!query) return escapeHtml(value);

  const lowerValue = value.toLowerCase();
  const start = lowerValue.indexOf(query);
  if (start === -1) return escapeHtml(value);

  const end = start + query.length;
  return [
    escapeHtml(value.slice(0, start)),
    `<mark class="tab-highlight">${escapeHtml(value.slice(start, end))}</mark>`,
    escapeHtml(value.slice(end))
  ].join('');
}


function renderBrand(): string {
  return renderBrandLockup();
}

function renderPanelIcon(symbol: string, tone: 'default' | 'primary' | 'success' | 'warning' = 'default'): string {
  return `<span class="panel-icon ${tone !== 'default' ? `panel-icon-${tone}` : ''}" aria-hidden="true">${escapeHtml(symbol)}</span>`;
}

function renderStatusChip(label: string, tone: 'default' | 'primary' | 'success' | 'warning' = 'default'): string {
  return `<span class="status-chip ${tone !== 'default' ? `status-chip-${tone}` : ''}">${escapeHtml(label)}</span>`;
}

function renderToolbarSignals(copy: NewtabCopy, state: AppState): string {
  const searchQuery = state.searchQuery.trim();
  const chips = searchQuery ? [renderStatusChip(copy.searchChip(searchQuery), 'primary')] : [];

  if (state.duplicatesOnly) chips.push(renderStatusChip(copy.duplicatesOnly, 'warning'));
  if (state.layoutMode === 'windows') chips.push(renderStatusChip(copy.byWindowChip));
  if (state.sortMode === 'recent') chips.push(renderStatusChip(copy.recentOrderChip));
  if (state.selectedTabIds.length) chips.push(renderStatusChip(copy.selectedChip(state.selectedTabIds.length), 'primary'));

  return chips.length ? `<div class="toolbar-signal-row">${chips.join('')}</div>` : '';
}

function renderSearchToolbar(
  copy: NewtabCopy,
  state: AppState,
  summary: WorkspaceSummary,
  searchValue: string,
  visibleTabIds: number[]
): string {
  const hasQuery = Boolean(searchValue.trim());
  const visibleSelection = state.selectedTabIds.filter((tabId) => visibleTabIds.includes(tabId));
  const hasSelection = visibleSelection.length > 0;
  const allVisibleSelected = visibleTabIds.length > 0 && visibleSelection.length === visibleTabIds.length;
  const hiddenSelectionCount = Math.max(0, state.selectedTabIds.length - visibleSelection.length);

  return `
    <div class="toolbar-card">
      <div class="toolbar-head">
        <div class="toolbar-brand-block">
          ${renderBrand()}
        </div>
        <div class="toolbar-selection-panel ${hasSelection ? 'active' : ''}">
          <div class="toolbar-selection-inline">
            <div class="toolbar-selection-main">
              ${renderToolbarOpenPill(copy, summary.totalTabs)}
              ${renderToolbarSelectionPill(copy, visibleSelection.length, hasSelection)}
              <button
                class="toggle-chip toolbar-inline-toggle ${state.duplicatesOnly ? 'active' : ''}"
                type="button"
                data-action="set-duplicates-only"
                data-enabled="${state.duplicatesOnly ? 'false' : 'true'}"
                aria-pressed="${state.duplicatesOnly ? 'true' : 'false'}"
              >
                ${escapeHtml(copy.duplicatesOnly)}
              </button>
              ${hiddenSelectionCount ? renderStatusChip(copy.hiddenSelectionChip(hiddenSelectionCount), 'warning') : ''}
            </div>
            <div class="bulk-actions">
              <button
                class="ghost-btn"
                type="button"
                data-action="set-tab-selection"
                data-tab-ids="${escapeHtml(visibleTabIds.join(','))}"
                data-selected="${allVisibleSelected ? 'false' : 'true'}"
                ${visibleTabIds.length ? '' : 'disabled'}
              >
                ${escapeHtml(allVisibleSelected ? copy.unselectVisible : copy.selectVisible)}
              </button>
              <button class="ghost-btn" type="button" data-action="clear-selection" ${hasSelection ? '' : 'disabled'}>
                ${escapeHtml(copy.clear)}
              </button>
              <button class="ghost-btn" type="button" data-action="defer-selected" data-tab-ids="${escapeHtml(visibleSelection.join(','))}" ${hasSelection ? '' : 'disabled'}>
                ${escapeHtml(copy.moveToLater(visibleSelection.length))}
              </button>
              <button class="ghost-btn" type="button" data-action="move-selected-to-new-window" data-tab-ids="${escapeHtml(visibleSelection.join(','))}" ${hasSelection ? '' : 'disabled'}>
                ${escapeHtml(copy.newWindow(visibleSelection.length))}
              </button>
              <button class="primary-btn" type="button" data-action="close-selected" data-tab-ids="${escapeHtml(visibleSelection.join(','))}" ${hasSelection ? '' : 'disabled'}>
                ${escapeHtml(copy.closeSelected(visibleSelection.length))}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="toolbar-row">
        <label class="search-shell" aria-label="${escapeHtml(copy.searchPlaceholder)}">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input
            class="search-input"
            type="search"
            value="${escapeHtml(searchValue)}"
            placeholder="${escapeHtml(copy.searchPlaceholder)}"
            data-role="tab-search"
          />
          ${hasQuery
            ? `<button class="search-clear" type="button" data-action="clear-search" aria-label="${escapeHtml(copy.clearSearch)}">${escapeHtml(copy.clearSearch)}</button>`
            : ''}
        </label>
        <div class="toolbar-toggle-cluster">
          <div class="toggle-group" role="tablist" aria-label="Tab sort mode">
            <button class="toggle-pill ${state.sortMode === 'smart' ? 'active' : ''}" type="button" data-action="set-sort-mode" data-sort-mode="smart">
              ${escapeHtml(copy.smart)}
            </button>
            <button class="toggle-pill ${state.sortMode === 'recent' ? 'active' : ''}" type="button" data-action="set-sort-mode" data-sort-mode="recent">
              ${escapeHtml(copy.recent)}
            </button>
          </div>
          <div class="toggle-group" role="tablist" aria-label="Layout mode">
            <button class="toggle-pill ${state.layoutMode === 'merged' ? 'active' : ''}" type="button" data-action="set-layout-mode" data-layout-mode="merged">
              ${escapeHtml(copy.merged)}
            </button>
            <button class="toggle-pill ${state.layoutMode === 'windows' ? 'active' : ''}" type="button" data-action="set-layout-mode" data-layout-mode="windows">
              ${escapeHtml(copy.byWindow)}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSelectionPill(copy: NewtabCopy, selected: boolean, count?: number): string {
  const base = selected ? copy.selected : copy.select;
  return `
    <span class="selection-pill ${selected ? 'active' : ''}">
      ${escapeHtml(base)}${typeof count === 'number' ? ` · ${count}` : ''}
    </span>
  `;
}

function renderToolbarSelectionPill(copy: NewtabCopy, count: number, active: boolean): string {
  return `
    <span class="selection-pill toolbar-selection-pill ${active ? 'active' : ''}">
      ${escapeHtml(copy.select)} · ${count}
    </span>
  `;
}

function renderToolbarOpenPill(copy: NewtabCopy, count: number): string {
  return `
    <span class="selection-pill toolbar-selection-pill active">
      ${escapeHtml(copy.heroOpenNow(count))}
    </span>
  `;
}

function renderTooltipPayload(urls: string[]): string {
  return escapeHtml(urls.join(' • '));
}

function renderTabRow(copy: NewtabCopy, tab: DisplayGroup['tabs'][number], query: string, selectedTabIds: Set<number>): string {
  const title = tab.cleanTitle || tab.title || tab.url;
  const isSelected = selectedTabIds.has(tab.id);

  return `
    <li class="tab-row ${isSelected ? 'selected' : ''}">
      <button
        class="row-select"
        type="button"
        data-action="toggle-tab-selection"
        data-tab-id="${tab.id}"
        aria-pressed="${isSelected ? 'true' : 'false'}"
        aria-label="${escapeHtml(isSelected ? copy.unselectTab : copy.selectTab)}"
      >
        ${renderSelectionPill(copy, isSelected)}
      </button>
      <button
        class="tab-title"
        data-action="focus"
        data-tab-id="${tab.id}"
        data-window-id="${tab.windowId}"
        data-nav-target="tab"
        data-url-tooltip="${escapeHtml(tab.url)}"
      >
        <span class="tab-copy">
          <span class="tab-title-row">
            <span class="tab-title-text">${renderHighlightedText(title, query)}</span>
            ${tab.active ? `<span class="tab-badge">${escapeHtml(copy.activeTab)}</span>` : ''}
          </span>
        </span>
      </button>
      <div class="row-actions">
        <button class="ghost-btn" data-action="defer" data-tab-id="${tab.id}">${escapeHtml(copy.later)}</button>
        <button class="ghost-btn danger" data-action="close-one" data-tab-id="${tab.id}">${escapeHtml(copy.close)}</button>
      </div>
    </li>
  `;
}

function renderGroup(copy: NewtabCopy, group: DisplayGroup, query: string, selectedTabIds: Set<number>, orderIndex: number): string {
  const tabIds = group.tabs.map((tab) => tab.id);
  const tabIdsValue = tabIds.join(',');
  const groupLabel = group.windowId ? `${group.label} · ${copy.windowBadge(group.windowId)}` : group.label;
  const selectedCount = tabIds.filter((tabId) => selectedTabIds.has(tabId)).length;
  const allSelected = tabIds.length > 0 && selectedCount === tabIds.length;
  const selectionClass = allSelected ? 'is-all-selected' : selectedCount > 0 ? 'is-partial-selected' : '';

  return `
    <section
      class="stack-card ${group.pinned ? 'is-pinned' : ''} ${group.duplicateCount ? 'has-duplicates' : ''} ${selectionClass}"
      data-group-card="${group.id}"
      data-drop-group-id="${group.baseGroupId}"
      style="--enter-index:${orderIndex};"
    >
      <div class="stack-topline">
        <div class="stack-topline-left">
          <button
            class="pin-toggle ${group.pinned ? 'active' : ''}"
            type="button"
            data-action="toggle-pinned-group"
            data-group-id="${group.baseGroupId}"
            aria-pressed="${group.pinned ? 'true' : 'false'}"
            aria-label="${escapeHtml(copy.pinAria(group.pinned))}"
            title="${escapeHtml(copy.pinAria(group.pinned))}"
          >
            ${escapeHtml(group.pinned ? copy.pinned : copy.pin)}
          </button>
          <button
            class="drag-handle"
            type="button"
            draggable="true"
            data-drag-group-id="${group.baseGroupId}"
            aria-label="${escapeHtml(copy.reorder)}"
            title="${escapeHtml(copy.reorderHint)}"
          >
            ${escapeHtml(copy.reorder)}
          </button>
          <button
            class="group-select"
            type="button"
            data-action="set-tab-selection"
            data-tab-ids="${escapeHtml(tabIdsValue)}"
            data-selected="${allSelected ? 'false' : 'true'}"
            aria-pressed="${allSelected ? 'true' : 'false'}"
          >
            ${renderSelectionPill(copy, allSelected, selectedCount)}
          </button>
        </div>
        <div class="stack-topline-actions">
          ${group.duplicateCount ? `
            <button class="ghost-btn stack-close-btn" data-action="close-duplicates" data-group-id="${group.id}" data-tab-ids="${escapeHtml(tabIdsValue)}">
              ${escapeHtml(copy.closeDuplicates(group.duplicateCount))}
            </button>
          ` : ''}
          <button class="ghost-btn danger stack-close-btn" data-action="close-group" data-group-id="${group.id}" data-group-label="${escapeHtml(groupLabel)}" data-tab-ids="${escapeHtml(tabIdsValue)}">
            ${escapeHtml(copy.closeStack)}
          </button>
        </div>
      </div>
      <div class="stack-head">
        <div class="stack-copy">
          <div class="stack-title-row">
            <h3>${renderHighlightedText(group.label, query)}</h3>
            <button
              class="ghost-btn stack-rename-btn"
              type="button"
              data-action="rename-group"
              data-group-id="${group.baseGroupId}"
              data-group-label="${escapeHtml(group.label)}"
            >
              ${escapeHtml(copy.rename)}
            </button>
          </div>
          <div class="stack-meta-row">
            <span class="stack-meta-pill">${escapeHtml(copy.stackTabs(group.tabs.length))}</span>
            ${group.duplicateCount ? `
              <span class="stack-meta-pill stack-meta-pill-warning">
                ${escapeHtml(copy.duplicatesBadge(group.duplicateCount))}
              </span>
            ` : ''}
            ${group.windowId ? `<span class="stack-meta-pill">${escapeHtml(copy.windowBadge(group.windowId))}</span>` : ''}
            ${selectedCount ? `<span class="stack-meta-pill stack-meta-pill-primary">${escapeHtml(copy.selectedBadge(selectedCount))}</span>` : ''}
          </div>
        </div>
      </div>
      <ul class="tab-list">
        ${group.tabs.slice(0, STACK_PREVIEW_LIMIT).map((tab) => renderTabRow(copy, tab, query, selectedTabIds)).join('')}
      </ul>
      ${group.tabs.length > STACK_PREVIEW_LIMIT ? `<p class="overflow-note">${escapeHtml(copy.stackOverflow(group.tabs.length - STACK_PREVIEW_LIMIT))}</p>` : ''}
    </section>
  `;
}

function renderSections(
  copy: NewtabCopy,
  sections: DisplaySection[],
  query: string,
  layoutMode: AppState['layoutMode'],
  selectedTabIds: Set<number>
): string {
  if (layoutMode === 'merged') {
    return `<div class="stack-grid">${sections[0]?.groups.map((group, index) => renderGroup(copy, group, query, selectedTabIds, index)).join('') ?? ''}</div>`;
  }

  let groupIndex = 0;

  return sections.map((section) => `
    <section class="window-section">
      <div class="window-head">
        <div>
          <p class="section-kicker">${escapeHtml(copy.windowView)}</p>
          <h3>${escapeHtml(copy.windowTitle(section.title.replace(/^Window\s+/i, '')))}</h3>
        </div>
        <span>${escapeHtml(copy.windowTabCount(section.groups.reduce((sum, group) => sum + group.tabs.length, 0)))}</span>
      </div>
      <div class="stack-grid">
        ${section.groups.map((group) => renderGroup(copy, group, query, selectedTabIds, groupIndex++)).join('')}
      </div>
    </section>
  `).join('');
}

function renderSidebar(copy: NewtabCopy, state: AppState, summary: WorkspaceSummary): string {
  const locale = state.settings.language;
  const allTags = [...new Set(state.snapshots.flatMap((snapshot) => snapshot.tags))].sort((a, b) => a.localeCompare(b));
  const visibleSnapshots = state.snapshotTagFilter
    ? state.snapshots.filter((snapshot) => snapshot.tags.includes(state.snapshotTagFilter))
    : state.snapshots;

  return `
    <aside class="sidebar">
      <div class="sidebar-card system-card">
        <div class="sidebar-head">
          <div class="sidebar-headline">
            ${renderPanelIcon('⌘', 'primary')}
            <h2>${escapeHtml(copy.systemTitle)}</h2>
          </div>
        </div>
        <p class="empty-copy">${escapeHtml(copy.systemIntro)}</p>
        <div class="system-shortcuts">
          <button class="ghost-btn" data-action="open-settings">${escapeHtml(copy.openSettings)}</button>
          <button class="ghost-btn" data-action="refresh-board">${escapeHtml(copy.refreshBoard)}</button>
          <button class="ghost-btn" data-action="reset-view">${escapeHtml(copy.resetView)}</button>
        </div>
      </div>
      <div class="sidebar-card">
        <div class="sidebar-head">
          <div class="sidebar-headline">
            ${renderPanelIcon('◔', 'primary')}
            <h2>${escapeHtml(copy.snapshotsTitle)}</h2>
          </div>
          <span>${summary.snapshotCount}</span>
        </div>
        <div class="snapshot-toolbar">
          <button class="ghost-btn" data-action="open-export-snapshot">${escapeHtml(copy.exportSnapshot)}</button>
          <button class="primary-btn" data-action="import-snapshot">${escapeHtml(copy.importSnapshot)}</button>
        </div>
        ${allTags.length ? `
          <div class="tag-filter-row">
            <button class="tag-chip ${state.snapshotTagFilter ? '' : 'active'}" data-action="set-snapshot-tag-filter" data-snapshot-tag="">
              ${escapeHtml(copy.all)}
            </button>
            ${allTags.map((tag) => `
              <button class="tag-chip ${state.snapshotTagFilter === tag ? 'active' : ''}" data-action="set-snapshot-tag-filter" data-snapshot-tag="${escapeHtml(tag)}">
                ${escapeHtml(tag)}
              </button>
            `).join('')}
          </div>
        ` : ''}
        ${visibleSnapshots.length ? `
          <div class="snapshot-list">
            ${visibleSnapshots.map((snapshot) => `
              <div class="snapshot-row">
                <div class="snapshot-copy">
                  <strong>${escapeHtml(snapshot.name)}</strong>
                  <span>${escapeHtml(getSnapshotSourceLabel(locale, snapshot.source))} · ${escapeHtml(formatRelativeTime(locale, snapshot.exportedAt))}</span>
                  ${snapshot.note ? `<small>${escapeHtml(snapshot.note)}</small>` : ''}
                  ${snapshot.tags.length ? `
                    <div class="tag-row">
                      ${snapshot.tags.map((tag) => `<span class="tag-chip static">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>
                <div class="snapshot-actions">
                  <button class="ghost-btn" data-action="open-edit-snapshot" data-snapshot-id="${snapshot.id}">${escapeHtml(copy.edit)}</button>
                  <button class="ghost-btn" data-action="restore-snapshot" data-snapshot-id="${snapshot.id}">${escapeHtml(copy.restore)}</button>
                  <button class="ghost-btn danger" data-action="open-delete-snapshot" data-snapshot-id="${snapshot.id}">${escapeHtml(copy.delete)}</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `<p class="empty-copy">${escapeHtml(state.snapshotTagFilter ? copy.noTaggedSnapshots : copy.noSnapshots)}</p>`}
      </div>
      <div class="sidebar-card">
        <div class="sidebar-head">
          <div class="sidebar-headline">
            ${renderPanelIcon('⋯', 'warning')}
            <h2>${escapeHtml(copy.laterDock)}</h2>
          </div>
          <span>${state.deferred.length}</span>
        </div>
        ${state.deferred.length ? state.deferred.map((item) => `
          <div class="deferred-row">
            <div class="deferred-copy">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(formatRelativeTime(locale, item.createdAt))}</span>
            </div>
            <div class="row-actions">
              <button class="ghost-btn" data-action="complete-deferred" data-deferred-id="${item.id}">${escapeHtml(copy.done)}</button>
              <button class="ghost-btn danger" data-action="dismiss-deferred" data-deferred-id="${item.id}">${escapeHtml(copy.dismiss)}</button>
            </div>
          </div>
        `).join('') : `<p class="empty-copy">${escapeHtml(copy.laterEmpty)}</p>`}
      </div>
      <div class="sidebar-card">
        <div class="sidebar-head">
          <div class="sidebar-headline">
            ${renderPanelIcon('↺', 'success')}
            <h2>${escapeHtml(copy.recentClosures)}</h2>
          </div>
          <span>${state.recentClosed.length}</span>
        </div>
        ${state.recentClosed.length ? state.recentClosed.map((item) => `
          <div class="deferred-row">
            <div class="deferred-copy" data-url-tooltip="${renderTooltipPayload(item.tabs.map((tab) => tab.url))}">
              <strong>${escapeHtml(item.label)}</strong>
            </div>
            <div class="row-actions">
              <button class="ghost-btn" data-action="restore-recent" data-recent-id="${item.id}">${escapeHtml(copy.restore)}</button>
              <button class="ghost-btn danger" data-action="dismiss-recent" data-recent-id="${item.id}">${escapeHtml(copy.dismiss)}</button>
            </div>
          </div>
        `).join('') : `<p class="empty-copy">${escapeHtml(copy.recentEmpty)}</p>`}
      </div>
      <div class="sidebar-card">
        <div class="sidebar-head">
          <div class="sidebar-headline">
            ${renderPanelIcon('✓')}
            <h2>${escapeHtml(copy.archive)}</h2>
          </div>
          <span>${state.archive.length}</span>
        </div>
        ${state.archive.length ? state.archive.slice(0, 8).map((item) => `
          <a class="archive-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer" data-url-tooltip="${escapeHtml(item.url)}">
            <span>${escapeHtml(item.title)}</span>
          </a>
        `).join('') : `<p class="empty-copy">${escapeHtml(copy.archiveEmpty)}</p>`}
      </div>
    </aside>
  `;
}

function renderSnapshotDialog(copy: NewtabCopy, dialog: SnapshotDialogViewModel): string {
  if (dialog.mode === 'closed') return '';

  if (dialog.mode === 'delete') {
    return `
      <div class="modal-scrim">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="snapshot-dialog-title">
          <div class="modal-head">
            <div>
              <p class="eyebrow">${escapeHtml(copy.snapshotEyebrow)}</p>
              <h2 id="snapshot-dialog-title">${escapeHtml(copy.deleteSnapshot)}</h2>
            </div>
            <button class="ghost-btn" type="button" data-action="close-snapshot-dialog">${escapeHtml(copy.cancel)}</button>
          </div>
          <p class="modal-copy">${escapeHtml(copy.deleteConfirm(dialog.name))}</p>
          ${dialog.error ? `<p class="form-error">${escapeHtml(dialog.error)}</p>` : ''}
          <form class="modal-form" data-role="snapshot-dialog-form" data-mode="delete" data-snapshot-id="${escapeHtml(dialog.snapshotId ?? '')}">
            <div class="modal-actions">
              <button class="ghost-btn" type="button" data-action="close-snapshot-dialog">${escapeHtml(copy.keepIt)}</button>
              <button class="primary-btn danger-btn" type="submit" ${dialog.submitting ? 'disabled' : ''}>
                ${escapeHtml(dialog.submitting ? copy.deleting : copy.deleteSnapshot)}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  const title = dialog.mode === 'edit' ? copy.editSnapshotTitle : copy.exportSnapshotTitle;
  const submitLabel = dialog.mode === 'edit'
    ? (dialog.submitting ? copy.saving : copy.saveSnapshot)
    : (dialog.submitting ? copy.exporting : copy.exportSnapshot);

  return `
    <div class="modal-scrim">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="snapshot-dialog-title">
        <div class="modal-head">
          <div>
            <p class="eyebrow">${escapeHtml(copy.snapshotEyebrow)}</p>
            <h2 id="snapshot-dialog-title">${escapeHtml(title)}</h2>
          </div>
          <button class="ghost-btn" type="button" data-action="close-snapshot-dialog">${escapeHtml(copy.cancel)}</button>
        </div>
        <p class="modal-copy">${escapeHtml(copy.modalCopy)}</p>
        ${dialog.error ? `<p class="form-error">${escapeHtml(dialog.error)}</p>` : ''}
        <form class="modal-form" data-role="snapshot-dialog-form" data-mode="${dialog.mode}" data-snapshot-id="${escapeHtml(dialog.snapshotId ?? '')}">
          <label class="modal-field">
            <span>${escapeHtml(copy.snapshotName)}</span>
            <input class="modal-input" type="text" name="name" value="${escapeHtml(dialog.name)}" data-role="snapshot-dialog-name" placeholder="${escapeHtml(copy.snapshotNamePlaceholder)}" />
          </label>
          <label class="modal-field">
            <span>${escapeHtml(copy.snapshotTags)}</span>
            <input class="modal-input" type="text" name="tags" value="${escapeHtml(dialog.tags)}" data-role="snapshot-dialog-tags" placeholder="${escapeHtml(copy.snapshotTagsPlaceholder)}" />
          </label>
          <label class="modal-field">
            <span>${escapeHtml(copy.snapshotNote)}</span>
            <textarea class="modal-textarea" name="note" rows="4" data-role="snapshot-dialog-note" placeholder="${escapeHtml(copy.snapshotNotePlaceholder)}">${escapeHtml(dialog.note)}</textarea>
          </label>
          <div class="modal-actions">
            <button class="ghost-btn" type="button" data-action="close-snapshot-dialog">${escapeHtml(copy.cancel)}</button>
            <button class="primary-btn" type="submit" ${dialog.submitting ? 'disabled' : ''}>${escapeHtml(submitLabel)}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderEmptyState(copy: NewtabCopy, state: AppState, kind: 'no-match' | 'clear'): string {
  if (kind === 'no-match') {
    return `
      <div class="empty-state">
        <div class="empty-state-illustration" aria-hidden="true">
          ${renderPanelIcon('⌕', 'primary')}
        </div>
        <p class="section-kicker">${escapeHtml(copy.noVisibleResult)}</p>
        <h3>${escapeHtml(copy.noMatchTitle)}</h3>
        <p>${escapeHtml(copy.noMatchCopy)}</p>
        <div class="empty-state-actions">
          ${state.searchQuery.trim() ? `<button class="ghost-btn" data-action="clear-search">${escapeHtml(copy.clearSearch)}</button>` : ''}
          ${state.duplicatesOnly ? `<button class="primary-btn" data-action="set-duplicates-only" data-enabled="false">${escapeHtml(copy.showAllTabs)}</button>` : ''}
        </div>
      </div>
    `;
  }

  return `
    <div class="empty-state">
      <div class="empty-state-illustration" aria-hidden="true">
        ${renderPanelIcon('✓', 'success')}
      </div>
      <p class="section-kicker">${escapeHtml(copy.workspaceComplete)}</p>
      <h3>${escapeHtml(copy.workspaceClearTitle)}</h3>
      <p>${escapeHtml(copy.workspaceClearCopy)}</p>
      <div class="empty-state-actions">
        <button class="primary-btn" data-action="import-snapshot">${escapeHtml(copy.importSnapshot)}</button>
        <button class="ghost-btn" data-action="open-export-snapshot">${escapeHtml(copy.exportSnapshot)}</button>
      </div>
    </div>
  `;
}

export function renderNewtab(
  root: HTMLElement,
  state: AppState,
  snapshotDialog: SnapshotDialogViewModel,
  options: NewtabRenderOptions = {}
): void {
  const locale = state.settings.language;
  const copy = getNewtabCopy(locale);
  const visible = buildVisiblePresentation(state);
  const summary = buildWorkspaceSummary(state, visible);
  const hasQuery = Boolean(visible.query);
  const selectedTabIds = new Set(state.selectedTabIds);
  const searchValue = options.searchDraft ?? state.searchQuery;

  // 搜索框显示值允许先走“本地草稿”，这样在输入阶段不会被 store 的节奏强行覆盖。
  root.innerHTML = `
    <div class="shell ${options.liveMode ? 'is-live' : ''}">
      <main class="workspace-layout">
        <section class="board">
          ${renderSearchToolbar(copy, state, summary, searchValue, visible.visibleTabIds)}
          ${visible.groups.length
            ? renderSections(copy, visible.sections, visible.query, state.layoutMode, selectedTabIds)
            : hasQuery || state.duplicatesOnly
              ? renderEmptyState(copy, state, 'no-match')
              : renderEmptyState(copy, state, 'clear')}
        </section>
        ${renderSidebar(copy, state, summary)}
      </main>
      ${renderSnapshotDialog(copy, snapshotDialog)}
      <input class="snapshot-input" type="file" accept="application/json,.json" data-role="snapshot-input" />
      <div class="toast ${state.toast ? 'visible' : ''}">${escapeHtml(state.toast)}</div>
    </div>
  `;
}
