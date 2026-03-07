import { expect, test } from './fixtures';

test('keeps docs open on docs-only PRs', async ({ context }) => {
  const page = await context.newPage();
  await page.goto('https://github.com/microsoft/playwright/pull/37053/files', {
    waitUntil: 'domcontentloaded',
  });

  const fileHeader = page.locator('.file-header[data-path="docs/src/chrome-extensions-js-python.md"]');
  await expect(fileHeader).toBeVisible();
  await expect(page.locator('#show-me-talk-toolbar')).toBeVisible();
  await expect(page.locator('#show-me-talk-toolbar')).toContainText('1 talk files');
  await expect(fileHeader.locator('.js-details-target')).toHaveAttribute('aria-expanded', 'true');
  await page.close();
});

test('collapses code on code-only PRs', async ({ context }) => {
  const page = await context.newPage();
  await page.goto('https://github.com/microsoft/playwright/pull/39549/files', {
    waitUntil: 'domcontentloaded',
  });

  const fileHeader = page.locator('.file-header[data-path="packages/playwright-core/src/cli/client/program.ts"]');
  await expect(fileHeader).toBeVisible();
  await expect(page.locator('#show-me-talk-toolbar')).toBeVisible();
  await expect(fileHeader.locator('.js-details-target')).toHaveAttribute('aria-expanded', 'false');
  await page.close();
});

test('keeps docs open and collapses code on mixed PRs', async ({ context }) => {
  const page = await context.newPage();
  await page.goto('https://github.com/microsoft/playwright/pull/39546/files', {
    waitUntil: 'domcontentloaded',
  });

  const docsHeader = page.locator('.file-header[data-path="docs/src/api/class-android.md"]');
  const codeHeader = page.locator('.file-header[data-path="packages/playwright-core/src/client/android.ts"]');

  await expect(docsHeader).toBeVisible();
  await expect(codeHeader).toBeVisible();
  await expect(page.locator('#show-me-talk-toolbar')).toBeVisible();
  await expect(docsHeader.locator('.js-details-target')).toHaveAttribute('aria-expanded', 'true');
  await expect(codeHeader.locator('.js-details-target')).toHaveAttribute('aria-expanded', 'false');
  await page.close();
});
