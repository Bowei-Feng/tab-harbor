import type { GroupAliasRepository } from '@/lib/storage/contracts';
import { getStorageValue, setStorageValue } from '@/lib/storage/browser-storage';
import { storageKeys } from '@/lib/storage/keys';

function normalizeAliases(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};

  const normalized: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right))) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    normalized[key] = trimmed;
  }
  return normalized;
}

export const groupAliasRepository: GroupAliasRepository = {
  async list() {
    return normalizeAliases(await getStorageValue(storageKeys.groupAliases, {}));
  },
  async save(aliases) {
    // 分组别名单独持久化，避免和规则配置耦合；留空的键直接清掉，回退到默认命名。
    await setStorageValue(storageKeys.groupAliases, normalizeAliases(aliases));
  }
};
