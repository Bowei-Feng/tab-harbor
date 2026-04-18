import type { GroupOrderRepository } from '@/lib/storage/contracts';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

export const groupOrderRepository: GroupOrderRepository = {
  async list() {
    return await getStorageValue<string[]>(storageKeys.groupOrder, []);
  },
  async save(order) {
    await setStorageValue(storageKeys.groupOrder, [...new Set(order)]);
  }
};
