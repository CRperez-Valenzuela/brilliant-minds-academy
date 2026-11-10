import{e as f,o as d,C as s,Q as k,b as L,i as T,P as H,h as o,f as _,m as M,y as I,a as c,t as h,k as x,N as P,u as E,w,d as N,n as j,x as S,v as A,l as z,r as B,c as y}from"./firma-mdi2PnVU.js";const R=["ZELLE","BINANCE","PAYPAL","PAGO_MOVIL"],q=/^[A-Za-z0-9-]{4,40}$/,V=/^[A-Za-z0-9._~-]{8,256}$/,D=e=>R.includes(e);function O(e=window.location){const a=/^\/portal\/([^/]+)\/?$/.exec(e.pathname);let t=null;if(a&&a[1]!==void 0&&a[1]!=="index.html")try{t=decodeURIComponent(a[1])}catch{t=null}else t=new URLSearchParams(e.search).get("token");return t!==null&&V.test(t)?t:null}let m=null,u={fase:"cargando"};const v=new Set;function C(e){return e.reduce((a,t)=>a+Math.round(t*100),0)/100}function U(e){return e.filter(a=>a.estado==="Pendiente"||a.estado==="En Revisión")}function F(e,a){const t=a.filter(n=>n.estado==="Pendiente"&&h(n.fecha_vencimiento));switch(e.estado){case"Fuera de la Academia":return c("bad","El estudiante figura fuera de la academia. Comunícate con la administración antes de realizar pagos.","Cuenta inactiva");case"Pendiente por Validación Administrativa":return c("info","La administración está validando la inscripción y el pago de la matrícula. Te avisaremos por WhatsApp.","Inscripción en validación");case"Moroso":return c("bad",`Tienes ${t.length} ${t.length===1?"cuota vencida":"cuotas vencidas"}. Registra tu pago para regularizar la cuenta.`,"Cuenta con saldo vencido");default:return a.length===0?c("ok","No tienes cuotas pendientes. ¡Gracias por estar al día!","Cuenta al día"):c("ok","Tu cuenta está al día. Estas son las próximas cuotas.","Cuenta al día")}}function Z(e){return e.length===0?o`<p class="${s.ayuda}">Consulta los datos de pago con la administración.</p>`:o`<ul class="mt-2 grid gap-2 sm:grid-cols-2">${e.map(a=>o`<li class="rounded-lg border border-slate-200 bg-white/95 p-3 text-sm"><p class="font-semibold text-slate-900">${A(a.metodo)}</p><p class="break-words text-slate-700">${a.detalle}</p><p class="text-xs text-slate-600">Titular: ${a.titular}</p></li>`)}</ul>`}function G(e){const a=`ref-${e.id}`,t=`met-${e.id}`;return o`<form data-cuota="${e.id}" novalidate class="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2" aria-label="Registrar referencia de ${e.concepto}">
    <div>
      <label for="${t}" class="${s.etiqueta}">Método de pago</label>
      <select id="${t}" name="metodo_pago" class="${s.input}">${R.map(n=>o`<option value="${n}">${A(n)}</option>`)}</select>
    </div>
    <div>
      <label for="${a}" class="${s.etiqueta}">Número de referencia</label>
      <input id="${a}" name="referencia" type="text" required maxlength="40" autocomplete="off" aria-describedby="${a}-ayuda ${a}-error" class="${s.input}">
      <p id="${a}-ayuda" class="${s.ayuda}">4 a 40 caracteres: letras, números o guiones, sin espacios.</p>
      <p id="${a}-error" class="${s.errorCampo}" role="alert" hidden></p>
    </div>
    <div class="sm:col-span-2">
      <button type="submit" class="${L(s.btnPrimario,"w-full sm:w-auto")}">${T("check","h-4 w-4")}<span>Registrar referencia</span></button>
    </div>
  </form>`}function K(e){const a=e.estado==="Pendiente"&&h(e.fecha_vencimiento);return o`<li class="${s.tarjeta} p-6" data-cuota-card="${e.id}">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="break-words text-base font-bold text-slate-900">${e.concepto}</h3>
        <p class="mt-1 text-sm text-slate-600">Vence el <time>${z(e.fecha_vencimiento)}</time></p>
      </div>
      <div class="flex flex-wrap items-center gap-2">${a?B("Vencida","bad"):null}${x(e.estado==="Pendiente"?"Pendiente":"En Revisión")}</div>
    </div>
    <p class="mt-4 text-2xl font-bold text-slate-900">${E(e.monto_usd)} <span class="text-lg font-semibold text-slate-700">≈ ${w(e.monto_bs)}</span></p>
    ${e.estado==="Pendiente"?G(e):o`<p class="mt-4 text-sm text-slate-700">Tu referencia está en revisión. La administración la confirmará en breve.</p>`}
  </li>`}function Q(e){const a=U(e.cuotas),t=a.filter(r=>r.estado==="Pendiente"),n=t.some(r=>h(r.fecha_vencimiento)),l=n?"rounded-xl border border-bma-coral/50 bg-bma-coral-suave shadow-sm":s.tarjeta,i=n?"text-bma-coral-oscuro":"text-slate-700",b=n?"text-bma-coral-oscuro":"text-slate-900";return o`
    <section class="${s.tarjetaCristal} p-6" aria-labelledby="t-estudiante">
      <p class="text-sm text-slate-600">Estudiante</p>
      <h2 id="t-estudiante" class="break-words text-xl font-bold text-slate-900">${e.estudiante}</h2>
      <div class="mt-4 flex flex-wrap items-center gap-2">${x(e.estado)}${x(e.estatus_pago)}</div>
      <p class="mt-4 text-sm text-slate-700">Tasa BCV vigente: <strong class="text-slate-900">${P(e.tasa_bcv)}</strong> Bs. por US$. Los montos en bolívares se calculan con esta tasa.</p>
      ${e.tasa_desactualizada?o`<div class="mt-4">${c("warn","El BCV no respondió en este momento: se usa la última tasa disponible. El monto exacto se confirma al validar el pago.")}</div>`:null}
    </section>
    ${F(e,a)}
    ${t.length>0?o`<section class="${l} flex flex-wrap items-center justify-between gap-4 p-6" aria-label="Total pendiente">
          <span class="text-sm font-medium ${i}">Total pendiente de pago</span>
          <span class="text-xl font-bold ${b}">${E(C(t.map(r=>r.monto_usd)))} <span class="text-base font-semibold ${i}">≈ ${w(C(t.map(r=>r.monto_bs)))}</span></span>
        </section>`:null}
    <section class="${s.tarjeta} p-6" aria-labelledby="t-cuentas">
      <h2 id="t-cuentas" class="text-base font-bold text-slate-900">Cuentas para pagar</h2>
      ${Z(e.cuentas)}
    </section>
    <section aria-labelledby="t-cuotas">
      <h2 id="t-cuotas" class="mb-4 text-base font-bold text-slate-900">Cuotas pendientes</h2>
      ${a.length===0?o`<div class="${s.tarjeta} p-6 text-sm text-slate-700">No tienes cuotas pendientes.</div>`:o`<ul class="flex flex-col gap-4">${a.map(K)}</ul>`}
    </section>`}function W(){return o`<div class="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
    <header class="flex flex-col gap-4">
      ${k()}
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="${s.titulo}">Portal del representante</h1>
          <p class="${s.subtitulo}">Brilliant Minds Academy</p>
        </div>
        <button type="button" id="actualizar" class="${L(s.btnSecundario,s.btnPeq)}">${T("refresh","h-4 w-4")}<span>Actualizar</span></button>
      </div>
    </header>
    <div id="contenido" class="flex flex-col gap-6"></div>
    <div class="mt-auto">${H()}</div>
  </div>`}function $(){const e=d("#contenido",HTMLElement);switch(u.fase){case"cargando":f(e,o`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando estado de cuenta"></div>`);return;case"error":f(e,c("bad",o`${u.mensaje} <span class="block pt-2">Si el problema continúa, solicita un nuevo enlace a la administración.</span>`,"No pudimos abrir tu estado de cuenta"));return;case"listo":f(e,Q(u.datos));for(const a of I("form[data-cuota]",HTMLFormElement,e))a.addEventListener("submit",t=>{t.preventDefault(),Y(a)})}}async function g(e=!1){if(m===null){u={fase:"error",mensaje:"El enlace del portal no es válido o está incompleto."},$();return}e||(u={fase:"cargando"},$());try{u={fase:"listo",datos:await _.get(`/portal/${encodeURIComponent(m)}`,void 0,{sinAuth:!0})}}catch(a){u={fase:"error",mensaje:M(a)}}$()}function p(e,a){const t=e.dataset.cuota??"",n=y(`#ref-${CSS.escape(t)}-error`,HTMLElement,e),l=y('input[name="referencia"]',HTMLInputElement,e);!n||!l||(n.textContent=a??"",n.hidden=a===null,a===null?l.removeAttribute("aria-invalid"):l.setAttribute("aria-invalid","true"))}async function Y(e){const a=Number(e.dataset.cuota);if(m===null||!Number.isInteger(a)||v.has(a))return;p(e,null);const t=d('input[name="referencia"]',HTMLInputElement,e).value.trim(),n=d('select[name="metodo_pago"]',HTMLSelectElement,e).value;if(!q.test(t)){p(e,"La referencia debe tener de 4 a 40 caracteres (letras, números o guiones, sin espacios)."),d('input[name="referencia"]',HTMLInputElement,e).focus();return}if(!D(n)){p(e,"Selecciona un método de pago válido.");return}const l={cuota_id:a,referencia:t,metodo_pago:n};v.add(a);try{const i=await N(d('button[type="submit"]',HTMLButtonElement,e),()=>_.post(`/portal/${encodeURIComponent(m??"")}/referencias`,l,{sinAuth:!0}));j("ok",`Referencia registrada por ${E(i.monto_usd)} (${w(i.monto_bs)} a tasa ${P(i.tasa_bcv)}). La administración la validará.`),await g(!0)}catch(i){const b=i instanceof S?i.camposInvalidos()[0]?.mensaje:void 0;p(e,b??M(i))}finally{v.delete(a)}}function J(){document.body.className="text-slate-900",f(d("#app",HTMLElement),W()),m=O(),d("#actualizar",HTMLButtonElement).addEventListener("click",()=>void g()),g()}J();
