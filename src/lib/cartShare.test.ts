import { describe, it, expect } from 'vitest';
import { buildCartShareText } from './cartShare';
import type { CartItem } from '@/store/cartStore';

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: '1',
    name: 'Cemento Gris Monterrey',
    slug: 'cemento-gris-monterrey-25kg',
    sku: 'CEM001',
    price: 185,
    promoPrice: 165,
    unit: 'saco',
    presentation: 'Saco 25 kg',
    imageUrl: null,
    quantity: 10,
    ...overrides,
  };
}

describe('buildCartShareText', () => {
  it('incluye el encabezado "MI LISTA DE MATERIALES"', () => {
    const text = buildCartShareText([makeItem()]);
    expect(text).toContain('MI LISTA DE MATERIALES');
  });

  it('lista cada producto con su cantidad, en el formato "10 Cementos"', () => {
    const text = buildCartShareText([makeItem({ quantity: 10, name: 'Cemento Gris Monterrey' })]);
    expect(text).toContain('10 Cemento Gris Monterrey');
  });

  it('lista varios productos en líneas separadas, en el orden del carrito', () => {
    const items = [
      makeItem({ name: 'Cemento Gris Monterrey', quantity: 10 }),
      makeItem({ productId: '2', name: 'Multiplast Adhesivo Multiusos', quantity: 5 }),
      makeItem({ productId: '3', name: 'Rodillo Felpa 9"', quantity: 1 }),
    ];
    const text = buildCartShareText(items);
    const lines = text.split('\n');
    expect(lines).toContain('10 Cemento Gris Monterrey');
    expect(lines).toContain('5 Multiplast Adhesivo Multiusos');
    expect(lines).toContain('1 Rodillo Felpa 9"');
  });

  it('NO incluye precios ni montos — es una lista, no una cotización', () => {
    const text = buildCartShareText([makeItem({ price: 185, promoPrice: 165 })]);
    expect(text).not.toMatch(/\$/);
    expect(text).not.toContain('185');
    expect(text).not.toContain('165');
  });

  it('produce una lista vacía (solo encabezado) cuando no hay productos', () => {
    const text = buildCartShareText([]);
    expect(text).toContain('MI LISTA DE MATERIALES');
    expect(text.split('\n').filter(Boolean)).toHaveLength(1);
  });
});
