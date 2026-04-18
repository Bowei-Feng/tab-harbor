import type { AppSettings } from '@/lib/domain/settings';
import type { DeferredItem, RecentClosedStack } from '@/lib/domain/models';
import type { WorkspaceSnapshotV1 } from '@/lib/domain/workspace-snapshot';

export interface DeferredRepository {
  list(): Promise<DeferredItem[]>;
  add(item: DeferredItem): Promise<void>;
  replace(items: DeferredItem[]): Promise<void>;
  complete(id: string): Promise<void>;
  dismiss(id: string): Promise<void>;
}

export interface RecentClosedRepository {
  list(): Promise<RecentClosedStack[]>;
  push(stack: RecentClosedStack): Promise<void>;
  replace(items: RecentClosedStack[]): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}

export interface TabActivityRepository {
  list(): Promise<Record<number, string>>;
  mark(tabId: number, at?: string): Promise<void>;
  remove(tabId: number): Promise<void>;
  prune(tabIds: number[]): Promise<void>;
}

export interface GroupOrderRepository {
  list(): Promise<string[]>;
  save(order: string[]): Promise<void>;
}

export interface PinnedGroupRepository {
  list(): Promise<string[]>;
  save(groupIds: string[]): Promise<void>;
}

export interface SnapshotRepository {
  list(): Promise<WorkspaceSnapshotV1[]>;
  save(snapshot: WorkspaceSnapshotV1): Promise<void>;
  remove(id: string): Promise<void>;
}
