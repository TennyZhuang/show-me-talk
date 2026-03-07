import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const extensionPath = path.join(projectRoot, 'dist');
const assetDir = path.join(projectRoot, 'store-assets');

async function launchExtensionContext() {
  return chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 800 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
}

async function getExtensionId(context) {
  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }
  return new URL(serviceWorker.url()).host;
}

async function captureGitHubShot(context, fileName, url, settleMs = 3500) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#show-me-talk-toolbar');
  await page.waitForTimeout(settleMs);
  await page.screenshot({ path: path.join(assetDir, fileName) });
  await page.close();
}

async function captureExtensionPage(context, extensionId, fileName, relativePath, viewport = { width: 1280, height: 800 }) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  await page.goto(`chrome-extension://${extensionId}/${relativePath}`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(assetDir, fileName) });
  await page.close();
}

async function capturePromoImage(context, fileName, size, html) {
  const page = await context.newPage();
  await page.setViewportSize(size);
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(assetDir, fileName) });
  await page.close();
}

function marketingHtml({ width, height, eyebrow, title, body, chip, includeWindow }) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          width: ${width}px;
          height: ${height}px;
          overflow: hidden;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          color: #e2e8f0;
          background:
            radial-gradient(circle at top left, rgba(56, 189, 248, 0.22), transparent 36%),
            radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.18), transparent 30%),
            linear-gradient(135deg, #020617 0%, #0f172a 58%, #111827 100%);
        }
        .wrap {
          position: relative;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          width: 100%;
          height: 100%;
          padding: ${width > 1000 ? 48 : 28}px;
          gap: ${width > 1000 ? 28 : 20}px;
        }
        .left {
          display: grid;
          align-content: center;
          gap: 18px;
        }
        .eyebrow {
          color: #38bdf8;
          font-size: ${width > 1000 ? 22 : 16}px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        h1 {
          margin: 0;
          font-size: ${width > 1000 ? 64 : 34}px;
          line-height: 1.02;
          max-width: 7.5em;
        }
        p {
          margin: 0;
          color: #cbd5e1;
          font-size: ${width > 1000 ? 24 : 15}px;
          line-height: 1.45;
          max-width: 28em;
        }
        .chip {
          display: inline-flex;
          width: fit-content;
          padding: 10px 16px;
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.72);
          color: #7dd3fc;
          font-size: ${width > 1000 ? 18 : 13}px;
          font-weight: 700;
        }
        .right {
          position: relative;
          display: grid;
          align-content: center;
          justify-items: end;
        }
        .window {
          width: 100%;
          max-width: ${width > 1000 ? 620 : 340}px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.78);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.42);
          overflow: hidden;
        }
        .bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }
        .dot { width: 10px; height: 10px; border-radius: 999px; background: #334155; }
        .content { padding: 20px; display: grid; gap: 14px; }
        .toolbar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 999px;
          background: rgba(2, 6, 23, 0.54);
          color: #e2e8f0;
          font-size: ${width > 1000 ? 15 : 11}px;
        }
        .pill {
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.16);
          color: #7dd3fc;
          font-weight: 700;
        }
        .row {
          display: grid;
          gap: 10px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(2, 6, 23, 0.68);
          border: 1px solid rgba(148, 163, 184, 0.16);
        }
        .row strong { font-size: ${width > 1000 ? 18 : 13}px; }
        .line {
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(90deg, #38bdf8 0%, #1d4ed8 100%);
          opacity: 0.78;
        }
        .line.dim { width: 72%; opacity: 0.28; }
        .line.short { width: 46%; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <section class="left">
          <div class="eyebrow">${eyebrow}</div>
          <h1>${title}</h1>
          <p>${body}</p>
          <div class="chip">${chip}</div>
        </section>
        <section class="right">
          ${includeWindow ? `
            <div class="window">
              <div class="bar"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
              <div class="content">
                <div class="toolbar"><span class="pill">show-me-talk</span><span>0 collapsed · 1 talk file · 14 code files</span></div>
                <div class="row"><strong>docs/architecture.md</strong><div class="line"></div><div class="line dim"></div><div class="line short"></div></div>
                <div class="row"><strong>src/worker.ts</strong><div class="line dim"></div></div>
                <div class="row"><strong>llms.txt</strong><div class="line"></div><div class="line short"></div></div>
              </div>
            </div>` : ''}
        </section>
      </div>
    </body>
  </html>`;
}

async function main() {
  await mkdir(assetDir, { recursive: true });

  const context = await launchExtensionContext();
  const extensionId = await getExtensionId(context);

  await captureGitHubShot(
    context,
    'screenshot-1-mixed-pr.png',
    'https://github.com/microsoft/playwright/pull/39546/files',
  );
  await captureGitHubShot(
    context,
    'screenshot-2-docs-only.png',
    'https://github.com/microsoft/playwright/pull/37053/files',
  );
  await captureGitHubShot(
    context,
    'screenshot-3-code-only.png',
    'https://github.com/microsoft/playwright/pull/39549/files',
  );

  await captureExtensionPage(context, extensionId, 'screenshot-4-options.png', 'src/options/index.html');
  await captureExtensionPage(context, extensionId, 'screenshot-5-popup.png', 'src/popup/index.html', {
    width: 1280,
    height: 800,
  });

  await capturePromoImage(
    context,
    'small-promo-tile-440x280.png',
    { width: 440, height: 280 },
    marketingHtml({
      width: 440,
      height: 280,
      eyebrow: 'Chrome Extension',
      title: 'Review the talk.',
      body: 'Auto-collapse code in GitHub PRs and keep docs, llms.txt, and instructions open.',
      chip: 'Talk is worth review',
      includeWindow: true,
    }),
  );

  await capturePromoImage(
    context,
    'marquee-promo-tile-1400x560.png',
    { width: 1400, height: 560 },
    marketingHtml({
      width: 1400,
      height: 560,
      eyebrow: 'show-me-talk',
      title: 'Code is cheap.\nShow me the talk.',
      body: 'A Manifest V3 Chrome extension for GitHub pull requests that keeps Markdown, llms.txt, and agent instructions visible first.',
      chip: 'Built for the agent era',
      includeWindow: true,
    }),
  );

  await writeFile(
    path.join(assetDir, 'README.txt'),
    [
      'Chrome Web Store assets generated from the local extension build.',
      'Screenshots: 1280x800 PNG',
      'Small promo tile: 440x280 PNG',
      'Marquee promo tile: 1400x560 PNG',
    ].join('\n'),
  );

  await context.close();
}

await main();
