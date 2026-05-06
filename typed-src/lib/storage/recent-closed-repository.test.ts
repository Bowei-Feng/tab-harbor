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

import { recentClosedRepository } from '@/lib/storage/recent-closed-repository';

describe('recent closed repository', () => {
  beforeEach(() => {
    memory.clear();
  });

  it('merges identical closed stacks and only refreshes the timestamp', async () => {
    await recentClosedRepository.push({
      id: 'first',
      label: 'First label',
      closedAt: '2026-05-06T09:00:00.000Z',
      tabs: [
        { url: 'https://a.example', title: 'A' },
        { url: 'https://b.example', title: 'B' }
      ]
    });

    await recentClosedRepository.push({
      id: 'second',
      label: 'Second label',
      closedAt: '2026-05-06T09:05:00.000Z',
      tabs: [
        { url: 'https://b.example', title: 'B' },
        { url: 'https://a.example', title: 'A' }
      ]
    });

    const items = await recentClosedRepository.list();
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('first');
    expect(items[0]?.label).toBe('First label');
    expect(items[0]?.closedAt).toBe('2026-05-06T09:05:00.000Z');
    expect(memory.get(storageKeys.recentClosed)).toEqual(items);
  });
});
