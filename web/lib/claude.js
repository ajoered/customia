// La conversación del chat de la portada con Claude: un discovery corto con el dueño del negocio.
// El historial vive en el servidor (KV) y solo se añade al final: nunca se edita,
// así los bloques de "thinking" que devuelve el modelo siguen siendo válidos.

import Anthropic from "@anthropic-ai/sdk";

const MODELO = "claude-opus-5-5";

// El mismo saludo que pinta assets/app.js.
export const SALUDO = "Hola, soy el agente de Arcilla Studio, una IA. Cuéntame qué te pasa y en un par de minutos vemos cómo ayudarte.";

const SISTEMA = `Eres el agente de Arcilla Studio, una marca de ARVENTURES S.L., y hablas en el chat de su web. Arcilla Studio hace webs, agentes de WhatsApp con IA y herramientas a medida para negocios pequeños: restaurantes, fincas de bodas, hoteles y hostales, clínicas, despachos, reformas, tiendas y similares. Al otro lado suele estar el dueño, con poco tiempo.

Tu trabajo es una conversación de dos o tres minutos (nunca más de cinco) para entender bien qué le pasa y qué necesita. Dos objetivos a la vez: que se sienta escuchado y entendido, y que Álvaro, que lleva el estudio, pueda prepararle una propuesta o una maqueta sin tener que volver a preguntarle lo básico. No es un formulario ni una venta.

Lo que necesitamos saber, por orden de importancia. No preguntes lo que ya te haya contado:
1. Su negocio: cómo se llama, qué es y quién atiende (él solo, un equipo). Si tiene web, Instagram o ficha de Google, el enlace o el nombre: con eso le preparamos la maqueta o la demo, así que pídeselo si no lo ha dado.
2. El problema en concreto: qué pasa, cuándo y, mejor que nada, la última vez que pasó. Un ejemplo real vale más que una descripción general.
3. Cómo lo hace hoy: qué usa (WhatsApp normal o Business, el teléfono, un programa de reservas, Excel, papel). Así sabemos con qué hay que conectarlo.
4. Qué sería tenerlo resuelto: qué cambiaría en su día si esto funcionara solo.
5. Solo si sale natural, el tamaño: cuántas veces pasa o cuánto le cuesta. Es una parte pequeña: como mucho una pregunta, y si no lo sabe, sigue.
6. Si sale natural, la urgencia: una temporada, una apertura, una fecha.

Cómo consigues que se sienta entendido:
- Antes de preguntar, devuelve en media frase lo que te acaba de contar, con sus palabras y en concreto: "A la hora de las cenas suena el teléfono y tú estás en sala." Solo lo último que ha dicho, no todo lo anterior. Varía cómo empiezas: no abras siempre con "Ya", "Así que" ni con la misma muletilla, y si el eco no aporta nada, pregunta directamente. Nada de "entiendo tu frustración" ni de "¡qué buena pregunta!".
- En tu primera respuesta no repitas lo que ha elegido o escrito: demuestra en pocas palabras que sabes cómo es esa situación ("Pasa mucho cuando estás atendiendo") y pregunta.
- Una sola pregunta por mensaje, la más útil en ese momento. Primero abiertas, luego concretas.
- Pide ejemplos de verdad ("¿cuándo fue la última vez?") en vez de preguntas generales.
- Si aporta, comenta algo que demuestre que conoces su sector. Sin cifras inventadas.
- Usa su vocabulario: clientes, pacientes, novios, huéspedes.
- Si contesta poco o con prisa, pregunta menos y cierra antes.
- Si te pregunta algo (precio, plazos, cómo funciona), contesta corto y con verdad, y sigue.

Cómo escribes: de tú, en castellano de España (o en el idioma en que te escriban). Una o dos frases por mensaje, unas treinta palabras como mucho. Cercano, concreto y directo, como el resto de la web. Sin jerga técnica, sin listas, sin negritas, sin superlativos, sin emojis y sin prometer resultados.

Barra de avance: empieza cada mensaje con una etiqueta entre corchetes con el punto sobre el que preguntas: [negocio], [problema], [hoy], [resuelto] o [extra] (tamaño o urgencia). Cuando cierres, usa [cierre]. La web la quita y mueve con ella una barra de avance; la persona no la ve.

Cuándo cierras: cuando sepas al menos los puntos 1 a 3, o cuando la persona quiera terminar. Lo normal son cuatro o cinco preguntas; nunca más de seis. Para cerrar, escribe una frase corta y llama a la herramienta preparar_propuesta: la web le enseñará lo que hemos entendido, lo que haríamos y el siguiente paso, con un formulario para dejarnos su contacto. Si después sigue escribiendo, contesta corto y recuérdale el formulario.

Lo que podemos hacer. Propón una sola cosa, la que más le ayude, contada con sus palabras:
- Una web a medida, pensada para el móvil, con reservas o petición de presupuesto. Le preparamos una maqueta y se la enseñamos antes de que pague. Tarda de dos a tres semanas.
- Un agente de WhatsApp con IA que contesta al momento, a cualquier hora, pregunta lo necesario y le pasa un resumen. Tarda de una a dos semanas.
- Si no puede coger el teléfono: cuando no lo coge, un WhatsApp automático a quien llamó, que le atiende por ahí.
- Herramientas a medida para lo repetitivo: presupuestos, reservas, recordatorios de citas, pedir reseñas, facturas.
Si la tecnología no le va a ayudar, díselo.

Lo que puedes contar si te preguntan:
- Precio: depende de lo que haga falta. Le damos el precio cerrado y por escrito antes de empezar, con la cuota mensual incluida. No des cifras.
- Si no le gusta, no paga la parte principal: se lo enseñamos funcionando antes.
- El dominio y el email siguen siendo suyos. Nos encargamos de la migración.
- No hace falta saber de tecnología.

Límites:
- No pidas datos de contacto en el chat: el formulario aparece al final. Si los escribe, pídele que use el formulario.
- No pidas datos de salud, bancarios ni de otras personas.
- Solo hablas de su negocio y de cómo podemos ayudarle. Si te piden otra cosa (deberes, programar, temas generales), di con amabilidad que aquí solo puedes ayudar con eso.
- Eres una IA. Si te lo preguntan, dilo, y nunca digas que eres una persona.

El usuario ya ha visto este saludo en la pantalla: "${SALUDO}"`;

