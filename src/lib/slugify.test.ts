import { describe, it, expect } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('convierte a minúsculas y reemplaza espacios por guiones', () => {
    expect(slugify('Cemento Gris Monterrey')).toBe('cemento-gris-monterrey');
  });

  it('quita acentos (caso real del seed: "Impermeabilizante Acrílico 5 Años")', () => {
    expect(slugify('Impermeabilizante Acrílico 5 Años')).toBe('impermeabilizante-acrilico-5-anos');
  });

  it('quita símbolos y signos de puntuación', () => {
    expect(slugify('Tubo PVC 1/2" Hidráulico!')).toBe('tubo-pvc-12-hidraulico');
  });

  it('colapsa espacios múltiples en un solo guion', () => {
    expect(slugify('Varilla   Corrugada   3/8"')).toBe('varilla-corrugada-38');
  });

  it('colapsa guiones repetidos', () => {
    expect(slugify('Producto -- con -- guiones')).toBe('producto-con-guiones');
  });

  it('quita espacios al inicio y al final antes de convertir', () => {
    expect(slugify('  Producto con espacios  ')).toBe('producto-con-espacios');
  });

  it('mantiene números', () => {
    expect(slugify('Cable THHW Calibre 12')).toBe('cable-thhw-calibre-12');
  });
});
