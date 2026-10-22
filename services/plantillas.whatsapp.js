'use strict';
const { fmtUsd, fmtBs, fmtTasa } = require('../utils/dinero');

const NOMBRE_METODO = { ZELLE: 'Zelle', BINANCE: 'Binance Pay', PAYPAL: 'PayPal', PAGO_MOVIL: 'Pago Móvil' };

const fechaLarga = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

function bloqueCuentas(cuentas) {
  if (!cuentas.length) return '• Consulta los datos de pago en el portal.';
  return cuentas.map((c) => `• ${NOMBRE_METODO[c.metodo] || c.metodo}: ${c.detalle} (${c.titular})`).join('\n');
}

/**
 * [Alerta Preventiva] — de 3 a 5 días antes del vencimiento. Tono recordatorio, amable e informativo.
 */
function plantillaPreventiva({ academia, representante, estudiante, concepto, montoUsd, montoBs, tasa, fechaVencimiento, diasRestantes, enlacePortal }) {
  return [
    `Hola, ${representante}. 👋`,
    '',
    `Te escribimos de ${academia} con un recordatorio amable: la cuota de *${estudiante}* vence en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}.`,
    '',
    `📌 Concepto: ${concepto}`,
    `📅 Vence: ${fechaLarga(fechaVencimiento)}`,
    `💵 Monto: ${fmtUsd(montoUsd)}`,
    `🇻🇪 Equivalente: ${fmtBs(montoBs)} (tasa BCV de hoy: ${fmtTasa(tasa)} Bs. por US$)`,
    '',
    'Puedes ver las formas de pago y registrar tu referencia en tu portal privado:',
    enlacePortal,
    '',
    '¡Gracias por tu puntualidad! 💙',
  ].join('\n');
}

/**
 * [Alerta por Morosidad] — el estudiante pasó la fecha de corte. Tono formal de cobranza.
 */
function plantillaMorosidad({ academia, representante, estudiante, montoUsd, montoBs, tasa, cuentas, diasMora, enlacePortal }) {
  return [
    `Estimado(a) ${representante}:`,
    '',
    `${academia} le informa que el estudiante *${estudiante}* presenta una deuda vencida desde hace ${diasMora} día${diasMora === 1 ? '' : 's'}.`,
    '',
    `💵 Monto adeudado: ${fmtUsd(montoUsd)}`,
    `🇻🇪 Equivalente: ${fmtBs(montoBs)} (tasa oficial BCV: ${fmtTasa(tasa)} Bs. por US$)`,
    '',
    'Cuentas habilitadas para el pago:',
    bloqueCuentas(cuentas),
    '',
    'Es indispensable registrar la referencia bancaria de su pago en su portal privado para habilitar el acceso a clases del estudiante:',
    enlacePortal,
    '',
    'Atentamente,',
    `Administración · ${academia}`,
  ].join('\n');
}

module.exports = { plantillaPreventiva, plantillaMorosidad };
