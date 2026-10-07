import { defineConfig } from '@playwright/test'

const managedURL = process.env.FINANCE_E2E_BASE_URL
const baseURL = managedURL ?? 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL, browserName: 'chromium', channel: 'msedge', viewport: { width: 1440, height: 1000 }, locale: 'ru-RU', timezoneId: 'Europe/Moscow' },
  webServer: managedURL ? undefined : { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173 --strictPort', url: baseURL, reuseExistingServer: false },
})
