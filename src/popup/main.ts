import { loadSettings, saveSettings } from '../shared/settings';

async function main(): Promise<void> {
  const enabledToggle = document.getElementById('enabled');
  const openOptionsButton = document.getElementById('open-options');

  if (!(enabledToggle instanceof HTMLInputElement) || !(openOptionsButton instanceof HTMLButtonElement)) {
    return;
  }

  const settings = await loadSettings();
  enabledToggle.checked = settings.enabled;

  enabledToggle.addEventListener('change', async () => {
    await saveSettings({ ...settings, enabled: enabledToggle.checked });
  });

  openOptionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

void main();
