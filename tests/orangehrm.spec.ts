import path from 'node:path';
import { expect, test } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { PersonalDetailsPage } from '../pages/PersonalDetailsPage';

const ADMIN_USER = 'Admin';
const ADMIN_PASS = 'admin123';
const EMP_NUMBER = 7;

const PERSONAL_DETAILS_PATH =
  `web/index.php/pim/viewPersonalDetails/empNumber/${EMP_NUMBER}`;

const ATTACHMENT_FILE = 'Flower.jpeg';
const ATTACHMENT_FILE_PATH = path.join(__dirname, '..', 'fixtures', ATTACHMENT_FILE);

const NEW_ATTACHMENT_FILE = 'newImage.png';
const NEW_ATTACHMENT_FILE_PATH = path.join(__dirname, '..', 'fixtures', NEW_ATTACHMENT_FILE);

test.describe('Automation OrangeHRM', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('Bad Login', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login('aaadmin', 'admin345');
    await loginPage.expectInvalidCredentials();
  });

  test('Good Login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);
    await dashboardPage.expectLoaded();

  });

  test('My Info', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const personalDetailsPage = new PersonalDetailsPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);

    await personalDetailsPage.goto(PERSONAL_DETAILS_PATH);

    await personalDetailsPage.expectLoaded();
  });

  test('Add Personal Details', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const personalDetailsPage = new PersonalDetailsPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);

    await personalDetailsPage.goto(PERSONAL_DETAILS_PATH);

    await personalDetailsPage.expectLoaded();

    await personalDetailsPage.fillName({
      firstName: 'John',
      middleName: 'Stan',
      lastName: 'Smith',
    });

    await personalDetailsPage.fillEmployeeId('777');
    await personalDetailsPage.fillOtherId('helloWRLD');
    await personalDetailsPage.fillLicenseNumber('98765');
    await personalDetailsPage.fillLicenseExpiryDate('2030-12-31');
    await personalDetailsPage.selectNationality('American');
    await personalDetailsPage.selectMaritalStatus('Single');
    await personalDetailsPage.fillDateOfBirth('1995-08-15');
    await personalDetailsPage.selectGender('Male');

    await personalDetailsPage.save();

    await personalDetailsPage.expectSaveSuccess();
  });

  test('Custom Fields', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const personalDetailsPage = new PersonalDetailsPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);

    await personalDetailsPage.goto(PERSONAL_DETAILS_PATH);

    await personalDetailsPage.expectLoaded();

    await personalDetailsPage.fillTestField('12345');
    await personalDetailsPage.saveCustomFields();
  });

  test('Attachments management', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const personalDetailsPage = new PersonalDetailsPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);

    await personalDetailsPage.goto(PERSONAL_DETAILS_PATH);

    await personalDetailsPage.expectLoaded();

    await personalDetailsPage.addAttachment(
      ATTACHMENT_FILE_PATH,
      ATTACHMENT_FILE,
      'Test'
    );

    await personalDetailsPage.expectAttachmentListed(ATTACHMENT_FILE);

    await personalDetailsPage.editAttachment(
      ATTACHMENT_FILE,
      NEW_ATTACHMENT_FILE_PATH,
      NEW_ATTACHMENT_FILE
    );

    await personalDetailsPage.expectAttachmentListed(NEW_ATTACHMENT_FILE, 20000);

    await personalDetailsPage.deleteAttachment(NEW_ATTACHMENT_FILE);
  });

  test('Logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);
    await dashboardPage.logout();

    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
