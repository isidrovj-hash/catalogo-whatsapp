import { getBusinessSettings } from '@/lib/data/business-settings';
import { WhatsAppLinkService, type WhatsAppService } from './WhatsAppLinkService';

export type { WhatsAppService } from './WhatsAppLinkService';
export { WhatsAppLinkService } from './WhatsAppLinkService';

/**
 * Factory que lee el número de WhatsApp y el proveedor activo desde
 * `business_settings` (nunca hardcodeado en componentes, sección 13). Es
 * async porque la configuración vive en base de datos; se llama desde
 * Server Components o Server Actions.
 *
 * Si `whatsappProvider` es `CLOUD_API` pero faltan las credenciales en las
 * variables de entorno, se degrada automáticamente a `WhatsAppLinkService`
 * con una advertencia en consola — el sitio nunca debe romperse por una
 * configuración incompleta de la API de Meta.
 */
export async function getWhatsAppService(): Promise<WhatsAppService> {
  const settings = await getBusinessSettings();

  if (settings.whatsappProvider === 'CLOUD_API') {
    const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneId = process.env.WHATSAPP_CLOUD_API_PHONE_ID;

    if (token && phoneId) {
      const { WhatsAppCloudApiService } = await import('./WhatsAppCloudApiService');
      return new WhatsAppCloudApiService(settings.whatsappNumber, settings.whatsappMessageBase, token, phoneId);
    }

    console.warn(
      '[whatsapp] business_settings.whatsapp_provider = CLOUD_API pero faltan WHATSAPP_CLOUD_API_TOKEN/WHATSAPP_CLOUD_API_PHONE_ID. Usando enlaces wa.me como respaldo.'
    );
  }

  return new WhatsAppLinkService(settings.whatsappNumber, settings.whatsappMessageBase);
}
