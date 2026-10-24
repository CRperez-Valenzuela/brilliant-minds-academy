/**
 * Contratos JSON del backend (Express + PostgreSQL/Supabase). Todo es de solo lectura (`readonly`):
 * lo que llega de la API nunca se muta; la UI deriva copias nuevas.
 * Convención del servidor: DATE → 'AAAA-MM-DD' (texto), NUMERIC/BIGINT → number, TIMESTAMPTZ → ISO-8601.
 */

// ───────────────────────── Dominio ─────────────────────────

export type RolUsuario = 'admin' | 'secretaria';

export interface Usuario {
  readonly id: number;
  readonly nombre: string;
  readonly email: string;
  readonly rol: RolUsuario;
  /** NULL = acceso consolidado (SuperAdmin); un número fija al usuario a esa sede. */
  readonly sede_id?: number | null;
}

export type EstadoDinamico =
  | 'Activo'
  | 'Moroso'
  | 'Fuera de la Academia'
  | 'Pendiente por Validación Administrativa';

export type EstatusPago = 'Al día' | 'Moroso' | 'Pendiente de Validación' | 'N/A';

export interface Estudiante {
  readonly id: number;
  readonly representante_id: number;
  readonly nombres: string;
  readonly apellidos: string;
  readonly grado_solicitado: string;
  readonly estado_dinamico: EstadoDinamico;
  readonly estatus_pago: EstatusPago;
  readonly deuda_vencida_usd: number;
}

/** Fila de `GET /api/estudiantes` (vw_estudiantes_estado + representante). */
export interface EstudianteListado extends Estudiante {
  readonly representante: string;
  readonly telefono_representante: string | null;
  readonly cuotas_vencidas: number;
}

export type TipoCuota = 'MATRICULA' | 'MENSUALIDAD' | 'OTRO';
export type EstadoCuota = 'Pendiente' | 'En Revisión' | 'Pagada' | 'Anulada';

export interface Cuota {
  readonly id: number;
  readonly estudiante_id: number;
  readonly tipo: TipoCuota;
  readonly concepto: string;
  readonly monto_usd: number;
  readonly monto_bs: number;
  readonly fecha_vencimiento: string;
  readonly estado: EstadoCuota;
}

export type MetodoPago = 'ZELLE' | 'BINANCE' | 'PAYPAL' | 'PAGO_MOVIL';
export type EstadoPagoReferencia = 'Por Validar' | 'Aprobada' | 'Rechazada';

export interface PagoReferencia {
  readonly id: number;
  readonly cuota_id: number;
  readonly referencia: string;
  readonly metodo_pago: MetodoPago;
  readonly monto_usd: number;
  readonly monto_bs: number;
  readonly tasa_bcv: number;
  readonly estado: EstadoPagoReferencia;
}

/** Cuenta bancaria/billetera de la academia donde el representante deposita. */
export interface CuentaPago {
  readonly id: number;
  readonly metodo: MetodoPago;
  readonly titular: string;
  readonly detalle: string;
}

// ───────────────────────── Envoltorios de la API ─────────────────────────

export interface Paginacion {
  readonly pagina: number;
  readonly limite: number;
  readonly total: number;
}

export interface RespuestaOk<T> {
  readonly ok: true;
  readonly data: T;
  readonly paginacion?: Paginacion;
}

export interface DetalleCampo {
  readonly campo: string;
  readonly mensaje: string;
}

export interface CuerpoError {
  readonly codigo?: string;
  readonly mensaje: string;
  readonly detalles?: unknown;
  readonly requestId?: string;
}

export interface RespuestaError {
  readonly ok: false;
  readonly error: CuerpoError;
}

export type RespuestaApi<T> = RespuestaOk<T> | RespuestaError;

/** Datos adjuntos al error 403 MODULO_PREMIUM_DESHABILITADO. */
export interface DetalleModuloPremium {
  readonly modulo: string;
  readonly nombre: string;
  readonly precio_usd: number;
}

// ───────────────────────── Autenticación ─────────────────────────

export interface CredencialesLogin {
  readonly email: string;
  readonly password: string;
}

export interface RespuestaLogin {
  readonly token: string;
  readonly usuario: Usuario;
}

