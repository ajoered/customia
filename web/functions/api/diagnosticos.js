// GET /api/diagnosticos?tipo=contacto|diagnostico&limite=100
// Lista lo guardado, lo más reciente primero. Solo con la cabecera
// "Authorization: Bearer <ADMIN_TOKEN>". Sin ADMIN_TOKEN configurado, no existe.

import { json } from "../../lib/util.js";

const TIPOS = new Set(["contacto", "diagnostico"]);

async function autorizado(request, token) {
  const recibido = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const codificar = (s) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  const [a, b] = await Promise.all([codificar(recibido), codificar(token)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

export async function onRequestGet({ request, env }) {
  if (!env.ADMIN_TOKEN) return json({ error: "no_encontrado" }, 404);
  if (!(await autorizado(request, env.ADMIN_TOKEN))) return json({ error: "no_autorizado" }, 401);

  const url = new URL(request.url);
  const tipo = TIPOS.has(url.searchParams.get("tipo")) ? url.searchParams.get("tipo") : "contacto";
  const limite = Math.max(1, Math.min(1000, Number(url.searchParams.get("limite")) || 100));

  // KV lista en orden alfabético, y las claves llevan la fecha: hay que leerlas todas para dar las últimas.
  const claves = [];
  let cursor;
  do {
    const pagina = await env.ARCILLA.list({ prefix: `${tipo}:`, cursor });
    claves.push(...pagina.keys.map((k) => k.name));
    cursor = pagina.list_complete ? null : pagina.cursor;
  } while (cursor);

  const ultimas = claves.sort().reverse().slice(0, limite);
  const registros = await Promise.all(ultimas.map((k) => env.ARCILLA.get(k, "json")));
  return json({ tipo, total: claves.length, registros: registros.filter(Boolean) });
}
