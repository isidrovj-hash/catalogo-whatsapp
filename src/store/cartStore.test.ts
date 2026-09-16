import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, getCartSubtotal, getCartTotalItems, type CartItem } from './cartStore';

function makeItem(overrides: Partial<CartItem> = {}): Omit<CartItem, 'quantity'> {
  const { quantity: _ignored, ...rest } = {
    productId: '1',
    name: 'Cemento Gris Monterrey',
    slug: 'cemento-gris-monterrey-25kg',
    sku: 'CEM001',
    price: 185,
    promoPrice: 165,
    unit: 'saco',
    presentation: 'Saco 25 kg',
    imageUrl: null,
    quantity: 1,
    ...overrides,
  };
  return rest;
}

// El store es un singleton (patrón normal de Zustand); se resetea antes de
// cada prueba para que no haya contaminación entre casos.
beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe('cartStore — agregar productos', () => {
  it('agrega un producto nuevo con cantidad 1 por defecto', () => {
    useCartStore.getState().addItem(makeItem());
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]?.quantity).toBe(1);
  });

  it('agrega un producto con una cantidad específica', () => {
    useCartStore.getState().addItem(makeItem(), 5);
    expect(useCartStore.getState().items[0]?.quantity).toBe(5);
  });

  it('si el producto ya está en el carrito, SUMA la cantidad en vez de duplicar la fila', () => {
    useCartStore.getState().addItem(makeItem(), 2);
    useCartStore.getState().addItem(makeItem(), 3);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(5);
  });

  it('dos productos distintos generan dos filas separadas', () => {
    useCartStore.getState().addItem(makeItem({ productId: '1' }));
    useCartStore.getState().addItem(makeItem({ productId: '2', name: 'Multiplast' }));
    expect(useCartStore.getState().items).toHaveLength(2);
  });
});

describe('cartStore — cambiar cantidad', () => {
  it('actualiza la cantidad de un producto existente', () => {
    useCartStore.getState().addItem(makeItem(), 1);
    useCartStore.getState().updateQuantity('1', 8);
    expect(useCartStore.getState().items[0]?.quantity).toBe(8);
  });

  it('reducir la cantidad a 0 ELIMINA el producto del carrito', () => {
    useCartStore.getState().addItem(makeItem(), 3);
    useCartStore.getState().updateQuantity('1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('una cantidad negativa también elimina el producto (caso límite)', () => {
    useCartStore.getState().addItem(makeItem(), 3);
    useCartStore.getState().updateQuantity('1', -1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('actualizar la cantidad de un producto que no existe no rompe el carrito', () => {
    useCartStore.getState().addItem(makeItem({ productId: '1' }), 2);
    useCartStore.getState().updateQuantity('producto-inexistente', 5);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
  });
});

describe('cartStore — eliminar productos', () => {
  it('elimina un producto específico sin afectar los demás', () => {
    useCartStore.getState().addItem(makeItem({ productId: '1' }));
    useCartStore.getState().addItem(makeItem({ productId: '2', name: 'Multiplast' }));
    useCartStore.getState().removeItem('1');
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.productId).toBe('2');
  });

  it('clear() vacía el carrito por completo', () => {
    useCartStore.getState().addItem(makeItem({ productId: '1' }));
    useCartStore.getState().addItem(makeItem({ productId: '2' }));
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('cartStore — persistencia (sección 33)', () => {
  it('escribe el estado en localStorage bajo la clave esperada', () => {
    useCartStore.getState().addItem(makeItem(), 4);
    const raw = window.localStorage.getItem('catalogo-whatsapp-cart');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.items).toHaveLength(1);
    expect(parsed.state.items[0].quantity).toBe(4);
  });
});

describe('cálculo de subtotal y totales (sección 11)', () => {
  it('getCartTotalItems suma las cantidades de todas las líneas', () => {
    const items: CartItem[] = [
      { ...makeItem({ productId: '1' }), quantity: 3 },
      { ...makeItem({ productId: '2' }), quantity: 2 },
    ];
    expect(getCartTotalItems(items)).toBe(5);
  });

  it('getCartSubtotal usa el precio de promoción cuando existe', () => {
    const items: CartItem[] = [{ ...makeItem({ price: 185, promoPrice: 165 }), quantity: 2 }];
    expect(getCartSubtotal(items)).toBe(330); // 165 * 2, no 185 * 2
  });

  it('getCartSubtotal usa el precio normal cuando no hay promoción', () => {
    const items: CartItem[] = [{ ...makeItem({ price: 320, promoPrice: null }), quantity: 1 }];
    expect(getCartSubtotal(items)).toBe(320);
  });

  it('getCartSubtotal suma correctamente varios productos con y sin promoción', () => {
    const items: CartItem[] = [
      { ...makeItem({ productId: '1', price: 185, promoPrice: 165 }), quantity: 3 }, // 495
      { ...makeItem({ productId: '2', price: 1250, promoPrice: 1090 }), quantity: 1 }, // 1090
      { ...makeItem({ productId: '3', price: 65, promoPrice: null }), quantity: 6 }, // 390
    ];
    expect(getCartSubtotal(items)).toBe(495 + 1090 + 390);
  });

  it('el carrito vacío tiene subtotal y total de items en 0', () => {
    expect(getCartSubtotal([])).toBe(0);
    expect(getCartTotalItems([])).toBe(0);
  });
});
