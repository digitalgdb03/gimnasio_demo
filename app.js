/* Zona Gym · Aplicación de gestión (vanilla JS).
   Estado persistido en el navegador. Login con credenciales fijas. */

const $ = (s, c = document) => c.querySelector(s);
const STORE = "zona_gym_v1";
const AUTH = "zona_gym_auth";
const CREDS = { user: "admin", pass: "zona2026" };

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIA_CORTO = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const BLOQUES = ["6:00", "8:00", "10:00", "5:00 PM", "6:00 PM", "8:00 PM"];
const ROLES = [{ value: "CLIENTE", label: "Cliente" }, { value: "INSTRUCTOR", label: "Instructor" }, { value: "EMPLEADO", label: "Empleado" }];
const ESTADOS = [{ value: "activo", label: "Activo" }, { value: "congelado", label: "Congelado" }, { value: "moroso", label: "Moroso" }];
const METODOS = ["Efectivo (USD)", "Efectivo (Bs)", "Pago Móvil", "Transferencia", "Punto de venta"];
const DURACIONES = ["Diaria", "Semanal", "Mensual"];
const ABREV = { "Pago Móvil": "P. Móvil", "Efectivo (USD)": "Efec. $", "Transferencia": "Transf.", "Punto de venta": "Punto", "Efectivo (Bs)": "Efec. Bs" };

let state, current = "dashboard", userFilter = "ALL", calDay = 0, repPeriod = "semana", booted = false, asistFeedback = null;

/* ---------- Persistencia ---------- */
function loadState() { try { const s = localStorage.getItem(STORE); if (s) return JSON.parse(s); } catch (e) {} return seed(); }
function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }
function resetData() { if (!confirm("¿Restablecer a los datos iniciales? Se perderán los cambios.")) return; state = seed(); save(); go(current); }

/* ---------- Helpers ---------- */
const uid = () => "x" + Math.random().toString(36).slice(2, 9);
const todayISO = () => isoDate(new Date());
const servicio = (id) => state.servicios.find((s) => s.id === id);
const planById = (id) => state.planes.find((p) => p.id === id);
const usuario = (id) => state.usuarios.find((u) => u.id === id);
const clientes = () => state.usuarios.filter((u) => u.rol === "CLIENTE");
const instructores = () => state.usuarios.filter((u) => u.rol === "INSTRUCTOR");
const planLabel = (id) => { const p = planById(id); return p ? `${servicio(p.areaId)?.nombre || "?"} · ${p.duracion}` : "—"; };
const planOpts = () => state.planes.map((p) => ({ value: p.id, label: planLabel(p.id) + " ($" + p.usd + ")" }));
const initials = (n) => (n || "").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const bs = (usd) => (usd * state.bcv).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const rerender = () => go(current);
const nowTime = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const normCed = (s) => (s || "").replace(/[^0-9a-zA-Z]/g, "").toLowerCase();
function lastNDays(n) { const t = new Date(); t.setHours(0, 0, 0, 0); const a = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(t); d.setDate(d.getDate() - i); a.push(d); } return a; }

const ICONS = {
  dashboard: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z"/>',
  usuarios: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  clientes: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  asistencia: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  servicios: '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
  planes: '<path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/>',
  horarios: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  pagos: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  reportes: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
};
const ICO = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
const actBtns = (e, d, id) => `<div class="row-actions">
  <button class="icon-btn" title="Editar" data-action="${e}" data-id="${id}">${ICO("edit")}</button>
  <button class="icon-btn del" title="Eliminar" data-action="${d}" data-id="${id}">${ICO("del")}</button></div>`;

const PAGES = [
  { id: "dashboard", label: "Dashboard", sub: () => "Resumen del día · " + state.fecha },
  { id: "usuarios", label: "Usuarios", sub: () => "Clientes, instructores y empleados" },
  { id: "clientes", label: "Clientes", sub: () => "Membresías y estados" },
  { id: "asistencia", label: "Asistencia", sub: () => "Registro de entrada por cédula (acceso libre)" },
  { id: "servicios", label: "Servicios", sub: () => "Áreas que ofrece el gimnasio" },
  { id: "planes", label: "Planes", sub: () => "Tarifas por área y duración" },
  { id: "horarios", label: "Horarios", sub: () => "Calendario semanal de clases" },
  { id: "pagos", label: "Pagos", sub: () => "Movimientos del día" },
  { id: "reportes", label: "Reportes", sub: () => "Ingresos por día, semana y mes" },
];

/* =====================================================================
   MODAL DINÁMICO
   ===================================================================== */
function fieldHTML(f, val) {
  val = val == null ? "" : val;
  if (f.type === "select") {
    const opts = (f.options || []).map((o) => `<option value="${o.value}" ${String(o.value) === String(val) ? "selected" : ""}>${o.label}</option>`).join("");
    return `<div class="field"><label>${f.label}${f.required ? " *" : ""}</label>
      <select name="${f.key}">${f.placeholder ? `<option value="">${f.placeholder}</option>` : ""}${opts}</select></div>`;
  }
  if (f.type === "color") {
    const colors = ["#343959", "#F2A30F", "#BF9039", "#F2B90C", "#404040", "#1f9d57", "#3d6bd6", "#d63b3b"];
    return `<div class="field"><label>${f.label}</label>
      <div class="swatch-row" data-swatch>${colors.map((c) => `<div class="swatch ${c === val ? "sel" : ""}" data-color="${c}" style="background:${c}"></div>`).join("")}</div>
      <input type="hidden" name="${f.key}" value="${val || colors[0]}"></div>`;
  }
  return `<div class="field"><label>${f.label}${f.required ? " *" : ""}</label>
    <input type="${f.type || "text"}" name="${f.key}" value="${String(val).replace(/"/g, "&quot;")}" ${f.placeholder ? `placeholder="${f.placeholder}"` : ""} ${f.step ? `step="${f.step}"` : ""}></div>`;
}

