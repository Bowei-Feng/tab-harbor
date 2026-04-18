import type { RecentClosedRepository } from '@/lib/storage/contracts';
import type { RecentClosedStack } from '@/lib/domain/models';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

const LIMIT = 8;

export const recentClosedRepository: RecentClosedRepository = {
  async list() {
    return await getStorageValue<RecentClosedStack[]>(storageKeys.recentClosed, []);
  },
  async push(stack) {
    const items = await recentClosedRepository.list();
    await setStorageValue(storageKeys.recentClosed, [stack, ...items].slice(0, LIMIT));
  },
  async replace(items) {
    await setStorageValue(storageKeys.recentClosed, items.slice(0, LIMIT));
  },
  async remove(id) {
    const items = await recentClosedRepository.list();
    await setStorageValue(
      storageKeys.recentClosed,
      items.filter((item) => item.id !== id)
    );
  }
};
