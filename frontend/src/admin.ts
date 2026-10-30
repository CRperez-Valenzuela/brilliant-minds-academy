/**
 * AdminDashboard central.
 *  - ControlSidebar colapsable (estado persistido en localStorage; colapsado: solo iconos + tooltips flotantes).
 *  - TODO string dinámico pasa por `esc()` a través de la etiqueta `html` (ver lib/html.ts).
 *  - Tablero financiero en tiempo real (4 tarjetas KPI + barras de recaudación diaria con <div> dinámicos).
 *  - Bandeja de auditoría: aprobar / rechazar (el rechazo exige nota de justificación en un modal).
 *  - Candado Premium: los módulos de Fase 2 deshabilitados interceptan el clic y muestran una capa de cristal.
 */
import './styles/main.css';
import { bma, BmaApiError, BmaRedError, BmaSesionExpiradaError, mensajeDeError, sesion } from './api/bmaClient';
import { html, montar, raw, urlSegura, type HtmlSeguro } from './lib/html';
import { icono, type NombreIcono } from './lib/icons';
import { bs, diasDelPeriodo, fechaCorta, fechaHora, horaConSegundos, nombreMetodo, periodoActual, tasa as formatoTasa, usd } from './lib/format';
import { CLS, abrirModal, aviso, boton, buscar, conBotonOcupado, etiquetaEstado, notificar, obtener, todos } from './lib/ui';
import { AVISO_PREMIUM, encabezadoVista as encabezado, enlazarPrueba, pantallaBloqueada, seccionBloqueada } from './lib/candado';
import { vistaEstudianteDetalle } from './estudiantes-detalle';
import { vistaFacturacionMasiva } from './facturacion-masiva';
import { vistaConfiguracion } from './configuracion';
import { vistaSedesGestion } from './sedes-gestion';
import { vistaInvitaciones } from './invitaciones-modulo';
import { montarAnimacionLogin } from './login-animation';
import type {
  AlertaWhatsapp,
  BalanceContable,
  CodigoModuloPremium,
  ConteoEstudiantes,
  DetalleModuloPremium,
  EstadoPagoReferencia,
  EstudianteListado,
  FiltroEstudiantes,
  ModuloPremium,
  Paginacion,
  ReferenciaAuditoria,
  RespuestaLogin,
  RespuestaMe,
  RespuestaPrueba,
  ResultadoRevision,
  TableroFacturacion,
  TipoAlertaWhatsapp,
  Usuario,
  VistaAdmin,
} from './types/index';

// ───────────────────────── Constantes ─────────────────────────

export { AVISO_PREMIUM };
const CLAVE_SIDEBAR = 'bma.sidebar.colapsado';
const REFRESCO_TABLERO_MS = 30_000;
const LIMITE_PAGINA = 25;
const MAX_NOTA = 300;

interface DefVista {
  readonly id: VistaAdmin;
  readonly titulo: string;
  readonly icono: NombreIcono;
  readonly soloAdmin: boolean;
}

const VISTAS: readonly DefVista[] = [
  { id: 'dashboard', titulo: 'Dashboard', icono: 'home', soloAdmin: false },
  { id: 'estudiantes', titulo: 'Estudiantes', icono: 'users', soloAdmin: false },
  { id: 'auditoria', titulo: 'Auditoría de referencias', icono: 'inbox', soloAdmin: false },
  // Visibles para todos los roles: «Sedes» muestra «Sección Restringida» a quien no tiene acceso consolidado (sin peticiones);
  // «Invitaciones» la usa también la secretaria, limitada a su sede.
  { id: 'sedes', titulo: 'Sedes', icono: 'building', soloAdmin: false },
  { id: 'invitaciones', titulo: 'Invitaciones', icono: 'link', soloAdmin: false },
  { id: 'contabilidad', titulo: 'Contabilidad', icono: 'book', soloAdmin: true },
  { id: 'configuracion', titulo: 'Configuración de cobro', icono: 'wallet', soloAdmin: true },
];

const ICONO_MODULO: Readonly<Record<CodigoModuloPremium, NombreIcono>> = {
  IA_ATENCION: 'bot',
  WHATSAPP_AUTOMATICO: 'chat',
  BANCAMIGA: 'wallet',
  APP_MOVIL: 'phone',
  FACHADA_WEB: 'globe',
  MULTI_SEDE_PREMIUM: 'school',
  FACTURACION_MASIVA: 'receipt',
};

const FILTROS_ESTUDIANTES: readonly FiltroEstudiantes[] = ['', 'Activo', 'Moroso', 'Fuera de la Academia', 'Pendiente por Validación Administrativa'];
const FILTROS_AUDITORIA: readonly EstadoPagoReferencia[] = ['Por Validar', 'Aprobada', 'Rechazada'];

// ───────────────────────── Estado ─────────────────────────

interface EstadoAdmin {
  readonly usuario: Usuario | null;
  readonly modulos: readonly ModuloPremium[];
  readonly vista: string; // VistaAdmin o `premium:<CODIGO>`
  readonly colapsado: boolean;
  readonly periodo: string;
  readonly filtroEstudiantes: FiltroEstudiantes;
  readonly paginaEstudiantes: number;
  readonly filtroAuditoria: EstadoPagoReferencia;
  readonly paginaAuditoria: number;
}

let estado: EstadoAdmin = {
  usuario: null,
  modulos: [],
  vista: 'dashboard',
  colapsado: false,
  periodo: periodoActual(),
  filtroEstudiantes: '',
  paginaEstudiantes: 1,
  filtroAuditoria: 'Por Validar',
  paginaAuditoria: 1,
};

function actualizar(parcial: Partial<EstadoAdmin>): void {
  estado = { ...estado, ...parcial };
}

interface Contexto {
  readonly zona: HTMLElement;
  readonly vigente: () => boolean;
}

let ticketVista = 0;
let temporizadorTablero: number | null = null;

// ───────────────────────── Persistencia del sidebar ─────────────────────────

export function leerColapsado(): boolean {
  try {
    const v = localStorage.getItem(CLAVE_SIDEBAR);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* almacenamiento bloqueado: se usa el valor por defecto */
  }
  return window.matchMedia('(max-width: 767px)').matches; // en móvil arranca colapsado
}

function guardarColapsado(valor: boolean): void {
  try {
    localStorage.setItem(CLAVE_SIDEBAR, valor ? '1' : '0');
  } catch {
    /* sin almacenamiento: el estado vive solo en esta página */
  }
}

