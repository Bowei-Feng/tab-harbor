import type { DeferredItem } from '@/lib/domain/models';
import type { DeferredRepository } from '@/lib/storage/contracts';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

export const deferredRepository: DeferredRepository = {
  async list() {
    return await getStorageValue<DeferredItem[]>(storageKeys.deferred, []);
  },
  async add(item) {
    const items = await deferredRepository.list();
    await setStorageValue(storageKeys.deferred, [item, ...items]);
  },
  async replace(items) {
    await setStorageValue(storageKeys.deferred, items);
  },
  async complete(id) {
    const items = await deferredRepository.list();
    await setStorageValue(
      storageKeys.deferred,
      items.map((item) =>
        item.id === id
          ? { ...item, completed: true, completedAt: new Date().toISOString() }
          : item
      )
    );
  },
  async dismiss(id) {
    const items = await deferredRepository.list();
    await setStorageValue(
      storageKeys.deferred,
      items.map((item) => (item.id === id ? { ...item, dismissed: true } : item))
    );
  }
};