const vacio = 'Cadena vacía ("") si no lo sabes.';
const HERRAMIENTA = {
  name: "preparar_propuesta",
  description:
    "Cierra la conversación: enseña en pantalla lo que hemos entendido, lo que haríamos y el siguiente paso, con un formulario de contacto. El resto de campos son para el equipo. Llámala cuando sepas su negocio, el problema con algún ejemplo y cómo lo hace hoy, o cuando la persona quiera terminar. Antes escribe una frase corta.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      resumen: { type: "string", description: "Lo que hemos entendido, de tú y con sus palabras, en dos o tres frases cortas: 45 palabras como mucho. Lo verá en pantalla." },
      propuesta: { type: "string", description: "Lo que haríamos, en una o dos frases sencillas y sin tecnicismos: 35 palabras como mucho. Lo verá en pantalla." },
      siguiente_paso: {
        type: "string",
        enum: ["maqueta_web", "demo_whatsapp", "propuesta", "llamada"],
        description: "maqueta_web si lo principal es la web; demo_whatsapp si es un agente de WhatsApp o las llamadas perdidas (le enseñamos una demo con sus preguntas reales); propuesta para una herramienta a medida; llamada si aún no está claro.",
      },
      producto: { type: "string", enum: ["web", "agente_whatsapp", "llamadas", "herramienta", "otro"] },
      sector: { type: "string", description: "Tipo de negocio en dos o tres palabras, sin nombre ni ubicación (p. ej. \"restaurante\", \"clínica dental\")." },
      nombre_negocio: { type: "string", description: `Nombre del negocio. ${vacio}` },
      web_o_redes: { type: "string", description: `Su web, Instagram o ficha de Google, tal y como lo dio. ${vacio}` },
      quien_atiende: { type: "string", description: `Quién atiende o hace el trabajo. ${vacio}` },
      problema: { type: "string", description: "El problema principal, con sus palabras." },
      ejemplo: { type: "string", description: `Un caso concreto que haya contado. ${vacio}` },
      como_lo_hace_hoy: { type: "string", description: `Qué usa ahora. ${vacio}` },
      que_seria_resuelto: { type: "string", description: `Qué cambiaría si estuviera resuelto. ${vacio}` },
      volumen: { type: "string", description: `Cuántas veces pasa o cuánto le cuesta, con sus números. ${vacio}` },
      coste_mensual_eur: { type: "integer", description: "Coste mensual estimado en euros, conservador y redondeado. 0 si no hay datos para estimarlo." },
      calculo: { type: "string", description: `La cuenta en una línea con sus números, p. ej. "10 llamadas/semana × 4,3 × 30 % × 60 €". ${vacio}` },
      urgencia: { type: "string", description: `Fechas o prisas que haya mencionado. ${vacio}` },
      para_la_llamada: { type: "string", description: "Lo que falta por saber o conviene confirmar en la llamada." },
    },
    required: [
      "resumen", "propuesta", "siguiente_paso", "producto", "sector", "nombre_negocio", "web_o_redes", "quien_atiende",
      "problema", "ejemplo", "como_lo_hace_hoy", "que_seria_resuelto", "volumen", "coste_mensual_eur", "calculo", "urgencia", "para_la_llamada",
    ],
    additionalProperties: false,
  },
};

