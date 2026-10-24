// Conversación del chat de diagnóstico con Claude.
// El historial vive en el servidor (KV) y solo se añade al final: nunca se edita,
// así los bloques de "thinking" que devuelve el modelo siguen siendo válidos.

import Anthropic from "@anthropic-ai/sdk";

const MODELO = "claude-opus-5-5";

// El mismo saludo que pinta assets/app.js.
export const SALUDO =
  "Hola. Soy el asistente de Arcilla Studio, una inteligencia artificial. Cuéntame qué negocio tienes y qué te quita el sueño. En dos minutos te digo cuánto te está costando y si podemos ayudarte.";

const SISTEMA = `Eres el asistente de diagnóstico de Arcilla Studio, una marca de ARVENTURES S.L. Arcilla Studio hace webs, asistentes de WhatsApp y herramientas a medida con IA para negocios pequeños y medianos: restaurantes, fincas de bodas, hoteles y hostales, clínicas, reformas, tiendas y similares.

Tu trabajo es tener una conversación corta (unas cuatro o cinco preguntas, una por mensaje) para entender el problema del negocio y estimar cuánto le cuesta al mes. Cuando tengas datos suficientes, llama a la herramienta mostrar_diagnostico: la web enseñará el resultado y un formulario para que le llamemos.

Lo que necesitas saber:
1. Qué tipo de negocio es.
2. El problema: dónde pierde clientes o tiempo (llamadas o WhatsApps sin contestar, una web que no trae clientes, horas en presupuestos, reservas o facturas, comisiones de portales, u otra cosa).
3. Cuánto pasa: veces por semana o por mes, u horas.
4. Cuánto vale: lo que deja de media un cliente, qué parte de las consultas acaba siendo cliente, o lo que vale una hora.
Si no saben un número, dales tres o cuatro rangos para elegir.

La cuenta tiene que ser conservadora y estar explicada con sus propios números, por ejemplo "10 consultas/semana × 4,3 semanas × 30 % que serían clientes × 500 €". Redondea. Si no hay forma razonable de calcularlo, pon 0 y di que lo vemos en la llamada.

Lo que podemos ofrecer. Propón una sola cosa concreta, contada en sus palabras y no en términos técnicos:
- Una web a medida, pensada para el móvil, con reservas o petición de presupuesto.
- Un asistente de WhatsApp con IA que contesta al momento, filtra las consultas y le pasa un resumen al dueño.
- Si no pueden coger el teléfono: un WhatsApp automático a quien llamó, para atenderle por ahí.
- Herramientas a medida para tareas repetitivas: presupuestos, recordatorios de citas, pedir reseñas, facturas.
Si la tecnología no le va a ayudar, díselo.

Cómo hablas: de tú, en castellano de España (o en el idioma en que te escriban), con frases cortas, cercano y directo, sin jerga técnica. Una pregunta por mensaje. Sin listas largas, sin superlativos, sin promesas de resultados y sin emojis.

Límites:
- No des precios. Di que el diagnóstico es gratis y que el precio se cierra por escrito en la llamada, antes de empezar.
- No pidas datos de contacto en el chat: el formulario aparece junto al diagnóstico. Si los escriben, pídeles que usen el formulario.
- No pidas datos de salud, bancarios ni de otras personas.
- Solo hablas de su negocio y de cómo podemos ayudarle. Si te piden otra cosa (deberes, programar, temas generales), di con amabilidad que aquí solo puedes ayudar con el diagnóstico.
- Eres una IA. Si te lo preguntan, dilo, y nunca digas que eres una persona.

El usuario ya ha visto este saludo en la pantalla: "${SALUDO}"`;

const HERRAMIENTA = {
  name: "mostrar_diagnostico",
  description:
    "Enseña al usuario su diagnóstico con el coste estimado y un formulario de contacto. Llámala cuando sepas el tipo de negocio y el problema, y tengas una estimación o sepas que no se puede estimar. Antes, escribe una frase corta que presente el resultado.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      sector: { type: "string", description: "Tipo de negocio, en pocas palabras." },
      problema: { type: "string", description: "El problema principal, con las palabras del usuario. Máximo 140 caracteres." },
      coste_mensual_eur: { type: "integer", description: "Coste mensual estimado en euros, conservador y redondeado. 0 si no se puede estimar." },
      calculo: { type: "string", description: "La cuenta en una línea con los números del usuario. Vacío si el coste es 0." },
      propuesta: { type: "string", description: "Lo que haríamos, en una o dos frases sencillas." },
      producto: { type: "string", enum: ["web", "asistente", "llamadas", "herramienta", "otro"] },
    },
    required: ["sector", "problema", "coste_mensual_eur", "calculo", "propuesta", "producto"],
    additionalProperties: false,
  },
};

const PRODUCTOS = new Set(HERRAMIENTA.input_schema.properties.producto.enum);

function recortar(valor, max) {
  return String(valor ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function limpiarDiagnostico(d) {
  if (!d || typeof d !== "object") return null;
  const coste = Math.max(0, Math.min(10_000_000, Math.round(Number(d.coste_mensual_eur) || 0)));
  return {
    sector: recortar(d.sector, 80),
    problema: recortar(d.problema, 200),
    coste_mensual_eur: coste,
    calculo: recortar(d.calculo, 240),
    propuesta: recortar(d.propuesta, 300),
    producto: PRODUCTOS.has(d.producto) ? d.producto : "otro",
  };
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

// estado: { messages, turnos, pendiente } guardado en KV entre peticiones.
// Devuelve { respuesta, diagnostico } y modifica estado (solo añadiendo).
export async function conversar(apiKey, estado, mensaje) {
  const client = new Anthropic({ apiKey, maxRetries: 1 });

  const contenido = estado.pendiente
    ? [
        { type: "tool_result", tool_use_id: estado.pendiente, content: "Diagnóstico mostrado al usuario." },
        { type: "text", text: mensaje },
      ]
    : mensaje;
  const historial = [...estado.messages, { role: "user", content: contenido }];

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
    return {
      respuesta: "Eso mejor lo vemos con una persona. Escríbenos a hola@arcillastudio.com y te contestamos.",
      diagnostico: null,
    };
  }

  historial.push({ role: "assistant", content: respuesta.content });
  estado.messages = historial;
  estado.turnos = (estado.turnos || 0) + 1;
  estado.pendiente = null;

  const texto = respuesta.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  let diagnostico = null;
  const llamada = respuesta.content.find((b) => b.type === "tool_use" && b.name === HERRAMIENTA.name);
  if (llamada) {
    diagnostico = limpiarDiagnostico(llamada.input);
    estado.pendiente = llamada.id;
  }

  return {
    respuesta: texto || (diagnostico ? "Hecha la cuenta. Esto es lo que te puede estar costando:" : "Perdona, no te he entendido. ¿Me lo cuentas en una frase?"),
    diagnostico,
  };
}

export { Anthropic };
