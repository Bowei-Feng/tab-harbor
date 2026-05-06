import { parseWorkspaceSnapshot, type WorkspaceSnapshotV1 } from '@/lib/domain/workspace-snapshot';
import type { SnapshotRepository } from '@/lib/storage/contracts';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

const AUTO_LIMIT = 3;
const NAMED_LIMIT = 3;

type SnapshotChangeSet = Partial<Pick<
  WorkspaceSnapshotV1,
  'windows' | 'deferred' | 'recentClosed' | 'settings' | 'groupOrder' | 'groupAliases' | 'pinnedGroupIds'
>>;

interface SnapshotFullEntry {
  kind: 'full';
  snapshot: WorkspaceSnapshotV1;
}

interface SnapshotDeltaEntry {
  kind: 'delta';
  id: string;
  exportedAt: string;
  name: string;
  note: string;
  tags: string[];
  source: WorkspaceSnapshotV1['source'];
  changes: SnapshotChangeSet;
}

interface SnapshotJournalV1 {
  version: 1;
  entries: Array<SnapshotFullEntry | SnapshotDeltaEntry>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function cloneSnapshot(snapshot: WorkspaceSnapshotV1): WorkspaceSnapshotV1 {
  return JSON.parse(JSON.stringify(snapshot)) as WorkspaceSnapshotV1;
}

function cloneChangeSet(changes: SnapshotChangeSet): SnapshotChangeSet {
  return JSON.parse(JSON.stringify(changes)) as SnapshotChangeSet;
}

function isEqual<T>(left: T, right: T): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildDeltaEntry(previous: WorkspaceSnapshotV1, current: WorkspaceSnapshotV1): SnapshotDeltaEntry {
  const changes: SnapshotChangeSet = {};

  if (!isEqual(previous.windows, current.windows)) changes.windows = current.windows;
  if (!isEqual(previous.deferred, current.deferred)) changes.deferred = current.deferred;
  if (!isEqual(previous.recentClosed, current.recentClosed)) changes.recentClosed = current.recentClosed;
  if (!isEqual(previous.settings, current.settings)) changes.settings = current.settings;
  if (!isEqual(previous.groupOrder, current.groupOrder)) changes.groupOrder = current.groupOrder;
  if (!isEqual(previous.groupAliases, current.groupAliases)) changes.groupAliases = current.groupAliases;
  if (!isEqual(previous.pinnedGroupIds, current.pinnedGroupIds)) changes.pinnedGroupIds = current.pinnedGroupIds;

  return {
    kind: 'delta',
    id: current.id,
    exportedAt: current.exportedAt,
    name: current.name,
    note: current.note,
    tags: current.tags,
    source: current.source,
    changes
  };
}

function materializeJournal(journal: SnapshotJournalV1): WorkspaceSnapshotV1[] {
  const snapshots: WorkspaceSnapshotV1[] = [];
  let previous: WorkspaceSnapshotV1 | null = null;

  for (const entry of journal.entries) {
    if (entry.kind === 'full') {
      const snapshot = parseWorkspaceSnapshot(entry.snapshot);
      if (!snapshot) continue;
      previous = snapshot;
      snapshots.push(snapshot);
      continue;
    }

    if (!previous) continue;

    const snapshot = parseWorkspaceSnapshot({
      id: entry.id,
      version: 1,
      exportedAt: entry.exportedAt,
      name: entry.name,
      note: entry.note,
      tags: entry.tags,
      source: entry.source,
      windows: entry.changes.windows ?? previous.windows,
      deferred: entry.changes.deferred ?? previous.deferred,
      recentClosed: entry.changes.recentClosed ?? previous.recentClosed,
      settings: entry.changes.settings ?? previous.settings,
      groupOrder: entry.changes.groupOrder ?? previous.groupOrder,
      groupAliases: entry.changes.groupAliases ?? previous.groupAliases,
      pinnedGroupIds: entry.changes.pinnedGroupIds ?? previous.pinnedGroupIds
    });

    if (!snapshot) continue;
    previous = snapshot;
    snapshots.push(snapshot);
  }

  return snapshots.reverse();
}

function parseJournalEntry(value: unknown): SnapshotFullEntry | SnapshotDeltaEntry | null {
  if (!isRecord(value)) return null;

  if (value.kind === 'full') {
    const snapshot = parseWorkspaceSnapshot(value.snapshot);
    return snapshot ? { kind: 'full', snapshot } : null;
  }

  if (value.kind === 'delta') {
    if (
      typeof value.id !== 'string' ||
      typeof value.exportedAt !== 'string' ||
      typeof value.name !== 'string' ||
      typeof value.note !== 'string' ||
      !Array.isArray(value.tags) ||
      (value.source !== 'manual' && value.source !== 'auto' && value.source !== 'imported') ||
      !isRecord(value.changes)
    ) {
      return null;
    }

    return {
      kind: 'delta',
      id: value.id,
      exportedAt: value.exportedAt,
      name: value.name,
      note: value.note,
      tags: value.tags.filter((tag): tag is string => typeof tag === 'string'),
      source: value.source,
      changes: value.changes as SnapshotChangeSet
    };
  }

  return null;
}

function parseStoredSnapshots(value: unknown): WorkspaceSnapshotV1[] {
  if (Array.isArray(value)) {
    return value
      .map(parseWorkspaceSnapshot)
      .filter((snapshot): snapshot is WorkspaceSnapshotV1 => Boolean(snapshot));
  }

  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.entries)) {
    return [];
  }

  const entries = value.entries
    .map(parseJournalEntry)
    .filter((entry): entry is SnapshotJournalV1['entries'][number] => Boolean(entry));

  return materializeJournal({
    version: 1,
    entries
  });
}

