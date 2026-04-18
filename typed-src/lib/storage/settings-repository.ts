import type { SettingsRepository } from '@/lib/storage/contracts';
import type { AppSettings } from '@/lib/domain/settings';
import { defaultSettings } from '@/lib/domain/settings';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

export const settingsRepository: SettingsRepository = {
  async load() {
    return await getStorageValue<AppSettings>(storageKeys.settings, defaultSettings);
  },
  async save(settings) {
    await setStorageValue(storageKeys.settings, settings);
  }
};
