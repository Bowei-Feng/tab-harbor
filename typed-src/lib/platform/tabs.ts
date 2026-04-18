import type { BrowserTabLike } from '@/lib/domain/models';

export function normalizeBrowserTabs(tabs: BrowserTabLike[]): BrowserTabLike[] {
  return tabs.map((tab) => ({
    id: tab.id,
    url: tab.url ?? '',
    title: tab.title ?? '',
    active: Boolean(tab.active),
    windowId: tab.windowId,
    favIconUrl: tab.favIconUrl ?? ''
  }));
}
