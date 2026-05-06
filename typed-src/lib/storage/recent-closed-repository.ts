import type { RecentClosedRepository } from '@/lib/storage/contracts';
import type { RecentClosedStack } from '@/lib/domain/models';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

const LIMIT = 8;

export function buildRecentClosedSignature(stack: Pick<RecentClosedStack, 'tabs'>): string {
  // 最近关闭更关心“能不能重开同一批网页”，所以这里按 URL 集合去重，不用标题。
  return [...stack.tabs]
    .map((tab) => tab.url)
    .sort()
    .join('\u0002');
}

function mergeRecentClosed(items: RecentClosedStack[]): RecentClosedStack[] {
  const merged: RecentClosedStack[] = [];
  const seen = new Map<string, number>();

  for (const item of items) {
    const signature = buildRecentClosedSignature(item);
    const existingIndex = seen.get(signature);
    if (typeof existingIndex === 'number') {
      const current = merged[existingIndex]!;
      const closedAt = new Date(item.closedAt) > new Date(current.closedAt)
        ? item.closedAt
        : current.closedAt;
      merged[existingIndex] = {
        ...current,
        closedAt
      };
      continue;
    }

    seen.set(signature, merged.length);
    merged.push(item);
  }

  return merged.slice(0, LIMIT);
}

export const recentClosedRepository: RecentClosedRepository = {
  async list() {
    return await getStorageValue<RecentClosedStack[]>(storageKeys.recentClosed, []);
  },
  async push(stack) {
    const items = await recentClosedRepository.list();
    const signature = buildRecentClosedSignature(stack);
    const existing = items.find((item) => buildRecentClosedSignature(item) === signature);

    if (existing) {
      await setStorageValue(
        storageKeys.recentClosed,
        mergeRecentClosed([
          { ...existing, closedAt: stack.closedAt },
          ...items.filter((item) => item.id !== existing.id)
        ])
      );
      return;
    }

    await setStorageValue(storageKeys.recentClosed, mergeRecentClosed([stack, ...items]));
  },
  async replace(items) {
    await setStorageValue(storageKeys.recentClosed, mergeRecentClosed(items));
  },
  async remove(id) {
    const items = await recentClosedRepository.list();
    await setStorageValue(
      storageKeys.recentClosed,
      items.filter((item) => item.id !== id)
    );
  }
};
