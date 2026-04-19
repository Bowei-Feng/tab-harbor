import './style.css';
import { defaultSettings, parseCustomGroupRules, parseLandingPageRules, type AppSettings } from '@/lib/domain/settings';
import { settingsRepository } from '@/lib/storage/settings-repository';
import { renderOptions, type OptionsDraftValues, type OptionsRenderState } from '@/lib/ui/options-render';

const root = document.getElementById('app');

function draftFromSettings(settings: AppSettings): OptionsDraftValues {
  return {
    soundEnabled: settings.soundEnabled,
    confettiEnabled: settings.confettiEnabled,
    hiddenDomainsText: settings.hiddenDomains.join('\n'),
    customGroupRulesText: JSON.stringify(settings.customGroupRules, null, 2),
    landingPageRulesText: JSON.stringify(settings.landingPageRules, null, 2)
  };
}

function readDraftFromForm(form: HTMLFormElement): OptionsDraftValues {
  const data = new FormData(form);
  return {
    soundEnabled: data.get('soundEnabled') === 'on',
    confettiEnabled: data.get('confettiEnabled') === 'on',
    hiddenDomainsText: String(data.get('hiddenDomains') || ''),
    customGroupRulesText: String(data.get('customGroupRules') || '[]'),
    landingPageRulesText: String(data.get('landingPageRules') || '[]')
  };
}

function parseJsonField(fieldName: string, value: string): { parsed: unknown; errors: string[] } {
  try {
    return {
      parsed: JSON.parse(value.trim() || '[]'),
      errors: []
    };
  } catch {
    return {
      parsed: [],
      errors: [`${fieldName} must contain valid JSON.`]
    };
  }
}

function buildSettingsFromDraft(draft: OptionsDraftValues): { settings: AppSettings | null; errors: string[] } {
  const hiddenDomains = [...new Set(
    draft.hiddenDomainsText
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter(Boolean)
  )];

  const customGroupParse = parseJsonField('Custom group rules', draft.customGroupRulesText);
  const landingPageParse = parseJsonField('Extra landing page rules', draft.landingPageRulesText);
  const customGroupRules = parseCustomGroupRules(customGroupParse.parsed);
  const landingPageRules = parseLandingPageRules(landingPageParse.parsed);
  const errors = [
    ...customGroupParse.errors,
    ...landingPageParse.errors,
    ...customGroupRules.errors,
    ...landingPageRules.errors
  ];

  if (errors.length) {
    return {
      settings: null,
      errors
    };
  }

  return {
    settings: {
      soundEnabled: draft.soundEnabled,
      confettiEnabled: draft.confettiEnabled,
      hiddenDomains,
      customGroupRules: customGroupRules.value,
      landingPageRules: landingPageRules.value
    },
    errors: []
  };
}

async function mount(view: OptionsRenderState): Promise<void> {
  if (!root) return;
  renderOptions(root, view);

  const form = document.getElementById('settings-form');
  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const draft = readDraftFromForm(form);
    const result = buildSettingsFromDraft(draft);
    if (!result.settings) {
      await mount({
        draft,
        saved: false,
        errors: result.errors
      });
      return;
    }

    await settingsRepository.save(result.settings);
    await mount({
      draft: draftFromSettings(result.settings),
      saved: true,
      errors: []
    });
  });

  const resetButton = document.getElementById('reset-btn');
  resetButton?.addEventListener('click', async () => {
    await settingsRepository.save(defaultSettings);
    await mount({
      draft: draftFromSettings(defaultSettings),
      saved: true,
      errors: []
    });
  });
}

void settingsRepository.load().then((settings) => mount({
  draft: draftFromSettings(settings),
  saved: false,
  errors: []
}));
