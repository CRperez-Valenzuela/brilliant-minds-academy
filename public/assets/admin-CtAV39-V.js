import{p as q,s as S,b as f,B as A,m as E,a as u,o as d,C as s,i as m,c as p,h as i,d as g,e as M,t as y,f as _,n as z,g as V,u as b,j as ra,k as W,r as N,l as U,q as G,v as la,w as da,x as ca,y as ua,z as pa,A as ba,D as ma}from"./ui-CtvFrhZl.js";const j="Módulo Premium Deshabilitado",J="bma.sidebar.colapsado",fa=3e4,K=25,I=300,X=[{id:"dashboard",titulo:"Dashboard",icono:"home",soloAdmin:!1},{id:"estudiantes",titulo:"Estudiantes",icono:"users",soloAdmin:!1},{id:"auditoria",titulo:"Auditoría de referencias",icono:"inbox",soloAdmin:!1},{id:"contabilidad",titulo:"Contabilidad",icono:"book",soloAdmin:!0}],Q={IA_ATENCION:"bot",WHATSAPP_AUTOMATICO:"chat",BANCAMIGA:"wallet",APP_MOVIL:"phone",FACHADA_WEB:"globe"},O=["","Activo","Moroso","Fuera de la Academia","Pendiente por Validación Administrativa"],F=["Por Validar","Aprobada","Rechazada"];let l={usuario:null,modulos:[],vista:"dashboard",colapsado:!1,periodo:q(),filtroEstudiantes:"",paginaEstudiantes:1,filtroAuditoria:"Por Validar",paginaAuditoria:1};function $(a){l={...l,...a}}let H=0,k=null;function va(){try{const a=localStorage.getItem(J);if(a==="1")return!0;if(a==="0")return!1}catch{}return window.matchMedia("(max-width: 767px)").matches}function ga(a){try{localStorage.setItem(J,a?"1":"0")}catch{}}function ha(a){if(typeof a!="object"||a===null)return!1;const t=a;return typeof t.id=="number"&&typeof t.nombre=="string"&&typeof t.email=="string"&&(t.rol==="admin"||t.rol==="secretaria")}function $a(){const a=S.usuarioCrudo();if(!a)return null;try{const t=JSON.parse(a);return ha(t)?t:null}catch{return null}}const D=()=>l.usuario?.rol==="admin";function Y(a){R(),H+=1,document.body.className="text-slate-900",u(d("#app",HTMLElement),i`<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div class="flex items-center gap-4">
        <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">${m("school","h-6 w-6")}</span>
        <div>
          <h1 class="${s.titulo}">Brilliant Minds Academy</h1>
          <p class="${s.subtitulo}">Panel administrativo</p>
        </div>
      </div>
      <form id="login" novalidate class="${s.tarjetaCristal} flex flex-col gap-4 p-6" aria-label="Iniciar sesión">
        <div id="login-aviso">${a?g("warn",a):null}</div>
        <div>
          <label for="login-email" class="${s.etiqueta}">Correo</label>
          <input id="login-email" name="email" type="email" required autocomplete="username" class="${s.input}">
        </div>
        <div>
          <label for="login-password" class="${s.etiqueta}">Contraseña</label>
          <input id="login-password" name="password" type="password" required autocomplete="current-password" class="${s.input}">
        </div>
        <button type="submit" class="${p(s.btnPrimario,"w-full")}"><span>Entrar</span></button>
      </form>
    </main>`);const t=d("#login",HTMLFormElement);t.addEventListener("submit",e=>{e.preventDefault(),xa(t)}),d("#login-email",HTMLInputElement).focus()}async function xa(a){const t=d("#login-email",HTMLInputElement).value.trim(),e=d("#login-password",HTMLInputElement).value,o=d("#login-aviso",HTMLElement);if(!t||!e){u(o,g("bad","Escribe tu correo y tu contraseña."));return}try{const n=await M(d('button[type="submit"]',HTMLButtonElement,a),()=>f.post("/auth/login",{email:t,password:e},{sinAuth:!0}));S.guardar(n.token,JSON.stringify(n.usuario)),await Z()}catch(n){u(o,g("bad",E(n)))}}function L(a){S.cerrar(),$({usuario:null,modulos:[],vista:"dashboard"}),Y(a)}function B(a){const{id:t,titulo:e,tooltip:o,bloqueado:n}=a;return i`<button type="button" data-nav="${t}" data-bloqueado="${n}"
    class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 aria-[current=page]:bg-slate-900 aria-[current=page]:text-white group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
    ${m(a.icono)}
    <span class="min-w-0 flex-1 truncate group-data-[collapsed=true]/sb:sr-only">${e}</span>
    ${n?i`<span class="text-slate-500 group-data-[collapsed=true]/sb:absolute group-data-[collapsed=true]/sb:right-2 group-data-[collapsed=true]/sb:top-1">${m("lock","h-4 w-4 group-data-[collapsed=true]/sb:h-3 group-data-[collapsed=true]/sb:w-3")}</span>`:null}
    <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">${o}</span>
  </button>`}function wa(){const a=l.usuario,t=X.filter(e=>!e.soloAdmin||D());return i`<div id="shell" data-collapsed="${l.colapsado}" class="group/sb flex min-h-screen">
    <aside id="barra-lateral" aria-label="Navegación principal"
      class="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white/95 backdrop-blur transition-[width] duration-200 group-data-[collapsed=true]/sb:w-20">
      <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-4 group-data-[collapsed=true]/sb:justify-center">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">${m("school")}</span>
        <span class="truncate text-sm font-bold text-slate-900 group-data-[collapsed=true]/sb:sr-only">BMA · Administración</span>
      </div>
      <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Secciones">
        ${t.map(e=>B({id:e.id,titulo:e.titulo,icono:e.icono,tooltip:e.titulo,bloqueado:!1}))}
        <p class="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 group-data-[collapsed=true]/sb:sr-only">Módulos Premium</p>
        <hr class="my-2 hidden border-slate-200 group-data-[collapsed=true]/sb:block">
        ${l.modulos.map(e=>B({id:`premium:${e.codigo}`,titulo:e.nombre,icono:Q[e.codigo]??"chat",tooltip:e.bloqueado?`${e.nombre} · ${e.tooltip}`:e.nombre,bloqueado:e.bloqueado}))}
      </nav>
      <div class="flex flex-col gap-1 border-t border-slate-200 p-3">
        <div class="flex items-center gap-3 px-3 py-2 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800" aria-hidden="true">${(a?.nombre??"?").trim().slice(0,1).toUpperCase()}</span>
          <span class="min-w-0 group-data-[collapsed=true]/sb:sr-only"><span class="block truncate text-sm font-semibold text-slate-900">${a?.nombre}</span><span class="block truncate text-xs text-slate-600">${a?.rol}</span></span>
        </div>
        <button type="button" id="salir" class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${m("logout")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Salir</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Salir</span>
        </button>
        <button type="button" id="alternar-sidebar" aria-controls="barra-lateral" aria-expanded="${!l.colapsado}" aria-label="${l.colapsado?"Expandir menú lateral":"Contraer menú lateral"}"
          class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${m("menu")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Contraer menú</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Expandir menú</span>
        </button>
      </div>
    </aside>
    <main id="contenido" tabindex="-1" class="min-w-0 flex-1 p-4 sm:p-8"></main>
  </div>`}function Ea(){const a=!l.colapsado;$({colapsado:a}),ga(a);const t=d("#shell",HTMLElement);t.dataset.collapsed=String(a);const e=d("#alternar-sidebar",HTMLButtonElement);e.setAttribute("aria-expanded",String(!a)),e.setAttribute("aria-label",a?"Expandir menú lateral":"Contraer menú lateral")}function ya(a){for(const t of y("[data-nav]",HTMLElement))t.dataset.nav===a?t.setAttribute("aria-current","page"):t.removeAttribute("aria-current")}async function Z(){if(!S.token()){Y();return}let a=$a();try{a||(a=(await f.get("/auth/me")).usuario);const o=await f.get("/premium/modulos").catch(n=>{if(n instanceof A)throw n;return[]});$({usuario:a,modulos:o,colapsado:va()})}catch(o){L(o instanceof A?"Tu sesión expiró. Inicia sesión de nuevo.":E(o));return}document.body.className="text-slate-900",u(d("#app",HTMLElement),wa()),d("#shell",HTMLElement).addEventListener("click",o=>{const r=(o.target instanceof Element?o.target:null)?.closest("[data-nav]");if(!(r instanceof HTMLElement))return;const c=r.dataset.nav??"";l.modulos.find(w=>`premium:${w.codigo}`===c)?.bloqueado&&(o.preventDefault(),o.stopPropagation()),x(c)}),d("#salir",HTMLButtonElement).addEventListener("click",()=>L()),d("#alternar-sidebar",HTMLButtonElement).addEventListener("click",Ea);const e=l.vista.startsWith("premium:")||X.some(o=>o.id===l.vista)?l.vista:"dashboard";await x(e)}function R(){k!==null&&(window.clearInterval(k),k=null)}async function x(a){R(),H+=1;const t=H;$({vista:a}),ya(a);const e=d("#contenido",HTMLElement),o={zona:e,vigente:()=>t===H};u(e,i`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando"></div>`);try{a.startsWith("premium:")?qa(o,a.slice(8)):a==="estudiantes"?await za(o):a==="auditoria"?await Pa(o):a==="contabilidad"&&D()?await Ca(o):await Ta(o)}catch(n){aa(n,o)}}function aa(a,t){if(t.vigente()){if(a instanceof A){L("Tu sesión expiró. Inicia sesión de nuevo.");return}if(a instanceof ra){const e=a.moduloPremium();if(e){Oa(t.zona,e);return}}u(t.zona,i`<div class="mx-auto max-w-2xl pt-8">${g("bad",E(a),a instanceof ma?"Sin conexión":"No se pudo cargar la sección")}
      <button type="button" data-reintentar class="${p(s.btnSecundario,"mt-4")}">${m("refresh","h-4 w-4")}<span>Reintentar</span></button></div>`),_("[data-reintentar]",HTMLButtonElement,t.zona)?.addEventListener("click",()=>void x(l.vista))}}function T(a,t,e=null){return i`<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><h1 class="${s.titulo}">${a}</h1><p class="${s.subtitulo}">${t}</p></div>
    ${e}
  </header>`}function ta(a){const t=Math.max(1,Math.ceil(a.total/Math.max(1,a.limite)));return i`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación">
    <span class="text-slate-600">Página ${a.pagina} de ${t} · ${a.total} registro(s)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${p(s.btnSecundario,s.btnPeq)}" ${a.pagina<=1?N("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${p(s.btnSecundario,s.btnPeq)}" ${a.pagina>=t?N("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function ea(a,t){for(const e of y("[data-pag]",HTMLButtonElement,a))e.addEventListener("click",()=>t(Number(e.dataset.pag)))}function P(a){return i`<article class="${s.tarjeta} p-6">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-sm font-medium text-slate-600">${a.titulo}</h3>
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${m(a.icono,"h-4 w-4")}</span>
    </div>
    <p class="mt-3 text-2xl font-bold ${a.tono==="malo"?"text-red-800":"text-slate-900"}" data-kpi>${a.valor}</p>
    <p class="mt-1 text-xs text-slate-600">${a.detalle}</p>
  </article>`}function Aa(a){const t=ba(a.periodo),e=new Map;for(const c of a.cobrado_por_dia)e.set(Number(c.dia.slice(8,10)),c.monto_usd);const o=Math.max(0,...e.values()),n=Array.from({length:t},(c,v)=>{const w=v+1,h=e.get(w)??0,ia=o>0?Math.max(h>0?4:0,Math.round(h/o*100)):0;return i`<li class="group/barra relative flex h-full min-w-0 flex-1 flex-col justify-end" title="Día ${w}: ${b(h)}">
      <div data-alto="${ia}" class="w-full rounded-t ${h>0?"bg-slate-800 group-hover/barra:bg-slate-600":"bg-slate-200"} ${h>0?"":"h-px"}"></div>
      <span class="sr-only">Día ${w}: ${b(h)}</span>
    </li>`}),r=Array.from({length:t},(c,v)=>i`<span class="min-w-0 flex-1 text-center text-xs text-slate-600">${(v+1)%5===0||v===0?v+1:""}</span>`);return i`<div role="group" aria-label="Cobrado por día en ${a.periodo}">
    <ul class="flex h-48 items-end gap-1 border-b border-slate-200">${n}</ul>
    <div class="mt-1 flex gap-1" aria-hidden="true">${r}</div>
  </div>`}function Ma(a){for(const t of y("[data-alto]",HTMLElement,a)){const e=Number(t.dataset.alto);Number.isFinite(e)&&e>0&&(t.style.height=`${Math.min(100,e)}%`)}}function La(a,t){const e=[{titulo:"Cobrado",valor:b(a.cobrado.monto_usd),detalle:`${a.cobrado.cantidad} pago(s) aprobados`,icono:"wallet",tono:"normal"},{titulo:"Saldos vencidos",valor:b(a.saldos_vencidos.monto_usd),detalle:`${a.saldos_vencidos.cantidad} cuota(s) vencida(s)`,icono:"alert",tono:"malo"},{titulo:"Cuentas pendientes del mes",valor:b(a.cuentas_pendientes.monto_usd),detalle:`${a.cuentas_pendientes.cantidad} cuota(s) por cobrar`,icono:"book",tono:"normal"},{titulo:"Referencias por validar",valor:String(a.referencias_por_validar),detalle:"en la bandeja de auditoría",icono:"inbox",tono:"normal"}];return i`
    <section aria-label="Indicadores del mes" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${e.map(P)}</section>
    <section aria-label="Estudiantes por estado" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${[["Activos",t.activos],["Morosos",t.morosos],["Fuera de la Academia",t.fuera_de_la_academia],["Pendientes de validación",t.pendientes_validacion]].map(([o,n])=>i`<div class="${s.tarjeta} flex items-center justify-between gap-4 px-6 py-4"><span class="text-sm text-slate-700">${o}</span><strong class="text-lg text-slate-900">${n}</strong></div>`)}
    </section>
    <section class="${s.tarjeta} mt-6 p-6" aria-labelledby="t-barras">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="t-barras" class="text-base font-bold text-slate-900">Recaudación diaria</h2>
        <p class="text-sm text-slate-600">Cobrado del mes: <strong class="text-slate-900">${b(a.cobrado.monto_usd)}</strong></p>
      </div>
      ${Aa(a)}
    </section>`}async function C(a,t){const e=d("#tablero",HTMLElement,a.zona);t||u(e,i`<div class="h-48 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando tablero"></div>`);try{const[o,n]=await Promise.all([f.get("/facturacion/tablero",{periodo:l.periodo}),f.get("/estudiantes/resumen")]);if(!a.vigente())return;u(e,La(o,n)),Ma(e);const r=_("#actualizado",HTMLElement,a.zona);r&&(r.textContent=`Actualizado a las ${pa(new Date)}`)}catch(o){if(!a.vigente()||t&&!(o instanceof A))return;aa(o,a)}}async function Ta(a){u(a.zona,i`${T("Dashboard","Tablero financiero en tiempo real",i`<div class="flex flex-wrap items-end gap-4">
        <div><label for="periodo" class="${s.etiqueta}">Período</label><input id="periodo" type="month" value="${l.periodo}" max="${q()}" class="${s.input}"></div>
        <p id="actualizado" class="pb-2 text-xs text-slate-600" aria-live="off"></p>
      </div>`)}<div id="tablero"></div>`),d("#periodo",HTMLInputElement,a.zona).addEventListener("change",t=>{const e=t.target instanceof HTMLInputElement?t.target.value:"";/^\d{4}-\d{2}$/.test(e)&&($({periodo:e}),C(a,!1))}),await C(a,!0),k=window.setInterval(()=>{if(!a.vigente()){R();return}document.hidden||C(a,!0)},fa)}function _a(a){return i`<tr>
    <td class="${s.td}"><span class="font-medium text-slate-900">${a.apellidos}, ${a.nombres}</span></td>
    <td class="${s.td}">${a.grado_solicitado}</td>
    <td class="${s.td}">${a.representante}</td>
    <td class="${s.td}">${W(a.estado_dinamico)}</td>
    <td class="${s.td} whitespace-nowrap">${b(a.deuda_vencida_usd)}</td>
    <td class="${s.td}"><div class="flex flex-wrap gap-2">
      <button type="button" data-alerta="preventiva" data-id="${a.id}" class="${p(s.btnSecundario,s.btnPeq)}">Preventiva</button>
      <button type="button" data-alerta="morosidad" data-id="${a.id}" class="${p(s.btnSecundario,s.btnPeq)}">Morosidad</button>
    </div></td>
  </tr>`}async function za(a){const t=await f.pagina("/estudiantes",{estado:l.filtroEstudiantes,pagina:l.paginaEstudiantes,limite:K});if(a.vigente()){u(a.zona,i`${T("Estudiantes",`${t.paginacion.total} resultado(s)`)}
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
      ${O.map(e=>i`<button type="button" data-filtro="${e}" aria-pressed="${e===l.filtroEstudiantes}" class="${p(s.btnSecundario,s.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${e===""?"Todos":e}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${s.tabla}">
        <caption class="sr-only">Listado de estudiantes</caption>
        <thead><tr><th scope="col" class="${s.th}">Estudiante</th><th scope="col" class="${s.th}">Grado</th><th scope="col" class="${s.th}">Representante</th><th scope="col" class="${s.th}">Estado</th><th scope="col" class="${s.th}">Deuda vencida</th><th scope="col" class="${s.th}">Alertas WhatsApp</th></tr></thead>
        <tbody>${t.datos.length===0?i`<tr><td colspan="6" class="${s.td}">Sin resultados.</td></tr>`:t.datos.map(_a)}</tbody>
      </table>
    </div>
    ${ta(t.paginacion)}`);for(const e of y("[data-filtro]",HTMLButtonElement,a.zona))e.addEventListener("click",()=>{const o=e.dataset.filtro??"",n=O.find(r=>r===o)??"";$({filtroEstudiantes:n,paginaEstudiantes:1}),x("estudiantes")});ea(a.zona,e=>{$({paginaEstudiantes:Math.max(1,l.paginaEstudiantes+e)}),x("estudiantes")});for(const e of y("[data-alerta]",HTMLButtonElement,a.zona))e.addEventListener("click",()=>{const o=e.dataset.alerta==="morosidad"?"morosidad":"preventiva";Ha(o,Number(e.dataset.id),e)})}}async function Ha(a,t,e){try{const o=await M(e,()=>f.post(`/notificaciones/whatsapp/${a}/${t}`)),n=U({titulo:a==="morosidad"?"Alerta de morosidad":"Alerta preventiva",ancho:"lg",cuerpo:i`<p class="text-sm text-slate-600">${b(o.monto_usd)} · ${G(o.monto_bs)} · tasa BCV ${la(o.tasa_bcv)}</p>
        <pre class="mt-4 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">${o.mensaje}</pre>
        <div id="alerta-resultado" class="mt-4"></div>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <a href="${da(o.enlace_whatsapp,["https://wa.me/"])}" target="_blank" rel="noopener noreferrer" class="${p(s.btnPrimario)}">Abrir en WhatsApp</a>
          <button type="button" id="alerta-enviar" class="${p(s.btnSecundario)}">Enviar por API</button>
        </div>`}),r=d("#alerta-enviar",HTMLButtonElement,n.dialogo);r.addEventListener("click",()=>{const c=d("#alerta-resultado",HTMLElement,n.dialogo);M(r,()=>f.post(`/notificaciones/whatsapp/${a}/${t}`,{},{consulta:{enviar:!0}})).then(()=>u(c,g("ok","Mensaje enviado por la API de WhatsApp."))).catch(v=>u(c,g("bad",E(v))))})}catch(o){o instanceof A?L("Tu sesión expiró. Inicia sesión de nuevo."):z("bad",E(o))}}function ka(a){const t=a.estado==="Por Validar";return i`<tr>
    <td class="${s.td} whitespace-nowrap">${V(a.declarado_en)}</td>
    <td class="${s.td}"><span class="font-medium text-slate-900">${a.estudiante}</span><br><span class="text-xs text-slate-600">${a.concepto} · vence ${ca(a.fecha_vencimiento)}</span></td>
    <td class="${s.td}"><strong class="break-all">${a.referencia}</strong><br><span class="text-xs text-slate-600">${a.representante}</span></td>
    <td class="${s.td}">${ua(a.metodo_pago)}</td>
    <td class="${s.td} whitespace-nowrap">${b(a.monto_usd)}<br><span class="text-xs text-slate-600">${G(a.monto_bs)}</span></td>
    <td class="${s.td}">${t?i`<div class="flex flex-wrap gap-2">
          <button type="button" data-aprobar="${a.id}" class="${p(s.btnOk,s.btnPeq)}">${m("check","h-4 w-4")}<span>Aprobar</span></button>
          <button type="button" data-rechazar="${a.id}" class="${p(s.btnPeligro,s.btnPeq)}">${m("x","h-4 w-4")}<span>Rechazar</span></button>
        </div>`:i`${W(a.estado)}${a.nota_revision?i`<p class="mt-1 max-w-xs break-words text-xs text-slate-600">${a.nota_revision}</p>`:null}`}</td>
  </tr>`}async function Pa(a){const t=await f.pagina("/facturacion/auditoria",{estado:l.filtroAuditoria,pagina:l.paginaAuditoria,limite:K});if(!a.vigente())return;const e=D()?i`<button type="button" id="exportar" class="${p(s.btnSecundario)}">${m("down","h-4 w-4")}<span>Exportar histórico (.xlsx)</span></button>`:null;u(a.zona,i`${T("Bandeja de auditoría",`${t.paginacion.total} referencia(s) · ${l.filtroAuditoria}`,e)}
    <div id="auditoria-aviso" class="mb-4"></div>
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado de la referencia">
      ${F.map(r=>i`<button type="button" data-filtro="${r}" aria-pressed="${r===l.filtroAuditoria}" class="${p(s.btnSecundario,s.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${r}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${s.tabla}">
        <caption class="sr-only">Referencias de pago declaradas</caption>
        <thead><tr><th scope="col" class="${s.th}">Declarada</th><th scope="col" class="${s.th}">Estudiante</th><th scope="col" class="${s.th}">Referencia</th><th scope="col" class="${s.th}">Método</th><th scope="col" class="${s.th}">Monto</th><th scope="col" class="${s.th}">Acción</th></tr></thead>
        <tbody>${t.datos.length===0?i`<tr><td colspan="6" class="${s.td}">Bandeja vacía.</td></tr>`:t.datos.map(ka)}</tbody>
      </table>
    </div>
    ${ta(t.paginacion)}`);const o=d("#auditoria-aviso",HTMLElement,a.zona);for(const r of y("[data-filtro]",HTMLButtonElement,a.zona))r.addEventListener("click",()=>{const c=r.dataset.filtro??"",v=F.find(w=>w===c)??"Por Validar";$({filtroAuditoria:v,paginaAuditoria:1}),x("auditoria")});ea(a.zona,r=>{$({paginaAuditoria:Math.max(1,l.paginaAuditoria+r)}),x("auditoria")});const n=new Map(t.datos.map(r=>[r.id,r]));for(const r of y("[data-aprobar]",HTMLButtonElement,a.zona))r.addEventListener("click",()=>void Sa(Number(r.dataset.aprobar),r,o));for(const r of y("[data-rechazar]",HTMLButtonElement,a.zona))r.addEventListener("click",()=>{const c=n.get(Number(r.dataset.rechazar));c&&Ia(c)});_("#exportar",HTMLButtonElement,a.zona)?.addEventListener("click",r=>{const c=r.currentTarget instanceof HTMLButtonElement?r.currentTarget:null;c&&oa(c,"/exportaciones/facturacion.xlsx","facturacion.xlsx",o)})}async function oa(a,t,e,o){try{await M(a,()=>f.descargar(t,e))}catch(n){n instanceof A?L("Tu sesión expiró. Inicia sesión de nuevo."):u(o,g("bad",E(n)))}}function sa(a,t){return`${t} · estatus de pago del alumno: ${a.estatus_pago} · deuda vencida ${b(a.deuda_vencida_usd)}.`}async function Sa(a,t,e){try{const o=await M(t,()=>f.post(`/facturacion/auditoria/${a}/aprobar`,{}));z("ok",sa(o,"Referencia aprobada")),await x("auditoria")}catch(o){o instanceof A?L("Tu sesión expiró. Inicia sesión de nuevo."):u(e,g("bad",E(o)))}}function Ia(a){const t=U({titulo:"Rechazar referencia",cuerpo:i`<form id="form-rechazo" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700">Referencia <strong class="break-all">${a.referencia}</strong> · ${a.estudiante} · ${b(a.monto_usd)}</p>
      <div>
        <label for="nota-rechazo" class="${s.etiqueta}">Motivo del rechazo <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="nota-rechazo" name="nota" rows="4" maxlength="${I}" required aria-describedby="nota-ayuda nota-error" class="${s.input}"></textarea>
        <p id="nota-ayuda" class="${s.ayuda}">Se guarda en el historial y se usa para avisar al representante. <span id="nota-contador">0/${I}</span></p>
        <p id="nota-error" class="${s.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="rechazo-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${p(s.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${p(s.btnPeligro)}">${m("x","h-4 w-4")}<span>Rechazar referencia</span></button>
      </div>
    </form>`}),e=d("#form-rechazo",HTMLFormElement,t.dialogo),o=d("#nota-rechazo",HTMLTextAreaElement,t.dialogo),n=d("#nota-error",HTMLElement,t.dialogo),r=d("#nota-contador",HTMLElement,t.dialogo);o.addEventListener("input",()=>{r.textContent=`${o.value.length}/${I}`,o.value.trim()!==""&&(n.hidden=!0,o.removeAttribute("aria-invalid"))}),d("[data-cancelar]",HTMLButtonElement,t.dialogo).addEventListener("click",t.cerrar),e.addEventListener("submit",c=>{c.preventDefault();const v=o.value.trim();if(v===""){n.textContent="Debes escribir el motivo del rechazo para continuar.",n.hidden=!1,o.setAttribute("aria-invalid","true"),o.focus();return}const w=d('button[type="submit"]',HTMLButtonElement,e);M(w,()=>f.post(`/facturacion/auditoria/${a.id}/rechazar`,{nota:v})).then(async h=>{t.cerrar(),z("ok",sa(h,"Referencia rechazada")),await x("auditoria")}).catch(h=>{if(h instanceof A){t.cerrar(),L("Tu sesión expiró. Inicia sesión de nuevo.");return}u(d("#rechazo-aviso",HTMLElement,t.dialogo),g("bad",E(h)))})}),o.focus()}async function Ca(a){const t=await f.get("/contabilidad/balance",{periodo:l.periodo});if(!a.vigente())return;u(a.zona,i`${T("Contabilidad",`Balance neto del período ${t.periodo}`,i`<div class="flex flex-wrap items-end gap-4">
      <div><label for="periodo-conta" class="${s.etiqueta}">Período</label><input id="periodo-conta" type="month" value="${l.periodo}" max="${q()}" class="${s.input}"></div>
      <button type="button" id="exportar" class="${p(s.btnPrimario)}">${m("down","h-4 w-4")}<span>Exportar nómina, egresos y personal (.xlsx)</span></button>
    </div>`)}
    <div id="conta-aviso" class="mb-4"></div>
    <section class="grid gap-4 sm:grid-cols-3" aria-label="Balance">
      ${P({titulo:"Ingresos",valor:b(t.ingresos_usd),detalle:"Referencias aprobadas del período",icono:"wallet",tono:"normal"})}
      ${P({titulo:"Egresos",valor:b(t.egresos_usd),detalle:"Egresos y nómina pagada",icono:"book",tono:"normal"})}
      ${P({titulo:"Neto",valor:b(t.neto_usd),detalle:"Ingresos − egresos",icono:"check",tono:t.neto_usd<0?"malo":"normal"})}
    </section>`),d("#periodo-conta",HTMLInputElement,a.zona).addEventListener("change",o=>{const n=o.target instanceof HTMLInputElement?o.target.value:"";/^\d{4}-\d{2}$/.test(n)&&($({periodo:n}),x("contabilidad"))});const e=d("#conta-aviso",HTMLElement,a.zona);d("#exportar",HTMLButtonElement,a.zona).addEventListener("click",o=>{const n=o.currentTarget instanceof HTMLButtonElement?o.currentTarget:null;n&&oa(n,"/exportaciones/contabilidad.xlsx","contabilidad.xlsx",e)})}function ja(){const a=i`<div class="flex items-center gap-4 border-b border-slate-100 py-4"><div class="h-8 w-8 rounded-full bg-slate-200"></div><div class="h-4 flex-1 rounded bg-slate-200"></div><div class="h-4 w-24 rounded bg-slate-200"></div></div>`;return i`<div aria-hidden="true" class="pointer-events-none select-none p-6">
    <div class="mb-4 h-6 w-1/3 rounded bg-slate-300"></div>${a}${a}${a}${a}${a}
  </div>`}function Ba(a){return i`<div data-candado class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 p-6 backdrop-blur-md">
    <div role="region" aria-label="${j}" class="${s.tarjetaCristal} w-full max-w-md p-8 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">${m("lock","h-6 w-6")}</span>
      <h2 class="mt-4 text-lg font-bold text-slate-900">${j}</h2>
      <p class="mt-1 text-sm font-semibold text-slate-800">${a.nombre}</p>
      <p class="mt-2 text-sm text-slate-700">${a.descripcion}</p>
      <p class="mt-4 text-2xl font-bold text-slate-900">${b(a.precio_usd)}</p>
      <p class="mt-1 text-xs text-slate-600">Pago único · solicítalo a Astra Digital Solutions</p>
    </div>
  </div>`}function na(a){return i`${T(a.nombre,a.descripcion)}
    <div class="${s.tarjeta} relative min-h-96 overflow-hidden">${ja()}${Ba(a)}</div>`}function qa(a,t){const e=l.modulos.find(n=>n.codigo===t);if(!e){u(a.zona,g("bad","Módulo no encontrado."));return}if(e.bloqueado){const n=e.prueba_utilizada===!1&&Da();u(a.zona,i`${na(e)}${n?i`<div class="mt-6">${g("info",i`<p>Prueba este módulo sin costo durante 15 días. Al vencer se bloquea solo.</p>
            <button type="button" id="activar-prueba" class="${p(s.btnPrimario,"mt-3")}">${m("check","h-4 w-4")}<span>Activar prueba gratuita de 15 días</span></button>`,"Prueba gratuita disponible")}</div>`:null}`);const r=_("#activar-prueba",HTMLButtonElement);r?.addEventListener("click",()=>{M(r,()=>Na(e)).catch(c=>z("bad",E(c)))});return}const o=e.en_prueba===!0&&e.expira_prueba_en?e.expira_prueba_en:null;u(a.zona,i`${T(e.nombre,e.descripcion)}
    <div class="${s.tarjeta} flex flex-col gap-4 p-6">
      ${o?g("warn",`Prueba gratuita vigente hasta el ${V(o)}. Después de esa fecha el módulo se bloquea automáticamente.`,"Estás en periodo de prueba"):null}
      ${g("info","El módulo está habilitado para esta academia. Su lógica se publicará en la Fase 2 (ruta reservada en el servidor).","Módulo habilitado")}
    </div>`)}const Da=()=>l.usuario?.rol==="admin"&&(l.usuario.sede_id??null)===null;function Ra(a){const t=_(`[data-nav="premium:${a.codigo}"]`,HTMLElement);if(!t)return;const e=document.createElement("div");u(e,B({id:`premium:${a.codigo}`,titulo:a.nombre,icono:Q[a.codigo]??"chat",tooltip:a.bloqueado?`${a.nombre} · ${a.tooltip??j}`:a.nombre,bloqueado:a.bloqueado}));const o=e.firstElementChild;o&&t.replaceWith(o)}async function Na(a){await f.post("/premium/activar-prueba",{modulo:a.codigo});const t=await f.get("/premium/modulos");$({modulos:t});for(const e of t)Ra(e);z("ok","Prueba gratuita de 15 días activada."),await x(`premium:${a.codigo}`)}function Oa(a,t){const e=l.modulos.find(o=>o.codigo===t.modulo);u(a,na({nombre:t.nombre,descripcion:e?.descripcion??"Este módulo forma parte de la Fase 2 del sistema.",precio_usd:t.precio_usd}))}Z();