function openModal({ title, fields, values = {}, onSave, onDelete }) {
  const buildFields = typeof fields === "function" ? fields : () => fields;
  const wrap = document.createElement("div");
  wrap.className = "modal-overlay";
  wrap.innerHTML = `<div class="modal" role="dialog">
    <h3 class="modal-title">${title}</h3>
    <div class="modal-err" hidden></div>
    <div class="modal-body"></div>
    <div class="modal-actions">
      ${onDelete ? '<button class="btn btn-danger" data-x="del">Eliminar</button>' : ""}
      <button class="btn btn-ghost" data-x="cancel">Cancelar</button>
      <button class="btn btn-primary" data-x="save">Guardar</button>
    </div></div>`;
  document.body.appendChild(wrap);
  const body = wrap.querySelector(".modal-body"), errEl = wrap.querySelector(".modal-err");
  const close = () => wrap.remove();
  const err = (m) => { errEl.textContent = m; errEl.hidden = false; };
  let cur = { ...values };
  const collect = () => { body.querySelectorAll("[name]").forEach((el) => (cur[el.name] = el.value)); return cur; };

  function renderBody() {
    const flds = buildFields(cur);
    body.innerHTML = flds.map((f) => fieldHTML(f, cur[f.key])).join("");
    body.querySelectorAll("[data-swatch]").forEach((g) => g.querySelectorAll(".swatch").forEach((sw) => (sw.onclick = () => {
      g.querySelectorAll(".swatch").forEach((x) => x.classList.remove("sel")); sw.classList.add("sel");
      g.parentElement.querySelector("input[type=hidden]").value = sw.dataset.color;
    })));
    flds.filter((f) => f.control).forEach((f) => { const el = body.querySelector(`[name="${f.key}"]`); if (el) el.addEventListener("change", () => { collect(); renderBody(); }); });
  }
  renderBody();

  wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
  wrap.querySelector("[data-x=cancel]").onclick = close;
  if (onDelete) wrap.querySelector("[data-x=del]").onclick = () => { close(); onDelete(); };
  wrap.querySelector("[data-x=save]").onclick = () => {
    collect();
    const flds = buildFields(cur), vals = {}; let ok = true;
    flds.forEach((f) => {
      const el = body.querySelector(`[name="${f.key}"]`);
      vals[f.key] = (el ? el.value : cur[f.key] || "").toString().trim();
      if (f.required && !vals[f.key]) { ok = false; if (el) el.classList.add("invalid"); } else if (el) el.classList.remove("invalid");
    });
    if (!ok) return err("Completa los campos obligatorios.");
    const res = onSave(vals);
    if (res && res.error) return err(res.error);
    close();
  };
}

/* =====================================================================
   VISTAS
   ===================================================================== */
function stat(label, value, sub, ico, tint) {
  return `<div class="card stat"><div class="ico ${tint}">${ICO(ico)}</div>
    <div class="label">${label}</div><div class="value">${value}</div><div class="substat">${sub}</div></div>`;
}

function vDashboard() {
  const cli = clientes();
  const cnt = (e) => cli.filter((c) => c.estado === e).length;
  const activos = cnt("activo"), morosos = cnt("moroso"), congelados = cnt("congelado");
  const total = cli.length || 1;
  const ingresos = state.pagos.filter((p) => p.fecha === todayISO()).reduce((s, p) => s + Number(p.usd), 0);
  const pctA = Math.round(activos / total * 100), pctAM = Math.round((activos + morosos) / total * 100);
  const maxA = Math.max(...state.asistencia.map((a) => a.v), 1);
  const cntBy = (arr, key) => arr.reduce((m, x) => (m[x[key]] = (m[x[key]] || 0) + 1, m), {});
  const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0];
  const servTop = (top(cntBy(state.clases, "areaId")) || [])[0];
  const horaTop = (top(cntBy(state.clases, "bloque")) || [])[0] || "—";
  const asistHoy = state.asistencias.length;

  return `
  <div class="grid cols-4" data-stagger>
    ${stat("Ingresos de hoy", "$" + ingresos.toFixed(0), "Bs " + bs(ingresos), "pagos", "tint-y")}
    ${stat("Asistencias de hoy", asistHoy, "entradas registradas", "asistencia", "tint-o")}
    ${stat("Clientes activos", activos, "de " + cli.length + " totales", "clientes", "tint-b")}
    ${stat("Morosos", morosos, "requieren seguimiento", "planes", "tint-c")}
  </div>
  <div class="grid cols-2" style="margin-top:20px">
    <div class="card fade-in"><h3>Asistencia por hora</h3>
      <div class="bars">${state.asistencia.map((a) => `<div class="bar ${a.h === "6p" ? "peak" : ""}"><div class="val">${a.v}</div><div class="col" style="height:${a.v / maxA * 100}%"></div><div class="lbl">${a.h}</div></div>`).join("")}</div>
      <div class="section-note" style="margin:14px 0 0">Horario más concurrido: <b style="color:var(--azul)">${horaTop}</b> · Servicio top: <b style="color:var(--azul)">${servicio(servTop)?.nombre || "—"}</b></div>
    </div>
    <div class="card fade-in"><h3>Estado de clientes</h3>
      <div class="donut-wrap"><div class="donut">
        <div style="width:100%;height:100%;border-radius:50%;background:conic-gradient(var(--ok) 0 ${pctA}%, var(--err) ${pctA}% ${pctAM}%, var(--info) ${pctAM}% 100%);-webkit-mask:radial-gradient(circle 44px at center, transparent 98%, #000 100%);mask:radial-gradient(circle 44px at center, transparent 98%, #000 100%)"></div>
        <div class="center"><b>${pctA}%</b><span>activos</span></div></div>
        <div class="legend">
          <div class="li"><span class="sw" style="background:var(--ok)"></span>Activos<b>${activos}</b></div>
          <div class="li"><span class="sw" style="background:var(--err)"></span>Morosos<b>${morosos}</b></div>
          <div class="li"><span class="sw" style="background:var(--info)"></span>Congelados<b>${congelados}</b></div>
        </div></div>
    </div>
  </div>
  <div class="card fade-in" style="margin-top:20px"><h3>Últimos pagos</h3>${tablaPagos(state.pagos.filter((p) => p.fecha === todayISO()).slice(0, 4), false)}</div>`;
}

