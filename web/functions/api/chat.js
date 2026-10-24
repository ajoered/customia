// POST /api/chat  { sesion, mensaje } -> { respuesta, diagnostico } o { respaldo: true }
// "respaldo" hace que el navegador siga con las preguntas guiadas: sin clave,
// límite diario alcanzado, conversación demasiado larga o error de la API.

import { conversar } from "../../lib/claude.js";
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
    estado = { messages: [], turnos: 0, pendiente: null };
  }
  if (estado.turnos >= MAX_TURNOS) return json({ respaldo: true });

  try {
    const { respuesta, diagnostico } = await conversar(env.CLAUDE_ANTHROPIC_API_KEY, estado, mensaje);
    await env.ARCILLA.put(k, JSON.stringify(estado), { expirationTtl: UN_DIA });
    if (diagnostico) {
      // Copia sin datos personales, como la que manda el modo guiado a /api/diagnostico.
      await env.ARCILLA.put(clave("diagnostico", sesion), JSON.stringify({ fecha: new Date().toISOString(), modo: "ia", diagnostico }));
    }
    return json({ respuesta, diagnostico });
  } catch (error) {
    console.error("chat", error?.status, error?.name, error?.message);
    return json({ respaldo: true });
  }
}
