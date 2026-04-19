import type { AppState } from '@/lib/app/state';
import {
  buildVisiblePresentation,
  buildWorkspaceSummary,
  type DisplayGroup,
  type DisplaySection,
  type WorkspaceSummary
} from '@/lib/ui/newtab-presenter';
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

interface NewtabCopy {
  brandCaption: string;
  heroTitle: string;
  heroCopy: string;
  heroOpenNow(count: number): string;
  heroPinned(count: number): string;
  heroSnapshots(count: number): string;
  workspaceBrief: string;
  briefTitle: string;
  visibleNow: string;
  duplicates: string;
  selected: string;
  laterQueue: string;
  flowSearch: string;
  flowSelect: string;
  flowMove: string;
  briefNote: string;
  metricWorkspaceNow: string;
  metricWorkspaceNote(summary: WorkspaceSummary): string;
  metricCleanupRisk: string;
  metricCleanupNote(count: number): string;
  metricSelection: string;
  metricRecovery: string;
  metricSelectionNote: string;
  metricRecoveryNote(summary: WorkspaceSummary): string;
  searchChip(query: string): string;
  fullWorkspace: string;
  tabsChip(count: number): string;
  stacksChip(count: number): string;
  duplicateChip(count: number): string;
  noDuplicateChip: string;
  byWindowChip: string;
  recentOrderChip: string;
  select: string;
  selectedChip(count: number): string;
  focusedWorkspace: string;
  openStacks: string;
  toolbarCopy: string;
  scopeSummary(hasQuery: boolean, summary: WorkspaceSummary): string;
  closeAllOpenTabs: string;
  searchPlaceholder: string;
  clearSearch: string;
  smart: string;
  recent: string;
  duplicatesOnly: string;
  merged: string;
  byWindow: string;
  liveSearchNote: string;
  searchTip: string;
  shortcutHint: string;
  selectedSummary(count: number): string;
  noSelectionSummary: string;
  visibleChip(count: number): string;
  visibleScopeOnly: string;
  selectRowsHint: string;
  hiddenSelectionChip(count: number): string;
  selectedCopy: string;
  emptySelectionCopy: string;
  unselectVisible: string;
  selectVisible: string;
  clear: string;
  moveToLater(count: number): string;
  newWindow(count: number): string;
  closeSelected(count: number): string;
  kindRule: string;
  kindLanding: string;
  kindDomain: string;
  pin: string;
  pinned: string;
  pinAria(active: boolean): string;
  reorder: string;
  reorderHint: string;
  selectTab: string;
  unselectTab: string;
  activeTab: string;
  later: string;
  close: string;
  stackTabs(count: number): string;
  duplicatesBadge(count: number): string;
  cleanBadge: string;
  windowBadge(id: number): string;
  selectedBadge(count: number): string;
  stackOverflow(count: number): string;
  closeStack: string;
  closeDuplicates(count: number): string;
  windowView: string;
  windowTitle(id: string): string;
  windowTabCount(count: number): string;
  startHere: string;
  gettingStarted: string;
  firstSession: string;
  scopedCleanup: string;
  filteredView: string;
  workspaceClear: string;
  noOpenTabs: string;
  guideCalloutDefault: string;
  guideCalloutFirst: string;
  guideCalloutScoped: string;
  guideCalloutClear: string;
  guideDefaultPills: string[];
  guideFirstPills: string[];
  guideScopedPills: string[];
  guideClearPills: string[];
  guideDefaultSteps: Array<{ title: string; copy: string }>;
  guideFirstSteps: Array<{ title: string; copy: string }>;
  guideScopedSteps: Array<{ title: string; copy: string }>;
  guideClearSteps: Array<{ title: string; copy: string }>;
  snapshotsTitle: string;
  snapshotsIntro: string;
  exportSnapshot: string;
  importSnapshot: string;
  all: string;
  noTaggedSnapshots: string;
  noSnapshots: string;
  edit: string;
  restore: string;
  delete: string;
  laterDock: string;
  laterEmpty: string;
  done: string;
  dismiss: string;
  recentClosures: string;
  recentTabCount(count: number): string;
  recentEmpty: string;
  archive: string;
  archiveEmpty: string;
  snapshotEyebrow: string;
  deleteSnapshot: string;
  cancel: string;
  keepIt: string;
  deleteConfirm(name: string): string;
  deleting: string;
  exportSnapshotTitle: string;
  editSnapshotTitle: string;
  modalCopy: string;
  snapshotName: string;
  snapshotTags: string;
  snapshotNote: string;
  snapshotNamePlaceholder: string;
  snapshotTagsPlaceholder: string;
  snapshotNotePlaceholder: string;
  exporting: string;
  saveSnapshot: string;
  saving: string;
  noVisibleResult: string;
  noMatchTitle: string;
  noMatchCopy: string;
  showAllTabs: string;
  workspaceComplete: string;
  workspaceClearTitle: string;
  workspaceClearCopy: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function getNewtabCopy(locale: AppState['settings']['language']): NewtabCopy {
  if (locale === 'zh-CN') {
    return {
      brandCaption: '重浏览器工作流的整理面板',
      heroTitle: '把散开的标签页，收成一个更清楚的工作台。',
      heroCopy: '先定位正在做的事，再把其余内容归档、暂存或批量处理。大动作之前也能先留一个可恢复的工作区快照。',
      heroOpenNow: (count) => `当前打开 · ${count} 个标签页`,
      heroPinned: (count) => `置顶分组 · ${count}`,
      heroSnapshots: (count) => `已存快照 · ${count}`,
      workspaceBrief: '工作区速览',
      briefTitle: '默认就该足够清楚',
      visibleNow: '当前可见',
      duplicates: '重复标签',
      selected: '已选中',
      laterQueue: '稍后处理',
      flowSearch: '检索',
      flowSelect: '选择',
      flowMove: '移动或关闭',
      briefNote: '先缩小范围，再下动作。大批量清理前先留一个快照，后面回退会轻松很多。',
      metricWorkspaceNow: '当前工作区',
      metricWorkspaceNote: (summary) => `${summary.visibleGroups} 个堆栈 · ${summary.windowCount} 个窗口`,
      metricCleanupRisk: '需要优先整理',
      metricCleanupNote: (count) => count ? '当前视图里还有重复标签' : '当前视图里没有重复标签',
      metricSelection: '当前选择',
      metricRecovery: '恢复能力',
      metricSelectionNote: '可以直接做批量动作',
      metricRecoveryNote: (summary) => `${summary.snapshotCount} 个快照 · ${summary.deferredCount} 个稍后处理`,
      searchChip: (query) => `搜索 · “${query}”`,
      fullWorkspace: '完整工作区',
      tabsChip: (count) => `${count} 个标签页`,
      stacksChip: (count) => `${count} 个堆栈`,
      duplicateChip: (count) => `${count} 个重复项`,
      noDuplicateChip: '无重复项',
      byWindowChip: '按窗口拆分',
      recentOrderChip: '按最近使用',
      select: '选择',
      selectedChip: (count) => `已选 ${count}`,
      focusedWorkspace: '聚焦视图',
      openStacks: '打开中的堆栈',
      toolbarCopy: '先筛，再动手。下面的所有操作都会尊重你当前看到的范围。',
      scopeSummary: (hasQuery, summary) => (
        hasQuery
          ? `当前命中 ${summary.visibleTabs} 个标签页，分布在 ${summary.visibleGroups} 个堆栈里。`
          : `当前共有 ${summary.totalTabs} 个标签页，分布在 ${summary.totalGroups} 个堆栈里。`
      ),
      closeAllOpenTabs: '关闭全部打开标签页',
      searchPlaceholder: '检索标签页、域名或堆栈名称',
      clearSearch: '清空',
      smart: '智能',
      recent: '最近',
      duplicatesOnly: '只看重复项',
      merged: '合并视图',
      byWindow: '分窗口',
      liveSearchNote: '检索已开启，按 Esc 可以快速清空。',
      searchTip: '建议先检索，再做批量操作，风险会低很多。',
      shortcutHint: '快捷键：/ 聚焦搜索，Esc 清空，j/k 移动，x 选择。',
      selectedSummary: (count) => `已选中 ${count} 个标签页`,
      noSelectionSummary: '还没有选中任何标签页',
      visibleChip: (count) => `当前可见 ${count}`,
      visibleScopeOnly: '只作用于当前可见范围',
      selectRowsHint: '可选中单行、整个堆栈，或当前全部可见结果。',
      hiddenSelectionChip: (count) => `另有 ${count} 个选中项不在当前筛选里`,
      selectedCopy: '批量操作只会作用于当前仍可见的已选标签页。',
      emptySelectionCopy: '先选中几项，再批量移动、拆窗或关闭。',
      unselectVisible: '取消当前可见',
      selectVisible: '选中当前可见',
      clear: '清空选择',
      moveToLater: (count) => count ? `移到稍后处理 · ${count}` : '移到稍后处理',
      newWindow: (count) => count ? `移到新窗口 · ${count}` : '移到新窗口',
      closeSelected: (count) => count ? `关闭已选 · ${count}` : '关闭已选',
      kindRule: '命名规则',
      kindLanding: '首页堆栈',
      kindDomain: '域名堆栈',
      pin: '置顶',
      pinned: '已置顶',
      pinAria: (active) => active ? '取消置顶该堆栈' : '把该堆栈置顶',
      reorder: '排序',
      reorderHint: '拖动调整堆栈优先级',
      selectTab: '选择标签页',
      unselectTab: '取消选择标签页',
      activeTab: '当前活跃',
      later: '稍后',
      close: '关闭',
      stackTabs: (count) => `${count} 个标签页`,
      duplicatesBadge: (count) => `${count} 个重复项`,
      cleanBadge: '已清爽',
      windowBadge: (id) => `窗口 ${id}`,
      selectedBadge: (count) => `已选 ${count}`,
      stackOverflow: (count) => `这个堆栈里还有 ${count} 个未展开标签页`,
      closeStack: '关闭整个堆栈',
      closeDuplicates: (count) => `关闭重复项 · ${count}`,
      windowView: '窗口视图',
      windowTitle: (id) => `窗口 ${id}`,
      windowTabCount: (count) => `${count} 个标签页`,
      startHere: '从这里开始',
      gettingStarted: '第一次整理',
      firstSession: '首次使用',
      scopedCleanup: '当前已缩小范围',
      filteredView: '筛选视图',
      workspaceClear: '工作区已清空',
      noOpenTabs: '没有打开标签页',
      guideCalloutDefault: '建议先过滤，再留快照，最后只对当前可见内容动手。',
      guideCalloutFirst: '第一次整理时，不用一次做完。先找一个明确目标，存一个快照，再小批量处理。',
      guideCalloutScoped: '你已经处在缩小后的视图里了，下面的批量操作只会作用于当前还能看到的标签页。',
      guideCalloutClear: '面板现在是空的。你可以恢复一个快照，也可以从一个全新的干净工作区重新开始。',
      guideDefaultPills: ['检索', '留快照', '执行'],
      guideFirstPills: ['观察', '备份', '整理'],
      guideScopedPills: ['确认范围', '选择', '处理'],
      guideClearPills: ['恢复', '重建', '继续'],
      guideDefaultSteps: [
        { title: '先缩小目标', copy: '可以先用搜索或只看重复项，不要一上来就面对全部堆栈。' },
        { title: '先留一个快照', copy: '工作区比较重要时，先导出快照，后面回退会更稳。' },
        { title: '只处理当前可见范围', copy: '选中单行、整个堆栈或当前全部可见结果，避免误伤隐藏内容。' }
      ],
      guideFirstSteps: [
        { title: '先找一类最明显的噪音', copy: '从一个关键词、一个域名，或者重复项开始，效果最直观。' },
        { title: '先存第一份快照', copy: '第一轮整理前有快照，后面想恢复就不会心里没底。' },
        { title: '用小批量动作推进', copy: '一次只移动或关闭一小批，工作区会更容易建立信任感。' }
      ],
      guideScopedSteps: [
        { title: '先看顶部状态', copy: '顶部状态条会告诉你当前是搜索结果、重复视图还是按窗口查看。' },
        { title: '只选你真正要处理的内容', copy: '当前视图的选择不会波及被过滤掉的堆栈。' },
        { title: '处理重复项或过载堆栈', copy: '确认范围没问题后，再关闭重复项、移到稍后处理或拆到新窗口。' }
      ],
      guideClearSteps: [
        { title: '恢复之前的工作区', copy: '如果你想把某次会话完整找回来，可以直接恢复快照。' },
        { title: '顺手整理显示规则', copy: '在设置里收掉后台噪音，下次工作区会更干净。' },
        { title: '让稍后处理更有节制', copy: '后续新增内容先移到稍后处理，不要再把主面板堆满。' }
      ],
      snapshotsTitle: '工作区快照',
      snapshotsIntro: '大动作前先存一份工作区版本，需要时可以把标签页、设置和分组优先级一并恢复回来。',
      exportSnapshot: '导出快照',
      importSnapshot: '导入快照',
      all: '全部',
      noTaggedSnapshots: '当前标签下还没有快照，可以换个标签看看，或者新建一份带标签的快照。',
      noSnapshots: '还没有快照。建议在第一次大批量清理前先存一份。',
      edit: '编辑',
      restore: '恢复',
      delete: '删除',
      laterDock: '稍后处理',
      laterEmpty: '这里还没有内容。把暂时不处理的标签页移过来，主面板会更轻。',
      done: '完成',
      dismiss: '移除',
      recentClosures: '最近关闭',
      recentTabCount: (count) => `${count} 个标签页`,
      recentEmpty: '最近关闭的堆栈会先留在这里，方便你快速恢复。',
      archive: '归档记录',
      archiveEmpty: '完成的稍后处理项会留在这里，作为轻量历史。',
      snapshotEyebrow: '工作区快照',
      deleteSnapshot: '删除快照',
      cancel: '取消',
      keepIt: '先保留',
      deleteConfirm: (name) => `要把“${name}”从本地快照列表中移除吗？`,
      deleting: '删除中…',
      exportSnapshotTitle: '导出快照',
      editSnapshotTitle: '编辑快照',
      modalCopy: '给这次工作区起个名字、加一点备注和标签，后面查找和恢复都会更快。',
      snapshotName: '名称',
      snapshotTags: '标签',
      snapshotNote: '备注',
      snapshotNamePlaceholder: '例如：四月评审工作区',
      snapshotTagsPlaceholder: '例如：client-a, review, urgent',
      snapshotNotePlaceholder: '记录这份工作区为什么重要，或者恢复时应该先看什么。',
      exporting: '导出中…',
      saveSnapshot: '保存快照',
      saving: '保存中…',
      noVisibleResult: '当前没有可见结果',
      noMatchTitle: '没有匹配到标签页',
      noMatchCopy: '可以换一个关键词，关闭“只看重复项”，或者清空当前筛选后再看完整工作区。',
      showAllTabs: '显示全部标签页',
      workspaceComplete: '工作区已整理完',
      workspaceClearTitle: '当前工作区是空的',
      workspaceClearCopy: '这里已经没有待处理的打开标签页了。如果你想回到某次会话，可以直接恢复一个快照。'
    };
  }

  return {
    brandCaption: 'Workspace control for heavy browser sessions',
    heroTitle: 'Turn tab sprawl into a clean working surface.',
    heroCopy: 'Find the right tab, park the rest, and keep a recoverable checkpoint before any big cleanup pass.',
    heroOpenNow: (count) => `Open now · ${count} tabs`,
    heroPinned: (count) => `Pinned stacks · ${count}`,
    heroSnapshots: (count) => `Saved snapshots · ${count}`,
    workspaceBrief: 'Workspace Brief',
    briefTitle: 'Simple by default',
    visibleNow: 'Visible now',
    duplicates: 'Duplicates',
    selected: 'Selected',
    laterQueue: 'Later queue',
    flowSearch: 'Search',
    flowSelect: 'Select',
    flowMove: 'Move or close',
    briefNote: 'Narrow the board first. Save a snapshot before a large cleanup, then act only on what stays visible.',
    metricWorkspaceNow: 'Workspace now',
    metricWorkspaceNote: (summary) => `${summary.visibleGroups} stacks · ${summary.windowCount} windows`,
    metricCleanupRisk: 'Cleanup risk',
    metricCleanupNote: (count) => count ? 'Duplicate tabs in view' : 'No duplicates in view',
    metricSelection: 'Selection',
    metricRecovery: 'Recovery',
    metricSelectionNote: 'Ready for batch actions',
    metricRecoveryNote: (summary) => `${summary.snapshotCount} snapshots · ${summary.deferredCount} in Later`,
    searchChip: (query) => `Search · "${query}"`,
    fullWorkspace: 'Full workspace',
    tabsChip: (count) => `${count} tabs`,
    stacksChip: (count) => `${count} stacks`,
    duplicateChip: (count) => `${count} duplicates`,
    noDuplicateChip: 'No duplicates',
    byWindowChip: 'By window',
    recentOrderChip: 'Recent order',
    select: 'Select',
    selectedChip: (count) => `${count} selected`,
    focusedWorkspace: 'Focused workspace',
    openStacks: 'Open stacks',
    toolbarCopy: 'Search first. Every action below stays scoped to what you can see.',
    scopeSummary: (hasQuery, summary) => (
      hasQuery
        ? `Showing ${summary.visibleTabs} matching tabs across ${summary.visibleGroups} visible stacks.`
        : `Showing ${summary.totalTabs} open tabs across ${summary.totalGroups} stacks.`
    ),
    closeAllOpenTabs: 'Close all open tabs',
    searchPlaceholder: 'Search tabs, domains, or stack names',
    clearSearch: 'Clear',
    smart: 'Smart',
    recent: 'Recent',
    duplicatesOnly: 'Duplicates only',
    merged: 'Merged',
    byWindow: 'By window',
    liveSearchNote: 'Live search is active. Press Esc to clear it quickly.',
    searchTip: 'Tip: search first, then batch actions stay narrow and safer.',
    shortcutHint: 'Shortcuts: / search, Esc clear, j/k move, x select.',
    selectedSummary: (count) => `${count} tabs selected`,
    noSelectionSummary: 'No tabs selected yet',
    visibleChip: (count) => `${count} visible`,
    visibleScopeOnly: 'Visible scope only',
    selectRowsHint: 'Select rows, a full stack, or the full visible result.',
    hiddenSelectionChip: (count) => `${count} selected outside filters`,
    selectedCopy: 'Batch actions only touch the selected tabs that are still visible in this view.',
    emptySelectionCopy: 'Select rows, a full stack, or the visible result before acting in bulk.',
    unselectVisible: 'Unselect visible',
    selectVisible: 'Select visible',
    clear: 'Clear',
    moveToLater: (count) => count ? `Move ${count} to Later` : 'Move to Later',
    newWindow: (count) => count ? `New window · ${count}` : 'New window',
    closeSelected: (count) => count ? `Close ${count}` : 'Close selected',
    kindRule: 'Rule',
    kindLanding: 'Landing',
    kindDomain: 'Domain',
    pin: 'Pin',
    pinned: 'Pinned',
    pinAria: (active) => active ? 'Unpin stack' : 'Pin stack to top',
    reorder: 'Reorder',
    reorderHint: 'Drag to reorder stack priority',
    selectTab: 'Select tab',
    unselectTab: 'Unselect tab',
    activeTab: 'Active',
    later: 'Later',
    close: 'Close',
    stackTabs: (count) => `${count} tabs`,
    duplicatesBadge: (count) => `${count} duplicates`,
    cleanBadge: 'Clean',
    windowBadge: (id) => `Window ${id}`,
    selectedBadge: (count) => `${count} selected`,
    stackOverflow: (count) => `+${count} more tabs in this stack`,
    closeStack: 'Close stack',
    closeDuplicates: (count) => `Close duplicates · ${count}`,
    windowView: 'Window view',
    windowTitle: (id) => `Window ${id}`,
    windowTabCount: (count) => `${count} tabs`,
    startHere: 'Start here',
    gettingStarted: 'Getting started',
    firstSession: 'First session',
    scopedCleanup: 'Scoped cleanup',
    filteredView: 'Filtered view',
    workspaceClear: 'Workspace clear',
    noOpenTabs: 'No open tabs',
    guideCalloutDefault: 'Filter first. Save a checkpoint before large cleanup. Then act only on what the board is showing now.',
    guideCalloutFirst: 'On your first cleanup, search or isolate duplicates, save one snapshot, then act in small batches.',
    guideCalloutScoped: 'You are already in a narrowed view. Batch actions below now apply only to the tabs that remain visible.',
    guideCalloutClear: 'The board is empty. Restore a snapshot if you want the workspace back, or keep going with a clean surface.',
    guideDefaultPills: ['Search', 'Snapshot', 'Act'],
    guideFirstPills: ['Scan', 'Save', 'Clean'],
    guideScopedPills: ['Scope', 'Select', 'Resolve'],
    guideClearPills: ['Restore', 'Rebuild', 'Continue'],
    guideDefaultSteps: [
      { title: 'Search or narrow first', copy: 'Use search or duplicates-only mode before you start closing tabs.' },
      { title: 'Save a checkpoint', copy: 'Create a snapshot when the workspace matters and you may want to rewind later.' },
      { title: 'Act on the visible scope', copy: 'Select rows or full stacks, then move or close only what stays visible.' }
    ],
    guideFirstSteps: [
      { title: 'Find one clear target', copy: 'Start with a keyword, a noisy domain, or duplicate-only mode instead of the full board.' },
      { title: 'Save your first snapshot', copy: 'One snapshot makes the first cleanup much safer because you can rebuild the session later.' },
      { title: 'Use visible-only actions', copy: 'Select visible results or one stack at a time so every batch move stays predictable.' }
    ],
    guideScopedSteps: [
      { title: 'Check the scope chips', copy: 'The control bar tells you whether search, duplicates-only mode, or recent order is active.' },
      { title: 'Select only what you mean', copy: 'Visible selection respects your current filter and will not touch hidden stacks.' },
      { title: 'Resolve duplicates or overflow', copy: 'Use Close duplicates, Move to Later, or Close selected once the scope looks right.' }
    ],
    guideClearSteps: [
      { title: 'Restore a saved session', copy: 'Use Import snapshot if you want to rebuild a previous workspace quickly.' },
      { title: 'Keep the board clean', copy: 'Use settings to hide background domains before the workspace fills up again.' },
      { title: 'Use Later intentionally', copy: 'When work returns, move overflow into Later instead of letting the board sprawl again.' }
    ],
    snapshotsTitle: 'Workspace snapshots',
    snapshotsIntro: 'Save a recoverable workspace version before bulk cleanup, or import one to rebuild tabs and priorities.',
    exportSnapshot: 'Export snapshot',
    importSnapshot: 'Import snapshot',
    all: 'All',
    noTaggedSnapshots: 'No matching snapshots yet. Create one or change the tag filter.',
    noSnapshots: 'No snapshots yet. Export one before your first large cleanup so you can recover this workspace later.',
    edit: 'Edit',
    restore: 'Restore',
    delete: 'Delete',
    laterDock: 'Later dock',
    laterEmpty: 'Nothing deferred. Use Later to park tabs without losing the trail.',
    done: 'Done',
    dismiss: 'Dismiss',
    recentClosures: 'Recent closures',
    recentTabCount: (count) => `${count} tabs`,
    recentEmpty: 'Closed stacks remain here until you restore or dismiss them.',
    archive: 'Archive',
    archiveEmpty: 'Completed Later items land here as a lightweight history.',
    snapshotEyebrow: 'Workspace snapshot',
    deleteSnapshot: 'Delete snapshot',
    cancel: 'Cancel',
    keepIt: 'Keep it',
    deleteConfirm: (name) => `Remove "${name}" from local snapshot storage?`,
    deleting: 'Deleting…',
    exportSnapshotTitle: 'Export snapshot',
    editSnapshotTitle: 'Edit snapshot',
    modalCopy: 'Give the workspace a name, a short note, and tags so you can find and restore it later.',
    snapshotName: 'Name',
    snapshotTags: 'Tags',
    snapshotNote: 'Note',
    snapshotNamePlaceholder: 'Workspace April review',
    snapshotTagsPlaceholder: 'client-a, review, urgent',
    snapshotNotePlaceholder: 'Why this version matters and what should be restored first.',
    exporting: 'Exporting…',
    saveSnapshot: 'Save snapshot',
    saving: 'Saving…',
    noVisibleResult: 'No visible result',
    noMatchTitle: 'No tabs match the current scope',
    noMatchCopy: 'Try a broader keyword, switch off duplicate-only mode, or clear the current filters to bring the full workspace back.',
    showAllTabs: 'Show all tabs',
    workspaceComplete: 'Workspace complete',
    workspaceClearTitle: 'Workspace is clear',
    workspaceClearCopy: 'There are no open browser tabs left to triage here. Restore a snapshot if you want to bring a saved session back.'
  };
}

function renderBrand(copy: NewtabCopy): string {
  return `
    <div class="brand-row">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="96" height="96" rx="28" fill="url(#paint0_linear)"/>
          <path d="M23 58C30 52 35.5 49.5 41 49.5C46.7 49.5 50.4 52.6 56 52.6C61.7 52.6 66.1 49.1 73 43V57C66.1 63.1 61.6 66.4 56 66.4C50.4 66.4 46.6 63.2 41 63.2C35.2 63.2 30.3 65.7 23 72V58Z" fill="white" fill-opacity="0.97"/>
          <path d="M32 27H41V53H32V27Z" fill="white" fill-opacity="0.92"/>
          <path d="M55 22H64V48H55V22Z" fill="white" fill-opacity="0.92"/>
          <defs>
            <linearGradient id="paint0_linear" x1="12" y1="8" x2="82" y2="88" gradientUnits="userSpaceOnUse">
              <stop stop-color="#0F4C81"/>
              <stop offset="1" stop-color="#12B886"/>
            </linearGradient>
          </defs>
        </svg>
      </span>
      <div>
        <p class="eyebrow">Tab Harbor</p>
        <p class="brand-caption">${escapeHtml(copy.brandCaption)}</p>
      </div>
    </div>
  `;
}

function localizeActiveWindowLabel(locale: AppState['settings']['language'], label: string): string {
  if (locale !== 'zh-CN') return label;
  if (label === 'No active tab') return '当前没有活跃标签页';
  return label.replace(/^Window\s+/i, '窗口 ');
}

function renderPanelIcon(symbol: string, tone: 'default' | 'primary' | 'success' | 'warning' = 'default'): string {
  return `<span class="panel-icon ${tone !== 'default' ? `panel-icon-${tone}` : ''}" aria-hidden="true">${escapeHtml(symbol)}</span>`;
}

function renderHero(copy: NewtabCopy, locale: AppState['settings']['language'], summary: WorkspaceSummary): string {
  const activeWindowLabel = localizeActiveWindowLabel(locale, summary.activeWindowLabel);
  const duplicateLabel = summary.totalDuplicates
    ? copy.duplicateChip(summary.totalDuplicates)
    : copy.noDuplicateChip;

  // 顶部区域改成“紧凑工作区栏”，核心目标是把搜索和堆栈尽量提前到首屏。
  return `
    <header class="hero">
      <div class="hero-main">
        ${renderBrand(copy)}
      </div>
      <div class="hero-pill-row hero-pill-row-compact">
        <span class="hero-pill hero-pill-strong">${escapeHtml(activeWindowLabel)}</span>
        <span class="hero-pill">${escapeHtml(copy.heroOpenNow(summary.totalTabs))}</span>
        <span class="hero-pill">${escapeHtml(copy.stacksChip(summary.totalGroups))}</span>
        <span class="hero-pill ${summary.totalDuplicates ? 'hero-pill-warning' : 'hero-pill-success'}">${escapeHtml(duplicateLabel)}</span>
        <span class="hero-pill">${escapeHtml(copy.heroSnapshots(summary.snapshotCount))}</span>
      </div>
    </header>
  `;
}

function renderMetricStrip(copy: NewtabCopy, summary: WorkspaceSummary): string {
  const metrics = [
    {
      label: copy.metricWorkspaceNow,
      value: summary.visibleTabs,
      note: copy.metricWorkspaceNote(summary)
    },
    {
      label: copy.metricCleanupRisk,
      value: summary.visibleDuplicates,
      note: copy.metricCleanupNote(summary.visibleDuplicates)
    },
    {
      label: summary.selectedTabs ? copy.metricSelection : copy.metricRecovery,
      value: summary.selectedTabs || summary.snapshotCount,
      note: summary.selectedTabs ? copy.metricSelectionNote : copy.metricRecoveryNote(summary)
    }
  ];

  return `
    <section class="metric-strip" aria-label="Workspace metrics">
      ${metrics.map((metric) => `
        <article class="metric-card">
          <span class="metric-label">${escapeHtml(metric.label)}</span>
          <strong>${metric.value}</strong>
          <span class="metric-note">${escapeHtml(metric.note)}</span>
        </article>
      `).join('')}
    </section>
  `;
}

function renderStatusChip(label: string, tone: 'default' | 'primary' | 'success' | 'warning' = 'default'): string {
  return `<span class="status-chip ${tone !== 'default' ? `status-chip-${tone}` : ''}">${escapeHtml(label)}</span>`;
}

function renderToolbarSignals(copy: NewtabCopy, state: AppState, summary: WorkspaceSummary): string {
  const searchQuery = state.searchQuery.trim();
  const chips = [
    searchQuery ? renderStatusChip(copy.searchChip(searchQuery), 'primary') : renderStatusChip(copy.fullWorkspace),
    renderStatusChip(copy.tabsChip(summary.visibleTabs)),
    renderStatusChip(copy.stacksChip(summary.visibleGroups)),
    summary.visibleDuplicates
      ? renderStatusChip(copy.duplicateChip(summary.visibleDuplicates), 'warning')
      : renderStatusChip(copy.noDuplicateChip, 'success')
  ];

  if (state.layoutMode === 'windows') chips.push(renderStatusChip(copy.byWindowChip));
  if (state.sortMode === 'recent') chips.push(renderStatusChip(copy.recentOrderChip));
  if (state.selectedTabIds.length) chips.push(renderStatusChip(copy.selectedChip(state.selectedTabIds.length), 'primary'));

  return `<div class="toolbar-signal-row">${chips.join('')}</div>`;
}

function renderSearchToolbar(
  copy: NewtabCopy,
  state: AppState,
  summary: WorkspaceSummary,
  canCloseAll: boolean,
  searchValue: string
): string {
  const hasQuery = Boolean(searchValue.trim());

  return `
    <div class="toolbar-card">
      <div class="toolbar-head">
        <div>
          <p class="section-kicker">${escapeHtml(copy.focusedWorkspace)}</p>
          <h2>${escapeHtml(copy.openStacks)}</h2>
        </div>
        <div class="toolbar-head-actions">
          <p class="toolbar-summary">${escapeHtml(copy.scopeSummary(Boolean(state.searchQuery.trim()), summary))}</p>
          <button class="ghost-btn destructive-btn" data-action="close-all"${canCloseAll ? '' : ' disabled'}>
            ${escapeHtml(copy.closeAllOpenTabs)}
          </button>
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
          <button
            class="toggle-chip ${state.duplicatesOnly ? 'active' : ''}"
            type="button"
            data-action="set-duplicates-only"
            data-enabled="${state.duplicatesOnly ? 'false' : 'true'}"
            aria-pressed="${state.duplicatesOnly ? 'true' : 'false'}"
          >
            ${escapeHtml(copy.duplicatesOnly)}
          </button>
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
      <div class="toolbar-foot">
        <div class="toolbar-foot-main">
          ${renderToolbarSignals(copy, state, summary)}
          <p class="toolbar-mini-note">${escapeHtml(hasQuery ? copy.liveSearchNote : copy.searchTip)}</p>
        </div>
        <p class="shortcut-hint">${escapeHtml(copy.shortcutHint)}</p>
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

function renderBulkBar(copy: NewtabCopy, state: AppState, visibleTabIds: number[]): string {
  const visibleSelection = state.selectedTabIds.filter((tabId) => visibleTabIds.includes(tabId));
  const hasSelection = visibleSelection.length > 0;
  const allVisibleSelected = visibleTabIds.length > 0 && visibleSelection.length === visibleTabIds.length;
  const hiddenSelectionCount = Math.max(0, state.selectedTabIds.length - visibleSelection.length);

  return `
    <div class="bulk-bar ${hasSelection ? 'active' : ''}">
      <div class="bulk-copy">
        <div class="bulk-title-row">
          <strong>${escapeHtml(hasSelection ? copy.selectedSummary(visibleSelection.length) : copy.noSelectionSummary)}</strong>
          <div class="bulk-status-row">
            ${renderStatusChip(copy.visibleChip(visibleTabIds.length))}
            ${renderStatusChip(hasSelection ? copy.visibleScopeOnly : copy.selectRowsHint, hasSelection ? 'primary' : 'default')}
            ${hiddenSelectionCount ? renderStatusChip(copy.hiddenSelectionChip(hiddenSelectionCount), 'warning') : ''}
          </div>
        </div>
        <span>${escapeHtml(hasSelection ? copy.selectedCopy : copy.emptySelectionCopy)}</span>
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
  `;
}

function renderGroupKind(copy: NewtabCopy, group: DisplayGroup): string {
  const label = group.kind === 'custom'
    ? copy.kindRule
    : group.kind === 'landing'
      ? copy.kindLanding
      : copy.kindDomain;

  return `<span class="stack-kind kind-${group.kind}">${escapeHtml(label)}</span>`;
}

function renderMonogram(value: string): string {
  const first = value.trim().charAt(0).toUpperCase() || '•';
  return `<span class="site-glyph" aria-hidden="true">${escapeHtml(first)}</span>`;
}

function renderTabRow(copy: NewtabCopy, tab: DisplayGroup['tabs'][number], query: string, selectedTabIds: Set<number>): string {
  // 这里把 URL 元信息压成“域名 + 路径”，目的是让长链接更容易扫描。
  let meta = tab.url;
  if (tab.hostname !== 'localhost') {
    try {
      const parsed = new URL(tab.url);
      meta = `${tab.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`;
    } catch {
      meta = tab.hostname || tab.url;
    }
  }

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
      >
        ${renderMonogram(tab.hostname || title)}
        <span class="tab-copy">
          <span class="tab-title-row">
            <span class="tab-title-text">${renderHighlightedText(title, query)}</span>
            ${tab.active ? `<span class="tab-badge">${escapeHtml(copy.activeTab)}</span>` : ''}
          </span>
          <span class="tab-meta">${renderHighlightedText(meta, query)}</span>
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
          ${renderGroupKind(copy, group)}
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
        </div>
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
      <div class="stack-head">
        <div class="stack-copy">
          <h3>${renderHighlightedText(group.label, query)}</h3>
          <div class="stack-meta-row">
            <span class="stack-meta-pill">${escapeHtml(copy.stackTabs(group.tabs.length))}</span>
            <span class="stack-meta-pill ${group.duplicateCount ? 'stack-meta-pill-warning' : 'stack-meta-pill-success'}">
              ${escapeHtml(group.duplicateCount ? copy.duplicatesBadge(group.duplicateCount) : copy.cleanBadge)}
            </span>
            ${group.windowId ? `<span class="stack-meta-pill">${escapeHtml(copy.windowBadge(group.windowId))}</span>` : ''}
            ${selectedCount ? `<span class="stack-meta-pill stack-meta-pill-primary">${escapeHtml(copy.selectedBadge(selectedCount))}</span>` : ''}
          </div>
        </div>
      </div>
      <ul class="tab-list">
        ${group.tabs.slice(0, STACK_PREVIEW_LIMIT).map((tab) => renderTabRow(copy, tab, query, selectedTabIds)).join('')}
      </ul>
      ${group.tabs.length > STACK_PREVIEW_LIMIT ? `<p class="overflow-note">${escapeHtml(copy.stackOverflow(group.tabs.length - STACK_PREVIEW_LIMIT))}</p>` : ''}
      <div class="stack-actions">
        <button class="primary-btn" data-action="close-group" data-group-id="${group.id}" data-group-label="${escapeHtml(groupLabel)}" data-tab-ids="${escapeHtml(tabIdsValue)}">
          ${escapeHtml(copy.closeStack)}
        </button>
        ${group.duplicateCount ? `
          <button class="ghost-btn" data-action="close-duplicates" data-group-id="${group.id}" data-tab-ids="${escapeHtml(tabIdsValue)}">
            ${escapeHtml(copy.closeDuplicates(group.duplicateCount))}
          </button>
        ` : ''}
      </div>
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
      <div class="sidebar-card">
        <div class="sidebar-head">
          <div class="sidebar-headline">
            ${renderPanelIcon('◔', 'primary')}
            <h2>${escapeHtml(copy.snapshotsTitle)}</h2>
          </div>
          <span>${summary.snapshotCount}</span>
        </div>
        <p class="empty-copy">${escapeHtml(copy.snapshotsIntro)}</p>
        <div class="group-actions">
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
                <div class="row-actions">
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
            <div class="deferred-copy">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(copy.recentTabCount(item.tabs.length))} · ${escapeHtml(formatRelativeTime(locale, item.closedAt))}</span>
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
          <a class="archive-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
            <span>${escapeHtml(item.title)}</span>
            <small>${escapeHtml(formatRelativeTime(locale, item.completedAt || item.createdAt))}</small>
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
      ${renderHero(copy, locale, summary)}
      <main class="workspace-layout">
        <section class="board">
          ${renderSearchToolbar(copy, state, summary, visible.groups.length > 0, searchValue)}
          ${renderBulkBar(copy, state, visible.visibleTabIds)}
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
