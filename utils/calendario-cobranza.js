'use strict';

/**
 * Calendario de cobranza — «regla de los 10 días».
 *
 * Las mensualidades regulares de la academia se pagan EXCLUSIVAMENTE durante los primeros 10 días de cada mes. De ahí salen
 * los dos disparadores automáticos del bot de WhatsApp (cron/whatsappCron.js):
 *
 *   · PREVENTIVA: 1 o 2 días antes del inicio del mes entrante (los dos últimos días del mes, hora de Caracas). Es el único momento
 *     en que se avisa, con el enlace seguro del portal, de la cuota que vencerá dentro de la ventana de pago del mes que llega.
 *   · MOROSIDAD:  a partir del día 11. Durante la ventana de pago (días 1 a 10) NO se declara ni se cobra mora.
 *
 * Todo es aritmética de fechas sobre cadenas 'YYYY-MM-DD' (ya en hora de Caracas: ver utils/fechas.hoyCaracas), sin `Date` locales ni
 * consultas a la base: así es determinista y se prueba sin infraestructura. Los límites son constantes de negocio, no variables de entorno.
 *
 * «1 o 2 días antes del inicio del mes entrante» es relativo al último día REAL del mes: en meses de 30 días son los días 29 y 30; en los de
 * 31, los días 30 y 31; en febrero, los días 27 y 28 (28 y 29 si es bisiesto).
 */
const { esFechaValida, diasEntre } = require('./fechas');

/** Último día de cada mes en que se aceptan pagos de la mensualidad. */
const DIA_FIN_VENTANA_PAGO = 10;
/** Primer día del mes en que una cuota sin pagar se declara en mora. */
const DIA_INICIO_MOROSIDAD = DIA_FIN_VENTANA_PAGO + 1;
/** Días de antelación (respecto al día 1 del mes entrante) en que corre la alerta preventiva. */
const DIAS_ANTES_PREVENTIVA = Object.freeze({ min: 1, max: 2 });

const dosDigitos = (n) => String(n).padStart(2, '0');

function exigirFecha(hoy) {
  if (!esFechaValida(hoy)) throw new TypeError(`[calendario-cobranza] Fecha inválida: ${hoy}`);
}

/** 'YYYY-MM-DD' → primer día del mes siguiente ('YYYY-MM-01'). Diciembre salta al enero del año siguiente. */
function inicioMesEntrante(hoy) {
  exigirFecha(hoy);
  const [anio, mes] = hoy.split('-').map(Number);
  const [a, m] = mes === 12 ? [anio + 1, 1] : [anio, mes + 1];
  return `${a}-${dosDigitos(m)}-01`;
}

/** Días calendario que faltan para el 1.º del mes entrante (el último día del mes devuelve 1). */
function diasParaMesEntrante(hoy) {
  return diasEntre(hoy, inicioMesEntrante(hoy));
}

/** Ventana de pago del mes entrante: del día 1 al día 10, ambos inclusive ('YYYY-MM-DD'). */
function ventanaPagoMesEntrante(hoy) {
  const desde = inicioMesEntrante(hoy);
  return { desde, hasta: `${desde.slice(0, 7)}-${dosDigitos(DIA_FIN_VENTANA_PAGO)}` };
}

/** ¿Hoy corre la alerta preventiva? (1 o 2 días antes del inicio del mes entrante.) */
function esDiaPreventivo(hoy) {
  const dias = diasParaMesEntrante(hoy);
  return dias >= DIAS_ANTES_PREVENTIVA.min && dias <= DIAS_ANTES_PREVENTIVA.max;
}

/** ¿Hoy corre la declaración de morosidad? (a partir del día 11 del mes en curso.) */
function esDiaMorosidad(hoy) {
  exigirFecha(hoy);
  return Number(hoy.slice(8, 10)) >= DIA_INICIO_MOROSIDAD;
}

/** Qué bloques de cobranza toca ejecutar hoy y cuál es la ventana de pago del mes entrante. */
function calendarioCobranza(hoy) {
  return { preventiva: esDiaPreventivo(hoy), morosidad: esDiaMorosidad(hoy), ventana: ventanaPagoMesEntrante(hoy) };
}

module.exports = {
  DIA_FIN_VENTANA_PAGO,
  DIA_INICIO_MOROSIDAD,
  DIAS_ANTES_PREVENTIVA,
  inicioMesEntrante,
  diasParaMesEntrante,
  ventanaPagoMesEntrante,
  esDiaPreventivo,
  esDiaMorosidad,
  calendarioCobranza,
};
