// playwright.config.js
const { devices } = require('@playwright/test');

module.exports = {
  testDir: 'e2e',
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 390, height: 844 },
    actionTimeout: 10000,
    baseURL: 'http://localhost:3000'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Pixel 5'] } }
  ]
};