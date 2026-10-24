// Utilidades compartidas por las funciones de /api.

export function json(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function leerJSON(request, maxBytes = 8000) {
  const texto = await request.text();
  if (texto.length > maxBytes) throw new Error("demasiado_grande");
  return JSON.parse(texto);
}

export function texto(valor, max) {
  return String(valor ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function sesionValida(id) {
  return typeof id === "string" && /^[A-Za-z0-9-]{8,64}$/.test(id);
}

export function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export function clave(prefijo, sesion) {
  // Orden cronológico al listar en KV.
  return `${prefijo}:${new Date().toISOString()}:${sesion}`;
}

// Cuenta conversaciones nuevas por día para poner un techo al gasto en la API.
// KV no es atómico, así que es un límite aproximado, suficiente para esto.
export async function dentroDelCupo(env) {
  const max = Number(env.CUPO_DIARIO || 300);
  const k = `cupo:${hoy()}`;
  const usados = Number((await env.ARCILLA.get(k)) || 0);
  if (usados >= max) return false;
  await env.ARCILLA.put(k, String(usados + 1), { expirationTtl: 60 * 60 * 48 });
  return true;
}

export async function avisar(env, mensaje) {
  if (!env.AVISO_WEBHOOK) return;
  try {
    await fetch(env.AVISO_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: mensaje, content: mensaje }),
    });
  } catch {
    // El aviso es opcional: si falla, el contacto ya está guardado.
  }
}
