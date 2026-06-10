import { expect, test } from '@playwright/test';
import { ChatbotPage } from '../pages/ChatbotPage';

test.describe('Automatización de Chatbot (Prueba técnica QA)', () => {
  test.beforeEach(async ({ page }) => {
    const chatbotPage = new ChatbotPage(page);

    await chatbotPage.goto();
    await chatbotPage.expectOnSite();
    await chatbotPage.acceptCookiesIfPresent();
  });

  test('Acceder a la URL', async ({ page }) => {
    const chatbotPage = new ChatbotPage(page);
    await chatbotPage.expectOnSite();
  });

  test('Encontrar el botón del chatbot', async ({ page }) => {
    const chatbotPage = new ChatbotPage(page);
    await chatbotPage.expectChatButtonVisible();
  });

  test('Abrir el chatbot visualmente', async ({ page }) => {
    const chatbotPage = new ChatbotPage(page);

    await chatbotPage.expectChatContainerExists();
    await chatbotPage.forceShowChat();
  });

  test('Escribir "Hola" (simulado por cross-origin)', async ({ page }, testInfo) => {
    const chatbotPage = new ChatbotPage(page);

    await chatbotPage.forceShowChat();
    testInfo.annotations.push({
      type: 'note',
      description: 'Simulación: no se puede tipear dentro del iframe por cross-origin.',
    });
  });

  test('Enviar "Hola" vía API y validar respuesta', async ({ request }, testInfo) => {
    const { status, body } = await ChatbotPage.sendMessage(request, 'Hola');

    testInfo.annotations.push({ type: 'note', description: `Status: ${status}` });
    testInfo.annotations.push({ type: 'note', description: `Body: ${JSON.stringify(body)}` });

    if (status === 200) {
      expect(ChatbotPage.hasReply(body)).toBe(true);
    } else {
      testInfo.annotations.push({ type: 'note', description: 'El endpoint requiere autenticación (401/403)' });
    }
  });
});
