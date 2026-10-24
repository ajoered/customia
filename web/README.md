# Web de Arcilla Studio

**Vista previa:** <https://claude.ai/artifact/HaPSZBrNX92puycKVxQP4s>. Es privada, solo la ves tú. Ahí el chat funciona en modo de preguntas guiadas, porque no hay servidor detrás.

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

## Diseño

- **Colores:** los de la cerámica española (esmalte blanco, azul cobalto y barro crudo), con versión oscura.
- **Tipos:**
  - Corben para los títulos (redondeada y blanda, como modelada).
  - Atkinson Hyperlegible para el texto (pensada para leerse muy bien, también para quien ve peor).
  - Spline Sans Mono para las cifras.
- **Hilo de la página:**
  1. La portada es el chat.
  2. La banda "El software era un ladrillo. Ahora es arcilla." tiene una animación en la que un ladrillo hueco se convierte en una pieza de barro.
  3. Fugas de dinero, con datos de nuestro propio estudio.
  4. Qué hacemos.
  5. Cómo trabajamos: amasamos, modelamos, cocemos y cuidamos.
  6. Para quién.
  7. Quién está detrás.
  8. Preguntas.
  9. Cierre.

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
