import type { Metadata } from 'next';
import { FavoritesView } from '@/components/catalog/FavoritesView';

export const metadata: Metadata = {
  title: 'Favoritos',
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <div className="container-app py-8">
      <h1 className="mb-6 text-3xl text-ink">Tus favoritos</h1>
      <FavoritesView />
    </div>
  );
}
