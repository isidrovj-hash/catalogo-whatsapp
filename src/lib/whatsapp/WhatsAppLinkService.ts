import type { ProductCardData } from '@/lib/data/products';
import {
  buildGeneralInquiryMessage,
  buildProductInquiryMessage,
  buildQuoteMessage,
  type QuoteMessageData,
} from './messageTemplates';

/**
 * Contrato estable para todo lo relacionado a WhatsApp (sección 40 del
 * brief). La versión 1 (`WhatsAppLinkService`) genera enlaces `wa.me`. Una
 * futura `WhatsAppCloudApiService` implementará esta misma interfaz usando
 * la API de Meta (envío directo, plantillas aprobadas, webhooks) sin que el
 * resto de la aplicación tenga que cambiar una sola línea: siempre se
 * programa contra esta interfaz, nunca contra la clase concreta.
 */
export interface WhatsAppService {
  getProductInquiryLink(product: ProductCardData, productUrl: string): string;
  getQuoteLink(data: QuoteMessageData): string;
  getGeneralInquiryLink(): string;
  /** Reservado para v2 (WhatsApp Business Cloud API) — ver FASE 8 y sección 42. */
  sendOrderConfirmation?(orderId: string): Promise<void>;
  sendFollowUp?(leadId: string, stage: 'H30M' | 'H24' | 'H72'): Promise<void>;
}

/**
 * Deliberadamente vive en su propio archivo, sin importar nada de la base
 * de datos (`prisma`, `business-settings`): recibe el número y el mensaje
 * base ya resueltos por quien la instancia. Esto es lo que permite
 * probarla con pruebas unitarias puras (`WhatsAppLinkService.test.ts`) sin
 * necesitar una base de datos real — algo que se aprovechó explícitamente
 * en la FASE 12.
 */
export class WhatsAppLinkService implements WhatsAppService {
  constructor(
    protected readonly phoneNumber: string,
    protected readonly baseMessage: string | null
  ) {}

  protected buildLink(message: string): string {
    if (!this.phoneNumber) {
      // Si el admin aún no configuró el número en `business_settings`, no
      // generamos un enlace roto: se maneja explícitamente en la UI (los
      // componentes que llaman a este servicio revisan este caso).
      return '';
    }
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${this.phoneNumber}?text=${encoded}`;
  }

  getProductInquiryLink(product: ProductCardData, productUrl: string): string {
    return this.buildLink(buildProductInquiryMessage(product, productUrl));
  }

  getQuoteLink(data: QuoteMessageData): string {
    return this.buildLink(buildQuoteMessage(data));
  }

  getGeneralInquiryLink(): string {
    return this.buildLink(buildGeneralInquiryMessage(this.baseMessage));
  }
}
