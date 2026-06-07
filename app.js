/* Iron House · Demo interactiva (vanilla JS, sin backend)
   Estado en memoria persistido en localStorage. Mutaciones vía modales. */

const $ = (s, c = document) => c.querySelector(s);
const STORE = "ironhouse_demo_v2";
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const BLOQUES = ["6:00", "8:00", "10:00", "5:00 PM", "6:00 PM", "8:00 PM"];
const ROLES = [
  { value: "CLIENTE", label: "Cliente" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "EMPLEADO", label: "Empleado" },
];
const METODOS = ["Efectivo (USD)", "Efectivo (Bs)", "Pago Móvil", "Transferencia", "Punto de venta"];
const DURACIONES = ["Diaria", "Semanal", "Mensual"];

let state, current = "dashboard", userFilter = "ALL";

/* ---------- Persistencia ---------- */
function loadState() {
  try { const s = localStorage.getItem(STORE); if (s) return JSON.parse(s); } catch (e) {}
  return seed();
}
function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }
function resetDemo() {
  if (!confirm("¿Restablecer la demo a los datos de ejemplo? Se perderán tus cambios.")) return;
  state = seed(); save(); go(current);
}

/* ---------- Lookups / helpers ---------- */
const uid = () => "x" + Math.random().toString(36).slice(2, 9);
const servicio = (id) => state.servicios.find((s) => s.id === id);
const planById = (id) => state.planes.find((p) => p.id === id);
const usuario = (id) => state.usuarios.find((u) => u.id === id);
const clientes = () => state.usuarios.filter((u) => u.rol === "CLIENTE");
const instructores = () => state.usuarios.filter((u) => u.rol === "INSTRUCTOR");
const planLabel = (id) => { const p = planById(id); return p ? `${servicio(p.areaId)?.nombre || "?"} · ${p.duracion}` : "—"; };
const initials = (n) => (n || "").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const bs = (usd) => (usd * state.bcv).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const rerender = () => go(current);

const ICONS = {
  dashboard: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z"/>',
  usuarios: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  clientes: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  asistencia: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  servicios: '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
  planes: '<path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/>',
  horarios: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  pagos: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
};
const ICO = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
const actBtns = (editAction, delAction, id) =>
  `<div class="row-actions">
     <button class="icon-btn" title="Editar" data-action="${editAction}" data-id="${id}">${ICO("edit")}</button>
     <button class="icon-btn del" title="Eliminar" data-action="${delAction}" data-id="${id}">${ICO("del")}</button>
   </div>`;

const PAGES = [
  { id: "dashboard", label: "Dashboard", sub: () => "Resumen del día · " + state.fecha },
  { id: "usuarios", label: "Usuarios", sub: () => "Directorio de clientes, instructores y empleados" },
  { id: "clientes", label: "Clientes", sub: () => "Membresías y estados" },
  { id: "asistencia", label: "Asistencia", sub: () => "Registro de entradas y salidas (acceso libre)" },
  { id: "servicios", label: "Servicios", sub: () => "Áreas que ofrece el gimnasio" },
  { id: "planes", label: "Planes", sub: () => "Tarifas por área y duración" },
  { id: "horarios", label: "Horarios", sub: () => "Calendario semanal de clases" },
  { id: "pagos", label: "Pagos", sub: () => "Movimientos del día" },
];

/* =====================================================================
   MODAL / FORMULARIO GENÉRICO
   ===================================================================== */
