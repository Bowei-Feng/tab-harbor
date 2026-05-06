import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageKeys } from '@/lib/storage/keys';

const memory = new Map<string, unknown>();

vi.mock('@/lib/storage/browser-storage', () => ({
  getStorageValue: vi.fn(async (key: string, fallback: unknown) => (
    memory.has(key) ? memory.get(key) : fallback
  )),
  setStorageValue: vi.fn(async (key: string, value: unknown) => {
    memory.set(key, value);
  })
}));

import { snapshotRepository } from '@/lib/storage/snapshot-repository';

function createSnapshot(id: string, source: 'auto' | 'manual' | 'imported', exportedAt: string, url: string) {
  return {
    id,
    version: 1 as const,
    exportedAt,
    name: id,
    note: '',
    tags: [],
    source,
    windows: [{ tabs: [{ url, title: id }], activeTabIndex: 0, focused: true }],
    deferred: [],
    recentClosed: [],
    settings: {
      hiddenDomains: [],
      customGroupRules: [],
      landingPageRules: [],
      soundEnabled: true,
      confettiEnabled: true,
      language: 'zh-CN' as const
    },
    groupOrder: [],
    pinnedGroupIds: []
  };
}

describe('snapshot repository', () => {
  beforeEach(() => {
    memory.clear();
  });

  it('stores auto snapshots as incremental journal entries after the first baseline', async () => {
    await snapshotRepository.save(createSnapshot('manual-1', 'manual', '2026-05-06T08:00:00.000Z', 'https://a.example'));
    await snapshotRepository.save(createSnapshot('auto-1', 'auto', '2026-05-06T08:05:00.000Z', 'https://b.example'));

    const raw = memory.get(storageKeys.snapshots) as { version: number; entries: Array<{ kind: string }> };
    expect(raw.version).toBe(1);
    expect(raw.entries).toHaveLength(2);
    expect(raw.entries[0]?.kind).toBe('full');
    expect(raw.entries[1]?.kind).toBe('delta');

    const snapshots = await snapshotRepository.list();
    expect(snapshots.map((snapshot) => snapshot.id)).toEqual(['auto-1', 'manual-1']);
    expect(snapshots[0]?.windows[0]?.tabs[0]?.url).toBe('https://b.example');
  });

  it('keeps only a bounded number of recent versions, favoring named snapshots', async () => {
    await snapshotRepository.save(createSnapshot('manual-3', 'manual', '2026-05-06T08:03:00.000Z', 'https://manual-3.example'));
    await snapshotRepository.save(createSnapshot('manual-2', 'manual', '2026-05-06T08:02:00.000Z', 'https://manual-2.example'));
    await snapshotRepository.save(createSnapshot('manual-1', 'manual', '2026-05-06T08:01:00.000Z', 'https://manual-1.example'));
    await snapshotRepository.save(createSnapshot('manual-0', 'manual', '2026-05-06T08:00:00.000Z', 'https://manual-0.example'));
    await snapshotRepository.save(createSnapshot('auto-4', 'auto', '2026-05-06T08:14:00.000Z', 'https://auto-4.example'));
    await snapshotRepository.save(createSnapshot('auto-3', 'auto', '2026-05-06T08:13:00.000Z', 'https://auto-3.example'));
    await snapshotRepository.save(createSnapshot('auto-2', 'auto', '2026-05-06T08:12:00.000Z', 'https://auto-2.example'));
    await snapshotRepository.save(createSnapshot('auto-1', 'auto', '2026-05-06T08:11:00.000Z', 'https://auto-1.example'));

    const snapshots = await snapshotRepository.list();
    expect(snapshots.map((snapshot) => snapshot.id)).toEqual([
      'auto-1',
      'auto-2',
      'auto-3',
      'manual-0',
      'manual-1',
      'manual-2'
    ]);
  });
});
