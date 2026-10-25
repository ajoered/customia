// Guarda la lámina de la línea de diseño (tools/linea.html) en estudio/img/linea-de-diseno.png.
// Uso: node tools/linea.cjs   (necesita Playwright)
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const raiz = path.resolve(__dirname, "..");
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  await pagina.goto("file://" + path.join(raiz, "tools/linea.html"));
  await pagina.waitForSelector("body[data-listo]");
  const salida = path.join(raiz, "estudio/img/linea-de-diseno.png");
  await pagina.screenshot({ path: salida });
  console.log("ok", salida);
  await navegador.close();
})();
