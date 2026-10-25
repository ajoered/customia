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

  // La decoración de la vasija terminada, a pincel, en el espacio de la vasija del torno
  // (ancho ±150, alto de -150 a 150). Devuelve una lista de [puntos, grosor].
  function decoracionVasija(perfil) {
    const trazos = [];
    const linea = (y, onda, desfase, margen) => {
      const ancho = perfil((y + 150) / 300) - margen;
      const p = [];
      for (let x = -ancho; x <= ancho + 0.1; x += 4) {
        const curva = 7 * (1 - Math.pow(x / ancho, 2));
        p.push([x, y + curva + onda * Math.sin(x / 11 + desfase)]);
      }
      return p;
    };
    // Cenefas del cuello y de la base.
    trazos.push([linea(-112, 0.6, 0, 12), 4.2]);
    trazos.push([linea(-98, 0.6, 1, 12), 2.6]);
    trazos.push([linea(104, 4.5, 0.4, 14), 3.4]);
    trazos.push([linea(122, 0.5, 2, 16), 2.4]);
    // Una flor en el centro, como las de Talavera: ocho pétalos rectos alrededor de un botón,
    // y dos hojas que salen hacia abajo.
    const cx = 0, cy = -10;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8;
      trazos.push([[[cx + Math.cos(a) * 13, cy + Math.sin(a) * 13], [cx + Math.cos(a) * 40, cy + Math.sin(a) * 40]], 12]);
    }
    const boton = [];
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.5) boton.push([cx + Math.cos(a) * 2, cy + Math.sin(a) * 2]);
    trazos.push([boton, 11]);
    const hoja = (sx) => {
      const p = [];
      for (let s = 0; s <= 1.0001; s += 0.1) p.push([cx + sx * (30 + 48 * s), cy + 44 + 26 * s - 10 * Math.sin(s * Math.PI)]);
      return p;
    };
    trazos.push([hoja(1), 13]);
    trazos.push([hoja(-1), 13]);
    // Puntos sueltos.
    for (const [x, y] of [[-78, -52], [78, -52], [-104, 14], [104, 14], [0, 64]]) {
      const p = [];
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.6) p.push([x + Math.cos(a) * 1.2, y + Math.sin(a) * 1.2]);
      trazos.push([p, 7]);
    }
    return trazos;
  }

  // Pinta la decoración con un progreso común: los trazos salen uno detrás de otro.
  function decorar(ctx, trazos, color, progreso) {
    const n = trazos.length;
    trazos.forEach(([p, g], i) => pincel(ctx, p, g, color, progreso * n - i));
  }

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

  global.Ceramica = { pieza, hueco, pincel, tubo, decoracionVasija, decorar, rgba };
})(window);