// ───────────────────────── Guardas ─────────────────────────

export function esUsuario(v: unknown): v is Usuario {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Readonly<Record<string, unknown>>;
  return typeof o['id'] === 'number' && typeof o['nombre'] === 'string' && typeof o['email'] === 'string' && (o['rol'] === 'admin' || o['rol'] === 'secretaria');
}

function usuarioGuardado(): Usuario | null {
  const crudo = sesion.usuarioCrudo();
  if (!crudo) return null;
  try {
    const v: unknown = JSON.parse(crudo);
    return esUsuario(v) ? v : null;
  } catch {
    return null;
  }
}

const esAdmin = (): boolean => estado.usuario?.rol === 'admin';

// ───────────────────────── Login ─────────────────────────

function mostrarLogin(mensaje?: string): void {
  detenerTablero();
  ticketVista += 1;
  document.body.className = 'text-slate-900';
  montar(
    obtener('#app', HTMLElement),
    html`<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div id="login-logo" class="w-full"></div>
      <div class="text-center">
        <h1 class="${CLS.titulo}">Brilliant Minds Academy</h1>
        <p class="${CLS.subtitulo}">Panel administrativo</p>
      </div>
      <form id="login" novalidate class="${CLS.tarjetaCristal} flex flex-col gap-4 p-6" aria-label="Iniciar sesión">
        <div id="login-aviso">${mensaje ? aviso('warn', mensaje) : null}</div>
        <div>
          <label for="login-email" class="${CLS.etiqueta}">Correo</label>
          <input id="login-email" name="email" type="email" required autocomplete="username" class="${CLS.input}">
        </div>
        <div>
          <label for="login-password" class="${CLS.etiqueta}">Contraseña</label>
          <input id="login-password" name="password" type="password" required autocomplete="current-password" class="${CLS.input}">
        </div>
        <button type="submit" class="${boton(CLS.btnPrimario, 'w-full')}"><span>Entrar</span></button>
      </form>
    </main>`,
  );
  void montarAnimacionLogin(obtener('#login-logo', HTMLElement));
  const form = obtener('#login', HTMLFormElement);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    void alIniciarSesion(form);
  });
  obtener('#login-email', HTMLInputElement).focus();
}

async function alIniciarSesion(form: HTMLFormElement): Promise<void> {
  const email = obtener('#login-email', HTMLInputElement).value.trim();
  const password = obtener('#login-password', HTMLInputElement).value;
  const zona = obtener('#login-aviso', HTMLElement);
  if (!email || !password) {
    montar(zona, aviso('bad', 'Escribe tu correo y tu contraseña.'));
    return;
  }
  try {
    const r = await conBotonOcupado(obtener('button[type="submit"]', HTMLButtonElement, form), () =>
      bma.post<RespuestaLogin>('/auth/login', { email, password }, { sinAuth: true }),
    );
    sesion.guardar(r.token, JSON.stringify(r.usuario));
    await arrancar();
  } catch (e: unknown) {
    montar(zona, aviso('bad', mensajeDeError(e)));
  }
}

function cerrarSesion(mensaje?: string): void {
  sesion.cerrar();
  actualizar({ usuario: null, modulos: [], vista: 'dashboard' });
  mostrarLogin(mensaje);
}

// ───────────────────────── Shell (sidebar + contenido) ─────────────────────────

function itemNav(opciones: { readonly id: string; readonly titulo: string; readonly icono: NombreIcono; readonly tooltip: string; readonly bloqueado: boolean }): HtmlSeguro {
  const { id, titulo, tooltip, bloqueado } = opciones;
  return html`<button type="button" data-nav="${id}" data-bloqueado="${bloqueado}"
    class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 aria-[current=page]:bg-slate-900 aria-[current=page]:text-white group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
    ${icono(opciones.icono)}
    <span class="min-w-0 flex-1 truncate group-data-[collapsed=true]/sb:sr-only">${titulo}</span>
    ${bloqueado ? html`<span class="text-slate-500 group-data-[collapsed=true]/sb:absolute group-data-[collapsed=true]/sb:right-2 group-data-[collapsed=true]/sb:top-1">${icono('lock', 'h-4 w-4 group-data-[collapsed=true]/sb:h-3 group-data-[collapsed=true]/sb:w-3')}</span>` : null}
    <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">${tooltip}</span>
  </button>`;
}

function shellHtml(): HtmlSeguro {
  const u = estado.usuario;
  const vistas = VISTAS.filter((v) => !v.soloAdmin || esAdmin());
  return html`<div id="shell" data-collapsed="${estado.colapsado}" class="group/sb flex min-h-screen">
    <aside id="barra-lateral" aria-label="Navegación principal"
      class="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white/95 backdrop-blur transition-[width] duration-200 group-data-[collapsed=true]/sb:w-20">
      <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-4 group-data-[collapsed=true]/sb:justify-center">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">${icono('school')}</span>
        <span class="truncate text-sm font-bold text-slate-900 group-data-[collapsed=true]/sb:sr-only">BMA · Administración</span>
      </div>
      <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Secciones">
        ${vistas.map((v) => itemNav({ id: v.id, titulo: v.titulo, icono: v.icono, tooltip: v.titulo, bloqueado: false }))}
        <p class="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 group-data-[collapsed=true]/sb:sr-only">Módulos Premium</p>
        <hr class="my-2 hidden border-slate-200 group-data-[collapsed=true]/sb:block">
        ${estado.modulos.map((m) => itemNav({ id: `premium:${m.codigo}`, titulo: m.nombre, icono: ICONO_MODULO[m.codigo] ?? 'chat', tooltip: m.bloqueado ? `${m.nombre} · ${m.tooltip}` : m.nombre, bloqueado: m.bloqueado }))}
      </nav>
      <div class="flex flex-col gap-1 border-t border-slate-200 p-3">
        <div class="flex items-center gap-3 px-3 py-2 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800" aria-hidden="true">${(u?.nombre ?? '?').trim().slice(0, 1).toUpperCase()}</span>
          <span class="min-w-0 group-data-[collapsed=true]/sb:sr-only"><span class="block truncate text-sm font-semibold text-slate-900">${u?.nombre}</span><span class="block truncate text-xs text-slate-600">${u?.rol}</span></span>
        </div>
        <button type="button" id="salir" class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${icono('logout')}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Salir</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Salir</span>
        </button>
        <button type="button" id="alternar-sidebar" aria-controls="barra-lateral" aria-expanded="${!estado.colapsado}" aria-label="${estado.colapsado ? 'Expandir menú lateral' : 'Contraer menú lateral'}"
          class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${icono('menu')}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Contraer menú</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Expandir menú</span>
        </button>
      </div>
    </aside>
    <main id="contenido" tabindex="-1" class="min-w-0 flex-1 p-4 sm:p-8"></main>
  </div>`;
}

