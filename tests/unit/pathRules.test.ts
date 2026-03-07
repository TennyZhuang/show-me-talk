import { describe, expect, it } from 'vitest';

import { globToRegExp, isTalkWorthReview, matchesPattern } from '../../src/shared/pathRules';
import { DEFAULT_SETTINGS } from '../../src/shared/settings';

describe('glob matching', () => {
  it('matches nested markdown files', () => {
    expect(matchesPattern('**/*.md', 'docs/guide/README.md')).toBe(true);
    expect(matchesPattern('**/*.md', 'src/index.ts')).toBe(false);
  });

  it('supports docs folder globs', () => {
    expect(globToRegExp('docs/**').test('docs/reference/api.json')).toBe(true);
  });
});

describe('talk-worthy rules', () => {
  it('keeps llms and markdown files open', () => {
    expect(isTalkWorthReview('llms.txt', DEFAULT_SETTINGS)).toBe(true);
    expect(isTalkWorthReview('docs/design.md', DEFAULT_SETTINGS)).toBe(true);
  });

  it('collapses code files by default', () => {
    expect(isTalkWorthReview('src/index.ts', DEFAULT_SETTINGS)).toBe(false);
    expect(isTalkWorthReview('packages/core/main.go', DEFAULT_SETTINGS)).toBe(false);
  });

  it('respects custom patterns', () => {
    expect(
      isTalkWorthReview('specs/architecture.yaml', {
        ...DEFAULT_SETTINGS,
        customKeepPatterns: ['specs/**'],
      }),
    ).toBe(true);
  });
});