/** `GET /api/auth/me` */
export interface RespuestaMe {
  readonly usuario: Usuario;
}

// ───────────────────────── Admisiones públicas ─────────────────────────

/** `GET /api/public/admisiones/config` */
export interface ConfigAdmisiones {
  readonly matricula_usd: number;
  readonly tasa_bcv: number;
  readonly tasa_desactualizada: boolean;
  readonly matricula_bs: number;
  readonly cuentas: readonly CuentaPago[];
}

/** Sede fijada por un enlace de invitación. */
export interface SedeInvitacion {
  readonly id: number;
  readonly nombre: string;
}

/**
 * `GET /api/public/admisiones/invitacion/:token` — la misma configuración del formulario (con las cuentas de cobro de ESA sede) más
 * la sede y el nivel asignado, que el servidor vuelve a imponer al inscribir. 410 INVITACION_NO_VALIDA si el enlace no sirve.
 */
export interface ConfigInvitacion extends ConfigAdmisiones {
  readonly sede: SedeInvitacion;
  readonly nivel_asignado: string;
}

export function esConfigInvitacion(c: ConfigAdmisiones | null): c is ConfigInvitacion {
  return c !== null && 'nivel_asignado' in c && typeof (c as { nivel_asignado?: unknown }).nivel_asignado === 'string';
}

export type TipoSangre = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

/** Campos de texto del formulario `POST /api/public/admisiones` (multipart). */
export interface SolicitudAdmisionTexto {
  readonly alumno_nombres: string;
  readonly alumno_apellidos: string;
  readonly alumno_cedula: string;
  readonly alumno_fecha_nacimiento: string;
  readonly grado_solicitado: string;
  readonly colegio_procedencia: string;
  readonly ultimo_grado_aprobado: string;
  readonly tipo_sangre: TipoSangre | '';
  readonly alergias: string;
  readonly condiciones_medicas: string;
  readonly medicamentos: string;
  readonly emergencia_nombre: string;
  readonly emergencia_telefono: string;
  readonly representante_nombres: string;
  readonly representante_apellidos: string;
  readonly representante_cedula: string;
  readonly representante_email: string;
  readonly telefono_codigo: string;
  readonly telefono_numero: string;
  readonly metodo_pago: MetodoPago;
  readonly referencia_bancaria: string;
}

export type CampoArchivoAdmision = 'foto_carnet' | 'cedula_identidad' | 'acta_nacimiento';

export interface RespuestaAdmision {
  readonly estudiante_id: number;
  readonly estatus: string;
  readonly carpeta_drive: string | null;
  readonly referencia: string;
  readonly metodo_pago: MetodoPago;
  readonly monto_usd: number;
  readonly monto_bs: number;
  readonly tasa_bcv: number;
  readonly tasa_desactualizada: boolean;
  /** Solo con enlace de invitación: sede y nivel que el servidor impuso. */
  readonly sede_id?: number | null;
  readonly grado_solicitado?: string;
}

// ───────────────────────── Portal del representante ─────────────────────────

export type CuotaPortal = Pick<
  Cuota,
  'id' | 'concepto' | 'monto_usd' | 'monto_bs' | 'fecha_vencimiento' | 'estado'
>;

/** `GET /api/portal/:token` */
export interface EstadoCuentaPortal {
  readonly estudiante: string;
  readonly estado: EstadoDinamico;
  readonly estatus_pago: EstatusPago;
  readonly tasa_bcv: number;
  readonly tasa_desactualizada: boolean;
  readonly cuentas: readonly CuentaPago[];
  readonly cuotas: readonly CuotaPortal[];
}

/** Cuerpo de `POST /api/portal/:token/referencias`. */
export interface DeclararReferenciaPeticion {
  readonly cuota_id: number;
  readonly referencia: string;
  readonly metodo_pago: MetodoPago;
}

export interface DeclararReferenciaRespuesta {
  readonly pago_id: number;
  readonly estado: 'Por Validar';
  readonly monto_usd: number;
  readonly monto_bs: number;
  readonly tasa_bcv: number;
}

// ───────────────────────── Tablero financiero y auditoría ─────────────────────────

