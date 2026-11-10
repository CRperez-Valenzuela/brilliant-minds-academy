/**
 * Marca de Brilliant Minds Academy: ÚNICO punto del frontend que muestra el logotipo.
 *
 * Es la identidad oficial de la academia; no hay logotipos de terceros en el panel. Los activos viven en `src/assets/` y se
 * importan para que Vite los emita con hash (caché inmutable de /assets):
 *   · bma-logo.webp    → logotipo completo (isotipo + nombre + lema), recortado a su contenido y reducido a 800 px de ancho.
 *   · bma-isotipo.webp → solo el círculo con la estrella, cuadrado de 256 px: es la versión del menú lateral contraído.
 *   · bma-isotipo.png  → el mismo isotipo en alta resolución (2167×2099): cabecera de la planilla pública de admisión.
 * Ambos conservan el canal alfa de la marca (sin fondo), así que se ven bien sobre superficies blancas o azul muy tenue.
 *
 * Las clases las pasa quien llama, escritas literalmente en su propio archivo: Tailwind solo genera las utilidades que ve
 * escritas tal cual en el código fuente (componerlas aquí dentro con `${…}` impediría que se generaran en producción).
 */
import { html, type HtmlSeguro } from './html';
import logoCompleto from '../assets/bma-logo.webp';
import isotipo from '../assets/bma-isotipo.webp';
import isotipoGrande from '../assets/bma-isotipo.png';

export const NOMBRE_ACADEMIA = 'Brilliant Minds Academy';

/** Dimensiones intrínsecas de cada archivo: reservan el espacio antes de cargar (sin saltos de maquetación). */
const DIM_LOGO = { ancho: 800, alto: 735 } as const;
const DIM_ISOTIPO = { ancho: 256, alto: 256 } as const;
const DIM_ISOTIPO_GRANDE = { ancho: 2167, alto: 2099 } as const;

/** Logotipo oficial completo. `prioritario` solo para el que está en el primer pantallazo (login). */
export function logoCompletoHtml(clases: string, prioritario = false): HtmlSeguro {
  return html`<img src="${logoCompleto}" alt="${NOMBRE_ACADEMIA}" width="${DIM_LOGO.ancho}" height="${DIM_LOGO.alto}" decoding="async" fetchpriority="${prioritario ? 'high' : 'auto'}" class="${clases}">`;
}

/** Isotipo (círculo y estrella) para espacios estrechos, como el menú lateral contraído. */
export function isotipoHtml(clases: string): HtmlSeguro {
  return html`<img src="${isotipo}" alt="${NOMBRE_ACADEMIA}" width="${DIM_ISOTIPO.ancho}" height="${DIM_ISOTIPO.alto}" decoding="async" class="${clases}">`;
}

/**
 * Cabecera de la planilla pública de admisión: el isotipo circular de BMA es el ÚNICO logotipo y va centrado, para darle todo el protagonismo
 * a la academia. Misma tarjeta blanca que la cabecera del portal, de modo que las dos vistas públicas comparten superficie.
 * El nombre de la academia lo dan el `alt` de la imagen y el título que sigue en la planilla.
 */
export function cabeceraIsotipoHtml(): HtmlSeguro {
  return html`<div class="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <img src="${isotipoGrande}" alt="${NOMBRE_ACADEMIA}" width="${DIM_ISOTIPO_GRANDE.ancho}" height="${DIM_ISOTIPO_GRANDE.alto}" decoding="async" fetchpriority="high" class="h-20 w-auto object-contain sm:h-24">
  </div>`;
}
