// El torno: una sola pieza de arcilla que se moldea con el scroll.
//
// Dibuja en un canvas 2D una forma definida por 72 puntos. Cada etapa de la historia
// es una forma objetivo (ladrillo, masa, móvil, burbuja de WhatsApp, panel, pieza
// cocida) y el progreso del scroll interpola entre ellas. Si el navegador prefiere
// menos movimiento, se dibuja la forma de la etapa visible sin animar.

(function () {
  "use strict";
  const canvas = document.getElementById("torno-canvas");
  const pasos = Array.from(document.querySelectorAll("[data-etapa]"));
  if (!canvas || !pasos.length) return;
  const ctx = canvas.getContext("2d");
  const N = 72;
  const SIZE = 520;
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Colores desde los tokens de la página ----------
  function tokens() {
    const cs = getComputedStyle(document.documentElement);
    return {
      ladrillo: cs.getPropertyValue("--ladrillo").trim() || "#c9683f",
      ladrillo2: cs.getPropertyValue("--ladrillo-2").trim() || "#8f6c54",
      barro: cs.getPropertyValue("--barro").trim() || "#d9b8a6",
      barro2: cs.getPropertyValue("--barro-2").trim() || "#b8927e",
      esmalte: cs.getPropertyValue("--esmalte").trim() || "#3f7a69",
      hoja: cs.getPropertyValue("--hoja").trim() || "#fffdf8",
      tinta: cs.getPropertyValue("--tinta").trim() || "#1d1b17",
      linea: cs.getPropertyValue("--linea").trim() || "#e2ddd2",
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
  function vasija() {
    // Perfil de una pieza torneada: cuello estrecho, cuerpo ancho, base.
    const pts = [];
    for (let i = 0; i < N; i++) {
      const t = i / N;
      // Recorre el contorno: lado derecho de arriba abajo, base, lado izquierdo de abajo arriba.
      let x, y;
      if (t < 0.45) { const u = t / 0.45; y = -150 + u * 300; x = perfil(u); }
      else if (t < 0.55) { const u = (t - 0.45) / 0.1; y = 150; x = perfil(1) * (1 - 2 * u); }
      else { const u = (t - 0.55) / 0.45; y = 150 - u * 300; x = -perfil(1 - u); }
      pts.push([x, y]);
    }
    return pts;
    function perfil(u) { return 70 + 80 * Math.sin(Math.PI * Math.pow(u, 0.9)) * (1 - 0.35 * u) + (u < 0.08 ? 10 : 0); }
  }
  const FORMAS = {
    ladrillo: rectRedondeado(330, 160, 6, 0, 0),
    masa: masa(150, 1.3),
    movil: rectRedondeado(170, 330, 34, 0, 0),
    burbuja: burbuja(),
    panel: rectRedondeado(340, 220, 16, 0, 0),
    vasija: vasija(),
  };
  // Etapas en orden y, para cada una, qué dibujar dentro.
  const ETAPAS = ["ladrillo", "ladrillo-gira", "masa", "movil", "burbuja", "panel", "horno", "vasija"];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function mezclar(A, B, t) { const o = []; for (let i = 0; i < N; i++) o.push([lerp(A[i][0], B[i][0], t), lerp(A[i][1], B[i][1], t)]); return o; }
  function suavizar(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function formaDe(etapa) {
    if (etapa === "ladrillo-gira" || etapa === "ladrillo") return FORMAS.ladrillo;
    if (etapa === "horno") return FORMAS.vasija;
    return FORMAS[etapa];
  }

  // ---------- Dibujo ----------
  function trazar(pts) {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const p = pts[i], q = pts[(i + 1) % N];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(p[0], p[1], mx, my);
    }
    const p = pts[0], q = pts[1];
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    ctx.closePath();
  }
  function detalles(etapa, alpha, giro) {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (etapa === "ladrillo" || etapa === "ladrillo-gira") {
      ctx.fillStyle = col.ladrillo2;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.roundRect(i * 92 - 30, -50, 60, 100, 4); ctx.fill(); }
    } else if (etapa === "movil") {
      ctx.fillStyle = col.hoja; ctx.beginPath(); ctx.roundRect(-72, -150, 144, 300, 26); ctx.fill();
      ctx.fillStyle = col.barro2; ctx.beginPath(); ctx.roundRect(-72, -150, 144, 120, 26); ctx.fill();
      ctx.fillStyle = col.barro2; ctx.globalAlpha = alpha * 0.45;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.roundRect(-56, -8 + i * 34, 112 - i * 20, 12, 6); ctx.fill(); }
      ctx.globalAlpha = alpha; ctx.fillStyle = col.esmalte; ctx.beginPath(); ctx.roundRect(-56, 104, 112, 26, 13); ctx.fill();
    } else if (etapa === "burbuja") {
      ctx.fillStyle = col.hoja; ctx.globalAlpha = alpha * 0.9;
      [[-120, -70, 150, 14], [-120, -40, 200, 14], [-120, -10, 120, 14], [-120, 30, 170, 14]].forEach(([x, y, w, h]) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, 7); ctx.fill(); });
      ctx.globalAlpha = alpha; ctx.fillStyle = col.esmalte; ctx.beginPath(); ctx.arc(110, 60, 9, 0, Math.PI * 2); ctx.fill();
    } else if (etapa === "panel") {
      ctx.fillStyle = col.hoja; ctx.globalAlpha = alpha * 0.9;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.roundRect(-150 + i * 102, -90, 92, 56, 8); ctx.fill(); }
      const barras = [38, 62, 48, 80, 70, 96, 88];
      ctx.fillStyle = col.esmalte;
      barras.forEach((b, i) => { ctx.beginPath(); ctx.roundRect(-146 + i * 42, 92 - b, 28, b, 5); ctx.fill(); });
    } else if (etapa === "horno" || etapa === "vasija") {
      // Brillo del esmalte.
      const g = ctx.createLinearGradient(-120, -150, 120, 150);
      g.addColorStop(0, "rgba(255,255,255,0.28)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,0.12)");
      ctx.fillStyle = g; trazar(FORMAS.vasija); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
      for (let y = -90; y <= 90; y += 45) { ctx.beginPath(); ctx.moveTo(-(60 + Math.abs(y) * 0.1), y); ctx.lineTo(60 + Math.abs(y) * 0.1, y); ctx.stroke(); }
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

    // Color: ladrillo cocido al principio, arcilla cruda al ablandarse, esmalte tras el horno.
    const iMasa = ETAPAS.indexOf("masa");
    const ablandado = Math.min(1, Math.max(0, progreso - (iMasa - 1)));
    const iHorno = ETAPAS.indexOf("horno");
    const cocido = Math.min(1, Math.max(0, progreso - iHorno + 0.2));
    let relleno = mezclarColor(col.ladrillo, col.barro, ablandado);
    if (cocido > 0) relleno = mezclarColor(col.barro, col.esmalte, cocido);

    ctx.save();
    ctx.translate(SIZE / 2, SIZE / 2);
    // El ladrillo gira al ablandarse; la masa respira un poco.
    const girando = ETAPAS[i] === "ladrillo-gira" ? t : (ETAPAS[i] === "ladrillo" ? 0 : 1);
    giro = girando * -0.35 + (ETAPAS[i] === "masa" ? Math.sin(Date.now() / 900) * 0.03 : 0);
    ctx.rotate(ETAPAS[j] === "masa" || ETAPAS[i] === "masa" ? giro : (ETAPAS[i] === "ladrillo-gira" ? giro : 0));
    // Sombra suave de la pieza sobre la mesa.
    ctx.save(); ctx.translate(0, 12); ctx.scale(1, 0.96); ctx.fillStyle = "rgba(29,27,23,0.10)"; trazar(pts); ctx.fill(); ctx.restore();
    ctx.fillStyle = relleno; trazar(pts); ctx.fill();
    // Detalles de la etapa saliente y la entrante.
    detalles(ETAPAS[i], 1 - t, giro);
    detalles(ETAPAS[j], t, giro);
    ctx.restore();
  }
  function mezclarColor(a, b, t) {
    const pa = hex(a), pb = hex(b);
    if (!pa || !pb) return t > 0.5 ? b : a;
    return `rgb(${Math.round(lerp(pa[0], pb[0], t))},${Math.round(lerp(pa[1], pb[1], t))},${Math.round(lerp(pa[2], pb[2], t))})`;
  }
  function hex(h) { const m = /^#([0-9a-f]{6})$/i.exec(h.trim()); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

  // ---------- Scroll → progreso ----------
  // Cada paso de texto lleva data-etapa. El progreso es la posición del centro de la
  // ventana respecto a los centros de los pasos, interpolada linealmente.
  function medir() {
    const centro = window.innerHeight * (window.innerWidth <= 860 ? 0.74 : 0.5);
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
