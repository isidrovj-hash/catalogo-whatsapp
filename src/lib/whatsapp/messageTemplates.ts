import type { ProductCardData } from '@/lib/data/products';
import { formatCurrency, toNumber } from '@/lib/format';

/**
 * Mensaje de "Preguntar por WhatsApp" para un producto individual
 * (sección 16 del brief). Se arma en texto plano; la codificación URL
 * (espacios, saltos de línea, símbolos, "$") ocurre en WhatsAppService,
 * nunca aquí, para mantener esta plantilla legible y fácil de editar.
 */
export function buildProductInquiryMessage(product: ProductCardData, productUrl: string): string {
  const priceLine =
    product.priceMode === 'SOLICITAR_PRECIO'
      ? 'Precio: Solicitar precio'
      : `Precio publicado: ${formatCurrency(toNumber(product.promoPrice) || toNumber(product.price))}`;

  return [
    'Hola, quiero información sobre este producto:',
    '',
    `Producto: ${product.name}`,
    `Código: ${product.sku}`,
    `Presentación: ${product.presentation}`,
    priceLine,
    '',
    `Enlace: ${productUrl}`,
    '',
    '¿Me pueden confirmar disponibilidad y precio?',
  ].join('\n');
}

export interface QuoteMessageItem {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface QuoteMessageData {
  folio: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string | null;
  items: QuoteMessageItem[];
  total: number;
  comments?: string | null;
}

/**
 * Mensaje estructurado de cotización (sección 14). Se usa a partir de la
 * FASE 7 (Cotizador) cuando el formulario de datos del cliente exista; la
 * función se define aquí desde ahora para que WhatsAppService quede
 * completo y no haya que tocar esta capa más adelante.
 */
export function buildQuoteMessage(data: QuoteMessageData): string {
  const lines: string[] = ['Hola, me interesa solicitar una cotización.', '', 'DATOS DEL CLIENTE', '', `Nombre: ${data.customerName}`, `Teléfono: ${data.customerPhone}`];

  if (data.customerCity) lines.push(`Ciudad: ${data.customerCity}`);

  lines.push('', 'PRODUCTOS', '');

  data.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name}`,
      `   Código: ${item.sku}`,
      `   Cantidad: ${item.quantity}`,
      `   Precio: ${formatCurrency(item.unitPrice)}`,
      `   Subtotal: ${formatCurrency(item.subtotal)}`,
      ''
    );
  });

  lines.push(`Subtotal estimado: ${formatCurrency(data.total)}`);

  if (data.comments) {
    lines.push('', `Comentarios: ${data.comments}`);
  }

  lines.push('', `Folio: ${data.folio}`, '', 'Solicitud generada desde el catálogo digital.', 'Quedo pendiente de su cotización.');

  return lines.join('\n');
}

/** Mensaje genérico del botón flotante / WhatsApp del header (sección 17). */
export function buildGeneralInquiryMessage(baseMessage?: string | null): string {
  return baseMessage?.trim() || 'Hola, tengo una pregunta sobre sus productos.';
}
