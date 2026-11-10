/**
 * Intro de marca del login (splash): el isotipo de BMA nace del centro de la pantalla y, a continuación, el texto del logotipo se forma
 * desde el medio hacia los laterales. Al terminar, el velo se desvanece y se revela la tarjeta de cristal del formulario.
 *
 * Reparto de responsabilidades:
 *   · styles/main.css (bloque «Intro de marca del login») pone TODO el movimiento: escala, desaceleración (cubic-bezier), máscara `clip-path`
 *     y fundidos. Cada fase es un estado (`data-fase`) y el CSS anima las transiciones entre ellos.
 *   · Este módulo solo orquesta: espera a que las imágenes estén decodificadas, cambia de fase a su hora, ofrece omitir la intro y deja la
 *     pantalla lista (sin `inert`, sin velo). Los tiempos viven aquí (`MS`) y se publican al CSS como variables, así no pueden desincronizarse.
 *
 * Reglas de comportamiento:
 *   · Se reproduce UNA vez por carga de página: cerrar sesión o una sesión expirada dentro de la misma página no la repiten.
 *   · `prefers-reduced-motion: reduce` → no hay intro (no se crea el velo); el login aparece al instante.
 *   · Mientras dura, el formulario está `inert` (ni foco de teclado ni lectores de pantalla); el velo es decorativo (`aria-hidden`).
 *   · Se puede omitir con un clic/toque o con Escape, Enter o Espacio.
 *   · Cancelable: si la pantalla se sustituye (p. ej. se entra al panel) se retira el velo y se restaura todo sin esperar.
 *
 * El texto del logotipo y el isotipo son los activos oficiales (`src/assets/bma-texto.png`, `src/assets/bma-isotipo.png`); Vite los emite con hash.
 * Las clases las escribe aquí literalmente: el CSS de la intro es plano (fuera de `@layer`), así que no depende de que Tailwind las detecte.
 */
import { html, montar } from './lib/html';
import isotipoBma from './assets/bma-isotipo.png';
import textoBma from './assets/bma-texto.png';

/** Dimensiones intrínsecas de cada PNG: reservan el espacio antes de cargar (sin saltos de maquetación). */
const DIM_ISOTIPO = { ancho: 2167, alto: 2099 } as const;
const DIM_TEXTO = { ancho: 4111, alto: 698 } as const;

/** Duraciones en ms. Se publican al CSS como `--intro-ms-*`; el CSS no las repite. */
const MS = {
  isotipo: 700, // escala 0 → 100 % con desaceleración
  texto: 800, // el texto se abre desde el centro (y el isotipo sube para dejarle sitio)
  pausa: 450, // la marca completa se queda a la vista antes de despedirse
  salida: 450, // el velo se desvanece
  tarjeta: 600, // la tarjeta del formulario se revela
  retrasoTarjeta: 150, // la tarjeta empieza cuando los logotipos del velo ya casi se han apagado (sin doble exposición)
} as const;

/** Si las imágenes tardan más que esto en decodificarse (red lenta), la intro arranca igualmente. */
const MS_MAX_CARGA = 1500;

type Fase = 'preparando' | 'isotipo' | 'texto' | 'salida';
type Estado = 'activa' | 'saltada' | 'saliendo' | 'cancelada' | 'terminada';

export interface IntroLogin {
  /** Resuelve `true` cuando el login quedó listo para usarse (intro completa, omitida o inexistente); `false` si se canceló. */
  readonly lista: Promise<boolean>;
  /** Retira el velo y restaura la pantalla de inmediato. Idempotente. */
  cancelar(): void;
}

/** Una vez por carga de página (estado en memoria: una recarga completa vuelve a mostrarla). */
let yaMostrada = false;

const INTRO_OMITIDA: IntroLogin = { lista: Promise.resolve(true), cancelar: () => undefined };

