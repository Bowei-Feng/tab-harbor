import './style.css';
import {
  defaultSettings,
  parseCustomGroupRules,
  parseLandingPageRules,
  type AppLocale,
  type AppSettings
} from '@/lib/domain/settings';
import { localizeSettingsError, pickLocale } from '@/lib/i18n';
import { settingsRepository } from '@/lib/storage/settings-repository';
import { renderOptions, type OptionsDraftValues, type OptionsRenderState } from '@/lib/ui/options-render';

const root = document.getElementById('app');

function draftFromSettings(settings: AppSettings): OptionsDraftValues {
  return {
    language: settings.language,
    soundEnabled: settings.soundEnabled,
    confettiEnabled: settings.confettiEnabled,
    hiddenDomainsText: settings.hiddenDomains.join('\n'),
    customGroupRulesText: JSON.stringify(settings.customGroupRules, null, 2),
    landingPageRulesText: JSON.stringify(settings.landingPageRules, null, 2)
  };
}

function readDraftFromForm(form: HTMLFormElement): OptionsDraftValues {
  const data = new FormData(form);
  const language = data.get('language');

  return {
    language: language === 'zh-CN' ? 'zh-CN' : 'en',
    soundEnabled: data.get('soundEnabled') === 'on',
    confettiEnabled: data.get('confettiEnabled') === 'on',
    hiddenDomainsText: String(data.get('hiddenDomains') || ''),
    customGroupRulesText: String(data.get('customGroupRules') || '[]'),
    landingPageRulesText: String(data.get('landingPageRules') || '[]')
  };
}

function parseJsonField(locale: AppLocale, fieldName: string, value: string): { parsed: unknown; errors: string[] } {
  try {
    return {
      parsed: JSON.parse(value.trim() || '[]'),
      errors: []
    };
  } catch {
    return {
      parsed: [],
      errors: [pickLocale(locale, `${fieldName} must contain valid JSON.`, `${fieldName}需要写成合法的 JSON。`)]
    };
  }
}

function buildSettingsFromDraft(draft: OptionsDraftValues): { settings: AppSettings | null; errors: string[] } {
  // 设置页的职责是“把表单草稿整理成可持久化的结构”，真正写入前先全部校验一遍。
  const hiddenDomains = [...new Set(
    draft.hiddenDomainsText
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter(Boolean)
  )];

  const customFieldName = pickLocale(draft.language, 'Custom group rules', '命名分组规则');
  const landingFieldName = pickLocale(draft.language, 'Extra landing page rules', '落地页规则');
  const customGroupParse = parseJsonField(draft.language, customFieldName, draft.customGroupRulesText);
  const landingPageParse = parseJsonField(draft.language, landingFieldName, draft.landingPageRulesText);
  const customGroupRules = parseCustomGroupRules(customGroupParse.parsed);
  const landingPageRules = parseLandingPageRules(landingPageParse.parsed);
  const errors = [
    ...customGroupParse.errors,
    ...landingPageParse.errors,
    ...customGroupRules.errors.map((error) => localizeSettingsError(draft.language, error)),
    ...landingPageRules.errors.map((error) => localizeSettingsError(draft.language, error))
  ];

  if (errors.length) {
    return {
      settings: null,
      errors
    };
  }

  return {
    settings: {
      language: draft.language,
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
  document.documentElement.lang = view.draft.language;
  renderOptions(root, view);

  const form = document.getElementById('settings-form');
  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener('change', async (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target?.matches('[data-role="language-input"]')) return;

    // 语言切换先做“即时预览”，这样用户不用先保存才能确认文案效果。
    const nextDraft = readDraftFromForm(form);
    const result = buildSettingsFromDraft(nextDraft);
    await mount({
      draft: nextDraft,
      saved: false,
      errors: result.errors
    });
  });

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
