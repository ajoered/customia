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
- **Voz:** plural ("hacemos", "te enseñamos"): aunque el fundador sea la cara visible, hay equipo detrás. Su historia en "Quién está detrás" va en primera persona.
- **Hilo:** portada (titular + caja del asistente) → el torno (7 pantallas) → "Lo que podemos construir para tu negocio" (infografía: la web de ejemplo con foto, Unsplash, que hace scroll hasta la reserva; el WhatsApp que se escribe solo; el panel) → cómo lo hacemos → quién está detrás → preguntas → cierre. Paleta: rosa porcelana con azul petróleo.

## Datos que faltan

1. Datos del Registro Mercantil de ARVENTURES S.L. (tomo, folio, hoja) en `aviso-legal.html`. La LSSI los pide.
2. Email con el dominio (p. ej. hola@arcillastudio.com). Mientras tanto se usa el Gmail en `assets/app.js` (`CONFIG.email`), el pie, el cierre y las páginas legales.

Decisión: por ahora la web no muestra teléfono ni WhatsApp.

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
