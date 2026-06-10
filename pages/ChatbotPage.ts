import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

/** Shape of the JSON payload the MAZSalud chatbot API may answer with. */
interface ChatbotApiBody {
  reply?: unknown;
  message?: unknown;
  data?: { reply?: unknown };
  messages?: Array<{ text?: unknown; message?: unknown }>;
  resource?: { welcome_msg?: unknown };
  [key: string]: unknown;
}

/**
 * Page Object for the MAZSalud chatbot widget embedded on the public site.
 * The widget itself lives in a cross-origin iframe (the original Cypress spec
 * could only assert on its presence/visibility, not type into it), so this
 * object also exposes a small API helper for the "send message" scenario.
 */
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

  async expectOnSite(): Promise<void> {
    await expect(this.page).toHaveURL(/programamazsalud\.com\.mx/);
  }

  /** Dismisses the cookie consent banner if it is shown (best-effort, mirrors the original spec). */
  async acceptCookiesIfPresent(): Promise<void> {
    try {
      await this.cookieBanner.click({ timeout: 8_000 });
    } catch {
      // Banner not shown (e.g. already accepted) — nothing to do.
    }
  }

  async expectChatButtonVisible(): Promise<void> {
    await expect(this.chatButtonIframe).toBeVisible({ timeout: 10_000 });
  }

  async expectChatContainerExists(): Promise<void> {
    await expect(this.chatContainer).toHaveCount(1, { timeout: 20_000 });
  }

  /**
   * Forces the (normally collapsed) chat widget to display by swapping its
   * animation classes — the same DOM hack the original Cypress spec performed
   * via `invoke('removeClass'/'addClass')`.
   */
  async forceShowChat(): Promise<void> {
    await expect(this.chatContainer).toHaveCount(1, { timeout: 20_000 });
    await this.chatContainer.evaluate((el) => {
      el.classList.remove('botlers-messaging-hidden-class', 'fadeOutDownBMAnimation');
      el.classList.add('fadeInUpBMAnimation');
    });

    await expect(this.chatIframe).toHaveCount(1, { timeout: 20_000 });
    await expect(this.chatIframe).toBeVisible();
  }

  /**
   * Sends a message through the chatbot's HTTP API directly (the widget's
   * iframe is cross-origin, so the UI cannot be driven from the test).
   */
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

  /** Heuristic check that the API responded with something resembling a chatbot reply. */
  static hasReply(body: unknown): boolean {
    try {
      if (!body) return false;
      if (typeof body === 'string') return body.trim().length > 0;

      const b = body as ChatbotApiBody;
      if (b.reply && String(b.reply).trim()) return true;
      if (b.message && String(b.message).trim()) return true;
      if (b.data?.reply && String(b.data.reply).trim()) return true;
      if (Array.isArray(b.messages) && b.messages.some((m) => String(m?.text ?? m?.message ?? '').trim())) {
        return true;
      }
      if (b.resource?.welcome_msg && String(b.resource.welcome_msg).trim()) return true;

      return /hola|bienvenid|mazsalud|dr\s*tomaz/i.test(JSON.stringify(b));
    } catch {
      return false;
    }
  }
}
