import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:8088',
  },
  projects: [
    {
      name: 'mobile',
      use: { viewport: { width: 360, height: 800 } },
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
});
