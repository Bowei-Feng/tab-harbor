import type { DeferredItem, RecentClosedStack } from '@/lib/domain/models';
import type { AppSettings } from '@/lib/domain/settings';
import { normalizeAppSettings } from '@/lib/domain/settings';

export interface SnapshotTab {
  url: string;
  title: string;
}

export interface SnapshotWindow {
  tabs: SnapshotTab[];
  activeTabIndex?: number;
  focused?: boolean;
}

export interface WorkspaceSnapshotV1 {
  id: string;
  version: 1;
  exportedAt: string;
  name: string;
  note: string;
  tags: string[];
  source: 'manual' | 'auto' | 'imported';
  windows: SnapshotWindow[];
  deferred: DeferredItem[];
  recentClosed: RecentClosedStack[];
  settings: AppSettings;
  groupOrder: string[];
  groupAliases: Record<string, string>;
  pinnedGroupIds: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  )];
}

function normalizeAliasMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};

  const aliases: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value).sort(([left], [right]) => left.localeCompare(right))) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    aliases[key] = trimmed;
  }
  return aliases;
}

function parseSnapshotTab(value: unknown): SnapshotTab | null {
  if (!isRecord(value)) return null;
  if (typeof value.url !== 'string' || !value.url.trim()) return null;

  return {
    url: value.url.trim(),
    title: typeof value.title === 'string' ? value.title : ''
  };
}

function parseSnapshotWindow(value: unknown): SnapshotWindow | null {
  if (!isRecord(value) || !Array.isArray(value.tabs)) return null;

  const tabs = value.tabs
    .map(parseSnapshotTab)
    .filter((tab): tab is SnapshotTab => Boolean(tab));

  const maxIndex = Math.max(0, tabs.length - 1);
  const activeTabIndex = Number.isInteger(value.activeTabIndex)
    ? Math.min(Math.max(Number(value.activeTabIndex), 0), maxIndex)
    : 0;

  return {
    tabs,
    activeTabIndex,
    focused: value.focused === true
  };
}

function parseDeferredItem(value: unknown): DeferredItem | null {
  if (!isRecord(value)) return null;

  const url = typeof value.url === 'string' ? value.url.trim() : '';
  const title = typeof value.title === 'string' ? value.title : '';
  const createdAt = isValidDateString(value.createdAt) ? value.createdAt : null;
  if (!url || !createdAt) return null;

  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id : `${createdAt}:${url}`,
    url,
    title,
    createdAt,
    completedAt: isValidDateString(value.completedAt) ? value.completedAt : undefined,
    dismissed: value.dismissed === true,
    completed: value.completed === true
  };
}

function parseRecentClosedStack(value: unknown): RecentClosedStack | null {
  if (!isRecord(value) || !Array.isArray(value.tabs)) return null;

  const tabs = value.tabs
    .map(parseSnapshotTab)
    .filter((tab): tab is SnapshotTab => Boolean(tab));

  const closedAt = isValidDateString(value.closedAt) ? value.closedAt : null;
  if (!closedAt) return null;

  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id : `${closedAt}:recent`,
    label: typeof value.label === 'string' && value.label.trim() ? value.label : 'Restored Stack',
    closedAt,
    tabs
  };
}

export function parseWorkspaceSnapshot(value: unknown): WorkspaceSnapshotV1 | null {
  if (!isRecord(value)) return null;

  // 导入快照时做“防御性收口”：字段缺失就拒绝，能安全归一化的字段再放进系统里。
  const snapshot = value as Partial<WorkspaceSnapshotV1>;
  if (
    snapshot.version !== 1 ||
    !isValidDateString(snapshot.exportedAt) ||
    typeof snapshot.name !== 'string' ||
    !Array.isArray(snapshot.windows) ||
    !Array.isArray(snapshot.deferred) ||
    !Array.isArray(snapshot.recentClosed) ||
    !Array.isArray(snapshot.groupOrder) ||
    (!isRecord(snapshot.groupAliases) && snapshot.groupAliases !== undefined) ||
    !Array.isArray(snapshot.pinnedGroupIds) ||
    !snapshot.settings
  ) {
    return null;
  }

  const windows = snapshot.windows
    .map(parseSnapshotWindow)
    .filter((window): window is SnapshotWindow => Boolean(window));

  const deferred = snapshot.deferred
    .map(parseDeferredItem)
    .filter((item): item is DeferredItem => Boolean(item));

  const recentClosed = snapshot.recentClosed
    .map(parseRecentClosedStack)
    .filter((item): item is RecentClosedStack => Boolean(item));

  return {
    id: snapshot.id ?? `${snapshot.exportedAt}:imported`,
    version: 1,
    exportedAt: snapshot.exportedAt,
    name: snapshot.name,
    note: typeof snapshot.note === 'string' ? snapshot.note : '',
    tags: normalizeStringArray(snapshot.tags),
    source: snapshot.source === 'manual' || snapshot.source === 'auto' || snapshot.source === 'imported'
      ? snapshot.source
      : 'imported',
    windows,
    deferred,
    recentClosed,
    settings: normalizeAppSettings(snapshot.settings),
    groupOrder: normalizeStringArray(snapshot.groupOrder),
    groupAliases: normalizeAliasMap(snapshot.groupAliases),
    pinnedGroupIds: normalizeStringArray(snapshot.pinnedGroupIds)
  };
}

export function isWorkspaceSnapshotV1(value: unknown): value is WorkspaceSnapshotV1 {
  return Boolean(parseWorkspaceSnapshot(value));
}

export function buildWorkspaceSnapshotSignature(
  snapshot: Pick<WorkspaceSnapshotV1, 'windows' | 'deferred' | 'groupOrder' | 'groupAliases' | 'pinnedGroupIds'>
): string {
  // 签名只保留会影响工作区结构的关键信息，用来判断自动快照是否真的发生了变化。
  return JSON.stringify({
    windows: snapshot.windows.map((window) => ({
      tabs: window.tabs.map((tab) => tab.url),
      activeTabIndex: window.activeTabIndex ?? 0,
      focused: window.focused === true
    })),
    deferred: snapshot.deferred.map((item) => item.url),
    groupOrder: snapshot.groupOrder,
    groupAliases: snapshot.groupAliases,
    pinnedGroupIds: snapshot.pinnedGroupIds
  });
}

export function buildWorkspaceSnapshotChangeSignature(
  snapshot: Pick<WorkspaceSnapshotV1, 'windows' | 'deferred' | 'settings' | 'groupOrder' | 'groupAliases' | 'pinnedGroupIds'>
): string {
  // 增量快照更关心“工作区结构有没有实质变化”，不关心当前激活页或窗口焦点这种高频抖动。
  return JSON.stringify({
    windows: snapshot.windows.map((window) => ({
      tabs: window.tabs.map((tab) => tab.url)
    })),
    deferred: snapshot.deferred.map((item) => ({
      url: item.url,
      completed: item.completed === true,
      dismissed: item.dismissed === true
    })),
    settings: snapshot.settings,
    groupOrder: snapshot.groupOrder,
    groupAliases: snapshot.groupAliases,
    pinnedGroupIds: snapshot.pinnedGroupIds
  });
}
