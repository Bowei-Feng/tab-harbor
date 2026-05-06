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
  async upsertArchive(entries) {
    const items = await deferredRepository.list();
    const next = [...items];
    const now = new Date().toISOString();

    // 关闭后的标签页沉淀到归档区，方便后面把常用网页重新打开。
    for (const entry of entries) {
      const existingIndex = next.findIndex((item) => item.url === entry.url);
      if (existingIndex >= 0) {
        const existing = next.splice(existingIndex, 1)[0]!;
        next.unshift({
          ...existing,
          title: entry.title || existing.title,
          dismissed: false,
          completed: true,
          completedAt: now
        });
        continue;
      }

      next.unshift({
        id: `${now}:archive:${Math.random().toString(36).slice(2, 8)}`,
        url: entry.url,
        title: entry.title,
        createdAt: now,
        completed: true,
        completedAt: now,
        dismissed: false
      });
    }

    await setStorageValue(storageKeys.deferred, next);
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
