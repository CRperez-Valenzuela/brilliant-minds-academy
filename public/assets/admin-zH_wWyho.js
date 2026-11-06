import{a as x,b as v,C as n,i as $,h as s,c as k,d as I,n as T,m as L,u as M,e as f,o as u,f as y,g as de,j as G,k as ee,l as W,p as ta,q,H as Fa,r as B,s as oa,t as Ua,v as V,w as Le,B as w,x as F,y as C,z as U,A as na,D as ce,E as Va,F as Ga,G as Wa,I as Ja}from"./ui-BomKO5NZ.js";const be="Módulo Premium Deshabilitado";function D(e,a,t=null){return s`<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><h1 class="${n.titulo}">${e}</h1><p class="${n.subtitulo}">${a}</p></div>
    ${t}
  </header>`}function Xa(){const e=s`<div class="flex items-center gap-4 border-b border-slate-100 py-4"><div class="h-8 w-8 rounded-full bg-slate-200"></div><div class="h-4 flex-1 rounded bg-slate-200"></div><div class="h-4 w-24 rounded bg-slate-200"></div></div>`;return s`<div aria-hidden="true" class="pointer-events-none select-none p-6">
    <div class="mb-4 h-6 w-1/3 rounded bg-slate-300"></div>${e}${e}${e}${e}${e}
  </div>`}function Ya(e){return s`<div data-candado class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 p-6 backdrop-blur-md">
    <div role="region" aria-label="${be}" class="${n.tarjetaCristal} w-full max-w-md p-8 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bma-purpura text-white">${$("lock","h-6 w-6")}</span>
      <h2 class="mt-4 text-lg font-bold text-slate-900">${be}</h2>
      <p class="mt-1 text-sm font-semibold text-slate-800">${e.nombre}</p>
      <p class="mt-2 text-sm text-slate-700">${e.descripcion}</p>
      <p class="mt-4 text-2xl font-bold text-slate-900">${M(e.precio_usd)}</p>
      <p class="mt-1 text-xs text-slate-600">Pago único · solicítalo a Astra Digital Solutions</p>
    </div>
  </div>`}function ia(e){return s`${D(e.nombre,e.descripcion)}
    <div class="${n.tarjeta} relative min-h-96 overflow-hidden">${Xa()}${Ya(e)}</div>`}function sa(e,a){return s`${ia(e)}${a?s`<div class="mt-6">${x("info",s`<p>Prueba este módulo sin costo durante 15 días. Al vencer se bloquea solo.</p>
        <button type="button" id="activar-prueba" class="${v(n.btnPrimario,"mt-3")}">${$("check","h-4 w-4")}<span>Activar prueba gratuita de 15 días</span></button>`,"Prueba gratuita disponible")}</div>`:null}`}function ra(e,a){const t=k("#activar-prueba",HTMLButtonElement,e);t?.addEventListener("click",()=>{I(t,a).catch(o=>T("bad",L(o)))})}const Y=300,Ka=["https://drive.google.com/","https://docs.google.com/"],re="Sin registrar",ke={FOTO_CARNET:"Foto carnet",CEDULA_IDENTIDAD:"Cédula de identidad",ACTA_NACIMIENTO:"Acta de nacimiento"},Za={MATRICULA:"Matrícula",MENSUALIDAD:"Mensualidad",OTRO:"Otro"};function Qa(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function la(e){if(e===null||e==="")return null;const a=oa(e,Ka);return a==="#"?null:a}const da=e=>e!==null&&e.trim()!==""?e:re;function E(e,a){const t=a instanceof Fa?a:da(a),o=a===null||typeof a=="string"&&a.trim()==="";return s`<div class="min-w-0"><dt class="text-xs font-semibold uppercase tracking-wide text-slate-600">${e}</dt>
    <dd class="mt-1 break-words text-sm ${o?"text-slate-600":"font-medium text-slate-900"}">${t}</dd></div>`}function ae(e,a,t){return s`<h2 id="${e}" class="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${$(t,"h-4 w-4")}</span>${a}</h2>`}function et(e){const a=ta(e.fecha_nacimiento,de());return s`<section class="${n.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-academico">
    ${ae("t-academico","Información académica","school")}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${E("Nivel",e.grado_solicitado)}
      ${E("Cédula de identidad",e.cedula_identidad)}
      ${E("Fecha de nacimiento",`${W(e.fecha_nacimiento)}${a!==null?` · ${a} años`:""}`)}
      ${E("Lugar de nacimiento",e.lugar_nacimiento)}
      ${E("Lugar de estudio",e.lugar_estudio)}
      ${E("Grado de estudio",e.ultimo_grado_aprobado)}
      ${E("Horario",e.horario_preferido)}
      ${e.colegio_procedencia!==null&&e.colegio_procedencia.trim()!==""?E("Colegio de procedencia",e.colegio_procedencia):null}
      ${E("Inscrito",q(e.creado_en))}
    </dl>
  </section>`}function at(e){const a=t=>t!==null&&t.trim()!==""?s`${B("Atención","warn")} <span class="ml-1">${t}</span>`:null;return s`<section class="${n.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-medico">
    ${ae("t-medico","Datos médicos","heart")}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${E("Tipo de sangre",e.tipo_sangre)}
      ${E("Alergias",a(e.alergias)??re)}
      ${E("Condiciones médicas",a(e.condiciones_medicas)??re)}
      ${E("Bajo tratamiento médico",e.bajo_tratamiento?a(e.tratamiento_explicacion??"Sí (sin explicación registrada)"):"No")}
      ${E("Medicamentos",e.medicamentos)}
      ${E("Contacto de emergencia",e.emergencia_nombre)}
      ${E("Teléfono de emergencia",e.emergencia_telefono)}
    </dl>
  </section>`}function tt(e){const a=la(e.drive_url);return s`<li class="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
    <span class="min-w-0"><span class="block truncate text-sm font-medium text-slate-900">${ke[e.tipo]}</span>
      <span class="block truncate text-xs text-slate-600">${e.nombre_archivo} · ${Qa(e.tamano_bytes)}</span></span>
    ${a!==null?s`<a href="${a}" target="_blank" rel="noopener noreferrer" class="${v(n.btnSecundario,n.btnPeq)}" aria-label="Abrir ${ke[e.tipo]} en Google Drive">Abrir</a>`:B("Sin enlace","neutral")}
  </li>`}function ot(e){const a=la(e.drive_folder_url);return s`<section class="${n.tarjeta} p-6" aria-labelledby="t-drive">
    ${ae("t-drive","Expediente en Google Drive","folder")}
    ${a!==null?s`<a href="${a}" target="_blank" rel="noopener noreferrer" class="${v(n.btnPrimario,"w-full")}">${$("folder","h-4 w-4")}<span>Abrir expediente digitalizado</span></a>`:x("info","Este estudiante aún no tiene una carpeta de expediente en Google Drive.")}
    ${e.drive_folder_id!==null?s`<p class="${n.ayuda}">ID de carpeta: <span class="break-all font-mono">${e.drive_folder_id}</span></p>`:null}
    ${e.documentos.length>0?s`<ul class="mt-4" aria-label="Documentos digitalizados">${e.documentos.map(tt)}</ul>`:s`<p class="mt-4 text-sm text-slate-600">Sin documentos digitalizados.</p>`}
  </section>`}function nt(e){return s`<section class="${n.tarjeta} p-6" aria-labelledby="t-representante">
    ${ae("t-representante","Representante principal","users")}
    <dl class="grid gap-4">
      ${E("Nombre",`${e.rep_nombres} ${e.rep_apellidos}`)}
      ${E("Cédula",e.rep_cedula)}
      ${E("Correo",e.rep_email)}
      ${E("Teléfono (WhatsApp de cobro)",e.rep_telefono)}
    </dl>
  </section>`}const Oe={madre:"Madre",padre:"Padre"};function ca(e,a,t){return e[`${a}_${t}`]}const it=e=>e===null||String(e).trim()===""?null:String(e);function st(e,a){const t=ca(e,a,"cedula");return typeof t=="string"&&t.trim()!==""&&t.trim().toUpperCase()===e.rep_cedula.trim().toUpperCase()}function je(e,a){const t=d=>it(ca(e,a,d)),o=["nombres","apellidos","cedula","edad","fecha_nacimiento","direccion","telefono_fijo","telefono_movil","email"].some(d=>t(d)!==null),i=[t("nombres"),t("apellidos")].filter(d=>d!==null).join(" "),r=t("fecha_nacimiento"),l=r!==null?ta(r,de()):null,p=r!==null?`${W(r)}${l!==null?` · ${l} años`:""}`:t("edad")!==null?`${t("edad")} años`:null;return s`<article class="min-w-0 rounded-lg border border-slate-200 p-4" aria-label="${Oe[a]}">
    <h3 class="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">${Oe[a]}${st(e,a)?B("Representante principal","info"):null}</h3>
    ${o?s`<dl class="grid gap-3">
          ${E("Nombre",i)}
          ${E("Cédula",t("cedula"))}
          ${E("Nacimiento",p)}
          ${E("Dirección de habitación",t("direccion"))}
          ${E("Teléfono fijo",t("telefono_fijo"))}
          ${E("Teléfono móvil",t("telefono_movil"))}
          ${E("Correo",t("email"))}
        </dl>`:s`<p class="text-sm text-slate-600">No se registró en la planilla.</p>`}
  </article>`}function rt(e){return s`<li class="border-b border-slate-100 py-2 last:border-0">
    <span class="block text-sm font-medium text-slate-900">${e.nombre}</span>
    <span class="block text-xs text-slate-600">${e.parentesco} · ${e.telefono!==""?`+${e.telefono}`:re}</span>
  </li>`}function lt(e){return s`<article class="min-w-0 rounded-lg border border-slate-200 p-4" aria-label="Personas autorizadas para retirar al menor">
    <h3 class="mb-3 text-sm font-bold text-slate-900">Personas autorizadas para retirar al menor</h3>
    ${e.personas_autorizadas.length>0?s`<ul>${e.personas_autorizadas.map(rt)}</ul>`:s`<p class="text-sm text-slate-600">Sin personas autorizadas registradas.</p>`}
  </article>`}function dt(e){return s`<section class="${n.tarjeta} p-6 lg:col-span-3" aria-labelledby="t-familia">
    ${ae("t-familia","Familia y autorizados (planilla oficial)","users")}
    <div class="grid gap-4 md:grid-cols-3">
      ${je(e,"madre")}
      ${je(e,"padre")}
      ${lt(e)}
    </div>
  </section>`}function ct(e){const a=e.estado==="Pendiente"||e.estado==="En Revisión";return s`<tr>
    <td class="${n.td}"><span class="font-medium text-slate-900">${e.concepto}</span></td>
    <td class="${n.td}">${Za[e.tipo]}</td>
    <td class="${n.td} whitespace-nowrap">${W(e.fecha_vencimiento)}${a&&Ua(e.fecha_vencimiento)?s` ${B("Vencida","bad")}`:null}</td>
    <td class="${n.td} whitespace-nowrap">${M(e.monto_usd)}</td>
    <td class="${n.td}">${ee(e.estado)}</td>
  </tr>`}function ut(e,a){const t=a.get(e.cuota_id);return s`<tr>
    <td class="${n.td}"><span class="break-all font-medium text-slate-900">${e.referencia}</span>${t!==void 0?s`<span class="block text-xs text-slate-600">${t}</span>`:null}</td>
    <td class="${n.td}">${V(e.metodo_pago)}</td>
    <td class="${n.td} whitespace-nowrap">${q(e.declarado_en)}</td>
    <td class="${n.td} whitespace-nowrap">${M(e.monto_usd)}<span class="block text-xs text-slate-600">${Le(e.monto_bs)}</span></td>
    <td class="${n.td}">${ee(e.estado)}</td>
  </tr>`}function pt(e){return s`<section class="${n.tarjeta} overflow-hidden" aria-labelledby="t-cuotas">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-cuotas" class="text-base font-bold text-slate-900">Histórico de cuotas</h2>
      <span class="text-xs text-slate-600">${e.cuotas.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${n.tabla}">
        <caption class="sr-only">Histórico de cuotas del estudiante</caption>
        <thead><tr><th scope="col" class="${n.th}">Concepto</th><th scope="col" class="${n.th}">Tipo</th><th scope="col" class="${n.th}">Vencimiento</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Estado</th></tr></thead>
        <tbody>${e.cuotas.length===0?s`<tr><td colspan="5" class="${n.td}">Este estudiante no tiene cuotas.</td></tr>`:e.cuotas.map(ct)}</tbody>
      </table>
    </div>
  </section>`}function mt(e){const a=new Map(e.cuotas.map(t=>[t.id,t.concepto]));return s`<section class="${n.tarjeta} overflow-hidden" aria-labelledby="t-pagos">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-pagos" class="text-base font-bold text-slate-900">Pagos declarados por el representante</h2>
      <span class="text-xs text-slate-600">${e.pagos.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${n.tabla}">
        <caption class="sr-only">Pagos declarados por el representante</caption>
        <thead><tr><th scope="col" class="${n.th}">Referencia</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Declarado</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Estado</th></tr></thead>
        <tbody>${e.pagos.length===0?s`<tr><td colspan="5" class="${n.td}">El representante aún no ha declarado pagos.</td></tr>`:e.pagos.map(t=>ut(t,a))}</tbody>
      </table>
    </div>
  </section>`}function ft(e){const a=e.estatus_academico==="Fuera de la Academia";return s`<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <button type="button" data-accion="volver" class="${v(n.btnSecundario,n.btnPeq,"mb-3")}">${$("back","h-4 w-4")}<span>Volver al listado</span></button>
      <h1 id="ficha-titulo" tabindex="-1" class="${n.titulo} break-words">${e.apellidos}, ${e.nombres}</h1>
      <p class="${n.subtitulo} flex flex-wrap items-center gap-2">${ee(e.estado_dinamico)}<span>${e.grado_solicitado}</span>
        ${e.deuda_vencida_usd>0?s`<span class="font-semibold text-bma-coral-oscuro">Deuda vencida: ${M(e.deuda_vencida_usd)}</span>`:null}</p>
    </div>
    <div class="flex flex-wrap gap-2" role="group" aria-label="Acciones sobre el estudiante">
      ${a?s`<button type="button" data-accion="reactivar" class="${v(n.btnOk)}">${$("refresh","h-4 w-4")}<span>Reactivar Estudiante</span></button>`:s`<button type="button" data-accion="retirar" class="${v(n.btnPeligro)}">${$("logout","h-4 w-4")}<span>Retirar Estudiante</span></button>`}
    </div>
  </header>
  ${a?s`<div class="mb-6">${x("warn",s`<p>Retirado el <strong>${e.fecha_retiro!==null?W(e.fecha_retiro):"fecha no registrada"}</strong>.</p>
        <p class="mt-1">Motivo: ${da(e.motivo_retiro)}</p>
        <p class="mt-1">Sus cuotas pendientes fueron anuladas al retirarlo; reactivarlo no las restaura.</p>`,"Fuera de la Academia")}</div>`:null}`}function bt(e){return s`<div id="ficha-raiz">
    ${ft(e)}
    <div class="grid gap-6 lg:grid-cols-3">
      ${et(e)}
      ${nt(e)}
      ${at(e)}
      ${ot(e)}
      ${dt(e)}
    </div>
    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      ${pt(e)}
      ${mt(e)}
    </div>
  </div>`}function qe(e,a,t){const o={},i=e.trim();return i===""?o.motivo="Debes escribir el motivo del retiro para continuar.":i.length>Y&&(o.motivo=`El motivo admite hasta ${Y} caracteres.`),/^\d{4}-\d{2}-\d{2}$/.test(a)?a>t&&(o.fecha="La fecha de retiro no puede ser futura."):o.fecha="Elige la fecha del retiro.",o}function te(e,a,t){if(t===void 0){a.hidden=!0,e.removeAttribute("aria-invalid");return}a.textContent=t,a.hidden=!1,e.setAttribute("aria-invalid","true")}function vt(e,a){const t=de(),o=G({titulo:"Retirar estudiante",cuerpo:s`<form id="form-retiro" novalidate class="flex flex-col gap-4">
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
        <button type="submit" class="${v(n.btnPeligro)}">${$("logout","h-4 w-4")}<span>Retirar estudiante</span></button>
      </div>
    </form>`}),i=u("#form-retiro",HTMLFormElement,o.dialogo),r=u("#retiro-motivo",HTMLTextAreaElement,o.dialogo),l=u("#retiro-fecha",HTMLInputElement,o.dialogo),p=u("#retiro-motivo-error",HTMLElement,o.dialogo),d=u("#retiro-fecha-error",HTMLElement,o.dialogo),c=u("#retiro-contador",HTMLElement,o.dialogo);r.addEventListener("input",()=>{c.textContent=`${r.value.length}/${Y}`,r.value.trim()!==""&&te(r,p,void 0)}),l.addEventListener("input",()=>te(l,d,qe(r.value,l.value,t).fecha)),u("[data-cancelar]",HTMLButtonElement,o.dialogo).addEventListener("click",o.cerrar),i.addEventListener("submit",b=>{b.preventDefault();const h=qe(r.value,l.value,t);te(r,p,h.motivo),te(l,d,h.fecha),h.motivo!==void 0?r.focus():h.fecha!==void 0&&l.focus(),!(h.motivo!==void 0||h.fecha!==void 0)&&a(o,{motivo:r.value.trim(),fecha_retiro:l.value},u('button[type="submit"]',HTMLButtonElement,i))}),r.focus()}function gt(e,a){const t=G({titulo:"Reactivar estudiante",cuerpo:s`<div class="flex flex-col gap-4">
      <p class="text-sm text-slate-700"><strong>${e.apellidos}, ${e.nombres}</strong> volverá a «Activo». Las cuotas que se anularon al retirarlo no se restauran: genera las que correspondan desde Facturación.</p>
      <div id="reactivar-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${v(n.btnSecundario)}">Cancelar</button>
        <button type="button" data-confirmar class="${v(n.btnOk)}">${$("check","h-4 w-4")}<span>Reactivar estudiante</span></button>
      </div>
    </div>`});u("[data-cancelar]",HTMLButtonElement,t.dialogo).addEventListener("click",t.cerrar);const o=u("[data-confirmar]",HTMLButtonElement,t.dialogo);o.addEventListener("click",()=>a(t,o)),o.focus()}async function $t(e){const a=()=>y.get(`/estudiantes/${e.estudianteId}`);let t=await a();if(!e.vigente())return;f(e.zona,s`<div id="ficha-contenedor"></div>`);const o=u("#ficha-contenedor",HTMLElement,e.zona),i=()=>{f(o,bt(t)),k("#ficha-titulo",HTMLElement,o)?.focus({preventScroll:!0})},r=async()=>{try{t=await a()}catch(c){c instanceof w?e.alSesionExpirada():T("bad",`La acción se realizó, pero no se pudo actualizar la ficha: ${L(c)}`);return}e.vigente()&&i()},l=(c,b,h)=>{if(c instanceof w){b.cerrar(),e.alSesionExpirada();return}f(u(h,HTMLElement,b.dialogo),x("bad",L(c)))},p=(c,b,h)=>{I(h,()=>y.post(`/estudiantes/${e.estudianteId}/retirar`,b)).then(async()=>{c.cerrar(),T("ok",`${t.nombres} ${t.apellidos} fue retirado de la academia.`),await r()}).catch(A=>l(A,c,"#retiro-aviso"))},d=(c,b)=>{I(b,()=>y.post(`/estudiantes/${e.estudianteId}/reactivar`)).then(async()=>{c.cerrar(),T("ok",`${t.nombres} ${t.apellidos} fue reactivado.`),await r()}).catch(h=>l(h,c,"#reactivar-aviso"))};o.addEventListener("click",c=>{const b=c.target instanceof Element?c.target.closest("[data-accion]"):null;if(!(b instanceof HTMLButtonElement))return;const h=b.dataset.accion;h==="volver"?e.alVolver():h==="retirar"?vt(t,p):h==="reactivar"&&gt(t,d)}),i()}const R=(e,a)=>e[a]??"",ve=/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/,De=/^(?:\d{6,20}|[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,})$/,ht=/^Banco (\d{4}) · Tel (0\d{10}) · Cédula\/RIF ([VEJGP]\d{5,10})$/,Ne=(e,a,t)=>({id:e,etiqueta:a,tipo:"email",inputmode:"email",placeholder:"pagos@academia.com",ayuda:t,error:"Escribe un correo válido, por ejemplo pagos@academia.com.",patron:ve,normalizar:o=>o.trim().toLowerCase()}),Te={ZELLE:{campos:[Ne("correo","Correo de Zelle","Correo con el que la academia recibe pagos por Zelle.")],componer:e=>R(e,"correo"),interpretar:e=>ve.test(e)?{correo:e}:null},PAYPAL:{campos:[Ne("correo","Correo de PayPal","Cuenta de PayPal que recibe los pagos.")],componer:e=>R(e,"correo"),interpretar:e=>ve.test(e)?{correo:e}:null},BINANCE:{campos:[{id:"idBinance",etiqueta:"Pay ID o correo de Binance",tipo:"text",inputmode:"text",placeholder:"123456789",ayuda:"Pay ID numérico (6 a 20 dígitos) o el correo de la cuenta Binance.",error:"Escribe un Pay ID numérico de 6 a 20 dígitos o un correo válido.",patron:De,normalizar:e=>e.trim().toLowerCase()}],componer:e=>R(e,"idBinance"),interpretar:e=>De.test(e)?{idBinance:e}:null},PAGO_MOVIL:{campos:[{id:"banco",etiqueta:"Código del banco",tipo:"text",inputmode:"numeric",placeholder:"0102",ayuda:"Cuatro dígitos (0102 = Banco de Venezuela, 0105 = Mercantil…).",error:"El código del banco son exactamente 4 dígitos.",patron:/^\d{4}$/,normalizar:e=>e.trim()},{id:"telefono",etiqueta:"Teléfono afiliado",tipo:"text",inputmode:"tel",placeholder:"04141234567",ayuda:"11 dígitos, empezando por 0 (sin espacios ni guiones).",error:"Escribe 11 dígitos empezando por 0, por ejemplo 04141234567.",patron:/^0\d{10}$/,normalizar:e=>e.replace(/[\s.-]/g,"")},{id:"documento",etiqueta:"Cédula o RIF del titular",tipo:"text",inputmode:"text",placeholder:"V12345678",ayuda:"Letra (V, E, J, G o P) seguida de 5 a 10 dígitos.",error:"Escribe la letra (V, E, J, G o P) y de 5 a 10 dígitos, por ejemplo V12345678.",patron:/^[VEJGP]\d{5,10}$/,normalizar:e=>e.replace(/[\s.-]/g,"").toUpperCase()}],componer:e=>`Banco ${R(e,"banco")} · Tel ${R(e,"telefono")} · Cédula/RIF ${R(e,"documento")}`,interpretar:e=>{const a=ht.exec(e);return a?{banco:a[1]??"",telefono:a[2]??"",documento:a[3]??""}:null}}},Ae=["ZELLE","BINANCE","PAYPAL","PAGO_MOVIL"],ge=150,ua=99999999,pa=e=>Ae.some(a=>a===e);function xt(e,a){const t={},o=e.titular.trim();o===""?t.titular="El titular es obligatorio.":o.length>ge&&(t.titular=`Máximo ${ge} caracteres.`);let i=null;if(e.ambito==="")t.ambito="Elige a qué sede aplica la cuenta o márcala como común a todas.";else if(e.ambito!=="comun"){const d=Number(e.ambito);Number.isInteger(d)&&a.some(c=>c.id===d)?i=d:t.ambito="La sede elegida no existe. Recarga la página."}const r=e.metodo;if(!pa(r))return t.metodo="Elige un método de pago.",{errores:t,cuerpo:null};const l=Te[r],p={};for(const d of l.campos){const c=d.normalizar(R(e.campos,d.id));p[d.id]=c,d.patron.test(c)||(t[`campo_${d.id}`]=d.error)}return Object.keys(t).length>0?{errores:t,cuerpo:null}:{errores:t,cuerpo:{metodo:r,titular:o,detalle:l.componer(p),activa:e.activa,sede_id:i}}}function ma(e){const a=e.trim().replace(",",".");if(!/^\d+(?:\.\d{1,2})?$/.test(a))return null;const t=Number(a);return Number.isFinite(t)&&t>0&&t<=ua?t:null}const yt=e=>e?.rol==="admin"&&(e.sede_id??null)===null;async function Re(){const[e,a]=await Promise.all([y.get("/configuracion"),y.get("/sedes")]);return{matricula_usd:e.matricula_usd,cuentas:e.cuentas,sedes:a}}const fa=(e,a)=>{if(e===null)return"Común (todas las sedes)";const t=a.find(o=>o.id===e);return t?t.nombre:`Sede #${e}`};function Et(e,a){const t=o=>`${o.sede_id===null?"0":"1"}|${fa(o.sede_id,a)}|${Ae.indexOf(o.metodo)}|${String(o.id).padStart(10,"0")}`;return[...e].sort((o,i)=>t(o).localeCompare(t(i),"es"))}const ne=(e,a)=>{const t=e.get(a);return typeof t=="string"?t:""};function K(e,a){for(const t of C("[data-error]",HTMLElement,e)){const o=a[t.dataset.error??""]??"";t.textContent=o,t.hidden=o===""}for(const t of C("[name]",HTMLElement,e))(a[t.getAttribute("name")??""]??"")!==""?t.setAttribute("aria-invalid","true"):t.removeAttribute("aria-invalid");k('[aria-invalid="true"]',HTMLElement,e)?.focus()}function ba(e){const a={titular:"titular",sede_id:"ambito",metodo:"metodo",detalle:"general",matricula_usd:"matricula_usd"},t={};for(const o of e.camposInvalidos())t[a[o.campo]??"general"]=o.mensaje;return Object.keys(t).length===0&&(t.general=e.message),t}function wt(e,a){if(e.length===0)return x("warn","Todavía no hay cuentas de cobro. Mientras no exista ninguna activa, las familias verán «Consulta los datos de pago con la administración».");const t=Et(e,a).map(o=>s`<tr>
      <td class="${n.td}">${fa(o.sede_id,a)}</td>
      <td class="${n.td} font-semibold">${V(o.metodo)}</td>
      <td class="${n.td}">${o.titular}</td>
      <td class="${n.td} break-words">${o.detalle}</td>
      <td class="${n.td}">${o.activa?B("Activa","ok"):B("Inactiva","neutral")}</td>
      <td class="${n.td}">
        <div class="flex flex-wrap gap-2">
          <button type="button" data-accion="editar" data-id="${o.id}" class="${v(n.btnSecundario,n.btnPeq)}" aria-label="Editar la cuenta de ${V(o.metodo)} de ${o.titular}">Editar</button>
          <button type="button" data-accion="alternar" data-id="${o.id}" class="${v(n.btnSecundario,n.btnPeq)}" aria-label="${o.activa?"Desactivar":"Activar"} la cuenta de ${V(o.metodo)} de ${o.titular}">${o.activa?"Desactivar":"Activar"}</button>
        </div>
      </td>
    </tr>`);return s`<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/95">
    <table class="${n.tabla}">
      <caption class="sr-only">Cuentas de cobro de la academia</caption>
      <thead><tr>
        <th scope="col" class="${n.th}">Ámbito</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Titular</th>
        <th scope="col" class="${n.th}">Datos públicos</th><th scope="col" class="${n.th}">Estado</th><th scope="col" class="${n.th}">Acciones</th>
      </tr></thead>
      <tbody>${t}</tbody>
    </table>
  </div>`}function _t(e){const a=e.matricula_usd<=0;return s`<div id="config-raiz">
    <header class="mb-6">
      <h1 class="${n.titulo}">Configuración de cobro</h1>
      <p class="${n.subtitulo}">Costo de la matrícula y cuentas donde las familias depositan.</p>
    </header>

    <section class="${n.tarjeta} mb-6 p-6" aria-labelledby="t-matricula">
      <h2 id="t-matricula" class="text-base font-bold text-slate-900">Costo de la matrícula</h2>
      <p class="${n.ayuda}">Monto único en dólares para todas las sedes. Se muestra en el formulario público de admisiones junto a su equivalente en bolívares a la tasa BCV.</p>
      <div class="mt-4">${a?x("warn","La matrícula aún no está configurada: las inscripciones públicas permanecen bloqueadas hasta que fijes un monto."):x("info",s`Matrícula vigente: <strong>${M(e.matricula_usd)}</strong>.`)}</div>
      <form id="form-matricula" novalidate class="mt-4 grid gap-4 sm:grid-cols-3 sm:items-start">
        <div class="sm:col-span-1">
          <label for="f-matricula" class="${n.etiqueta}">Monto en USD</label>
          <input id="f-matricula" name="matricula_usd" type="text" inputmode="decimal" autocomplete="off" required placeholder="120.00"
            value="${a?"":e.matricula_usd.toFixed(2)}" class="${n.input}" aria-describedby="ay-matricula er-matricula">
          <p id="ay-matricula" class="${n.ayuda}">Hasta dos decimales. Ejemplo: 120.00</p>
          <p id="er-matricula" data-error="matricula_usd" class="${n.errorCampo}" hidden></p>
        </div>
        <div class="flex items-end sm:col-span-2 sm:pt-6">
          <button type="submit" class="${v(n.btnPrimario)}">${$("check","h-4 w-4")}<span>Guardar matrícula</span></button>
        </div>
      </form>
    </section>

    <section class="${n.tarjeta} p-6" aria-labelledby="t-cuentas">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 id="t-cuentas" class="text-base font-bold text-slate-900">Cuentas de cobro</h2>
          <p class="${n.ayuda}">Datos públicos de Zelle, Binance Pay, PayPal y Pago Móvil. Nunca registres contraseñas ni claves aquí: esta información se muestra a las familias.</p>
        </div>
        <button type="button" data-accion="nueva" class="${v(n.btnPrimario)}">${$("wallet","h-4 w-4")}<span>Agregar cuenta</span></button>
      </div>
      ${wt(e.cuentas,e.sedes)}
      <div class="mt-4">${x("info","Una familia ve las cuentas activas comunes más las de su sede. Si entra sin enlace de invitación, solo ve las comunes.")}</div>
    </section>
  </div>`}async function Mt(e){if(!yt(e.usuario)){f(e.zona,s`<div class="mx-auto max-w-2xl pt-8">${x("info","La configuración de cobro es del acceso consolidado (administrador sin sede asignada). Pídele a esa persona que actualice la matrícula o las cuentas.","Sección restringida")}</div>`);return}const a=await Re();if(!e.vigente())return;let t=a;const o=()=>{f(e.zona,_t(t)),r()},i=async()=>{t=await Re(),e.vigente()&&o()},r=()=>{const l=u("#config-raiz",HTMLElement,e.zona);u("#form-matricula",HTMLFormElement,l).addEventListener("submit",p=>{p.preventDefault(),Lt(u("#form-matricula",HTMLFormElement,l),d=>{t={...t,matricula_usd:d},o()})}),l.addEventListener("click",p=>{const d=p.target instanceof Element?p.target.closest("[data-accion]"):null;if(!(d instanceof HTMLButtonElement))return;const c=d.dataset.accion,b=t.cuentas.find(h=>h.id===Number(d.dataset.id));c==="nueva"?Be(null,t.sedes,i):c==="editar"&&b?Be(b,t.sedes,i):c==="alternar"&&b&&Tt(d,b,i)})};o()}async function Lt(e,a){const t=ma(ne(new FormData(e),"matricula_usd"));if(t===null){K(e,{matricula_usd:`Escribe un monto mayor que 0 y hasta ${ua.toLocaleString("en-US")}, con máximo 2 decimales.`});return}K(e,{});try{const o=await I(u('button[type="submit"]',HTMLButtonElement,e),()=>y.put("/configuracion/matricula",{matricula_usd:t}));T("ok",`Matrícula actualizada a ${M(o.matricula_usd)}.`),a(o.matricula_usd)}catch(o){if(o instanceof w){window.location.reload();return}K(e,o instanceof F?ba(o):{matricula_usd:L(o)})}}async function Tt(e,a,t){const o={metodo:a.metodo,titular:a.titular,detalle:a.detalle,activa:!a.activa,sede_id:a.sede_id};try{await I(e,()=>y.put(`/configuracion/cuentas/${a.id}`,o)),T("ok",o.activa?"Cuenta activada: ya la ven las familias.":"Cuenta desactivada: las familias ya no la ven."),await t()}catch(i){if(i instanceof w){window.location.reload();return}T("bad",L(i))}}function va(e,a){return pa(e)?s`${Te[e].campos.map(t=>s`<div>
      <label for="f-campo_${t.id}" class="${n.etiqueta}">${t.etiqueta}</label>
      <input id="f-campo_${t.id}" name="campo_${t.id}" type="${t.tipo}" inputmode="${t.inputmode}" autocomplete="off" required
        placeholder="${t.placeholder}" value="${R(a,t.id)}" class="${n.input}" aria-describedby="ay-${t.id} er-${t.id}">
      <p id="ay-${t.id}" class="${n.ayuda}">${t.ayuda}</p>
      <p id="er-${t.id}" data-error="campo_${t.id}" class="${n.errorCampo}" hidden></p>
    </div>`)}`:s`<p class="${n.ayuda}">Elige un método para ver los datos que se piden.</p>`}function At(e,a,t,o){const i=e?.metodo??"",r=e===null?"":e.sede_id===null?"comun":String(e.sede_id);return s`<form id="form-cuenta" novalidate class="grid gap-4">
    <div data-error="general" hidden></div>
    ${o===null?null:x("warn",s`El dato guardado no sigue el formato estructurado: <span class="font-semibold">${o}</span>. Complétalo con los campos de abajo para reemplazarlo.`,"Datos anteriores")}
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="f-metodo" class="${n.etiqueta}">Método de pago</label>
        <select id="f-metodo" name="metodo" required class="${n.input}" aria-describedby="er-metodo">
          <option value="" ${i===""?"selected":""} disabled>Selecciona un método…</option>
          ${Ae.map(l=>s`<option value="${l}" ${l===i?"selected":""}>${V(l)}</option>`)}
        </select>
        <p id="er-metodo" data-error="metodo" class="${n.errorCampo}" hidden></p>
      </div>
      <div>
        <label for="f-ambito" class="${n.etiqueta}">Sede a la que aplica</label>
        <select id="f-ambito" name="ambito" required class="${n.input}" aria-describedby="ay-ambito er-ambito">
          <option value="" ${r===""?"selected":""} disabled>Selecciona el ámbito…</option>
          <option value="comun" ${r==="comun"?"selected":""}>Común (todas las sedes)</option>
          ${a.map(l=>s`<option value="${l.id}" ${String(l.id)===r?"selected":""}>${l.nombre}${l.activa?"":" (inactiva)"}</option>`)}
        </select>
        <p id="ay-ambito" class="${n.ayuda}">Las cuentas de una sede solo las ven las familias de esa sede.</p>
        <p id="er-ambito" data-error="ambito" class="${n.errorCampo}" hidden></p>
      </div>
    </div>
    <div>
      <label for="f-titular" class="${n.etiqueta}">Titular de la cuenta</label>
      <input id="f-titular" name="titular" type="text" maxlength="${ge}" autocomplete="off" required value="${e?.titular??""}"
        class="${n.input}" aria-describedby="er-titular">
      <p id="er-titular" data-error="titular" class="${n.errorCampo}" hidden></p>
    </div>
    <div id="campos-metodo" class="grid gap-4" aria-live="polite">${va(i,t)}</div>
    <label class="flex items-center gap-3 text-sm font-medium text-slate-800">
      <input type="checkbox" name="activa" ${e===null||e.activa?"checked":""} class="h-4 w-4 rounded border-slate-300">
      <span>Cuenta activa (visible para las familias)</span>
    </label>
    <div class="flex flex-wrap justify-end gap-3">
      <button type="button" data-cancelar class="${v(n.btnSecundario)}">Cancelar</button>
      <button type="submit" class="${v(n.btnPrimario)}">${$("check","h-4 w-4")}<span>${e===null?"Agregar cuenta":"Guardar cambios"}</span></button>
    </div>
  </form>`}function Ct(e){const a=new FormData(e),t={};for(const[o,i]of a.entries())o.startsWith("campo_")&&typeof i=="string"&&(t[o.slice(6)]=i);return{metodo:ne(a,"metodo"),titular:ne(a,"titular"),ambito:ne(a,"ambito"),activa:a.get("activa")!==null,campos:t}}function Be(e,a,t){const o=e?Te[e.metodo].interpretar(e.detalle):null,i=e!==null&&o===null?e.detalle:null,r=G({titulo:e===null?"Agregar cuenta de cobro":"Editar cuenta de cobro",ancho:"lg",cuerpo:At(e,a,o??{},i)}),l=u("#form-cuenta",HTMLFormElement,r.dialogo);u("#f-metodo",HTMLSelectElement,l).addEventListener("change",p=>{const d=p.target instanceof HTMLSelectElement?p.target.value:"";f(u("#campos-metodo",HTMLElement,l),va(d,e!==null&&e.metodo===d&&o?o:{}))}),u("[data-cancelar]",HTMLButtonElement,l).addEventListener("click",()=>r.cerrar()),l.addEventListener("submit",p=>{p.preventDefault(),St(l,e,a,r,t)}),u("#f-metodo",HTMLSelectElement,l).focus()}async function St(e,a,t,o,i){const r=xt(Ct(e),t);K(e,r.errores);const l=u('[data-error="general"]',HTMLElement,e);if(l.hidden=!0,r.cuerpo===null)return;const p=r.cuerpo;try{await I(u('button[type="submit"]',HTMLButtonElement,e),()=>a===null?y.post("/configuracion/cuentas",p):y.put(`/configuracion/cuentas/${a.id}`,p)),o.cerrar(),T("ok",a===null?"Cuenta agregada.":"Cuenta actualizada."),await i()}catch(d){if(d instanceof w){window.location.reload();return}const c=d instanceof F?ba(d):{general:L(d)},b=c.general;K(e,{...c,general:""}),b&&(l.hidden=!1,f(l,x("bad",b)))}}const $e=150;function Fe(e,a){const t={},o=e.concepto.trim();o===""?t.concepto="Escribe el concepto, por ejemplo «Mensualidad Noviembre 2026».":o.length>$e&&(t.concepto=`El concepto admite hasta ${$e} caracteres.`);const i=ma(e.monto);return i===null&&(t.monto_usd="Escribe un monto en USD mayor que 0, con máximo 2 decimales (por ejemplo 85.00)."),It(e.vencimiento)?e.vencimiento<a&&(t.fecha_vencimiento="El vencimiento no puede ser anterior a hoy: todos los alumnos quedarían morosos de inmediato."):t.fecha_vencimiento="Elige la fecha de vencimiento.",Object.keys(t).length>0||i===null?{errores:t,cuerpo:null}:{errores:t,cuerpo:{concepto:o,monto_usd:i,fecha_vencimiento:e.vencimiento}}}function It(e){const a=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!a)return!1;const[t,o,i]=[Number(a[1]),Number(a[2]),Number(a[3])],r=new Date(Date.UTC(t,o-1,i));return r.getUTCFullYear()===t&&r.getUTCMonth()===o-1&&r.getUTCDate()===i}function Ht(e,a){return e<=0?{tono:"inf",texto:`No se creó ninguna cuota nueva: todos los estudiantes activos ya tenían «${a}».`}:{tono:"okk",texto:`Se crearon ${e} ${e===1?"cuota":"cuotas"} de «${a}».`}}function ga(e){return e===null?"todas las sedes":"tu sede"}function zt(e,a){const t=e.modulo.en_prueba===!0&&e.modulo.expira_prueba_en?e.modulo.expira_prueba_en:null;return s`${D(e.modulo.nombre,"Genera la mensualidad de todos los estudiantes activos en un solo paso.")}
    ${t?s`<div class="mb-6">${x("warn",`Prueba gratuita vigente hasta el ${q(t)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba")}</div>`:null}
    ${e.puedeGenerar?s`<section class="${n.tarjetaCristal} max-w-2xl p-6" aria-labelledby="t-masiva">
          <h2 id="t-masiva" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${$("receipt","h-5 w-5")}Nueva facturación mensual</h2>
          <p class="${n.ayuda} mb-4">Se aplica a los estudiantes «Activo» de ${ga(e.alcance)}. Repetir el mismo concepto no duplica cuotas.</p>
          <form id="form-masiva" novalidate class="flex flex-col gap-4" aria-label="Generar mensualidades">
            <div>
              <label for="f-concepto" class="${n.etiqueta}">Concepto <span class="text-red-800" aria-hidden="true">*</span></label>
              <input id="f-concepto" name="concepto" type="text" maxlength="${$e}" required autocomplete="off" placeholder="Mensualidad Noviembre 2026" aria-describedby="e-concepto" class="${n.input}">
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
              <button type="submit" class="${v(n.btnPrimario)}">${$("receipt","h-4 w-4")}<span>Generar</span></button>
            </div>
          </form>
        </section>`:s`<div class="max-w-2xl">${x("info","La generación masiva de mensualidades es una función del administrador. Pídele a esa persona que la ejecute.","Sección restringida")}</div>`}`}function Ue(e,a){for(const t of C("[data-error]",HTMLElement,e)){const o=a[t.dataset.error??""]??"";t.textContent=o,t.hidden=o===""}for(const t of C("[name]",HTMLElement,e))(a[t.getAttribute("name")??""]??"")!==""?t.setAttribute("aria-invalid","true"):t.removeAttribute("aria-invalid");k('[aria-invalid="true"]',HTMLElement,e)?.focus()}function Ve(e,a,t){f(e,s`<p class="msg ${a}" role="${a==="err"?"alert":"status"}" tabindex="-1"></p>`);const o=u(".msg",HTMLElement,e);o.textContent=t,o.focus()}function Pt(e,a){const t=u("#form-masiva",HTMLFormElement,e.zona),o=u("#masiva-resultado",HTMLElement,t),i=u("#masiva-vista-previa",HTMLElement,t),r=d=>{const c=t.elements.namedItem(d);return c instanceof HTMLInputElement?c.value:""},l=()=>({concepto:r("concepto"),monto:r("monto_usd"),vencimiento:r("fecha_vencimiento")}),p=()=>{const d=Fe(l(),a);i.textContent=d.cuerpo?`Se creará «${d.cuerpo.concepto}» por ${M(d.cuerpo.monto_usd)} con vencimiento el ${W(d.cuerpo.fecha_vencimiento)} para cada estudiante activo de ${ga(e.alcance)}.`:""};t.addEventListener("input",p),t.addEventListener("submit",d=>{d.preventDefault();const c=Fe(l(),a);if(Ue(t,c.errores),f(o,s``),c.cuerpo===null)return;const b=c.cuerpo,h=u('button[type="submit"]',HTMLButtonElement,t);I(h,()=>y.post("/facturacion/cuotas/generar-mensualidades",b)).then(A=>{if(!e.vigente())return;const _=Ht(A.creadas,b.concepto);Ve(o,_.tono,_.texto)}).catch(A=>{if(A instanceof w){e.alSesionExpirada();return}if(A instanceof F){const _=A.moduloPremium();if(_){e.alBloquear(_);return}const z=A.camposInvalidos();z.length>0&&Ue(t,Object.fromEntries(z.map(m=>[m.campo,m.mensaje])))}e.vigente()&&Ve(o,"err",L(A))})})}function kt(e){if(e.modulo.bloqueado){f(e.zona,sa({nombre:e.modulo.nombre,descripcion:e.modulo.descripcion,precio_usd:e.modulo.precio_usd},e.puedeProbar)),ra(e.zona,e.alActivarPrueba);return}const a=de();f(e.zona,zt(e,a)),e.puedeGenerar&&Pt(e,a)}function ue(e){if(e===null)return{tipo:"denegado"};const a=e.sede_id??null;return a===null?e.rol==="admin"?{tipo:"consolidado"}:{tipo:"denegado"}:Number.isInteger(a)&&a>0?{tipo:"sede",sedeId:a}:{tipo:"denegado"}}const le="bma.cache.v1:";function Ce(){try{return sessionStorage}catch{return null}}function Ot(e,a){const t=Ce();if(!t)return null;try{const o=t.getItem(le+e);if(o===null)return null;const i=JSON.parse(o);return a(i)?i:null}catch{return null}}function jt(e,a){try{Ce()?.setItem(le+e,JSON.stringify(a))}catch{}}function Se(e){const a=Ce();if(a)try{if(e!==void 0){a.removeItem(le+e);return}const t=[];for(let o=0;o<a.length;o+=1){const i=a.key(o);i!==null&&i.startsWith(le)&&t.push(i)}for(const o of t)a.removeItem(o)}catch{}}async function Ie(e){const a=e.vigente??(()=>!0),t=Ot(e.clave,e.esValido);t!==null&&a()&&e.pintar(t,!0);try{const o=await e.cargar();if(!a())return;const i=t===null||JSON.stringify(o)!==JSON.stringify(t);jt(e.clave,o),i&&e.pintar(o,!1)}catch(o){if(o instanceof w||t===null)throw o}}const he="sedes";function $a(e){return Array.isArray(e)&&e.every(a=>{if(typeof a!="object"||a===null)return!1;const t=a;return typeof t.id=="number"&&typeof t.nombre=="string"&&typeof t.activa=="boolean"})}function Z(e,a){for(const t of C("[data-error]",HTMLElement,e)){const o=a[t.dataset.error??""]??"";t.textContent=o,t.hidden=o===""}for(const t of C("[name]",HTMLElement,e))(a[t.getAttribute("name")??""]??"")!==""?t.setAttribute("aria-invalid","true"):t.removeAttribute("aria-invalid");k('[aria-invalid="true"]',HTMLElement,e)?.focus()}function ha(e,a,t){f(e,s`<p class="msg ${a}" role="${"alert"}" tabindex="-1"></p>`);const o=u(".msg",HTMLElement,e);o.textContent=t,o.focus()}function xa(e){if(!(e instanceof F))return null;const a=e.camposInvalidos();return a.length>0?Object.fromEntries(a.map(t=>[t.campo,t.mensaje])):null}function X(e,a){const t=e.elements.namedItem(a);return t instanceof HTMLInputElement||t instanceof HTMLSelectElement?t.value:""}const qt=2,xe=120,Dt="MULTI_SEDE_PREMIUM",Nt="Expansión Multi-Sede Avanzada (3+ Sedes)",ya=50;function Rt(e){const a=e.trim().replace(/\s+/g," ");return a===""?{error:"Escribe el nombre de la sede, por ejemplo «Sede Este».",nombre:null}:a.length>xe?{error:`El nombre admite hasta ${xe} caracteres.`,nombre:null}:{error:null,nombre:a}}function Bt(e){if(!(e instanceof F))return null;const a=e.moduloPremium();return a||(e.codigo==="MODULO_PREMIUM_DESHABILITADO"||e.codigo==="BM403"?{modulo:Dt,nombre:Nt,precio_usd:ya}:null)}function Ft(e){const a=e.tipo==="sede"?"La gestión de sedes es una función del acceso consolidado (SuperAdmin). Tu usuario opera únicamente sobre su sede.":"Tu usuario no tiene una sede asignada, así que no puede abrir esta sección. Pide a un administrador que revise tu cuenta.";return s`${D("Sedes","Ubicaciones de la academia")}
    <div class="max-w-2xl">${x("warn",a,"Sección Restringida")}</div>`}function Ut(e){return s`<li class="${n.tarjeta} transition duration-200 hover:shadow-md motion-reduce:transition-none">
    <button type="button" data-sede-id="${e.id}" aria-label="Ver los estudiantes de ${e.nombre}" class="flex w-full flex-col gap-3 rounded-xl p-4 text-left">
      <span class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bma-azul text-white">${$("building")}</span>
        <span class="min-w-0 flex-1">
          <span class="block break-words text-base font-bold text-slate-900">${e.nombre}</span>
          ${e.creado_en?s`<span class="${n.ayuda} block">Creada el ${q(e.creado_en)}</span>`:null}
        </span>
        ${B(e.activa?"Operativa":"Inactiva",e.activa?"ok":"neutral")}
      </span>
      <span class="text-sm font-medium text-bma-azul-oscuro">Ver estudiantes de esta sede →</span>
    </button>
  </li>`}function Vt(e){return e.length===0?x("info","Todavía no hay sedes registradas. Crea la primera con el formulario de abajo.","Sin sedes"):s`<ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Sedes registradas">${e.map(Ut)}</ul>`}function Gt(e){return s`<section class="${n.tarjetaCristal} max-w-2xl p-6" aria-labelledby="t-nueva-sede">
    <h2 id="t-nueva-sede" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${$("building","h-5 w-5")}Nueva sede</h2>
    <p class="${n.ayuda} mb-4">El Core Base incluye ${qt} sedes (hoy hay ${e.length}). Desde la tercera se requiere la Expansión Multi-Sede (${M(ya)} · pago único); si ya está habilitada, el alta funciona con normalidad.</p>
    <form id="form-sede" novalidate class="flex flex-col gap-4 sm:flex-row sm:items-start" aria-label="Crear sede">
      <div class="min-w-0 flex-1">
        <label for="f-sede-nombre" class="${n.etiqueta}">Nombre de la sede <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="f-sede-nombre" name="nombre" type="text" maxlength="${xe}" required autocomplete="off" placeholder="Sede Este" aria-describedby="e-sede-nombre" class="${n.input} min-h-10">
        <p id="e-sede-nombre" data-error="nombre" role="alert" hidden class="${n.errorCampo}"></p>
      </div>
      <button type="submit" class="${v(n.btnPrimario,"min-h-10 sm:mt-6")}">${$("check","h-4 w-4")}<span>Crear sede</span></button>
    </form>
    <div id="sede-resultado" class="mt-4" aria-live="polite"></div>
  </section>`}function Wt(e){return s`${D("Sedes","Ubicaciones de la academia y su estado operativo")}
    <div class="flex flex-col gap-8">${Vt(e)}${Gt(e)}</div>`}function Jt(e,a){const t=u("#form-sede",HTMLFormElement,e.zona),o=u("#sede-resultado",HTMLElement,e.zona);t.addEventListener("submit",i=>{i.preventDefault();const r=Rt(X(t,"nombre"));if(Z(t,r.error===null?{}:{nombre:r.error}),f(o,s``),r.nombre===null)return;const l={nombre:r.nombre},p=u('button[type="submit"]',HTMLButtonElement,t);I(p,()=>y.post("/sedes",l)).then(async d=>{T("ok",`Sede «${d.nombre}» creada.`),e.vigente()&&await a()}).catch(d=>{if(d instanceof w){e.alSesionExpirada();return}const c=Bt(d);if(c){e.alBloquear(c);return}if(!e.vigente())return;if(d instanceof F&&d.codigo==="SEDE_DUPLICADA"){Z(t,{nombre:d.message});return}const b=xa(d);b&&Z(t,b),ha(o,"err",L(d))})})}async function Xt(e){const a=ue(e.usuario);if(a.tipo!=="consolidado"){f(e.zona,Ft(a));return}const t=async()=>{await Ie({clave:he,esValido:$a,cargar:()=>y.get("/sedes"),vigente:e.vigente,pintar:i=>{f(e.zona,Wt(i)),Jt(e,o);for(const r of C("[data-sede-id]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>{const l=Number(r.dataset.sedeId);Number.isInteger(l)&&l>0&&e.alElegirSede(l)})}})},o=async()=>{Se(he),await t()};await t()}const Ge=7,ye=1,Ee=60,we=60,Yt=10,He="__otro__",Ea=["Kids 1 B","Kids 1 A","Beginner B","Beginner A","Adultos","Kids 1 C","Beginner C"],wa=["","Pendiente","Usada","Vencida","Revocada"],Kt={Pendiente:"info",Usada:"ok",Vencida:"warn",Revocada:"bad"};function Zt(e,a){const t={};let o=null;if(a.tipo==="consolidado"){const p=Number(e.sede);e.sede===""||!Number.isInteger(p)||p<=0?t.sede_id="Elige la sede a la que pertenecerá el estudiante.":o=p}let i="";e.nivel===He?(i=e.nivelOtro.trim().replace(/\s+/g," "),i===""?t.nivel_otro="Escribe el nivel.":i.length>we&&(t.nivel_otro=`El nivel admite hasta ${we} caracteres.`)):Ea.includes(e.nivel)?i=e.nivel:t.nivel_asignado="Elige el nivel asignado.";const r=e.dias.trim(),l=/^\d{1,3}$/.test(r)?Number(r):Number.NaN;return(!Number.isInteger(l)||l<ye||l>Ee)&&(t.dias=`Escribe un número entero de días entre ${ye} y ${Ee}.`),Object.keys(t).length>0?{errores:t,cuerpo:null}:{errores:t,cuerpo:o===null?{nivel_asignado:i,dias:l}:{nivel_asignado:i,dias:l,sede_id:o}}}async function Qt(e,a){try{if(window.isSecureContext&&typeof navigator.clipboard?.writeText=="function")return await navigator.clipboard.writeText(e),!0}catch{}return a.focus(),a.select(),a.setSelectionRange(0,e.length),!1}const eo="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800";function ao(){return s`${D("Invitaciones","Enlaces únicos de inscripción para los representantes")}
    <div class="max-w-2xl">${x("warn","Tu usuario no tiene una sede asignada, así que no puede emitir invitaciones. Pide a un administrador que revise tu cuenta.","Sección Restringida")}</div>`}function to(e,a){if(e.tipo==="consolidado"){const o=a.filter(r=>r.activa),i=o.length===1?o[0]:void 0;return s`<div>
      <label for="f-inv-sede" class="${n.etiqueta}">Sede destino <span class="text-red-800" aria-hidden="true">*</span></label>
      <select id="f-inv-sede" name="sede_id" required aria-describedby="e-inv-sede" class="${n.input} min-h-10">
        <option value="">Elige una sede…</option>
        ${o.map(r=>s`<option value="${r.id}" ${r.id===i?.id?U("selected"):null}>${r.nombre}</option>`)}
      </select>
      <p id="e-inv-sede" data-error="sede_id" role="alert" hidden class="${n.errorCampo}"></p>
    </div>`}const t=a.find(o=>e.tipo==="sede"&&o.id===e.sedeId);return s`<div>
    <span class="${n.etiqueta}">Sede destino</span>
    <p class="${eo}">${$("building","h-4 w-4")}<span class="min-w-0 break-words">${t?.nombre??"Tu sede"}</span></p>
    <p class="${n.ayuda}">Las invitaciones se emiten siempre para tu sede.</p>
  </div>`}function oo(e,a){return s`<section class="${n.tarjetaCristal} p-6" aria-labelledby="t-nueva-inv">
    <h2 id="t-nueva-inv" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${$("link","h-5 w-5")}Nueva invitación</h2>
    <p class="${n.ayuda} mb-4">El enlace es de un solo uso y fija la sede y el nivel: el representante no puede cambiarlos en la planilla.</p>
    <form id="form-inv" novalidate class="grid gap-4 sm:grid-cols-2" aria-label="Emitir invitación">
      ${to(e,a)}
      <div>
        <label for="f-inv-nivel" class="${n.etiqueta}">Nivel asignado <span class="text-red-800" aria-hidden="true">*</span></label>
        <select id="f-inv-nivel" name="nivel_asignado" required aria-describedby="e-inv-nivel" class="${n.input} min-h-10">
          <option value="">Elige un nivel…</option>
          ${Ea.map(t=>s`<option value="${t}">${t}</option>`)}
          <option value="${He}">Otro…</option>
        </select>
        <p id="e-inv-nivel" data-error="nivel_asignado" role="alert" hidden class="${n.errorCampo}"></p>
        <div id="inv-nivel-otro" class="mt-2" hidden>
          <label for="f-inv-otro" class="${n.etiqueta}">Escribe el nivel</label>
          <input id="f-inv-otro" name="nivel_otro" type="text" maxlength="${we}" autocomplete="off" aria-describedby="e-inv-otro" class="${n.input} min-h-10">
          <p id="e-inv-otro" data-error="nivel_otro" role="alert" hidden class="${n.errorCampo}"></p>
        </div>
      </div>
      <div>
        <label for="f-inv-dias" class="${n.etiqueta}">Días de vigencia <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="f-inv-dias" name="dias" type="text" inputmode="numeric" required autocomplete="off" value="${Ge}" aria-describedby="e-inv-dias" class="${n.input} min-h-10">
        <p class="${n.ayuda}">Entre ${ye} y ${Ee} días. Por defecto ${Ge}.</p>
        <p id="e-inv-dias" data-error="dias" role="alert" hidden class="${n.errorCampo}"></p>
      </div>
      <div class="flex items-end justify-end sm:col-span-2">
        <button type="submit" class="${v(n.btnPrimario,"min-h-10")}">${$("link","h-4 w-4")}<span>Generar enlace</span></button>
      </div>
    </form>
    <div id="inv-resultado" class="mt-4" aria-live="polite"></div>
  </section>`}function no(e,a){return s`<section class="${n.tarjetaCristal} border-emerald-700/30 p-6" aria-labelledby="t-inv-ok">
    <h2 id="t-inv-ok" class="flex items-center gap-2 text-base font-bold text-slate-900">${$("check","h-5 w-5 text-emerald-700")}Invitación creada</h2>
    <p class="${n.ayuda} mb-4">${a} · ${e.nivel_asignado} · vence el ${q(e.expira_en)} · un solo uso.</p>
    <label for="inv-enlace" class="${n.etiqueta}">Enlace de inscripción</label>
    <div class="flex flex-col gap-3 sm:flex-row">
      <input id="inv-enlace" type="text" readonly value="${e.enlace}" class="${n.input} min-h-10 flex-1 font-mono text-xs">
      <button type="button" id="inv-copiar" class="${v(n.btnPrimario,"min-h-10")}">${$("copy","h-4 w-4")}<span>Copiar enlace</span></button>
    </div>
    <div class="mt-4">${x("warn","Por seguridad el enlace se muestra solo ahora: en el sistema queda únicamente su huella cifrada. Cópialo y envíalo al representante (por ejemplo, por WhatsApp). Si lo pierdes, revoca esta invitación y emite otra.","Cópialo ahora")}</div>
  </section>`}function io(e){const a=e.estado==="Usada"&&e.usada_en!==null?s`Usada el ${q(e.usada_en)}`:s`Vence el ${q(e.expira_en)}`;return s`<tr>
    <td class="${n.td}">${e.sede}</td>
    <td class="${n.td}">${e.nivel_asignado}</td>
    <td class="${n.td}">${B(e.estado,Kt[e.estado])}</td>
    <td class="${n.td} whitespace-nowrap">${q(e.creado_en)}</td>
    <td class="${n.td} whitespace-nowrap">${a}</td>
    <td class="${n.td} text-right">
      ${e.estado==="Pendiente"?s`<button type="button" data-revocar="${e.id}" class="${v(n.btnSecundario,"min-h-10")}" aria-label="Revocar invitación de ${e.nivel_asignado} en ${e.sede}">${$("x","h-4 w-4")}<span>Revocar</span></button>`:null}
    </td>
  </tr>`}function so(e){return e.length===0?x("info","No hay invitaciones con este filtro.","Sin resultados"):s`<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
    <table class="${n.tabla}">
      <thead><tr>
        <th scope="col" class="${n.th}">Sede</th>
        <th scope="col" class="${n.th}">Nivel</th>
        <th scope="col" class="${n.th}">Estado</th>
        <th scope="col" class="${n.th}">Emitida</th>
        <th scope="col" class="${n.th}">Vigencia</th>
        <th scope="col" class="${n.th}"><span class="sr-only">Acciones</span></th>
      </tr></thead>
      <tbody>${e.map(io)}</tbody>
    </table>
  </div>`}function ro(e){const a=Math.max(1,Math.ceil(e.total/Math.max(1,e.limite)));return s`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación de invitaciones">
    <span class="text-slate-600">Página ${e.pagina} de ${a} · ${e.total} invitación(es)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${v(n.btnSecundario,"min-h-10")}" ${e.pagina<=1?U("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${v(n.btnSecundario,"min-h-10")}" ${e.pagina>=a?U("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function _a(){return s`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando invitaciones"></div>`}function lo(e,a){const t=e.tipo==="consolidado"&&!a.some(o=>o.activa);return s`${D("Invitaciones","Enlaces únicos de inscripción con sede y nivel blindados")}
    <div class="flex flex-col gap-8">
      <div class="max-w-3xl">
        ${t?x("warn","No hay sedes activas. Crea o activa una sede en la sección Sedes antes de emitir invitaciones.","Sin sedes disponibles"):oo(e,a)}
      </div>
      <div id="inv-exito" class="max-w-3xl" aria-live="polite"></div>
      <section aria-labelledby="t-inv-lista">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 id="t-inv-lista" class="text-base font-bold text-slate-900">Invitaciones emitidas</h2>
          <div>
            <label for="inv-filtro" class="${n.etiqueta}">Estado</label>
            <select id="inv-filtro" class="${n.input} min-h-10">${wa.map(o=>s`<option value="${o}">${o===""?"Todas":o}</option>`)}</select>
          </div>
        </div>
        <div id="inv-lista">${_a()}</div>
      </section>
    </div>`}function co(e,a,t,o){const i=k("#form-inv",HTMLFormElement,e.zona);if(i===null)return;const r=u("#inv-resultado",HTMLElement,e.zona),l=u("#inv-exito",HTMLElement,e.zona),p=u("#f-inv-nivel",HTMLSelectElement,i),d=u("#inv-nivel-otro",HTMLElement,i);p.addEventListener("change",()=>{d.hidden=p.value!==He,d.hidden||u("#f-inv-otro",HTMLInputElement,i).focus()}),i.addEventListener("submit",c=>{c.preventDefault();const b=Zt({sede:X(i,"sede_id"),nivel:X(i,"nivel_asignado"),nivelOtro:X(i,"nivel_otro"),dias:X(i,"dias")},a);if(Z(i,b.errores),f(r,s``),b.cuerpo===null)return;const h=b.cuerpo,A=u('button[type="submit"]',HTMLButtonElement,i);I(A,()=>y.post("/invitaciones",h)).then(_=>{if(!e.vigente())return;const z=t.find(m=>m.id===_.sede_id)?.nombre??"Sede";f(l,no(_,z)),uo(l,_.enlace),u("#inv-copiar",HTMLButtonElement,l).focus(),o()}).catch(_=>{if(_ instanceof w){e.alSesionExpirada();return}if(!e.vigente())return;const z=xa(_);z&&Z(i,z),ha(r,"err",L(_))})})}function uo(e,a){const t=u("#inv-copiar",HTMLButtonElement,e),o=u("#inv-enlace",HTMLInputElement,e),i=t.innerHTML;t.addEventListener("click",()=>{Qt(a,o).then(r=>{if(!r){T("warn","Tu navegador no permitió copiar automáticamente. El enlace quedó seleccionado: pulsa Ctrl+C (⌘+C en Mac).");return}f(t,s`${$("check","h-4 w-4")}<span>¡Copiado!</span>`),T("ok","Enlace copiado. Ya puedes pegarlo en WhatsApp."),window.setTimeout(()=>{t.isConnected&&(t.innerHTML=i)},2500)})})}function po(e,a,t){const o=G({titulo:"Revocar invitación",cuerpo:s`<p class="text-sm text-slate-700">Se desactivará el enlace de <strong>${e.nivel_asignado}</strong> en <strong>${e.sede}</strong>. Quien lo abra verá que ya no es válido. Esta acción no se puede deshacer.</p>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" data-cancelar class="${v(n.btnSecundario,"min-h-10")}">Cancelar</button>
        <button type="button" data-confirmar class="${v(n.btnPeligro,"min-h-10")}">${$("x","h-4 w-4")}<span>Revocar</span></button>
      </div>`});k("[data-cancelar]",HTMLButtonElement,o.dialogo)?.addEventListener("click",o.cerrar);const i=u("[data-confirmar]",HTMLButtonElement,o.dialogo);i.addEventListener("click",()=>{I(i,()=>y.post(`/invitaciones/${e.id}/revocar`)).then(()=>{o.cerrar(),T("ok","Invitación revocada: el enlace ya no sirve."),a()}).catch(r=>{if(r instanceof w){o.cerrar(),t();return}if(r instanceof F&&r.codigo==="INVITACION_NO_REVOCABLE"){o.cerrar(),T("warn",r.message),a();return}T("bad",L(r))})})}function mo(e){const a=u("#inv-lista",HTMLElement,e.zona),t=u("#inv-filtro",HTMLSelectElement,e.zona);let o="",i=1,r=[],l=0;const p=async()=>{l+=1;const d=l;f(a,_a());try{const c=await y.pagina("/invitaciones",{estado:o,pagina:i,limite:Yt});if(!e.vigente()||d!==l)return;r=c.datos,f(a,s`${so(c.datos)}${ro(c.paginacion)}`)}catch(c){if(!e.vigente()||d!==l)return;if(c instanceof w){e.alSesionExpirada();return}f(a,s`${x("bad",L(c),"No se pudo cargar la lista")}
        <button type="button" data-reintentar class="${v(n.btnSecundario,"mt-4 min-h-10")}">${$("refresh","h-4 w-4")}<span>Reintentar</span></button>`)}};return a.addEventListener("click",d=>{const c=d.target instanceof Element?d.target:null,b=c?.closest("[data-revocar]");if(b instanceof HTMLElement){const A=Number(b.dataset.revocar),_=r.find(z=>z.id===A);_&&po(_,()=>void p(),()=>e.alSesionExpirada());return}if(c?.closest("[data-reintentar]")){p();return}const h=c?.closest("[data-pag]");h instanceof HTMLButtonElement&&!h.disabled&&(i=Math.max(1,i+Number(h.dataset.pag)),p())}),t.addEventListener("change",()=>{o=wa.find(c=>c===t.value)??"",i=1,p()}),p(),()=>{t.value="",o="",i=1,p()}}async function fo(e){const a=ue(e.usuario);if(a.tipo==="denegado"){f(e.zona,ao());return}const t=await y.get("/sedes");if(!e.vigente())return;f(e.zona,lo(a,t));const o=mo(e);co(e,a,t,o)}const bo="/assets/bma-logo--zgMcLI-.webp",vo="/assets/bma-isotipo-D77goT0u.webp",Ma="Brilliant Minds Academy",We={ancho:800,alto:735},Je={ancho:256,alto:256};function La(e,a=!1){return s`<img src="${bo}" alt="${Ma}" width="${We.ancho}" height="${We.alto}" decoding="async" fetchpriority="${a?"high":"auto"}" class="${e}">`}function go(e){return s`<img src="${vo}" alt="${Ma}" width="${Je.ancho}" height="${Je.alto}" decoding="async" class="${e}">`}function ze(){return s`<div class="mb-6"><div class="h-8 w-56 rounded-lg bg-slate-200"></div><div class="mt-3 h-4 w-80 max-w-full rounded bg-slate-200"></div></div>`}function $o(e=6){const a=s`<div class="flex gap-4 border-b border-slate-100 px-4 py-4"><div class="h-4 w-1/4 rounded bg-slate-200"></div><div class="h-4 w-1/6 rounded bg-slate-200"></div><div class="h-4 w-1/5 rounded bg-slate-200"></div><div class="h-4 w-1/6 rounded bg-slate-200"></div></div>`;return s`<div role="status" aria-label="Cargando" class="animate-pulse">
    ${ze()}
    <div class="mb-4 flex gap-2"><div class="h-8 w-20 rounded-lg bg-slate-200"></div><div class="h-8 w-24 rounded-lg bg-slate-200"></div><div class="h-8 w-28 rounded-lg bg-slate-200"></div></div>
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white"><div class="h-11 bg-slate-200"></div>${Array.from({length:e},()=>a)}</div>
  </div>`}function ho(e=4){const a=s`<div class="rounded-xl border border-slate-200 bg-white p-6"><div class="h-4 w-1/2 rounded bg-slate-200"></div><div class="mt-4 h-7 w-2/3 rounded bg-slate-200"></div><div class="mt-3 h-3 w-1/3 rounded bg-slate-200"></div></div>`;return s`<div role="status" aria-label="Cargando" class="animate-pulse">
    ${ze()}
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${Array.from({length:e},()=>a)}</div>
    <div class="mt-6 h-48 rounded-xl bg-slate-200"></div>
  </div>`}function xo(){return s`<div role="status" aria-label="Cargando" class="animate-pulse">
    ${ze()}
    <div class="h-40 rounded-xl bg-slate-200"></div>
    <div class="mt-4 h-24 rounded-xl bg-slate-200"></div>
  </div>`}function yo(e){return e==="estudiantes"||e==="auditoria"||e==="invitaciones"?$o():e==="dashboard"||e==="sedes"?ho():xo()}const Xe="255, 255, 255",Ye="103, 232, 249",Ke=130,oe=170;function Eo(e){const a=[.5,.12],t=[.28,.88],o=[.72,.88],i=(c,b,h)=>[c[0]+(b[0]-c[0])*h,c[1]+(b[1]-c[1])*h],r=Math.max(2,Math.floor(e/3)),l=[];for(let c=0;c<r;c+=1)l.push(i(t,a,c/r));for(let c=0;c<r;c+=1)l.push(i(a,o,c/r));const p=i(t,a,.58),d=i(o,a,.58);for(let c=1;c<r;c+=1)l.push(i(p,d,c/r));return l}function wo(e,a){const t=Math.max(36,Math.min(110,Math.round(e*a/11e3))),o=Math.min(e,a)*.9,i=(e-o)/2,r=(a-o)/2,l=Eo(Math.round(t/3)),p=[];for(const[d,c]of l){const b=i+d*o,h=r+c*o;p.push({x:b+(Math.random()-.5)*90,y:h+(Math.random()-.5)*90,vx:0,vy:0,ax:b,ay:h,r:1.8+Math.random()*1.4,cian:Math.random()<.3})}for(;p.length<t;)p.push({x:Math.random()*e,y:Math.random()*a,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,ax:null,ay:null,r:1.2+Math.random()*1.6,cian:Math.random()<.2});return p}function _o(e){const a=e.getContext("2d");if(!a)return()=>{};const t=window.matchMedia("(prefers-reduced-motion: reduce)").matches;let o=0,i=0,r=[],l=0,p=!0;const d={x:-9999,y:-9999,dentro:!1},c=()=>{const m=Math.min(window.devicePixelRatio||1,2);o=e.clientWidth,i=e.clientHeight,e.width=Math.max(1,Math.round(o*m)),e.height=Math.max(1,Math.round(i*m)),a.setTransform(m,0,0,m,0,0),r=wo(o,i)},b=()=>{for(const m of r){if(m.ax!==null&&m.ay!==null&&(m.vx+=(m.ax-m.x)*.0016+(Math.random()-.5)*.05,m.vy+=(m.ay-m.y)*.0016+(Math.random()-.5)*.05),d.dentro){const H=d.x-m.x,N=d.y-m.y,j=Math.hypot(H,N);if(j<oe&&j>1){const J=(1-j/oe)*.045;m.vx+=H/j*J*6,m.vy+=N/j*J*6}}m.vx*=.94,m.vy*=.94,m.x+=m.vx,m.y+=m.vy,m.ax===null&&(m.x<-20?m.x=o+20:m.x>o+20&&(m.x=-20),m.y<-20?m.y=i+20:m.y>i+20&&(m.y=-20),m.vx+=(Math.random()-.5)*.02,m.vy+=(Math.random()-.5)*.02)}},h=()=>{a.clearRect(0,0,o,i);for(let m=0;m<r.length;m+=1){const H=r[m];if(H){for(let N=m+1;N<r.length;N+=1){const j=r[N];if(!j)continue;const J=Math.hypot(H.x-j.x,H.y-j.y);J<Ke&&(a.strokeStyle=`rgba(${Xe}, ${(1-J/Ke)*.28})`,a.lineWidth=1,a.beginPath(),a.moveTo(H.x,H.y),a.lineTo(j.x,j.y),a.stroke())}if(d.dentro){const N=Math.hypot(H.x-d.x,H.y-d.y);N<oe&&(a.strokeStyle=`rgba(${Ye}, ${(1-N/oe)*.55})`,a.beginPath(),a.moveTo(H.x,H.y),a.lineTo(d.x,d.y),a.stroke())}}}for(const m of r)a.fillStyle=m.cian?`rgba(${Ye}, 0.9)`:`rgba(${Xe}, 0.7)`,a.beginPath(),a.arc(m.x,m.y,m.r,0,Math.PI*2),a.fill()},A=()=>{p&&(b(),h(),l=window.requestAnimationFrame(A))},_=m=>{const H=e.getBoundingClientRect();d.x=m.clientX-H.left,d.y=m.clientY-H.top,d.dentro=!0},z=()=>{d.dentro=!1};if(c(),window.addEventListener("resize",c),window.addEventListener("pointermove",_,{passive:!0}),window.addEventListener("pointerleave",z),document.addEventListener("mouseleave",z),t){for(const m of r)m.ax!==null&&m.ay!==null&&(m.x=m.ax,m.y=m.ay);h()}else l=window.requestAnimationFrame(A);return()=>{p=!1,window.cancelAnimationFrame(l),window.removeEventListener("resize",c),window.removeEventListener("pointermove",_),window.removeEventListener("pointerleave",z),document.removeEventListener("mouseleave",z)}}const Mo="Diseñado y desarrollado por Astra Digital Solutions",Ze="Astra Academy Suite v1.0",Lo="#22D3EE";function Ta(e){return s`<svg viewBox="0 0 24 24" fill="none" stroke="${Lo}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" class="${e}"><path d="M4 20 12 4l8 16"/><path d="M7.6 14h8.8"/></svg>`}function To(){return s`<footer class="mt-8 flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-center font-display text-xs font-medium tracking-wide text-slate-700">
    ${Ta("h-5 w-5 shrink-0 rounded bg-slate-900 p-0.5")}<span>${Mo}</span>
  </footer>`}function Ao(){return s`<div class="flex items-center gap-2 border-t border-slate-200 px-4 py-3 font-display text-xs font-medium tracking-wide text-slate-700 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0" title="${Ze}">
    ${Ta("h-6 w-6 shrink-0 rounded bg-slate-900 p-1")}<span class="min-w-0 truncate group-data-[collapsed=true]/sb:sr-only">${Ze}</span>
  </div>`}const Aa="bma.sidebar.colapsado",Co=3e4,Ca=25,pe=300,Sa=!1,So=[{id:"dashboard",titulo:"Dashboard",icono:"home",soloAdmin:!1},{id:"estudiantes",titulo:"Estudiantes",icono:"users",soloAdmin:!1},{id:"auditoria",titulo:"Auditoría de referencias",icono:"inbox",soloAdmin:!1},{id:"sedes",titulo:"Sedes",icono:"building",soloAdmin:!1},{id:"invitaciones",titulo:"Invitaciones",icono:"link",soloAdmin:!1},{id:"contabilidad",titulo:"Egresos y contabilidad",icono:"book",soloAdmin:!0},{id:"configuracion",titulo:"Configuración de cobro",icono:"wallet",soloAdmin:!0}],Ia={IA_ATENCION:"bot",WHATSAPP_AUTOMATICO:"chat",BANCAMIGA:"wallet",APP_MOVIL:"phone",FACHADA_WEB:"globe",MULTI_SEDE_PREMIUM:"school",FACTURACION_MASIVA:"receipt"},Qe=["","Activo","Moroso","Fuera de la Academia","Pendiente por Validación Administrativa"],ea=["Por Validar","Aprobada","Rechazada"];let g={usuario:null,modulos:[],vista:"dashboard",colapsado:!1,periodo:na(),filtroEstudiantes:"",paginaEstudiantes:1,sedeFiltro:null,filtroAuditoria:"Por Validar",paginaAuditoria:1};function P(e){g={...g,...e}}let ie=0,se=null;function Io(){try{const e=localStorage.getItem(Aa);if(e==="1")return!0;if(e==="0")return!1}catch{}return window.matchMedia("(max-width: 767px)").matches}function Ho(e){try{localStorage.setItem(Aa,e?"1":"0")}catch{}}function zo(e){if(typeof e!="object"||e===null)return!1;const a=e;return typeof a.id=="number"&&typeof a.nombre=="string"&&typeof a.email=="string"&&(a.rol==="admin"||a.rol==="secretaria")}function Po(){const e=ce.usuarioCrudo();if(!e)return null;try{const a=JSON.parse(e);return zo(a)?a:null}catch{return null}}const Q=()=>g.usuario?.rol==="admin";function Ha(){return So.filter(e=>(!e.soloAdmin||Q())&&(e.id!=="contabilidad"||Sa))}let _e=null;function za(){_e?.(),_e=null}function Pa(e){Pe(),za(),ie+=1,document.body.className="text-slate-900",f(u("#app",HTMLElement),s`<main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-bma-azul px-4 py-12">
      <canvas id="red-neuronal" aria-hidden="true" class="pointer-events-none absolute inset-0 h-full w-full"></canvas>
      <section class="${n.loginTarjeta} relative z-10" aria-labelledby="login-titulo">
        <header class="mb-8 flex flex-col items-center text-center">
          ${La("h-auto w-48 sm:w-56",!0)}
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
        ${To()}
      </section>
    </main>`),_e=_o(u("#red-neuronal",HTMLCanvasElement));const a=u("#login",HTMLFormElement);a.addEventListener("submit",t=>{t.preventDefault(),ko(a)}),u("#login-email",HTMLInputElement).focus()}async function ko(e){const a=u("#login-email",HTMLInputElement).value.trim(),t=u("#login-password",HTMLInputElement).value,o=u("#login-aviso",HTMLElement);if(!a||!t){f(o,x("bad","Escribe tu correo y tu contraseña."));return}try{const i=await I(u('button[type="submit"]',HTMLButtonElement,e),()=>y.post("/auth/login",{email:a,password:t},{sinAuth:!0}));ce.guardar(i.token,JSON.stringify(i.usuario)),Se(),await ka()}catch(i){f(o,x("bad",L(i)))}}function O(e){ce.cerrar(),Se(),P({usuario:null,modulos:[],vista:"dashboard",sedeFiltro:null}),Pa(e)}function Me(e){const{id:a,titulo:t,tooltip:o,bloqueado:i}=e;return s`<button type="button" data-nav="${a}" data-bloqueado="${i}"
    class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 aria-[current=page]:bg-bma-azul aria-[current=page]:text-white group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
    ${$(e.icono)}
    <span class="min-w-0 flex-1 truncate group-data-[collapsed=true]/sb:sr-only">${t}</span>
    ${i?s`<span class="text-slate-500 group-data-[collapsed=true]/sb:absolute group-data-[collapsed=true]/sb:right-2 group-data-[collapsed=true]/sb:top-1">${$("lock","h-4 w-4 group-data-[collapsed=true]/sb:h-3 group-data-[collapsed=true]/sb:w-3")}</span>`:null}
    <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">${o}</span>
  </button>`}function Oo(){const e=g.usuario,a=Ha();return s`<div id="shell" data-collapsed="${g.colapsado}" class="group/sb flex min-h-screen">
    <aside id="barra-lateral" aria-label="Navegación principal"
      class="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-lg transition-[width] duration-200 group-data-[collapsed=true]/sb:w-20">
      <div class="flex h-24 items-center justify-center border-b border-slate-200 px-4 group-data-[collapsed=true]/sb:h-16 group-data-[collapsed=true]/sb:px-2">
        ${La("h-auto max-h-20 w-auto max-w-full object-contain group-data-[collapsed=true]/sb:hidden")}
        ${go("hidden h-10 w-10 object-contain group-data-[collapsed=true]/sb:block")}
        <span class="sr-only">Administración</span>
      </div>
      <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Secciones">
        ${a.map(t=>Me({id:t.id,titulo:t.titulo,icono:t.icono,tooltip:t.titulo,bloqueado:!1}))}
        <p class="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 group-data-[collapsed=true]/sb:sr-only">Módulos Premium</p>
        <hr class="my-2 hidden border-slate-200 group-data-[collapsed=true]/sb:block">
        ${g.modulos.map(t=>Me({id:`premium:${t.codigo}`,titulo:t.nombre,icono:Ia[t.codigo]??"chat",tooltip:t.bloqueado?`${t.nombre} · ${t.tooltip}`:t.nombre,bloqueado:t.bloqueado}))}
      </nav>
      <div class="flex flex-col gap-1 border-t border-slate-200 p-3">
        <div class="flex items-center gap-3 px-3 py-2 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800" aria-hidden="true">${(e?.nombre??"?").trim().slice(0,1).toUpperCase()}</span>
          <span class="min-w-0 group-data-[collapsed=true]/sb:sr-only"><span class="block truncate text-sm font-semibold text-slate-900">${e?.nombre}</span><span class="block truncate text-xs text-slate-600">${e?.rol}</span></span>
        </div>
        <button type="button" id="salir" class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${$("logout")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Salir</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Salir</span>
        </button>
        <button type="button" id="alternar-sidebar" aria-controls="barra-lateral" aria-expanded="${!g.colapsado}" aria-label="${g.colapsado?"Expandir menú lateral":"Contraer menú lateral"}"
          class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${$("menu")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Contraer menú</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Expandir menú</span>
        </button>
      </div>
      ${Ao()}
    </aside>
    <main id="contenido" tabindex="-1" class="m-2 min-w-0 flex-1 rounded-xl bg-slate-50/95 p-4 shadow-lg sm:m-4 sm:p-8"></main>
  </div>`}function jo(){const e=!g.colapsado;P({colapsado:e}),Ho(e);const a=u("#shell",HTMLElement);a.dataset.collapsed=String(e);const t=u("#alternar-sidebar",HTMLButtonElement);t.setAttribute("aria-expanded",String(!e)),t.setAttribute("aria-label",e?"Expandir menú lateral":"Contraer menú lateral")}function qo(e){const a=e.startsWith("estudiante:")?"estudiantes":e;for(const t of C("[data-nav]",HTMLElement))t.dataset.nav===a?t.setAttribute("aria-current","page"):t.removeAttribute("aria-current")}async function ka(){if(!ce.token()){Pa();return}let e=Po();try{e||(e=(await y.get("/auth/me")).usuario);const o=await y.get("/premium/modulos").catch(i=>{if(i instanceof w)throw i;return[]});P({usuario:e,modulos:o,colapsado:Io()})}catch(o){O(o instanceof w?"Tu sesión expiró. Inicia sesión de nuevo.":L(o));return}document.body.className="text-slate-900",za(),f(u("#app",HTMLElement),Oo()),u("#shell",HTMLElement).addEventListener("click",o=>{const r=(o.target instanceof Element?o.target:null)?.closest("[data-nav]");if(!(r instanceof HTMLElement))return;const l=r.dataset.nav??"";g.modulos.find(d=>`premium:${d.codigo}`===l)?.bloqueado&&(o.preventDefault(),o.stopPropagation()),S(l)}),u("#salir",HTMLButtonElement).addEventListener("click",()=>O()),u("#alternar-sidebar",HTMLButtonElement).addEventListener("click",jo);const t=g.vista.startsWith("premium:")||Ha().some(o=>o.id===g.vista)?g.vista:"dashboard";await S(t)}function Pe(){se!==null&&(window.clearInterval(se),se=null)}async function S(e){Pe(),ie+=1;const a=ie;P({vista:e}),qo(e);const t=u("#contenido",HTMLElement),o={zona:t,vigente:()=>a===ie};f(t,yo(e));try{e.startsWith("premium:")?tn(o,e.slice(8)):e.startsWith("estudiante:")?await Yo(o,e.slice(11)):e==="estudiantes"?await Wo(o):e==="auditoria"?await Zo(o):e==="sedes"?await Xt({zona:o.zona,vigente:o.vigente,usuario:g.usuario,alBloquear:i=>void Ra(o,i),alElegirSede:i=>{P({sedeFiltro:i,paginaEstudiantes:1,filtroEstudiantes:""}),S("estudiantes")},alSesionExpirada:()=>O("Tu sesión expiró. Inicia sesión de nuevo.")}):e==="invitaciones"?await fo({zona:o.zona,vigente:o.vigente,usuario:g.usuario,alSesionExpirada:()=>O("Tu sesión expiró. Inicia sesión de nuevo.")}):e==="contabilidad"&&Sa&&Q()||(e==="configuracion"&&Q()?await Mt({zona:o.zona,vigente:o.vigente,usuario:g.usuario}):await Fo(o))}catch(i){Oa(i,o)}}function Oa(e,a){if(a.vigente()){if(e instanceof w){O("Tu sesión expiró. Inicia sesión de nuevo.");return}if(e instanceof F){const t=e.moduloPremium();if(t){Ba(a.zona,t);return}}f(a.zona,s`<div class="mx-auto max-w-2xl pt-8">${x("bad",L(e),e instanceof Wa?"Sin conexión":"No se pudo cargar la sección")}
      <button type="button" data-reintentar class="${v(n.btnSecundario,"mt-4")}">${$("refresh","h-4 w-4")}<span>Reintentar</span></button></div>`),k("[data-reintentar]",HTMLButtonElement,a.zona)?.addEventListener("click",()=>void S(g.vista))}}function ja(e){const a=Math.max(1,Math.ceil(e.total/Math.max(1,e.limite)));return s`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación">
    <span class="text-slate-600">Página ${e.pagina} de ${a} · ${e.total} registro(s)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${v(n.btnSecundario,n.btnPeq)}" ${e.pagina<=1?U("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${v(n.btnSecundario,n.btnPeq)}" ${e.pagina>=a?U("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function qa(e,a){for(const t of C("[data-pag]",HTMLButtonElement,e))t.addEventListener("click",()=>a(Number(t.dataset.pag)))}function Do(e){return s`<article class="${n.tarjeta} p-6">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-sm font-medium text-slate-600">${e.titulo}</h3>
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${$(e.icono,"h-4 w-4")}</span>
    </div>
    <p class="mt-3 text-2xl font-bold ${e.tono==="malo"?"text-bma-coral-oscuro":"text-slate-900"}" data-kpi>${e.valor}</p>
    <p class="mt-1 text-xs text-slate-600">${e.detalle}</p>
  </article>`}function No(e){const a=Ga(e.periodo),t=new Map;for(const l of e.cobrado_por_dia)t.set(Number(l.dia.slice(8,10)),l.monto_usd);const o=Math.max(0,...t.values()),i=Array.from({length:a},(l,p)=>{const d=p+1,c=t.get(d)??0,b=o>0?Math.max(c>0?4:0,Math.round(c/o*100)):0;return s`<li class="group/barra relative flex h-full min-w-0 flex-1 flex-col justify-end" title="Día ${d}: ${M(c)}">
      <div data-alto="${b}" class="w-full rounded-t ${c>0?"bg-slate-800 group-hover/barra:bg-slate-600":"bg-slate-200"} ${c>0?"":"h-px"}"></div>
      <span class="sr-only">Día ${d}: ${M(c)}</span>
    </li>`}),r=Array.from({length:a},(l,p)=>s`<span class="min-w-0 flex-1 text-center text-xs text-slate-600">${(p+1)%5===0||p===0?p+1:""}</span>`);return s`<div role="group" aria-label="Cobrado por día en ${e.periodo}">
    <ul class="flex h-48 items-end gap-1 border-b border-slate-200">${i}</ul>
    <div class="mt-1 flex gap-1" aria-hidden="true">${r}</div>
  </div>`}function Ro(e){for(const a of C("[data-alto]",HTMLElement,e)){const t=Number(a.dataset.alto);Number.isFinite(t)&&t>0&&(a.style.height=`${Math.min(100,t)}%`)}}function Bo(e,a){const t=[{titulo:"Cobrado",valor:M(e.cobrado.monto_usd),detalle:`${e.cobrado.cantidad} pago(s) aprobados`,icono:"wallet",tono:"normal"},{titulo:"Saldos vencidos",valor:M(e.saldos_vencidos.monto_usd),detalle:`${e.saldos_vencidos.cantidad} cuota(s) vencida(s)`,icono:"alert",tono:"malo"},{titulo:"Cuentas pendientes del mes",valor:M(e.cuentas_pendientes.monto_usd),detalle:`${e.cuentas_pendientes.cantidad} cuota(s) por cobrar`,icono:"book",tono:"normal"},{titulo:"Referencias por validar",valor:String(e.referencias_por_validar),detalle:"en la bandeja de auditoría",icono:"inbox",tono:"normal"}];return s`
    <section aria-label="Indicadores del mes" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${t.map(Do)}</section>
    <section aria-label="Estudiantes por estado" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${[["Activos",a.activos],["Morosos",a.morosos],["Fuera de la Academia",a.fuera_de_la_academia],["Pendientes de validación",a.pendientes_validacion]].map(([o,i])=>s`<div class="${n.tarjeta} flex items-center justify-between gap-4 px-6 py-4"><span class="text-sm text-slate-700">${o}</span><strong class="text-lg text-slate-900">${i}</strong></div>`)}
    </section>
    <section class="${n.tarjeta} mt-6 p-6" aria-labelledby="t-barras">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="t-barras" class="text-base font-bold text-slate-900">Recaudación diaria</h2>
        <p class="text-sm text-slate-600">Cobrado del mes: <strong class="text-slate-900">${M(e.cobrado.monto_usd)}</strong></p>
      </div>
      ${No(e)}
    </section>`}async function me(e,a){const t=u("#tablero",HTMLElement,e.zona);a||f(t,s`<div class="h-48 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando tablero"></div>`);try{const[o,i]=await Promise.all([y.get("/facturacion/tablero",{periodo:g.periodo}),y.get("/estudiantes/resumen")]);if(!e.vigente())return;f(t,Bo(o,i)),Ro(t);const r=k("#actualizado",HTMLElement,e.zona);r&&(r.textContent=`Actualizado a las ${Va(new Date)}`)}catch(o){if(!e.vigente()||a&&!(o instanceof w))return;Oa(o,e)}}async function Fo(e){f(e.zona,s`${D("Dashboard","Tablero financiero en tiempo real",s`<div class="flex flex-wrap items-end gap-4">
        <div><label for="periodo" class="${n.etiqueta}">Período</label><input id="periodo" type="month" value="${g.periodo}" max="${na()}" class="${n.input}"></div>
        <p id="actualizado" class="pb-2 text-xs text-slate-600" aria-live="off"></p>
      </div>`)}<div id="tablero"></div>`),u("#periodo",HTMLInputElement,e.zona).addEventListener("change",a=>{const t=a.target instanceof HTMLInputElement?a.target.value:"";/^\d{4}-\d{2}$/.test(t)&&(P({periodo:t}),me(e,!1))}),await me(e,!0),se=window.setInterval(()=>{if(!e.vigente()){Pe();return}document.hidden||me(e,!0)},Co)}function Uo(e){return s`<tr>
    <td class="${n.td}"><button type="button" data-detalle="${e.id}" class="rounded-md text-left font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900" aria-label="Ver ficha de ${e.apellidos}, ${e.nombres}">${e.apellidos}, ${e.nombres}</button></td>
    <td class="${n.td}">${e.grado_solicitado}</td>
    <td class="${n.td}">${e.sede??"Sin sede"}</td>
    <td class="${n.td}">${e.representante}</td>
    <td class="${n.td}">${ee(e.estado_dinamico)}</td>
    <td class="${n.td} whitespace-nowrap">${M(e.deuda_vencida_usd)}</td>
    <td class="${n.td}"><div class="flex flex-wrap gap-2">
      <button type="button" data-alerta="preventiva" data-id="${e.id}" class="${v(n.btnPrimario,n.btnPeq)}">Preventiva</button>
      <button type="button" data-alerta="morosidad" data-id="${e.id}" class="${v(n.btnPrimario,n.btnPeq)}">Morosidad</button>
    </div></td>
  </tr>`}const Vo=e=>{if(typeof e!="object"||e===null)return!1;const a=e,t=a.paginacion;return Array.isArray(a.datos)&&typeof t=="object"&&t!==null&&typeof t.total=="number"};function Go(e,a){const t=k("#zona-filtro-sede",HTMLElement,e.zona);t&&(f(t,s`<label for="filtro-sede" class="${n.etiqueta}">Sede</label>
      <select id="filtro-sede" class="${n.input} min-h-10 min-w-48">
        <option value="" ${g.sedeFiltro===null?U("selected"):null}>Todas las sedes</option>
        ${a.map(o=>s`<option value="${o.id}" ${g.sedeFiltro===o.id?U("selected"):null}>${o.nombre}</option>`)}
      </select>`),u("#filtro-sede",HTMLSelectElement,t).addEventListener("change",o=>{const i=o.target instanceof HTMLSelectElement?Number(o.target.value):Number.NaN;P({sedeFiltro:Number.isInteger(i)&&i>0?i:null,paginaEstudiantes:1}),S("estudiantes")}))}async function Wo(e){const a=ue(g.usuario).tipo==="consolidado"?g.sedeFiltro:null,t={estado:g.filtroEstudiantes,pagina:g.paginaEstudiantes,limite:Ca,sede_id:a};await Ie({clave:`estudiantes:${g.filtroEstudiantes}:${g.paginaEstudiantes}:${a??"todas"}`,esValido:Vo,cargar:()=>y.pagina("/estudiantes",t),pintar:o=>Jo(e,o),vigente:e.vigente})}function Jo(e,a){const t=ue(g.usuario).tipo==="consolidado";f(e.zona,s`${D("Estudiantes",`${a.paginacion.total} resultado(s)`)}
    <div class="mb-4 flex flex-wrap items-end gap-4">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        ${Qe.map(o=>s`<button type="button" data-filtro="${o}" aria-pressed="${o===g.filtroEstudiantes}" class="${v(n.btnSecundario,n.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${o===""?"Todos":o}</button>`)}
      </div>
      ${t?s`<div id="zona-filtro-sede"></div>`:null}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table class="${n.tabla}">
        <caption class="sr-only">Listado de estudiantes</caption>
        <thead><tr><th scope="col" class="${n.th}">Estudiante</th><th scope="col" class="${n.th}">Nivel</th><th scope="col" class="${n.th}">Sede</th><th scope="col" class="${n.th}">Representante</th><th scope="col" class="${n.th}">Estado</th><th scope="col" class="${n.th}">Deuda vencida</th><th scope="col" class="${n.th}">Alertas WhatsApp</th></tr></thead>
        <tbody>${a.datos.length===0?s`<tr><td colspan="7" class="${n.td}">Sin resultados.</td></tr>`:a.datos.map(Uo)}</tbody>
      </table>
    </div>
    ${ja(a.paginacion)}`),t&&Ie({clave:he,esValido:$a,cargar:()=>y.get("/sedes"),pintar:o=>Go(e,o),vigente:e.vigente}).catch(()=>{});for(const o of C("[data-filtro]",HTMLButtonElement,e.zona))o.addEventListener("click",()=>{const i=o.dataset.filtro??"",r=Qe.find(l=>l===i)??"";P({filtroEstudiantes:r,paginaEstudiantes:1}),S("estudiantes")});qa(e.zona,o=>{P({paginaEstudiantes:Math.max(1,g.paginaEstudiantes+o)}),S("estudiantes")});for(const o of C("[data-detalle]",HTMLButtonElement,e.zona))o.addEventListener("click",()=>{const i=Number(o.dataset.detalle);Number.isInteger(i)&&i>0&&S(`estudiante:${i}`)});for(const o of C("[data-alerta]",HTMLButtonElement,e.zona))o.addEventListener("click",()=>{const i=o.dataset.alerta==="morosidad"?"morosidad":"preventiva";Xo(i,Number(o.dataset.id),o)})}async function Xo(e,a,t){try{const o=await I(t,()=>y.post(`/notificaciones/whatsapp/${e}/${a}`)),i=G({titulo:e==="morosidad"?"Alerta de morosidad":"Alerta preventiva",ancho:"lg",cuerpo:s`<p class="text-sm text-slate-600">${M(o.monto_usd)} · ${Le(o.monto_bs)} · tasa BCV ${Ja(o.tasa_bcv)}</p>
        <pre class="mt-4 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">${o.mensaje}</pre>
        <div id="alerta-resultado" class="mt-4"></div>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <a href="${oa(o.enlace_whatsapp,["https://wa.me/"])}" target="_blank" rel="noopener noreferrer" class="${v(n.btnPrimario)}">Abrir en WhatsApp</a>
          <button type="button" id="alerta-enviar" class="${v(n.btnSecundario)}">Enviar por API</button>
        </div>`}),r=u("#alerta-enviar",HTMLButtonElement,i.dialogo);r.addEventListener("click",()=>{const l=u("#alerta-resultado",HTMLElement,i.dialogo);I(r,()=>y.post(`/notificaciones/whatsapp/${e}/${a}`,{},{consulta:{enviar:!0}})).then(()=>f(l,x("ok","Mensaje enviado por la API de WhatsApp."))).catch(p=>f(l,x("bad",L(p))))})}catch(o){o instanceof w?O("Tu sesión expiró. Inicia sesión de nuevo."):T("bad",L(o))}}async function Yo(e,a){const t=Number(a);if(!Number.isInteger(t)||t<=0){f(e.zona,s`<div class="mx-auto max-w-2xl pt-8">${x("bad","El identificador del estudiante no es válido.")}</div>`);return}await $t({zona:e.zona,vigente:e.vigente,estudianteId:t,alVolver:()=>void S("estudiantes"),alSesionExpirada:()=>O("Tu sesión expiró. Inicia sesión de nuevo.")})}function Ko(e){const a=e.estado==="Por Validar";return s`<tr>
    <td class="${n.td} whitespace-nowrap">${q(e.declarado_en)}</td>
    <td class="${n.td}"><span class="font-medium text-slate-900">${e.estudiante}</span><br><span class="text-xs text-slate-600">${e.concepto} · vence ${W(e.fecha_vencimiento)}</span></td>
    <td class="${n.td}"><strong class="break-all">${e.referencia}</strong><br><span class="text-xs text-slate-600">${e.representante}</span></td>
    <td class="${n.td}">${V(e.metodo_pago)}</td>
    <td class="${n.td} whitespace-nowrap">${M(e.monto_usd)}<br><span class="text-xs text-slate-600">${Le(e.monto_bs)}</span></td>
    <td class="${n.td}">${a?s`<div class="flex flex-wrap gap-2">
          <button type="button" data-aprobar="${e.id}" class="${v(n.btnOk,n.btnPeq)}">${$("check","h-4 w-4")}<span>Aprobar</span></button>
          <button type="button" data-rechazar="${e.id}" class="${v(n.btnPeligro,n.btnPeq)}">${$("x","h-4 w-4")}<span>Rechazar</span></button>
        </div>`:s`${ee(e.estado)}${e.nota_revision?s`<p class="mt-1 max-w-xs break-words text-xs text-slate-600">${e.nota_revision}</p>`:null}`}</td>
  </tr>`}async function Zo(e){const a=await y.pagina("/facturacion/auditoria",{estado:g.filtroAuditoria,pagina:g.paginaAuditoria,limite:Ca});if(!e.vigente())return;const t=Q()?s`<button type="button" id="exportar" class="${v(n.btnSecundario)}">${$("down","h-4 w-4")}<span>Exportar histórico (.xlsx)</span></button>`:null;f(e.zona,s`${D("Bandeja de auditoría",`${a.paginacion.total} referencia(s) · ${g.filtroAuditoria}`,t)}
    <div id="auditoria-aviso" class="mb-4"></div>
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado de la referencia">
      ${ea.map(r=>s`<button type="button" data-filtro="${r}" aria-pressed="${r===g.filtroAuditoria}" class="${v(n.btnSecundario,n.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${r}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${n.tabla}">
        <caption class="sr-only">Referencias de pago declaradas</caption>
        <thead><tr><th scope="col" class="${n.th}">Declarada</th><th scope="col" class="${n.th}">Estudiante</th><th scope="col" class="${n.th}">Referencia</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Acción</th></tr></thead>
        <tbody>${a.datos.length===0?s`<tr><td colspan="6" class="${n.td}">Bandeja vacía.</td></tr>`:a.datos.map(Ko)}</tbody>
      </table>
    </div>
    ${ja(a.paginacion)}`);const o=u("#auditoria-aviso",HTMLElement,e.zona);for(const r of C("[data-filtro]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>{const l=r.dataset.filtro??"",p=ea.find(d=>d===l)??"Por Validar";P({filtroAuditoria:p,paginaAuditoria:1}),S("auditoria")});qa(e.zona,r=>{P({paginaAuditoria:Math.max(1,g.paginaAuditoria+r)}),S("auditoria")});const i=new Map(a.datos.map(r=>[r.id,r]));for(const r of C("[data-aprobar]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>void en(Number(r.dataset.aprobar),r,o));for(const r of C("[data-rechazar]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>{const l=i.get(Number(r.dataset.rechazar));l&&an(l)});k("#exportar",HTMLButtonElement,e.zona)?.addEventListener("click",r=>{const l=r.currentTarget instanceof HTMLButtonElement?r.currentTarget:null;l&&Qo(l,"/exportaciones/facturacion.xlsx","facturacion.xlsx",o)})}async function Qo(e,a,t,o){try{await I(e,()=>y.descargar(a,t))}catch(i){i instanceof w?O("Tu sesión expiró. Inicia sesión de nuevo."):f(o,x("bad",L(i)))}}function Da(e,a){return`${a} · estatus de pago del alumno: ${e.estatus_pago} · deuda vencida ${M(e.deuda_vencida_usd)}.`}async function en(e,a,t){try{const o=await I(a,()=>y.post(`/facturacion/auditoria/${e}/aprobar`,{}));T("ok",Da(o,"Referencia aprobada")),await S("auditoria")}catch(o){o instanceof w?O("Tu sesión expiró. Inicia sesión de nuevo."):f(t,x("bad",L(o)))}}function an(e){const a=G({titulo:"Rechazar referencia",cuerpo:s`<form id="form-rechazo" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700">Referencia <strong class="break-all">${e.referencia}</strong> · ${e.estudiante} · ${M(e.monto_usd)}</p>
      <div>
        <label for="nota-rechazo" class="${n.etiqueta}">Motivo del rechazo <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="nota-rechazo" name="nota" rows="4" maxlength="${pe}" required aria-describedby="nota-ayuda nota-error" class="${n.input}"></textarea>
        <p id="nota-ayuda" class="${n.ayuda}">Se guarda en el historial y se usa para avisar al representante. <span id="nota-contador">0/${pe}</span></p>
        <p id="nota-error" class="${n.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="rechazo-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${v(n.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${v(n.btnPeligro)}">${$("x","h-4 w-4")}<span>Rechazar referencia</span></button>
      </div>
    </form>`}),t=u("#form-rechazo",HTMLFormElement,a.dialogo),o=u("#nota-rechazo",HTMLTextAreaElement,a.dialogo),i=u("#nota-error",HTMLElement,a.dialogo),r=u("#nota-contador",HTMLElement,a.dialogo);o.addEventListener("input",()=>{r.textContent=`${o.value.length}/${pe}`,o.value.trim()!==""&&(i.hidden=!0,o.removeAttribute("aria-invalid"))}),u("[data-cancelar]",HTMLButtonElement,a.dialogo).addEventListener("click",a.cerrar),t.addEventListener("submit",l=>{l.preventDefault();const p=o.value.trim();if(p===""){i.textContent="Debes escribir el motivo del rechazo para continuar.",i.hidden=!1,o.setAttribute("aria-invalid","true"),o.focus();return}const d=u('button[type="submit"]',HTMLButtonElement,t);I(d,()=>y.post(`/facturacion/auditoria/${e.id}/rechazar`,{nota:p})).then(async c=>{a.cerrar(),T("ok",Da(c,"Referencia rechazada")),await S("auditoria")}).catch(c=>{if(c instanceof w){a.cerrar(),O("Tu sesión expiró. Inicia sesión de nuevo.");return}f(u("#rechazo-aviso",HTMLElement,a.dialogo),x("bad",L(c)))})}),o.focus()}function tn(e,a){const t=g.modulos.find(i=>i.codigo===a);if(!t){f(e.zona,x("bad","Módulo no encontrado."));return}if(t.codigo==="FACTURACION_MASIVA"){kt({zona:e.zona,vigente:e.vigente,modulo:t,puedeGenerar:Q(),puedeProbar:t.prueba_utilizada===!1&&fe(),alcance:g.usuario?.sede_id??null,alActivarPrueba:()=>aa(t),alBloquear:i=>void Ra(e,i),alSesionExpirada:()=>O("Tu sesión expiró. Inicia sesión de nuevo.")});return}if(t.bloqueado){f(e.zona,sa(t,t.prueba_utilizada===!1&&fe())),ra(e.zona,()=>aa(t));return}const o=t.en_prueba===!0&&t.expira_prueba_en?t.expira_prueba_en:null;f(e.zona,s`${D(t.nombre,t.descripcion)}
    <div class="${n.tarjeta} flex flex-col gap-4 p-6">
      ${o?x("warn",`Prueba gratuita vigente hasta el ${q(o)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba"):null}
      ${t.codigo==="MULTI_SEDE_PREMIUM"?s`${x("info","El Core Base incluye dos sedes (Sede Este y Sede Norte). Con este módulo puedes registrar la tercera sede y las siguientes desde la sección Sedes.","Expansión multi-sede habilitada")}
          ${fe()?s`<div><button type="button" id="ir-sedes" class="${v(n.btnPrimario,"min-h-10")}">${$("building","h-4 w-4")}<span>Ir a Sedes</span></button></div>`:null}`:x("info","El módulo está habilitado para esta academia. Su lógica se publicará en la Fase 2 (ruta reservada en el servidor).","Módulo habilitado")}
    </div>`),k("#ir-sedes",HTMLButtonElement,e.zona)?.addEventListener("click",()=>void S("sedes"))}const fe=()=>g.usuario?.rol==="admin"&&(g.usuario.sede_id??null)===null;function Na(e){const a=k(`[data-nav="premium:${e.codigo}"]`,HTMLElement);if(!a)return;const t=document.createElement("div");f(t,Me({id:`premium:${e.codigo}`,titulo:e.nombre,icono:Ia[e.codigo]??"chat",tooltip:e.bloqueado?`${e.nombre} · ${e.tooltip??be}`:e.nombre,bloqueado:e.bloqueado}));const o=t.firstElementChild;o&&a.replaceWith(o)}async function aa(e){await y.post("/premium/activar-prueba",{modulo:e.codigo});const a=await y.get("/premium/modulos");P({modulos:a});for(const t of a)Na(t);T("ok","Prueba gratuita de 15 días activada."),await S(`premium:${e.codigo}`)}async function Ra(e,a){try{const t=await y.get("/premium/modulos");P({modulos:t});for(const o of t)Na(o)}catch(t){if(t instanceof w){O("Tu sesión expiró. Inicia sesión de nuevo.");return}e.vigente()&&Ba(e.zona,a);return}e.vigente()&&await S(`premium:${a.modulo}`)}function Ba(e,a){const t=g.modulos.find(o=>o.codigo===a.modulo);f(e,ia({nombre:a.nombre,descripcion:t?.descripcion??"Este módulo forma parte de la Fase 2 del sistema.",precio_usd:a.precio_usd}))}ka();