function pruneSnapshots(snapshots: WorkspaceSnapshotV1[]): WorkspaceSnapshotV1[] {
  const keepIds = new Set<string>();
  let autoCount = 0;
  let namedCount = 0;

  for (const snapshot of snapshots) {
    if (snapshot.source === 'auto') {
      if (autoCount >= AUTO_LIMIT) continue;
      autoCount += 1;
      keepIds.add(snapshot.id);
      continue;
    }

    if (namedCount >= NAMED_LIMIT) continue;
    namedCount += 1;
    keepIds.add(snapshot.id);
  }

  return snapshots.filter((snapshot) => keepIds.has(snapshot.id));
}

function encodeSnapshots(snapshots: WorkspaceSnapshotV1[]): SnapshotJournalV1 {
  const chronological = [...snapshots].reverse();
  const entries: SnapshotJournalV1['entries'] = [];
  let previous: WorkspaceSnapshotV1 | null = null;

  chronological.forEach((snapshot, index) => {
    const current = cloneSnapshot(snapshot);

    // 第一条和用户主动保存的快照保留完整基线，自动快照走增量，恢复时仍然可以回放出来。
    if (!previous || current.source !== 'auto' || index === 0) {
      entries.push({
        kind: 'full',
        snapshot: current
      });
      previous = current;
      return;
    }

    entries.push(buildDeltaEntry(previous, current));
    previous = current;
  });

  return {
    version: 1,
    entries: entries.map((entry) => (
      entry.kind === 'full'
        ? { kind: 'full', snapshot: cloneSnapshot(entry.snapshot) }
        : { ...entry, changes: cloneChangeSet(entry.changes) }
    ))
  };
}

export const snapshotRepository: SnapshotRepository = {
  async list() {
    const raw = await getStorageValue<unknown>(storageKeys.snapshots, []);
    return parseStoredSnapshots(raw);
  },
  async save(snapshot) {
    const normalized = parseWorkspaceSnapshot(snapshot);
    if (!normalized) {
      throw new Error('Invalid workspace snapshot');
    }

    const items = await snapshotRepository.list();
    const nextSnapshots = pruneSnapshots([
      normalized,
      ...items.filter((item) => item.id !== normalized.id)
    ]);

    await setStorageValue(storageKeys.snapshots, encodeSnapshots(nextSnapshots));
  },
  async remove(id) {
    const items = await snapshotRepository.list();
    const nextSnapshots = items.filter((item) => item.id !== id);
    await setStorageValue(storageKeys.snapshots, encodeSnapshots(nextSnapshots));
  }
};
