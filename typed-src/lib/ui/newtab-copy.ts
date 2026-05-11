import type { AppState } from '@/lib/app/state';
import type { WorkspaceSummary } from '@/lib/ui/newtab-presenter';

export interface NewtabCopy {
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
  rename: string;
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
  systemTitle: string;
  systemIntro: string;
  openSettings: string;
  refreshBoard: string;
  resetView: string;
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

// 复制量最大的部分是界面文案。抽到单独模块后，渲染文件只保留结构，
// 后续无论继续做英文优化还是恢复多语言，都不会再把模板文件越改越重。
export function getNewtabCopy(locale: AppState['settings']['language']): NewtabCopy {
  if (locale === 'zh-CN') {
    return {
      brandCaption: '重浏览器工作流的整理面板',
      heroTitle: '把散开的标签页，收成一个更清楚的工作台。',
      heroCopy: '先定位正在做的事，再把其余内容归档、暂存或批量处理。大动作之前也能先留一个可恢复的工作区快照。',
      heroOpenNow: (count) => `打开 · ${count}`,
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
      noDuplicateChip: '没有重复项',
      byWindowChip: '按窗口',
      recentOrderChip: '最近优先',
      select: '选择',
      selectedChip: (count) => `已选 · ${count}`,
      focusedWorkspace: '当前聚焦',
      openStacks: '打开的堆栈',
      toolbarCopy: '顶部控制区',
      scopeSummary: (hasQuery, summary) => hasQuery ? `当前搜索命中 ${summary.visibleTabs} 个标签页` : `当前打开 ${summary.totalTabs} 个标签页`,
      closeAllOpenTabs: '关闭全部打开标签页',
      searchPlaceholder: '搜索标签页、域名或堆栈名称',
      clearSearch: '清空搜索',
      smart: '智能',
      recent: '最近',
      duplicatesOnly: '重复项',
      merged: '合并视图',
      byWindow: '分窗口',
      liveSearchNote: '输入后会立即收敛结果',
      searchTip: '先搜索，再做批量操作',
      shortcutHint: '快捷键',
      selectedSummary: (count) => `已选中 ${count} 个标签页`,
      noSelectionSummary: '还没有选中任何标签页',
      visibleChip: (count) => `当前可见 ${count}`,
      visibleScopeOnly: '只对当前可见范围生效',
      selectRowsHint: '点击标签页左侧选择',
      hiddenSelectionChip: (count) => `另有 ${count} 个已选标签不在当前视图`,
      selectedCopy: '当前选择会跟随筛选和布局变化',
      emptySelectionCopy: '先选中需要处理的标签，再执行稍后、新窗口或关闭。',
      unselectVisible: '取消当前可见',
      selectVisible: '全选',
      clear: '清空',
      moveToLater: () => '稍后',
      newWindow: () => '新窗口',
      closeSelected: () => '关闭',
      kindRule: '自定义规则',
      kindLanding: '落地页',
      kindDomain: '域名',
      pin: '置顶',
      pinned: '已置顶',
      pinAria: (active) => active ? '取消置顶该堆栈' : '置顶该堆栈',
      reorder: '排序',
      reorderHint: '拖拽调整堆栈优先级',
      selectTab: '选择标签页',
      unselectTab: '取消选择标签页',
      activeTab: '当前活跃',
      later: '稍后',
      close: '关闭',
      rename: '重命名',
      stackTabs: (count) => `${count} 个标签页`,
      duplicatesBadge: (count) => `${count} 个重复项`,
      cleanBadge: '已清爽',
      windowBadge: (id) => `窗口 ${id}`,
      selectedBadge: (count) => `已选 ${count}`,
      stackOverflow: (count) => `还有 ${count} 个未展开`,
      closeStack: '关闭',
      closeDuplicates: () => '关闭重复项',
      windowView: '窗口视图',
      windowTitle: (id) => `窗口 ${id}`,
      windowTabCount: (count) => `${count} 个标签页`,
      startHere: '从这里开始',
      gettingStarted: '开始整理',
      firstSession: '第一次使用',
      scopedCleanup: '收窄后处理',
      filteredView: '当前已收窄视图',
      workspaceClear: '工作区已清空',
      noOpenTabs: '当前没有打开的标签页',
      guideCalloutDefault: '先看堆栈，再决定要搜、要选，还是直接关闭。',
      guideCalloutFirst: '先试一次搜索和全选，你会更快理解这个面板的节奏。',
      guideCalloutScoped: '结果已经收窄，接下来做批量动作会更稳。',
      guideCalloutClear: '可以恢复快照，或者回到浏览器继续打开新的工作内容。',
      guideDefaultPills: ['搜索', '选择', '关闭'],
      guideFirstPills: ['搜索', '全选', '稍后'],
      guideScopedPills: ['当前结果', '低风险', '批量处理'],
      guideClearPills: ['已清空', '可恢复', '继续工作'],
      guideDefaultSteps: [
        { title: '先看堆栈', copy: '先判断哪些是项目、哪些是入口页、哪些是重复标签。' },
        { title: '需要时再搜索', copy: '搜索会直接收窄整个面板，适合先定位一个主题再处理。' },
        { title: '最后批量动作', copy: '选中后可以统一移到稍后、移到新窗口，或直接关闭。' }
      ],
      guideFirstSteps: [
        { title: '先搜一个关键词', copy: '比如项目名、客户名、域名，快速理解面板的组织方式。' },
        { title: '再试一次全选', copy: '对当前结果全选，体验批量动作的边界。' },
        { title: '用稍后代替立即关闭', copy: '不确定要不要关时，先放到稍后处理。' }
      ],
      guideScopedSteps: [
        { title: '范围已经变小', copy: '当前动作只会作用在你看见的结果里。' },
        { title: '优先去重', copy: '如果只是重复页签，优先用重复项筛选。' },
        { title: '再做批量关闭', copy: '这样误关的概率会明显更低。' }
      ],
      guideClearSteps: [
        { title: '标签页已经清空', copy: '当前浏览器没有需要继续分拣的工作内容。' },
        { title: '快照还能恢复', copy: '如果刚才动作太大，可以直接恢复一个快照。' },
        { title: '继续新的工作流', copy: '回到浏览器继续开标签，这里会自动重新聚合。' }
      ],
      snapshotsTitle: '工作区快照',
      snapshotsIntro: '在大动作前留一个版本，方便后面整体恢复。',
      systemTitle: '系统入口',
      systemIntro: '设置、刷新和视图重置放在这里。',
      openSettings: '设置',
      refreshBoard: '刷新面板',
      resetView: '重置视图',
      exportSnapshot: '导出快照',
      importSnapshot: '导入快照',
      all: '全部',
      noTaggedSnapshots: '当前标签下没有快照',
      noSnapshots: '还没有保存任何快照',
      edit: '编辑',
      restore: '恢复',
      delete: '删除',
      laterDock: '稍后处理',
      laterEmpty: '这里还没有内容。把暂时不处理的标签页移过来，主面板会更干净。',
      done: '完成',
      dismiss: '移除',
      recentClosures: '最近关闭',
      recentTabCount: (count) => `${count} 个标签页`,
      recentEmpty: '这里会保留最近关闭的堆栈，方便恢复或丢弃。',
      archive: '归档',
      archiveEmpty: '完成的稍后处理会落到这里，形成一份轻量历史。',
      snapshotEyebrow: '快照',
      deleteSnapshot: '删除快照',
      cancel: '取消',
      keepIt: '保留',
      deleteConfirm: (name) => `确认删除“${name}”吗？`,
      deleting: '删除中…',
      exportSnapshotTitle: '导出当前工作区快照',
      editSnapshotTitle: '编辑快照信息',
      modalCopy: '你可以给快照补充名字、标签和备注，后面更容易识别。',
      snapshotName: '快照名称',
      snapshotTags: '标签',
      snapshotNote: '备注',
      snapshotNamePlaceholder: '比如：Fabric 客户跟进',
      snapshotTagsPlaceholder: '比如：fabric, customer, demo',
      snapshotNotePlaceholder: '补充一下这份快照为什么值得保留。',
      exporting: '导出中…',
      saveSnapshot: '保存快照',
      saving: '保存中…',
      noVisibleResult: '当前没有可见结果',
      noMatchTitle: '没有匹配到标签页',
      noMatchCopy: '换个更宽松的关键词，或者取消当前过滤条件试试。',
      showAllTabs: '显示全部标签页',
      workspaceComplete: '工作区已整理完成',
      workspaceClearTitle: '当前工作区已经清空',
      workspaceClearCopy: '这里没有还需要继续分拣的打开标签页。需要时可以恢复快照。'
    };
  }

  return {
    brandCaption: 'Workspace control for heavy browser sessions',
    heroTitle: 'Turn scattered tabs into one calmer workspace.',
    heroCopy: 'Find what matters now, park the rest, and keep a recoverable snapshot before larger cleanup moves.',
    heroOpenNow: (count) => `Open · ${count}`,
    heroPinned: (count) => `Pinned · ${count}`,
    heroSnapshots: (count) => `Snapshots · ${count}`,
    workspaceBrief: 'Workspace brief',
    briefTitle: 'The default should already be obvious',
    visibleNow: 'Visible now',
    duplicates: 'Duplicates',
    selected: 'Selected',
    laterQueue: 'Later queue',
    flowSearch: 'Search',
    flowSelect: 'Select',
    flowMove: 'Move or close',
    briefNote: 'Reduce scope first, then act. Take a snapshot before bigger cleanup passes so rollback stays easy.',
    metricWorkspaceNow: 'Workspace now',
    metricWorkspaceNote: (summary) => `${summary.visibleGroups} stacks · ${summary.windowCount} windows`,
    metricCleanupRisk: 'Needs cleanup',
    metricCleanupNote: (count) => count ? 'There are still duplicates in the current scope' : 'No duplicates in the current scope',
    metricSelection: 'Current selection',
    metricRecovery: 'Recovery',
    metricSelectionNote: 'Ready for batch actions',
    metricRecoveryNote: (summary) => `${summary.snapshotCount} snapshots · ${summary.deferredCount} later items`,
    searchChip: (query) => `Search · "${query}"`,
    fullWorkspace: 'Full workspace',
    tabsChip: (count) => `${count} tabs`,
    stacksChip: (count) => `${count} stacks`,
    duplicateChip: (count) => `${count} duplicates`,
    noDuplicateChip: 'No duplicates',
    byWindowChip: 'By window',
    recentOrderChip: 'Recent first',
    select: 'Select',
    selectedChip: (count) => `Selected · ${count}`,
    focusedWorkspace: 'Focused workspace',
    openStacks: 'Open stacks',
    toolbarCopy: 'Control bar',
    scopeSummary: (hasQuery, summary) => hasQuery ? `${summary.visibleTabs} tabs match the current search` : `${summary.totalTabs} tabs currently open`,
    closeAllOpenTabs: 'Close all open tabs',
    searchPlaceholder: 'Search tabs, domains, or stack names',
    clearSearch: 'Clear search',
    smart: 'Smart',
    recent: 'Recent',
    duplicatesOnly: 'Duplicates',
    merged: 'Merged',
    byWindow: 'By window',
    liveSearchNote: 'Results narrow as you type',
    searchTip: 'Search first, then batch act',
    shortcutHint: 'Shortcuts',
    selectedSummary: (count) => `${count} tabs selected`,
    noSelectionSummary: 'Nothing selected yet',
    visibleChip: (count) => `${count} visible`,
    visibleScopeOnly: 'Applies to the visible scope only',
    selectRowsHint: 'Select tabs from the left edge',
    hiddenSelectionChip: (count) => `${count} selected tabs are outside the current view`,
    selectedCopy: 'Selections follow the current filters and layout',
    emptySelectionCopy: 'Select the tabs you want first, then move them to Later, a new window, or close them.',
    unselectVisible: 'Unselect visible',
    selectVisible: 'Select all',
    clear: 'Clear',
    moveToLater: () => 'Later',
    newWindow: () => 'New window',
    closeSelected: () => 'Close',
    kindRule: 'Custom rule',
    kindLanding: 'Landing',
    kindDomain: 'Domain',
    pin: 'Pin',
    pinned: 'Pinned',
    pinAria: (active) => active ? 'Unpin this stack' : 'Pin this stack',
    reorder: 'Reorder',
    reorderHint: 'Drag to reorder stack priority',
    selectTab: 'Select tab',
    unselectTab: 'Unselect tab',
    activeTab: 'Active',
    later: 'Later',
    close: 'Close',
    rename: 'Rename',
    stackTabs: (count) => `${count} tabs`,
    duplicatesBadge: (count) => `${count} duplicates`,
    cleanBadge: 'Clean',
    windowBadge: (id) => `Window ${id}`,
    selectedBadge: (count) => `Selected ${count}`,
    stackOverflow: (count) => `${count} more hidden`,
    closeStack: 'Close',
    closeDuplicates: () => 'Close duplicates',
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
    guideCalloutDefault: 'Review the stacks first, then decide whether to search, select, or close.',
    guideCalloutFirst: 'Try one search and one select-all pass first. The board becomes easier to trust quickly.',
    guideCalloutScoped: 'The scope is already narrow, so batch actions are safer now.',
    guideCalloutClear: 'Restore a snapshot, or return to the browser and open the next set of work.',
    guideDefaultPills: ['Search', 'Select', 'Close'],
    guideFirstPills: ['Search', 'Select all', 'Later'],
    guideScopedPills: ['Current scope', 'Lower risk', 'Batch ready'],
    guideClearPills: ['Clear', 'Recoverable', 'Ready again'],
    guideDefaultSteps: [
      { title: 'Review the stacks first', copy: 'See which tabs belong to a project, which are landing pages, and which are duplicates.' },
      { title: 'Search only when needed', copy: 'Search narrows the whole board, which is useful before a targeted cleanup pass.' },
      { title: 'Batch act last', copy: 'Once selected, tabs can move to Later, a new window, or close together.' }
    ],
    guideFirstSteps: [
      { title: 'Start with one keyword', copy: 'A project name, client name, or domain is usually enough to understand the grouping behavior.' },
      { title: 'Try one select-all pass', copy: 'That gives you a quick feel for what batch actions will touch.' },
      { title: 'Use Later before delete', copy: 'When unsure, park the tabs instead of closing them immediately.' }
    ],
    guideScopedSteps: [
      { title: 'The scope is already smaller', copy: 'The next action affects only what is visible now.' },
      { title: 'Deduplicate first', copy: 'If the board mostly contains repeats, start with duplicates instead of full-stack close.' },
      { title: 'Then run the batch action', copy: 'This keeps cleanup faster without raising the mistake rate.' }
    ],
    guideClearSteps: [
      { title: 'The board is clear', copy: 'There are no open tabs left here that still need triage.' },
      { title: 'Snapshots can still recover it', copy: 'If the last move was too aggressive, restore a snapshot.' },
      { title: 'Keep working', copy: 'As you open tabs again, the board will rebuild itself.' }
    ],
    snapshotsTitle: 'Workspace snapshots',
    snapshotsIntro: 'Take a version before larger cleanup moves so the whole session can come back together.',
    systemTitle: 'System',
    systemIntro: 'Keep core controls in one place before you move into snapshots and history.',
    openSettings: 'Settings',
    refreshBoard: 'Refresh',
    resetView: 'Reset view',
    exportSnapshot: 'Export snapshot',
    importSnapshot: 'Import snapshot',
    all: 'All',
    noTaggedSnapshots: 'No snapshots match this tag',
    noSnapshots: 'No snapshots saved yet',
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
    snapshotEyebrow: 'Snapshot',
    deleteSnapshot: 'Delete snapshot',
    cancel: 'Cancel',
    keepIt: 'Keep it',
    deleteConfirm: (name) => `Delete "${name}"?`,
    deleting: 'Deleting…',
    exportSnapshotTitle: 'Export current workspace snapshot',
    editSnapshotTitle: 'Edit snapshot metadata',
    modalCopy: 'Name the snapshot, add tags, and leave a note so restore decisions stay obvious later.',
    snapshotName: 'Snapshot name',
    snapshotTags: 'Tags',
    snapshotNote: 'Note',
    snapshotNamePlaceholder: 'For example: Fabric customer follow-up',
    snapshotTagsPlaceholder: 'For example: fabric, customer, demo',
    snapshotNotePlaceholder: 'Capture why this snapshot matters before you save it.',
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
