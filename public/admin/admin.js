'use strict';
// AdminDashboard unificado. TODO dato dinámico se inserta con esc() (los datos del formulario público no son de confianza).
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const usd = (n) => `US$ ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ICONOS = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M17 5a3.5 3.5 0 010 6M22 20c0-2.5-1.5-4.5-4-5.5"/>',
  inbox: '<path d="M3 13l3-9h12l3 9v7H3zM3 13h6a3 3 0 006 0h6"/>', book: '<path d="M4 4h12a4 4 0 014 4v12H8a4 4 0 01-4-4zM4 16a4 4 0 014-4h12"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>', down: '<path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>',
};
const ico = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n]}</svg>`;
const sget = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const sset = (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

async function api(ruta, opts = {}) {
  const r = await fetch(`/api${ruta}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(sget('tok') ? { Authorization: `Bearer ${sget('tok')}` } : {}), ...(opts.headers || {}) } });
  const j = await r.json().catch(() => ({ ok: false, error: { mensaje: 'Respuesta no válida del servidor.' } }));
  if (r.status === 401 && ruta !== '/auth/login') { sset('tok', null); location.reload(); }
  if (!j.ok) { const e = new Error(j.error?.mensaje || 'Error'); e.detalles = j.error?.detalles; e.codigo = j.error?.codigo; throw e; }
  return j;
}
async function descargar(ruta, nombre) {
  const r = await fetch(`/api${ruta}`, { headers: { Authorization: `Bearer ${sget('tok')}` } });
  if (!r.ok) { const j = await r.json().catch(() => null); throw new Error(j?.error?.mensaje || 'No se pudo exportar'); }
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(await r.blob()), download: nombre });
  a.click(); URL.revokeObjectURL(a.href);
}

const VISTAS = [
  { id: 'dashboard', t: 'Dashboard', i: 'home' }, { id: 'estudiantes', t: 'Estudiantes', i: 'users' },
  { id: 'auditoria', t: 'Auditoría de referencias', i: 'inbox' }, { id: 'contabilidad', t: 'Contabilidad', i: 'book' },
];
let modulos = []; let vista = 'dashboard'; let tabEstado = '';

function login() {
  $('#root').innerHTML = `<form class="login card" id="f"><h1>Brilliant Minds Academy</h1><p class="sub">Panel administrativo</p><div id="e"></div>
    <label for="em">Correo</label><input id="em" type="email" required autocomplete="username"><label for="pw">Contraseña</label><input id="pw" type="password" required autocomplete="current-password">
    <p><button class="btn p" style="width:100%;justify-content:center">Entrar</button></p></form>`;
  $('#f').onsubmit = async (ev) => {
    ev.preventDefault();
    try { const j = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: $('#em').value, password: $('#pw').value }) }); sset('tok', j.data.token); sset('usr', JSON.stringify(j.data.usuario)); arrancar(); }
    catch (e) { $('#e').innerHTML = `<div class="msg err" role="alert">${esc(e.message)}</div>`; }
  };
}

async function arrancar() {
  if (!sget('tok')) return login();
  try { modulos = (await api('/premium/modulos')).data; } catch { modulos = []; }
  const colapsado = (() => { try { return localStorage.getItem('sb') === '1'; } catch { return false; } })();
  $('#root').innerHTML = `<div class="app ${colapsado ? 'collapsed' : ''}" id="app"><aside class="sidebar" aria-label="Menú principal">
    <div class="brand"><div class="logo">B</div><span>BMA Admin</span></div>
    ${VISTAS.map((v) => `<button class="nav" data-v="${v.id}" data-tip="${esc(v.t)}">${ico(v.i)}<span>${esc(v.t)}</span></button>`).join('')}
    <div class="sec">Módulos Premium</div>
    ${modulos.map((m) => `<button class="nav ${m.bloqueado ? 'locked' : ''}" data-v="premium:${esc(m.codigo)}" data-tip="${esc(m.bloqueado ? m.tooltip : m.nombre)}">${ico('chat')}<span>${esc(m.nombre)}</span>${m.bloqueado ? `<span class="lock">${ico('lock')}</span>` : ''}</button>`).join('')}
    <button class="nav" id="out" data-tip="Salir">${ico('logout')}<span>Salir</span></button>
    <button class="toggle" id="tg" aria-label="Contraer menú">${ico('menu')}</button></aside><main id="main" tabindex="-1"></main></div>`;
  $('#tg').onclick = () => { const c = $('#app').classList.toggle('collapsed'); try { localStorage.setItem('sb', c ? '1' : '0'); } catch { /* ok */ } };
  $('#out').onclick = () => { sset('tok', null); location.reload(); };
  document.querySelectorAll('.nav[data-v]').forEach((b) => (b.onclick = () => ir(b.dataset.v)));
  ir(vista);
}

async function ir(id) {
  vista = id;
  document.querySelectorAll('.nav[data-v]').forEach((b) => (b.dataset.v === id ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  const main = $('#main'); main.innerHTML = '<p class="sub">Cargando…</p>';
  try { await (id.startsWith('premium:') ? vPremium(main, id.slice(8)) : { dashboard: vDashboard, estudiantes: vEstudiantes, auditoria: vAuditoria, contabilidad: vContabilidad }[id](main)); }
  catch (e) { main.innerHTML = `<div class="msg err" role="alert">${esc(e.message)}</div>`; }
}

async function vDashboard(m) {
  const d = (await api('/facturacion/tablero')).data; const max = Math.max(1, ...d.cobrado_por_dia.map((x) => x.monto_usd));
  m.innerHTML = `<h1>Dashboard</h1><p class="sub">Recaudación del mes ${esc(d.periodo)} · tiempo real</p>
  <div class="grid"><div class="card kpi"><small>Cobrado</small><b>${usd(d.cobrado.monto_usd)}</b><small>${d.cobrado.cantidad} pagos</small></div>
  <div class="card kpi"><small>Saldos vencidos</small><b style="color:var(--bad)">${usd(d.saldos_vencidos.monto_usd)}</b><small>${d.saldos_vencidos.cantidad} cuotas</small></div>
  <div class="card kpi"><small>Cuentas pendientes del mes</small><b>${usd(d.cuentas_pendientes.monto_usd)}</b><small>${d.cuentas_pendientes.cantidad} cuotas</small></div>
  <div class="card kpi"><small>Referencias por validar</small><b>${d.referencias_por_validar}</b><small>en bandeja</small></div></div>
  <div class="grid"><div class="card kpi"><small>Activos</small><b>${d.estudiantes.activos}</b></div><div class="card kpi"><small>Morosos</small><b>${d.estudiantes.morosos}</b></div>
  <div class="card kpi"><small>Fuera de la Academia</small><b>${d.estudiantes.fuera_de_la_academia}</b></div><div class="card kpi"><small>Pendientes de validación</small><b>${d.estudiantes.pendientes_validacion}</b></div></div>
  <div class="card"><b>Cobrado por día</b><div class="bars" role="img" aria-label="Cobrado por día">${d.cobrado_por_dia.map((x) => `<div style="height:${Math.round((x.monto_usd / max) * 100)}%" data-v="${esc(x.dia)} · ${usd(x.monto_usd)}"></div>`).join('') || '<p class="sub">Sin cobros este mes.</p>'}</div></div>`;
}

async function vEstudiantes(m) {
  const q = tabEstado ? `?estado=${encodeURIComponent(tabEstado)}` : '';
  const j = await api(`/estudiantes${q}`);
  const tabs = ['', 'Activo', 'Moroso', 'Fuera de la Academia', 'Pendiente por Validación Administrativa'];
  m.innerHTML = `<h1>Estudiantes</h1><p class="sub">${j.paginacion.total} resultado(s)</p><div class="tabs">${tabs.map((t) => `<button aria-pressed="${t === tabEstado}" data-t="${esc(t)}">${esc(t || 'Todos')}</button>`).join('')}</div>
  <div class="card scroll"><table><thead><tr><th>Estudiante</th><th>Grado</th><th>Representante</th><th>Estado</th><th>Deuda vencida</th><th>Alertas WhatsApp</th></tr></thead><tbody>
  ${j.data.map((s) => `<tr><td>${esc(s.apellidos)}, ${esc(s.nombres)}</td><td>${esc(s.grado_solicitado)}</td><td>${esc(s.representante)}</td><td><span class="tag ${esc(s.estado_dinamico.split(' ')[0])}">${esc(s.estado_dinamico)}</span></td><td>${usd(s.deuda_vencida_usd)}</td>
  <td><button class="btn sm" data-a="preventiva" data-id="${s.id}">Preventiva</button> <button class="btn sm bad" data-a="morosidad" data-id="${s.id}">Morosidad</button></td></tr>`).join('') || '<tr><td colspan="6">Sin resultados.</td></tr>'}</tbody></table></div><dialog id="dlg"></dialog>`;
  m.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => { tabEstado = b.dataset.t; ir('estudiantes'); }));
  m.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => alerta(b.dataset.a, b.dataset.id)));
}

async function alerta(tipo, id) {
  const dlg = $('#dlg');
  try {
    const r = (await api(`/notificaciones/whatsapp/${tipo}/${id}`, { method: 'POST', body: '{}' })).data;
    dlg.innerHTML = `<h2>Alerta ${esc(tipo)}</h2><p class="sub">${usd(r.monto_usd)} · Bs. ${esc(r.monto_bs)} · tasa BCV ${esc(r.tasa_bcv)}</p><pre>${esc(r.mensaje)}</pre>
    <p><a class="btn p" href="${esc(r.enlace_whatsapp)}" target="_blank" rel="noopener">Abrir en WhatsApp</a> <button class="btn" id="env">Enviar por API</button> <button class="btn" id="cl">Cerrar</button></p><div id="rs"></div>`;
    $('#cl').onclick = () => dlg.close();
    $('#env').onclick = async () => { try { await api(`/notificaciones/whatsapp/${tipo}/${id}?enviar=true`, { method: 'POST', body: '{}' }); $('#rs').innerHTML = '<div class="msg okk">Enviado.</div>'; } catch (e) { $('#rs').innerHTML = `<div class="msg err">${esc(e.message)}</div>`; } };
  } catch (e) { dlg.innerHTML = `<h2>No se pudo generar</h2><div class="msg err">${esc(e.message)}</div><button class="btn" id="cl">Cerrar</button>`; $('#cl').onclick = () => dlg.close(); }
  dlg.showModal();
}

async function vAuditoria(m) {
  const j = await api('/facturacion/auditoria');
  m.innerHTML = `<h1>Bandeja de auditoría</h1><p class="sub">${j.paginacion.total} referencia(s) por validar, de la más antigua a la más reciente</p><div id="n"></div>
  <p><button class="btn" id="ex">${ico('down')} Exportar histórico (.xlsx)</button></p>
  <div class="card scroll"><table><thead><tr><th>Declarada</th><th>Estudiante</th><th>Referencia</th><th>Método</th><th>USD</th><th>Bs.</th><th></th></tr></thead><tbody>
  ${j.data.map((p) => `<tr><td>${esc(new Date(p.declarado_en).toLocaleString('es-VE'))}</td><td>${esc(p.estudiante)}<br><small>${esc(p.concepto)}</small></td><td><b>${esc(p.referencia)}</b></td><td>${esc(p.metodo_pago)}</td><td>${usd(p.monto_usd)}</td><td>${esc(p.monto_bs)}</td>
  <td><button class="btn sm p" data-ap="${p.id}">Aprobar</button> <button class="btn sm bad" data-rj="${p.id}">Rechazar</button></td></tr>`).join('') || '<tr><td colspan="7">Bandeja vacía.</td></tr>'}</tbody></table></div>`;
  const run = async (ruta, body) => { try { const r = await api(ruta, { method: 'POST', body: JSON.stringify(body) }); $('#n').innerHTML = `<div class="msg okk">Estatus de pago del alumno: ${esc(r.data.estatus_pago || r.data.estado)}</div>`; setTimeout(() => ir('auditoria'), 900); } catch (e) { $('#n').innerHTML = `<div class="msg err" role="alert">${esc(e.message)}</div>`; } };
  m.querySelectorAll('[data-ap]').forEach((b) => (b.onclick = () => run(`/facturacion/auditoria/${b.dataset.ap}/aprobar`, {})));
  m.querySelectorAll('[data-rj]').forEach((b) => (b.onclick = () => { const nota = prompt('Motivo del rechazo (obligatorio):'); if (nota) run(`/facturacion/auditoria/${b.dataset.rj}/rechazar`, { nota }); }));
  $('#ex').onclick = () => descargar('/exportaciones/facturacion.xlsx', 'facturacion.xlsx').catch((e) => { $('#n').innerHTML = `<div class="msg err">${esc(e.message)}</div>`; });
}

async function vContabilidad(m) {
  const b = (await api('/contabilidad/balance')).data;
  m.innerHTML = `<h1>Contabilidad</h1><p class="sub">Balance neto ${esc(b.periodo)}</p><div id="n"></div><div class="grid"><div class="card kpi"><small>Ingresos</small><b>${usd(b.ingresos_usd)}</b></div>
  <div class="card kpi"><small>Egresos</small><b>${usd(b.egresos_usd)}</b></div><div class="card kpi"><small>Neto</small><b style="color:${b.neto_usd < 0 ? 'var(--bad)' : 'var(--ok)'}">${usd(b.neto_usd)}</b></div></div>
  <button class="btn p" id="ex">${ico('down')} Exportar nómina, egresos y personal (.xlsx)</button>`;
  $('#ex').onclick = () => descargar('/exportaciones/contabilidad.xlsx', 'contabilidad.xlsx').catch((e) => { $('#n').innerHTML = `<div class="msg err">${esc(e.message)}</div>`; });
}

function vPremium(m, codigo) {
  const mod = modulos.find((x) => x.codigo === codigo);
  if (!mod) { m.innerHTML = '<div class="msg err">Módulo no encontrado.</div>'; return; }
  m.innerHTML = `<h1>${esc(mod.nombre)}</h1><p class="sub">${esc(mod.descripcion)}</p><div class="card premium"><div class="ghost"><table><tr><th>Vista previa</th><th>Estado</th></tr><tr><td>Elemento de ejemplo</td><td>—</td></tr><tr><td>Elemento de ejemplo</td><td>—</td></tr><tr><td>Elemento de ejemplo</td><td>—</td></tr></table></div>
  ${mod.bloqueado ? `<div class="glass-lock" role="note"><div class="box">${ico('lock')}<h2 title="${esc(mod.tooltip)}">${esc(mod.tooltip)}</h2><p>${esc(mod.descripcion)}</p><p><b>${usd(mod.precio_usd)}</b> · Solicítalo a Astra Digital Solutions.</p></div></div>` : '<div class="glass-lock" style="background:rgba(255,255,255,.9)"><div class="box"><h2>Módulo habilitado</h2><p>La lógica de este módulo aún no se publica (ruta reservada).</p></div></div>'}</div>`;
}

arrancar();
