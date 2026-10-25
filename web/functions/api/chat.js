// POST /api/chat  { sesion, mensaje, fase? } -> { respuesta, paso, cierre } o { respaldo: true }
// fase: lo que ha pasado en la web tras el resumen ("corrige" o "contacto").
// paso: el tema de lo que pregunta el agente, para la barra de avance.
// "respaldo" hace que el navegador siga con las preguntas fijas: sin clave,
// límite diario alcanzado, conversación demasiado larga o error de la API.
// La ficha completa para el equipo se queda en la conversación (KV, 24 horas) y
// /api/contacto la guarda con el contacto si la persona lo deja.

import { conversar, paraPantalla, anonima } from "../../lib/claude.js";
import { json, leerJSON, texto, sesionValida, dentroDelCupo, clave } from "../../lib/util.js";

const MAX_TURNOS = 12;
const UN_DIA = 60 * 60 * 24; // la política de privacidad promete borrar el chat a las 24 horas

export async function onRequestPost({ request, env }) {
  let datos;
  try {
    datos = await leerJSON(request);
  } catch {
    return json({ error: "peticion_no_valida" }, 400);
  }
  const sesion = datos?.sesion;
  const mensaje = texto(datos?.mensaje, 1000);
  if (!sesionValida(sesion) || !mensaje) return json({ error: "peticion_no_valida" }, 400);

  if (!env.CLAUDE_ANTHROPIC_API_KEY) return json({ respaldo: true });

  const k = `chat:${sesion}`;
  let estado = await env.ARCILLA.get(k, "json");
  if (!estado) {
    if (!(await dentroDelCupo(env))) return json({ respaldo: true });
    estado = { messages: [], turnos: 0, pendiente: null, ficha: null };
  }
  if (estado.turnos >= MAX_TURNOS) return json({ respaldo: true });

  try {
    const fase = ["corrige", "contacto"].includes(datos?.fase) ? datos.fase : null;
    const { respuesta, paso, ficha } = await conversar(env.CLAUDE_ANTHROPIC_API_KEY, estado, mensaje, fase);
    await env.ARCILLA.put(k, JSON.stringify(estado), { expirationTtl: UN_DIA });
    if (ficha) {
      // Para las estadísticas, sin texto libre ni datos personales.
      await env.ARCILLA.put(clave("diagnostico", sesion), JSON.stringify({ fecha: new Date().toISOString(), modo: "ia", ...anonima(ficha) }));
    }
    return json({ respuesta, paso, cierre: ficha ? paraPantalla(ficha) : null });
  } catch (error) {
    console.error("chat", error?.status, error?.name, error?.message);
    return json({ respaldo: true });
  }
}