export interface TotalConCantidad {
  readonly monto_usd: number;
  readonly cantidad: number;
}

export interface CobroDiario {
  readonly dia: string;
  readonly monto_usd: number;
}

export interface ConteoEstudiantes {
  readonly activos: number;
  readonly morosos: number;
  readonly fuera_de_la_academia: number;
  readonly pendientes_validacion: number;
  readonly total: number;
}

/** `GET /api/facturacion/tablero?periodo=AAAA-MM` (el conteo de estudiantes vive en `GET /api/estudiantes/resumen` → `ConteoEstudiantes`). */
export interface TableroFacturacion {
  readonly periodo: string;
  readonly cobrado: TotalConCantidad;
  readonly saldos_vencidos: TotalConCantidad;
  readonly cuentas_pendientes: TotalConCantidad;
  readonly referencias_por_validar: number;
  readonly cobrado_por_dia: readonly CobroDiario[];
}

/** Fila de `GET /api/facturacion/auditoria`. */
export interface ReferenciaAuditoria
  extends Pick<PagoReferencia, 'id' | 'referencia' | 'metodo_pago' | 'monto_usd' | 'monto_bs' | 'tasa_bcv' | 'estado'> {
  readonly declarado_en: string;
  readonly revisado_en: string | null;
  readonly nota_revision: string | null;
  readonly estudiante_id: number;
  readonly estudiante: string;
  readonly representante: string;
  readonly telefono_representante: string | null;
  readonly cuota_id: number;
  readonly concepto: string;
  readonly tipo_cuota: TipoCuota;
  readonly fecha_vencimiento: string;
}

export interface ResultadoRevision {
  readonly pagoId: number;
  readonly estudianteId: number;
  readonly estado_dinamico: EstadoDinamico;
  readonly estatus_pago: EstatusPago;
  readonly deuda_vencida_usd: number;
}

export interface CuerpoRevision {
  readonly nota?: string;
}

// ───────────────────────── Otros módulos del panel ─────────────────────────

export type TipoAlertaWhatsapp = 'preventiva' | 'morosidad';

export interface AlertaWhatsapp {
  readonly notificacion_id: number;
  readonly tipo: 'PREVENTIVA' | 'MOROSIDAD';
  readonly estado: string;
  readonly telefono: string;
  readonly mensaje: string;
  readonly enlace_whatsapp: string;
  readonly monto_usd: number;
  readonly monto_bs: number;
  readonly tasa_bcv: number;
}

export interface BalanceContable {
  readonly periodo: string;
  readonly ingresos_usd: number;
  readonly egresos_usd: number;
  readonly neto_usd: number;
}

/** `GET /api/premium/modulos` */
export type CodigoModuloPremium =
  | 'IA_ATENCION'
  | 'WHATSAPP_AUTOMATICO'
  | 'BANCAMIGA'
  | 'APP_MOVIL'
  | 'FACHADA_WEB';

export interface ModuloPremium {
  readonly codigo: CodigoModuloPremium;
  readonly nombre: string;
  readonly descripcion: string;
  readonly precio_usd: number;
  readonly vista: string;
  readonly habilitado: boolean;
  readonly bloqueado: boolean;
  readonly tooltip: string | null;
  /** Prueba gratuita de 15 días: vigente, cuándo vence y si todavía puede activarse. */
  readonly en_prueba?: boolean;
  readonly expira_prueba_en?: string | null;
  readonly dias_restantes_prueba?: number | null;
  readonly prueba_utilizada?: boolean;
}

/** `POST /api/premium/activar-prueba` */
export interface RespuestaPrueba {
  readonly modulo: CodigoModuloPremium;
  readonly nombre: string;
  readonly habilitado: boolean;
  readonly en_prueba: boolean;
  readonly dias_prueba: number;
  readonly iniciada_en: string;
  readonly expira_prueba_en: string;
}

// ───────────────────────── Estado de la interfaz ─────────────────────────

export type VistaAdmin = 'dashboard' | 'estudiantes' | 'auditoria' | 'contabilidad';

export interface EstadoSidebar {
  readonly colapsado: boolean;
}

export type FiltroEstudiantes = '' | EstadoDinamico;
