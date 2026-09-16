import { z } from 'zod';

export const productFormSchema = z.object({
  sku: z.string().min(1, 'El SKU es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  slug: z.string().min(1, 'El slug es obligatorio'),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
  brandId: z.string().optional(),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  promoPrice: z.coerce.number().min(0).optional().or(z.literal('')),
  cost: z.coerce.number().min(0).optional().or(z.literal('')),
  priceMode: z.enum(['MOSTRAR_PRECIO', 'SOLICITAR_PRECIO']),
  unit: z.string().min(1, 'La unidad es obligatoria'),
  presentation: z.string().min(1, 'La presentación es obligatoria'),
  mainImageUrl: z.string().optional(),
  galleryUrls: z.string().optional(), // una URL por línea, se separa en el action
  tags: z.string().optional(), // separado por comas
  featured: z.coerce.boolean().optional(),
  onPromotion: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo'),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  availability: z.enum(['DISPONIBLE', 'POCAS_PIEZAS', 'AGOTADO', 'SOBRE_PEDIDO']),
  showExactStock: z.coerce.boolean().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
