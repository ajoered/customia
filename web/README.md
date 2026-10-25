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
    assets/app.js      chat de la portada
    assets/fonts/      fuentes propias (sin Google Fonts, así no hay que pedir consentimiento)
    _headers           cabeceras de seguridad y caché para Cloudflare Pages
  functions/api/       el servidor (Pages Functions), ver abajo
  lib/                 código compartido del servidor: Claude (claude.js) y utilidades (util.js)
  package.json         @anthropic-ai/sdk 0.137.0 y wrangler
  wrangler.toml        configuración de Pages: carpeta public, KV ARCILLA, límite diario
```

## Diseño (v3)

**Línea de diseño:** `../estudio/10-linea-de-diseno.md` ("La mano y el torno"). Léela antes de decidir nada de diseño.

- **Idea:** un taller de cerámica. Una sola pieza de arcilla (`assets/torno.js`, canvas 2D) se moldea con el scroll: ladrillo → arcilla → tu web → tu WhatsApp → tu herramienta → vasija → horno (al rojo) → baño de esmalte cobalto que no llega al pie. Si el navegador prefiere menos movimiento, se muestra la forma fija de cada etapa.
- **Piezas de cerámica en vez de iconos planos** (estilo Airbnb). `assets/ceramica.js` pinta barro y esmalte con volumen: luz, canto, motas de chamota, anillos del torno, huecos, pincel y el baño de esmalte de la vasija (`Ceramica.vasija`), que no llega al pie y deja gotas. Lo usan:
  - el torno, en vivo;
  - `tools/piezas.html`, que dibuja los iconos (teléfono, burbuja, web, libreta y panel), el logotipo, la vasija del cierre, la de la 404 y la imagen para compartir.

  Para regenerarlas: `node tools/piezas.cjs` (escribe en `public/assets/piezas/`). Abre `tools/piezas.html` en el navegador para verlas todas.
- **Referencias:**
  - Ritmo de una idea por pantalla (Tribe AI).
  - Producto real en pantalla (Floema).
  - Contenido claro desde la primera pantalla (Estudio Telar).
  - Piezas con volumen (Airbnb).

  Ver `../estudio/07-benchmark-web.md`.
- **Colores:**
  - Porcelana de fondo y tinta.
  - El cobalto de la loza de Talavera como único acento, en la interfaz y en el esmalte de las piezas.
  - El barro, solo en las piezas (el pie sin esmaltar de la vasija).

  Lejos del crema con barro, que recordaba a la marca de Claude.
- **Tipos:**
  - Source Serif 4 para titulares: de Adobe, inspirada en las letras de Pierre-Simon Fournier, el impresor que en 1737 midió los tipos con el punto. Tiene tamaños ópticos, así que el titular grande y el texto pequeño se ven bien.
  - Schibsted Grotesk para el resto.

  Las dos son libres (licencia OFL, en `assets/fonts/`) y están alojadas en la propia web.
- **Sin muletillas de plantilla:**
  - Sin rótulos en mayúsculas encima de cada título.
  - Sin segunda línea en color ni flechas.
  - Botones como azulejos esmaltados.
- **En el móvil:**
  - **"Lo que podemos construir":** cada producto va debajo de su texto, sin marco de teléfono y con letra a tamaño real (el teléfono es el del visitante). La pantalla se queda fija un tramo y lo de dentro avanza con el scroll: la web baja hasta la reserva, el WhatsApp se escribe, y la reserva de Marta entra en el panel. Es la misma historia en las tres pantallas.
  - **El torno:** la pieza se queda arriba, el texto se lee en el hueco de debajo y se desvanece al pasar bajo ella.
  - Con "reducir movimiento" no hay tramos fijos y todo sale en su estado final.
- **Voz:** plural ("hacemos", "te enseñamos"): aunque el fundador sea la cara visible, hay equipo detrás. Su historia en "Quién está detrás" va en primera persona.
- **Hilo:**
  1. Portada: titular y caja del agente.
  2. El torno, en 7 pantallas.
  3. "Lo que podemos construir para tu negocio": la web de ejemplo, el WhatsApp y el panel.
  4. Cómo lo hacemos.
  5. Quién está detrás.
  6. Preguntas.
  7. Cierre en cobalto con la vasija bañada en blanco.
- **Detalles:**
  - Imagen para compartir (`piezas/compartir.jpg`) e icono para el iPhone.
  - Página 404 con la vasija rota.
  - Espacio que no se parte antes de "€" y cifras tabulares.
  - Color de selección propio.

## Datos que faltan

1. Datos del Registro Mercantil de ARVENTURES S.L. (tomo, folio, hoja) en `aviso-legal.html`. La LSSI los pide.

Email de contacto: hola@arcillastudio.com. Está en `assets/app.js` (`CONFIG.email`), el pie, el cierre, el JSON-LD de `index.html` y las páginas legales.

Decisión: por ahora la web no muestra teléfono ni WhatsApp.

La clave de Anthropic se llama `CLAUDE_ANTHROPIC_API_KEY` (no `ANTHROPIC_API_KEY`). Las funciones del servidor la leen con ese nombre. Nunca se imprime ni se escribe en el repo.

## El agente de la portada

Una conversación de dos o tres minutos para entender qué le pasa al negocio, no una calculadora. Solo la primera respuesta es un clic (las opciones de la portada); después se escribe.

- **Lo que pregunta**, por orden y sin repetir lo que ya le han contado: el negocio (y su web o Instagram, para la maqueta), el problema con un ejemplo real, cómo lo hacen hoy, qué sería tenerlo resuelto y, solo si sale, el tamaño y la urgencia.
- **Para que se sientan escuchados:** antes de cada pregunta repite en media frase lo último que le han dicho, con sus palabras; una pregunta por mensaje; mensajes de una o dos frases.
- **Cierre:** a partir del quinto mensaje el servidor le pide cerrar. Llama a `preparar_propuesta` y la web enseña lo que hemos entendido, lo que haríamos y el siguiente paso (maqueta de la web, demo del agente de WhatsApp, propuesta o llamada) con el formulario.
- **La ficha para Álvaro** (se guarda con el contacto): sector, nombre, web o redes, quién atiende, problema, ejemplo, cómo lo hacen hoy, qué sería resuelto, volumen, coste si salió, urgencia y qué falta por confirmar en la llamada.
- **Sin IA** (sin clave, límite diario o error): cuatro preguntas fijas que también se contestan escribiendo.

El texto del agente está en `lib/claude.js` (`SISTEMA`). Si lo cambias, pruébalo con varias conversaciones antes de publicar.

## El servidor

Son Pages Functions en `functions/api/`:

| Ruta | Qué hace |
|---|---|
| `POST /api/chat` | Habla con Claude (`lib/claude.js`). Guarda la conversación y la ficha para el equipo en KV 24 horas (`chat:<sesión>`), como promete la política de privacidad. Si no hay clave, se pasa el límite diario, la conversación pasa de 12 turnos o la API falla, contesta `{ respaldo: true }` y el navegador sigue con las preguntas fijas. |
| `POST /api/contacto` | Guarda el contacto solo si viene con `consentimiento: true`, con la fecha y el texto de la casilla como prueba. Con él guarda lo que contó: la ficha del agente (o la conversación, si se cortó antes) o las respuestas del modo sin IA. Se borra solo a los 12 meses. |
| `POST /api/diagnostico` | Guarda el cierre del modo sin IA sin texto libre ni datos personales (producto y siguiente paso). Los del modo IA los guarda `/api/chat`. |
| `GET /api/diagnosticos` | Lista contactos o diagnósticos. Solo existe si configuras `ADMIN_TOKEN` (ver abajo). |

Variables del proyecto en Cloudflare:

- `CLAUDE_ANTHROPIC_API_KEY` (secreto, en producción y en vista previa): la clave de Anthropic. Sin ella el chat hace cuatro preguntas fijas.
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

- **En el panel de Cloudflare:** Storage & databases → Workers KV → `arcilla-studio`. Busca las claves que empiezan por `contacto:` (llevan la fecha y la hora). Las estadísticas anónimas empiezan por `diagnostico:`. Ojo: la vista previa usa el mismo KV, así que las pruebas ahí también se guardan.
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
