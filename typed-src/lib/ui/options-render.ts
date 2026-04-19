export interface OptionsDraftValues {
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

export function renderOptions(root: HTMLElement, view: OptionsRenderState): void {
  const { draft, saved, errors } = view;

  root.innerHTML = `
    <div class="options-shell">
      <header class="options-hero">
        ${renderBrand()}
        <h1>Settings</h1>
        <p>Control what belongs in the harbor, what gets grouped together, and how aggressively the workspace reacts.</p>
      </header>
      <form id="settings-form" class="options-card">
        ${errors.length ? `
          <div class="error-card" role="alert">
            <strong>Fix these issues before saving</strong>
            <ul class="error-list">
              ${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <section class="options-section">
          <h2>Experience</h2>
          <p class="section-copy">Keep the workspace quiet or let it celebrate decisive cleanup.</p>
        </section>
        <label class="toggle-row">
          <span>Enable close sound</span>
          <input type="checkbox" name="soundEnabled" ${draft.soundEnabled ? 'checked' : ''}>
        </label>
        <label class="toggle-row">
          <span>Enable confetti</span>
          <input type="checkbox" name="confettiEnabled" ${draft.confettiEnabled ? 'checked' : ''}>
        </label>
        <section class="options-section">
          <h2>Filtering</h2>
          <p class="section-copy">Hide noisy domains from the dashboard without touching the real tabs.</p>
        </section>
        <label class="field">
          <span>Hidden domains</span>
          <textarea name="hiddenDomains" rows="4" placeholder="chrome.com&#10;news.ycombinator.com">${escapeHtml(draft.hiddenDomainsText)}</textarea>
        </label>
        <section class="options-section">
          <h2>Rules</h2>
          <p class="section-copy">Use JSON arrays for custom stack rules and extra landing pages.</p>
        </section>
        <label class="field">
          <span>Custom group rules (JSON array)</span>
          <textarea name="customGroupRules" rows="10" placeholder='[{"groupKey":"work-docs","groupLabel":"Work Docs","hostname":"docs.google.com"}]'>${escapeHtml(draft.customGroupRulesText)}</textarea>
        </label>
        <label class="field">
          <span>Extra landing page rules (JSON array)</span>
          <textarea name="landingPageRules" rows="8" placeholder='[{"hostname":"calendar.google.com","pathExact":["/calendar/u/0/r"]}]'>${escapeHtml(draft.landingPageRulesText)}</textarea>
        </label>
        <div class="actions-bar">
          <button class="primary-btn" type="submit">Save settings</button>
          <button class="ghost-btn" type="button" id="reset-btn">Reset defaults</button>
          ${saved ? '<span class="saved-note">Saved</span>' : ''}
        </div>
        <div class="hint-card">
          <strong>Rule example</strong>
          <pre>[
  {
    "groupKey": "client-a",
    "groupLabel": "Client A",
    "hostnameEndsWith": ".figma.com"
  }
]</pre>
        </div>
      </form>
    </div>
  `;
}
