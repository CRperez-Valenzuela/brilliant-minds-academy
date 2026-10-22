/**
 * Sanitización contra XSS.
 *
 * `esc()` escapa `& < > " ' \`` y es la ÚNICA función que convierte datos dinámicos en texto HTML.
 * La etiqueta `html` la aplica automáticamente a CADA valor interpolado en una plantilla literal, así que
 * un dato del formulario público (no confiable) no puede llegar al DOM sin pasar por `esc()`:
 * solo se inserta tal cual lo que ya es `HtmlSeguro` (resultado de otra plantilla `html` o de `raw()`).
 * Todos los atributos de las plantillas van entre comillas dobles, de modo que `"` escapado no puede cerrarlos.
 */

const ENTIDADES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

export function esc(valor: unknown): string {
  return String(valor ?? '').replace(/[&<>"'`]/g, (c) => ENTIDADES[c] ?? c);
}

/** Fragmento HTML ya saneado (o constante de confianza). Su constructor no es público a propósito: usa `html` o `raw`. */
export class HtmlSeguro {
  readonly valor: string;
  constructor(valor: string) {
    this.valor = valor;
  }
  toString(): string {
    return this.valor;
  }
}

export type Interpolable = string | number | boolean | null | undefined | HtmlSeguro | readonly Interpolable[];

function aTexto(v: Interpolable): string {
  if (v instanceof HtmlSeguro) return v.valor;
  if (Array.isArray(v)) return (v as readonly Interpolable[]).map(aTexto).join('');
  if (v === null || v === undefined) return ''; // los booleanos se imprimen como 'true'/'false' (atributos aria-*/data-*)
  return esc(v);
}

/** Plantilla literal con escape automático de todo lo interpolado. */
export function html(literales: TemplateStringsArray, ...valores: readonly Interpolable[]): HtmlSeguro {
  let salida = '';
  literales.forEach((trozo, i) => {
    salida += trozo;
    if (i < valores.length) salida += aTexto(valores[i] as Interpolable);
  });
  return new HtmlSeguro(salida);
}

/** SOLO para constantes del propio código (p. ej. el trazado de un SVG). Nunca con datos de la API ni del usuario. */
export function raw(constante: string): HtmlSeguro {
  return new HtmlSeguro(constante);
}

export function montar(elemento: Element, contenido: HtmlSeguro): void {
  elemento.innerHTML = contenido.valor;
}

/** Devuelve `url` solo si empieza por uno de los prefijos permitidos (evita `javascript:` en href). */
export function urlSegura(url: string, prefijosPermitidos: readonly string[]): string {
  return prefijosPermitidos.some((p) => url.startsWith(p)) ? url : '#';
}
