import { Injectable, Logger } from "@nestjs/common";

export type WebhookEventType =
  | "LICENSE_CREATED"
  | "LICENSE_REVOKED"
  | "LICENSE_RENEWED"
  | "USER_BANNED"
  | "USER_UNBANNED"
  | "USER_DELETED"
  | "PRODUCT_CREATED"
  | "PRODUCT_DELETED";

interface WebhookPayload {
  event: WebhookEventType;
  details: Record<string, string | number | boolean | null | undefined>;
  actor?: string;
}

const COLORS: Record<WebhookEventType, number> = {
  LICENSE_CREATED:  0x3ddc84, // green
  LICENSE_REVOKED:  0xff4d4d, // red
  LICENSE_RENEWED:  0xffc857, // yellow
  USER_BANNED:      0xff4d4d,
  USER_UNBANNED:    0x3ddc84,
  USER_DELETED:     0xff6b6b,
  PRODUCT_CREATED:  0x5865f2, // blurple
  PRODUCT_DELETED:  0xff4d4d
};

const EMOJIS: Record<WebhookEventType, string> = {
  LICENSE_CREATED:  "🔑",
  LICENSE_REVOKED:  "🚫",
  LICENSE_RENEWED:  "♻️",
  USER_BANNED:      "🔨",
  USER_UNBANNED:    "✅",
  USER_DELETED:     "💀",
  PRODUCT_CREATED:  "📦",
  PRODUCT_DELETED:  "🗑️"
};

@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);
  private readonly webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  /** Verifica se o webhook está configurado */
  get isConfigured(): boolean {
    return !!this.webhookUrl;
  }

  async send(payload: WebhookPayload): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.debug("DISCORD_WEBHOOK_URL não configurada, evento ignorado.");
      return;
    }

    const { event, details, actor } = payload;
    const emoji = EMOJIS[event];
    const color = COLORS[event];
    const timestamp = new Date().toISOString();

    // Constrói os campos do embed a partir de details
    const fields = Object.entries(details)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([name, value]) => ({
        name,
        value: String(value),
        inline: true
      }));

    const body = {
      embeds: [
        {
          title: `${emoji} ${event.replace(/_/g, " ")}`,
          color,
          fields,
          footer: {
            text: actor ? `Actor: ${actor}` : "Inject Bypass · Sistema Automático"
          },
          timestamp
        }
      ]
    };

    try {
      const res = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        this.logger.warn(`Discord webhook retornou ${res.status}: ${await res.text()}`);
      }
    } catch (err) {
      this.logger.error("Falha ao enviar webhook Discord", err);
    }
  }
}
