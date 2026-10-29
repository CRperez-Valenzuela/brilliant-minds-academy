/**
 * Vista «Ficha del estudiante» — PARTE INTEGRAL DEL CORE BASE (US$ 750): sin candados premium.
 *  - Consume el endpoint existente  GET  /api/estudiantes/:id   (estudiante + estado dinámico + representante + cuotas + documentos + pagos).
 *  - Secciones: datos académicos, ficha médica, expediente digitalizado en Google Drive, representante.
 *  - Dos tablas simétricas (mismas 5 columnas, mismo estilo): histórico de cuotas y bandeja de pagos declarados por el representante.
 *  - «Retirar Estudiante»  → modal con motivo OBLIGATORIO (1–300 caracteres) y fecha de retiro → POST /api/estudiantes/:id/retirar
 *    «Reactivar Estudiante» → confirmación → POST /api/estudiantes/:id/reactivar
 *    Tras cada acción se vuelve a leer la ficha y se repinta en el mismo sitio (estado, tablas y botones cambian sin recargar la página).
 *
 * Todo texto dinámico pasa por la etiqueta `html` (escape XSS automático); los enlaces de Drive solo se aceptan si son https de Google.
 */
import { bma, BmaSesionExpiradaError, mensajeDeError } from './api/bmaClient';
import { HtmlSeguro, html, montar, urlSegura } from './lib/html';
import { icono } from './lib/icons';
import { bs, esVencida, fechaCorta, fechaHora, hoyCaracas, nombreMetodo, usd } from './lib/format';
import { CLS, abrirModal, aviso, boton, buscar, conBotonOcupado, etiqueta, etiquetaEstado, notificar, obtener, type Modal } from './lib/ui';
import type {
  CuerpoRetiro,
  CuotaEstudiante,
  DetalleEstudiante,
  DocumentoEstudiante,
  PagoEstudiante,
  RespuestaCambioEstatus,
  TipoDocumentoEstudiante,
} from './types/index';

// ───────────────────────── Contexto y constantes ─────────────────────────

export interface ContextoDetalleEstudiante {
  readonly zona: HTMLElement;
  /** `false` cuando el usuario ya navegó a otra sección: ninguna respuesta tardía debe pintar encima. */
  readonly vigente: () => boolean;
  readonly estudianteId: number;
  readonly alVolver: () => void;
  readonly alSesionExpirada: () => void;
}

const MAX_MOTIVO = 300;
const PREFIJOS_DRIVE: readonly string[] = ['https://drive.google.com/', 'https://docs.google.com/'];
const SIN_DATO = 'Sin registrar';

const NOMBRE_DOCUMENTO: Readonly<Record<TipoDocumentoEstudiante, string>> = {
  FOTO_CARNET: 'Foto carnet',
  CEDULA_IDENTIDAD: 'Cédula de identidad',
  ACTA_NACIMIENTO: 'Acta de nacimiento',
};

const NOMBRE_TIPO_CUOTA: Readonly<Record<CuotaEstudiante['tipo'], string>> = {
  MATRICULA: 'Matrícula',
  MENSUALIDAD: 'Mensualidad',
  OTRO: 'Otro',
};

// ───────────────────────── Utilidades puras ─────────────────────────

/** Años cumplidos a la fecha `hoy` (ambas 'AAAA-MM-DD'); `null` si alguna no tiene el formato esperado. */
export function edadEnAnios(nacimiento: string, hoy: string): number | null {
  const n = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nacimiento);
  const h = /^(\d{4})-(\d{2})-(\d{2})$/.exec(hoy);
  if (!n || !h) return null;
  const [, ny, nm, nd] = n.map(Number);
  const [, hy, hm, hd] = h.map(Number);
  if (ny === undefined || nm === undefined || nd === undefined || hy === undefined || hm === undefined || hd === undefined) return null;
  const edad = hy - ny - (hm < nm || (hm === nm && hd < nd) ? 1 : 0);
  return edad >= 0 ? edad : null;
}

export function tamanoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Devuelve la URL solo si es un enlace https de Google (evita `javascript:` y destinos ajenos en el href). */
export function enlaceDrive(url: string | null): string | null {
  if (url === null || url === '') return null;
  const segura = urlSegura(url, PREFIJOS_DRIVE);
  return segura === '#' ? null : segura;
}

