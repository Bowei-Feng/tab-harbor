import type { GroupOrderRepository } from '@/lib/storage/contracts';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

export const groupOrderRepository: GroupOrderRepository = {
  async list() {
    const stored = await getStorageValue<unknown[]>(storageKeys.groupOrder, []);
    return [...new Set(
      stored
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    )];
  },
  async save(order) {
    await setStorageValue(
      storageKeys.groupOrder,
      [...new Set(order.map((item) => item.trim()).filter(Boolean))]
    );
  }
};
