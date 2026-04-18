import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'typed-src',
  manifest: {
    name: 'Tab Harbor',
    description: 'A calm tab triage workspace for Microsoft Edge and other Chromium browsers.',
    permissions: ['tabs', 'storage'],
    options_page: 'options.html',
    chrome_url_overrides: {
      newtab: 'newtab.html'
    }
  }
});
