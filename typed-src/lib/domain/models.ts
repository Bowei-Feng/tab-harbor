export interface BrowserTabLike {
  id?: number;
  url?: string;
  title?: string;
  active?: boolean;
  windowId?: number;
  favIconUrl?: string;
  lastActivatedAt?: string;
}

export interface AppTab {
  id: number;
  url: string;
  title: string;
  cleanTitle: string;
  hostname: string;
  active: boolean;
  windowId: number;
  favIconUrl?: string;
  isLandingPage: boolean;
  lastActivatedAt?: string;
}

export type GroupKind = 'landing' | 'domain' | 'custom';

export interface TabGroup {
  id: string;
  kind: GroupKind;
  label: string;
  tabs: AppTab[];
  duplicateCount: number;
}

export interface DeferredItem {
  id: string;
  url: string;
  title: string;
  createdAt: string;
  completedAt?: string;
  dismissed: boolean;
  completed: boolean;
}

export interface RecentClosedStack {
  id: string;
  label: string;
  closedAt: string;
  tabs: Array<{
    url: string;
    title: string;
  }>;
}