function vUsuarios() {
  const filtros = [["ALL", "Todos"], ["CLIENTE", "Clientes"], ["INSTRUCTOR", "Instructores"], ["EMPLEADO", "Empleados"]];
  const lista = userFilter === "ALL" ? state.usuarios : state.usuarios.filter((u) => u.rol === userFilter);
  return `
  <div class="toolbar">
    <div class="pills">${filtros.map(([v, l]) => `<button class="pill ${userFilter === v ? "active" : ""}" data-action="filtroUsuario" data-id="${v}">${l}</button>`).join("")}</div>
    <button class="btn btn-primary" data-action="nuevoUsuario" style="margin-left:auto">+ Nuevo usuario</button>
  </div>
  <div class="card fade-in"><div class="table-wrap"><table>
    <thead><tr><th>Nombre</th><th>Cédula</th><th>Correo</th><th>Rol</th><th>Detalle</th><th>Teléfono</th><th></th></tr></thead>
    <tbody>${lista.map((u, i) => `
      <tr>
        <td data-label="Nombre"><div class="cell-name"><div class="av ${i % 3 === 1 ? "o" : i % 3 === 2 ? "n" : ""}">${initials(u.nombre)}</div><b>${u.nombre}</b></div></td>
        <td data-label="Cédula">${u.cedula || "—"}</td>
        <td data-label="Correo">${u.email || "—"}</td>
        <td data-label="Rol"><span class="role-badge role-${u.rol}">${cap(u.rol.toLowerCase())}</span></td>
        <td data-label="Detalle">${u.detalle || (u.rol === "CLIENTE" ? planLabel(u.planId) : "—")}</td>
        <td data-label="Teléfono">${u.telefono || "—"}</td>
        <td data-label="">${actBtns("editarUsuario", "eliminarUsuario", u.id)}</td>
      </tr>`).join("") || `<tr><td style="text-align:center;color:var(--muted)">Sin usuarios.</td></tr>`}
    </tbody></table></div></div>`;
}

function formUsuario(v = {}) {
  const rol = v.rol || "CLIENTE";
  const f = [
    { key: "nombre", label: "Nombre completo", required: true },
    { key: "cedula", label: "Cédula / ID", required: true, placeholder: "V-00.000.000" },
    { key: "email", label: "Correo electrónico", type: "email", placeholder: "correo@ejemplo.com" },
    { key: "telefono", label: "Teléfono (WhatsApp)", type: "tel", placeholder: "0414-0000000" },
    { key: "rol", label: "Rol", type: "select", required: true, options: ROLES, control: true },
  ];
  if (rol === "EMPLEADO") f.push({ key: "detalle", label: "Cargo", placeholder: "Ej: Recepción" });
  else if (rol === "INSTRUCTOR") f.push({ key: "detalle", label: "Especialidad", placeholder: "Ej: Boxeo" });
  else f.push(
    { key: "estado", label: "Estado", type: "select", options: ESTADOS },
    { key: "planId", label: "Plan", type: "select", placeholder: "Selecciona…", options: planOpts() },
    { key: "vence", label: "Vence", placeholder: "dd/mm/aaaa" },
    { key: "salud", label: "Datos de salud (opcional)", placeholder: "Lesiones, condiciones médicas…" },
    { key: "emergencia", label: "Contacto de emergencia (opcional)", placeholder: "Nombre y teléfono" });
  return f;
}

function vClientes() {
  const lista = clientes();
  return `
  <div class="toolbar">
    <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input placeholder="Buscar cliente…"></div>
    <button class="btn btn-primary" data-action="nuevoCliente">+ Nuevo cliente</button>
  </div>
  <div class="card fade-in"><div class="table-wrap"><table>
    <thead><tr><th>Cliente</th><th>Plan</th><th>Estado</th><th>Vence</th><th>Teléfono</th><th>Salud</th><th></th></tr></thead>
    <tbody>${lista.map((c, i) => `
      <tr>
        <td data-label="Cliente"><div class="cell-name"><div class="av ${i % 3 === 1 ? "o" : i % 3 === 2 ? "n" : ""}">${initials(c.nombre)}</div><div><b>${c.nombre}</b><span>${c.cedula || ""}</span></div></div></td>
        <td data-label="Plan">${planLabel(c.planId)}</td>
        <td data-label="Estado"><span class="badge ${c.estado}">${cap(c.estado || "activo")}</span></td>
        <td data-label="Vence">${c.vence || "—"}</td>
        <td data-label="Teléfono">${c.telefono || "—"}</td>
        <td data-label="Salud">${c.salud ? c.salud : '<span style="color:var(--muted)">—</span>'}</td>
        <td data-label="">${actBtns("editarCliente", "eliminarUsuario", c.id)}</td>
      </tr>`).join("") || `<tr><td style="text-align:center;color:var(--muted)">Sin clientes.</td></tr>`}
    </tbody></table></div></div>`;
}

