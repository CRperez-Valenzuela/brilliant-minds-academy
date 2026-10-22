'use strict';
const axios = require('axios');
const cfg = require('../config/env');
const { ejecutar } = require('../config/db');
const { e } = require('../errors/AppError');

const CACHE_MS = 5 * 60_000;

/** Interpreta la respuesta de la fuente (DolarAPI Venezuela: { fuente, promedio, fechaActualizacion }). */
function extraerTasa(payload) {
  const tasa = Number(payload && payload.promedio);
  if (!Number.isFinite(tasa) || tasa <= 0) throw new Error('La fuente BCV no devolvió una tasa válida.');
  const fecha = payload.fechaActualizacion ? new Date(payload.fechaActualizacion) : null;
  return {
    tasa,
    fuente: `dolarapi:${payload.fuente || 'oficial'}`,
    fechaValor: fecha && !Number.isNaN(fecha.getTime()) ? fecha : null,
  };
}

const repoSql = {
  async guardar({ tasa, fuente, fechaValor }) {
    const r = await ejecutar(
      `INSERT INTO tasas_bcv (tasa, fuente, fecha_valor) VALUES ($1, $2, $3) RETURNING capturada_en`,
      [tasa, fuente, fechaValor ? fechaValor.toISOString() : null],
    );
    return r.rows[0].capturada_en;
  },
  async ultima() {
    const r = await ejecutar('SELECT tasa, fuente, fecha_valor, capturada_en FROM tasas_bcv ORDER BY capturada_en DESC LIMIT 1');
    return r.rows[0] || null;
  },
};

/**
 * Servicio de tasa oficial BCV.
 *  - `fresca: true` consulta la fuente en ese instante (alertas de WhatsApp: "al segundo exacto del envío").
 *  - Sin `fresca`, reutiliza la captura de los últimos 5 min (formulario público).
 *  - Si la fuente cae, usa la última tasa guardada SOLO si tiene <= BCV_MAX_ANTIGUEDAD_HORAS y la marca `desactualizada: true`.
 *    Pasado ese límite responde 503 TASA_BCV_NO_DISPONIBLE: nunca se cobra con una tasa vieja sin avisar.
 */
function crearBcvService({ http = axios, repo = repoSql, url = cfg.bcv.url, timeoutMs = cfg.bcv.timeoutMs, maxHoras = cfg.bcv.maxAntiguedadHoras, ahora = () => Date.now() } = {}) {
  let cache = null;

  async function obtenerTasa({ fresca = false } = {}) {
    if (!fresca && cache && ahora() - cache.en < CACHE_MS) return cache.valor;
    try {
      const { data } = await http.get(url, { timeout: timeoutMs, headers: { Accept: 'application/json' } });
      const t = extraerTasa(data);
      let capturadaEn = new Date(ahora());
      try {
        capturadaEn = await repo.guardar(t);
      } catch (err) {
        console.error('[bcv] No se pudo guardar la tasa (se usa igual):', err.message);
      }
      const valor = { tasa: t.tasa, fuente: t.fuente, fechaValor: t.fechaValor, capturadaEn, desactualizada: false };
      cache = { valor, en: ahora() };
      return valor;
    } catch (err) {
      console.error('[bcv] Fuente no disponible:', err.message);
      let ultima = null;
      try {
        ultima = await repo.ultima();
      } catch (dbErr) {
        console.error('[bcv] Tampoco se pudo leer la última tasa guardada:', dbErr.message);
      }
      if (ultima) {
        const horas = (ahora() - new Date(ultima.capturada_en).getTime()) / 3_600_000;
        if (horas <= maxHoras) {
          return { tasa: Number(ultima.tasa), fuente: ultima.fuente, fechaValor: ultima.fecha_valor, capturadaEn: ultima.capturada_en, desactualizada: true };
        }
      }
      throw e.noDisponible('TASA_BCV_NO_DISPONIBLE', 'No se pudo obtener la tasa oficial del BCV. Intenta de nuevo en unos minutos.');
    }
  }

  return { obtenerTasa };
}

module.exports = { crearBcvService, extraerTasa, bcv: crearBcvService() };
