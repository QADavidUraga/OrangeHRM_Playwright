import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the OrangeHRM login screen.
 * Encapsulates the locators and actions needed to authenticate (or fail to).
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly invalidCredentialsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.invalidCredentialsMessage = page.getByText('Invalid credentials');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.goto();
    await expect(this.usernameInput).toBeVisible({ timeout: 10_000 });
    await this.usernameInput.fill(username);
    await expect(this.passwordInput).toBeVisible({ timeout: 10_000 });
    await this.passwordInput.fill(password);
    await expect(this.submitButton).toBeVisible();
    await this.submitButton.click();

    // Cypress's command queue naturally waits for the resulting page
    // transition before the next command runs; Playwright does not, so we
    // wait here for either outcome (success → /dashboard, failure → message)
    // before handing control back — otherwise a subsequent navigation can
    // race the login request and land back on the login screen.
    await Promise.race([
      this.page.waitForURL(/\/dashboard/, { timeout: 15_000 }),
      this.invalidCredentialsMessage.waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => {});
  }

  async expectInvalidCredentials(): Promise<void> {
    await expect(this.invalidCredentialsMessage).toBeVisible({ timeout: 10_000 });
  }
}
