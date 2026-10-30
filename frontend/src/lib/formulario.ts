/**
 * Utilidades de formularios compartidas por las vistas de sedes e invitaciones (mismo comportamiento que facturación masiva).
 *  - Los errores por campo se asocian por el atributo `name` del control y por `data-error="<mismo nombre>"` del párrafo de error;
 *    los mensajes se escriben con `textContent`, nunca como HTML.
 *  - `.msg` (+ `.okk` | `.inf` | `.err`) está definido en styles/main.css.
 */
import { BmaApiError } from '../api/bmaClient';
import { html, montar } from './html';
import { buscar, obtener, todos } from './ui';

/** Pinta (o limpia, con `{}`) los errores por campo y enfoca el primer control inválido. */
export function pintarErrores(form: HTMLFormElement, errores: Readonly<Record<string, string>>): void {
  for (const el of todos('[data-error]', HTMLElement, form)) {
    const mensaje = errores[el.dataset['error'] ?? ''] ?? '';
    el.textContent = mensaje;
    el.hidden = mensaje === '';
  }
  for (const control of todos('[name]', HTMLElement, form)) {
    if ((errores[control.getAttribute('name') ?? ''] ?? '') !== '') control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  }
  buscar('[aria-invalid="true"]', HTMLElement, form)?.focus();
}

/** Aviso en línea con rol accesible; el texto se asigna con `textContent` (el mensaje puede venir del servidor). */
export function mostrarMensaje(salida: HTMLElement, tono: 'okk' | 'inf' | 'err', texto: string): void {
  montar(salida, html`<p class="msg ${tono}" role="${tono === 'err' ? 'alert' : 'status'}" tabindex="-1"></p>`);
  const p = obtener('.msg', HTMLElement, salida);
  p.textContent = texto;
  p.focus();
}

/** Errores 422 VALIDACION del servidor (`[{campo, mensaje}]`) como mapa campo → mensaje; `null` si el error no trae campos. */
export function erroresDeCampos(e: unknown): Readonly<Record<string, string>> | null {
  if (!(e instanceof BmaApiError)) return null;
  const campos = e.camposInvalidos();
  return campos.length > 0 ? Object.fromEntries(campos.map((c) => [c.campo, c.mensaje])) : null;
}

/** Valor de un `<input>` o `<select>` del formulario por su `name` ('' si no existe o es de otro tipo). */
export function valorDe(form: HTMLFormElement, nombre: string): string {
  const control = form.elements.namedItem(nombre);
  return control instanceof HTMLInputElement || control instanceof HTMLSelectElement ? control.value : '';
}
