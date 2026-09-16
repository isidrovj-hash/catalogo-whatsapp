import type { Config } from 'tailwindcss';

// ----------------------------------------------------------------------------
// TOKENS DE DISEÑO — Catálogo Digital + WhatsApp
//
// Dirección: ferretería/materiales de construcción industrial, no un SaaS
// genérico. Paleta inspirada en señalética de bodega y concreto, con un
// naranja de seguridad como acento de conversión (CTAs, WhatsApp, promos).
// Tipografía: Barlow Condensed (display, evoca rotulación de almacén) +
// Inter (texto, máxima legibilidad en catálogos largos en móvil).
// ----------------------------------------------------------------------------

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#201E1B', // texto principal — negro cálido, no #0B0B0B genérico
          soft: '#57524C',    // texto secundario
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sunken: '#F2F0EA', // fondo de sección — gris concreto cálido
          border: '#E1DED5',
        },
        brand: {
          DEFAULT: '#E1531C', // naranja de seguridad — CTA principal, WhatsApp
          hover: '#C44312',
          soft: '#FCE9E1',
        },
        accent: {
          DEFAULT: '#F0AC00', // amarillo de advertencia — promos, badges, destacados
          soft: '#FDF1CC',
        },
        success: '#2F7A4D',
        danger: '#C0392B',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
      },
      maxWidth: {
        content: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
