import { expect, type Locator, type Page } from '@playwright/test';

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

    this.invalidCredentialsMessage =
      page.getByText('Invalid credentials');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.goto();

    await expect(this.usernameInput).toBeVisible();
    await this.usernameInput.fill(username);

    await expect(this.passwordInput).toBeVisible();
    await this.passwordInput.fill(password);

    await this.submitButton.click();

    await Promise.race([
      this.page.waitForURL(/dashboard/, { timeout: 15000 }),
      this.invalidCredentialsMessage.waitFor({ state: 'visible', timeout: 15000 }),
    ]);
  }

  async expectInvalidCredentials() {
    await expect(this.invalidCredentialsMessage).toBeVisible();
  }
}