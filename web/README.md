# Web de Arcilla Studio

**Vista previa:** <https://claude.ai/artifact/HaPSZBrNX92puycKVxQP4s (v2)>. Es privada, solo la ves tú. Ahí el chat funciona en modo de preguntas guiadas, porque no hay servidor detrás.

## Estructura

```
web/
  public/              lo que se publica tal cual
    index.html         portada
    aviso-legal.html   aviso legal (LSSI art. 10)
    privacidad.html    política de privacidad
    assets/styles.css  diseño (colores y tipos definidos al principio)
    assets/app.js      chat de diagnóstico
    assets/fonts/      fuentes propias (sin Google Fonts, así no hay que pedir consentimiento)
    _headers           cabeceras de seguridad para Cloudflare Pages
  lib/                 código del servidor del chat (pendiente, ver abajo)
```

## Diseño (v2)

- **Idea:** una sola pieza de arcilla (`assets/torno.js`, canvas 2D) que se moldea con el scroll: ladrillo → arcilla → tu web → tu WhatsApp → tu herramienta → horno → pieza esmaltada. Si el navegador prefiere menos movimiento, se muestra la forma fija de cada etapa.
- **Referencias:** ritmo de una idea por pantalla (Tribe AI), paleta cálida y sobria (Distyl), producto real en pantalla (Floema), contenido claro desde la primera pantalla (Estudio Telar). Ver `../estudio/07-benchmark-web.md`.
- **Colores:** papel cálido, tinta, barro para la arcilla, un solo acento cobalto (que es también el esmalte de la pieza cocida). Con versión oscura.
- **Tipos:** Fraunces (serifa de libro) para titulares, Atkinson Hyperlegible para el texto, Spline Sans Mono para cifras. Todas alojadas en la propia web.
- **Voz:** primera persona del singular.
- **Hilo:** portada con el asistente como ventana → el torno (8 pantallas) → lo que puedo construir (tres maquetas de un restaurante inventado, Casa Lucía) → cómo lo hago → quién soy → preguntas → cierre.

## Datos que faltan (marcados entre corchetes en la web)

1. Tu nombre y tu foto (sección "Quién está detrás").
2. Un ejemplo concreto de Hyrise: qué construiste y cuánto te ahorra.
3. Teléfono, WhatsApp y email. Se cambian en `assets/app.js` (bloque `CONFIG`) y en las páginas legales.
4. Los datos de AR Ventures, S.L.: CIF, domicilio y datos del Registro Mercantil.

## Pendiente: el servidor del chat con IA

Ahora mismo el chat funciona en modo guiado: preguntas fijas y la cuenta hecha en el navegador. La versión con IA está empezada en `lib/claude.js`. Usa Claude con un historial que solo se añade y nunca se edita, una herramienta que enseña el diagnóstico y un límite diario de conversaciones. Faltan:

- Las funciones `functions/api/chat.js`, `contacto.js`, `diagnostico.js` y `diagnosticos.js`.
- `package.json` y `wrangler.toml`.
- Probarlo con una clave de API.

## Vista previa en un solo archivo

```bash
python3 tools/build_preview.py /ruta/de/salida
```

Mete el CSS, el JS y las fuentes dentro del HTML.
