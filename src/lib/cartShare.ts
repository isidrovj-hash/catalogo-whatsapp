import type { CartItem } from '@/store/cartStore';

/**
 * Arma el resumen de texto plano del carrito para compartir (sección 45).
 * Deliberadamente NO incluye precios ni datos del cliente: es una lista de
 * materiales para compartir con un colega o cliente, no una cotización
 * formal (eso es "Solicitar cotización", que sí va dirigido al negocio).
 */
export function buildCartShareText(items: CartItem[]): string {
  const lines = ['MI LISTA DE MATERIALES', ''];
  items.forEach((item) => {
    lines.push(`${item.quantity} ${item.name}`);
  });
  return lines.join('\n');
}
