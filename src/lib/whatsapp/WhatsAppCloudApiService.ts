import { prisma } from '@/lib/prisma';
import { WhatsAppLinkService } from './WhatsAppLinkService';

const GRAPH_API_VERSION = 'v20.0';

/**
 * Implementación v2 de `WhatsAppService` usando WhatsApp Business Cloud API
 * (sección 40 del brief). Implementa la MISMA interfaz que
 * `WhatsAppLinkService` — ningún componente que ya use `WhatsAppService`
 * necesita cambiar una sola línea cuando el admin active este proveedor
 * desde `/admin/configuracion`.
 *
 * Decisión de diseño importante: `getProductInquiryLink` y `getQuoteLink` se
 * delegan a `WhatsAppLinkService` (composición, no se reimplementan) porque
 * esa parte del flujo siempre depende de que el CLIENTE haga click y abra su
 * propio WhatsApp — eso funciona igual sin importar qué proveedor use el
 * negocio para sus envíos propios. Lo que sí cambia con la Cloud API es la
 * capacidad de que el NEGOCIO envíe mensajes de forma proactiva
 * (`sendOrderConfirmation`, `sendFollowUp`), que es lo que este archivo
 * implementa de verdad contra la API de Meta.
 *
 * ESTADO ACTUAL: esta clase está completa y lista para activarse, pero
 * `sendOrderConfirmation`/`sendFollowUp` todavía no tienen quién las llame
 * — eso corresponde a la confirmación de pedidos (fuera del alcance de este
 * catálogo sin pago online) y al seguimiento automático de la sección 42
 * (FASE 10/CRM), que requiere además consentimiento explícito del cliente
 * antes de programarse.
 */
export class WhatsAppCloudApiService extends WhatsAppLinkService {
  constructor(
    phoneNumber: string,
    baseMessage: string | null,
    private readonly accessToken: string,
    private readonly phoneNumberId: string
  ) {
    super(phoneNumber, baseMessage);
  }

  private get apiUrl(): string {
    return `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.phoneNumberId}/messages`;
  }

  private async sendTemplateMessage(to: string, templateName: string, params: string[]): Promise<void> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'es_MX' },
          components: [
            {
              type: 'body',
              parameters: params.map((text) => ({ type: 'text', text })),
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`WhatsApp Cloud API respondió ${response.status}: ${body}`);
    }
  }

  /**
   * Envía la confirmación de un pedido/cotización ya procesada por el
   * vendedor. Requiere una plantilla ("order_confirmation" o el nombre que
   * elijas) previamente aprobada por Meta — WhatsApp Business Platform no
   * permite texto libre fuera de la ventana de 24 horas de conversación.
   */
  async sendOrderConfirmation(orderId: string): Promise<void> {
    const quote = await prisma.quote.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!quote) throw new Error(`No se encontró la cotización ${orderId}`);

    await this.sendTemplateMessage(quote.customer.phone, 'order_confirmation', [
      quote.customer.name,
      quote.folio,
    ]);
  }

  /**
   * Seguimiento automático (sección 42). IMPORTANTE: esta clase solo sabe
   * *cómo* enviar el mensaje si se le pide — no decide *cuándo*. El
   * disparo por tiempo (30 min / 24 h / 72 h) y el registro de
   * consentimiento del cliente son responsabilidad de un job programado que
   * se construye en el CRM (FASE 10), nunca de este servicio.
   */
  async sendFollowUp(leadId: string, stage: 'H30M' | 'H24' | 'H72'): Promise<void> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { customer: true },
    });
    if (!lead) throw new Error(`No se encontró el lead ${leadId}`);

    const templateByStage: Record<typeof stage, string> = {
      H30M: 'followup_30min',
      H24: 'followup_24h',
      H72: 'followup_72h',
    };

    await this.sendTemplateMessage(lead.customer.phone, templateByStage[stage], [lead.customer.name]);
  }
}
