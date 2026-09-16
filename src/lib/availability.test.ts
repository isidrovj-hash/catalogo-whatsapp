import { describe, it, expect } from 'vitest';
import { getAvailabilityLabel } from './availability';

describe('getAvailabilityLabel', () => {
  it('muestra "Consultar disponibilidad" cuando no hay estado', () => {
    expect(getAvailabilityLabel(undefined, undefined, undefined).text).toBe('Consultar disponibilidad');
  });

  it('mapea cada estado a su etiqueta en español', () => {
    expect(getAvailabilityLabel('DISPONIBLE', 10, false).text).toBe('Disponible');
    expect(getAvailabilityLabel('POCAS_PIEZAS', 2, false).text).toBe('Pocas piezas');
    expect(getAvailabilityLabel('AGOTADO', 0, false).text).toBe('Agotado');
    expect(getAvailabilityLabel('SOBRE_PEDIDO', 0, false).text).toBe('Sobre pedido');
  });

  it('muestra la cantidad exacta cuando showExactStock es true y hay stock', () => {
    const result = getAvailabilityLabel('DISPONIBLE', 7, true);
    expect(result.text).toBe('7 disponibles');
  });

  it('NUNCA muestra cantidad exacta si el producto está agotado, aunque showExactStock sea true', () => {
    // Regla de negocio explícita (sección 21): "0 disponibles" sería confuso;
    // debe decir "Agotado" sin importar la configuración del admin.
    const result = getAvailabilityLabel('AGOTADO', 0, true);
    expect(result.text).toBe('Agotado');
  });

  it('no muestra cantidad exacta si showExactStock es false, aunque haya stock', () => {
    const result = getAvailabilityLabel('DISPONIBLE', 15, false);
    expect(result.text).toBe('Disponible');
  });

  it('asigna una clase de color distinta para agotado vs disponible', () => {
    const disponible = getAvailabilityLabel('DISPONIBLE', 5, false);
    const agotado = getAvailabilityLabel('AGOTADO', 0, false);
    expect(disponible.className).not.toBe(agotado.className);
  });
});
