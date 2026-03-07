import { isTalkWorthReview } from '../shared/pathRules';
import { DEFAULT_SETTINGS, loadSettings, type ShowMeTalkSettings } from '../shared/settings';

const FILE_SELECTOR = '.file.js-file[data-details-container-group="file"]';
const TOOLBAR_ID = 'show-me-talk-toolbar';

interface ScanStats {
  totalFiles: number;
  talkFiles: number;
  codeFiles: number;
  collapsedFiles: number;
}

function isPullRequestPage(url: URL): boolean {
  return url.hostname === 'github.com' && /^\/[^/]+\/[^/]+\/pull\/\d+/.test(url.pathname);
}

export class GitHubPullRequestController {
  private observer: MutationObserver | null = null;

  private scanTimer: number | null = null;

  private followUpScanTimers: number[] = [];

  private settings: ShowMeTalkSettings = DEFAULT_SETTINGS;

  private currentUrl = window.location.href;

  private manualOverrides = new Set<string>();

  private programmaticToggleButtons = new WeakSet<HTMLButtonElement>();

  private readonly boundHandleMutations = (): void => {
    this.handleNavigation();
    this.scheduleScan();
  };

  private readonly boundHandleScroll = (): void => {
    this.scheduleScan();
  };

  private readonly boundHandleClicks = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionButton = target.closest<HTMLElement>('[data-show-me-talk-action]');
    if (actionButton) {
      this.handleToolbarAction(actionButton.dataset.showMeTalkAction ?? '');
      return;
    }

    const toggleButton = target.closest<HTMLButtonElement>('.file-header .js-details-target');
    if (!toggleButton) {
      return;
    }

    if (this.programmaticToggleButtons.has(toggleButton)) {
      this.programmaticToggleButtons.delete(toggleButton);
      return;
    }

    const fileHeader = toggleButton.closest<HTMLElement>('.file-header[data-path]');
    const fileKey = this.getFileKey(fileHeader);
    if (fileKey) {
      this.manualOverrides.add(fileKey);
    }
  };

  private readonly boundHandleStorageChanges = (): void => {
    void this.reloadSettings();
  };

  async start(): Promise<void> {
    this.settings = await loadSettings();
    this.bind();
    this.scheduleScan();
    this.queueFollowUpScans();
  }

  private bind(): void {
    this.observer = new MutationObserver(this.boundHandleMutations);
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded', 'data-path', 'class', 'open'],
    });

    document.addEventListener('click', this.boundHandleClicks, true);
    document.addEventListener('pjax:end', this.boundHandleMutations);
    document.addEventListener('turbo:render', this.boundHandleMutations);
    window.addEventListener('popstate', this.boundHandleMutations);
    window.addEventListener('scroll', this.boundHandleScroll, { passive: true });
    chrome.storage.onChanged.addListener(this.boundHandleStorageChanges);
  }

  private async reloadSettings(): Promise<void> {
    this.settings = await loadSettings();
    this.scheduleScan(true);
  }

  private handleNavigation(): void {
    if (window.location.href === this.currentUrl) {
      return;
    }

    this.currentUrl = window.location.href;
    this.manualOverrides.clear();
    this.queueFollowUpScans();
  }

  private scheduleScan(force = false): void {
    if (force) {
      this.manualOverrides.clear();
    }

    if (this.scanTimer !== null) {
      window.clearTimeout(this.scanTimer);
    }

    this.scanTimer = window.setTimeout(() => {
      this.scanTimer = null;
      this.scanPage();
    }, 120);
  }

  private queueFollowUpScans(): void {
    for (const timer of this.followUpScanTimers) {
      window.clearTimeout(timer);
    }

    this.followUpScanTimers = [250, 1000, 2500].map((delay) =>
      window.setTimeout(() => {
        this.scheduleScan();
      }, delay),
    );
  }

  private scanPage(): void {
    const url = new URL(window.location.href);
    if (!isPullRequestPage(url) || !this.settings.enabled) {
      this.removeToolbar();
      return;
    }

    const files = Array.from(document.querySelectorAll<HTMLElement>(FILE_SELECTOR));
    if (files.length === 0) {
      this.removeToolbar();
      return;
    }

    const stats: ScanStats = {
      totalFiles: files.length,
      talkFiles: 0,
      codeFiles: 0,
      collapsedFiles: 0,
    };

    for (const file of files) {
      const header = file.querySelector<HTMLElement>('.file-header[data-path]');
      const path = header?.dataset.path;
      if (!path) {
        continue;
      }

      const talkWorthy = isTalkWorthReview(path, this.settings);
      if (talkWorthy) {
        stats.talkFiles += 1;
        continue;
      }

      stats.codeFiles += 1;

      const fileKey = this.getFileKey(header);
      if (fileKey && this.manualOverrides.has(fileKey)) {
        continue;
      }

      const toggleButton = file.querySelector<HTMLButtonElement>('.file-header .js-details-target');
      if (toggleButton && toggleButton.getAttribute('aria-expanded') === 'true') {
        this.programmaticToggleButtons.add(toggleButton);
        toggleButton.click();
        stats.collapsedFiles += 1;
      }
    }

    this.renderToolbar(stats);
  }

  private getFileKey(header: HTMLElement | null): string | null {
    if (!header) {
      return null;
    }

    return header.dataset.anchor ?? header.dataset.path ?? null;
  }

  private handleToolbarAction(action: string): void {
    if (action === 'reset') {
      this.manualOverrides.clear();
      this.scheduleScan(true);
      return;
    }

    if (action === 'expand-all') {
      for (const file of document.querySelectorAll<HTMLElement>(FILE_SELECTOR)) {
        const header = file.querySelector<HTMLElement>('.file-header[data-path]');
        const fileKey = this.getFileKey(header);
        if (fileKey) {
          this.manualOverrides.add(fileKey);
        }

        const toggleButton = file.querySelector<HTMLButtonElement>('.file-header .js-details-target');
        if (toggleButton?.getAttribute('aria-expanded') === 'false') {
          this.programmaticToggleButtons.add(toggleButton);
          toggleButton.click();
        }
      }

      this.scheduleScan();
      return;
    }

    if (action === 'collapse-code') {
      this.manualOverrides.clear();
      this.scheduleScan(true);
    }
  }

  private renderToolbar(stats: ScanStats): void {
    const anchor = document.querySelector<HTMLElement>('.pr-toolbar .diffbar');
    if (!anchor) {
      this.removeToolbar();
      return;
    }

    let toolbar = document.getElementById(TOOLBAR_ID);
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = TOOLBAR_ID;
      toolbar.className = 'show-me-talk-toolbar';
      toolbar.innerHTML = `
        <span class="show-me-talk-toolbar__title">show-me-talk</span>
        <span class="show-me-talk-toolbar__summary"></span>
        <button type="button" class="show-me-talk-toolbar__button" data-show-me-talk-action="collapse-code">Collapse code</button>
        <button type="button" class="show-me-talk-toolbar__button" data-show-me-talk-action="expand-all">Expand all</button>
        <button type="button" class="show-me-talk-toolbar__button" data-show-me-talk-action="reset">Reset</button>
      `;
      anchor.appendChild(toolbar);
    }

    const summary = toolbar.querySelector<HTMLElement>('.show-me-talk-toolbar__summary');
    if (summary) {
      summary.textContent = `${stats.collapsedFiles} collapsed · ${stats.talkFiles} talk files kept open · ${stats.codeFiles} code files detected`;
    }
  }

  private removeToolbar(): void {
    document.getElementById(TOOLBAR_ID)?.remove();
  }
}
