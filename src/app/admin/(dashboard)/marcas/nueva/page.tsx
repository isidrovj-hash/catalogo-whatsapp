import { BrandForm } from '@/components/admin/BrandForm';
import { createBrand } from '@/actions/admin/brands';

export default function NewBrandPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Nueva marca</h1>
      <BrandForm action={createBrand} submitLabel="Crear marca" />
    </div>
  );
}