function formCliente() {
  return [
    { key: "nombre", label: "Nombre completo", required: true },
    { key: "cedula", label: "Cédula", required: true, placeholder: "V-00.000.000" },
    { key: "email", label: "Correo electrónico", type: "email", placeholder: "correo@ejemplo.com" },
    { key: "telefono", label: "Teléfono (WhatsApp)", type: "tel" },
    { key: "estado", label: "Estado", type: "select", required: true, options: ESTADOS },
    { key: "planId", label: "Plan", type: "select", required: true, placeholder: "Selecciona…", options: planOpts() },
    { key: "vence", label: "Vence", placeholder: "dd/mm/aaaa" },
    { key: "salud", label: "Datos de salud (opcional)", placeholder: "Lesiones, condiciones médicas…" },
    { key: "emergencia", label: "Contacto de emergencia (opcional)", placeholder: "Nombre y teléfono" },
  ];
}

function vAsistencia() {
  const hoy = state.asistencias;
  const distintos = new Set(hoy.map((a) => a.clienteId)).size;
  const ultima = hoy.length ? hoy[hoy.length - 1].entrada : "—";
  return `
  <div class="toolbar">
    <div class="cedula-entry">
      <input id="cedulaInput" placeholder="Cédula del cliente (ej: V-25.481.230)" autocomplete="off" autofocus>
      <button class="btn btn-primary" data-action="marcarEntrada">Marcar entrada</button>
    </div>
  </div>
  ${asistFeedback ? `<div class="msg ${asistFeedback.ok ? "success" : "error"}" style="margin-bottom:16px">${asistFeedback.text}</div>` : ""}
  <div class="grid cols-3" data-stagger style="margin-bottom:20px">
    ${stat("Asistencias de hoy", hoy.length, "entradas registradas", "asistencia", "tint-o")}
    ${stat("Clientes distintos", distintos, "personas hoy", "clientes", "tint-b")}
    ${stat("Última entrada", ultima, "registro más reciente", "dashboard", "tint-c")}
  </div>
  <div class="card fade-in"><h3>Asistencia de hoy</h3><div class="table-wrap"><table>
    <thead><tr><th>Cliente</th><th>Cédula</th><th>Hora de entrada</th><th></th></tr></thead>
    <tbody>${hoy.slice().reverse().map((a, i) => {
      const c = usuario(a.clienteId);
      return `<tr>
        <td data-label="Cliente"><div class="cell-name"><div class="av ${i % 3 === 1 ? "o" : i % 3 === 2 ? "n" : ""}">${initials(c?.nombre)}</div><b>${c?.nombre || "—"}</b></div></td>
        <td data-label="Cédula">${c?.cedula || "—"}</td>
        <td data-label="Entrada">${a.entrada}</td>
        <td data-label=""><div class="row-actions"><button class="icon-btn del" data-action="eliminarAsistencia" data-id="${a.id}">${ICO("del")}</button></div></td>
      </tr>`;
    }).join("") || `<tr><td style="text-align:center;color:var(--muted)">Sin registros hoy.</td></tr>`}
    </tbody></table></div></div>`;
}

function vServicios() {
  return `
  <div class="toolbar"><div class="section-note" style="margin:0">Áreas dinámicas: agrega las que ofrezca el gimnasio.</div>
    <button class="btn btn-primary" data-action="nuevoServicio" style="margin-left:auto">+ Nueva área</button></div>
  <div class="card fade-in"><div class="table-wrap"><table>
    <thead><tr><th>Área de servicio</th><th>Tipo</th><th>Planes</th><th>Agenda</th><th></th></tr></thead>
    <tbody>${state.servicios.map((s) => `
      <tr>
        <td data-label="Área"><span class="serv-color" style="background:${s.color}"></span><b>${s.nombre}</b></td>
        <td data-label="Tipo">${s.tipo === "LIBRE" ? '<span class="role-badge role-EMPLEADO">Acceso libre</span>' : '<span class="role-badge role-INSTRUCTOR">Clase dirigida</span>'}</td>
        <td data-label="Planes">${state.planes.filter((p) => p.areaId === s.id).length}</td>
        <td data-label="Agenda">${s.tipo === "LIBRE" ? '<span style="color:var(--muted)">Siempre disponible</span>' : state.clases.filter((c) => c.areaId === s.id).length + " clases"}</td>
        <td data-label="">${actBtns("editarServicio", "eliminarServicio", s.id)}</td>
      </tr>`).join("") || `<tr><td style="text-align:center;color:var(--muted)">Sin áreas.</td></tr>`}
    </tbody></table></div></div>`;
}
function formServicio() {
  return [
    { key: "nombre", label: "Nombre del área", required: true, placeholder: "Ej: Spinning" },
    { key: "tipo", label: "Tipo de área", type: "select", required: true, options: [{ value: "LIBRE", label: "Acceso libre (siempre disponible)" }, { value: "DIRIGIDA", label: "Clase dirigida (con horario)" }] },
    { key: "color", label: "Color de identificación", type: "color" },
  ];
}