const valorOSinDato = (v: string | null): string => (v !== null && v.trim() !== '' ? v : SIN_DATO);

// ───────────────────────── Bloques de la ficha ─────────────────────────

function dato(titulo: string, valor: string | null | HtmlSeguro): HtmlSeguro {
  const contenido = valor instanceof HtmlSeguro ? valor : valorOSinDato(valor);
  const vacio = valor === null || (typeof valor === 'string' && valor.trim() === '');
  return html`<div class="min-w-0"><dt class="text-xs font-semibold uppercase tracking-wide text-slate-600">${titulo}</dt>
    <dd class="mt-1 break-words text-sm ${vacio ? 'text-slate-600' : 'font-medium text-slate-900'}">${contenido}</dd></div>`;
}

function tituloSeccion(id: string, texto: string, ic: Parameters<typeof icono>[0]): HtmlSeguro {
  return html`<h2 id="${id}" class="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${icono(ic, 'h-4 w-4')}</span>${texto}</h2>`;
}

function seccionAcademica(d: DetalleEstudiante): HtmlSeguro {
  const edad = edadEnAnios(d.fecha_nacimiento, hoyCaracas());
  return html`<section class="${CLS.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-academico">
    ${tituloSeccion('t-academico', 'Información académica', 'school')}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${dato('Grado', d.grado_solicitado)}
      ${dato('Cédula de identidad', d.cedula_identidad)}
      ${dato('Fecha de nacimiento', `${fechaCorta(d.fecha_nacimiento)}${edad !== null ? ` · ${edad} años` : ''}`)}
      ${dato('Colegio de procedencia', d.colegio_procedencia)}
      ${dato('Último grado aprobado', d.ultimo_grado_aprobado)}
      ${dato('Inscrito', fechaHora(d.creado_en))}
    </dl>
  </section>`;
}

function seccionMedica(d: DetalleEstudiante): HtmlSeguro {
  const alerta = (v: string | null): HtmlSeguro | string | null => (v !== null && v.trim() !== '' ? html`${etiqueta('Atención', 'warn')} <span class="ml-1">${v}</span>` : null);
  return html`<section class="${CLS.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-medico">
    ${tituloSeccion('t-medico', 'Datos médicos', 'heart')}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${dato('Tipo de sangre', d.tipo_sangre)}
      ${dato('Alergias', alerta(d.alergias) ?? SIN_DATO)}
      ${dato('Condiciones médicas', alerta(d.condiciones_medicas) ?? SIN_DATO)}
      ${dato('Medicamentos', d.medicamentos)}
      ${dato('Contacto de emergencia', d.emergencia_nombre)}
      ${dato('Teléfono de emergencia', d.emergencia_telefono)}
    </dl>
  </section>`;
}

function filaDocumento(doc: DocumentoEstudiante): HtmlSeguro {
  const enlace = enlaceDrive(doc.drive_url);
  return html`<li class="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
    <span class="min-w-0"><span class="block truncate text-sm font-medium text-slate-900">${NOMBRE_DOCUMENTO[doc.tipo]}</span>
      <span class="block truncate text-xs text-slate-600">${doc.nombre_archivo} · ${tamanoLegible(doc.tamano_bytes)}</span></span>
    ${enlace !== null
      ? html`<a href="${enlace}" target="_blank" rel="noopener noreferrer" class="${boton(CLS.btnSecundario, CLS.btnPeq)}" aria-label="Abrir ${NOMBRE_DOCUMENTO[doc.tipo]} en Google Drive">Abrir</a>`
      : etiqueta('Sin enlace', 'neutral')}
  </li>`;
}

function seccionDrive(d: DetalleEstudiante): HtmlSeguro {
  const carpeta = enlaceDrive(d.drive_folder_url);
  return html`<section class="${CLS.tarjeta} p-6" aria-labelledby="t-drive">
    ${tituloSeccion('t-drive', 'Expediente en Google Drive', 'folder')}
    ${carpeta !== null
      ? html`<a href="${carpeta}" target="_blank" rel="noopener noreferrer" class="${boton(CLS.btnPrimario, 'w-full')}">${icono('folder', 'h-4 w-4')}<span>Abrir expediente digitalizado</span></a>`
      : aviso('info', 'Este estudiante aún no tiene una carpeta de expediente en Google Drive.')}
    ${d.drive_folder_id !== null ? html`<p class="${CLS.ayuda}">ID de carpeta: <span class="break-all font-mono">${d.drive_folder_id}</span></p>` : null}
    ${d.documentos.length > 0
      ? html`<ul class="mt-4" aria-label="Documentos digitalizados">${d.documentos.map(filaDocumento)}</ul>`
      : html`<p class="mt-4 text-sm text-slate-600">Sin documentos digitalizados.</p>`}
  </section>`;
}

