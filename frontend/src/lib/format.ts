/** Formato de dinero y fechas. "Hoy" siempre es la fecha de Caracas (UTC-4), igual que el backend. */

const ZONA = 'America/Caracas';

const fmtUsd = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBs = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtTasa = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

export const usd = (n: number): string => `US$ ${fmtUsd.format(n)}`;
export const bs = (n: number): string => `Bs. ${fmtBs.format(n)}`;
export const tasa = (n: number): string => fmtTasa.format(n);

/** 'AAAA-MM-DD' → 'DD/MM/AAAA' sin pasar por Date (evita el corrimiento de un día por zona horaria). */
export function fechaCorta(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function fechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-VE', { timeZone: ZONA, dateStyle: 'short', timeStyle: 'short' });
}

export function horaConSegundos(d: Date): string {
  return d.toLocaleTimeString('es-VE', { timeZone: ZONA, hour12: false });
}

/** Fecha de hoy en Caracas como 'AAAA-MM-DD'. */
export function hoyCaracas(ahora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
  return partes; // en-CA ya produce AAAA-MM-DD
}

export const periodoActual = (): string => hoyCaracas().slice(0, 7);

/** Cantidad de días del período 'AAAA-MM'. */
export function diasDelPeriodo(periodo: string): number {
  const m = /^(\d{4})-(\d{2})$/.exec(periodo);
  if (!m) return 31;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]), 0)).getUTCDate();
}

export function esVencida(fechaVencimiento: string): boolean {
  return fechaVencimiento < hoyCaracas();
}

export const NOMBRE_METODO: Readonly<Record<string, string>> = {
  ZELLE: 'Zelle',
  BINANCE: 'Binance',
  PAYPAL: 'PayPal',
  PAGO_MOVIL: 'Pago Móvil',
};

export const nombreMetodo = (m: string): string => NOMBRE_METODO[m] ?? m;
