// POST /api/contacto  { sesion, contacto, canal, nombre?, informado, modo, guiado? }
// Se llama dos veces: al dar el WhatsApp (o el email) y al dar el nombre. Así, si se va antes de
// decir cómo se llama, el contacto ya está guardado.
// Con él va lo que contó en el chat: la ficha que preparó el agente (o la conversación, si se
// cortó antes) o, en el modo sin IA, sus respuestas.
// Base legal: lo pide la persona para recibir una maqueta, una demo o una propuesta (art. 6.1.b RGPD).

import { limpiarGuiado } from "../../lib/claude.js";
import { json, leerJSON, texto, sesionValida, clave, avisar } from "../../lib/util.js";

// El texto exacto que ve junto al campo (assets/app.js). Se guarda como prueba de que se le informó.
const AVISO = "Solo lo usamos para mandarte esto y hablar de ello.";
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

// Un número español de 9 cifras pasa a +34; si ya trae prefijo, se deja. Así Álvaro abre el chat con wa.me.
function normalizar(canal, valor) {
  if (canal === "email") return valor.toLowerCase();
  const cifras = valor.replace(/[^\d+]/g, "").replace(/^00/, "+");
  return /^[6789]\d{8}$/.test(cifras) ? `+34${cifras}` : cifras.startsWith("+") ? cifras : `+${cifras}`;
}

function contactoValido(canal, valor) {
  if (canal === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  const cifras = valor.replace(/[^\d+]/g, "");
  return /^\+?\d{9,15}$/.test(cifras);
}

export async function onRequestPost({ request, env }) {
  let datos;
  try {
    datos = await leerJSON(request);
  } catch {
    return json({ error: "peticion_no_valida" }, 400);
  }
  const sesion = datos?.sesion;
  const canal = datos?.canal === "email" ? "email" : "whatsapp";
  const contacto = texto(datos?.contacto, 120);
  const nombre = texto(datos?.nombre, 80);
  if (!sesionValida(sesion) || !contactoValido(canal, contacto)) return json({ error: "faltan_datos" }, 400);
  if (datos.informado !== true) return json({ error: "sin_aviso" }, 400);

  // Un solo registro por conversación: el segundo envío (el nombre) actualiza el primero.
  const puntero = `contacto-de:${sesion}`;
  const existente = await env.ARCILLA.get(puntero);
  const k = existente || clave("contacto", sesion);
  const previo = existente ? await env.ARCILLA.get(k, "json") : null;

  const chat = await env.ARCILLA.get(`chat:${sesion}`, "json");
  const ficha = chat?.ficha || null;
  const ahora = new Date().toISOString();
  const registro = {
    fecha: previo?.fecha || ahora,
    actualizado: ahora,
    nombre: nombre || previo?.nombre || "",
    contacto: normalizar(canal, contacto),
    canal,
    whatsapp: canal === "whatsapp" ? `https://wa.me/${normalizar(canal, contacto).slice(1)}` : "",
    informado: { fecha: previo?.informado?.fecha || ahora, texto: AVISO },
    modo: datos.modo === "ia" ? "ia" : "guiado",
    ficha,
    conversacion: chat && !ficha ? conversacion(chat.messages) : "",
    guiado: chat ? null : limpiarGuiado(datos.guiado),
  };
  await env.ARCILLA.put(k, JSON.stringify(registro), { expirationTtl: DOCE_MESES });
  if (!existente) {
    await env.ARCILLA.put(puntero, k, { expirationTtl: DOCE_MESES });
    const que = ficha?.problema || registro.guiado?.inicio || "";
    const negocio = ficha?.nombre_negocio || "";
    const paso = ficha?.siguiente_paso ? ` · ${ficha.siguiente_paso}` : "";
    await avisar(env, `Nuevo contacto en arcillastudio.com (${canal}): ${registro.contacto}${negocio ? ` · ${negocio}` : ""}${paso}${que ? ` · ${que.slice(0, 140)}` : ""}`);
  }

  return json({ ok: true });
}
