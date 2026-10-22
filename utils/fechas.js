'use strict';

/** Caracas = UTC-4 todo el año (sin horario de verano). Toda regla de "hoy" se evalúa en ese huso. */
const OFFSET_CARACAS_MS = 4 * 3600_000;

function hoyCaracas(ahora = Date.now()) {
  return new Date(ahora - OFFSET_CARACAS_MS).toISOString().slice(0, 10);
}

const FECHA_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function esFechaValida(s) {
  const m = FECHA_RE.exec(String(s));
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const f = new Date(Date.UTC(y, mo - 1, d));
  return f.getUTCFullYear() === y && f.getUTCMonth() === mo - 1 && f.getUTCDate() === d;
}

/**
 * Valor de un parámetro DATE para `pg`: la cadena 'YYYY-MM-DD' tal cual. NO se convierte a Date: node-postgres serializa los
 * Date en la zona horaria del proceso y una medianoche UTC puede caer en el día anterior (Caracas es UTC-4).
 */
function aFechaSql(s) {
  if (!esFechaValida(s)) throw new TypeError(`[fechas] Fecha inválida para SQL: ${s}`);
  return String(s);
}

/** Instante (Date) → cadena ISO-8601 UTC para un parámetro TIMESTAMPTZ (sin ambigüedad de huso). */
function aInstanteSql(d) {
  return (d instanceof Date ? d : new Date(d)).toISOString();
}

/** Diferencia en días calendario b - a (ambas 'YYYY-MM-DD'). */
function diasEntre(a, b) {
  const t = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((t(b) - t(a)) / 86_400_000);
}

function periodoActual(ahora = Date.now()) {
  return hoyCaracas(ahora).slice(0, 7);
}

const PERIODO_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const esPeriodoValido = (p) => PERIODO_RE.test(String(p));

/** 'YYYY-MM' → { desde:'YYYY-MM-01', hasta:'YYYY-MM-<último>', inicioUtc:Date, finUtc:Date } (límites a medianoche de Caracas). */
function limitesPeriodo(periodo) {
  const [y, m] = periodo.split('-').map(Number);
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    desde: `${periodo}-01`,
    hasta: `${periodo}-${pad(ultimo)}`,
    inicioUtc: new Date(Date.UTC(y, m - 1, 1) + OFFSET_CARACAS_MS),
    finUtc: new Date(Date.UTC(y, m, 1) + OFFSET_CARACAS_MS),
  };
}

module.exports = { hoyCaracas, esFechaValida, aFechaSql, aInstanteSql, diasEntre, periodoActual, esPeriodoValido, limitesPeriodo };
