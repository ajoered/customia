// POST /api/diagnostico  { sesion, modo, anonima: { producto, siguiente_paso } }
// Cierre del modo guiado, sin texto libre ni contacto. Sirve para ver qué problemas son más comunes.

import { limpiarFicha, anonima } from "../../lib/claude.js";
import { json, leerJSON, sesionValida, clave } from "../../lib/util.js";

export async function onRequestPost({ request, env }) {
  let datos;
  try {
    datos = await leerJSON(request);
  } catch {
    return json({ error: "peticion_no_valida" }, 400);
  }
  if (!sesionValida(datos?.sesion) || !datos?.anonima) return json({ error: "peticion_no_valida" }, 400);
  const { producto, siguiente_paso } = anonima(limpiarFicha(datos.anonima));

  const registro = { fecha: new Date().toISOString(), modo: datos.modo === "ia" ? "ia" : "guiado", producto, siguiente_paso };
  await env.ARCILLA.put(clave("diagnostico", datos.sesion), JSON.stringify(registro));
  return json({ ok: true });
}