function seccionRepresentante(d: DetalleEstudiante): HtmlSeguro {
  return html`<section class="${CLS.tarjeta} p-6" aria-labelledby="t-representante">
    ${tituloSeccion('t-representante', 'Representante', 'users')}
    <dl class="grid gap-4">
      ${dato('Nombre', `${d.rep_nombres} ${d.rep_apellidos}`)}
      ${dato('Cédula', d.rep_cedula)}
      ${dato('Correo', d.rep_email)}
      ${dato('Teléfono', d.rep_telefono)}
    </dl>
  </section>`;
}

// ───────────────────────── Tablas simétricas (5 columnas cada una) ─────────────────────────

function filaCuota(c: CuotaEstudiante): HtmlSeguro {
  const abierta = c.estado === 'Pendiente' || c.estado === 'En Revisión';
  return html`<tr>
    <td class="${CLS.td}"><span class="font-medium text-slate-900">${c.concepto}</span></td>
    <td class="${CLS.td}">${NOMBRE_TIPO_CUOTA[c.tipo]}</td>
    <td class="${CLS.td} whitespace-nowrap">${fechaCorta(c.fecha_vencimiento)}${abierta && esVencida(c.fecha_vencimiento) ? html` ${etiqueta('Vencida', 'bad')}` : null}</td>
    <td class="${CLS.td} whitespace-nowrap">${usd(c.monto_usd)}</td>
    <td class="${CLS.td}">${etiquetaEstado(c.estado)}</td>
  </tr>`;
}

function filaPago(p: PagoEstudiante, conceptoDe: ReadonlyMap<number, string>): HtmlSeguro {
  const concepto = conceptoDe.get(p.cuota_id);
  return html`<tr>
    <td class="${CLS.td}"><span class="break-all font-medium text-slate-900">${p.referencia}</span>${concepto !== undefined ? html`<span class="block text-xs text-slate-600">${concepto}</span>` : null}</td>
    <td class="${CLS.td}">${nombreMetodo(p.metodo_pago)}</td>
    <td class="${CLS.td} whitespace-nowrap">${fechaHora(p.declarado_en)}</td>
    <td class="${CLS.td} whitespace-nowrap">${usd(p.monto_usd)}<span class="block text-xs text-slate-600">${bs(p.monto_bs)}</span></td>
    <td class="${CLS.td}">${etiquetaEstado(p.estado)}</td>
  </tr>`;
}

function tablaCuotas(d: DetalleEstudiante): HtmlSeguro {
  return html`<section class="${CLS.tarjeta} overflow-hidden" aria-labelledby="t-cuotas">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-cuotas" class="text-base font-bold text-slate-900">Histórico de cuotas</h2>
      <span class="text-xs text-slate-600">${d.cuotas.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${CLS.tabla}">
        <caption class="sr-only">Histórico de cuotas del estudiante</caption>
        <thead><tr><th scope="col" class="${CLS.th}">Concepto</th><th scope="col" class="${CLS.th}">Tipo</th><th scope="col" class="${CLS.th}">Vencimiento</th><th scope="col" class="${CLS.th}">Monto</th><th scope="col" class="${CLS.th}">Estado</th></tr></thead>
        <tbody>${d.cuotas.length === 0 ? html`<tr><td colspan="5" class="${CLS.td}">Este estudiante no tiene cuotas.</td></tr>` : d.cuotas.map(filaCuota)}</tbody>
      </table>
    </div>
  </section>`;
}

