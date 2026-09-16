import type { Metadata } from 'next';
import { Barlow_Condensed, Inter } from 'next/font/google';
import './globals.css';
import { getBusinessSettings } from '@/lib/data/business-settings';

const fontDisplay = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const fontBody = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

// Layout raíz MÍNIMO: solo fuentes, metadata global y el shell html/body.
// El Header/Footer/BottomNav/WhatsAppFloat del catálogo público viven en
// `app/(public)/layout.tsx`, no aquí — así el panel /admin (FASE 9) no
// hereda ninguna pieza de navegación pensada para clientes del catálogo.
export async function generateMetadata(): Promise<Metadata> {
  const business = await getBusinessSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: {
      default: business.businessName,
      template: `%s | ${business.businessName}`,
    },
    description: 'Consulta nuestro catálogo, selecciona tus productos y solicita tu cotización directamente por WhatsApp.',
    openGraph: {
      type: 'website',
      locale: 'es_MX',
      siteName: business.businessName,
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#E1531C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body>{children}</body>
    </html>
  );
}
