import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para el flujo crítico de punta a punta
 * (sección 53). NO se ejecuta en el sandbox de esta conversación — requiere
 * una base de datos Postgres real corriendo (con el seed de la FASE 2
 * cargado) y un navegador real, ninguno de los dos disponibles aquí.
 *
 * Para correrlo en tu máquina:
 *   npx playwright install --with-deps chromium
 *   npm run dev &
 *   npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-iphone', use: { ...devices['iPhone 13'] } },
  ],
});
