import{p as P,s as k,b as v,B as E,m as A,a as c,o as l,C as s,i as m,c as p,h as i,d as h,e as L,t as y,f as j,u as b,g as na,j as V,r as R,k as U,l as W,n as ia,q as ra,v as C,w as la,x as da,y as ca,z as ua,A as pa,D as ba}from"./ui-CAi4AOjY.js";const D="Módulo Premium Deshabilitado",G="bma.sidebar.colapsado",ma=3e4,J=25,S=300,K=[{id:"dashboard",titulo:"Dashboard",icono:"home",soloAdmin:!1},{id:"estudiantes",titulo:"Estudiantes",icono:"users",soloAdmin:!1},{id:"auditoria",titulo:"Auditoría de referencias",icono:"inbox",soloAdmin:!1},{id:"contabilidad",titulo:"Contabilidad",icono:"book",soloAdmin:!0}],fa={IA_ATENCION:"bot",WHATSAPP_AUTOMATICO:"chat",BANCAMIGA:"wallet",APP_MOVIL:"phone",FACHADA_WEB:"globe"},N=["","Activo","Moroso","Fuera de la Academia","Pendiente por Validación Administrativa"],O=["Por Validar","Aprobada","Rechazada"];let d={usuario:null,modulos:[],vista:"dashboard",colapsado:!1,periodo:P(),filtroEstudiantes:"",paginaEstudiantes:1,filtroAuditoria:"Por Validar",paginaAuditoria:1};function x(a){d={...d,...a}}let _=0,z=null;function va(){try{const a=localStorage.getItem(G);if(a==="1")return!0;if(a==="0")return!1}catch{}return window.matchMedia("(max-width: 767px)").matches}function ga(a){try{localStorage.setItem(G,a?"1":"0")}catch{}}function ha(a){if(typeof a!="object"||a===null)return!1;const t=a;return typeof t.id=="number"&&typeof t.nombre=="string"&&typeof t.email=="string"&&(t.rol==="admin"||t.rol==="secretaria")}function xa(){const a=k.usuarioCrudo();if(!a)return null;try{const t=JSON.parse(a);return ha(t)?t:null}catch{return null}}const B=()=>d.usuario?.rol==="admin";function X(a){q(),_+=1,document.body.className="text-slate-900",c(l("#app",HTMLElement),i`<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div class="flex items-center gap-4">
        <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">${m("school","h-6 w-6")}</span>
        <div>
          <h1 class="${s.titulo}">Brilliant Minds Academy</h1>
          <p class="${s.subtitulo}">Panel administrativo</p>
        </div>
      </div>
      <form id="login" novalidate class="${s.tarjetaCristal} flex flex-col gap-4 p-6" aria-label="Iniciar sesión">
        <div id="login-aviso">${a?h("warn",a):null}</div>
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
    </main>`);const t=l("#login",HTMLFormElement);t.addEventListener("submit",e=>{e.preventDefault(),$a(t)}),l("#login-email",HTMLInputElement).focus()}async function $a(a){const t=l("#login-email",HTMLInputElement).value.trim(),e=l("#login-password",HTMLInputElement).value,o=l("#login-aviso",HTMLElement);if(!t||!e){c(o,h("bad","Escribe tu correo y tu contraseña."));return}try{const n=await L(l('button[type="submit"]',HTMLButtonElement,a),()=>v.post("/auth/login",{email:t,password:e},{sinAuth:!0}));k.guardar(n.token,JSON.stringify(n.usuario)),await Q()}catch(n){c(o,h("bad",A(n)))}}function M(a){k.cerrar(),x({usuario:null,modulos:[],vista:"dashboard"}),X(a)}function F(a){const{id:t,titulo:e,tooltip:o,bloqueado:n}=a;return i`<button type="button" data-nav="${t}" data-bloqueado="${n}"
    class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 aria-[current=page]:bg-slate-900 aria-[current=page]:text-white group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
    ${m(a.icono)}
    <span class="min-w-0 flex-1 truncate group-data-[collapsed=true]/sb:sr-only">${e}</span>
    ${n?i`<span class="text-slate-500 group-data-[collapsed=true]/sb:absolute group-data-[collapsed=true]/sb:right-2 group-data-[collapsed=true]/sb:top-1">${m("lock","h-4 w-4 group-data-[collapsed=true]/sb:h-3 group-data-[collapsed=true]/sb:w-3")}</span>`:null}
    <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">${o}</span>
  </button>`}function wa(){const a=d.usuario,t=K.filter(e=>!e.soloAdmin||B());return i`<div id="shell" data-collapsed="${d.colapsado}" class="group/sb flex min-h-screen">
    <aside id="barra-lateral" aria-label="Navegación principal"
      class="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white/95 backdrop-blur transition-[width] duration-200 group-data-[collapsed=true]/sb:w-20">
      <div class="flex h-16 items-center gap-3 border-b border-slate-200 px-4 group-data-[collapsed=true]/sb:justify-center">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">${m("school")}</span>
        <span class="truncate text-sm font-bold text-slate-900 group-data-[collapsed=true]/sb:sr-only">BMA · Administración</span>
      </div>
      <nav class="flex flex-1 flex-col gap-1 p-3" aria-label="Secciones">
        ${t.map(e=>F({id:e.id,titulo:e.titulo,icono:e.icono,tooltip:e.titulo,bloqueado:!1}))}
        <p class="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 group-data-[collapsed=true]/sb:sr-only">Módulos Premium</p>
        <hr class="my-2 hidden border-slate-200 group-data-[collapsed=true]/sb:block">
        ${d.modulos.map(e=>F({id:`premium:${e.codigo}`,titulo:e.nombre,icono:fa[e.codigo]??"chat",tooltip:e.bloqueado?`${e.nombre} · ${e.tooltip}`:e.nombre,bloqueado:e.bloqueado}))}
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
        <button type="button" id="alternar-sidebar" aria-controls="barra-lateral" aria-expanded="${!d.colapsado}" aria-label="${d.colapsado?"Expandir menú lateral":"Contraer menú lateral"}"
          class="group/item relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0">
          ${m("menu")}<span class="truncate group-data-[collapsed=true]/sb:sr-only">Contraer menú</span>
          <span role="tooltip" class="pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-data-[collapsed=true]/sb:group-hover/item:block group-data-[collapsed=true]/sb:group-focus-visible/item:block">Expandir menú</span>
        </button>
      </div>
    </aside>
    <main id="contenido" tabindex="-1" class="min-w-0 flex-1 p-4 sm:p-8"></main>
  </div>`}function ya(){const a=!d.colapsado;x({colapsado:a}),ga(a);const t=l("#shell",HTMLElement);t.dataset.collapsed=String(a);const e=l("#alternar-sidebar",HTMLButtonElement);e.setAttribute("aria-expanded",String(!a)),e.setAttribute("aria-label",a?"Expandir menú lateral":"Contraer menú lateral")}function Ea(a){for(const t of y("[data-nav]",HTMLElement))t.dataset.nav===a?t.setAttribute("aria-current","page"):t.removeAttribute("aria-current")}async function Q(){if(!k.token()){X();return}let a=xa();try{a||(a=(await v.get("/auth/me")).usuario);const o=await v.get("/premium/modulos").catch(n=>{if(n instanceof E)throw n;return[]});x({usuario:a,modulos:o,colapsado:va()})}catch(o){M(o instanceof E?"Tu sesión expiró. Inicia sesión de nuevo.":A(o));return}document.body.className="text-slate-900",c(l("#app",HTMLElement),wa()),l("#shell",HTMLElement).addEventListener("click",o=>{const r=(o.target instanceof Element?o.target:null)?.closest("[data-nav]");if(!(r instanceof HTMLElement))return;const u=r.dataset.nav??"";d.modulos.find(w=>`premium:${w.codigo}`===u)?.bloqueado&&(o.preventDefault(),o.stopPropagation()),$(u)}),l("#salir",HTMLButtonElement).addEventListener("click",()=>M()),l("#alternar-sidebar",HTMLButtonElement).addEventListener("click",ya);const e=d.vista.startsWith("premium:")||K.some(o=>o.id===d.vista)?d.vista:"dashboard";await $(e)}function q(){z!==null&&(window.clearInterval(z),z=null)}async function $(a){q(),_+=1;const t=_;x({vista:a}),Ea(a);const e=l("#contenido",HTMLElement),o={zona:e,vigente:()=>t===_};c(e,i`<div class="h-32 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando"></div>`);try{a.startsWith("premium:")?qa(o,a.slice(8)):a==="estudiantes"?await za(o):a==="auditoria"?await Sa(o):a==="contabilidad"&&B()?await ja(o):await Ta(o)}catch(n){Y(n,o)}}function Y(a,t){if(t.vigente()){if(a instanceof E){M("Tu sesión expiró. Inicia sesión de nuevo.");return}if(a instanceof na){const e=a.moduloPremium();if(e){Ra(t.zona,e);return}}c(t.zona,i`<div class="mx-auto max-w-2xl pt-8">${h("bad",A(a),a instanceof ba?"Sin conexión":"No se pudo cargar la sección")}
      <button type="button" data-reintentar class="${p(s.btnSecundario,"mt-4")}">${m("refresh","h-4 w-4")}<span>Reintentar</span></button></div>`),j("[data-reintentar]",HTMLButtonElement,t.zona)?.addEventListener("click",()=>void $(d.vista))}}function T(a,t,e=null){return i`<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><h1 class="${s.titulo}">${a}</h1><p class="${s.subtitulo}">${t}</p></div>
    ${e}
  </header>`}function Z(a){const t=Math.max(1,Math.ceil(a.total/Math.max(1,a.limite)));return i`<nav class="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" aria-label="Paginación">
    <span class="text-slate-600">Página ${a.pagina} de ${t} · ${a.total} registro(s)</span>
    <span class="flex gap-2">
      <button type="button" data-pag="-1" class="${p(s.btnSecundario,s.btnPeq)}" ${a.pagina<=1?R("disabled"):null}>Anterior</button>
      <button type="button" data-pag="1" class="${p(s.btnSecundario,s.btnPeq)}" ${a.pagina>=t?R("disabled"):null}>Siguiente</button>
    </span>
  </nav>`}function aa(a,t){for(const e of y("[data-pag]",HTMLButtonElement,a))e.addEventListener("click",()=>t(Number(e.dataset.pag)))}function H(a){return i`<article class="${s.tarjeta} p-6">
    <div class="flex items-center justify-between gap-4">
      <h3 class="text-sm font-medium text-slate-600">${a.titulo}</h3>
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">${m(a.icono,"h-4 w-4")}</span>
    </div>
    <p class="mt-3 text-2xl font-bold ${a.tono==="malo"?"text-red-800":"text-slate-900"}" data-kpi>${a.valor}</p>
    <p class="mt-1 text-xs text-slate-600">${a.detalle}</p>
  </article>`}function Aa(a){const t=pa(a.periodo),e=new Map;for(const u of a.cobrado_por_dia)e.set(Number(u.dia.slice(8,10)),u.monto_usd);const o=Math.max(0,...e.values()),n=Array.from({length:t},(u,f)=>{const w=f+1,g=e.get(w)??0,sa=o>0?Math.max(g>0?4:0,Math.round(g/o*100)):0;return i`<li class="group/barra relative flex h-full min-w-0 flex-1 flex-col justify-end" title="Día ${w}: ${b(g)}">
      <div data-alto="${sa}" class="w-full rounded-t ${g>0?"bg-slate-800 group-hover/barra:bg-slate-600":"bg-slate-200"} ${g>0?"":"h-px"}"></div>
      <span class="sr-only">Día ${w}: ${b(g)}</span>
    </li>`}),r=Array.from({length:t},(u,f)=>i`<span class="min-w-0 flex-1 text-center text-xs text-slate-600">${(f+1)%5===0||f===0?f+1:""}</span>`);return i`<div role="group" aria-label="Cobrado por día en ${a.periodo}">
    <ul class="flex h-48 items-end gap-1 border-b border-slate-200">${n}</ul>
    <div class="mt-1 flex gap-1" aria-hidden="true">${r}</div>
  </div>`}function Ma(a){for(const t of y("[data-alto]",HTMLElement,a)){const e=Number(t.dataset.alto);Number.isFinite(e)&&e>0&&(t.style.height=`${Math.min(100,e)}%`)}}function La(a,t){const e=[{titulo:"Cobrado",valor:b(a.cobrado.monto_usd),detalle:`${a.cobrado.cantidad} pago(s) aprobados`,icono:"wallet",tono:"normal"},{titulo:"Saldos vencidos",valor:b(a.saldos_vencidos.monto_usd),detalle:`${a.saldos_vencidos.cantidad} cuota(s) vencida(s)`,icono:"alert",tono:"malo"},{titulo:"Cuentas pendientes del mes",valor:b(a.cuentas_pendientes.monto_usd),detalle:`${a.cuentas_pendientes.cantidad} cuota(s) por cobrar`,icono:"book",tono:"normal"},{titulo:"Referencias por validar",valor:String(a.referencias_por_validar),detalle:"en la bandeja de auditoría",icono:"inbox",tono:"normal"}];return i`
    <section aria-label="Indicadores del mes" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${e.map(H)}</section>
    <section aria-label="Estudiantes por estado" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${[["Activos",t.activos],["Morosos",t.morosos],["Fuera de la Academia",t.fuera_de_la_academia],["Pendientes de validación",t.pendientes_validacion]].map(([o,n])=>i`<div class="${s.tarjeta} flex items-center justify-between gap-4 px-6 py-4"><span class="text-sm text-slate-700">${o}</span><strong class="text-lg text-slate-900">${n}</strong></div>`)}
    </section>
    <section class="${s.tarjeta} mt-6 p-6" aria-labelledby="t-barras">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="t-barras" class="text-base font-bold text-slate-900">Recaudación diaria</h2>
        <p class="text-sm text-slate-600">Cobrado del mes: <strong class="text-slate-900">${b(a.cobrado.monto_usd)}</strong></p>
      </div>
      ${Aa(a)}
    </section>`}async function I(a,t){const e=l("#tablero",HTMLElement,a.zona);t||c(e,i`<div class="h-48 animate-pulse rounded-xl bg-slate-200" role="status" aria-label="Cargando tablero"></div>`);try{const[o,n]=await Promise.all([v.get("/facturacion/tablero",{periodo:d.periodo}),v.get("/estudiantes/resumen")]);if(!a.vigente())return;c(e,La(o,n)),Ma(e);const r=j("#actualizado",HTMLElement,a.zona);r&&(r.textContent=`Actualizado a las ${ua(new Date)}`)}catch(o){if(!a.vigente()||t&&!(o instanceof E))return;Y(o,a)}}async function Ta(a){c(a.zona,i`${T("Dashboard","Tablero financiero en tiempo real",i`<div class="flex flex-wrap items-end gap-4">
        <div><label for="periodo" class="${s.etiqueta}">Período</label><input id="periodo" type="month" value="${d.periodo}" max="${P()}" class="${s.input}"></div>
        <p id="actualizado" class="pb-2 text-xs text-slate-600" aria-live="off"></p>
      </div>`)}<div id="tablero"></div>`),l("#periodo",HTMLInputElement,a.zona).addEventListener("change",t=>{const e=t.target instanceof HTMLInputElement?t.target.value:"";/^\d{4}-\d{2}$/.test(e)&&(x({periodo:e}),I(a,!1))}),await I(a,!0),z=window.setInterval(()=>{if(!a.vigente()){q();return}document.hidden||I(a,!0)},ma)}function _a(a){return i`<tr>
    <td class="${s.td}"><span class="font-medium text-slate-900">${a.apellidos}, ${a.nombres}</span></td>
    <td class="${s.td}">${a.grado_solicitado}</td>
    <td class="${s.td}">${a.representante}</td>
    <td class="${s.td}">${V(a.estado_dinamico)}</td>
    <td class="${s.td} whitespace-nowrap">${b(a.deuda_vencida_usd)}</td>
    <td class="${s.td}"><div class="flex flex-wrap gap-2">
      <button type="button" data-alerta="preventiva" data-id="${a.id}" class="${p(s.btnSecundario,s.btnPeq)}">Preventiva</button>
      <button type="button" data-alerta="morosidad" data-id="${a.id}" class="${p(s.btnSecundario,s.btnPeq)}">Morosidad</button>
    </div></td>
  </tr>`}async function za(a){const t=await v.pagina("/estudiantes",{estado:d.filtroEstudiantes,pagina:d.paginaEstudiantes,limite:J});if(a.vigente()){c(a.zona,i`${T("Estudiantes",`${t.paginacion.total} resultado(s)`)}
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
      ${N.map(e=>i`<button type="button" data-filtro="${e}" aria-pressed="${e===d.filtroEstudiantes}" class="${p(s.btnSecundario,s.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${e===""?"Todos":e}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${s.tabla}">
        <caption class="sr-only">Listado de estudiantes</caption>
        <thead><tr><th scope="col" class="${s.th}">Estudiante</th><th scope="col" class="${s.th}">Grado</th><th scope="col" class="${s.th}">Representante</th><th scope="col" class="${s.th}">Estado</th><th scope="col" class="${s.th}">Deuda vencida</th><th scope="col" class="${s.th}">Alertas WhatsApp</th></tr></thead>
        <tbody>${t.datos.length===0?i`<tr><td colspan="6" class="${s.td}">Sin resultados.</td></tr>`:t.datos.map(_a)}</tbody>
      </table>
    </div>
    ${Z(t.paginacion)}`);for(const e of y("[data-filtro]",HTMLButtonElement,a.zona))e.addEventListener("click",()=>{const o=e.dataset.filtro??"",n=N.find(r=>r===o)??"";x({filtroEstudiantes:n,paginaEstudiantes:1}),$("estudiantes")});aa(a.zona,e=>{x({paginaEstudiantes:Math.max(1,d.paginaEstudiantes+e)}),$("estudiantes")});for(const e of y("[data-alerta]",HTMLButtonElement,a.zona))e.addEventListener("click",()=>{const o=e.dataset.alerta==="morosidad"?"morosidad":"preventiva";Ha(o,Number(e.dataset.id),e)})}}async function Ha(a,t,e){try{const o=await L(e,()=>v.post(`/notificaciones/whatsapp/${a}/${t}`)),n=U({titulo:a==="morosidad"?"Alerta de morosidad":"Alerta preventiva",ancho:"lg",cuerpo:i`<p class="text-sm text-slate-600">${b(o.monto_usd)} · ${W(o.monto_bs)} · tasa BCV ${ia(o.tasa_bcv)}</p>
        <pre class="mt-4 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">${o.mensaje}</pre>
        <div id="alerta-resultado" class="mt-4"></div>
        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <a href="${ra(o.enlace_whatsapp,["https://wa.me/"])}" target="_blank" rel="noopener noreferrer" class="${p(s.btnPrimario)}">Abrir en WhatsApp</a>
          <button type="button" id="alerta-enviar" class="${p(s.btnSecundario)}">Enviar por API</button>
        </div>`}),r=l("#alerta-enviar",HTMLButtonElement,n.dialogo);r.addEventListener("click",()=>{const u=l("#alerta-resultado",HTMLElement,n.dialogo);L(r,()=>v.post(`/notificaciones/whatsapp/${a}/${t}`,{},{consulta:{enviar:!0}})).then(()=>c(u,h("ok","Mensaje enviado por la API de WhatsApp."))).catch(f=>c(u,h("bad",A(f))))})}catch(o){o instanceof E?M("Tu sesión expiró. Inicia sesión de nuevo."):C("bad",A(o))}}function ka(a){const t=a.estado==="Por Validar";return i`<tr>
    <td class="${s.td} whitespace-nowrap">${la(a.declarado_en)}</td>
    <td class="${s.td}"><span class="font-medium text-slate-900">${a.estudiante}</span><br><span class="text-xs text-slate-600">${a.concepto} · vence ${da(a.fecha_vencimiento)}</span></td>
    <td class="${s.td}"><strong class="break-all">${a.referencia}</strong><br><span class="text-xs text-slate-600">${a.representante}</span></td>
    <td class="${s.td}">${ca(a.metodo_pago)}</td>
    <td class="${s.td} whitespace-nowrap">${b(a.monto_usd)}<br><span class="text-xs text-slate-600">${W(a.monto_bs)}</span></td>
    <td class="${s.td}">${t?i`<div class="flex flex-wrap gap-2">
          <button type="button" data-aprobar="${a.id}" class="${p(s.btnOk,s.btnPeq)}">${m("check","h-4 w-4")}<span>Aprobar</span></button>
          <button type="button" data-rechazar="${a.id}" class="${p(s.btnPeligro,s.btnPeq)}">${m("x","h-4 w-4")}<span>Rechazar</span></button>
        </div>`:i`${V(a.estado)}${a.nota_revision?i`<p class="mt-1 max-w-xs break-words text-xs text-slate-600">${a.nota_revision}</p>`:null}`}</td>
  </tr>`}async function Sa(a){const t=await v.pagina("/facturacion/auditoria",{estado:d.filtroAuditoria,pagina:d.paginaAuditoria,limite:J});if(!a.vigente())return;const e=B()?i`<button type="button" id="exportar" class="${p(s.btnSecundario)}">${m("down","h-4 w-4")}<span>Exportar histórico (.xlsx)</span></button>`:null;c(a.zona,i`${T("Bandeja de auditoría",`${t.paginacion.total} referencia(s) · ${d.filtroAuditoria}`,e)}
    <div id="auditoria-aviso" class="mb-4"></div>
    <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado de la referencia">
      ${O.map(r=>i`<button type="button" data-filtro="${r}" aria-pressed="${r===d.filtroAuditoria}" class="${p(s.btnSecundario,s.btnPeq,"aria-pressed:border-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white")}">${r}</button>`)}
    </div>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white/90 backdrop-blur">
      <table class="${s.tabla}">
        <caption class="sr-only">Referencias de pago declaradas</caption>
        <thead><tr><th scope="col" class="${s.th}">Declarada</th><th scope="col" class="${s.th}">Estudiante</th><th scope="col" class="${s.th}">Referencia</th><th scope="col" class="${s.th}">Método</th><th scope="col" class="${s.th}">Monto</th><th scope="col" class="${s.th}">Acción</th></tr></thead>
        <tbody>${t.datos.length===0?i`<tr><td colspan="6" class="${s.td}">Bandeja vacía.</td></tr>`:t.datos.map(ka)}</tbody>
      </table>
    </div>
    ${Z(t.paginacion)}`);const o=l("#auditoria-aviso",HTMLElement,a.zona);for(const r of y("[data-filtro]",HTMLButtonElement,a.zona))r.addEventListener("click",()=>{const u=r.dataset.filtro??"",f=O.find(w=>w===u)??"Por Validar";x({filtroAuditoria:f,paginaAuditoria:1}),$("auditoria")});aa(a.zona,r=>{x({paginaAuditoria:Math.max(1,d.paginaAuditoria+r)}),$("auditoria")});const n=new Map(t.datos.map(r=>[r.id,r]));for(const r of y("[data-aprobar]",HTMLButtonElement,a.zona))r.addEventListener("click",()=>void Ia(Number(r.dataset.aprobar),r,o));for(const r of y("[data-rechazar]",HTMLButtonElement,a.zona))r.addEventListener("click",()=>{const u=n.get(Number(r.dataset.rechazar));u&&Pa(u)});j("#exportar",HTMLButtonElement,a.zona)?.addEventListener("click",r=>{const u=r.currentTarget instanceof HTMLButtonElement?r.currentTarget:null;u&&ta(u,"/exportaciones/facturacion.xlsx","facturacion.xlsx",o)})}async function ta(a,t,e,o){try{await L(a,()=>v.descargar(t,e))}catch(n){n instanceof E?M("Tu sesión expiró. Inicia sesión de nuevo."):c(o,h("bad",A(n)))}}function ea(a,t){return`${t} · estatus de pago del alumno: ${a.estatus_pago} · deuda vencida ${b(a.deuda_vencida_usd)}.`}async function Ia(a,t,e){try{const o=await L(t,()=>v.post(`/facturacion/auditoria/${a}/aprobar`,{}));C("ok",ea(o,"Referencia aprobada")),await $("auditoria")}catch(o){o instanceof E?M("Tu sesión expiró. Inicia sesión de nuevo."):c(e,h("bad",A(o)))}}function Pa(a){const t=U({titulo:"Rechazar referencia",cuerpo:i`<form id="form-rechazo" novalidate class="flex flex-col gap-4">
      <p class="text-sm text-slate-700">Referencia <strong class="break-all">${a.referencia}</strong> · ${a.estudiante} · ${b(a.monto_usd)}</p>
      <div>
        <label for="nota-rechazo" class="${s.etiqueta}">Motivo del rechazo <span class="text-red-800" aria-hidden="true">*</span></label>
        <textarea id="nota-rechazo" name="nota" rows="4" maxlength="${S}" required aria-describedby="nota-ayuda nota-error" class="${s.input}"></textarea>
        <p id="nota-ayuda" class="${s.ayuda}">Se guarda en el historial y se usa para avisar al representante. <span id="nota-contador">0/${S}</span></p>
        <p id="nota-error" class="${s.errorCampo}" role="alert" hidden></p>
      </div>
      <div id="rechazo-aviso"></div>
      <div class="flex justify-end gap-2">
        <button type="button" data-cancelar class="${p(s.btnSecundario)}">Cancelar</button>
        <button type="submit" class="${p(s.btnPeligro)}">${m("x","h-4 w-4")}<span>Rechazar referencia</span></button>
      </div>
    </form>`}),e=l("#form-rechazo",HTMLFormElement,t.dialogo),o=l("#nota-rechazo",HTMLTextAreaElement,t.dialogo),n=l("#nota-error",HTMLElement,t.dialogo),r=l("#nota-contador",HTMLElement,t.dialogo);o.addEventListener("input",()=>{r.textContent=`${o.value.length}/${S}`,o.value.trim()!==""&&(n.hidden=!0,o.removeAttribute("aria-invalid"))}),l("[data-cancelar]",HTMLButtonElement,t.dialogo).addEventListener("click",t.cerrar),e.addEventListener("submit",u=>{u.preventDefault();const f=o.value.trim();if(f===""){n.textContent="Debes escribir el motivo del rechazo para continuar.",n.hidden=!1,o.setAttribute("aria-invalid","true"),o.focus();return}const w=l('button[type="submit"]',HTMLButtonElement,e);L(w,()=>v.post(`/facturacion/auditoria/${a.id}/rechazar`,{nota:f})).then(async g=>{t.cerrar(),C("ok",ea(g,"Referencia rechazada")),await $("auditoria")}).catch(g=>{if(g instanceof E){t.cerrar(),M("Tu sesión expiró. Inicia sesión de nuevo.");return}c(l("#rechazo-aviso",HTMLElement,t.dialogo),h("bad",A(g)))})}),o.focus()}async function ja(a){const t=await v.get("/contabilidad/balance",{periodo:d.periodo});if(!a.vigente())return;c(a.zona,i`${T("Contabilidad",`Balance neto del período ${t.periodo}`,i`<div class="flex flex-wrap items-end gap-4">
      <div><label for="periodo-conta" class="${s.etiqueta}">Período</label><input id="periodo-conta" type="month" value="${d.periodo}" max="${P()}" class="${s.input}"></div>
      <button type="button" id="exportar" class="${p(s.btnPrimario)}">${m("down","h-4 w-4")}<span>Exportar nómina, egresos y personal (.xlsx)</span></button>
    </div>`)}
    <div id="conta-aviso" class="mb-4"></div>
    <section class="grid gap-4 sm:grid-cols-3" aria-label="Balance">
      ${H({titulo:"Ingresos",valor:b(t.ingresos_usd),detalle:"Referencias aprobadas del período",icono:"wallet",tono:"normal"})}
      ${H({titulo:"Egresos",valor:b(t.egresos_usd),detalle:"Egresos y nómina pagada",icono:"book",tono:"normal"})}
      ${H({titulo:"Neto",valor:b(t.neto_usd),detalle:"Ingresos − egresos",icono:"check",tono:t.neto_usd<0?"malo":"normal"})}
    </section>`),l("#periodo-conta",HTMLInputElement,a.zona).addEventListener("change",o=>{const n=o.target instanceof HTMLInputElement?o.target.value:"";/^\d{4}-\d{2}$/.test(n)&&(x({periodo:n}),$("contabilidad"))});const e=l("#conta-aviso",HTMLElement,a.zona);l("#exportar",HTMLButtonElement,a.zona).addEventListener("click",o=>{const n=o.currentTarget instanceof HTMLButtonElement?o.currentTarget:null;n&&ta(n,"/exportaciones/contabilidad.xlsx","contabilidad.xlsx",e)})}function Ca(){const a=i`<div class="flex items-center gap-4 border-b border-slate-100 py-4"><div class="h-8 w-8 rounded-full bg-slate-200"></div><div class="h-4 flex-1 rounded bg-slate-200"></div><div class="h-4 w-24 rounded bg-slate-200"></div></div>`;return i`<div aria-hidden="true" class="pointer-events-none select-none p-6">
    <div class="mb-4 h-6 w-1/3 rounded bg-slate-300"></div>${a}${a}${a}${a}${a}
  </div>`}function Ba(a){return i`<div data-candado class="absolute inset-0 z-10 flex items-center justify-center bg-white/80 p-6 backdrop-blur-md">
    <div role="region" aria-label="${D}" class="${s.tarjetaCristal} w-full max-w-md p-8 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">${m("lock","h-6 w-6")}</span>
      <h2 class="mt-4 text-lg font-bold text-slate-900">${D}</h2>
      <p class="mt-1 text-sm font-semibold text-slate-800">${a.nombre}</p>
      <p class="mt-2 text-sm text-slate-700">${a.descripcion}</p>
      <p class="mt-4 text-2xl font-bold text-slate-900">${b(a.precio_usd)}</p>
      <p class="mt-1 text-xs text-slate-600">Pago único · solicítalo a Astra Digital Solutions</p>
    </div>
  </div>`}function oa(a){return i`${T(a.nombre,a.descripcion)}
    <div class="${s.tarjeta} relative min-h-96 overflow-hidden">${Ca()}${Ba(a)}</div>`}function qa(a,t){const e=d.modulos.find(o=>o.codigo===t);if(!e){c(a.zona,h("bad","Módulo no encontrado."));return}if(e.bloqueado){c(a.zona,oa(e));return}c(a.zona,i`${T(e.nombre,e.descripcion)}
    <div class="${s.tarjeta} p-6">${h("info","El módulo está habilitado para esta academia. Su lógica se publicará en la Fase 2 (ruta reservada en el servidor).","Módulo habilitado")}</div>`)}function Ra(a,t){const e=d.modulos.find(o=>o.codigo===t.modulo);c(a,oa({nombre:t.nombre,descripcion:e?.descripcion??"Este módulo forma parte de la Fase 2 del sistema.",precio_usd:t.precio_usd}))}Q();
