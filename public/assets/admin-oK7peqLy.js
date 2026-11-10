import{a as x,b as v,C as n,i as h,h as r,c as z,d as P,n as A,m as T,u as L,e as f,o as u,f as y,g as ue,j as W,k as ae,l as J,p as na,q as O,H as Va,r as F,s as ia,t as Ua,v as G,w as Ae,B as M,x as V,y as C,z as U,A as Ga,D as sa,E as pe,F as ra,G as Wa,I as Ja,J as Xa,K as Ka,L as Ya,M as Za,N as Qa}from"./firma-mdi2PnVU.js";const ge="Módulo Premium Deshabilitado";function D(e,a,t=null){return r`<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><h1 class="${n.titulo}">${e}</h1><p class="${n.subtitulo}">${a}</p></div>
    ${t}
  </header>`}function et(){const e=r`<div class="flex items-center gap-4 border-b border-slate-100 py-4"><div class="h-8 w-8 rounded-full bg-slate-200"></div><div class="h-4 flex-1 rounded bg-slate-200"></div><div class="h-4 w-24 rounded bg-slate-200"></div></div>`;return r`<div aria-hidden="true" class="pointer-events-none select-none p-6">
    <div class="mb-4 h-6 w-1/3 rounded bg-slate-300"></div>${e}${e}${e}${e}${e}
  </div>`}function at(e){return r`<div data-candado class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 p-6 backdrop-blur-md">
    <div role="region" aria-label="${ge}" class="${n.tarjetaCristal} w-full max-w-md p-8 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bma-purpura text-white">${h("lock","h-6 w-6")}</span>
      <h2 class="mt-4 text-lg font-bold text-slate-900">${ge}</h2>
      <p class="mt-1 text-sm font-semibold text-slate-800">${e.nombre}</p>
      <p class="mt-2 text-sm text-slate-700">${e.descripcion}</p>
      <p class="mt-4 text-2xl font-bold text-slate-900">${L(e.precio_usd)}</p>
      <p class="mt-1 text-xs text-slate-600">Pago único · solicítalo a Astra Digital Solutions</p>
    </div>
  </div>`}function la(e){return r`${D(e.nombre,e.descripcion)}
    <div class="${n.tarjeta} relative min-h-96 overflow-hidden">${et()}${at(e)}</div>`}function da(e,a){return r`${la(e)}${a?r`<div class="mt-6">${x("info",r`<p>Prueba este módulo sin costo durante 15 días. Al vencer se bloquea solo.</p>
        <button type="button" id="activar-prueba" class="${v(n.btnPrimario,"mt-3")}">${h("check","h-4 w-4")}<span>Activar prueba gratuita de 15 días</span></button>`,"Prueba gratuita disponible")}</div>`:null}`}function ca(e,a){const t=z("#activar-prueba",HTMLButtonElement,e);t?.addEventListener("click",()=>{P(t,a).catch(o=>A("bad",T(o)))})}const Y=300,tt=["https://drive.google.com/","https://docs.google.com/"],le="Sin registrar",qe={FOTO_CARNET:"Foto carnet",CEDULA_IDENTIDAD:"Cédula de identidad",ACTA_NACIMIENTO:"Acta de nacimiento"},ot={MATRICULA:"Matrícula",MENSUALIDAD:"Mensualidad",OTRO:"Otro"};function nt(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function ua(e){if(e===null||e==="")return null;const a=ia(e,tt);return a==="#"?null:a}const pa=e=>e!==null&&e.trim()!==""?e:le;function E(e,a){const t=a instanceof Va?a:pa(a),o=a===null||typeof a=="string"&&a.trim()==="";return r`<div class="min-w-0"><dt class="text-xs font-semibold uppercase tracking-wide text-slate-600">${e}</dt>
    <dd class="mt-1 break-words text-sm ${o?"text-slate-600":"font-medium text-slate-900"}">${t}</dd></div>`}function te(e,a,t){return r`<h2 id="${e}" class="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${h(t,"h-4 w-4")}</span>${a}</h2>`}function it(e){const a=na(e.fecha_nacimiento,ue());return r`<section class="${n.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-academico">
    ${te("t-academico","Información académica","school")}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${E("Nivel",e.grado_solicitado)}
      ${E("Cédula de identidad",e.cedula_identidad)}
      ${E("Fecha de nacimiento",`${J(e.fecha_nacimiento)}${a!==null?` · ${a} años`:""}`)}
      ${E("Lugar de nacimiento",e.lugar_nacimiento)}
      ${E("Lugar de estudio",e.lugar_estudio)}
      ${E("Grado de estudio",e.ultimo_grado_aprobado)}
      ${E("Horario",e.horario_preferido)}
      ${e.colegio_procedencia!==null&&e.colegio_procedencia.trim()!==""?E("Colegio de procedencia",e.colegio_procedencia):null}
      ${E("Inscrito",O(e.creado_en))}
    </dl>
  </section>`}function st(e){const a=t=>t!==null&&t.trim()!==""?r`${F("Atención","warn")} <span class="ml-1">${t}</span>`:null;return r`<section class="${n.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-medico">
    ${te("t-medico","Datos médicos","heart")}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${E("Tipo de sangre",e.tipo_sangre)}
      ${E("Alergias",a(e.alergias)??le)}
      ${E("Condiciones médicas",a(e.condiciones_medicas)??le)}
      ${E("Bajo tratamiento médico",e.bajo_tratamiento?a(e.tratamiento_explicacion??"Sí (sin explicación registrada)"):"No")}
      ${E("Medicamentos",e.medicamentos)}
      ${E("Contacto de emergencia",e.emergencia_nombre)}
      ${E("Teléfono de emergencia",e.emergencia_telefono)}
    </dl>
  </section>`}function rt(e){const a=ua(e.drive_url);return r`<li class="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
    <span class="min-w-0"><span class="block truncate text-sm font-medium text-slate-900">${qe[e.tipo]}</span>
      <span class="block truncate text-xs text-slate-600">${e.nombre_archivo} · ${nt(e.tamano_bytes)}</span></span>
    ${a!==null?r`<a href="${a}" target="_blank" rel="noopener noreferrer" class="${v(n.btnSecundario,n.btnPeq)}" aria-label="Abrir ${qe[e.tipo]} en Google Drive">Abrir</a>`:F("Sin enlace","neutral")}
  </li>`}function lt(e){const a=ua(e.drive_folder_url);return r`<section class="${n.tarjeta} p-6" aria-labelledby="t-drive">
    ${te("t-drive","Expediente en Google Drive","folder")}
    ${a!==null?r`<a href="${a}" target="_blank" rel="noopener noreferrer" class="${v(n.btnPrimario,"w-full")}">${h("folder","h-4 w-4")}<span>Abrir expediente digitalizado</span></a>`:x("info","Este estudiante aún no tiene una carpeta de expediente en Google Drive.")}
    ${e.drive_folder_id!==null?r`<p class="${n.ayuda}">ID de carpeta: <span class="break-all font-mono">${e.drive_folder_id}</span></p>`:null}
    ${e.documentos.length>0?r`<ul class="mt-4" aria-label="Documentos digitalizados">${e.documentos.map(rt)}</ul>`:r`<p class="mt-4 text-sm text-slate-600">Sin documentos digitalizados.</p>`}
  </section>`}function dt(e){return r`<section class="${n.tarjeta} p-6" aria-labelledby="t-representante">
    ${te("t-representante","Representante principal","users")}
    <dl class="grid gap-4">
      ${E("Nombre",`${e.rep_nombres} ${e.rep_apellidos}`)}
      ${E("Cédula",e.rep_cedula)}
      ${E("Correo",e.rep_email)}
      ${E("Teléfono (WhatsApp de cobro)",e.rep_telefono)}
    </dl>
  </section>`}const Ne={madre:"Madre",padre:"Padre"};function ma(e,a,t){return e[`${a}_${t}`]}const ct=e=>e===null||String(e).trim()===""?null:String(e);function ut(e,a){const t=ma(e,a,"cedula");return typeof t=="string"&&t.trim()!==""&&t.trim().toUpperCase()===e.rep_cedula.trim().toUpperCase()}function Oe(e,a){const t=d=>ct(ma(e,a,d)),o=["nombres","apellidos","cedula","edad","fecha_nacimiento","direccion","telefono_fijo","telefono_movil","email"].some(d=>t(d)!==null),i=[t("nombres"),t("apellidos")].filter(d=>d!==null).join(" "),s=t("fecha_nacimiento"),l=s!==null?na(s,ue()):null,p=s!==null?`${J(s)}${l!==null?` · ${l} años`:""}`:t("edad")!==null?`${t("edad")} años`:null;return r`<article class="min-w-0 rounded-lg border border-slate-200 p-4" aria-label="${Ne[a]}">
    <h3 class="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">${Ne[a]}${ut(e,a)?F("Representante principal","info"):null}</h3>
    ${o?r`<dl class="grid gap-3">
          ${E("Nombre",i)}
          ${E("Cédula",t("cedula"))}
          ${E("Nacimiento",p)}
          ${E("Dirección de habitación",t("direccion"))}
          ${E("Teléfono fijo",t("telefono_fijo"))}
          ${E("Teléfono móvil",t("telefono_movil"))}
          ${E("Correo",t("email"))}
        </dl>`:r`<p class="text-sm text-slate-600">No se registró en la planilla.</p>`}
  </article>`}function pt(e){return r`<li class="border-b border-slate-100 py-2 last:border-0">
    <span class="block text-sm font-medium text-slate-900">${e.nombre}</span>
    <span class="block text-xs text-slate-600">${e.parentesco} · ${e.telefono!==""?`+${e.telefono}`:le}</span>
  </li>`}function mt(e){return r`<article class="min-w-0 rounded-lg border border-slate-200 p-4" aria-label="Personas autorizadas para retirar al menor">
    <h3 class="mb-3 text-sm font-bold text-slate-900">Personas autorizadas para retirar al menor</h3>
    ${e.personas_autorizadas.length>0?r`<ul>${e.personas_autorizadas.map(pt)}</ul>`:r`<p class="text-sm text-slate-600">Sin personas autorizadas registradas.</p>`}
  </article>`}function ft(e){return r`<section class="${n.tarjeta} p-6 lg:col-span-3" aria-labelledby="t-familia">
    ${te("t-familia","Familia y autorizados (planilla oficial)","users")}
    <div class="grid gap-4 md:grid-cols-3">
      ${Oe(e,"madre")}
      ${Oe(e,"padre")}
      ${mt(e)}
    </div>
  </section>`}function bt(e){const a=e.estado==="Pendiente"||e.estado==="En Revisión";return r`<tr>
    <td class="${n.td}"><span class="font-medium text-slate-900">${e.concepto}</span></td>
    <td class="${n.td}">${ot[e.tipo]}</td>
    <td class="${n.td} whitespace-nowrap">${J(e.fecha_vencimiento)}${a&&Ua(e.fecha_vencimiento)?r` ${F("Vencida","bad")}`:null}</td>
    <td class="${n.td} whitespace-nowrap">${L(e.monto_usd)}</td>
    <td class="${n.td}">${ae(e.estado)}</td>
  </tr>`}function vt(e,a){const t=a.get(e.cuota_id);return r`<tr>
    <td class="${n.td}"><span class="break-all font-medium text-slate-900">${e.referencia}</span>${t!==void 0?r`<span class="block text-xs text-slate-600">${t}</span>`:null}</td>
    <td class="${n.td}">${G(e.metodo_pago)}</td>
    <td class="${n.td} whitespace-nowrap">${O(e.declarado_en)}</td>
    <td class="${n.td} whitespace-nowrap">${L(e.monto_usd)}<span class="block text-xs text-slate-600">${Ae(e.monto_bs)}</span></td>
    <td class="${n.td}">${ae(e.estado)}</td>
  </tr>`}function gt(e){return r`<section class="${n.tarjeta} overflow-hidden" aria-labelledby="t-cuotas">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-cuotas" class="text-base font-bold text-slate-900">Histórico de cuotas</h2>
      <span class="text-xs text-slate-600">${e.cuotas.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${n.tabla}">
        <caption class="sr-only">Histórico de cuotas del estudiante</caption>
        <thead><tr><th scope="col" class="${n.th}">Concepto</th><th scope="col" class="${n.th}">Tipo</th><th scope="col" class="${n.th}">Vencimiento</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Estado</th></tr></thead>
        <tbody>${e.cuotas.length===0?r`<tr><td colspan="5" class="${n.td}">Este estudiante no tiene cuotas.</td></tr>`:e.cuotas.map(bt)}</tbody>
      </table>
    </div>
  </section>`}function $t(e){const a=new Map(e.cuotas.map(t=>[t.id,t.concepto]));return r`<section class="${n.tarjeta} overflow-hidden" aria-labelledby="t-pagos">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-pagos" class="text-base font-bold text-slate-900">Pagos declarados por el representante</h2>
      <span class="text-xs text-slate-600">${e.pagos.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${n.tabla}">
        <caption class="sr-only">Pagos declarados por el representante</caption>
        <thead><tr><th scope="col" class="${n.th}">Referencia</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Declarado</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Estado</th></tr></thead>
        <tbody>${e.pagos.length===0?r`<tr><td colspan="5" class="${n.td}">El representante aún no ha declarado pagos.</td></tr>`:e.pagos.map(t=>vt(t,a))}</tbody>
      </table>
    </div>
  </section>`}function ht(e){const a=e.estatus_academico==="Fuera de la Academia";return r`<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <button type="button" data-accion="volver" class="${v(n.btnSecundario,n.btnPeq,"mb-3")}">${h("back","h-4 w-4")}<span>Volver al listado</span></button>
      <h1 id="ficha-titulo" tabindex="-1" class="${n.titulo} break-words">${e.apellidos}, ${e.nombres}</h1>
      <p class="${n.subtitulo} flex flex-wrap items-center gap-2">${ae(e.estado_dinamico)}<span>${e.grado_solicitado}</span>
        ${e.deuda_vencida_usd>0?r`<span class="font-semibold text-bma-coral-oscuro">Deuda vencida: ${L(e.deuda_vencida_usd)}</span>`:null}</p>
    </div>
    <div class="flex flex-wrap gap-2" role="group" aria-label="Acciones sobre el estudiante">
      ${a?r`<button type="button" data-accion="reactivar" class="${v(n.btnOk)}">${h("refresh","h-4 w-4")}<span>Reactivar Estudiante</span></button>`:r`<button type="button" data-accion="retirar" class="${v(n.btnPeligro)}">${h("logout","h-4 w-4")}<span>Retirar Estudiante</span></button>`}
    </div>
  </header>
  ${a?r`<div class="mb-6">${x("warn",r`<p>Retirado el <strong>${e.fecha_retiro!==null?J(e.fecha_retiro):"fecha no registrada"}</strong>.</p>
        <p class="mt-1">Motivo: ${pa(e.motivo_retiro)}</p>
        <p class="mt-1">Sus cuotas pendientes fueron anuladas al retirarlo; reactivarlo no las restaura.</p>`,"Fuera de la Academia")}</div>`:null}`}function xt(e){return r`<div id="ficha-raiz">
    ${ht(e)}
    <div class="grid gap-6 lg:grid-cols-3">
      ${it(e)}
      ${dt(e)}
      ${st(e)}
      ${lt(e)}
      ${ft(e)}
    </div>
    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      ${gt(e)}
      ${$t(e)}
    </div>
  </div>`}function De(e,a,t){const o={},i=e.trim();return i===""?o.motivo="Debes escribir el motivo del retiro para continuar.":i.length>Y&&(o.motivo=`El motivo admite hasta ${Y} caracteres.`),/^\d{4}-\d{2}-\d{2}$/.test(a)?a>t&&(o.fecha="La fecha de retiro no puede ser futura."):o.fecha="Elige la fecha del retiro.",o}function oe(e,a,t){if(t===void 0){a.hidden=!0,e.removeAttribute("aria-invalid");return}a.textContent=t,a.hidden=!1,e.setAttribute("aria-invalid","true")}function yt(e,a){const t=ue(),o=W({titulo:"Retirar estudiante",cuerpo:r`<form id="form-retiro" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700"><strong>${e.apellidos}, ${e.nombres}</strong> pasará a «Fuera de la Academia» y sus cuotas pendientes se anularán.</p>
      <div>
        <label for="retiro-motivo" class="${n.etiqueta}">Motivo del retiro <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="retiro-motivo" name="motivo" rows="4" maxlength="${Y}" required aria-describedby="retiro-ayuda retiro-motivo-error" class="${n.input}"></textarea>
        <p id="retiro-ayuda" class="${n.ayuda}">Obligatorio. Queda en el historial del estudiante. <span id="retiro-contador">0/${Y}</span></p>
        <p id="retiro-motivo-error" class="${n.errorCampo}" role="alert" hidden></p>
      </div>
      <div>
        <label for="retiro-fecha" class="${n.etiqueta}">Fecha del retiro <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="retiro-fecha" name="fecha_retiro" type="date" required value="${t}" max="${t}" aria-describedby="retiro-fecha-error" class="${n.input} sm:max-w-xs">
        <p id="retiro-fecha-error" class="${n.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="retiro-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${v(n.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${v(n.btnPeligro)}">${h("logout","h-4 w-4")}<span>Retirar estudiante</span></button>
      </div>
    </form>`}),i=u("#form-retiro",HTMLFormElement,o.dialogo),s=u("#retiro-motivo",HTMLTextAreaElement,o.dialogo),l=u("#retiro-fecha",HTMLInputElement,o.dialogo),p=u("#retiro-motivo-error",HTMLElement,o.dialogo),d=u("#retiro-fecha-error",HTMLElement,o.dialogo),c=u("#retiro-contador",HTMLElement,o.dialogo);s.addEventListener("input",()=>{c.textContent=`${s.value.length}/${Y}`,s.value.trim()!==""&&oe(s,p,void 0)}),l.addEventListener("input",()=>oe(l,d,De(s.value,l.value,t).fecha)),u("[data-cancelar]",HTMLButtonElement,o.dialogo).addEventListener("click",o.cerrar),i.addEventListener("submit",b=>{b.preventDefault();const $=De(s.value,l.value,t);oe(s,p,$.motivo),oe(l,d,$.fecha),$.motivo!==void 0?s.focus():$.fecha!==void 0&&l.focus(),!($.motivo!==void 0||$.fecha!==void 0)&&a(o,{motivo:s.value.trim(),fecha_retiro:l.value},u('button[type="submit"]',HTMLButtonElement,i))}),s.focus()}function Et(e,a){const t=W({titulo:"Reactivar estudiante",cuerpo:r`<div class="flex flex-col gap-4">
      <p class="text-sm text-slate-700"><strong>${e.apellidos}, ${e.nombres}</strong> volverá a «Activo». Las cuotas que se anularon al retirarlo no se restauran: genera las que correspondan desde Facturación.</p>
      <div id="reactivar-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${v(n.btnSecundario)}">Cancelar</button>
        <button type="button" data-confirmar class="${v(n.btnOk)}">${h("check","h-4 w-4")}<span>Reactivar estudiante</span></button>
      </div>
    </div>`});u("[data-cancelar]",HTMLButtonElement,t.dialogo).addEventListener("click",t.cerrar);const o=u("[data-confirmar]",HTMLButtonElement,t.dialogo);o.addEventListener("click",()=>a(t,o)),o.focus()}async function wt(e){const a=()=>y.get(`/estudiantes/${e.estudianteId}`);let t=await a();if(!e.vigente())return;f(e.zona,r`<div id="ficha-contenedor"></div>`);const o=u("#ficha-contenedor",HTMLElement,e.zona),i=()=>{f(o,xt(t)),z("#ficha-titulo",HTMLElement,o)?.focus({preventScroll:!0})},s=async()=>{try{t=await a()}catch(c){c instanceof M?e.alSesionExpirada():A("bad",`La acción se realizó, pero no se pudo actualizar la ficha: ${T(c)}`);return}e.vigente()&&i()},l=(c,b,$)=>{if(c instanceof M){b.cerrar(),e.alSesionExpirada();return}f(u($,HTMLElement,b.dialogo),x("bad",T(c)))},p=(c,b,$)=>{P($,()=>y.post(`/estudiantes/${e.estudianteId}/retirar`,b)).then(async()=>{c.cerrar(),A("ok",`${t.nombres} ${t.apellidos} fue retirado de la academia.`),await s()}).catch(S=>l(S,c,"#retiro-aviso"))},d=(c,b)=>{P(b,()=>y.post(`/estudiantes/${e.estudianteId}/reactivar`)).then(async()=>{c.cerrar(),A("ok",`${t.nombres} ${t.apellidos} fue reactivado.`),await s()}).catch($=>l($,c,"#reactivar-aviso"))};o.addEventListener("click",c=>{const b=c.target instanceof Element?c.target.closest("[data-accion]"):null;if(!(b instanceof HTMLButtonElement))return;const $=b.dataset.accion;$==="volver"?e.alVolver():$==="retirar"?yt(t,p):$==="reactivar"&&Et(t,d)}),i()}const B=(e,a)=>e[a]??"",$e=/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/,Re=/^(?:\d{6,20}|[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,})$/,_t=/^Banco (\d{4}) · Tel (0\d{10}) · Cédula\/RIF ([VEJGP]\d{5,10})$/,Be=(e,a,t)=>({id:e,etiqueta:a,tipo:"email",inputmode:"email",placeholder:"pagos@academia.com",ayuda:t,error:"Escribe un correo válido, por ejemplo pagos@academia.com.",patron:$e,normalizar:o=>o.trim().toLowerCase()}),Se={ZELLE:{campos:[Be("correo","Correo de Zelle","Correo con el que la academia recibe pagos por Zelle.")],componer:e=>B(e,"correo"),interpretar:e=>$e.test(e)?{correo:e}:null},PAYPAL:{campos:[Be("correo","Correo de PayPal","Cuenta de PayPal que recibe los pagos.")],componer:e=>B(e,"correo"),interpretar:e=>$e.test(e)?{correo:e}:null},BINANCE:{campos:[{id:"idBinance",etiqueta:"Pay ID o correo de Binance",tipo:"text",inputmode:"text",placeholder:"123456789",ayuda:"Pay ID numérico (6 a 20 dígitos) o el correo de la cuenta Binance.",error:"Escribe un Pay ID numérico de 6 a 20 dígitos o un correo válido.",patron:Re,normalizar:e=>e.trim().toLowerCase()}],componer:e=>B(e,"idBinance"),interpretar:e=>Re.test(e)?{idBinance:e}:null},PAGO_MOVIL:{campos:[{id:"banco",etiqueta:"Código del banco",tipo:"text",inputmode:"numeric",placeholder:"0102",ayuda:"Cuatro dígitos (0102 = Banco de Venezuela, 0105 = Mercantil…).",error:"El código del banco son exactamente 4 dígitos.",patron:/^\d{4}$/,normalizar:e=>e.trim()},{id:"telefono",etiqueta:"Teléfono afiliado",tipo:"text",inputmode:"tel",placeholder:"04141234567",ayuda:"11 dígitos, empezando por 0 (sin espacios ni guiones).",error:"Escribe 11 dígitos empezando por 0, por ejemplo 04141234567.",patron:/^0\d{10}$/,normalizar:e=>e.replace(/[\s.-]/g,"")},{id:"documento",etiqueta:"Cédula o RIF del titular",tipo:"text",inputmode:"text",placeholder:"V12345678",ayuda:"Letra (V, E, J, G o P) seguida de 5 a 10 dígitos.",error:"Escribe la letra (V, E, J, G o P) y de 5 a 10 dígitos, por ejemplo V12345678.",patron:/^[VEJGP]\d{5,10}$/,normalizar:e=>e.replace(/[\s.-]/g,"").toUpperCase()}],componer:e=>`Banco ${B(e,"banco")} · Tel ${B(e,"telefono")} · Cédula/RIF ${B(e,"documento")}`,interpretar:e=>{const a=_t.exec(e);return a?{banco:a[1]??"",telefono:a[2]??"",documento:a[3]??""}:null}}},Ce=["ZELLE","BINANCE","PAYPAL","PAGO_MOVIL"],he=150,fa=99999999,ba=e=>Ce.some(a=>a===e);function Mt(e,a){const t={},o=e.titular.trim();o===""?t.titular="El titular es obligatorio.":o.length>he&&(t.titular=`Máximo ${he} caracteres.`);let i=null;if(e.ambito==="")t.ambito="Elige a qué sede aplica la cuenta o márcala como común a todas.";else if(e.ambito!=="comun"){const d=Number(e.ambito);Number.isInteger(d)&&a.some(c=>c.id===d)?i=d:t.ambito="La sede elegida no existe. Recarga la página."}const s=e.metodo;if(!ba(s))return t.metodo="Elige un método de pago.",{errores:t,cuerpo:null};const l=Se[s],p={};for(const d of l.campos){const c=d.normalizar(B(e.campos,d.id));p[d.id]=c,d.patron.test(c)||(t[`campo_${d.id}`]=d.error)}return Object.keys(t).length>0?{errores:t,cuerpo:null}:{errores:t,cuerpo:{metodo:s,titular:o,detalle:l.componer(p),activa:e.activa,sede_id:i}}}function va(e){const a=e.trim().replace(",",".");if(!/^\d+(?:\.\d{1,2})?$/.test(a))return null;const t=Number(a);return Number.isFinite(t)&&t>0&&t<=fa?t:null}const Lt=e=>e?.rol==="admin"&&(e.sede_id??null)===null;async function Fe(){const[e,a]=await Promise.all([y.get("/configuracion"),y.get("/sedes")]);return{matricula_usd:e.matricula_usd,cuentas:e.cuentas,sedes:a}}const ga=(e,a)=>{if(e===null)return"Común (todas las sedes)";const t=a.find(o=>o.id===e);return t?t.nombre:`Sede #${e}`};function Tt(e,a){const t=o=>`${o.sede_id===null?"0":"1"}|${ga(o.sede_id,a)}|${Ce.indexOf(o.metodo)}|${String(o.id).padStart(10,"0")}`;return[...e].sort((o,i)=>t(o).localeCompare(t(i),"es"))}const ie=(e,a)=>{const t=e.get(a);return typeof t=="string"?t:""};function Z(e,a){for(const t of C("[data-error]",HTMLElement,e)){const o=a[t.dataset.error??""]??"";t.textContent=o,t.hidden=o===""}for(const t of C("[name]",HTMLElement,e))(a[t.getAttribute("name")??""]??"")!==""?t.setAttribute("aria-invalid","true"):t.removeAttribute("aria-invalid");z('[aria-invalid="true"]',HTMLElement,e)?.focus()}function $a(e){const a={titular:"titular",sede_id:"ambito",metodo:"metodo",detalle:"general",matricula_usd:"matricula_usd"},t={};for(const o of e.camposInvalidos())t[a[o.campo]??"general"]=o.mensaje;return Object.keys(t).length===0&&(t.general=e.message),t}function At(e,a){if(e.length===0)return x("warn","Todavía no hay cuentas de cobro. Mientras no exista ninguna activa, las familias verán «Consulta los datos de pago con la administración».");const t=Tt(e,a).map(o=>r`<tr>
      <td class="${n.td}">${ga(o.sede_id,a)}</td>
      <td class="${n.td} font-semibold">${G(o.metodo)}</td>
      <td class="${n.td}">${o.titular}</td>
      <td class="${n.td} break-words">${o.detalle}</td>
      <td class="${n.td}">${o.activa?F("Activa","ok"):F("Inactiva","neutral")}</td>
      <td class="${n.td}">
        <div class="flex flex-wrap gap-2">
          <button type="button" data-accion="editar" data-id="${o.id}" class="${v(n.btnSecundario,n.btnPeq)}" aria-label="Editar la cuenta de ${G(o.metodo)} de ${o.titular}">Editar</button>
          <button type="button" data-accion="alternar" data-id="${o.id}" class="${v(n.btnSecundario,n.btnPeq)}" aria-label="${o.activa?"Desactivar":"Activar"} la cuenta de ${G(o.metodo)} de ${o.titular}">${o.activa?"Desactivar":"Activar"}</button>
        </div>
      </td>
    </tr>`);return r`<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/95">
    <table class="${n.tabla}">
      <caption class="sr-only">Cuentas de cobro de la academia</caption>
      <thead><tr>
        <th scope="col" class="${n.th}">Ámbito</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Titular</th>
        <th scope="col" class="${n.th}">Datos públicos</th><th scope="col" class="${n.th}">Estado</th><th scope="col" class="${n.th}">Acciones</th>
      </tr></thead>
      <tbody>${t}</tbody>
    </table>
  </div>`}function St(e){const a=e.matricula_usd<=0;return r`<div id="config-raiz">
    <header class="mb-6">
      <h1 class="${n.titulo}">Configuración de cobro</h1>
      <p class="${n.subtitulo}">Costo de la matrícula y cuentas donde las familias depositan.</p>
    </header>

    <section class="${n.tarjeta} mb-6 p-6" aria-labelledby="t-matricula">
      <h2 id="t-matricula" class="text-base font-bold text-slate-900">Costo de la matrícula</h2>
      <p class="${n.ayuda}">Monto único en dólares para todas las sedes. Se muestra en el formulario público de admisiones junto a su equivalente en bolívares a la tasa BCV.</p>
      <div class="mt-4">${a?x("warn","La matrícula aún no está configurada: las inscripciones públicas permanecen bloqueadas hasta que fijes un monto."):x("info",r`Matrícula vigente: <strong>${L(e.matricula_usd)}</strong>.`)}</div>
      <form id="form-matricula" novalidate class="mt-4 grid gap-4 sm:grid-cols-3 sm:items-start">
        <div class="sm:col-span-1">
          <label for="f-matricula" class="${n.etiqueta}">Monto en USD</label>
          <input id="f-matricula" name="matricula_usd" type="text" inputmode="decimal" autocomplete="off" required placeholder="120.00"
            value="${a?"":e.matricula_usd.toFixed(2)}" class="${n.input}" aria-describedby="ay-matricula er-matricula">
          <p id="ay-matricula" class="${n.ayuda}">Hasta dos decimales. Ejemplo: 120.00</p>
          <p id="er-matricula" data-error="matricula_usd" class="${n.errorCampo}" hidden></p>
        </div>
        <div class="flex items-end sm:col-span-2 sm:pt-6">
          <button type="submit" class="${v(n.btnPrimario)}">${h("check","h-4 w-4")}<span>Guardar matrícula</span></button>
        </div>
      </form>
    </section>

    <section class="${n.tarjeta} p-6" aria-labelledby="t-cuentas">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 id="t-cuentas" class="text-base font-bold text-slate-900">Cuentas de cobro</h2>
          <p class="${n.ayuda}">Datos públicos de Zelle, Binance Pay, PayPal y Pago Móvil. Nunca registres contraseñas ni claves aquí: esta información se muestra a las familias.</p>
        </div>
        <button type="button" data-accion="nueva" class="${v(n.btnPrimario)}">${h("wallet","h-4 w-4")}<span>Agregar cuenta</span></button>
      </div>
      ${At(e.cuentas,e.sedes)}
      <div class="mt-4">${x("info","Una familia ve las cuentas activas comunes más las de su sede. Si entra sin enlace de invitación, solo ve las comunes.")}</div>
    </section>
  </div>`}async function Ct(e){if(!Lt(e.usuario)){f(e.zona,r`<div class="mx-auto max-w-2xl pt-8">${x("info","La configuración de cobro es del acceso consolidado (administrador sin sede asignada). Pídele a esa persona que actualice la matrícula o las cuentas.","Sección restringida")}</div>`);return}const a=await Fe();if(!e.vigente())return;let t=a;const o=()=>{f(e.zona,St(t)),s()},i=async()=>{t=await Fe(),e.vigente()&&o()},s=()=>{const l=u("#config-raiz",HTMLElement,e.zona);u("#form-matricula",HTMLFormElement,l).addEventListener("submit",p=>{p.preventDefault(),It(u("#form-matricula",HTMLFormElement,l),d=>{t={...t,matricula_usd:d},o()})}),l.addEventListener("click",p=>{const d=p.target instanceof Element?p.target.closest("[data-accion]"):null;if(!(d instanceof HTMLButtonElement))return;const c=d.dataset.accion,b=t.cuentas.find($=>$.id===Number(d.dataset.id));c==="nueva"?Ve(null,t.sedes,i):c==="editar"&&b?Ve(b,t.sedes,i):c==="alternar"&&b&&Pt(d,b,i)})};o()}async function It(e,a){const t=va(ie(new FormData(e),"matricula_usd"));if(t===null){Z(e,{matricula_usd:`Escribe un monto mayor que 0 y hasta ${fa.toLocaleString("en-US")}, con máximo 2 decimales.`});return}Z(e,{});try{const o=await P(u('button[type="submit"]',HTMLButtonElement,e),()=>y.put("/configuracion/matricula",{matricula_usd:t}));A("ok",`Matrícula actualizada a ${L(o.matricula_usd)}.`),a(o.matricula_usd)}catch(o){if(o instanceof M){window.location.reload();return}Z(e,o instanceof V?$a(o):{matricula_usd:T(o)})}}async function Pt(e,a,t){const o={metodo:a.metodo,titular:a.titular,detalle:a.detalle,activa:!a.activa,sede_id:a.sede_id};try{await P(e,()=>y.put(`/configuracion/cuentas/${a.id}`,o)),A("ok",o.activa?"Cuenta activada: ya la ven las familias.":"Cuenta desactivada: las familias ya no la ven."),await t()}catch(i){if(i instanceof M){window.location.reload();return}A("bad",T(i))}}function ha(e,a){return ba(e)?r`${Se[e].campos.map(t=>r`<div>
      <label for="f-campo_${t.id}" class="${n.etiqueta}">${t.etiqueta}</label>
      <input id="f-campo_${t.id}" name="campo_${t.id}" type="${t.tipo}" inputmode="${t.inputmode}" autocomplete="off" required
        placeholder="${t.placeholder}" value="${B(a,t.id)}" class="${n.input}" aria-describedby="ay-${t.id} er-${t.id}">
      <p id="ay-${t.id}" class="${n.ayuda}">${t.ayuda}</p>
      <p id="er-${t.id}" data-error="campo_${t.id}" class="${n.errorCampo}" hidden></p>
    </div>`)}`:r`<p class="${n.ayuda}">Elige un método para ver los datos que se piden.</p>`}function Ht(e,a,t,o){const i=e?.metodo??"",s=e===null?"":e.sede_id===null?"comun":String(e.sede_id);return r`<form id="form-cuenta" novalidate class="grid gap-4">
    <div data-error="general" hidden></div>
    ${o===null?null:x("warn",r`El dato guardado no sigue el formato estructurado: <span class="font-semibold">${o}</span>. Complétalo con los campos de abajo para reemplazarlo.`,"Datos anteriores")}
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="f-metodo" class="${n.etiqueta}">Método de pago</label>
        <select id="f-metodo" name="metodo" required class="${n.input}" aria-describedby="er-metodo">
          <option value="" ${i===""?"selected":""} disabled>Selecciona un método…</option>
          ${Ce.map(l=>r`<option value="${l}" ${l===i?"selected":""}>${G(l)}</option>`)}
        </select>
        <p id="er-metodo" data-error="metodo" class="${n.errorCampo}" hidden></p>
      </div>
      <div>
        <label for="f-ambito" class="${n.etiqueta}">Sede a la que aplica</label>
        <select id="f-ambito" name="ambito" required class="${n.input}" aria-describedby="ay-ambito er-ambito">
          <option value="" ${s===""?"selected":""} disabled>Selecciona el ámbito…</option>
          <option value="comun" ${s==="comun"?"selected":""}>Común (todas las sedes)</option>
          ${a.map(l=>r`<option value="${l.id}" ${String(l.id)===s?"selected":""}>${l.nombre}${l.activa?"":" (inactiva)"}</option>`)}
        </select>
        <p id="ay-ambito" class="${n.ayuda}">Las cuentas de una sede solo las ven las familias de esa sede.</p>
        <p id="er-ambito" data-error="ambito" class="${n.errorCampo}" hidden></p>
      </div>
    </div>
    <div>
      <label for="f-titular" class="${n.etiqueta}">Titular de la cuenta</label>
      <input id="f-titular" name="titular" type="text" maxlength="${he}" autocomplete="off" required value="${e?.titular??""}"
        class="${n.input}" aria-describedby="er-titular">
      <p id="er-titular" data-error="titular" class="${n.errorCampo}" hidden></p>
    </div>
    <div id="campos-metodo" class="grid gap-4" aria-live="polite">${ha(i,t)}</div>
    <label class="flex items-center gap-3 text-sm font-medium text-slate-800">
      <input type="checkbox" name="activa" ${e===null||e.activa?"checked":""} class="h-4 w-4 rounded border-slate-300">
      <span>Cuenta activa (visible para las familias)</span>
    </label>
    <div class="flex flex-wrap justify-end gap-3">
      <button type="button" data-cancelar class="${v(n.btnSecundario)}">Cancelar</button>
      <button type="submit" class="${v(n.btnPrimario)}">${h("check","h-4 w-4")}<span>${e===null?"Agregar cuenta":"Guardar cambios"}</span></button>
    </div>
  </form>`}function zt(e){const a=new FormData(e),t={};for(const[o,i]of a.entries())o.startsWith("campo_")&&typeof i=="string"&&(t[o.slice(6)]=i);return{metodo:ie(a,"metodo"),titular:ie(a,"titular"),ambito:ie(a,"ambito"),activa:a.get("activa")!==null,campos:t}}function Ve(e,a,t){const o=e?Se[e.metodo].interpretar(e.detalle):null,i=e!==null&&o===null?e.detalle:null,s=W({titulo:e===null?"Agregar cuenta de cobro":"Editar cuenta de cobro",ancho:"lg",cuerpo:Ht(e,a,o??{},i)}),l=u("#form-cuenta",HTMLFormElement,s.dialogo);u("#f-metodo",HTMLSelectElement,l).addEventListener("change",p=>{const d=p.target instanceof HTMLSelectElement?p.target.value:"";f(u("#campos-metodo",HTMLElement,l),ha(d,e!==null&&e.metodo===d&&o?o:{}))}),u("[data-cancelar]",HTMLButtonElement,l).addEventListener("click",()=>s.cerrar()),l.addEventListener("submit",p=>{p.preventDefault(),kt(l,e,a,s,t)}),u("#f-metodo",HTMLSelectElement,l).focus()}async function kt(e,a,t,o,i){const s=Mt(zt(e),t);Z(e,s.errores);const l=u('[data-error="general"]',HTMLElement,e);if(l.hidden=!0,s.cuerpo===null)return;const p=s.cuerpo;try{await P(u('button[type="submit"]',HTMLButtonElement,e),()=>a===null?y.post("/configuracion/cuentas",p):y.put(`/configuracion/cuentas/${a.id}`,p)),o.cerrar(),A("ok",a===null?"Cuenta agregada.":"Cuenta actualizada."),await i()}catch(d){if(d instanceof M){window.location.reload();return}const c=d instanceof V?$a(d):{general:T(d)},b=c.general;Z(e,{...c,general:""}),b&&(l.hidden=!1,f(l,x("bad",b)))}}const xe=150;function Ue(e,a){const t={},o=e.concepto.trim();o===""?t.concepto="Escribe el concepto, por ejemplo «Mensualidad Noviembre 2026».":o.length>xe&&(t.concepto=`El concepto admite hasta ${xe} caracteres.`);const i=va(e.monto);return i===null&&(t.monto_usd="Escribe un monto en USD mayor que 0, con máximo 2 decimales (por ejemplo 85.00)."),jt(e.vencimiento)?e.vencimiento<a&&(t.fecha_vencimiento="El vencimiento no puede ser anterior a hoy: todos los alumnos quedarían morosos de inmediato."):t.fecha_vencimiento="Elige la fecha de vencimiento.",Object.keys(t).length>0||i===null?{errores:t,cuerpo:null}:{errores:t,cuerpo:{concepto:o,monto_usd:i,fecha_vencimiento:e.vencimiento}}}function jt(e){const a=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!a)return!1;const[t,o,i]=[Number(a[1]),Number(a[2]),Number(a[3])],s=new Date(Date.UTC(t,o-1,i));return s.getUTCFullYear()===t&&s.getUTCMonth()===o-1&&s.getUTCDate()===i}function qt(e,a){return e<=0?{tono:"inf",texto:`No se creó ninguna cuota nueva: todos los estudiantes activos ya tenían «${a}».`}:{tono:"okk",texto:`Se crearon ${e} ${e===1?"cuota":"cuotas"} de «${a}».`}}function xa(e){return e===null?"todas las sedes":"tu sede"}function Nt(e,a){const t=e.modulo.en_prueba===!0&&e.modulo.expira_prueba_en?e.modulo.expira_prueba_en:null;return r`${D(e.modulo.nombre,"Genera la mensualidad de todos los estudiantes activos en un solo paso.")}
    ${t?r`<div class="mb-6">${x("warn",`Prueba gratuita vigente hasta el ${O(t)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba")}</div>`:null}
    ${e.puedeGenerar?r`<section class="${n.tarjetaCristal} max-w-2xl p-6" aria-labelledby="t-masiva">
          <h2 id="t-masiva" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${h("receipt","h-5 w-5")}Nueva facturación mensual</h2>
          <p class="${n.ayuda} mb-4">Se aplica a los estudiantes «Activo» de ${xa(e.alcance)}. Repetir el mismo concepto no duplica cuotas.</p>
          <form id="form-masiva" novalidate class="flex flex-col gap-4" aria-label="Generar mensualidades">
            <div>
              <label for="f-concepto" class="${n.etiqueta}">Concepto <span class="text-red-800" aria-hidden="true">*</span></label>
              <input id="f-concepto" name="concepto" type="text" maxlength="${xe}" required autocomplete="off" placeholder="Mensualidad Noviembre 2026" aria-describedby="e-concepto" class="${n.input}">
              <p id="e-concepto" data-error="concepto" class="${n.errorCampo}" role="alert" hidden></p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="f-monto" class="${n.etiqueta}">Monto por estudiante (USD) <span class="text-red-800" aria-hidden="true">*</span></label>
                <input id="f-monto" name="monto_usd" type="text" inputmode="decimal" required autocomplete="off" placeholder="85.00" aria-describedby="e-monto" class="${n.input}">
                <p id="e-monto" data-error="monto_usd" class="${n.errorCampo}" role="alert" hidden></p>
              </div>
              <div>
                <label for="f-vence" class="${n.etiqueta}">Fecha de vencimiento <span class="text-red-800" aria-hidden="true">*</span></label>
                <input id="f-vence" name="fecha_vencimiento" type="date" required min="${a}" aria-describedby="e-vence" class="${n.input}">
                <p id="e-vence" data-error="fecha_vencimiento" class="${n.errorCampo}" role="alert" hidden></p>
              </div>
            </div>
            <p id="masiva-vista-previa" class="${n.ayuda}" aria-live="polite"></p>
            <div id="masiva-resultado" aria-live="polite"></div>
            <div class="flex justify-end">
              <button type="submit" class="${v(n.btnPrimario)}">${h("receipt","h-4 w-4")}<span>Generar</span></button>
            </div>
          </form>
        </section>`:r`<div class="max-w-2xl">${x("info","La generación masiva de mensualidades es una función del administrador. Pídele a esa persona que la ejecute.","Sección restringida")}</div>`}`}function Ge(e,a){for(const t of C("[data-error]",HTMLElement,e)){const o=a[t.dataset.error??""]??"";t.textContent=o,t.hidden=o===""}for(const t of C("[name]",HTMLElement,e))(a[t.getAttribute("name")??""]??"")!==""?t.setAttribute("aria-invalid","true"):t.removeAttribute("aria-invalid");z('[aria-invalid="true"]',HTMLElement,e)?.focus()}function We(e,a,t){f(e,r`<p class="msg ${a}" role="${a==="err"?"alert":"status"}" tabindex="-1"></p>`);const o=u(".msg",HTMLElement,e);o.textContent=t,o.focus()}function Ot(e,a){const t=u("#form-masiva",HTMLFormElement,e.zona),o=u("#masiva-resultado",HTMLElement,t),i=u("#masiva-vista-previa",HTMLElement,t),s=d=>{const c=t.elements.namedItem(d);return c instanceof HTMLInputElement?c.value:""},l=()=>({concepto:s("concepto"),monto:s("monto_usd"),vencimiento:s("fecha_vencimiento")}),p=()=>{const d=Ue(l(),a);i.textContent=d.cuerpo?`Se creará «${d.cuerpo.concepto}» por ${L(d.cuerpo.monto_usd)} con vencimiento el ${J(d.cuerpo.fecha_vencimiento)} para cada estudiante activo de ${xa(e.alcance)}.`:""};t.addEventListener("input",p),t.addEventListener("submit",d=>{d.preventDefault();const c=Ue(l(),a);if(Ge(t,c.errores),f(o,r``),c.cuerpo===null)return;const b=c.cuerpo,$=u('button[type="submit"]',HTMLButtonElement,t);P($,()=>y.post("/facturacion/cuotas/generar-mensualidades",b)).then(S=>{if(!e.vigente())return;const _=qt(S.creadas,b.concepto);We(o,_.tono,_.texto)}).catch(S=>{if(S instanceof M){e.alSesionExpirada();return}if(S instanceof V){const _=S.moduloPremium();if(_){e.alBloquear(_);return}const w=S.camposInvalidos();w.length>0&&Ge(t,Object.fromEntries(w.map(m=>[m.campo,m.mensaje])))}e.vigente()&&We(o,"err",T(S))})})}function Dt(e){if(e.modulo.bloqueado){f(e.zona,da({nombre:e.modulo.nombre,descripcion:e.modulo.descripcion,precio_usd:e.modulo.precio_usd},e.puedeProbar)),ca(e.zona,e.alActivarPrueba);return}const a=ue();f(e.zona,Nt(e,a)),e.puedeGenerar&&Ot(e,a)}function me(e){if(e===null)return{tipo:"denegado"};const a=e.sede_id??null;return a===null?e.rol==="admin"?{tipo:"consolidado"}:{tipo:"denegado"}:Number.isInteger(a)&&a>0?{tipo:"sede",sedeId:a}:{tipo:"denegado"}}const de="bma.cache.v1:";function Ie(){try{return sessionStorage}catch{return null}}function Rt(e,a){const t=Ie();if(!t)return null;try{const o=t.getItem(de+e);if(o===null)return null;const i=JSON.parse(o);return a(i)?i:null}catch{return null}}function Bt(e,a){try{Ie()?.setItem(de+e,JSON.stringify(a))}catch{}}function Pe(e){const a=Ie();if(a)try{if(e!==void 0){a.removeItem(de+e);return}const t=[];for(let o=0;o<a.length;o+=1){const i=a.key(o);i!==null&&i.startsWith(de)&&t.push(i)}for(const o of t)a.removeItem(o)}catch{}}async function He(e){const a=e.vigente??(()=>!0),t=Rt(e.clave,e.esValido);t!==null&&a()&&e.pintar(t,!0);try{const o=await e.cargar();if(!a())return;const i=t===null||JSON.stringify(o)!==JSON.stringify(t);Bt(e.clave,o),i&&e.pintar(o,!1)}catch(o){if(o instanceof M||t===null)throw o}}const ye="sedes";function ya(e){return Array.isArray(e)&&e.every(a=>{if(typeof a!="object"||a===null)return!1;const t=a;return typeof t.id=="number"&&typeof t.nombre=="string"&&typeof t.activa=="boolean"})}function Q(e,a){for(const t of C("[data-error]",HTMLElement,e)){const o=a[t.dataset.error??""]??"";t.textContent=o,t.hidden=o===""}for(const t of C("[name]",HTMLElement,e))(a[t.getAttribute("name")??""]??"")!==""?t.setAttribute("aria-invalid","true"):t.removeAttribute("aria-invalid");z('[aria-invalid="true"]',HTMLElement,e)?.focus()}function Ea(e,a,t){f(e,r`<p class="msg ${a}" role="${"alert"}" tabindex="-1"></p>`);const o=u(".msg",HTMLElement,e);o.textContent=t,o.focus()}function wa(e){if(!(e instanceof V))return null;const a=e.camposInvalidos();return a.length>0?Object.fromEntries(a.map(t=>[t.campo,t.mensaje])):null}function K(e,a){const t=e.elements.namedItem(a);return t instanceof HTMLInputElement||t instanceof HTMLSelectElement?t.value:""}const Ft=2,Ee=120,Vt="MULTI_SEDE_PREMIUM",Ut="Expansión Multi-Sede Avanzada (3+ Sedes)",_a=50;function Gt(e){const a=e.trim().replace(/\s+/g," ");return a===""?{error:"Escribe el nombre de la sede, por ejemplo «Sede Este».",nombre:null}:a.length>Ee?{error:`El nombre admite hasta ${Ee} caracteres.`,nombre:null}:{error:null,nombre:a}}function Wt(e){if(!(e instanceof V))return null;const a=e.moduloPremium();return a||(e.codigo==="MODULO_PREMIUM_DESHABILITADO"||e.codigo==="BM403"?{modulo:Vt,nombre:Ut,precio_usd:_a}:null)}function Jt(e){const a=e.tipo==="sede"?"La gestión de sedes es una función del acceso consolidado (SuperAdmin). Tu usuario opera únicamente sobre su sede.":"Tu usuario no tiene una sede asignada, así que no puede abrir esta sección. Pide a un administrador que revise tu cuenta.";return r`${D("Sedes","Ubicaciones de la academia")}
    <div class="max-w-2xl">${x("warn",a,"Sección Restringida")}</div>`}function Xt(e){return r`<li class="${n.tarjeta} transition duration-200 hover:shadow-md motion-reduce:transition-none">
    <button type="button" data-sede-id="${e.id}" aria-label="Ver los estudiantes de ${e.nombre}" class="flex w-full flex-col gap-3 rounded-xl p-4 text-left">
      <span class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bma-azul text-white">${h("building")}</span>
        <span class="min-w-0 flex-1">
          <span class="block break-words text-base font-bold text-slate-900">${e.nombre}</span>
          ${e.creado_en?r`<span class="${n.ayuda} block">Creada el ${O(e.creado_en)}</span>`:null}
        </span>
        ${F(e.activa?"Operativa":"Inactiva",e.activa?"ok":"neutral")}
      </span>
      <span class="text-sm font-medium text-bma-azul-oscuro">Ver estudiantes de esta sede →</span>
    </button>
  </li>`}function Kt(e){return e.length===0?x("info","Todavía no hay sedes registradas. Crea la primera con el formulario de abajo.","Sin sedes"):r`<ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Sedes registradas">${e.map(Xt)}</ul>`}function Yt(e){return r`<section class="${n.tarjetaCristal} max-w-2xl p-6" aria-labelledby="t-nueva-sede">
    <h2 id="t-nueva-sede" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${h("building","h-5 w-5")}Nueva sede</h2>
    <p class="${n.ayuda} mb-4">El Core Base incluye ${Ft} sedes (hoy hay ${e.length}). Desde la tercera se requiere la Expansión Multi-Sede (${L(_a)} · pago único); si ya está habilitada, el alta funciona con normalidad.</p>
    <form id="form-sede" novalidate class="flex flex-col gap-4 sm:flex-row sm:items-start" aria-label="Crear sede">
      <div class="min-w-0 flex-1">
        <label for="f-sede-nombre" class="${n.etiqueta}">Nombre de la sede <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="f-sede-nombre" name="nombre" type="text" maxlength="${Ee}" required autocomplete="off" placeholder="Sede Este" aria-describedby="e-sede-nombre" class="${n.input} min-h-10">
        <p id="e-sede-nombre" data-error="nombre" role="alert" hidden class="${n.errorCampo}"></p>
      </div>
      <button type="submit" class="${v(n.btnPrimario,"min-h-10 sm:mt-6")}">${h("check","h-4 w-4")}<span>Crear sede</span></button>
    </form>
    <div id="sede-resultado" class="mt-4" aria-live="polite"></div>
  </section>`}function Zt(e){return r`${D("Sedes","Ubicaciones de la academia y su estado operativo")}
    <div class="flex flex-col gap-8">${Kt(e)}${Yt(e)}</div>`}function Qt(e,a){const t=u("#form-sede",HTMLFormElement,e.zona),o=u("#sede-resultado",HTMLElement,e.zona);t.addEventListener("submit",i=>{i.preventDefault();const s=Gt(K(t,"nombre"));if(Q(t,s.error===null?{}:{nombre:s.error}),f(o,r``),s.nombre===null)return;const l={nombre:s.nombre},p=u('button[type="submit"]',HTMLButtonElement,t);P(p,()=>y.post("/sedes",l)).then(async d=>{A("ok",`Sede «${d.nombre}» creada.`),e.vigente()&&await a()}).catch(d=>{if(d instanceof M){e.alSesionExpirada();return}const c=Wt(d);if(c){e.alBloquear(c);return}if(!e.vigente())return;if(d instanceof V&&d.codigo==="SEDE_DUPLICADA"){Q(t,{nombre:d.message});return}const b=wa(d);b&&Q(t,b),Ea(o,"err",T(d))})})}async function eo(e){const a=me(e.usuario);if(a.tipo!=="consolidado"){f(e.zona,Jt(a));return}const t=async()=>{await He({clave:ye,esValido:ya,cargar:()=>y.get("/sedes"),vigente:e.vigente,pintar:i=>{f(e.zona,Zt(i)),Qt(e,o);for(const s of C("[data-sede-id]",HTMLButtonElement,e.zona))s.addEventListener("click",()=>{const l=Number(s.dataset.sedeId);Number.isInteger(l)&&l>0&&e.alElegirSede(l)})}})},o=async()=>{Pe(ye),await t()};await t()}const Je=7,we=1,_e=60,Me=60,ao=10,ze="__otro__",Ma=["Kids 1 B","Kids 1 A","Beginner B","Beginner A","Adultos","Kids 1 C","Beginner C"],La=["","Pendiente","Usada","Vencida","Revocada"],to={Pendiente:"info",Usada:"ok",Vencida:"warn",Revocada:"bad"};function oo(e,a){const t={};let o=null;if(a.tipo==="consolidado"){const p=Number(e.sede);e.sede===""||!Number.isInteger(p)||p<=0?t.sede_id="Elige la sede a la que pertenecerá el estudiante.":o=p}let i="";e.nivel===ze?(i=e.nivelOtro.trim().replace(/\s+/g," "),i===""?t.nivel_otro="Escribe el nivel.":i.length>Me&&(t.nivel_otro=`El nivel admite hasta ${Me} caracteres.`)):Ma.includes(e.nivel)?i=e.nivel:t.nivel_asignado="Elige el nivel asignado.";const s=e.dias.trim(),l=/^\d{1,3}$/.test(s)?Number(s):Number.NaN;return(!Number.isInteger(l)||l<we||l>_e)&&(t.dias=`Escribe un número entero de días entre ${we} y ${_e}.`),Object.keys(t).length>0?{errores:t,cuerpo:null}:{errores:t,cuerpo:o===null?{nivel_asignado:i,dias:l}:{nivel_asignado:i,dias:l,sede_id:o}}}async function no(e,a){try{if(window.isSecureContext&&typeof navigator.clipboard?.writeText=="function")return await navigator.clipboard.writeText(e),!0}catch{}return a.focus(),a.select(),a.setSelectionRange(0,e.length),!1}const io="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800";function so(){return r`${D("Invitaciones","Enlaces únicos de inscripción para los representantes")}
    <div class="max-w-2xl">${x("warn","Tu usuario no tiene una sede asignada, así que no puede emitir invitaciones. Pide a un administrador que revise tu cuenta.","Sección Restringida")}</div>`}function ro(e,a){if(e.tipo==="consolidado"){const o=a.filter(s=>s.activa),i=o.length===1?o[0]:void 0;return r`<div>
      <label for="f-inv-sede" class="${n.etiqueta}">Sede destino <span class="text-red-800" aria-hidden="true">*</span></label>
      <select id="f-inv-sede" name="sede_id" required aria-describedby="e-inv-sede" class="${n.input} min-h-10">
        <option value="">Elige una sede…</option>
        ${o.map(s=>r`<option value="${s.id}" ${s.id===i?.id?U("selected"):null}>${s.nombre}</option>`)}
      </select>
      <p id="e-inv-sede" data-error="sede_id" role="alert" hidden class="${n.errorCampo}"></p>
    </div>`}const t=a.find(o=>e.tipo==="sede"&&o.id===e.sedeId);return r`<div>
    <span class="${n.etiqueta}">Sede destino</span>
    <p class="${io}">${h("building","h-4 w-4")}<span class="min-w-0 break-words">${t?.nombre??"Tu sede"}</span></p>
    <p class="${n.ayuda}">Las invitaciones se emiten siempre para tu sede.</p>
  </div>`}function lo(e,a){return r`<section class="${n.tarjetaCristal} p-6" aria-labelledby="t-nueva-inv">
    <h2 id="t-nueva-inv" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${h("link","h-5 w-5")}Nueva invitación</h2>
    <p class="${n.ayuda} mb-4">El enlace es de un solo uso y fija la sede y el nivel: el representante no puede cambiarlos en la planilla.</p>
    <form id="form-inv" novalidate class="grid gap-4 sm:grid-cols-2" aria-label="Emitir invitación">
      ${ro(e,a)}
      <div>
        <label for="f-inv-nivel" class="${n.etiqueta}">Nivel asignado <span class="text-red-800" aria-hidden="true">*</span></label>
        <select id="f-inv-nivel" name="nivel_asignado" required aria-describedby="e-inv-nivel" class="${n.input} min-h-10">
          <option value="">Elige un nivel…</option>
          ${Ma.map(t=>r`<option value="${t}">${t}</option>`)}
          <option value="${ze}">Otro…</option>
        </select>
        <p id="e-inv-nivel" data-error="nivel_asignado" role="alert" hidden class="${n.errorCampo}"></p>
        <div id="inv-nivel-otro" class="mt-2" hidden>
          <label for="f-inv-otro" class="${n.etiqueta}">Escribe el nivel</label>
          <input id="f-inv-otro" name="nivel_otro" type="text" maxlength="${Me}" autocomplete="off" aria-describedby="e-inv-otro" class="${n.input} min-h-10">
          <p id="e-inv-otro" data-error="nivel_otro" role="alert" hidden class="${n.errorCampo}"></p>
        </div>
      </div>
      <div>
        <label for="f-inv-dias" class="${n.etiqueta}">Días de vigencia <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="f-inv-dias" name="dias" type="text" inputmode="numeric" required autocomplete="off" value="${Je}" aria-describedby="e-inv-dias" class="${n.input} min-h-10">
        <p class="${n.ayuda}">Entre ${we} y ${_e} días. Por defecto ${Je}.</p>
        <p id="e-inv-dias" data-error="dias" role="alert" hidden class="${n.errorCampo}"></p>
      </div>
      <div class="flex items-end justify-end sm:col-span-2">
        <button type="submit" class="${v(n.btnPrimario,"min-h-10")}">${h("link","h-4 w-4")}<span>Generar enlace</span></button>
      </div>
    </form>
    <div id="inv-resultado" class="mt-4" aria-live="polite"></div>
  </section>`}function co(e,a){return r`<section class="${n.tarjetaCristal} border-emerald-700/30 p-6" aria-labelledby="t-inv-ok">
    <h2 id="t-inv-ok" class="flex items-center gap-2 text-base font-bold text-slate-900">${h("check","h-5 w-5 text-emerald-700")}Invitación creada</h2>
    <p class="${n.ayuda} mb-4">${a} · ${e.nivel_asignado} · vence el ${O(e.expira_en)} · un solo uso.</p>
    <label for="inv-enlace" class="${n.etiqueta}">Enlace de inscripción</label>
    <div class="flex flex-col gap-3 sm:flex-row">
      <input id="inv-enlace" type="text" readonly value="${e.enlace}" class="${n.input} min-h-10 flex-1 font-mono text-xs">
      <button type="button" id="inv-copiar" class="${v(n.btnPrimario,"min-h-10")}">${h("copy","h-4 w-4")}<span>Copiar enlace</span></button>
    </div>
    <div class="mt-4">${x("warn","Por seguridad el enlace se muestra solo ahora: en el sistema queda únicamente su huella cifrada. Cópialo y envíalo al representante (por ejemplo, por WhatsApp). Si lo pierdes, revoca esta invitación y emite otra.","Cópialo ahora")}</div>
  </section>`}function uo(e){const a=e.estado==="Usada"&&e.usada_en!==null?r`Usada el ${O(e.usada_en)}`:r`Vence el ${O(e.expira_en)}`;return r`<tr>
    <td class="${n.td}">${e.sede}</td>
    <td class="${n.td}">${e.nivel_asignado}</td>
    <td class="${n.td}">${F(e.estado,to[e.estado])}</td>
    <td class="${n.td} whitespace-nowrap">${O(e.creado_en)}</td>
    <td class="${n.td} whitespace-nowrap">${a}</td>
    <td class="${n.td} text-right">
      ${e.estado==="Pendiente"?r`<button type="button" data-revocar="${e.id}" class="${v(n.btnSecundario,"min-h-10")}" aria-label="Revocar invitación de ${e.nivel_asignado} en ${e.sede}">${h("x","h-4 w-4")}<span>Revocar</span></button>`:null}
    </td>
  </tr>`}function po(e){return e.length===0?x("info","No hay invitaciones con este filtro.","Sin resultados"):r`<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
    <table class="${n.tabla}">
      <thead><tr>
        <th scope="col" class="${n.th}">Sede</th>
        <th scope="col" class="${n.th}">Nivel</th>
        <th scope="col" class="${n.th}">Estado</th>
        <th scope="col" class="${n.th}">Emitida</th>
        <th scope="col" class="${n.th}">Vigencia</th>
        <th scope="col" class="${n.th}"><span class="sr-only">Acciones</span></th>
      </tr></thead>
      <tbody>${e.map(uo)}</tbody>
    </table>
  </div>`}function mo(e){const a=Math.max(1,Math.ceil(e.total/Math.max(1,e.limite)));return r`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación de invitaciones">
    <span class="text-slate-600">Página ${e.pagina} de ${a} · ${e.total} invitación(es)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${v(n.btnSecundario,"min-h-10")}" ${e.pagina<=1?U("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${v(n.btnSecundario,"min-h-10")}" ${e.pagina>=a?U("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function Ta(){return r`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando invitaciones"></div>`}function fo(e,a){const t=e.tipo==="consolidado"&&!a.some(o=>o.activa);return r`${D("Invitaciones","Enlaces únicos de inscripción con sede y nivel blindados")}
    <div class="flex flex-col gap-8">
      <div class="max-w-3xl">
        ${t?x("warn","No hay sedes activas. Crea o activa una sede en la sección Sedes antes de emitir invitaciones.","Sin sedes disponibles"):lo(e,a)}
      </div>
      <div id="inv-exito" class="max-w-3xl" aria-live="polite"></div>
      <section aria-labelledby="t-inv-lista">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 id="t-inv-lista" class="text-base font-bold text-slate-900">Invitaciones emitidas</h2>
          <div>
            <label for="inv-filtro" class="${n.etiqueta}">Estado</label>
            <select id="inv-filtro" class="${n.input} min-h-10">${La.map(o=>r`<option value="${o}">${o===""?"Todas":o}</option>`)}</select>
          </div>
        </div>
        <div id="inv-lista">${Ta()}</div>
      </section>
    </div>`}function bo(e,a,t,o){const i=z("#form-inv",HTMLFormElement,e.zona);if(i===null)return;const s=u("#inv-resultado",HTMLElement,e.zona),l=u("#inv-exito",HTMLElement,e.zona),p=u("#f-inv-nivel",HTMLSelectElement,i),d=u("#inv-nivel-otro",HTMLElement,i);p.addEventListener("change",()=>{d.hidden=p.value!==ze,d.hidden||u("#f-inv-otro",HTMLInputElement,i).focus()}),i.addEventListener("submit",c=>{c.preventDefault();const b=oo({sede:K(i,"sede_id"),nivel:K(i,"nivel_asignado"),nivelOtro:K(i,"nivel_otro"),dias:K(i,"dias")},a);if(Q(i,b.errores),f(s,r``),b.cuerpo===null)return;const $=b.cuerpo,S=u('button[type="submit"]',HTMLButtonElement,i);P(S,()=>y.post("/invitaciones",$)).then(_=>{if(!e.vigente())return;const w=t.find(m=>m.id===_.sede_id)?.nombre??"Sede";f(l,co(_,w)),vo(l,_.enlace),u("#inv-copiar",HTMLButtonElement,l).focus(),o()}).catch(_=>{if(_ instanceof M){e.alSesionExpirada();return}if(!e.vigente())return;const w=wa(_);w&&Q(i,w),Ea(s,"err",T(_))})})}function vo(e,a){const t=u("#inv-copiar",HTMLButtonElement,e),o=u("#inv-enlace",HTMLInputElement,e),i=t.innerHTML;t.addEventListener("click",()=>{no(a,o).then(s=>{if(!s){A("warn","Tu navegador no permitió copiar automáticamente. El enlace quedó seleccionado: pulsa Ctrl+C (⌘+C en Mac).");return}f(t,r`${h("check","h-4 w-4")}<span>¡Copiado!</span>`),A("ok","Enlace copiado. Ya puedes pegarlo en WhatsApp."),window.setTimeout(()=>{t.isConnected&&(t.innerHTML=i)},2500)})})}function go(e,a,t){const o=W({titulo:"Revocar invitación",cuerpo:r`<p class="text-sm text-slate-700">Se desactivará el enlace de <strong>${e.nivel_asignado}</strong> en <strong>${e.sede}</strong>. Quien lo abra verá que ya no es válido. Esta acción no se puede deshacer.</p>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" data-cancelar class="${v(n.btnSecundario,"min-h-10")}">Cancelar</button>
        <button type="button" data-confirmar class="${v(n.btnPeligro,"min-h-10")}">${h("x","h-4 w-4")}<span>Revocar</span></button>
      </div>`});z("[data-cancelar]",HTMLButtonElement,o.dialogo)?.addEventListener("click",o.cerrar);const i=u("[data-confirmar]",HTMLButtonElement,o.dialogo);i.addEventListener("click",()=>{P(i,()=>y.post(`/invitaciones/${e.id}/revocar`)).then(()=>{o.cerrar(),A("ok","Invitación revocada: el enlace ya no sirve."),a()}).catch(s=>{if(s instanceof M){o.cerrar(),t();return}if(s instanceof V&&s.codigo==="INVITACION_NO_REVOCABLE"){o.cerrar(),A("warn",s.message),a();return}A("bad",T(s))})})}function $o(e){const a=u("#inv-lista",HTMLElement,e.zona),t=u("#inv-filtro",HTMLSelectElement,e.zona);let o="",i=1,s=[],l=0;const p=async()=>{l+=1;const d=l;f(a,Ta());try{const c=await y.pagina("/invitaciones",{estado:o,pagina:i,limite:ao});if(!e.vigente()||d!==l)return;s=c.datos,f(a,r`${po(c.datos)}${mo(c.paginacion)}`)}catch(c){if(!e.vigente()||d!==l)return;if(c instanceof M){e.alSesionExpirada();return}f(a,r`${x("bad",T(c),"No se pudo cargar la lista")}
        <button type="button" data-reintentar class="${v(n.btnSecundario,"mt-4 min-h-10")}">${h("refresh","h-4 w-4")}<span>Reintentar</span></button>`)}};return a.addEventListener("click",d=>{const c=d.target instanceof Element?d.target:null,b=c?.closest("[data-revocar]");if(b instanceof HTMLElement){const S=Number(b.dataset.revocar),_=s.find(w=>w.id===S);_&&go(_,()=>void p(),()=>e.alSesionExpirada());return}if(c?.closest("[data-reintentar]")){p();return}const $=c?.closest("[data-pag]");$ instanceof HTMLButtonElement&&!$.disabled&&(i=Math.max(1,i+Number($.dataset.pag)),p())}),t.addEventListener("change",()=>{o=La.find(c=>c===t.value)??"",i=1,p()}),p(),()=>{t.value="",o="",i=1,p()}}async function ho(e){const a=me(e.usuario);if(a.tipo==="denegado"){f(e.zona,so());return}const t=await y.get("/sedes");if(!e.vigente())return;f(e.zona,fo(a,t));const o=$o(e);bo(e,a,t,o)}function ke(){return r`<div class="mb-6"><div class="h-8 w-56 rounded-lg bg-slate-200"></div><div class="mt-3 h-4 w-80 max-w-full rounded bg-slate-200"></div></div>`}function xo(e=6){const a=r`<div class="flex gap-4 border-b border-slate-100 px-4 py-4"><div class="h-4 w-1/4 rounded bg-slate-200"></div><div class="h-4 w-1/6 rounded bg-slate-200"></div><div class="h-4 w-1/5 rounded bg-slate-200"></div><div class="h-4 w-1/6 rounded bg-slate-200"></div></div>`;return r`<div role="status" aria-label="Cargando" class="animate-pulse">
    ${ke()}
    <div class="mb-4 flex gap-2"><div class="h-8 w-20 rounded-lg bg-slate-200"></div><div class="h-8 w-24 rounded-lg bg-slate-200"></div><div class="h-8 w-28 rounded-lg bg-slate-200"></div></div>
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white"><div class="h-11 bg-slate-200"></div>${Array.from({length:e},()=>a)}</div>
  </div>`}function yo(e=4){const a=r`<div class="rounded-xl border border-slate-200 bg-white p-6"><div class="h-4 w-1/2 rounded bg-slate-200"></div><div class="mt-4 h-7 w-2/3 rounded bg-slate-200"></div><div class="mt-3 h-3 w-1/3 rounded bg-slate-200"></div></div>`;return r`<div role="status" aria-label="Cargando" class="animate-pulse">
    ${ke()}
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${Array.from({length:e},()=>a)}</div>
    <div class="mt-6 h-48 rounded-xl bg-slate-200"></div>
  </div>`}function Eo(){return r`<div role="status" aria-label="Cargando" class="animate-pulse">
    ${ke()}
    <div class="h-40 rounded-xl bg-slate-200"></div>
    <div class="mt-4 h-24 rounded-xl bg-slate-200"></div>
  </div>`}function wo(e){return e==="estudiantes"||e==="auditoria"||e==="invitaciones"?xo():e==="dashboard"||e==="sedes"?yo():Eo()}const Xe="255, 255, 255",Ke="103, 232, 249",Ye=130,ne=170;function _o(e){const a=[.5,.12],t=[.28,.88],o=[.72,.88],i=(c,b,$)=>[c[0]+(b[0]-c[0])*$,c[1]+(b[1]-c[1])*$],s=Math.max(2,Math.floor(e/3)),l=[];for(let c=0;c<s;c+=1)l.push(i(t,a,c/s));for(let c=0;c<s;c+=1)l.push(i(a,o,c/s));const p=i(t,a,.58),d=i(o,a,.58);for(let c=1;c<s;c+=1)l.push(i(p,d,c/s));return l}function Mo(e,a){const t=Math.max(36,Math.min(110,Math.round(e*a/11e3))),o=Math.min(e,a)*.9,i=(e-o)/2,s=(a-o)/2,l=_o(Math.round(t/3)),p=[];for(const[d,c]of l){const b=i+d*o,$=s+c*o;p.push({x:b+(Math.random()-.5)*90,y:$+(Math.random()-.5)*90,vx:0,vy:0,ax:b,ay:$,r:1.8+Math.random()*1.4,cian:Math.random()<.3})}for(;p.length<t;)p.push({x:Math.random()*e,y:Math.random()*a,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,ax:null,ay:null,r:1.2+Math.random()*1.6,cian:Math.random()<.2});return p}function Lo(e){const a=e.getContext("2d");if(!a)return()=>{};const t=window.matchMedia("(prefers-reduced-motion: reduce)").matches;let o=0,i=0,s=[],l=0,p=!0;const d={x:-9999,y:-9999,dentro:!1},c=()=>{const m=Math.min(window.devicePixelRatio||1,2);o=e.clientWidth,i=e.clientHeight,e.width=Math.max(1,Math.round(o*m)),e.height=Math.max(1,Math.round(i*m)),a.setTransform(m,0,0,m,0,0),s=Mo(o,i)},b=()=>{for(const m of s){if(m.ax!==null&&m.ay!==null&&(m.vx+=(m.ax-m.x)*.0016+(Math.random()-.5)*.05,m.vy+=(m.ay-m.y)*.0016+(Math.random()-.5)*.05),d.dentro){const H=d.x-m.x,R=d.y-m.y,q=Math.hypot(H,R);if(q<ne&&q>1){const X=(1-q/ne)*.045;m.vx+=H/q*X*6,m.vy+=R/q*X*6}}m.vx*=.94,m.vy*=.94,m.x+=m.vx,m.y+=m.vy,m.ax===null&&(m.x<-20?m.x=o+20:m.x>o+20&&(m.x=-20),m.y<-20?m.y=i+20:m.y>i+20&&(m.y=-20),m.vx+=(Math.random()-.5)*.02,m.vy+=(Math.random()-.5)*.02)}},$=()=>{a.clearRect(0,0,o,i);for(let m=0;m<s.length;m+=1){const H=s[m];if(H){for(let R=m+1;R<s.length;R+=1){const q=s[R];if(!q)continue;const X=Math.hypot(H.x-q.x,H.y-q.y);X<Ye&&(a.strokeStyle=`rgba(${Xe}, ${(1-X/Ye)*.28})`,a.lineWidth=1,a.beginPath(),a.moveTo(H.x,H.y),a.lineTo(q.x,q.y),a.stroke())}if(d.dentro){const R=Math.hypot(H.x-d.x,H.y-d.y);R<ne&&(a.strokeStyle=`rgba(${Ke}, ${(1-R/ne)*.55})`,a.beginPath(),a.moveTo(H.x,H.y),a.lineTo(d.x,d.y),a.stroke())}}}for(const m of s)a.fillStyle=m.cian?`rgba(${Ke}, 0.9)`:`rgba(${Xe}, 0.7)`,a.beginPath(),a.arc(m.x,m.y,m.r,0,Math.PI*2),a.fill()},S=()=>{p&&(b(),$(),l=window.requestAnimationFrame(S))},_=m=>{const H=e.getBoundingClientRect();d.x=m.clientX-H.left,d.y=m.clientY-H.top,d.dentro=!0},w=()=>{d.dentro=!1};if(c(),window.addEventListener("resize",c),window.addEventListener("pointermove",_,{passive:!0}),window.addEventListener("pointerleave",w),document.addEventListener("mouseleave",w),t){for(const m of s)m.ax!==null&&m.ay!==null&&(m.x=m.ax,m.y=m.ay);$()}else l=window.requestAnimationFrame(S);return()=>{p=!1,window.cancelAnimationFrame(l),window.removeEventListener("resize",c),window.removeEventListener("pointermove",_),window.removeEventListener("pointerleave",w),document.removeEventListener("mouseleave",w)}}const To="/assets/bma-texto-B9go_rut.png",Ze={ancho:2167,alto:2099},Qe={ancho:4111,alto:698},N={isotipo:700,texto:800,pausa:450,salida:450,tarjeta:600,retrasoTarjeta:150},Ao=1500;let ea=!1;const So={lista:Promise.resolve(!0),cancelar:()=>{}};function Co(){return typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}async function Io(e,a){const t=Promise.all(e.map(i=>i.decode().catch(()=>{}))),o=new Promise(i=>{window.setTimeout(i,a)});await Promise.race([t,o])}function Po(){let e=null;return{esperar:a=>new Promise(t=>{e={id:window.setTimeout(()=>{e=null,t()},a),resolver:t}}),despertar:()=>{if(!e)return;const{id:a,resolver:t}=e;e=null,window.clearTimeout(a),t()}}}function Ho(){const e=document.createElement("div");return e.className="intro-login",e.dataset.fase="preparando",e.setAttribute("aria-hidden","true"),e.style.setProperty("--intro-ms-isotipo",`${N.isotipo}ms`),e.style.setProperty("--intro-ms-texto",`${N.texto}ms`),e.style.setProperty("--intro-ms-salida",`${N.salida}ms`),f(e,r`<img class="intro-login__isotipo" src="${Ga}" alt="" width="${Ze.ancho}" height="${Ze.alto}" decoding="async" fetchpriority="high">
    <img class="intro-login__texto" src="${To}" alt="" width="${Qe.ancho}" height="${Qe.alto}" decoding="async" fetchpriority="high">`),e}function zo(e){if(ea||Co())return So;ea=!0;const a=Ho(),t=Array.from(a.querySelectorAll("img")),o=Po(),i=new AbortController;let s="activa",l=()=>{};const p=new Promise(w=>{l=w}),d=(...w)=>w.includes(s),c=w=>{a.dataset.fase=w},b=()=>{i.abort(),a.remove(),e.inert=!1,delete e.dataset.intro,e.style.removeProperty("--intro-ms-tarjeta"),e.style.removeProperty("--intro-retraso-tarjeta")},$=()=>{d("activa")&&(s="saltada",l(),o.despertar())};return e.inert=!0,e.dataset.intro="activa",e.style.setProperty("--intro-ms-tarjeta",`${N.tarjeta}ms`),e.style.setProperty("--intro-retraso-tarjeta",`${N.retrasoTarjeta}ms`),document.body.append(a),a.addEventListener("pointerdown",$,{signal:i.signal}),document.addEventListener("keydown",w=>{(w.key==="Escape"||w.key==="Enter"||w.key===" ")&&$()},{signal:i.signal}),{lista:(async()=>{await Promise.race([Io(t,Ao),p]),a.offsetWidth;const w=[{fase:"isotipo",ms:N.isotipo},{fase:"texto",ms:N.texto+N.pausa}];for(const m of w){if(!d("activa"))break;c(m.fase),await o.esperar(m.ms)}return d("cancelada")||(s="saliendo",c("salida"),e.dataset.intro="revelar",await o.esperar(N.retrasoTarjeta+N.tarjeta),d("cancelada"))?!1:(s="terminada",b(),!0)})().catch(()=>(s="terminada",b(),!0)),cancelar:()=>{d("cancelada","terminada")||(s="cancelada",l(),o.despertar(),b())}}}const Aa="bma.sidebar.colapsado",ko=3e4,Sa=25,fe=300,Ca=!1,jo=[{id:"dashboard",titulo:"Dashboard",icono:"home",soloAdmin:!1},{id:"estudiantes",titulo:"Estudiantes",icono:"users",soloAdmin:!1},{id:"auditoria",titulo:"Auditoría de referencias",icono:"inbox",soloAdmin:!1},{id:"sedes",titulo:"Sedes",icono:"building",soloAdmin:!1},{id:"invitaciones",titulo:"Invitaciones",icono:"link",soloAdmin:!1},{id:"contabilidad",titulo:"Egresos y contabilidad",icono:"book",soloAdmin:!0},{id:"configuracion",titulo:"Configuración de cobro",icono:"wallet",soloAdmin:!0}],Ia={IA_ATENCION:"bot",WHATSAPP_AUTOMATICO:"chat",BANCAMIGA:"wallet",APP_MOVIL:"phone",FACHADA_WEB:"globe",MULTI_SEDE_PREMIUM:"school",FACTURACION_MASIVA:"receipt"},aa=["","Activo","Moroso","Fuera de la Academia","Pendiente por Validación Administrativa"],ta=["Por Validar","Aprobada","Rechazada"];let g={usuario:null,modulos:[],vista:"dashboard",colapsado:!1,periodo:sa(),filtroEstudiantes:"",paginaEstudiantes:1,sedeFiltro:null,filtroAuditoria:"Por Validar",paginaAuditoria:1};function k(e){g={...g,...e}}let se=0,re=null;function qo(){try{const e=localStorage.getItem(Aa);if(e==="1")return!0;if(e==="0")return!1}catch{}return window.matchMedia("(max-width: 767px)").matches}function No(e){try{localStorage.setItem(Aa,e?"1":"0")}catch{}}function Oo(e){if(typeof e!="object"||e===null)return!1;const a=e;return typeof a.id=="number"&&typeof a.nombre=="string"&&typeof a.email=="string"&&(a.rol==="admin"||a.rol==="secretaria")}function Do(){const e=pe.usuarioCrudo();if(!e)return null;try{const a=JSON.parse(e);return Oo(a)?a:null}catch{return null}}const ee=()=>g.usuario?.rol==="admin";function Pa(){return jo.filter(e=>(!e.soloAdmin||ee())&&(e.id!=="contabilidad"||Ca))}let Le=null;function Ha(){Le?.(),Le=null}let ce=null;function za(){ce?.cancelar(),ce=null}function ka(e){je(),Ha(),za(),se+=1,document.body.className="text-slate-900",f(u("#app",HTMLElement),r`<main id="login-pantalla" class="relative flex min-h-screen items-center justify-center overflow-hidden bg-bma-azul px-4 py-12">
      <canvas id="red-neuronal" aria-hidden="true" class="pointer-events-none absolute inset-0 h-full w-full"></canvas>
      <section data-intro-revelar class="${n.loginTarjeta} relative z-10" aria-labelledby="login-titulo">
        <header class="mb-8 flex flex-col items-center text-center">
          ${ra("h-auto w-48 sm:w-56",!0)}
          <h1 id="login-titulo" class="sr-only">Brilliant Minds Academy · Panel administrativo</h1>
          <p class="mt-3 font-display text-sm font-medium tracking-wide text-slate-700">Panel administrativo</p>
        </header>
        <form id="login" novalidate class="flex flex-col gap-4" aria-labelledby="login-titulo">
          <div id="login-aviso">${e?x("warn",e):null}</div>
          <div>
            <label for="login-email" class="${n.etiqueta} font-display tracking-wide">Correo</label>
            <input id="login-email" name="email" type="email" required autocomplete="username" class="${n.input}">
          </div>
          <div>
            <label for="login-password" class="${n.etiqueta} font-display tracking-wide">Contraseña</label>
            <input id="login-password" name="password" type="password" required autocomplete="current-password" class="${n.input}">
          </div>
          <button type="submit" class="${v(n.btnPrimario,n.btnLogin,"font-display tracking-wide")}"><span>Entrar</span></button>
        </form>
        ${Wa()}
      </section>
    </main>`),Le=Lo(u("#red-neuronal",HTMLCanvasElement));const a=u("#login",HTMLFormElement);a.addEventListener("submit",o=>{o.preventDefault(),Ro(a)});const t=zo(u("#login-pantalla",HTMLElement));ce=t,t.lista.then(o=>{o&&ce===t&&z("#login-email",HTMLInputElement)?.focus()})}async function Ro(e){const a=u("#login-email",HTMLInputElement).value.trim(),t=u("#login-password",HTMLInputElement).value,o=u("#login-aviso",HTMLElement);if(!a||!t){f(o,x("bad","Escribe tu correo y tu contraseña."));return}try{const i=await P(u('button[type="submit"]',HTMLButtonElement,e),()=>y.post("/auth/login",{email:a,password:t},{sinAuth:!0}));pe.guardar(i.token,JSON.stringify(i.usuario)),Pe(),await ja()}catch(i){f(o,x("bad",T(i)))}}function j(e){pe.cerrar(),Pe(),k({usuario:null,modulos:[],vista:"dashboard",sedeFiltro:null}),ka(e)}function Te(e){const{id:a,titulo:t,tooltip:o,bloqueado:i}=e;return r`<button type="button" data-nav="${a}" data-bloqueado="${i}"
    class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 aria-[current=page]:bg-bma-azul aria-[current=page]:text-white group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
    ${h(e.icono)}
    <span class="min-w-0 flex-1 truncate group-data-[collapsed=true]/sb:sr-only">${t}</span>
    ${i?r`<span class="text-slate-500 group-data-[collapsed=true]/sb:absolute group-data-[collapsed=true]/sb:right-2 group-data-[collapsed=true]/sb:top-1">${h("lock","h-4 w-4 group-data-[collapsed=true]/sb:h-3 group-data-[collapsed=true]/sb:w-3")}</span>`:null}
    <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">${o}</span>
  </button>`}function Bo(){const e=g.usuario,a=Pa();return r`<div id="shell" data-collapsed="${g.colapsado}" class="group/sb flex min-h-screen">
    <aside id="barra-lateral" aria-label="Navegación principal"
      class="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-lg transition-[width] duration-200 group-data-[collapsed=true]/sb:w-20">
      <div class="flex h-24 items-center justify-center border-b border-slate-200 px-4 group-data-[collapsed=true]/sb:h-16 group-data-[collapsed=true]/sb:px-2">
        ${ra("h-auto max-h-20 w-auto max-w-full object-contain group-data-[collapsed=true]/sb:hidden")}
        ${Ja("hidden h-10 w-10 object-contain group-data-[collapsed=true]/sb:block")}
        <span class="sr-only">Administración</span>
      </div>
      <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Secciones">
        ${a.map(t=>Te({id:t.id,titulo:t.titulo,icono:t.icono,tooltip:t.titulo,bloqueado:!1}))}
        <p class="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 group-data-[collapsed=true]/sb:sr-only">Módulos Premium</p>
        <hr class="my-2 hidden border-slate-200 group-data-[collapsed=true]/sb:block">
        ${g.modulos.map(t=>Te({id:`premium:${t.codigo}`,titulo:t.nombre,icono:Ia[t.codigo]??"chat",tooltip:t.bloqueado?`${t.nombre} · ${t.tooltip}`:t.nombre,bloqueado:t.bloqueado}))}
      </nav>
      <div class="flex flex-col gap-1 border-t border-slate-200 p-3">
        <div class="flex items-center gap-3 px-3 py-2 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800" aria-hidden="true">${(e?.nombre??"?").trim().slice(0,1).toUpperCase()}</span>
          <span class="min-w-0 group-data-[collapsed=true]/sb:sr-only"><span class="block truncate text-sm font-semibold text-slate-900">${e?.nombre}</span><span class="block truncate text-xs text-slate-600">${e?.rol}</span></span>
        </div>
        <button type="button" id="salir" class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${h("logout")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Salir</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Salir</span>
        </button>
        <button type="button" id="alternar-sidebar" aria-controls="barra-lateral" aria-expanded="${!g.colapsado}" aria-label="${g.colapsado?"Expandir menú lateral":"Contraer menú lateral"}"
          class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${h("menu")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Contraer menú</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Expandir menú</span>
        </button>
      </div>
      ${Xa()}
    </aside>
    <main id="contenido" tabindex="-1" class="m-2 min-w-0 flex-1 rounded-xl bg-slate-50/95 p-4 shadow-lg sm:m-4 sm:p-8"></main>
  </div>`}function Fo(){const e=!g.colapsado;k({colapsado:e}),No(e);const a=u("#shell",HTMLElement);a.dataset.collapsed=String(e);const t=u("#alternar-sidebar",HTMLButtonElement);t.setAttribute("aria-expanded",String(!e)),t.setAttribute("aria-label",e?"Expandir menú lateral":"Contraer menú lateral")}function Vo(e){const a=e.startsWith("estudiante:")?"estudiantes":e;for(const t of C("[data-nav]",HTMLElement))t.dataset.nav===a?t.setAttribute("aria-current","page"):t.removeAttribute("aria-current")}async function ja(){if(!pe.token()){ka();return}let e=Do();try{e||(e=(await y.get("/auth/me")).usuario);const o=await y.get("/premium/modulos").catch(i=>{if(i instanceof M)throw i;return[]});k({usuario:e,modulos:o,colapsado:qo()})}catch(o){j(o instanceof M?"Tu sesión expiró. Inicia sesión de nuevo.":T(o));return}document.body.className="text-slate-900",Ha(),za(),f(u("#app",HTMLElement),Bo()),u("#shell",HTMLElement).addEventListener("click",o=>{const s=(o.target instanceof Element?o.target:null)?.closest("[data-nav]");if(!(s instanceof HTMLElement))return;const l=s.dataset.nav??"";g.modulos.find(d=>`premium:${d.codigo}`===l)?.bloqueado&&(o.preventDefault(),o.stopPropagation()),I(l)}),u("#salir",HTMLButtonElement).addEventListener("click",()=>j()),u("#alternar-sidebar",HTMLButtonElement).addEventListener("click",Fo);const t=g.vista.startsWith("premium:")||Pa().some(o=>o.id===g.vista)?g.vista:"dashboard";await I(t)}function je(){re!==null&&(window.clearInterval(re),re=null)}async function I(e){je(),se+=1;const a=se;k({vista:e}),Vo(e);const t=u("#contenido",HTMLElement),o={zona:t,vigente:()=>a===se};f(t,wo(e));try{e.startsWith("premium:")?dn(o,e.slice(8)):e.startsWith("estudiante:")?await tn(o,e.slice(11)):e==="estudiantes"?await Qo(o):e==="auditoria"?await nn(o):e==="sedes"?await eo({zona:o.zona,vigente:o.vigente,usuario:g.usuario,alBloquear:i=>void Ba(o,i),alElegirSede:i=>{k({sedeFiltro:i,paginaEstudiantes:1,filtroEstudiantes:""}),I("estudiantes")},alSesionExpirada:()=>j("Tu sesión expiró. Inicia sesión de nuevo.")}):e==="invitaciones"?await ho({zona:o.zona,vigente:o.vigente,usuario:g.usuario,alSesionExpirada:()=>j("Tu sesión expiró. Inicia sesión de nuevo.")}):e==="contabilidad"&&Ca&&ee()||(e==="configuracion"&&ee()?await Ct({zona:o.zona,vigente:o.vigente,usuario:g.usuario}):await Xo(o))}catch(i){qa(i,o)}}function qa(e,a){if(a.vigente()){if(e instanceof M){j("Tu sesión expiró. Inicia sesión de nuevo.");return}if(e instanceof V){const t=e.moduloPremium();if(t){Fa(a.zona,t);return}}f(a.zona,r`<div class="mx-auto max-w-2xl pt-8">${x("bad",T(e),e instanceof Za?"Sin conexión":"No se pudo cargar la sección")}
      <button type="button" data-reintentar class="${v(n.btnSecundario,"mt-4")}">${h("refresh","h-4 w-4")}<span>Reintentar</span></button></div>`),z("[data-reintentar]",HTMLButtonElement,a.zona)?.addEventListener("click",()=>void I(g.vista))}}function Na(e){const a=Math.max(1,Math.ceil(e.total/Math.max(1,e.limite)));return r`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación">
    <span class="text-slate-600">Página ${e.pagina} de ${a} · ${e.total} registro(s)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${v(n.btnSecundario,n.btnPeq)}" ${e.pagina<=1?U("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${v(n.btnSecundario,n.btnPeq)}" ${e.pagina>=a?U("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function Oa(e,a){for(const t of C("[data-pag]",HTMLButtonElement,e))t.addEventListener("click",()=>a(Number(t.dataset.pag)))}function Uo(e){return r`<article class="${n.tarjeta} p-6">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-sm font-medium text-slate-600">${e.titulo}</h3>
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${h(e.icono,"h-4 w-4")}</span>
    </div>
    <p class="mt-3 text-2xl font-bold ${e.tono==="malo"?"text-bma-coral-oscuro":"text-slate-900"}" data-kpi>${e.valor}</p>
    <p class="mt-1 text-xs text-slate-600">${e.detalle}</p>
  </article>`}function Go(e){const a=Ya(e.periodo),t=new Map;for(const l of e.cobrado_por_dia)t.set(Number(l.dia.slice(8,10)),l.monto_usd);const o=Math.max(0,...t.values()),i=Array.from({length:a},(l,p)=>{const d=p+1,c=t.get(d)??0,b=o>0?Math.max(c>0?4:0,Math.round(c/o*100)):0;return r`<li class="group/barra relative flex h-full min-w-0 flex-1 flex-col justify-end" title="Día ${d}: ${L(c)}">
      <div data-alto="${b}" class="w-full rounded-t ${c>0?"bg-slate-800 group-hover/barra:bg-slate-600":"bg-slate-200"} ${c>0?"":"h-px"}"></div>
      <span class="sr-only">Día ${d}: ${L(c)}</span>
    </li>`}),s=Array.from({length:a},(l,p)=>r`<span class="min-w-0 flex-1 text-center text-xs text-slate-600">${(p+1)%5===0||p===0?p+1:""}</span>`);return r`<div role="group" aria-label="Cobrado por día en ${e.periodo}">
    <ul class="flex h-48 items-end gap-1 border-b border-slate-200">${i}</ul>
    <div class="mt-1 flex gap-1" aria-hidden="true">${s}</div>
  </div>`}function Wo(e){for(const a of C("[data-alto]",HTMLElement,e)){const t=Number(a.dataset.alto);Number.isFinite(t)&&t>0&&(a.style.height=`${Math.min(100,t)}%`)}}function Jo(e,a){const t=[{titulo:"Cobrado",valor:L(e.cobrado.monto_usd),detalle:`${e.cobrado.cantidad} pago(s) aprobados`,icono:"wallet",tono:"normal"},{titulo:"Saldos vencidos",valor:L(e.saldos_vencidos.monto_usd),detalle:`${e.saldos_vencidos.cantidad} cuota(s) vencida(s)`,icono:"alert",tono:"malo"},{titulo:"Cuentas pendientes del mes",valor:L(e.cuentas_pendientes.monto_usd),detalle:`${e.cuentas_pendientes.cantidad} cuota(s) por cobrar`,icono:"book",tono:"normal"},{titulo:"Referencias por validar",valor:String(e.referencias_por_validar),detalle:"en la bandeja de auditoría",icono:"inbox",tono:"normal"}];return r`
    <section aria-label="Indicadores del mes" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${t.map(Uo)}</section>
    <section aria-label="Estudiantes por estado" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${[["Activos",a.activos],["Morosos",a.morosos],["Fuera de la Academia",a.fuera_de_la_academia],["Pendientes de validación",a.pendientes_validacion]].map(([o,i])=>r`<div class="${n.tarjeta} flex items-center justify-between gap-4 px-6 py-4"><span class="text-sm text-slate-700">${o}</span><strong class="text-lg text-slate-900">${i}</strong></div>`)}
    </section>
    <section class="${n.tarjeta} mt-6 p-6" aria-labelledby="t-barras">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="t-barras" class="text-base font-bold text-slate-900">Recaudación diaria</h2>
        <p class="text-sm text-slate-600">Cobrado del mes: <strong class="text-slate-900">${L(e.cobrado.monto_usd)}</strong></p>
      </div>
      ${Go(e)}
    </section>`}async function be(e,a){const t=u("#tablero",HTMLElement,e.zona);a||f(t,r`<div class="h-48 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando tablero"></div>`);try{const[o,i]=await Promise.all([y.get("/facturacion/tablero",{periodo:g.periodo}),y.get("/estudiantes/resumen")]);if(!e.vigente())return;f(t,Jo(o,i)),Wo(t);const s=z("#actualizado",HTMLElement,e.zona);s&&(s.textContent=`Actualizado a las ${Ka(new Date)}`)}catch(o){if(!e.vigente()||a&&!(o instanceof M))return;qa(o,e)}}async function Xo(e){f(e.zona,r`${D("Dashboard","Tablero financiero en tiempo real",r`<div class="flex flex-wrap items-end gap-4">
        <div><label for="periodo" class="${n.etiqueta}">Período</label><input id="periodo" type="month" value="${g.periodo}" max="${sa()}" class="${n.input}"></div>
        <p id="actualizado" class="pb-2 text-xs text-slate-600" aria-live="off"></p>
      </div>`)}<div id="tablero"></div>`),u("#periodo",HTMLInputElement,e.zona).addEventListener("change",a=>{const t=a.target instanceof HTMLInputElement?a.target.value:"";/^\d{4}-\d{2}$/.test(t)&&(k({periodo:t}),be(e,!1))}),await be(e,!0),re=window.setInterval(()=>{if(!e.vigente()){je();return}document.hidden||be(e,!0)},ko)}function Ko(e){return r`<tr>
    <td class="${n.td}"><button type="button" data-detalle="${e.id}" class="rounded-md text-left font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900" aria-label="Ver ficha de ${e.apellidos}, ${e.nombres}">${e.apellidos}, ${e.nombres}</button></td>
    <td class="${n.td}">${e.grado_solicitado}</td>
    <td class="${n.td}">${e.sede??"Sin sede"}</td>
    <td class="${n.td}">${e.representante}</td>
    <td class="${n.td}">${ae(e.estado_dinamico)}</td>
    <td class="${n.td} whitespace-nowrap">${L(e.deuda_vencida_usd)}</td>
    <td class="${n.td}"><div class="flex flex-wrap gap-2">
      <button type="button" data-alerta="preventiva" data-id="${e.id}" class="${v(n.btnPrimario,n.btnPeq)}">Preventiva</button>
      <button type="button" data-alerta="morosidad" data-id="${e.id}" class="${v(n.btnPrimario,n.btnPeq)}">Morosidad</button>
    </div></td>
  </tr>`}const Yo=e=>{if(typeof e!="object"||e===null)return!1;const a=e,t=a.paginacion;return Array.isArray(a.datos)&&typeof t=="object"&&t!==null&&typeof t.total=="number"};function Zo(e,a){const t=z("#zona-filtro-sede",HTMLElement,e.zona);t&&(f(t,r`<label for="filtro-sede" class="${n.etiqueta}">Sede</label>
      <select id="filtro-sede" class="${n.input} min-h-10 min-w-48">
        <option value="" ${g.sedeFiltro===null?U("selected"):null}>Todas las sedes</option>
        ${a.map(o=>r`<option value="${o.id}" ${g.sedeFiltro===o.id?U("selected"):null}>${o.nombre}</option>`)}
      </select>`),u("#filtro-sede",HTMLSelectElement,t).addEventListener("change",o=>{const i=o.target instanceof HTMLSelectElement?Number(o.target.value):Number.NaN;k({sedeFiltro:Number.isInteger(i)&&i>0?i:null,paginaEstudiantes:1}),I("estudiantes")}))}async function Qo(e){const a=me(g.usuario).tipo==="consolidado"?g.sedeFiltro:null,t={estado:g.filtroEstudiantes,pagina:g.paginaEstudiantes,limite:Sa,sede_id:a};await He({clave:`estudiantes:${g.filtroEstudiantes}:${g.paginaEstudiantes}:${a??"todas"}`,esValido:Yo,cargar:()=>y.pagina("/estudiantes",t),pintar:o=>en(e,o),vigente:e.vigente})}function en(e,a){const t=me(g.usuario).tipo==="consolidado";f(e.zona,r`${D("Estudiantes",`${a.paginacion.total} resultado(s)`)}
    <div class="mb-4 flex flex-wrap items-end gap-4">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        ${aa.map(o=>r`<button type="button" data-filtro="${o}" aria-pressed="${o===g.filtroEstudiantes}" class="${v(n.btnSecundario,n.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${o===""?"Todos":o}</button>`)}
      </div>
      ${t?r`<div id="zona-filtro-sede"></div>`:null}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table class="${n.tabla}">
        <caption class="sr-only">Listado de estudiantes</caption>
        <thead><tr><th scope="col" class="${n.th}">Estudiante</th><th scope="col" class="${n.th}">Nivel</th><th scope="col" class="${n.th}">Sede</th><th scope="col" class="${n.th}">Representante</th><th scope="col" class="${n.th}">Estado</th><th scope="col" class="${n.th}">Deuda vencida</th><th scope="col" class="${n.th}">Alertas WhatsApp</th></tr></thead>
        <tbody>${a.datos.length===0?r`<tr><td colspan="7" class="${n.td}">Sin resultados.</td></tr>`:a.datos.map(Ko)}</tbody>
      </table>
    </div>
    ${Na(a.paginacion)}`),t&&He({clave:ye,esValido:ya,cargar:()=>y.get("/sedes"),pintar:o=>Zo(e,o),vigente:e.vigente}).catch(()=>{});for(const o of C("[data-filtro]",HTMLButtonElement,e.zona))o.addEventListener("click",()=>{const i=o.dataset.filtro??"",s=aa.find(l=>l===i)??"";k({filtroEstudiantes:s,paginaEstudiantes:1}),I("estudiantes")});Oa(e.zona,o=>{k({paginaEstudiantes:Math.max(1,g.paginaEstudiantes+o)}),I("estudiantes")});for(const o of C("[data-detalle]",HTMLButtonElement,e.zona))o.addEventListener("click",()=>{const i=Number(o.dataset.detalle);Number.isInteger(i)&&i>0&&I(`estudiante:${i}`)});for(const o of C("[data-alerta]",HTMLButtonElement,e.zona))o.addEventListener("click",()=>{const i=o.dataset.alerta==="morosidad"?"morosidad":"preventiva";an(i,Number(o.dataset.id),o)})}async function an(e,a,t){try{const o=await P(t,()=>y.post(`/notificaciones/whatsapp/${e}/${a}`)),i=W({titulo:e==="morosidad"?"Alerta de morosidad":"Alerta preventiva",ancho:"lg",cuerpo:r`<p class="text-sm text-slate-600">${L(o.monto_usd)} · ${Ae(o.monto_bs)} · tasa BCV ${Qa(o.tasa_bcv)}</p>
        <pre class="mt-4 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">${o.mensaje}</pre>
        <div id="alerta-resultado" class="mt-4"></div>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <a href="${ia(o.enlace_whatsapp,["https://wa.me/"])}" target="_blank" rel="noopener noreferrer" class="${v(n.btnPrimario)}">Abrir en WhatsApp</a>
          <button type="button" id="alerta-enviar" class="${v(n.btnSecundario)}">Enviar por API</button>
        </div>`}),s=u("#alerta-enviar",HTMLButtonElement,i.dialogo);s.addEventListener("click",()=>{const l=u("#alerta-resultado",HTMLElement,i.dialogo);P(s,()=>y.post(`/notificaciones/whatsapp/${e}/${a}`,{},{consulta:{enviar:!0}})).then(()=>f(l,x("ok","Mensaje enviado por la API de WhatsApp."))).catch(p=>f(l,x("bad",T(p))))})}catch(o){o instanceof M?j("Tu sesión expiró. Inicia sesión de nuevo."):A("bad",T(o))}}async function tn(e,a){const t=Number(a);if(!Number.isInteger(t)||t<=0){f(e.zona,r`<div class="mx-auto max-w-2xl pt-8">${x("bad","El identificador del estudiante no es válido.")}</div>`);return}await wt({zona:e.zona,vigente:e.vigente,estudianteId:t,alVolver:()=>void I("estudiantes"),alSesionExpirada:()=>j("Tu sesión expiró. Inicia sesión de nuevo.")})}function on(e){const a=e.estado==="Por Validar";return r`<tr>
    <td class="${n.td} whitespace-nowrap">${O(e.declarado_en)}</td>
    <td class="${n.td}"><span class="font-medium text-slate-900">${e.estudiante}</span><br><span class="text-xs text-slate-600">${e.concepto} · vence ${J(e.fecha_vencimiento)}</span></td>
    <td class="${n.td}"><strong class="break-all">${e.referencia}</strong><br><span class="text-xs text-slate-600">${e.representante}</span></td>
    <td class="${n.td}">${G(e.metodo_pago)}</td>
    <td class="${n.td} whitespace-nowrap">${L(e.monto_usd)}<br><span class="text-xs text-slate-600">${Ae(e.monto_bs)}</span></td>
    <td class="${n.td}">${a?r`<div class="flex flex-wrap gap-2">
          <button type="button" data-aprobar="${e.id}" class="${v(n.btnOk,n.btnPeq)}">${h("check","h-4 w-4")}<span>Aprobar</span></button>
          <button type="button" data-rechazar="${e.id}" class="${v(n.btnPeligro,n.btnPeq)}">${h("x","h-4 w-4")}<span>Rechazar</span></button>
        </div>`:r`${ae(e.estado)}${e.nota_revision?r`<p class="mt-1 max-w-xs break-words text-xs text-slate-600">${e.nota_revision}</p>`:null}`}</td>
  </tr>`}async function nn(e){const a=await y.pagina("/facturacion/auditoria",{estado:g.filtroAuditoria,pagina:g.paginaAuditoria,limite:Sa});if(!e.vigente())return;const t=ee()?r`<button type="button" id="exportar" class="${v(n.btnSecundario)}">${h("down","h-4 w-4")}<span>Exportar histórico (.xlsx)</span></button>`:null;f(e.zona,r`${D("Bandeja de auditoría",`${a.paginacion.total} referencia(s) · ${g.filtroAuditoria}`,t)}
    <div id="auditoria-aviso" class="mb-4"></div>
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado de la referencia">
      ${ta.map(s=>r`<button type="button" data-filtro="${s}" aria-pressed="${s===g.filtroAuditoria}" class="${v(n.btnSecundario,n.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${s}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${n.tabla}">
        <caption class="sr-only">Referencias de pago declaradas</caption>
        <thead><tr><th scope="col" class="${n.th}">Declarada</th><th scope="col" class="${n.th}">Estudiante</th><th scope="col" class="${n.th}">Referencia</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Acción</th></tr></thead>
        <tbody>${a.datos.length===0?r`<tr><td colspan="6" class="${n.td}">Bandeja vacía.</td></tr>`:a.datos.map(on)}</tbody>
      </table>
    </div>
    ${Na(a.paginacion)}`);const o=u("#auditoria-aviso",HTMLElement,e.zona);for(const s of C("[data-filtro]",HTMLButtonElement,e.zona))s.addEventListener("click",()=>{const l=s.dataset.filtro??"",p=ta.find(d=>d===l)??"Por Validar";k({filtroAuditoria:p,paginaAuditoria:1}),I("auditoria")});Oa(e.zona,s=>{k({paginaAuditoria:Math.max(1,g.paginaAuditoria+s)}),I("auditoria")});const i=new Map(a.datos.map(s=>[s.id,s]));for(const s of C("[data-aprobar]",HTMLButtonElement,e.zona))s.addEventListener("click",()=>void rn(Number(s.dataset.aprobar),s,o));for(const s of C("[data-rechazar]",HTMLButtonElement,e.zona))s.addEventListener("click",()=>{const l=i.get(Number(s.dataset.rechazar));l&&ln(l)});z("#exportar",HTMLButtonElement,e.zona)?.addEventListener("click",s=>{const l=s.currentTarget instanceof HTMLButtonElement?s.currentTarget:null;l&&sn(l,"/exportaciones/facturacion.xlsx","facturacion.xlsx",o)})}async function sn(e,a,t,o){try{await P(e,()=>y.descargar(a,t))}catch(i){i instanceof M?j("Tu sesión expiró. Inicia sesión de nuevo."):f(o,x("bad",T(i)))}}function Da(e,a){return`${a} · estatus de pago del alumno: ${e.estatus_pago} · deuda vencida ${L(e.deuda_vencida_usd)}.`}async function rn(e,a,t){try{const o=await P(a,()=>y.post(`/facturacion/auditoria/${e}/aprobar`,{}));A("ok",Da(o,"Referencia aprobada")),await I("auditoria")}catch(o){o instanceof M?j("Tu sesión expiró. Inicia sesión de nuevo."):f(t,x("bad",T(o)))}}function ln(e){const a=W({titulo:"Rechazar referencia",cuerpo:r`<form id="form-rechazo" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700">Referencia <strong class="break-all">${e.referencia}</strong> · ${e.estudiante} · ${L(e.monto_usd)}</p>
      <div>
        <label for="nota-rechazo" class="${n.etiqueta}">Motivo del rechazo <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="nota-rechazo" name="nota" rows="4" maxlength="${fe}" required aria-describedby="nota-ayuda nota-error" class="${n.input}"></textarea>
        <p id="nota-ayuda" class="${n.ayuda}">Se guarda en el historial y se usa para avisar al representante. <span id="nota-contador">0/${fe}</span></p>
        <p id="nota-error" class="${n.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="rechazo-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${v(n.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${v(n.btnPeligro)}">${h("x","h-4 w-4")}<span>Rechazar referencia</span></button>
      </div>
    </form>`}),t=u("#form-rechazo",HTMLFormElement,a.dialogo),o=u("#nota-rechazo",HTMLTextAreaElement,a.dialogo),i=u("#nota-error",HTMLElement,a.dialogo),s=u("#nota-contador",HTMLElement,a.dialogo);o.addEventListener("input",()=>{s.textContent=`${o.value.length}/${fe}`,o.value.trim()!==""&&(i.hidden=!0,o.removeAttribute("aria-invalid"))}),u("[data-cancelar]",HTMLButtonElement,a.dialogo).addEventListener("click",a.cerrar),t.addEventListener("submit",l=>{l.preventDefault();const p=o.value.trim();if(p===""){i.textContent="Debes escribir el motivo del rechazo para continuar.",i.hidden=!1,o.setAttribute("aria-invalid","true"),o.focus();return}const d=u('button[type="submit"]',HTMLButtonElement,t);P(d,()=>y.post(`/facturacion/auditoria/${e.id}/rechazar`,{nota:p})).then(async c=>{a.cerrar(),A("ok",Da(c,"Referencia rechazada")),await I("auditoria")}).catch(c=>{if(c instanceof M){a.cerrar(),j("Tu sesión expiró. Inicia sesión de nuevo.");return}f(u("#rechazo-aviso",HTMLElement,a.dialogo),x("bad",T(c)))})}),o.focus()}function dn(e,a){const t=g.modulos.find(i=>i.codigo===a);if(!t){f(e.zona,x("bad","Módulo no encontrado."));return}if(t.codigo==="FACTURACION_MASIVA"){Dt({zona:e.zona,vigente:e.vigente,modulo:t,puedeGenerar:ee(),puedeProbar:t.prueba_utilizada===!1&&ve(),alcance:g.usuario?.sede_id??null,alActivarPrueba:()=>oa(t),alBloquear:i=>void Ba(e,i),alSesionExpirada:()=>j("Tu sesión expiró. Inicia sesión de nuevo.")});return}if(t.bloqueado){f(e.zona,da(t,t.prueba_utilizada===!1&&ve())),ca(e.zona,()=>oa(t));return}const o=t.en_prueba===!0&&t.expira_prueba_en?t.expira_prueba_en:null;f(e.zona,r`${D(t.nombre,t.descripcion)}
    <div class="${n.tarjeta} flex flex-col gap-4 p-6">
      ${o?x("warn",`Prueba gratuita vigente hasta el ${O(o)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba"):null}
      ${t.codigo==="MULTI_SEDE_PREMIUM"?r`${x("info","El Core Base incluye dos sedes (Sede Este y Sede Norte). Con este módulo puedes registrar la tercera sede y las siguientes desde la sección Sedes.","Expansión multi-sede habilitada")}
          ${ve()?r`<div><button type="button" id="ir-sedes" class="${v(n.btnPrimario,"min-h-10")}">${h("building","h-4 w-4")}<span>Ir a Sedes</span></button></div>`:null}`:x("info","El módulo está habilitado para esta academia. Su lógica se publicará en la Fase 2 (ruta reservada en el servidor).","Módulo habilitado")}
    </div>`),z("#ir-sedes",HTMLButtonElement,e.zona)?.addEventListener("click",()=>void I("sedes"))}const ve=()=>g.usuario?.rol==="admin"&&(g.usuario.sede_id??null)===null;function Ra(e){const a=z(`[data-nav="premium:${e.codigo}"]`,HTMLElement);if(!a)return;const t=document.createElement("div");f(t,Te({id:`premium:${e.codigo}`,titulo:e.nombre,icono:Ia[e.codigo]??"chat",tooltip:e.bloqueado?`${e.nombre} · ${e.tooltip??ge}`:e.nombre,bloqueado:e.bloqueado}));const o=t.firstElementChild;o&&a.replaceWith(o)}async function oa(e){await y.post("/premium/activar-prueba",{modulo:e.codigo});const a=await y.get("/premium/modulos");k({modulos:a});for(const t of a)Ra(t);A("ok","Prueba gratuita de 15 días activada."),await I(`premium:${e.codigo}`)}async function Ba(e,a){try{const t=await y.get("/premium/modulos");k({modulos:t});for(const o of t)Ra(o)}catch(t){if(t instanceof M){j("Tu sesión expiró. Inicia sesión de nuevo.");return}e.vigente()&&Fa(e.zona,a);return}e.vigente()&&await I(`premium:${a.modulo}`)}function Fa(e,a){const t=g.modulos.find(o=>o.codigo===a.modulo);f(e,la({nombre:a.nombre,descripcion:t?.descripcion??"Este módulo forma parte de la Fase 2 del sistema.",precio_usd:a.precio_usd}))}ja();
