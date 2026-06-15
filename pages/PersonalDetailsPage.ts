import { expect, type Locator, type Page } from '@playwright/test';

export interface NameDetails {
  firstName: string;
  middleName: string;
  lastName: string;
}

export class PersonalDetailsPage {
  readonly page: Page;

  readonly firstNameInput: Locator;
  readonly middleNameInput: Locator;
  readonly lastNameInput: Locator;

  readonly nationalityDropdown: Locator;
  readonly maritalStatusDropdown: Locator;

  readonly genderRadio: (label: string) => Locator;
  readonly saveButton: Locator;
  readonly successToast: Locator;

  readonly customFieldsSaveButton: Locator;

  readonly testFieldInput: Locator;

  readonly addAttachmentButton: Locator;
  readonly fileInput: Locator;
  readonly fileNamePreview: Locator;
  readonly attachmentDescriptionTextarea: Locator;
  readonly attachmentForm: Locator;
  readonly attachmentSaveButton: Locator;

  readonly attachmentTableRow: (fileName: string) => Locator;
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.firstNameInput = page.locator('input[name="firstName"]');
    this.middleNameInput = page.locator('input[name="middleName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');

    this.nationalityDropdown = page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Nationality' })
      .locator('.oxd-select-text');

    this.maritalStatusDropdown = page
      .locator('.oxd-input-group')
      .filter({ hasText: 'Marital Status' })
      .locator('.oxd-select-text');

    this.genderRadio = (label: string) =>
      page.getByRole('radio', { name: label, exact: true });

    this.saveButton = page.locator('button[type="submit"]').filter({ hasText: 'Save' }).first();

    this.successToast = page.locator('.oxd-toast--success');

    this.customFieldsSaveButton = page
      .locator('div.orangehrm-custom-fields')
      .locator('button[type="submit"]')
      .filter({ hasText: 'Save' });

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

    this.attachmentSaveButton = this.attachmentForm
      .locator('button[type="submit"]')
      .filter({ hasText: 'Save' });

    this.attachmentTableRow = (fileName: string) =>
      page
        .locator('.oxd-table-row')
        .filter({ hasText: fileName })
        .first();

    this.confirmDeleteButton = page
      .locator('.oxd-button--label-danger')
      .filter({ hasText: 'Yes, Delete' });
  }

  async goto(url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async expectLoaded() {
    await expect(this.firstNameInput).toBeVisible({ timeout: 20000 });
    await expect(this.lastNameInput).toBeVisible({ timeout: 20000 });
    await expect(this.firstNameInput).not.toHaveValue('', { timeout: 20000 });
  }

  // ---------------- Personal Details ----------------

  async fillName({ firstName, middleName, lastName }: NameDetails) {
    await this.firstNameInput.fill(firstName);
    await this.middleNameInput.fill(middleName);
    await this.lastNameInput.fill(lastName);
  }

  async fillEmployeeId(value: string) {
    await this.inputByLabel('Employee Id').fill(value);
  }

  async fillOtherId(value: string) {
    await this.inputByLabel('Other Id').fill(value);
  }

  async fillLicenseNumber(value: string) {
    await this.inputByLabel("Driver's License Number").fill(value);
  }

  async fillLicenseExpiryDate(value: string) {
    const field = this.inputByLabel('License Expiry Date');
    await field.scrollIntoViewIfNeeded();
    await field.fill(value);
  }

  async fillDateOfBirth(value: string) {
    const field = this.inputByLabel('Date of Birth');
    await field.scrollIntoViewIfNeeded();
    await field.fill(value);
    await field.blur();
  }

  async selectNationality(value: string) {
    await this.selectFromDropdown(this.nationalityDropdown, value);
  }

  async selectMaritalStatus(value: string) {
    await this.selectFromDropdown(this.maritalStatusDropdown, value);
  }

  async selectGender(value: string) {
    await this.genderRadio(value).check({ force: true });
  }

  async save() {
    await this.saveButton.click({ force: true });
  }

  async expectSaveSuccess() {
    await expect(this.successToast).toBeVisible();
  }

  // ---------------- Custom Fields ----------------

  async fillTestField(value: string) {
    await this.testFieldInput.click({ force: true });
    await this.testFieldInput.fill(value, { force: true });
  }

  async saveCustomFields() {
    await this.customFieldsSaveButton.click({ force: true });
  }

  // ---------------- Attachments ----------------

  async addAttachment(filePath: string, fileName: string, description: string) {
    await this.addAttachmentButton.click({ force: true });

    await this.fileInput.setInputFiles(filePath);

    await expect(this.fileNamePreview).toContainText(fileName);

    await this.attachmentDescriptionTextarea.fill(description);

    await this.attachmentSaveButton.click();
  }

  async expectAttachmentListed(fileName: string, timeout = 10000) {
    const row = this.attachmentTableRow(fileName);
    await expect(row).toBeVisible({ timeout });
    return row;
  }

  async editAttachment(currentFileName: string, newFilePath: string, newFileName: string) {
    const row = this.attachmentTableRow(currentFileName);

    await row.locator('i.bi-pencil-fill').click({ force: true });

    await this.fileInput.setInputFiles(newFilePath);

    await expect(this.fileNamePreview).toContainText(newFileName);

    await this.attachmentSaveButton.click();
  }

  async deleteAttachment(fileName: string) {
    const row = this.attachmentTableRow(fileName);

    await row.locator('i.bi-trash').click({ force: true });

    await this.confirmDeleteButton.click();
  }

  // ---------------- Helpers ----------------

  private inputByLabel(label: string): Locator {
    return this.page
      .locator('.oxd-input-group')
      .filter({ hasText: label })
      .locator('input');
  }

  private async selectFromDropdown(dropdown: Locator, value: string) {
    await dropdown.click();
    await this.page.getByRole('option', { name: value }).click();
  }
}