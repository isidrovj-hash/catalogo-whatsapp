import { BannerForm } from '@/components/admin/BannerForm';
import { createBanner } from '@/actions/admin/banners';

export default function NewBannerPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Nuevo banner</h1>
      <BannerForm action={createBanner} submitLabel="Crear banner" />
    </div>
  );
}
