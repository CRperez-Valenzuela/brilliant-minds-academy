import{a as $,b,C as n,i as f,h as i,c as P,d as T,n as M,m as w,u as y,e as m,o as c,f as h,g as ne,j as R,k as J,l as B,p as Re,q as k,H as Ma,r as j,s as Be,t as La,v as N,w as $e,B as _,x as O,y as A,z as W,A as he,D as ie,E as Ta,F as Aa,G as Ca,I as Sa}from"./ui-C1IkeoV4.js";const de="Módulo Premium Deshabilitado";function z(e,t,a=null){return i`<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><h1 class="${n.titulo}">${e}</h1><p class="${n.subtitulo}">${t}</p></div>
    ${a}
  </header>`}function Ia(){const e=i`<div class="flex items-center gap-4 border-b border-slate-100 py-4"><div class="h-8 w-8 rounded-full bg-slate-200"></div><div class="h-4 flex-1 rounded bg-slate-200"></div><div class="h-4 w-24 rounded bg-slate-200"></div></div>`;return i`<div aria-hidden="true" class="pointer-events-none select-none p-6">
    <div class="mb-4 h-6 w-1/3 rounded bg-slate-300"></div>${e}${e}${e}${e}${e}
  </div>`}function Ha(e){return i`<div data-candado class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 p-6 backdrop-blur-md">
    <div role="region" aria-label="${de}" class="${n.tarjetaCristal} w-full max-w-md p-8 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bma-purpura text-white">${f("lock","h-6 w-6")}</span>
      <h2 class="mt-4 text-lg font-bold text-slate-900">${de}</h2>
      <p class="mt-1 text-sm font-semibold text-slate-800">${e.nombre}</p>
      <p class="mt-2 text-sm text-slate-700">${e.descripcion}</p>
      <p class="mt-4 text-2xl font-bold text-slate-900">${y(e.precio_usd)}</p>
      <p class="mt-1 text-xs text-slate-600">Pago único · solicítalo a Astra Digital Solutions</p>
    </div>
  </div>`}function Fe(e){return i`${z(e.nombre,e.descripcion)}
    <div class="${n.tarjeta} relative min-h-96 overflow-hidden">${Ia()}${Ha(e)}</div>`}function Ue(e,t){return i`${Fe(e)}${t?i`<div class="mt-6">${$("info",i`<p>Prueba este módulo sin costo durante 15 días. Al vencer se bloquea solo.</p>
        <button type="button" id="activar-prueba" class="${b(n.btnPrimario,"mt-3")}">${f("check","h-4 w-4")}<span>Activar prueba gratuita de 15 días</span></button>`,"Prueba gratuita disponible")}</div>`:null}`}function Ve(e,t){const a=P("#activar-prueba",HTMLButtonElement,e);a?.addEventListener("click",()=>{T(a,t).catch(o=>M("bad",w(o)))})}const U=300,Pa=["https://drive.google.com/","https://docs.google.com/"],oe="Sin registrar",_e={FOTO_CARNET:"Foto carnet",CEDULA_IDENTIDAD:"Cédula de identidad",ACTA_NACIMIENTO:"Acta de nacimiento"},za={MATRICULA:"Matrícula",MENSUALIDAD:"Mensualidad",OTRO:"Otro"};function ka(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function Ge(e){if(e===null||e==="")return null;const t=Be(e,Pa);return t==="#"?null:t}const We=e=>e!==null&&e.trim()!==""?e:oe;function x(e,t){const a=t instanceof Ma?t:We(t),o=t===null||typeof t=="string"&&t.trim()==="";return i`<div class="min-w-0"><dt class="text-xs font-semibold uppercase tracking-wide text-slate-600">${e}</dt>
    <dd class="mt-1 break-words text-sm ${o?"text-slate-600":"font-medium text-slate-900"}">${a}</dd></div>`}function Y(e,t,a){return i`<h2 id="${e}" class="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${f(a,"h-4 w-4")}</span>${t}</h2>`}function qa(e){const t=Re(e.fecha_nacimiento,ne());return i`<section class="${n.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-academico">
    ${Y("t-academico","Información académica","school")}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${x("Grado",e.grado_solicitado)}
      ${x("Cédula de identidad",e.cedula_identidad)}
      ${x("Fecha de nacimiento",`${B(e.fecha_nacimiento)}${t!==null?` · ${t} años`:""}`)}
      ${x("Lugar de nacimiento",e.lugar_nacimiento)}
      ${x("Lugar de estudio",e.lugar_estudio)}
      ${x("Grado de estudio",e.ultimo_grado_aprobado)}
      ${x("Horario",e.horario_preferido)}
      ${e.colegio_procedencia!==null&&e.colegio_procedencia.trim()!==""?x("Colegio de procedencia",e.colegio_procedencia):null}
      ${x("Inscrito",k(e.creado_en))}
    </dl>
  </section>`}function Da(e){const t=a=>a!==null&&a.trim()!==""?i`${j("Atención","warn")} <span class="ml-1">${a}</span>`:null;return i`<section class="${n.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-medico">
    ${Y("t-medico","Datos médicos","heart")}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${x("Tipo de sangre",e.tipo_sangre)}
      ${x("Alergias",t(e.alergias)??oe)}
      ${x("Condiciones médicas",t(e.condiciones_medicas)??oe)}
      ${x("Bajo tratamiento médico",e.bajo_tratamiento?t(e.tratamiento_explicacion??"Sí (sin explicación registrada)"):"No")}
      ${x("Medicamentos",e.medicamentos)}
      ${x("Contacto de emergencia",e.emergencia_nombre)}
      ${x("Teléfono de emergencia",e.emergencia_telefono)}
    </dl>
  </section>`}function ja(e){const t=Ge(e.drive_url);return i`<li class="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
    <span class="min-w-0"><span class="block truncate text-sm font-medium text-slate-900">${_e[e.tipo]}</span>
      <span class="block truncate text-xs text-slate-600">${e.nombre_archivo} · ${ka(e.tamano_bytes)}</span></span>
    ${t!==null?i`<a href="${t}" target="_blank" rel="noopener noreferrer" class="${b(n.btnSecundario,n.btnPeq)}" aria-label="Abrir ${_e[e.tipo]} en Google Drive">Abrir</a>`:j("Sin enlace","neutral")}
  </li>`}function Oa(e){const t=Ge(e.drive_folder_url);return i`<section class="${n.tarjeta} p-6" aria-labelledby="t-drive">
    ${Y("t-drive","Expediente en Google Drive","folder")}
    ${t!==null?i`<a href="${t}" target="_blank" rel="noopener noreferrer" class="${b(n.btnPrimario,"w-full")}">${f("folder","h-4 w-4")}<span>Abrir expediente digitalizado</span></a>`:$("info","Este estudiante aún no tiene una carpeta de expediente en Google Drive.")}
    ${e.drive_folder_id!==null?i`<p class="${n.ayuda}">ID de carpeta: <span class="break-all font-mono">${e.drive_folder_id}</span></p>`:null}
    ${e.documentos.length>0?i`<ul class="mt-4" aria-label="Documentos digitalizados">${e.documentos.map(ja)}</ul>`:i`<p class="mt-4 text-sm text-slate-600">Sin documentos digitalizados.</p>`}
  </section>`}function Na(e){return i`<section class="${n.tarjeta} p-6" aria-labelledby="t-representante">
    ${Y("t-representante","Representante principal","users")}
    <dl class="grid gap-4">
      ${x("Nombre",`${e.rep_nombres} ${e.rep_apellidos}`)}
      ${x("Cédula",e.rep_cedula)}
      ${x("Correo",e.rep_email)}
      ${x("Teléfono (WhatsApp de cobro)",e.rep_telefono)}
    </dl>
  </section>`}const Me={madre:"Madre",padre:"Padre"};function Xe(e,t,a){return e[`${t}_${a}`]}const Ra=e=>e===null||String(e).trim()===""?null:String(e);function Ba(e,t){const a=Xe(e,t,"cedula");return typeof a=="string"&&a.trim()!==""&&a.trim().toUpperCase()===e.rep_cedula.trim().toUpperCase()}function Le(e,t){const a=d=>Ra(Xe(e,t,d)),o=["nombres","apellidos","cedula","edad","fecha_nacimiento","direccion","telefono_fijo","telefono_movil","email"].some(d=>a(d)!==null),s=[a("nombres"),a("apellidos")].filter(d=>d!==null).join(" "),r=a("fecha_nacimiento"),l=r!==null?Re(r,ne()):null,p=r!==null?`${B(r)}${l!==null?` · ${l} años`:""}`:a("edad")!==null?`${a("edad")} años`:null;return i`<article class="min-w-0 rounded-lg border border-slate-200 p-4" aria-label="${Me[t]}">
    <h3 class="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">${Me[t]}${Ba(e,t)?j("Representante principal","info"):null}</h3>
    ${o?i`<dl class="grid gap-3">
          ${x("Nombre",s)}
          ${x("Cédula",a("cedula"))}
          ${x("Nacimiento",p)}
          ${x("Dirección de habitación",a("direccion"))}
          ${x("Teléfono fijo",a("telefono_fijo"))}
          ${x("Teléfono móvil",a("telefono_movil"))}
          ${x("Correo",a("email"))}
        </dl>`:i`<p class="text-sm text-slate-600">No se registró en la planilla.</p>`}
  </article>`}function Fa(e){return i`<li class="border-b border-slate-100 py-2 last:border-0">
    <span class="block text-sm font-medium text-slate-900">${e.nombre}</span>
    <span class="block text-xs text-slate-600">${e.parentesco} · ${e.telefono!==""?`+${e.telefono}`:oe}</span>
  </li>`}function Ua(e){return i`<article class="min-w-0 rounded-lg border border-slate-200 p-4" aria-label="Personas autorizadas para retirar al menor">
    <h3 class="mb-3 text-sm font-bold text-slate-900">Personas autorizadas para retirar al menor</h3>
    ${e.personas_autorizadas.length>0?i`<ul>${e.personas_autorizadas.map(Fa)}</ul>`:i`<p class="text-sm text-slate-600">Sin personas autorizadas registradas.</p>`}
  </article>`}function Va(e){return i`<section class="${n.tarjeta} p-6 lg:col-span-3" aria-labelledby="t-familia">
    ${Y("t-familia","Familia y autorizados (planilla oficial)","users")}
    <div class="grid gap-4 md:grid-cols-3">
      ${Le(e,"madre")}
      ${Le(e,"padre")}
      ${Ua(e)}
    </div>
  </section>`}function Ga(e){const t=e.estado==="Pendiente"||e.estado==="En Revisión";return i`<tr>
    <td class="${n.td}"><span class="font-medium text-slate-900">${e.concepto}</span></td>
    <td class="${n.td}">${za[e.tipo]}</td>
    <td class="${n.td} whitespace-nowrap">${B(e.fecha_vencimiento)}${t&&La(e.fecha_vencimiento)?i` ${j("Vencida","bad")}`:null}</td>
    <td class="${n.td} whitespace-nowrap">${y(e.monto_usd)}</td>
    <td class="${n.td}">${J(e.estado)}</td>
  </tr>`}function Wa(e,t){const a=t.get(e.cuota_id);return i`<tr>
    <td class="${n.td}"><span class="break-all font-medium text-slate-900">${e.referencia}</span>${a!==void 0?i`<span class="block text-xs text-slate-600">${a}</span>`:null}</td>
    <td class="${n.td}">${N(e.metodo_pago)}</td>
    <td class="${n.td} whitespace-nowrap">${k(e.declarado_en)}</td>
    <td class="${n.td} whitespace-nowrap">${y(e.monto_usd)}<span class="block text-xs text-slate-600">${$e(e.monto_bs)}</span></td>
    <td class="${n.td}">${J(e.estado)}</td>
  </tr>`}function Xa(e){return i`<section class="${n.tarjeta} overflow-hidden" aria-labelledby="t-cuotas">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-cuotas" class="text-base font-bold text-slate-900">Histórico de cuotas</h2>
      <span class="text-xs text-slate-600">${e.cuotas.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${n.tabla}">
        <caption class="sr-only">Histórico de cuotas del estudiante</caption>
        <thead><tr><th scope="col" class="${n.th}">Concepto</th><th scope="col" class="${n.th}">Tipo</th><th scope="col" class="${n.th}">Vencimiento</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Estado</th></tr></thead>
        <tbody>${e.cuotas.length===0?i`<tr><td colspan="5" class="${n.td}">Este estudiante no tiene cuotas.</td></tr>`:e.cuotas.map(Ga)}</tbody>
      </table>
    </div>
  </section>`}function Ja(e){const t=new Map(e.cuotas.map(a=>[a.id,a.concepto]));return i`<section class="${n.tarjeta} overflow-hidden" aria-labelledby="t-pagos">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-pagos" class="text-base font-bold text-slate-900">Pagos declarados por el representante</h2>
      <span class="text-xs text-slate-600">${e.pagos.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${n.tabla}">
        <caption class="sr-only">Pagos declarados por el representante</caption>
        <thead><tr><th scope="col" class="${n.th}">Referencia</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Declarado</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Estado</th></tr></thead>
        <tbody>${e.pagos.length===0?i`<tr><td colspan="5" class="${n.td}">El representante aún no ha declarado pagos.</td></tr>`:e.pagos.map(a=>Wa(a,t))}</tbody>
      </table>
    </div>
  </section>`}function Ya(e){const t=e.estatus_academico==="Fuera de la Academia";return i`<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <button type="button" data-accion="volver" class="${b(n.btnSecundario,n.btnPeq,"mb-3")}">${f("back","h-4 w-4")}<span>Volver al listado</span></button>
      <h1 id="ficha-titulo" tabindex="-1" class="${n.titulo} break-words">${e.apellidos}, ${e.nombres}</h1>
      <p class="${n.subtitulo} flex flex-wrap items-center gap-2">${J(e.estado_dinamico)}<span>${e.grado_solicitado}</span>
        ${e.deuda_vencida_usd>0?i`<span class="font-semibold text-bma-coral-oscuro">Deuda vencida: ${y(e.deuda_vencida_usd)}</span>`:null}</p>
    </div>
    <div class="flex flex-wrap gap-2" role="group" aria-label="Acciones sobre el estudiante">
      ${t?i`<button type="button" data-accion="reactivar" class="${b(n.btnOk)}">${f("refresh","h-4 w-4")}<span>Reactivar Estudiante</span></button>`:i`<button type="button" data-accion="retirar" class="${b(n.btnPeligro)}">${f("logout","h-4 w-4")}<span>Retirar Estudiante</span></button>`}
    </div>
  </header>
  ${t?i`<div class="mb-6">${$("warn",i`<p>Retirado el <strong>${e.fecha_retiro!==null?B(e.fecha_retiro):"fecha no registrada"}</strong>.</p>
        <p class="mt-1">Motivo: ${We(e.motivo_retiro)}</p>
        <p class="mt-1">Sus cuotas pendientes fueron anuladas al retirarlo; reactivarlo no las restaura.</p>`,"Fuera de la Academia")}</div>`:null}`}function Za(e){return i`<div id="ficha-raiz">
    ${Ya(e)}
    <div class="grid gap-6 lg:grid-cols-3">
      ${qa(e)}
      ${Na(e)}
      ${Da(e)}
      ${Oa(e)}
      ${Va(e)}
    </div>
    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      ${Xa(e)}
      ${Ja(e)}
    </div>
  </div>`}function Te(e,t,a){const o={},s=e.trim();return s===""?o.motivo="Debes escribir el motivo del retiro para continuar.":s.length>U&&(o.motivo=`El motivo admite hasta ${U} caracteres.`),/^\d{4}-\d{2}-\d{2}$/.test(t)?t>a&&(o.fecha="La fecha de retiro no puede ser futura."):o.fecha="Elige la fecha del retiro.",o}function K(e,t,a){if(a===void 0){t.hidden=!0,e.removeAttribute("aria-invalid");return}t.textContent=a,t.hidden=!1,e.setAttribute("aria-invalid","true")}function Ka(e,t){const a=ne(),o=R({titulo:"Retirar estudiante",cuerpo:i`<form id="form-retiro" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700"><strong>${e.apellidos}, ${e.nombres}</strong> pasará a «Fuera de la Academia» y sus cuotas pendientes se anularán.</p>
      <div>
        <label for="retiro-motivo" class="${n.etiqueta}">Motivo del retiro <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="retiro-motivo" name="motivo" rows="4" maxlength="${U}" required aria-describedby="retiro-ayuda retiro-motivo-error" class="${n.input}"></textarea>
        <p id="retiro-ayuda" class="${n.ayuda}">Obligatorio. Queda en el historial del estudiante. <span id="retiro-contador">0/${U}</span></p>
        <p id="retiro-motivo-error" class="${n.errorCampo}" role="alert" hidden></p>
      </div>
      <div>
        <label for="retiro-fecha" class="${n.etiqueta}">Fecha del retiro <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="retiro-fecha" name="fecha_retiro" type="date" required value="${a}" max="${a}" aria-describedby="retiro-fecha-error" class="${n.input} sm:max-w-xs">
        <p id="retiro-fecha-error" class="${n.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="retiro-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${b(n.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${b(n.btnPeligro)}">${f("logout","h-4 w-4")}<span>Retirar estudiante</span></button>
      </div>
    </form>`}),s=c("#form-retiro",HTMLFormElement,o.dialogo),r=c("#retiro-motivo",HTMLTextAreaElement,o.dialogo),l=c("#retiro-fecha",HTMLInputElement,o.dialogo),p=c("#retiro-motivo-error",HTMLElement,o.dialogo),d=c("#retiro-fecha-error",HTMLElement,o.dialogo),u=c("#retiro-contador",HTMLElement,o.dialogo);r.addEventListener("input",()=>{u.textContent=`${r.value.length}/${U}`,r.value.trim()!==""&&K(r,p,void 0)}),l.addEventListener("input",()=>K(l,d,Te(r.value,l.value,a).fecha)),c("[data-cancelar]",HTMLButtonElement,o.dialogo).addEventListener("click",o.cerrar),s.addEventListener("submit",g=>{g.preventDefault();const E=Te(r.value,l.value,a);K(r,p,E.motivo),K(l,d,E.fecha),E.motivo!==void 0?r.focus():E.fecha!==void 0&&l.focus(),!(E.motivo!==void 0||E.fecha!==void 0)&&t(o,{motivo:r.value.trim(),fecha_retiro:l.value},c('button[type="submit"]',HTMLButtonElement,s))}),r.focus()}function Qa(e,t){const a=R({titulo:"Reactivar estudiante",cuerpo:i`<div class="flex flex-col gap-4">
      <p class="text-sm text-slate-700"><strong>${e.apellidos}, ${e.nombres}</strong> volverá a «Activo». Las cuotas que se anularon al retirarlo no se restauran: genera las que correspondan desde Facturación.</p>
      <div id="reactivar-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${b(n.btnSecundario)}">Cancelar</button>
        <button type="button" data-confirmar class="${b(n.btnOk)}">${f("check","h-4 w-4")}<span>Reactivar estudiante</span></button>
      </div>
    </div>`});c("[data-cancelar]",HTMLButtonElement,a.dialogo).addEventListener("click",a.cerrar);const o=c("[data-confirmar]",HTMLButtonElement,a.dialogo);o.addEventListener("click",()=>t(a,o)),o.focus()}async function et(e){const t=()=>h.get(`/estudiantes/${e.estudianteId}`);let a=await t();if(!e.vigente())return;m(e.zona,i`<div id="ficha-contenedor"></div>`);const o=c("#ficha-contenedor",HTMLElement,e.zona),s=()=>{m(o,Za(a)),P("#ficha-titulo",HTMLElement,o)?.focus({preventScroll:!0})},r=async()=>{try{a=await t()}catch(u){u instanceof _?e.alSesionExpirada():M("bad",`La acción se realizó, pero no se pudo actualizar la ficha: ${w(u)}`);return}e.vigente()&&s()},l=(u,g,E)=>{if(u instanceof _){g.cerrar(),e.alSesionExpirada();return}m(c(E,HTMLElement,g.dialogo),$("bad",w(u)))},p=(u,g,E)=>{T(E,()=>h.post(`/estudiantes/${e.estudianteId}/retirar`,g)).then(async()=>{u.cerrar(),M("ok",`${a.nombres} ${a.apellidos} fue retirado de la academia.`),await r()}).catch(S=>l(S,u,"#retiro-aviso"))},d=(u,g)=>{T(g,()=>h.post(`/estudiantes/${e.estudianteId}/reactivar`)).then(async()=>{u.cerrar(),M("ok",`${a.nombres} ${a.apellidos} fue reactivado.`),await r()}).catch(E=>l(E,u,"#reactivar-aviso"))};o.addEventListener("click",u=>{const g=u.target instanceof Element?u.target.closest("[data-accion]"):null;if(!(g instanceof HTMLButtonElement))return;const E=g.dataset.accion;E==="volver"?e.alVolver():E==="retirar"?Ka(a,p):E==="reactivar"&&Qa(a,d)}),s()}const D=(e,t)=>e[t]??"",ce=/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/,Ae=/^(?:\d{6,20}|[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,})$/,at=/^Banco (\d{4}) · Tel (0\d{10}) · Cédula\/RIF ([VEJGP]\d{5,10})$/,Ce=(e,t,a)=>({id:e,etiqueta:t,tipo:"email",inputmode:"email",placeholder:"pagos@academia.com",ayuda:a,error:"Escribe un correo válido, por ejemplo pagos@academia.com.",patron:ce,normalizar:o=>o.trim().toLowerCase()}),xe={ZELLE:{campos:[Ce("correo","Correo de Zelle","Correo con el que la academia recibe pagos por Zelle.")],componer:e=>D(e,"correo"),interpretar:e=>ce.test(e)?{correo:e}:null},PAYPAL:{campos:[Ce("correo","Correo de PayPal","Cuenta de PayPal que recibe los pagos.")],componer:e=>D(e,"correo"),interpretar:e=>ce.test(e)?{correo:e}:null},BINANCE:{campos:[{id:"idBinance",etiqueta:"Pay ID o correo de Binance",tipo:"text",inputmode:"text",placeholder:"123456789",ayuda:"Pay ID numérico (6 a 20 dígitos) o el correo de la cuenta Binance.",error:"Escribe un Pay ID numérico de 6 a 20 dígitos o un correo válido.",patron:Ae,normalizar:e=>e.trim().toLowerCase()}],componer:e=>D(e,"idBinance"),interpretar:e=>Ae.test(e)?{idBinance:e}:null},PAGO_MOVIL:{campos:[{id:"banco",etiqueta:"Código del banco",tipo:"text",inputmode:"numeric",placeholder:"0102",ayuda:"Cuatro dígitos (0102 = Banco de Venezuela, 0105 = Mercantil…).",error:"El código del banco son exactamente 4 dígitos.",patron:/^\d{4}$/,normalizar:e=>e.trim()},{id:"telefono",etiqueta:"Teléfono afiliado",tipo:"text",inputmode:"tel",placeholder:"04141234567",ayuda:"11 dígitos, empezando por 0 (sin espacios ni guiones).",error:"Escribe 11 dígitos empezando por 0, por ejemplo 04141234567.",patron:/^0\d{10}$/,normalizar:e=>e.replace(/[\s.-]/g,"")},{id:"documento",etiqueta:"Cédula o RIF del titular",tipo:"text",inputmode:"text",placeholder:"V12345678",ayuda:"Letra (V, E, J, G o P) seguida de 5 a 10 dígitos.",error:"Escribe la letra (V, E, J, G o P) y de 5 a 10 dígitos, por ejemplo V12345678.",patron:/^[VEJGP]\d{5,10}$/,normalizar:e=>e.replace(/[\s.-]/g,"").toUpperCase()}],componer:e=>`Banco ${D(e,"banco")} · Tel ${D(e,"telefono")} · Cédula/RIF ${D(e,"documento")}`,interpretar:e=>{const t=at.exec(e);return t?{banco:t[1]??"",telefono:t[2]??"",documento:t[3]??""}:null}}},Ee=["ZELLE","BINANCE","PAYPAL","PAGO_MOVIL"],ue=150,Je=99999999,Ye=e=>Ee.some(t=>t===e);function tt(e,t){const a={},o=e.titular.trim();o===""?a.titular="El titular es obligatorio.":o.length>ue&&(a.titular=`Máximo ${ue} caracteres.`);let s=null;if(e.ambito==="")a.ambito="Elige a qué sede aplica la cuenta o márcala como común a todas.";else if(e.ambito!=="comun"){const d=Number(e.ambito);Number.isInteger(d)&&t.some(u=>u.id===d)?s=d:a.ambito="La sede elegida no existe. Recarga la página."}const r=e.metodo;if(!Ye(r))return a.metodo="Elige un método de pago.",{errores:a,cuerpo:null};const l=xe[r],p={};for(const d of l.campos){const u=d.normalizar(D(e.campos,d.id));p[d.id]=u,d.patron.test(u)||(a[`campo_${d.id}`]=d.error)}return Object.keys(a).length>0?{errores:a,cuerpo:null}:{errores:a,cuerpo:{metodo:r,titular:o,detalle:l.componer(p),activa:e.activa,sede_id:s}}}function Ze(e){const t=e.trim().replace(",",".");if(!/^\d+(?:\.\d{1,2})?$/.test(t))return null;const a=Number(t);return Number.isFinite(a)&&a>0&&a<=Je?a:null}const ot=e=>e?.rol==="admin"&&(e.sede_id??null)===null;async function Se(){const[e,t]=await Promise.all([h.get("/configuracion"),h.get("/sedes")]);return{matricula_usd:e.matricula_usd,cuentas:e.cuentas,sedes:t}}const Ke=(e,t)=>{if(e===null)return"Común (todas las sedes)";const a=t.find(o=>o.id===e);return a?a.nombre:`Sede #${e}`};function nt(e,t){const a=o=>`${o.sede_id===null?"0":"1"}|${Ke(o.sede_id,t)}|${Ee.indexOf(o.metodo)}|${String(o.id).padStart(10,"0")}`;return[...e].sort((o,s)=>a(o).localeCompare(a(s),"es"))}const Q=(e,t)=>{const a=e.get(t);return typeof a=="string"?a:""};function V(e,t){for(const a of A("[data-error]",HTMLElement,e)){const o=t[a.dataset.error??""]??"";a.textContent=o,a.hidden=o===""}for(const a of A("[name]",HTMLElement,e))(t[a.getAttribute("name")??""]??"")!==""?a.setAttribute("aria-invalid","true"):a.removeAttribute("aria-invalid");P('[aria-invalid="true"]',HTMLElement,e)?.focus()}function Qe(e){const t={titular:"titular",sede_id:"ambito",metodo:"metodo",detalle:"general",matricula_usd:"matricula_usd"},a={};for(const o of e.camposInvalidos())a[t[o.campo]??"general"]=o.mensaje;return Object.keys(a).length===0&&(a.general=e.message),a}function it(e,t){if(e.length===0)return $("warn","Todavía no hay cuentas de cobro. Mientras no exista ninguna activa, las familias verán «Consulta los datos de pago con la administración».");const a=nt(e,t).map(o=>i`<tr>
      <td class="${n.td}">${Ke(o.sede_id,t)}</td>
      <td class="${n.td} font-semibold">${N(o.metodo)}</td>
      <td class="${n.td}">${o.titular}</td>
      <td class="${n.td} break-words">${o.detalle}</td>
      <td class="${n.td}">${o.activa?j("Activa","ok"):j("Inactiva","neutral")}</td>
      <td class="${n.td}">
        <div class="flex flex-wrap gap-2">
          <button type="button" data-accion="editar" data-id="${o.id}" class="${b(n.btnSecundario,n.btnPeq)}" aria-label="Editar la cuenta de ${N(o.metodo)} de ${o.titular}">Editar</button>
          <button type="button" data-accion="alternar" data-id="${o.id}" class="${b(n.btnSecundario,n.btnPeq)}" aria-label="${o.activa?"Desactivar":"Activar"} la cuenta de ${N(o.metodo)} de ${o.titular}">${o.activa?"Desactivar":"Activar"}</button>
        </div>
      </td>
    </tr>`);return i`<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/95">
    <table class="${n.tabla}">
      <caption class="sr-only">Cuentas de cobro de la academia</caption>
      <thead><tr>
        <th scope="col" class="${n.th}">Ámbito</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Titular</th>
        <th scope="col" class="${n.th}">Datos públicos</th><th scope="col" class="${n.th}">Estado</th><th scope="col" class="${n.th}">Acciones</th>
      </tr></thead>
      <tbody>${a}</tbody>
    </table>
  </div>`}function st(e){const t=e.matricula_usd<=0;return i`<div id="config-raiz">
    <header class="mb-6">
      <h1 class="${n.titulo}">Configuración de cobro</h1>
      <p class="${n.subtitulo}">Costo de la matrícula y cuentas donde las familias depositan.</p>
    </header>

    <section class="${n.tarjeta} mb-6 p-6" aria-labelledby="t-matricula">
      <h2 id="t-matricula" class="text-base font-bold text-slate-900">Costo de la matrícula</h2>
      <p class="${n.ayuda}">Monto único en dólares para todas las sedes. Se muestra en el formulario público de admisiones junto a su equivalente en bolívares a la tasa BCV.</p>
      <div class="mt-4">${t?$("warn","La matrícula aún no está configurada: las inscripciones públicas permanecen bloqueadas hasta que fijes un monto."):$("info",i`Matrícula vigente: <strong>${y(e.matricula_usd)}</strong>.`)}</div>
      <form id="form-matricula" novalidate class="mt-4 grid gap-4 sm:grid-cols-3 sm:items-start">
        <div class="sm:col-span-1">
          <label for="f-matricula" class="${n.etiqueta}">Monto en USD</label>
          <input id="f-matricula" name="matricula_usd" type="text" inputmode="decimal" autocomplete="off" required placeholder="120.00"
            value="${t?"":e.matricula_usd.toFixed(2)}" class="${n.input}" aria-describedby="ay-matricula er-matricula">
          <p id="ay-matricula" class="${n.ayuda}">Hasta dos decimales. Ejemplo: 120.00</p>
          <p id="er-matricula" data-error="matricula_usd" class="${n.errorCampo}" hidden></p>
        </div>
        <div class="flex items-end sm:col-span-2 sm:pt-6">
          <button type="submit" class="${b(n.btnPrimario)}">${f("check","h-4 w-4")}<span>Guardar matrícula</span></button>
        </div>
      </form>
    </section>

    <section class="${n.tarjeta} p-6" aria-labelledby="t-cuentas">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 id="t-cuentas" class="text-base font-bold text-slate-900">Cuentas de cobro</h2>
          <p class="${n.ayuda}">Datos públicos de Zelle, Binance Pay, PayPal y Pago Móvil. Nunca registres contraseñas ni claves aquí: esta información se muestra a las familias.</p>
        </div>
        <button type="button" data-accion="nueva" class="${b(n.btnPrimario)}">${f("wallet","h-4 w-4")}<span>Agregar cuenta</span></button>
      </div>
      ${it(e.cuentas,e.sedes)}
      <div class="mt-4">${$("info","Una familia ve las cuentas activas comunes más las de su sede. Si entra sin enlace de invitación, solo ve las comunes.")}</div>
    </section>
  </div>`}async function rt(e){if(!ot(e.usuario)){m(e.zona,i`<div class="mx-auto max-w-2xl pt-8">${$("info","La configuración de cobro es del acceso consolidado (administrador sin sede asignada). Pídele a esa persona que actualice la matrícula o las cuentas.","Sección restringida")}</div>`);return}const t=await Se();if(!e.vigente())return;let a=t;const o=()=>{m(e.zona,st(a)),r()},s=async()=>{a=await Se(),e.vigente()&&o()},r=()=>{const l=c("#config-raiz",HTMLElement,e.zona);c("#form-matricula",HTMLFormElement,l).addEventListener("submit",p=>{p.preventDefault(),lt(c("#form-matricula",HTMLFormElement,l),d=>{a={...a,matricula_usd:d},o()})}),l.addEventListener("click",p=>{const d=p.target instanceof Element?p.target.closest("[data-accion]"):null;if(!(d instanceof HTMLButtonElement))return;const u=d.dataset.accion,g=a.cuentas.find(E=>E.id===Number(d.dataset.id));u==="nueva"?Ie(null,a.sedes,s):u==="editar"&&g?Ie(g,a.sedes,s):u==="alternar"&&g&&dt(d,g,s)})};o()}async function lt(e,t){const a=Ze(Q(new FormData(e),"matricula_usd"));if(a===null){V(e,{matricula_usd:`Escribe un monto mayor que 0 y hasta ${Je.toLocaleString("en-US")}, con máximo 2 decimales.`});return}V(e,{});try{const o=await T(c('button[type="submit"]',HTMLButtonElement,e),()=>h.put("/configuracion/matricula",{matricula_usd:a}));M("ok",`Matrícula actualizada a ${y(o.matricula_usd)}.`),t(o.matricula_usd)}catch(o){if(o instanceof _){window.location.reload();return}V(e,o instanceof O?Qe(o):{matricula_usd:w(o)})}}async function dt(e,t,a){const o={metodo:t.metodo,titular:t.titular,detalle:t.detalle,activa:!t.activa,sede_id:t.sede_id};try{await T(e,()=>h.put(`/configuracion/cuentas/${t.id}`,o)),M("ok",o.activa?"Cuenta activada: ya la ven las familias.":"Cuenta desactivada: las familias ya no la ven."),await a()}catch(s){if(s instanceof _){window.location.reload();return}M("bad",w(s))}}function ea(e,t){return Ye(e)?i`${xe[e].campos.map(a=>i`<div>
      <label for="f-campo_${a.id}" class="${n.etiqueta}">${a.etiqueta}</label>
      <input id="f-campo_${a.id}" name="campo_${a.id}" type="${a.tipo}" inputmode="${a.inputmode}" autocomplete="off" required
        placeholder="${a.placeholder}" value="${D(t,a.id)}" class="${n.input}" aria-describedby="ay-${a.id} er-${a.id}">
      <p id="ay-${a.id}" class="${n.ayuda}">${a.ayuda}</p>
      <p id="er-${a.id}" data-error="campo_${a.id}" class="${n.errorCampo}" hidden></p>
    </div>`)}`:i`<p class="${n.ayuda}">Elige un método para ver los datos que se piden.</p>`}function ct(e,t,a,o){const s=e?.metodo??"",r=e===null?"":e.sede_id===null?"comun":String(e.sede_id);return i`<form id="form-cuenta" novalidate class="grid gap-4">
    <div data-error="general" hidden></div>
    ${o===null?null:$("warn",i`El dato guardado no sigue el formato estructurado: <span class="font-semibold">${o}</span>. Complétalo con los campos de abajo para reemplazarlo.`,"Datos anteriores")}
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="f-metodo" class="${n.etiqueta}">Método de pago</label>
        <select id="f-metodo" name="metodo" required class="${n.input}" aria-describedby="er-metodo">
          <option value="" ${s===""?"selected":""} disabled>Selecciona un método…</option>
          ${Ee.map(l=>i`<option value="${l}" ${l===s?"selected":""}>${N(l)}</option>`)}
        </select>
        <p id="er-metodo" data-error="metodo" class="${n.errorCampo}" hidden></p>
      </div>
      <div>
        <label for="f-ambito" class="${n.etiqueta}">Sede a la que aplica</label>
        <select id="f-ambito" name="ambito" required class="${n.input}" aria-describedby="ay-ambito er-ambito">
          <option value="" ${r===""?"selected":""} disabled>Selecciona el ámbito…</option>
          <option value="comun" ${r==="comun"?"selected":""}>Común (todas las sedes)</option>
          ${t.map(l=>i`<option value="${l.id}" ${String(l.id)===r?"selected":""}>${l.nombre}${l.activa?"":" (inactiva)"}</option>`)}
        </select>
        <p id="ay-ambito" class="${n.ayuda}">Las cuentas de una sede solo las ven las familias de esa sede.</p>
        <p id="er-ambito" data-error="ambito" class="${n.errorCampo}" hidden></p>
      </div>
    </div>
    <div>
      <label for="f-titular" class="${n.etiqueta}">Titular de la cuenta</label>
      <input id="f-titular" name="titular" type="text" maxlength="${ue}" autocomplete="off" required value="${e?.titular??""}"
        class="${n.input}" aria-describedby="er-titular">
      <p id="er-titular" data-error="titular" class="${n.errorCampo}" hidden></p>
    </div>
    <div id="campos-metodo" class="grid gap-4" aria-live="polite">${ea(s,a)}</div>
    <label class="flex items-center gap-3 text-sm font-medium text-slate-800">
      <input type="checkbox" name="activa" ${e===null||e.activa?"checked":""} class="h-4 w-4 rounded border-slate-300">
      <span>Cuenta activa (visible para las familias)</span>
    </label>
    <div class="flex flex-wrap justify-end gap-3">
      <button type="button" data-cancelar class="${b(n.btnSecundario)}">Cancelar</button>
      <button type="submit" class="${b(n.btnPrimario)}">${f("check","h-4 w-4")}<span>${e===null?"Agregar cuenta":"Guardar cambios"}</span></button>
    </div>
  </form>`}function ut(e){const t=new FormData(e),a={};for(const[o,s]of t.entries())o.startsWith("campo_")&&typeof s=="string"&&(a[o.slice(6)]=s);return{metodo:Q(t,"metodo"),titular:Q(t,"titular"),ambito:Q(t,"ambito"),activa:t.get("activa")!==null,campos:a}}function Ie(e,t,a){const o=e?xe[e.metodo].interpretar(e.detalle):null,s=e!==null&&o===null?e.detalle:null,r=R({titulo:e===null?"Agregar cuenta de cobro":"Editar cuenta de cobro",ancho:"lg",cuerpo:ct(e,t,o??{},s)}),l=c("#form-cuenta",HTMLFormElement,r.dialogo);c("#f-metodo",HTMLSelectElement,l).addEventListener("change",p=>{const d=p.target instanceof HTMLSelectElement?p.target.value:"";m(c("#campos-metodo",HTMLElement,l),ea(d,e!==null&&e.metodo===d&&o?o:{}))}),c("[data-cancelar]",HTMLButtonElement,l).addEventListener("click",()=>r.cerrar()),l.addEventListener("submit",p=>{p.preventDefault(),pt(l,e,t,r,a)}),c("#f-metodo",HTMLSelectElement,l).focus()}async function pt(e,t,a,o,s){const r=tt(ut(e),a);V(e,r.errores);const l=c('[data-error="general"]',HTMLElement,e);if(l.hidden=!0,r.cuerpo===null)return;const p=r.cuerpo;try{await T(c('button[type="submit"]',HTMLButtonElement,e),()=>t===null?h.post("/configuracion/cuentas",p):h.put(`/configuracion/cuentas/${t.id}`,p)),o.cerrar(),M("ok",t===null?"Cuenta agregada.":"Cuenta actualizada."),await s()}catch(d){if(d instanceof _){window.location.reload();return}const u=d instanceof O?Qe(d):{general:w(d)},g=u.general;V(e,{...u,general:""}),g&&(l.hidden=!1,m(l,$("bad",g)))}}const pe=150;function He(e,t){const a={},o=e.concepto.trim();o===""?a.concepto="Escribe el concepto, por ejemplo «Mensualidad Noviembre 2026».":o.length>pe&&(a.concepto=`El concepto admite hasta ${pe} caracteres.`);const s=Ze(e.monto);return s===null&&(a.monto_usd="Escribe un monto en USD mayor que 0, con máximo 2 decimales (por ejemplo 85.00)."),mt(e.vencimiento)?e.vencimiento<t&&(a.fecha_vencimiento="El vencimiento no puede ser anterior a hoy: todos los alumnos quedarían morosos de inmediato."):a.fecha_vencimiento="Elige la fecha de vencimiento.",Object.keys(a).length>0||s===null?{errores:a,cuerpo:null}:{errores:a,cuerpo:{concepto:o,monto_usd:s,fecha_vencimiento:e.vencimiento}}}function mt(e){const t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!t)return!1;const[a,o,s]=[Number(t[1]),Number(t[2]),Number(t[3])],r=new Date(Date.UTC(a,o-1,s));return r.getUTCFullYear()===a&&r.getUTCMonth()===o-1&&r.getUTCDate()===s}function bt(e,t){return e<=0?{tono:"inf",texto:`No se creó ninguna cuota nueva: todos los estudiantes activos ya tenían «${t}».`}:{tono:"okk",texto:`Se crearon ${e} ${e===1?"cuota":"cuotas"} de «${t}».`}}function aa(e){return e===null?"todas las sedes":"tu sede"}function ft(e,t){const a=e.modulo.en_prueba===!0&&e.modulo.expira_prueba_en?e.modulo.expira_prueba_en:null;return i`${z(e.modulo.nombre,"Genera la mensualidad de todos los estudiantes activos en un solo paso.")}
    ${a?i`<div class="mb-6">${$("warn",`Prueba gratuita vigente hasta el ${k(a)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba")}</div>`:null}
    ${e.puedeGenerar?i`<section class="${n.tarjetaCristal} max-w-2xl p-6" aria-labelledby="t-masiva">
          <h2 id="t-masiva" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${f("receipt","h-5 w-5")}Nueva facturación mensual</h2>
          <p class="${n.ayuda} mb-4">Se aplica a los estudiantes «Activo» de ${aa(e.alcance)}. Repetir el mismo concepto no duplica cuotas.</p>
          <form id="form-masiva" novalidate class="flex flex-col gap-4" aria-label="Generar mensualidades">
            <div>
              <label for="f-concepto" class="${n.etiqueta}">Concepto <span class="text-red-800" aria-hidden="true">*</span></label>
              <input id="f-concepto" name="concepto" type="text" maxlength="${pe}" required autocomplete="off" placeholder="Mensualidad Noviembre 2026" aria-describedby="e-concepto" class="${n.input}">
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
                <input id="f-vence" name="fecha_vencimiento" type="date" required min="${t}" aria-describedby="e-vence" class="${n.input}">
                <p id="e-vence" data-error="fecha_vencimiento" class="${n.errorCampo}" role="alert" hidden></p>
              </div>
            </div>
            <p id="masiva-vista-previa" class="${n.ayuda}" aria-live="polite"></p>
            <div id="masiva-resultado" aria-live="polite"></div>
            <div class="flex justify-end">
              <button type="submit" class="${b(n.btnPrimario)}">${f("receipt","h-4 w-4")}<span>Generar</span></button>
            </div>
          </form>
        </section>`:i`<div class="max-w-2xl">${$("info","La generación masiva de mensualidades es una función del administrador. Pídele a esa persona que la ejecute.","Sección restringida")}</div>`}`}function Pe(e,t){for(const a of A("[data-error]",HTMLElement,e)){const o=t[a.dataset.error??""]??"";a.textContent=o,a.hidden=o===""}for(const a of A("[name]",HTMLElement,e))(t[a.getAttribute("name")??""]??"")!==""?a.setAttribute("aria-invalid","true"):a.removeAttribute("aria-invalid");P('[aria-invalid="true"]',HTMLElement,e)?.focus()}function ze(e,t,a){m(e,i`<p class="msg ${t}" role="${t==="err"?"alert":"status"}" tabindex="-1"></p>`);const o=c(".msg",HTMLElement,e);o.textContent=a,o.focus()}function vt(e,t){const a=c("#form-masiva",HTMLFormElement,e.zona),o=c("#masiva-resultado",HTMLElement,a),s=c("#masiva-vista-previa",HTMLElement,a),r=d=>{const u=a.elements.namedItem(d);return u instanceof HTMLInputElement?u.value:""},l=()=>({concepto:r("concepto"),monto:r("monto_usd"),vencimiento:r("fecha_vencimiento")}),p=()=>{const d=He(l(),t);s.textContent=d.cuerpo?`Se creará «${d.cuerpo.concepto}» por ${y(d.cuerpo.monto_usd)} con vencimiento el ${B(d.cuerpo.fecha_vencimiento)} para cada estudiante activo de ${aa(e.alcance)}.`:""};a.addEventListener("input",p),a.addEventListener("submit",d=>{d.preventDefault();const u=He(l(),t);if(Pe(a,u.errores),m(o,i``),u.cuerpo===null)return;const g=u.cuerpo,E=c('button[type="submit"]',HTMLButtonElement,a);T(E,()=>h.post("/facturacion/cuotas/generar-mensualidades",g)).then(S=>{if(!e.vigente())return;const L=bt(S.creadas,g.concepto);ze(o,L.tono,L.texto)}).catch(S=>{if(S instanceof _){e.alSesionExpirada();return}if(S instanceof O){const L=S.moduloPremium();if(L){e.alBloquear(L);return}const q=S.camposInvalidos();q.length>0&&Pe(a,Object.fromEntries(q.map(Z=>[Z.campo,Z.mensaje])))}e.vigente()&&ze(o,"err",w(S))})})}function gt(e){if(e.modulo.bloqueado){m(e.zona,Ue({nombre:e.modulo.nombre,descripcion:e.modulo.descripcion,precio_usd:e.modulo.precio_usd},e.puedeProbar)),Ve(e.zona,e.alActivarPrueba);return}const t=ne();m(e.zona,ft(e,t)),e.puedeGenerar&&vt(e,t)}function ta(e){if(e===null)return{tipo:"denegado"};const t=e.sede_id??null;return t===null?e.rol==="admin"?{tipo:"consolidado"}:{tipo:"denegado"}:Number.isInteger(t)&&t>0?{tipo:"sede",sedeId:t}:{tipo:"denegado"}}function G(e,t){for(const a of A("[data-error]",HTMLElement,e)){const o=t[a.dataset.error??""]??"";a.textContent=o,a.hidden=o===""}for(const a of A("[name]",HTMLElement,e))(t[a.getAttribute("name")??""]??"")!==""?a.setAttribute("aria-invalid","true"):a.removeAttribute("aria-invalid");P('[aria-invalid="true"]',HTMLElement,e)?.focus()}function oa(e,t,a){m(e,i`<p class="msg ${t}" role="${"alert"}" tabindex="-1"></p>`);const o=c(".msg",HTMLElement,e);o.textContent=a,o.focus()}function na(e){if(!(e instanceof O))return null;const t=e.camposInvalidos();return t.length>0?Object.fromEntries(t.map(a=>[a.campo,a.mensaje])):null}function F(e,t){const a=e.elements.namedItem(t);return a instanceof HTMLInputElement||a instanceof HTMLSelectElement?a.value:""}const $t=2,me=120,ht="MULTI_SEDE_PREMIUM",xt="Expansión Multi-Sede Avanzada (3+ Sedes)",ia=50;function Et(e){const t=e.trim().replace(/\s+/g," ");return t===""?{error:"Escribe el nombre de la sede, por ejemplo «Sede Este».",nombre:null}:t.length>me?{error:`El nombre admite hasta ${me} caracteres.`,nombre:null}:{error:null,nombre:t}}function yt(e){if(!(e instanceof O))return null;const t=e.moduloPremium();return t||(e.codigo==="MODULO_PREMIUM_DESHABILITADO"||e.codigo==="BM403"?{modulo:ht,nombre:xt,precio_usd:ia}:null)}function wt(e){const t=e.tipo==="sede"?"La gestión de sedes es una función del acceso consolidado (SuperAdmin). Tu usuario opera únicamente sobre su sede.":"Tu usuario no tiene una sede asignada, así que no puede abrir esta sección. Pide a un administrador que revise tu cuenta.";return i`${z("Sedes","Ubicaciones de la academia")}
    <div class="max-w-2xl">${$("warn",t,"Sección Restringida")}</div>`}function _t(e){return i`<li class="${n.tarjeta} flex flex-col gap-3 p-4">
    <div class="flex items-start gap-3">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">${f("building")}</span>
      <div class="min-w-0 flex-1">
        <h3 class="break-words text-base font-bold text-slate-900">${e.nombre}</h3>
        ${e.creado_en?i`<p class="${n.ayuda}">Creada el ${k(e.creado_en)}</p>`:null}
      </div>
      ${j(e.activa?"Operativa":"Inactiva",e.activa?"ok":"neutral")}
    </div>
  </li>`}function Mt(e){return e.length===0?$("info","Todavía no hay sedes registradas. Crea la primera con el formulario de abajo.","Sin sedes"):i`<ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Sedes registradas">${e.map(_t)}</ul>`}function Lt(e){return i`<section class="${n.tarjetaCristal} max-w-2xl p-6" aria-labelledby="t-nueva-sede">
    <h2 id="t-nueva-sede" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${f("building","h-5 w-5")}Nueva sede</h2>
    <p class="${n.ayuda} mb-4">El Core Base incluye ${$t} sedes (hoy hay ${e.length}). Desde la tercera se requiere la Expansión Multi-Sede (${y(ia)} · pago único); si ya está habilitada, el alta funciona con normalidad.</p>
    <form id="form-sede" novalidate class="flex flex-col gap-4 sm:flex-row sm:items-start" aria-label="Crear sede">
      <div class="min-w-0 flex-1">
        <label for="f-sede-nombre" class="${n.etiqueta}">Nombre de la sede <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="f-sede-nombre" name="nombre" type="text" maxlength="${me}" required autocomplete="off" placeholder="Sede Este" aria-describedby="e-sede-nombre" class="${n.input} min-h-10">
        <p id="e-sede-nombre" data-error="nombre" role="alert" hidden class="${n.errorCampo}"></p>
      </div>
      <button type="submit" class="${b(n.btnPrimario,"min-h-10 sm:mt-6")}">${f("check","h-4 w-4")}<span>Crear sede</span></button>
    </form>
    <div id="sede-resultado" class="mt-4" aria-live="polite"></div>
  </section>`}function Tt(e){return i`${z("Sedes","Ubicaciones de la academia y su estado operativo")}
    <div class="flex flex-col gap-8">${Mt(e)}${Lt(e)}</div>`}function At(e,t){const a=c("#form-sede",HTMLFormElement,e.zona),o=c("#sede-resultado",HTMLElement,e.zona);a.addEventListener("submit",s=>{s.preventDefault();const r=Et(F(a,"nombre"));if(G(a,r.error===null?{}:{nombre:r.error}),m(o,i``),r.nombre===null)return;const l={nombre:r.nombre},p=c('button[type="submit"]',HTMLButtonElement,a);T(p,()=>h.post("/sedes",l)).then(async d=>{M("ok",`Sede «${d.nombre}» creada.`),e.vigente()&&await t()}).catch(d=>{if(d instanceof _){e.alSesionExpirada();return}const u=yt(d);if(u){e.alBloquear(u);return}if(!e.vigente())return;if(d instanceof O&&d.codigo==="SEDE_DUPLICADA"){G(a,{nombre:d.message});return}const g=na(d);g&&G(a,g),oa(o,"err",w(d))})})}async function Ct(e){const t=ta(e.usuario);if(t.tipo!=="consolidado"){m(e.zona,wt(t));return}const a=async()=>{const o=await h.get("/sedes");e.vigente()&&(m(e.zona,Tt(o)),At(e,a))};await a()}const ke=7,be=1,fe=60,ve=60,St=10,ye="__otro__",sa=["Maternal","Preescolar 1.er nivel","Preescolar 2.º nivel","Preescolar 3.er nivel","1.er grado","2.º grado","3.er grado","4.º grado","5.º grado","6.º grado","1.er año","2.º año","3.er año","4.º año","5.º año"],ra=["","Pendiente","Usada","Vencida","Revocada"],It={Pendiente:"info",Usada:"ok",Vencida:"warn",Revocada:"bad"};function Ht(e,t){const a={};let o=null;if(t.tipo==="consolidado"){const p=Number(e.sede);e.sede===""||!Number.isInteger(p)||p<=0?a.sede_id="Elige la sede a la que pertenecerá el estudiante.":o=p}let s="";e.nivel===ye?(s=e.nivelOtro.trim().replace(/\s+/g," "),s===""?a.nivel_otro="Escribe el nivel o grado.":s.length>ve&&(a.nivel_otro=`El nivel admite hasta ${ve} caracteres.`)):sa.includes(e.nivel)?s=e.nivel:a.nivel_asignado="Elige el nivel o grado asignado.";const r=e.dias.trim(),l=/^\d{1,3}$/.test(r)?Number(r):Number.NaN;return(!Number.isInteger(l)||l<be||l>fe)&&(a.dias=`Escribe un número entero de días entre ${be} y ${fe}.`),Object.keys(a).length>0?{errores:a,cuerpo:null}:{errores:a,cuerpo:o===null?{nivel_asignado:s,dias:l}:{nivel_asignado:s,dias:l,sede_id:o}}}async function Pt(e,t){try{if(window.isSecureContext&&typeof navigator.clipboard?.writeText=="function")return await navigator.clipboard.writeText(e),!0}catch{}return t.focus(),t.select(),t.setSelectionRange(0,e.length),!1}const zt="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800";function kt(){return i`${z("Invitaciones","Enlaces únicos de inscripción para los representantes")}
    <div class="max-w-2xl">${$("warn","Tu usuario no tiene una sede asignada, así que no puede emitir invitaciones. Pide a un administrador que revise tu cuenta.","Sección Restringida")}</div>`}function qt(e,t){if(e.tipo==="consolidado"){const o=t.filter(r=>r.activa),s=o.length===1?o[0]:void 0;return i`<div>
      <label for="f-inv-sede" class="${n.etiqueta}">Sede destino <span class="text-red-800" aria-hidden="true">*</span></label>
      <select id="f-inv-sede" name="sede_id" required aria-describedby="e-inv-sede" class="${n.input} min-h-10">
        <option value="">Elige una sede…</option>
        ${o.map(r=>i`<option value="${r.id}" ${r.id===s?.id?W("selected"):null}>${r.nombre}</option>`)}
      </select>
      <p id="e-inv-sede" data-error="sede_id" role="alert" hidden class="${n.errorCampo}"></p>
    </div>`}const a=t.find(o=>e.tipo==="sede"&&o.id===e.sedeId);return i`<div>
    <span class="${n.etiqueta}">Sede destino</span>
    <p class="${zt}">${f("building","h-4 w-4")}<span class="min-w-0 break-words">${a?.nombre??"Tu sede"}</span></p>
    <p class="${n.ayuda}">Las invitaciones se emiten siempre para tu sede.</p>
  </div>`}function Dt(e,t){return i`<section class="${n.tarjetaCristal} p-6" aria-labelledby="t-nueva-inv">
    <h2 id="t-nueva-inv" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${f("link","h-5 w-5")}Nueva invitación</h2>
    <p class="${n.ayuda} mb-4">El enlace es de un solo uso y fija la sede y el nivel: el representante no puede cambiarlos en la planilla.</p>
    <form id="form-inv" novalidate class="grid gap-4 sm:grid-cols-2" aria-label="Emitir invitación">
      ${qt(e,t)}
      <div>
        <label for="f-inv-nivel" class="${n.etiqueta}">Nivel / grado asignado <span class="text-red-800" aria-hidden="true">*</span></label>
        <select id="f-inv-nivel" name="nivel_asignado" required aria-describedby="e-inv-nivel" class="${n.input} min-h-10">
          <option value="">Elige un nivel…</option>
          ${sa.map(a=>i`<option value="${a}">${a}</option>`)}
          <option value="${ye}">Otro…</option>
        </select>
        <p id="e-inv-nivel" data-error="nivel_asignado" role="alert" hidden class="${n.errorCampo}"></p>
        <div id="inv-nivel-otro" class="mt-2" hidden>
          <label for="f-inv-otro" class="${n.etiqueta}">Escribe el nivel</label>
          <input id="f-inv-otro" name="nivel_otro" type="text" maxlength="${ve}" autocomplete="off" aria-describedby="e-inv-otro" class="${n.input} min-h-10">
          <p id="e-inv-otro" data-error="nivel_otro" role="alert" hidden class="${n.errorCampo}"></p>
        </div>
      </div>
      <div>
        <label for="f-inv-dias" class="${n.etiqueta}">Días de vigencia <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="f-inv-dias" name="dias" type="text" inputmode="numeric" required autocomplete="off" value="${ke}" aria-describedby="e-inv-dias" class="${n.input} min-h-10">
        <p class="${n.ayuda}">Entre ${be} y ${fe} días. Por defecto ${ke}.</p>
        <p id="e-inv-dias" data-error="dias" role="alert" hidden class="${n.errorCampo}"></p>
      </div>
      <div class="flex items-end justify-end sm:col-span-2">
        <button type="submit" class="${b(n.btnPrimario,"min-h-10")}">${f("link","h-4 w-4")}<span>Generar enlace</span></button>
      </div>
    </form>
    <div id="inv-resultado" class="mt-4" aria-live="polite"></div>
  </section>`}function jt(e,t){return i`<section class="${n.tarjetaCristal} border-emerald-700/30 p-6" aria-labelledby="t-inv-ok">
    <h2 id="t-inv-ok" class="flex items-center gap-2 text-base font-bold text-slate-900">${f("check","h-5 w-5 text-emerald-700")}Invitación creada</h2>
    <p class="${n.ayuda} mb-4">${t} · ${e.nivel_asignado} · vence el ${k(e.expira_en)} · un solo uso.</p>
    <label for="inv-enlace" class="${n.etiqueta}">Enlace de inscripción</label>
    <div class="flex flex-col gap-3 sm:flex-row">
      <input id="inv-enlace" type="text" readonly value="${e.enlace}" class="${n.input} min-h-10 flex-1 font-mono text-xs">
      <button type="button" id="inv-copiar" class="${b(n.btnPrimario,"min-h-10")}">${f("copy","h-4 w-4")}<span>Copiar enlace</span></button>
    </div>
    <div class="mt-4">${$("warn","Por seguridad el enlace se muestra solo ahora: en el sistema queda únicamente su huella cifrada. Cópialo y envíalo al representante (por ejemplo, por WhatsApp). Si lo pierdes, revoca esta invitación y emite otra.","Cópialo ahora")}</div>
  </section>`}function Ot(e){const t=e.estado==="Usada"&&e.usada_en!==null?i`Usada el ${k(e.usada_en)}`:i`Vence el ${k(e.expira_en)}`;return i`<tr>
    <td class="${n.td}">${e.sede}</td>
    <td class="${n.td}">${e.nivel_asignado}</td>
    <td class="${n.td}">${j(e.estado,It[e.estado])}</td>
    <td class="${n.td} whitespace-nowrap">${k(e.creado_en)}</td>
    <td class="${n.td} whitespace-nowrap">${t}</td>
    <td class="${n.td} text-right">
      ${e.estado==="Pendiente"?i`<button type="button" data-revocar="${e.id}" class="${b(n.btnSecundario,"min-h-10")}" aria-label="Revocar invitación de ${e.nivel_asignado} en ${e.sede}">${f("x","h-4 w-4")}<span>Revocar</span></button>`:null}
    </td>
  </tr>`}function Nt(e){return e.length===0?$("info","No hay invitaciones con este filtro.","Sin resultados"):i`<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
    <table class="${n.tabla}">
      <thead><tr>
        <th scope="col" class="${n.th}">Sede</th>
        <th scope="col" class="${n.th}">Nivel</th>
        <th scope="col" class="${n.th}">Estado</th>
        <th scope="col" class="${n.th}">Emitida</th>
        <th scope="col" class="${n.th}">Vigencia</th>
        <th scope="col" class="${n.th}"><span class="sr-only">Acciones</span></th>
      </tr></thead>
      <tbody>${e.map(Ot)}</tbody>
    </table>
  </div>`}function Rt(e){const t=Math.max(1,Math.ceil(e.total/Math.max(1,e.limite)));return i`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación de invitaciones">
    <span class="text-slate-600">Página ${e.pagina} de ${t} · ${e.total} invitación(es)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${b(n.btnSecundario,"min-h-10")}" ${e.pagina<=1?W("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${b(n.btnSecundario,"min-h-10")}" ${e.pagina>=t?W("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function la(){return i`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando invitaciones"></div>`}function Bt(e,t){const a=e.tipo==="consolidado"&&!t.some(o=>o.activa);return i`${z("Invitaciones","Enlaces únicos de inscripción con sede y nivel blindados")}
    <div class="flex flex-col gap-8">
      <div class="max-w-3xl">
        ${a?$("warn","No hay sedes activas. Crea o activa una sede en la sección Sedes antes de emitir invitaciones.","Sin sedes disponibles"):Dt(e,t)}
      </div>
      <div id="inv-exito" class="max-w-3xl" aria-live="polite"></div>
      <section aria-labelledby="t-inv-lista">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 id="t-inv-lista" class="text-base font-bold text-slate-900">Invitaciones emitidas</h2>
          <div>
            <label for="inv-filtro" class="${n.etiqueta}">Estado</label>
            <select id="inv-filtro" class="${n.input} min-h-10">${ra.map(o=>i`<option value="${o}">${o===""?"Todas":o}</option>`)}</select>
          </div>
        </div>
        <div id="inv-lista">${la()}</div>
      </section>
    </div>`}function Ft(e,t,a,o){const s=P("#form-inv",HTMLFormElement,e.zona);if(s===null)return;const r=c("#inv-resultado",HTMLElement,e.zona),l=c("#inv-exito",HTMLElement,e.zona),p=c("#f-inv-nivel",HTMLSelectElement,s),d=c("#inv-nivel-otro",HTMLElement,s);p.addEventListener("change",()=>{d.hidden=p.value!==ye,d.hidden||c("#f-inv-otro",HTMLInputElement,s).focus()}),s.addEventListener("submit",u=>{u.preventDefault();const g=Ht({sede:F(s,"sede_id"),nivel:F(s,"nivel_asignado"),nivelOtro:F(s,"nivel_otro"),dias:F(s,"dias")},t);if(G(s,g.errores),m(r,i``),g.cuerpo===null)return;const E=g.cuerpo,S=c('button[type="submit"]',HTMLButtonElement,s);T(S,()=>h.post("/invitaciones",E)).then(L=>{if(!e.vigente())return;const q=a.find(Z=>Z.id===L.sede_id)?.nombre??"Sede";m(l,jt(L,q)),Ut(l,L.enlace),c("#inv-copiar",HTMLButtonElement,l).focus(),o()}).catch(L=>{if(L instanceof _){e.alSesionExpirada();return}if(!e.vigente())return;const q=na(L);q&&G(s,q),oa(r,"err",w(L))})})}function Ut(e,t){const a=c("#inv-copiar",HTMLButtonElement,e),o=c("#inv-enlace",HTMLInputElement,e),s=a.innerHTML;a.addEventListener("click",()=>{Pt(t,o).then(r=>{if(!r){M("warn","Tu navegador no permitió copiar automáticamente. El enlace quedó seleccionado: pulsa Ctrl+C (⌘+C en Mac).");return}m(a,i`${f("check","h-4 w-4")}<span>¡Copiado!</span>`),M("ok","Enlace copiado. Ya puedes pegarlo en WhatsApp."),window.setTimeout(()=>{a.isConnected&&(a.innerHTML=s)},2500)})})}function Vt(e,t,a){const o=R({titulo:"Revocar invitación",cuerpo:i`<p class="text-sm text-slate-700">Se desactivará el enlace de <strong>${e.nivel_asignado}</strong> en <strong>${e.sede}</strong>. Quien lo abra verá que ya no es válido. Esta acción no se puede deshacer.</p>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" data-cancelar class="${b(n.btnSecundario,"min-h-10")}">Cancelar</button>
        <button type="button" data-confirmar class="${b(n.btnPeligro,"min-h-10")}">${f("x","h-4 w-4")}<span>Revocar</span></button>
      </div>`});P("[data-cancelar]",HTMLButtonElement,o.dialogo)?.addEventListener("click",o.cerrar);const s=c("[data-confirmar]",HTMLButtonElement,o.dialogo);s.addEventListener("click",()=>{T(s,()=>h.post(`/invitaciones/${e.id}/revocar`)).then(()=>{o.cerrar(),M("ok","Invitación revocada: el enlace ya no sirve."),t()}).catch(r=>{if(r instanceof _){o.cerrar(),a();return}if(r instanceof O&&r.codigo==="INVITACION_NO_REVOCABLE"){o.cerrar(),M("warn",r.message),t();return}M("bad",w(r))})})}function Gt(e){const t=c("#inv-lista",HTMLElement,e.zona),a=c("#inv-filtro",HTMLSelectElement,e.zona);let o="",s=1,r=[],l=0;const p=async()=>{l+=1;const d=l;m(t,la());try{const u=await h.pagina("/invitaciones",{estado:o,pagina:s,limite:St});if(!e.vigente()||d!==l)return;r=u.datos,m(t,i`${Nt(u.datos)}${Rt(u.paginacion)}`)}catch(u){if(!e.vigente()||d!==l)return;if(u instanceof _){e.alSesionExpirada();return}m(t,i`${$("bad",w(u),"No se pudo cargar la lista")}
        <button type="button" data-reintentar class="${b(n.btnSecundario,"mt-4 min-h-10")}">${f("refresh","h-4 w-4")}<span>Reintentar</span></button>`)}};return t.addEventListener("click",d=>{const u=d.target instanceof Element?d.target:null,g=u?.closest("[data-revocar]");if(g instanceof HTMLElement){const S=Number(g.dataset.revocar),L=r.find(q=>q.id===S);L&&Vt(L,()=>void p(),()=>e.alSesionExpirada());return}if(u?.closest("[data-reintentar]")){p();return}const E=u?.closest("[data-pag]");E instanceof HTMLButtonElement&&!E.disabled&&(s=Math.max(1,s+Number(E.dataset.pag)),p())}),a.addEventListener("change",()=>{o=ra.find(u=>u===a.value)??"",s=1,p()}),p(),()=>{a.value="",o="",s=1,p()}}async function Wt(e){const t=ta(e.usuario);if(t.tipo==="denegado"){m(e.zona,kt());return}const a=await h.get("/sedes");if(!e.vigente())return;m(e.zona,Bt(t,a));const o=Gt(e);Ft(e,t,a,o)}const Xt="/assets/bma-logo--zgMcLI-.webp",Jt="/assets/bma-isotipo-D77goT0u.webp",da="Brilliant Minds Academy",qe={ancho:800,alto:735},De={ancho:256,alto:256};function ca(e,t=!1){return i`<img src="${Xt}" alt="${da}" width="${qe.ancho}" height="${qe.alto}" decoding="async" fetchpriority="${t?"high":"auto"}" class="${e}">`}function Yt(e){return i`<img src="${Jt}" alt="${da}" width="${De.ancho}" height="${De.alto}" decoding="async" class="${e}">`}const ua="bma.sidebar.colapsado",Zt=3e4,pa=25,se=300,ma=[{id:"dashboard",titulo:"Dashboard",icono:"home",soloAdmin:!1},{id:"estudiantes",titulo:"Estudiantes",icono:"users",soloAdmin:!1},{id:"auditoria",titulo:"Auditoría de referencias",icono:"inbox",soloAdmin:!1},{id:"sedes",titulo:"Sedes",icono:"building",soloAdmin:!1},{id:"invitaciones",titulo:"Invitaciones",icono:"link",soloAdmin:!1},{id:"contabilidad",titulo:"Contabilidad",icono:"book",soloAdmin:!0},{id:"configuracion",titulo:"Configuración de cobro",icono:"wallet",soloAdmin:!0}],ba={IA_ATENCION:"bot",WHATSAPP_AUTOMATICO:"chat",BANCAMIGA:"wallet",APP_MOVIL:"phone",FACHADA_WEB:"globe",MULTI_SEDE_PREMIUM:"school",FACTURACION_MASIVA:"receipt"},je=["","Activo","Moroso","Fuera de la Academia","Pendiente por Validación Administrativa"],Oe=["Por Validar","Aprobada","Rechazada"];let v={usuario:null,modulos:[],vista:"dashboard",colapsado:!1,periodo:he(),filtroEstudiantes:"",paginaEstudiantes:1,filtroAuditoria:"Por Validar",paginaAuditoria:1};function I(e){v={...v,...e}}let ee=0,ae=null;function Kt(){try{const e=localStorage.getItem(ua);if(e==="1")return!0;if(e==="0")return!1}catch{}return window.matchMedia("(max-width: 767px)").matches}function Qt(e){try{localStorage.setItem(ua,e?"1":"0")}catch{}}function eo(e){if(typeof e!="object"||e===null)return!1;const t=e;return typeof t.id=="number"&&typeof t.nombre=="string"&&typeof t.email=="string"&&(t.rol==="admin"||t.rol==="secretaria")}function ao(){const e=ie.usuarioCrudo();if(!e)return null;try{const t=JSON.parse(e);return eo(t)?t:null}catch{return null}}const X=()=>v.usuario?.rol==="admin";function fa(e){we(),ee+=1,document.body.className="text-slate-900",m(c("#app",HTMLElement),i`<main class="flex min-h-screen items-center justify-center bg-bma-azul px-4 py-12">
      <section class="${n.loginTarjeta}" aria-labelledby="login-titulo">
        <header class="mb-8 flex flex-col items-center text-center">
          ${ca("h-auto w-48 sm:w-56",!0)}
          <h1 id="login-titulo" class="sr-only">Brilliant Minds Academy · Panel administrativo</h1>
          <p class="mt-3 text-sm font-medium text-slate-700">Panel administrativo</p>
        </header>
        <form id="login" novalidate class="flex flex-col gap-4" aria-labelledby="login-titulo">
          <div id="login-aviso">${e?$("warn",e):null}</div>
          <div>
            <label for="login-email" class="${n.etiqueta}">Correo</label>
            <input id="login-email" name="email" type="email" required autocomplete="username" class="${n.input}">
          </div>
          <div>
            <label for="login-password" class="${n.etiqueta}">Contraseña</label>
            <input id="login-password" name="password" type="password" required autocomplete="current-password" class="${n.input}">
          </div>
          <button type="submit" class="${b(n.btnPrimario,n.btnLogin)}"><span>Entrar</span></button>
        </form>
      </section>
    </main>`);const t=c("#login",HTMLFormElement);t.addEventListener("submit",a=>{a.preventDefault(),to(t)}),c("#login-email",HTMLInputElement).focus()}async function to(e){const t=c("#login-email",HTMLInputElement).value.trim(),a=c("#login-password",HTMLInputElement).value,o=c("#login-aviso",HTMLElement);if(!t||!a){m(o,$("bad","Escribe tu correo y tu contraseña."));return}try{const s=await T(c('button[type="submit"]',HTMLButtonElement,e),()=>h.post("/auth/login",{email:t,password:a},{sinAuth:!0}));ie.guardar(s.token,JSON.stringify(s.usuario)),await va()}catch(s){m(o,$("bad",w(s)))}}function H(e){ie.cerrar(),I({usuario:null,modulos:[],vista:"dashboard"}),fa(e)}function ge(e){const{id:t,titulo:a,tooltip:o,bloqueado:s}=e;return i`<button type="button" data-nav="${t}" data-bloqueado="${s}"
    class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 aria-[current=page]:bg-bma-azul aria-[current=page]:text-white group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
    ${f(e.icono)}
    <span class="min-w-0 flex-1 truncate group-data-[collapsed=true]/sb:sr-only">${a}</span>
    ${s?i`<span class="text-slate-500 group-data-[collapsed=true]/sb:absolute group-data-[collapsed=true]/sb:right-2 group-data-[collapsed=true]/sb:top-1">${f("lock","h-4 w-4 group-data-[collapsed=true]/sb:h-3 group-data-[collapsed=true]/sb:w-3")}</span>`:null}
    <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">${o}</span>
  </button>`}function oo(){const e=v.usuario,t=ma.filter(a=>!a.soloAdmin||X());return i`<div id="shell" data-collapsed="${v.colapsado}" class="group/sb flex min-h-screen">
    <aside id="barra-lateral" aria-label="Navegación principal"
      class="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-lg transition-[width] duration-200 group-data-[collapsed=true]/sb:w-20">
      <div class="flex h-24 items-center justify-center border-b border-slate-200 px-4 group-data-[collapsed=true]/sb:h-16 group-data-[collapsed=true]/sb:px-2">
        ${ca("h-auto max-h-20 w-auto max-w-full object-contain group-data-[collapsed=true]/sb:hidden")}
        ${Yt("hidden h-10 w-10 object-contain group-data-[collapsed=true]/sb:block")}
        <span class="sr-only">Administración</span>
      </div>
      <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Secciones">
        ${t.map(a=>ge({id:a.id,titulo:a.titulo,icono:a.icono,tooltip:a.titulo,bloqueado:!1}))}
        <p class="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 group-data-[collapsed=true]/sb:sr-only">Módulos Premium</p>
        <hr class="my-2 hidden border-slate-200 group-data-[collapsed=true]/sb:block">
        ${v.modulos.map(a=>ge({id:`premium:${a.codigo}`,titulo:a.nombre,icono:ba[a.codigo]??"chat",tooltip:a.bloqueado?`${a.nombre} · ${a.tooltip}`:a.nombre,bloqueado:a.bloqueado}))}
      </nav>
      <div class="flex flex-col gap-1 border-t border-slate-200 p-3">
        <div class="flex items-center gap-3 px-3 py-2 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800" aria-hidden="true">${(e?.nombre??"?").trim().slice(0,1).toUpperCase()}</span>
          <span class="min-w-0 group-data-[collapsed=true]/sb:sr-only"><span class="block truncate text-sm font-semibold text-slate-900">${e?.nombre}</span><span class="block truncate text-xs text-slate-600">${e?.rol}</span></span>
        </div>
        <button type="button" id="salir" class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${f("logout")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Salir</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Salir</span>
        </button>
        <button type="button" id="alternar-sidebar" aria-controls="barra-lateral" aria-expanded="${!v.colapsado}" aria-label="${v.colapsado?"Expandir menú lateral":"Contraer menú lateral"}"
          class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${f("menu")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Contraer menú</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Expandir menú</span>
        </button>
      </div>
    </aside>
    <main id="contenido" tabindex="-1" class="m-2 min-w-0 flex-1 rounded-xl bg-slate-50/95 p-4 shadow-lg sm:m-4 sm:p-8"></main>
  </div>`}function no(){const e=!v.colapsado;I({colapsado:e}),Qt(e);const t=c("#shell",HTMLElement);t.dataset.collapsed=String(e);const a=c("#alternar-sidebar",HTMLButtonElement);a.setAttribute("aria-expanded",String(!e)),a.setAttribute("aria-label",e?"Expandir menú lateral":"Contraer menú lateral")}function io(e){const t=e.startsWith("estudiante:")?"estudiantes":e;for(const a of A("[data-nav]",HTMLElement))a.dataset.nav===t?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current")}async function va(){if(!ie.token()){fa();return}let e=ao();try{e||(e=(await h.get("/auth/me")).usuario);const o=await h.get("/premium/modulos").catch(s=>{if(s instanceof _)throw s;return[]});I({usuario:e,modulos:o,colapsado:Kt()})}catch(o){H(o instanceof _?"Tu sesión expiró. Inicia sesión de nuevo.":w(o));return}document.body.className="text-slate-900",m(c("#app",HTMLElement),oo()),c("#shell",HTMLElement).addEventListener("click",o=>{const r=(o.target instanceof Element?o.target:null)?.closest("[data-nav]");if(!(r instanceof HTMLElement))return;const l=r.dataset.nav??"";v.modulos.find(d=>`premium:${d.codigo}`===l)?.bloqueado&&(o.preventDefault(),o.stopPropagation()),C(l)}),c("#salir",HTMLButtonElement).addEventListener("click",()=>H()),c("#alternar-sidebar",HTMLButtonElement).addEventListener("click",no);const a=v.vista.startsWith("premium:")||ma.some(o=>o.id===v.vista)?v.vista:"dashboard";await C(a)}function we(){ae!==null&&(window.clearInterval(ae),ae=null)}async function C(e){we(),ee+=1;const t=ee;I({vista:e}),io(e);const a=c("#contenido",HTMLElement),o={zona:a,vigente:()=>t===ee};m(a,i`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando"></div>`);try{e.startsWith("premium:")?xo(o,e.slice(8)):e.startsWith("estudiante:")?await bo(o,e.slice(11)):e==="estudiantes"?await po(o):e==="auditoria"?await vo(o):e==="sedes"?await Ct({zona:o.zona,vigente:o.vigente,usuario:v.usuario,alBloquear:s=>void wa(o,s),alSesionExpirada:()=>H("Tu sesión expiró. Inicia sesión de nuevo.")}):e==="invitaciones"?await Wt({zona:o.zona,vigente:o.vigente,usuario:v.usuario,alSesionExpirada:()=>H("Tu sesión expiró. Inicia sesión de nuevo.")}):e==="contabilidad"&&X()?await ho(o):e==="configuracion"&&X()?await rt({zona:o.zona,vigente:o.vigente,usuario:v.usuario}):await co(o)}catch(s){ga(s,o)}}function ga(e,t){if(t.vigente()){if(e instanceof _){H("Tu sesión expiró. Inicia sesión de nuevo.");return}if(e instanceof O){const a=e.moduloPremium();if(a){_a(t.zona,a);return}}m(t.zona,i`<div class="mx-auto max-w-2xl pt-8">${$("bad",w(e),e instanceof Sa?"Sin conexión":"No se pudo cargar la sección")}
      <button type="button" data-reintentar class="${b(n.btnSecundario,"mt-4")}">${f("refresh","h-4 w-4")}<span>Reintentar</span></button></div>`),P("[data-reintentar]",HTMLButtonElement,t.zona)?.addEventListener("click",()=>void C(v.vista))}}function $a(e){const t=Math.max(1,Math.ceil(e.total/Math.max(1,e.limite)));return i`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación">
    <span class="text-slate-600">Página ${e.pagina} de ${t} · ${e.total} registro(s)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${b(n.btnSecundario,n.btnPeq)}" ${e.pagina<=1?W("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${b(n.btnSecundario,n.btnPeq)}" ${e.pagina>=t?W("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function ha(e,t){for(const a of A("[data-pag]",HTMLButtonElement,e))a.addEventListener("click",()=>t(Number(a.dataset.pag)))}function te(e){return i`<article class="${n.tarjeta} p-6">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-sm font-medium text-slate-600">${e.titulo}</h3>
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${f(e.icono,"h-4 w-4")}</span>
    </div>
    <p class="mt-3 text-2xl font-bold ${e.tono==="malo"?"text-bma-coral-oscuro":"text-slate-900"}" data-kpi>${e.valor}</p>
    <p class="mt-1 text-xs text-slate-600">${e.detalle}</p>
  </article>`}function so(e){const t=Ca(e.periodo),a=new Map;for(const l of e.cobrado_por_dia)a.set(Number(l.dia.slice(8,10)),l.monto_usd);const o=Math.max(0,...a.values()),s=Array.from({length:t},(l,p)=>{const d=p+1,u=a.get(d)??0,g=o>0?Math.max(u>0?4:0,Math.round(u/o*100)):0;return i`<li class="group/barra relative flex h-full min-w-0 flex-1 flex-col justify-end" title="Día ${d}: ${y(u)}">
      <div data-alto="${g}" class="w-full rounded-t ${u>0?"bg-slate-800 group-hover/barra:bg-slate-600":"bg-slate-200"} ${u>0?"":"h-px"}"></div>
      <span class="sr-only">Día ${d}: ${y(u)}</span>
    </li>`}),r=Array.from({length:t},(l,p)=>i`<span class="min-w-0 flex-1 text-center text-xs text-slate-600">${(p+1)%5===0||p===0?p+1:""}</span>`);return i`<div role="group" aria-label="Cobrado por día en ${e.periodo}">
    <ul class="flex h-48 items-end gap-1 border-b border-slate-200">${s}</ul>
    <div class="mt-1 flex gap-1" aria-hidden="true">${r}</div>
  </div>`}function ro(e){for(const t of A("[data-alto]",HTMLElement,e)){const a=Number(t.dataset.alto);Number.isFinite(a)&&a>0&&(t.style.height=`${Math.min(100,a)}%`)}}function lo(e,t){const a=[{titulo:"Cobrado",valor:y(e.cobrado.monto_usd),detalle:`${e.cobrado.cantidad} pago(s) aprobados`,icono:"wallet",tono:"normal"},{titulo:"Saldos vencidos",valor:y(e.saldos_vencidos.monto_usd),detalle:`${e.saldos_vencidos.cantidad} cuota(s) vencida(s)`,icono:"alert",tono:"malo"},{titulo:"Cuentas pendientes del mes",valor:y(e.cuentas_pendientes.monto_usd),detalle:`${e.cuentas_pendientes.cantidad} cuota(s) por cobrar`,icono:"book",tono:"normal"},{titulo:"Referencias por validar",valor:String(e.referencias_por_validar),detalle:"en la bandeja de auditoría",icono:"inbox",tono:"normal"}];return i`
    <section aria-label="Indicadores del mes" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${a.map(te)}</section>
    <section aria-label="Estudiantes por estado" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${[["Activos",t.activos],["Morosos",t.morosos],["Fuera de la Academia",t.fuera_de_la_academia],["Pendientes de validación",t.pendientes_validacion]].map(([o,s])=>i`<div class="${n.tarjeta} flex items-center justify-between gap-4 px-6 py-4"><span class="text-sm text-slate-700">${o}</span><strong class="text-lg text-slate-900">${s}</strong></div>`)}
    </section>
    <section class="${n.tarjeta} mt-6 p-6" aria-labelledby="t-barras">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="t-barras" class="text-base font-bold text-slate-900">Recaudación diaria</h2>
        <p class="text-sm text-slate-600">Cobrado del mes: <strong class="text-slate-900">${y(e.cobrado.monto_usd)}</strong></p>
      </div>
      ${so(e)}
    </section>`}async function re(e,t){const a=c("#tablero",HTMLElement,e.zona);t||m(a,i`<div class="h-48 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando tablero"></div>`);try{const[o,s]=await Promise.all([h.get("/facturacion/tablero",{periodo:v.periodo}),h.get("/estudiantes/resumen")]);if(!e.vigente())return;m(a,lo(o,s)),ro(a);const r=P("#actualizado",HTMLElement,e.zona);r&&(r.textContent=`Actualizado a las ${Aa(new Date)}`)}catch(o){if(!e.vigente()||t&&!(o instanceof _))return;ga(o,e)}}async function co(e){m(e.zona,i`${z("Dashboard","Tablero financiero en tiempo real",i`<div class="flex flex-wrap items-end gap-4">
        <div><label for="periodo" class="${n.etiqueta}">Período</label><input id="periodo" type="month" value="${v.periodo}" max="${he()}" class="${n.input}"></div>
        <p id="actualizado" class="pb-2 text-xs text-slate-600" aria-live="off"></p>
      </div>`)}<div id="tablero"></div>`),c("#periodo",HTMLInputElement,e.zona).addEventListener("change",t=>{const a=t.target instanceof HTMLInputElement?t.target.value:"";/^\d{4}-\d{2}$/.test(a)&&(I({periodo:a}),re(e,!1))}),await re(e,!0),ae=window.setInterval(()=>{if(!e.vigente()){we();return}document.hidden||re(e,!0)},Zt)}function uo(e){return i`<tr>
    <td class="${n.td}"><button type="button" data-detalle="${e.id}" class="rounded-md text-left font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900" aria-label="Ver ficha de ${e.apellidos}, ${e.nombres}">${e.apellidos}, ${e.nombres}</button></td>
    <td class="${n.td}">${e.grado_solicitado}</td>
    <td class="${n.td}">${e.representante}</td>
    <td class="${n.td}">${J(e.estado_dinamico)}</td>
    <td class="${n.td} whitespace-nowrap">${y(e.deuda_vencida_usd)}</td>
    <td class="${n.td}"><div class="flex flex-wrap gap-2">
      <button type="button" data-alerta="preventiva" data-id="${e.id}" class="${b(n.btnPrimario,n.btnPeq)}">Preventiva</button>
      <button type="button" data-alerta="morosidad" data-id="${e.id}" class="${b(n.btnPrimario,n.btnPeq)}">Morosidad</button>
    </div></td>
  </tr>`}async function po(e){const t=await h.pagina("/estudiantes",{estado:v.filtroEstudiantes,pagina:v.paginaEstudiantes,limite:pa});if(e.vigente()){m(e.zona,i`${z("Estudiantes",`${t.paginacion.total} resultado(s)`)}
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
      ${je.map(a=>i`<button type="button" data-filtro="${a}" aria-pressed="${a===v.filtroEstudiantes}" class="${b(n.btnSecundario,n.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${a===""?"Todos":a}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${n.tabla}">
        <caption class="sr-only">Listado de estudiantes</caption>
        <thead><tr><th scope="col" class="${n.th}">Estudiante</th><th scope="col" class="${n.th}">Grado</th><th scope="col" class="${n.th}">Representante</th><th scope="col" class="${n.th}">Estado</th><th scope="col" class="${n.th}">Deuda vencida</th><th scope="col" class="${n.th}">Alertas WhatsApp</th></tr></thead>
        <tbody>${t.datos.length===0?i`<tr><td colspan="6" class="${n.td}">Sin resultados.</td></tr>`:t.datos.map(uo)}</tbody>
      </table>
    </div>
    ${$a(t.paginacion)}`);for(const a of A("[data-filtro]",HTMLButtonElement,e.zona))a.addEventListener("click",()=>{const o=a.dataset.filtro??"",s=je.find(r=>r===o)??"";I({filtroEstudiantes:s,paginaEstudiantes:1}),C("estudiantes")});ha(e.zona,a=>{I({paginaEstudiantes:Math.max(1,v.paginaEstudiantes+a)}),C("estudiantes")});for(const a of A("[data-detalle]",HTMLButtonElement,e.zona))a.addEventListener("click",()=>{const o=Number(a.dataset.detalle);Number.isInteger(o)&&o>0&&C(`estudiante:${o}`)});for(const a of A("[data-alerta]",HTMLButtonElement,e.zona))a.addEventListener("click",()=>{const o=a.dataset.alerta==="morosidad"?"morosidad":"preventiva";mo(o,Number(a.dataset.id),a)})}}async function mo(e,t,a){try{const o=await T(a,()=>h.post(`/notificaciones/whatsapp/${e}/${t}`)),s=R({titulo:e==="morosidad"?"Alerta de morosidad":"Alerta preventiva",ancho:"lg",cuerpo:i`<p class="text-sm text-slate-600">${y(o.monto_usd)} · ${$e(o.monto_bs)} · tasa BCV ${Ta(o.tasa_bcv)}</p>
        <pre class="mt-4 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">${o.mensaje}</pre>
        <div id="alerta-resultado" class="mt-4"></div>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <a href="${Be(o.enlace_whatsapp,["https://wa.me/"])}" target="_blank" rel="noopener noreferrer" class="${b(n.btnPrimario)}">Abrir en WhatsApp</a>
          <button type="button" id="alerta-enviar" class="${b(n.btnSecundario)}">Enviar por API</button>
        </div>`}),r=c("#alerta-enviar",HTMLButtonElement,s.dialogo);r.addEventListener("click",()=>{const l=c("#alerta-resultado",HTMLElement,s.dialogo);T(r,()=>h.post(`/notificaciones/whatsapp/${e}/${t}`,{},{consulta:{enviar:!0}})).then(()=>m(l,$("ok","Mensaje enviado por la API de WhatsApp."))).catch(p=>m(l,$("bad",w(p))))})}catch(o){o instanceof _?H("Tu sesión expiró. Inicia sesión de nuevo."):M("bad",w(o))}}async function bo(e,t){const a=Number(t);if(!Number.isInteger(a)||a<=0){m(e.zona,i`<div class="mx-auto max-w-2xl pt-8">${$("bad","El identificador del estudiante no es válido.")}</div>`);return}await et({zona:e.zona,vigente:e.vigente,estudianteId:a,alVolver:()=>void C("estudiantes"),alSesionExpirada:()=>H("Tu sesión expiró. Inicia sesión de nuevo.")})}function fo(e){const t=e.estado==="Por Validar";return i`<tr>
    <td class="${n.td} whitespace-nowrap">${k(e.declarado_en)}</td>
    <td class="${n.td}"><span class="font-medium text-slate-900">${e.estudiante}</span><br><span class="text-xs text-slate-600">${e.concepto} · vence ${B(e.fecha_vencimiento)}</span></td>
    <td class="${n.td}"><strong class="break-all">${e.referencia}</strong><br><span class="text-xs text-slate-600">${e.representante}</span></td>
    <td class="${n.td}">${N(e.metodo_pago)}</td>
    <td class="${n.td} whitespace-nowrap">${y(e.monto_usd)}<br><span class="text-xs text-slate-600">${$e(e.monto_bs)}</span></td>
    <td class="${n.td}">${t?i`<div class="flex flex-wrap gap-2">
          <button type="button" data-aprobar="${e.id}" class="${b(n.btnOk,n.btnPeq)}">${f("check","h-4 w-4")}<span>Aprobar</span></button>
          <button type="button" data-rechazar="${e.id}" class="${b(n.btnPeligro,n.btnPeq)}">${f("x","h-4 w-4")}<span>Rechazar</span></button>
        </div>`:i`${J(e.estado)}${e.nota_revision?i`<p class="mt-1 max-w-xs break-words text-xs text-slate-600">${e.nota_revision}</p>`:null}`}</td>
  </tr>`}async function vo(e){const t=await h.pagina("/facturacion/auditoria",{estado:v.filtroAuditoria,pagina:v.paginaAuditoria,limite:pa});if(!e.vigente())return;const a=X()?i`<button type="button" id="exportar" class="${b(n.btnSecundario)}">${f("down","h-4 w-4")}<span>Exportar histórico (.xlsx)</span></button>`:null;m(e.zona,i`${z("Bandeja de auditoría",`${t.paginacion.total} referencia(s) · ${v.filtroAuditoria}`,a)}
    <div id="auditoria-aviso" class="mb-4"></div>
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado de la referencia">
      ${Oe.map(r=>i`<button type="button" data-filtro="${r}" aria-pressed="${r===v.filtroAuditoria}" class="${b(n.btnSecundario,n.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${r}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${n.tabla}">
        <caption class="sr-only">Referencias de pago declaradas</caption>
        <thead><tr><th scope="col" class="${n.th}">Declarada</th><th scope="col" class="${n.th}">Estudiante</th><th scope="col" class="${n.th}">Referencia</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Acción</th></tr></thead>
        <tbody>${t.datos.length===0?i`<tr><td colspan="6" class="${n.td}">Bandeja vacía.</td></tr>`:t.datos.map(fo)}</tbody>
      </table>
    </div>
    ${$a(t.paginacion)}`);const o=c("#auditoria-aviso",HTMLElement,e.zona);for(const r of A("[data-filtro]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>{const l=r.dataset.filtro??"",p=Oe.find(d=>d===l)??"Por Validar";I({filtroAuditoria:p,paginaAuditoria:1}),C("auditoria")});ha(e.zona,r=>{I({paginaAuditoria:Math.max(1,v.paginaAuditoria+r)}),C("auditoria")});const s=new Map(t.datos.map(r=>[r.id,r]));for(const r of A("[data-aprobar]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>void go(Number(r.dataset.aprobar),r,o));for(const r of A("[data-rechazar]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>{const l=s.get(Number(r.dataset.rechazar));l&&$o(l)});P("#exportar",HTMLButtonElement,e.zona)?.addEventListener("click",r=>{const l=r.currentTarget instanceof HTMLButtonElement?r.currentTarget:null;l&&xa(l,"/exportaciones/facturacion.xlsx","facturacion.xlsx",o)})}async function xa(e,t,a,o){try{await T(e,()=>h.descargar(t,a))}catch(s){s instanceof _?H("Tu sesión expiró. Inicia sesión de nuevo."):m(o,$("bad",w(s)))}}function Ea(e,t){return`${t} · estatus de pago del alumno: ${e.estatus_pago} · deuda vencida ${y(e.deuda_vencida_usd)}.`}async function go(e,t,a){try{const o=await T(t,()=>h.post(`/facturacion/auditoria/${e}/aprobar`,{}));M("ok",Ea(o,"Referencia aprobada")),await C("auditoria")}catch(o){o instanceof _?H("Tu sesión expiró. Inicia sesión de nuevo."):m(a,$("bad",w(o)))}}function $o(e){const t=R({titulo:"Rechazar referencia",cuerpo:i`<form id="form-rechazo" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700">Referencia <strong class="break-all">${e.referencia}</strong> · ${e.estudiante} · ${y(e.monto_usd)}</p>
      <div>
        <label for="nota-rechazo" class="${n.etiqueta}">Motivo del rechazo <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="nota-rechazo" name="nota" rows="4" maxlength="${se}" required aria-describedby="nota-ayuda nota-error" class="${n.input}"></textarea>
        <p id="nota-ayuda" class="${n.ayuda}">Se guarda en el historial y se usa para avisar al representante. <span id="nota-contador">0/${se}</span></p>
        <p id="nota-error" class="${n.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="rechazo-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${b(n.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${b(n.btnPeligro)}">${f("x","h-4 w-4")}<span>Rechazar referencia</span></button>
      </div>
    </form>`}),a=c("#form-rechazo",HTMLFormElement,t.dialogo),o=c("#nota-rechazo",HTMLTextAreaElement,t.dialogo),s=c("#nota-error",HTMLElement,t.dialogo),r=c("#nota-contador",HTMLElement,t.dialogo);o.addEventListener("input",()=>{r.textContent=`${o.value.length}/${se}`,o.value.trim()!==""&&(s.hidden=!0,o.removeAttribute("aria-invalid"))}),c("[data-cancelar]",HTMLButtonElement,t.dialogo).addEventListener("click",t.cerrar),a.addEventListener("submit",l=>{l.preventDefault();const p=o.value.trim();if(p===""){s.textContent="Debes escribir el motivo del rechazo para continuar.",s.hidden=!1,o.setAttribute("aria-invalid","true"),o.focus();return}const d=c('button[type="submit"]',HTMLButtonElement,a);T(d,()=>h.post(`/facturacion/auditoria/${e.id}/rechazar`,{nota:p})).then(async u=>{t.cerrar(),M("ok",Ea(u,"Referencia rechazada")),await C("auditoria")}).catch(u=>{if(u instanceof _){t.cerrar(),H("Tu sesión expiró. Inicia sesión de nuevo.");return}m(c("#rechazo-aviso",HTMLElement,t.dialogo),$("bad",w(u)))})}),o.focus()}async function ho(e){const t=await h.get("/contabilidad/balance",{periodo:v.periodo});if(!e.vigente())return;m(e.zona,i`${z("Contabilidad",`Balance neto del período ${t.periodo}`,i`<div class="flex flex-wrap items-end gap-4">
      <div><label for="periodo-conta" class="${n.etiqueta}">Período</label><input id="periodo-conta" type="month" value="${v.periodo}" max="${he()}" class="${n.input}"></div>
      <button type="button" id="exportar" class="${b(n.btnPrimario)}">${f("down","h-4 w-4")}<span>Exportar nómina, egresos y personal (.xlsx)</span></button>
    </div>`)}
    <div id="conta-aviso" class="mb-4"></div>
    <section class="grid gap-4 sm:grid-cols-3" aria-label="Balance">
      ${te({titulo:"Ingresos",valor:y(t.ingresos_usd),detalle:"Referencias aprobadas del período",icono:"wallet",tono:"normal"})}
      ${te({titulo:"Egresos",valor:y(t.egresos_usd),detalle:"Egresos y nómina pagada",icono:"book",tono:"normal"})}
      ${te({titulo:"Neto",valor:y(t.neto_usd),detalle:"Ingresos − egresos",icono:"check",tono:t.neto_usd<0?"malo":"normal"})}
    </section>`),c("#periodo-conta",HTMLInputElement,e.zona).addEventListener("change",o=>{const s=o.target instanceof HTMLInputElement?o.target.value:"";/^\d{4}-\d{2}$/.test(s)&&(I({periodo:s}),C("contabilidad"))});const a=c("#conta-aviso",HTMLElement,e.zona);c("#exportar",HTMLButtonElement,e.zona).addEventListener("click",o=>{const s=o.currentTarget instanceof HTMLButtonElement?o.currentTarget:null;s&&xa(s,"/exportaciones/contabilidad.xlsx","contabilidad.xlsx",a)})}function xo(e,t){const a=v.modulos.find(s=>s.codigo===t);if(!a){m(e.zona,$("bad","Módulo no encontrado."));return}if(a.codigo==="FACTURACION_MASIVA"){gt({zona:e.zona,vigente:e.vigente,modulo:a,puedeGenerar:X(),puedeProbar:a.prueba_utilizada===!1&&le(),alcance:v.usuario?.sede_id??null,alActivarPrueba:()=>Ne(a),alBloquear:s=>void wa(e,s),alSesionExpirada:()=>H("Tu sesión expiró. Inicia sesión de nuevo.")});return}if(a.bloqueado){m(e.zona,Ue(a,a.prueba_utilizada===!1&&le())),Ve(e.zona,()=>Ne(a));return}const o=a.en_prueba===!0&&a.expira_prueba_en?a.expira_prueba_en:null;m(e.zona,i`${z(a.nombre,a.descripcion)}
    <div class="${n.tarjeta} flex flex-col gap-4 p-6">
      ${o?$("warn",`Prueba gratuita vigente hasta el ${k(o)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba"):null}
      ${a.codigo==="MULTI_SEDE_PREMIUM"?i`${$("info","El Core Base incluye dos sedes (Sede Este y Sede Norte). Con este módulo puedes registrar la tercera sede y las siguientes desde la sección Sedes.","Expansión multi-sede habilitada")}
          ${le()?i`<div><button type="button" id="ir-sedes" class="${b(n.btnPrimario,"min-h-10")}">${f("building","h-4 w-4")}<span>Ir a Sedes</span></button></div>`:null}`:$("info","El módulo está habilitado para esta academia. Su lógica se publicará en la Fase 2 (ruta reservada en el servidor).","Módulo habilitado")}
    </div>`),P("#ir-sedes",HTMLButtonElement,e.zona)?.addEventListener("click",()=>void C("sedes"))}const le=()=>v.usuario?.rol==="admin"&&(v.usuario.sede_id??null)===null;function ya(e){const t=P(`[data-nav="premium:${e.codigo}"]`,HTMLElement);if(!t)return;const a=document.createElement("div");m(a,ge({id:`premium:${e.codigo}`,titulo:e.nombre,icono:ba[e.codigo]??"chat",tooltip:e.bloqueado?`${e.nombre} · ${e.tooltip??de}`:e.nombre,bloqueado:e.bloqueado}));const o=a.firstElementChild;o&&t.replaceWith(o)}async function Ne(e){await h.post("/premium/activar-prueba",{modulo:e.codigo});const t=await h.get("/premium/modulos");I({modulos:t});for(const a of t)ya(a);M("ok","Prueba gratuita de 15 días activada."),await C(`premium:${e.codigo}`)}async function wa(e,t){try{const a=await h.get("/premium/modulos");I({modulos:a});for(const o of a)ya(o)}catch(a){if(a instanceof _){H("Tu sesión expiró. Inicia sesión de nuevo.");return}e.vigente()&&_a(e.zona,t);return}e.vigente()&&await C(`premium:${t.modulo}`)}function _a(e,t){const a=v.modulos.find(o=>o.codigo===t.modulo);m(e,Fe({nombre:t.nombre,descripcion:a?.descripcion??"Este módulo forma parte de la Fase 2 del sistema.",precio_usd:t.precio_usd}))}va();
