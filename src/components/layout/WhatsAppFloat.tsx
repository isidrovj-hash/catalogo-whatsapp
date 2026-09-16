import { MessageCircle } from 'lucide-react';
import { getWhatsAppService } from '@/lib/whatsapp/WhatsAppService';
import { TrackedLink } from '@/components/analytics/TrackedLink';

/**
 * Botón flotante visible en escritorio/tablet (`lg:flex`). En móvil se oculta
 * a propósito: la navegación inferior (`BottomNav`) ya incluye un acceso a
 * WhatsApp igual de directo, y superponer ambos violaría el requisito de la
 * sección 17 de no bloquear la navegación móvil.
 */
export async function WhatsAppFloat() {
  const whatsapp = await getWhatsAppService();
  const link = whatsapp.getGeneralInquiryLink();

  if (!link) return null;

  return (
    <TrackedLink
      event="whatsapp"
      context="floating_button"
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-full bg-success px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 lg:flex"
    >
      <MessageCircle className="h-5 w-5" />
      ¿Necesitas ayuda? Habla con un vendedor
    </TrackedLink>
  );
}
