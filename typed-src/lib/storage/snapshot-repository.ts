import type { WorkspaceSnapshotV1 } from '@/lib/domain/workspace-snapshot';
import type { SnapshotRepository } from '@/lib/storage/contracts';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

const LIMIT = 8;

export const snapshotRepository: SnapshotRepository = {
  async list() {
    return await getStorageValue<WorkspaceSnapshotV1[]>(storageKeys.snapshots, []);
  },
  async save(snapshot) {
    const items = await snapshotRepository.list();
    const next = [snapshot, ...items.filter((item) => item.id !== snapshot.id)].slice(0, LIMIT);
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
