import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the OrangeHRM dashboard landing screen reached after login.
 */
export class DashboardPage {
  readonly page: Page;
  readonly dashboardHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    // "Dashboard" appears both in the sidebar menu and the page header;
    // `.first()` mirrors Cypress's `cy.contains`, which yields the first match.
    this.dashboardHeading = page.getByText('Dashboard').first();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(this.dashboardHeading).toBeVisible({ timeout: 10_000 });
  }
}
