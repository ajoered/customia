#!/usr/bin/env node
// Captura la web en escritorio y en móvil (primera pantalla) para comparar
// el "antes" con el rediseño.
//
// Uso: node tools/screenshot.js <url> <carpeta_salida> [nombre]
//   -> <carpeta>/<nombre>-escritorio.png y <carpeta>/<nombre>-movil.png
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const [url, outDir, name = 'web'] = process.argv.slice(2);
  if (!url || !outDir) {
    console.error('Uso: node tools/screenshot.js <url> <carpeta_salida> [nombre]');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  // El user-agent de iPhone importa: algunos constructores (Duda, IONOS) sirven
  // la versión móvil según el user-agent y no según el ancho de pantalla.
  const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) '
    + 'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
  const views = [
    { tag: 'escritorio', viewport: { width: 1366, height: 860 }, isMobile: false },
    { tag: 'movil', viewport: { width: 390, height: 844 }, isMobile: true, userAgent: IPHONE_UA },
  ];
  for (const v of views) {
    const page = await browser.newPage({
      viewport: v.viewport,
      isMobile: v.isMobile,
      hasTouch: v.isMobile,
      userAgent: v.userAgent,
      deviceScaleFactor: 1,
      ignoreHTTPSErrors: true,
    });
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      // Dar tiempo a imágenes y fuentes sin bloquearse en webs que nunca terminan de cargar.
      await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const file = path.join(outDir, `${name}-${v.tag}.png`);
      await page.screenshot({ path: file });
      console.log(file);
    } catch (e) {
      console.error(`${v.tag}: ${e.message.split('\n')[0]}`);
    }
    await page.close();
  }
  await browser.close();
}

main();