function alternarSidebar(): void {
  const colapsado = !estado.colapsado;
  actualizar({ colapsado });
  guardarColapsado(colapsado);
  const shell = obtener('#shell', HTMLElement);
  shell.dataset['collapsed'] = String(colapsado);
  const boton_ = obtener('#alternar-sidebar', HTMLButtonElement);
  boton_.setAttribute('aria-expanded', String(!colapsado));
  boton_.setAttribute('aria-label', colapsado ? 'Expandir menú lateral' : 'Contraer menú lateral');
}

function marcarNavegacion(id: string): void {
  const activo = id.startsWith('estudiante:') ? 'estudiantes' : id; // la ficha de un estudiante cuelga de «Estudiantes»
  for (const b of todos('[data-nav]', HTMLElement)) {
    if (b.dataset['nav'] === activo) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
}

async function arrancar(): Promise<void> {
  if (!sesion.token()) {
    mostrarLogin();
    return;
  }
  let usuario = usuarioGuardado();
  try {
    if (!usuario) usuario = (await bma.get<RespuestaMe>('/auth/me')).usuario;
    const modulos = await bma.get<readonly ModuloPremium[]>('/premium/modulos').catch((e: unknown) => {
      if (e instanceof BmaSesionExpiradaError) throw e;
      return [] as readonly ModuloPremium[]; // sin catálogo no hay candados, pero el panel sigue operativo
    });
    actualizar({ usuario, modulos, colapsado: leerColapsado() });
  } catch (e: unknown) {
    cerrarSesion(e instanceof BmaSesionExpiradaError ? 'Tu sesión expiró. Inicia sesión de nuevo.' : mensajeDeError(e));
    return;
  }

  document.body.className = 'text-slate-900';
  montar(obtener('#app', HTMLElement), shellHtml());
  const shell = obtener('#shell', HTMLElement);
  shell.addEventListener('click', (ev) => {
    const objetivo = ev.target instanceof Element ? ev.target : null;
    const nav = objetivo?.closest('[data-nav]');
    if (!(nav instanceof HTMLElement)) return;
    const id = nav.dataset['nav'] ?? '';
    const modulo = estado.modulos.find((m) => `premium:${m.codigo}` === id);
    if (modulo?.bloqueado) {
      // Candado Premium: se intercepta el evento de navegación y se inyecta la capa de cristal sobre la sección.
      ev.preventDefault();
      ev.stopPropagation();
    }
    void navegar(id);
  });
  obtener('#salir', HTMLButtonElement).addEventListener('click', () => cerrarSesion());
  obtener('#alternar-sidebar', HTMLButtonElement).addEventListener('click', alternarSidebar);
  const vistaInicial = estado.vista.startsWith('premium:') || VISTAS.some((v) => v.id === estado.vista) ? estado.vista : 'dashboard';
  await navegar(vistaInicial);
}

// ───────────────────────── Navegación ─────────────────────────

function detenerTablero(): void {
  if (temporizadorTablero !== null) {
    window.clearInterval(temporizadorTablero);
    temporizadorTablero = null;
  }
}

async function navegar(id: string): Promise<void> {
  detenerTablero();
  ticketVista += 1;
  const mio = ticketVista;
  actualizar({ vista: id });
  marcarNavegacion(id);
  const zona = obtener('#contenido', HTMLElement);
  const ctx: Contexto = { zona, vigente: () => mio === ticketVista };
  montar(zona, html`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando"></div>`);
  try {
    if (id.startsWith('premium:')) vistaPremium(ctx, id.slice('premium:'.length));
    else if (id.startsWith('estudiante:')) await vistaDetalle(ctx, id.slice('estudiante:'.length));
    else if (id === 'estudiantes') await vistaEstudiantes(ctx);
    else if (id === 'auditoria') await vistaAuditoria(ctx);
    else if (id === 'sedes') {
      await vistaSedesGestion({
        zona: ctx.zona,
        vigente: ctx.vigente,
        usuario: estado.usuario,
        // 403 MODULO_PREMIUM_DESHABILITADO (3.ª sede sin el módulo): relee el catálogo y pinta la pantalla de cristal con el precio.
        alBloquear: (d) => void bloquearModulo(ctx, d),
        alSesionExpirada: () => cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.'),
      });
    } else if (id === 'invitaciones') {
      await vistaInvitaciones({
        zona: ctx.zona,
        vigente: ctx.vigente,
        usuario: estado.usuario,
        alSesionExpirada: () => cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.'),
      });
    } else if (id === 'contabilidad' && esAdmin()) await vistaContabilidad(ctx);
    else if (id === 'configuracion' && esAdmin()) await vistaConfiguracion({ zona: ctx.zona, vigente: ctx.vigente, usuario: estado.usuario });
    else await vistaDashboard(ctx);
  } catch (e: unknown) {
    manejarError(e, ctx);
  }
}

function manejarError(e: unknown, ctx: Contexto): void {
  if (!ctx.vigente()) return;
  if (e instanceof BmaSesionExpiradaError) {
    cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.');
    return;
  }
  if (e instanceof BmaApiError) {
    const premium = e.moduloPremium();
    if (premium) {
      pintarCandadoDesdeServidor(ctx.zona, premium);
      return;
    }
  }
  montar(
    ctx.zona,
    html`<div class="mx-auto max-w-2xl pt-8">${aviso('bad', mensajeDeError(e), e instanceof BmaRedError ? 'Sin conexión' : 'No se pudo cargar la sección')}
      <button type="button" data-reintentar class="${boton(CLS.btnSecundario, 'mt-4')}">${icono('refresh', 'h-4 w-4')}<span>Reintentar</span></button></div>`,
  );
  buscar('[data-reintentar]', HTMLButtonElement, ctx.zona)?.addEventListener('click', () => void navegar(estado.vista));
}

function paginacionHtml(p: Paginacion): HtmlSeguro {
  const paginas = Math.max(1, Math.ceil(p.total / Math.max(1, p.limite)));
  return html`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación">
    <span class="text-slate-600">Página ${p.pagina} de ${paginas} · ${p.total} registro(s)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${boton(CLS.btnSecundario, CLS.btnPeq)}" ${p.pagina <= 1 ? raw('disabled') : null}>Anterior</button>
      <button type="button" data-pag="1" class="${boton(CLS.btnSecundario, CLS.btnPeq)}" ${p.pagina >= paginas ? raw('disabled') : null}>Siguiente</button>
    </span>
  </nav>`;
}

function enlazarPaginacion(zona: HTMLElement, alCambiar: (delta: number) => void): void {
  for (const b of todos('[data-pag]', HTMLButtonElement, zona)) {
    b.addEventListener('click', () => alCambiar(Number(b.dataset['pag'])));
  }
}

// ───────────────────────── Dashboard ─────────────────────────

interface TarjetaKpi {
  readonly titulo: string;
  readonly valor: string;
  readonly detalle: string;
  readonly icono: NombreIcono;
  readonly tono: 'normal' | 'malo';
}

function tarjetaKpi(k: TarjetaKpi): HtmlSeguro {
  return html`<article class="${CLS.tarjeta} p-6">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-sm font-medium text-slate-600">${k.titulo}</h3>
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${icono(k.icono, 'h-4 w-4')}</span>
    </div>
    <p class="mt-3 text-2xl font-bold ${k.tono === 'malo' ? 'text-red-800' : 'text-slate-900'}" data-kpi>${k.valor}</p>
    <p class="mt-1 text-xs text-slate-600">${k.detalle}</p>
  </article>`;
}

/** Barras de recaudación diaria: una <div> por día del período; su altura se asigna después de montar (ver `aplicarAlturas`). */
export function barrasHtml(d: TableroFacturacion): HtmlSeguro {
  const dias = diasDelPeriodo(d.periodo);
  const porDia = new Map<number, number>();
  for (const x of d.cobrado_por_dia) porDia.set(Number(x.dia.slice(8, 10)), x.monto_usd);
  const maximo = Math.max(0, ...porDia.values());
  const columnas = Array.from({ length: dias }, (_, i) => {
    const dia = i + 1;
    const monto = porDia.get(dia) ?? 0;
    const pct = maximo > 0 ? Math.max(monto > 0 ? 4 : 0, Math.round((monto / maximo) * 100)) : 0;
    return html`<li class="group/barra relative flex h-full min-w-0 flex-1 flex-col justify-end" title="Día ${dia}: ${usd(monto)}">
      <div data-alto="${pct}" class="w-full rounded-t ${monto > 0 ? 'bg-slate-800 group-hover/barra:bg-slate-600' : 'bg-slate-200'} ${monto > 0 ? '' : 'h-px'}"></div>
      <span class="sr-only">Día ${dia}: ${usd(monto)}</span>
    </li>`;
  });
  const etiquetas = Array.from({ length: dias }, (_, i) => html`<span class="min-w-0 flex-1 text-center text-xs text-slate-600">${(i + 1) % 5 === 0 || i === 0 ? i + 1 : ''}</span>`);
  return html`<div role="group" aria-label="Cobrado por día en ${d.periodo}">
    <ul class="flex h-48 items-end gap-1 border-b border-slate-200">${columnas}</ul>
    <div class="mt-1 flex gap-1" aria-hidden="true">${etiquetas}</div>
  </div>`;
}

function aplicarAlturas(raiz: ParentNode): void {
  for (const barra of todos('[data-alto]', HTMLElement, raiz)) {
    const pct = Number(barra.dataset['alto']);
    if (Number.isFinite(pct) && pct > 0) barra.style.height = `${Math.min(100, pct)}%`;
  }
}

function tableroHtml(d: TableroFacturacion, e: ConteoEstudiantes): HtmlSeguro {
  const kpis: readonly TarjetaKpi[] = [
    { titulo: 'Cobrado', valor: usd(d.cobrado.monto_usd), detalle: `${d.cobrado.cantidad} pago(s) aprobados`, icono: 'wallet', tono: 'normal' },
    { titulo: 'Saldos vencidos', valor: usd(d.saldos_vencidos.monto_usd), detalle: `${d.saldos_vencidos.cantidad} cuota(s) vencida(s)`, icono: 'alert', tono: 'malo' },
    { titulo: 'Cuentas pendientes del mes', valor: usd(d.cuentas_pendientes.monto_usd), detalle: `${d.cuentas_pendientes.cantidad} cuota(s) por cobrar`, icono: 'book', tono: 'normal' },
    { titulo: 'Referencias por validar', valor: String(d.referencias_por_validar), detalle: 'en la bandeja de auditoría', icono: 'inbox', tono: 'normal' },
  ];
  return html`
    <section aria-label="Indicadores del mes" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${kpis.map(tarjetaKpi)}</section>
    <section aria-label="Estudiantes por estado" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${[
        ['Activos', e.activos],
        ['Morosos', e.morosos],
        ['Fuera de la Academia', e.fuera_de_la_academia],
        ['Pendientes de validación', e.pendientes_validacion],
      ].map(([titulo, n]) => html`<div class="${CLS.tarjeta} flex items-center justify-between gap-4 px-6 py-4"><span class="text-sm text-slate-700">${titulo}</span><strong class="text-lg text-slate-900">${n}</strong></div>`)}
    </section>
    <section class="${CLS.tarjeta} mt-6 p-6" aria-labelledby="t-barras">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="t-barras" class="text-base font-bold text-slate-900">Recaudación diaria</h2>
        <p class="text-sm text-slate-600">Cobrado del mes: <strong class="text-slate-900">${usd(d.cobrado.monto_usd)}</strong></p>
      </div>
      ${barrasHtml(d)}
    </section>`;
}

async function cargarTablero(ctx: Contexto, silencioso: boolean): Promise<void> {
  const destino = obtener('#tablero', HTMLElement, ctx.zona);
  if (!silencioso) montar(destino, html`<div class="h-48 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando tablero"></div>`);
  try {
    const [datos, estudiantes] = await Promise.all([
      bma.get<TableroFacturacion>('/facturacion/tablero', { periodo: estado.periodo }),
      bma.get<ConteoEstudiantes>('/estudiantes/resumen'),
    ]);
    if (!ctx.vigente()) return;
    montar(destino, tableroHtml(datos, estudiantes));
    aplicarAlturas(destino);
    const reloj = buscar('#actualizado', HTMLElement, ctx.zona);
    if (reloj) reloj.textContent = `Actualizado a las ${horaConSegundos(new Date())}`;
  } catch (e: unknown) {
    if (!ctx.vigente()) return;
    if (silencioso && !(e instanceof BmaSesionExpiradaError)) return; // un fallo puntual no borra lo que ya se ve
    manejarError(e, ctx);
  }
}

async function vistaDashboard(ctx: Contexto): Promise<void> {
  montar(
    ctx.zona,
    html`${encabezado(
      'Dashboard',
      'Tablero financiero en tiempo real',
      html`<div class="flex flex-wrap items-end gap-4">
        <div><label for="periodo" class="${CLS.etiqueta}">Período</label><input id="periodo" type="month" value="${estado.periodo}" max="${periodoActual()}" class="${CLS.input}"></div>
        <p id="actualizado" class="pb-2 text-xs text-slate-600" aria-live="off"></p>
      </div>`,
    )}<div id="tablero"></div>`,
  );
  obtener('#periodo', HTMLInputElement, ctx.zona).addEventListener('change', (ev) => {
    const v = ev.target instanceof HTMLInputElement ? ev.target.value : '';
    if (/^\d{4}-\d{2}$/.test(v)) {
      actualizar({ periodo: v });
      void cargarTablero(ctx, false);
    }
  });
  await cargarTablero(ctx, true);
  temporizadorTablero = window.setInterval(() => {
    if (!ctx.vigente()) {
      detenerTablero();
      return;
    }
    if (!document.hidden) void cargarTablero(ctx, true);
  }, REFRESCO_TABLERO_MS);
}

// ───────────────────────── Estudiantes + alertas WhatsApp ─────────────────────────

function filaEstudiante(s: EstudianteListado): HtmlSeguro {
  return html`<tr>
    <td class="${CLS.td}"><button type="button" data-detalle="${s.id}" class="rounded-md text-left font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900" aria-label="Ver ficha de ${s.apellidos}, ${s.nombres}">${s.apellidos}, ${s.nombres}</button></td>
    <td class="${CLS.td}">${s.grado_solicitado}</td>
    <td class="${CLS.td}">${s.representante}</td>
    <td class="${CLS.td}">${etiquetaEstado(s.estado_dinamico)}</td>
    <td class="${CLS.td} whitespace-nowrap">${usd(s.deuda_vencida_usd)}</td>
    <td class="${CLS.td}"><div class="flex flex-wrap gap-2">
      <button type="button" data-alerta="preventiva" data-id="${s.id}" class="${boton(CLS.btnSecundario, CLS.btnPeq)}">Preventiva</button>
      <button type="button" data-alerta="morosidad" data-id="${s.id}" class="${boton(CLS.btnSecundario, CLS.btnPeq)}">Morosidad</button>
    </div></td>
  </tr>`;
}

async function vistaEstudiantes(ctx: Contexto): Promise<void> {
  const r = await bma.pagina<EstudianteListado>('/estudiantes', { estado: estado.filtroEstudiantes, pagina: estado.paginaEstudiantes, limite: LIMITE_PAGINA });
  if (!ctx.vigente()) return;
  montar(
    ctx.zona,
    html`${encabezado('Estudiantes', `${r.paginacion.total} resultado(s)`)}
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
      ${FILTROS_ESTUDIANTES.map((f) => html`<button type="button" data-filtro="${f}" aria-pressed="${f === estado.filtroEstudiantes}" class="${boton(CLS.btnSecundario, CLS.btnPeq, 'aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white')}">${f === '' ? 'Todos' : f}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${CLS.tabla}">
        <caption class="sr-only">Listado de estudiantes</caption>
        <thead><tr><th scope="col" class="${CLS.th}">Estudiante</th><th scope="col" class="${CLS.th}">Grado</th><th scope="col" class="${CLS.th}">Representante</th><th scope="col" class="${CLS.th}">Estado</th><th scope="col" class="${CLS.th}">Deuda vencida</th><th scope="col" class="${CLS.th}">Alertas WhatsApp</th></tr></thead>
        <tbody>${r.datos.length === 0 ? html`<tr><td colspan="6" class="${CLS.td}">Sin resultados.</td></tr>` : r.datos.map(filaEstudiante)}</tbody>
      </table>
    </div>
    ${paginacionHtml(r.paginacion)}`,
  );
  for (const b of todos('[data-filtro]', HTMLButtonElement, ctx.zona)) {
    b.addEventListener('click', () => {
      const valor = b.dataset['filtro'] ?? '';
      const filtro = FILTROS_ESTUDIANTES.find((f) => f === valor) ?? '';
      actualizar({ filtroEstudiantes: filtro, paginaEstudiantes: 1 });
      void navegar('estudiantes');
    });
  }
  enlazarPaginacion(ctx.zona, (delta) => {
    actualizar({ paginaEstudiantes: Math.max(1, estado.paginaEstudiantes + delta) });
    void navegar('estudiantes');
  });
  for (const b of todos('[data-detalle]', HTMLButtonElement, ctx.zona)) {
    b.addEventListener('click', () => {
      const id = Number(b.dataset['detalle']);
      if (Number.isInteger(id) && id > 0) void navegar(`estudiante:${id}`);
    });
  }
  for (const b of todos('[data-alerta]', HTMLButtonElement, ctx.zona)) {
    b.addEventListener('click', () => {
      const tipo: TipoAlertaWhatsapp = b.dataset['alerta'] === 'morosidad' ? 'morosidad' : 'preventiva';
      void abrirAlerta(tipo, Number(b.dataset['id']), b);
    });
  }
}

async function abrirAlerta(tipo: TipoAlertaWhatsapp, estudianteId: number, disparador: HTMLButtonElement): Promise<void> {
  try {
    const r = await conBotonOcupado(disparador, () => bma.post<AlertaWhatsapp>(`/notificaciones/whatsapp/${tipo}/${estudianteId}`));
    const m = abrirModal({
      titulo: tipo === 'morosidad' ? 'Alerta de morosidad' : 'Alerta preventiva',
      ancho: 'lg',
      cuerpo: html`<p class="text-sm text-slate-600">${usd(r.monto_usd)} · ${bs(r.monto_bs)} · tasa BCV ${formatoTasa(r.tasa_bcv)}</p>
        <pre class="mt-4 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">${r.mensaje}</pre>
        <div id="alerta-resultado" class="mt-4"></div>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <a href="${urlSegura(r.enlace_whatsapp, ['https://wa.me/'])}" target="_blank" rel="noopener noreferrer" class="${boton(CLS.btnPrimario)}">Abrir en WhatsApp</a>
          <button type="button" id="alerta-enviar" class="${boton(CLS.btnSecundario)}">Enviar por API</button>
        </div>`,
    });
    const enviar = obtener('#alerta-enviar', HTMLButtonElement, m.dialogo);
    enviar.addEventListener('click', () => {
      const salida = obtener('#alerta-resultado', HTMLElement, m.dialogo);
      void conBotonOcupado(enviar, () => bma.post<AlertaWhatsapp>(`/notificaciones/whatsapp/${tipo}/${estudianteId}`, {}, { consulta: { enviar: true } }))
        .then(() => montar(salida, aviso('ok', 'Mensaje enviado por la API de WhatsApp.')))
        .catch((e: unknown) => montar(salida, aviso('bad', mensajeDeError(e))));
    });
  } catch (e: unknown) {
    if (e instanceof BmaSesionExpiradaError) cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.');
    else notificar('bad', mensajeDeError(e));
  }
}

/** Ficha del estudiante (Core Base, sin candado): `estudiante:<id>` en el estado de navegación. */
async function vistaDetalle(ctx: Contexto, idTexto: string): Promise<void> {
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) {
    montar(ctx.zona, html`<div class="mx-auto max-w-2xl pt-8">${aviso('bad', 'El identificador del estudiante no es válido.')}</div>`);
    return;
  }
  await vistaEstudianteDetalle({
    zona: ctx.zona,
    vigente: ctx.vigente,
    estudianteId: id,
    alVolver: () => void navegar('estudiantes'),
    alSesionExpirada: () => cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.'),
  });
}

// ───────────────────────── Auditoría de referencias ─────────────────────────

function filaAuditoria(p: ReferenciaAuditoria): HtmlSeguro {
  const pendiente = p.estado === 'Por Validar';
  return html`<tr>
    <td class="${CLS.td} whitespace-nowrap">${fechaHora(p.declarado_en)}</td>
    <td class="${CLS.td}"><span class="font-medium text-slate-900">${p.estudiante}</span><br><span class="text-xs text-slate-600">${p.concepto} · vence ${fechaCorta(p.fecha_vencimiento)}</span></td>
    <td class="${CLS.td}"><strong class="break-all">${p.referencia}</strong><br><span class="text-xs text-slate-600">${p.representante}</span></td>
    <td class="${CLS.td}">${nombreMetodo(p.metodo_pago)}</td>
    <td class="${CLS.td} whitespace-nowrap">${usd(p.monto_usd)}<br><span class="text-xs text-slate-600">${bs(p.monto_bs)}</span></td>
    <td class="${CLS.td}">${pendiente
      ? html`<div class="flex flex-wrap gap-2">
          <button type="button" data-aprobar="${p.id}" class="${boton(CLS.btnOk, CLS.btnPeq)}">${icono('check', 'h-4 w-4')}<span>Aprobar</span></button>
          <button type="button" data-rechazar="${p.id}" class="${boton(CLS.btnPeligro, CLS.btnPeq)}">${icono('x', 'h-4 w-4')}<span>Rechazar</span></button>
        </div>`
      : html`${etiquetaEstado(p.estado)}${p.nota_revision ? html`<p class="mt-1 max-w-xs break-words text-xs text-slate-600">${p.nota_revision}</p>` : null}`}</td>
  </tr>`;
}

async function vistaAuditoria(ctx: Contexto): Promise<void> {
  const r = await bma.pagina<ReferenciaAuditoria>('/facturacion/auditoria', { estado: estado.filtroAuditoria, pagina: estado.paginaAuditoria, limite: LIMITE_PAGINA });
  if (!ctx.vigente()) return;
  const exportar = esAdmin()
    ? html`<button type="button" id="exportar" class="${boton(CLS.btnSecundario)}">${icono('down', 'h-4 w-4')}<span>Exportar histórico (.xlsx)</span></button>`
    : null;
  montar(
    ctx.zona,
    html`${encabezado('Bandeja de auditoría', `${r.paginacion.total} referencia(s) · ${estado.filtroAuditoria}`, exportar)}
    <div id="auditoria-aviso" class="mb-4"></div>
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado de la referencia">
      ${FILTROS_AUDITORIA.map((f) => html`<button type="button" data-filtro="${f}" aria-pressed="${f === estado.filtroAuditoria}" class="${boton(CLS.btnSecundario, CLS.btnPeq, 'aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white')}">${f}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${CLS.tabla}">
        <caption class="sr-only">Referencias de pago declaradas</caption>
        <thead><tr><th scope="col" class="${CLS.th}">Declarada</th><th scope="col" class="${CLS.th}">Estudiante</th><th scope="col" class="${CLS.th}">Referencia</th><th scope="col" class="${CLS.th}">Método</th><th scope="col" class="${CLS.th}">Monto</th><th scope="col" class="${CLS.th}">Acción</th></tr></thead>
        <tbody>${r.datos.length === 0 ? html`<tr><td colspan="6" class="${CLS.td}">Bandeja vacía.</td></tr>` : r.datos.map(filaAuditoria)}</tbody>
      </table>
    </div>
    ${paginacionHtml(r.paginacion)}`,
  );
  const aviso_ = obtener('#auditoria-aviso', HTMLElement, ctx.zona);
  for (const b of todos('[data-filtro]', HTMLButtonElement, ctx.zona)) {
    b.addEventListener('click', () => {
      const valor = b.dataset['filtro'] ?? '';
      const filtro = FILTROS_AUDITORIA.find((f) => f === valor) ?? 'Por Validar';
      actualizar({ filtroAuditoria: filtro, paginaAuditoria: 1 });
      void navegar('auditoria');
    });
  }
  enlazarPaginacion(ctx.zona, (delta) => {
    actualizar({ paginaAuditoria: Math.max(1, estado.paginaAuditoria + delta) });
    void navegar('auditoria');
  });
  const porId = new Map(r.datos.map((p) => [p.id, p] as const));
  for (const b of todos('[data-aprobar]', HTMLButtonElement, ctx.zona)) {
    b.addEventListener('click', () => void aprobar(Number(b.dataset['aprobar']), b, aviso_));
  }
  for (const b of todos('[data-rechazar]', HTMLButtonElement, ctx.zona)) {
    b.addEventListener('click', () => {
      const p = porId.get(Number(b.dataset['rechazar']));
      if (p) modalRechazo(p);
    });
  }
  buscar('#exportar', HTMLButtonElement, ctx.zona)?.addEventListener('click', (ev) => {
    const el = ev.currentTarget instanceof HTMLButtonElement ? ev.currentTarget : null;
    if (el) void exportar_(el, '/exportaciones/facturacion.xlsx', 'facturacion.xlsx', aviso_);
  });
}

async function exportar_(disparador: HTMLButtonElement, ruta: string, nombre: string, salida: HTMLElement): Promise<void> {
  try {
    await conBotonOcupado(disparador, () => bma.descargar(ruta, nombre));
  } catch (e: unknown) {
    if (e instanceof BmaSesionExpiradaError) cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.');
    else montar(salida, aviso('bad', mensajeDeError(e)));
  }
}

function resumenRevision(r: ResultadoRevision, accion: string): string {
  return `${accion} · estatus de pago del alumno: ${r.estatus_pago} · deuda vencida ${usd(r.deuda_vencida_usd)}.`;
}

async function aprobar(id: number, disparador: HTMLButtonElement, salida: HTMLElement): Promise<void> {
  try {
    const r = await conBotonOcupado(disparador, () => bma.post<ResultadoRevision>(`/facturacion/auditoria/${id}/aprobar`, {}));
    notificar('ok', resumenRevision(r, 'Referencia aprobada'));
    await navegar('auditoria');
  } catch (e: unknown) {
    if (e instanceof BmaSesionExpiradaError) cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.');
    else montar(salida, aviso('bad', mensajeDeError(e)));
  }
}

/** Modal de rechazo: la nota de justificación es OBLIGATORIA (1 a 300 caracteres). */
function modalRechazo(p: ReferenciaAuditoria): void {
  const m = abrirModal({
    titulo: 'Rechazar referencia',
    cuerpo: html`<form id="form-rechazo" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700">Referencia <strong class="break-all">${p.referencia}</strong> · ${p.estudiante} · ${usd(p.monto_usd)}</p>
      <div>
        <label for="nota-rechazo" class="${CLS.etiqueta}">Motivo del rechazo <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="nota-rechazo" name="nota" rows="4" maxlength="${MAX_NOTA}" required aria-describedby="nota-ayuda nota-error" class="${CLS.input}"></textarea>
        <p id="nota-ayuda" class="${CLS.ayuda}">Se guarda en el historial y se usa para avisar al representante. <span id="nota-contador">0/${MAX_NOTA}</span></p>
        <p id="nota-error" class="${CLS.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="rechazo-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${boton(CLS.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${boton(CLS.btnPeligro)}">${icono('x', 'h-4 w-4')}<span>Rechazar referencia</span></button>
      </div>
    </form>`,
  });
  const form = obtener('#form-rechazo', HTMLFormElement, m.dialogo);
  const campo = obtener('#nota-rechazo', HTMLTextAreaElement, m.dialogo);
  const error = obtener('#nota-error', HTMLElement, m.dialogo);
  const contador = obtener('#nota-contador', HTMLElement, m.dialogo);
  campo.addEventListener('input', () => {
    contador.textContent = `${campo.value.length}/${MAX_NOTA}`;
    if (campo.value.trim() !== '') {
      error.hidden = true;
      campo.removeAttribute('aria-invalid');
    }
  });
  obtener('[data-cancelar]', HTMLButtonElement, m.dialogo).addEventListener('click', m.cerrar);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const nota = campo.value.trim();
    if (nota === '') {
      error.textContent = 'Debes escribir el motivo del rechazo para continuar.';
      error.hidden = false;
      campo.setAttribute('aria-invalid', 'true');
      campo.focus();
      return;
    }
    const enviar = obtener('button[type="submit"]', HTMLButtonElement, form);
    void conBotonOcupado(enviar, () => bma.post<ResultadoRevision>(`/facturacion/auditoria/${p.id}/rechazar`, { nota }))
      .then(async (r) => {
        m.cerrar();
        notificar('ok', resumenRevision(r, 'Referencia rechazada'));
        await navegar('auditoria');
      })
      .catch((e: unknown) => {
        if (e instanceof BmaSesionExpiradaError) {
          m.cerrar();
          cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.');
          return;
        }
        montar(obtener('#rechazo-aviso', HTMLElement, m.dialogo), aviso('bad', mensajeDeError(e)));
      });
  });
  campo.focus();
}

// ───────────────────────── Contabilidad ─────────────────────────

async function vistaContabilidad(ctx: Contexto): Promise<void> {
  const b = await bma.get<BalanceContable>('/contabilidad/balance', { periodo: estado.periodo });
  if (!ctx.vigente()) return;
  montar(
    ctx.zona,
    html`${encabezado('Contabilidad', `Balance neto del período ${b.periodo}`, html`<div class="flex flex-wrap items-end gap-4">
      <div><label for="periodo-conta" class="${CLS.etiqueta}">Período</label><input id="periodo-conta" type="month" value="${estado.periodo}" max="${periodoActual()}" class="${CLS.input}"></div>
      <button type="button" id="exportar" class="${boton(CLS.btnPrimario)}">${icono('down', 'h-4 w-4')}<span>Exportar nómina, egresos y personal (.xlsx)</span></button>
    </div>`)}
    <div id="conta-aviso" class="mb-4"></div>
    <section class="grid gap-4 sm:grid-cols-3" aria-label="Balance">
      ${tarjetaKpi({ titulo: 'Ingresos', valor: usd(b.ingresos_usd), detalle: 'Referencias aprobadas del período', icono: 'wallet', tono: 'normal' })}
      ${tarjetaKpi({ titulo: 'Egresos', valor: usd(b.egresos_usd), detalle: 'Egresos y nómina pagada', icono: 'book', tono: 'normal' })}
      ${tarjetaKpi({ titulo: 'Neto', valor: usd(b.neto_usd), detalle: 'Ingresos − egresos', icono: 'check', tono: b.neto_usd < 0 ? 'malo' : 'normal' })}
    </section>`,
  );
  obtener('#periodo-conta', HTMLInputElement, ctx.zona).addEventListener('change', (ev) => {
    const v = ev.target instanceof HTMLInputElement ? ev.target.value : '';
    if (/^\d{4}-\d{2}$/.test(v)) {
      actualizar({ periodo: v });
      void navegar('contabilidad');
    }
  });
  const salida = obtener('#conta-aviso', HTMLElement, ctx.zona);
  obtener('#exportar', HTMLButtonElement, ctx.zona).addEventListener('click', (ev) => {
    const el = ev.currentTarget instanceof HTMLButtonElement ? ev.currentTarget : null;
    if (el) void exportar_(el, '/exportaciones/contabilidad.xlsx', 'contabilidad.xlsx', salida);
  });
}

// ───────────────────────── Módulos Premium + Candado ─────────────────────────

function vistaPremium(ctx: Contexto, codigo: string): void {
  const m = estado.modulos.find((x) => x.codigo === codigo);
  if (!m) {
    montar(ctx.zona, aviso('bad', 'Módulo no encontrado.'));
    return;
  }
  // Módulos con vista propia: gestionan su propio candado (pantalla de cristal + prueba gratuita) con lib/candado.ts.
  if (m.codigo === 'FACTURACION_MASIVA') {
    vistaFacturacionMasiva({
      zona: ctx.zona,
      vigente: ctx.vigente,
      modulo: m,
      puedeGenerar: esAdmin(),
      puedeProbar: m.prueba_utilizada === false && esConsolidado(),
      alcance: estado.usuario?.sede_id ?? null,
      alActivarPrueba: () => activarPrueba(m),
      alBloquear: (d) => void bloquearModulo(ctx, d),
      alSesionExpirada: () => cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.'),
    });
    return;
  }
  if (m.bloqueado) {
    // Prueba gratuita de 15 días: solo el acceso consolidado (admin sin sede) puede abrirla, una vez por módulo.
    montar(ctx.zona, pantallaBloqueada(m, m.prueba_utilizada === false && esConsolidado()));
    enlazarPrueba(ctx.zona, () => activarPrueba(m));
    return;
  }
  const hasta = m.en_prueba === true && m.expira_prueba_en ? m.expira_prueba_en : null;
  montar(
    ctx.zona,
    html`${encabezado(m.nombre, m.descripcion)}
    <div class="${CLS.tarjeta} flex flex-col gap-4 p-6">
      ${hasta ? aviso('warn', `Prueba gratuita vigente hasta el ${fechaHora(hasta)}. Después de esa fecha el módulo se bloquea automáticamente.`, 'Estás en periodo de prueba') : null}
      ${m.codigo === 'MULTI_SEDE_PREMIUM'
        ? html`${aviso('info', 'El Core Base incluye dos sedes (Acarigua y Barquisimeto). Con este módulo puedes registrar la tercera sede y las siguientes desde la sección Sedes.', 'Expansión multi-sede habilitada')}
          ${esConsolidado()
            ? html`<div><button type="button" id="ir-sedes" class="${boton(CLS.btnPrimario, 'min-h-10')}">${icono('building', 'h-4 w-4')}<span>Ir a Sedes</span></button></div>`
            : null}`
        : aviso('info', 'El módulo está habilitado para esta academia. Su lógica se publicará en la Fase 2 (ruta reservada en el servidor).', 'Módulo habilitado')}
    </div>`,
  );
  buscar('#ir-sedes', HTMLButtonElement, ctx.zona)?.addEventListener('click', () => void navegar('sedes'));
}

/** Admin sin sede asignada (SuperAdmin): único perfil que contrata/prueba módulos de la academia. */
const esConsolidado = (): boolean => estado.usuario?.rol === 'admin' && (estado.usuario.sede_id ?? null) === null;

/** Redibuja SOLO el ítem del menú de un módulo (quita/pone el candado) sin reconstruir el panel. */
function refrescarItemPremium(m: ModuloPremium): void {
  const actual = buscar(`[data-nav="premium:${m.codigo}"]`, HTMLElement);
  if (!actual) return;
  const nuevo = document.createElement('div');
  montar(nuevo, itemNav({ id: `premium:${m.codigo}`, titulo: m.nombre, icono: ICONO_MODULO[m.codigo] ?? 'chat', tooltip: m.bloqueado ? `${m.nombre} · ${m.tooltip ?? AVISO_PREMIUM}` : m.nombre, bloqueado: m.bloqueado }));
  const item = nuevo.firstElementChild;
  if (item) actual.replaceWith(item);
}

/** POST /api/premium/activar-prueba → vuelve a leer el catálogo (el servidor es la fuente de verdad) y abre el módulo. */
async function activarPrueba(m: ModuloPremium): Promise<void> {
  await bma.post<RespuestaPrueba>('/premium/activar-prueba', { modulo: m.codigo });
  const modulos = await bma.get<readonly ModuloPremium[]>('/premium/modulos');
  actualizar({ modulos });
  for (const x of modulos) refrescarItemPremium(x);
  notificar('ok', 'Prueba gratuita de 15 días activada.');
  await navegar(`premium:${m.codigo}`);
}

/**
 * El servidor respondió 403 MODULO_PREMIUM_DESHABILITADO en mitad de una sesión (p. ej. venció la prueba): se relee el catálogo para
 * poner el candado en el menú y se muestra la pantalla de cristal (con la oferta de prueba si todavía aplica).
 */
async function bloquearModulo(ctx: Contexto, d: DetalleModuloPremium): Promise<void> {
  try {
    const modulos = await bma.get<readonly ModuloPremium[]>('/premium/modulos');
    actualizar({ modulos });
    for (const x of modulos) refrescarItemPremium(x);
  } catch (e: unknown) {
    if (e instanceof BmaSesionExpiradaError) {
      cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.');
      return;
    }
    if (ctx.vigente()) pintarCandadoDesdeServidor(ctx.zona, d); // sin catálogo: al menos el candado correcto en pantalla
    return;
  }
  if (ctx.vigente()) await navegar(`premium:${d.modulo}`);
}

/** Si el servidor responde 403 MODULO_PREMIUM_DESHABILITADO para cualquier sección, se muestra el mismo candado. */
function pintarCandadoDesdeServidor(zona: HTMLElement, d: DetalleModuloPremium): void {
  const m = estado.modulos.find((x) => x.codigo === d.modulo);
  montar(zona, seccionBloqueada({ nombre: d.nombre, descripcion: m?.descripcion ?? 'Este módulo forma parte de la Fase 2 del sistema.', precio_usd: d.precio_usd }));
}

// ───────────────────────── Arranque ─────────────────────────

void arrancar();
