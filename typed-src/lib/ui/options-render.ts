import type { AppLocale } from '@/lib/domain/settings';

export interface OptionsDraftValues {
  language: AppLocale;
  soundEnabled: boolean;
  confettiEnabled: boolean;
  hiddenDomainsText: string;
  customGroupRulesText: string;
  landingPageRulesText: string;
}

export interface OptionsRenderState {
  draft: OptionsDraftValues;
  saved: boolean;
  errors: string[];
}

interface OptionsCopy {
  brandCaption: string;
  heroTitle: string;
  heroBody: string;
  hiddenDomainsPill(count: number): string;
  customRulesPill(count: number): string;
  landingRulesPill(count: number): string;
  overviewEyebrow: string;
  readinessLabel: string;
  noiseLabel: string;
  namedStacksLabel: string;
  landingCollapseLabel: string;
  celebrationLabel: string;
  heroNote(errors: number): string;
  metricVisibilityLabel: string;
  metricVisibilityNote(count: number): string;
  metricGroupingLabel: string;
  metricGroupingNote(valid: boolean): string;
  metricLandingLabel: string;
  metricLandingNote(valid: boolean): string;
  errorTitle: string;
  languageKicker: string;
  languageTitle: string;
  languageCopy: string;
  languageBrandNote: string;
  englishTitle: string;
  englishNote: string;
  chineseTitle: string;
  chineseNote: string;
  experienceKicker: string;
  experienceTitle: string;
  experienceCopy: string;
  soundTitle: string;
  soundNote: string;
  confettiTitle: string;
  confettiNote: string;
  visibilityKicker: string;
  visibilityTitle: string;
  visibilityCopy: string;
  hiddenDomainsLabel: string;
  hiddenDomainsHelp: string;
  hiddenDomainsPlaceholder: string;
  domainCount(count: number): string;
  presentationOnly: string;
  groupingKicker: string;
  groupingTitle: string;
  groupingCopy: string;
  customRulesLabel: string;
  customRulesHelp: string;
  customRulesPlaceholder: string;
  ruleCount(count: number): string;
  validJson: string;
  invalidJson: string;
  landingKicker: string;
  landingTitle: string;
  landingCopy: string;
  landingRulesLabel: string;
  landingRulesHelp: string;
  landingRulesPlaceholder: string;
  saveTitle(errors: number, saved: boolean): string;
  saveCopy(errors: number): string;
  saveButton: string;
  resetButton: string;
  savedNote: string;
  setupEyebrow: string;
  setupTitle: string;
  setupStepOneTitle: string;
  setupStepOneCopy: string;
  setupStepTwoTitle: string;
  setupStepTwoCopy: string;
  setupStepThreeTitle: string;
  setupStepThreeCopy: string;
  safeEyebrow: string;
  safeTitle: string;
  safeOne: string;
  safeTwo: string;
  safeThree: string;
  examplesEyebrow: string;
  examplesTitle: string;
  customExampleTitle: string;
  landingExampleTitle: string;
}

