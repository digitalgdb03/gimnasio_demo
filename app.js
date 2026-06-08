/* Zona Gym · Aplicación de gestión (vanilla JS). Estado persistido en el navegador. */

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
const TIPOS_DOC = ["V", "E", "J", "P"];
const ABREV = { "Pago Móvil": "P. Móvil", "Efectivo (USD)": "Efec. $", "Transferencia": "Transf.", "Punto de venta": "Punto", "Efectivo (Bs)": "Efec. Bs" };

let state, current = "dashboard", userFilter = "ALL", calDay = 0, repPeriod = "semana", booted = false, profileId = null, menuOpen = true;

/* ---------- Persistencia ---------- */
function loadState() { try { const s = localStorage.getItem(STORE); if (s) return JSON.parse(s); } catch (e) {} return seed(); }
function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }
function resetData() { if (!confirm("¿Restablecer a los datos iniciales? Se perderán los cambios.")) return; state = seed(); save(); $("#bcv").textContent = Number(state.bcv).toFixed(2); go("dashboard"); toast("Datos restablecidos."); }

/* ---------- Toasts (se ocultan a los 10s) ---------- */
function toast(text, type = "ok") {
  let host = document.getElementById("toasts");
  if (!host) { host = document.createElement("div"); host.id = "toasts"; document.body.appendChild(host); }
  const el = document.createElement("div");
  el.className = "toast " + (type === "error" ? "toast-error" : "toast-ok");
  el.textContent = text;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 400); }, 10000);
}

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
const membs = (c) => (c && c.membresias) ? c.membresias : [];
function planSummary(c) {
  const ms = membs(c);
  if (!ms.length) return '<span style="color:var(--muted)">Sin plan</span>';
  const names = ms.map((m) => { const pl = planById(m.planId); return pl ? (servicio(pl.areaId)?.nombre || "?") : "?"; });
  if (names.length === 1) return planLabel(ms[0].planId);
  return names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "");
}
const initials = (n) => (n || "").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const bs = (usd) => (usd * state.bcv).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const rerender = () => go(current);
const nowTime = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const normCed = (s) => (s || "").replace(/[^0-9a-zA-Z]/g, "").toLowerCase();
function lastNDays(n) { const t = new Date(); t.setHours(0, 0, 0, 0); const a = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(t); d.setDate(d.getDate() - i); a.push(d); } return a; }
const avClass = (i) => i % 3 === 1 ? "o" : i % 3 === 2 ? "n" : "";

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
  config: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
};
const ICO = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
const actBtns = (e, d, id) => `<div class="row-actions">
  <button class="icon-btn" title="Editar" data-action="${e}" data-id="${id}">${ICO("edit")}</button>
  <button class="icon-btn del" title="Eliminar" data-action="${d}" data-id="${id}">${ICO("del")}</button></div>`;
const actBtnsCli = (id) => `<div class="row-actions">
  <button class="icon-btn" title="Ver perfil" data-action="verPerfil" data-id="${id}">${ICO("eye")}</button>
  <button class="icon-btn" title="Editar" data-action="editarCliente" data-id="${id}">${ICO("edit")}</button>
  <button class="icon-btn del" title="Eliminar" data-action="eliminarUsuario" data-id="${id}">${ICO("del")}</button></div>`;

const PAGES = [
  { id: "dashboard", label: "Dashboard", sub: () => "Resumen del día · " + state.fecha },
  { id: "usuarios", label: "Usuarios", sub: () => "Clientes, instructores y empleados" },
  { id: "clientes", label: "Clientes", sub: () => "Membresías y estados" },
  { id: "asistencia", label: "Asistencia", sub: () => "Entrada y salida por cédula (acceso libre)" },
  { id: "servicios", label: "Servicios", sub: () => "Áreas que ofrece el gimnasio" },
  { id: "planes", label: "Planes", sub: () => "Tarifas por área y duración" },
  { id: "horarios", label: "Horarios", sub: () => "Calendario semanal de clases" },
  { id: "pagos", label: "Pagos", sub: () => "Movimientos del día" },
  { id: "reportes", label: "Reportes", sub: () => "Ingresos por día, semana y mes" },
  { id: "config", label: "Configuración", sub: () => "Tasa manual y ajustes" },
];

