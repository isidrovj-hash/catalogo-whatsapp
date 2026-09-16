import { describe, it, expect } from 'vitest';
import { WhatsAppLinkService } from './WhatsAppLinkService';
import type { ProductCardData } from '@/lib/data/products';

const PHONE = '528112345678';

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

describe('WhatsAppLinkService — enlaces básicos', () => {
  it('genera un enlace wa.me con el número correcto', () => {
    const service = new WhatsAppLinkService(PHONE, null);
    const link = service.getProductInquiryLink(makeProduct(), 'https://ejemplo.com/p/cemento');
    expect(link.startsWith(`https://wa.me/${PHONE}?text=`)).toBe(true);
  });

  it('devuelve un string vacío si no hay número configurado (sección 13)', () => {
    const service = new WhatsAppLinkService('', null);
    expect(service.getGeneralInquiryLink()).toBe('');
    expect(service.getProductInquiryLink(makeProduct(), 'url')).toBe('');
  });

  it('funciona igual en móvil y escritorio: es solo una URL https estándar, sin user-agent sniffing', () => {
    // No hay lógica condicional por dispositivo en el servicio — el enlace
    // wa.me es universal (sección 15: "Debe funcionar tanto en WhatsApp
    // móvil como en WhatsApp Web"). Esta prueba documenta esa garantía.
    const service = new WhatsAppLinkService(PHONE, null);
    const link = service.getGeneralInquiryLink();
    expect(link).toMatch(/^https:\/\/wa\.me\/\d+\?text=.+/);
  });
});

describe('WhatsAppLinkService — codificación de caracteres especiales (sección 15)', () => {
  const service = new WhatsAppLinkService(PHONE, null);

  it('codifica espacios como %20', () => {
    const link = service.getGeneralInquiryLink();
    // El mensaje de respaldo tiene espacios; nunca deben viajar como " " crudo en la URL.
    expect(link).not.toContain(' ');
  });

  it('codifica saltos de línea (\\n) del mensaje de cotización como %0A', () => {
    const link = service.getQuoteLink({
      folio: 'COT-2026-000001',
      customerName: 'Juan Pérez',
      customerPhone: '8181234567',
      items: [{ name: 'Cemento', sku: 'CEM001', quantity: 1, unitPrice: 165, subtotal: 165 }],
      total: 165,
    });
    expect(link).toContain('%0A');
    expect(link).not.toContain('\n');
  });

  it('codifica el signo de pesos "$" de los precios', () => {
    const link = service.getQuoteLink({
      folio: 'COT-2026-000001',
      customerName: 'Ana',
      customerPhone: '8110000000',
      items: [{ name: 'Producto', sku: 'SKU1', quantity: 1, unitPrice: 100, subtotal: 100 }],
      total: 100,
    });
    // "$100.00" se codifica como "%24100.00"
    expect(link).toContain('%24');
    expect(link).not.toContain('$100.00');
  });

  it('preserva acentos y "ñ" correctamente codificados (round-trip sin pérdida de datos)', () => {
    const product = makeProduct({ name: 'Impermeabilizante Acrílico 5 Años' });
    const link = service.getProductInquiryLink(product, 'https://ejemplo.com/p/impermeabilizante');
    const encodedText = link.split('?text=')[1]!;
    const decoded = decodeURIComponent(encodedText);
    expect(decoded).toContain('Impermeabilizante Acrílico 5 Años');
  });

  it('produce una URL válida (sin espacios ni saltos de línea crudos) para un pedido con comentarios que incluyen símbolos', () => {
    const link = service.getQuoteLink({
      folio: 'COT-2026-000042',
      customerName: 'María José',
      customerPhone: '8112223333',
      items: [{ name: 'Varilla 3/8"', sku: 'FER002', quantity: 2, unitPrice: 145, subtotal: 290 }],
      total: 290,
      comments: 'Entregar en obra #45, colonia Los Álamos. ¡Urgente! Presupuesto máx. $5,000.',
    });

    // Ninguna URL válida puede contener espacios, saltos de línea, comillas o "#" crudos.
    expect(link).not.toMatch(/[ \n"#]/);

    // Y el mensaje original debe poder recuperarse exactamente vía decodeURIComponent.
    const decoded = decodeURIComponent(link.split('?text=')[1]!);
    expect(decoded).toContain('Entregar en obra #45, colonia Los Álamos. ¡Urgente! Presupuesto máx. $5,000.');
  });

  it('el mismo mensaje siempre produce el mismo enlace (determinismo, importante para pruebas de folio)', () => {
    const data = {
      folio: 'COT-2026-000001',
      customerName: 'Juan',
      customerPhone: '8110000000',
      items: [{ name: 'Producto', sku: 'SKU1', quantity: 1, unitPrice: 100, subtotal: 100 }],
      total: 100,
    };
    expect(service.getQuoteLink(data)).toBe(service.getQuoteLink(data));
  });
});
