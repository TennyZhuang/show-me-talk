export interface ShowMeTalkSettings {
  enabled: boolean;
  customKeepPatterns: string[];
}

export const DEFAULT_KEEP_PATTERNS = [
  '**/*.md',
  '**/*.mdx',
  '**/*.markdown',
  '**/*.rst',
  '**/*.adoc',
  '**/*.txt',
  '**/README',
  '**/README.*',
  '**/CHANGELOG',
  '**/CHANGELOG.*',
  '**/llms.txt',
  '**/AGENTS.md',
  '**/CLAUDE.md',
  '**/GEMINI.md',
  '**/CONTRIBUTING.md',
  '**/SECURITY.md',
  '**/CODE_OF_CONDUCT.md',
  '**/copilot-instructions.md',
  '**/*.prompt',
  '**/*.prompt.md',
  '.github/PULL_REQUEST_TEMPLATE',
  '.github/PULL_REQUEST_TEMPLATE/**',
  '.github/pull_request_template.md',
  'docs/**',
  'documentation/**',
];

export const DEFAULT_SETTINGS: ShowMeTalkSettings = {
  enabled: true,
  customKeepPatterns: [],
};

export function normalizeSettings(
  value: Partial<ShowMeTalkSettings> | undefined,
): ShowMeTalkSettings {
  const customKeepPatterns = Array.isArray(value?.customKeepPatterns)
    ? value.customKeepPatterns
        .map((pattern) => pattern.trim())
        .filter(Boolean)
    : [];

  return {
    enabled: value?.enabled ?? true,
    customKeepPatterns,
  };
}

export function getAllKeepPatterns(settings: ShowMeTalkSettings): string[] {
  return [...DEFAULT_KEEP_PATTERNS, ...settings.customKeepPatterns];
}

export async function loadSettings(): Promise<ShowMeTalkSettings> {
  const stored = (await chrome.storage.sync.get(
    DEFAULT_SETTINGS as unknown as Record<string, unknown>,
  )) as Partial<ShowMeTalkSettings>;
  return normalizeSettings(stored);
}

export async function saveSettings(settings: ShowMeTalkSettings): Promise<void> {
  await chrome.storage.sync.set(normalizeSettings(settings));
}

export async function resetSettings(): Promise<ShowMeTalkSettings> {
  await chrome.storage.sync.set(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}