/* ===================== MODAL DINÁMICO ===================== */
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
  if (f.type === "plans") {
    const list = Array.isArray(val) ? val : [];
    const rows = list.map((m) => {
      const pl = planById(m.planId), s = pl ? servicio(pl.areaId) : null;
      return `<div class="mp-row">
        <span class="serv-color" style="background:${s?.color || "#404040"}"></span>
        <div class="mp-info"><b>${s?.nombre || "—"}</b><span>${pl ? pl.duracion + " · $" + pl.usd : ""}${m.vence ? " · vence " + m.vence : ""}</span></div>
        <button type="button" class="icon-btn del" title="Quitar" data-mp-del="${m.id}">${ICO("del")}</button>
      </div>`;
    }).join("") || `<div class="section-note" style="margin:0 0 10px">Sin planes aún. Agrega uno o varios abajo (puede tener varios servicios).</div>`;
    return `<div class="field" data-mp-root="${f.key}"><label>${f.label}</label>
      <div class="mp-list">${rows}</div>
      <div class="mp-add">
        <select data-mp-plan><option value="">Servicio / plan…</option>${state.planes.map((p) => `<option value="${p.id}">${planLabel(p.id)} ($${p.usd})</option>`).join("")}</select>
        <input data-mp-vence placeholder="Vence (dd/mm/aaaa)">
        <button type="button" class="btn btn-ghost" data-mp-add>+ Agregar plan</button>
      </div></div>`;
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
    flds.filter((f) => f.type === "plans").forEach((f) => {
      if (!Array.isArray(cur[f.key])) cur[f.key] = Array.isArray(values[f.key]) ? values[f.key].map((m) => ({ ...m })) : [];
      const root = body.querySelector(`[data-mp-root="${f.key}"]`); if (!root) return;
      root.querySelectorAll("[data-mp-del]").forEach((btn) => btn.onclick = () => { collect(); cur[f.key] = cur[f.key].filter((m) => m.id !== btn.dataset.mpDel); renderBody(); });
      const addBtn = root.querySelector("[data-mp-add]");
      if (addBtn) addBtn.onclick = () => {
        const sel = root.querySelector("[data-mp-plan]"), ven = root.querySelector("[data-mp-vence]");
        if (!sel.value) return toast("Selecciona un servicio / plan para agregar.", "error");
        collect(); cur[f.key] = [...cur[f.key], { id: uid(), planId: sel.value, vence: (ven.value || "").trim() }]; renderBody();
      };
    });
  }
  renderBody();
  wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
  wrap.querySelector("[data-x=cancel]").onclick = close;
  if (onDelete) wrap.querySelector("[data-x=del]").onclick = () => { close(); onDelete(); };
  wrap.querySelector("[data-x=save]").onclick = () => {
    collect();
    const flds = buildFields(cur), vals = {}; let ok = true;
    flds.forEach((f) => {
      if (f.type === "plans") { vals[f.key] = Array.isArray(cur[f.key]) ? cur[f.key] : []; return; }
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

/* ===================== VISTAS ===================== */
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
  const enGym = state.asistencias.filter((a) => !a.salida).length;
  return `
  <div class="grid cols-4" data-stagger>
    ${stat("Ingresos de hoy", "$" + ingresos.toFixed(0), "Bs " + bs(ingresos), "pagos", "tint-y")}
    ${stat("En el gimnasio ahora", enGym, "clientes presentes", "asistencia", "tint-o")}
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
        <td data-label="Nombre"><div class="cell-name"><div class="av ${avClass(i)}">${initials(u.nombre)}</div><b>${u.nombre}</b></div></td>
        <td data-label="Cédula">${u.cedula || "—"}</td>
        <td data-label="Correo">${u.email || "—"}</td>
        <td data-label="Rol"><span class="role-badge role-${u.rol}">${cap(u.rol.toLowerCase())}</span></td>
        <td data-label="Detalle">${u.detalle || (u.rol === "CLIENTE" ? planSummary(u) : "—")}</td>
        <td data-label="Teléfono">${u.telefono || "—"}</td>
        <td data-label="">${actBtns("editarUsuario", "eliminarUsuario", u.id)}</td>
      </tr>`).join("") || `<tr><td style="text-align:center;color:var(--muted)">Sin usuarios.</td></tr>`}
    </tbody></table></div></div>`;
}
function formUsuario(v = {}, isNew = false) {
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
  else {
    f.push({ key: "estado", label: "Estado", type: "select", options: ESTADOS });
    f.push({ key: "membresias", label: "Planes / servicios suscritos", type: "plans" });
    f.push({ key: "salud", label: "Datos de salud (opcional)", placeholder: "Lesiones, condiciones médicas…" }, { key: "emergencia", label: "Contacto de emergencia (opcional)", placeholder: "Nombre y teléfono" });
  }
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
    <thead><tr><th>Cliente</th><th>Planes</th><th>Estado</th><th>Teléfono</th><th></th></tr></thead>
    <tbody>${lista.map((c, i) => `
      <tr>
        <td data-label="Cliente"><div class="cell-name"><div class="av ${avClass(i)}">${initials(c.nombre)}</div><div><b>${c.nombre}</b><span>${c.cedula || ""}</span></div></div></td>
        <td data-label="Planes">${planSummary(c)}</td>
        <td data-label="Estado"><span class="badge ${c.estado}">${cap(c.estado || "activo")}</span></td>
        <td data-label="Teléfono">${c.telefono || "—"}</td>
        <td data-label="">${actBtnsCli(c.id)}</td>
      </tr>`).join("") || `<tr><td style="text-align:center;color:var(--muted)">Sin clientes.</td></tr>`}
    </tbody></table></div></div>`;
}
function formCliente(isNew = false) {
  const f = [
    { key: "nombre", label: "Nombre completo", required: true },
    { key: "cedula", label: "Cédula", required: true, placeholder: "V-00.000.000" },
    { key: "email", label: "Correo electrónico", type: "email", placeholder: "correo@ejemplo.com" },
    { key: "telefono", label: "Teléfono (WhatsApp)", type: "tel" },
    { key: "estado", label: "Estado", type: "select", required: true, options: ESTADOS },
    { key: "membresias", label: "Planes / servicios suscritos", type: "plans" },
    { key: "salud", label: "Datos de salud (opcional)", placeholder: "Lesiones, condiciones médicas…" },
    { key: "emergencia", label: "Contacto de emergencia (opcional)", placeholder: "Nombre y teléfono" },
  ];
  return f;
}

