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

import { deferredRepository } from '@/lib/storage/deferred-repository';

describe('deferred repository archive upsert', () => {
  beforeEach(() => {
    memory.clear();
  });

  it('reuses archived entries with the same url and refreshes their archive time', async () => {
    await deferredRepository.replace([
      {
        id: 'archived-1',
        url: 'https://a.example',
        title: 'Old title',
        createdAt: '2026-05-06T08:00:00.000Z',
        completed: true,
        completedAt: '2026-05-06T08:00:00.000Z',
        dismissed: true
      }
    ]);

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-06T09:10:00.000Z'));

    await deferredRepository.upsertArchive([
      { url: 'https://a.example', title: 'New title' },
      { url: 'https://b.example', title: 'Second tab' }
    ]);

    vi.useRealTimers();

    const items = await deferredRepository.list();
    expect(items).toHaveLength(2);
    expect(items[0]?.url).toBe('https://b.example');
    expect(items[1]?.id).toBe('archived-1');
    expect(items[1]?.title).toBe('New title');
    expect(items[1]?.dismissed).toBe(false);
    expect(items[1]?.completed).toBe(true);
    expect(items[1]?.completedAt).toBe('2026-05-06T09:10:00.000Z');
    expect(memory.get(storageKeys.deferred)).toEqual(items);
  });
});
