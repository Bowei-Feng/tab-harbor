import { browser } from 'wxt/browser';
import type { BrowserTabLike } from '@/lib/domain/models';

export async function listTabs(): Promise<BrowserTabLike[]> {
  const tabs = await browser.tabs.query({});
  return tabs.map((tab: { id?: number; url?: string; title?: string; active?: boolean; windowId?: number; favIconUrl?: string }) => ({
    id: tab.id,
    url: tab.url ?? '',
    title: tab.title ?? '',
    active: Boolean(tab.active),
    windowId: tab.windowId,
    favIconUrl: tab.favIconUrl ?? ''
  }));
}

export async function focusTab(tabId: number, windowId: number): Promise<void> {
  await browser.tabs.update(tabId, { active: true });
  await browser.windows.update(windowId, { focused: true });
}

export async function closeTab(tabId: number): Promise<void> {
  await browser.tabs.remove(tabId);
}

export async function closeTabs(tabIds: number[]): Promise<void> {
  if (!tabIds.length) return;
  await browser.tabs.remove(tabIds);
}

export async function openTabs(urls: string[]): Promise<void> {
  for (const [index, url] of urls.entries()) {
    await browser.tabs.create({ url, active: index === 0 });
  }
}

export async function openTabWindows(windows: string[][]): Promise<void> {
  const nonEmptyWindows = windows.map((tabs) => tabs.filter(Boolean)).filter((tabs) => tabs.length > 0);
  if (!nonEmptyWindows.length) return;

  const [firstWindow, ...restWindows] = nonEmptyWindows;
  const created = await browser.windows.create({ url: firstWindow });

  for (const urls of restWindows) {
    await browser.windows.create({ url: urls });
  }

  if (created?.id) {
    await browser.windows.update(created.id, { focused: true });
  }
}

export async function moveTabsToNewWindow(tabIds: number[]): Promise<void> {
  if (!tabIds.length) return;

  const [firstTabId, ...restTabIds] = tabIds;
  const createdWindow = await browser.windows.create({ tabId: firstTabId });
  const windowId = createdWindow?.id;
  if (!windowId) return;

  if (restTabIds.length) {
    await browser.tabs.move(restTabIds, { windowId, index: -1 });
  }

  await browser.windows.update(windowId, { focused: true });
}
