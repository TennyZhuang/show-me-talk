import { DEFAULT_SETTINGS, normalizeSettings } from '../shared/settings';

async function ensureSettings(): Promise<void> {
  const current = (await chrome.storage.sync.get(
    DEFAULT_SETTINGS as unknown as Record<string, unknown>,
  )) as Partial<typeof DEFAULT_SETTINGS>;
  await chrome.storage.sync.set(normalizeSettings(current));
}

chrome.runtime.onInstalled.addListener(() => {
  void ensureSettings();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureSettings();
});
