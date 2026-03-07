# show-me-talk

> Talk is worth review. Code can wait collapsed.

`show-me-talk` is a Manifest V3 Chrome extension for GitHub pull requests. When you open a PR's `Files changed` view, it auto-collapses code files and leaves the talk open: Markdown, `llms.txt`, agent instructions, PR templates, docs folders, and any custom text-first paths you choose.

This is a completely vibe coded project.

## Why

The usual slogan is _"Talk is cheap, show me the code."_

In the agent era, this project takes the opposite side:

> code is cheap, show me the talk.

If the diff is mostly generated, delegated, or machine-assisted, the highest-signal review surface is often the intent: specs, docs, prompts, instructions, policy, and user-facing explanation. `show-me-talk` makes that surface visible first.

## Features

- Auto-collapses non-talk files on GitHub PR pages.
- Keeps text-first review targets open by default:
  - `*.md`, `*.mdx`, `*.markdown`, `*.rst`, `*.adoc`, `*.txt`
  - `llms.txt`
  - `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `copilot-instructions.md`
  - `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`
  - `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/**`
  - `docs/**`, `documentation/**`
- Adds an inline toolbar on GitHub PRs with:
  - `Collapse code`
  - `Expand all`
  - `Reset`
- Supports custom keep-open glob patterns in the options page.
- Uses minimal permissions: only `storage`.
- Includes live Playwright integration tests against public GitHub PRs.

## Tech stack

- Manifest V3
- TypeScript
- Vite 7 + `@crxjs/vite-plugin` 2.3.0
- Playwright 1.58.2
- ESLint 10 + Vitest 4

This structure follows current Chrome extension best practices:

- MV3 service worker instead of background pages
- static content script injection for known URLs
- minimal permissions
- event-driven behavior
- modern Vite-based bundling
- browser-level integration testing against real GitHub pages

## Project structure

```text
src/
  background/        MV3 service worker
  content/           GitHub PR auto-collapse logic
  options/           settings page
  popup/             quick toggle UI
  shared/            rules and storage helpers
tests/
  live/              Playwright tests against public PR pages
  unit/              rule engine tests
.github/workflows/  CI and release automation
scripts/            release packaging
```

## Development

### Requirements

- Node.js 24+
- npm 11+
- Chromium installed via Playwright

### Install

```bash
npm install
npm run browsers:install
```

### Run locally

```bash
npm run dev
```

Then open `chrome://extensions`, enable Developer Mode, and load the generated extension from the dev output folder if needed.

### Build

```bash
npm run build
```

### Test

```bash
npm run test:unit
npm run test:live
```

Live tests currently validate real public GitHub PRs:

- `microsoft/playwright#37053` for docs-only behavior
- `microsoft/playwright#39549` for code-only behavior
- `microsoft/playwright#39546` for mixed docs + code behavior

## Release

### Local package

```bash
npm run package:extension
```

This outputs a versioned Chrome extension zip under `release/`.

### GitHub release flow

- Push a tag like `v0.1.0`
- GitHub Actions builds the extension
- GitHub Actions uploads the zip artifact
- GitHub Actions creates or updates the GitHub Release with generated notes

## Philosophy defaults

By default, `show-me-talk` assumes these are worth opening first:

- design docs
- specs
- prompts
- agent instructions
- policies
- human explanation

Everything else can earn its expansion later.


## Chrome Web Store assets

Generate ready-to-upload store assets locally:

```bash
npm run assets:store
```

This creates screenshots and promo images under `store-assets/` plus ready-to-paste listing copy in `docs-store-listing.md` and a privacy policy in `PRIVACY.md`.

## License

MIT
