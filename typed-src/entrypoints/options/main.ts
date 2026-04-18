import './style.css';
import { defaultSettings, type AppSettings } from '@/lib/domain/settings';
import { settingsRepository } from '@/lib/storage/settings-repository';
import { renderOptions } from '@/lib/ui/options-render';

const root = document.getElementById('app');

function parseJsonArray(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readSettingsFromForm(form: HTMLFormElement): AppSettings {
  const data = new FormData(form);
  return {
    soundEnabled: data.get('soundEnabled') === 'on',
    confettiEnabled: data.get('confettiEnabled') === 'on',
    hiddenDomains: String(data.get('hiddenDomains') || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    customGroupRules: parseJsonArray(String(data.get('customGroupRules') || '[]')) as AppSettings['customGroupRules'],
    landingPageRules: parseJsonArray(String(data.get('landingPageRules') || '[]')) as AppSettings['landingPageRules']
  };
}

async function mount(settings: AppSettings, saved = false): Promise<void> {
  if (!root) return;
  renderOptions(root, settings, saved);

  const form = document.getElementById('settings-form');
  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const next = readSettingsFromForm(form);
    await settingsRepository.save(next);
    await mount(next, true);
  });

  const resetButton = document.getElementById('reset-btn');
  resetButton?.addEventListener('click', async () => {
    await settingsRepository.save(defaultSettings);
    await mount(defaultSettings, true);
  });
}

void settingsRepository.load().then((settings) => mount(settings));