function tablaPagos(d: DetalleEstudiante): HtmlSeguro {
  const conceptoDe = new Map<number, string>(d.cuotas.map((c) => [c.id, c.concepto]));
  return html`<section class="${CLS.tarjeta} overflow-hidden" aria-labelledby="t-pagos">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-pagos" class="text-base font-bold text-slate-900">Pagos declarados por el representante</h2>
      <span class="text-xs text-slate-600">${d.pagos.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${CLS.tabla}">
        <caption class="sr-only">Pagos declarados por el representante</caption>
        <thead><tr><th scope="col" class="${CLS.th}">Referencia</th><th scope="col" class="${CLS.th}">Método</th><th scope="col" class="${CLS.th}">Declarado</th><th scope="col" class="${CLS.th}">Monto</th><th scope="col" class="${CLS.th}">Estado</th></tr></thead>
        <tbody>${d.pagos.length === 0 ? html`<tr><td colspan="5" class="${CLS.td}">El representante aún no ha declarado pagos.</td></tr>` : d.pagos.map((p) => filaPago(p, conceptoDe))}</tbody>
      </table>
    </div>
  </section>`;
}

// ───────────────────────── Cabecera y acciones ─────────────────────────

function cabecera(d: DetalleEstudiante): HtmlSeguro {
  const retirado = d.estatus_academico === 'Fuera de la Academia';
  return html`<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <button type="button" data-accion="volver" class="${boton(CLS.btnSecundario, CLS.btnPeq, 'mb-3')}">${icono('back', 'h-4 w-4')}<span>Volver al listado</span></button>
      <h1 id="ficha-titulo" tabindex="-1" class="${CLS.titulo} break-words">${d.apellidos}, ${d.nombres}</h1>
      <p class="${CLS.subtitulo} flex flex-wrap items-center gap-2">${etiquetaEstado(d.estado_dinamico)}<span>${d.grado_solicitado}</span>
        ${d.deuda_vencida_usd > 0 ? html`<span class="font-semibold text-red-800">Deuda vencida: ${usd(d.deuda_vencida_usd)}</span>` : null}</p>
    </div>
    <div class="flex flex-wrap gap-2" role="group" aria-label="Acciones sobre el estudiante">
      ${retirado
        ? html`<button type="button" data-accion="reactivar" class="${boton(CLS.btnOk)}">${icono('refresh', 'h-4 w-4')}<span>Reactivar Estudiante</span></button>`
        : html`<button type="button" data-accion="retirar" class="${boton(CLS.btnPeligro)}">${icono('logout', 'h-4 w-4')}<span>Retirar Estudiante</span></button>`}
    </div>
  </header>
  ${retirado
    ? html`<div class="mb-6">${aviso('warn', html`<p>Retirado el <strong>${d.fecha_retiro !== null ? fechaCorta(d.fecha_retiro) : 'fecha no registrada'}</strong>.</p>
        <p class="mt-1">Motivo: ${valorOSinDato(d.motivo_retiro)}</p>
        <p class="mt-1">Sus cuotas pendientes fueron anuladas al retirarlo; reactivarlo no las restaura.</p>`, 'Fuera de la Academia')}</div>`
    : null}`;
}

function fichaHtml(d: DetalleEstudiante): HtmlSeguro {
  return html`<div id="ficha-raiz">
    ${cabecera(d)}
    <div class="grid gap-6 lg:grid-cols-3">
      ${seccionAcademica(d)}
      ${seccionRepresentante(d)}
      ${seccionMedica(d)}
      ${seccionDrive(d)}
    </div>
    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      ${tablaCuotas(d)}
      ${tablaPagos(d)}
    </div>
  </div>`;
}

// ───────────────────────── Modales de retiro / reactivación ─────────────────────────

/** Motivo obligatorio (texto no vacío tras recortar, máx. 300) y fecha 'AAAA-MM-DD' no futura. Devuelve el mensaje de cada campo inválido. */
export function validarRetiro(motivo: string, fecha: string, hoy: string): { readonly motivo?: string; readonly fecha?: string } {
  const errores: { motivo?: string; fecha?: string } = {};
  const m = motivo.trim();
  if (m === '') errores.motivo = 'Debes escribir el motivo del retiro para continuar.';
  else if (m.length > MAX_MOTIVO) errores.motivo = `El motivo admite hasta ${MAX_MOTIVO} caracteres.`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) errores.fecha = 'Elige la fecha del retiro.';
  else if (fecha > hoy) errores.fecha = 'La fecha de retiro no puede ser futura.';
  return errores;
}

