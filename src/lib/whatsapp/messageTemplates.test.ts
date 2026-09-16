import { describe, it, expect } from 'vitest';
import {
  buildProductInquiryMessage,
  buildQuoteMessage,
  buildGeneralInquiryMessage,
  type QuoteMessageData,
} from './messageTemplates';
import type { ProductCardData } from '@/lib/data/products';

// Objeto mínimo que satisface los campos que la plantilla realmente lee.
// `ProductCardData` es un tipo generado por Prisma; en pruebas unitarias no
// necesitamos una fila real de base de datos, solo esta forma.
function makeProduct(overrides: Partial<ProductCardData> = {}): ProductCardData {
  return {
    name: 'Cemento Gris Monterrey',
    sku: 'CEM001',
    presentation: 'Saco 25 kg',
    priceMode: 'MOSTRAR_PRECIO',
    price: 185,
    promoPrice: 165,
    ...overrides,
  } as ProductCardData;
}

describe('buildProductInquiryMessage', () => {
  it('incluye nombre, código, presentación y enlace del producto', () => {
    const message = buildProductInquiryMessage(makeProduct(), 'https://ejemplo.com/productos/cemento-gris');
    expect(message).toContain('Producto: Cemento Gris Monterrey');
    expect(message).toContain('Código: CEM001');
    expect(message).toContain('Presentación: Saco 25 kg');
    expect(message).toContain('Enlace: https://ejemplo.com/productos/cemento-gris');
  });

  it('usa el precio de promoción cuando existe', () => {
    const message = buildProductInquiryMessage(makeProduct({ price: 185, promoPrice: 165 }), 'url');
    expect(message).toContain('Precio publicado: $165.00');
  });

  it('usa el precio normal cuando no hay promoción', () => {
    const message = buildProductInquiryMessage(makeProduct({ price: 320, promoPrice: null }), 'url');
    expect(message).toContain('Precio publicado: $320.00');
  });

  it('muestra "Solicitar precio" cuando priceMode es SOLICITAR_PRECIO', () => {
    const message = buildProductInquiryMessage(makeProduct({ priceMode: 'SOLICITAR_PRECIO' }), 'url');
    expect(message).toContain('Precio: Solicitar precio');
    expect(message).not.toContain('Precio publicado');
  });

  it('termina con la pregunta de confirmación de disponibilidad', () => {
    const message = buildProductInquiryMessage(makeProduct(), 'url');
    expect(message.trim().endsWith('¿Me pueden confirmar disponibilidad y precio?')).toBe(true);
  });
});

describe('buildQuoteMessage', () => {
  const baseData: QuoteMessageData = {
    folio: 'COT-2026-000001',
    customerName: 'Juan Pérez',
    customerPhone: '8181234567',
    customerCity: 'Apodaca',
    items: [
      { name: 'Cemento Gris Monterrey', sku: 'CEM001', quantity: 3, unitPrice: 165, subtotal: 495 },
      { name: 'Impermeabilizante Acrílico 5 Años', sku: 'IMP001', quantity: 1, unitPrice: 1090, subtotal: 1090 },
    ],
    total: 1585,
    comments: 'Necesito entrega a domicilio si es posible.',
  };

  it('incluye los datos del cliente', () => {
    const message = buildQuoteMessage(baseData);
    expect(message).toContain('Nombre: Juan Pérez');
    expect(message).toContain('Teléfono: 8181234567');
    expect(message).toContain('Ciudad: Apodaca');
  });

  it('numera cada producto y muestra código, cantidad, precio y subtotal', () => {
    const message = buildQuoteMessage(baseData);
    expect(message).toContain('1. Cemento Gris Monterrey');
    expect(message).toContain('Código: CEM001');
    expect(message).toContain('Cantidad: 3');
    expect(message).toContain('Precio: $165.00');
    expect(message).toContain('Subtotal: $495.00');
    expect(message).toContain('2. Impermeabilizante Acrílico 5 Años');
  });

  it('incluye el subtotal estimado total', () => {
    const message = buildQuoteMessage(baseData);
    expect(message).toContain('Subtotal estimado: $1,585.00');
  });

  it('incluye el folio', () => {
    const message = buildQuoteMessage(baseData);
    expect(message).toContain('Folio: COT-2026-000001');
  });

  it('incluye comentarios solo si existen', () => {
    const withComments = buildQuoteMessage(baseData);
    expect(withComments).toContain('Comentarios: Necesito entrega a domicilio si es posible.');

    const withoutComments = buildQuoteMessage({ ...baseData, comments: null });
    expect(withoutComments).not.toContain('Comentarios:');
  });

  it('omite la ciudad si no se proporciona', () => {
    const message = buildQuoteMessage({ ...baseData, customerCity: null });
    expect(message).not.toContain('Ciudad:');
  });

  it('respeta el formato exacto pedido en la sección 14 del brief', () => {
    const message = buildQuoteMessage(baseData);
    expect(message.startsWith('Hola, me interesa solicitar una cotización.')).toBe(true);
    expect(message).toContain('DATOS DEL CLIENTE');
    expect(message).toContain('PRODUCTOS');
    expect(message.trim().endsWith('Quedo pendiente de su cotización.')).toBe(true);
  });
});

describe('buildGeneralInquiryMessage', () => {
  it('usa el mensaje configurado por el admin cuando existe', () => {
    expect(buildGeneralInquiryMessage('Hola, bienvenido a Materiales del Norte')).toBe(
      'Hola, bienvenido a Materiales del Norte'
    );
  });

  it('usa un mensaje genérico de respaldo si no hay mensaje configurado', () => {
    expect(buildGeneralInquiryMessage(null)).toBe('Hola, tengo una pregunta sobre sus productos.');
    expect(buildGeneralInquiryMessage(undefined)).toBe('Hola, tengo una pregunta sobre sus productos.');
    expect(buildGeneralInquiryMessage('')).toBe('Hola, tengo una pregunta sobre sus productos.');
  });

  it('recorta espacios en blanco', () => {
    expect(buildGeneralInquiryMessage('   Hola   ')).toBe('Hola');
  });
});
