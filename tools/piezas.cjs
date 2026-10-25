// Exporta las piezas de tools/piezas.html a web/public/assets/piezas/ (y la imagen para compartir).
// Uso: node tools/piezas.cjs [carpeta-para-una-captura-de-revisión]
// Necesita Playwright.
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

(async () => {
  const raiz = path.resolve(__dirname, "..");
  const salida = path.join(raiz, "web/public/assets/piezas");
  fs.mkdirSync(salida, { recursive: true });
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1000 } });
  await pagina.goto("file://" + path.join(raiz, "tools/piezas.html"));
  await pagina.waitForSelector("body[data-listo]");
  for (const { archivo, url } of await pagina.evaluate(() => window.SALIDAS())) {
    fs.writeFileSync(path.join(salida, archivo), Buffer.from(url.split(",")[1], "base64"));
    console.log("ok", archivo, fs.statSync(path.join(salida, archivo)).size, "bytes");
  }
  if (process.argv[2]) await pagina.screenshot({ path: path.join(process.argv[2], "piezas.png"), fullPage: true });
  await navegador.close();
})();