function ponerError(campo: HTMLElement, salida: HTMLElement, mensaje: string | undefined): void {
  if (mensaje === undefined) {
    salida.hidden = true;
    campo.removeAttribute('aria-invalid');
    return;
  }
  salida.textContent = mensaje;
  salida.hidden = false;
  campo.setAttribute('aria-invalid', 'true');
}

function abrirModalRetiro(d: DetalleEstudiante, alRetirar: (m: Modal, cuerpo: CuerpoRetiro, enviar: HTMLButtonElement) => void): void {
  const hoy = hoyCaracas();
  const m = abrirModal({
    titulo: 'Retirar estudiante',
    cuerpo: html`<form id="form-retiro" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700"><strong>${d.apellidos}, ${d.nombres}</strong> pasará a «Fuera de la Academia» y sus cuotas pendientes se anularán.</p>
      <div>
        <label for="retiro-motivo" class="${CLS.etiqueta}">Motivo del retiro <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="retiro-motivo" name="motivo" rows="4" maxlength="${MAX_MOTIVO}" required aria-describedby="retiro-ayuda retiro-motivo-error" class="${CLS.input}"></textarea>
        <p id="retiro-ayuda" class="${CLS.ayuda}">Obligatorio. Queda en el historial del estudiante. <span id="retiro-contador">0/${MAX_MOTIVO}</span></p>
        <p id="retiro-motivo-error" class="${CLS.errorCampo}" role="alert" hidden></p>
      </div>
      <div>
        <label for="retiro-fecha" class="${CLS.etiqueta}">Fecha del retiro <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="retiro-fecha" name="fecha_retiro" type="date" required value="${hoy}" max="${hoy}" aria-describedby="retiro-fecha-error" class="${CLS.input} sm:max-w-xs">
        <p id="retiro-fecha-error" class="${CLS.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="retiro-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${boton(CLS.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${boton(CLS.btnPeligro)}">${icono('logout', 'h-4 w-4')}<span>Retirar estudiante</span></button>
      </div>
    </form>`,
  });
  const form = obtener('#form-retiro', HTMLFormElement, m.dialogo);
  const motivo = obtener('#retiro-motivo', HTMLTextAreaElement, m.dialogo);
  const fecha = obtener('#retiro-fecha', HTMLInputElement, m.dialogo);
  const errorMotivo = obtener('#retiro-motivo-error', HTMLElement, m.dialogo);
  const errorFecha = obtener('#retiro-fecha-error', HTMLElement, m.dialogo);
  const contador = obtener('#retiro-contador', HTMLElement, m.dialogo);
  motivo.addEventListener('input', () => {
    contador.textContent = `${motivo.value.length}/${MAX_MOTIVO}`;
    if (motivo.value.trim() !== '') ponerError(motivo, errorMotivo, undefined);
  });
  fecha.addEventListener('input', () => ponerError(fecha, errorFecha, validarRetiro(motivo.value, fecha.value, hoy).fecha));
  obtener('[data-cancelar]', HTMLButtonElement, m.dialogo).addEventListener('click', m.cerrar);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const errores = validarRetiro(motivo.value, fecha.value, hoy);
    ponerError(motivo, errorMotivo, errores.motivo);
    ponerError(fecha, errorFecha, errores.fecha);
    if (errores.motivo !== undefined) motivo.focus();
    else if (errores.fecha !== undefined) fecha.focus();
    if (errores.motivo !== undefined || errores.fecha !== undefined) return;
    alRetirar(m, { motivo: motivo.value.trim(), fecha_retiro: fecha.value }, obtener('button[type="submit"]', HTMLButtonElement, form));
  });
  motivo.focus();
}

function abrirModalReactivar(d: DetalleEstudiante, alConfirmar: (m: Modal, confirmar: HTMLButtonElement) => void): void {
  const m = abrirModal({
    titulo: 'Reactivar estudiante',
    cuerpo: html`<div class="flex flex-col gap-4">
      <p class="text-sm text-slate-700"><strong>${d.apellidos}, ${d.nombres}</strong> volverá a «Activo». Las cuotas que se anularon al retirarlo no se restauran: genera las que correspondan desde Facturación.</p>
      <div id="reactivar-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${boton(CLS.btnSecundario)}">Cancelar</button>
        <button type="button" data-confirmar class="${boton(CLS.btnOk)}">${icono('check', 'h-4 w-4')}<span>Reactivar estudiante</span></button>
      </div>
    </div>`,
  });
  obtener('[data-cancelar]', HTMLButtonElement, m.dialogo).addEventListener('click', m.cerrar);
  const confirmar = obtener('[data-confirmar]', HTMLButtonElement, m.dialogo);
  confirmar.addEventListener('click', () => alConfirmar(m, confirmar));
  confirmar.focus();
}

