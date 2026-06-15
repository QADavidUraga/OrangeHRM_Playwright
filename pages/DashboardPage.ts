import { expect, type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly dashboardHeading: Locator;
  readonly userDropdownTab: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.dashboardHeading = page.getByText('Dashboard').first();
    this.userDropdownTab = page.locator('span.oxd-userdropdown-tab');
    this.logoutLink = page.getByRole('menuitem', { name: 'Logout' });
  }

  async expectLoaded() {
    await expect(this.dashboardHeading).toBeVisible({ timeout: 15000 });
    await this.page.waitForURL(/dashboard/, { timeout: 15000 });
  }

  async logout() {
    await expect(this.userDropdownTab).toBeVisible();
    await this.userDropdownTab.click();

    await expect(this.logoutLink).toBeVisible();
    await this.logoutLink.click();
  }
}