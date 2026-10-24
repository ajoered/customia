# Web de Arcilla Studio

**En producción:** <https://arcillastudio.com> (Cloudflare Pages, proyecto `arcilla-studio`). `www` redirige a la raíz.

**Vista previa privada:** <https://claude.ai/artifact/HaPSZBrNX92puycKVxQP4s (v2)>. Solo la ves tú, y el chat va en modo guiado porque ahí no hay servidor.

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
    _headers           cabeceras de seguridad y caché para Cloudflare Pages
  functions/api/       el servidor (Pages Functions), ver abajo
  lib/                 código compartido del servidor: Claude (claude.js) y utilidades (util.js)
  package.json         @anthropic-ai/sdk 0.137.0 y wrangler
  wrangler.toml        configuración de Pages: carpeta public, KV ARCILLA, límite diario
```

## Diseño (v2)

- **Idea:** una sola pieza de arcilla (`assets/torno.js`, canvas 2D) que se moldea con el scroll: ladrillo → arcilla → tu web → tu WhatsApp → tu herramienta → horno → pieza esmaltada. Si el navegador prefiere menos movimiento, se muestra la forma fija de cada etapa.
- **Referencias:** ritmo de una idea por pantalla (Tribe AI), paleta cálida y sobria (Distyl), producto real en pantalla (Floema), contenido claro desde la primera pantalla (Estudio Telar). Ver `../estudio/07-benchmark-web.md`.
- **En el móvil:**
  - **"Lo que podemos construir":** cada producto va debajo de su texto, sin marco de teléfono y con letra a tamaño real (el teléfono es el del visitante). La pantalla se queda fija un tramo y lo de dentro avanza con el scroll: la web baja hasta la reserva, el WhatsApp se escribe, y la reserva de Marta entra en el panel. Es la misma historia en las tres pantallas.
  - **El torno:** la pieza se queda arriba, el texto se lee en el hueco de debajo y se desvanece al pasar bajo ella.
  - Con "reducir movimiento" no hay tramos fijos y todo sale en su estado final.
- **Colores:** papel cálido, tinta, barro para la arcilla, un solo acento cobalto (que es también el esmalte de la pieza cocida). Con versión oscura.
- **Tipos:** Fraunces (serifa de libro) para titulares, Atkinson Hyperlegible para el texto, Spline Sans Mono para cifras. Todas alojadas en la propia web.
- **Voz:** plural ("hacemos", "te enseñamos"): aunque el fundador sea la cara visible, hay equipo detrás. Su historia en "Quién está detrás" va en primera persona.
- **Hilo:** portada (titular + caja del asistente) → el torno (7 pantallas) → "Lo que podemos construir para tu negocio" (infografía: la web de ejemplo con foto, Unsplash, que hace scroll hasta la reserva; el WhatsApp que se escribe solo; el panel) → cómo lo hacemos → quién está detrás → preguntas → cierre. Paleta: rosa porcelana con azul petróleo.

## Datos que faltan

1. Datos del Registro Mercantil de ARVENTURES S.L. (tomo, folio, hoja) en `aviso-legal.html`. La LSSI los pide.

Email de contacto: hola@arcillastudio.com. Está en `assets/app.js` (`CONFIG.email`), el pie, el cierre, el JSON-LD de `index.html` y las páginas legales.

Decisión: por ahora la web no muestra teléfono ni WhatsApp.

La clave de Anthropic se llama `CLAUDE_ANTHROPIC_API_KEY` (no `ANTHROPIC_API_KEY`). Las funciones del servidor la leen con ese nombre. Nunca se imprime ni se escribe en el repo.

## El servidor

Son Pages Functions en `functions/api/`:

| Ruta | Qué hace |
|---|---|
| `POST /api/chat` | Habla con Claude (`lib/claude.js`). Guarda la conversación en KV 24 horas (`chat:<sesión>`), como promete la política de privacidad. Si no hay clave, se pasa el límite diario, la conversación pasa de 12 turnos o la API falla, contesta `{ respaldo: true }` y el navegador sigue con las preguntas guiadas. |
| `POST /api/contacto` | Guarda el contacto solo si viene con `consentimiento: true`. Guarda también la fecha y el texto de la casilla como prueba. Se borra solo a los 12 meses. |
| `POST /api/diagnostico` | Guarda el resultado del modo guiado sin datos personales. Los del modo IA los guarda `/api/chat`. |
| `GET /api/diagnosticos` | Lista contactos o diagnósticos. Solo existe si configuras `ADMIN_TOKEN` (ver abajo). |

Variables del proyecto en Cloudflare:

- `CLAUDE_ANTHROPIC_API_KEY` (secreto): la clave de Anthropic. Sin ella el chat funciona en modo guiado.
- `CUPO_DIARIO` (en `wrangler.toml`, 300): conversaciones nuevas con IA al día.
- `ADMIN_TOKEN` (secreto, opcional): activa `/api/diagnosticos`.
- `AVISO_WEBHOOK` (opcional): URL de Slack o Discord que recibe un aviso con cada contacto nuevo.

Para subir un secreto sin que se vea en pantalla:

```bash
cd web
printf '%s' "$CLAUDE_ANTHROPIC_API_KEY" | npx wrangler pages secret put CLAUDE_ANTHROPIC_API_KEY --project-name arcilla-studio
```

Los secretos se aplican en el siguiente despliegue.

## Desplegar

Necesitas `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en el entorno.

```bash
cd web
npm install
npm run deploy      # = wrangler pages deploy --branch main (producción)
```

Para probar en local: `npm run dev` (abre http://localhost:8788, con un KV de prueba). Los secretos locales van en `web/.dev.vars`, que no se sube al repo.

## Dónde se ven los contactos

- **En el panel de Cloudflare:** Storage & databases → Workers KV → `arcilla-studio`. Busca las claves que empiezan por `contacto:` (llevan la fecha y la hora). Los diagnósticos anónimos empiezan por `diagnostico:`.
- **Desde la terminal:**
  ```bash
  cd web
  npx wrangler kv key list --namespace-id ef384a86a63e4c75be0cb4f9b8e7839f --remote --prefix contacto:
  npx wrangler kv key get "<clave>" --namespace-id ef384a86a63e4c75be0cb4f9b8e7839f --remote --text
  ```
- **Por la web**, si configuras `ADMIN_TOKEN`:
  ```bash
  curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://arcillastudio.com/api/diagnosticos?tipo=contacto"
  ```

## Lo que hay montado en Cloudflare

- **Pages:** proyecto `arcilla-studio`, rama de producción `main`, dominio `arcillastudio.com`.
- **KV:** `arcilla-studio`, en el binding `ARCILLA`.
- **DNS:**
  - `arcillastudio.com` y `www` apuntan con CNAME a `arcilla-studio.pages.dev`, con proxy.
  - Una regla de redirección (Rules → Redirect Rules) manda `www` a la raíz con un 301.
- **Email Routing:** `hola@arcillastudio.com` reenvía a arojaspen@gmail.com. Solo recibe: para escribir desde hola@ hace falta un servidor de envío (SMTP).
- **Web Analytics:** desactivado. La política de privacidad dice que no hay herramientas de seguimiento, y la CSP bloquearía el script.
- **Caché:**
  - Browser Cache TTL en "Respect Existing Headers".
  - `_headers` pide revalidar `/assets/*`, porque los archivos no llevan versión en el nombre. Así cada despliegue se ve al momento.

## Vista previa en un solo archivo

```bash
python3 tools/build_preview.py /ruta/de/salida
```

Mete el CSS, el JS y las fuentes dentro del HTML.
