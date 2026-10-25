# Páginas de producto y de sector (plan, sin crear todavía)

La portada explica qué hacemos a quien llega sin contexto. Las páginas de producto y de sector son las que se usan para vender: el QR de la tarjeta, el enlace que se manda por WhatsApp después de una visita, un anuncio. Cada una habla de un solo producto y, si es de sector, con el vocabulario y los ejemplos de ese sector.

## Estructura

| Página | Dirección | Para qué |
|---|---|---|
| Portada | `/` | Qué hacemos, para quien llega sin contexto |
| Nosotros | `/nosotros` | La idea de la marca, el torno y la historia |
| Webs | `/webs` | El producto web |
| Agentes de WhatsApp | `/agentes-whatsapp` | El producto agente |
| Software a medida | `/software-a-medida` | Más adelante |
| Sector | `/agentes-whatsapp/restaurantes`, `/agentes-whatsapp/reformas`, `/webs/fincas-de-bodas`… | Lo que se enseña en la puerta |

Cada tarjeta de "¿Con qué te ayudamos?" de la portada enlazará a su página ("Ver cómo funciona") sin quitar el botón que abre el chat.

## La plantilla (igual para producto y sector)

1. **Titular por resultado**, con palabras del sector: "Ninguna consulta de grupos sin contestar. Ni a las once de la noche."
2. **El chat del agente**, ya sabiendo de qué producto y sector viene la persona (un parámetro en `/api/chat`), así se salta una pregunta.
3. **La demo**: en las de WhatsApp, un chat que se puede probar desde el móvil con un agente de ejemplo del sector. En las de webs, el antes y el después de una web real.
4. **Qué incluye, plazo y precio**, sin letra pequeña.
5. **Cómo funciona**, los mismos tres pasos de la portada.
6. **Preguntas del sector**: las objeciones que salgan en las visitas ("ya tengo CoverManager", "que conteste una máquina da mal rollo").
7. **Cierre** con el chat y el WhatsApp del estudio.

## Qué cambia en una página de sector

- El titular, los ejemplos, la demo y las preguntas.
- El agente de la demo: menús y salones para restaurantes; visitas y presupuestos para reformas.
- Nada más: el diseño, el precio y los pasos son los de la página del producto.

## Orden

1. `/agentes-whatsapp/restaurantes`: la que va en el QR de las visitas, si se confirma el nicho.
2. `/agentes-whatsapp` y `/webs`, generales.
3. Más sectores cuando haya visitas o clientes en ellos (reformas, fincas de bodas, clínicas).

## Medir

- Un QR distinto por canal (`?d=puerta`, `?d=tarjeta`) para saber de dónde viene cada conversación, sin cookies.
- Por página: visitas, conversaciones empezadas, resúmenes confirmados y contactos dejados.
