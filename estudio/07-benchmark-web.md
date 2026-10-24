# Benchmark: webs espectaculares que además venden

Fecha: 24/10/2026. Revisé 30 webs: los Site of the Month y Site of the Year de Awwwards de 2025 y 2026, estudios de referencia (Lusion, Active Theory, Immersive Garden, Locomotive, Unseen, Basement, Bürocratik, Daybreak, Rejouice) y webs de producto con chat como portada (Perplexity, Cursor, Vercel, Linear). Capturas con scroll en `img/bench-*.jpg`.

## El filtro: lo que te gusta y lo que no

| Te gustan | No te gustan |
|---|---|
| **Tribe AI:** fondo claro, serifa, una sola frase por pantalla, un dibujo generativo que evoluciona con el scroll | **Fractional AI:** degradado oscuro "tech", logos, todo a la vez |
| **Distyl:** blanco roto cálido, serifa, dibujos isométricos que se montan al hacer scroll, cifras sobrias | **AE Studio:** sans gorda, naranja, cada bloque grita |

Lo común en lo que te gusta: **calma, aire, una idea por pantalla, un solo objeto visual que cuenta la historia y tipografía con serifa.** Lo común en lo que no: ruido, varios acentos, estética "startup de IA".

## Descartadas, y por qué

- **Las 3D pesadas** (Lusion, Active Theory, Igloo, Immersive Garden, Oryzo, Montfort, Why Zero): espectaculares, pero tardan 5–10 s en cargar, varias ni cargan en un navegador normal, y exigen un ordenador potente. Un dueño de restaurante las abre en el móvil con 3 barras de cobertura. Además son escaparates de estudio: no explican qué venden.
- **Las de agencia gritona** (Basement, Lama Lama, Bürocratik): el estilo de AE Studio, que no te gusta.
- **Son Daven, ERA Residence:** lujo inmobiliario, muy bonitas, pero su lenguaje (fotografía de arquitectura, tipografía de marca de perfume) no es el nuestro.

## Las tres que propongo copiar

### 1. Tribe AI (tribe.ai): la estructura narrativa
- Un párrafo por pantalla, en serifa grande, centrado, con **una** palabra de color.
- Un único dibujo generativo (líneas y puntos) que se transforma a medida que bajas: es el hilo visual.
- El botón "Start a conversation" aparece solo cuando toca.
- **Lo que copiamos:** el ritmo (una idea por pantalla) y el objeto único que evoluciona con el scroll.

### 2. Distyl (distyl.ai): la paleta y la sobriedad
- Blanco roto cálido, serifa de libro, dibujos de línea isométricos que "se construyen" al hacer scroll.
- Cifras en tiles sobrios ("150M+ end users", "Trusted by Fortune 500s", "Measurable outcomes in weeks").
- **Lo que copiamos:** la temperatura de color, el dibujo de línea que se monta, las cifras sin alarde.

### 3. Floema (floema.com, Site of the Month de mayo de 2026): el producto real
- Titular corto sobre fotografías reales del producto, cada sección con una foto grande y una frase.
- **Lo que copiamos:** enseñar el producto de verdad (pantallas reales de una web, un WhatsApp de verdad) y no ilustraciones. La investigación de estructura dice lo mismo: "no me enseñes dibujitos, enséñame el producto".

**Mención: Perplexity.** Su portada es una caja de texto gigante y nada más. Es el modelo para "el asistente como ventana donde empiezan a hablar".

## La dirección que propongo para Arcilla

**Una sola idea visual: un trozo de arcilla que se va moldeando mientras bajas.** Es el torno del alfarero: en la primera pantalla es un ladrillo; al hacer scroll se ablanda, toma forma y acaba convertido en lo que vendemos (una web en un móvil, una conversación de WhatsApp, un panel). Hecho en canvas 2D o 3D ligero (Three.js) con un solo objeto, así carga rápido en el móvil y, si el navegador no puede, se ve una imagen fija.

**Estructura de pantallas (estilo Tribe):**

