import { expect, type Locator, type Page } from '@playwright/test';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface NameDetails {
  firstName: string;
  middleName: string;
  lastName: string;
}

/**
 * Page Object for the "Personal Details" (PIM) screen.
 * Groups the Personal Details form, Custom Fields panel, Attachments table
 * and the user dropdown / logout flow that the original spec exercised
 * from this same page.
 */
export class PersonalDetailsPage {
  readonly page: Page;

  // Headings
  readonly personalDetailsHeading: Locator;

  // Personal Details form
  readonly firstNameInput: Locator;
  readonly middleNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly nationalityDropdown: Locator;
  readonly genderRadio: (value: string) => Locator;
  readonly saveButton: Locator;

  // Custom Fields panel
  readonly customFieldsHeading: Locator;
  readonly bloodTypeDropdown: Locator;
  readonly dropdownOption: (text: string) => Locator;
  readonly testFieldInput: Locator;

  // Attachments
  readonly addAttachmentButton: Locator;
  readonly fileInput: Locator;
  readonly fileNamePreview: Locator;
  readonly attachmentDescriptionTextarea: Locator;
  readonly attachmentForm: Locator;
  readonly attachmentTableRow: (fileName: string) => Locator;
  readonly confirmDeleteButton: Locator;

  // User menu / logout
  readonly userDropdown: (displayName: string) => Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // "Personal Details" appears both in the breadcrumb and the page header;
    // `.first()` mirrors Cypress's `cy.contains`, which yields the first match.
    this.personalDetailsHeading = page.getByText('Personal Details').first();

    this.firstNameInput = page.locator('input[name="firstName"]');
    this.middleNameInput = page.locator('input[name="middleName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    // Click the wrapper (the actual `oxd-select` widget), not the caret icon —
    // the icon itself does not register as the dropdown's click target and
    // leaves the option list closed.
    this.nationalityDropdown = page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Nationality' })
      .locator('.oxd-select-text');
    this.genderRadio = (value: string) => page.locator(`input[type="radio"][value="${value}"]`);
    this.saveButton = page.locator('button[type="submit"]').filter({ hasText: 'Save' }).first();

    this.customFieldsHeading = page.getByRole('heading', { name: 'Custom Fields' });
    this.bloodTypeDropdown = page
      .getByText('Custom Fields')
      .locator('xpath=..')
      .locator('div.oxd-select-text.oxd-select-text--active')
      .first();
    // Exact match (anchored regex) — a substring filter would make "B+" match
    // "AB+" too, since dropdown option labels like blood types overlap.
    this.dropdownOption = (text: string) =>
      page.locator('div[role="option"]').filter({ hasText: new RegExp(`^${escapeRegExp(text)}$`) });
    // `xpath=../..` walks label -> label-wrapper -> input-group: an
    // `ancestor::div[contains(@class,"oxd-input-group")]` filter would also
    // match the wrapper itself, since its class is "oxd-input-group__label-wrapper"
    // (a substring match), which contains no input.
    this.testFieldInput = page
      .locator('label.oxd-label')
      .filter({ hasText: 'Test_Field' })
      .locator('xpath=../..')
      .locator('input, div[contenteditable="true"]');

    this.addAttachmentButton = page.getByRole('button', { name: 'Add' });
    this.fileInput = page.locator('input[type="file"]');
    this.fileNamePreview = page.locator('.oxd-file-input-div');
    this.attachmentDescriptionTextarea = page.locator('textarea');
    this.attachmentForm = page.locator('div.orangehrm-attachment');
    // `.first()` mirrors Cypress's `cy.contains(...).parents('.oxd-table-row')`,
    // which always resolves to the first matching row even when the shared
    // demo account ends up with more than one attachment of the same name.
    this.attachmentTableRow = (fileName: string) =>
      page
        .locator('.oxd-table-row')
        .filter({ has: page.locator('.oxd-table-cell', { hasText: fileName }) })
        .first();
    this.confirmDeleteButton = page.locator('.oxd-button--label-danger');

    this.userDropdown = (displayName: string) =>
      page.locator('p.oxd-userdropdown-name').filter({ hasText: displayName });
    this.logoutLink = page.getByRole('link', { name: 'Logout' });
  }

  /** Generic helper: locates an `.oxd-input-group` that contains the given label text and returns its input. */
  private inputGroupFieldByLabel(labelText: string): Locator {
    return this.page
      .locator('.oxd-input-group')
      .filter({ hasText: labelText })
      .locator('input.oxd-input');
  }

