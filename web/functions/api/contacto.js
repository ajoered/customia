// POST /api/contacto  { sesion, nombre, contacto, negocio, consentimiento, modo, diagnostico }
// Guarda el contacto en KV solo si la persona ha marcado la casilla de consentimiento.

import { limpiarDiagnostico } from "../../lib/claude.js";
import { json, leerJSON, texto, sesionValida, clave, avisar } from "../../lib/util.js";

// El texto exacto de la casilla del formulario (assets/app.js). Se guarda como prueba del consentimiento.
const CONSENTIMIENTO = "Acepto que Arcilla Studio (ARVENTURES S.L.) me contacte sobre este diagnóstico.";
const DOCE_MESES = 60 * 60 * 24 * 365; // plazo de la política de privacidad

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
  if (!sesionValida(sesion) || !nombre || !contacto) return json({ error: "faltan_datos" }, 400);
  if (datos.consentimiento !== true) return json({ error: "sin_consentimiento" }, 400);

  const fecha = new Date().toISOString();
  const diagnostico = limpiarDiagnostico(datos.diagnostico);
  const registro = {
    fecha,
    nombre,
    contacto,
    negocio,
    consentimiento: { aceptado: true, fecha, texto: CONSENTIMIENTO },
    modo: datos.modo === "ia" ? "ia" : "guiado",
    diagnostico,
  };
  await env.ARCILLA.put(clave("contacto", sesion), JSON.stringify(registro), { expirationTtl: DOCE_MESES });

  const coste = diagnostico?.coste_mensual_eur ? ` · ${diagnostico.coste_mensual_eur.toLocaleString("es-ES")} €/mes` : "";
  await avisar(env, `Nuevo contacto en arcillastudio.com: ${nombre} (${contacto})${negocio ? ` · ${negocio}` : ""}${diagnostico?.sector ? ` · ${diagnostico.sector}` : ""}${coste}`);

  return json({ ok: true });
}
