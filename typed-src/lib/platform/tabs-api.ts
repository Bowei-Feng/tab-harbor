import { browser } from 'wxt/browser';
import type { BrowserTabLike } from '@/lib/domain/models';
import type { SnapshotWindow } from '@/lib/domain/workspace-snapshot';

export async function listTabs(): Promise<BrowserTabLike[]> {
  const windows = await browser.windows.getAll({ populate: true });
  return windows.flatMap((window) =>
    (window.tabs ?? []).map((tab: {
      id?: number;
      url?: string;
      title?: string;
      active?: boolean;
      windowId?: number;
      favIconUrl?: string;
      index?: number;
    }) => ({
      id: tab.id,
      url: tab.url ?? '',
      title: tab.title ?? '',
      active: Boolean(tab.active),
      windowId: tab.windowId,
      favIconUrl: tab.favIconUrl ?? '',
      tabIndex: tab.index ?? 0,
      windowFocused: window.focused === true
    }))
  );
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

export async function openTabWindows(windows: SnapshotWindow[]): Promise<number[]> {
  const targetWindows = windows
    .map((window) => ({
      tabs: window.tabs.filter((tab) => tab.url),
      activeTabIndex: window.activeTabIndex ?? 0,
      focused: window.focused === true
    }))
    .filter((window) => window.tabs.length > 0);

  if (!targetWindows.length) return [];

  const createdWindowIds: number[] = [];
  let focusedWindowId: number | null = null;

  for (const targetWindow of targetWindows) {
    const createdWindow = await browser.windows.create({
      focused: false,
      url: targetWindow.tabs.map((tab) => tab.url)
    });

    if (!createdWindow?.id) {
      throw new Error('Failed to create snapshot window');
    }

    createdWindowIds.push(createdWindow.id);

    const tabs = (await browser.tabs.query({ windowId: createdWindow.id })).sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0)
    );
    const activeTab = tabs[Math.min(targetWindow.activeTabIndex, Math.max(0, tabs.length - 1))];
    if (activeTab?.id) {
      await browser.tabs.update(activeTab.id, { active: true });
    }

    if (targetWindow.focused) {
      focusedWindowId = createdWindow.id;
    }
  }

  const targetFocusId = focusedWindowId ?? createdWindowIds[0];
  if (targetFocusId) {
    await browser.windows.update(targetFocusId, { focused: true });
  }

  return createdWindowIds;
}

export async function closeWindows(windowIds: number[]): Promise<void> {
  for (const windowId of windowIds) {
    try {
      await browser.windows.remove(windowId);
    } catch {}
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
