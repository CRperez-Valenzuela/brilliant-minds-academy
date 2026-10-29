import{m,a as v,h as r,b as g,C as s,u as h,c as f,i as $,o as d,n as P,e as ta,d as M,f as A,B as y,g as J,j as x,k as Y,t as _,l as z,p as Z,s as R,q as ma,r as ba,v as ea,w as fa,x as Ha,y as Ia,z as qa,A as ja,D as Ba,E as Da}from"./ui-CHNQDWog.js";const T=(a,e)=>a[e]??"",U=/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/,oa=/^(?:\d{6,20}|[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,})$/,Oa=/^Banco (\d{4}) · Tel (0\d{10}) · Cédula\/RIF ([VEJGP]\d{5,10})$/,sa=(a,e,t)=>({id:a,etiqueta:e,tipo:"email",inputmode:"email",placeholder:"pagos@academia.com",ayuda:t,error:"Escribe un correo válido, por ejemplo pagos@academia.com.",patron:U,normalizar:o=>o.trim().toLowerCase()}),K={ZELLE:{campos:[sa("correo","Correo de Zelle","Correo con el que la academia recibe pagos por Zelle.")],componer:a=>T(a,"correo"),interpretar:a=>U.test(a)?{correo:a}:null},PAYPAL:{campos:[sa("correo","Correo de PayPal","Cuenta de PayPal que recibe los pagos.")],componer:a=>T(a,"correo"),interpretar:a=>U.test(a)?{correo:a}:null},BINANCE:{campos:[{id:"idBinance",etiqueta:"Pay ID o correo de Binance",tipo:"text",inputmode:"text",placeholder:"123456789",ayuda:"Pay ID numérico (6 a 20 dígitos) o el correo de la cuenta Binance.",error:"Escribe un Pay ID numérico de 6 a 20 dígitos o un correo válido.",patron:oa,normalizar:a=>a.trim().toLowerCase()}],componer:a=>T(a,"idBinance"),interpretar:a=>oa.test(a)?{idBinance:a}:null},PAGO_MOVIL:{campos:[{id:"banco",etiqueta:"Código del banco",tipo:"text",inputmode:"numeric",placeholder:"0102",ayuda:"Cuatro dígitos (0102 = Banco de Venezuela, 0105 = Mercantil…).",error:"El código del banco son exactamente 4 dígitos.",patron:/^\d{4}$/,normalizar:a=>a.trim()},{id:"telefono",etiqueta:"Teléfono afiliado",tipo:"text",inputmode:"tel",placeholder:"04141234567",ayuda:"11 dígitos, empezando por 0 (sin espacios ni guiones).",error:"Escribe 11 dígitos empezando por 0, por ejemplo 04141234567.",patron:/^0\d{10}$/,normalizar:a=>a.replace(/[\s.-]/g,"")},{id:"documento",etiqueta:"Cédula o RIF del titular",tipo:"text",inputmode:"text",placeholder:"V12345678",ayuda:"Letra (V, E, J, G o P) seguida de 5 a 10 dígitos.",error:"Escribe la letra (V, E, J, G o P) y de 5 a 10 dígitos, por ejemplo V12345678.",patron:/^[VEJGP]\d{5,10}$/,normalizar:a=>a.replace(/[\s.-]/g,"").toUpperCase()}],componer:a=>`Banco ${T(a,"banco")} · Tel ${T(a,"telefono")} · Cédula/RIF ${T(a,"documento")}`,interpretar:a=>{const e=Oa.exec(a);return e?{banco:e[1]??"",telefono:e[2]??"",documento:e[3]??""}:null}}},Q=["ZELLE","BINANCE","PAYPAL","PAGO_MOVIL"],G=150,ga=99999999,va=a=>Q.some(e=>e===a);function Ra(a,e){const t={},o=a.titular.trim();o===""?t.titular="El titular es obligatorio.":o.length>G&&(t.titular=`Máximo ${G} caracteres.`);let n=null;if(a.ambito==="")t.ambito="Elige a qué sede aplica la cuenta o márcala como común a todas.";else if(a.ambito!=="comun"){const c=Number(a.ambito);Number.isInteger(c)&&e.some(b=>b.id===c)?n=c:t.ambito="La sede elegida no existe. Recarga la página."}const i=a.metodo;if(!va(i))return t.metodo="Elige un método de pago.",{errores:t,cuerpo:null};const l=K[i],p={};for(const c of l.campos){const b=c.normalizar(T(a.campos,c.id));p[c.id]=b,c.patron.test(b)||(t[`campo_${c.id}`]=c.error)}return Object.keys(t).length>0?{errores:t,cuerpo:null}:{errores:t,cuerpo:{metodo:i,titular:o,detalle:l.componer(p),activa:a.activa,sede_id:n}}}function Na(a){const e=a.trim().replace(",",".");if(!/^\d+(?:\.\d{1,2})?$/.test(e))return null;const t=Number(e);return Number.isFinite(t)&&t>0&&t<=ga?t:null}const Fa=a=>a?.rol==="admin"&&(a.sede_id??null)===null;async function na(){const[a,e]=await Promise.all([g.get("/configuracion"),g.get("/sedes")]);return{matricula_usd:a.matricula_usd,cuentas:a.cuentas,sedes:e}}const ha=(a,e)=>{if(a===null)return"Común (todas las sedes)";const t=e.find(o=>o.id===a);return t?t.nombre:`Sede #${a}`};function Va(a,e){const t=o=>`${o.sede_id===null?"0":"1"}|${ha(o.sede_id,e)}|${Q.indexOf(o.metodo)}|${String(o.id).padStart(10,"0")}`;return[...a].sort((o,n)=>t(o).localeCompare(t(n),"es"))}const q=(a,e)=>{const t=a.get(e);return typeof t=="string"?t:""};function H(a,e){for(const t of _("[data-error]",HTMLElement,a)){const o=e[t.dataset.error??""]??"";t.textContent=o,t.hidden=o===""}for(const t of _("[name]",HTMLElement,a))(e[t.getAttribute("name")??""]??"")!==""?t.setAttribute("aria-invalid","true"):t.removeAttribute("aria-invalid");z('[aria-invalid="true"]',HTMLElement,a)?.focus()}function $a(a){const e={titular:"titular",sede_id:"ambito",metodo:"metodo",detalle:"general",matricula_usd:"matricula_usd"},t={};for(const o of a.camposInvalidos())t[e[o.campo]??"general"]=o.mensaje;return Object.keys(t).length===0&&(t.general=a.message),t}function Ua(a,e){if(a.length===0)return v("warn","Todavía no hay cuentas de cobro. Mientras no exista ninguna activa, las familias verán «Consulta los datos de pago con la administración».");const t=Va(a,e).map(o=>r`<tr>
      <td class="${s.td}">${ha(o.sede_id,e)}</td>
      <td class="${s.td} font-semibold">${P(o.metodo)}</td>
      <td class="${s.td}">${o.titular}</td>
      <td class="${s.td} break-words">${o.detalle}</td>
      <td class="${s.td}">${o.activa?ta("Activa","ok"):ta("Inactiva","neutral")}</td>
      <td class="${s.td}">
        <div class="flex flex-wrap gap-2">
          <button type="button" data-accion="editar" data-id="${o.id}" class="${f(s.btnSecundario,s.btnPeq)}" aria-label="Editar la cuenta de ${P(o.metodo)} de ${o.titular}">Editar</button>
          <button type="button" data-accion="alternar" data-id="${o.id}" class="${f(s.btnSecundario,s.btnPeq)}" aria-label="${o.activa?"Desactivar":"Activar"} la cuenta de ${P(o.metodo)} de ${o.titular}">${o.activa?"Desactivar":"Activar"}</button>
        </div>
      </td>
    </tr>`);return r`<div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/95">
    <table class="${s.tabla}">
      <caption class="sr-only">Cuentas de cobro de la academia</caption>
      <thead><tr>
        <th scope="col" class="${s.th}">Ámbito</th><th scope="col" class="${s.th}">Método</th><th scope="col" class="${s.th}">Titular</th>
        <th scope="col" class="${s.th}">Datos públicos</th><th scope="col" class="${s.th}">Estado</th><th scope="col" class="${s.th}">Acciones</th>
      </tr></thead>
      <tbody>${t}</tbody>
    </table>
  </div>`}function Ga(a){const e=a.matricula_usd<=0;return r`<div id="config-raiz">
    <header class="mb-6">
      <h1 class="${s.titulo}">Configuración de cobro</h1>
      <p class="${s.subtitulo}">Costo de la matrícula y cuentas donde las familias depositan.</p>
    </header>

    <section class="${s.tarjeta} mb-6 p-6" aria-labelledby="t-matricula">
      <h2 id="t-matricula" class="text-base font-bold text-slate-900">Costo de la matrícula</h2>
      <p class="${s.ayuda}">Monto único en dólares para todas las sedes. Se muestra en el formulario público de admisiones junto a su equivalente en bolívares a la tasa BCV.</p>
      <div class="mt-4">${e?v("warn","La matrícula aún no está configurada: las inscripciones públicas permanecen bloqueadas hasta que fijes un monto."):v("info",r`Matrícula vigente: <strong>${h(a.matricula_usd)}</strong>.`)}</div>
      <form id="form-matricula" novalidate class="mt-4 grid gap-4 sm:grid-cols-3 sm:items-start">
        <div class="sm:col-span-1">
          <label for="f-matricula" class="${s.etiqueta}">Monto en USD</label>
          <input id="f-matricula" name="matricula_usd" type="text" inputmode="decimal" autocomplete="off" required placeholder="120.00"
            value="${e?"":a.matricula_usd.toFixed(2)}" class="${s.input}" aria-describedby="ay-matricula er-matricula">
          <p id="ay-matricula" class="${s.ayuda}">Hasta dos decimales. Ejemplo: 120.00</p>
          <p id="er-matricula" data-error="matricula_usd" class="${s.errorCampo}" hidden></p>
        </div>
        <div class="flex items-end sm:col-span-2 sm:pt-6">
          <button type="submit" class="${f(s.btnPrimario)}">${$("check","h-4 w-4")}<span>Guardar matrícula</span></button>
        </div>
      </form>
    </section>

    <section class="${s.tarjeta} p-6" aria-labelledby="t-cuentas">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 id="t-cuentas" class="text-base font-bold text-slate-900">Cuentas de cobro</h2>
          <p class="${s.ayuda}">Datos públicos de Zelle, Binance Pay, PayPal y Pago Móvil. Nunca registres contraseñas ni claves aquí: esta información se muestra a las familias.</p>
        </div>
        <button type="button" data-accion="nueva" class="${f(s.btnPrimario)}">${$("wallet","h-4 w-4")}<span>Agregar cuenta</span></button>
      </div>
      ${Ua(a.cuentas,a.sedes)}
      <div class="mt-4">${v("info","Una familia ve las cuentas activas comunes más las de su sede. Si entra sin enlace de invitación, solo ve las comunes.")}</div>
    </section>
  </div>`}async function Wa(a){if(!Fa(a.usuario)){m(a.zona,r`<div class="mx-auto max-w-2xl pt-8">${v("info","La configuración de cobro es del acceso consolidado (administrador sin sede asignada). Pídele a esa persona que actualice la matrícula o las cuentas.","Sección restringida")}</div>`);return}const e=await na();if(!a.vigente())return;let t=e;const o=()=>{m(a.zona,Ga(t)),i()},n=async()=>{t=await na(),a.vigente()&&o()},i=()=>{const l=d("#config-raiz",HTMLElement,a.zona);d("#form-matricula",HTMLFormElement,l).addEventListener("submit",p=>{p.preventDefault(),Xa(d("#form-matricula",HTMLFormElement,l),c=>{t={...t,matricula_usd:c},o()})}),l.addEventListener("click",p=>{const c=p.target instanceof Element?p.target.closest("[data-accion]"):null;if(!(c instanceof HTMLButtonElement))return;const b=c.dataset.accion,L=t.cuentas.find(Pa=>Pa.id===Number(c.dataset.id));b==="nueva"?ia(null,t.sedes,n):b==="editar"&&L?ia(L,t.sedes,n):b==="alternar"&&L&&Ja(c,L,n)})};o()}async function Xa(a,e){const t=Na(q(new FormData(a),"matricula_usd"));if(t===null){H(a,{matricula_usd:`Escribe un monto mayor que 0 y hasta ${ga.toLocaleString("en-US")}, con máximo 2 decimales.`});return}H(a,{});try{const o=await M(d('button[type="submit"]',HTMLButtonElement,a),()=>g.put("/configuracion/matricula",{matricula_usd:t}));A("ok",`Matrícula actualizada a ${h(o.matricula_usd)}.`),e(o.matricula_usd)}catch(o){if(o instanceof y){window.location.reload();return}H(a,o instanceof J?$a(o):{matricula_usd:x(o)})}}async function Ja(a,e,t){const o={metodo:e.metodo,titular:e.titular,detalle:e.detalle,activa:!e.activa,sede_id:e.sede_id};try{await M(a,()=>g.put(`/configuracion/cuentas/${e.id}`,o)),A("ok",o.activa?"Cuenta activada: ya la ven las familias.":"Cuenta desactivada: las familias ya no la ven."),await t()}catch(n){if(n instanceof y){window.location.reload();return}A("bad",x(n))}}function xa(a,e){return va(a)?r`${K[a].campos.map(t=>r`<div>
      <label for="f-campo_${t.id}" class="${s.etiqueta}">${t.etiqueta}</label>
      <input id="f-campo_${t.id}" name="campo_${t.id}" type="${t.tipo}" inputmode="${t.inputmode}" autocomplete="off" required
        placeholder="${t.placeholder}" value="${T(e,t.id)}" class="${s.input}" aria-describedby="ay-${t.id} er-${t.id}">
      <p id="ay-${t.id}" class="${s.ayuda}">${t.ayuda}</p>
      <p id="er-${t.id}" data-error="campo_${t.id}" class="${s.errorCampo}" hidden></p>
    </div>`)}`:r`<p class="${s.ayuda}">Elige un método para ver los datos que se piden.</p>`}function Ya(a,e,t,o){const n=a?.metodo??"",i=a===null?"":a.sede_id===null?"comun":String(a.sede_id);return r`<form id="form-cuenta" novalidate class="grid gap-4">
    <div data-error="general" hidden></div>
    ${o===null?null:v("warn",r`El dato guardado no sigue el formato estructurado: <span class="font-semibold">${o}</span>. Complétalo con los campos de abajo para reemplazarlo.`,"Datos anteriores")}
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="f-metodo" class="${s.etiqueta}">Método de pago</label>
        <select id="f-metodo" name="metodo" required class="${s.input}" aria-describedby="er-metodo">
          <option value="" ${n===""?"selected":""} disabled>Selecciona un método…</option>
          ${Q.map(l=>r`<option value="${l}" ${l===n?"selected":""}>${P(l)}</option>`)}
        </select>
        <p id="er-metodo" data-error="metodo" class="${s.errorCampo}" hidden></p>
      </div>
      <div>
        <label for="f-ambito" class="${s.etiqueta}">Sede a la que aplica</label>
        <select id="f-ambito" name="ambito" required class="${s.input}" aria-describedby="ay-ambito er-ambito">
          <option value="" ${i===""?"selected":""} disabled>Selecciona el ámbito…</option>
          <option value="comun" ${i==="comun"?"selected":""}>Común (todas las sedes)</option>
          ${e.map(l=>r`<option value="${l.id}" ${String(l.id)===i?"selected":""}>${l.nombre}${l.activa?"":" (inactiva)"}</option>`)}
        </select>
        <p id="ay-ambito" class="${s.ayuda}">Las cuentas de una sede solo las ven las familias de esa sede.</p>
        <p id="er-ambito" data-error="ambito" class="${s.errorCampo}" hidden></p>
      </div>
    </div>
    <div>
      <label for="f-titular" class="${s.etiqueta}">Titular de la cuenta</label>
      <input id="f-titular" name="titular" type="text" maxlength="${G}" autocomplete="off" required value="${a?.titular??""}"
        class="${s.input}" aria-describedby="er-titular">
      <p id="er-titular" data-error="titular" class="${s.errorCampo}" hidden></p>
    </div>
    <div id="campos-metodo" class="grid gap-4" aria-live="polite">${xa(n,t)}</div>
    <label class="flex items-center gap-3 text-sm font-medium text-slate-800">
      <input type="checkbox" name="activa" ${a===null||a.activa?"checked":""} class="h-4 w-4 rounded border-slate-300">
      <span>Cuenta activa (visible para las familias)</span>
    </label>
    <div class="flex flex-wrap justify-end gap-3">
      <button type="button" data-cancelar class="${f(s.btnSecundario)}">Cancelar</button>
      <button type="submit" class="${f(s.btnPrimario)}">${$("check","h-4 w-4")}<span>${a===null?"Agregar cuenta":"Guardar cambios"}</span></button>
    </div>
  </form>`}function Za(a){const e=new FormData(a),t={};for(const[o,n]of e.entries())o.startsWith("campo_")&&typeof n=="string"&&(t[o.slice(6)]=n);return{metodo:q(e,"metodo"),titular:q(e,"titular"),ambito:q(e,"ambito"),activa:e.get("activa")!==null,campos:t}}function ia(a,e,t){const o=a?K[a.metodo].interpretar(a.detalle):null,n=a!==null&&o===null?a.detalle:null,i=Y({titulo:a===null?"Agregar cuenta de cobro":"Editar cuenta de cobro",ancho:"lg",cuerpo:Ya(a,e,o??{},n)}),l=d("#form-cuenta",HTMLFormElement,i.dialogo);d("#f-metodo",HTMLSelectElement,l).addEventListener("change",p=>{const c=p.target instanceof HTMLSelectElement?p.target.value:"";m(d("#campos-metodo",HTMLElement,l),xa(c,a!==null&&a.metodo===c&&o?o:{}))}),d("[data-cancelar]",HTMLButtonElement,l).addEventListener("click",()=>i.cerrar()),l.addEventListener("submit",p=>{p.preventDefault(),Ka(l,a,e,i,t)}),d("#f-metodo",HTMLSelectElement,l).focus()}async function Ka(a,e,t,o,n){const i=Ra(Za(a),t);H(a,i.errores);const l=d('[data-error="general"]',HTMLElement,a);if(l.hidden=!0,i.cuerpo===null)return;const p=i.cuerpo;try{await M(d('button[type="submit"]',HTMLButtonElement,a),()=>e===null?g.post("/configuracion/cuentas",p):g.put(`/configuracion/cuentas/${e.id}`,p)),o.cerrar(),A("ok",e===null?"Cuenta agregada.":"Cuenta actualizada."),await n()}catch(c){if(c instanceof y){window.location.reload();return}const b=c instanceof J?$a(c):{general:x(c)},L=b.general;H(a,{...b,general:""}),L&&(l.hidden=!1,m(l,v("bad",L)))}}const N={estructura:"M20 100 L60 18 L100 100",flecha:"M32 84 C54 82 76 66 90 40 M78 42 L91 37 L93 51",pata:"M46 108 L98 108"},I={claro:"#e2e8f0",medio:"#94a3b8",oscuro:"#475569"},ra={destello:{inicio:1400,duracion:850}},Qa=ra.destello.inicio+ra.destello.duracion,la=`
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
`,C={estructura:"[animation:bma-estructura-in_900ms_cubic-bezier(0.22,1,0.36,1)_0ms_both] motion-reduce:[animation:none] will-change-transform",flecha:"[animation:bma-flecha-in_900ms_cubic-bezier(0.22,1,0.36,1)_120ms_both] motion-reduce:[animation:none] will-change-transform",pata:"[animation:bma-pata-in_900ms_cubic-bezier(0.22,1,0.36,1)_240ms_both] motion-reduce:[animation:none] will-change-transform",acople:"[animation:bma-acople_320ms_cubic-bezier(0.22,1,0.36,1)_1140ms_both] motion-reduce:[animation:none]",destello:"[animation:bma-destello_850ms_cubic-bezier(0.22,1,0.36,1)_1400ms_both] motion-reduce:hidden opacity-0",texto:"[animation:bma-texto-in_600ms_cubic-bezier(0.22,1,0.36,1)_1700ms_both] motion-reduce:[animation:none]",acento:"[animation:bma-acento-a_600ms_cubic-bezier(0.22,1,0.36,1)_1700ms_both] motion-reduce:[animation:none]"},da="bma-login-keyframes";let ca=!1;function at(){if(ca||document.getElementById(da)!==null)return;ca=!0;try{const e=new CSSStyleSheet;e.replaceSync(la),document.adoptedStyleSheets=[...document.adoptedStyleSheets,e];return}catch{}const a=document.createElement("style");a.id=da,a.textContent=la,document.head.append(a)}const tt=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;function et(){return r`<div class="relative mx-auto flex w-full max-w-xs flex-col items-center gap-3 text-slate-900" data-bma-logo>
    <svg viewBox="0 0 120 120" class="h-32 w-32 overflow-visible" role="img" aria-labelledby="bma-logo-titulo">
      <title id="bma-logo-titulo">Brilliant Minds Academy</title>
      <defs>
        <linearGradient id="bma-metal" gradientUnits="userSpaceOnUse" x1="14" y1="10" x2="106" y2="112">
          <stop offset="0" stop-color="${I.claro}" />
          <stop offset="0.45" stop-color="${I.medio}" />
          <stop offset="0.7" stop-color="${I.claro}" />
          <stop offset="1" stop-color="${I.oscuro}" />
        </linearGradient>
        <linearGradient id="bma-brillo" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="26" y2="0">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0" />
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
        <!-- Geometría estática (sin animar) reutilizada por la máscara del destello: el brillo solo se ve sobre el trazo. -->
        <path id="bma-forma-estructura" d="${N.estructura}" />
        <path id="bma-forma-flecha" d="${N.flecha}" />
        <path id="bma-forma-pata" d="${N.pata}" />
        <mask id="bma-mascara-destello" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
          <g fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
            <use href="#bma-forma-estructura" /><use href="#bma-forma-flecha" /><use href="#bma-forma-pata" />
          </g>
        </mask>
      </defs>

      <g class="${C.acople} origin-center [transform-box:fill-box]" fill="none" stroke="url(#bma-metal)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
        <g id="bma-capa-estructura" class="${C.estructura}">
          <use href="#bma-forma-estructura" />
        </g>
        <g id="bma-capa-flecha" class="${C.flecha}">
          <use href="#bma-forma-flecha" stroke-width="7" />
        </g>
        <g id="bma-capa-pata" class="${C.pata}">
          <use href="#bma-forma-pata" stroke-width="7" />
        </g>
      </g>

      <g mask="url(#bma-mascara-destello)" aria-hidden="true">
        <rect id="bma-destello" x="0" y="0" width="26" height="120" fill="url(#bma-brillo)"
          class="${C.destello}" />
      </g>
    </svg>
    <p class="text-center text-lg font-semibold tracking-tight ${C.texto}" data-bma-texto>
      <span class="${C.acento}" data-bma-acento>A</span>stra Academy
    </p>
  </div>`}function ot(a){at();const e=()=>{if(m(a,et()),tt())return Promise.resolve();const o=a.querySelector("#bma-destello");return new Promise(n=>{const i=window.setTimeout(n,Qa+400);o?.addEventListener("animationend",()=>{window.clearTimeout(i),n()},{once:!0})})};return{terminada:e(),repetir:e,destruir:()=>m(a,r``)}}const W="Módulo Premium Deshabilitado",ya="bma.sidebar.colapsado",st=3e4,wa=25,F=300,Ea=[{id:"dashboard",titulo:"Dashboard",icono:"home",soloAdmin:!1},{id:"estudiantes",titulo:"Estudiantes",icono:"users",soloAdmin:!1},{id:"auditoria",titulo:"Auditoría de referencias",icono:"inbox",soloAdmin:!1},{id:"contabilidad",titulo:"Contabilidad",icono:"book",soloAdmin:!0},{id:"configuracion",titulo:"Configuración de cobro",icono:"wallet",soloAdmin:!0}],_a={IA_ATENCION:"bot",WHATSAPP_AUTOMATICO:"chat",BANCAMIGA:"wallet",APP_MOVIL:"phone",FACHADA_WEB:"globe"},ua=["","Activo","Moroso","Fuera de la Academia","Pendiente por Validación Administrativa"],pa=["Por Validar","Aprobada","Rechazada"];let u={usuario:null,modulos:[],vista:"dashboard",colapsado:!1,periodo:Z(),filtroEstudiantes:"",paginaEstudiantes:1,filtroAuditoria:"Por Validar",paginaAuditoria:1};function w(a){u={...u,...a}}let j=0,B=null;function nt(){try{const a=localStorage.getItem(ya);if(a==="1")return!0;if(a==="0")return!1}catch{}return window.matchMedia("(max-width: 767px)").matches}function it(a){try{localStorage.setItem(ya,a?"1":"0")}catch{}}function rt(a){if(typeof a!="object"||a===null)return!1;const e=a;return typeof e.id=="number"&&typeof e.nombre=="string"&&typeof e.email=="string"&&(e.rol==="admin"||e.rol==="secretaria")}function lt(){const a=R.usuarioCrudo();if(!a)return null;try{const e=JSON.parse(a);return rt(e)?e:null}catch{return null}}const O=()=>u.usuario?.rol==="admin";function Ma(a){aa(),j+=1,document.body.className="text-slate-900",m(d("#app",HTMLElement),r`<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div id="login-logo" class="w-full"></div>
      <div class="text-center">
        <h1 class="${s.titulo}">Brilliant Minds Academy</h1>
        <p class="${s.subtitulo}">Panel administrativo</p>
      </div>
      <form id="login" novalidate class="${s.tarjetaCristal} flex flex-col gap-4 p-6" aria-label="Iniciar sesión">
        <div id="login-aviso">${a?v("warn",a):null}</div>
        <div>
          <label for="login-email" class="${s.etiqueta}">Correo</label>
          <input id="login-email" name="email" type="email" required autocomplete="username" class="${s.input}">
        </div>
        <div>
          <label for="login-password" class="${s.etiqueta}">Contraseña</label>
          <input id="login-password" name="password" type="password" required autocomplete="current-password" class="${s.input}">
        </div>
        <button type="submit" class="${f(s.btnPrimario,"w-full")}"><span>Entrar</span></button>
      </form>
    </main>`),ot(d("#login-logo",HTMLElement));const e=d("#login",HTMLFormElement);e.addEventListener("submit",t=>{t.preventDefault(),dt(e)}),d("#login-email",HTMLInputElement).focus()}async function dt(a){const e=d("#login-email",HTMLInputElement).value.trim(),t=d("#login-password",HTMLInputElement).value,o=d("#login-aviso",HTMLElement);if(!e||!t){m(o,v("bad","Escribe tu correo y tu contraseña."));return}try{const n=await M(d('button[type="submit"]',HTMLButtonElement,a),()=>g.post("/auth/login",{email:e,password:t},{sinAuth:!0}));R.guardar(n.token,JSON.stringify(n.usuario)),await La()}catch(n){m(o,v("bad",x(n)))}}function k(a){R.cerrar(),w({usuario:null,modulos:[],vista:"dashboard"}),Ma(a)}function X(a){const{id:e,titulo:t,tooltip:o,bloqueado:n}=a;return r`<button type="button" data-nav="${e}" data-bloqueado="${n}"
    class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 aria-[current=page]:bg-slate-900 aria-[current=page]:text-white group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
    ${$(a.icono)}
    <span class="min-w-0 flex-1 truncate group-data-[collapsed=true]/sb:sr-only">${t}</span>
    ${n?r`<span class="text-slate-500 group-data-[collapsed=true]/sb:absolute group-data-[collapsed=true]/sb:right-2 group-data-[collapsed=true]/sb:top-1">${$("lock","h-4 w-4 group-data-[collapsed=true]/sb:h-3 group-data-[collapsed=true]/sb:w-3")}</span>`:null}
    <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">${o}</span>
  </button>`}function ct(){const a=u.usuario,e=Ea.filter(t=>!t.soloAdmin||O());return r`<div id="shell" data-collapsed="${u.colapsado}" class="group/sb flex min-h-screen">
    <aside id="barra-lateral" aria-label="Navegación principal"
      class="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white/95 backdrop-blur transition-[width] duration-200 group-data-[collapsed=true]/sb:w-20">
      <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-4 group-data-[collapsed=true]/sb:justify-center">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">${$("school")}</span>
        <span class="truncate text-sm font-bold text-slate-900 group-data-[collapsed=true]/sb:sr-only">BMA · Administración</span>
      </div>
      <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Secciones">
        ${e.map(t=>X({id:t.id,titulo:t.titulo,icono:t.icono,tooltip:t.titulo,bloqueado:!1}))}
        <p class="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 group-data-[collapsed=true]/sb:sr-only">Módulos Premium</p>
        <hr class="my-2 hidden border-slate-200 group-data-[collapsed=true]/sb:block">
        ${u.modulos.map(t=>X({id:`premium:${t.codigo}`,titulo:t.nombre,icono:_a[t.codigo]??"chat",tooltip:t.bloqueado?`${t.nombre} · ${t.tooltip}`:t.nombre,bloqueado:t.bloqueado}))}
      </nav>
      <div class="flex flex-col gap-1 border-t border-slate-200 p-3">
        <div class="flex items-center gap-3 px-3 py-2 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800" aria-hidden="true">${(a?.nombre??"?").trim().slice(0,1).toUpperCase()}</span>
          <span class="min-w-0 group-data-[collapsed=true]/sb:sr-only"><span class="block truncate text-sm font-semibold text-slate-900">${a?.nombre}</span><span class="block truncate text-xs text-slate-600">${a?.rol}</span></span>
        </div>
        <button type="button" id="salir" class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${$("logout")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Salir</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Salir</span>
        </button>
        <button type="button" id="alternar-sidebar" aria-controls="barra-lateral" aria-expanded="${!u.colapsado}" aria-label="${u.colapsado?"Expandir menú lateral":"Contraer menú lateral"}"
          class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${$("menu")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Contraer menú</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Expandir menú</span>
        </button>
      </div>
    </aside>
    <main id="contenido" tabindex="-1" class="min-w-0 flex-1 p-4 sm:p-8"></main>
  </div>`}function ut(){const a=!u.colapsado;w({colapsado:a}),it(a);const e=d("#shell",HTMLElement);e.dataset.collapsed=String(a);const t=d("#alternar-sidebar",HTMLButtonElement);t.setAttribute("aria-expanded",String(!a)),t.setAttribute("aria-label",a?"Expandir menú lateral":"Contraer menú lateral")}function pt(a){for(const e of _("[data-nav]",HTMLElement))e.dataset.nav===a?e.setAttribute("aria-current","page"):e.removeAttribute("aria-current")}async function La(){if(!R.token()){Ma();return}let a=lt();try{a||(a=(await g.get("/auth/me")).usuario);const o=await g.get("/premium/modulos").catch(n=>{if(n instanceof y)throw n;return[]});w({usuario:a,modulos:o,colapsado:nt()})}catch(o){k(o instanceof y?"Tu sesión expiró. Inicia sesión de nuevo.":x(o));return}document.body.className="text-slate-900",m(d("#app",HTMLElement),ct()),d("#shell",HTMLElement).addEventListener("click",o=>{const i=(o.target instanceof Element?o.target:null)?.closest("[data-nav]");if(!(i instanceof HTMLElement))return;const l=i.dataset.nav??"";u.modulos.find(c=>`premium:${c.codigo}`===l)?.bloqueado&&(o.preventDefault(),o.stopPropagation()),E(l)}),d("#salir",HTMLButtonElement).addEventListener("click",()=>k()),d("#alternar-sidebar",HTMLButtonElement).addEventListener("click",ut);const t=u.vista.startsWith("premium:")||Ea.some(o=>o.id===u.vista)?u.vista:"dashboard";await E(t)}function aa(){B!==null&&(window.clearInterval(B),B=null)}async function E(a){aa(),j+=1;const e=j;w({vista:a}),pt(a);const t=d("#contenido",HTMLElement),o={zona:t,vigente:()=>e===j};m(t,r`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando"></div>`);try{a.startsWith("premium:")?At(o,a.slice(8)):a==="estudiantes"?await ht(o):a==="auditoria"?await yt(o):a==="contabilidad"&&O()?await _t(o):a==="configuracion"&&O()?await Wa({zona:o.zona,vigente:o.vigente,usuario:u.usuario}):await gt(o)}catch(n){Aa(n,o)}}function Aa(a,e){if(e.vigente()){if(a instanceof y){k("Tu sesión expiró. Inicia sesión de nuevo.");return}if(a instanceof J){const t=a.moduloPremium();if(t){zt(e.zona,t);return}}m(e.zona,r`<div class="mx-auto max-w-2xl pt-8">${v("bad",x(a),a instanceof Da?"Sin conexión":"No se pudo cargar la sección")}
      <button type="button" data-reintentar class="${f(s.btnSecundario,"mt-4")}">${$("refresh","h-4 w-4")}<span>Reintentar</span></button></div>`),z("[data-reintentar]",HTMLButtonElement,e.zona)?.addEventListener("click",()=>void E(u.vista))}}function S(a,e,t=null){return r`<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><h1 class="${s.titulo}">${a}</h1><p class="${s.subtitulo}">${e}</p></div>
    ${t}
  </header>`}function Ta(a){const e=Math.max(1,Math.ceil(a.total/Math.max(1,a.limite)));return r`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación">
    <span class="text-slate-600">Página ${a.pagina} de ${e} · ${a.total} registro(s)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${f(s.btnSecundario,s.btnPeq)}" ${a.pagina<=1?ea("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${f(s.btnSecundario,s.btnPeq)}" ${a.pagina>=e?ea("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function Ca(a,e){for(const t of _("[data-pag]",HTMLButtonElement,a))t.addEventListener("click",()=>e(Number(t.dataset.pag)))}function D(a){return r`<article class="${s.tarjeta} p-6">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-sm font-medium text-slate-600">${a.titulo}</h3>
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${$(a.icono,"h-4 w-4")}</span>
    </div>
    <p class="mt-3 text-2xl font-bold ${a.tono==="malo"?"text-red-800":"text-slate-900"}" data-kpi>${a.valor}</p>
    <p class="mt-1 text-xs text-slate-600">${a.detalle}</p>
  </article>`}function mt(a){const e=Ba(a.periodo),t=new Map;for(const l of a.cobrado_por_dia)t.set(Number(l.dia.slice(8,10)),l.monto_usd);const o=Math.max(0,...t.values()),n=Array.from({length:e},(l,p)=>{const c=p+1,b=t.get(c)??0,L=o>0?Math.max(b>0?4:0,Math.round(b/o*100)):0;return r`<li class="group/barra relative flex h-full min-w-0 flex-1 flex-col justify-end" title="Día ${c}: ${h(b)}">
      <div data-alto="${L}" class="w-full rounded-t ${b>0?"bg-slate-800 group-hover/barra:bg-slate-600":"bg-slate-200"} ${b>0?"":"h-px"}"></div>
      <span class="sr-only">Día ${c}: ${h(b)}</span>
    </li>`}),i=Array.from({length:e},(l,p)=>r`<span class="min-w-0 flex-1 text-center text-xs text-slate-600">${(p+1)%5===0||p===0?p+1:""}</span>`);return r`<div role="group" aria-label="Cobrado por día en ${a.periodo}">
    <ul class="flex h-48 items-end gap-1 border-b border-slate-200">${n}</ul>
    <div class="mt-1 flex gap-1" aria-hidden="true">${i}</div>
  </div>`}function bt(a){for(const e of _("[data-alto]",HTMLElement,a)){const t=Number(e.dataset.alto);Number.isFinite(t)&&t>0&&(e.style.height=`${Math.min(100,t)}%`)}}function ft(a,e){const t=[{titulo:"Cobrado",valor:h(a.cobrado.monto_usd),detalle:`${a.cobrado.cantidad} pago(s) aprobados`,icono:"wallet",tono:"normal"},{titulo:"Saldos vencidos",valor:h(a.saldos_vencidos.monto_usd),detalle:`${a.saldos_vencidos.cantidad} cuota(s) vencida(s)`,icono:"alert",tono:"malo"},{titulo:"Cuentas pendientes del mes",valor:h(a.cuentas_pendientes.monto_usd),detalle:`${a.cuentas_pendientes.cantidad} cuota(s) por cobrar`,icono:"book",tono:"normal"},{titulo:"Referencias por validar",valor:String(a.referencias_por_validar),detalle:"en la bandeja de auditoría",icono:"inbox",tono:"normal"}];return r`
    <section aria-label="Indicadores del mes" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${t.map(D)}</section>
    <section aria-label="Estudiantes por estado" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${[["Activos",e.activos],["Morosos",e.morosos],["Fuera de la Academia",e.fuera_de_la_academia],["Pendientes de validación",e.pendientes_validacion]].map(([o,n])=>r`<div class="${s.tarjeta} flex items-center justify-between gap-4 px-6 py-4"><span class="text-sm text-slate-700">${o}</span><strong class="text-lg text-slate-900">${n}</strong></div>`)}
    </section>
    <section class="${s.tarjeta} mt-6 p-6" aria-labelledby="t-barras">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="t-barras" class="text-base font-bold text-slate-900">Recaudación diaria</h2>
        <p class="text-sm text-slate-600">Cobrado del mes: <strong class="text-slate-900">${h(a.cobrado.monto_usd)}</strong></p>
      </div>
      ${mt(a)}
    </section>`}async function V(a,e){const t=d("#tablero",HTMLElement,a.zona);e||m(t,r`<div class="h-48 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando tablero"></div>`);try{const[o,n]=await Promise.all([g.get("/facturacion/tablero",{periodo:u.periodo}),g.get("/estudiantes/resumen")]);if(!a.vigente())return;m(t,ft(o,n)),bt(t);const i=z("#actualizado",HTMLElement,a.zona);i&&(i.textContent=`Actualizado a las ${ja(new Date)}`)}catch(o){if(!a.vigente()||e&&!(o instanceof y))return;Aa(o,a)}}async function gt(a){m(a.zona,r`${S("Dashboard","Tablero financiero en tiempo real",r`<div class="flex flex-wrap items-end gap-4">
        <div><label for="periodo" class="${s.etiqueta}">Período</label><input id="periodo" type="month" value="${u.periodo}" max="${Z()}" class="${s.input}"></div>
        <p id="actualizado" class="pb-2 text-xs text-slate-600" aria-live="off"></p>
      </div>`)}<div id="tablero"></div>`),d("#periodo",HTMLInputElement,a.zona).addEventListener("change",e=>{const t=e.target instanceof HTMLInputElement?e.target.value:"";/^\d{4}-\d{2}$/.test(t)&&(w({periodo:t}),V(a,!1))}),await V(a,!0),B=window.setInterval(()=>{if(!a.vigente()){aa();return}document.hidden||V(a,!0)},st)}function vt(a){return r`<tr>
    <td class="${s.td}"><span class="font-medium text-slate-900">${a.apellidos}, ${a.nombres}</span></td>
    <td class="${s.td}">${a.grado_solicitado}</td>
    <td class="${s.td}">${a.representante}</td>
    <td class="${s.td}">${ba(a.estado_dinamico)}</td>
    <td class="${s.td} whitespace-nowrap">${h(a.deuda_vencida_usd)}</td>
    <td class="${s.td}"><div class="flex flex-wrap gap-2">
      <button type="button" data-alerta="preventiva" data-id="${a.id}" class="${f(s.btnSecundario,s.btnPeq)}">Preventiva</button>
      <button type="button" data-alerta="morosidad" data-id="${a.id}" class="${f(s.btnSecundario,s.btnPeq)}">Morosidad</button>
    </div></td>
  </tr>`}async function ht(a){const e=await g.pagina("/estudiantes",{estado:u.filtroEstudiantes,pagina:u.paginaEstudiantes,limite:wa});if(a.vigente()){m(a.zona,r`${S("Estudiantes",`${e.paginacion.total} resultado(s)`)}
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
      ${ua.map(t=>r`<button type="button" data-filtro="${t}" aria-pressed="${t===u.filtroEstudiantes}" class="${f(s.btnSecundario,s.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${t===""?"Todos":t}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${s.tabla}">
        <caption class="sr-only">Listado de estudiantes</caption>
        <thead><tr><th scope="col" class="${s.th}">Estudiante</th><th scope="col" class="${s.th}">Grado</th><th scope="col" class="${s.th}">Representante</th><th scope="col" class="${s.th}">Estado</th><th scope="col" class="${s.th}">Deuda vencida</th><th scope="col" class="${s.th}">Alertas WhatsApp</th></tr></thead>
        <tbody>${e.datos.length===0?r`<tr><td colspan="6" class="${s.td}">Sin resultados.</td></tr>`:e.datos.map(vt)}</tbody>
      </table>
    </div>
    ${Ta(e.paginacion)}`);for(const t of _("[data-filtro]",HTMLButtonElement,a.zona))t.addEventListener("click",()=>{const o=t.dataset.filtro??"",n=ua.find(i=>i===o)??"";w({filtroEstudiantes:n,paginaEstudiantes:1}),E("estudiantes")});Ca(a.zona,t=>{w({paginaEstudiantes:Math.max(1,u.paginaEstudiantes+t)}),E("estudiantes")});for(const t of _("[data-alerta]",HTMLButtonElement,a.zona))t.addEventListener("click",()=>{const o=t.dataset.alerta==="morosidad"?"morosidad":"preventiva";$t(o,Number(t.dataset.id),t)})}}async function $t(a,e,t){try{const o=await M(t,()=>g.post(`/notificaciones/whatsapp/${a}/${e}`)),n=Y({titulo:a==="morosidad"?"Alerta de morosidad":"Alerta preventiva",ancho:"lg",cuerpo:r`<p class="text-sm text-slate-600">${h(o.monto_usd)} · ${fa(o.monto_bs)} · tasa BCV ${Ha(o.tasa_bcv)}</p>
        <pre class="mt-4 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">${o.mensaje}</pre>
        <div id="alerta-resultado" class="mt-4"></div>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <a href="${Ia(o.enlace_whatsapp,["https://wa.me/"])}" target="_blank" rel="noopener noreferrer" class="${f(s.btnPrimario)}">Abrir en WhatsApp</a>
          <button type="button" id="alerta-enviar" class="${f(s.btnSecundario)}">Enviar por API</button>
        </div>`}),i=d("#alerta-enviar",HTMLButtonElement,n.dialogo);i.addEventListener("click",()=>{const l=d("#alerta-resultado",HTMLElement,n.dialogo);M(i,()=>g.post(`/notificaciones/whatsapp/${a}/${e}`,{},{consulta:{enviar:!0}})).then(()=>m(l,v("ok","Mensaje enviado por la API de WhatsApp."))).catch(p=>m(l,v("bad",x(p))))})}catch(o){o instanceof y?k("Tu sesión expiró. Inicia sesión de nuevo."):A("bad",x(o))}}function xt(a){const e=a.estado==="Por Validar";return r`<tr>
    <td class="${s.td} whitespace-nowrap">${ma(a.declarado_en)}</td>
    <td class="${s.td}"><span class="font-medium text-slate-900">${a.estudiante}</span><br><span class="text-xs text-slate-600">${a.concepto} · vence ${qa(a.fecha_vencimiento)}</span></td>
    <td class="${s.td}"><strong class="break-all">${a.referencia}</strong><br><span class="text-xs text-slate-600">${a.representante}</span></td>
    <td class="${s.td}">${P(a.metodo_pago)}</td>
    <td class="${s.td} whitespace-nowrap">${h(a.monto_usd)}<br><span class="text-xs text-slate-600">${fa(a.monto_bs)}</span></td>
    <td class="${s.td}">${e?r`<div class="flex flex-wrap gap-2">
          <button type="button" data-aprobar="${a.id}" class="${f(s.btnOk,s.btnPeq)}">${$("check","h-4 w-4")}<span>Aprobar</span></button>
          <button type="button" data-rechazar="${a.id}" class="${f(s.btnPeligro,s.btnPeq)}">${$("x","h-4 w-4")}<span>Rechazar</span></button>
        </div>`:r`${ba(a.estado)}${a.nota_revision?r`<p class="mt-1 max-w-xs break-words text-xs text-slate-600">${a.nota_revision}</p>`:null}`}</td>
  </tr>`}async function yt(a){const e=await g.pagina("/facturacion/auditoria",{estado:u.filtroAuditoria,pagina:u.paginaAuditoria,limite:wa});if(!a.vigente())return;const t=O()?r`<button type="button" id="exportar" class="${f(s.btnSecundario)}">${$("down","h-4 w-4")}<span>Exportar histórico (.xlsx)</span></button>`:null;m(a.zona,r`${S("Bandeja de auditoría",`${e.paginacion.total} referencia(s) · ${u.filtroAuditoria}`,t)}
    <div id="auditoria-aviso" class="mb-4"></div>
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado de la referencia">
      ${pa.map(i=>r`<button type="button" data-filtro="${i}" aria-pressed="${i===u.filtroAuditoria}" class="${f(s.btnSecundario,s.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${i}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${s.tabla}">
        <caption class="sr-only">Referencias de pago declaradas</caption>
        <thead><tr><th scope="col" class="${s.th}">Declarada</th><th scope="col" class="${s.th}">Estudiante</th><th scope="col" class="${s.th}">Referencia</th><th scope="col" class="${s.th}">Método</th><th scope="col" class="${s.th}">Monto</th><th scope="col" class="${s.th}">Acción</th></tr></thead>
        <tbody>${e.datos.length===0?r`<tr><td colspan="6" class="${s.td}">Bandeja vacía.</td></tr>`:e.datos.map(xt)}</tbody>
      </table>
    </div>
    ${Ta(e.paginacion)}`);const o=d("#auditoria-aviso",HTMLElement,a.zona);for(const i of _("[data-filtro]",HTMLButtonElement,a.zona))i.addEventListener("click",()=>{const l=i.dataset.filtro??"",p=pa.find(c=>c===l)??"Por Validar";w({filtroAuditoria:p,paginaAuditoria:1}),E("auditoria")});Ca(a.zona,i=>{w({paginaAuditoria:Math.max(1,u.paginaAuditoria+i)}),E("auditoria")});const n=new Map(e.datos.map(i=>[i.id,i]));for(const i of _("[data-aprobar]",HTMLButtonElement,a.zona))i.addEventListener("click",()=>void wt(Number(i.dataset.aprobar),i,o));for(const i of _("[data-rechazar]",HTMLButtonElement,a.zona))i.addEventListener("click",()=>{const l=n.get(Number(i.dataset.rechazar));l&&Et(l)});z("#exportar",HTMLButtonElement,a.zona)?.addEventListener("click",i=>{const l=i.currentTarget instanceof HTMLButtonElement?i.currentTarget:null;l&&ka(l,"/exportaciones/facturacion.xlsx","facturacion.xlsx",o)})}async function ka(a,e,t,o){try{await M(a,()=>g.descargar(e,t))}catch(n){n instanceof y?k("Tu sesión expiró. Inicia sesión de nuevo."):m(o,v("bad",x(n)))}}function za(a,e){return`${e} · estatus de pago del alumno: ${a.estatus_pago} · deuda vencida ${h(a.deuda_vencida_usd)}.`}async function wt(a,e,t){try{const o=await M(e,()=>g.post(`/facturacion/auditoria/${a}/aprobar`,{}));A("ok",za(o,"Referencia aprobada")),await E("auditoria")}catch(o){o instanceof y?k("Tu sesión expiró. Inicia sesión de nuevo."):m(t,v("bad",x(o)))}}function Et(a){const e=Y({titulo:"Rechazar referencia",cuerpo:r`<form id="form-rechazo" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700">Referencia <strong class="break-all">${a.referencia}</strong> · ${a.estudiante} · ${h(a.monto_usd)}</p>
      <div>
        <label for="nota-rechazo" class="${s.etiqueta}">Motivo del rechazo <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="nota-rechazo" name="nota" rows="4" maxlength="${F}" required aria-describedby="nota-ayuda nota-error" class="${s.input}"></textarea>
        <p id="nota-ayuda" class="${s.ayuda}">Se guarda en el historial y se usa para avisar al representante. <span id="nota-contador">0/${F}</span></p>
        <p id="nota-error" class="${s.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="rechazo-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${f(s.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${f(s.btnPeligro)}">${$("x","h-4 w-4")}<span>Rechazar referencia</span></button>
      </div>
    </form>`}),t=d("#form-rechazo",HTMLFormElement,e.dialogo),o=d("#nota-rechazo",HTMLTextAreaElement,e.dialogo),n=d("#nota-error",HTMLElement,e.dialogo),i=d("#nota-contador",HTMLElement,e.dialogo);o.addEventListener("input",()=>{i.textContent=`${o.value.length}/${F}`,o.value.trim()!==""&&(n.hidden=!0,o.removeAttribute("aria-invalid"))}),d("[data-cancelar]",HTMLButtonElement,e.dialogo).addEventListener("click",e.cerrar),t.addEventListener("submit",l=>{l.preventDefault();const p=o.value.trim();if(p===""){n.textContent="Debes escribir el motivo del rechazo para continuar.",n.hidden=!1,o.setAttribute("aria-invalid","true"),o.focus();return}const c=d('button[type="submit"]',HTMLButtonElement,t);M(c,()=>g.post(`/facturacion/auditoria/${a.id}/rechazar`,{nota:p})).then(async b=>{e.cerrar(),A("ok",za(b,"Referencia rechazada")),await E("auditoria")}).catch(b=>{if(b instanceof y){e.cerrar(),k("Tu sesión expiró. Inicia sesión de nuevo.");return}m(d("#rechazo-aviso",HTMLElement,e.dialogo),v("bad",x(b)))})}),o.focus()}async function _t(a){const e=await g.get("/contabilidad/balance",{periodo:u.periodo});if(!a.vigente())return;m(a.zona,r`${S("Contabilidad",`Balance neto del período ${e.periodo}`,r`<div class="flex flex-wrap items-end gap-4">
      <div><label for="periodo-conta" class="${s.etiqueta}">Período</label><input id="periodo-conta" type="month" value="${u.periodo}" max="${Z()}" class="${s.input}"></div>
      <button type="button" id="exportar" class="${f(s.btnPrimario)}">${$("down","h-4 w-4")}<span>Exportar nómina, egresos y personal (.xlsx)</span></button>
    </div>`)}
    <div id="conta-aviso" class="mb-4"></div>
    <section class="grid gap-4 sm:grid-cols-3" aria-label="Balance">
      ${D({titulo:"Ingresos",valor:h(e.ingresos_usd),detalle:"Referencias aprobadas del período",icono:"wallet",tono:"normal"})}
      ${D({titulo:"Egresos",valor:h(e.egresos_usd),detalle:"Egresos y nómina pagada",icono:"book",tono:"normal"})}
      ${D({titulo:"Neto",valor:h(e.neto_usd),detalle:"Ingresos − egresos",icono:"check",tono:e.neto_usd<0?"malo":"normal"})}
    </section>`),d("#periodo-conta",HTMLInputElement,a.zona).addEventListener("change",o=>{const n=o.target instanceof HTMLInputElement?o.target.value:"";/^\d{4}-\d{2}$/.test(n)&&(w({periodo:n}),E("contabilidad"))});const t=d("#conta-aviso",HTMLElement,a.zona);d("#exportar",HTMLButtonElement,a.zona).addEventListener("click",o=>{const n=o.currentTarget instanceof HTMLButtonElement?o.currentTarget:null;n&&ka(n,"/exportaciones/contabilidad.xlsx","contabilidad.xlsx",t)})}function Mt(){const a=r`<div class="flex items-center gap-4 border-b border-slate-100 py-4"><div class="h-8 w-8 rounded-full bg-slate-200"></div><div class="h-4 flex-1 rounded bg-slate-200"></div><div class="h-4 w-24 rounded bg-slate-200"></div></div>`;return r`<div aria-hidden="true" class="pointer-events-none select-none p-6">
    <div class="mb-4 h-6 w-1/3 rounded bg-slate-300"></div>${a}${a}${a}${a}${a}
  </div>`}function Lt(a){return r`<div data-candado class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 p-6 backdrop-blur-md">
    <div role="region" aria-label="${W}" class="${s.tarjetaCristal} w-full max-w-md p-8 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">${$("lock","h-6 w-6")}</span>
      <h2 class="mt-4 text-lg font-bold text-slate-900">${W}</h2>
      <p class="mt-1 text-sm font-semibold text-slate-800">${a.nombre}</p>
      <p class="mt-2 text-sm text-slate-700">${a.descripcion}</p>
      <p class="mt-4 text-2xl font-bold text-slate-900">${h(a.precio_usd)}</p>
      <p class="mt-1 text-xs text-slate-600">Pago único · solicítalo a Astra Digital Solutions</p>
    </div>
  </div>`}function Sa(a){return r`${S(a.nombre,a.descripcion)}
    <div class="${s.tarjeta} relative min-h-96 overflow-hidden">${Mt()}${Lt(a)}</div>`}function At(a,e){const t=u.modulos.find(n=>n.codigo===e);if(!t){m(a.zona,v("bad","Módulo no encontrado."));return}if(t.bloqueado){const n=t.prueba_utilizada===!1&&Tt();m(a.zona,r`${Sa(t)}${n?r`<div class="mt-6">${v("info",r`<p>Prueba este módulo sin costo durante 15 días. Al vencer se bloquea solo.</p>
            <button type="button" id="activar-prueba" class="${f(s.btnPrimario,"mt-3")}">${$("check","h-4 w-4")}<span>Activar prueba gratuita de 15 días</span></button>`,"Prueba gratuita disponible")}</div>`:null}`);const i=z("#activar-prueba",HTMLButtonElement);i?.addEventListener("click",()=>{M(i,()=>kt(t)).catch(l=>A("bad",x(l)))});return}const o=t.en_prueba===!0&&t.expira_prueba_en?t.expira_prueba_en:null;m(a.zona,r`${S(t.nombre,t.descripcion)}
    <div class="${s.tarjeta} flex flex-col gap-4 p-6">
      ${o?v("warn",`Prueba gratuita vigente hasta el ${ma(o)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba"):null}
      ${v("info","El módulo está habilitado para esta academia. Su lógica se publicará en la Fase 2 (ruta reservada en el servidor).","Módulo habilitado")}
    </div>`)}const Tt=()=>u.usuario?.rol==="admin"&&(u.usuario.sede_id??null)===null;function Ct(a){const e=z(`[data-nav="premium:${a.codigo}"]`,HTMLElement);if(!e)return;const t=document.createElement("div");m(t,X({id:`premium:${a.codigo}`,titulo:a.nombre,icono:_a[a.codigo]??"chat",tooltip:a.bloqueado?`${a.nombre} · ${a.tooltip??W}`:a.nombre,bloqueado:a.bloqueado}));const o=t.firstElementChild;o&&e.replaceWith(o)}async function kt(a){await g.post("/premium/activar-prueba",{modulo:a.codigo});const e=await g.get("/premium/modulos");w({modulos:e});for(const t of e)Ct(t);A("ok","Prueba gratuita de 15 días activada."),await E(`premium:${a.codigo}`)}function zt(a,e){const t=u.modulos.find(o=>o.codigo===e.modulo);m(a,Sa({nombre:e.nombre,descripcion:t?.descripcion??"Este módulo forma parte de la Fase 2 del sistema.",precio_usd:e.precio_usd}))}La();
