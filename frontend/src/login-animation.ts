/**
 * Animación de ensamblaje del imagotipo en el login / splash (Brilliant Minds Academy · suite Astra Academy).
 *
 * Tres capas vectoriales independientes, cada una con su ID único dentro del SVG:
 *   #bma-capa-estructura  → estructura base: desciende desde el tope con un leve desenfoque.
 *   #bma-capa-flecha      → flecha ascendente curva: entra en diagonal desde la esquina inferior izquierda.
 *   #bma-capa-pata        → pata de apoyo: se acopla desde el extremo inferior.
 * Al converger en el centro se «imantan» (rebote corto de acople, ya nítidas) y un destello lineal recorre el acabado metalizado.
 * La letra «A» de Astra se insinúa de forma sutil: la estructura base es el trazo de una «A» (vértice y patas), la flecha hace de
 * travesaño ascendente y, al terminar, la «A» del texto «Astra Academy» se tiñe con el acento de la marca.
 *
 * Técnica: transiciones/animaciones atómicas de Tailwind como propiedades arbitrarias (`[animation:…]`, `motion-reduce:…`) sobre cada
 * capa. Los @keyframes no se pueden expresar en clases de Tailwind, así que se registran UNA vez con `adoptedStyleSheets`
 * (CSSOM: no lo bloquea una CSP estricta de `style-src`; si el navegador no lo soporta se cae a un <style>).
 * Aceleración fluida: cubic-bezier(0.22, 1, 0.36, 1) (ease-out-quint). `prefers-reduced-motion`: sin movimiento, estado final inmediato.
 *
 * ⚠ GEOMETRÍA PROVISIONAL: los trazos son un imagotipo de reemplazo hasta recibir la marca final del cliente. Cuando llegue, solo
 * cambian las constantes `TRAZOS` (los `d` de los paths) y el degradado `METAL`; la coreografía, los IDs y la API no se tocan.
 */
import { html, montar, type HtmlSeguro } from './lib/html';

// ───────────────────────── Marca provisional (única parte a sustituir con la marca real) ─────────────────────────

const TRAZOS = {
  /** Estructura base: la «A» (vértice superior y dos patas). */
  estructura: 'M20 100 L60 18 L100 100',
  /** Flecha ascendente curva (travesaño de la «A») con su punta. */
  flecha: 'M32 84 C54 82 76 66 90 40 M78 42 L91 37 L93 51',
  /** Pata de apoyo: base sobre la que descansa la estructura. */
  pata: 'M46 108 L98 108',
} as const;

const METAL = { claro: '#e2e8f0', medio: '#94a3b8', oscuro: '#475569' } as const; // slate-200 / 400 / 600

// ───────────────────────── Coreografía ─────────────────────────

/** Milisegundos: cuándo empieza y cuánto dura cada fase. Todo se deriva de aquí. */
export const TIEMPOS = {
  estructura: { inicio: 0, duracion: 900 },
  flecha: { inicio: 120, duracion: 900 },
  pata: { inicio: 240, duracion: 900 },
  acople: { inicio: 1_140, duracion: 320 },
  destello: { inicio: 1_400, duracion: 850 },
  texto: { inicio: 1_700, duracion: 600 },
} as const;

/** Duración total hasta que el destello termina (para sincronizar el paso siguiente del splash). */
export const DURACION_TOTAL_MS = TIEMPOS.destello.inicio + TIEMPOS.destello.duracion;

export const KEYFRAMES_CSS = `
@keyframes bma-estructura-in {
  from { transform: translate(0px, -64px); filter: blur(6px); opacity: 0; }
  60%  { opacity: 1; }
  to   { transform: translate(0px, 0px); filter: blur(0px); opacity: 1; }
}
@keyframes bma-flecha-in {
  from { transform: translate(-56px, 56px); opacity: 0; }
  60%  { opacity: 1; }
  to   { transform: translate(0px, 0px); opacity: 1; }
}
@keyframes bma-pata-in {
  from { transform: translate(0px, 56px); opacity: 0; }
  60%  { opacity: 1; }
  to   { transform: translate(0px, 0px); opacity: 1; }
}
@keyframes bma-acople {
  0%   { transform: scale(1); }
  45%  { transform: scale(1.045); }
  100% { transform: scale(1); }
}
@keyframes bma-destello {
  from { transform: translateX(-70px) skewX(-18deg); opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  to   { transform: translateX(190px) skewX(-18deg); opacity: 0; }
}
@keyframes bma-texto-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0px); }
}
@keyframes bma-acento-a {
  from { color: inherit; }
  to   { color: #0369a1; }
}
`;

