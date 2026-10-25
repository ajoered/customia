// El torno: una sola pieza de arcilla que se moldea con el scroll.
//
// Dibuja en un canvas 2D una forma definida por 72 puntos. Cada etapa de la historia
// es una forma objetivo (ladrillo, masa, móvil, burbuja de WhatsApp, panel, pieza
// cocida) y el progreso del scroll interpola entre ellas. El volumen, el barro y el
// esmalte los pinta ceramica.js. Si el navegador prefiere menos movimiento, se dibuja
// la forma de la etapa visible sin animar.

(function () {
  "use strict";
  const canvas = document.getElementById("torno-canvas");
  const pasos = Array.from(document.querySelectorAll("[data-etapa]"));
  if (!canvas || !pasos.length || !window.Ceramica) return;
  const ctx = canvas.getContext("2d");
  const N = 72;
  const SIZE = 520;
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Colores desde los tokens de la página ----------
  function tokens() {
    const cs = getComputedStyle(document.documentElement);
    return {
      ladrillo: cs.getPropertyValue("--ladrillo").trim() || "#b8593a",
      ladrillo2: cs.getPropertyValue("--ladrillo-2").trim() || "#7e3a24",
      barro: cs.getPropertyValue("--barro").trim() || "#cfa080",
      barro2: cs.getPropertyValue("--barro-2").trim() || "#a9775a",
      esmalte: cs.getPropertyValue("--esmalte").trim() || "#9db0e0",
      esmalte2: cs.getPropertyValue("--esmalte-2").trim() || "#24479f",
      acentoOscuro: cs.getPropertyValue("--acento-oscuro").trim() || "#17307a",
      gres: cs.getPropertyValue("--gres").trim() || "#e6dfd2",
      hierro: cs.getPropertyValue("--hierro").trim() || "#3b2a1e",
      porcelana: cs.getPropertyValue("--porcelana").trim() || "#f3f1ea",
      fuego: cs.getPropertyValue("--fuego").trim() || "#e2874e",
    };
  }
  let col = tokens();

  // ---------- Formas (puntos en sentido horario alrededor del centro) ----------
  function rectRedondeado(w, h, r, cx, cy) {
    // Muestrea el perímetro de un rectángulo con esquinas redondeadas en N puntos.
    const pts = [];
    const recto = 2 * (w - 2 * r) + 2 * (h - 2 * r);
    const curvo = 2 * Math.PI * r;
    const total = recto + curvo;
    for (let i = 0; i < N; i++) {
      let d = (i / N) * total;
      let x, y;
      const W = w - 2 * r, H = h - 2 * r, Q = (Math.PI * r) / 2;
      if (d < W) { x = -W / 2 + d; y = -h / 2; }
      else if ((d -= W) < Q) { const a = -Math.PI / 2 + d / r; x = W / 2 + r * Math.cos(a); y = -H / 2 + r * Math.sin(a); }
      else if ((d -= Q) < H) { x = w / 2; y = -H / 2 + d; }
      else if ((d -= H) < Q) { const a = d / r; x = W / 2 + r * Math.cos(a); y = H / 2 + r * Math.sin(a); }
      else if ((d -= Q) < W) { x = W / 2 - d; y = h / 2; }
      else if ((d -= W) < Q) { const a = Math.PI / 2 + d / r; x = -W / 2 + r * Math.cos(a); y = H / 2 + r * Math.sin(a); }
      else if ((d -= Q) < H) { x = -w / 2; y = H / 2 - d; }
      else { d -= H; const a = Math.PI + d / r; x = -W / 2 + r * Math.cos(a); y = -H / 2 + r * Math.sin(a); }
      pts.push([x + cx, y + cy]);
    }
    return pts;
  }
  function masa(rBase, semilla) {
    // Una masa irregular: radio con ondas de baja frecuencia.
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const r = rBase * (1 + 0.11 * Math.sin(2 * a + semilla) + 0.07 * Math.sin(3 * a + semilla * 1.7) + 0.04 * Math.sin(5 * a + semilla * 0.3));
      pts.push([r * Math.cos(a), r * Math.sin(a)]);
    }
    return pts;
  }
  function burbuja() {
    // Rectángulo redondeado con un pico abajo a la izquierda.
    const pts = rectRedondeado(300, 190, 40, 0, -10);
    for (let i = 0; i < N; i++) {
      const [x, y] = pts[i];
      if (y > 70 && x < -95 && x > -135) pts[i] = [x - 18, y + 34];
    }
    return pts;
  }
  // La pieza terminada: la vasija de gres, que se ve un poco desde arriba (ceramica.js).
  const VASIJA = Ceramica.laVasija();
  // Todas las formas empiezan su contorno arriba en el centro y van en el sentido del reloj.
  // Así, al mezclar dos formas, cada punto va a su sitio y la pieza no se retuerce por el camino.
  function alinear(pts) {
    let k = 0, mejor = Infinity;
    pts.forEach(([x, y], i) => { if (y < 0) { const d = Math.abs(Math.atan2(x, -y)); if (d < mejor) { mejor = d; k = i; } } });
    return pts.slice(k).concat(pts.slice(0, k));
  }
  const FORMAS = {
    ladrillo: alinear(rectRedondeado(330, 160, 6, 0, 0)),
    masa: alinear(masa(150, 1.3)),
    movil: alinear(rectRedondeado(170, 330, 34, 0, 0)),
    burbuja: alinear(burbuja()),
    panel: alinear(rectRedondeado(340, 220, 16, 0, 0)),
    vasija: alinear(VASIJA.contorno(N)),
  };
  // Etapas en orden y, para cada una, qué dibujar dentro.
  const ETAPAS = ["ladrillo", "ladrillo-gira", "masa", "movil", "burbuja", "panel", "horno", "vasija"];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function acotar(x) { return Math.min(1, Math.max(0, x)); }
  function mezclar(A, B, t) { const o = []; for (let i = 0; i < N; i++) o.push([lerp(A[i][0], B[i][0], t), lerp(A[i][1], B[i][1], t)]); return o; }
  function suavizar(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function formaDe(etapa) {
    if (etapa === "ladrillo-gira" || etapa === "ladrillo") return FORMAS.ladrillo;
    if (etapa === "horno") return FORMAS.vasija;
    return FORMAS[etapa];
  }

  // ---------- Dibujo ----------
  function ruta(pts) {
    const r = new Path2D();
    for (let i = 0; i < N; i++) {
      const p = pts[i], q = pts[(i + 1) % N];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      if (i === 0) r.moveTo(mx, my); else r.quadraticCurveTo(p[0], p[1], mx, my);
    }
    const p = pts[0], q = pts[1];
    r.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    r.closePath();
    return r;
  }
  function cajaDe(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function rr(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }

  // Qué lleva dentro cada etapa: huecos e incrustaciones de esmalte en la pieza de barro.
  // El ladrillo y el ladrillo que gira comparten el suyo.
  const DIBUJO = { ladrillo: "ladrillo", "ladrillo-gira": "ladrillo", movil: "movil", burbuja: "burbuja", panel: "panel" };
  function detalles(etapa, alpha, dpr) {
    if (alpha <= 0.02 || !DIBUJO[etapa]) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const s = 0.94 + 0.06 * alpha;
    ctx.scale(s, s);
    const C = Ceramica;
    if (DIBUJO[etapa] === "ladrillo") {
      for (let i = -1; i <= 1; i++) C.hueco(ctx, rr(i * 92 - 30, -50, 60, 100, 6), { x: i * 92 - 30, y: -50, w: 60, h: 100 }, { color: col.ladrillo2, dpr, profundidad: 0.5 });
    } else if (etapa === "movil") {
      C.hueco(ctx, rr(-66, -144, 132, 288, 24), { x: -66, y: -144, w: 132, h: 288 }, { color: col.porcelana, acabado: "esmalte", dpr, profundidad: 0.3 });
      C.hueco(ctx, rr(-54, -128, 108, 92, 14), { x: -54, y: -128, w: 108, h: 92 }, { color: col.barro, dpr, profundidad: 0.22 });
      ctx.fillStyle = "rgba(60,40,30,0.16)";
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.roundRect(-54, -16 + i * 30, 108 - i * 24, 10, 5); ctx.fill(); }
      C.pieza(ctx, rr(-54, 96, 108, 28, 14), { x: -54, y: 96, w: 108, h: 28 }, { color: col.esmalte2, acabado: "esmalte", dpr, sombra: 0.5, motas: false });
    } else if (etapa === "burbuja") {
      [[-118, -66, 150], [-118, -36, 196], [-118, -6, 120], [-118, 30, 168]].forEach(([x, y, w]) => C.hueco(ctx, rr(x, y, w, 13, 6.5), { x, y, w, h: 13 }, { color: col.barro2, dpr, profundidad: 0.3 }));
      C.pieza(ctx, rr(99, 50, 22, 22, 11), { x: 99, y: 50, w: 22, h: 22 }, { color: col.esmalte2, acabado: "esmalte", dpr, sombra: 0.6, motas: false });
    } else if (etapa === "panel") {
      for (let i = 0; i < 3; i++) C.hueco(ctx, rr(-150 + i * 102, -92, 92, 56, 10), { x: -150 + i * 102, y: -92, w: 92, h: 56 }, { color: col.porcelana, acabado: "esmalte", dpr, profundidad: 0.28 });
      [38, 62, 48, 80, 70, 96, 88].forEach((b, i) => C.pieza(ctx, rr(-146 + i * 42, 92 - b, 28, b, 7), { x: -146 + i * 42, y: 92 - b, w: 28, h: b }, { color: col.esmalte2, acabado: "esmalte", dpr, sombra: 0.45, motas: false }));
    }
    ctx.restore();
  }

  let progreso = 0; // 0..ETAPAS.length-1, continuo
  let giro = 0;
  function pintar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== SIZE * dpr) { canvas.width = SIZE * dpr; canvas.height = SIZE * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    const i = Math.min(ETAPAS.length - 1, Math.max(0, Math.floor(progreso)));
    const j = Math.min(ETAPAS.length - 1, i + 1);
    const t = suavizar(Math.min(1, Math.max(0, progreso - i)));
    const A = formaDe(ETAPAS[i]), B = formaDe(ETAPAS[j]);
    const pts = mezclar(A, B, t);
    const r = ruta(pts);
    const caja = cajaDe(pts);

    // Color: ladrillo al principio y arcilla cruda al ablandarse. Cuando la pieza casi es una vasija
    // se abre la boca; en el horno se pone al rojo (brasa), sale gres claro y se baña en cobalto.
    const iMasa = ETAPAS.indexOf("masa");
    const iHorno = ETAPAS.indexOf("horno");
    const ablandado = acotar(progreso - (iMasa - 1));
    const comoVasija = acotar((progreso - iHorno + 0.5) / 0.2);
    const abierta = acotar((progreso - iHorno + 0.45) / 0.35);
    const calor = acotar((progreso - iHorno + 0.2) / 0.2);
    const banado = acotar((progreso - iHorno) / 0.85);
    const brasa = calor * (1 - suavizar(acotar(banado / 0.5)));
    const relleno = mezclarColor(mezclarColor(mezclarColor(col.ladrillo, col.barro, ablandado), col.gres, calor), col.fuego, brasa);

    ctx.save();
    ctx.translate(SIZE / 2, SIZE / 2);
    // El ladrillo se tuerce al ablandarse y la pieza se endereza poco a poco al tomar forma.
    // La masa respira un poco mientras es masa.
    const respira = (ETAPAS[i] === "masa" ? 1 - t : 0) + (ETAPAS[j] === "masa" ? t : 0);
    giro = lerp(angulo(ETAPAS[i]), angulo(ETAPAS[j]), t) + respira * Math.sin(Date.now() / 900) * 0.03;
    ctx.rotate(giro);
    // En el horno, la pieza brilla.
    if (brasa > 0.01) {
      ctx.save();
      ctx.shadowColor = colorAlfa(col.fuego, 0.65 * brasa); ctx.shadowBlur = 54 * brasa * dpr;
      ctx.fillStyle = relleno; ctx.fill(r);
      ctx.restore();
    }
    // Hasta casi tener su forma es una pieza de barro; luego se dibuja como la vasija, recortada a la
    // silueta de ahora.
    if (comoVasija < 1) Ceramica.pieza(ctx, r, caja, { color: relleno, acabado: "barro", dpr, anillos: ETAPAS[i] === "masa" });
    // Todo lo de dentro va recortado a la silueta. Los detalles de la etapa que sale se van al
    // principio del cambio y los de la que entra llegan al final: nunca se ven dos piezas a la vez.
    ctx.save();
    ctx.clip(r);
    if (DIBUJO[ETAPAS[i]] && DIBUJO[ETAPAS[i]] === DIBUJO[ETAPAS[j]]) detalles(ETAPAS[i], 1, dpr);
    else { detalles(ETAPAS[i], acotar(1 - t / 0.35), dpr); detalles(ETAPAS[j], acotar((t - 0.65) / 0.35), dpr); }
    ctx.restore();
    if (comoVasija > 0) {
      ctx.save();
      ctx.globalAlpha = comoVasija;
      VASIJA.dibujar(ctx, {
        ruta: r, dpr, gres: relleno, motas: col.hierro, esmalte: col.esmalte2, oscuro: col.acentoOscuro, claro: col.esmalte,
        nivel: VASIJA.nivel, gotas: VASIJA.gotas, boca: abierta,
        cubre: suavizar(acotar(banado / 0.8)), colgar: acotar((banado - 0.7) / 0.3),
      });
      ctx.restore();
    }
    ctx.restore();
  }
  function angulo(etapa) { return etapa === "masa" ? -0.35 : 0; }
  function colorAlfa(h, a) { const p = hex(h); return p ? `rgba(${p[0]},${p[1]},${p[2]},${a})` : "transparent"; }
  function mezclarColor(a, b, t) {
    const pa = hex(a), pb = hex(b);
    if (!pa || !pb) return t > 0.5 ? b : a;
    return `rgb(${Math.round(lerp(pa[0], pb[0], t))},${Math.round(lerp(pa[1], pb[1], t))},${Math.round(lerp(pa[2], pb[2], t))})`;
  }
  function hex(h) { const m = /^#([0-9a-f]{6})$/i.exec(h.trim()); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

  // ---------- Scroll → progreso ----------
  // Cada paso de texto lleva data-etapa. El progreso es la posición del centro de la
  // ventana respecto a los centros de los pasos, interpolada linealmente.
  const pieza = canvas.closest(".torno-pieza");
  function medir() {
    const centro = window.innerWidth <= 860 && pieza
      ? (Math.max(0, pieza.getBoundingClientRect().bottom) + window.innerHeight) / 2
      : window.innerHeight * 0.5;
    const centros = pasos.map((p) => { const r = p.getBoundingClientRect(); return r.top + r.height / 2; });
    let prog = 0;
    if (centro <= centros[0]) prog = 0;
    else if (centro >= centros[centros.length - 1]) prog = centros.length - 1;
    else {
      for (let k = 0; k < centros.length - 1; k++) {
        if (centro >= centros[k] && centro <= centros[k + 1]) { prog = k + (centro - centros[k]) / (centros[k + 1] - centros[k]); break; }
      }
    }
    // Mapea el índice de paso al índice de etapa.
    const k = Math.floor(prog), f = prog - k;
    const e0 = ETAPAS.indexOf(pasos[Math.min(k, pasos.length - 1)].dataset.etapa);
    const e1 = ETAPAS.indexOf(pasos[Math.min(k + 1, pasos.length - 1)].dataset.etapa);
    const nuevo = lerp(e0, e1, f);
    if (reducir) { progreso = Math.round(nuevo); pintar(); return; }
    // Suaviza el seguimiento para que no dé tirones.
    objetivo = nuevo;
  }
  let objetivo = 0, animando = false;
  function cuadro() {
    const d = objetivo - progreso;
    progreso += Math.abs(d) < 0.002 ? d : d * 0.14;
    pintar();
    if (Math.abs(objetivo - progreso) > 0.0015 || ETAPAS[Math.floor(progreso)] === "masa") requestAnimationFrame(cuadro); else animando = false;
  }
  function pedirCuadro() { if (!animando) { animando = true; requestAnimationFrame(cuadro); } }
  // La pieza se pega justo debajo de la cabecera, mida lo que mida.
  const cab = document.getElementById("cabecera");
  function altoCabecera() { if (cab) document.documentElement.style.setProperty("--cab-h", cab.offsetHeight + "px"); }
  altoCabecera();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { altoCabecera(); medir(); pedirCuadro(); });
  window.addEventListener("load", altoCabecera);
  window.addEventListener("scroll", () => { medir(); pedirCuadro(); }, { passive: true });
  window.addEventListener("resize", () => { altoCabecera(); medir(); pedirCuadro(); });
  medir(); progreso = objetivo; pintar(); pedirCuadro();

  // Pie de foto que nombra la etapa.
  const cap = document.getElementById("torno-cap");
  const NOMBRES = { ladrillo: "ladrillo", "ladrillo-gira": "ladrillo", masa: "arcilla", movil: "tu web", burbuja: "tu WhatsApp", panel: "tu herramienta", horno: "en el horno", vasija: "pieza terminada" };
  if (cap) setInterval(() => { const n = NOMBRES[ETAPAS[Math.round(Math.min(ETAPAS.length - 1, progreso))]]; if (cap.textContent !== n) cap.textContent = n; }, 200);
})();