function vPlanes() {
  const porArea = state.servicios.map((s) => ({ s, items: state.planes.filter((p) => p.areaId === s.id) }));
  return `
  <div class="toolbar"><div class="section-note" style="margin:0">Cada plan pertenece a un área y una duración.</div>
    <button class="btn btn-primary" data-action="nuevoPlan" style="margin-left:auto">+ Nuevo plan</button></div>
  ${porArea.map(({ s, items }) => `
    <div class="plan-area fade-in">
      <div class="head"><span class="tag">${s.nombre}</span><span class="chip-area" style="background:${s.color}">Área de servicio</span></div>
      <div class="plan-cards">${items.map((p) => `
        <div class="plan">
          <div class="plan-acts">
            <button class="icon-btn" data-action="editarPlan" data-id="${p.id}">${ICO("edit")}</button>
            <button class="icon-btn del" data-action="eliminarPlan" data-id="${p.id}">${ICO("del")}</button></div>
          <div class="dur">${p.duracion}</div><div class="price"><small>$</small>${p.usd}</div>
          <div class="price-bs">≈ Bs ${bs(p.usd)}</div>
          <div class="feat">Acceso a ${s.nombre}</div>
          <div class="feat">${p.duracion === "Mensual" ? "Congelable hasta 7 días" : "Sin permanencia"}</div>
        </div>`).join("") || `<div class="section-note">Sin planes en esta área.</div>`}</div>
    </div>`).join("")}`;
}
function formPlan() {
  return [
    { key: "areaId", label: "Área de servicio", type: "select", required: true, placeholder: "Selecciona…", options: state.servicios.map((s) => ({ value: s.id, label: s.nombre })) },
    { key: "duracion", label: "Duración", type: "select", required: true, options: DURACIONES.map((d) => ({ value: d, label: d })) },
    { key: "usd", label: "Precio (USD)", type: "number", required: true, step: "0.5" },
  ];
}

function chipClase(c) {
  const s = servicio(c.areaId), instr = usuario(c.instructorId);
  return `<div class="klass" style="background:${s?.color || "#404040"}" data-action="editarClase" data-id="${c.id}"><b>${s?.nombre || "?"}</b><span>${instr ? instr.nombre.split(" ").slice(-1)[0] : ""}</span></div>`;
}
function vHorarios() {
  // Desktop: rejilla
  let grid = `<div></div>${DIAS.map((d) => `<div class="cal-head">${d}</div>`).join("")}`;
  BLOQUES.forEach((b) => {
    grid += `<div class="cal-time">${b}</div>`;
    DIAS.forEach((_, di) => {
      const cls = state.clases.filter((c) => c.bloque === b && Number(c.dia) === di), full = cls.length >= 2;
      const add = cls.length < 2 ? `<div class="add-here" data-action="nuevaClaseEn" data-id="${di}|${b}">+</div>` : "";
      grid += `<div class="cal-cell ${full ? "full" : ""}">${cls.map(chipClase).join("")}${full ? '<div class="cap-note">cupo máx. (2)</div>' : add}</div>`;
    });
  });
  // Móvil: lista por día
  const rows = BLOQUES.map((b) => {
    const cls = state.clases.filter((c) => c.bloque === b && Number(c.dia) === calDay);
    if (!cls.length) return "";
    return `<div class="cal-row"><span class="cal-row-time">${b}</span><div class="cal-row-classes">${cls.map(chipClase).join("")}${cls.length >= 2 ? '<div class="cap-note" style="text-align:left">cupo máx. (2)</div>' : ""}</div></div>`;
  }).join("");

  return `
  <div class="msg warning" style="margin-bottom:16px">Las áreas de <b>acceso libre</b> (Pesas) están disponibles todo el horario y no se programan aquí. Este calendario es solo para <b>clases dirigidas</b>.</div>
  <div class="toolbar">
    <div class="section-note" style="margin:0">Un instructor dicta <b>1 clase por bloque</b> · máximo <b>2 simultáneas</b>. Toca una clase para editarla.</div>
    <button class="btn btn-primary" data-action="nuevaClase" style="margin-left:auto">+ Nueva clase</button>
  </div>
  <div class="card fade-in cal">
    <div class="cal-desktop"><div class="cal-grid">${grid}</div></div>
    <div class="cal-mobile">
      <div class="pills cal-days">${DIAS.map((d, i) => `<button class="pill ${calDay === i ? "active" : ""}" data-action="calDay" data-id="${i}">${d}</button>`).join("")}</div>
      <div class="cal-day-list">${rows || '<div class="cal-empty">Sin clases programadas este día.</div>'}</div>
    </div>
  </div>`;
}
function formClase() {
  return [
    { key: "areaId", label: "Clase dirigida", type: "select", required: true, placeholder: "Selecciona…", options: state.servicios.filter((s) => s.tipo === "DIRIGIDA").map((s) => ({ value: s.id, label: s.nombre })) },
    { key: "instructorId", label: "Instructor", type: "select", required: true, placeholder: "Selecciona…", options: instructores().map((u) => ({ value: u.id, label: u.nombre })) },
    { key: "dia", label: "Día", type: "select", required: true, options: DIAS.map((d, i) => ({ value: i, label: d })) },
    { key: "bloque", label: "Bloque horario", type: "select", required: true, options: BLOQUES.map((b) => ({ value: b, label: b })) },
  ];
}
function validarClase(v, id) {
  const dia = Number(v.dia);
  if (state.clases.find((c) => c.id !== id && Number(c.dia) === dia && c.bloque === v.bloque && c.instructorId === v.instructorId)) return { error: "Ese instructor ya tiene una clase en ese bloque." };
  if (state.clases.filter((c) => c.id !== id && Number(c.dia) === dia && c.bloque === v.bloque).length >= 2) return { error: "Ya hay 2 clases simultáneas en ese horario (tope del gimnasio)." };
  return null;
}

