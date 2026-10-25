// Chat de la portada de Arcilla Studio.
//
// Dos modos:
//  - "ia": habla con /api/chat (Cloudflare Pages Function + Claude): una conversación de un par de
//    minutos para entender qué le pasa al negocio. Lo esencial: el negocio y un caso real.
//  - "guiado": si la API no responde (vista previa, sin clave, límite diario), dos preguntas fijas
//    que se contestan escribiendo.
// Solo la primera respuesta puede ser un clic (las opciones de la portada). Los dos modos acaban igual:
// lo que hemos entendido, lo que haríamos, el siguiente paso y un formulario de contacto.

(function () {
  "use strict";

  // Datos de contacto: cámbialos aquí y en las páginas legales.
  const CONFIG = {
    telefono: "", // vacío: la web no muestra teléfono
    whatsapp: "", // solo dígitos con prefijo, p. ej. "34600000000"
    email: "hola@arcillastudio.com",
    api: "/api",
  };

  const $ = (sel) => document.querySelector(sel);
  const lista = $("#chat-mensajes");
  const ventana = $("#ventana");
  const SALUDO = "Hola, soy el agente de Arcilla Studio, una IA. Cuéntame qué te pasa y en un par de minutos vemos cómo ayudarte.";
  let empezado = false;
  function empezar() {
    if (empezado) return;
    empezado = true;
    if (ventana) ventana.classList.add("activa");
    lista.hidden = false;
    entrada.placeholder = "Escribe tu respuesta";
    abrirFoco();
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
  let respuestasIA = 0; // cuántas veces ha contestado el agente
  let cierre = null; // lo que se enseña al final

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
  function quitarOpciones() {
    const ini = document.getElementById("opciones-iniciales");
    if (ini) ini.remove();
  }
  function bajar() {
    lista.scrollTop = lista.scrollHeight;
  }
  const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- Modo conversación ----------
  // Al empezar, la ventana ocupa toda la pantalla y se abre desde la caja. "Cerrar", Esc o el botón de
  // atrás del móvil la devuelven a su sitio, con la conversación dentro.
  const html = document.documentElement;
  const hueco = ventana.parentElement;
  const tactil = window.matchMedia("(pointer: coarse)").matches;
  const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let enFoco = false;
  let conHistoria = false;
  const recorte = (r) => `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.right)}px ${Math.max(0, innerHeight - r.bottom)}px ${Math.max(0, r.left)}px round 18px)`;
  function ajustarAlto() {
    if (!enFoco) return;
    // En el móvil, el teclado encoge lo visible: la caja se queda justo encima.
    const vv = window.visualViewport;
    html.style.setProperty("--alto-chat", (vv ? vv.height : innerHeight) + "px");
    ventana.style.top = vv ? vv.offsetTop + "px" : "";
    bajar();
  }
  function abrirFoco() {
    if (enFoco) return;
    const caja = formulario.getBoundingClientRect();
    hueco.style.minHeight = hueco.offsetHeight + "px"; // la página no se mueve por debajo
    enFoco = true;
    html.classList.add("chat-abierto");
    ventana.classList.add("foco");
    ajustarAlto();
    if (!sinMovimiento && ventana.animate) {
      ventana.animate([{ clipPath: recorte(caja) }, { clipPath: "inset(0px 0px 0px 0px round 0px)" }], { duration: 420, easing: "cubic-bezier(.2, .8, .2, 1)" });
    }
    history.pushState({ chat: true }, "");
    conHistoria = true;
    if (!tactil) entrada.focus();
  }
  function cerrarFoco(desdeHistoria) {
    if (!enFoco) return;
    enFoco = false;
    const terminar = () => {
      ventana.classList.remove("foco");
      ventana.style.top = "";
      html.classList.remove("chat-abierto");
      hueco.style.minHeight = "";
      lista.scrollTop = lista.scrollHeight;
    };
    if (!sinMovimiento && ventana.animate) {
      const destino = hueco.getBoundingClientRect();
      ventana.animate([{ clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: recorte(destino) }], { duration: 300, easing: "cubic-bezier(.4, 0, .2, 1)" }).onfinish = terminar;
    } else terminar();
    if (!desdeHistoria && conHistoria) history.back();
    conHistoria = false;
  }
  $("#chat-cerrar").addEventListener("click", () => cerrarFoco(false));
  window.addEventListener("popstate", () => { if (enFoco) { conHistoria = false; cerrarFoco(true); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && enFoco) cerrarFoco(false); });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", ajustarAlto);
    window.visualViewport.addEventListener("scroll", ajustarAlto);
  }
  window.addEventListener("resize", ajustarAlto);

  // ---------- Avance ----------
  // Lo marca el tema de lo que el agente pregunta (lo manda el servidor) o la pregunta fija del modo
  // sin IA. Nunca va hacia atrás y se llena al enseñar la propuesta.
  const AVANCE = { negocio: 1 / 6, problema: 0.5, hoy: 0.6, cierre: 1 };
  const tramos = Array.from(document.querySelectorAll("#chat-progreso li"));
  const progreso = $("#chat-progreso");
  let avance = 0;
  function avanzar(paso) {
    const v = AVANCE[paso];
    if (v == null || v <= avance) return;
    avance = v;
    tramos.forEach((li, i) => {
      const lleno = Math.min(1, Math.max(0, avance * tramos.length - i));
      li.style.setProperty("--lleno", lleno);
      li.classList.toggle("hecho", lleno >= 1);
      li.classList.toggle("actual", (lleno > 0 && lleno < 1) || (avance >= 1 && i === tramos.length - 1));
    });
    progreso.setAttribute("aria-valuenow", String(Math.round(avance * 100)));
    const actual = tramos.find((li) => li.classList.contains("actual"));
    if (actual) progreso.setAttribute("aria-valuetext", actual.textContent);
    if (avance >= 1) $("#chat-tiempo").textContent = "Listo";
  }
  const euros = (n) => Math.round(n).toLocaleString("es-ES") + " €"; // espacio que no se parte
  async function decir(texto) {
    const e = escribiendo();
    await pausa(500);
    e.remove();
    burbuja(texto, "bot");
  }

  // ---------- Modo guiado ----------
  const PREGUNTA_PROBLEMA = {
    telefono: "¿En qué momentos se te escapan más llamadas? Si te acuerdas de la última vez, cuéntamela.",
    whatsapp: "¿Qué te preguntan más por WhatsApp, y a qué horas?",
    web: "¿Qué te gustaría que pasara cuando alguien entra en tu web, y qué pasa ahora?",
    tareas: "¿Qué tarea es la que más tiempo te quita? Cuéntame la última vez.",
    otro: "Cuéntame qué pasa, con un ejemplo de la última vez.",
  };
  const PREGUNTAS = [
    { campo: "negocio", paso: "negocio", texto: () => "Vamos a ello. ¿Qué negocio tienes? Si tienes web o Instagram, pásame el enlace o el nombre." },
    { campo: "detalle", paso: "problema", texto: () => "Gracias. " + PREGUNTA_PROBLEMA[guia.problema] },
  ];
  const ETIQUETAS = { inicio: "Lo que te pasa", negocio: "Tu negocio", detalle: "En concreto" };
  const PROPUESTAS = {
    telefono: "Cuando no puedas coger el teléfono, a quien te llamó le llega al momento un WhatsApp que le atiende y te deja un resumen.",
    whatsapp: "Un agente de WhatsApp que contesta al momento, pregunta lo necesario y te pasa solo las consultas buenas, con un resumen.",
    web: "Una web nueva, hecha para el móvil, con tus precios y un botón claro para reservar o pedir presupuesto. Te la enseñamos hecha antes de que pagues.",
    tareas: "Una herramienta a medida que haga esa tarea por ti y te deje solo revisar.",
    otro: "Lo vemos en una llamada de veinte minutos y te decimos qué haríamos.",
  };
  const PASO = { telefono: "demo_whatsapp", whatsapp: "demo_whatsapp", web: "maqueta_web", tareas: "propuesta", otro: "llamada" };
  const PRODUCTO = { telefono: "llamadas", whatsapp: "agente_whatsapp", web: "web", tareas: "herramienta", otro: "otro" };
  const guia = { problema: "otro", respuestas: {}, paso: 0 };

  function adivinarProblema(texto) {
    const t = texto.toLowerCase();
    if (/whats|mensaje/.test(t)) return "whatsapp";
    if (/tel[eé]fono|llamad|coger/.test(t)) return "telefono";
    if (/\bweb\b|p[aá]gina|google/.test(t)) return "web";
    if (/presupuest|reserva|factura|horas|tiempo|papeleo|excel/.test(t)) return "tareas";
    return "otro";
  }

  async function guiado(problema, inicio) {
    modo = "guiado";
    guia.problema = problema;
    guia.respuestas = { inicio };
    guia.paso = 0;
    avanzar(PREGUNTAS[0].paso);
    await decir(PREGUNTAS[0].texto());
  }
  async function responderGuiado(texto) {
    guia.respuestas[PREGUNTAS[guia.paso].campo] = texto.slice(0, 600);
    guia.paso += 1;
    if (guia.paso < PREGUNTAS.length) {
      avanzar(PREGUNTAS[guia.paso].paso);
      return decir(PREGUNTAS[guia.paso].texto());
    }
    await decir("Gracias. Con esto ya podemos preparar algo concreto para ti.");
    const p = guia.problema;
    mostrarCierre({ propuesta: PROPUESTAS[p], siguiente_paso: PASO[p], producto: PRODUCTO[p], coste_mensual_eur: 0 }, guia.respuestas);
    enviarAnonimo({ producto: PRODUCTO[p], siguiente_paso: PASO[p] });
  }

  // ---------- Cierre y contacto ----------
  const PASOS = {
    maqueta_web: { titulo: "¿Te preparamos la maqueta?", texto: "Déjanos tu contacto y te la enseñamos antes de que pagues nada.", boton: "Sí, preparadla" },
    demo_whatsapp: { titulo: "¿Te enseñamos una demo?", texto: "Con las preguntas que te hacen de verdad. Déjanos tu contacto y te la enseñamos.", boton: "Sí, enseñádmela" },
    propuesta: { titulo: "¿Te mandamos la propuesta?", texto: "Con lo que haríamos y el precio cerrado, por escrito.", boton: "Sí, mandádmela" },
    llamada: { titulo: "¿Lo vemos en una llamada?", texto: "Veinte minutos para entenderlo bien y decirte qué haríamos.", boton: "Sí, llamadme" },
  };

  // datos: { resumen?, propuesta, siguiente_paso, producto, nombre_negocio?, coste_mensual_eur, calculo? }
  // respuestas: lo contestado en el modo guiado, que se enseña tal cual.
  function mostrarCierre(datos, respuestas) {
    terminado = true;
    cierre = datos;
    avanzar("cierre");
    const paso = PASOS[datos.siguiente_paso] || PASOS.llamada;
    const caja = document.createElement("div");
    caja.className = "resultado";
    caja.innerHTML = `
      <p class="etiqueta">Lo que hemos entendido</p>
      <div class="resultado-entendido"></div>
      <p class="etiqueta">Lo que haríamos</p>
      <p class="resultado-propuesta"></p>
      <form class="contacto" novalidate>
        <p class="resultado-paso"><strong></strong> <span></span></p>
        <label for="c-nombre">Tu nombre<input type="text" id="c-nombre" autocomplete="name" maxlength="80" required></label>
        <label for="c-contacto">Teléfono o email<input type="text" id="c-contacto" autocomplete="tel" maxlength="120" required></label>
        <label for="c-negocio">Nombre del negocio (opcional)<input type="text" id="c-negocio" maxlength="120"></label>
        <label for="c-web">Tu web o Instagram (opcional)<input type="text" id="c-web" autocomplete="url" maxlength="200"></label>
        <label class="consentimiento" for="c-permiso"><input type="checkbox" id="c-permiso" required>
          <span>Acepto que Arcilla Studio (ARVENTURES S.L.) me contacte sobre lo que he contado en este chat. <a href="privacidad.html">Privacidad</a>.</span></label>
        <button class="boton" type="submit"></button>
        <p class="contacto-estado" role="status"></p>
      </form>
      <button class="enlace-boton" type="button" data-accion="reiniciar">Empezar de nuevo</button>`;
    const entendido = caja.querySelector(".resultado-entendido");
    if (respuestas) {
      const ul = document.createElement("ul");
      ul.className = "resultado-lista";
      Object.entries(ETIQUETAS).forEach(([campo, etiqueta]) => {
        if (!respuestas[campo]) return;
        const li = document.createElement("li");
        const b = document.createElement("strong");
        b.textContent = etiqueta + ": ";
        li.append(b, respuestas[campo]);
        ul.appendChild(li);
      });
      entendido.appendChild(ul);
    } else {
      const p = document.createElement("p");
      p.textContent = datos.resumen || "";
      entendido.appendChild(p);
    }
    caja.querySelector(".resultado-propuesta").textContent = datos.propuesta || "";
    if (Number(datos.coste_mensual_eur) > 0) {
      const c = document.createElement("p");
      c.className = "resultado-calculo";
      c.textContent = `Ahora mismo esto te puede estar costando unos ${euros(datos.coste_mensual_eur)} al mes` + (datos.calculo ? ` (${datos.calculo}).` : ".");
      caja.querySelector(".resultado-propuesta").after(c);
    }
    caja.querySelector(".resultado-paso strong").textContent = paso.titulo;
    caja.querySelector(".resultado-paso span").textContent = paso.texto;
    caja.querySelector("button[type=submit]").textContent = paso.boton;
    if (datos.nombre_negocio) caja.querySelector("#c-negocio").value = datos.nombre_negocio;
    caja.querySelector("form").addEventListener("submit", (ev) => enviarContacto(ev, respuestas));
    caja.querySelector('[data-accion="reiniciar"]').addEventListener("click", () => window.location.reload());
    lista.appendChild(caja);
    bajar();
  }

  function resumenTexto(nombre, contacto, negocio, web, respuestas) {
    const lineas = ["Hola, vengo del chat de arcillastudio.com.", `Nombre: ${nombre}`, negocio ? `Negocio: ${negocio}` : "", web ? `Web o Instagram: ${web}` : ""];
    if (respuestas) Object.entries(ETIQUETAS).forEach(([campo, etiqueta]) => { if (respuestas[campo]) lineas.push(`${etiqueta}: ${respuestas[campo]}`); });
    else if (cierre && cierre.resumen) lineas.push(`Lo que os conté: ${cierre.resumen}`);
    lineas.push(`Contacto: ${contacto}`);
    return lineas.filter(Boolean).join("\n");
  }

  async function enviarContacto(ev, respuestas) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const estado = form.querySelector(".contacto-estado");
    const nombre = form.querySelector("#c-nombre").value.trim();
    const contacto = form.querySelector("#c-contacto").value.trim();
    const negocio = form.querySelector("#c-negocio").value.trim();
    const web = form.querySelector("#c-web").value.trim();
    const permiso = form.querySelector("#c-permiso").checked;
    if (!nombre || !contacto) { estado.textContent = "Pon tu nombre y un teléfono o email para poder escribirte."; return; }
    if (!permiso) { estado.textContent = "Marca la casilla para que podamos contactarte."; return; }
    const boton = form.querySelector("button[type=submit]");
    boton.disabled = true;
    estado.textContent = "Enviando…";
    try {
      const guiadoDatos = respuestas ? { problema: guia.problema, ...respuestas } : null;
      const r = await fetch(`${CONFIG.api}/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesion, nombre, contacto, negocio, web, consentimiento: true, modo, guiado: guiadoDatos }),
      });
      if (!r.ok) throw new Error(String(r.status));
      form.innerHTML = "";
      const ok = document.createElement("p");
      ok.className = "aviso";
      ok.textContent = `Recibido, ${nombre}. Te escribimos en un día laborable.`;
      form.appendChild(ok);
    } catch (e) {
      boton.disabled = false;
      estado.textContent = "";
      const aviso = document.createElement("div");
      aviso.className = "aviso";
      const texto = resumenTexto(nombre, contacto, negocio, web, respuestas);
      aviso.innerHTML = `<p>No hemos podido enviarlo desde aquí. Mándanos este resumen por email a ${CONFIG.email}:</p><pre></pre>`;
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

  function enviarAnonimo(datos) {
    // Solo el tipo de problema y el siguiente paso, sin texto libre ni contacto: sirve para ver qué es lo más común.
    fetch(`${CONFIG.api}/diagnostico`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sesion, modo, anonima: datos }),
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
      respuestasIA += 1;
      if (datos.paso) avanzar(datos.paso);
      if (datos.respuesta) burbuja(datos.respuesta, "bot");
      if (datos.cierre && !terminado) mostrarCierre(datos.cierre);
    } catch (err) {
      e.remove();
      if (terminado) {
        await decir(`Si quieres añadir algo, escríbelo en el formulario o mándanos un email a ${CONFIG.email}.`);
      } else if (respuestasIA > 0) {
        // Se ha cortado a mitad: lo seguimos en persona.
        await decir("Perdona, se me ha cortado la conexión. Déjanos tu contacto y lo seguimos por ahí.");
        mostrarCierre({ resumen: "Nos llega lo que nos has contado hasta aquí, así que no tendrás que repetirlo.", propuesta: PROPUESTAS.otro, siguiente_paso: "llamada", producto: "otro", coste_mensual_eur: 0 });
      } else {
        // Sin API (vista previa, límite o error): seguimos con las preguntas fijas.
        await guiado(clave || adivinarProblema(texto), texto);
      }
    } finally {
      ocupado = false;
      enviar.disabled = false;
      if (enFoco && !tactil && !terminado) entrada.focus();
    }
  }

  // ---------- Entradas ----------
  document.querySelectorAll("#opciones-iniciales .opcion").forEach((b) => {
    b.addEventListener("click", () => {
      if (ocupado) return;
      empezar();
      quitarOpciones();
      const texto = b.textContent.trim();
      burbuja(texto, "tu");
      hablarConIA(texto, b.dataset.valor);
    });
  });

  formulario.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const texto = entrada.value.trim();
    if (!texto || ocupado) return;
    entrada.value = "";
    entrada.style.height = "";
    empezar();
    abrirFoco(); // si la había cerrado, vuelve a pantalla completa
    quitarOpciones();
    burbuja(texto, "tu");
    if (modo === "ia") return hablarConIA(texto);
    if (!terminado) return responderGuiado(texto);
    decir(`Si quieres añadir algo, escríbelo en el formulario o mándanos un email a ${CONFIG.email}.`);
  });

  // En el ordenador, Intro envía y Mayúsculas + Intro hace un salto de línea. En el móvil, el botón.
  entrada.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !tactil) {
      e.preventDefault();
      formulario.requestSubmit();
    }
  });
  entrada.addEventListener("input", () => {
    entrada.style.height = "auto";
    entrada.style.height = Math.min(entrada.scrollHeight, 140) + "px";
  });
  // El taller. En escritorio, una escena fija enseña la maqueta del paso que está a la vista.
  // En el móvil, cada maqueta va bajo su texto y avanza con el scroll mientras está fija.
  const pasosTaller = Array.from(document.querySelectorAll(".paso-taller[data-maqueta]"));
  const maquetas = Array.from(document.querySelectorAll(".taller-escena .maqueta"));
  const scrollWeb = document.getElementById("m-scroll");
  const cajaChat = document.getElementById("m-chat");
  const filaNueva = document.querySelector(".panel .fila-nueva");
  const pendientes = document.querySelector(".panel [data-pendientes]");
  const tallerMovil = window.matchMedia("(max-width: 860px)");
  const menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
  const acotar = (x) => Math.min(1, Math.max(0, x));

  // La web de ejemplo baja de la portada (solo foto y "Reservar ahora") hasta la reserva.
  // En el móvil, si el navegador sabe ligar animaciones al scroll, la mueve el CSS (sin tirones).
  const webPorCSS = Boolean(window.CSS && CSS.supports && CSS.supports("animation-timeline: view()"));
  let webFin = null; // cuánto puede bajar la web, en px; se mide al cargar y al cambiar el tamaño
  function medirWeb() {
    if (!scrollWeb) return 0;
    const hero = scrollWeb.querySelector(".m-hero");
    const alto = scrollWeb.parentElement.clientHeight - scrollWeb.offsetTop;
    if (hero && alto > 0 && hero.style.height !== alto + "px") hero.style.height = alto + "px";
    webFin = Math.max(0, scrollWeb.scrollHeight - alto);
    scrollWeb.style.setProperty("--web-fin", -webFin + "px");
    return webFin;
  }
  // t de 0 a 1.
  function moverWeb(t) {
    if (!scrollWeb) return;
    const max = webFin === null ? medirWeb() : webFin;
    scrollWeb.style.transform = `translateY(${-Math.round(max * t)}px)`;
  }

  function tallerMedir() {
    if (!pasosTaller.length) return;
    if (tallerMovil.matches) return tallerMedirMovil();
    if (filaNueva) filaNueva.classList.add("vista");
    if (pendientes) pendientes.textContent = pendientes.dataset.pendientes;
    const linea = window.innerHeight * 0.5;
    // Se cambia de maqueta cuando el siguiente paso llega a la línea, no antes.
    let mejor = pasosTaller[0];
    pasosTaller.forEach((p) => { const r = p.getBoundingClientRect(); if (r.top + r.height * 0.25 <= linea) mejor = p; });
    maquetas.forEach((m) => m.classList.toggle("activa", m.dataset.maqueta === mejor.dataset.maqueta));
    const pasoWeb = pasosTaller.find((p) => p.dataset.maqueta === "web");
    if (pasoWeb) {
      const r = pasoWeb.getBoundingClientRect();
      moverWeb(Math.min(1, acotar((linea - r.top) / r.height) * 1.25));
    }
    // La conversación de WhatsApp se escribe sola cuando su paso está a la vista.
    if (mejor.dataset.maqueta === "wa") reproducirChat(); else pararChat();
  }

  function tallerMedirMovil() {
    pararChat();
    const quieto = menosMovimiento.matches;
    if (webFin === null) medirWeb();
    // Primero se lee todo y después se escribe, para no forzar al navegador a recalcular a medias.
    const tramos = [];
    maquetas.forEach((m) => {
      // t: cuánto se ha recorrido del tramo en el que la pantalla está fija (0 al fijarse, 1 al soltarse).
      const escenario = m.querySelector(".maqueta-escenario");
      const r = m.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      const tope = parseFloat(getComputedStyle(escenario).top) || 0;
      const recorrido = Math.max(1, r.height - escenario.offsetHeight);
      tramos.push([m.dataset.maqueta, quieto ? 1 : acotar((tope - r.top) / recorrido)]);
    });
    tramos.forEach(([tipo, t]) => {
      if (tipo === "web") { if (webPorCSS) scrollWeb.style.transform = ""; else moverWeb(quieto ? 0 : t); }
      else if (tipo === "wa") escribirChat(t);
      else if (tipo === "panel") entrarReserva(t);
    });
  }

  // El chat avanza con el scroll: el primer mensaje ya está al llegar y el último cae al 85 % del tramo.
  // Antes de cada mensaje del agente aparece "escribiendo".
  function escribirChat(t) {
    if (!cajaChat) return;
    const bs = Array.from(cajaChat.querySelectorAll(".b[data-t]"));
    const esc = cajaChat.querySelector(".b.esc");
    const avance = acotar(t / 0.85) * (bs.length - 1);
    const vistos = 1 + Math.floor(avance + 1e-6);
    let cambio = false;
    bs.forEach((b, i) => { const v = i < vistos; if (b.classList.contains("visto") !== v) { b.classList.toggle("visto", v); cambio = true; } });
    const siguiente = bs[vistos];
    const escribe = Boolean(siguiente && siguiente.classList.contains("yo") && avance - (vistos - 1) > 0.45);
    if (esc && esc.classList.contains("visto") !== escribe) { esc.classList.toggle("visto", escribe); cambio = true; }
    if (cambio) cajaChat.scrollTop = cajaChat.scrollHeight;
  }

  // La reserva de Marta entra en el panel y suma una "por confirmar".
  function entrarReserva(t) {
    if (!filaNueva) return;
    const vista = t > 0.3;
    filaNueva.classList.toggle("vista", vista);
    if (pendientes) {
      const n = Number(pendientes.dataset.pendientes);
      pendientes.textContent = String(vista ? n : n - 1);
    }
  }

  let chatTimers = [];
  let chatActivo = false;
  function reproducirChat() {
    if (chatActivo) return;
    chatActivo = true;
    const caja = cajaChat;
    if (!caja) return;
    const bs = Array.from(caja.querySelectorAll(".b[data-t]"));
    const esc = caja.querySelector(".b.esc");
    bs.forEach((b) => b.classList.remove("visto"));
    bs.forEach((b, i) => {
      const t = Number(b.dataset.t);
      const esBot = b.classList.contains("yo");
      if (esBot && esc) chatTimers.push(setTimeout(() => { esc.classList.add("visto"); caja.scrollTop = caja.scrollHeight; }, Math.max(0, t - 1100)));
      chatTimers.push(setTimeout(() => { if (esc) esc.classList.remove("visto"); b.classList.add("visto"); caja.scrollTop = caja.scrollHeight; }, t));
    });
  }
  function pararChat() {
    if (!chatActivo) return;
    chatActivo = false;
    chatTimers.forEach(clearTimeout); chatTimers = [];
  }
  // Una medida por fotograma, por muchos eventos de scroll que lleguen.
  let tallerPedido = false;
  function pedirTaller() {
    if (tallerPedido) return;
    tallerPedido = true;
    requestAnimationFrame(() => { tallerPedido = false; tallerMedir(); });
  }
  window.addEventListener("scroll", pedirTaller, { passive: true });
  window.addEventListener("resize", () => { webFin = null; pedirTaller(); });
  window.addEventListener("load", () => { webFin = null; pedirTaller(); });
  tallerMedir();

  // La línea de tiempo se dibuja según bajas por ella.
  const linea = document.getElementById("linea");
  function lineaMedir() {
    if (!linea) return;
    const r = linea.getBoundingClientRect();
    const horizontal = window.innerWidth > 900;
    const inicio = window.innerHeight * 0.85, fin = window.innerHeight * (horizontal ? 0.35 : 0.45);
    const t = Math.min(1, Math.max(0, (inicio - r.top) / Math.max(1, (horizontal ? inicio - fin : r.height + inicio - fin))));
    linea.style.setProperty("--prog", t.toFixed(3));
    const hitos = linea.querySelectorAll(".hito");
    hitos.forEach((h, i) => h.classList.toggle("hecho", t >= (i + 0.5) / hitos.length || (horizontal && t > 0.98) ));
  }
  window.addEventListener("scroll", lineaMedir, { passive: true });
  window.addEventListener("resize", lineaMedir);
  lineaMedir();

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
