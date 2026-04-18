import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { tabActivityRepository } from '@/lib/storage/tab-activity-repository';

export default defineBackground(() => {
  async function seedActiveTabs() {
    try {
      const tabs = await browser.tabs.query({ active: true });
      await Promise.all(
        tabs
          .map((tab: { id?: number }) => tab.id)
          .filter((tabId): tabId is number => typeof tabId === 'number')
          .map((tabId) => tabActivityRepository.mark(tabId))
      );
    } catch {}
  }

  async function updateBadge() {
    try {
      const tabs = await browser.tabs.query({});
      const count = tabs.filter((tab: { url?: string | undefined }) => {
        const url = tab.url ?? '';
        return (
          url &&
          !url.startsWith('edge://') &&
          !url.startsWith('chrome://') &&
          !url.startsWith('chrome-extension://') &&
          !url.startsWith('about:')
        );
      }).length;

      await browser.action.setBadgeText({ text: count ? String(count) : '' });
      await browser.action.setBadgeBackgroundColor({
        color: count > 20 ? '#f45b69' : count > 10 ? '#ff9f1c' : '#18a999'
      });
    } catch {
      await browser.action.setBadgeText({ text: '' });
    }
  }

  browser.runtime.onInstalled.addListener(updateBadge);
  browser.runtime.onInstalled.addListener(() => {
    void seedActiveTabs();
  });
  browser.runtime.onStartup.addListener(updateBadge);
  browser.runtime.onStartup.addListener(() => {
    void seedActiveTabs();
  });
  browser.tabs.onCreated.addListener(updateBadge);
  browser.tabs.onActivated.addListener((info) => {
    void tabActivityRepository.mark(info.tabId);
  });
  browser.tabs.onRemoved.addListener((tabId) => {
    void updateBadge();
    void tabActivityRepository.remove(tabId);
  });
  browser.tabs.onUpdated.addListener(updateBadge);
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      void tabActivityRepository.mark(tabId);
    }
  });

  void updateBadge();
  void seedActiveTabs();
});
