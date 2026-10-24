import{a as m,o as r,C as n,i as v,c as y,h as o,b as C,m as L,t as R,d as l,j as x,n as T,u as g,l as h,e as j,v as k,g as H,G as _,y as M,x as I,F as N,f as E}from"./ui-CAi4AOjY.js";const A=["ZELLE","BINANCE","PAYPAL","PAGO_MOVIL"],S=/^[A-Za-z0-9-]{4,40}$/,z=/^[A-Za-z0-9._~-]{8,256}$/,B=e=>A.includes(e);function q(e=window.location){const a=/^\/portal\/([^/]+)\/?$/.exec(e.pathname);let t=null;if(a&&a[1]!==void 0&&a[1]!=="index.html")try{t=decodeURIComponent(a[1])}catch{t=null}else t=new URLSearchParams(e.search).get("token");return t!==null&&z.test(t)?t:null}let u=null,c={fase:"cargando"};const f=new Set;function w(e){return e.reduce((a,t)=>a+Math.round(t*100),0)/100}function V(e){return e.filter(a=>a.estado==="Pendiente"||a.estado==="En Revisión")}function O(e,a){const t=a.filter(s=>s.estado==="Pendiente"&&_(s.fecha_vencimiento));switch(e.estado){case"Fuera de la Academia":return l("bad","El estudiante figura fuera de la academia. Comunícate con la administración antes de realizar pagos.","Cuenta inactiva");case"Pendiente por Validación Administrativa":return l("info","La administración está validando la inscripción y el pago de la matrícula. Te avisaremos por WhatsApp.","Inscripción en validación");case"Moroso":return l("warn",`Tienes ${t.length} ${t.length===1?"cuota vencida":"cuotas vencidas"}. Registra tu pago para regularizar la cuenta.`,"Cuenta con saldo vencido");default:return a.length===0?l("ok","No tienes cuotas pendientes. ¡Gracias por estar al día!","Cuenta al día"):l("ok","Tu cuenta está al día. Estas son las próximas cuotas.","Cuenta al día")}}function D(e){return e.length===0?o`<p class="${n.ayuda}">Consulta los datos de pago con la administración.</p>`:o`<ul class="mt-2 grid gap-2 sm:grid-cols-2">${e.map(a=>o`<li class="rounded-lg border border-slate-200 bg-white/95 p-3 text-sm"><p class="font-semibold text-slate-900">${M(a.metodo)}</p><p class="break-words text-slate-700">${a.detalle}</p><p class="text-xs text-slate-600">Titular: ${a.titular}</p></li>`)}</ul>`}function F(e){const a=`ref-${e.id}`,t=`met-${e.id}`;return o`<form data-cuota="${e.id}" novalidate class="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2" aria-label="Registrar referencia de ${e.concepto}">
    <div>
      <label for="${t}" class="${n.etiqueta}">Método de pago</label>
      <select id="${t}" name="metodo_pago" class="${n.input}">${A.map(s=>o`<option value="${s}">${M(s)}</option>`)}</select>
    </div>
    <div>
      <label for="${a}" class="${n.etiqueta}">Número de referencia</label>
      <input id="${a}" name="referencia" type="text" required maxlength="40" autocomplete="off" aria-describedby="${a}-ayuda ${a}-error" class="${n.input}">
      <p id="${a}-ayuda" class="${n.ayuda}">4 a 40 caracteres: letras, números o guiones, sin espacios.</p>
      <p id="${a}-error" class="${n.errorCampo}" role="alert" hidden></p>
    </div>
    <div class="sm:col-span-2">
      <button type="submit" class="${y(n.btnPrimario,"w-full sm:w-auto")}">${v("check","h-4 w-4")}<span>Registrar referencia</span></button>
    </div>
  </form>`}function U(e){const a=e.estado==="Pendiente"&&_(e.fecha_vencimiento);return o`<li class="${n.tarjeta} p-6" data-cuota-card="${e.id}">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="break-words text-base font-bold text-slate-900">${e.concepto}</h3>
        <p class="mt-1 text-sm text-slate-600">Vence el <time>${I(e.fecha_vencimiento)}</time></p>
      </div>
      <div class="flex flex-wrap items-center gap-2">${a?N("Vencida","bad"):null}${x(e.estado==="Pendiente"?"Pendiente":"En Revisión")}</div>
    </div>
    <p class="mt-4 text-2xl font-bold text-slate-900">${g(e.monto_usd)} <span class="text-lg font-semibold text-slate-700">≈ ${h(e.monto_bs)}</span></p>
    ${e.estado==="Pendiente"?F(e):o`<p class="mt-4 text-sm text-slate-700">Tu referencia está en revisión. La administración la confirmará en breve.</p>`}
  </li>`}function G(e){const a=V(e.cuotas),t=a.filter(s=>s.estado==="Pendiente");return o`
    <section class="${n.tarjetaCristal} p-6" aria-labelledby="t-estudiante">
      <p class="text-sm text-slate-600">Estudiante</p>
      <h2 id="t-estudiante" class="break-words text-xl font-bold text-slate-900">${e.estudiante}</h2>
      <div class="mt-4 flex flex-wrap items-center gap-2">${x(e.estado)}${x(e.estatus_pago)}</div>
      <p class="mt-4 text-sm text-slate-700">Tasa BCV vigente: <strong class="text-slate-900">${T(e.tasa_bcv)}</strong> Bs. por US$. Los montos en bolívares se calculan con esta tasa.</p>
      ${e.tasa_desactualizada?o`<div class="mt-4">${l("warn","El BCV no respondió en este momento: se usa la última tasa disponible. El monto exacto se confirma al validar el pago.")}</div>`:null}
    </section>
    ${O(e,a)}
    ${t.length>0?o`<section class="${n.tarjeta} flex flex-wrap items-center justify-between gap-4 p-6" aria-label="Total pendiente">
          <span class="text-sm font-medium text-slate-700">Total pendiente de pago</span>
          <span class="text-xl font-bold text-slate-900">${g(w(t.map(s=>s.monto_usd)))} <span class="text-base font-semibold text-slate-700">≈ ${h(w(t.map(s=>s.monto_bs)))}</span></span>
        </section>`:null}
    <section class="${n.tarjeta} p-6" aria-labelledby="t-cuentas">
      <h2 id="t-cuentas" class="text-base font-bold text-slate-900">Cuentas para pagar</h2>
      ${D(e.cuentas)}
    </section>
    <section aria-labelledby="t-cuotas">
      <h2 id="t-cuotas" class="mb-4 text-base font-bold text-slate-900">Cuotas pendientes</h2>
      ${a.length===0?o`<div class="${n.tarjeta} p-6 text-sm text-slate-700">No tienes cuotas pendientes.</div>`:o`<ul class="flex flex-col gap-4">${a.map(U)}</ul>`}
    </section>`}function Z(){return o`<div class="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">${v("wallet","h-6 w-6")}</span>
        <div>
          <h1 class="${n.titulo}">Portal del representante</h1>
          <p class="${n.subtitulo}">Brilliant Minds Academy</p>
        </div>
      </div>
      <button type="button" id="actualizar" class="${y(n.btnSecundario,n.btnPeq)}">${v("refresh","h-4 w-4")}<span>Actualizar</span></button>
    </header>
    <div id="contenido" class="flex flex-col gap-6"></div>
  </div>`}function b(){const e=r("#contenido",HTMLElement);switch(c.fase){case"cargando":m(e,o`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando estado de cuenta"></div>`);return;case"error":m(e,l("bad",o`${c.mensaje} <span class="block pt-2">Si el problema continúa, solicita un nuevo enlace a la administración.</span>`,"No pudimos abrir tu estado de cuenta"));return;case"listo":m(e,G(c.datos));for(const a of R("form[data-cuota]",HTMLFormElement,e))a.addEventListener("submit",t=>{t.preventDefault(),K(a)})}}async function $(e=!1){if(u===null){c={fase:"error",mensaje:"El enlace del portal no es válido o está incompleto."},b();return}e||(c={fase:"cargando"},b());try{c={fase:"listo",datos:await C.get(`/portal/${encodeURIComponent(u)}`,void 0,{sinAuth:!0})}}catch(a){c={fase:"error",mensaje:L(a)}}b()}function p(e,a){const t=e.dataset.cuota??"",s=E(`#ref-${CSS.escape(t)}-error`,HTMLElement,e),d=E('input[name="referencia"]',HTMLInputElement,e);!s||!d||(s.textContent=a??"",s.hidden=a===null,a===null?d.removeAttribute("aria-invalid"):d.setAttribute("aria-invalid","true"))}async function K(e){const a=Number(e.dataset.cuota);if(u===null||!Number.isInteger(a)||f.has(a))return;p(e,null);const t=r('input[name="referencia"]',HTMLInputElement,e).value.trim(),s=r('select[name="metodo_pago"]',HTMLSelectElement,e).value;if(!S.test(t)){p(e,"La referencia debe tener de 4 a 40 caracteres (letras, números o guiones, sin espacios)."),r('input[name="referencia"]',HTMLInputElement,e).focus();return}if(!B(s)){p(e,"Selecciona un método de pago válido.");return}const d={cuota_id:a,referencia:t,metodo_pago:s};f.add(a);try{const i=await j(r('button[type="submit"]',HTMLButtonElement,e),()=>C.post(`/portal/${encodeURIComponent(u??"")}/referencias`,d,{sinAuth:!0}));k("ok",`Referencia registrada por ${g(i.monto_usd)} (${h(i.monto_bs)} a tasa ${T(i.tasa_bcv)}). La administración la validará.`),await $(!0)}catch(i){const P=i instanceof H?i.camposInvalidos()[0]?.mensaje:void 0;p(e,P??L(i))}finally{f.delete(a)}}function W(){document.body.className="text-slate-900",m(r("#app",HTMLElement),Z()),u=q(),r("#actualizar",HTMLButtonElement).addEventListener("click",()=>void $()),$()}W();
