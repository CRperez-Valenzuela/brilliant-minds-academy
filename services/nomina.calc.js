'use strict';
const { horasPorTarifa, sumar } = require('../utils/dinero');

/**
 * Nómina mixta. Modalidades:
 *   Fijo        → salario mensual fijo (las horas se registran pero no se pagan aparte)
 *   Honorarios  → horas dictadas × tarifa por hora
 *   Mixto       → salario fijo + horas × tarifa
 * Aritmética exacta en centavos (utils/dinero).
 */
function calcularNomina({ modalidad, salarioFijoUsd = 0, tarifaHoraUsd = 0, horas = 0 }) {
  if (!['Fijo', 'Honorarios', 'Mixto'].includes(modalidad)) throw new Error(`Modalidad desconocida: ${modalidad}`);
  const paga = { fijo: modalidad !== 'Honorarios', horas: modalidad !== 'Fijo' };
  const montoFijoUsd = paga.fijo ? Number(salarioFijoUsd) : 0;
  const tarifa = paga.horas ? Number(tarifaHoraUsd) : 0;
  const montoHorasUsd = paga.horas ? horasPorTarifa(horas, tarifa) : 0;
  return {
    montoFijoUsd,
    horasTotales: Number(horas),
    tarifaHoraUsd: tarifa,
    montoHorasUsd,
    totalUsd: sumar(montoFijoUsd, montoHorasUsd),
  };
}

module.exports = { calcularNomina };
