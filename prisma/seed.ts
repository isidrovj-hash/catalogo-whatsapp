// ============================================================================
// CATÁLOGO DIGITAL + WHATSAPP — SEED DE DATOS DEMO
// FASE 2 — Catálogo de ejemplo: materiales para construcción
// Ejecutar con: npx prisma db seed
// ============================================================================

import { PrismaClient, CustomerType, LeadOrigin, LeadStatus, PriceMode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // --------------------------------------------------------------------
  // 1. CONFIGURACIÓN GENERAL DEL NEGOCIO
  // --------------------------------------------------------------------
  await prisma.businessSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      businessName: 'Materiales del Norte',
      logoUrl: '/demo/logo.png',
      whatsappNumber: '528112345678', // formato E.164 sin '+' ni espacios
      phone: '8112345678',
      email: 'contacto@materialesdelnorte.mx',
      address: 'Av. Industrias 450, Parque Industrial',
      city: 'Apodaca',
      state: 'Nuevo León',
      schedule: 'Lun-Vie 8:00-18:00, Sáb 8:00-14:00',
      facebookUrl: 'https://facebook.com/materialesdelnorte',
      instagramUrl: 'https://instagram.com/materialesdelnorte',
      googleMapsUrl: 'https://maps.google.com/?q=Materiales+del+Norte+Apodaca',
      currency: 'MXN',
      taxRate: 16,
      minPurchaseAmount: 500,
      freeShippingAmount: 3000,
      legalText: 'Precios sujetos a cambio sin previo aviso. Consulta disponibilidad.',
      whatsappMessageBase: 'Hola, me interesa solicitar una cotización.',
    },
  });

  // --------------------------------------------------------------------
  // 2. SUCURSAL DEMO
  // --------------------------------------------------------------------
  await prisma.branch.create({
    data: {
      name: 'Sucursal Apodaca Centro',
      address: 'Av. Industrias 450, Parque Industrial',
      city: 'Apodaca',
      state: 'Nuevo León',
      phone: '8112345678',
      whatsapp: '528112345678',
      googleMapsUrl: 'https://maps.google.com/?q=Materiales+del+Norte+Apodaca',
      schedule: 'Lun-Vie 8:00-18:00, Sáb 8:00-14:00',
      active: true,
    },
  });

  // --------------------------------------------------------------------
  // 3. CATEGORÍAS (con una subcategoría de ejemplo)
  // --------------------------------------------------------------------
  const catConstruccion = await prisma.category.create({
    data: { name: 'Materiales para construcción', slug: 'materiales-construccion', sortOrder: 1 },
  });
  const catCementos = await prisma.category.create({
    data: {
      name: 'Cementos',
      slug: 'cementos',
      parentId: catConstruccion.id,
      sortOrder: 1,
    },
  });
  const catAdhesivos = await prisma.category.create({
    data: { name: 'Adhesivos', slug: 'adhesivos', sortOrder: 2 },
  });
  const catImpermeabilizantes = await prisma.category.create({
    data: { name: 'Impermeabilizantes', slug: 'impermeabilizantes', sortOrder: 3 },
  });
  const catPlomeria = await prisma.category.create({
    data: { name: 'Plomería', slug: 'plomeria', sortOrder: 4 },
  });
  const catElectricidad = await prisma.category.create({
    data: { name: 'Electricidad', slug: 'electricidad', sortOrder: 5 },
  });
  const catHerramientas = await prisma.category.create({
    data: { name: 'Herramientas', slug: 'herramientas', sortOrder: 6 },
  });
  const catPintura = await prisma.category.create({
    data: { name: 'Pintura', slug: 'pintura', sortOrder: 7 },
  });
  const catFerreteria = await prisma.category.create({
    data: { name: 'Ferretería', slug: 'ferreteria', sortOrder: 8 },
  });

  // --------------------------------------------------------------------
  // 4. MARCAS
  // --------------------------------------------------------------------
  const brandCemex = await prisma.brand.create({ data: { name: 'CEMEX', slug: 'cemex' } });
  const brandFester = await prisma.brand.create({ data: { name: 'Fester', slug: 'fester' } });
  const brandTruper = await prisma.brand.create({ data: { name: 'Truper', slug: 'truper' } });
  const brandComex = await prisma.brand.create({ data: { name: 'Comex', slug: 'comex' } });
  const brandUrrea = await prisma.brand.create({ data: { name: 'Urrea', slug: 'urrea' } });

  // --------------------------------------------------------------------
  // 5. PRODUCTOS
  // --------------------------------------------------------------------
  const productsData = [
    {
      sku: 'CEM001',
      name: 'Cemento Gris Monterrey',
      slug: 'cemento-gris-monterrey-25kg',
      shortDescription: 'Cemento gris de uso general para construcción.',
      description:
        'Cemento gris ideal para mezclas de concreto, mortero y aplicaciones generales de construcción. Alta resistencia y fraguado uniforme.',
      categoryId: catCementos.id,
      brandId: brandCemex.id,
      price: 185,
      promoPrice: 165,
      unit: 'saco',
      presentation: 'Saco 25 kg',
      mainImageUrl: '/demo/cemento-gris.jpg',
      tags: ['cemento', 'construccion', 'concreto', 'mortero'],
      featured: true,
      onPromotion: true,
      stock: 500,
    },
    {
      sku: 'CEM002',
      name: 'Cemento Blanco',
      slug: 'cemento-blanco-25kg',
      shortDescription: 'Cemento blanco para acabados decorativos.',
      description: 'Cemento blanco de alta calidad para acabados finos, plafones decorativos y trabajos que requieren estética.',
      categoryId: catCementos.id,
      brandId: brandCemex.id,
      price: 320,
      unit: 'saco',
      presentation: 'Saco 25 kg',
      mainImageUrl: '/demo/cemento-blanco.jpg',
      tags: ['cemento', 'blanco', 'decorativo'],
      stock: 120,
    },
    {
      sku: 'ADH001',
      name: 'Multiplast Adhesivo Multiusos',
      slug: 'multiplast-adhesivo-multiusos-19l',
      shortDescription: 'Adhesivo multiusos para interior y exterior.',
      description:
        'Adhesivo de alto rendimiento para pegado de azulejo, mosaico y materiales de construcción en interior y exterior.',
      categoryId: catAdhesivos.id,
      brandId: brandFester.id,
      price: 890,
      unit: 'cubeta',
      presentation: 'Cubeta 19 L',
      mainImageUrl: '/demo/multiplast.jpg',
      tags: ['adhesivo', 'multiplast', 'azulejo'],
      stock: 40,
    },
    {
      sku: 'IMP001',
      name: 'Impermeabilizante Acrílico 5 Años',
      slug: 'impermeabilizante-acrilico-5-anos-19l',
      shortDescription: 'Protección impermeable de larga duración para techos.',
      description:
        'Impermeabilizante acrílico con garantía de 5 años, ideal para losas y techos expuestos a la intemperie. Fácil aplicación con rodillo o cepillo.',
      categoryId: catImpermeabilizantes.id,
      brandId: brandFester.id,
      price: 1250,
      promoPrice: 1090,
      unit: 'cubeta',
      presentation: 'Cubeta 19 L',
      mainImageUrl: '/demo/impermeabilizante.jpg',
      tags: ['impermeabilizante', 'techo', 'losa'],
      featured: true,
      onPromotion: true,
      stock: 25,
    },
    {
      sku: 'PLO001',
      name: 'Tubo PVC Hidráulico 1/2"',
      slug: 'tubo-pvc-hidraulico-1-2-pulgada',
      shortDescription: 'Tubo PVC para instalaciones hidráulicas residenciales.',
      description: 'Tubo de PVC cédula 40 para agua fría, ideal para instalaciones hidráulicas residenciales y comerciales.',
      categoryId: catPlomeria.id,
      price: 65,
      unit: 'pieza',
      presentation: 'Tramo 6 m',
      mainImageUrl: '/demo/tubo-pvc.jpg',
      tags: ['plomeria', 'pvc', 'tuberia'],
      stock: 200,
    },
    {
      sku: 'ELE001',
      name: 'Cable THHW Calibre 12',
      slug: 'cable-thhw-calibre-12',
      shortDescription: 'Cable eléctrico THHW para instalaciones residenciales.',
      description: 'Cable THHW calibre 12, resistente a la humedad y altas temperaturas, ideal para circuitos residenciales.',
      categoryId: catElectricidad.id,
      price: 12.5,
      unit: 'metro',
      presentation: 'Rollo 100 m',
      mainImageUrl: '/demo/cable-thhw.jpg',
      tags: ['electricidad', 'cable', 'thhw'],
      stock: 80,
    },
    {
      sku: 'HER001',
      name: 'Rodillo Felpa 9"',
      slug: 'rodillo-felpa-9-pulgadas',
      shortDescription: 'Rodillo de felpa para pintura vinílica y esmalte.',
      description: 'Rodillo de felpa de 9 pulgadas, ideal para aplicación uniforme de pinturas vinílicas y esmaltes.',
      categoryId: catHerramientas.id,
      brandId: brandTruper.id,
      price: 55,
      unit: 'pieza',
      presentation: 'Pieza individual',
      mainImageUrl: '/demo/rodillo.jpg',
      tags: ['herramienta', 'rodillo', 'pintura'],
      stock: 150,
    },
    {
      sku: 'PIN001',
      name: 'Pintura Vinílica Interior/Exterior',
      slug: 'pintura-vinilica-interior-exterior-19l',
      shortDescription: 'Pintura vinílica de alto rendimiento y cubrimiento.',
      description: 'Pintura vinílica para interiores y exteriores con excelente cubrimiento, lavable y de secado rápido.',
      categoryId: catPintura.id,
      brandId: brandComex.id,
      price: 980,
      unit: 'cubeta',
      presentation: 'Cubeta 19 L',
      mainImageUrl: '/demo/pintura-vinilica.jpg',
      tags: ['pintura', 'vinilica', 'interior', 'exterior'],
      stock: 35,
    },
    {
      sku: 'FER001',
      name: 'Juego de Desarmadores 6 Piezas',
      slug: 'juego-desarmadores-6-piezas',
      shortDescription: 'Juego de desarmadores planos y de cruz.',
      description: 'Juego de 6 desarmadores de alta durabilidad, mangos ergonómicos antideslizantes.',
      categoryId: catFerreteria.id,
      brandId: brandUrrea.id,
      price: 245,
      unit: 'juego',
      presentation: 'Juego 6 piezas',
      mainImageUrl: '/demo/desarmadores.jpg',
      tags: ['ferreteria', 'desarmadores', 'herramientas manuales'],
      stock: 60,
    },
    {
      sku: 'FER002',
      name: 'Varilla Corrugada 3/8"',
      slug: 'varilla-corrugada-3-8-pulgada',
      shortDescription: 'Varilla de acero corrugado para refuerzo estructural.',
      description: 'Varilla corrugada de 3/8 de pulgada, grado estructural, para refuerzo de concreto en construcción.',
      categoryId: catConstruccion.id,
      price: 145,
      unit: 'pieza',
      presentation: 'Varilla 9 m',
      mainImageUrl: '/demo/varilla.jpg',
      tags: ['varilla', 'acero', 'estructural'],
      stock: 300,
      priceMode: PriceMode.SOLICITAR_PRECIO,
    },
  ];

  const createdProducts: Record<string, string> = {};

  for (const p of productsData) {
    const { stock, priceMode, ...productFields } = p as any;
    const product = await prisma.product.create({
      data: {
        ...productFields,
        priceMode: priceMode ?? PriceMode.MOSTRAR_PRECIO,
        onPromotion: p.onPromotion ?? false,
        featured: p.featured ?? false,
      },
    });
    createdProducts[p.sku] = product.id;

    await prisma.inventory.create({
      data: {
        productId: product.id,
        stock,
        availability: stock > 10 ? 'DISPONIBLE' : stock > 0 ? 'POCAS_PIEZAS' : 'AGOTADO',
      },
    });

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: p.mainImageUrl,
        altText: p.name,
        sortOrder: 0,
      },
    });
  }

  // --------------------------------------------------------------------
  // 6. PRODUCTOS RELACIONADOS (ejemplo: cemento -> varilla, multiplast)
  // --------------------------------------------------------------------
  await prisma.productRelation.createMany({
    data: [
      { productId: createdProducts['CEM001'], relatedProductId: createdProducts['FER002'] },
      { productId: createdProducts['CEM001'], relatedProductId: createdProducts['ADH001'] },
      { productId: createdProducts['PIN001'], relatedProductId: createdProducts['HER001'] },
    ],
  });

  // --------------------------------------------------------------------
  // 7. PROMOCIÓN DE EJEMPLO
  // --------------------------------------------------------------------
  await prisma.promotion.create({
    data: {
      name: 'Oferta de la semana: Cemento Gris',
      description: 'Precio especial en Cemento Gris Monterrey por tiempo limitado.',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      productId: createdProducts['CEM001'],
      promoPrice: 165,
      imageUrl: '/demo/promo-cemento.jpg',
      active: true,
    },
  });

  // --------------------------------------------------------------------
  // 8. BANNERS
  // --------------------------------------------------------------------
  await prisma.banner.createMany({
    data: [
      { title: 'OFERTA DE LA SEMANA', subtitle: 'Hasta 20% de descuento en cementos', imageUrl: '/demo/banner-oferta.jpg', sortOrder: 1 },
      { title: 'ENVÍO GRATIS', subtitle: 'En compras mayores a $3,000 MXN', imageUrl: '/demo/banner-envio.jpg', sortOrder: 2 },
    ],
  });

  // --------------------------------------------------------------------
  // 9. COTIZACIÓN DE EJEMPLO (para probar el panel de prospectos)
  // --------------------------------------------------------------------
  const demoCustomer = await prisma.customer.create({
    data: {
      name: 'Juan Pérez',
      phone: '8181234567',
      email: 'juan.perez@example.com',
      city: 'Apodaca',
      type: CustomerType.CONTRATISTA,
    },
  });

  const cemento = productsData[0];
  const impermeabilizante = productsData[3];

  const demoQuote = await prisma.quote.create({
    data: {
      folio: 'COT-2026-000001',
      customerId: demoCustomer.id,
      comments: 'Necesito entrega a domicilio si es posible.',
      subtotal: 3 * 165 + 1 * 1090,
      items: {
        create: [
          {
            productId: createdProducts['CEM001'],
            quantity: 3,
            unitPrice: 165,
            subtotal: 3 * 165,
          },
          {
            productId: createdProducts['IMP001'],
            quantity: 1,
            unitPrice: 1090,
            subtotal: 1090,
          },
        ],
      },
    },
  });

  await prisma.lead.create({
    data: {
      customerId: demoCustomer.id,
      quoteId: demoQuote.id,
      status: LeadStatus.NUEVO,
      origin: LeadOrigin.CATALOGO_WHATSAPP,
      estimatedTotal: demoQuote.subtotal,
      notes: 'Cliente frecuente, suele comprar por volumen.',
    },
  });

  // Nota de seguimiento de ejemplo (FASE 10 — CRM)
  await prisma.customerNote.create({
    data: {
      customerId: demoCustomer.id,
      content: 'Prefiere que le llamen por la tarde. Suele comprar para varias obras a la vez.',
    },
  });

  console.log('✅ Seed completado con éxito.');
  console.log(`   - ${Object.keys(createdProducts).length} productos`);
  console.log('   - 9 categorías, 5 marcas, 1 sucursal');
  console.log('   - 1 cotización demo con folio COT-2026-000001');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
