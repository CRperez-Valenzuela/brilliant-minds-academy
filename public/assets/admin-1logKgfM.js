import{a as g,b,C as n,i as $,h as s,c as P,d as A,n as T,m as w,u as x,e as m,o as d,f as h,g as ce,j as N,k as F,l as U,p as V,H as la,q as O,r as qe,s as da,t as q,v as ue,B as _,w as K,x as L,y as pe,z as Q,A as $e,D as ca,E as ua,F as pa,G as ma}from"./ui-By8Ghd8b.js";const ne="Módulo Premium Deshabilitado";function I(e,t,a=null){return s`<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><h1 class="${n.titulo}">${e}</h1><p class="${n.subtitulo}">${t}</p></div>
    ${a}
  </header>`}function fa(){const e=s`<div class="flex items-center gap-4 border-b border-slate-100 py-4"><div class="h-8 w-8 rounded-full bg-slate-200"></div><div class="h-4 flex-1 rounded bg-slate-200"></div><div class="h-4 w-24 rounded bg-slate-200"></div></div>`;return s`<div aria-hidden="true" class="pointer-events-none select-none p-6">
    <div class="mb-4 h-6 w-1/3 rounded bg-slate-300"></div>${e}${e}${e}${e}${e}
  </div>`}function ba(e){return s`<div data-candado class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 p-6 backdrop-blur-md">
    <div role="region" aria-label="${ne}" class="${n.tarjetaCristal} w-full max-w-md p-8 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">${$("lock","h-6 w-6")}</span>
      <h2 class="mt-4 text-lg font-bold text-slate-900">${ne}</h2>
      <p class="mt-1 text-sm font-semibold text-slate-800">${e.nombre}</p>
      <p class="mt-2 text-sm text-slate-700">${e.descripcion}</p>
      <p class="mt-4 text-2xl font-bold text-slate-900">${x(e.precio_usd)}</p>
      <p class="mt-1 text-xs text-slate-600">Pago único · solicítalo a Astra Digital Solutions</p>
    </div>
  </div>`}function De(e){return s`${I(e.nombre,e.descripcion)}
    <div class="${n.tarjeta} relative min-h-96 overflow-hidden">${fa()}${ba(e)}</div>`}function je(e,t){return s`${De(e)}${t?s`<div class="mt-6">${g("info",s`<p>Prueba este módulo sin costo durante 15 días. Al vencer se bloquea solo.</p>
        <button type="button" id="activar-prueba" class="${b(n.btnPrimario,"mt-3")}">${$("check","h-4 w-4")}<span>Activar prueba gratuita de 15 días</span></button>`,"Prueba gratuita disponible")}</div>`:null}`}function Be(e,t){const a=P("#activar-prueba",HTMLButtonElement,e);a?.addEventListener("click",()=>{A(a,t).catch(o=>T("bad",w(o)))})}const j=300,va=["https://drive.google.com/","https://docs.google.com/"],se="Sin registrar",he={FOTO_CARNET:"Foto carnet",CEDULA_IDENTIDAD:"Cédula de identidad",ACTA_NACIMIENTO:"Acta de nacimiento"},ga={MATRICULA:"Matrícula",MENSUALIDAD:"Mensualidad",OTRO:"Otro"};function $a(e,t){const a=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e),o=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t);if(!a||!o)return null;const[,i,r,l]=a.map(Number),[,p,c,u]=o.map(Number);if(i===void 0||r===void 0||l===void 0||p===void 0||c===void 0||u===void 0)return null;const v=p-i-(c<r||c===r&&u<l?1:0);return v>=0?v:null}function ha(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function Oe(e){if(e===null||e==="")return null;const t=qe(e,va);return t==="#"?null:t}const Re=e=>e!==null&&e.trim()!==""?e:se;function E(e,t){const a=t instanceof la?t:Re(t),o=t===null||typeof t=="string"&&t.trim()==="";return s`<div class="min-w-0"><dt class="text-xs font-semibold uppercase tracking-wide text-slate-600">${e}</dt>
    <dd class="mt-1 break-words text-sm ${o?"text-slate-600":"font-medium text-slate-900"}">${a}</dd></div>`}function ee(e,t,a){return s`<h2 id="${e}" class="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${$(a,"h-4 w-4")}</span>${t}</h2>`}function xa(e){const t=$a(e.fecha_nacimiento,ce());return s`<section class="${n.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-academico">
    ${ee("t-academico","Información académica","school")}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${E("Grado",e.grado_solicitado)}
      ${E("Cédula de identidad",e.cedula_identidad)}
      ${E("Fecha de nacimiento",`${U(e.fecha_nacimiento)}${t!==null?` · ${t} años`:""}`)}
      ${E("Colegio de procedencia",e.colegio_procedencia)}
      ${E("Último grado aprobado",e.ultimo_grado_aprobado)}
      ${E("Inscrito",V(e.creado_en))}
    </dl>
  </section>`}function ya(e){const t=a=>a!==null&&a.trim()!==""?s`${O("Atención","warn")} <span class="ml-1">${a}</span>`:null;return s`<section class="${n.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-medico">
    ${ee("t-medico","Datos médicos","heart")}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${E("Tipo de sangre",e.tipo_sangre)}
      ${E("Alergias",t(e.alergias)??se)}
      ${E("Condiciones médicas",t(e.condiciones_medicas)??se)}
      ${E("Medicamentos",e.medicamentos)}
      ${E("Contacto de emergencia",e.emergencia_nombre)}
      ${E("Teléfono de emergencia",e.emergencia_telefono)}
    </dl>
  </section>`}function Ea(e){const t=Oe(e.drive_url);return s`<li class="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
    <span class="min-w-0"><span class="block truncate text-sm font-medium text-slate-900">${he[e.tipo]}</span>
      <span class="block truncate text-xs text-slate-600">${e.nombre_archivo} · ${ha(e.tamano_bytes)}</span></span>
    ${t!==null?s`<a href="${t}" target="_blank" rel="noopener noreferrer" class="${b(n.btnSecundario,n.btnPeq)}" aria-label="Abrir ${he[e.tipo]} en Google Drive">Abrir</a>`:O("Sin enlace","neutral")}
  </li>`}function wa(e){const t=Oe(e.drive_folder_url);return s`<section class="${n.tarjeta} p-6" aria-labelledby="t-drive">
    ${ee("t-drive","Expediente en Google Drive","folder")}
    ${t!==null?s`<a href="${t}" target="_blank" rel="noopener noreferrer" class="${b(n.btnPrimario,"w-full")}">${$("folder","h-4 w-4")}<span>Abrir expediente digitalizado</span></a>`:g("info","Este estudiante aún no tiene una carpeta de expediente en Google Drive.")}
    ${e.drive_folder_id!==null?s`<p class="${n.ayuda}">ID de carpeta: <span class="break-all font-mono">${e.drive_folder_id}</span></p>`:null}
    ${e.documentos.length>0?s`<ul class="mt-4" aria-label="Documentos digitalizados">${e.documentos.map(Ea)}</ul>`:s`<p class="mt-4 text-sm text-slate-600">Sin documentos digitalizados.</p>`}
  </section>`}function _a(e){return s`<section class="${n.tarjeta} p-6" aria-labelledby="t-representante">
    ${ee("t-representante","Representante","users")}
    <dl class="grid gap-4">
      ${E("Nombre",`${e.rep_nombres} ${e.rep_apellidos}`)}
      ${E("Cédula",e.rep_cedula)}
      ${E("Correo",e.rep_email)}
      ${E("Teléfono",e.rep_telefono)}
    </dl>
  </section>`}function Ma(e){const t=e.estado==="Pendiente"||e.estado==="En Revisión";return s`<tr>
    <td class="${n.td}"><span class="font-medium text-slate-900">${e.concepto}</span></td>
    <td class="${n.td}">${ga[e.tipo]}</td>
    <td class="${n.td} whitespace-nowrap">${U(e.fecha_vencimiento)}${t&&da(e.fecha_vencimiento)?s` ${O("Vencida","bad")}`:null}</td>
    <td class="${n.td} whitespace-nowrap">${x(e.monto_usd)}</td>
    <td class="${n.td}">${F(e.estado)}</td>
  </tr>`}function La(e,t){const a=t.get(e.cuota_id);return s`<tr>
    <td class="${n.td}"><span class="break-all font-medium text-slate-900">${e.referencia}</span>${a!==void 0?s`<span class="block text-xs text-slate-600">${a}</span>`:null}</td>
    <td class="${n.td}">${q(e.metodo_pago)}</td>
    <td class="${n.td} whitespace-nowrap">${V(e.declarado_en)}</td>
    <td class="${n.td} whitespace-nowrap">${x(e.monto_usd)}<span class="block text-xs text-slate-600">${ue(e.monto_bs)}</span></td>
    <td class="${n.td}">${F(e.estado)}</td>
  </tr>`}function Aa(e){return s`<section class="${n.tarjeta} overflow-hidden" aria-labelledby="t-cuotas">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-cuotas" class="text-base font-bold text-slate-900">Histórico de cuotas</h2>
      <span class="text-xs text-slate-600">${e.cuotas.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${n.tabla}">
        <caption class="sr-only">Histórico de cuotas del estudiante</caption>
        <thead><tr><th scope="col" class="${n.th}">Concepto</th><th scope="col" class="${n.th}">Tipo</th><th scope="col" class="${n.th}">Vencimiento</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Estado</th></tr></thead>
        <tbody>${e.cuotas.length===0?s`<tr><td colspan="5" class="${n.td}">Este estudiante no tiene cuotas.</td></tr>`:e.cuotas.map(Ma)}</tbody>
      </table>
    </div>
  </section>`}function Ta(e){const t=new Map(e.cuotas.map(a=>[a.id,a.concepto]));return s`<section class="${n.tarjeta} overflow-hidden" aria-labelledby="t-pagos">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-pagos" class="text-base font-bold text-slate-900">Pagos declarados por el representante</h2>
      <span class="text-xs text-slate-600">${e.pagos.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${n.tabla}">
        <caption class="sr-only">Pagos declarados por el representante</caption>
        <thead><tr><th scope="col" class="${n.th}">Referencia</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Declarado</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Estado</th></tr></thead>
        <tbody>${e.pagos.length===0?s`<tr><td colspan="5" class="${n.td}">El representante aún no ha declarado pagos.</td></tr>`:e.pagos.map(a=>La(a,t))}</tbody>
      </table>
    </div>
  </section>`}function Ca(e){const t=e.estatus_academico==="Fuera de la Academia";return s`<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <button type="button" data-accion="volver" class="${b(n.btnSecundario,n.btnPeq,"mb-3")}">${$("back","h-4 w-4")}<span>Volver al listado</span></button>
      <h1 id="ficha-titulo" tabindex="-1" class="${n.titulo} break-words">${e.apellidos}, ${e.nombres}</h1>
      <p class="${n.subtitulo} flex flex-wrap items-center gap-2">${F(e.estado_dinamico)}<span>${e.grado_solicitado}</span>
        ${e.deuda_vencida_usd>0?s`<span class="font-semibold text-red-800">Deuda vencida: ${x(e.deuda_vencida_usd)}</span>`:null}</p>
    </div>
    <div class="flex flex-wrap gap-2" role="group" aria-label="Acciones sobre el estudiante">
      ${t?s`<button type="button" data-accion="reactivar" class="${b(n.btnOk)}">${$("refresh","h-4 w-4")}<span>Reactivar Estudiante</span></button>`:s`<button type="button" data-accion="retirar" class="${b(n.btnPeligro)}">${$("logout","h-4 w-4")}<span>Retirar Estudiante</span></button>`}
    </div>
  </header>
  ${t?s`<div class="mb-6">${g("warn",s`<p>Retirado el <strong>${e.fecha_retiro!==null?U(e.fecha_retiro):"fecha no registrada"}</strong>.</p>
        <p class="mt-1">Motivo: ${Re(e.motivo_retiro)}</p>
        <p class="mt-1">Sus cuotas pendientes fueron anuladas al retirarlo; reactivarlo no las restaura.</p>`,"Fuera de la Academia")}</div>`:null}`}function Sa(e){return s`<div id="ficha-raiz">
    ${Ca(e)}
    <div class="grid gap-6 lg:grid-cols-3">
      ${xa(e)}
      ${_a(e)}
      ${ya(e)}
      ${wa(e)}
    </div>
    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      ${Aa(e)}
      ${Ta(e)}
    </div>
  </div>`}function xe(e,t,a){const o={},i=e.trim();return i===""?o.motivo="Debes escribir el motivo del retiro para continuar.":i.length>j&&(o.motivo=`El motivo admite hasta ${j} caracteres.`),/^\d{4}-\d{2}-\d{2}$/.test(t)?t>a&&(o.fecha="La fecha de retiro no puede ser futura."):o.fecha="Elige la fecha del retiro.",o}function G(e,t,a){if(a===void 0){t.hidden=!0,e.removeAttribute("aria-invalid");return}t.textContent=a,t.hidden=!1,e.setAttribute("aria-invalid","true")}function ka(e,t){const a=ce(),o=N({titulo:"Retirar estudiante",cuerpo:s`<form id="form-retiro" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700"><strong>${e.apellidos}, ${e.nombres}</strong> pasará a «Fuera de la Academia» y sus cuotas pendientes se anularán.</p>
      <div>
        <label for="retiro-motivo" class="${n.etiqueta}">Motivo del retiro <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="retiro-motivo" name="motivo" rows="4" maxlength="${j}" required aria-describedby="retiro-ayuda retiro-motivo-error" class="${n.input}"></textarea>
        <p id="retiro-ayuda" class="${n.ayuda}">Obligatorio. Queda en el historial del estudiante. <span id="retiro-contador">0/${j}</span></p>
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
        <button type="submit" class="${b(n.btnPeligro)}">${$("logout","h-4 w-4")}<span>Retirar estudiante</span></button>
      </div>
    </form>`}),i=d("#form-retiro",HTMLFormElement,o.dialogo),r=d("#retiro-motivo",HTMLTextAreaElement,o.dialogo),l=d("#retiro-fecha",HTMLInputElement,o.dialogo),p=d("#retiro-motivo-error",HTMLElement,o.dialogo),c=d("#retiro-fecha-error",HTMLElement,o.dialogo),u=d("#retiro-contador",HTMLElement,o.dialogo);r.addEventListener("input",()=>{u.textContent=`${r.value.length}/${j}`,r.value.trim()!==""&&G(r,p,void 0)}),l.addEventListener("input",()=>G(l,c,xe(r.value,l.value,a).fecha)),d("[data-cancelar]",HTMLButtonElement,o.dialogo).addEventListener("click",o.cerrar),i.addEventListener("submit",v=>{v.preventDefault();const y=xe(r.value,l.value,a);G(r,p,y.motivo),G(l,c,y.fecha),y.motivo!==void 0?r.focus():y.fecha!==void 0&&l.focus(),!(y.motivo!==void 0||y.fecha!==void 0)&&t(o,{motivo:r.value.trim(),fecha_retiro:l.value},d('button[type="submit"]',HTMLButtonElement,i))}),r.focus()}function za(e,t){const a=N({titulo:"Reactivar estudiante",cuerpo:s`<div class="flex flex-col gap-4">
      <p class="text-sm text-slate-700"><strong>${e.apellidos}, ${e.nombres}</strong> volverá a «Activo». Las cuotas que se anularon al retirarlo no se restauran: genera las que correspondan desde Facturación.</p>
      <div id="reactivar-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${b(n.btnSecundario)}">Cancelar</button>
        <button type="button" data-confirmar class="${b(n.btnOk)}">${$("check","h-4 w-4")}<span>Reactivar estudiante</span></button>
      </div>
    </div>`});d("[data-cancelar]",HTMLButtonElement,a.dialogo).addEventListener("click",a.cerrar);const o=d("[data-confirmar]",HTMLButtonElement,a.dialogo);o.addEventListener("click",()=>t(a,o)),o.focus()}async function Pa(e){const t=()=>h.get(`/estudiantes/${e.estudianteId}`);let a=await t();if(!e.vigente())return;m(e.zona,s`<div id="ficha-contenedor"></div>`);const o=d("#ficha-contenedor",HTMLElement,e.zona),i=()=>{m(o,Sa(a)),P("#ficha-titulo",HTMLElement,o)?.focus({preventScroll:!0})},r=async()=>{try{a=await t()}catch(u){u instanceof _?e.alSesionExpirada():T("bad",`La acción se realizó, pero no se pudo actualizar la ficha: ${w(u)}`);return}e.vigente()&&i()},l=(u,v,y)=>{if(u instanceof _){v.cerrar(),e.alSesionExpirada();return}m(d(y,HTMLElement,v.dialogo),g("bad",w(u)))},p=(u,v,y)=>{A(y,()=>h.post(`/estudiantes/${e.estudianteId}/retirar`,v)).then(async()=>{u.cerrar(),T("ok",`${a.nombres} ${a.apellidos} fue retirado de la academia.`),await r()}).catch(k=>l(k,u,"#retiro-aviso"))},c=(u,v)=>{A(v,()=>h.post(`/estudiantes/${e.estudianteId}/reactivar`)).then(async()=>{u.cerrar(),T("ok",`${a.nombres} ${a.apellidos} fue reactivado.`),await r()}).catch(y=>l(y,u,"#reactivar-aviso"))};o.addEventListener("click",u=>{const v=u.target instanceof Element?u.target.closest("[data-accion]"):null;if(!(v instanceof HTMLButtonElement))return;const y=v.dataset.accion;y==="volver"?e.alVolver():y==="retirar"?ka(a,p):y==="reactivar"&&za(a,c)}),i()}const z=(e,t)=>e[t]??"",ie=/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/,ye=/^(?:\d{6,20}|[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,})$/,Ha=/^Banco (\d{4}) · Tel (0\d{10}) · Cédula\/RIF ([VEJGP]\d{5,10})$/,Ee=(e,t,a)=>({id:e,etiqueta:t,tipo:"email",inputmode:"email",placeholder:"pagos@academia.com",ayuda:a,error:"Escribe un correo válido, por ejemplo pagos@academia.com.",patron:ie,normalizar:o=>o.trim().toLowerCase()}),me={ZELLE:{campos:[Ee("correo","Correo de Zelle","Correo con el que la academia recibe pagos por Zelle.")],componer:e=>z(e,"correo"),interpretar:e=>ie.test(e)?{correo:e}:null},PAYPAL:{campos:[Ee("correo","Correo de PayPal","Cuenta de PayPal que recibe los pagos.")],componer:e=>z(e,"correo"),interpretar:e=>ie.test(e)?{correo:e}:null},BINANCE:{campos:[{id:"idBinance",etiqueta:"Pay ID o correo de Binance",tipo:"text",inputmode:"text",placeholder:"123456789",ayuda:"Pay ID numérico (6 a 20 dígitos) o el correo de la cuenta Binance.",error:"Escribe un Pay ID numérico de 6 a 20 dígitos o un correo válido.",patron:ye,normalizar:e=>e.trim().toLowerCase()}],componer:e=>z(e,"idBinance"),interpretar:e=>ye.test(e)?{idBinance:e}:null},PAGO_MOVIL:{campos:[{id:"banco",etiqueta:"Código del banco",tipo:"text",inputmode:"numeric",placeholder:"0102",ayuda:"Cuatro dígitos (0102 = Banco de Venezuela, 0105 = Mercantil…).",error:"El código del banco son exactamente 4 dígitos.",patron:/^\d{4}$/,normalizar:e=>e.trim()},{id:"telefono",etiqueta:"Teléfono afiliado",tipo:"text",inputmode:"tel",placeholder:"04141234567",ayuda:"11 dígitos, empezando por 0 (sin espacios ni guiones).",error:"Escribe 11 dígitos empezando por 0, por ejemplo 04141234567.",patron:/^0\d{10}$/,normalizar:e=>e.replace(/[\s.-]/g,"")},{id:"documento",etiqueta:"Cédula o RIF del titular",tipo:"text",inputmode:"text",placeholder:"V12345678",ayuda:"Letra (V, E, J, G o P) seguida de 5 a 10 dígitos.",error:"Escribe la letra (V, E, J, G o P) y de 5 a 10 dígitos, por ejemplo V12345678.",patron:/^[VEJGP]\d{5,10}$/,normalizar:e=>e.replace(/[\s.-]/g,"").toUpperCase()}],componer:e=>`Banco ${z(e,"banco")} · Tel ${z(e,"telefono")} · Cédula/RIF ${z(e,"documento")}`,interpretar:e=>{const t=Ha.exec(e);return t?{banco:t[1]??"",telefono:t[2]??"",documento:t[3]??""}:null}}},fe=["ZELLE","BINANCE","PAYPAL","PAGO_MOVIL"],re=150,Ne=99999999,Fe=e=>fe.some(t=>t===e);function Ia(e,t){const a={},o=e.titular.trim();o===""?a.titular="El titular es obligatorio.":o.length>re&&(a.titular=`Máximo ${re} caracteres.`);let i=null;if(e.ambito==="")a.ambito="Elige a qué sede aplica la cuenta o márcala como común a todas.";else if(e.ambito!=="comun"){const c=Number(e.ambito);Number.isInteger(c)&&t.some(u=>u.id===c)?i=c:a.ambito="La sede elegida no existe. Recarga la página."}const r=e.metodo;if(!Fe(r))return a.metodo="Elige un método de pago.",{errores:a,cuerpo:null};const l=me[r],p={};for(const c of l.campos){const u=c.normalizar(z(e.campos,c.id));p[c.id]=u,c.patron.test(u)||(a[`campo_${c.id}`]=c.error)}return Object.keys(a).length>0?{errores:a,cuerpo:null}:{errores:a,cuerpo:{metodo:r,titular:o,detalle:l.componer(p),activa:e.activa,sede_id:i}}}function Ue(e){const t=e.trim().replace(",",".");if(!/^\d+(?:\.\d{1,2})?$/.test(t))return null;const a=Number(t);return Number.isFinite(a)&&a>0&&a<=Ne?a:null}const qa=e=>e?.rol==="admin"&&(e.sede_id??null)===null;async function we(){const[e,t]=await Promise.all([h.get("/configuracion"),h.get("/sedes")]);return{matricula_usd:e.matricula_usd,cuentas:e.cuentas,sedes:t}}const Ve=(e,t)=>{if(e===null)return"Común (todas las sedes)";const a=t.find(o=>o.id===e);return a?a.nombre:`Sede #${e}`};function Da(e,t){const a=o=>`${o.sede_id===null?"0":"1"}|${Ve(o.sede_id,t)}|${fe.indexOf(o.metodo)}|${String(o.id).padStart(10,"0")}`;return[...e].sort((o,i)=>a(o).localeCompare(a(i),"es"))}const X=(e,t)=>{const a=e.get(t);return typeof a=="string"?a:""};function B(e,t){for(const a of L("[data-error]",HTMLElement,e)){const o=t[a.dataset.error??""]??"";a.textContent=o,a.hidden=o===""}for(const a of L("[name]",HTMLElement,e))(t[a.getAttribute("name")??""]??"")!==""?a.setAttribute("aria-invalid","true"):a.removeAttribute("aria-invalid");P('[aria-invalid="true"]',HTMLElement,e)?.focus()}function Ge(e){const t={titular:"titular",sede_id:"ambito",metodo:"metodo",detalle:"general",matricula_usd:"matricula_usd"},a={};for(const o of e.camposInvalidos())a[t[o.campo]??"general"]=o.mensaje;return Object.keys(a).length===0&&(a.general=e.message),a}function ja(e,t){if(e.length===0)return g("warn","Todavía no hay cuentas de cobro. Mientras no exista ninguna activa, las familias verán «Consulta los datos de pago con la administración».");const a=Da(e,t).map(o=>s`<tr>
      <td class="${n.td}">${Ve(o.sede_id,t)}</td>
      <td class="${n.td} font-semibold">${q(o.metodo)}</td>
      <td class="${n.td}">${o.titular}</td>
      <td class="${n.td} break-words">${o.detalle}</td>
      <td class="${n.td}">${o.activa?O("Activa","ok"):O("Inactiva","neutral")}</td>
      <td class="${n.td}">
        <div class="flex flex-wrap gap-2">
          <button type="button" data-accion="editar" data-id="${o.id}" class="${b(n.btnSecundario,n.btnPeq)}" aria-label="Editar la cuenta de ${q(o.metodo)} de ${o.titular}">Editar</button>
          <button type="button" data-accion="alternar" data-id="${o.id}" class="${b(n.btnSecundario,n.btnPeq)}" aria-label="${o.activa?"Desactivar":"Activar"} la cuenta de ${q(o.metodo)} de ${o.titular}">${o.activa?"Desactivar":"Activar"}</button>
        </div>
      </td>
    </tr>`);return s`<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/95">
    <table class="${n.tabla}">
      <caption class="sr-only">Cuentas de cobro de la academia</caption>
      <thead><tr>
        <th scope="col" class="${n.th}">Ámbito</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Titular</th>
        <th scope="col" class="${n.th}">Datos públicos</th><th scope="col" class="${n.th}">Estado</th><th scope="col" class="${n.th}">Acciones</th>
      </tr></thead>
      <tbody>${a}</tbody>
    </table>
  </div>`}function Ba(e){const t=e.matricula_usd<=0;return s`<div id="config-raiz">
    <header class="mb-6">
      <h1 class="${n.titulo}">Configuración de cobro</h1>
      <p class="${n.subtitulo}">Costo de la matrícula y cuentas donde las familias depositan.</p>
    </header>

    <section class="${n.tarjeta} mb-6 p-6" aria-labelledby="t-matricula">
      <h2 id="t-matricula" class="text-base font-bold text-slate-900">Costo de la matrícula</h2>
      <p class="${n.ayuda}">Monto único en dólares para todas las sedes. Se muestra en el formulario público de admisiones junto a su equivalente en bolívares a la tasa BCV.</p>
      <div class="mt-4">${t?g("warn","La matrícula aún no está configurada: las inscripciones públicas permanecen bloqueadas hasta que fijes un monto."):g("info",s`Matrícula vigente: <strong>${x(e.matricula_usd)}</strong>.`)}</div>
      <form id="form-matricula" novalidate class="mt-4 grid gap-4 sm:grid-cols-3 sm:items-start">
        <div class="sm:col-span-1">
          <label for="f-matricula" class="${n.etiqueta}">Monto en USD</label>
          <input id="f-matricula" name="matricula_usd" type="text" inputmode="decimal" autocomplete="off" required placeholder="120.00"
            value="${t?"":e.matricula_usd.toFixed(2)}" class="${n.input}" aria-describedby="ay-matricula er-matricula">
          <p id="ay-matricula" class="${n.ayuda}">Hasta dos decimales. Ejemplo: 120.00</p>
          <p id="er-matricula" data-error="matricula_usd" class="${n.errorCampo}" hidden></p>
        </div>
        <div class="flex items-end sm:col-span-2 sm:pt-6">
          <button type="submit" class="${b(n.btnPrimario)}">${$("check","h-4 w-4")}<span>Guardar matrícula</span></button>
        </div>
      </form>
    </section>

    <section class="${n.tarjeta} p-6" aria-labelledby="t-cuentas">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 id="t-cuentas" class="text-base font-bold text-slate-900">Cuentas de cobro</h2>
          <p class="${n.ayuda}">Datos públicos de Zelle, Binance Pay, PayPal y Pago Móvil. Nunca registres contraseñas ni claves aquí: esta información se muestra a las familias.</p>
        </div>
        <button type="button" data-accion="nueva" class="${b(n.btnPrimario)}">${$("wallet","h-4 w-4")}<span>Agregar cuenta</span></button>
      </div>
      ${ja(e.cuentas,e.sedes)}
      <div class="mt-4">${g("info","Una familia ve las cuentas activas comunes más las de su sede. Si entra sin enlace de invitación, solo ve las comunes.")}</div>
    </section>
  </div>`}async function Oa(e){if(!qa(e.usuario)){m(e.zona,s`<div class="mx-auto max-w-2xl pt-8">${g("info","La configuración de cobro es del acceso consolidado (administrador sin sede asignada). Pídele a esa persona que actualice la matrícula o las cuentas.","Sección restringida")}</div>`);return}const t=await we();if(!e.vigente())return;let a=t;const o=()=>{m(e.zona,Ba(a)),r()},i=async()=>{a=await we(),e.vigente()&&o()},r=()=>{const l=d("#config-raiz",HTMLElement,e.zona);d("#form-matricula",HTMLFormElement,l).addEventListener("submit",p=>{p.preventDefault(),Ra(d("#form-matricula",HTMLFormElement,l),c=>{a={...a,matricula_usd:c},o()})}),l.addEventListener("click",p=>{const c=p.target instanceof Element?p.target.closest("[data-accion]"):null;if(!(c instanceof HTMLButtonElement))return;const u=c.dataset.accion,v=a.cuentas.find(y=>y.id===Number(c.dataset.id));u==="nueva"?_e(null,a.sedes,i):u==="editar"&&v?_e(v,a.sedes,i):u==="alternar"&&v&&Na(c,v,i)})};o()}async function Ra(e,t){const a=Ue(X(new FormData(e),"matricula_usd"));if(a===null){B(e,{matricula_usd:`Escribe un monto mayor que 0 y hasta ${Ne.toLocaleString("en-US")}, con máximo 2 decimales.`});return}B(e,{});try{const o=await A(d('button[type="submit"]',HTMLButtonElement,e),()=>h.put("/configuracion/matricula",{matricula_usd:a}));T("ok",`Matrícula actualizada a ${x(o.matricula_usd)}.`),t(o.matricula_usd)}catch(o){if(o instanceof _){window.location.reload();return}B(e,o instanceof K?Ge(o):{matricula_usd:w(o)})}}async function Na(e,t,a){const o={metodo:t.metodo,titular:t.titular,detalle:t.detalle,activa:!t.activa,sede_id:t.sede_id};try{await A(e,()=>h.put(`/configuracion/cuentas/${t.id}`,o)),T("ok",o.activa?"Cuenta activada: ya la ven las familias.":"Cuenta desactivada: las familias ya no la ven."),await a()}catch(i){if(i instanceof _){window.location.reload();return}T("bad",w(i))}}function We(e,t){return Fe(e)?s`${me[e].campos.map(a=>s`<div>
      <label for="f-campo_${a.id}" class="${n.etiqueta}">${a.etiqueta}</label>
      <input id="f-campo_${a.id}" name="campo_${a.id}" type="${a.tipo}" inputmode="${a.inputmode}" autocomplete="off" required
        placeholder="${a.placeholder}" value="${z(t,a.id)}" class="${n.input}" aria-describedby="ay-${a.id} er-${a.id}">
      <p id="ay-${a.id}" class="${n.ayuda}">${a.ayuda}</p>
      <p id="er-${a.id}" data-error="campo_${a.id}" class="${n.errorCampo}" hidden></p>
    </div>`)}`:s`<p class="${n.ayuda}">Elige un método para ver los datos que se piden.</p>`}function Fa(e,t,a,o){const i=e?.metodo??"",r=e===null?"":e.sede_id===null?"comun":String(e.sede_id);return s`<form id="form-cuenta" novalidate class="grid gap-4">
    <div data-error="general" hidden></div>
    ${o===null?null:g("warn",s`El dato guardado no sigue el formato estructurado: <span class="font-semibold">${o}</span>. Complétalo con los campos de abajo para reemplazarlo.`,"Datos anteriores")}
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="f-metodo" class="${n.etiqueta}">Método de pago</label>
        <select id="f-metodo" name="metodo" required class="${n.input}" aria-describedby="er-metodo">
          <option value="" ${i===""?"selected":""} disabled>Selecciona un método…</option>
          ${fe.map(l=>s`<option value="${l}" ${l===i?"selected":""}>${q(l)}</option>`)}
        </select>
        <p id="er-metodo" data-error="metodo" class="${n.errorCampo}" hidden></p>
      </div>
      <div>
        <label for="f-ambito" class="${n.etiqueta}">Sede a la que aplica</label>
        <select id="f-ambito" name="ambito" required class="${n.input}" aria-describedby="ay-ambito er-ambito">
          <option value="" ${r===""?"selected":""} disabled>Selecciona el ámbito…</option>
          <option value="comun" ${r==="comun"?"selected":""}>Común (todas las sedes)</option>
          ${t.map(l=>s`<option value="${l.id}" ${String(l.id)===r?"selected":""}>${l.nombre}${l.activa?"":" (inactiva)"}</option>`)}
        </select>
        <p id="ay-ambito" class="${n.ayuda}">Las cuentas de una sede solo las ven las familias de esa sede.</p>
        <p id="er-ambito" data-error="ambito" class="${n.errorCampo}" hidden></p>
      </div>
    </div>
    <div>
      <label for="f-titular" class="${n.etiqueta}">Titular de la cuenta</label>
      <input id="f-titular" name="titular" type="text" maxlength="${re}" autocomplete="off" required value="${e?.titular??""}"
        class="${n.input}" aria-describedby="er-titular">
      <p id="er-titular" data-error="titular" class="${n.errorCampo}" hidden></p>
    </div>
    <div id="campos-metodo" class="grid gap-4" aria-live="polite">${We(i,a)}</div>
    <label class="flex items-center gap-3 text-sm font-medium text-slate-800">
      <input type="checkbox" name="activa" ${e===null||e.activa?"checked":""} class="h-4 w-4 rounded border-slate-300">
      <span>Cuenta activa (visible para las familias)</span>
    </label>
    <div class="flex flex-wrap justify-end gap-3">
      <button type="button" data-cancelar class="${b(n.btnSecundario)}">Cancelar</button>
      <button type="submit" class="${b(n.btnPrimario)}">${$("check","h-4 w-4")}<span>${e===null?"Agregar cuenta":"Guardar cambios"}</span></button>
    </div>
  </form>`}function Ua(e){const t=new FormData(e),a={};for(const[o,i]of t.entries())o.startsWith("campo_")&&typeof i=="string"&&(a[o.slice(6)]=i);return{metodo:X(t,"metodo"),titular:X(t,"titular"),ambito:X(t,"ambito"),activa:t.get("activa")!==null,campos:a}}function _e(e,t,a){const o=e?me[e.metodo].interpretar(e.detalle):null,i=e!==null&&o===null?e.detalle:null,r=N({titulo:e===null?"Agregar cuenta de cobro":"Editar cuenta de cobro",ancho:"lg",cuerpo:Fa(e,t,o??{},i)}),l=d("#form-cuenta",HTMLFormElement,r.dialogo);d("#f-metodo",HTMLSelectElement,l).addEventListener("change",p=>{const c=p.target instanceof HTMLSelectElement?p.target.value:"";m(d("#campos-metodo",HTMLElement,l),We(c,e!==null&&e.metodo===c&&o?o:{}))}),d("[data-cancelar]",HTMLButtonElement,l).addEventListener("click",()=>r.cerrar()),l.addEventListener("submit",p=>{p.preventDefault(),Va(l,e,t,r,a)}),d("#f-metodo",HTMLSelectElement,l).focus()}async function Va(e,t,a,o,i){const r=Ia(Ua(e),a);B(e,r.errores);const l=d('[data-error="general"]',HTMLElement,e);if(l.hidden=!0,r.cuerpo===null)return;const p=r.cuerpo;try{await A(d('button[type="submit"]',HTMLButtonElement,e),()=>t===null?h.post("/configuracion/cuentas",p):h.put(`/configuracion/cuentas/${t.id}`,p)),o.cerrar(),T("ok",t===null?"Cuenta agregada.":"Cuenta actualizada."),await i()}catch(c){if(c instanceof _){window.location.reload();return}const u=c instanceof K?Ge(c):{general:w(c)},v=u.general;B(e,{...u,general:""}),v&&(l.hidden=!1,m(l,g("bad",v)))}}const le=150;function Me(e,t){const a={},o=e.concepto.trim();o===""?a.concepto="Escribe el concepto, por ejemplo «Mensualidad Noviembre 2026».":o.length>le&&(a.concepto=`El concepto admite hasta ${le} caracteres.`);const i=Ue(e.monto);return i===null&&(a.monto_usd="Escribe un monto en USD mayor que 0, con máximo 2 decimales (por ejemplo 85.00)."),Ga(e.vencimiento)?e.vencimiento<t&&(a.fecha_vencimiento="El vencimiento no puede ser anterior a hoy: todos los alumnos quedarían morosos de inmediato."):a.fecha_vencimiento="Elige la fecha de vencimiento.",Object.keys(a).length>0||i===null?{errores:a,cuerpo:null}:{errores:a,cuerpo:{concepto:o,monto_usd:i,fecha_vencimiento:e.vencimiento}}}function Ga(e){const t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!t)return!1;const[a,o,i]=[Number(t[1]),Number(t[2]),Number(t[3])],r=new Date(Date.UTC(a,o-1,i));return r.getUTCFullYear()===a&&r.getUTCMonth()===o-1&&r.getUTCDate()===i}function Wa(e,t){return e<=0?{tono:"inf",texto:`No se creó ninguna cuota nueva: todos los estudiantes activos ya tenían «${t}».`}:{tono:"okk",texto:`Se crearon ${e} ${e===1?"cuota":"cuotas"} de «${t}».`}}function Xe(e){return e===null?"todas las sedes":"tu sede"}function Xa(e,t){const a=e.modulo.en_prueba===!0&&e.modulo.expira_prueba_en?e.modulo.expira_prueba_en:null;return s`${I(e.modulo.nombre,"Genera la mensualidad de todos los estudiantes activos en un solo paso.")}
    ${a?s`<div class="mb-6">${g("warn",`Prueba gratuita vigente hasta el ${V(a)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba")}</div>`:null}
    ${e.puedeGenerar?s`<section class="${n.tarjetaCristal} max-w-2xl p-6" aria-labelledby="t-masiva">
          <h2 id="t-masiva" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${$("receipt","h-5 w-5")}Nueva facturación mensual</h2>
          <p class="${n.ayuda} mb-4">Se aplica a los estudiantes «Activo» de ${Xe(e.alcance)}. Repetir el mismo concepto no duplica cuotas.</p>
          <form id="form-masiva" novalidate class="flex flex-col gap-4" aria-label="Generar mensualidades">
            <div>
              <label for="f-concepto" class="${n.etiqueta}">Concepto <span class="text-red-800" aria-hidden="true">*</span></label>
              <input id="f-concepto" name="concepto" type="text" maxlength="${le}" required autocomplete="off" placeholder="Mensualidad Noviembre 2026" aria-describedby="e-concepto" class="${n.input}">
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
              <button type="submit" class="${b(n.btnPrimario)}">${$("receipt","h-4 w-4")}<span>Generar</span></button>
            </div>
          </form>
        </section>`:s`<div class="max-w-2xl">${g("info","La generación masiva de mensualidades es una función del administrador. Pídele a esa persona que la ejecute.","Sección restringida")}</div>`}`}function Le(e,t){for(const a of L("[data-error]",HTMLElement,e)){const o=t[a.dataset.error??""]??"";a.textContent=o,a.hidden=o===""}for(const a of L("[name]",HTMLElement,e))(t[a.getAttribute("name")??""]??"")!==""?a.setAttribute("aria-invalid","true"):a.removeAttribute("aria-invalid");P('[aria-invalid="true"]',HTMLElement,e)?.focus()}function Ae(e,t,a){m(e,s`<p class="msg ${t}" role="${t==="err"?"alert":"status"}" tabindex="-1"></p>`);const o=d(".msg",HTMLElement,e);o.textContent=a,o.focus()}function Ja(e,t){const a=d("#form-masiva",HTMLFormElement,e.zona),o=d("#masiva-resultado",HTMLElement,a),i=d("#masiva-vista-previa",HTMLElement,a),r=c=>{const u=a.elements.namedItem(c);return u instanceof HTMLInputElement?u.value:""},l=()=>({concepto:r("concepto"),monto:r("monto_usd"),vencimiento:r("fecha_vencimiento")}),p=()=>{const c=Me(l(),t);i.textContent=c.cuerpo?`Se creará «${c.cuerpo.concepto}» por ${x(c.cuerpo.monto_usd)} con vencimiento el ${U(c.cuerpo.fecha_vencimiento)} para cada estudiante activo de ${Xe(e.alcance)}.`:""};a.addEventListener("input",p),a.addEventListener("submit",c=>{c.preventDefault();const u=Me(l(),t);if(Le(a,u.errores),m(o,s``),u.cuerpo===null)return;const v=u.cuerpo,y=d('button[type="submit"]',HTMLButtonElement,a);A(y,()=>h.post("/facturacion/cuotas/generar-mensualidades",v)).then(k=>{if(!e.vigente())return;const D=Wa(k.creadas,v.concepto);Ae(o,D.tono,D.texto)}).catch(k=>{if(k instanceof _){e.alSesionExpirada();return}if(k instanceof K){const D=k.moduloPremium();if(D){e.alBloquear(D);return}const ve=k.camposInvalidos();ve.length>0&&Le(a,Object.fromEntries(ve.map(ge=>[ge.campo,ge.mensaje])))}e.vigente()&&Ae(o,"err",w(k))})})}function Ya(e){if(e.modulo.bloqueado){m(e.zona,je({nombre:e.modulo.nombre,descripcion:e.modulo.descripcion,precio_usd:e.modulo.precio_usd},e.puedeProbar)),Be(e.zona,e.alActivarPrueba);return}const t=ce();m(e.zona,Xa(e,t)),e.puedeGenerar&&Ja(e,t)}const ae={estructura:"M20 100 L60 18 L100 100",flecha:"M32 84 C54 82 76 66 90 40 M78 42 L91 37 L93 51",pata:"M46 108 L98 108"},W={claro:"#e2e8f0",medio:"#94a3b8",oscuro:"#475569"},Te={destello:{inicio:1400,duracion:850}},Za=Te.destello.inicio+Te.destello.duracion,Ce=`
@keyframes bma-estructura-in {
  from { transform: translate(0px, -64px); filter: blur(6px); opacity: 0; }
  60%  { opacity: 1; }
  to   { transform: translate(0px, 0px); filter: blur(0px); opacity: 1; }
}
@keyframes bma-flecha-in {
  from { transform: translate(-56px, 56px); opacity: 0; }
  60%  { opacity: 1; }
  to   { transform: translate(0px, 0px); opacity: 1; }
}
@keyframes bma-pata-in {
  from { transform: translate(0px, 56px); opacity: 0; }
  60%  { opacity: 1; }
  to   { transform: translate(0px, 0px); opacity: 1; }
}
@keyframes bma-acople {
  0%   { transform: scale(1); }
  45%  { transform: scale(1.045); }
  100% { transform: scale(1); }
}
@keyframes bma-destello {
  from { transform: translateX(-70px) skewX(-18deg); opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  to   { transform: translateX(190px) skewX(-18deg); opacity: 0; }
}
@keyframes bma-texto-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0px); }
}
@keyframes bma-acento-a {
  from { color: inherit; }
  to   { color: #0369a1; }
}
`,H={estructura:"[animation:bma-estructura-in_900ms_cubic-bezier(0.22,1,0.36,1)_0ms_both] motion-reduce:[animation:none] will-change-transform",flecha:"[animation:bma-flecha-in_900ms_cubic-bezier(0.22,1,0.36,1)_120ms_both] motion-reduce:[animation:none] will-change-transform",pata:"[animation:bma-pata-in_900ms_cubic-bezier(0.22,1,0.36,1)_240ms_both] motion-reduce:[animation:none] will-change-transform",acople:"[animation:bma-acople_320ms_cubic-bezier(0.22,1,0.36,1)_1140ms_both] motion-reduce:[animation:none]",destello:"[animation:bma-destello_850ms_cubic-bezier(0.22,1,0.36,1)_1400ms_both] motion-reduce:hidden opacity-0",texto:"[animation:bma-texto-in_600ms_cubic-bezier(0.22,1,0.36,1)_1700ms_both] motion-reduce:[animation:none]",acento:"[animation:bma-acento-a_600ms_cubic-bezier(0.22,1,0.36,1)_1700ms_both] motion-reduce:[animation:none]"},Se="bma-login-keyframes";let ke=!1;function Ka(){if(ke||document.getElementById(Se)!==null)return;ke=!0;try{const t=new CSSStyleSheet;t.replaceSync(Ce),document.adoptedStyleSheets=[...document.adoptedStyleSheets,t];return}catch{}const e=document.createElement("style");e.id=Se,e.textContent=Ce,document.head.append(e)}const Qa=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;function et(){return s`<div class="relative mx-auto flex w-full max-w-xs flex-col items-center gap-3 text-slate-900" data-bma-logo>
    <svg viewBox="0 0 120 120" class="h-32 w-32 overflow-visible" role="img" aria-labelledby="bma-logo-titulo">
      <title id="bma-logo-titulo">Brilliant Minds Academy</title>
      <defs>
        <linearGradient id="bma-metal" gradientUnits="userSpaceOnUse" x1="14" y1="10" x2="106" y2="112">
          <stop offset="0" stop-color="${W.claro}" />
          <stop offset="0.45" stop-color="${W.medio}" />
          <stop offset="0.7" stop-color="${W.claro}" />
          <stop offset="1" stop-color="${W.oscuro}" />
        </linearGradient>
        <linearGradient id="bma-brillo" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="26" y2="0">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0" />
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
        <!-- Geometría estática (sin animar) reutilizada por la máscara del destello: el brillo solo se ve sobre el trazo. -->
        <path id="bma-forma-estructura" d="${ae.estructura}" />
        <path id="bma-forma-flecha" d="${ae.flecha}" />
        <path id="bma-forma-pata" d="${ae.pata}" />
        <mask id="bma-mascara-destello" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
          <g fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
            <use href="#bma-forma-estructura" /><use href="#bma-forma-flecha" /><use href="#bma-forma-pata" />
          </g>
        </mask>
      </defs>

      <g class="${H.acople} origin-center [transform-box:fill-box]" fill="none" stroke="url(#bma-metal)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
        <g id="bma-capa-estructura" class="${H.estructura}">
          <use href="#bma-forma-estructura" />
        </g>
        <g id="bma-capa-flecha" class="${H.flecha}">
          <use href="#bma-forma-flecha" stroke-width="7" />
        </g>
        <g id="bma-capa-pata" class="${H.pata}">
          <use href="#bma-forma-pata" stroke-width="7" />
        </g>
      </g>

      <g mask="url(#bma-mascara-destello)" aria-hidden="true">
        <rect id="bma-destello" x="0" y="0" width="26" height="120" fill="url(#bma-brillo)"
          class="${H.destello}" />
      </g>
    </svg>
    <p class="text-center text-lg font-semibold tracking-tight ${H.texto}" data-bma-texto>
      <span class="${H.acento}" data-bma-acento>A</span>stra Academy
    </p>
  </div>`}function at(e){Ka();const t=()=>{if(m(e,et()),Qa())return Promise.resolve();const o=e.querySelector("#bma-destello");return new Promise(i=>{const r=window.setTimeout(i,Za+400);o?.addEventListener("animationend",()=>{window.clearTimeout(r),i()},{once:!0})})};return{terminada:t(),repetir:t,destruir:()=>m(e,s``)}}const Je="bma.sidebar.colapsado",tt=3e4,Ye=25,te=300,Ze=[{id:"dashboard",titulo:"Dashboard",icono:"home",soloAdmin:!1},{id:"estudiantes",titulo:"Estudiantes",icono:"users",soloAdmin:!1},{id:"auditoria",titulo:"Auditoría de referencias",icono:"inbox",soloAdmin:!1},{id:"contabilidad",titulo:"Contabilidad",icono:"book",soloAdmin:!0},{id:"configuracion",titulo:"Configuración de cobro",icono:"wallet",soloAdmin:!0}],Ke={IA_ATENCION:"bot",WHATSAPP_AUTOMATICO:"chat",BANCAMIGA:"wallet",APP_MOVIL:"phone",FACHADA_WEB:"globe",MULTI_SEDE_PREMIUM:"school",FACTURACION_MASIVA:"receipt"},ze=["","Activo","Moroso","Fuera de la Academia","Pendiente por Validación Administrativa"],Pe=["Por Validar","Aprobada","Rechazada"];let f={usuario:null,modulos:[],vista:"dashboard",colapsado:!1,periodo:pe(),filtroEstudiantes:"",paginaEstudiantes:1,filtroAuditoria:"Por Validar",paginaAuditoria:1};function C(e){f={...f,...e}}let J=0,Y=null;function ot(){try{const e=localStorage.getItem(Je);if(e==="1")return!0;if(e==="0")return!1}catch{}return window.matchMedia("(max-width: 767px)").matches}function nt(e){try{localStorage.setItem(Je,e?"1":"0")}catch{}}function st(e){if(typeof e!="object"||e===null)return!1;const t=e;return typeof t.id=="number"&&typeof t.nombre=="string"&&typeof t.email=="string"&&(t.rol==="admin"||t.rol==="secretaria")}function it(){const e=Q.usuarioCrudo();if(!e)return null;try{const t=JSON.parse(e);return st(t)?t:null}catch{return null}}const R=()=>f.usuario?.rol==="admin";function Qe(e){be(),J+=1,document.body.className="text-slate-900",m(d("#app",HTMLElement),s`<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div id="login-logo" class="w-full"></div>
      <div class="text-center">
        <h1 class="${n.titulo}">Brilliant Minds Academy</h1>
        <p class="${n.subtitulo}">Panel administrativo</p>
      </div>
      <form id="login" novalidate class="${n.tarjetaCristal} flex flex-col gap-4 p-6" aria-label="Iniciar sesión">
        <div id="login-aviso">${e?g("warn",e):null}</div>
        <div>
          <label for="login-email" class="${n.etiqueta}">Correo</label>
          <input id="login-email" name="email" type="email" required autocomplete="username" class="${n.input}">
        </div>
        <div>
          <label for="login-password" class="${n.etiqueta}">Contraseña</label>
          <input id="login-password" name="password" type="password" required autocomplete="current-password" class="${n.input}">
        </div>
        <button type="submit" class="${b(n.btnPrimario,"w-full")}"><span>Entrar</span></button>
      </form>
    </main>`),at(d("#login-logo",HTMLElement));const t=d("#login",HTMLFormElement);t.addEventListener("submit",a=>{a.preventDefault(),rt(t)}),d("#login-email",HTMLInputElement).focus()}async function rt(e){const t=d("#login-email",HTMLInputElement).value.trim(),a=d("#login-password",HTMLInputElement).value,o=d("#login-aviso",HTMLElement);if(!t||!a){m(o,g("bad","Escribe tu correo y tu contraseña."));return}try{const i=await A(d('button[type="submit"]',HTMLButtonElement,e),()=>h.post("/auth/login",{email:t,password:a},{sinAuth:!0}));Q.guardar(i.token,JSON.stringify(i.usuario)),await ea()}catch(i){m(o,g("bad",w(i)))}}function S(e){Q.cerrar(),C({usuario:null,modulos:[],vista:"dashboard"}),Qe(e)}function de(e){const{id:t,titulo:a,tooltip:o,bloqueado:i}=e;return s`<button type="button" data-nav="${t}" data-bloqueado="${i}"
    class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 aria-[current=page]:bg-slate-900 aria-[current=page]:text-white group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
    ${$(e.icono)}
    <span class="min-w-0 flex-1 truncate group-data-[collapsed=true]/sb:sr-only">${a}</span>
    ${i?s`<span class="text-slate-500 group-data-[collapsed=true]/sb:absolute group-data-[collapsed=true]/sb:right-2 group-data-[collapsed=true]/sb:top-1">${$("lock","h-4 w-4 group-data-[collapsed=true]/sb:h-3 group-data-[collapsed=true]/sb:w-3")}</span>`:null}
    <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">${o}</span>
  </button>`}function lt(){const e=f.usuario,t=Ze.filter(a=>!a.soloAdmin||R());return s`<div id="shell" data-collapsed="${f.colapsado}" class="group/sb flex min-h-screen">
    <aside id="barra-lateral" aria-label="Navegación principal"
      class="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white/95 backdrop-blur transition-[width] duration-200 group-data-[collapsed=true]/sb:w-20">
      <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-4 group-data-[collapsed=true]/sb:justify-center">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">${$("school")}</span>
        <span class="truncate text-sm font-bold text-slate-900 group-data-[collapsed=true]/sb:sr-only">BMA · Administración</span>
      </div>
      <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Secciones">
        ${t.map(a=>de({id:a.id,titulo:a.titulo,icono:a.icono,tooltip:a.titulo,bloqueado:!1}))}
        <p class="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 group-data-[collapsed=true]/sb:sr-only">Módulos Premium</p>
        <hr class="my-2 hidden border-slate-200 group-data-[collapsed=true]/sb:block">
        ${f.modulos.map(a=>de({id:`premium:${a.codigo}`,titulo:a.nombre,icono:Ke[a.codigo]??"chat",tooltip:a.bloqueado?`${a.nombre} · ${a.tooltip}`:a.nombre,bloqueado:a.bloqueado}))}
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
        <button type="button" id="alternar-sidebar" aria-controls="barra-lateral" aria-expanded="${!f.colapsado}" aria-label="${f.colapsado?"Expandir menú lateral":"Contraer menú lateral"}"
          class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${$("menu")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Contraer menú</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Expandir menú</span>
        </button>
      </div>
    </aside>
    <main id="contenido" tabindex="-1" class="min-w-0 flex-1 p-4 sm:p-8"></main>
  </div>`}function dt(){const e=!f.colapsado;C({colapsado:e}),nt(e);const t=d("#shell",HTMLElement);t.dataset.collapsed=String(e);const a=d("#alternar-sidebar",HTMLButtonElement);a.setAttribute("aria-expanded",String(!e)),a.setAttribute("aria-label",e?"Expandir menú lateral":"Contraer menú lateral")}function ct(e){const t=e.startsWith("estudiante:")?"estudiantes":e;for(const a of L("[data-nav]",HTMLElement))a.dataset.nav===t?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current")}async function ea(){if(!Q.token()){Qe();return}let e=it();try{e||(e=(await h.get("/auth/me")).usuario);const o=await h.get("/premium/modulos").catch(i=>{if(i instanceof _)throw i;return[]});C({usuario:e,modulos:o,colapsado:ot()})}catch(o){S(o instanceof _?"Tu sesión expiró. Inicia sesión de nuevo.":w(o));return}document.body.className="text-slate-900",m(d("#app",HTMLElement),lt()),d("#shell",HTMLElement).addEventListener("click",o=>{const r=(o.target instanceof Element?o.target:null)?.closest("[data-nav]");if(!(r instanceof HTMLElement))return;const l=r.dataset.nav??"";f.modulos.find(c=>`premium:${c.codigo}`===l)?.bloqueado&&(o.preventDefault(),o.stopPropagation()),M(l)}),d("#salir",HTMLButtonElement).addEventListener("click",()=>S()),d("#alternar-sidebar",HTMLButtonElement).addEventListener("click",dt);const a=f.vista.startsWith("premium:")||Ze.some(o=>o.id===f.vista)?f.vista:"dashboard";await M(a)}function be(){Y!==null&&(window.clearInterval(Y),Y=null)}async function M(e){be(),J+=1;const t=J;C({vista:e}),ct(e);const a=d("#contenido",HTMLElement),o={zona:a,vigente:()=>t===J};m(a,s`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando"></div>`);try{e.startsWith("premium:")?_t(o,e.slice(8)):e.startsWith("estudiante:")?await $t(o,e.slice(11)):e==="estudiantes"?await vt(o):e==="auditoria"?await xt(o):e==="contabilidad"&&R()?await wt(o):e==="configuracion"&&R()?await Oa({zona:o.zona,vigente:o.vigente,usuario:f.usuario}):await ft(o)}catch(i){aa(i,o)}}function aa(e,t){if(t.vigente()){if(e instanceof _){S("Tu sesión expiró. Inicia sesión de nuevo.");return}if(e instanceof K){const a=e.moduloPremium();if(a){ra(t.zona,a);return}}m(t.zona,s`<div class="mx-auto max-w-2xl pt-8">${g("bad",w(e),e instanceof ma?"Sin conexión":"No se pudo cargar la sección")}
      <button type="button" data-reintentar class="${b(n.btnSecundario,"mt-4")}">${$("refresh","h-4 w-4")}<span>Reintentar</span></button></div>`),P("[data-reintentar]",HTMLButtonElement,t.zona)?.addEventListener("click",()=>void M(f.vista))}}function ta(e){const t=Math.max(1,Math.ceil(e.total/Math.max(1,e.limite)));return s`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación">
    <span class="text-slate-600">Página ${e.pagina} de ${t} · ${e.total} registro(s)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${b(n.btnSecundario,n.btnPeq)}" ${e.pagina<=1?$e("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${b(n.btnSecundario,n.btnPeq)}" ${e.pagina>=t?$e("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function oa(e,t){for(const a of L("[data-pag]",HTMLButtonElement,e))a.addEventListener("click",()=>t(Number(a.dataset.pag)))}function Z(e){return s`<article class="${n.tarjeta} p-6">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-sm font-medium text-slate-600">${e.titulo}</h3>
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${$(e.icono,"h-4 w-4")}</span>
    </div>
    <p class="mt-3 text-2xl font-bold ${e.tono==="malo"?"text-red-800":"text-slate-900"}" data-kpi>${e.valor}</p>
    <p class="mt-1 text-xs text-slate-600">${e.detalle}</p>
  </article>`}function ut(e){const t=pa(e.periodo),a=new Map;for(const l of e.cobrado_por_dia)a.set(Number(l.dia.slice(8,10)),l.monto_usd);const o=Math.max(0,...a.values()),i=Array.from({length:t},(l,p)=>{const c=p+1,u=a.get(c)??0,v=o>0?Math.max(u>0?4:0,Math.round(u/o*100)):0;return s`<li class="group/barra relative flex h-full min-w-0 flex-1 flex-col justify-end" title="Día ${c}: ${x(u)}">
      <div data-alto="${v}" class="w-full rounded-t ${u>0?"bg-slate-800 group-hover/barra:bg-slate-600":"bg-slate-200"} ${u>0?"":"h-px"}"></div>
      <span class="sr-only">Día ${c}: ${x(u)}</span>
    </li>`}),r=Array.from({length:t},(l,p)=>s`<span class="min-w-0 flex-1 text-center text-xs text-slate-600">${(p+1)%5===0||p===0?p+1:""}</span>`);return s`<div role="group" aria-label="Cobrado por día en ${e.periodo}">
    <ul class="flex h-48 items-end gap-1 border-b border-slate-200">${i}</ul>
    <div class="mt-1 flex gap-1" aria-hidden="true">${r}</div>
  </div>`}function pt(e){for(const t of L("[data-alto]",HTMLElement,e)){const a=Number(t.dataset.alto);Number.isFinite(a)&&a>0&&(t.style.height=`${Math.min(100,a)}%`)}}function mt(e,t){const a=[{titulo:"Cobrado",valor:x(e.cobrado.monto_usd),detalle:`${e.cobrado.cantidad} pago(s) aprobados`,icono:"wallet",tono:"normal"},{titulo:"Saldos vencidos",valor:x(e.saldos_vencidos.monto_usd),detalle:`${e.saldos_vencidos.cantidad} cuota(s) vencida(s)`,icono:"alert",tono:"malo"},{titulo:"Cuentas pendientes del mes",valor:x(e.cuentas_pendientes.monto_usd),detalle:`${e.cuentas_pendientes.cantidad} cuota(s) por cobrar`,icono:"book",tono:"normal"},{titulo:"Referencias por validar",valor:String(e.referencias_por_validar),detalle:"en la bandeja de auditoría",icono:"inbox",tono:"normal"}];return s`
    <section aria-label="Indicadores del mes" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${a.map(Z)}</section>
    <section aria-label="Estudiantes por estado" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${[["Activos",t.activos],["Morosos",t.morosos],["Fuera de la Academia",t.fuera_de_la_academia],["Pendientes de validación",t.pendientes_validacion]].map(([o,i])=>s`<div class="${n.tarjeta} flex items-center justify-between gap-4 px-6 py-4"><span class="text-sm text-slate-700">${o}</span><strong class="text-lg text-slate-900">${i}</strong></div>`)}
    </section>
    <section class="${n.tarjeta} mt-6 p-6" aria-labelledby="t-barras">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="t-barras" class="text-base font-bold text-slate-900">Recaudación diaria</h2>
        <p class="text-sm text-slate-600">Cobrado del mes: <strong class="text-slate-900">${x(e.cobrado.monto_usd)}</strong></p>
      </div>
      ${ut(e)}
    </section>`}async function oe(e,t){const a=d("#tablero",HTMLElement,e.zona);t||m(a,s`<div class="h-48 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando tablero"></div>`);try{const[o,i]=await Promise.all([h.get("/facturacion/tablero",{periodo:f.periodo}),h.get("/estudiantes/resumen")]);if(!e.vigente())return;m(a,mt(o,i)),pt(a);const r=P("#actualizado",HTMLElement,e.zona);r&&(r.textContent=`Actualizado a las ${ua(new Date)}`)}catch(o){if(!e.vigente()||t&&!(o instanceof _))return;aa(o,e)}}async function ft(e){m(e.zona,s`${I("Dashboard","Tablero financiero en tiempo real",s`<div class="flex flex-wrap items-end gap-4">
        <div><label for="periodo" class="${n.etiqueta}">Período</label><input id="periodo" type="month" value="${f.periodo}" max="${pe()}" class="${n.input}"></div>
        <p id="actualizado" class="pb-2 text-xs text-slate-600" aria-live="off"></p>
      </div>`)}<div id="tablero"></div>`),d("#periodo",HTMLInputElement,e.zona).addEventListener("change",t=>{const a=t.target instanceof HTMLInputElement?t.target.value:"";/^\d{4}-\d{2}$/.test(a)&&(C({periodo:a}),oe(e,!1))}),await oe(e,!0),Y=window.setInterval(()=>{if(!e.vigente()){be();return}document.hidden||oe(e,!0)},tt)}function bt(e){return s`<tr>
    <td class="${n.td}"><button type="button" data-detalle="${e.id}" class="rounded-md text-left font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900" aria-label="Ver ficha de ${e.apellidos}, ${e.nombres}">${e.apellidos}, ${e.nombres}</button></td>
    <td class="${n.td}">${e.grado_solicitado}</td>
    <td class="${n.td}">${e.representante}</td>
    <td class="${n.td}">${F(e.estado_dinamico)}</td>
    <td class="${n.td} whitespace-nowrap">${x(e.deuda_vencida_usd)}</td>
    <td class="${n.td}"><div class="flex flex-wrap gap-2">
      <button type="button" data-alerta="preventiva" data-id="${e.id}" class="${b(n.btnSecundario,n.btnPeq)}">Preventiva</button>
      <button type="button" data-alerta="morosidad" data-id="${e.id}" class="${b(n.btnSecundario,n.btnPeq)}">Morosidad</button>
    </div></td>
  </tr>`}async function vt(e){const t=await h.pagina("/estudiantes",{estado:f.filtroEstudiantes,pagina:f.paginaEstudiantes,limite:Ye});if(e.vigente()){m(e.zona,s`${I("Estudiantes",`${t.paginacion.total} resultado(s)`)}
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
      ${ze.map(a=>s`<button type="button" data-filtro="${a}" aria-pressed="${a===f.filtroEstudiantes}" class="${b(n.btnSecundario,n.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${a===""?"Todos":a}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${n.tabla}">
        <caption class="sr-only">Listado de estudiantes</caption>
        <thead><tr><th scope="col" class="${n.th}">Estudiante</th><th scope="col" class="${n.th}">Grado</th><th scope="col" class="${n.th}">Representante</th><th scope="col" class="${n.th}">Estado</th><th scope="col" class="${n.th}">Deuda vencida</th><th scope="col" class="${n.th}">Alertas WhatsApp</th></tr></thead>
        <tbody>${t.datos.length===0?s`<tr><td colspan="6" class="${n.td}">Sin resultados.</td></tr>`:t.datos.map(bt)}</tbody>
      </table>
    </div>
    ${ta(t.paginacion)}`);for(const a of L("[data-filtro]",HTMLButtonElement,e.zona))a.addEventListener("click",()=>{const o=a.dataset.filtro??"",i=ze.find(r=>r===o)??"";C({filtroEstudiantes:i,paginaEstudiantes:1}),M("estudiantes")});oa(e.zona,a=>{C({paginaEstudiantes:Math.max(1,f.paginaEstudiantes+a)}),M("estudiantes")});for(const a of L("[data-detalle]",HTMLButtonElement,e.zona))a.addEventListener("click",()=>{const o=Number(a.dataset.detalle);Number.isInteger(o)&&o>0&&M(`estudiante:${o}`)});for(const a of L("[data-alerta]",HTMLButtonElement,e.zona))a.addEventListener("click",()=>{const o=a.dataset.alerta==="morosidad"?"morosidad":"preventiva";gt(o,Number(a.dataset.id),a)})}}async function gt(e,t,a){try{const o=await A(a,()=>h.post(`/notificaciones/whatsapp/${e}/${t}`)),i=N({titulo:e==="morosidad"?"Alerta de morosidad":"Alerta preventiva",ancho:"lg",cuerpo:s`<p class="text-sm text-slate-600">${x(o.monto_usd)} · ${ue(o.monto_bs)} · tasa BCV ${ca(o.tasa_bcv)}</p>
        <pre class="mt-4 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">${o.mensaje}</pre>
        <div id="alerta-resultado" class="mt-4"></div>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <a href="${qe(o.enlace_whatsapp,["https://wa.me/"])}" target="_blank" rel="noopener noreferrer" class="${b(n.btnPrimario)}">Abrir en WhatsApp</a>
          <button type="button" id="alerta-enviar" class="${b(n.btnSecundario)}">Enviar por API</button>
        </div>`}),r=d("#alerta-enviar",HTMLButtonElement,i.dialogo);r.addEventListener("click",()=>{const l=d("#alerta-resultado",HTMLElement,i.dialogo);A(r,()=>h.post(`/notificaciones/whatsapp/${e}/${t}`,{},{consulta:{enviar:!0}})).then(()=>m(l,g("ok","Mensaje enviado por la API de WhatsApp."))).catch(p=>m(l,g("bad",w(p))))})}catch(o){o instanceof _?S("Tu sesión expiró. Inicia sesión de nuevo."):T("bad",w(o))}}async function $t(e,t){const a=Number(t);if(!Number.isInteger(a)||a<=0){m(e.zona,s`<div class="mx-auto max-w-2xl pt-8">${g("bad","El identificador del estudiante no es válido.")}</div>`);return}await Pa({zona:e.zona,vigente:e.vigente,estudianteId:a,alVolver:()=>void M("estudiantes"),alSesionExpirada:()=>S("Tu sesión expiró. Inicia sesión de nuevo.")})}function ht(e){const t=e.estado==="Por Validar";return s`<tr>
    <td class="${n.td} whitespace-nowrap">${V(e.declarado_en)}</td>
    <td class="${n.td}"><span class="font-medium text-slate-900">${e.estudiante}</span><br><span class="text-xs text-slate-600">${e.concepto} · vence ${U(e.fecha_vencimiento)}</span></td>
    <td class="${n.td}"><strong class="break-all">${e.referencia}</strong><br><span class="text-xs text-slate-600">${e.representante}</span></td>
    <td class="${n.td}">${q(e.metodo_pago)}</td>
    <td class="${n.td} whitespace-nowrap">${x(e.monto_usd)}<br><span class="text-xs text-slate-600">${ue(e.monto_bs)}</span></td>
    <td class="${n.td}">${t?s`<div class="flex flex-wrap gap-2">
          <button type="button" data-aprobar="${e.id}" class="${b(n.btnOk,n.btnPeq)}">${$("check","h-4 w-4")}<span>Aprobar</span></button>
          <button type="button" data-rechazar="${e.id}" class="${b(n.btnPeligro,n.btnPeq)}">${$("x","h-4 w-4")}<span>Rechazar</span></button>
        </div>`:s`${F(e.estado)}${e.nota_revision?s`<p class="mt-1 max-w-xs break-words text-xs text-slate-600">${e.nota_revision}</p>`:null}`}</td>
  </tr>`}async function xt(e){const t=await h.pagina("/facturacion/auditoria",{estado:f.filtroAuditoria,pagina:f.paginaAuditoria,limite:Ye});if(!e.vigente())return;const a=R()?s`<button type="button" id="exportar" class="${b(n.btnSecundario)}">${$("down","h-4 w-4")}<span>Exportar histórico (.xlsx)</span></button>`:null;m(e.zona,s`${I("Bandeja de auditoría",`${t.paginacion.total} referencia(s) · ${f.filtroAuditoria}`,a)}
    <div id="auditoria-aviso" class="mb-4"></div>
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado de la referencia">
      ${Pe.map(r=>s`<button type="button" data-filtro="${r}" aria-pressed="${r===f.filtroAuditoria}" class="${b(n.btnSecundario,n.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${r}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${n.tabla}">
        <caption class="sr-only">Referencias de pago declaradas</caption>
        <thead><tr><th scope="col" class="${n.th}">Declarada</th><th scope="col" class="${n.th}">Estudiante</th><th scope="col" class="${n.th}">Referencia</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Acción</th></tr></thead>
        <tbody>${t.datos.length===0?s`<tr><td colspan="6" class="${n.td}">Bandeja vacía.</td></tr>`:t.datos.map(ht)}</tbody>
      </table>
    </div>
    ${ta(t.paginacion)}`);const o=d("#auditoria-aviso",HTMLElement,e.zona);for(const r of L("[data-filtro]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>{const l=r.dataset.filtro??"",p=Pe.find(c=>c===l)??"Por Validar";C({filtroAuditoria:p,paginaAuditoria:1}),M("auditoria")});oa(e.zona,r=>{C({paginaAuditoria:Math.max(1,f.paginaAuditoria+r)}),M("auditoria")});const i=new Map(t.datos.map(r=>[r.id,r]));for(const r of L("[data-aprobar]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>void yt(Number(r.dataset.aprobar),r,o));for(const r of L("[data-rechazar]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>{const l=i.get(Number(r.dataset.rechazar));l&&Et(l)});P("#exportar",HTMLButtonElement,e.zona)?.addEventListener("click",r=>{const l=r.currentTarget instanceof HTMLButtonElement?r.currentTarget:null;l&&na(l,"/exportaciones/facturacion.xlsx","facturacion.xlsx",o)})}async function na(e,t,a,o){try{await A(e,()=>h.descargar(t,a))}catch(i){i instanceof _?S("Tu sesión expiró. Inicia sesión de nuevo."):m(o,g("bad",w(i)))}}function sa(e,t){return`${t} · estatus de pago del alumno: ${e.estatus_pago} · deuda vencida ${x(e.deuda_vencida_usd)}.`}async function yt(e,t,a){try{const o=await A(t,()=>h.post(`/facturacion/auditoria/${e}/aprobar`,{}));T("ok",sa(o,"Referencia aprobada")),await M("auditoria")}catch(o){o instanceof _?S("Tu sesión expiró. Inicia sesión de nuevo."):m(a,g("bad",w(o)))}}function Et(e){const t=N({titulo:"Rechazar referencia",cuerpo:s`<form id="form-rechazo" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700">Referencia <strong class="break-all">${e.referencia}</strong> · ${e.estudiante} · ${x(e.monto_usd)}</p>
      <div>
        <label for="nota-rechazo" class="${n.etiqueta}">Motivo del rechazo <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="nota-rechazo" name="nota" rows="4" maxlength="${te}" required aria-describedby="nota-ayuda nota-error" class="${n.input}"></textarea>
        <p id="nota-ayuda" class="${n.ayuda}">Se guarda en el historial y se usa para avisar al representante. <span id="nota-contador">0/${te}</span></p>
        <p id="nota-error" class="${n.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="rechazo-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${b(n.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${b(n.btnPeligro)}">${$("x","h-4 w-4")}<span>Rechazar referencia</span></button>
      </div>
    </form>`}),a=d("#form-rechazo",HTMLFormElement,t.dialogo),o=d("#nota-rechazo",HTMLTextAreaElement,t.dialogo),i=d("#nota-error",HTMLElement,t.dialogo),r=d("#nota-contador",HTMLElement,t.dialogo);o.addEventListener("input",()=>{r.textContent=`${o.value.length}/${te}`,o.value.trim()!==""&&(i.hidden=!0,o.removeAttribute("aria-invalid"))}),d("[data-cancelar]",HTMLButtonElement,t.dialogo).addEventListener("click",t.cerrar),a.addEventListener("submit",l=>{l.preventDefault();const p=o.value.trim();if(p===""){i.textContent="Debes escribir el motivo del rechazo para continuar.",i.hidden=!1,o.setAttribute("aria-invalid","true"),o.focus();return}const c=d('button[type="submit"]',HTMLButtonElement,a);A(c,()=>h.post(`/facturacion/auditoria/${e.id}/rechazar`,{nota:p})).then(async u=>{t.cerrar(),T("ok",sa(u,"Referencia rechazada")),await M("auditoria")}).catch(u=>{if(u instanceof _){t.cerrar(),S("Tu sesión expiró. Inicia sesión de nuevo.");return}m(d("#rechazo-aviso",HTMLElement,t.dialogo),g("bad",w(u)))})}),o.focus()}async function wt(e){const t=await h.get("/contabilidad/balance",{periodo:f.periodo});if(!e.vigente())return;m(e.zona,s`${I("Contabilidad",`Balance neto del período ${t.periodo}`,s`<div class="flex flex-wrap items-end gap-4">
      <div><label for="periodo-conta" class="${n.etiqueta}">Período</label><input id="periodo-conta" type="month" value="${f.periodo}" max="${pe()}" class="${n.input}"></div>
      <button type="button" id="exportar" class="${b(n.btnPrimario)}">${$("down","h-4 w-4")}<span>Exportar nómina, egresos y personal (.xlsx)</span></button>
    </div>`)}
    <div id="conta-aviso" class="mb-4"></div>
    <section class="grid gap-4 sm:grid-cols-3" aria-label="Balance">
      ${Z({titulo:"Ingresos",valor:x(t.ingresos_usd),detalle:"Referencias aprobadas del período",icono:"wallet",tono:"normal"})}
      ${Z({titulo:"Egresos",valor:x(t.egresos_usd),detalle:"Egresos y nómina pagada",icono:"book",tono:"normal"})}
      ${Z({titulo:"Neto",valor:x(t.neto_usd),detalle:"Ingresos − egresos",icono:"check",tono:t.neto_usd<0?"malo":"normal"})}
    </section>`),d("#periodo-conta",HTMLInputElement,e.zona).addEventListener("change",o=>{const i=o.target instanceof HTMLInputElement?o.target.value:"";/^\d{4}-\d{2}$/.test(i)&&(C({periodo:i}),M("contabilidad"))});const a=d("#conta-aviso",HTMLElement,e.zona);d("#exportar",HTMLButtonElement,e.zona).addEventListener("click",o=>{const i=o.currentTarget instanceof HTMLButtonElement?o.currentTarget:null;i&&na(i,"/exportaciones/contabilidad.xlsx","contabilidad.xlsx",a)})}function _t(e,t){const a=f.modulos.find(i=>i.codigo===t);if(!a){m(e.zona,g("bad","Módulo no encontrado."));return}if(a.codigo==="FACTURACION_MASIVA"){Ya({zona:e.zona,vigente:e.vigente,modulo:a,puedeGenerar:R(),puedeProbar:a.prueba_utilizada===!1&&He(),alcance:f.usuario?.sede_id??null,alActivarPrueba:()=>Ie(a),alBloquear:i=>void Mt(e,i),alSesionExpirada:()=>S("Tu sesión expiró. Inicia sesión de nuevo.")});return}if(a.bloqueado){m(e.zona,je(a,a.prueba_utilizada===!1&&He())),Be(e.zona,()=>Ie(a));return}const o=a.en_prueba===!0&&a.expira_prueba_en?a.expira_prueba_en:null;m(e.zona,s`${I(a.nombre,a.descripcion)}
    <div class="${n.tarjeta} flex flex-col gap-4 p-6">
      ${o?g("warn",`Prueba gratuita vigente hasta el ${V(o)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba"):null}
      ${a.codigo==="MULTI_SEDE_PREMIUM"?g("info","El Core Base incluye dos sedes (Acarigua y Barquisimeto). Con este módulo el servidor admite la tercera sede y las siguientes (alta en POST /api/sedes, acceso consolidado).","Expansión multi-sede habilitada"):g("info","El módulo está habilitado para esta academia. Su lógica se publicará en la Fase 2 (ruta reservada en el servidor).","Módulo habilitado")}
    </div>`)}const He=()=>f.usuario?.rol==="admin"&&(f.usuario.sede_id??null)===null;function ia(e){const t=P(`[data-nav="premium:${e.codigo}"]`,HTMLElement);if(!t)return;const a=document.createElement("div");m(a,de({id:`premium:${e.codigo}`,titulo:e.nombre,icono:Ke[e.codigo]??"chat",tooltip:e.bloqueado?`${e.nombre} · ${e.tooltip??ne}`:e.nombre,bloqueado:e.bloqueado}));const o=a.firstElementChild;o&&t.replaceWith(o)}async function Ie(e){await h.post("/premium/activar-prueba",{modulo:e.codigo});const t=await h.get("/premium/modulos");C({modulos:t});for(const a of t)ia(a);T("ok","Prueba gratuita de 15 días activada."),await M(`premium:${e.codigo}`)}async function Mt(e,t){try{const a=await h.get("/premium/modulos");C({modulos:a});for(const o of a)ia(o)}catch(a){if(a instanceof _){S("Tu sesión expiró. Inicia sesión de nuevo.");return}e.vigente()&&ra(e.zona,t);return}e.vigente()&&await M(`premium:${t.modulo}`)}function ra(e,t){const a=f.modulos.find(o=>o.codigo===t.modulo);m(e,De({nombre:t.nombre,descripcion:a?.descripcion??"Este módulo forma parte de la Fase 2 del sistema.",precio_usd:t.precio_usd}))}ea();
