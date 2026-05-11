import type { AppLocale } from '@/lib/domain/settings';
import { getOptionsCopy } from '@/lib/ui/options-copy';
import { renderBrandLockup } from '@/lib/ui/shared/brand';
import { escapeHtml } from '@/lib/ui/shared/html';

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

function renderBrand(caption: string): string {
  return renderBrandLockup({ caption });
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
          ${renderBrand(copy.brandCaption)}
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
