// Chat de diagnóstico de Arcilla Studio.
//
// Dos modos:
//  - "ia": habla con /api/chat (Cloudflare Pages Function + Claude).
//  - "guiado": preguntas fijas con botones y la cuenta hecha en el navegador.
//    Se usa si la API no responde (vista previa, sin clave configurada, límite diario).
// Los dos acaban igual: un resultado con el coste estimado y un formulario de contacto.

(function () {
  "use strict";

  // Datos de contacto: cámbialos aquí y en las páginas legales.
  const CONFIG = {
    telefono: "[tu teléfono]",
    whatsapp: "", // solo dígitos con prefijo, p. ej. "34600000000"
    email: "[tu email]",
    api: "/api",
  };

  const $ = (sel) => document.querySelector(sel);
  const lista = $("#chat-mensajes");
  const ventana = $("#ventana");
  const SALUDO = "Hola. Soy el asistente de Arcilla Studio, una inteligencia artificial. Cuéntame qué negocio tienes y qué te quita el sueño. En dos minutos te digo cuánto te está costando y si podemos ayudarte.";
  let empezado = false;
  function empezar() {
    if (empezado) return;
    empezado = true;
    if (ventana) ventana.classList.add("activa");
    lista.hidden = false;
    burbuja(SALUDO, "bot");
  }
  const formulario = $("#chat-formulario");
  const entrada = $("#chat-entrada");
  const enviar = $("#chat-enviar");
  if (!lista || !formulario) return;

  document.querySelectorAll("[data-config]").forEach((el) => {
    const valor = CONFIG[el.dataset.config];
    if (valor) el.textContent = valor;
  });

  const sesion = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
  let modo = "ia";
  let ocupado = false;
  let terminado = false;
  let diagnostico = null;

  // ---------- Pintar mensajes ----------
  function burbuja(texto, quien) {
    const div = document.createElement("div");
    div.className = "msg " + (quien === "tu" ? "msg-tu" : "msg-bot");
    div.textContent = texto;
    lista.appendChild(div);
    bajar();
    return div;
  }
  function escribiendo() {
    const div = document.createElement("div");
    div.className = "msg msg-bot msg-escribiendo";
    div.setAttribute("aria-label", "Escribiendo");
    div.innerHTML = "<i></i><i></i><i></i>";
    lista.appendChild(div);
    bajar();
    return div;
  }
  function opciones(items, alElegir) {
    quitarOpciones();
    const caja = document.createElement("div");
    caja.className = "opciones";
    items.forEach((item) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "opcion";
      b.textContent = item.texto;
      b.addEventListener("click", () => {
        quitarOpciones();
        burbuja(item.texto, "tu");
        alElegir(item);
      });
      caja.appendChild(b);
    });
    lista.appendChild(caja);
    bajar();
  }
  function quitarOpciones() {
    lista.querySelectorAll(".opciones").forEach((n) => n.remove());
    const ini = document.getElementById("opciones-iniciales");
    if (ini) ini.remove();
  }
  function bajar() {
    lista.scrollTop = lista.scrollHeight;
  }
  const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
  const euros = (n) => Math.round(n).toLocaleString("es-ES") + " €";
  const redondear = (n) => Math.round(n / 10) * 10;

  // ---------- Modo guiado ----------
  const PROBLEMAS = {
    telefono: "No llego a coger el teléfono",
    whatsapp: "Contesto WhatsApps a todas horas",
    web: "Mi web no me trae clientes",
    tareas: "Pierdo horas con presupuestos o reservas",
    otro: "Otra cosa",
  };
  const PROPUESTAS = {
    telefono: "Un sistema que, cuando no puedes coger el teléfono, escribe al momento por WhatsApp a quien te llamó, le atiende y te pasa un resumen.",
    whatsapp: "Un asistente de WhatsApp que contesta al momento, pregunta lo necesario y te pasa solo las consultas buenas, con un resumen.",
    web: "Una web nueva, hecha para el móvil, con tus precios y un botón claro para reservar o pedir presupuesto. Te la enseñamos hecha antes de que pagues.",
    tareas: "Una herramienta a medida que haga esa tarea por ti y te deje solo revisar.",
    otro: "Esto mejor lo vemos en una llamada de 20 minutos.",
  };
  const guia = { problema: null, sector: null, cantidad: null, conversion: null, valor: null, tarifa: null, detalle: "" };
  let pasoTexto = null; // si espera texto libre, función que lo recibe

  function adivinarProblema(texto) {
    const t = texto.toLowerCase();
    if (/whats|mensaje/.test(t)) return "whatsapp";
    if (/tel[eé]fono|llamad|coger/.test(t)) return "telefono";
    if (/\bweb\b|p[aá]gina|google/.test(t)) return "web";
    if (/presupuest|reserva|factura|horas|tiempo|papeleo|excel/.test(t)) return "tareas";
    return "otro";
  }

  async function guiado(problema, textoLibre) {
    modo = "guiado";
    guia.problema = problema;
    if (textoLibre) guia.detalle = textoLibre;
    await decir("Vamos con tres preguntas rápidas. ¿Qué tipo de negocio tienes?");
    opciones([
      { texto: "Restaurante o eventos" }, { texto: "Finca para bodas" }, { texto: "Hotel u hostal" },
      { texto: "Clínica" }, { texto: "Despacho" }, { texto: "Reformas" }, { texto: "Tienda" }, { texto: "Otro" },
    ], (o) => { guia.sector = o.texto; preguntarCantidad(); });
    pasoTexto = (t) => { guia.sector = t; preguntarCantidad(); };
  }

  async function decir(texto) {
    const e = escribiendo();
    await pausa(500);
    e.remove();
    burbuja(texto, "bot");
  }

  async function preguntarCantidad() {
    const p = guia.problema;
    pasoTexto = null;
    if (p === "telefono" || p === "whatsapp") {
      await decir("Más o menos, ¿cuántas llamadas o mensajes se te quedan sin contestar a tiempo cada semana?");
      opciones([{ texto: "1 a 5", v: 3 }, { texto: "5 a 15", v: 10 }, { texto: "15 a 30", v: 22 }, { texto: "Más de 30", v: 40 }],
        (o) => { guia.cantidad = o; preguntarConversion(); });
    } else if (p === "web") {
      await decir("Con una web que funcionase de verdad, ¿cuántos clientes más al mes te parecería realista?");
      opciones([{ texto: "1 o 2", v: 1.5 }, { texto: "3 a 5", v: 4 }, { texto: "6 a 10", v: 8 }, { texto: "Más de 10", v: 12 }],
        (o) => { guia.cantidad = o; preguntarValor(); });
    } else if (p === "tareas") {
      await decir("¿Cuántas horas a la semana se te van en eso?");
      opciones([{ texto: "1 a 3", v: 2 }, { texto: "3 a 6", v: 4.5 }, { texto: "6 a 10", v: 8 }, { texto: "Más de 10", v: 12 }],
        (o) => { guia.cantidad = o; preguntarTarifa(); });
    } else {
      if (guia.detalle) return mostrarResultado();
      await decir("Cuéntamelo en una frase y lo vemos.");
      pasoTexto = (t) => { guia.detalle = t; mostrarResultado(); };
    }
  }
  async function preguntarConversion() {
    await decir("De cada 10 personas que te llaman o escriben, ¿cuántas acaban siendo clientes?");
    opciones([{ texto: "1 de cada 10", v: 0.1 }, { texto: "3 de cada 10", v: 0.3 }, { texto: "5 de cada 10", v: 0.5 }, { texto: "No lo sé", v: 0.2 }],
      (o) => { guia.conversion = o; preguntarValor(); });
  }
  async function preguntarValor() {
    await decir("¿Cuánto te deja de media un cliente?");
    opciones([{ texto: "Menos de 50 €", v: 30 }, { texto: "50 a 200 €", v: 120 }, { texto: "200 a 1.000 €", v: 500 },
      { texto: "1.000 a 5.000 €", v: 2500 }, { texto: "Más de 5.000 €", v: 8000 }],
      (o) => { guia.valor = o; mostrarResultado(); });
  }
  async function preguntarTarifa() {
    await decir("¿Cuánto vale una hora tuya, o de quien lo hace?");
    opciones([{ texto: "15 €", v: 15 }, { texto: "25 €", v: 25 }, { texto: "40 €", v: 40 }, { texto: "60 € o más", v: 70 }],
      (o) => { guia.tarifa = o; mostrarResultado(); });
  }

  function calcularGuiado() {
    const p = guia.problema;
    let coste = 0;
    let calculo = "";
    if (p === "telefono" || p === "whatsapp") {
      coste = guia.cantidad.v * 4.3 * guia.conversion.v * guia.valor.v;
      calculo = `${guia.cantidad.v} consultas/semana × 4,3 semanas × ${Math.round(guia.conversion.v * 100)} % que serían clientes × ${euros(guia.valor.v)}`;
    } else if (p === "web") {
      coste = guia.cantidad.v * guia.valor.v;
      calculo = `${guia.cantidad.v} clientes más al mes × ${euros(guia.valor.v)} (estimación tuya)`;
    } else if (p === "tareas") {
      coste = guia.cantidad.v * 4.3 * guia.tarifa.v;
      calculo = `${guia.cantidad.v} h/semana × 4,3 semanas × ${euros(guia.tarifa.v)}/hora`;
    }
    return {
      sector: guia.sector || "",
      problema: PROBLEMAS[p] + (guia.detalle ? `: ${guia.detalle}` : ""),
      coste_mensual_eur: redondear(coste),
      calculo,
      propuesta: PROPUESTAS[p],
    };
  }

  async function mostrarResultado(datos) {
    pasoTexto = null;
    terminado = true;
    diagnostico = datos || calcularGuiado();
    if (!datos) {
      await decir("Hecha la cuenta. Esto es lo que te puede estar costando:");
      enviarAnonimo(diagnostico);
    }
    pintarResultado(diagnostico);
  }

  // ---------- Resultado y contacto ----------
  function pintarResultado(d) {
    const caja = document.createElement("div");
    caja.className = "resultado";
    const tieneCifra = Number(d.coste_mensual_eur) > 0;
    caja.innerHTML = `
      <p class="etiqueta">Tu diagnóstico</p>
      ${tieneCifra ? `<p class="resultado-cifra">≈ ${euros(d.coste_mensual_eur)} <small>al mes</small></p>` : ""}
      ${d.calculo ? `<p class="resultado-calculo"></p>` : ""}
      ${tieneCifra ? `<p>Aunque solo recuperases la mitad, serían unos <strong>${euros(redondear(d.coste_mensual_eur / 2))} al mes</strong>.</p>` : ""}
      <p class="resultado-propuesta"><strong>Lo que haríamos:</strong> <span></span></p>
      <form class="contacto" novalidate>
        <label for="c-nombre">Tu nombre<input type="text" id="c-nombre" autocomplete="name" maxlength="80" required></label>
        <label for="c-contacto">Teléfono o email<input type="text" id="c-contacto" autocomplete="tel" maxlength="120" required></label>
        <label for="c-negocio">Nombre del negocio (opcional)<input type="text" id="c-negocio" maxlength="120"></label>
        <label class="consentimiento" for="c-permiso"><input type="checkbox" id="c-permiso" required>
          <span>Acepto que Arcilla Studio (AR Ventures, S.L.) me contacte sobre este diagnóstico. <a href="privacidad.html">Privacidad</a>.</span></label>
        <button class="boton" type="submit">Quiero que me llaméis</button>
        <p class="contacto-estado" role="status"></p>
      </form>
      <button class="enlace-boton" type="button" data-accion="reiniciar">Empezar de nuevo</button>`;
    if (d.calculo) caja.querySelector(".resultado-calculo").textContent = d.calculo;
    caja.querySelector(".resultado-propuesta span").textContent = d.propuesta || "";
    caja.querySelector("form").addEventListener("submit", (ev) => enviarContacto(ev, caja));
    caja.querySelector('[data-accion="reiniciar"]').addEventListener("click", () => window.location.reload());
    lista.appendChild(caja);
    bajar();
  }

  function resumenTexto(d, nombre, contacto, negocio) {
    return [
      "Hola, vengo del diagnóstico de arcillastudio.com.",
      `Nombre: ${nombre}`,
      negocio ? `Negocio: ${negocio}` : "",
      d.sector ? `Sector: ${d.sector}` : "",
      `Problema: ${d.problema}`,
      Number(d.coste_mensual_eur) > 0 ? `Coste estimado: ${euros(d.coste_mensual_eur)} al mes` : "",
      `Contacto: ${contacto}`,
    ].filter(Boolean).join("\n");
  }

  async function enviarContacto(ev, caja) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const estado = form.querySelector(".contacto-estado");
    const nombre = form.querySelector("#c-nombre").value.trim();
    const contacto = form.querySelector("#c-contacto").value.trim();
    const negocio = form.querySelector("#c-negocio").value.trim();
    const permiso = form.querySelector("#c-permiso").checked;
    if (!nombre || !contacto) { estado.textContent = "Pon tu nombre y un teléfono o email para poder llamarte."; return; }
    if (!permiso) { estado.textContent = "Marca la casilla para que podamos contactarte."; return; }
    const boton = form.querySelector("button[type=submit]");
    boton.disabled = true;
    estado.textContent = "Enviando…";
    try {
      const r = await fetch(`${CONFIG.api}/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesion, nombre, contacto, negocio, consentimiento: true, modo, diagnostico }),
      });
      if (!r.ok) throw new Error(String(r.status));
      form.innerHTML = "";
      const ok = document.createElement("p");
      ok.className = "aviso";
      ok.textContent = `Recibido, ${nombre}. Te contactamos en un día laborable.`;
      form.appendChild(ok);
    } catch (e) {
      boton.disabled = false;
      estado.textContent = "";
      const aviso = document.createElement("div");
      aviso.className = "aviso";
      const texto = resumenTexto(diagnostico, nombre, contacto, negocio);
      aviso.innerHTML = `<p>No hemos podido enviarlo desde aquí. Mándanos este resumen por WhatsApp o email (${CONFIG.telefono} · ${CONFIG.email}):</p><pre></pre>`;
      aviso.querySelector("pre").textContent = texto;
      const copiar = document.createElement("button");
      copiar.type = "button";
      copiar.className = "enlace-boton";
      copiar.textContent = "Copiar resumen";
      copiar.addEventListener("click", () => {
        navigator.clipboard.writeText(texto).then(() => { copiar.textContent = "Copiado"; })
          .catch(() => { const s = window.getSelection(); const rg = document.createRange(); rg.selectNodeContents(aviso.querySelector("pre")); s.removeAllRanges(); s.addRange(rg); });
      });
      aviso.appendChild(copiar);
      if (CONFIG.whatsapp) {
        const wa = document.createElement("a");
        wa.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
        wa.target = "_blank";
        wa.rel = "noopener";
        wa.textContent = " · Abrir WhatsApp";
        aviso.appendChild(wa);
      }
      form.appendChild(aviso);
    }
  }

  function enviarAnonimo(d) {
    // Solo datos del diagnóstico, sin nombre ni contacto: sirven para medir cuánto duele cada problema por sector.
    fetch(`${CONFIG.api}/diagnostico`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sesion, modo, diagnostico: d }),
    }).catch(() => {});
  }

  // ---------- Modo IA ----------
  async function hablarConIA(texto, clave) {
    ocupado = true;
    enviar.disabled = true;
    const e = escribiendo();
    try {
      const r = await fetch(`${CONFIG.api}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesion, mensaje: texto }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const datos = await r.json();
      e.remove();
      if (datos.respaldo) throw new Error("respaldo");
      if (datos.respuesta) burbuja(datos.respuesta, "bot");
      if (datos.diagnostico) mostrarResultado(datos.diagnostico);
    } catch (err) {
      e.remove();
      // Sin API (vista previa, límite o error): seguimos con las preguntas guiadas.
      if (modo === "ia" && !terminado) {
        await guiado(clave || adivinarProblema(texto), clave ? "" : texto);
      }
    } finally {
      ocupado = false;
      enviar.disabled = false;
    }
  }

  // ---------- Entradas ----------
  document.querySelectorAll("#opciones-iniciales .opcion").forEach((b) => {
    b.addEventListener("click", () => {
      if (ocupado) return;
      empezar();
      quitarOpciones();
      burbuja(b.textContent, "tu");
      const clave = b.dataset.valor;
      if (modo === "ia") hablarConIA(PROBLEMAS[clave], clave);
      else guiado(clave, "");
    });
  });

  formulario.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const texto = entrada.value.trim();
    if (!texto || ocupado) return;
    entrada.value = "";
    entrada.style.height = "";
    empezar();
    quitarOpciones();
    burbuja(texto, "tu");
    if (modo === "ia" && !terminado) return hablarConIA(texto);
    if (pasoTexto) return pasoTexto(texto);
    if (terminado) return decir("Si quieres afinar algo, déjanos tu contacto en el formulario de arriba y lo vemos en la llamada.");
    decir("Elige una de las opciones de arriba o escríbeme en una frase.");
  });

  entrada.addEventListener("input", () => {
    entrada.style.height = "auto";
    entrada.style.height = Math.min(entrada.scrollHeight, 140) + "px";
  });
  // El taller: enseña la maqueta del paso que está a la vista.
  const pasosTaller = Array.from(document.querySelectorAll(".paso-taller[data-maqueta]"));
  const maquetas = Array.from(document.querySelectorAll(".taller-escena .maqueta"));
  function tallerMedir() {
    if (!pasosTaller.length) return;
    const linea = window.innerHeight * (window.innerWidth <= 860 ? 0.7 : 0.5);
    let mejor = pasosTaller[0], d = Infinity;
    pasosTaller.forEach((p) => { const r = p.getBoundingClientRect(); const c = r.top + r.height / 2; const dd = Math.abs(c - linea); if (dd < d) { d = dd; mejor = p; } });
    maquetas.forEach((m) => m.classList.toggle("activa", m.dataset.maqueta === mejor.dataset.maqueta));
  }
  window.addEventListener("scroll", tallerMedir, { passive: true });
  window.addEventListener("resize", tallerMedir);
  tallerMedir();

  // Sombra en la cabecera al hacer scroll.
  const cab = document.getElementById("cabecera");
  if (cab) window.addEventListener("scroll", () => cab.classList.toggle("con-sombra", window.scrollY > 8), { passive: true });

  entrada.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      formulario.requestSubmit();
    }
  });
})();
