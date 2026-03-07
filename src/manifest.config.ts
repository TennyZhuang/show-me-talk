import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from '../package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'show-me-talk',
  version: packageJson.version,
  description: 'Auto-collapses code in GitHub pull requests so only the talk stays open.',
  minimum_chrome_version: '120',
  permissions: ['storage'],
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_title: 'show-me-talk',
    default_popup: 'src/popup/index.html',
  },
  options_page: 'src/options/index.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://github.com/*/*/pull/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  homepage_url: 'https://github.com/TennyZhuang/show-me-talk',
});
