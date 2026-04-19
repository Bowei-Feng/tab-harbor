import type { PinnedGroupRepository } from '@/lib/storage/contracts';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

export const pinnedGroupRepository: PinnedGroupRepository = {
  async list() {
    const stored = await getStorageValue<unknown[]>(storageKeys.pinnedGroups, []);
    return [...new Set(
      stored
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    )];
  },
  async save(groupIds) {
    await setStorageValue(
      storageKeys.pinnedGroups,
      [...new Set(groupIds.map((item) => item.trim()).filter(Boolean))]
    );
  }
};
