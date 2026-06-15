import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  timeout: 60_000,

  expect: {
    timeout: 10_000,
  },

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],

  outputDir: 'test-results',

  use: {
    actionTimeout: 10_000,
    navigationTimeout: 30_000,

    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    locale: 'es-ES',
  },

  projects: [
    {
      name: 'orangehrm',
      testMatch: /orangehrm\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://opensource-demo.orangehrmlive.com/',
      },
    },

    {
      name: 'chatbot',
      testMatch: /chatbot\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://programamazsalud.com.mx/',
      },
    },
  ],
});