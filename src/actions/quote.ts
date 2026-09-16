'use server';

import { prisma } from '@/lib/prisma';
import { getWhatsAppService } from '@/lib/whatsapp/WhatsAppService';
import type { CustomerType } from '@prisma/client';
import { logAnalyticsEvent } from './analytics';

export interface SubmitQuoteItemInput {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface SubmitQuoteInput {
  customerName: string;
  company?: string;
  customerPhone: string;
  email?: string;
  city?: string;
  neighborhood?: string;
  customerType: CustomerType;
  comments?: string;
  items: SubmitQuoteItemInput[];
}

export type SubmitQuoteResult =
  | { ok: true; folio: string; whatsappLink: string }
  | { ok: false; error: string };

/**
 * Flujo completo de cotización (sección 12, 14 y 24). A diferencia de la
 * versión preliminar de la FASE 4 (`buildQuickQuoteLink`, ahora reemplazada),
 * esto SÍ persiste todo en base de datos dentro de una transacción:
 * customer -> quote (con folio real correlativo) -> quote_items -> lead.
 * Si algo falla a mitad de camino, la transacción completa se revierte —
 * nunca queda un lead huérfano sin su cotización, ni una cotización sin sus
 * líneas de producto.
 */
export async function submitQuote(input: SubmitQuoteInput): Promise<SubmitQuoteResult> {
  const name = input.customerName.trim();
  const phone = input.customerPhone.trim();

  if (input.items.length === 0) {
    return { ok: false, error: 'Tu carrito está vacío.' };
  }
  if (!name || !phone) {
    return { ok: false, error: 'Nombre y teléfono son obligatorios.' };
  }

  try {
    const { folio, subtotal } = await prisma.$transaction(async (tx) => {
      // Un mismo teléfono puede volver a cotizar más adelante: se actualiza
      // el registro existente en vez de crear clientes duplicados, para que
      // el futuro CRM (FASE 10) muestre un historial unificado por cliente.
      const existingCustomer = await tx.customer.findFirst({ where: { phone } });

      const customerData = {
        name,
        phone,
        company: input.company?.trim() || null,
        email: input.email?.trim() || null,
        city: input.city?.trim() || null,
        neighborhood: input.neighborhood?.trim() || null,
        type: input.customerType,
      };

      const customer = existingCustomer
        ? await tx.customer.update({ where: { id: existingCustomer.id }, data: customerData })
        : await tx.customer.create({ data: customerData });

      const folioRows = await tx.$queryRaw<{ next_quote_folio: string }[]>`SELECT next_quote_folio()`;
      const folio = folioRows[0]?.next_quote_folio;
      if (!folio) {
        throw new Error('La base de datos no devolvió un folio. ¿Se ejecutó la función next_quote_folio() de la FASE 7?');
      }

      const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      const quote = await tx.quote.create({
        data: {
          folio,
          customerId: customer.id,
          comments: input.comments?.trim() || null,
          subtotal,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.unitPrice * item.quantity,
            })),
          },
        },
      });

      await tx.lead.create({
        data: {
          customerId: customer.id,
          quoteId: quote.id,
          status: 'NUEVO',
          origin: 'CATALOGO_WHATSAPP',
          estimatedTotal: subtotal,
        },
      });

      return { folio, subtotal };
    });

    const whatsapp = await getWhatsAppService();
    const whatsappLink = whatsapp.getQuoteLink({
      folio,
      customerName: name,
      customerPhone: phone,
      customerCity: input.city,
      items: input.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
      })),
      total: subtotal,
      comments: input.comments,
    });

    await logAnalyticsEvent('QUOTE_SUBMITTED', undefined, { folio, total: subtotal, itemCount: input.items.length });

    return { ok: true, folio, whatsappLink };
  } catch (error) {
    console.error('[quote] Error al generar la cotización:', error);
    return {
      ok: false,
      error: 'Ocurrió un error al generar tu cotización. Intenta de nuevo o contáctanos directamente.',
    };
  }
}

/** Se dispara al abrir el formulario de cotización, antes de que el cliente envíe nada (sección 25). */
export async function logQuoteStarted(): Promise<void> {
  await logAnalyticsEvent('QUOTE_STARTED');
}