  async goto(personalDetailsUrl: string): Promise<void> {
    // This SPA route briefly redirects during bootstrap; waiting for the
    // "load" event (Playwright's default) can race that redirect and throw
    // net::ERR_ABORTED, so we settle for "domcontentloaded" instead and let
    // `expectLoaded()` assert on the rendered heading.
    await this.page.goto(personalDetailsUrl, { waitUntil: 'domcontentloaded' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.personalDetailsHeading).toBeVisible({ timeout: 10_000 });
  }

  // ----- Personal Details form -----

  async fillName({ firstName, middleName, lastName }: NameDetails): Promise<void> {
    await expect(this.firstNameInput).toBeVisible({ timeout: 10_000 });
    await this.firstNameInput.clear();
    await this.firstNameInput.fill(firstName);

    await expect(this.middleNameInput).toBeVisible({ timeout: 10_000 });
    await this.middleNameInput.clear();
    await this.middleNameInput.fill(middleName);

    await expect(this.lastNameInput).toBeVisible({ timeout: 10_000 });
    await this.lastNameInput.clear();
    await this.lastNameInput.fill(lastName);
  }

  async fillOtherId(value: string): Promise<void> {
    const field = this.inputGroupFieldByLabel('Other Id');
    await expect(field).toBeVisible();
    await field.clear();
    await field.fill(value);
  }

  async fillLicenseNumber(value: string): Promise<void> {
    const field = this.inputGroupFieldByLabel("Driver's License Number");
    await expect(field).toBeVisible();
    await field.clear();
    await field.fill(value);
  }

  async fillLicenseExpiryDate(value: string): Promise<void> {
    const field = this.page.locator('form .oxd-input[placeholder="yyyy-dd-mm"]').first();
    await field.scrollIntoViewIfNeeded();
    await expect(field).toBeVisible();
    await this.typeIntoDateField(field, value);
  }

  /**
   * Dismisses any open date-picker overlay.
   *
   * The original spec clicked `body` at (0, 0) to click "outside" the picker.
   * On this app that corner is the OrangeHRM logo link, and the "Personal
   * Details" text is itself a breadcrumb link — both navigate/reload the SPA
   * and wipe the in-progress form. Clicking the first-name input is a plain
   * form field (not a navigable link), so it dismisses the overlay the same
   * way without triggering an SPA reload that would wipe the form.
   */
  async closeDatePickerOverlay(): Promise<void> {
    await this.firstNameInput.click({ force: true });
  }

  async selectNationality(name: string): Promise<void> {
    await this.nationalityDropdown.click();
    await this.dropdownOption(name).click({ force: true });
  }

  async fillDateOfBirth(value: string): Promise<void> {
    const field = this.page.locator('input[placeholder="yyyy-dd-mm"]').nth(1);
    await field.scrollIntoViewIfNeeded();
    await this.typeIntoDateField(field, value);
    await field.blur();
  }

  /**
   * These date inputs are driven by a picker widget that keeps its own
   * internal parsed-date state. `.fill()` sets the DOM value directly without
   * the keystroke events the widget listens for, so it silently rewrites the
   * field to a stale internal value once it loses focus. Typing the
   * characters one at a time keeps the widget's state in sync with what's
   * displayed.
   */
  private async typeIntoDateField(field: Locator, value: string): Promise<void> {
    await field.click();
    await field.press('Control+A');
    await field.press('Delete');
    await field.pressSequentially(value, { delay: 50 });
  }

  async selectGender(value: string): Promise<void> {
    const radio = this.genderRadio(value);
    await radio.scrollIntoViewIfNeeded();
    await radio.check({ force: true });
  }

  async save(): Promise<void> {
    await this.saveButton.scrollIntoViewIfNeeded();
    await this.saveButton.click({ force: true });
  }

  // ----- Custom Fields -----

  async selectBloodType(value: string): Promise<void> {
    await this.bloodTypeDropdown.click({ force: true });
    await this.dropdownOption(value).click({ force: true });
  }

  async fillTestField(value: string): Promise<void> {
    await this.customFieldsHeading.scrollIntoViewIfNeeded();
    await this.testFieldInput.scrollIntoViewIfNeeded();
    await this.testFieldInput.click({ force: true });
    await this.testFieldInput.clear({ force: true });
    await this.testFieldInput.fill(value, { force: true });
  }

  // ----- Attachments -----

  async addAttachment(filePath: string, fileName: string, description: string): Promise<void> {
    await this.addAttachmentButton.click({ force: true });

    await expect(this.fileInput).toBeAttached({ timeout: 10_000 });
    await this.fileInput.setInputFiles(filePath);

    await expect(this.fileNamePreview).toContainText(fileName, { timeout: 10_000 });
    await this.attachmentDescriptionTextarea.fill(description, { force: true });

    await this.attachmentForm
      .locator('button[type="submit"]')
      .filter({ hasText: 'Save' })
      .click({ force: true });
  }

  async expectAttachmentListed(fileName: string): Promise<Locator> {
    const row = this.attachmentTableRow(fileName);
    await expect(row).toBeVisible({ timeout: 10_000 });
    return row;
  }

  async downloadAttachment(fileName: string): Promise<void> {
    const row = this.attachmentTableRow(fileName);
    await row.locator('i.bi-download').click({ force: true });
  }

  async deleteAttachment(fileName: string): Promise<void> {
    const row = this.page.locator('.oxd-table-cell', { hasText: fileName }).first().locator('xpath=ancestor::div[contains(@class,"oxd-table-row")][1]');
    await row.locator('i.bi-trash').click({ force: true });

    await expect(this.confirmDeleteButton).toBeVisible({ timeout: 10_000 });
    await this.confirmDeleteButton.click();
  }

  // ----- User menu / logout -----

  async logout(displayName: string): Promise<void> {
    const dropdown = this.userDropdown(displayName);
    await expect(dropdown).toBeVisible({ timeout: 10_000 });
    await dropdown.click();

    await expect(this.logoutLink).toBeVisible({ timeout: 10_000 });
    await this.logoutLink.click();
  }
}
