import type { AppSettings } from '@/lib/domain/settings';
import type { AppTab, DeferredItem, RecentClosedStack, TabGroup } from '@/lib/domain/models';
import type { WorkspaceSnapshotV1 } from '@/lib/domain/workspace-snapshot';
import { defaultSettings } from '@/lib/domain/settings';

export type TabSortMode = 'smart' | 'recent';
export type GroupLayoutMode = 'merged' | 'windows';

export interface AppState {
  loading: boolean;
  tabs: AppTab[];
  groups: TabGroup[];
  deferred: DeferredItem[];
  archive: DeferredItem[];
  recentClosed: RecentClosedStack[];
  settings: AppSettings;
  searchQuery: string;
  sortMode: TabSortMode;
  duplicatesOnly: boolean;
  layoutMode: GroupLayoutMode;
  groupOrder: string[];
  pinnedGroupIds: string[];
  snapshots: WorkspaceSnapshotV1[];
  snapshotTagFilter: string;
  selectedTabIds: number[];
  toast: string;
}

export const initialAppState: AppState = {
  loading: true,
  tabs: [],
  groups: [],
  deferred: [],
  archive: [],
  recentClosed: [],
  settings: defaultSettings,
  searchQuery: '',
  sortMode: 'smart',
  duplicatesOnly: false,
  layoutMode: 'merged',
  groupOrder: [],
  pinnedGroupIds: [],
  snapshots: [],
  snapshotTagFilter: '',
  selectedTabIds: [],
  toast: ''
};