const PASOS = new Set(HERRAMIENTA.input_schema.properties.siguiente_paso.enum);
const PRODUCTOS = new Set(HERRAMIENTA.input_schema.properties.producto.enum);

function recortar(valor, max) {
  return String(valor ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

// Lo que el modelo pasa a preparar_propuesta, saneado. Es el resumen para el equipo.
export function limpiarFicha(f) {
  if (!f || typeof f !== "object") return null;
  const coste = Math.max(0, Math.min(10_000_000, Math.round(Number(f.coste_mensual_eur) || 0)));
  const ficha = { coste_mensual_eur: coste };
  for (const [campo, max] of [
    ["resumen", 600], ["propuesta", 500], ["sector", 80], ["nombre_negocio", 120], ["web_o_redes", 300], ["quien_atiende", 300],
    ["problema", 500], ["ejemplo", 600], ["como_lo_hace_hoy", 500], ["que_seria_resuelto", 500], ["volumen", 300],
    ["calculo", 240], ["urgencia", 300], ["para_la_llamada", 900],
  ]) ficha[campo] = recortar(f[campo], max);
  ficha.siguiente_paso = PASOS.has(f.siguiente_paso) ? f.siguiente_paso : "llamada";
  ficha.producto = PRODUCTOS.has(f.producto) ? f.producto : "otro";
  return ficha;
}

// Lo que se enseña en pantalla: sin los campos internos.
export function paraPantalla(ficha) {
  const { resumen, propuesta, siguiente_paso, producto, nombre_negocio, coste_mensual_eur, calculo } = ficha;
  return { resumen, propuesta, siguiente_paso, producto, nombre_negocio, coste_mensual_eur, calculo };
}

// Para las estadísticas: sin texto libre, así no identifica a nadie.
export function anonima(ficha) {
  const { sector, producto, siguiente_paso, coste_mensual_eur } = ficha;
  return { sector, producto, siguiente_paso, coste_mensual_eur };
}

// Las respuestas del modo guiado (assets/app.js), saneadas.
const PROBLEMAS = new Set(["telefono", "whatsapp", "web", "tareas", "otro"]);
export function limpiarGuiado(g) {
  if (!g || typeof g !== "object") return null;
  const r = { problema: PROBLEMAS.has(g.problema) ? g.problema : "otro" };
  for (const campo of ["inicio", "negocio", "detalle", "hoy", "resuelto"]) r[campo] = recortar(g[campo], 600);
  return r;
}

// La etiqueta con la que el modelo empieza cada mensaje: el tema de lo que pregunta. Mueve la barra
// de avance de la web y no se enseña.
const ETIQUETA = /^\s*\[(negocio|problema|hoy|resuelto|extra|cierre)\]\s*/i;
const ETIQUETAS = /\s*\[(?:negocio|problema|hoy|resuelto|extra|cierre)\]\s*/gi;
function separarEtiqueta(texto) {
  const m = ETIQUETA.exec(texto);
  return { paso: m ? m[1].toLowerCase() : null, texto: texto.replace(ETIQUETAS, " ").replace(/ {2,}/g, " ").trim() };
}

// A partir del quinto mensaje, el servidor le recuerda al modelo que vaya cerrando.
function recordatorio(numero) {
  if (numero >= 7) return "La persona lleva siete mensajes. Cierra ya: escribe una frase corta y llama a preparar_propuesta con lo que sepas.";
  if (numero >= 5) return `La persona lleva ${numero} mensajes. Si ya sabes lo esencial, cierra en este mensaje; si no, haz como mucho una pregunta más.`;
  return null;
}

function sinThinking(messages) {
  return messages.map((m) =>
    m.role === "assistant" && Array.isArray(m.content)
      ? { ...m, content: m.content.filter((b) => b.type !== "thinking" && b.type !== "redacted_thinking") }
      : m,
  );
}

function pedir(client, messages) {
  return client.beta.messages.create({
    model: MODELO,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    cache_control: { type: "ephemeral" }, // el historial crece turno a turno: se reaprovecha lo ya enviado
    system: SISTEMA,
    tools: [HERRAMIENTA],
    messages,
  });
}

// estado: { messages, turnos, pendiente, ficha } guardado en KV entre peticiones.
// Devuelve { respuesta, paso, ficha } (ficha solo al cerrar) y modifica estado (solo añadiendo).
export async function conversar(apiKey, estado, mensaje) {
  const client = new Anthropic({ apiKey, maxRetries: 1 });

  const contenido = estado.pendiente
    ? [
        { type: "tool_result", tool_use_id: estado.pendiente, content: "Propuesta y formulario a la vista." },
        { type: "text", text: mensaje },
      ]
    : mensaje;
  const historial = [...estado.messages, { role: "user", content: contenido }];
  const aviso = estado.ficha ? null : recordatorio((estado.turnos || 0) + 1);
  if (aviso) historial.push({ role: "system", content: aviso });

  let respuesta;
  try {
    respuesta = await pedir(client, historial);
  } catch (error) {
    // Un bloque de thinking que el API ya no acepta: lo quitamos una vez y reintentamos.
    const hayThinking = historial.some((m) => Array.isArray(m.content) && m.content.some((b) => b.type === "thinking"));
    if (error instanceof Anthropic.BadRequestError && hayThinking) {
      const limpio = sinThinking(historial);
      respuesta = await pedir(client, limpio);
      historial.splice(0, historial.length, ...limpio);
    } else {
      throw error;
    }
  }

  if (respuesta.stop_reason === "refusal") {
    // No guardamos este turno: el historial sigue siendo válido para el siguiente.
    return { respuesta: "Eso mejor lo vemos con una persona. Escríbenos a hola@arcillastudio.com y te contestamos.", ficha: null };
  }

  historial.push({ role: "assistant", content: respuesta.content });
  estado.messages = historial;
  estado.turnos = (estado.turnos || 0) + 1;
  estado.pendiente = null;

  const { paso, texto } = separarEtiqueta(
    respuesta.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n"),
  );

  let ficha = null;
  const llamada = respuesta.content.find((b) => b.type === "tool_use" && b.name === HERRAMIENTA.name);
  if (llamada) {
    ficha = limpiarFicha(llamada.input);
    estado.ficha = ficha;
    estado.pendiente = llamada.id;
  }

  return {
    respuesta: texto || (ficha ? "Con esto ya podemos preparar algo concreto para ti." : "Perdona, no te he entendido. ¿Me lo cuentas en una frase?"),
    paso: ficha ? "cierre" : paso,
    ficha,
  };
}

export { Anthropic };
