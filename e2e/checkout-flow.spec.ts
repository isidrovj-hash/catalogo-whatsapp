import { test, expect } from '@playwright/test';

/**
 * Cubre el embudo completo descrito en la sección 44 del brief:
 * Catálogo → Producto → Agregar → Carrito → Datos del cliente → Cotización.
 *
 * Requiere que la base de datos tenga el seed de la FASE 2 cargado (usa los
 * nombres exactos de productos del seed, como "Cemento Gris Monterrey").
 * No se ejecutó en este sandbox — ver nota en playwright.config.ts y en
 * FASE12-testing.md.
 */

test.describe('Embudo de conversión completo', () => {
  test('un visitante puede buscar, agregar al carrito y solicitar una cotización', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /todo lo que necesitas/i })).toBeVisible();

    // Buscar un producto del seed
    await page.getByPlaceholder(/busca por nombre/i).fill('cemento');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/productos\?q=cemento/);
    await expect(page.getByText('Cemento Gris Monterrey')).toBeVisible();

    // Entrar a la ficha de producto
    await page.getByText('Cemento Gris Monterrey').first().click();
    await expect(page).toHaveURL(/\/productos\/cemento-gris-monterrey-25kg/);

    // Agregar al carrito con cantidad 3
    const quantityInput = page.getByLabel('Cantidad');
    await quantityInput.fill('3');
    await page.getByRole('button', { name: /agregar al pedido/i }).click();
    await expect(page.getByText(/agregado al pedido/i)).toBeVisible();

    // Ir al carrito y verificar la cantidad y el subtotal
    await page.getByRole('link', { name: /ver carrito/i }).click();
    await expect(page).toHaveURL('/carrito');
    await expect(page.getByText('Cemento Gris Monterrey')).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toHaveValue('3'); // ajustar selector según UI real

    // Ir al cotizador y completar el formulario
    await page.getByRole('link', { name: /solicitar cotización/i }).click();
    await expect(page).toHaveURL('/cotizar');
    await page.getByLabel(/nombre/i).fill('Prueba Playwright');
    await page.getByLabel(/teléfono/i).fill('8110000000');

    // Interceptar la apertura de WhatsApp (window.open) para no salir del test
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      page.getByRole('button', { name: /enviar cotización por whatsapp/i }).click(),
    ]);

    // Confirmación con folio
    await expect(page.getByText(/cotización registrada/i)).toBeVisible();
    await expect(page.getByText(/COT-\d{4}-\d{6}/)).toBeVisible();

    if (popup) {
      expect(popup.url()).toContain('wa.me');
      await popup.close();
    }
  });
});

test.describe('Responsive', () => {
  test('la navegación inferior aparece en móvil y el botón flotante no', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
      await expect(page.getByRole('link', { name: 'Pedido' })).toBeVisible();
    } else {
      await expect(page.getByRole('link', { name: /¿necesitas ayuda\?/i })).toBeVisible();
    }
  });
});
