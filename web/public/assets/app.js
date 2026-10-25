// Chat de la portada de Arcilla Studio.
//
// Dos modos:
//  - "ia": habla con /api/chat (Cloudflare Pages Function + Claude): una conversación de un par de
//    minutos para entender qué le pasa al negocio. Lo esencial: el negocio y un caso real.
//  - "guiado": si la API no responde (vista previa, sin clave, límite diario), dos preguntas fijas
//    que se contestan escribiendo.
// La primera respuesta puede ser un clic (las opciones de la portada). Los dos modos acaban igual:
//  1. "A ver si lo he entendido: …" y "¿Es así?" (sí, o lo corrige).
//  2. Lo que haríamos y la oferta (maqueta, demo, propuesta o llamada), que manda Álvaro.
//  3. El WhatsApp (o el email) y el nombre, de uno en uno en la propia caja. No pasan por la IA.

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
  const SALUDO = "Hola, soy el agente de Arcilla Studio, una IA. Te hago un par de preguntas y te cuento cómo lo resolveríamos.";
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
  let respuestasIA = 0; // cuántas veces ha contestado el agente
  let cierre = null; // el resumen y la propuesta del final
  // Tras el resumen: "comprobar" (¿es así?), "corrige", "whatsapp" o "email" (pide el contacto),
  // "nombre" y "hecho". Mientras se conversa, null.
  let fase = null;
  let contactoDado = null; // { contacto, canal }

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
  const AVANCE = { negocio: 1 / 6, problema: 0.5, hoy: 0.6, cierre: 0.72, contacto: 0.85, hecho: 1 };
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
    const p = guia.problema;
    cierre = { resumen: resumenGuiado(), propuesta: PROPUESTAS[p], siguiente_paso: PASO[p], producto: PRODUCTO[p] };
    enviarAnonimo({ producto: PRODUCTO[p], siguiente_paso: PASO[p] });
    await comprobar();
  }
  function resumenGuiado() {
    const r = guia.respuestas;
    return [r.negocio && `Tu negocio: ${r.negocio}.`, r.detalle && `Lo que pasa: ${r.detalle}`].filter(Boolean).join("\n");
  }

  // ---------- Cierre: comprobar, ofrecer y pedir el contacto ----------
  const OFERTAS = {
    maqueta_web: { que: "Te preparamos una maqueta de tu web y te la enseñamos antes de que pagues nada.", para: "para prepararte la maqueta" },
    demo_whatsapp: { que: "Te preparamos una demo con las preguntas que te hacen de verdad.", para: "para prepararte la demo" },
    propuesta: { que: "Te preparamos una propuesta con lo que haríamos y el precio cerrado, por escrito.", para: "para prepararte la propuesta" },
    llamada: { que: "Lo vemos en veinte minutos y te decimos qué haríamos.", para: "para quedar" },
  };
  // El texto de debajo del campo. Es el mismo que guarda /api/contacto como prueba de que se le informó.
  const AVISO = "Solo lo usamos para mandarte esto y hablar de ello.";

  function rapidas(items) {
    const caja = document.createElement("div");
    caja.className = "opciones rapidas";
    items.forEach(([texto, accion]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "opcion";
      b.textContent = texto;
      b.addEventListener("click", () => {
        if (ocupado) return;
        quitarRapidas();
        burbuja(texto, "tu");
        accion();
      });
      caja.appendChild(b);
    });
    lista.appendChild(caja);
    bajar();
  }
  function quitarRapidas() {
    lista.querySelectorAll(".rapidas").forEach((n) => n.remove());
  }

  // 1. El resumen, con sus palabras, y "¿Es así?".
  async function comprobar() {
    fase = "comprobar";
    avanzar("cierre");
    modoCaja(null);
    entrada.placeholder = "O escribe lo que falta";
    const e = escribiendo();
    await pausa(500);
    e.remove();
    // El momento más importante: lo que ha contado, con sus palabras, para que diga si es así.
    const msg = document.createElement("div");
    msg.className = "msg msg-bot msg-resumen";
    msg.innerHTML = "<span>A ver si lo he entendido:</span><blockquote></blockquote><span>¿Es así?</span>";
    msg.querySelector("blockquote").textContent = cierre.resumen;
    lista.appendChild(msg);
    bajar();
    rapidas([["Sí, es eso", confirmar], ["Falta algo", corregir]]);
  }
  async function corregir() {
    fase = "corrige";
    entrada.placeholder = "Lo que falta o cambiarías";
    await decir("Cuéntame qué falta o qué cambiarías.");
    if (!tactil) entrada.focus();
  }
  async function corregirGuiado(texto) {
    guia.respuestas.detalle = [guia.respuestas.detalle, texto.slice(0, 600)].filter(Boolean).join(" ");
    cierre.resumen = resumenGuiado();
    await comprobar();
  }

  // 2. Lo que haríamos y la oferta, que manda una persona: Álvaro.
  async function confirmar() {
    await pedirContacto(OFERTAS[cierre.siguiente_paso] || OFERTAS.llamada, cierre.propuesta);
  }
  async function pedirContacto(oferta, propuesta) {
    fase = "whatsapp";
    avanzar("contacto");
    await decir(propuesta ? `Lo que haríamos: ${propuesta}\n\n${oferta.que}` : oferta.que);
    const msg = document.createElement("div");
    msg.className = "msg msg-bot msg-persona";
    msg.innerHTML = '<img src="assets/alvaro.jpg" alt="" width="44" height="44"><span><strong>Te escribe Álvaro</strong>, que lleva el estudio. <span class="pregunta"></span></span>';
    const pregunta = msg.querySelector(".pregunta");
    const PREGUNTA = { whatsapp: "¿A qué WhatsApp te lo mando?", email: "¿A qué email te lo mando?" };
    pregunta.textContent = PREGUNTA.whatsapp;
    lista.appendChild(msg);
    const nota = document.createElement("p");
    nota.className = "msg-nota";
    nota.innerHTML = `${AVISO} <a href="privacidad.html" target="_blank" rel="noopener">Privacidad</a> · <button type="button" class="enlace-boton">Prefiero email</button>`;
    const cambiar = nota.querySelector("button");
    cambiar.addEventListener("click", () => {
      if (fase !== "whatsapp" && fase !== "email") return;
      fase = fase === "whatsapp" ? "email" : "whatsapp";
      cambiar.textContent = fase === "email" ? "Prefiero WhatsApp" : "Prefiero email";
      pregunta.textContent = PREGUNTA[fase];
      modoCaja(fase);
    });
    lista.appendChild(nota);
    bajar();
    modoCaja("whatsapp");
    pedirContacto.oferta = oferta;
  }

  // 3. El contacto y el nombre, de uno en uno. Se guarda en cuanto llega el contacto.
  function valido(canal, valor) {
    if (canal === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    return /^\+?\d{9,15}$/.test(valor.replace(/[\s().-]/g, ""));
  }
  async function guardarContacto(extra) {
    try {
      const guiadoDatos = modo === "guiado" ? { problema: guia.problema, ...guia.respuestas } : null;
      const r = await fetch(`${CONFIG.api}/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesion, ...contactoDado, ...extra, informado: true, modo, guiado: guiadoDatos }),
      });
      return r.ok;
    } catch {
      return false;
    }
  }
  async function recibirContacto(valor) {
    const canal = fase;
    if (!valido(canal, valor)) {
      await decir(canal === "email" ? "Ese email no me sale bien. ¿Lo revisas?" : "Ese número no me sale bien. ¿Lo revisas? Con las 9 cifras basta, o con el prefijo si no es de España.");
      return;
    }
    contactoDado = { contacto: valor, canal };
    ocupado = true;
    const ok = await guardarContacto({});
    ocupado = false;
    if (!ok) {
      contactoDado = null;
      await decir(`Vaya, no he podido guardarlo. Escríbenos a ${CONFIG.email} con tu ${canal === "email" ? "email" : "número"} y te contestamos en el día.`);
      return;
    }
    fase = "nombre";
    await decir("Apuntado. ¿Y cómo te llamas?");
    modoCaja("nombre");
  }
  async function recibirNombre(nombre) {
    fase = "hecho";
    modoCaja(null);
    entrada.placeholder = "¿Algo más que quieras contarnos?";
    guardarContacto({ nombre });
    avanzar("hecho");
    const como = contactoDado.canal === "email" ? "por email" : "por WhatsApp";
    const para = (pedirContacto.oferta || OFERTAS.llamada).para;
    await decir(`Hecho, ${nombre.split(/\s+/)[0]}. Álvaro te escribe ${como} en un día laborable ${para}. Gracias por contárnoslo.`);
  }

  function enviarAnonimo(datos) {
    // Solo el tipo de problema y el siguiente paso, sin texto libre ni contacto: sirve para ver qué es lo más común.
    fetch(`${CONFIG.api}/diagnostico`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sesion, modo, anonima: datos }),
    }).catch(() => {});
  }

  // ---------- La caja: conversación o un solo dato ----------
  const campo = document.createElement("input");
  campo.className = "caja-campo";
  campo.hidden = true;
  campo.maxLength = 120;
  entrada.after(campo);
  const MODOS = {
    whatsapp: { type: "tel", inputMode: "tel", autocomplete: "tel", placeholder: "Tu WhatsApp, p. ej. 612 345 678" },
    email: { type: "email", inputMode: "email", autocomplete: "email", placeholder: "Tu email" },
    nombre: { type: "text", inputMode: "text", autocomplete: "given-name", placeholder: "Tu nombre" },
  };
  function modoCaja(tipo) {
    const m = MODOS[tipo];
    entrada.hidden = Boolean(m);
    campo.hidden = !m;
    if (!m) return;
    campo.type = m.type;
    campo.inputMode = m.inputMode;
    campo.autocomplete = m.autocomplete;
    campo.placeholder = m.placeholder;
    campo.setAttribute("aria-label", m.placeholder);
    campo.value = "";
    campo.focus();
  }

  // ---------- Modo IA ----------
  async function hablarConIA(texto, clave, faseIA) {
    ocupado = true;
    enviar.disabled = true;
    const e = escribiendo();
    try {
      const r = await fetch(`${CONFIG.api}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesion, mensaje: texto, fase: faseIA }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const datos = await r.json();
      e.remove();
      if (datos.respaldo) throw new Error("respaldo");
      respuestasIA += 1;
      if (datos.paso) avanzar(datos.paso);
      if (datos.respuesta) burbuja(datos.respuesta, "bot");
      if (datos.cierre && fase !== "hecho") {
        cierre = datos.cierre;
        ocupado = false;
        await comprobar();
      }
    } catch (err) {
      e.remove();
      if (fase === "hecho") {
        await decir(`Si quieres añadir algo, escríbenos a ${CONFIG.email}.`);
      } else if (cierre) {
        // Falló al corregir: seguimos con lo que había.
        await confirmar();
      } else if (respuestasIA > 0) {
        // Se ha cortado a mitad: lo seguimos en persona, sin que tenga que repetir nada.
        await decir("Perdona, se me ha cortado la conexión. Lo seguimos en persona y no tendrás que repetir nada.");
        cierre = { propuesta: "", siguiente_paso: "llamada", producto: "otro" };
        await pedirContacto(OFERTAS.llamada);
      } else {
        // Sin API (vista previa, límite o error): seguimos con las preguntas fijas.
        await guiado(clave || adivinarProblema(texto), texto);
      }
    } finally {
      ocupado = false;
      enviar.disabled = false;
      if (enFoco && !tactil && !fase) entrada.focus();
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
    const texto = (campo.hidden ? entrada.value : campo.value).trim();
    if (!texto || ocupado) return;
    entrada.value = "";
    entrada.style.height = "";
    campo.value = "";
    empezar();
    abrirFoco(); // si la había cerrado, vuelve a pantalla completa
    quitarOpciones();
    quitarRapidas();
    burbuja(texto, "tu");
    if (fase === "whatsapp" || fase === "email") return recibirContacto(texto);
    if (fase === "nombre") return recibirNombre(texto);
    if (fase === "comprobar" && /^(s[ií]|vale|exacto|correcto|eso es|perfecto|ok)(?=$|[\s,.!])/i.test(texto) && texto.length < 30) return confirmar();
    if (fase === "comprobar" || fase === "corrige") return modo === "ia" ? hablarConIA(texto, null, "corrige") : corregirGuiado(texto);
    if (fase === "hecho") return modo === "ia" ? hablarConIA(texto, null, "contacto") : decir(`Apuntado. Se lo paso a Álvaro.`);
    if (modo === "ia") return hablarConIA(texto);
    return responderGuiado(texto);
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
