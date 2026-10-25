// POST /api/contacto  { sesion, nombre, contacto, negocio, web, consentimiento, modo, guiado }
// Guarda el contacto en KV solo si la persona ha marcado la casilla de consentimiento.
// Con él va lo que contó en el chat: la ficha que preparó el agente (o la conversación, si se
// cortó antes) o, en el modo guiado, sus respuestas.

import { limpiarGuiado } from "../../lib/claude.js";
import { json, leerJSON, texto, sesionValida, clave, avisar } from "../../lib/util.js";

// El texto exacto de la casilla del formulario (assets/app.js). Se guarda como prueba del consentimiento.
const CONSENTIMIENTO = "Acepto que Arcilla Studio (ARVENTURES S.L.) me contacte sobre lo que he contado en este chat.";
const DOCE_MESES = 60 * 60 * 24 * 365; // plazo de la política de privacidad

// La conversación en texto, sin herramientas ni avisos internos.
function conversacion(messages) {
  const lineas = [];
  for (const m of messages || []) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const partes = typeof m.content === "string" ? [m.content] : (m.content || []).filter((b) => b.type === "text").map((b) => b.text);
    const t = partes.join(" ").trim();
    if (t) lineas.push(`${m.role === "user" ? "Cliente" : "Agente"}: ${t}`);
  }
  return lineas.join("\n").slice(0, 8000);
}

export async function onRequestPost({ request, env }) {
  let datos;
  try {
    datos = await leerJSON(request);
  } catch {
    return json({ error: "peticion_no_valida" }, 400);
  }
  const sesion = datos?.sesion;
  const nombre = texto(datos?.nombre, 80);
  const contacto = texto(datos?.contacto, 120);
  const negocio = texto(datos?.negocio, 120);
  const web = texto(datos?.web, 200);
  if (!sesionValida(sesion) || !nombre || !contacto) return json({ error: "faltan_datos" }, 400);
  if (datos.consentimiento !== true) return json({ error: "sin_consentimiento" }, 400);

  const chat = await env.ARCILLA.get(`chat:${sesion}`, "json");
  const ficha = chat?.ficha || null;
  const fecha = new Date().toISOString();
  const registro = {
    fecha,
    nombre,
    contacto,
    negocio,
    web,
    consentimiento: { aceptado: true, fecha, texto: CONSENTIMIENTO },
    modo: datos.modo === "ia" ? "ia" : "guiado",
    ficha,
    conversacion: chat && !ficha ? conversacion(chat.messages) : "",
    guiado: chat ? null : limpiarGuiado(datos.guiado),
  };
  await env.ARCILLA.put(clave("contacto", sesion), JSON.stringify(registro), { expirationTtl: DOCE_MESES });

  const que = ficha?.problema || registro.guiado?.inicio || "";
  const paso = ficha?.siguiente_paso ? ` · ${ficha.siguiente_paso}` : "";
  await avisar(env, `Nuevo contacto en arcillastudio.com: ${nombre} (${contacto})${negocio ? ` · ${negocio}` : ""}${paso}${que ? ` · ${que.slice(0, 140)}` : ""}`);

  return json({ ok: true });
}