function vPagos() {
  const hoy = state.pagos.filter((p) => p.fecha === todayISO());
  const total = hoy.reduce((s, p) => s + Number(p.usd), 0), prom = hoy.length ? total / hoy.length : 0;
  return `
  <div class="toolbar"><div class="section-note" style="margin:0">Registra pagos asociados a un cliente y su plan.</div>
    <button class="btn btn-primary" data-action="nuevoPago" style="margin-left:auto">+ Registrar pago</button></div>
  <div class="grid cols-3" data-stagger style="margin-bottom:20px">
    ${stat("Total recaudado hoy", "$" + total.toFixed(0), "Bs " + bs(total), "pagos", "tint-y")}
    ${stat("Pagos procesados", hoy.length, "transacciones", "dashboard", "tint-b")}
    ${stat("Ticket promedio", "$" + prom.toFixed(1), "por pago", "planes", "tint-c")}
  </div>
  <div class="card fade-in"><h3>Movimientos de hoy</h3>${tablaPagos(hoy, true)}</div>`;
}
function tablaPagos(rows, withActions) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Cliente</th><th>Plan</th><th>Monto</th><th>Método</th><th>Hora</th>${withActions ? "<th></th>" : ""}</tr></thead>
    <tbody>${rows.map((p, i) => { const c = usuario(p.clienteId);
      return `<tr>
        <td data-label="Cliente"><div class="cell-name"><div class="av ${i % 3 === 1 ? "o" : i % 3 === 2 ? "n" : ""}">${initials(c?.nombre)}</div><b>${c?.nombre || "—"}</b></div></td>
        <td data-label="Plan">${planLabel(p.planId)}</td>
        <td data-label="Monto"><span class="usd">$${Number(p.usd).toFixed(2)}</span><div class="bs">Bs ${bs(Number(p.usd))}</div></td>
        <td data-label="Método">${p.metodo}</td><td data-label="Hora">${p.hora}</td>
        ${withActions ? `<td data-label="">${actBtns("editarPago", "eliminarPago", p.id)}</td>` : ""}
      </tr>`; }).join("") || `<tr><td style="text-align:center;color:var(--muted)">Sin pagos.</td></tr>`}
    </tbody></table></div>`;
}
function formPago() {
  return [
    { key: "clienteId", label: "Cliente", type: "select", required: true, placeholder: "Selecciona…", options: clientes().map((c) => ({ value: c.id, label: c.nombre })) },
    { key: "planId", label: "Plan", type: "select", required: true, placeholder: "Selecciona…", options: planOpts() },
    { key: "usd", label: "Monto (USD)", type: "number", required: true, step: "0.5" },
    { key: "metodo", label: "Método de pago", type: "select", required: true, options: METODOS.map((m) => ({ value: m, label: m })) },
  ];
}

/* ---- REPORTES ---- */
function barsHTML(serie) {
  const max = Math.max(...serie.map((s) => s.val), 1);
  return `<div class="bars">${serie.map((s) => `<div class="bar ${s.val === max && max > 0 ? "peak" : ""}"><div class="val">$${Math.round(s.val)}</div><div class="col" style="height:${s.val / max * 100}%"></div><div class="lbl">${s.lbl}</div></div>`).join("")}</div>`;
}
function breakTable(rows) {
  return `<div class="table-wrap"><table><thead><tr><th>Concepto</th><th>Pagos</th><th>Total</th></tr></thead>
    <tbody>${rows.map(([c, n, t]) => `<tr><td data-label="Concepto">${c}</td><td data-label="Pagos">${n}</td><td data-label="Total"><span class="usd">$${t.toFixed(2)}</span><div class="bs">Bs ${bs(t)}</div></td></tr>`).join("") || `<tr><td style="text-align:center;color:var(--muted)">Sin datos.</td></tr>`}</tbody></table></div>`;
}
function vReportes() {
  const dias = { dia: 1, semana: 7, mes: 30 }[repPeriod];
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (dias - 1));
  const rango = state.pagos.filter((p) => new Date(p.fecha + "T00:00:00") >= start);
  const total = rango.reduce((s, p) => s + Number(p.usd), 0), prom = rango.length ? total / rango.length : 0;

  let serie, chartTitle;
  if (repPeriod === "dia") {
    serie = METODOS.map((m) => ({ lbl: ABREV[m], val: rango.filter((p) => p.metodo === m).reduce((s, p) => s + Number(p.usd), 0) }));
    chartTitle = "Ingresos por método (hoy)";
  } else if (repPeriod === "semana") {
    serie = lastNDays(7).map((d) => ({ lbl: DIA_CORTO[d.getDay()], val: rango.filter((p) => p.fecha === isoDate(d)).reduce((s, p) => s + Number(p.usd), 0) }));
    chartTitle = "Ingresos por día (últimos 7 días)";
  } else {
    const buckets = [0, 0, 0, 0, 0];
    rango.forEach((p) => { const da = Math.floor((Date.now() - new Date(p.fecha + "T00:00:00")) / 86400000); buckets[4 - Math.min(4, Math.floor(da / 7))] += Number(p.usd); });
    serie = buckets.map((val, i) => ({ lbl: i === 4 ? "Esta sem." : "Sem -" + (4 - i), val }));
    chartTitle = "Ingresos por semana (últimos 30 días)";
  }
  const porMetodo = METODOS.map((m) => [m, rango.filter((p) => p.metodo === m).length, rango.filter((p) => p.metodo === m).reduce((s, p) => s + Number(p.usd), 0)]).filter((r) => r[1] > 0);
  const porArea = state.servicios.map((s) => { const ps = rango.filter((p) => planById(p.planId)?.areaId === s.id); return [s.nombre, ps.length, ps.reduce((a, p) => a + Number(p.usd), 0)]; }).filter((r) => r[1] > 0);
  const pills = [["dia", "Día"], ["semana", "Semana"], ["mes", "Mes"]];

  return `
  <div class="toolbar"><div class="pills">${pills.map(([v, l]) => `<button class="pill ${repPeriod === v ? "active" : ""}" data-action="repPeriodo" data-id="${v}">${l}</button>`).join("")}</div></div>
  <div class="grid cols-3" data-stagger style="margin-bottom:20px">
    ${stat("Total recaudado", "$" + total.toFixed(0), "Bs " + bs(total), "pagos", "tint-y")}
    ${stat("Pagos", rango.length, "en el período", "dashboard", "tint-b")}
    ${stat("Ticket promedio", "$" + prom.toFixed(1), "por pago", "planes", "tint-c")}
  </div>
  <div class="card fade-in"><h3>${chartTitle}</h3>${barsHTML(serie)}</div>
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
    <div class="card fade-in"><h3>Por método de pago</h3>${breakTable(porMetodo)}</div>
    <div class="card fade-in"><h3>Por área</h3>${breakTable(porArea)}</div>
  </div>`;
}

const VIEWS = { dashboard: vDashboard, usuarios: vUsuarios, clientes: vClientes, asistencia: vAsistencia, servicios: vServicios, planes: vPlanes, horarios: vHorarios, pagos: vPagos, reportes: vReportes };

/* =====================================================================
   HANDLERS
   ===================================================================== */
const handlers = {
  filtroUsuario: (v) => { userFilter = v; rerender(); },
  calDay: (v) => { calDay = Number(v); rerender(); },
  repPeriodo: (v) => { repPeriod = v; rerender(); },

  nuevoUsuario: () => openModal({ title: "Nuevo usuario", fields: formUsuario, values: { rol: "CLIENTE" }, onSave: (v) => {
    if (v.rol === "CLIENTE" && !v.estado) v.estado = "activo";
    state.usuarios.push({ id: uid(), ...v }); save(); rerender();
  }}),
  editarUsuario: (id) => { const u = usuario(id); openModal({ title: "Editar usuario", fields: formUsuario, values: { ...u }, onSave: (v) => { Object.assign(u, v); save(); rerender(); }, onDelete: () => handlers.eliminarUsuario(id) }); },
  eliminarUsuario: (id) => {
    const u = usuario(id);
    if (u.rol === "INSTRUCTOR" && state.clases.some((c) => c.instructorId === id)) return alert("No se puede eliminar: el instructor tiene clases asignadas.");
    if (!confirm(`¿Eliminar a ${u.nombre}?`)) return;
    state.usuarios = state.usuarios.filter((x) => x.id !== id);
    state.pagos = state.pagos.filter((p) => p.clienteId !== id);
    state.asistencias = state.asistencias.filter((a) => a.clienteId !== id);
    save(); rerender();
  },

  nuevoCliente: () => openModal({ title: "Nuevo cliente", fields: formCliente(), values: { estado: "activo" }, onSave: (v) => { state.usuarios.push({ id: uid(), rol: "CLIENTE", ...v }); save(); rerender(); } }),
  editarCliente: (id) => { const c = usuario(id); openModal({ title: "Editar cliente", fields: formCliente(), values: { ...c }, onSave: (v) => { Object.assign(c, v); save(); rerender(); }, onDelete: () => handlers.eliminarUsuario(id) }); },

  nuevoServicio: () => openModal({ title: "Nueva área de servicio", fields: formServicio(), values: { tipo: "DIRIGIDA" }, onSave: (v) => { state.servicios.push({ id: uid(), ...v }); save(); rerender(); } }),
  editarServicio: (id) => { const s = servicio(id); openModal({ title: "Editar área", fields: formServicio(), values: { ...s }, onSave: (v) => { Object.assign(s, v); save(); rerender(); }, onDelete: () => handlers.eliminarServicio(id) }); },
  eliminarServicio: (id) => {
    if (state.planes.some((p) => p.areaId === id)) return alert("No se puede eliminar: el área tiene planes asociados.");
    if (state.clases.some((c) => c.areaId === id)) return alert("No se puede eliminar: el área tiene clases en la agenda.");
    if (!confirm("¿Eliminar esta área?")) return; state.servicios = state.servicios.filter((x) => x.id !== id); save(); rerender();
  },

  nuevoPlan: () => openModal({ title: "Nuevo plan", fields: formPlan(), onSave: (v) => { state.planes.push({ id: uid(), areaId: v.areaId, duracion: v.duracion, usd: Number(v.usd) }); save(); rerender(); } }),
  editarPlan: (id) => { const p = planById(id); openModal({ title: "Editar plan", fields: formPlan(), values: { ...p }, onSave: (v) => { Object.assign(p, { areaId: v.areaId, duracion: v.duracion, usd: Number(v.usd) }); save(); rerender(); }, onDelete: () => handlers.eliminarPlan(id) }); },
  eliminarPlan: (id) => { if (!confirm("¿Eliminar este plan?")) return; state.planes = state.planes.filter((x) => x.id !== id); save(); rerender(); },

  nuevaClase: () => openModal({ title: "Nueva clase", fields: formClase(), onSave: (v) => { const e = validarClase(v, null); if (e) return e; state.clases.push({ id: uid(), areaId: v.areaId, instructorId: v.instructorId, dia: Number(v.dia), bloque: v.bloque }); save(); rerender(); } }),
  nuevaClaseEn: (data) => { const [dia, bloque] = data.split("|"); openModal({ title: "Nueva clase", fields: formClase(), values: { dia, bloque }, onSave: (v) => { const e = validarClase(v, null); if (e) return e; state.clases.push({ id: uid(), areaId: v.areaId, instructorId: v.instructorId, dia: Number(v.dia), bloque: v.bloque }); save(); rerender(); } }); },
  editarClase: (id) => { const c = state.clases.find((x) => x.id === id); openModal({ title: "Editar clase", fields: formClase(), values: { ...c }, onSave: (v) => { const e = validarClase(v, id); if (e) return e; Object.assign(c, { areaId: v.areaId, instructorId: v.instructorId, dia: Number(v.dia), bloque: v.bloque }); save(); rerender(); }, onDelete: () => { if (!confirm("¿Eliminar esta clase?")) return; state.clases = state.clases.filter((x) => x.id !== id); save(); rerender(); } }); },

  nuevoPago: () => openModal({ title: "Registrar pago", fields: formPago(), onSave: (v) => { state.pagos.unshift({ id: uid(), clienteId: v.clienteId, planId: v.planId, usd: Number(v.usd), metodo: v.metodo, hora: nowTime(), fecha: todayISO() }); save(); rerender(); } }),
  editarPago: (id) => { const p = state.pagos.find((x) => x.id === id); openModal({ title: "Editar pago", fields: formPago(), values: { ...p }, onSave: (v) => { Object.assign(p, { clienteId: v.clienteId, planId: v.planId, usd: Number(v.usd), metodo: v.metodo }); save(); rerender(); }, onDelete: () => { if (!confirm("¿Eliminar este pago?")) return; state.pagos = state.pagos.filter((x) => x.id !== id); save(); rerender(); } }); },
  eliminarPago: (id) => { if (!confirm("¿Eliminar este pago?")) return; state.pagos = state.pagos.filter((x) => x.id !== id); save(); rerender(); },

  marcarEntrada: () => {
    const inp = $("#cedulaInput"), raw = inp ? inp.value : "", ced = normCed(raw);
    if (!ced) { asistFeedback = { ok: false, text: "Ingresa una cédula para marcar la entrada." }; return rerender(); }
    const cli = clientes().find((c) => normCed(c.cedula) === ced);
    if (!cli) { asistFeedback = { ok: false, text: `No se encontró un cliente con la cédula "${raw}".` }; return rerender(); }
    const t = nowTime();
    state.asistencias.push({ id: uid(), clienteId: cli.id, entrada: t });
    save();
    asistFeedback = { ok: true, text: `Entrada registrada: ${cli.nombre} · ${t}` };
    rerender();
  },
  eliminarAsistencia: (id) => { if (!confirm("¿Eliminar este registro?")) return; state.asistencias = state.asistencias.filter((x) => x.id !== id); save(); rerender(); },
};

/* =====================================================================
   ROUTER · LOGIN · INIT
   ===================================================================== */
function go(id) {
  current = id;
  if (id !== "asistencia") asistFeedback = null;
  const page = PAGES.find((p) => p.id === id);
  $("#pageTitle").textContent = page.label;
  $("#pageSub").textContent = page.sub();
  $("#view").innerHTML = VIEWS[id]();
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function init() {
  state = loadState();
  $("#bcv").textContent = Number(state.bcv).toFixed(2);
  $("#nav").innerHTML = PAGES.map((p) => `<button data-id="${p.id}">${ICO(p.id)} ${p.label}</button>`).join("");
  document.querySelectorAll("#nav button").forEach((b) => b.addEventListener("click", () => go(b.dataset.id)));
  $("#view").addEventListener("click", (e) => { const btn = e.target.closest("[data-action]"); if (!btn) return; const fn = handlers[btn.dataset.action]; if (fn) fn(btn.dataset.id); });
  $("#view").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "cedulaInput") { e.preventDefault(); handlers.marcarEntrada(); } });
  $("#resetBtn").addEventListener("click", resetData);
  $("#logoutBtn").addEventListener("click", logout);
  go("dashboard");
}

function showApp() { $("#login").hidden = true; $("#appRoot").hidden = false; if (!booted) { booted = true; init(); } }
function logout() { sessionStorage.removeItem(AUTH); $("#appRoot").hidden = true; $("#login").hidden = false; }
function boot() {
  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#loginUser").value.trim() === CREDS.user && $("#loginPass").value === CREDS.pass) { sessionStorage.setItem(AUTH, "1"); $("#loginErr").hidden = true; showApp(); }
    else $("#loginErr").hidden = false;
  });
  if (sessionStorage.getItem(AUTH) === "1") showApp();
}
boot();
