import{a as $,b as f,C as n,i as b,h as s,c as k,d as T,n as _,m as y,u as E,e as m,o as d,f as h,g as xe,j as R,k as Y,l as J,p as P,H as _a,q as N,r as Ue,s as Ma,t as B,v as Ee,B as w,w as j,x as A,y as W,z as ye,A as ne,D as La,E as Ta,F as Aa,G as Sa}from"./ui-DXHFT1rd.js";const ce="Módulo Premium Deshabilitado";function z(e,t,a=null){return s`<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><h1 class="${n.titulo}">${e}</h1><p class="${n.subtitulo}">${t}</p></div>
    ${a}
  </header>`}function Ca(){const e=s`<div class="flex items-center gap-4 border-b border-slate-100 py-4"><div class="h-8 w-8 rounded-full bg-slate-200"></div><div class="h-4 flex-1 rounded bg-slate-200"></div><div class="h-4 w-24 rounded bg-slate-200"></div></div>`;return s`<div aria-hidden="true" class="pointer-events-none select-none p-6">
    <div class="mb-4 h-6 w-1/3 rounded bg-slate-300"></div>${e}${e}${e}${e}${e}
  </div>`}function Ia(e){return s`<div data-candado class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 p-6 backdrop-blur-md">
    <div role="region" aria-label="${ce}" class="${n.tarjetaCristal} w-full max-w-md p-8 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">${b("lock","h-6 w-6")}</span>
      <h2 class="mt-4 text-lg font-bold text-slate-900">${ce}</h2>
      <p class="mt-1 text-sm font-semibold text-slate-800">${e.nombre}</p>
      <p class="mt-2 text-sm text-slate-700">${e.descripcion}</p>
      <p class="mt-4 text-2xl font-bold text-slate-900">${E(e.precio_usd)}</p>
      <p class="mt-1 text-xs text-slate-600">Pago único · solicítalo a Astra Digital Solutions</p>
    </div>
  </div>`}function Ve(e){return s`${z(e.nombre,e.descripcion)}
    <div class="${n.tarjeta} relative min-h-96 overflow-hidden">${Ca()}${Ia(e)}</div>`}function Ge(e,t){return s`${Ve(e)}${t?s`<div class="mt-6">${$("info",s`<p>Prueba este módulo sin costo durante 15 días. Al vencer se bloquea solo.</p>
        <button type="button" id="activar-prueba" class="${f(n.btnPrimario,"mt-3")}">${b("check","h-4 w-4")}<span>Activar prueba gratuita de 15 días</span></button>`,"Prueba gratuita disponible")}</div>`:null}`}function We(e,t){const a=k("#activar-prueba",HTMLButtonElement,e);a?.addEventListener("click",()=>{T(a,t).catch(o=>_("bad",y(o)))})}const U=300,Ha=["https://drive.google.com/","https://docs.google.com/"],ue="Sin registrar",Te={FOTO_CARNET:"Foto carnet",CEDULA_IDENTIDAD:"Cédula de identidad",ACTA_NACIMIENTO:"Acta de nacimiento"},ka={MATRICULA:"Matrícula",MENSUALIDAD:"Mensualidad",OTRO:"Otro"};function za(e,t){const a=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e),o=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t);if(!a||!o)return null;const[,i,r,l]=a.map(Number),[,p,c,u]=o.map(Number);if(i===void 0||r===void 0||l===void 0||p===void 0||c===void 0||u===void 0)return null;const v=p-i-(c<r||c===r&&u<l?1:0);return v>=0?v:null}function Pa(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(1)} MB`}function Xe(e){if(e===null||e==="")return null;const t=Ue(e,Ha);return t==="#"?null:t}const Ye=e=>e!==null&&e.trim()!==""?e:ue;function L(e,t){const a=t instanceof _a?t:Ye(t),o=t===null||typeof t=="string"&&t.trim()==="";return s`<div class="min-w-0"><dt class="text-xs font-semibold uppercase tracking-wide text-slate-600">${e}</dt>
    <dd class="mt-1 break-words text-sm ${o?"text-slate-600":"font-medium text-slate-900"}">${a}</dd></div>`}function ie(e,t,a){return s`<h2 id="${e}" class="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
    <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${b(a,"h-4 w-4")}</span>${t}</h2>`}function qa(e){const t=za(e.fecha_nacimiento,xe());return s`<section class="${n.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-academico">
    ${ie("t-academico","Información académica","school")}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${L("Grado",e.grado_solicitado)}
      ${L("Cédula de identidad",e.cedula_identidad)}
      ${L("Fecha de nacimiento",`${J(e.fecha_nacimiento)}${t!==null?` · ${t} años`:""}`)}
      ${L("Colegio de procedencia",e.colegio_procedencia)}
      ${L("Último grado aprobado",e.ultimo_grado_aprobado)}
      ${L("Inscrito",P(e.creado_en))}
    </dl>
  </section>`}function Da(e){const t=a=>a!==null&&a.trim()!==""?s`${N("Atención","warn")} <span class="ml-1">${a}</span>`:null;return s`<section class="${n.tarjeta} p-6 lg:col-span-2" aria-labelledby="t-medico">
    ${ie("t-medico","Datos médicos","heart")}
    <dl class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      ${L("Tipo de sangre",e.tipo_sangre)}
      ${L("Alergias",t(e.alergias)??ue)}
      ${L("Condiciones médicas",t(e.condiciones_medicas)??ue)}
      ${L("Medicamentos",e.medicamentos)}
      ${L("Contacto de emergencia",e.emergencia_nombre)}
      ${L("Teléfono de emergencia",e.emergencia_telefono)}
    </dl>
  </section>`}function ja(e){const t=Xe(e.drive_url);return s`<li class="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
    <span class="min-w-0"><span class="block truncate text-sm font-medium text-slate-900">${Te[e.tipo]}</span>
      <span class="block truncate text-xs text-slate-600">${e.nombre_archivo} · ${Pa(e.tamano_bytes)}</span></span>
    ${t!==null?s`<a href="${t}" target="_blank" rel="noopener noreferrer" class="${f(n.btnSecundario,n.btnPeq)}" aria-label="Abrir ${Te[e.tipo]} en Google Drive">Abrir</a>`:N("Sin enlace","neutral")}
  </li>`}function Oa(e){const t=Xe(e.drive_folder_url);return s`<section class="${n.tarjeta} p-6" aria-labelledby="t-drive">
    ${ie("t-drive","Expediente en Google Drive","folder")}
    ${t!==null?s`<a href="${t}" target="_blank" rel="noopener noreferrer" class="${f(n.btnPrimario,"w-full")}">${b("folder","h-4 w-4")}<span>Abrir expediente digitalizado</span></a>`:$("info","Este estudiante aún no tiene una carpeta de expediente en Google Drive.")}
    ${e.drive_folder_id!==null?s`<p class="${n.ayuda}">ID de carpeta: <span class="break-all font-mono">${e.drive_folder_id}</span></p>`:null}
    ${e.documentos.length>0?s`<ul class="mt-4" aria-label="Documentos digitalizados">${e.documentos.map(ja)}</ul>`:s`<p class="mt-4 text-sm text-slate-600">Sin documentos digitalizados.</p>`}
  </section>`}function Na(e){return s`<section class="${n.tarjeta} p-6" aria-labelledby="t-representante">
    ${ie("t-representante","Representante","users")}
    <dl class="grid gap-4">
      ${L("Nombre",`${e.rep_nombres} ${e.rep_apellidos}`)}
      ${L("Cédula",e.rep_cedula)}
      ${L("Correo",e.rep_email)}
      ${L("Teléfono",e.rep_telefono)}
    </dl>
  </section>`}function Ba(e){const t=e.estado==="Pendiente"||e.estado==="En Revisión";return s`<tr>
    <td class="${n.td}"><span class="font-medium text-slate-900">${e.concepto}</span></td>
    <td class="${n.td}">${ka[e.tipo]}</td>
    <td class="${n.td} whitespace-nowrap">${J(e.fecha_vencimiento)}${t&&Ma(e.fecha_vencimiento)?s` ${N("Vencida","bad")}`:null}</td>
    <td class="${n.td} whitespace-nowrap">${E(e.monto_usd)}</td>
    <td class="${n.td}">${Y(e.estado)}</td>
  </tr>`}function Ra(e,t){const a=t.get(e.cuota_id);return s`<tr>
    <td class="${n.td}"><span class="break-all font-medium text-slate-900">${e.referencia}</span>${a!==void 0?s`<span class="block text-xs text-slate-600">${a}</span>`:null}</td>
    <td class="${n.td}">${B(e.metodo_pago)}</td>
    <td class="${n.td} whitespace-nowrap">${P(e.declarado_en)}</td>
    <td class="${n.td} whitespace-nowrap">${E(e.monto_usd)}<span class="block text-xs text-slate-600">${Ee(e.monto_bs)}</span></td>
    <td class="${n.td}">${Y(e.estado)}</td>
  </tr>`}function Fa(e){return s`<section class="${n.tarjeta} overflow-hidden" aria-labelledby="t-cuotas">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-cuotas" class="text-base font-bold text-slate-900">Histórico de cuotas</h2>
      <span class="text-xs text-slate-600">${e.cuotas.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${n.tabla}">
        <caption class="sr-only">Histórico de cuotas del estudiante</caption>
        <thead><tr><th scope="col" class="${n.th}">Concepto</th><th scope="col" class="${n.th}">Tipo</th><th scope="col" class="${n.th}">Vencimiento</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Estado</th></tr></thead>
        <tbody>${e.cuotas.length===0?s`<tr><td colspan="5" class="${n.td}">Este estudiante no tiene cuotas.</td></tr>`:e.cuotas.map(Ba)}</tbody>
      </table>
    </div>
  </section>`}function Ua(e){const t=new Map(e.cuotas.map(a=>[a.id,a.concepto]));return s`<section class="${n.tarjeta} overflow-hidden" aria-labelledby="t-pagos">
    <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
      <h2 id="t-pagos" class="text-base font-bold text-slate-900">Pagos declarados por el representante</h2>
      <span class="text-xs text-slate-600">${e.pagos.length} registro(s)</span>
    </div>
    <div class="overflow-x-auto">
      <table class="${n.tabla}">
        <caption class="sr-only">Pagos declarados por el representante</caption>
        <thead><tr><th scope="col" class="${n.th}">Referencia</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Declarado</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Estado</th></tr></thead>
        <tbody>${e.pagos.length===0?s`<tr><td colspan="5" class="${n.td}">El representante aún no ha declarado pagos.</td></tr>`:e.pagos.map(a=>Ra(a,t))}</tbody>
      </table>
    </div>
  </section>`}function Va(e){const t=e.estatus_academico==="Fuera de la Academia";return s`<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <button type="button" data-accion="volver" class="${f(n.btnSecundario,n.btnPeq,"mb-3")}">${b("back","h-4 w-4")}<span>Volver al listado</span></button>
      <h1 id="ficha-titulo" tabindex="-1" class="${n.titulo} break-words">${e.apellidos}, ${e.nombres}</h1>
      <p class="${n.subtitulo} flex flex-wrap items-center gap-2">${Y(e.estado_dinamico)}<span>${e.grado_solicitado}</span>
        ${e.deuda_vencida_usd>0?s`<span class="font-semibold text-red-800">Deuda vencida: ${E(e.deuda_vencida_usd)}</span>`:null}</p>
    </div>
    <div class="flex flex-wrap gap-2" role="group" aria-label="Acciones sobre el estudiante">
      ${t?s`<button type="button" data-accion="reactivar" class="${f(n.btnOk)}">${b("refresh","h-4 w-4")}<span>Reactivar Estudiante</span></button>`:s`<button type="button" data-accion="retirar" class="${f(n.btnPeligro)}">${b("logout","h-4 w-4")}<span>Retirar Estudiante</span></button>`}
    </div>
  </header>
  ${t?s`<div class="mb-6">${$("warn",s`<p>Retirado el <strong>${e.fecha_retiro!==null?J(e.fecha_retiro):"fecha no registrada"}</strong>.</p>
        <p class="mt-1">Motivo: ${Ye(e.motivo_retiro)}</p>
        <p class="mt-1">Sus cuotas pendientes fueron anuladas al retirarlo; reactivarlo no las restaura.</p>`,"Fuera de la Academia")}</div>`:null}`}function Ga(e){return s`<div id="ficha-raiz">
    ${Va(e)}
    <div class="grid gap-6 lg:grid-cols-3">
      ${qa(e)}
      ${Na(e)}
      ${Da(e)}
      ${Oa(e)}
    </div>
    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      ${Fa(e)}
      ${Ua(e)}
    </div>
  </div>`}function Ae(e,t,a){const o={},i=e.trim();return i===""?o.motivo="Debes escribir el motivo del retiro para continuar.":i.length>U&&(o.motivo=`El motivo admite hasta ${U} caracteres.`),/^\d{4}-\d{2}-\d{2}$/.test(t)?t>a&&(o.fecha="La fecha de retiro no puede ser futura."):o.fecha="Elige la fecha del retiro.",o}function K(e,t,a){if(a===void 0){t.hidden=!0,e.removeAttribute("aria-invalid");return}t.textContent=a,t.hidden=!1,e.setAttribute("aria-invalid","true")}function Wa(e,t){const a=xe(),o=R({titulo:"Retirar estudiante",cuerpo:s`<form id="form-retiro" novalidate class="flex flex-col gap-4">
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
        <button type="button" data-cancelar class="${f(n.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${f(n.btnPeligro)}">${b("logout","h-4 w-4")}<span>Retirar estudiante</span></button>
      </div>
    </form>`}),i=d("#form-retiro",HTMLFormElement,o.dialogo),r=d("#retiro-motivo",HTMLTextAreaElement,o.dialogo),l=d("#retiro-fecha",HTMLInputElement,o.dialogo),p=d("#retiro-motivo-error",HTMLElement,o.dialogo),c=d("#retiro-fecha-error",HTMLElement,o.dialogo),u=d("#retiro-contador",HTMLElement,o.dialogo);r.addEventListener("input",()=>{u.textContent=`${r.value.length}/${U}`,r.value.trim()!==""&&K(r,p,void 0)}),l.addEventListener("input",()=>K(l,c,Ae(r.value,l.value,a).fecha)),d("[data-cancelar]",HTMLButtonElement,o.dialogo).addEventListener("click",o.cerrar),i.addEventListener("submit",v=>{v.preventDefault();const x=Ae(r.value,l.value,a);K(r,p,x.motivo),K(l,c,x.fecha),x.motivo!==void 0?r.focus():x.fecha!==void 0&&l.focus(),!(x.motivo!==void 0||x.fecha!==void 0)&&t(o,{motivo:r.value.trim(),fecha_retiro:l.value},d('button[type="submit"]',HTMLButtonElement,i))}),r.focus()}function Xa(e,t){const a=R({titulo:"Reactivar estudiante",cuerpo:s`<div class="flex flex-col gap-4">
      <p class="text-sm text-slate-700"><strong>${e.apellidos}, ${e.nombres}</strong> volverá a «Activo». Las cuotas que se anularon al retirarlo no se restauran: genera las que correspondan desde Facturación.</p>
      <div id="reactivar-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${f(n.btnSecundario)}">Cancelar</button>
        <button type="button" data-confirmar class="${f(n.btnOk)}">${b("check","h-4 w-4")}<span>Reactivar estudiante</span></button>
      </div>
    </div>`});d("[data-cancelar]",HTMLButtonElement,a.dialogo).addEventListener("click",a.cerrar);const o=d("[data-confirmar]",HTMLButtonElement,a.dialogo);o.addEventListener("click",()=>t(a,o)),o.focus()}async function Ya(e){const t=()=>h.get(`/estudiantes/${e.estudianteId}`);let a=await t();if(!e.vigente())return;m(e.zona,s`<div id="ficha-contenedor"></div>`);const o=d("#ficha-contenedor",HTMLElement,e.zona),i=()=>{m(o,Ga(a)),k("#ficha-titulo",HTMLElement,o)?.focus({preventScroll:!0})},r=async()=>{try{a=await t()}catch(u){u instanceof w?e.alSesionExpirada():_("bad",`La acción se realizó, pero no se pudo actualizar la ficha: ${y(u)}`);return}e.vigente()&&i()},l=(u,v,x)=>{if(u instanceof w){v.cerrar(),e.alSesionExpirada();return}m(d(x,HTMLElement,v.dialogo),$("bad",y(u)))},p=(u,v,x)=>{T(x,()=>h.post(`/estudiantes/${e.estudianteId}/retirar`,v)).then(async()=>{u.cerrar(),_("ok",`${a.nombres} ${a.apellidos} fue retirado de la academia.`),await r()}).catch(C=>l(C,u,"#retiro-aviso"))},c=(u,v)=>{T(v,()=>h.post(`/estudiantes/${e.estudianteId}/reactivar`)).then(async()=>{u.cerrar(),_("ok",`${a.nombres} ${a.apellidos} fue reactivado.`),await r()}).catch(x=>l(x,u,"#reactivar-aviso"))};o.addEventListener("click",u=>{const v=u.target instanceof Element?u.target.closest("[data-accion]"):null;if(!(v instanceof HTMLButtonElement))return;const x=v.dataset.accion;x==="volver"?e.alVolver():x==="retirar"?Wa(a,p):x==="reactivar"&&Xa(a,c)}),i()}const D=(e,t)=>e[t]??"",pe=/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/,Se=/^(?:\d{6,20}|[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,})$/,Ja=/^Banco (\d{4}) · Tel (0\d{10}) · Cédula\/RIF ([VEJGP]\d{5,10})$/,Ce=(e,t,a)=>({id:e,etiqueta:t,tipo:"email",inputmode:"email",placeholder:"pagos@academia.com",ayuda:a,error:"Escribe un correo válido, por ejemplo pagos@academia.com.",patron:pe,normalizar:o=>o.trim().toLowerCase()}),we={ZELLE:{campos:[Ce("correo","Correo de Zelle","Correo con el que la academia recibe pagos por Zelle.")],componer:e=>D(e,"correo"),interpretar:e=>pe.test(e)?{correo:e}:null},PAYPAL:{campos:[Ce("correo","Correo de PayPal","Cuenta de PayPal que recibe los pagos.")],componer:e=>D(e,"correo"),interpretar:e=>pe.test(e)?{correo:e}:null},BINANCE:{campos:[{id:"idBinance",etiqueta:"Pay ID o correo de Binance",tipo:"text",inputmode:"text",placeholder:"123456789",ayuda:"Pay ID numérico (6 a 20 dígitos) o el correo de la cuenta Binance.",error:"Escribe un Pay ID numérico de 6 a 20 dígitos o un correo válido.",patron:Se,normalizar:e=>e.trim().toLowerCase()}],componer:e=>D(e,"idBinance"),interpretar:e=>Se.test(e)?{idBinance:e}:null},PAGO_MOVIL:{campos:[{id:"banco",etiqueta:"Código del banco",tipo:"text",inputmode:"numeric",placeholder:"0102",ayuda:"Cuatro dígitos (0102 = Banco de Venezuela, 0105 = Mercantil…).",error:"El código del banco son exactamente 4 dígitos.",patron:/^\d{4}$/,normalizar:e=>e.trim()},{id:"telefono",etiqueta:"Teléfono afiliado",tipo:"text",inputmode:"tel",placeholder:"04141234567",ayuda:"11 dígitos, empezando por 0 (sin espacios ni guiones).",error:"Escribe 11 dígitos empezando por 0, por ejemplo 04141234567.",patron:/^0\d{10}$/,normalizar:e=>e.replace(/[\s.-]/g,"")},{id:"documento",etiqueta:"Cédula o RIF del titular",tipo:"text",inputmode:"text",placeholder:"V12345678",ayuda:"Letra (V, E, J, G o P) seguida de 5 a 10 dígitos.",error:"Escribe la letra (V, E, J, G o P) y de 5 a 10 dígitos, por ejemplo V12345678.",patron:/^[VEJGP]\d{5,10}$/,normalizar:e=>e.replace(/[\s.-]/g,"").toUpperCase()}],componer:e=>`Banco ${D(e,"banco")} · Tel ${D(e,"telefono")} · Cédula/RIF ${D(e,"documento")}`,interpretar:e=>{const t=Ja.exec(e);return t?{banco:t[1]??"",telefono:t[2]??"",documento:t[3]??""}:null}}},_e=["ZELLE","BINANCE","PAYPAL","PAGO_MOVIL"],me=150,Je=99999999,Ze=e=>_e.some(t=>t===e);function Za(e,t){const a={},o=e.titular.trim();o===""?a.titular="El titular es obligatorio.":o.length>me&&(a.titular=`Máximo ${me} caracteres.`);let i=null;if(e.ambito==="")a.ambito="Elige a qué sede aplica la cuenta o márcala como común a todas.";else if(e.ambito!=="comun"){const c=Number(e.ambito);Number.isInteger(c)&&t.some(u=>u.id===c)?i=c:a.ambito="La sede elegida no existe. Recarga la página."}const r=e.metodo;if(!Ze(r))return a.metodo="Elige un método de pago.",{errores:a,cuerpo:null};const l=we[r],p={};for(const c of l.campos){const u=c.normalizar(D(e.campos,c.id));p[c.id]=u,c.patron.test(u)||(a[`campo_${c.id}`]=c.error)}return Object.keys(a).length>0?{errores:a,cuerpo:null}:{errores:a,cuerpo:{metodo:r,titular:o,detalle:l.componer(p),activa:e.activa,sede_id:i}}}function Ke(e){const t=e.trim().replace(",",".");if(!/^\d+(?:\.\d{1,2})?$/.test(t))return null;const a=Number(t);return Number.isFinite(a)&&a>0&&a<=Je?a:null}const Ka=e=>e?.rol==="admin"&&(e.sede_id??null)===null;async function Ie(){const[e,t]=await Promise.all([h.get("/configuracion"),h.get("/sedes")]);return{matricula_usd:e.matricula_usd,cuentas:e.cuentas,sedes:t}}const Qe=(e,t)=>{if(e===null)return"Común (todas las sedes)";const a=t.find(o=>o.id===e);return a?a.nombre:`Sede #${e}`};function Qa(e,t){const a=o=>`${o.sede_id===null?"0":"1"}|${Qe(o.sede_id,t)}|${_e.indexOf(o.metodo)}|${String(o.id).padStart(10,"0")}`;return[...e].sort((o,i)=>a(o).localeCompare(a(i),"es"))}const ee=(e,t)=>{const a=e.get(t);return typeof a=="string"?a:""};function V(e,t){for(const a of A("[data-error]",HTMLElement,e)){const o=t[a.dataset.error??""]??"";a.textContent=o,a.hidden=o===""}for(const a of A("[name]",HTMLElement,e))(t[a.getAttribute("name")??""]??"")!==""?a.setAttribute("aria-invalid","true"):a.removeAttribute("aria-invalid");k('[aria-invalid="true"]',HTMLElement,e)?.focus()}function ea(e){const t={titular:"titular",sede_id:"ambito",metodo:"metodo",detalle:"general",matricula_usd:"matricula_usd"},a={};for(const o of e.camposInvalidos())a[t[o.campo]??"general"]=o.mensaje;return Object.keys(a).length===0&&(a.general=e.message),a}function et(e,t){if(e.length===0)return $("warn","Todavía no hay cuentas de cobro. Mientras no exista ninguna activa, las familias verán «Consulta los datos de pago con la administración».");const a=Qa(e,t).map(o=>s`<tr>
      <td class="${n.td}">${Qe(o.sede_id,t)}</td>
      <td class="${n.td} font-semibold">${B(o.metodo)}</td>
      <td class="${n.td}">${o.titular}</td>
      <td class="${n.td} break-words">${o.detalle}</td>
      <td class="${n.td}">${o.activa?N("Activa","ok"):N("Inactiva","neutral")}</td>
      <td class="${n.td}">
        <div class="flex flex-wrap gap-2">
          <button type="button" data-accion="editar" data-id="${o.id}" class="${f(n.btnSecundario,n.btnPeq)}" aria-label="Editar la cuenta de ${B(o.metodo)} de ${o.titular}">Editar</button>
          <button type="button" data-accion="alternar" data-id="${o.id}" class="${f(n.btnSecundario,n.btnPeq)}" aria-label="${o.activa?"Desactivar":"Activar"} la cuenta de ${B(o.metodo)} de ${o.titular}">${o.activa?"Desactivar":"Activar"}</button>
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
  </div>`}function at(e){const t=e.matricula_usd<=0;return s`<div id="config-raiz">
    <header class="mb-6">
      <h1 class="${n.titulo}">Configuración de cobro</h1>
      <p class="${n.subtitulo}">Costo de la matrícula y cuentas donde las familias depositan.</p>
    </header>

    <section class="${n.tarjeta} mb-6 p-6" aria-labelledby="t-matricula">
      <h2 id="t-matricula" class="text-base font-bold text-slate-900">Costo de la matrícula</h2>
      <p class="${n.ayuda}">Monto único en dólares para todas las sedes. Se muestra en el formulario público de admisiones junto a su equivalente en bolívares a la tasa BCV.</p>
      <div class="mt-4">${t?$("warn","La matrícula aún no está configurada: las inscripciones públicas permanecen bloqueadas hasta que fijes un monto."):$("info",s`Matrícula vigente: <strong>${E(e.matricula_usd)}</strong>.`)}</div>
      <form id="form-matricula" novalidate class="mt-4 grid gap-4 sm:grid-cols-3 sm:items-start">
        <div class="sm:col-span-1">
          <label for="f-matricula" class="${n.etiqueta}">Monto en USD</label>
          <input id="f-matricula" name="matricula_usd" type="text" inputmode="decimal" autocomplete="off" required placeholder="120.00"
            value="${t?"":e.matricula_usd.toFixed(2)}" class="${n.input}" aria-describedby="ay-matricula er-matricula">
          <p id="ay-matricula" class="${n.ayuda}">Hasta dos decimales. Ejemplo: 120.00</p>
          <p id="er-matricula" data-error="matricula_usd" class="${n.errorCampo}" hidden></p>
        </div>
        <div class="flex items-end sm:col-span-2 sm:pt-6">
          <button type="submit" class="${f(n.btnPrimario)}">${b("check","h-4 w-4")}<span>Guardar matrícula</span></button>
        </div>
      </form>
    </section>

    <section class="${n.tarjeta} p-6" aria-labelledby="t-cuentas">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 id="t-cuentas" class="text-base font-bold text-slate-900">Cuentas de cobro</h2>
          <p class="${n.ayuda}">Datos públicos de Zelle, Binance Pay, PayPal y Pago Móvil. Nunca registres contraseñas ni claves aquí: esta información se muestra a las familias.</p>
        </div>
        <button type="button" data-accion="nueva" class="${f(n.btnPrimario)}">${b("wallet","h-4 w-4")}<span>Agregar cuenta</span></button>
      </div>
      ${et(e.cuentas,e.sedes)}
      <div class="mt-4">${$("info","Una familia ve las cuentas activas comunes más las de su sede. Si entra sin enlace de invitación, solo ve las comunes.")}</div>
    </section>
  </div>`}async function tt(e){if(!Ka(e.usuario)){m(e.zona,s`<div class="mx-auto max-w-2xl pt-8">${$("info","La configuración de cobro es del acceso consolidado (administrador sin sede asignada). Pídele a esa persona que actualice la matrícula o las cuentas.","Sección restringida")}</div>`);return}const t=await Ie();if(!e.vigente())return;let a=t;const o=()=>{m(e.zona,at(a)),r()},i=async()=>{a=await Ie(),e.vigente()&&o()},r=()=>{const l=d("#config-raiz",HTMLElement,e.zona);d("#form-matricula",HTMLFormElement,l).addEventListener("submit",p=>{p.preventDefault(),ot(d("#form-matricula",HTMLFormElement,l),c=>{a={...a,matricula_usd:c},o()})}),l.addEventListener("click",p=>{const c=p.target instanceof Element?p.target.closest("[data-accion]"):null;if(!(c instanceof HTMLButtonElement))return;const u=c.dataset.accion,v=a.cuentas.find(x=>x.id===Number(c.dataset.id));u==="nueva"?He(null,a.sedes,i):u==="editar"&&v?He(v,a.sedes,i):u==="alternar"&&v&&nt(c,v,i)})};o()}async function ot(e,t){const a=Ke(ee(new FormData(e),"matricula_usd"));if(a===null){V(e,{matricula_usd:`Escribe un monto mayor que 0 y hasta ${Je.toLocaleString("en-US")}, con máximo 2 decimales.`});return}V(e,{});try{const o=await T(d('button[type="submit"]',HTMLButtonElement,e),()=>h.put("/configuracion/matricula",{matricula_usd:a}));_("ok",`Matrícula actualizada a ${E(o.matricula_usd)}.`),t(o.matricula_usd)}catch(o){if(o instanceof w){window.location.reload();return}V(e,o instanceof j?ea(o):{matricula_usd:y(o)})}}async function nt(e,t,a){const o={metodo:t.metodo,titular:t.titular,detalle:t.detalle,activa:!t.activa,sede_id:t.sede_id};try{await T(e,()=>h.put(`/configuracion/cuentas/${t.id}`,o)),_("ok",o.activa?"Cuenta activada: ya la ven las familias.":"Cuenta desactivada: las familias ya no la ven."),await a()}catch(i){if(i instanceof w){window.location.reload();return}_("bad",y(i))}}function aa(e,t){return Ze(e)?s`${we[e].campos.map(a=>s`<div>
      <label for="f-campo_${a.id}" class="${n.etiqueta}">${a.etiqueta}</label>
      <input id="f-campo_${a.id}" name="campo_${a.id}" type="${a.tipo}" inputmode="${a.inputmode}" autocomplete="off" required
        placeholder="${a.placeholder}" value="${D(t,a.id)}" class="${n.input}" aria-describedby="ay-${a.id} er-${a.id}">
      <p id="ay-${a.id}" class="${n.ayuda}">${a.ayuda}</p>
      <p id="er-${a.id}" data-error="campo_${a.id}" class="${n.errorCampo}" hidden></p>
    </div>`)}`:s`<p class="${n.ayuda}">Elige un método para ver los datos que se piden.</p>`}function it(e,t,a,o){const i=e?.metodo??"",r=e===null?"":e.sede_id===null?"comun":String(e.sede_id);return s`<form id="form-cuenta" novalidate class="grid gap-4">
    <div data-error="general" hidden></div>
    ${o===null?null:$("warn",s`El dato guardado no sigue el formato estructurado: <span class="font-semibold">${o}</span>. Complétalo con los campos de abajo para reemplazarlo.`,"Datos anteriores")}
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="f-metodo" class="${n.etiqueta}">Método de pago</label>
        <select id="f-metodo" name="metodo" required class="${n.input}" aria-describedby="er-metodo">
          <option value="" ${i===""?"selected":""} disabled>Selecciona un método…</option>
          ${_e.map(l=>s`<option value="${l}" ${l===i?"selected":""}>${B(l)}</option>`)}
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
      <input id="f-titular" name="titular" type="text" maxlength="${me}" autocomplete="off" required value="${e?.titular??""}"
        class="${n.input}" aria-describedby="er-titular">
      <p id="er-titular" data-error="titular" class="${n.errorCampo}" hidden></p>
    </div>
    <div id="campos-metodo" class="grid gap-4" aria-live="polite">${aa(i,a)}</div>
    <label class="flex items-center gap-3 text-sm font-medium text-slate-800">
      <input type="checkbox" name="activa" ${e===null||e.activa?"checked":""} class="h-4 w-4 rounded border-slate-300">
      <span>Cuenta activa (visible para las familias)</span>
    </label>
    <div class="flex flex-wrap justify-end gap-3">
      <button type="button" data-cancelar class="${f(n.btnSecundario)}">Cancelar</button>
      <button type="submit" class="${f(n.btnPrimario)}">${b("check","h-4 w-4")}<span>${e===null?"Agregar cuenta":"Guardar cambios"}</span></button>
    </div>
  </form>`}function st(e){const t=new FormData(e),a={};for(const[o,i]of t.entries())o.startsWith("campo_")&&typeof i=="string"&&(a[o.slice(6)]=i);return{metodo:ee(t,"metodo"),titular:ee(t,"titular"),ambito:ee(t,"ambito"),activa:t.get("activa")!==null,campos:a}}function He(e,t,a){const o=e?we[e.metodo].interpretar(e.detalle):null,i=e!==null&&o===null?e.detalle:null,r=R({titulo:e===null?"Agregar cuenta de cobro":"Editar cuenta de cobro",ancho:"lg",cuerpo:it(e,t,o??{},i)}),l=d("#form-cuenta",HTMLFormElement,r.dialogo);d("#f-metodo",HTMLSelectElement,l).addEventListener("change",p=>{const c=p.target instanceof HTMLSelectElement?p.target.value:"";m(d("#campos-metodo",HTMLElement,l),aa(c,e!==null&&e.metodo===c&&o?o:{}))}),d("[data-cancelar]",HTMLButtonElement,l).addEventListener("click",()=>r.cerrar()),l.addEventListener("submit",p=>{p.preventDefault(),rt(l,e,t,r,a)}),d("#f-metodo",HTMLSelectElement,l).focus()}async function rt(e,t,a,o,i){const r=Za(st(e),a);V(e,r.errores);const l=d('[data-error="general"]',HTMLElement,e);if(l.hidden=!0,r.cuerpo===null)return;const p=r.cuerpo;try{await T(d('button[type="submit"]',HTMLButtonElement,e),()=>t===null?h.post("/configuracion/cuentas",p):h.put(`/configuracion/cuentas/${t.id}`,p)),o.cerrar(),_("ok",t===null?"Cuenta agregada.":"Cuenta actualizada."),await i()}catch(c){if(c instanceof w){window.location.reload();return}const u=c instanceof j?ea(c):{general:y(c)},v=u.general;V(e,{...u,general:""}),v&&(l.hidden=!1,m(l,$("bad",v)))}}const fe=150;function ke(e,t){const a={},o=e.concepto.trim();o===""?a.concepto="Escribe el concepto, por ejemplo «Mensualidad Noviembre 2026».":o.length>fe&&(a.concepto=`El concepto admite hasta ${fe} caracteres.`);const i=Ke(e.monto);return i===null&&(a.monto_usd="Escribe un monto en USD mayor que 0, con máximo 2 decimales (por ejemplo 85.00)."),lt(e.vencimiento)?e.vencimiento<t&&(a.fecha_vencimiento="El vencimiento no puede ser anterior a hoy: todos los alumnos quedarían morosos de inmediato."):a.fecha_vencimiento="Elige la fecha de vencimiento.",Object.keys(a).length>0||i===null?{errores:a,cuerpo:null}:{errores:a,cuerpo:{concepto:o,monto_usd:i,fecha_vencimiento:e.vencimiento}}}function lt(e){const t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!t)return!1;const[a,o,i]=[Number(t[1]),Number(t[2]),Number(t[3])],r=new Date(Date.UTC(a,o-1,i));return r.getUTCFullYear()===a&&r.getUTCMonth()===o-1&&r.getUTCDate()===i}function dt(e,t){return e<=0?{tono:"inf",texto:`No se creó ninguna cuota nueva: todos los estudiantes activos ya tenían «${t}».`}:{tono:"okk",texto:`Se crearon ${e} ${e===1?"cuota":"cuotas"} de «${t}».`}}function ta(e){return e===null?"todas las sedes":"tu sede"}function ct(e,t){const a=e.modulo.en_prueba===!0&&e.modulo.expira_prueba_en?e.modulo.expira_prueba_en:null;return s`${z(e.modulo.nombre,"Genera la mensualidad de todos los estudiantes activos en un solo paso.")}
    ${a?s`<div class="mb-6">${$("warn",`Prueba gratuita vigente hasta el ${P(a)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba")}</div>`:null}
    ${e.puedeGenerar?s`<section class="${n.tarjetaCristal} max-w-2xl p-6" aria-labelledby="t-masiva">
          <h2 id="t-masiva" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${b("receipt","h-5 w-5")}Nueva facturación mensual</h2>
          <p class="${n.ayuda} mb-4">Se aplica a los estudiantes «Activo» de ${ta(e.alcance)}. Repetir el mismo concepto no duplica cuotas.</p>
          <form id="form-masiva" novalidate class="flex flex-col gap-4" aria-label="Generar mensualidades">
            <div>
              <label for="f-concepto" class="${n.etiqueta}">Concepto <span class="text-red-800" aria-hidden="true">*</span></label>
              <input id="f-concepto" name="concepto" type="text" maxlength="${fe}" required autocomplete="off" placeholder="Mensualidad Noviembre 2026" aria-describedby="e-concepto" class="${n.input}">
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
              <button type="submit" class="${f(n.btnPrimario)}">${b("receipt","h-4 w-4")}<span>Generar</span></button>
            </div>
          </form>
        </section>`:s`<div class="max-w-2xl">${$("info","La generación masiva de mensualidades es una función del administrador. Pídele a esa persona que la ejecute.","Sección restringida")}</div>`}`}function ze(e,t){for(const a of A("[data-error]",HTMLElement,e)){const o=t[a.dataset.error??""]??"";a.textContent=o,a.hidden=o===""}for(const a of A("[name]",HTMLElement,e))(t[a.getAttribute("name")??""]??"")!==""?a.setAttribute("aria-invalid","true"):a.removeAttribute("aria-invalid");k('[aria-invalid="true"]',HTMLElement,e)?.focus()}function Pe(e,t,a){m(e,s`<p class="msg ${t}" role="${t==="err"?"alert":"status"}" tabindex="-1"></p>`);const o=d(".msg",HTMLElement,e);o.textContent=a,o.focus()}function ut(e,t){const a=d("#form-masiva",HTMLFormElement,e.zona),o=d("#masiva-resultado",HTMLElement,a),i=d("#masiva-vista-previa",HTMLElement,a),r=c=>{const u=a.elements.namedItem(c);return u instanceof HTMLInputElement?u.value:""},l=()=>({concepto:r("concepto"),monto:r("monto_usd"),vencimiento:r("fecha_vencimiento")}),p=()=>{const c=ke(l(),t);i.textContent=c.cuerpo?`Se creará «${c.cuerpo.concepto}» por ${E(c.cuerpo.monto_usd)} con vencimiento el ${J(c.cuerpo.fecha_vencimiento)} para cada estudiante activo de ${ta(e.alcance)}.`:""};a.addEventListener("input",p),a.addEventListener("submit",c=>{c.preventDefault();const u=ke(l(),t);if(ze(a,u.errores),m(o,s``),u.cuerpo===null)return;const v=u.cuerpo,x=d('button[type="submit"]',HTMLButtonElement,a);T(x,()=>h.post("/facturacion/cuotas/generar-mensualidades",v)).then(C=>{if(!e.vigente())return;const M=dt(C.creadas,v.concepto);Pe(o,M.tono,M.texto)}).catch(C=>{if(C instanceof w){e.alSesionExpirada();return}if(C instanceof j){const M=C.moduloPremium();if(M){e.alBloquear(M);return}const q=C.camposInvalidos();q.length>0&&ze(a,Object.fromEntries(q.map(Z=>[Z.campo,Z.mensaje])))}e.vigente()&&Pe(o,"err",y(C))})})}function pt(e){if(e.modulo.bloqueado){m(e.zona,Ge({nombre:e.modulo.nombre,descripcion:e.modulo.descripcion,precio_usd:e.modulo.precio_usd},e.puedeProbar)),We(e.zona,e.alActivarPrueba);return}const t=xe();m(e.zona,ct(e,t)),e.puedeGenerar&&ut(e,t)}function oa(e){if(e===null)return{tipo:"denegado"};const t=e.sede_id??null;return t===null?e.rol==="admin"?{tipo:"consolidado"}:{tipo:"denegado"}:Number.isInteger(t)&&t>0?{tipo:"sede",sedeId:t}:{tipo:"denegado"}}function G(e,t){for(const a of A("[data-error]",HTMLElement,e)){const o=t[a.dataset.error??""]??"";a.textContent=o,a.hidden=o===""}for(const a of A("[name]",HTMLElement,e))(t[a.getAttribute("name")??""]??"")!==""?a.setAttribute("aria-invalid","true"):a.removeAttribute("aria-invalid");k('[aria-invalid="true"]',HTMLElement,e)?.focus()}function na(e,t,a){m(e,s`<p class="msg ${t}" role="${"alert"}" tabindex="-1"></p>`);const o=d(".msg",HTMLElement,e);o.textContent=a,o.focus()}function ia(e){if(!(e instanceof j))return null;const t=e.camposInvalidos();return t.length>0?Object.fromEntries(t.map(a=>[a.campo,a.mensaje])):null}function F(e,t){const a=e.elements.namedItem(t);return a instanceof HTMLInputElement||a instanceof HTMLSelectElement?a.value:""}const mt=2,be=120,ft="MULTI_SEDE_PREMIUM",bt="Expansión Multi-Sede Avanzada (3+ Sedes)",sa=50;function vt(e){const t=e.trim().replace(/\s+/g," ");return t===""?{error:"Escribe el nombre de la sede, por ejemplo «Sede Acarigua».",nombre:null}:t.length>be?{error:`El nombre admite hasta ${be} caracteres.`,nombre:null}:{error:null,nombre:t}}function gt(e){if(!(e instanceof j))return null;const t=e.moduloPremium();return t||(e.codigo==="MODULO_PREMIUM_DESHABILITADO"||e.codigo==="BM403"?{modulo:ft,nombre:bt,precio_usd:sa}:null)}function $t(e){const t=e.tipo==="sede"?"La gestión de sedes es una función del acceso consolidado (SuperAdmin). Tu usuario opera únicamente sobre su sede.":"Tu usuario no tiene una sede asignada, así que no puede abrir esta sección. Pide a un administrador que revise tu cuenta.";return s`${z("Sedes","Ubicaciones de la academia")}
    <div class="max-w-2xl">${$("warn",t,"Sección Restringida")}</div>`}function ht(e){return s`<li class="${n.tarjeta} flex flex-col gap-3 p-4">
    <div class="flex items-start gap-3">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">${b("building")}</span>
      <div class="min-w-0 flex-1">
        <h3 class="break-words text-base font-bold text-slate-900">${e.nombre}</h3>
        ${e.creado_en?s`<p class="${n.ayuda}">Creada el ${P(e.creado_en)}</p>`:null}
      </div>
      ${N(e.activa?"Operativa":"Inactiva",e.activa?"ok":"neutral")}
    </div>
  </li>`}function xt(e){return e.length===0?$("info","Todavía no hay sedes registradas. Crea la primera con el formulario de abajo.","Sin sedes"):s`<ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Sedes registradas">${e.map(ht)}</ul>`}function Et(e){return s`<section class="${n.tarjetaCristal} max-w-2xl p-6" aria-labelledby="t-nueva-sede">
    <h2 id="t-nueva-sede" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${b("building","h-5 w-5")}Nueva sede</h2>
    <p class="${n.ayuda} mb-4">El Core Base incluye ${mt} sedes (hoy hay ${e.length}). Desde la tercera se requiere la Expansión Multi-Sede (${E(sa)} · pago único); si ya está habilitada, el alta funciona con normalidad.</p>
    <form id="form-sede" novalidate class="flex flex-col gap-4 sm:flex-row sm:items-start" aria-label="Crear sede">
      <div class="min-w-0 flex-1">
        <label for="f-sede-nombre" class="${n.etiqueta}">Nombre de la sede <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="f-sede-nombre" name="nombre" type="text" maxlength="${be}" required autocomplete="off" placeholder="Sede Acarigua" aria-describedby="e-sede-nombre" class="${n.input} min-h-10">
        <p id="e-sede-nombre" data-error="nombre" role="alert" hidden class="${n.errorCampo}"></p>
      </div>
      <button type="submit" class="${f(n.btnPrimario,"min-h-10 sm:mt-6")}">${b("check","h-4 w-4")}<span>Crear sede</span></button>
    </form>
    <div id="sede-resultado" class="mt-4" aria-live="polite"></div>
  </section>`}function yt(e){return s`${z("Sedes","Ubicaciones de la academia y su estado operativo")}
    <div class="flex flex-col gap-8">${xt(e)}${Et(e)}</div>`}function wt(e,t){const a=d("#form-sede",HTMLFormElement,e.zona),o=d("#sede-resultado",HTMLElement,e.zona);a.addEventListener("submit",i=>{i.preventDefault();const r=vt(F(a,"nombre"));if(G(a,r.error===null?{}:{nombre:r.error}),m(o,s``),r.nombre===null)return;const l={nombre:r.nombre},p=d('button[type="submit"]',HTMLButtonElement,a);T(p,()=>h.post("/sedes",l)).then(async c=>{_("ok",`Sede «${c.nombre}» creada.`),e.vigente()&&await t()}).catch(c=>{if(c instanceof w){e.alSesionExpirada();return}const u=gt(c);if(u){e.alBloquear(u);return}if(!e.vigente())return;if(c instanceof j&&c.codigo==="SEDE_DUPLICADA"){G(a,{nombre:c.message});return}const v=ia(c);v&&G(a,v),na(o,"err",y(c))})})}async function _t(e){const t=oa(e.usuario);if(t.tipo!=="consolidado"){m(e.zona,$t(t));return}const a=async()=>{const o=await h.get("/sedes");e.vigente()&&(m(e.zona,yt(o)),wt(e,a))};await a()}const qe=7,ve=1,ge=60,$e=60,Mt=10,Me="__otro__",ra=["Maternal","Preescolar 1.er nivel","Preescolar 2.º nivel","Preescolar 3.er nivel","1.er grado","2.º grado","3.er grado","4.º grado","5.º grado","6.º grado","1.er año","2.º año","3.er año","4.º año","5.º año"],la=["","Pendiente","Usada","Vencida","Revocada"],Lt={Pendiente:"info",Usada:"ok",Vencida:"warn",Revocada:"bad"};function Tt(e,t){const a={};let o=null;if(t.tipo==="consolidado"){const p=Number(e.sede);e.sede===""||!Number.isInteger(p)||p<=0?a.sede_id="Elige la sede a la que pertenecerá el estudiante.":o=p}let i="";e.nivel===Me?(i=e.nivelOtro.trim().replace(/\s+/g," "),i===""?a.nivel_otro="Escribe el nivel o grado.":i.length>$e&&(a.nivel_otro=`El nivel admite hasta ${$e} caracteres.`)):ra.includes(e.nivel)?i=e.nivel:a.nivel_asignado="Elige el nivel o grado asignado.";const r=e.dias.trim(),l=/^\d{1,3}$/.test(r)?Number(r):Number.NaN;return(!Number.isInteger(l)||l<ve||l>ge)&&(a.dias=`Escribe un número entero de días entre ${ve} y ${ge}.`),Object.keys(a).length>0?{errores:a,cuerpo:null}:{errores:a,cuerpo:o===null?{nivel_asignado:i,dias:l}:{nivel_asignado:i,dias:l,sede_id:o}}}async function At(e,t){try{if(window.isSecureContext&&typeof navigator.clipboard?.writeText=="function")return await navigator.clipboard.writeText(e),!0}catch{}return t.focus(),t.select(),t.setSelectionRange(0,e.length),!1}const St="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800";function Ct(){return s`${z("Invitaciones","Enlaces únicos de inscripción para los representantes")}
    <div class="max-w-2xl">${$("warn","Tu usuario no tiene una sede asignada, así que no puede emitir invitaciones. Pide a un administrador que revise tu cuenta.","Sección Restringida")}</div>`}function It(e,t){if(e.tipo==="consolidado"){const o=t.filter(r=>r.activa),i=o.length===1?o[0]:void 0;return s`<div>
      <label for="f-inv-sede" class="${n.etiqueta}">Sede destino <span class="text-red-800" aria-hidden="true">*</span></label>
      <select id="f-inv-sede" name="sede_id" required aria-describedby="e-inv-sede" class="${n.input} min-h-10">
        <option value="">Elige una sede…</option>
        ${o.map(r=>s`<option value="${r.id}" ${r.id===i?.id?W("selected"):null}>${r.nombre}</option>`)}
      </select>
      <p id="e-inv-sede" data-error="sede_id" role="alert" hidden class="${n.errorCampo}"></p>
    </div>`}const a=t.find(o=>e.tipo==="sede"&&o.id===e.sedeId);return s`<div>
    <span class="${n.etiqueta}">Sede destino</span>
    <p class="${St}">${b("building","h-4 w-4")}<span class="min-w-0 break-words">${a?.nombre??"Tu sede"}</span></p>
    <p class="${n.ayuda}">Las invitaciones se emiten siempre para tu sede.</p>
  </div>`}function Ht(e,t){return s`<section class="${n.tarjetaCristal} p-6" aria-labelledby="t-nueva-inv">
    <h2 id="t-nueva-inv" class="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">${b("link","h-5 w-5")}Nueva invitación</h2>
    <p class="${n.ayuda} mb-4">El enlace es de un solo uso y fija la sede y el nivel: el representante no puede cambiarlos en la planilla.</p>
    <form id="form-inv" novalidate class="grid gap-4 sm:grid-cols-2" aria-label="Emitir invitación">
      ${It(e,t)}
      <div>
        <label for="f-inv-nivel" class="${n.etiqueta}">Nivel / grado asignado <span class="text-red-800" aria-hidden="true">*</span></label>
        <select id="f-inv-nivel" name="nivel_asignado" required aria-describedby="e-inv-nivel" class="${n.input} min-h-10">
          <option value="">Elige un nivel…</option>
          ${ra.map(a=>s`<option value="${a}">${a}</option>`)}
          <option value="${Me}">Otro…</option>
        </select>
        <p id="e-inv-nivel" data-error="nivel_asignado" role="alert" hidden class="${n.errorCampo}"></p>
        <div id="inv-nivel-otro" class="mt-2" hidden>
          <label for="f-inv-otro" class="${n.etiqueta}">Escribe el nivel</label>
          <input id="f-inv-otro" name="nivel_otro" type="text" maxlength="${$e}" autocomplete="off" aria-describedby="e-inv-otro" class="${n.input} min-h-10">
          <p id="e-inv-otro" data-error="nivel_otro" role="alert" hidden class="${n.errorCampo}"></p>
        </div>
      </div>
      <div>
        <label for="f-inv-dias" class="${n.etiqueta}">Días de vigencia <span class="text-red-800" aria-hidden="true">*</span></label>
        <input id="f-inv-dias" name="dias" type="text" inputmode="numeric" required autocomplete="off" value="${qe}" aria-describedby="e-inv-dias" class="${n.input} min-h-10">
        <p class="${n.ayuda}">Entre ${ve} y ${ge} días. Por defecto ${qe}.</p>
        <p id="e-inv-dias" data-error="dias" role="alert" hidden class="${n.errorCampo}"></p>
      </div>
      <div class="flex items-end justify-end sm:col-span-2">
        <button type="submit" class="${f(n.btnPrimario,"min-h-10")}">${b("link","h-4 w-4")}<span>Generar enlace</span></button>
      </div>
    </form>
    <div id="inv-resultado" class="mt-4" aria-live="polite"></div>
  </section>`}function kt(e,t){return s`<section class="${n.tarjetaCristal} border-emerald-700/30 p-6" aria-labelledby="t-inv-ok">
    <h2 id="t-inv-ok" class="flex items-center gap-2 text-base font-bold text-slate-900">${b("check","h-5 w-5 text-emerald-700")}Invitación creada</h2>
    <p class="${n.ayuda} mb-4">${t} · ${e.nivel_asignado} · vence el ${P(e.expira_en)} · un solo uso.</p>
    <label for="inv-enlace" class="${n.etiqueta}">Enlace de inscripción</label>
    <div class="flex flex-col gap-3 sm:flex-row">
      <input id="inv-enlace" type="text" readonly value="${e.enlace}" class="${n.input} min-h-10 flex-1 font-mono text-xs">
      <button type="button" id="inv-copiar" class="${f(n.btnPrimario,"min-h-10")}">${b("copy","h-4 w-4")}<span>Copiar enlace</span></button>
    </div>
    <div class="mt-4">${$("warn","Por seguridad el enlace se muestra solo ahora: en el sistema queda únicamente su huella cifrada. Cópialo y envíalo al representante (por ejemplo, por WhatsApp). Si lo pierdes, revoca esta invitación y emite otra.","Cópialo ahora")}</div>
  </section>`}function zt(e){const t=e.estado==="Usada"&&e.usada_en!==null?s`Usada el ${P(e.usada_en)}`:s`Vence el ${P(e.expira_en)}`;return s`<tr>
    <td class="${n.td}">${e.sede}</td>
    <td class="${n.td}">${e.nivel_asignado}</td>
    <td class="${n.td}">${N(e.estado,Lt[e.estado])}</td>
    <td class="${n.td} whitespace-nowrap">${P(e.creado_en)}</td>
    <td class="${n.td} whitespace-nowrap">${t}</td>
    <td class="${n.td} text-right">
      ${e.estado==="Pendiente"?s`<button type="button" data-revocar="${e.id}" class="${f(n.btnSecundario,"min-h-10")}" aria-label="Revocar invitación de ${e.nivel_asignado} en ${e.sede}">${b("x","h-4 w-4")}<span>Revocar</span></button>`:null}
    </td>
  </tr>`}function Pt(e){return e.length===0?$("info","No hay invitaciones con este filtro.","Sin resultados"):s`<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
    <table class="${n.tabla}">
      <thead><tr>
        <th scope="col" class="${n.th}">Sede</th>
        <th scope="col" class="${n.th}">Nivel</th>
        <th scope="col" class="${n.th}">Estado</th>
        <th scope="col" class="${n.th}">Emitida</th>
        <th scope="col" class="${n.th}">Vigencia</th>
        <th scope="col" class="${n.th}"><span class="sr-only">Acciones</span></th>
      </tr></thead>
      <tbody>${e.map(zt)}</tbody>
    </table>
  </div>`}function qt(e){const t=Math.max(1,Math.ceil(e.total/Math.max(1,e.limite)));return s`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación de invitaciones">
    <span class="text-slate-600">Página ${e.pagina} de ${t} · ${e.total} invitación(es)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${f(n.btnSecundario,"min-h-10")}" ${e.pagina<=1?W("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${f(n.btnSecundario,"min-h-10")}" ${e.pagina>=t?W("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function da(){return s`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando invitaciones"></div>`}function Dt(e,t){const a=e.tipo==="consolidado"&&!t.some(o=>o.activa);return s`${z("Invitaciones","Enlaces únicos de inscripción con sede y nivel blindados")}
    <div class="flex flex-col gap-8">
      <div class="max-w-3xl">
        ${a?$("warn","No hay sedes activas. Crea o activa una sede en la sección Sedes antes de emitir invitaciones.","Sin sedes disponibles"):Ht(e,t)}
      </div>
      <div id="inv-exito" class="max-w-3xl" aria-live="polite"></div>
      <section aria-labelledby="t-inv-lista">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 id="t-inv-lista" class="text-base font-bold text-slate-900">Invitaciones emitidas</h2>
          <div>
            <label for="inv-filtro" class="${n.etiqueta}">Estado</label>
            <select id="inv-filtro" class="${n.input} min-h-10">${la.map(o=>s`<option value="${o}">${o===""?"Todas":o}</option>`)}</select>
          </div>
        </div>
        <div id="inv-lista">${da()}</div>
      </section>
    </div>`}function jt(e,t,a,o){const i=k("#form-inv",HTMLFormElement,e.zona);if(i===null)return;const r=d("#inv-resultado",HTMLElement,e.zona),l=d("#inv-exito",HTMLElement,e.zona),p=d("#f-inv-nivel",HTMLSelectElement,i),c=d("#inv-nivel-otro",HTMLElement,i);p.addEventListener("change",()=>{c.hidden=p.value!==Me,c.hidden||d("#f-inv-otro",HTMLInputElement,i).focus()}),i.addEventListener("submit",u=>{u.preventDefault();const v=Tt({sede:F(i,"sede_id"),nivel:F(i,"nivel_asignado"),nivelOtro:F(i,"nivel_otro"),dias:F(i,"dias")},t);if(G(i,v.errores),m(r,s``),v.cuerpo===null)return;const x=v.cuerpo,C=d('button[type="submit"]',HTMLButtonElement,i);T(C,()=>h.post("/invitaciones",x)).then(M=>{if(!e.vigente())return;const q=a.find(Z=>Z.id===M.sede_id)?.nombre??"Sede";m(l,kt(M,q)),Ot(l,M.enlace),d("#inv-copiar",HTMLButtonElement,l).focus(),o()}).catch(M=>{if(M instanceof w){e.alSesionExpirada();return}if(!e.vigente())return;const q=ia(M);q&&G(i,q),na(r,"err",y(M))})})}function Ot(e,t){const a=d("#inv-copiar",HTMLButtonElement,e),o=d("#inv-enlace",HTMLInputElement,e),i=a.innerHTML;a.addEventListener("click",()=>{At(t,o).then(r=>{if(!r){_("warn","Tu navegador no permitió copiar automáticamente. El enlace quedó seleccionado: pulsa Ctrl+C (⌘+C en Mac).");return}m(a,s`${b("check","h-4 w-4")}<span>¡Copiado!</span>`),_("ok","Enlace copiado. Ya puedes pegarlo en WhatsApp."),window.setTimeout(()=>{a.isConnected&&(a.innerHTML=i)},2500)})})}function Nt(e,t,a){const o=R({titulo:"Revocar invitación",cuerpo:s`<p class="text-sm text-slate-700">Se desactivará el enlace de <strong>${e.nivel_asignado}</strong> en <strong>${e.sede}</strong>. Quien lo abra verá que ya no es válido. Esta acción no se puede deshacer.</p>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" data-cancelar class="${f(n.btnSecundario,"min-h-10")}">Cancelar</button>
        <button type="button" data-confirmar class="${f(n.btnPeligro,"min-h-10")}">${b("x","h-4 w-4")}<span>Revocar</span></button>
      </div>`});k("[data-cancelar]",HTMLButtonElement,o.dialogo)?.addEventListener("click",o.cerrar);const i=d("[data-confirmar]",HTMLButtonElement,o.dialogo);i.addEventListener("click",()=>{T(i,()=>h.post(`/invitaciones/${e.id}/revocar`)).then(()=>{o.cerrar(),_("ok","Invitación revocada: el enlace ya no sirve."),t()}).catch(r=>{if(r instanceof w){o.cerrar(),a();return}if(r instanceof j&&r.codigo==="INVITACION_NO_REVOCABLE"){o.cerrar(),_("warn",r.message),t();return}_("bad",y(r))})})}function Bt(e){const t=d("#inv-lista",HTMLElement,e.zona),a=d("#inv-filtro",HTMLSelectElement,e.zona);let o="",i=1,r=[],l=0;const p=async()=>{l+=1;const c=l;m(t,da());try{const u=await h.pagina("/invitaciones",{estado:o,pagina:i,limite:Mt});if(!e.vigente()||c!==l)return;r=u.datos,m(t,s`${Pt(u.datos)}${qt(u.paginacion)}`)}catch(u){if(!e.vigente()||c!==l)return;if(u instanceof w){e.alSesionExpirada();return}m(t,s`${$("bad",y(u),"No se pudo cargar la lista")}
        <button type="button" data-reintentar class="${f(n.btnSecundario,"mt-4 min-h-10")}">${b("refresh","h-4 w-4")}<span>Reintentar</span></button>`)}};return t.addEventListener("click",c=>{const u=c.target instanceof Element?c.target:null,v=u?.closest("[data-revocar]");if(v instanceof HTMLElement){const C=Number(v.dataset.revocar),M=r.find(q=>q.id===C);M&&Nt(M,()=>void p(),()=>e.alSesionExpirada());return}if(u?.closest("[data-reintentar]")){p();return}const x=u?.closest("[data-pag]");x instanceof HTMLButtonElement&&!x.disabled&&(i=Math.max(1,i+Number(x.dataset.pag)),p())}),a.addEventListener("change",()=>{o=la.find(u=>u===a.value)??"",i=1,p()}),p(),()=>{a.value="",o="",i=1,p()}}async function Rt(e){const t=oa(e.usuario);if(t.tipo==="denegado"){m(e.zona,Ct());return}const a=await h.get("/sedes");if(!e.vigente())return;m(e.zona,Dt(t,a));const o=Bt(e);jt(e,t,a,o)}const se={estructura:"M20 100 L60 18 L100 100",flecha:"M32 84 C54 82 76 66 90 40 M78 42 L91 37 L93 51",pata:"M46 108 L98 108"},Q={claro:"#e2e8f0",medio:"#94a3b8",oscuro:"#475569"},De={destello:{inicio:1400,duracion:850}},Ft=De.destello.inicio+De.destello.duracion,je=`
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
`,O={estructura:"[animation:bma-estructura-in_900ms_cubic-bezier(0.22,1,0.36,1)_0ms_both] motion-reduce:[animation:none] will-change-transform",flecha:"[animation:bma-flecha-in_900ms_cubic-bezier(0.22,1,0.36,1)_120ms_both] motion-reduce:[animation:none] will-change-transform",pata:"[animation:bma-pata-in_900ms_cubic-bezier(0.22,1,0.36,1)_240ms_both] motion-reduce:[animation:none] will-change-transform",acople:"[animation:bma-acople_320ms_cubic-bezier(0.22,1,0.36,1)_1140ms_both] motion-reduce:[animation:none]",destello:"[animation:bma-destello_850ms_cubic-bezier(0.22,1,0.36,1)_1400ms_both] motion-reduce:hidden opacity-0",texto:"[animation:bma-texto-in_600ms_cubic-bezier(0.22,1,0.36,1)_1700ms_both] motion-reduce:[animation:none]",acento:"[animation:bma-acento-a_600ms_cubic-bezier(0.22,1,0.36,1)_1700ms_both] motion-reduce:[animation:none]"},Oe="bma-login-keyframes";let Ne=!1;function Ut(){if(Ne||document.getElementById(Oe)!==null)return;Ne=!0;try{const t=new CSSStyleSheet;t.replaceSync(je),document.adoptedStyleSheets=[...document.adoptedStyleSheets,t];return}catch{}const e=document.createElement("style");e.id=Oe,e.textContent=je,document.head.append(e)}const Vt=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;function Gt(){return s`<div class="relative mx-auto flex w-full max-w-xs flex-col items-center gap-3 text-slate-900" data-bma-logo>
    <svg viewBox="0 0 120 120" class="h-32 w-32 overflow-visible" role="img" aria-labelledby="bma-logo-titulo">
      <title id="bma-logo-titulo">Brilliant Minds Academy</title>
      <defs>
        <linearGradient id="bma-metal" gradientUnits="userSpaceOnUse" x1="14" y1="10" x2="106" y2="112">
          <stop offset="0" stop-color="${Q.claro}" />
          <stop offset="0.45" stop-color="${Q.medio}" />
          <stop offset="0.7" stop-color="${Q.claro}" />
          <stop offset="1" stop-color="${Q.oscuro}" />
        </linearGradient>
        <linearGradient id="bma-brillo" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="26" y2="0">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0" />
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
        <!-- Geometría estática (sin animar) reutilizada por la máscara del destello: el brillo solo se ve sobre el trazo. -->
        <path id="bma-forma-estructura" d="${se.estructura}" />
        <path id="bma-forma-flecha" d="${se.flecha}" />
        <path id="bma-forma-pata" d="${se.pata}" />
        <mask id="bma-mascara-destello" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
          <g fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
            <use href="#bma-forma-estructura" /><use href="#bma-forma-flecha" /><use href="#bma-forma-pata" />
          </g>
        </mask>
      </defs>

      <g class="${O.acople} origin-center [transform-box:fill-box]" fill="none" stroke="url(#bma-metal)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
        <g id="bma-capa-estructura" class="${O.estructura}">
          <use href="#bma-forma-estructura" />
        </g>
        <g id="bma-capa-flecha" class="${O.flecha}">
          <use href="#bma-forma-flecha" stroke-width="7" />
        </g>
        <g id="bma-capa-pata" class="${O.pata}">
          <use href="#bma-forma-pata" stroke-width="7" />
        </g>
      </g>

      <g mask="url(#bma-mascara-destello)" aria-hidden="true">
        <rect id="bma-destello" x="0" y="0" width="26" height="120" fill="url(#bma-brillo)"
          class="${O.destello}" />
      </g>
    </svg>
    <p class="text-center text-lg font-semibold tracking-tight ${O.texto}" data-bma-texto>
      <span class="${O.acento}" data-bma-acento>A</span>stra Academy
    </p>
  </div>`}function Wt(e){Ut();const t=()=>{if(m(e,Gt()),Vt())return Promise.resolve();const o=e.querySelector("#bma-destello");return new Promise(i=>{const r=window.setTimeout(i,Ft+400);o?.addEventListener("animationend",()=>{window.clearTimeout(r),i()},{once:!0})})};return{terminada:t(),repetir:t,destruir:()=>m(e,s``)}}const ca="bma.sidebar.colapsado",Xt=3e4,ua=25,re=300,pa=[{id:"dashboard",titulo:"Dashboard",icono:"home",soloAdmin:!1},{id:"estudiantes",titulo:"Estudiantes",icono:"users",soloAdmin:!1},{id:"auditoria",titulo:"Auditoría de referencias",icono:"inbox",soloAdmin:!1},{id:"sedes",titulo:"Sedes",icono:"building",soloAdmin:!1},{id:"invitaciones",titulo:"Invitaciones",icono:"link",soloAdmin:!1},{id:"contabilidad",titulo:"Contabilidad",icono:"book",soloAdmin:!0},{id:"configuracion",titulo:"Configuración de cobro",icono:"wallet",soloAdmin:!0}],ma={IA_ATENCION:"bot",WHATSAPP_AUTOMATICO:"chat",BANCAMIGA:"wallet",APP_MOVIL:"phone",FACHADA_WEB:"globe",MULTI_SEDE_PREMIUM:"school",FACTURACION_MASIVA:"receipt"},Be=["","Activo","Moroso","Fuera de la Academia","Pendiente por Validación Administrativa"],Re=["Por Validar","Aprobada","Rechazada"];let g={usuario:null,modulos:[],vista:"dashboard",colapsado:!1,periodo:ye(),filtroEstudiantes:"",paginaEstudiantes:1,filtroAuditoria:"Por Validar",paginaAuditoria:1};function I(e){g={...g,...e}}let ae=0,te=null;function Yt(){try{const e=localStorage.getItem(ca);if(e==="1")return!0;if(e==="0")return!1}catch{}return window.matchMedia("(max-width: 767px)").matches}function Jt(e){try{localStorage.setItem(ca,e?"1":"0")}catch{}}function Zt(e){if(typeof e!="object"||e===null)return!1;const t=e;return typeof t.id=="number"&&typeof t.nombre=="string"&&typeof t.email=="string"&&(t.rol==="admin"||t.rol==="secretaria")}function Kt(){const e=ne.usuarioCrudo();if(!e)return null;try{const t=JSON.parse(e);return Zt(t)?t:null}catch{return null}}const X=()=>g.usuario?.rol==="admin";function fa(e){Le(),ae+=1,document.body.className="text-slate-900",m(d("#app",HTMLElement),s`<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div id="login-logo" class="w-full"></div>
      <div class="text-center">
        <h1 class="${n.titulo}">Brilliant Minds Academy</h1>
        <p class="${n.subtitulo}">Panel administrativo</p>
      </div>
      <form id="login" novalidate class="${n.tarjetaCristal} flex flex-col gap-4 p-6" aria-label="Iniciar sesión">
        <div id="login-aviso">${e?$("warn",e):null}</div>
        <div>
          <label for="login-email" class="${n.etiqueta}">Correo</label>
          <input id="login-email" name="email" type="email" required autocomplete="username" class="${n.input}">
        </div>
        <div>
          <label for="login-password" class="${n.etiqueta}">Contraseña</label>
          <input id="login-password" name="password" type="password" required autocomplete="current-password" class="${n.input}">
        </div>
        <button type="submit" class="${f(n.btnPrimario,"w-full")}"><span>Entrar</span></button>
      </form>
    </main>`),Wt(d("#login-logo",HTMLElement));const t=d("#login",HTMLFormElement);t.addEventListener("submit",a=>{a.preventDefault(),Qt(t)}),d("#login-email",HTMLInputElement).focus()}async function Qt(e){const t=d("#login-email",HTMLInputElement).value.trim(),a=d("#login-password",HTMLInputElement).value,o=d("#login-aviso",HTMLElement);if(!t||!a){m(o,$("bad","Escribe tu correo y tu contraseña."));return}try{const i=await T(d('button[type="submit"]',HTMLButtonElement,e),()=>h.post("/auth/login",{email:t,password:a},{sinAuth:!0}));ne.guardar(i.token,JSON.stringify(i.usuario)),await ba()}catch(i){m(o,$("bad",y(i)))}}function H(e){ne.cerrar(),I({usuario:null,modulos:[],vista:"dashboard"}),fa(e)}function he(e){const{id:t,titulo:a,tooltip:o,bloqueado:i}=e;return s`<button type="button" data-nav="${t}" data-bloqueado="${i}"
    class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 aria-[current=page]:bg-slate-900 aria-[current=page]:text-white group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
    ${b(e.icono)}
    <span class="min-w-0 flex-1 truncate group-data-[collapsed=true]/sb:sr-only">${a}</span>
    ${i?s`<span class="text-slate-500 group-data-[collapsed=true]/sb:absolute group-data-[collapsed=true]/sb:right-2 group-data-[collapsed=true]/sb:top-1">${b("lock","h-4 w-4 group-data-[collapsed=true]/sb:h-3 group-data-[collapsed=true]/sb:w-3")}</span>`:null}
    <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">${o}</span>
  </button>`}function eo(){const e=g.usuario,t=pa.filter(a=>!a.soloAdmin||X());return s`<div id="shell" data-collapsed="${g.colapsado}" class="group/sb flex min-h-screen">
    <aside id="barra-lateral" aria-label="Navegación principal"
      class="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white/95 backdrop-blur transition-[width] duration-200 group-data-[collapsed=true]/sb:w-20">
      <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-4 group-data-[collapsed=true]/sb:justify-center">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">${b("school")}</span>
        <span class="truncate text-sm font-bold text-slate-900 group-data-[collapsed=true]/sb:sr-only">BMA · Administración</span>
      </div>
      <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Secciones">
        ${t.map(a=>he({id:a.id,titulo:a.titulo,icono:a.icono,tooltip:a.titulo,bloqueado:!1}))}
        <p class="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 group-data-[collapsed=true]/sb:sr-only">Módulos Premium</p>
        <hr class="my-2 hidden border-slate-200 group-data-[collapsed=true]/sb:block">
        ${g.modulos.map(a=>he({id:`premium:${a.codigo}`,titulo:a.nombre,icono:ma[a.codigo]??"chat",tooltip:a.bloqueado?`${a.nombre} · ${a.tooltip}`:a.nombre,bloqueado:a.bloqueado}))}
      </nav>
      <div class="flex flex-col gap-1 border-t border-slate-200 p-3">
        <div class="flex items-center gap-3 px-3 py-2 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800" aria-hidden="true">${(e?.nombre??"?").trim().slice(0,1).toUpperCase()}</span>
          <span class="min-w-0 group-data-[collapsed=true]/sb:sr-only"><span class="block truncate text-sm font-semibold text-slate-900">${e?.nombre}</span><span class="block truncate text-xs text-slate-600">${e?.rol}</span></span>
        </div>
        <button type="button" id="salir" class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${b("logout")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Salir</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Salir</span>
        </button>
        <button type="button" id="alternar-sidebar" aria-controls="barra-lateral" aria-expanded="${!g.colapsado}" aria-label="${g.colapsado?"Expandir menú lateral":"Contraer menú lateral"}"
          class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${b("menu")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Contraer menú</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Expandir menú</span>
        </button>
      </div>
    </aside>
    <main id="contenido" tabindex="-1" class="min-w-0 flex-1 p-4 sm:p-8"></main>
  </div>`}function ao(){const e=!g.colapsado;I({colapsado:e}),Jt(e);const t=d("#shell",HTMLElement);t.dataset.collapsed=String(e);const a=d("#alternar-sidebar",HTMLButtonElement);a.setAttribute("aria-expanded",String(!e)),a.setAttribute("aria-label",e?"Expandir menú lateral":"Contraer menú lateral")}function to(e){const t=e.startsWith("estudiante:")?"estudiantes":e;for(const a of A("[data-nav]",HTMLElement))a.dataset.nav===t?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current")}async function ba(){if(!ne.token()){fa();return}let e=Kt();try{e||(e=(await h.get("/auth/me")).usuario);const o=await h.get("/premium/modulos").catch(i=>{if(i instanceof w)throw i;return[]});I({usuario:e,modulos:o,colapsado:Yt()})}catch(o){H(o instanceof w?"Tu sesión expiró. Inicia sesión de nuevo.":y(o));return}document.body.className="text-slate-900",m(d("#app",HTMLElement),eo()),d("#shell",HTMLElement).addEventListener("click",o=>{const r=(o.target instanceof Element?o.target:null)?.closest("[data-nav]");if(!(r instanceof HTMLElement))return;const l=r.dataset.nav??"";g.modulos.find(c=>`premium:${c.codigo}`===l)?.bloqueado&&(o.preventDefault(),o.stopPropagation()),S(l)}),d("#salir",HTMLButtonElement).addEventListener("click",()=>H()),d("#alternar-sidebar",HTMLButtonElement).addEventListener("click",ao);const a=g.vista.startsWith("premium:")||pa.some(o=>o.id===g.vista)?g.vista:"dashboard";await S(a)}function Le(){te!==null&&(window.clearInterval(te),te=null)}async function S(e){Le(),ae+=1;const t=ae;I({vista:e}),to(e);const a=d("#contenido",HTMLElement),o={zona:a,vigente:()=>t===ae};m(a,s`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando"></div>`);try{e.startsWith("premium:")?go(o,e.slice(8)):e.startsWith("estudiante:")?await uo(o,e.slice(11)):e==="estudiantes"?await lo(o):e==="auditoria"?await mo(o):e==="sedes"?await _t({zona:o.zona,vigente:o.vigente,usuario:g.usuario,alBloquear:i=>void ya(o,i),alSesionExpirada:()=>H("Tu sesión expiró. Inicia sesión de nuevo.")}):e==="invitaciones"?await Rt({zona:o.zona,vigente:o.vigente,usuario:g.usuario,alSesionExpirada:()=>H("Tu sesión expiró. Inicia sesión de nuevo.")}):e==="contabilidad"&&X()?await vo(o):e==="configuracion"&&X()?await tt({zona:o.zona,vigente:o.vigente,usuario:g.usuario}):await so(o)}catch(i){va(i,o)}}function va(e,t){if(t.vigente()){if(e instanceof w){H("Tu sesión expiró. Inicia sesión de nuevo.");return}if(e instanceof j){const a=e.moduloPremium();if(a){wa(t.zona,a);return}}m(t.zona,s`<div class="mx-auto max-w-2xl pt-8">${$("bad",y(e),e instanceof Sa?"Sin conexión":"No se pudo cargar la sección")}
      <button type="button" data-reintentar class="${f(n.btnSecundario,"mt-4")}">${b("refresh","h-4 w-4")}<span>Reintentar</span></button></div>`),k("[data-reintentar]",HTMLButtonElement,t.zona)?.addEventListener("click",()=>void S(g.vista))}}function ga(e){const t=Math.max(1,Math.ceil(e.total/Math.max(1,e.limite)));return s`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación">
    <span class="text-slate-600">Página ${e.pagina} de ${t} · ${e.total} registro(s)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${f(n.btnSecundario,n.btnPeq)}" ${e.pagina<=1?W("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${f(n.btnSecundario,n.btnPeq)}" ${e.pagina>=t?W("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function $a(e,t){for(const a of A("[data-pag]",HTMLButtonElement,e))a.addEventListener("click",()=>t(Number(a.dataset.pag)))}function oe(e){return s`<article class="${n.tarjeta} p-6">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-sm font-medium text-slate-600">${e.titulo}</h3>
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${b(e.icono,"h-4 w-4")}</span>
    </div>
    <p class="mt-3 text-2xl font-bold ${e.tono==="malo"?"text-red-800":"text-slate-900"}" data-kpi>${e.valor}</p>
    <p class="mt-1 text-xs text-slate-600">${e.detalle}</p>
  </article>`}function oo(e){const t=Aa(e.periodo),a=new Map;for(const l of e.cobrado_por_dia)a.set(Number(l.dia.slice(8,10)),l.monto_usd);const o=Math.max(0,...a.values()),i=Array.from({length:t},(l,p)=>{const c=p+1,u=a.get(c)??0,v=o>0?Math.max(u>0?4:0,Math.round(u/o*100)):0;return s`<li class="group/barra relative flex h-full min-w-0 flex-1 flex-col justify-end" title="Día ${c}: ${E(u)}">
      <div data-alto="${v}" class="w-full rounded-t ${u>0?"bg-slate-800 group-hover/barra:bg-slate-600":"bg-slate-200"} ${u>0?"":"h-px"}"></div>
      <span class="sr-only">Día ${c}: ${E(u)}</span>
    </li>`}),r=Array.from({length:t},(l,p)=>s`<span class="min-w-0 flex-1 text-center text-xs text-slate-600">${(p+1)%5===0||p===0?p+1:""}</span>`);return s`<div role="group" aria-label="Cobrado por día en ${e.periodo}">
    <ul class="flex h-48 items-end gap-1 border-b border-slate-200">${i}</ul>
    <div class="mt-1 flex gap-1" aria-hidden="true">${r}</div>
  </div>`}function no(e){for(const t of A("[data-alto]",HTMLElement,e)){const a=Number(t.dataset.alto);Number.isFinite(a)&&a>0&&(t.style.height=`${Math.min(100,a)}%`)}}function io(e,t){const a=[{titulo:"Cobrado",valor:E(e.cobrado.monto_usd),detalle:`${e.cobrado.cantidad} pago(s) aprobados`,icono:"wallet",tono:"normal"},{titulo:"Saldos vencidos",valor:E(e.saldos_vencidos.monto_usd),detalle:`${e.saldos_vencidos.cantidad} cuota(s) vencida(s)`,icono:"alert",tono:"malo"},{titulo:"Cuentas pendientes del mes",valor:E(e.cuentas_pendientes.monto_usd),detalle:`${e.cuentas_pendientes.cantidad} cuota(s) por cobrar`,icono:"book",tono:"normal"},{titulo:"Referencias por validar",valor:String(e.referencias_por_validar),detalle:"en la bandeja de auditoría",icono:"inbox",tono:"normal"}];return s`
    <section aria-label="Indicadores del mes" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${a.map(oe)}</section>
    <section aria-label="Estudiantes por estado" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${[["Activos",t.activos],["Morosos",t.morosos],["Fuera de la Academia",t.fuera_de_la_academia],["Pendientes de validación",t.pendientes_validacion]].map(([o,i])=>s`<div class="${n.tarjeta} flex items-center justify-between gap-4 px-6 py-4"><span class="text-sm text-slate-700">${o}</span><strong class="text-lg text-slate-900">${i}</strong></div>`)}
    </section>
    <section class="${n.tarjeta} mt-6 p-6" aria-labelledby="t-barras">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="t-barras" class="text-base font-bold text-slate-900">Recaudación diaria</h2>
        <p class="text-sm text-slate-600">Cobrado del mes: <strong class="text-slate-900">${E(e.cobrado.monto_usd)}</strong></p>
      </div>
      ${oo(e)}
    </section>`}async function le(e,t){const a=d("#tablero",HTMLElement,e.zona);t||m(a,s`<div class="h-48 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando tablero"></div>`);try{const[o,i]=await Promise.all([h.get("/facturacion/tablero",{periodo:g.periodo}),h.get("/estudiantes/resumen")]);if(!e.vigente())return;m(a,io(o,i)),no(a);const r=k("#actualizado",HTMLElement,e.zona);r&&(r.textContent=`Actualizado a las ${Ta(new Date)}`)}catch(o){if(!e.vigente()||t&&!(o instanceof w))return;va(o,e)}}async function so(e){m(e.zona,s`${z("Dashboard","Tablero financiero en tiempo real",s`<div class="flex flex-wrap items-end gap-4">
        <div><label for="periodo" class="${n.etiqueta}">Período</label><input id="periodo" type="month" value="${g.periodo}" max="${ye()}" class="${n.input}"></div>
        <p id="actualizado" class="pb-2 text-xs text-slate-600" aria-live="off"></p>
      </div>`)}<div id="tablero"></div>`),d("#periodo",HTMLInputElement,e.zona).addEventListener("change",t=>{const a=t.target instanceof HTMLInputElement?t.target.value:"";/^\d{4}-\d{2}$/.test(a)&&(I({periodo:a}),le(e,!1))}),await le(e,!0),te=window.setInterval(()=>{if(!e.vigente()){Le();return}document.hidden||le(e,!0)},Xt)}function ro(e){return s`<tr>
    <td class="${n.td}"><button type="button" data-detalle="${e.id}" class="rounded-md text-left font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900" aria-label="Ver ficha de ${e.apellidos}, ${e.nombres}">${e.apellidos}, ${e.nombres}</button></td>
    <td class="${n.td}">${e.grado_solicitado}</td>
    <td class="${n.td}">${e.representante}</td>
    <td class="${n.td}">${Y(e.estado_dinamico)}</td>
    <td class="${n.td} whitespace-nowrap">${E(e.deuda_vencida_usd)}</td>
    <td class="${n.td}"><div class="flex flex-wrap gap-2">
      <button type="button" data-alerta="preventiva" data-id="${e.id}" class="${f(n.btnSecundario,n.btnPeq)}">Preventiva</button>
      <button type="button" data-alerta="morosidad" data-id="${e.id}" class="${f(n.btnSecundario,n.btnPeq)}">Morosidad</button>
    </div></td>
  </tr>`}async function lo(e){const t=await h.pagina("/estudiantes",{estado:g.filtroEstudiantes,pagina:g.paginaEstudiantes,limite:ua});if(e.vigente()){m(e.zona,s`${z("Estudiantes",`${t.paginacion.total} resultado(s)`)}
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
      ${Be.map(a=>s`<button type="button" data-filtro="${a}" aria-pressed="${a===g.filtroEstudiantes}" class="${f(n.btnSecundario,n.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${a===""?"Todos":a}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${n.tabla}">
        <caption class="sr-only">Listado de estudiantes</caption>
        <thead><tr><th scope="col" class="${n.th}">Estudiante</th><th scope="col" class="${n.th}">Grado</th><th scope="col" class="${n.th}">Representante</th><th scope="col" class="${n.th}">Estado</th><th scope="col" class="${n.th}">Deuda vencida</th><th scope="col" class="${n.th}">Alertas WhatsApp</th></tr></thead>
        <tbody>${t.datos.length===0?s`<tr><td colspan="6" class="${n.td}">Sin resultados.</td></tr>`:t.datos.map(ro)}</tbody>
      </table>
    </div>
    ${ga(t.paginacion)}`);for(const a of A("[data-filtro]",HTMLButtonElement,e.zona))a.addEventListener("click",()=>{const o=a.dataset.filtro??"",i=Be.find(r=>r===o)??"";I({filtroEstudiantes:i,paginaEstudiantes:1}),S("estudiantes")});$a(e.zona,a=>{I({paginaEstudiantes:Math.max(1,g.paginaEstudiantes+a)}),S("estudiantes")});for(const a of A("[data-detalle]",HTMLButtonElement,e.zona))a.addEventListener("click",()=>{const o=Number(a.dataset.detalle);Number.isInteger(o)&&o>0&&S(`estudiante:${o}`)});for(const a of A("[data-alerta]",HTMLButtonElement,e.zona))a.addEventListener("click",()=>{const o=a.dataset.alerta==="morosidad"?"morosidad":"preventiva";co(o,Number(a.dataset.id),a)})}}async function co(e,t,a){try{const o=await T(a,()=>h.post(`/notificaciones/whatsapp/${e}/${t}`)),i=R({titulo:e==="morosidad"?"Alerta de morosidad":"Alerta preventiva",ancho:"lg",cuerpo:s`<p class="text-sm text-slate-600">${E(o.monto_usd)} · ${Ee(o.monto_bs)} · tasa BCV ${La(o.tasa_bcv)}</p>
        <pre class="mt-4 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">${o.mensaje}</pre>
        <div id="alerta-resultado" class="mt-4"></div>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <a href="${Ue(o.enlace_whatsapp,["https://wa.me/"])}" target="_blank" rel="noopener noreferrer" class="${f(n.btnPrimario)}">Abrir en WhatsApp</a>
          <button type="button" id="alerta-enviar" class="${f(n.btnSecundario)}">Enviar por API</button>
        </div>`}),r=d("#alerta-enviar",HTMLButtonElement,i.dialogo);r.addEventListener("click",()=>{const l=d("#alerta-resultado",HTMLElement,i.dialogo);T(r,()=>h.post(`/notificaciones/whatsapp/${e}/${t}`,{},{consulta:{enviar:!0}})).then(()=>m(l,$("ok","Mensaje enviado por la API de WhatsApp."))).catch(p=>m(l,$("bad",y(p))))})}catch(o){o instanceof w?H("Tu sesión expiró. Inicia sesión de nuevo."):_("bad",y(o))}}async function uo(e,t){const a=Number(t);if(!Number.isInteger(a)||a<=0){m(e.zona,s`<div class="mx-auto max-w-2xl pt-8">${$("bad","El identificador del estudiante no es válido.")}</div>`);return}await Ya({zona:e.zona,vigente:e.vigente,estudianteId:a,alVolver:()=>void S("estudiantes"),alSesionExpirada:()=>H("Tu sesión expiró. Inicia sesión de nuevo.")})}function po(e){const t=e.estado==="Por Validar";return s`<tr>
    <td class="${n.td} whitespace-nowrap">${P(e.declarado_en)}</td>
    <td class="${n.td}"><span class="font-medium text-slate-900">${e.estudiante}</span><br><span class="text-xs text-slate-600">${e.concepto} · vence ${J(e.fecha_vencimiento)}</span></td>
    <td class="${n.td}"><strong class="break-all">${e.referencia}</strong><br><span class="text-xs text-slate-600">${e.representante}</span></td>
    <td class="${n.td}">${B(e.metodo_pago)}</td>
    <td class="${n.td} whitespace-nowrap">${E(e.monto_usd)}<br><span class="text-xs text-slate-600">${Ee(e.monto_bs)}</span></td>
    <td class="${n.td}">${t?s`<div class="flex flex-wrap gap-2">
          <button type="button" data-aprobar="${e.id}" class="${f(n.btnOk,n.btnPeq)}">${b("check","h-4 w-4")}<span>Aprobar</span></button>
          <button type="button" data-rechazar="${e.id}" class="${f(n.btnPeligro,n.btnPeq)}">${b("x","h-4 w-4")}<span>Rechazar</span></button>
        </div>`:s`${Y(e.estado)}${e.nota_revision?s`<p class="mt-1 max-w-xs break-words text-xs text-slate-600">${e.nota_revision}</p>`:null}`}</td>
  </tr>`}async function mo(e){const t=await h.pagina("/facturacion/auditoria",{estado:g.filtroAuditoria,pagina:g.paginaAuditoria,limite:ua});if(!e.vigente())return;const a=X()?s`<button type="button" id="exportar" class="${f(n.btnSecundario)}">${b("down","h-4 w-4")}<span>Exportar histórico (.xlsx)</span></button>`:null;m(e.zona,s`${z("Bandeja de auditoría",`${t.paginacion.total} referencia(s) · ${g.filtroAuditoria}`,a)}
    <div id="auditoria-aviso" class="mb-4"></div>
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado de la referencia">
      ${Re.map(r=>s`<button type="button" data-filtro="${r}" aria-pressed="${r===g.filtroAuditoria}" class="${f(n.btnSecundario,n.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${r}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${n.tabla}">
        <caption class="sr-only">Referencias de pago declaradas</caption>
        <thead><tr><th scope="col" class="${n.th}">Declarada</th><th scope="col" class="${n.th}">Estudiante</th><th scope="col" class="${n.th}">Referencia</th><th scope="col" class="${n.th}">Método</th><th scope="col" class="${n.th}">Monto</th><th scope="col" class="${n.th}">Acción</th></tr></thead>
        <tbody>${t.datos.length===0?s`<tr><td colspan="6" class="${n.td}">Bandeja vacía.</td></tr>`:t.datos.map(po)}</tbody>
      </table>
    </div>
    ${ga(t.paginacion)}`);const o=d("#auditoria-aviso",HTMLElement,e.zona);for(const r of A("[data-filtro]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>{const l=r.dataset.filtro??"",p=Re.find(c=>c===l)??"Por Validar";I({filtroAuditoria:p,paginaAuditoria:1}),S("auditoria")});$a(e.zona,r=>{I({paginaAuditoria:Math.max(1,g.paginaAuditoria+r)}),S("auditoria")});const i=new Map(t.datos.map(r=>[r.id,r]));for(const r of A("[data-aprobar]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>void fo(Number(r.dataset.aprobar),r,o));for(const r of A("[data-rechazar]",HTMLButtonElement,e.zona))r.addEventListener("click",()=>{const l=i.get(Number(r.dataset.rechazar));l&&bo(l)});k("#exportar",HTMLButtonElement,e.zona)?.addEventListener("click",r=>{const l=r.currentTarget instanceof HTMLButtonElement?r.currentTarget:null;l&&ha(l,"/exportaciones/facturacion.xlsx","facturacion.xlsx",o)})}async function ha(e,t,a,o){try{await T(e,()=>h.descargar(t,a))}catch(i){i instanceof w?H("Tu sesión expiró. Inicia sesión de nuevo."):m(o,$("bad",y(i)))}}function xa(e,t){return`${t} · estatus de pago del alumno: ${e.estatus_pago} · deuda vencida ${E(e.deuda_vencida_usd)}.`}async function fo(e,t,a){try{const o=await T(t,()=>h.post(`/facturacion/auditoria/${e}/aprobar`,{}));_("ok",xa(o,"Referencia aprobada")),await S("auditoria")}catch(o){o instanceof w?H("Tu sesión expiró. Inicia sesión de nuevo."):m(a,$("bad",y(o)))}}function bo(e){const t=R({titulo:"Rechazar referencia",cuerpo:s`<form id="form-rechazo" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700">Referencia <strong class="break-all">${e.referencia}</strong> · ${e.estudiante} · ${E(e.monto_usd)}</p>
      <div>
        <label for="nota-rechazo" class="${n.etiqueta}">Motivo del rechazo <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="nota-rechazo" name="nota" rows="4" maxlength="${re}" required aria-describedby="nota-ayuda nota-error" class="${n.input}"></textarea>
        <p id="nota-ayuda" class="${n.ayuda}">Se guarda en el historial y se usa para avisar al representante. <span id="nota-contador">0/${re}</span></p>
        <p id="nota-error" class="${n.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="rechazo-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${f(n.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${f(n.btnPeligro)}">${b("x","h-4 w-4")}<span>Rechazar referencia</span></button>
      </div>
    </form>`}),a=d("#form-rechazo",HTMLFormElement,t.dialogo),o=d("#nota-rechazo",HTMLTextAreaElement,t.dialogo),i=d("#nota-error",HTMLElement,t.dialogo),r=d("#nota-contador",HTMLElement,t.dialogo);o.addEventListener("input",()=>{r.textContent=`${o.value.length}/${re}`,o.value.trim()!==""&&(i.hidden=!0,o.removeAttribute("aria-invalid"))}),d("[data-cancelar]",HTMLButtonElement,t.dialogo).addEventListener("click",t.cerrar),a.addEventListener("submit",l=>{l.preventDefault();const p=o.value.trim();if(p===""){i.textContent="Debes escribir el motivo del rechazo para continuar.",i.hidden=!1,o.setAttribute("aria-invalid","true"),o.focus();return}const c=d('button[type="submit"]',HTMLButtonElement,a);T(c,()=>h.post(`/facturacion/auditoria/${e.id}/rechazar`,{nota:p})).then(async u=>{t.cerrar(),_("ok",xa(u,"Referencia rechazada")),await S("auditoria")}).catch(u=>{if(u instanceof w){t.cerrar(),H("Tu sesión expiró. Inicia sesión de nuevo.");return}m(d("#rechazo-aviso",HTMLElement,t.dialogo),$("bad",y(u)))})}),o.focus()}async function vo(e){const t=await h.get("/contabilidad/balance",{periodo:g.periodo});if(!e.vigente())return;m(e.zona,s`${z("Contabilidad",`Balance neto del período ${t.periodo}`,s`<div class="flex flex-wrap items-end gap-4">
      <div><label for="periodo-conta" class="${n.etiqueta}">Período</label><input id="periodo-conta" type="month" value="${g.periodo}" max="${ye()}" class="${n.input}"></div>
      <button type="button" id="exportar" class="${f(n.btnPrimario)}">${b("down","h-4 w-4")}<span>Exportar nómina, egresos y personal (.xlsx)</span></button>
    </div>`)}
    <div id="conta-aviso" class="mb-4"></div>
    <section class="grid gap-4 sm:grid-cols-3" aria-label="Balance">
      ${oe({titulo:"Ingresos",valor:E(t.ingresos_usd),detalle:"Referencias aprobadas del período",icono:"wallet",tono:"normal"})}
      ${oe({titulo:"Egresos",valor:E(t.egresos_usd),detalle:"Egresos y nómina pagada",icono:"book",tono:"normal"})}
      ${oe({titulo:"Neto",valor:E(t.neto_usd),detalle:"Ingresos − egresos",icono:"check",tono:t.neto_usd<0?"malo":"normal"})}
    </section>`),d("#periodo-conta",HTMLInputElement,e.zona).addEventListener("change",o=>{const i=o.target instanceof HTMLInputElement?o.target.value:"";/^\d{4}-\d{2}$/.test(i)&&(I({periodo:i}),S("contabilidad"))});const a=d("#conta-aviso",HTMLElement,e.zona);d("#exportar",HTMLButtonElement,e.zona).addEventListener("click",o=>{const i=o.currentTarget instanceof HTMLButtonElement?o.currentTarget:null;i&&ha(i,"/exportaciones/contabilidad.xlsx","contabilidad.xlsx",a)})}function go(e,t){const a=g.modulos.find(i=>i.codigo===t);if(!a){m(e.zona,$("bad","Módulo no encontrado."));return}if(a.codigo==="FACTURACION_MASIVA"){pt({zona:e.zona,vigente:e.vigente,modulo:a,puedeGenerar:X(),puedeProbar:a.prueba_utilizada===!1&&de(),alcance:g.usuario?.sede_id??null,alActivarPrueba:()=>Fe(a),alBloquear:i=>void ya(e,i),alSesionExpirada:()=>H("Tu sesión expiró. Inicia sesión de nuevo.")});return}if(a.bloqueado){m(e.zona,Ge(a,a.prueba_utilizada===!1&&de())),We(e.zona,()=>Fe(a));return}const o=a.en_prueba===!0&&a.expira_prueba_en?a.expira_prueba_en:null;m(e.zona,s`${z(a.nombre,a.descripcion)}
    <div class="${n.tarjeta} flex flex-col gap-4 p-6">
      ${o?$("warn",`Prueba gratuita vigente hasta el ${P(o)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba"):null}
      ${a.codigo==="MULTI_SEDE_PREMIUM"?s`${$("info","El Core Base incluye dos sedes (Acarigua y Barquisimeto). Con este módulo puedes registrar la tercera sede y las siguientes desde la sección Sedes.","Expansión multi-sede habilitada")}
          ${de()?s`<div><button type="button" id="ir-sedes" class="${f(n.btnPrimario,"min-h-10")}">${b("building","h-4 w-4")}<span>Ir a Sedes</span></button></div>`:null}`:$("info","El módulo está habilitado para esta academia. Su lógica se publicará en la Fase 2 (ruta reservada en el servidor).","Módulo habilitado")}
    </div>`),k("#ir-sedes",HTMLButtonElement,e.zona)?.addEventListener("click",()=>void S("sedes"))}const de=()=>g.usuario?.rol==="admin"&&(g.usuario.sede_id??null)===null;function Ea(e){const t=k(`[data-nav="premium:${e.codigo}"]`,HTMLElement);if(!t)return;const a=document.createElement("div");m(a,he({id:`premium:${e.codigo}`,titulo:e.nombre,icono:ma[e.codigo]??"chat",tooltip:e.bloqueado?`${e.nombre} · ${e.tooltip??ce}`:e.nombre,bloqueado:e.bloqueado}));const o=a.firstElementChild;o&&t.replaceWith(o)}async function Fe(e){await h.post("/premium/activar-prueba",{modulo:e.codigo});const t=await h.get("/premium/modulos");I({modulos:t});for(const a of t)Ea(a);_("ok","Prueba gratuita de 15 días activada."),await S(`premium:${e.codigo}`)}async function ya(e,t){try{const a=await h.get("/premium/modulos");I({modulos:a});for(const o of a)Ea(o)}catch(a){if(a instanceof w){H("Tu sesión expiró. Inicia sesión de nuevo.");return}e.vigente()&&wa(e.zona,t);return}e.vigente()&&await S(`premium:${t.modulo}`)}function wa(e,t){const a=g.modulos.find(o=>o.codigo===t.modulo);m(e,Ve({nombre:t.nombre,descripcion:a?.descripcion??"Este módulo forma parte de la Fase 2 del sistema.",precio_usd:t.precio_usd}))}ba();
