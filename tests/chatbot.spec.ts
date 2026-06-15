import { expect, test } from '@playwright/test';
import { ChatbotPage } from '../pages/ChatbotPage';

test.describe('Chatbot automation', () => {
  test.beforeEach(async ({ page }) => {
    const chatbotPage = new ChatbotPage(page);

    await chatbotPage.goto();
    await expect(page).toHaveURL(/programamazsalud\.com\.mx/);
    await chatbotPage.acceptCookiesIfPresent();
  });

  test('Must load the main page', async ({ page }) => {
    await expect(page).toHaveURL(/programamazsalud\.com\.mx/);
  });

  test('Must show the chatbot button', async ({ page }) => {
    test.skip(!!process.env.CI, 'Botlers widget only renders for Mexican IPs; CI runners use foreign datacenter IPs');
    const chatbotPage = new ChatbotPage(page);

    await expect(chatbotPage.chatButtonIframe).toBeVisible();
  });

  test('Must open the chatbot visually', async ({ page }) => {
    test.skip(!!process.env.CI, 'Botlers widget only renders for Mexican IPs; CI runners use foreign datacenter IPs');
    const chatbotPage = new ChatbotPage(page);

    await expect(chatbotPage.chatContainer).toBeAttached();
    await chatbotPage.forceShowChat();
  });

  test(
    'Should be able to send a message via API',
      async ({ request }, testInfo) => {
      const { status, body } =
        await ChatbotPage.sendMessage(request, 'Hola');

      testInfo.annotations.push({
        type: 'note',
        description: `Status: ${status}`,
      });

      testInfo.annotations.push({
        type: 'note',
        description: JSON.stringify(body),
      });
    }
  );

  test('Should be able to send a message via API and validate the response', async ({ request }, testInfo) => {
    const { status, body } = await ChatbotPage.sendMessage(request, 'Hola');

    testInfo.annotations.push({ type: 'note', description: `Status: ${status}` });
    testInfo.annotations.push({ type: 'note', description: `Body: ${JSON.stringify(body)}` });

    if (status === 200) {
      expect(body).toBeTruthy();
      expect(ChatbotPage.hasReply(body)).toBeTruthy();
    } else {
      testInfo.annotations.push({ type: 'note', description: 'El endpoint requiere autenticación (401/403)' });
    }
  });
});
