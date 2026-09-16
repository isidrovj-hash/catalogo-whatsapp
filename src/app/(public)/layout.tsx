import { getBusinessSettings } from '@/lib/data/business-settings';
import { getCategoryTree } from '@/lib/data/categories';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat';
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [business, categories] = await Promise.all([getBusinessSettings(), getCategoryTree()]);

  return (
    <>
      <AnalyticsScripts />
      <Header business={business} categories={categories} />
      {/* pb-16 reserva espacio para la navegación inferior fija en móvil (sección 32) */}
      <main className="min-h-screen pb-16 lg:pb-0">{children}</main>
      <Footer business={business} />
      <BottomNav />
      <WhatsAppFloat />
    </>
  );
}
