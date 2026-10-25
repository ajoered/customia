// Cerámica: pinta piezas de barro y de esmalte con volumen en un canvas 2D.
// La usan el torno (en vivo) y tools/piezas.html (para exportar los iconos y las imágenes).
//
// Una pieza es un contorno (Path2D) y un acabado:
//  - "barro": mate, con las motas de la chamota y un brillo suave.
//  - "esmalte": brillante, con un reflejo nítido.
// La luz viene siempre de arriba a la izquierda. Las sombras y los desenfoques de canvas no
// siguen la escala del contexto, así que se multiplican por dpr (píxeles reales por unidad).

(function (global) {
  "use strict";

  // Motas de la chamota: siempre las mismas, para que no bailen cuando la pieza se mueve.
  // Coordenadas en [-1, 1] respecto a la caja de la pieza.
  const MOTAS = (() => {
    let s = 20240611;
    const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const lista = [];
    for (let i = 0; i < 520; i++) lista.push([azar() * 2 - 1, azar() * 2 - 1, 0.45 + azar() * 1.25, azar() < 0.72]);
    return lista;
  })();

  function rgba(hex, a) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return `rgba(0,0,0,${a})`;
    const n = parseInt(m[1], 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // Una pieza con volumen. caja = { x, y, w, h } en unidades del contexto.
  // o: { color, acabado: "barro" | "esmalte", dpr, sombra (0 a 1), motas, anillos, brillo }
  function pieza(ctx, ruta, caja, o) {
    const dpr = o.dpr || 1;
    const R = Math.max(caja.w, caja.h) / 2;
    const esmalte = o.acabado === "esmalte";
    const sombra = o.sombra === undefined ? 1 : o.sombra;

    // Sombra sobre la mesa: suave, un poco por debajo de la pieza.
    if (sombra > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(28, 22, 16, ${0.30 * sombra})`;
      ctx.shadowBlur = R * 0.26 * dpr;
      ctx.shadowOffsetY = R * 0.07 * dpr;
      ctx.fillStyle = o.color;
      ctx.fill(ruta);
      ctx.restore();
    }
    ctx.fillStyle = o.color;
    ctx.fill(ruta);

    ctx.save();
    ctx.clip(ruta);
    // Volumen: luz arriba a la izquierda, penumbra abajo a la derecha.
    const g = ctx.createLinearGradient(caja.x, caja.y, caja.x + caja.w * 0.9, caja.y + caja.h);
    g.addColorStop(0, `rgba(255,255,255,${esmalte ? 0.20 : 0.15})`);
    g.addColorStop(0.45, "rgba(255,255,255,0)");
    g.addColorStop(1, `rgba(24,14,6,${esmalte ? 0.30 : 0.24})`);
    ctx.fillStyle = g;
    ctx.fillRect(caja.x - 4, caja.y - 4, caja.w + 8, caja.h + 8);

    // Canto redondeado: el borde se oscurece por dentro, como una pieza que se curva.
    ctx.save();
    ctx.lineWidth = R * 0.10;
    ctx.strokeStyle = `rgba(30,16,8,${esmalte ? 0.20 : 0.14})`;
    ctx.shadowColor = `rgba(30,16,8,${esmalte ? 0.30 : 0.22})`;
    ctx.shadowBlur = R * 0.16 * dpr;
    ctx.stroke(ruta);
    ctx.restore();

    // Anillos del torno: crestas horizontales muy suaves (luz arriba, sombra debajo).
    if (o.anillos) {
      ctx.lineWidth = Math.max(0.6, R * 0.008);
      for (let k = -4; k <= 4; k++) {
        const y = caja.y + caja.h * (0.5 + k * 0.095);
        const curva = caja.h * 0.025;
        ctx.strokeStyle = `rgba(255,255,255,${esmalte ? 0.10 : 0.09})`;
        ctx.beginPath(); ctx.moveTo(caja.x, y); ctx.quadraticCurveTo(caja.x + caja.w / 2, y + curva, caja.x + caja.w, y); ctx.stroke();
        ctx.strokeStyle = `rgba(30,16,8,${esmalte ? 0.10 : 0.08})`;
        ctx.beginPath(); ctx.moveTo(caja.x, y + 1.6); ctx.quadraticCurveTo(caja.x + caja.w / 2, y + curva + 1.6, caja.x + caja.w, y + 1.6); ctx.stroke();
      }
    }

    // Motas de la chamota. En el esmalte apenas asoman.
    if (o.motas !== false) {
      const cx = caja.x + caja.w / 2, cy = caja.y + caja.h / 2;
      const escala = Math.max(0.6, R / 150);
      for (const [x, y, r, oscura] of MOTAS) {
        ctx.fillStyle = oscura ? `rgba(60,34,18,${esmalte ? 0.05 : 0.20})` : `rgba(255,248,236,${esmalte ? 0.06 : 0.22})`;
        ctx.beginPath(); ctx.arc(cx + x * caja.w / 2, cy + y * caja.h / 2, r * escala, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Brillo: en el barro, un resplandor ancho y suave; en el esmalte, un reflejo nítido.
    const bx = caja.x + caja.w * 0.30, by = caja.y + caja.h * 0.22;
    if (esmalte) {
      let b = ctx.createRadialGradient(bx, by, 0, bx, by, R * 0.55);
      b.addColorStop(0, "rgba(255,255,255,0.28)"); b.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = b; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
      ctx.save();
      ctx.translate(bx, by); ctx.rotate(-0.6); ctx.scale(1, 0.42);
      b = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.16);
      b.addColorStop(0, `rgba(255,255,255,${0.75 * (o.brillo === undefined ? 1 : o.brillo)})`); b.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = b; ctx.beginPath(); ctx.arc(0, 0, R * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else {
      const b = ctx.createRadialGradient(bx, by, 0, bx, by, R * 0.7);
      b.addColorStop(0, `rgba(255,250,240,${0.22 * (o.brillo === undefined ? 1 : o.brillo)})`); b.addColorStop(1, "rgba(255,250,240,0)");
      ctx.fillStyle = b; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    }
    ctx.restore();
  }

  // Un hueco o una incrustación: la pieza se hunde, así que la sombra cae arriba a la izquierda.
  function hueco(ctx, ruta, caja, o) {
    const dpr = o.dpr || 1;
    const R = Math.max(caja.w, caja.h) / 2;
    ctx.save();
    ctx.fillStyle = o.color;
    ctx.fill(ruta);
    ctx.clip(ruta);
    if (o.acabado === "esmalte") {
      const g = ctx.createLinearGradient(caja.x, caja.y, caja.x + caja.w, caja.y + caja.h);
      g.addColorStop(0, "rgba(255,255,255,0.18)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    }
    // Sombra interior: se rellena todo menos el hueco, y solo se ve su sombra dentro.
    const fuera = new Path2D();
    fuera.rect(caja.x - R * 2, caja.y - R * 2, caja.w + R * 4, caja.h + R * 4);
    fuera.addPath(ruta);
    ctx.shadowColor = `rgba(30,16,8,${o.profundidad || 0.35})`;
    ctx.shadowBlur = Math.max(2, R * 0.12) * dpr;
    ctx.shadowOffsetX = Math.max(1, R * 0.035) * dpr;
    ctx.shadowOffsetY = Math.max(1.4, R * 0.05) * dpr;
    ctx.fillStyle = "#000";
    ctx.fill(fuera, "evenodd");
    ctx.restore();
  }

  // Un trazo de pincel: más grueso en el centro y afilado en los extremos, como la pincelada
  // de la loza. puntos en unidades del contexto; progreso de 0 a 1 (cuánto está pintado).
  function pincel(ctx, puntos, grosor, color, progreso) {
    if (progreso <= 0 || puntos.length < 2) return;
    const largos = [0];
    for (let i = 1; i < puntos.length; i++) largos.push(largos[i - 1] + Math.hypot(puntos[i][0] - puntos[i - 1][0], puntos[i][1] - puntos[i - 1][1]));
    const total = largos[largos.length - 1];
    const hasta = total * Math.min(1, progreso);
    ctx.fillStyle = color;
    const paso = Math.max(0.5, grosor * 0.18);
    let i = 1;
    for (let d = 0; d <= hasta; d += paso) {
      while (i < largos.length - 1 && largos[i] < d) i++;
      const t = (d - largos[i - 1]) / Math.max(1e-6, largos[i] - largos[i - 1]);
      const x = puntos[i - 1][0] + (puntos[i][0] - puntos[i - 1][0]) * t;
      const y = puntos[i - 1][1] + (puntos[i][1] - puntos[i - 1][1]) * t;
      const u = d / total;
      const r = grosor * (0.18 + 0.82 * Math.pow(Math.sin(Math.PI * u), 0.55)) / 2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---------- Pieza torneada: gres con un baño de esmalte reactivo ----------
  // Como las de los talleres de hoy: esmalte brillante que no llega al pie, con sus gotas, y abajo
  // el gres a la vista con las motas del hierro y los anillos del torno.
  // La pieza se ve un poco desde arriba: cada vuelta es la mitad de delante de una elipse de alto
  // VISTA × radio, y por arriba se ve la boca.
  const VISTA = 0.16;
  function azarDe(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  // Perfil por puntos [u, radio], con u de 0 (boca) a 1 (pie), suavizado con Catmull-Rom.
  function perfilDe(puntos) {
    return (u) => {
      u = Math.min(1, Math.max(0, u));
      let k = 0;
      while (k < puntos.length - 2 && puntos[k + 1][0] < u) k++;
      const p0 = puntos[Math.max(0, k - 1)][1], p1 = puntos[k][1], p2 = puntos[k + 1][1], p3 = puntos[Math.min(puntos.length - 1, k + 2)][1];
      const t = (u - puntos[k][0]) / (puntos[k + 1][0] - puntos[k][0]), t2 = t * t, t3 = t2 * t;
      return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    };
  }

  // perfil: una función r(u) o una lista de puntos [u, radio].
  function torneada(perfil, alto) {
    const r = typeof perfil === "function" ? perfil : perfilDe(perfil), y0 = -alto / 2, y1 = alto / 2;
    const Y = (u) => y0 + u * alto, U = (y) => (y - y0) / alto;
    const r0 = r(0), rb = r(1);
    let ancho = 0;
    for (let i = 0; i <= 50; i++) ancho = Math.max(ancho, r(i / 50));
    const caja = { x: -ancho, y: y0 - VISTA * r0, w: 2 * ancho, h: alto + VISTA * (r0 + rb) };
    // La vuelta a la altura y, en el punto x.
    const vuelta = (y, x) => { const a = r(U(y)); return y + VISTA * a * Math.sqrt(Math.max(0, 1 - (x / a) ** 2)); };

    // El contorno en el sentido del reloj desde arriba en el centro: borde de atrás de la boca,
    // lado derecho, pie y lado izquierdo.
    function contorno(n) {
      const p = [];
      for (let i = 20; i <= 40; i++) { const a = (i / 40) * Math.PI; p.push([-r0 * Math.cos(a), y0 - VISTA * r0 * Math.sin(a)]); }
      for (let i = 1; i <= 80; i++) { const u = i / 80; p.push([r(u), Y(u)]); }
      for (let i = 1; i < 40; i++) { const a = (i / 40) * Math.PI; p.push([rb * Math.cos(a), y1 + VISTA * rb * Math.sin(a)]); }
      for (let i = 80; i >= 0; i--) { const u = i / 80; p.push([-r(u), Y(u)]); }
      for (let i = 1; i < 20; i++) { const a = (i / 40) * Math.PI; p.push([-r0 * Math.cos(a), y0 - VISTA * r0 * Math.sin(a)]); }
      if (!n) return p;
      // Remuestrea a n puntos a la misma distancia.
      const largo = [0];
      for (let i = 1; i <= p.length; i++) { const a = p[i - 1], b = p[i % p.length]; largo.push(largo[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
      const total = largo[largo.length - 1], o = [];
      let j = 1;
      for (let k = 0; k < n; k++) {
        const d = (k / n) * total;
        while (largo[j] < d) j++;
        const a = p[j - 1], b = p[j % p.length], t = (d - largo[j - 1]) / (largo[j] - largo[j - 1] || 1);
        o.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
      return o;
    }
    const sil = new Path2D();
    contorno().forEach(([x, y], i) => (i ? sil.lineTo(x, y) : sil.moveTo(x, y)));
    sil.closePath();
    const boca = new Path2D();
    boca.ellipse(0, y0, r0, VISTA * r0, 0, 0, Math.PI * 2);

    // Las texturas se pintan una vez en un canvas aparte y luego solo se copian.
    const capas = {};
    function capa(nombre, dpr, pintar) {
      const clave = nombre + "|" + dpr;
      if (!capas[clave]) {
        const m = 6, c = document.createElement("canvas");
        c.width = Math.ceil((caja.w + 2 * m) * dpr); c.height = Math.ceil((caja.h + 2 * m) * dpr);
        const g = c.getContext("2d");
        g.scale(dpr, dpr); g.translate(m - caja.x, m - caja.y);
        pintar(g, dpr);
        capas[clave] = { c, x: caja.x - m, y: caja.y - m, w: c.width / dpr, h: c.height / dpr };
      }
      return capas[clave];
    }
    const poner = (ctx, k) => ctx.drawImage(k.c, k.x, k.y, k.w, k.h);
    const rect = (g, estilo) => { g.fillStyle = estilo; g.fillRect(caja.x - 6, caja.y - 6, caja.w + 12, caja.h + 12); };
    const vueltaRuta = (y, dy) => { const p = new Path2D(); for (let x = -ancho; x <= ancho; x += 3) (x === -ancho ? p.moveTo(x, vuelta(y, x) + dy) : p.lineTo(x, vuelta(y, x) + dy)); return p; };
    function motas(g, n, semilla, color, rmin, rmax, alfa) {
      const azar = azarDe(semilla);
      for (let i = 0; i < n; i++) {
        const x = (azar() * 2 - 1) * ancho, y = caja.y + azar() * caja.h, rr = rmin + azar() * (rmax - rmin);
        g.fillStyle = rgba(color, alfa * (0.5 + azar() * 0.5)); g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
      }
    }
    // Volumen de cilindro: luz por la izquierda, sombra a la derecha y abajo.
    function volumen(g, brillo) {
      const h = g.createLinearGradient(-ancho, 0, ancho, 0);
      h.addColorStop(0, "rgba(0,0,0,0.10)"); h.addColorStop(0.12, `rgba(255,255,255,${0.10 * brillo})`); h.addColorStop(0.32, `rgba(255,255,255,${0.06 * brillo})`);
      h.addColorStop(0.62, "rgba(0,0,0,0)"); h.addColorStop(0.9, "rgba(0,0,0,0.2)"); h.addColorStop(1, "rgba(0,0,0,0.32)");
      rect(g, h);
      const v = g.createLinearGradient(0, y0, 0, y1 + 20);
      v.addColorStop(0, "rgba(255,255,255,0.04)"); v.addColorStop(0.7, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.16)");
      rect(g, v);
    }
    // Lo que va encima del color del gres: anillos, motas de hierro, granos claros y volumen.
    const pintarGres = (o) => (g) => {
      for (let k = 0; k < 14; k++) {
        const y = y0 + ((k + 0.5) * alto) / 14;
        g.lineWidth = 0.9;
        g.strokeStyle = "rgba(255,255,255,0.10)"; g.stroke(vueltaRuta(y, 0));
        g.strokeStyle = "rgba(40,30,20,0.07)"; g.stroke(vueltaRuta(y, 1.4));
      }
      motas(g, 420, 7, o.motas, 0.35, 1.3, 0.75);
      motas(g, 160, 9, "#ffffff", 0.4, 1.0, 0.18);
      volumen(g, 0.6);
    };
    // El esmalte entero, como si cubriera toda la pieza: luego se recorta por la línea del baño.
    // Más oscuro junto a la boca, una franja clara a media altura (donde flota) y oscuro y grueso abajo.
    const pintarEsmalte = (o) => (g) => {
      const yN = Y(o.nivel), A = yN - y0;
      rect(g, o.esmalte);
      const v = g.createLinearGradient(0, y0, 0, yN + 24);
      v.addColorStop(0, rgba(o.oscuro, 0.30)); v.addColorStop(0.2, rgba(o.oscuro, 0.08));
      v.addColorStop(0.42, rgba(o.claro, 0.22)); v.addColorStop(0.6, rgba(o.claro, 0.12));
      v.addColorStop(0.8, rgba(o.oscuro, 0.12)); v.addColorStop(1, rgba(o.oscuro, 0.6));
      rect(g, v);
      const azar = azarDe(o.semilla || 3);
      // Moteado suave.
      for (let i = 0; i < 180; i++) {
        const x = (azar() * 2 - 1) * ancho, y = y0 - 10 + azar() * (A + 30), w = 8 + azar() * 16, c = azar() < 0.5 ? o.oscuro : o.claro;
        const m = g.createRadialGradient(x, y, 0, x, y, w);
        m.addColorStop(0, rgba(c, 0.05 + azar() * 0.06)); m.addColorStop(1, rgba(c, 0));
        g.fillStyle = m; g.beginPath(); g.arc(x, y, w, 0, Math.PI * 2); g.fill();
      }
      // Regueros: al fundirse, el esmalte corre hacia abajo.
      for (let i = 0; i < 46; i++) {
        const x = (azar() * 2 - 1) * ancho, y = y0 + A * (0.25 + azar() * 0.7), w = 1.2 + azar() * 3, h = 14 + azar() * 40;
        const oscura = azar() < 0.6, c = oscura ? o.oscuro : o.claro, a = oscura ? 0.26 : 0.22;
        const m = g.createLinearGradient(0, y - h, 0, y + h);
        m.addColorStop(0, rgba(c, 0)); m.addColorStop(0.6, rgba(c, a)); m.addColorStop(1, rgba(c, 0));
        g.fillStyle = m; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, Math.PI * 2); g.fill();
      }
      motas(g, 140, 11, o.motas, 0.4, 1.2, 0.55); // el hierro del gres asoma por el esmalte
      volumen(g, 1);
      // Reflejo de una ventana: una franja vertical que sigue la curva.
      const xr = -0.52, ref = new Path2D();
      for (let y = y0 + 8; y <= yN - 10; y += 3) ref.lineTo(r(U(y)) * xr - 7, y);
      for (let y = yN - 10; y >= y0 + 8; y -= 3) ref.lineTo(r(U(y)) * xr + 7, y);
      ref.closePath();
      const xm = r(U((y0 + yN) / 2)) * xr, b = g.createLinearGradient(xm - 8, 0, xm + 8, 0);
      b.addColorStop(0, "rgba(255,255,255,0)"); b.addColorStop(0.5, "rgba(255,255,255,0.4)"); b.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = b; g.fill(ref);
    };

    // o: { gres, motas, esmalte, oscuro, claro, nivel (u del baño), dpr, sombra (0 a 1),
    //      ruta (otra silueta para recortar, en el torno), cubre (0 a 1: cuánto ha bajado el esmalte),
    //      colgar (0 a 1: cuánto cuelgan las gotas), boca (0 a 1: cuánto se ve la boca), gotas, semilla }
    function dibujar(ctx, o) {
      const dpr = o.dpr || 1, ruta = o.ruta || sil;
      const sombra = o.sombra === undefined ? 1 : o.sombra;
      const cubre = o.cubre === undefined ? 1 : o.cubre, colgar = o.colgar === undefined ? 1 : o.colgar;
      const verBoca = o.boca === undefined ? 1 : o.boca;
      const gotas = o.gotas || [];
      if (sombra > 0) {
        ctx.save();
        ctx.shadowColor = `rgba(28,22,16,${0.28 * sombra})`; ctx.shadowBlur = ancho * 0.22 * dpr; ctx.shadowOffsetY = ancho * 0.08 * dpr;
        ctx.fillStyle = o.gres; ctx.fill(ruta);
        ctx.restore();
      }
      ctx.fillStyle = o.gres; ctx.fill(ruta);
      ctx.save();
      ctx.clip(ruta);
      poner(ctx, capa("gres" + o.motas, dpr, pintarGres(o)));

      // El baño: baja desde la boca hasta su nivel y al final cuelgan las gotas.
      const yN = Y(o.nivel), aN = r(o.nivel);
      if (cubre > 0) {
        const yB = (y0 - VISTA * r0 - 4) + (yN - (y0 - VISTA * r0 - 4)) * Math.min(1, cubre);
        const borde = (x) => {
          let y = yB + (cubre >= 1 ? VISTA * aN * Math.sqrt(Math.max(0, 1 - (x / aN) ** 2)) : VISTA * r(U(yB)) * Math.sqrt(Math.max(0, 1 - (x / r(U(yB))) ** 2)));
          for (const [x0, w, L] of gotas) { const t = (x - x0) / w; if (Math.abs(t) < 1) y += L * colgar * Math.sqrt(1 - t * t); }
          return y;
        };
        const linea = new Path2D(), zona = new Path2D();
        for (let x = -ancho - 2; x <= ancho + 2; x += 1) (x === -ancho - 2 ? linea.moveTo(x, borde(x)) : linea.lineTo(x, borde(x)));
        zona.moveTo(-ancho - 40, caja.y - 40); zona.lineTo(ancho + 40, caja.y - 40);
        for (let x = ancho + 2; x >= -ancho - 2; x -= 1) zona.lineTo(x, borde(x));
        zona.closePath();
        // El canto del esmalte es grueso: deja una sombra sobre el gres.
        ctx.strokeStyle = "rgba(30,20,10,0.10)"; ctx.lineWidth = 5;
        ctx.save(); ctx.translate(0.5, 2.6); ctx.stroke(linea); ctx.restore();
        ctx.strokeStyle = "rgba(30,20,10,0.14)"; ctx.lineWidth = 2.4;
        ctx.save(); ctx.translate(0.5, 1.8); ctx.stroke(linea); ctx.restore();
        ctx.save();
        ctx.clip(zona);
        poner(ctx, capa(["esmalte", o.esmalte, o.oscuro, o.claro, o.nivel, o.semilla].join(), dpr, pintarEsmalte(o)));
        ctx.strokeStyle = rgba(o.oscuro, 0.5); ctx.lineWidth = 2; ctx.stroke(linea);
        ctx.save(); ctx.translate(0, -2.2); ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.lineWidth = 1.2; ctx.stroke(linea); ctx.restore();
        // Brillo en las gotas grandes.
        if (colgar > 0.6) for (const [x0, w, L] of gotas) if (L > 8) {
          ctx.fillStyle = `rgba(255,255,255,${0.5 * (colgar - 0.6) / 0.4})`;
          ctx.beginPath(); ctx.ellipse(x0 - w * 0.3, borde(x0) - L * 0.28, w * 0.22, w * 0.32, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();

      // La boca: por dentro, gres crudo hasta que el esmalte la cubre. La pared del fondo
      // recibe la luz a la derecha.
      if (verBoca > 0) {
        ctx.save();
        ctx.globalAlpha = verBoca;
        ctx.clip(boca);
        ctx.fillStyle = o.gres; ctx.fill(boca);
        const dentro = Math.min(1, cubre / 0.25);
        if (dentro > 0) { ctx.globalAlpha = verBoca * dentro; ctx.fillStyle = o.esmalte; ctx.fill(boca); ctx.globalAlpha = verBoca; }
        const oscuro = dentro > 0.5 ? o.oscuro : "#3b2a1e";
        const i = ctx.createLinearGradient(-r0, 0, r0, 0);
        i.addColorStop(0, rgba(oscuro, 0.75)); i.addColorStop(0.55, rgba(oscuro, 0.35)); i.addColorStop(1, rgba(dentro > 0.5 ? o.claro : "#ffffff", 0.22));
        ctx.fillStyle = i; ctx.fill(boca);
        const b = ctx.createLinearGradient(0, y0 - VISTA * r0, 0, y0 + VISTA * r0);
        b.addColorStop(0, "rgba(0,0,0,0)"); b.addColorStop(1, "rgba(0,0,0,0.35)");
        ctx.fillStyle = b; ctx.fill(boca);
        ctx.restore();
        // El labio: el esmalte adelgaza y aclara en el borde de delante.
        ctx.save();
        ctx.globalAlpha = verBoca;
        ctx.lineCap = "round";
        ctx.strokeStyle = rgba(dentro > 0.5 ? o.claro : "#ffffff", dentro > 0.5 ? 0.85 : 0.4); ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.ellipse(0, y0, r0 - 1.5, VISTA * r0 - 1, 0, 0.04, Math.PI - 0.04); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(0, y0, r0 - 2, VISTA * r0 - 2, 0, Math.PI + 0.3, 2 * Math.PI - 0.3); ctx.stroke();
        ctx.restore();
      }
      // Canto de la silueta: se oscurece un poco por dentro, como una pieza que se curva.
      ctx.save();
      ctx.clip(ruta);
      ctx.strokeStyle = "rgba(20,14,8,0.16)"; ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(20,14,8,0.3)"; ctx.shadowBlur = 4 * dpr;
      ctx.stroke(ruta);
      ctx.restore();
    }

    return { r, Y, U, y0, y1, r0, ancho, caja, sil, boca, vista: VISTA, contorno, dibujar };
  }

  // La vasija de Arcilla: la del final del torno, el cierre, el logotipo y la imagen para compartir.
  // Cuello estrecho con el labio vuelto, cuerpo ancho y base; cabe en el espacio del torno
  // (ancho ±150, alto de -150 a 150). El esmalte llega hasta nivel y deja un poco de gres abajo.
  const perfilVasija = (u) => 70 + 80 * Math.sin(Math.PI * Math.pow(u, 0.9)) * (1 - 0.35 * u) + 10 * Math.pow(Math.max(0, 1 - u / 0.07), 0.5);
  const laVasija = () => Object.assign(torneada(perfilVasija, 300), { nivel: 0.8, gotas: [[-70, 5, 10], [-12, 6, 20], [44, 5, 8], [82, 5, 14]] });

  // Un contorno único alrededor de una línea central con grosor variable y puntas redondas.
  // puntos: la línea central; ancho(u): medio grosor en cada punto (u de 0 a 1).
  function tubo(puntos, ancho) {
    const n = puntos.length, izq = [], der = [];
    for (let i = 0; i < n; i++) {
      const a = puntos[Math.max(0, i - 1)], b = puntos[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l, ny = dx / l, w = ancho(i / (n - 1));
      izq.push([puntos[i][0] + nx * w, puntos[i][1] + ny * w]);
      der.push([puntos[i][0] - nx * w, puntos[i][1] - ny * w]);
    }
    const p = new Path2D();
    p.moveTo(izq[0][0], izq[0][1]);
    for (const q of izq) p.lineTo(q[0], q[1]);
    const fin = puntos[n - 1], ini = puntos[0];
    const angFin = Math.atan2(izq[n - 1][1] - fin[1], izq[n - 1][0] - fin[0]);
    p.arc(fin[0], fin[1], ancho(1), angFin, angFin - Math.PI, true);
    for (let i = n - 1; i >= 0; i--) p.lineTo(der[i][0], der[i][1]);
    const angIni = Math.atan2(der[0][1] - ini[1], der[0][0] - ini[0]);
    p.arc(ini[0], ini[1], ancho(0), angIni, angIni - Math.PI, true);
    p.closePath();
    return p;
  }

  global.Ceramica = { pieza, hueco, pincel, tubo, torneada, laVasija, perfilVasija, rgba };
})(window);
