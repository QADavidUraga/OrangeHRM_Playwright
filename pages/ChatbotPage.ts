import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

// This file contains a Page Object representing the MAZSalud chatbot widget and its API
interface ChatbotApiBody {
  reply?: unknown;
  message?: unknown;
  data?: { reply?: unknown };
  messages?: Array<{ text?: unknown; message?: unknown }>;
  resource?: { welcome_msg?: unknown };
  [key: string]: unknown;
}

// Page Object representing the MAZSalud chatbot widget and its API.
export class ChatbotPage {
  readonly page: Page;
  readonly cookieBanner: Locator;
  readonly chatContainer: Locator;
  readonly chatIframe: Locator;
  readonly chatButtonIframe: Locator;

  static readonly BASE_URL = 'https://programamazsalud.com.mx/';
  static readonly BMID = 'f42836ea3798434e934cd2f31ea70e73';
  static readonly API_ENDPOINT = 'https://oldenterprise.botlers.io/bmessaging/send_message';

  constructor(page: Page) {
    this.page = page;
    this.cookieBanner = page.locator('a.wscrOk', { hasText: 'Permitir todas las cookies' });
    this.chatContainer = page.locator('#botlers-messaging-chat-iframe-container');
    this.chatIframe = page.locator('iframe#botlers-messaging-chat-iframe');
    this.chatButtonIframe = page.locator('iframe#botlers-messaging-button-iframe');
  }

  async goto(): Promise<void> {
    await this.page.goto(ChatbotPage.BASE_URL);
  }

  //Dismisses the cookie banner if it appears
  async acceptCookiesIfPresent(): Promise<void> {
    try {
      await this.cookieBanner.click({ timeout: 8_000 });
    } catch {
    }
  }

  //Forces the chat widget to show up 
  async forceShowChat() {
  await expect(this.chatContainer).toHaveCount(1);

  await this.chatContainer.evaluate((el) => {
    el.classList.remove(
      'botlers-messaging-hidden-class',
      'fadeOutDownBMAnimation'
    );

    el.classList.add('fadeInUpBMAnimation');
  });

  await expect(this.chatIframe).toBeVisible();
  }

  //Sends a message via API 
  static async sendMessage(request: APIRequestContext, message: string): Promise<{ status: number; body: unknown }> {
    const response = await request.post(ChatbotPage.API_ENDPOINT, {
      data: {
        bmid: ChatbotPage.BMID,
        message,
        sessionId: 'playwright-session',
      },
      timeout: 20_000,
      failOnStatusCode: false,
    });

    const status = response.status();
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    return { status, body };
  }

  // Checks if the chatbot actually replied with something that looks like a message
  static hasReply(body: unknown): boolean {
    if (!body) return false;

    if (typeof body === 'string') {
      return body.trim().length > 0;
    }

    const response = body as ChatbotApiBody;

    if (response.reply && String(response.reply).trim()) return true;

    if (response.message && String(response.message).trim()) return true;

    if (response.data?.reply && String(response.data.reply).trim()) {
      return true;
    }

    if (
      Array.isArray(response.messages) &&
      response.messages.some(
        (msg) => String(msg?.text ?? msg?.message ?? '').trim()
      )
    ) {
      return true;
    }

    if (
      response.resource?.welcome_msg &&
      String(response.resource.welcome_msg).trim()
    ) {
      return true;
    }

    return /hola|bienvenid|mazsalud|dr\s*tomaz/i.test(
      JSON.stringify(response)
    );
  }
}
