// POST /api/diagnostico  { sesion, modo, diagnostico }
// Resultado del modo guiado, sin nombre ni contacto. Sirve para ver qué problemas son más comunes por sector.

import { limpiarDiagnostico } from "../../lib/claude.js";
import { json, leerJSON, sesionValida, clave } from "../../lib/util.js";

export async function onRequestPost({ request, env }) {
  let datos;
  try {
    datos = await leerJSON(request);
  } catch {
    return json({ error: "peticion_no_valida" }, 400);
  }
  const diagnostico = limpiarDiagnostico(datos?.diagnostico);
  if (!sesionValida(datos?.sesion) || !diagnostico) return json({ error: "peticion_no_valida" }, 400);

  const registro = { fecha: new Date().toISOString(), modo: datos.modo === "ia" ? "ia" : "guiado", diagnostico };
  await env.ARCILLA.put(clave("diagnostico", datos.sesion), JSON.stringify(registro));
  return json({ ok: true });
}