| Pantalla | Texto (una idea) | La arcilla |
|---|---|---|
| 1 | "Más clientes. Menos teléfono." + la ventana del asistente, grande y centrada (estilo Perplexity) | Un bloque quieto, ladrillo |
| 2 | "El software era un ladrillo. Te adaptabas tú a él." | Empieza a girar |
| 3 | "Ahora es arcilla. Toma la forma de tu negocio." | Se ablanda y se moldea |
| 4 | "Una web que te trae clientes." + pantalla real | Toma la forma de un móvil con una web |
| 5 | "Un WhatsApp que contesta solo." + conversación real | Toma la forma de una burbuja de chat |
| 6 | "Y lo que a tu negocio le falte: reservas, presupuestos, un panel para tu equipo." | Toma la forma de un panel |
| 7 | Cómo trabajamos, en tres pasos: amasamos, modelamos, cocemos | Pasa por el horno: cambia de color (de barro a esmalte) |
| 8 | Quién está detrás, con foto | — |
| 9 | Preguntas y cierre con el asistente otra vez | La pieza terminada |

**Paleta:** la de Distyl llevada al barro: blanco roto cálido, tinta oscura, un solo acento (cobalto o el barro cocido), serifa de libro para los titulares y una sans legible para el texto. El azul cobalto actual queda como acento, no como banda.

**Riesgos:** la animación con el scroll hay que hacerla bien o parece una web de 2015 con parallax. Y la pantalla 1 tiene que decir qué hacemos aunque alguien no baje nunca: por eso el titular lleva debajo "Webs, asistentes de WhatsApp y herramientas a medida para negocios".

## Estudio Telar como referencia de contenido (no de diseño)

Lo que hace bien su home (estudiotelar.com), por orden:

1. **Portada:** titular de 5 palabras ("Software a medida que ya funciona"), subtítulo que enumera lo que hacen, dos botones (escribir / auditar) y, a la derecha, un carrusel con pestañas por producto que enseña cada cosa con una frase.
2. **"Lo que podemos construir para tu empresa":** tarjetas con ejemplos concretos y una pantalla real del producto.
3. **"Lo que hacemos, y lo cuidamos después":** acordeón de servicios con ejemplos reales desplegables, y una línea final sobre la continuidad mensual.
4. **"Pruébalo con tu caso":** una calculadora interactiva (horas que recuperas) sin registro.
5. **"Antes de construir, auditamos tu empresa":** su método, con el plazo (5 días) y el precio descontable.
6. **Preguntas frecuentes** (4 en la home, enlace a todas).
7. **Cierre:** "Cuéntanos qué hacéis a mano" con los dos botones otra vez.
8. **Pie:** servicios, páginas y datos de contacto completos.

**Lo que copiamos:** la claridad desde la primera pantalla (titular + enumeración + ejemplos a la derecha), las dos secciones "lo que podemos construir" y "lo que hacemos y cuidamos después", y el cierre con una frase en su idioma. **Lo que nos falta a los dos:** un "cómo lo hacemos" claro (ellos solo tienen la auditoría). **Lo que dejamos para más adelante:** la herramienta interactiva; nuestro chat de diagnóstico ya cumple esa función al principio.

**Diferencia de alcance:** ellos van a CRM, backoffice y apps. Nosotros, de momento, nos centramos en webs y asistentes de WhatsApp, y todo lo demás va junto como "software a medida".

## Estructura final (mezcla de Tribe/Distyl en diseño y Telar en contenido)

| # | Sección | Qué contiene | La arcilla |
|---|---|---|---|
| 1 | Portada | Titular corto, subtítulo que enumera las tres cosas, la ventana del asistente, teléfono. A un lado, pestañas Web / WhatsApp / A medida con un ejemplo real cada una | Ladrillo quieto |
| 2 | El giro | "El software era un ladrillo. Ahora es arcilla." Una frase por pantalla | Se ablanda |
| 3 | Lo que puedo construir para tu negocio | Web, asistente de WhatsApp, software a medida (reservas, presupuestos, panel, CRM), cada uno con una pantalla real y su resultado | Toma cada forma |
| 4 | Cómo lo hago | Amasar, modelar, cocer y cuidar, con plazos y qué necesito de ti | Pasa por el horno |
| 5 | Lo que hago y cuido después | La continuidad: mantenimiento, mejoras, informe mensual en euros | Pieza esmaltada |
| 6 | Prueba | Un caso con pantallas; reseñas de Google cuando las haya | — |
| 7 | Quién soy | Foto, Madrid, por qué, teléfono | — |
| 8 | Para quién no es | Una frase | — |
| 9 | Preguntas | Precio, propiedad, plazos, "no entiendo de tecnología", la IA avisa de que lo es | — |
| 10 | Cierre | "Cuéntame qué haces a mano" + asistente + teléfono | Pieza terminada |

Páginas aparte: una por servicio (web, WhatsApp, a medida), una por sector, "Sobre mí", legales. Más adelante: la herramienta interactiva.
