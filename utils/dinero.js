'use strict';

/**
 * Aritmética monetaria exacta con BigInt (centavos y tasa × 10⁴). Evita los errores de coma flotante:
 *   0.1 + 0.2 !== 0.3, pero aquí todo se calcula en enteros y se redondea una sola vez (mitad hacia arriba).
 */
const aCentavos = (monto) => BigInt(Math.round(Number(monto) * 100));
const deCentavos = (c) => Number(c) / 100;

/** USD → Bs. con la tasa BCV (Bs. por USD). Devuelve un número con 2 decimales. */
function usdABs(montoUsd, tasa) {
  const t = BigInt(Math.round(Number(tasa) * 10000));
  const bsCentavos = (aCentavos(montoUsd) * t + 5000n) / 10000n;
  return deCentavos(bsCentavos);
}

function sumar(...montos) {
  return deCentavos(montos.reduce((acc, m) => acc + aCentavos(m), 0n));
}

/** horas × tarifa por hora (ambos con 2 decimales) → USD con 2 decimales. */
function horasPorTarifa(horas, tarifaUsd) {
  const h = BigInt(Math.round(Number(horas) * 100));
  const total = (h * aCentavos(tarifaUsd) + 50n) / 100n;
  return deCentavos(total);
}

const fmtUsd = (n) => `US$ ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtBs = (n) => `Bs. ${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtTasa = (n) => Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

module.exports = { usdABs, sumar, horasPorTarifa, fmtUsd, fmtBs, fmtTasa };
