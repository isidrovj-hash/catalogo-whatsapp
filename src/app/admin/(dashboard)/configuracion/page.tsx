import { getBusinessSettings } from '@/lib/data/business-settings';
import { SettingsForm } from '@/components/admin/SettingsForm';

export default async function AdminSettingsPage() {
  const settings = await getBusinessSettings();

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Configuración general</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
