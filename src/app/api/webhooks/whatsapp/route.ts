import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de webhook requerido por WhatsApp Business Cloud API (sección 40).
 * Solo es necesario configurarlo en Meta for Developers cuando
 * `business_settings.whatsapp_provider = 'CLOUD_API'`; en el modo por
 * defecto ('LINK') este endpoint simplemente no recibe tráfico de Meta.
 *
 * URL a registrar en Meta: https://tu-dominio.com/api/webhooks/whatsapp
 */

// Meta llama a este GET una sola vez, al configurar el webhook, para
// confirmar que el servidor es tuyo. Debe responder exactamente con el
// valor de `hub.challenge` si el `hub.verify_token` coincide con el que
// definiste en WHATSAPP_CLOUD_API_VERIFY_TOKEN.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_CLOUD_API_VERIFY_TOKEN;

  if (mode === 'subscribe' && expectedToken && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verificación de webhook fallida.' }, { status: 403 });
}

// Meta envía aquí cada evento: mensajes entrantes del cliente, cambios de
// estado de entrega (enviado/entregado/leído) de los mensajes salientes,
// etc. Por ahora solo se registra en el log del servidor — conectar estas
// respuestas a un historial de conversación por cliente es trabajo del CRM
// (FASE 10), que necesita antes la tabla de conversaciones y el modelo de
// datos correspondiente para no construirse a medias.
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('[whatsapp webhook] Evento recibido:', JSON.stringify(payload));
  } catch (error) {
    console.error('[whatsapp webhook] No se pudo leer el payload:', error);
  }

  // Meta espera un 200 rápido; si no lo recibe, reintenta el envío del
  // webhook y puede eventualmente desactivarlo.
  return NextResponse.json({ received: true }, { status: 200 });
}