/* ----- Perfil del cliente ----- */
function vPerfil(id) {
  const c = usuario(id);
  if (!c) return `<div class="card fade-in"><p>Cliente no encontrado.</p><button class="btn btn-ghost" data-action="volverClientes">← Volver</button></div>`;
  const ms = membs(c);
  const pagosC = state.pagos.filter((p) => p.clienteId === id);
  const totalPagado = pagosC.reduce((s, p) => s + Number(p.usd), 0);
  const asisC = state.asistencias.filter((a) => a.clienteId === id).length;
  return `
  <div class="toolbar">
    <button class="btn btn-ghost" data-action="volverClientes">← Volver</button>
    <div style="margin-left:auto;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-ghost" data-action="editarCliente" data-id="${id}">Editar datos</button>
      <button class="btn btn-primary" data-action="agregarPlan" data-id="${id}">+ Agregar plan</button>
    </div>
  </div>
  <div class="profile-head card fade-in">
    <div class="av-lg">${initials(c.nombre)}</div>
    <div><h2>${c.nombre}</h2><div class="profile-meta"><span class="badge ${c.estado}">${cap(c.estado || "activo")}</span> · ${c.cedula || "—"}</div></div>
  </div>
  <div class="grid cols-3" data-stagger style="margin:20px 0">
    ${stat("Planes contratados", ms.length, "servicios activos", "planes", "tint-y")}
    ${stat("Total pagado", "$" + totalPagado.toFixed(0), "Bs " + bs(totalPagado), "pagos", "tint-b")}
    ${stat("Asistencias", asisC, "registros", "asistencia", "tint-o")}
  </div>
  <div class="grid cols-2" style="align-items:start">
    <div class="card fade-in"><h3>Datos personales</h3>
      <dl class="data-list">
        <div><dt>Cédula</dt><dd>${c.cedula || "—"}</dd></div>
        <div><dt>Correo</dt><dd>${c.email || "—"}</dd></div>
        <div><dt>Teléfono</dt><dd>${c.telefono || "—"}</dd></div>
        <div><dt>Estado</dt><dd>${cap(c.estado || "activo")}</dd></div>
        <div><dt>Salud</dt><dd>${c.salud || "—"}</dd></div>
        <div><dt>Emergencia</dt><dd>${c.emergencia || "—"}</dd></div>
      </dl></div>
    <div class="card fade-in"><h3>Planes / servicios</h3>
      ${ms.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Servicio</th><th>Plan</th><th>Vence</th><th></th></tr></thead>
        <tbody>${ms.map((m) => { const pl = planById(m.planId), s = pl ? servicio(pl.areaId) : null; return `<tr>
          <td data-label="Servicio"><span class="serv-color" style="background:${s?.color || "#404040"}"></span>${s?.nombre || "—"}</td>
          <td data-label="Plan">${pl ? pl.duracion + " · $" + pl.usd : "—"}</td>
          <td data-label="Vence">${m.vence || "—"}</td>
          <td data-label=""><button class="icon-btn del" title="Quitar" data-action="quitarPlan" data-id="${id}|${m.id}">${ICO("del")}</button></td>
        </tr>`; }).join("")}</tbody></table></div>`
        : `<div class="section-note">Sin planes. Usa “Agregar plan” para inscribirlo en Pesas, Boxeo, etc.</div>`}
    </div>
  </div>
  <div class="card fade-in" style="margin-top:20px"><h3>Historial de pagos</h3>${tablaPagos(pagosC.slice(0, 10), false)}</div>`;
}
function formMembership() {
  return [
    { key: "planId", label: "Plan / servicio", type: "select", required: true, placeholder: "Selecciona…", options: planOpts() },
    { key: "vence", label: "Vence", placeholder: "dd/mm/aaaa" },
  ];
}

function vAsistencia() {
  const hoy = state.asistencias;
  const enGym = hoy.filter((a) => !a.salida);
  const distintos = new Set(hoy.map((a) => a.clienteId)).size;
  return `
  <div class="toolbar">
    <div class="doc-entry">
      <select id="tipoDoc" title="Tipo de documento">${TIPOS_DOC.map((t) => `<option value="${t}">${t}-</option>`).join("")}</select>
      <input id="cedulaInput" placeholder="Número de cédula (ej: 25.481.230)" autocomplete="off" autofocus>
      <button class="btn btn-primary" data-action="marcarEntrada">Marcar entrada</button>
    </div>
  </div>
  <div class="grid cols-3" data-stagger style="margin-bottom:20px">
    ${stat("En el gimnasio ahora", enGym.length, "clientes presentes", "asistencia", "tint-o")}
    ${stat("Asistencias de hoy", hoy.length, "entradas registradas", "clientes", "tint-b")}
    ${stat("Clientes distintos", distintos, "personas hoy", "dashboard", "tint-c")}
  </div>
  <div class="card fade-in"><h3>Asistencia de hoy</h3><div class="table-wrap"><table>
    <thead><tr><th>Cliente</th><th>Cédula</th><th>Entrada</th><th>Salida</th><th>Estado</th><th></th></tr></thead>
    <tbody>${hoy.slice().reverse().map((a, i) => {
      const c = usuario(a.clienteId), dentro = !a.salida;
      return `<tr>
        <td data-label="Cliente"><div class="cell-name"><div class="av ${avClass(i)}">${initials(c?.nombre)}</div><b>${c?.nombre || "—"}</b></div></td>
        <td data-label="Cédula">${c?.cedula || "—"}</td>
        <td data-label="Entrada">${a.entrada}</td>
        <td data-label="Salida">${a.salida || "—"}</td>
        <td data-label="Estado">${dentro ? '<span class="badge activo">En el gimnasio</span>' : '<span class="badge congelado">Se retiró</span>'}</td>
        <td data-label=""><div class="row-actions">${dentro ? `<button class="btn btn-ghost" style="padding:6px 12px" data-action="registrarSalida" data-id="${a.id}">Salida</button>` : ""}<button class="icon-btn del" data-action="eliminarAsistencia" data-id="${a.id}">${ICO("del")}</button></div></td>
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
  let grid = `<div></div>${DIAS.map((d) => `<div class="cal-head">${d}</div>`).join("")}`;
  BLOQUES.forEach((b) => {
    grid += `<div class="cal-time">${b}</div>`;
    DIAS.forEach((_, di) => {
      const cls = state.clases.filter((c) => c.bloque === b && Number(c.dia) === di), full = cls.length >= 2;
      const add = cls.length < 2 ? `<div class="add-here" data-action="nuevaClaseEn" data-id="${di}|${b}">+</div>` : "";
      grid += `<div class="cal-cell ${full ? "full" : ""}">${cls.map(chipClase).join("")}${full ? '<div class="cap-note">cupo máx. (2)</div>' : add}</div>`;
    });
  });
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
        <td data-label="Cliente"><div class="cell-name"><div class="av ${avClass(i)}">${initials(c?.nombre)}</div><b>${c?.nombre || "—"}</b></div></td>
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

/* ----- Reportes ----- */
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
  <div class="print-header"><img src="assets/zona_gym.png" alt=""><div><b>Zona Gym</b><span>Reporte de ingresos · ${chartTitle}</span></div></div>
  <div class="toolbar">
    <div class="pills">${pills.map(([v, l]) => `<button class="pill ${repPeriod === v ? "active" : ""}" data-action="repPeriodo" data-id="${v}">${l}</button>`).join("")}</div>
    <button class="btn btn-primary" data-action="descargarPDF" style="margin-left:auto">⤓ Descargar PDF</button>
  </div>
  <div class="grid cols-3" data-stagger style="margin-bottom:20px">
    ${stat("Total recaudado", "$" + total.toFixed(0), "Bs " + bs(total), "pagos", "tint-y")}
    ${stat("Pagos", rango.length, "en el período", "dashboard", "tint-b")}
    ${stat("Ticket promedio", "$" + prom.toFixed(1), "por pago", "planes", "tint-c")}
  </div>
  <div class="card fade-in"><h3>${chartTitle}</h3>${barsHTML(serie)}</div>
  <div class="rep-break">
    <div class="card fade-in"><h3>Por método de pago</h3>${breakTable(porMetodo)}</div>
    <div class="card fade-in"><h3>Por área</h3>${breakTable(porArea)}</div>
  </div>`;
}

/* ----- Configuración ----- */
function vConfig() {
  return `
  <div class="grid cols-2" style="align-items:start">
    <div class="card fade-in"><h3>Tasa del dólar (manual)</h3>
      <p class="section-note">Si no hay internet, ajusta aquí la tasa BCV manualmente. Se aplica a todos los montos en bolívares.</p>
      <div class="field"><label>Tasa actual (Bs por USD)</label><input id="tasaInput" type="number" step="0.01" value="${state.bcv}"></div>
      <button class="btn btn-primary" data-action="guardarTasa">Guardar tasa</button>
    </div>
    <div class="card fade-in"><h3>Datos del gimnasio</h3>
      <div class="field"><label>Nombre</label><input id="gymInput" value="${state.gym}"></div>
      <button class="btn btn-primary" data-action="guardarGym">Guardar</button>
      <hr style="border:0;border-top:1px solid var(--line);margin:20px 0">
      <p class="section-note">Restablece todos los datos a los valores iniciales.</p>
      <button class="btn btn-ghost" data-action="restablecerDatos">↺ Restablecer datos</button>
    </div>
  </div>`;
}

const VIEWS = { dashboard: vDashboard, usuarios: vUsuarios, clientes: vClientes, perfil: () => vPerfil(profileId), asistencia: vAsistencia, servicios: vServicios, planes: vPlanes, horarios: vHorarios, pagos: vPagos, reportes: vReportes, config: vConfig };

/* ===================== HANDLERS ===================== */
const handlers = {
  filtroUsuario: (v) => { userFilter = v; rerender(); },
  calDay: (v) => { calDay = Number(v); rerender(); },
  repPeriodo: (v) => { repPeriod = v; rerender(); },
  descargarPDF: () => { window.print(); },

  nuevoUsuario: () => openModal({ title: "Nuevo usuario", fields: (v) => formUsuario(v, true), values: { rol: "CLIENTE" }, onSave: (v) => {
    const o = { id: uid(), ...v };
    if (o.rol === "CLIENTE") { if (!o.estado) o.estado = "activo"; o.membresias = Array.isArray(o.membresias) ? o.membresias : []; }
    else delete o.membresias;
    delete o.planId; delete o.vence;
    state.usuarios.push(o); save(); rerender(); toast("Usuario creado.");
  }}),
  editarUsuario: (id) => { const u = usuario(id); openModal({ title: "Editar usuario", fields: (v) => formUsuario(v, false), values: { ...u }, onSave: (v) => { delete v.planId; delete v.vence; if (v.rol !== "CLIENTE") delete v.membresias; Object.assign(u, v); save(); rerender(); toast("Usuario actualizado."); }, onDelete: () => handlers.eliminarUsuario(id) }); },
  eliminarUsuario: (id) => {
    const u = usuario(id);
    if (u.rol === "INSTRUCTOR" && state.clases.some((c) => c.instructorId === id)) return toast("No se puede eliminar: el instructor tiene clases asignadas.", "error");
    if (!confirm(`¿Eliminar a ${u.nombre}?`)) return;
    state.usuarios = state.usuarios.filter((x) => x.id !== id);
    state.pagos = state.pagos.filter((p) => p.clienteId !== id);
    state.asistencias = state.asistencias.filter((a) => a.clienteId !== id);
    save(); toast("Eliminado.");
    if (current === "perfil") go("clientes"); else rerender();
  },

  nuevoCliente: () => openModal({ title: "Nuevo cliente", fields: formCliente(true), values: { estado: "activo" }, onSave: (v) => {
    const o = { id: uid(), rol: "CLIENTE", ...v };
    o.membresias = Array.isArray(o.membresias) ? o.membresias : [];
    delete o.planId; delete o.vence;
    state.usuarios.push(o); save(); rerender(); toast("Cliente creado.");
  }}),
  editarCliente: (id) => { const c = usuario(id); openModal({ title: "Editar cliente", fields: formCliente(false), values: { ...c }, onSave: (v) => { delete v.planId; delete v.vence; if (!Array.isArray(v.membresias)) v.membresias = []; Object.assign(c, v); save(); rerender(); toast("Cliente actualizado."); }, onDelete: () => handlers.eliminarUsuario(id) }); },
  verPerfil: (id) => { profileId = id; go("perfil"); },
  volverClientes: () => go("clientes"),
  agregarPlan: (id) => openModal({ title: "Agregar plan al cliente", fields: formMembership(), onSave: (v) => { const c = usuario(id); if (!c.membresias) c.membresias = []; c.membresias.push({ id: uid(), planId: v.planId, vence: v.vence || "" }); save(); rerender(); toast("Plan agregado."); } }),
  quitarPlan: (data) => { const [cid, mid] = data.split("|"); const c = usuario(cid); if (!c) return; if (!confirm("¿Quitar este plan del cliente?")) return; c.membresias = membs(c).filter((m) => m.id !== mid); save(); rerender(); toast("Plan eliminado."); },

  nuevoServicio: () => openModal({ title: "Nueva área de servicio", fields: formServicio(), values: { tipo: "DIRIGIDA" }, onSave: (v) => { state.servicios.push({ id: uid(), ...v }); save(); rerender(); toast("Área creada."); } }),
  editarServicio: (id) => { const s = servicio(id); openModal({ title: "Editar área", fields: formServicio(), values: { ...s }, onSave: (v) => { Object.assign(s, v); save(); rerender(); toast("Área actualizada."); }, onDelete: () => handlers.eliminarServicio(id) }); },
  eliminarServicio: (id) => {
    if (state.planes.some((p) => p.areaId === id)) return toast("No se puede eliminar: el área tiene planes asociados.", "error");
    if (state.clases.some((c) => c.areaId === id)) return toast("No se puede eliminar: el área tiene clases en la agenda.", "error");
    if (!confirm("¿Eliminar esta área?")) return; state.servicios = state.servicios.filter((x) => x.id !== id); save(); rerender(); toast("Área eliminada.");
  },

  nuevoPlan: () => openModal({ title: "Nuevo plan", fields: formPlan(), onSave: (v) => { state.planes.push({ id: uid(), areaId: v.areaId, duracion: v.duracion, usd: Number(v.usd) }); save(); rerender(); toast("Plan creado."); } }),
  editarPlan: (id) => { const p = planById(id); openModal({ title: "Editar plan", fields: formPlan(), values: { ...p }, onSave: (v) => { Object.assign(p, { areaId: v.areaId, duracion: v.duracion, usd: Number(v.usd) }); save(); rerender(); toast("Plan actualizado."); }, onDelete: () => handlers.eliminarPlan(id) }); },
  eliminarPlan: (id) => { if (!confirm("¿Eliminar este plan?")) return; state.planes = state.planes.filter((x) => x.id !== id); save(); rerender(); toast("Plan eliminado."); },

  nuevaClase: () => openModal({ title: "Nueva clase", fields: formClase(), onSave: (v) => { const e = validarClase(v, null); if (e) return e; state.clases.push({ id: uid(), areaId: v.areaId, instructorId: v.instructorId, dia: Number(v.dia), bloque: v.bloque }); save(); rerender(); toast("Clase agregada."); } }),
  nuevaClaseEn: (data) => { const [dia, bloque] = data.split("|"); openModal({ title: "Nueva clase", fields: formClase(), values: { dia, bloque }, onSave: (v) => { const e = validarClase(v, null); if (e) return e; state.clases.push({ id: uid(), areaId: v.areaId, instructorId: v.instructorId, dia: Number(v.dia), bloque: v.bloque }); save(); rerender(); toast("Clase agregada."); } }); },
  editarClase: (id) => { const c = state.clases.find((x) => x.id === id); openModal({ title: "Editar clase", fields: formClase(), values: { ...c }, onSave: (v) => { const e = validarClase(v, id); if (e) return e; Object.assign(c, { areaId: v.areaId, instructorId: v.instructorId, dia: Number(v.dia), bloque: v.bloque }); save(); rerender(); toast("Clase actualizada."); }, onDelete: () => { if (!confirm("¿Eliminar esta clase?")) return; state.clases = state.clases.filter((x) => x.id !== id); save(); rerender(); toast("Clase eliminada."); } }); },

  nuevoPago: () => openModal({ title: "Registrar pago", fields: formPago(), onSave: (v) => { state.pagos.unshift({ id: uid(), clienteId: v.clienteId, planId: v.planId, usd: Number(v.usd), metodo: v.metodo, hora: nowTime(), fecha: todayISO() }); save(); rerender(); toast("Pago registrado."); } }),
  editarPago: (id) => { const p = state.pagos.find((x) => x.id === id); openModal({ title: "Editar pago", fields: formPago(), values: { ...p }, onSave: (v) => { Object.assign(p, { clienteId: v.clienteId, planId: v.planId, usd: Number(v.usd), metodo: v.metodo }); save(); rerender(); toast("Pago actualizado."); }, onDelete: () => { if (!confirm("¿Eliminar este pago?")) return; state.pagos = state.pagos.filter((x) => x.id !== id); save(); rerender(); toast("Pago eliminado."); } }); },
  eliminarPago: (id) => { if (!confirm("¿Eliminar este pago?")) return; state.pagos = state.pagos.filter((x) => x.id !== id); save(); rerender(); toast("Pago eliminado."); },

  marcarEntrada: () => {
    const inp = $("#cedulaInput"), tipo = $("#tipoDoc") ? $("#tipoDoc").value : "V", num = inp ? inp.value : "";
    if (!normCed(num)) { toast("Ingresa el número de cédula.", "error"); if (inp) inp.focus(); return; }
    const target = normCed(tipo + num);
    const cli = clientes().find((c) => normCed(c.cedula) === target);
    if (!cli) { toast(`No se encontró un cliente con la cédula ${tipo}-${num}.`, "error"); return; }
    state.asistencias.push({ id: uid(), clienteId: cli.id, entrada: nowTime(), salida: null }); save();
    toast(`Entrada registrada: ${cli.nombre}`); rerender();
  },
  registrarSalida: (id) => { const a = state.asistencias.find((x) => x.id === id); if (a) { a.salida = nowTime(); save(); toast("Salida registrada."); rerender(); } },
  eliminarAsistencia: (id) => { if (!confirm("¿Eliminar este registro?")) return; state.asistencias = state.asistencias.filter((x) => x.id !== id); save(); rerender(); toast("Registro eliminado."); },

  guardarTasa: () => { const v = parseFloat($("#tasaInput").value); if (!v || v <= 0) return toast("Ingresa una tasa válida.", "error"); state.bcv = v; save(); $("#bcv").textContent = v.toFixed(2); toast("Tasa actualizada a Bs " + v.toFixed(2)); rerender(); },
  guardarGym: () => { const v = $("#gymInput").value.trim(); if (!v) return toast("Ingresa un nombre.", "error"); state.gym = v; save(); toast("Nombre actualizado."); },
  restablecerDatos: () => resetData(),
  verCuenta: () => { const u = usuario("u_admin") || state.usuarios[0]; openModal({ title: "Mi perfil", fields: [{ key: "nombre", label: "Nombre", required: true }, { key: "email", label: "Correo", type: "email" }, { key: "telefono", label: "Teléfono", type: "tel" }], values: { ...u }, onSave: (v) => { Object.assign(u, v); save(); toast("Perfil actualizado."); } }); },
};

/* ===================== ROUTER · MENÚ · LOGIN ===================== */
function applyMenu() { const r = $("#appRoot"); if (!r) return; r.classList.toggle("menu-open", menuOpen); }
function toggleMenu() { menuOpen = !menuOpen; applyMenu(); }

function go(id) {
  current = id;
  const meta = PAGES.find((p) => p.id === id) || (id === "perfil" ? { label: "Perfil del cliente", sub: () => { const c = usuario(profileId); return c ? c.nombre : "—"; } } : { label: id, sub: () => "" });
  $("#pageTitle").textContent = meta.label;
  $("#pageSub").textContent = meta.sub();
  $("#view").innerHTML = VIEWS[id]();
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
  if (window.innerWidth <= 1080) { menuOpen = false; applyMenu(); }
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
  $("#menuToggle").addEventListener("click", toggleMenu);
  $("#backdrop").addEventListener("click", () => { menuOpen = false; applyMenu(); });
  $("#avatarBtn").addEventListener("click", (e) => { e.stopPropagation(); $("#userMenu").hidden = !$("#userMenu").hidden; });
  document.addEventListener("click", () => { const m = $("#userMenu"); if (m) m.hidden = true; });
  $("#userMenu").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; $("#userMenu").hidden = true; if (b.dataset.act === "perfil") handlers.verCuenta(); else if (b.dataset.act === "config") go("config"); else if (b.dataset.act === "logout") logout(); });
  menuOpen = window.innerWidth > 1080;
  applyMenu();
  go("dashboard");
}

function showApp() { $("#login").hidden = true; $("#appRoot").hidden = false; if (!booted) { booted = true; init(); } }
function logout() { sessionStorage.removeItem(AUTH); $("#appRoot").hidden = true; $("#login").hidden = false; }
function boot() {
  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#loginUser").value.trim() === CREDS.user && $("#loginPass").value === CREDS.pass) { sessionStorage.setItem(AUTH, "1"); showApp(); }
    else toast("Usuario o contraseña incorrectos.", "error");
  });
  if (sessionStorage.getItem(AUTH) === "1") showApp();
}
boot();