function getOptionsCopy(locale: AppLocale): OptionsCopy {
  if (locale === 'zh-CN') {
    return {
      brandCaption: '把展示、归类和清理节奏调成更适合你的工作方式',
      heroTitle: '先把规则设好，工作区自然会更清爽。',
      heroBody: '你不需要改代码，就能决定 Tab Harbor 怎么隐藏噪音、命名分组，以及把哪些首页型页面收进统一入口。',
      hiddenDomainsPill: (count) => `隐藏域名 · ${count}`,
      customRulesPill: (count) => `命名规则 · ${count}`,
      landingRulesPill: (count) => `归并规则 · ${count}`,
      overviewEyebrow: '配置概览',
      readinessLabel: '当前可直接上手',
      noiseLabel: '噪音过滤',
      namedStacksLabel: '命名分组',
      landingCollapseLabel: '首页归并',
      celebrationLabel: '动效反馈',
      heroNote: (errors) => (
        errors
          ? `保存前还有 ${errors} 个配置问题需要处理。`
          : '这些设置只影响展示和分组，不会替你关闭或移动任何真实标签页。'
      ),
      metricVisibilityLabel: '可见性控制',
      metricVisibilityNote: (count) => count ? '这些域名会从主面板里收起' : '还没有隐藏任何域名',
      metricGroupingLabel: '命名分组',
      metricGroupingNote: (valid) => valid ? '把客户、项目或工具整理成高信号分组' : 'JSON 结构还需要修正',
      metricLandingLabel: '首页归并',
      metricLandingNote: (valid) => valid ? '仪表盘、收件箱之类的入口页可以统一收纳' : 'JSON 结构还需要修正',
      errorTitle: '先处理下面这些问题，再保存',
      languageKicker: '显示语言',
      languageTitle: '界面语言',
      languageCopy: '这里切换的是界面文案，不会动你的标签页内容。切换后当前设置页会立即预览新的语言。',
      languageBrandNote: '品牌名会始终保留为 Tab Harbor，不做翻译。',
      englishTitle: 'English',
      englishNote: '简洁直接，适合偏英文工作流。',
      chineseTitle: '简体中文',
      chineseNote: '中文文案会按产品语境重写，不做生硬直译。',
      experienceKicker: '反馈体验',
      experienceTitle: '声音和动效',
      experienceCopy: '想要安静一点，就把反馈关掉；想让大批量整理更有节奏感，也可以保留提醒。',
      soundTitle: '关闭标签时播放提示音',
      soundNote: '在完成关闭动作后，给一个轻量确认反馈。',
      confettiTitle: '大批量整理时显示庆祝动效',
      confettiNote: '适合在完成一轮明显收敛时给一点反馈，不会影响实际数据。',
      visibilityKicker: '可见性',
      visibilityTitle: '收起常驻干扰项',
      visibilityCopy: '每行一个域名。被隐藏后，标签页仍然会保持打开，只是不再出现在主面板里。',
      hiddenDomainsLabel: '隐藏域名',
      hiddenDomainsHelp: '适合首页、信息流、启动页，或者那些你经常开着但并不想反复看到的后台页面。',
      hiddenDomainsPlaceholder: 'chrome.com\nnews.ycombinator.com',
      domainCount: (count) => `${count} 个域名`,
      presentationOnly: '只影响展示',
      groupingKicker: '分组',
      groupingTitle: '命名高信号堆栈',
      groupingCopy: '自定义分组最好保持少而准。客户、项目、设计稿、分析面板，这些值得被你一眼认出来。',
      customRulesLabel: '命名分组规则（JSON 数组）',
      customRulesHelp: '规则越清楚，面板越好扫。宁可少几个稳定分组，也不要堆很多琐碎条件。',
      customRulesPlaceholder: '[{"groupKey":"client-a","groupLabel":"Client A","hostnameEndsWith":".figma.com"}]',
      ruleCount: (count) => `${count} 条规则`,
      validJson: 'JSON 正常',
      invalidJson: 'JSON 有问题',
      landingKicker: '首页归并',
      landingTitle: '把入口页收成一类',
      landingCopy: '日历、收件箱、总览页这类“入口页面”可以收成落地页分组，让工作标签更突出。',
      landingRulesLabel: '额外落地页规则（JSON 数组）',
      landingRulesHelp: '只给真正的控制台页面用。仍需逐个查看的文档、工单、设计稿，尽量不要收进去。',
      landingRulesPlaceholder: '[{"hostname":"calendar.google.com","pathExact":["/calendar/u/0/r"]}]',
      saveTitle: (errors, saved) => (
        errors
          ? '还有问题待修正'
          : saved
            ? '设置已保存'
            : '可以保存'
      ),
      saveCopy: (errors) => (
        errors
          ? '把上面的校验问题处理完，再保存一次。'
          : '保存只会更新展示和分组规则，不会直接关闭、移动或重排你的真实标签页。'
      ),
      saveButton: '保存设置',
      resetButton: '恢复默认',
      savedNote: '已保存',
      setupEyebrow: '建议顺序',
      setupTitle: '先做这三步',
      setupStepOneTitle: '1. 先收掉真正的噪音',
      setupStepOneCopy: '只隐藏那些你不需要在主面板里反复看到的页面，例如首页、信息流或后台控制页。',
      setupStepTwoTitle: '2. 只给高信号内容命名',
      setupStepTwoCopy: '客户、项目、工具这类有辨识度的堆栈，最值得做成命名分组。',
      setupStepThreeTitle: '3. 落地页规则保持克制',
      setupStepThreeCopy: '把首页型页面收起来，但仍在推进中的工作文档最好继续保留为单独标签。',
      safeEyebrow: '保存后的影响',
      safeTitle: '这套设置是安全的',
      safeOne: '被隐藏的域名只会从 Tab Harbor 的面板里收起，不会关掉浏览器里的真实标签页。',
      safeTwo: '命名规则和落地页规则只影响归类、展示，以及后续批量操作的作用范围。',
      safeThree: '如果 JSON 写错了，保存会被拦住，不会悄悄把你的工作区配置写坏。',
      examplesEyebrow: 'JSON 示例',
      examplesTitle: '可直接参考的结构',
      customExampleTitle: '命名分组规则',
      landingExampleTitle: '落地页规则'
    };
  }

  return {
    brandCaption: 'Tune grouping, visibility, and cleanup control around the way you actually work',
    heroTitle: 'Set the rules once. Keep the workspace obvious.',
    heroBody: 'Without touching code, decide what Tab Harbor hides, which stacks deserve a real name, and which command-center pages collapse into a calmer landing view.',
    hiddenDomainsPill: (count) => `Hidden domains · ${count}`,
    customRulesPill: (count) => `Named rules · ${count}`,
    landingRulesPill: (count) => `Landing rules · ${count}`,
    overviewEyebrow: 'Configuration overview',
    readinessLabel: 'Ready to use',
    noiseLabel: 'Noise filters',
    namedStacksLabel: 'Named stacks',
    landingCollapseLabel: 'Landing collapse',
    celebrationLabel: 'Celebration',
    heroNote: (errors) => (
      errors
        ? `${errors} validation issue${errors === 1 ? '' : 's'} need attention before save.`
        : 'These settings only affect presentation and grouping. They never close or move real tabs on their own.'
    ),
    metricVisibilityLabel: 'Visibility control',
    metricVisibilityNote: (count) => count ? 'These domains disappear from the board' : 'No domains hidden yet',
    metricGroupingLabel: 'Named grouping',
    metricGroupingNote: (valid) => valid ? 'Turn clients, tools, or projects into easy-to-scan stacks' : 'JSON needs attention before save',
    metricLandingLabel: 'Landing collapse',
    metricLandingNote: (valid) => valid ? 'Dashboards and inboxes can collapse into one calmer stack' : 'JSON needs attention before save',
    errorTitle: 'Fix these issues before saving',
    languageKicker: 'Display language',
    languageTitle: 'Interface language',
    languageCopy: 'This changes the UI copy only. The settings page previews the new language immediately so you can decide before saving.',
    languageBrandNote: 'The brand name always stays as Tab Harbor.',
    englishTitle: 'English',
    englishNote: 'Direct, compact copy for English-heavy workflows.',
    chineseTitle: 'Simplified Chinese',
    chineseNote: 'Localized product copy, not a word-for-word translation.',
    experienceKicker: 'Experience',
    experienceTitle: 'Feedback and celebration',
    experienceCopy: 'Keep the workspace quiet, or leave subtle acknowledgement in place when a cleanup action lands.',
    soundTitle: 'Play a close confirmation sound',
    soundNote: 'Adds a short audio cue after a tab-close action completes.',
    confettiTitle: 'Show confetti on bigger cleanup moments',
    confettiNote: 'A lightweight visual acknowledgement when you finish a noticeable cleanup pass.',
    visibilityKicker: 'Visibility',
    visibilityTitle: 'Hide recurring background noise',
    visibilityCopy: 'Use one domain per line. Hidden domains disappear from the board, while the real browser tabs remain open.',
    hiddenDomainsLabel: 'Hidden domains',
    hiddenDomainsHelp: 'Best for home pages, feeds, launch tabs, or background pages you rarely need to scan one by one.',
    hiddenDomainsPlaceholder: 'chrome.com\nnews.ycombinator.com',
    domainCount: (count) => `${count} domain${count === 1 ? '' : 's'}`,
    presentationOnly: 'Presentation only',
    groupingKicker: 'Grouping',
    groupingTitle: 'Create named high-signal stacks',
    groupingCopy: 'Custom groups work best when they stay memorable. Clients, projects, design files, and core tools are usually enough.',
    customRulesLabel: 'Custom group rules (JSON array)',
    customRulesHelp: 'Keep these specific. A few clear stack names are easier to trust than dozens of narrow one-off rules.',
    customRulesPlaceholder: '[{"groupKey":"client-a","groupLabel":"Client A","hostnameEndsWith":".figma.com"}]',
    ruleCount: (count) => `${count} rule${count === 1 ? '' : 's'}`,
    validJson: 'Valid JSON',
    invalidJson: 'Invalid JSON',
    landingKicker: 'Landing',
    landingTitle: 'Collapse command-center pages',
    landingCopy: 'Use landing rules for dashboards, inboxes, calendars, and other overview pages so working tabs stay easier to scan.',
    landingRulesLabel: 'Extra landing page rules (JSON array)',
    landingRulesHelp: 'Reserve this for real command centers. Active documents, tickets, or design files usually deserve to stay visible.',
    landingRulesPlaceholder: '[{"hostname":"calendar.google.com","pathExact":["/calendar/u/0/r"]}]',
    saveTitle: (errors, saved) => (
      errors
        ? 'Fix issues before saving'
        : saved
          ? 'Settings saved'
          : 'Ready to save'
    ),
    saveCopy: (errors) => (
      errors
        ? 'Resolve the validation issues above, then save again.'
        : 'Saving only updates presentation and grouping rules. It does not close, move, or reorder live tabs.'
    ),
    saveButton: 'Save settings',
    resetButton: 'Reset defaults',
    savedNote: 'Saved',
    setupEyebrow: 'Suggested order',
    setupTitle: 'Start with these three moves',
    setupStepOneTitle: '1. Hide real noise',
    setupStepOneCopy: 'Only suppress pages you never want in the main board, such as feeds, launch tabs, or dashboards.',
    setupStepTwoTitle: '2. Name only what matters',
    setupStepTwoCopy: 'Clients, projects, and tools you instantly recognize are the best candidates for named stacks.',
    setupStepThreeTitle: '3. Keep landing rules narrow',
    setupStepThreeCopy: 'Collapse inboxes and command centers, but leave true working tabs visible when they still need attention.',
    safeEyebrow: 'What changes after save',
    safeTitle: 'Safe by design',
    safeOne: 'Hidden domains disappear from the Tab Harbor board, but the actual browser tabs remain open.',
    safeTwo: 'Custom and landing rules only affect grouping, presentation, and cleanup targeting.',
    safeThree: 'Invalid JSON blocks save, so you do not silently break the workspace configuration.',
    examplesEyebrow: 'JSON examples',
    examplesTitle: 'Working shapes',
    customExampleTitle: 'Custom group rule',
    landingExampleTitle: 'Landing page rule'
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function countNonEmptyLines(value: string): number {
  return value
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .length;
}

function readJsonArrayStats(value: string): { count: number; valid: boolean } {
  const trimmed = value.trim();
  if (!trimmed) return { count: 0, valid: true };

  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return { count: 0, valid: false };
    return { count: parsed.length, valid: true };
  } catch {
    return { count: 0, valid: false };
  }
}

function renderStatChip(label: string, tone: 'default' | 'primary' | 'success' | 'warning' = 'default'): string {
  return `<span class="stat-chip ${tone !== 'default' ? `stat-chip-${tone}` : ''}">${escapeHtml(label)}</span>`;
}

function renderBrand(copy: OptionsCopy): string {
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

export function renderOptions(root: HTMLElement, view: OptionsRenderState): void {
  const { draft, saved, errors } = view;
  const copy = getOptionsCopy(draft.language);
  const hiddenDomainCount = countNonEmptyLines(draft.hiddenDomainsText);
  const customGroupStats = readJsonArrayStats(draft.customGroupRulesText);
  const landingRuleStats = readJsonArrayStats(draft.landingPageRulesText);
  const activeCelebrations = [draft.soundEnabled, draft.confettiEnabled].filter(Boolean).length;

  root.innerHTML = `
    <div class="options-shell">
      <header class="options-hero">
        <div class="options-hero-copy">
          ${renderBrand(copy)}
          <h1>${escapeHtml(copy.heroTitle)}</h1>
          <p>${escapeHtml(copy.heroBody)}</p>
          <div class="hero-pill-row">
            <span class="hero-pill">${escapeHtml(copy.hiddenDomainsPill(hiddenDomainCount))}</span>
            <span class="hero-pill">${escapeHtml(copy.customRulesPill(customGroupStats.count))}</span>
            <span class="hero-pill">${escapeHtml(copy.landingRulesPill(landingRuleStats.count))}</span>
          </div>
        </div>
        <div class="options-hero-brief">
          <p class="eyebrow">${escapeHtml(copy.overviewEyebrow)}</p>
          <h2>${escapeHtml(copy.readinessLabel)}</h2>
          <div class="hero-stat-grid">
            <div class="hero-stat-card">
              <span>${escapeHtml(copy.noiseLabel)}</span>
              <strong>${hiddenDomainCount}</strong>
            </div>
            <div class="hero-stat-card">
              <span>${escapeHtml(copy.namedStacksLabel)}</span>
              <strong>${customGroupStats.count}</strong>
            </div>
            <div class="hero-stat-card">
              <span>${escapeHtml(copy.landingCollapseLabel)}</span>
              <strong>${landingRuleStats.count}</strong>
            </div>
            <div class="hero-stat-card">
              <span>${escapeHtml(copy.celebrationLabel)}</span>
              <strong>${activeCelebrations}/2</strong>
            </div>
          </div>
          <p class="hero-note">${escapeHtml(copy.heroNote(errors.length))}</p>
        </div>
      </header>

      <section class="options-metric-strip" aria-label="Settings summary">
        <article class="options-metric-card">
          <span class="options-metric-label">${escapeHtml(copy.metricVisibilityLabel)}</span>
          <strong>${hiddenDomainCount}</strong>
          <span class="options-metric-note">${escapeHtml(copy.metricVisibilityNote(hiddenDomainCount))}</span>
        </article>
        <article class="options-metric-card">
          <span class="options-metric-label">${escapeHtml(copy.metricGroupingLabel)}</span>
          <strong>${customGroupStats.count}</strong>
          <span class="options-metric-note">${escapeHtml(copy.metricGroupingNote(customGroupStats.valid))}</span>
        </article>
        <article class="options-metric-card">
          <span class="options-metric-label">${escapeHtml(copy.metricLandingLabel)}</span>
          <strong>${landingRuleStats.count}</strong>
          <span class="options-metric-note">${escapeHtml(copy.metricLandingNote(landingRuleStats.valid))}</span>
        </article>
      </section>

      <div class="options-layout">
        <form id="settings-form" class="options-panel">
          ${errors.length ? `
            <div class="error-card" role="alert">
              <strong>${escapeHtml(copy.errorTitle)}</strong>
              <ul class="error-list">
                ${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <section class="setting-card language-card">
            <div class="setting-head">
              <div>
                <p class="section-kicker">${escapeHtml(copy.languageKicker)}</p>
                <h2>${escapeHtml(copy.languageTitle)}</h2>
              </div>
              <p class="section-copy">${escapeHtml(copy.languageCopy)}</p>
            </div>
            <div class="language-choice-grid">
              <label class="language-choice ${draft.language === 'en' ? 'active' : ''}">
                <input type="radio" name="language" value="en" data-role="language-input" ${draft.language === 'en' ? 'checked' : ''}>
                <div class="language-choice-copy">
                  <strong>${escapeHtml(copy.englishTitle)}</strong>
                  <span>${escapeHtml(copy.englishNote)}</span>
                </div>
              </label>
              <label class="language-choice ${draft.language === 'zh-CN' ? 'active' : ''}">
                <input type="radio" name="language" value="zh-CN" data-role="language-input" ${draft.language === 'zh-CN' ? 'checked' : ''}>
                <div class="language-choice-copy">
                  <strong>${escapeHtml(copy.chineseTitle)}</strong>
                  <span>${escapeHtml(copy.chineseNote)}</span>
                </div>
              </label>
            </div>
            <p class="setting-caption">${escapeHtml(copy.languageBrandNote)}</p>
          </section>

          <section class="setting-card">
            <div class="setting-head">
              <div>
                <p class="section-kicker">${escapeHtml(copy.experienceKicker)}</p>
                <h2>${escapeHtml(copy.experienceTitle)}</h2>
              </div>
              <p class="section-copy">${escapeHtml(copy.experienceCopy)}</p>
            </div>
            <div class="toggle-grid">
              <label class="toggle-tile">
                <div>
                  <strong>${escapeHtml(copy.soundTitle)}</strong>
                  <span>${escapeHtml(copy.soundNote)}</span>
                </div>
                <input type="checkbox" name="soundEnabled" ${draft.soundEnabled ? 'checked' : ''}>
              </label>
              <label class="toggle-tile">
                <div>
                  <strong>${escapeHtml(copy.confettiTitle)}</strong>
                  <span>${escapeHtml(copy.confettiNote)}</span>
                </div>
                <input type="checkbox" name="confettiEnabled" ${draft.confettiEnabled ? 'checked' : ''}>
              </label>
            </div>
          </section>

          <section class="setting-card">
            <div class="setting-head">
              <div>
                <p class="section-kicker">${escapeHtml(copy.visibilityKicker)}</p>
                <h2>${escapeHtml(copy.visibilityTitle)}</h2>
              </div>
              <p class="section-copy">${escapeHtml(copy.visibilityCopy)}</p>
            </div>
            <label class="field">
              <span>${escapeHtml(copy.hiddenDomainsLabel)}</span>
              <p class="field-copy">${escapeHtml(copy.hiddenDomainsHelp)}</p>
              <textarea name="hiddenDomains" rows="6" placeholder="${escapeHtml(copy.hiddenDomainsPlaceholder)}">${escapeHtml(draft.hiddenDomainsText)}</textarea>
              <div class="field-meta-row">
                ${renderStatChip(copy.domainCount(hiddenDomainCount))}
                ${renderStatChip(copy.presentationOnly, 'success')}
              </div>
            </label>
          </section>

          <section class="setting-card">
            <div class="setting-head">
              <div>
                <p class="section-kicker">${escapeHtml(copy.groupingKicker)}</p>
                <h2>${escapeHtml(copy.groupingTitle)}</h2>
              </div>
              <p class="section-copy">${escapeHtml(copy.groupingCopy)}</p>
            </div>
            <label class="field">
              <span>${escapeHtml(copy.customRulesLabel)}</span>
              <p class="field-copy">${escapeHtml(copy.customRulesHelp)}</p>
              <textarea name="customGroupRules" rows="12" placeholder="${escapeHtml(copy.customRulesPlaceholder)}">${escapeHtml(draft.customGroupRulesText)}</textarea>
              <div class="field-meta-row">
                ${renderStatChip(copy.ruleCount(customGroupStats.count))}
                ${renderStatChip(customGroupStats.valid ? copy.validJson : copy.invalidJson, customGroupStats.valid ? 'success' : 'warning')}
              </div>
            </label>
          </section>

          <section class="setting-card">
            <div class="setting-head">
              <div>
                <p class="section-kicker">${escapeHtml(copy.landingKicker)}</p>
                <h2>${escapeHtml(copy.landingTitle)}</h2>
              </div>
              <p class="section-copy">${escapeHtml(copy.landingCopy)}</p>
            </div>
            <label class="field">
              <span>${escapeHtml(copy.landingRulesLabel)}</span>
              <p class="field-copy">${escapeHtml(copy.landingRulesHelp)}</p>
              <textarea name="landingPageRules" rows="10" placeholder="${escapeHtml(copy.landingRulesPlaceholder)}">${escapeHtml(draft.landingPageRulesText)}</textarea>
              <div class="field-meta-row">
                ${renderStatChip(copy.ruleCount(landingRuleStats.count))}
                ${renderStatChip(landingRuleStats.valid ? copy.validJson : copy.invalidJson, landingRuleStats.valid ? 'success' : 'warning')}
              </div>
            </label>
          </section>

          <div class="save-bar">
            <div class="save-copy">
              <strong>${escapeHtml(copy.saveTitle(errors.length, saved))}</strong>
              <span>${escapeHtml(copy.saveCopy(errors.length))}</span>
            </div>
            <div class="actions-bar">
              <button class="primary-btn" type="submit">${escapeHtml(copy.saveButton)}</button>
              <button class="ghost-btn" type="button" id="reset-btn">${escapeHtml(copy.resetButton)}</button>
              ${saved ? `<span class="saved-note">${escapeHtml(copy.savedNote)}</span>` : ''}
            </div>
          </div>
        </form>

        <aside class="options-side">
          <div class="side-card">
            <p class="eyebrow">${escapeHtml(copy.setupEyebrow)}</p>
            <h2>${escapeHtml(copy.setupTitle)}</h2>
            <div class="guide-list">
              <div class="guide-item">
                <strong>${escapeHtml(copy.setupStepOneTitle)}</strong>
                <p>${escapeHtml(copy.setupStepOneCopy)}</p>
              </div>
              <div class="guide-item">
                <strong>${escapeHtml(copy.setupStepTwoTitle)}</strong>
                <p>${escapeHtml(copy.setupStepTwoCopy)}</p>
              </div>
              <div class="guide-item">
                <strong>${escapeHtml(copy.setupStepThreeTitle)}</strong>
                <p>${escapeHtml(copy.setupStepThreeCopy)}</p>
              </div>
            </div>
          </div>
          <div class="side-card">
            <p class="eyebrow">${escapeHtml(copy.safeEyebrow)}</p>
            <h2>${escapeHtml(copy.safeTitle)}</h2>
            <ul class="side-list">
              <li>${escapeHtml(copy.safeOne)}</li>
              <li>${escapeHtml(copy.safeTwo)}</li>
              <li>${escapeHtml(copy.safeThree)}</li>
            </ul>
          </div>
          <div class="side-card">
            <p class="eyebrow">${escapeHtml(copy.examplesEyebrow)}</p>
            <h2>${escapeHtml(copy.examplesTitle)}</h2>
            <div class="hint-card">
              <strong>${escapeHtml(copy.customExampleTitle)}</strong>
              <pre>[
  {
    "groupKey": "client-a",
    "groupLabel": "Client A",
    "hostnameEndsWith": ".figma.com"
  }
]</pre>
            </div>
            <div class="hint-card">
              <strong>${escapeHtml(copy.landingExampleTitle)}</strong>
              <pre>[
  {
    "hostname": "calendar.google.com",
    "pathExact": ["/calendar/u/0/r"]
  }
]</pre>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `;
}