/**
 * Clases de Tailwind LITERALES. Tailwind solo genera el CSS de las clases que aparecen escritas tal cual en el código fuente
 * (escaneo de `./src/**\/*.ts`): componerlas con `${…}` en tiempo de ejecución haría que NO se generaran en producción.
 * Por eso cada animación va completa y los tiempos de `TIEMPOS` solo se usan en JS; `clasesCoherentes()` comprueba que ambos coinciden.
 * Forma: [animation:<keyframes>_<duración>_<curva>_<retardo>_both]  (los `_` son espacios en Tailwind).
 */
export const CLASES = {
  estructura: '[animation:bma-estructura-in_900ms_cubic-bezier(0.22,1,0.36,1)_0ms_both] motion-reduce:[animation:none] will-change-transform',
  flecha: '[animation:bma-flecha-in_900ms_cubic-bezier(0.22,1,0.36,1)_120ms_both] motion-reduce:[animation:none] will-change-transform',
  pata: '[animation:bma-pata-in_900ms_cubic-bezier(0.22,1,0.36,1)_240ms_both] motion-reduce:[animation:none] will-change-transform',
  acople: '[animation:bma-acople_320ms_cubic-bezier(0.22,1,0.36,1)_1140ms_both] motion-reduce:[animation:none]',
  destello: '[animation:bma-destello_850ms_cubic-bezier(0.22,1,0.36,1)_1400ms_both] motion-reduce:hidden opacity-0',
  texto: '[animation:bma-texto-in_600ms_cubic-bezier(0.22,1,0.36,1)_1700ms_both] motion-reduce:[animation:none]',
  acento: '[animation:bma-acento-a_600ms_cubic-bezier(0.22,1,0.36,1)_1700ms_both] motion-reduce:[animation:none]',
} as const;

/** `true` si la duración y el retardo escritos en cada clase literal coinciden con `TIEMPOS` (lo usan las pruebas). */
export function clasesCoherentes(): boolean {
  const pares: ReadonlyArray<readonly [string, { readonly inicio: number; readonly duracion: number }]> = [
    [CLASES.estructura, TIEMPOS.estructura],
    [CLASES.flecha, TIEMPOS.flecha],
    [CLASES.pata, TIEMPOS.pata],
    [CLASES.acople, TIEMPOS.acople],
    [CLASES.destello, TIEMPOS.destello],
    [CLASES.texto, TIEMPOS.texto],
    [CLASES.acento, TIEMPOS.texto],
  ];
  return pares.every(([clase, t]) => {
    const m = /\[animation:[\w-]+_(\d+)ms_cubic-bezier\(0\.22,1,0\.36,1\)_(\d+)ms_both\]/.exec(clase);
    return m !== null && Number(m[1]) === t.duracion && Number(m[2]) === t.inicio;
  });
}

// ───────────────────────── Registro único de keyframes ─────────────────────────

const ID_ESTILO = 'bma-login-keyframes';
let hojaRegistrada = false;

function registrarKeyframes(): void {
  if (hojaRegistrada || document.getElementById(ID_ESTILO) !== null) return;
  hojaRegistrada = true;
  try {
    const hoja = new CSSStyleSheet();
    hoja.replaceSync(KEYFRAMES_CSS);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, hoja];
    return;
  } catch {
    /* sin constructable stylesheets: se usa un <style> */
  }
  const estilo = document.createElement('style');
  estilo.id = ID_ESTILO;
  estilo.textContent = KEYFRAMES_CSS;
  document.head.append(estilo);
}

// ───────────────────────── Plantilla del logotipo ─────────────────────────

