import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'typed-src',
  manifest: {
    name: 'Tab Harbor',
    description: 'A calm tab triage workspace for Microsoft Edge and other Chromium browsers.',
    permissions: ['tabs', 'storage'],
    icons: {
      '16': 'assets/icons/icon-16.png',
      '32': 'assets/icons/icon-32.png',
      '48': 'assets/icons/icon-48.png',
      '128': 'assets/icons/icon-128.png'
    },
    action: {
      default_icon: {
        '16': 'assets/icons/icon-16.png',
        '32': 'assets/icons/icon-32.png',
        '48': 'assets/icons/icon-48.png'
      }
    },
    options_page: 'options.html',
    chrome_url_overrides: {
      newtab: 'newtab.html'
    }
  }
});
