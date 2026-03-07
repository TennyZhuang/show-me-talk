import { getAllKeepPatterns, type ShowMeTalkSettings } from './settings';

const regexCache = new Map<string, RegExp>();

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

export function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\/+/, '').trim().toLowerCase();
}

export function globToRegExp(pattern: string): RegExp {
  const normalizedPattern = normalizePath(pattern);
  const cached = regexCache.get(normalizedPattern);
  if (cached) {
    return cached;
  }

  let source = '^';

  for (let index = 0; index < normalizedPattern.length; index += 1) {
    const char = normalizedPattern[index];
    const next = normalizedPattern[index + 1];
    const afterNext = normalizedPattern[index + 2];

    if (char === '*' && next === '*' && afterNext === '/') {
      source += '(?:.*/)?';
      index += 2;
      continue;
    }

    if (char === '*' && next === '*') {
      source += '.*';
      index += 1;
      continue;
    }

    if (char === '*') {
      source += '[^/]*';
      continue;
    }

    if (char === '?') {
      source += '[^/]';
      continue;
    }

    source += escapeRegex(char);
  }

  source += '$';
  const regex = new RegExp(source, 'i');
  regexCache.set(normalizedPattern, regex);
  return regex;
}

export function matchesPattern(pattern: string, path: string): boolean {
  return globToRegExp(pattern).test(normalizePath(path));
}

export function isTalkWorthReview(path: string, settings: ShowMeTalkSettings): boolean {
  const normalizedPath = normalizePath(path);

  return getAllKeepPatterns(settings).some((pattern) => matchesPattern(pattern, normalizedPath));
}
