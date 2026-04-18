import type { DeferredItem, RecentClosedStack } from '@/lib/domain/models';
import type { AppSettings } from '@/lib/domain/settings';

export interface SnapshotTab {
  url: string;
  title: string;
}

export interface SnapshotWindow {
  tabs: SnapshotTab[];
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
  pinnedGroupIds: string[];
}

export function parseWorkspaceSnapshot(value: unknown): WorkspaceSnapshotV1 | null {
  if (!value || typeof value !== 'object') return null;

  const snapshot = value as Partial<WorkspaceSnapshotV1>;
  if (
    snapshot.version !== 1 ||
    typeof snapshot.exportedAt !== 'string' ||
    typeof snapshot.name !== 'string' ||
    !Array.isArray(snapshot.windows) ||
    !Array.isArray(snapshot.deferred) ||
    !Array.isArray(snapshot.recentClosed) ||
    !Array.isArray(snapshot.groupOrder) ||
    !Array.isArray(snapshot.pinnedGroupIds) ||
    !snapshot.settings
  ) {
    return null;
  }

  return {
    id: snapshot.id ?? `${snapshot.exportedAt}:imported`,
    version: 1,
    exportedAt: snapshot.exportedAt,
    name: snapshot.name,
    note: typeof snapshot.note === 'string' ? snapshot.note : '',
    tags: Array.isArray(snapshot.tags) ? snapshot.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    source: snapshot.source === 'manual' || snapshot.source === 'auto' || snapshot.source === 'imported'
      ? snapshot.source
      : 'imported',
    windows: snapshot.windows,
    deferred: snapshot.deferred,
    recentClosed: snapshot.recentClosed,
    settings: snapshot.settings,
    groupOrder: snapshot.groupOrder,
    pinnedGroupIds: snapshot.pinnedGroupIds
  };
}

export function isWorkspaceSnapshotV1(value: unknown): value is WorkspaceSnapshotV1 {
  return Boolean(parseWorkspaceSnapshot(value));
}