function fieldHTML(f, val) {
  val = val == null ? "" : val;
  if (f.type === "select") {
    const opts = f.options.map((o) => `<option value="${o.value}" ${String(o.value) === String(val) ? "selected" : ""}>${o.label}</option>`).join("");
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
    <input type="${f.type || "text"}" name="${f.key}" value="${val}" ${f.placeholder ? `placeholder="${f.placeholder}"` : ""} ${f.step ? `step="${f.step}"` : ""}></div>`;
}

function openModal({ title, fields, values = {}, onSave, onDelete }) {
  const wrap = document.createElement("div");
  wrap.className = "modal-overlay";
  wrap.innerHTML = `<div class="modal" role="dialog">
      <h3 class="modal-title">${title}</h3>
      <div class="modal-err" hidden></div>
      <div class="modal-body">${fields.map((f) => fieldHTML(f, values[f.key])).join("")}</div>
      <div class="modal-actions">
        ${onDelete ? `<button class="btn btn-danger" data-x="del">Eliminar</button>` : ""}
        <button class="btn btn-ghost" data-x="cancel">Cancelar</button>
        <button class="btn btn-primary" data-x="save">Guardar</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const close = () => wrap.remove();
  const err = (m) => { const e = wrap.querySelector(".modal-err"); e.textContent = m; e.hidden = false; };

  wrap.querySelectorAll("[data-swatch]").forEach((g) => {
    g.querySelectorAll(".swatch").forEach((sw) => (sw.onclick = () => {
      g.querySelectorAll(".swatch").forEach((x) => x.classList.remove("sel"));
      sw.classList.add("sel");
      g.parentElement.querySelector("input[type=hidden]").value = sw.dataset.color;
    }));
  });

  wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
  wrap.querySelector("[data-x=cancel]").onclick = close;
  if (onDelete) wrap.querySelector("[data-x=del]").onclick = () => { close(); onDelete(); };
  wrap.querySelector("[data-x=save]").onclick = () => {
    const vals = {}; let ok = true;
    fields.forEach((f) => {
      const el = wrap.querySelector(`[name="${f.key}"]`);
      vals[f.key] = el.value.trim();
      if (f.required && !vals[f.key]) { ok = false; el.classList.add("invalid"); } else el.classList.remove("invalid");
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
  const ingresos = state.pagos.reduce((s, p) => s + Number(p.usd), 0);
  const pctA = Math.round(activos / total * 100), pctAM = Math.round((activos + morosos) / total * 100);
  const maxA = Math.max(...state.asistencia.map((a) => a.v), 1);

  const cntBy = (arr, key) => arr.reduce((m, x) => (m[x[key]] = (m[x[key]] || 0) + 1, m), {});
  const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0];
  const topArea = top(cntBy(state.clases, "areaId"));
  const topBloque = top(cntBy(state.clases, "bloque"));
  const servTop = topArea ? servicio(topArea[0])?.nombre : "—";
  const horaTop = topBloque ? topBloque[0] : "—";
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
      <div class="bars">${state.asistencia.map((a) => `
        <div class="bar ${a.h === "6p" ? "peak" : ""}"><div class="val">${a.v}</div>
        <div class="col" style="height:${a.v / maxA * 100}%"></div><div class="lbl">${a.h}</div></div>`).join("")}</div>
      <div class="section-note" style="margin:14px 0 0">Horario más concurrido: <b style="color:var(--azul)">${horaTop}</b> · Servicio top: <b style="color:var(--azul)">${servTop}</b></div>
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
  <div class="card fade-in" style="margin-top:20px"><h3>Últimos pagos</h3>${tablaPagos(state.pagos.slice(0, 4), false)}</div>`;
}

/* ---- USUARIOS (todos los roles) ---- */
function vUsuarios() {
  const filtros = [["ALL", "Todos"], ["CLIENTE", "Clientes"], ["INSTRUCTOR", "Instructores"], ["EMPLEADO", "Empleados"]];
  let lista = state.usuarios;
  if (userFilter !== "ALL") lista = lista.filter((u) => u.rol === userFilter);

  return `
  <div class="toolbar">
    <div class="pills">${filtros.map(([v, l]) => `<button class="pill ${userFilter === v ? "active" : ""}" data-action="filtroUsuario" data-id="${v}">${l}</button>`).join("")}</div>
    <button class="btn btn-primary" data-action="nuevoUsuario" style="margin-left:auto">+ Nuevo usuario</button>
  </div>
  <div class="card fade-in"><div class="table-wrap"><table>
    <thead><tr><th>Nombre</th><th>Cédula</th><th>Rol</th><th>Detalle</th><th>Teléfono</th><th></th></tr></thead>
    <tbody>${lista.map((u, i) => `
      <tr>
        <td><div class="cell-name"><div class="av ${i % 3 === 1 ? "o" : i % 3 === 2 ? "n" : ""}">${initials(u.nombre)}</div><b>${u.nombre}</b></div></td>
        <td>${u.cedula || "—"}</td>
        <td><span class="role-badge role-${u.rol}">${cap(u.rol.toLowerCase())}</span></td>
        <td>${u.detalle || (u.rol === "CLIENTE" ? planLabel(u.planId) : "—")}</td>
        <td>${u.telefono || "—"}</td>
        <td>${actBtns("editarUsuario", "eliminarUsuario", u.id)}</td>
      </tr>`).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--muted)">Sin usuarios en este filtro.</td></tr>`}
    </tbody></table></div></div>`;
}

function formUsuario(u) {
  return [
    { key: "nombre", label: "Nombre completo", required: true },
    { key: "cedula", label: "Cédula / ID", placeholder: "V-00.000.000" },
    { key: "telefono", label: "Teléfono (WhatsApp)", type: "tel", placeholder: "0414-0000000" },
    { key: "rol", label: "Rol", type: "select", required: true, options: ROLES },
    { key: "detalle", label: "Cargo / Especialidad" },
  ];
}

/* ---- CLIENTES (centrado en membresía) ---- */
function vClientes() {
  const lista = clientes();
  return `
  <div class="toolbar">
    <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input placeholder="Buscar cliente…"></div>
    <button class="btn btn-primary" data-action="nuevoCliente">+ Nuevo cliente</button>
  </div>
  <div class="card fade-in"><div class="table-wrap"><table>
    <thead><tr><th>Cliente</th><th>Plan</th><th>Estado</th><th>Vence</th><th>Teléfono</th><th></th></tr></thead>
    <tbody>${lista.map((c, i) => `
      <tr>
        <td><div class="cell-name"><div class="av ${i % 3 === 1 ? "o" : i % 3 === 2 ? "n" : ""}">${initials(c.nombre)}</div><div><b>${c.nombre}</b><span>${c.cedula || ""}</span></div></div></td>
        <td>${planLabel(c.planId)}</td>
        <td><span class="badge ${c.estado}">${cap(c.estado)}</span></td>
        <td>${c.vence || "—"}</td>
        <td>${c.telefono || "—"}</td>
        <td>${actBtns("editarCliente", "eliminarUsuario", c.id)}</td>
      </tr>`).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--muted)">Sin clientes.</td></tr>`}
    </tbody></table></div></div>`;
}

function formCliente() {
  return [
    { key: "nombre", label: "Nombre completo", required: true },
    { key: "cedula", label: "Cédula", placeholder: "V-00.000.000" },
    { key: "telefono", label: "Teléfono (WhatsApp)", type: "tel" },
    { key: "estado", label: "Estado", type: "select", required: true, options: [
      { value: "activo", label: "Activo" }, { value: "congelado", label: "Congelado" }, { value: "moroso", label: "Moroso" }] },
    { key: "planId", label: "Plan", type: "select", required: true,
      options: state.planes.map((p) => ({ value: p.id, label: planLabel(p.id) + " ($" + p.usd + ")" })) },
    { key: "vence", label: "Vence", placeholder: "dd/mm/aaaa" },
  ];
}

/* ---- SERVICIOS (áreas) ---- */
function vServicios() {
  return `
  <div class="toolbar"><div class="section-note" style="margin:0">Áreas dinámicas: agrega las que ofrezca el gimnasio (Pesas, Boxeo, Spinning…).</div>
    <button class="btn btn-primary" data-action="nuevoServicio" style="margin-left:auto">+ Nueva área</button></div>
  <div class="card fade-in"><div class="table-wrap"><table>
    <thead><tr><th>Área de servicio</th><th>Tipo</th><th>Planes</th><th>Agenda</th><th></th></tr></thead>
    <tbody>${state.servicios.map((s) => `
      <tr>
        <td><span class="serv-color" style="background:${s.color}"></span><b>${s.nombre}</b></td>
        <td>${s.tipo === "LIBRE"
              ? '<span class="role-badge role-EMPLEADO">Acceso libre</span>'
              : '<span class="role-badge role-INSTRUCTOR">Clase dirigida</span>'}</td>
        <td>${state.planes.filter((p) => p.areaId === s.id).length}</td>
        <td>${s.tipo === "LIBRE"
              ? '<span style="color:var(--muted)">Siempre disponible</span>'
              : state.clases.filter((c) => c.areaId === s.id).length + " clases"}</td>
        <td>${actBtns("editarServicio", "eliminarServicio", s.id)}</td>
      </tr>`).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--muted)">Sin áreas registradas.</td></tr>`}
    </tbody></table></div></div>`;
}

function formServicio() {
  return [
    { key: "nombre", label: "Nombre del área", required: true, placeholder: "Ej: Spinning" },
    { key: "tipo", label: "Tipo de área", type: "select", required: true, options: [
      { value: "LIBRE", label: "Acceso libre (siempre disponible)" },
      { value: "DIRIGIDA", label: "Clase dirigida (con horario e instructor)" }] },
    { key: "color", label: "Color de identificación", type: "color" },
  ];
}

/* ---- PLANES ---- */
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
            <button class="icon-btn del" data-action="eliminarPlan" data-id="${p.id}">${ICO("del")}</button>
          </div>
          <div class="dur">${p.duracion}</div>
          <div class="price"><small>$</small>${p.usd}</div>
          <div class="price-bs">≈ Bs ${bs(p.usd)}</div>
          <div class="feat">Acceso a ${s.nombre}</div>
          <div class="feat">${p.duracion === "Mensual" ? "Congelable hasta 7 días" : "Sin permanencia"}</div>
        </div>`).join("") || `<div class="section-note">Sin planes en esta área.</div>`}</div>
    </div>`).join("")}`;
}

function formPlan() {
  return [
    { key: "areaId", label: "Área de servicio", type: "select", required: true, placeholder: "Selecciona…",
      options: state.servicios.map((s) => ({ value: s.id, label: s.nombre })) },
    { key: "duracion", label: "Duración", type: "select", required: true,
      options: DURACIONES.map((d) => ({ value: d, label: d })) },
    { key: "usd", label: "Precio (USD)", type: "number", required: true, step: "0.5" },
  ];
}

/* ---- HORARIOS ---- */
function vHorarios() {
  let cells = "";
  BLOQUES.forEach((b) => {
    cells += `<div class="cal-time">${b}</div>`;
    DIAS.forEach((_, di) => {
      const cls = state.clases.filter((c) => c.bloque === b && Number(c.dia) === di);
      const full = cls.length >= 2;
      const chips = cls.map((c) => {
        const s = servicio(c.areaId), instr = usuario(c.instructorId);
        return `<div class="klass" style="background:${s?.color || "#404040"}" data-action="editarClase" data-id="${c.id}"><b>${s?.nombre || "?"}</b><span>${instr?.nombre.split(" ").slice(-1)[0] || ""}</span></div>`;
      }).join("");
      const add = cls.length < 2 ? `<div class="add-here" data-action="nuevaClaseEn" data-id="${di}|${b}">+</div>` : "";
      cells += `<div class="cal-cell ${full ? "full" : ""}">${chips}${full ? '<div class="cap-note">cupo máx. (2)</div>' : add}</div>`;
    });
  });
  return `
  <div class="msg warning" style="margin-bottom:16px">Las áreas de <b>acceso libre</b> (Pesas) están disponibles durante todo el horario del gimnasio y no se programan aquí. Este calendario es solo para <b>clases dirigidas</b>.</div>
  <div class="toolbar">
    <div class="section-note" style="margin:0">Un instructor solo dicta <b>1 clase por bloque</b> · máximo <b>2 clases simultáneas</b>. Toca una clase para editarla o el <b>+</b> para agregar.</div>
    <button class="btn btn-primary" data-action="nuevaClase" style="margin-left:auto">+ Nueva clase</button>
  </div>
  <div class="card fade-in cal"><div class="cal-grid">
    <div></div>${DIAS.map((d) => `<div class="cal-head">${d}</div>`).join("")}${cells}
  </div></div>`;
}

function formClase(pre = {}) {
  return [
    { key: "areaId", label: "Clase dirigida", type: "select", required: true, placeholder: "Selecciona…",
      options: state.servicios.filter((s) => s.tipo === "DIRIGIDA").map((s) => ({ value: s.id, label: s.nombre })) },
    { key: "instructorId", label: "Instructor", type: "select", required: true, placeholder: "Selecciona…",
      options: instructores().map((u) => ({ value: u.id, label: u.nombre })) },
    { key: "dia", label: "Día", type: "select", required: true,
      options: DIAS.map((d, i) => ({ value: i, label: d })) },
    { key: "bloque", label: "Bloque horario", type: "select", required: true,
      options: BLOQUES.map((b) => ({ value: b, label: b })) },
  ];
}

function validarClase(vals, id) {
  const dia = Number(vals.dia);
  const dupInstr = state.clases.find((c) => c.id !== id && Number(c.dia) === dia && c.bloque === vals.bloque && c.instructorId === vals.instructorId);
  if (dupInstr) return { error: "Ese instructor ya tiene una clase en ese bloque." };
  const simult = state.clases.filter((c) => c.id !== id && Number(c.dia) === dia && c.bloque === vals.bloque).length;
  if (simult >= 2) return { error: "Ya hay 2 clases simultáneas en ese horario (tope del gimnasio)." };
  return null;
}

/* ---- PAGOS ---- */
function vPagos() {
  const total = state.pagos.reduce((s, p) => s + Number(p.usd), 0);
  const prom = state.pagos.length ? total / state.pagos.length : 0;
  return `
  <div class="toolbar"><div class="section-note" style="margin:0">Registra pagos asociados a un cliente y su plan.</div>
    <button class="btn btn-primary" data-action="nuevoPago" style="margin-left:auto">+ Registrar pago</button></div>
  <div class="grid cols-3" data-stagger style="margin-bottom:20px">
    ${stat("Total recaudado hoy", "$" + total.toFixed(0), "Bs " + bs(total), "pagos", "tint-y")}
    ${stat("Pagos procesados", state.pagos.length, "transacciones", "dashboard", "tint-b")}
    ${stat("Ticket promedio", "$" + prom.toFixed(1), "por pago", "planes", "tint-c")}
  </div>
  <div class="card fade-in"><h3>Movimientos de hoy</h3>${tablaPagos(state.pagos, true)}</div>`;
}

function tablaPagos(rows, withActions) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Cliente</th><th>Plan</th><th>Monto</th><th>Método</th><th>Hora</th>${withActions ? "<th></th>" : ""}</tr></thead>
    <tbody>${rows.map((p, i) => {
      const c = usuario(p.clienteId);
      return `<tr>
        <td><div class="cell-name"><div class="av ${i % 3 === 1 ? "o" : i % 3 === 2 ? "n" : ""}">${initials(c?.nombre)}</div><b>${c?.nombre || "—"}</b></div></td>
        <td>${planLabel(p.planId)}</td>
        <td><span class="usd">$${Number(p.usd).toFixed(2)}</span><div class="bs">Bs ${bs(Number(p.usd))}</div></td>
        <td>${p.metodo}</td><td>${p.hora}</td>
        ${withActions ? `<td>${actBtns("editarPago", "eliminarPago", p.id)}</td>` : ""}
      </tr>`;
    }).join("") || `<tr><td colspan="${withActions ? 6 : 5}" style="text-align:center;color:var(--muted)">Sin pagos hoy.</td></tr>`}
    </tbody></table></div>`;
}

function vAsistencia() {
  const enGym = state.asistencias.filter((a) => !a.salida);
  const salidas = state.asistencias.filter((a) => a.salida);
  return `
  <div class="toolbar">
    <div class="section-note" style="margin:0">El gimnasio es de <b>acceso libre</b>. Registra la <b>entrada</b> de cada cliente y su <b>salida</b> al retirarse.</div>
    <button class="btn btn-primary" data-action="nuevaAsistencia" style="margin-left:auto">+ Registrar entrada</button>
  </div>
  <div class="grid cols-3" data-stagger style="margin-bottom:20px">
    ${stat("En el gimnasio ahora", enGym.length, "clientes presentes", "asistencia", "tint-o")}
    ${stat("Registros de hoy", state.asistencias.length, "check-ins", "clientes", "tint-b")}
    ${stat("Salidas registradas", salidas.length, "ya se retiraron", "dashboard", "tint-c")}
  </div>
  <div class="card fade-in"><h3>Asistencia de hoy</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>Cliente</th><th>Entrada</th><th>Salida</th><th>Estado</th><th></th></tr></thead>
      <tbody>${state.asistencias.slice().reverse().map((a, i) => {
        const c = usuario(a.clienteId), dentro = !a.salida;
        return `<tr>
          <td><div class="cell-name"><div class="av ${i % 3 === 1 ? "o" : i % 3 === 2 ? "n" : ""}">${initials(c?.nombre)}</div><b>${c?.nombre || "—"}</b></div></td>
          <td>${a.entrada}</td>
          <td>${a.salida || "—"}</td>
          <td>${dentro ? '<span class="badge activo">En el gimnasio</span>' : '<span class="badge congelado">Se retiró</span>'}</td>
          <td><div class="row-actions">
            ${dentro ? `<button class="btn btn-ghost" style="padding:6px 12px" data-action="registrarSalida" data-id="${a.id}">Registrar salida</button>` : ""}
            <button class="icon-btn del" title="Eliminar" data-action="eliminarAsistencia" data-id="${a.id}">${ICO("del")}</button>
          </div></td>
        </tr>`;
      }).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--muted)">Sin registros hoy.</td></tr>`}
      </tbody></table></div>
  </div>`;
}

function formAsistencia() {
  return [
    { key: "clienteId", label: "Cliente que ingresa", type: "select", required: true, placeholder: "Selecciona…",
      options: clientes().map((c) => ({ value: c.id, label: c.nombre + (c.estado === "moroso" ? " — ⚠ MOROSO" : "") })) },
  ];
}

const VIEWS = { dashboard: vDashboard, usuarios: vUsuarios, clientes: vClientes, asistencia: vAsistencia, servicios: vServicios, planes: vPlanes, horarios: vHorarios, pagos: vPagos };

/* =====================================================================
   HANDLERS (acciones de los botones)
   ===================================================================== */
function nowTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const handlers = {
  filtroUsuario: (v) => { userFilter = v; rerender(); },

  nuevoUsuario: () => openModal({ title: "Nuevo usuario", fields: formUsuario(), onSave: (v) => {
    const u = { id: uid(), ...v };
    if (u.rol === "CLIENTE") { u.estado = "activo"; u.vence = "—"; u.planId = state.planes[0]?.id; }
    state.usuarios.push(u); save(); rerender();
  }}),
  editarUsuario: (id) => { const u = usuario(id); openModal({ title: "Editar usuario", fields: formUsuario(), values: u,
    onSave: (v) => { Object.assign(u, v); save(); rerender(); },
    onDelete: () => handlers.eliminarUsuario(id) }); },
  eliminarUsuario: (id) => {
    const u = usuario(id);
    if (u.rol === "INSTRUCTOR" && state.clases.some((c) => c.instructorId === id))
      return alert("No se puede eliminar: el instructor tiene clases asignadas. Reasigna esas clases primero.");
    if (!confirm(`¿Eliminar a ${u.nombre}?`)) return;
    state.usuarios = state.usuarios.filter((x) => x.id !== id);
    state.pagos = state.pagos.filter((p) => p.clienteId !== id);
    state.asistencias = state.asistencias.filter((a) => a.clienteId !== id);
    save(); rerender();
  },

  nuevoCliente: () => openModal({ title: "Nuevo cliente", fields: formCliente(), onSave: (v) => {
    state.usuarios.push({ id: uid(), rol: "CLIENTE", ...v }); save(); rerender();
  }}),
  editarCliente: (id) => { const c = usuario(id); openModal({ title: "Editar cliente", fields: formCliente(), values: c,
    onSave: (v) => { Object.assign(c, v); save(); rerender(); },
    onDelete: () => handlers.eliminarUsuario(id) }); },

  nuevoServicio: () => openModal({ title: "Nueva área de servicio", fields: formServicio(), onSave: (v) => {
    state.servicios.push({ id: uid(), ...v }); save(); rerender();
  }}),
  editarServicio: (id) => { const s = servicio(id); openModal({ title: "Editar área", fields: formServicio(), values: s,
    onSave: (v) => { Object.assign(s, v); save(); rerender(); },
    onDelete: () => handlers.eliminarServicio(id) }); },
  eliminarServicio: (id) => {
    if (state.planes.some((p) => p.areaId === id)) return alert("No se puede eliminar: el área tiene planes asociados. Elimina esos planes primero.");
    if (state.clases.some((c) => c.areaId === id)) return alert("No se puede eliminar: el área tiene clases en la agenda.");
    if (!confirm("¿Eliminar esta área de servicio?")) return;
    state.servicios = state.servicios.filter((x) => x.id !== id); save(); rerender();
  },

  nuevoPlan: () => openModal({ title: "Nuevo plan", fields: formPlan(), onSave: (v) => {
    state.planes.push({ id: uid(), areaId: v.areaId, duracion: v.duracion, usd: Number(v.usd) }); save(); rerender();
  }}),
  editarPlan: (id) => { const p = planById(id); openModal({ title: "Editar plan", fields: formPlan(),
    values: { ...p }, onSave: (v) => { Object.assign(p, { areaId: v.areaId, duracion: v.duracion, usd: Number(v.usd) }); save(); rerender(); },
    onDelete: () => handlers.eliminarPlan(id) }); },
  eliminarPlan: (id) => { if (!confirm("¿Eliminar este plan?")) return; state.planes = state.planes.filter((x) => x.id !== id); save(); rerender(); },

  nuevaClase: () => openModal({ title: "Nueva clase", fields: formClase(), onSave: (v) => {
    const err = validarClase(v, null); if (err) return err;
    state.clases.push({ id: uid(), areaId: v.areaId, instructorId: v.instructorId, dia: Number(v.dia), bloque: v.bloque }); save(); rerender();
  }}),
  nuevaClaseEn: (data) => { const [dia, bloque] = data.split("|"); openModal({ title: "Nueva clase", fields: formClase(),
    values: { dia, bloque }, onSave: (v) => {
      const err = validarClase(v, null); if (err) return err;
      state.clases.push({ id: uid(), areaId: v.areaId, instructorId: v.instructorId, dia: Number(v.dia), bloque: v.bloque }); save(); rerender();
    }}); },
  editarClase: (id) => { const c = state.clases.find((x) => x.id === id); openModal({ title: "Editar clase", fields: formClase(),
    values: { ...c }, onSave: (v) => { const err = validarClase(v, id); if (err) return err;
      Object.assign(c, { areaId: v.areaId, instructorId: v.instructorId, dia: Number(v.dia), bloque: v.bloque }); save(); rerender(); },
    onDelete: () => { if (!confirm("¿Eliminar esta clase?")) return; state.clases = state.clases.filter((x) => x.id !== id); save(); rerender(); } }); },

  nuevoPago: () => openModal({ title: "Registrar pago", fields: formPago(), onSave: (v) => {
    state.pagos.unshift({ id: uid(), clienteId: v.clienteId, planId: v.planId, usd: Number(v.usd), metodo: v.metodo, hora: nowTime() }); save(); rerender();
  }}),
  editarPago: (id) => { const p = state.pagos.find((x) => x.id === id); openModal({ title: "Editar pago", fields: formPago(),
    values: { ...p }, onSave: (v) => { Object.assign(p, { clienteId: v.clienteId, planId: v.planId, usd: Number(v.usd), metodo: v.metodo }); save(); rerender(); },
    onDelete: () => { if (!confirm("¿Eliminar este pago?")) return; state.pagos = state.pagos.filter((x) => x.id !== id); save(); rerender(); } }); },
  eliminarPago: (id) => { if (!confirm("¿Eliminar este pago?")) return; state.pagos = state.pagos.filter((x) => x.id !== id); save(); rerender(); },

  nuevaAsistencia: () => openModal({ title: "Registrar entrada", fields: formAsistencia(), onSave: (v) => {
    state.asistencias.push({ id: uid(), clienteId: v.clienteId, entrada: nowTime(), salida: null }); save(); rerender();
  }}),
  registrarSalida: (id) => { const a = state.asistencias.find((x) => x.id === id); if (a) { a.salida = nowTime(); save(); rerender(); } },
  eliminarAsistencia: (id) => { if (!confirm("¿Eliminar este registro de asistencia?")) return; state.asistencias = state.asistencias.filter((x) => x.id !== id); save(); rerender(); },
};

function formPago() {
  return [
    { key: "clienteId", label: "Cliente", type: "select", required: true, placeholder: "Selecciona…",
      options: clientes().map((c) => ({ value: c.id, label: c.nombre })) },
    { key: "planId", label: "Plan", type: "select", required: true, placeholder: "Selecciona…",
      options: state.planes.map((p) => ({ value: p.id, label: planLabel(p.id) + " ($" + p.usd + ")" })) },
    { key: "usd", label: "Monto (USD)", type: "number", required: true, step: "0.5" },
    { key: "metodo", label: "Método de pago", type: "select", required: true, options: METODOS.map((m) => ({ value: m, label: m })) },
  ];
}

/* =====================================================================
   ROUTER + INIT
   ===================================================================== */
function go(id) {
  current = id;
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

  // Delegación de clics para todas las acciones CRUD
  $("#view").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const fn = handlers[btn.dataset.action];
    if (fn) fn(btn.dataset.id);
  });

  const reset = $("#resetBtn");
  if (reset) reset.addEventListener("click", resetDemo);

  go("dashboard");
}
init();
