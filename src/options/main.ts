import { DEFAULT_KEEP_PATTERNS, loadSettings, resetSettings, saveSettings } from '../shared/settings';

function formatPatterns(patterns: string[]): string {
  return patterns.join('\n');
}

async function main(): Promise<void> {
  const enabledToggle = document.getElementById('enabled');
  const patterns = document.getElementById('patterns');
  const defaults = document.getElementById('defaults');
  const saveButton = document.getElementById('save');
  const resetButton = document.getElementById('reset');
  const status = document.getElementById('status');

  if (
    !(enabledToggle instanceof HTMLInputElement) ||
    !(patterns instanceof HTMLTextAreaElement) ||
    !(defaults instanceof HTMLElement) ||
    !(saveButton instanceof HTMLButtonElement) ||
    !(resetButton instanceof HTMLButtonElement) ||
    !(status instanceof HTMLElement)
  ) {
    return;
  }

  const settings = await loadSettings();
  enabledToggle.checked = settings.enabled;
  patterns.value = formatPatterns(settings.customKeepPatterns);
  defaults.textContent = formatPatterns(DEFAULT_KEEP_PATTERNS);

  saveButton.addEventListener('click', async () => {
    await saveSettings({
      enabled: enabledToggle.checked,
      customKeepPatterns: patterns.value
        .split('\n')
        .map((pattern) => pattern.trim())
        .filter(Boolean),
    });
    status.textContent = 'Saved.';
  });

  resetButton.addEventListener('click', async () => {
    const nextSettings = await resetSettings();
    enabledToggle.checked = nextSettings.enabled;
    patterns.value = formatPatterns(nextSettings.customKeepPatterns);
    status.textContent = 'Reset to defaults.';
  });
}

void main();
