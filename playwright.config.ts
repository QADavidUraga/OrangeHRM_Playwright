import { defineConfig, devices } from '@playwright/test';

/**
 * Shared Chrome launch flags ported from the original cypress.config.js
 * `before:browser:launch` hook (anti-bot-detection flag + Spanish locale).
 */
const CHROME_LAUNCH_ARGS = ['--disable-blink-features=AutomationControlled'];
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 12_000, // mirrors Cypress's defaultCommandTimeout: 12000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
  ],
  outputDir: 'test-results',

  use: {
    actionTimeout: 12_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-ES',
    userAgent: USER_AGENT,
  },

  projects: [
    {
      name: 'orangehrm',
      testMatch: /orangehrm\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://opensource-demo.orangehrmlive.com/',
        launchOptions: { args: CHROME_LAUNCH_ARGS },
      },
    },
    {
      name: 'chatbot',
      testMatch: /chatbot\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://programamazsalud.com.mx/',
        launchOptions: { args: CHROME_LAUNCH_ARGS },
      },
    },
  ],
});
