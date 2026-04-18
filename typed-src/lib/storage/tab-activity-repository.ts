import type { TabActivityRepository } from '@/lib/storage/contracts';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

const MAX_ACTIVITY_ITEMS = 4000;

function sortEntriesByRecent(entries: Array<[string, string]>): Array<[string, string]> {
  return entries.sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime());
}

export const tabActivityRepository: TabActivityRepository = {
  async list() {
    return await getStorageValue<Record<number, string>>(storageKeys.tabActivity, {});
  },
  async mark(tabId, at = new Date().toISOString()) {
    const activity = await tabActivityRepository.list();
    const next = {
      ...activity,
      [tabId]: at
    };

    const trimmed = Object.fromEntries(
      sortEntriesByRecent(Object.entries(next)).slice(0, MAX_ACTIVITY_ITEMS)
    );
    await setStorageValue(storageKeys.tabActivity, trimmed);
  },
  async remove(tabId) {
    const activity = await tabActivityRepository.list();
    if (!(tabId in activity)) return;
    delete activity[tabId];
    await setStorageValue(storageKeys.tabActivity, activity);
  },
  async prune(tabIds) {
    const allowed = new Set(tabIds.map(String));
    const activity = await tabActivityRepository.list();
    const next = Object.fromEntries(
      Object.entries(activity).filter(([tabId]) => allowed.has(tabId))
    );
    await setStorageValue(storageKeys.tabActivity, next);
  }
};
