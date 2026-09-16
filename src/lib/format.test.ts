import { describe, it, expect } from 'vitest';
import { formatCurrency, toNumber } from './format';

describe('formatCurrency', () => {
  it('formatea un número plano como moneda MXN', () => {
    expect(formatCurrency(165)).toBe('$165.00');
  });

  it('formatea un string numérico', () => {
    expect(formatCurrency('1090.5')).toBe('$1,090.50');
  });

  it('formatea un objeto tipo Decimal de Prisma (con toNumber())', () => {
    const fakeDecimal = { toNumber: () => 320 };
    expect(formatCurrency(fakeDecimal)).toBe('$320.00');
  });

  it('devuelve "—" para null o undefined', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('devuelve "—" para un string no numérico', () => {
    expect(formatCurrency('no-es-un-numero')).toBe('—');
  });

  it('agrega separador de miles', () => {
    expect(formatCurrency(12500)).toBe('$12,500.00');
  });

  it('nunca produce NaN visible al usuario', () => {
    // Regresión: un precio corrupto no debe filtrarse como "$NaN" en la UI.
    expect(formatCurrency(NaN)).toBe('—');
  });
});

describe('toNumber', () => {
  it('convierte number, string y Decimal-like a number', () => {
    expect(toNumber(10)).toBe(10);
    expect(toNumber('10.5')).toBe(10.5);
    expect(toNumber({ toNumber: () => 42 })).toBe(42);
  });

  it('devuelve 0 para null/undefined/string inválido', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('abc')).toBe(0);
  });
});