// ───────────────────────── Vista ─────────────────────────

/**
 * Pinta la ficha. Un fallo de la primera carga (404 fuera de sede, red, 401) se propaga: lo muestra el manejador de errores del panel,
 * que ofrece «Reintentar». Los fallos de una acción (retirar / reactivar) se muestran dentro de su modal.
 */
export async function vistaEstudianteDetalle(ctx: ContextoDetalleEstudiante): Promise<void> {
  const leer = (): Promise<DetalleEstudiante> => bma.get<DetalleEstudiante>(`/estudiantes/${ctx.estudianteId}`);
  let datos = await leer();
  if (!ctx.vigente()) return;

  // Contenedor propio de ESTA ficha: el manejador de clics vive en él (no en `ctx.zona`, que es el <main> compartido del panel y
  // acumularía manejadores de fichas anteriores, con el riesgo de retirar a otro estudiante). Al navegar, el panel lo descarta entero.
  montar(ctx.zona, html`<div id="ficha-contenedor"></div>`);
  const contenedor = obtener('#ficha-contenedor', HTMLElement, ctx.zona);

  const pintar = (): void => {
    montar(contenedor, fichaHtml(datos));
    buscar('#ficha-titulo', HTMLElement, contenedor)?.focus({ preventScroll: true });
  };

  /** Vuelve a leer la ficha y repinta en el sitio (estado, banner de retiro, tablas y botón correcto). */
  const refrescar = async (): Promise<void> => {
    try {
      datos = await leer();
    } catch (e: unknown) {
      if (e instanceof BmaSesionExpiradaError) ctx.alSesionExpirada();
      else notificar('bad', `La acción se realizó, pero no se pudo actualizar la ficha: ${mensajeDeError(e)}`);
      return;
    }
    if (ctx.vigente()) pintar();
  };

  const alFallar = (e: unknown, m: Modal, idAviso: string): void => {
    if (e instanceof BmaSesionExpiradaError) {
      m.cerrar();
      ctx.alSesionExpirada();
      return;
    }
    montar(obtener(idAviso, HTMLElement, m.dialogo), aviso('bad', mensajeDeError(e)));
  };

  const retirar = (m: Modal, cuerpo: CuerpoRetiro, enviar: HTMLButtonElement): void => {
    void conBotonOcupado(enviar, () => bma.post<RespuestaCambioEstatus>(`/estudiantes/${ctx.estudianteId}/retirar`, cuerpo))
      .then(async () => {
        m.cerrar();
        notificar('ok', `${datos.nombres} ${datos.apellidos} fue retirado de la academia.`);
        await refrescar();
      })
      .catch((e: unknown) => alFallar(e, m, '#retiro-aviso'));
  };

  const reactivar = (m: Modal, confirmar: HTMLButtonElement): void => {
    void conBotonOcupado(confirmar, () => bma.post<RespuestaCambioEstatus>(`/estudiantes/${ctx.estudianteId}/reactivar`))
      .then(async () => {
        m.cerrar();
        notificar('ok', `${datos.nombres} ${datos.apellidos} fue reactivado.`);
        await refrescar();
      })
      .catch((e: unknown) => alFallar(e, m, '#reactivar-aviso'));
  };

  // Un solo manejador delegado: sigue funcionando aunque `pintar()` reemplace el contenido del contenedor.
  contenedor.addEventListener('click', (ev) => {
    const origen = ev.target instanceof Element ? ev.target.closest('[data-accion]') : null;
    if (!(origen instanceof HTMLButtonElement)) return;
    const accion = origen.dataset['accion'];
    if (accion === 'volver') ctx.alVolver();
    else if (accion === 'retirar') abrirModalRetiro(datos, retirar);
    else if (accion === 'reactivar') abrirModalReactivar(datos, reactivar);
  });

  pintar();
}
