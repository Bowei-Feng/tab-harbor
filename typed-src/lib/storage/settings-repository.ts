import type { SettingsRepository } from '@/lib/storage/contracts';
import { defaultSettings, normalizeAppSettings } from '@/lib/domain/settings';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

export const settingsRepository: SettingsRepository = {
  async load() {
    const stored = await getStorageValue<unknown>(storageKeys.settings, defaultSettings);
    return normalizeAppSettings(stored);
  },
  async save(settings) {
    await setStorageValue(storageKeys.settings, normalizeAppSettings(settings));
  }
};
