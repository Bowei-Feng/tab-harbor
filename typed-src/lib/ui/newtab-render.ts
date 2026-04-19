import type { AppTab, TabGroup } from '@/lib/domain/models';
import type { AppState } from '@/lib/app/state';

interface DisplayGroup {
  id: string;
  baseGroupId: string;
  kind: TabGroup['kind'];
  label: string;
  tabs: AppTab[];
  duplicateCount: number;
  windowId?: number;
  pinned: boolean;
}

interface DisplaySection {
  id: string;
  title: string;
  groups: DisplayGroup[];
}

interface VisiblePresentation {
  query: string;
  groups: DisplayGroup[];
  sections: DisplaySection[];
  visibleTabCount: number;
  visibleTabIds: number[];
}

export interface SnapshotDialogViewModel {
  mode: 'closed' | 'export' | 'edit' | 'delete';
  snapshotId?: string;
  name: string;
  note: string;
  tags: string;
  error: string;
  submitting: boolean;
}

function timeAgo(dateString: string): string {
  const then = new Date(dateString);
  const diff = Date.now() - then.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

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

function renderBrand(): string {
  return `
    <div class="brand-row">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="96" height="96" rx="28" fill="url(#paint0_linear)"/>
          <path d="M23 59C29.5 53 35 50 40.5 50C46.5 50 50.5 53 56 53C61.5 53 65 49.5 73 43V57C66.5 63 61.5 66 56 66C50.5 66 46 63 40.5 63C35 63 30.5 65.5 23 72V59Z" fill="white" fill-opacity="0.96"/>
          <path d="M32 29H41V53H32V29Z" fill="white" fill-opacity="0.92"/>
          <path d="M55 23H64V47H55V23Z" fill="white" fill-opacity="0.92"/>
          <defs>
            <linearGradient id="paint0_linear" x1="12" y1="8" x2="82" y2="88" gradientUnits="userSpaceOnUse">
              <stop stop-color="#2557D6"/>
              <stop offset="1" stop-color="#18A999"/>
            </linearGradient>
          </defs>
        </svg>
      </span>
      <p class="eyebrow">Tab Harbor</p>
    </div>
  `;
}

function renderHeader(state: AppState): string {
  const now = new Date();
  const greeting = now.getHours() < 12
    ? 'Morning sweep'
    : now.getHours() < 18
      ? 'Afternoon harbor'
      : 'Evening reset';

  return `
    <header class="hero">
      <div>
        ${renderBrand()}
        <h1>${greeting}</h1>
        <p class="hero-copy">The typed track now drives the real tab triage workspace.</p>
      </div>
      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-value">${state.tabs.length}</span>
          <span class="stat-label">Open tabs</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${state.groups.length}</span>
          <span class="stat-label">Stacks</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${state.deferred.length}</span>
          <span class="stat-label">Later</span>
        </div>
      </div>
    </header>
  `;
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

function getVisiblePresentation(state: AppState): VisiblePresentation {
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

function renderSelectionPill(selected: boolean, count?: number): string {
  return `
    <span class="selection-pill ${selected ? 'active' : ''}">
      ${selected ? 'Selected' : 'Select'}${typeof count === 'number' ? ` · ${count}` : ''}
    </span>
  `;
}

function renderBulkBar(state: AppState, visibleTabIds: number[]): string {
  const visibleSelection = state.selectedTabIds.filter((tabId) => visibleTabIds.includes(tabId));
  const hasSelection = visibleSelection.length > 0;
  const allVisibleSelected = visibleTabIds.length > 0 && visibleSelection.length === visibleTabIds.length;

  return `
    <div class="bulk-bar ${hasSelection ? 'active' : ''}">
      <div class="bulk-copy">
        <strong>${hasSelection ? `${visibleSelection.length} selected` : 'No tabs selected'}</strong>
        <span>${hasSelection ? 'Use batch actions on the current visible set.' : 'Select tabs, groups, or all visible results.'}</span>
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
          ${allVisibleSelected ? 'Unselect visible' : 'Select visible'}
        </button>
        <button class="ghost-btn" type="button" data-action="clear-selection" ${hasSelection ? '' : 'disabled'}>Clear</button>
        <button
          class="ghost-btn"
          type="button"
          data-action="defer-selected"
          data-tab-ids="${escapeHtml(visibleSelection.join(','))}"
          ${hasSelection ? '' : 'disabled'}
        >
          Move selected to Later
        </button>
        <button
          class="ghost-btn"
          type="button"
          data-action="move-selected-to-new-window"
          data-tab-ids="${escapeHtml(visibleSelection.join(','))}"
          ${hasSelection ? '' : 'disabled'}
        >
          New window
        </button>
        <button
          class="primary-btn"
          type="button"
          data-action="close-selected"
          data-tab-ids="${escapeHtml(visibleSelection.join(','))}"
          ${hasSelection ? '' : 'disabled'}
        >
          Close selected
        </button>
      </div>
    </div>
  `;
}

function renderTabRow(tab: AppTab, query: string, selectedTabIds: Set<number>): string {
  let portPrefix = '';
  if (tab.hostname === 'localhost') {
    try {
      portPrefix = new URL(tab.url).port;
    } catch {
      portPrefix = '';
    }
  }

  const title = `${portPrefix ? `${portPrefix} ` : ''}${tab.cleanTitle || tab.title || tab.url}`;
  let meta = tab.url;
  if (tab.hostname !== 'localhost') {
    try {
      const parsed = new URL(tab.url);
      meta = `${tab.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`;
    } catch {
      meta = tab.hostname || tab.url;
    }
  }

  const isSelected = selectedTabIds.has(tab.id);

  return `
    <li class="tab-row ${isSelected ? 'selected' : ''}">
      <button
        class="row-select"
        type="button"
        data-action="toggle-tab-selection"
        data-tab-id="${tab.id}"
        aria-pressed="${isSelected ? 'true' : 'false'}"
        aria-label="${isSelected ? 'Unselect tab' : 'Select tab'}"
      >
        ${renderSelectionPill(isSelected)}
      </button>
      <button
        class="tab-title"
        data-action="focus"
        data-tab-id="${tab.id}"
        data-window-id="${tab.windowId}"
        data-nav-target="tab"
      >
        <span class="tab-copy">
          <span class="tab-title-text">${renderHighlightedText(title, query)}</span>
          <span class="tab-meta">${renderHighlightedText(meta, query)}</span>
        </span>
        ${tab.active ? '<span class="tab-badge">active</span>' : ''}
      </button>
      <div class="row-actions">
        <button class="ghost-btn" data-action="defer" data-tab-id="${tab.id}">Later</button>
        <button class="ghost-btn danger" data-action="close-one" data-tab-id="${tab.id}">Close</button>
      </div>
    </li>
  `;
}

function renderGroup(group: DisplayGroup, query: string, selectedTabIds: Set<number>): string {
  const tabIds = group.tabs.map((tab) => tab.id);
  const tabIdsValue = tabIds.join(',');
  const groupLabel = group.windowId ? `${group.label} · Window ${group.windowId}` : group.label;
  const selectedCount = tabIds.filter((tabId) => selectedTabIds.has(tabId)).length;
  const allSelected = tabIds.length > 0 && selectedCount === tabIds.length;

  return `
    <section class="group-card" data-group-card="${group.id}" data-drop-group-id="${group.baseGroupId}">
      <div class="group-head">
        <div>
          <div class="group-title-row">
            <button
              class="drag-handle"
              type="button"
              draggable="true"
              data-drag-group-id="${group.baseGroupId}"
              aria-label="Reorder stack"
              title="Drag to reorder stack priority"
            >
              ≡
            </button>
            <button
              class="pin-toggle ${group.pinned ? 'active' : ''}"
              type="button"
              data-action="toggle-pinned-group"
              data-group-id="${group.baseGroupId}"
              aria-pressed="${group.pinned ? 'true' : 'false'}"
              aria-label="${group.pinned ? 'Unpin stack' : 'Pin stack to top'}"
              title="${group.pinned ? 'Unpin stack' : 'Pin stack to top'}"
            >
              ${group.pinned ? 'Pinned' : 'Pin'}
            </button>
            <p class="group-kind">${group.kind}</p>
          </div>
          <h2>${renderHighlightedText(group.label, query)}</h2>
        </div>
        <div class="group-meta">
          <button
            class="group-select"
            type="button"
            data-action="set-tab-selection"
            data-tab-ids="${escapeHtml(tabIdsValue)}"
            data-selected="${allSelected ? 'false' : 'true'}"
            aria-pressed="${allSelected ? 'true' : 'false'}"
          >
            ${renderSelectionPill(allSelected, selectedCount)}
          </button>
          <span>${group.tabs.length} tabs</span>
          ${group.duplicateCount ? `<span class="warning-pill">${group.duplicateCount} dupes</span>` : ''}
        </div>
      </div>
      <ul class="tab-list">
        ${group.tabs.slice(0, 8).map((tab) => renderTabRow(tab, query, selectedTabIds)).join('')}
      </ul>
      ${group.tabs.length > 8 ? `<p class="overflow-note">+${group.tabs.length - 8} more tabs in this stack</p>` : ''}
      <div class="group-actions">
        <button
          class="primary-btn"
          data-action="close-group"
          data-group-id="${group.id}"
          data-group-label="${escapeHtml(groupLabel)}"
          data-tab-ids="${escapeHtml(tabIdsValue)}"
        >
          Close stack
        </button>
        ${group.duplicateCount ? `
          <button
            class="ghost-btn"
            data-action="close-duplicates"
            data-group-id="${group.id}"
            data-tab-ids="${escapeHtml(tabIdsValue)}"
          >
            Close duplicates
          </button>
        ` : ''}
      </div>
    </section>
  `;
}

function renderSections(
  sections: DisplaySection[],
  query: string,
  layoutMode: AppState['layoutMode'],
  selectedTabIds: Set<number>
): string {
  if (layoutMode === 'merged') {
    return `<div class="group-grid">${sections[0]?.groups.map((group) => renderGroup(group, query, selectedTabIds)).join('') ?? ''}</div>`;
  }

  return sections.map((section) => `
    <section class="window-section">
      <div class="window-head">
        <h3>${escapeHtml(section.title)}</h3>
        <span>${section.groups.reduce((sum, group) => sum + group.tabs.length, 0)} tabs</span>
      </div>
      <div class="group-grid">
        ${section.groups.map((group) => renderGroup(group, query, selectedTabIds)).join('')}
      </div>
    </section>
  `).join('');
}

function renderSidebar(state: AppState): string {
  const windowCount = new Set(state.tabs.map((tab) => tab.windowId)).size;
  const allTags = [...new Set(state.snapshots.flatMap((snapshot) => snapshot.tags))].sort((a, b) => a.localeCompare(b));
  const visibleSnapshots = state.snapshotTagFilter
    ? state.snapshots.filter((snapshot) => snapshot.tags.includes(state.snapshotTagFilter))
    : state.snapshots;

  return `
    <aside class="sidebar">
      <div class="sidebar-card">
        <div class="sidebar-head">
          <h2>Workspace Snapshots</h2>
          <span>${windowCount} windows</span>
        </div>
        <p class="empty-copy">Export your current workspace to JSON, or import one to rebuild tabs, settings, and stack priorities.</p>
        <div class="group-actions">
          <button class="ghost-btn" data-action="open-export-snapshot">Export snapshot</button>
          <button class="primary-btn" data-action="import-snapshot">Import snapshot</button>
        </div>
        ${allTags.length ? `
          <div class="tag-filter-row">
            <button
              class="tag-chip ${state.snapshotTagFilter ? '' : 'active'}"
              data-action="set-snapshot-tag-filter"
              data-snapshot-tag=""
            >
              All
            </button>
            ${allTags.map((tag) => `
              <button
                class="tag-chip ${state.snapshotTagFilter === tag ? 'active' : ''}"
                data-action="set-snapshot-tag-filter"
                data-snapshot-tag="${escapeHtml(tag)}"
              >
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
                  <span>${snapshot.source} · ${timeAgo(snapshot.exportedAt)}</span>
                  ${snapshot.note ? `<small>${escapeHtml(snapshot.note)}</small>` : ''}
                  ${snapshot.tags.length ? `
                    <div class="tag-row">
                      ${snapshot.tags.map((tag) => `<span class="tag-chip static">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>
                <div class="row-actions">
                  <button class="ghost-btn" data-action="open-edit-snapshot" data-snapshot-id="${snapshot.id}">Edit</button>
                  <button class="ghost-btn" data-action="restore-snapshot" data-snapshot-id="${snapshot.id}">Restore</button>
                  <button class="ghost-btn danger" data-action="open-delete-snapshot" data-snapshot-id="${snapshot.id}">Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="empty-copy">No matching snapshots yet. Change the tag filter or create a tagged snapshot.</p>'}
      </div>
      <div class="sidebar-card">
        <div class="sidebar-head">
          <h2>Later Dock</h2>
          <span>${state.deferred.length}</span>
        </div>
        ${state.deferred.length ? state.deferred.map((item) => `
          <div class="deferred-row">
            <div class="deferred-copy">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${timeAgo(item.createdAt)}</span>
            </div>
            <div class="row-actions">
              <button class="ghost-btn" data-action="complete-deferred" data-deferred-id="${item.id}">Done</button>
              <button class="ghost-btn danger" data-action="dismiss-deferred" data-deferred-id="${item.id}">Dismiss</button>
            </div>
          </div>
        `).join('') : '<p class="empty-copy">Nothing deferred. Keep moving.</p>'}
      </div>
      <div class="sidebar-card">
        <div class="sidebar-head">
          <h2>Recent Closures</h2>
          <span>${state.recentClosed.length}</span>
        </div>
        ${state.recentClosed.length ? state.recentClosed.map((item) => `
          <div class="deferred-row">
            <div class="deferred-copy">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${item.tabs.length} tabs · ${timeAgo(item.closedAt)}</span>
            </div>
            <div class="row-actions">
              <button class="ghost-btn" data-action="restore-recent" data-recent-id="${item.id}">Restore</button>
              <button class="ghost-btn danger" data-action="dismiss-recent" data-recent-id="${item.id}">Dismiss</button>
            </div>
          </div>
        `).join('') : '<p class="empty-copy">Recently closed stacks can be restored here.</p>'}
      </div>
      <div class="sidebar-card">
        <div class="sidebar-head">
          <h2>Archive</h2>
          <span>${state.archive.length}</span>
        </div>
        ${state.archive.length ? state.archive.slice(0, 8).map((item) => `
          <a class="archive-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
            <span>${escapeHtml(item.title)}</span>
            <small>${timeAgo(item.completedAt || item.createdAt)}</small>
          </a>
        `).join('') : '<p class="empty-copy">Checked-off tabs land here.</p>'}
      </div>
    </aside>
  `;
}

function renderSearchToolbar(state: AppState, groupCount: number, visibleTabCount: number): string {
  const hasQuery = Boolean(state.searchQuery.trim());
  const summary = hasQuery
    ? `${visibleTabCount} matching tabs in ${groupCount} stack${groupCount === 1 ? '' : 's'}`
    : `${visibleTabCount} tabs across ${groupCount} stacks`;

  return `
    <div class="toolbar">
      <div class="toolbar-controls">
        <label class="search-shell" aria-label="Search open tabs">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input
            class="search-input"
            type="search"
            value="${escapeHtml(state.searchQuery)}"
            placeholder="Search tabs, domains, or stack names"
            data-role="tab-search"
          />
          ${hasQuery
            ? '<button class="search-clear" type="button" data-action="clear-search" aria-label="Clear search">Clear</button>'
            : ''}
        </label>
        <div class="toggle-group" role="tablist" aria-label="Tab sort mode">
          <button
            class="toggle-pill ${state.sortMode === 'smart' ? 'active' : ''}"
            type="button"
            data-action="set-sort-mode"
            data-sort-mode="smart"
          >
            Smart
          </button>
          <button
            class="toggle-pill ${state.sortMode === 'recent' ? 'active' : ''}"
            type="button"
            data-action="set-sort-mode"
            data-sort-mode="recent"
          >
            Recent
          </button>
        </div>
        <button
          class="toggle-chip ${state.duplicatesOnly ? 'active' : ''}"
          type="button"
          data-action="set-duplicates-only"
          data-enabled="${state.duplicatesOnly ? 'false' : 'true'}"
          aria-pressed="${state.duplicatesOnly ? 'true' : 'false'}"
        >
          Duplicates only
        </button>
        <div class="toggle-group" role="tablist" aria-label="Layout mode">
          <button
            class="toggle-pill ${state.layoutMode === 'merged' ? 'active' : ''}"
            type="button"
            data-action="set-layout-mode"
            data-layout-mode="merged"
          >
            Merged
          </button>
          <button
            class="toggle-pill ${state.layoutMode === 'windows' ? 'active' : ''}"
            type="button"
            data-action="set-layout-mode"
            data-layout-mode="windows"
          >
            By window
          </button>
        </div>
      </div>
      <p class="toolbar-summary">${summary}</p>
    </div>
  `;
}

function renderSnapshotDialog(dialog: SnapshotDialogViewModel): string {
  if (dialog.mode === 'closed') return '';

  if (dialog.mode === 'delete') {
    return `
      <div class="modal-scrim">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="snapshot-dialog-title">
          <div class="modal-head">
            <div>
              <p class="eyebrow">Workspace Snapshot</p>
              <h2 id="snapshot-dialog-title">Delete snapshot</h2>
            </div>
            <button class="ghost-btn" type="button" data-action="close-snapshot-dialog">Cancel</button>
          </div>
          <p class="modal-copy">Remove <strong>${escapeHtml(dialog.name)}</strong> from local snapshot storage?</p>
          ${dialog.error ? `<p class="form-error">${escapeHtml(dialog.error)}</p>` : ''}
          <form class="modal-form" data-role="snapshot-dialog-form" data-mode="delete" data-snapshot-id="${escapeHtml(dialog.snapshotId ?? '')}">
            <div class="modal-actions">
              <button class="ghost-btn" type="button" data-action="close-snapshot-dialog">Keep it</button>
              <button class="primary-btn danger-btn" type="submit" ${dialog.submitting ? 'disabled' : ''}>${dialog.submitting ? 'Deleting…' : 'Delete snapshot'}</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  const title = dialog.mode === 'edit' ? 'Edit snapshot' : 'Export snapshot';
  const submitLabel = dialog.mode === 'edit'
    ? (dialog.submitting ? 'Saving…' : 'Save snapshot')
    : (dialog.submitting ? 'Exporting…' : 'Export snapshot');

  return `
    <div class="modal-scrim">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="snapshot-dialog-title">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Workspace Snapshot</p>
            <h2 id="snapshot-dialog-title">${title}</h2>
          </div>
          <button class="ghost-btn" type="button" data-action="close-snapshot-dialog">Cancel</button>
        </div>
        <p class="modal-copy">Capture a named workspace version with tags and notes, then restore it later without touching hidden state.</p>
        ${dialog.error ? `<p class="form-error">${escapeHtml(dialog.error)}</p>` : ''}
        <form class="modal-form" data-role="snapshot-dialog-form" data-mode="${dialog.mode}" data-snapshot-id="${escapeHtml(dialog.snapshotId ?? '')}">
          <label class="modal-field">
            <span>Name</span>
            <input
              class="modal-input"
              type="text"
              name="name"
              value="${escapeHtml(dialog.name)}"
              data-role="snapshot-dialog-name"
              placeholder="Workspace April review"
            />
          </label>
          <label class="modal-field">
            <span>Tags</span>
            <input
              class="modal-input"
              type="text"
              name="tags"
              value="${escapeHtml(dialog.tags)}"
              data-role="snapshot-dialog-tags"
              placeholder="project-a, review, urgent"
            />
          </label>
          <label class="modal-field">
            <span>Note</span>
            <textarea
              class="modal-textarea"
              name="note"
              rows="4"
              data-role="snapshot-dialog-note"
              placeholder="Why this workspace matters, what changed, or what to restore first."
            >${escapeHtml(dialog.note)}</textarea>
          </label>
          <div class="modal-actions">
            <button class="ghost-btn" type="button" data-action="close-snapshot-dialog">Cancel</button>
            <button class="primary-btn" type="submit" ${dialog.submitting ? 'disabled' : ''}>${submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderNewtab(root: HTMLElement, state: AppState, snapshotDialog: SnapshotDialogViewModel): void {
  const visible = getVisiblePresentation(state);
  const hasQuery = Boolean(visible.query);
  const selectedTabIds = new Set(state.selectedTabIds);

  root.innerHTML = `
    <div class="shell">
      ${renderHeader(state)}
      <main class="main-grid">
        <section class="board">
          <div class="section-head">
            <div>
              <p class="eyebrow">Open now</p>
              <h2>Stacks in the typed harbor</h2>
            </div>
            <button class="primary-btn" data-action="close-all"${visible.groups.length ? '' : ' disabled'}>Close all open tabs</button>
          </div>
          ${renderSearchToolbar(state, visible.groups.length, visible.visibleTabCount)}
          ${renderBulkBar(state, visible.visibleTabIds)}
          ${visible.groups.length
            ? renderSections(visible.sections, visible.query, state.layoutMode, selectedTabIds)
            : hasQuery || state.duplicatesOnly
              ? '<div class="empty-state"><h3>No matching tabs</h3><p>Try a different keyword, switch off duplicate-only mode, or clear the filter to see every stack again.</p></div>'
              : '<div class="empty-state"><h3>Harbor is clear</h3><p>All open tabs are either internal or already handled.</p></div>'}
        </section>
        ${renderSidebar(state)}
      </main>
      ${renderSnapshotDialog(snapshotDialog)}
      <input class="snapshot-input" type="file" accept="application/json,.json" data-role="snapshot-input" />
      <div class="toast ${state.toast ? 'visible' : ''}">${escapeHtml(state.toast)}</div>
    </div>
  `;
}
