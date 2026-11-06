/**
 * Red neuronal interactiva del fondo del login (Canvas 2D, sin dependencias): nodos y partículas conectadas sobre el azul institucional.
 *  - ~1/3 de los nodos están «anclados» a una geometría abstracta de la letra «A» (dos diagonales y un travesaño) y vuelven a ella con un
 *    resorte muy débil: la forma se insinúa y se deshace, nunca se dibuja de forma literal.
 *  - El resto deriva libremente. Cerca del cursor (o del dedo) los nodos se sienten atraídos y se enlazan con él.
 *  - Respeta `prefers-reduced-motion` (un solo cuadro estático), se pausa con la pestaña oculta y se adapta a la densidad de píxeles.
 *  - Devuelve una función que la detiene y libera todos los listeners (se llama al salir de la pantalla de login).
 * Decorativo: el canvas va con `aria-hidden` y `pointer-events-none`; no recibe foco ni intercepta clics.
 */

interface Nodo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Ancla en la «A» (coordenadas normalizadas 0–1 del área del dibujo) o null si deriva libre. */
  ax: number | null;
  ay: number | null;
  r: number;
  cian: boolean;
}

const COLOR_LINEA = '255, 255, 255';
const COLOR_CIAN = '103, 232, 249'; // cyan-300: acento tecnológico
const DISTANCIA_ENLACE = 130;
const RADIO_CURSOR = 170;

/** Puntos de la «A»: pata izquierda, pata derecha y travesaño, en coordenadas 0–1 (la base ocupa ~60 % del alto). */
export function puntosDeLaA(cantidad: number): readonly (readonly [number, number])[] {
  const apice: readonly [number, number] = [0.5, 0.12];
  const izq: readonly [number, number] = [0.28, 0.88];
  const der: readonly [number, number] = [0.72, 0.88];
  const lerp = (a: readonly [number, number], b: readonly [number, number], t: number): readonly [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const porTramo = Math.max(2, Math.floor(cantidad / 3));
  const puntos: (readonly [number, number])[] = [];
  for (let i = 0; i < porTramo; i += 1) puntos.push(lerp(izq, apice, i / porTramo));
  for (let i = 0; i < porTramo; i += 1) puntos.push(lerp(apice, der, i / porTramo));
  const a = lerp(izq, apice, 0.58);
  const b = lerp(der, apice, 0.58);
  for (let i = 1; i < porTramo; i += 1) puntos.push(lerp(a, b, i / porTramo));
  return puntos;
}

function crearNodos(ancho: number, alto: number): Nodo[] {
  const total = Math.max(36, Math.min(110, Math.round((ancho * alto) / 11_000)));
  const lado = Math.min(ancho, alto) * 0.9;
  const x0 = (ancho - lado) / 2;
  const y0 = (alto - lado) / 2;
  const anclas = puntosDeLaA(Math.round(total / 3));
  const nodos: Nodo[] = [];
  for (const [nx, ny] of anclas) {
    const ax = x0 + nx * lado;
    const ay = y0 + ny * lado;
    nodos.push({ x: ax + (Math.random() - 0.5) * 90, y: ay + (Math.random() - 0.5) * 90, vx: 0, vy: 0, ax, ay, r: 1.8 + Math.random() * 1.4, cian: Math.random() < 0.3 });
  }
  while (nodos.length < total) {
    nodos.push({
      x: Math.random() * ancho, y: Math.random() * alto, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      ax: null, ay: null, r: 1.2 + Math.random() * 1.6, cian: Math.random() < 0.2,
    });
  }
  return nodos;
}

export function montarRedNeuronal(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ancho = 0;
  let alto = 0;
  let nodos: Nodo[] = [];
  let raf = 0;
  let activo = true;
  const cursor = { x: -9999, y: -9999, dentro: false };

  const ajustar = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = canvas.clientWidth;
    alto = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(ancho * dpr));
    canvas.height = Math.max(1, Math.round(alto * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nodos = crearNodos(ancho, alto);
  };

  const mover = (): void => {
    for (const n of nodos) {
      if (n.ax !== null && n.ay !== null) {
        n.vx += (n.ax - n.x) * 0.0016 + (Math.random() - 0.5) * 0.05;
        n.vy += (n.ay - n.y) * 0.0016 + (Math.random() - 0.5) * 0.05;
      }
      if (cursor.dentro) {
        const dx = cursor.x - n.x;
        const dy = cursor.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < RADIO_CURSOR && d > 1) {
          const f = (1 - d / RADIO_CURSOR) * 0.045;
          n.vx += (dx / d) * f * 6;
          n.vy += (dy / d) * f * 6;
        }
      }
      n.vx *= 0.94;
      n.vy *= 0.94;
      n.x += n.vx;
      n.y += n.vy;
      if (n.ax === null) {
        if (n.x < -20) n.x = ancho + 20;
        else if (n.x > ancho + 20) n.x = -20;
        if (n.y < -20) n.y = alto + 20;
        else if (n.y > alto + 20) n.y = -20;
        n.vx += (Math.random() - 0.5) * 0.02;
        n.vy += (Math.random() - 0.5) * 0.02;
      }
    }
  };

  const dibujar = (): void => {
    ctx.clearRect(0, 0, ancho, alto);
    for (let i = 0; i < nodos.length; i += 1) {
      const a = nodos[i];
      if (!a) continue;
      for (let j = i + 1; j < nodos.length; j += 1) {
        const b = nodos[j];
        if (!b) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < DISTANCIA_ENLACE) {
          ctx.strokeStyle = `rgba(${COLOR_LINEA}, ${(1 - d / DISTANCIA_ENLACE) * 0.28})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      if (cursor.dentro) {
        const d = Math.hypot(a.x - cursor.x, a.y - cursor.y);
        if (d < RADIO_CURSOR) {
          ctx.strokeStyle = `rgba(${COLOR_CIAN}, ${(1 - d / RADIO_CURSOR) * 0.55})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(cursor.x, cursor.y);
          ctx.stroke();
        }
      }
    }
    for (const n of nodos) {
      ctx.fillStyle = n.cian ? `rgba(${COLOR_CIAN}, 0.9)` : `rgba(${COLOR_LINEA}, 0.7)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const cuadro = (): void => {
    if (!activo) return;
    mover();
    dibujar();
    raf = window.requestAnimationFrame(cuadro);
  };

  const alMover = (ev: PointerEvent): void => {
    const r = canvas.getBoundingClientRect();
    cursor.x = ev.clientX - r.left;
    cursor.y = ev.clientY - r.top;
    cursor.dentro = true;
  };
  const alSalir = (): void => {
    cursor.dentro = false;
  };

  ajustar();
  window.addEventListener('resize', ajustar);
  window.addEventListener('pointermove', alMover, { passive: true });
  window.addEventListener('pointerleave', alSalir);
  document.addEventListener('mouseleave', alSalir);

  if (reducido) {
    // Sin animación: se asientan los nodos en su ancla y se pinta un único cuadro.
    for (const n of nodos) {
      if (n.ax !== null && n.ay !== null) {
        n.x = n.ax;
        n.y = n.ay;
      }
    }
    dibujar();
  } else {
    raf = window.requestAnimationFrame(cuadro);
  }

  return (): void => {
    activo = false;
    window.cancelAnimationFrame(raf);
    window.removeEventListener('resize', ajustar);
    window.removeEventListener('pointermove', alMover);
    window.removeEventListener('pointerleave', alSalir);
    document.removeEventListener('mouseleave', alSalir);
  };
}