const reducirMovimiento = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function logotipoHtml(): HtmlSeguro {
  return html`<div class="relative mx-auto flex w-full max-w-xs flex-col items-center gap-3 text-slate-900" data-bma-logo>
    <svg viewBox="0 0 120 120" class="h-32 w-32 overflow-visible" role="img" aria-labelledby="bma-logo-titulo">
      <title id="bma-logo-titulo">Brilliant Minds Academy</title>
      <defs>
        <linearGradient id="bma-metal" gradientUnits="userSpaceOnUse" x1="14" y1="10" x2="106" y2="112">
          <stop offset="0" stop-color="${METAL.claro}" />
          <stop offset="0.45" stop-color="${METAL.medio}" />
          <stop offset="0.7" stop-color="${METAL.claro}" />
          <stop offset="1" stop-color="${METAL.oscuro}" />
        </linearGradient>
        <linearGradient id="bma-brillo" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="26" y2="0">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0" />
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
        <!-- Geometría estática (sin animar) reutilizada por la máscara del destello: el brillo solo se ve sobre el trazo. -->
        <path id="bma-forma-estructura" d="${TRAZOS.estructura}" />
        <path id="bma-forma-flecha" d="${TRAZOS.flecha}" />
        <path id="bma-forma-pata" d="${TRAZOS.pata}" />
        <mask id="bma-mascara-destello" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
          <g fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
            <use href="#bma-forma-estructura" /><use href="#bma-forma-flecha" /><use href="#bma-forma-pata" />
          </g>
        </mask>
      </defs>

      <g class="${CLASES.acople} origin-center [transform-box:fill-box]" fill="none" stroke="url(#bma-metal)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
        <g id="bma-capa-estructura" class="${CLASES.estructura}">
          <use href="#bma-forma-estructura" />
        </g>
        <g id="bma-capa-flecha" class="${CLASES.flecha}">
          <use href="#bma-forma-flecha" stroke-width="7" />
        </g>
        <g id="bma-capa-pata" class="${CLASES.pata}">
          <use href="#bma-forma-pata" stroke-width="7" />
        </g>
      </g>

      <g mask="url(#bma-mascara-destello)" aria-hidden="true">
        <rect id="bma-destello" x="0" y="0" width="26" height="120" fill="url(#bma-brillo)"
          class="${CLASES.destello}" />
      </g>
    </svg>
    <p class="text-center text-lg font-semibold tracking-tight ${CLASES.texto}" data-bma-texto>
      <span class="${CLASES.acento}" data-bma-acento>A</span>stra Academy
    </p>
  </div>`;
}

// ───────────────────────── API pública ─────────────────────────

export interface AnimacionLogin {
  /** Se cumple cuando termina el destello (o de inmediato con `prefers-reduced-motion`). */
  readonly terminada: Promise<void>;
  /** Vuelve a montar y reproducir la animación desde el principio. */
  repetir(): Promise<void>;
  /** Quita el logotipo del contenedor. */
  destruir(): void;
}

/**
 * Monta el logotipo animado dentro de `contenedor` y devuelve una promesa de fin de animación.
 * Uso en el login: `void montarAnimacionLogin(obtener('#login-logo', HTMLElement))`.
 */
export function montarAnimacionLogin(contenedor: HTMLElement): AnimacionLogin {
  registrarKeyframes();

  const reproducir = (): Promise<void> => {
    montar(contenedor, logotipoHtml());
    if (reducirMovimiento()) return Promise.resolve();
    const destello = contenedor.querySelector('#bma-destello');
    return new Promise<void>((resolver) => {
      // Respaldo por tiempo: si el navegador no dispara `animationend` (pestaña oculta, animaciones deshabilitadas) no se bloquea nada.
      const respaldo = window.setTimeout(resolver, DURACION_TOTAL_MS + 400);
      destello?.addEventListener(
        'animationend',
        () => {
          window.clearTimeout(respaldo);
          resolver();
        },
        { once: true },
      );
    });
  };

  const accion: AnimacionLogin = {
    terminada: reproducir(),
    repetir: reproducir,
    destruir: () => montar(contenedor, html``),
  };
  return accion;
}
