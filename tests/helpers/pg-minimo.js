'use strict';
/**
 * Cliente PostgreSQL MÍNIMO (protocolo v3, autenticación "trust", sin TLS) solo para las pruebas de integración cuando el paquete
 * `pg` no está instalado (p. ej. un entorno sin acceso al registro de npm). Implementa la parte de la API de node-postgres que
 * usa config/db.js: Pool({...}), pool.query(texto, valores), pool.connect() → cliente con query()/release(), pool.end(), pool.on(),
 * `types.setTypeParser`. Usa el protocolo EXTENDIDO (Parse/Bind/Execute) con parámetros en formato texto: la inferencia de tipos
 * de los $n es la misma que la del paquete `pg` real. Si `pg` está instalado, las pruebas lo usan y este archivo no se carga.
 */
const net = require('node:net');

// ── Tipos ───────────────────────────────────────────────────────────────────────────────────────
const parsers = new Map([
  [16, (v) => v === 't'],
  [21, (v) => parseInt(v, 10)],
  [23, (v) => parseInt(v, 10)],
  [26, (v) => parseInt(v, 10)],
  [700, parseFloat],
  [701, parseFloat],
  [114, JSON.parse],
  [3802, JSON.parse],
  [1114, (v) => new Date(`${v.replace(' ', 'T')}Z`)],
  [1184, (v) => new Date(v.replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00'))],
  [1082, (v) => new Date(`${v}T00:00:00`)], // por defecto pg devuelve Date local: config/db.js lo sobrescribe a texto
]);
const types = {
  setTypeParser(oid, fn) { parsers.set(oid, fn); },
  getTypeParser(oid) { return parsers.get(oid) || ((v) => v); },
};

function valorATexto(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function errorPg(campos) {
  const err = new Error(campos.M);
  Object.assign(err, {
    name: 'error', severity: campos.S, code: campos.C, detail: campos.D, hint: campos.H, table: campos.t, column: campos.c, constraint: campos.n,
  });
  return err;
}

// ── Cliente ─────────────────────────────────────────────────────────────────────────────────────
class Client {
  constructor(config = {}) {
    this.config = config;
    this.buf = Buffer.alloc(0);
    this.cola = Promise.resolve();
    this.espera = null; // { resolver, rechazar, resultado }
  }

  connect() {
    return new Promise((resolver, rechazar) => {
      const sock = net.connect({ host: this.config.host, port: this.config.port });
      this.sock = sock;
      this.inicio = { resolver, rechazar };
      sock.on('connect', () => {
        const params = { user: this.config.user, database: this.config.database, application_name: this.config.application_name || 'pg-minimo' };
        const cuerpo = Buffer.concat([
          Buffer.from(Object.entries(params).flatMap(([k, v]) => [k, v]).join('\0') + '\0\0'),
        ]);
        const head = Buffer.alloc(8);
        head.writeInt32BE(cuerpo.length + 8, 0);
        head.writeInt32BE(196608, 4);
        sock.write(Buffer.concat([head, cuerpo]));
      });
      sock.on('data', (d) => { this.buf = Buffer.concat([this.buf, d]); this.procesar(); });
      sock.on('error', (err) => this.fallar(err));
      sock.on('close', () => this.fallar(new Error('Connection terminated unexpectedly')));
    });
  }

  fallar(err) {
    if (this.inicio) { const { rechazar } = this.inicio; this.inicio = null; rechazar(err); }
    if (this.espera) { const { rechazar } = this.espera; this.espera = null; rechazar(err); }
  }

  procesar() {
    for (;;) {
      if (this.buf.length < 5) return;
      const len = this.buf.readInt32BE(1);
      if (this.buf.length < len + 1) return;
      const tipo = String.fromCharCode(this.buf[0]);
      const cuerpo = this.buf.subarray(5, len + 1);
      this.buf = this.buf.subarray(len + 1);
      this.mensaje(tipo, cuerpo);
    }
  }

  mensaje(tipo, b) {
    if (this.inicio) {
      if (tipo === 'R' && b.readInt32BE(0) !== 0) return this.fallar(new Error('pg-minimo: solo soporta autenticación trust'));
      if (tipo === 'E') return this.fallar(errorPg(this.campos(b)));
      if (tipo === 'Z') { const { resolver } = this.inicio; this.inicio = null; resolver(this); }
      return undefined;
    }
    const q = this.espera;
    if (!q) return undefined;
    const r = q.resultado;
    switch (tipo) {
      case 'T': {
        const n = b.readInt16BE(0);
        let o = 2;
        r.fields = [];
        for (let i = 0; i < n; i += 1) {
          const fin = b.indexOf(0, o);
          const name = b.toString('utf8', o, fin);
          o = fin + 1;
          const oid = b.readInt32BE(o + 6);
          o += 18;
          r.fields.push({ name, dataTypeID: oid });
        }
        break;
      }
      case 'D': {
        const n = b.readInt16BE(0);
        let o = 2;
        const fila = {};
        for (let i = 0; i < n; i += 1) {
          const l = b.readInt32BE(o);
          o += 4;
          if (l === -1) fila[r.fields[i].name] = null;
          else {
            const txt = b.toString('utf8', o, o + l);
            o += l;
            fila[r.fields[i].name] = types.getTypeParser(r.fields[i].dataTypeID)(txt);
          }
        }
        r.rows.push(fila);
        break;
      }
      case 'C': {
        const tag = b.toString('utf8', 0, b.length - 1);
        r.command = tag.split(' ')[0];
        const ultimo = Number(tag.split(' ').pop());
        r.rowCount = Number.isFinite(ultimo) ? ultimo : null;
        break;
      }
      case 'E':
        q.error = errorPg(this.campos(b));
        break;
      case 'Z': {
        this.espera = null;
        if (q.error) q.rechazar(q.error); else q.resolver(r);
        break;
      }
      default:
    }
    return undefined;
  }

  campos(b) {
    const out = {};
    let o = 0;
    while (b[o] !== 0) {
      const k = String.fromCharCode(b[o]);
      const fin = b.indexOf(0, o + 1);
      out[k] = b.toString('utf8', o + 1, fin);
      o = fin + 1;
    }
    return out;
  }

  msg(tipo, cuerpo) {
    const h = Buffer.alloc(5);
    h.write(tipo, 0, 'latin1');
    h.writeInt32BE(cuerpo.length + 4, 1);
    return Buffer.concat([h, cuerpo]);
  }

  query(texto, valores) {
    const ejecutar = () => new Promise((resolver, rechazar) => {
      this.espera = { resolver, rechazar, error: null, resultado: { rows: [], fields: [], rowCount: null, command: null } };
      const cstr = (s) => Buffer.concat([Buffer.from(s, 'utf8'), Buffer.from([0])]);
      if (!valores || valores.length === 0) {
        this.sock.write(this.msg('Q', cstr(texto)));
        return;
      }
      const i16 = (n) => { const x = Buffer.alloc(2); x.writeInt16BE(n); return x; };
      const i32 = (n) => { const x = Buffer.alloc(4); x.writeInt32BE(n); return x; };
      const parse = this.msg('P', Buffer.concat([cstr(''), cstr(texto), i16(0)]));
      const params = valores.map((v) => {
        const t = valorATexto(v);
        return t === null ? i32(-1) : Buffer.concat([i32(Buffer.byteLength(t)), Buffer.from(t, 'utf8')]);
      });
      const bind = this.msg('B', Buffer.concat([cstr(''), cstr(''), i16(0), i16(valores.length), ...params, i16(0)]));
      const describe = this.msg('D', Buffer.concat([Buffer.from('P'), cstr('')]));
      const exec = this.msg('E', Buffer.concat([cstr(''), i32(0)]));
      const sync = this.msg('S', Buffer.alloc(0));
      this.sock.write(Buffer.concat([parse, bind, describe, exec, sync]));
    });
    // Una consulta a la vez por conexión, como en pg.
    const p = this.cola.then(ejecutar, ejecutar);
    this.cola = p.catch(() => undefined);
    return p;
  }

  release(destruir) { if (this.alLiberar) this.alLiberar(destruir); }

  end() {
    return new Promise((resolver) => {
      if (!this.sock || this.sock.destroyed) return resolver();
      this.sock.once('close', resolver);
      this.sock.write(this.msg('X', Buffer.alloc(0)));
      this.sock.end();
      return undefined;
    });
  }
}

// ── Pool ────────────────────────────────────────────────────────────────────────────────────────
class Pool {
  constructor(config = {}) {
    this.config = config;
    this.max = config.max || 10;
    this.libres = [];
    this.todos = new Set();
    this.esperando = [];
    this.terminado = false;
  }

  on() { return this; }

  get totalCount() { return this.todos.size; }

  get idleCount() { return this.libres.length; }

  async adquirir() {
    if (this.terminado) throw new Error('Cannot use a pool after calling end on the pool');
    const libre = this.libres.pop();
    if (libre) return libre;
    if (this.todos.size < this.max) {
      const c = new Client(this.config);
      this.todos.add(c);
      try { await c.connect(); } catch (err) { this.todos.delete(c); throw err; }
      return c;
    }
    return new Promise((resolver) => this.esperando.push(resolver));
  }

  liberar(c, destruir) {
    if (destruir || this.terminado) {
      this.todos.delete(c);
      c.end().catch(() => undefined);
      return;
    }
    const sig = this.esperando.shift();
    if (sig) sig(c); else this.libres.push(c);
  }

  async connect() {
    const c = await this.adquirir();
    c.alLiberar = (destruir) => { c.alLiberar = null; this.liberar(c, destruir); };
    return c;
  }

  async query(texto, valores) {
    const c = await this.adquirir();
    try {
      return await c.query(texto, valores);
    } finally {
      this.liberar(c, false);
    }
  }

  async end() {
    this.terminado = true;
    await Promise.all([...this.todos].map((c) => c.end()));
    this.todos.clear();
    this.libres.length = 0;
  }
}

module.exports = { Pool, Client, types };
