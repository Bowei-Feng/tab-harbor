import { browser } from 'wxt/browser';

export async function getStorageValue<T>(key: string, fallback: T): Promise<T> {
  const result = await browser.storage.local.get(key);
  return (result[key] as T | undefined) ?? fallback;
}

export async function setStorageValue<T>(key: string, value: T): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}
