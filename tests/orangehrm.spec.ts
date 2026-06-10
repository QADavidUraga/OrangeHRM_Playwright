import path from 'node:path';
import { expect, test } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { PersonalDetailsPage } from '../pages/PersonalDetailsPage';

const ADMIN_USER = 'Admin';
const ADMIN_PASS = 'admin123';
const EMP_NUMBER = 7;
const PERSONAL_DETAILS_PATH = `web/index.php/pim/viewPersonalDetails/empNumber/${EMP_NUMBER}`;
const ATTACHMENT_FILE = 'flordeprueba.jpeg';
const ATTACHMENT_FILE_PATH = path.join(__dirname, '..', 'fixtures', ATTACHMENT_FILE);

test.describe('Automation OrangeHRM', () => {
  test.beforeEach(async ({ context }) => {
    // Playwright already starts every test with an isolated browser context,
    // but we clear cookies explicitly to mirror the cache reset that the
    // original Cypress `beforeEach` performed.
    await context.clearCookies();
  });

  test('Log in incorrecto', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login('aaadmin', 'admin345');
    await loginPage.expectInvalidCredentials();
  });

  test('Log in correcto', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);
    await dashboardPage.expectLoaded();
  });

  test('Acceder a My Info', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const personalDetailsPage = new PersonalDetailsPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);
    await personalDetailsPage.goto(PERSONAL_DETAILS_PATH);
    await personalDetailsPage.expectLoaded();
  });

  test('Agregar y guardar Personal Details', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const personalDetailsPage = new PersonalDetailsPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);
    await personalDetailsPage.goto(PERSONAL_DETAILS_PATH);
    await personalDetailsPage.expectLoaded();

    await personalDetailsPage.fillName({ firstName: 'John', middleName: 'Michael', lastName: 'Smith' });
    await personalDetailsPage.fillOtherId('98765');
    await personalDetailsPage.fillLicenseNumber('DL123456');
    await personalDetailsPage.fillLicenseExpiryDate('2030-12-31');
    await personalDetailsPage.closeDatePickerOverlay();

    await personalDetailsPage.selectNationality('American');
    await personalDetailsPage.fillDateOfBirth('1995-08-15');
    await personalDetailsPage.selectGender('1');

    await personalDetailsPage.save();
  });

  test('Custom Fields', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const personalDetailsPage = new PersonalDetailsPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);
    await personalDetailsPage.goto(PERSONAL_DETAILS_PATH);

    await personalDetailsPage.selectBloodType('B+');
    await personalDetailsPage.fillTestField('12345');
    await personalDetailsPage.save();
  });

  test('Gestion de imagenes (Attachments)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const personalDetailsPage = new PersonalDetailsPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);
    await personalDetailsPage.goto(PERSONAL_DETAILS_PATH);

    // Subir el primer archivo y verificar que aparezca en la tabla de adjuntos
    await personalDetailsPage.addAttachment(ATTACHMENT_FILE_PATH, ATTACHMENT_FILE, 'Test');
    await personalDetailsPage.expectAttachmentListed(ATTACHMENT_FILE);
    await personalDetailsPage.downloadAttachment(ATTACHMENT_FILE);

    // Eliminar el archivo y confirmar en el modal
    await personalDetailsPage.deleteAttachment(ATTACHMENT_FILE);

    // Volver a subir el mismo archivo
    await personalDetailsPage.addAttachment(ATTACHMENT_FILE_PATH, ATTACHMENT_FILE, 'Test');
  });

  test('Cerrar sesion', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const personalDetailsPage = new PersonalDetailsPage(page);

    await loginPage.login(ADMIN_USER, ADMIN_PASS);
    await personalDetailsPage.goto(PERSONAL_DETAILS_PATH);

    await personalDetailsPage.logout('John Smith');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });
});
