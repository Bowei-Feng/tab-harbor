import type { PinnedGroupRepository } from '@/lib/storage/contracts';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

export const pinnedGroupRepository: PinnedGroupRepository = {
  async list() {
    return await getStorageValue<string[]>(storageKeys.pinnedGroups, []);
  },
  async save(groupIds) {
    await setStorageValue(storageKeys.pinnedGroups, [...new Set(groupIds)]);
  }
};
