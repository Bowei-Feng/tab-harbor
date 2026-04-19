import { parseWorkspaceSnapshot, type WorkspaceSnapshotV1 } from '@/lib/domain/workspace-snapshot';
import type { SnapshotRepository } from '@/lib/storage/contracts';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

const LIMIT = 8;

export const snapshotRepository: SnapshotRepository = {
  async list() {
    const items = await getStorageValue<unknown[]>(storageKeys.snapshots, []);
    return items
      .map(parseWorkspaceSnapshot)
      .filter((snapshot): snapshot is WorkspaceSnapshotV1 => Boolean(snapshot));
  },
  async save(snapshot) {
    const normalized = parseWorkspaceSnapshot(snapshot);
    if (!normalized) {
      throw new Error('Invalid workspace snapshot');
    }

    const items = await snapshotRepository.list();
    const next = [normalized, ...items.filter((item) => item.id !== normalized.id)].slice(0, LIMIT);
    await setStorageValue(storageKeys.snapshots, next);
  },
  async remove(id) {
    const items = await snapshotRepository.list();
    await setStorageValue(
      storageKeys.snapshots,
      items.filter((item) => item.id !== id)
    );
  }
};