function prefiereMenosMovimiento(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Espera `maxMs` como mucho a que todas las imágenes estén decodificadas; una que falle no bloquea la intro. */
async function imagenesListas(imagenes: readonly HTMLImageElement[], maxMs: number): Promise<void> {
  const decodificadas = Promise.all(imagenes.map((img) => img.decode().catch(() => undefined)));
  const limite = new Promise<void>((resolver) => {
    window.setTimeout(resolver, maxMs);
  });
  await Promise.race([decodificadas, limite]);
}

/** Espera cancelable: `despertar()` resuelve de inmediato la espera en curso (omitir / cancelar). */
function crearEspera(): { esperar(ms: number): Promise<void>; despertar(): void } {
  let pendiente: { readonly id: number; readonly resolver: () => void } | null = null;
  return {
    esperar: (ms) =>
      new Promise<void>((resolver) => {
        const id = window.setTimeout(() => {
          pendiente = null;
          resolver();
        }, ms);
        pendiente = { id, resolver };
      }),
    despertar: () => {
      if (!pendiente) return;
      const { id, resolver } = pendiente;
      pendiente = null;
      window.clearTimeout(id);
      resolver();
    },
  };
}

function crearVelo(): HTMLElement {
  const velo = document.createElement('div');
  velo.className = 'intro-login';
  velo.dataset['fase'] = 'preparando' satisfies Fase;
  velo.setAttribute('aria-hidden', 'true');
  velo.style.setProperty('--intro-ms-isotipo', `${MS.isotipo}ms`);
  velo.style.setProperty('--intro-ms-texto', `${MS.texto}ms`);
  velo.style.setProperty('--intro-ms-salida', `${MS.salida}ms`);
  // Imágenes decorativas (`alt=""`): el nombre de la academia lo da el <h1> de la tarjeta del formulario.
  montar(
    velo,
    html`<img class="intro-login__isotipo" src="${isotipoBma}" alt="" width="${DIM_ISOTIPO.ancho}" height="${DIM_ISOTIPO.alto}" decoding="async" fetchpriority="high">
    <img class="intro-login__texto" src="${textoBma}" alt="" width="${DIM_TEXTO.ancho}" height="${DIM_TEXTO.alto}" decoding="async" fetchpriority="high">`,
  );
  return velo;
}

/**
 * Reproduce la intro sobre la pantalla de login ya montada.
 * @param pantalla Contenedor del login (el `<main>`); debe contener un elemento `[data-intro-revelar]` (la tarjeta que se revela).
 */
export function iniciarIntroLogin(pantalla: HTMLElement): IntroLogin {
  if (yaMostrada || prefiereMenosMovimiento()) return INTRO_OMITIDA;
  yaMostrada = true;

  const velo = crearVelo();
  const imagenes = Array.from(velo.querySelectorAll('img'));
  const espera = crearEspera();
  const escuchas = new AbortController();
  let estado: Estado = 'activa';
  // Se resuelve al omitir o cancelar: corta también la espera de carga de imágenes (que no pasa por `espera`).
  let avisarCorte: () => void = () => undefined;
  const corte = new Promise<void>((resolver) => {
    avisarCorte = resolver;
  });
  // Lectura a través de una función: TypeScript estrecha `estado` tras cada asignación y no vería los cambios hechos por omitir()/cancelar().
  const estaEn = (...posibles: readonly Estado[]): boolean => posibles.includes(estado);

  const poner = (fase: Fase): void => {
    velo.dataset['fase'] = fase;
  };

  /** Retira el velo y devuelve la pantalla a su estado normal. Seguro de llamar más de una vez. */
  const limpiar = (): void => {
    escuchas.abort();
    velo.remove();
    pantalla.inert = false;
    delete pantalla.dataset['intro'];
    pantalla.style.removeProperty('--intro-ms-tarjeta');
    pantalla.style.removeProperty('--intro-retraso-tarjeta');
  };

  const omitir = (): void => {
    if (!estaEn('activa')) return;
    estado = 'saltada';
    avisarCorte();
    espera.despertar();
  };

  pantalla.inert = true;
  pantalla.dataset['intro'] = 'activa';
  pantalla.style.setProperty('--intro-ms-tarjeta', `${MS.tarjeta}ms`);
  pantalla.style.setProperty('--intro-retraso-tarjeta', `${MS.retrasoTarjeta}ms`);
  document.body.append(velo);
  velo.addEventListener('pointerdown', omitir, { signal: escuchas.signal });
  document.addEventListener(
    'keydown',
    (ev) => {
      if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') omitir();
    },
    { signal: escuchas.signal },
  );

  const reproducir = async (): Promise<boolean> => {
    await Promise.race([imagenesListas(imagenes, MS_MAX_CARGA), corte]);
    // Fuerza un recálculo de estilos para que la fase 'preparando' se pinte antes de la primera transición.
    void velo.offsetWidth;
    const pasos: readonly { readonly fase: Fase; readonly ms: number }[] = [
      { fase: 'isotipo', ms: MS.isotipo },
      { fase: 'texto', ms: MS.texto + MS.pausa },
    ];
    for (const paso of pasos) {
      if (!estaEn('activa')) break;
      poner(paso.fase);
      await espera.esperar(paso.ms);
    }
    if (estaEn('cancelada')) return false;
    // Salida (por fin de la secuencia o por omisión): el velo se desvanece y la tarjeta se revela. La pantalla sigue `inert` hasta que
    // termina la revelación: si se retirase `data-intro` antes, la tarjeta saltaría de golpe a opaca a mitad de su animación.
    estado = 'saliendo';
    poner('salida');
    pantalla.dataset['intro'] = 'revelar';
    await espera.esperar(MS.retrasoTarjeta + MS.tarjeta);
    if (estaEn('cancelada')) return false;
    estado = 'terminada';
    limpiar();
    return true;
  };

  // Un splash decorativo jamás debe dejar el login bloqueado: ante cualquier fallo inesperado se retira el velo y se sigue.
  const lista = reproducir().catch(() => {
    estado = 'terminada';
    limpiar();
    return true;
  });
  return {
    lista,
    cancelar: () => {
      if (estaEn('cancelada', 'terminada')) return;
      estado = 'cancelada';
      avisarCorte();
      espera.despertar();
      limpiar();
    },
  };
}
