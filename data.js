/* Datos de arranque (semilla) de Zona Gym. seed() devuelve un estado nuevo que
   la app persiste en el navegador. La tasa BCV es ilustrativa.
   Áreas: tipo LIBRE (acceso libre), DIRIGIDA (clase con horario) o MIXTO (combos).
   Cada plan tiene DOBLE precio: usdBcv (pago en bolívares) y usdDivisas (efectivo USD). */

function isoDate(dt) {
  return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
}

function seed() {
  const hoy = new Date();
  const todayISO = isoDate(hoy);

  // Precio de cada plan (para el histórico de pagos sembrado)
  const planBcv = { pp_d: 3, pp_s: 12, pp_m: 18, pb_d: 4, pb_s: 16, pb_m: 25, pm_d: 5, pm_s: 18, pm_m: 25, pl_d: 2.5, pl_s: 10, pl_m: 28 };
  const planDiv = { pp_d: 2, pp_s: 8, pp_m: 10, pb_d: 3, pb_s: 12, pb_m: 20, pm_d: 4, pm_s: 14, pm_m: 20, pl_d: 2, pl_s: 8, pl_m: 22 };
  const planPorCliente = { u_maria: "pp_m", u_jose: "pm_m", u_andre: "pl_s", u_luis: "pb_m", u_valen: "pp_m", u_carlo: "pp_d", u_danie: "pm_s", u_ricar: "pb_m" };
  const clientesIds = Object.keys(planPorCliente);
  const metodos = ["Pago Móvil", "Efectivo (USD)", "Transferencia", "Punto de venta", "Efectivo (Bs)"];
  const monedaDe = (m) => m === "Efectivo (USD)" ? "Divisas" : "BCV";

  // Pagos: 5 de hoy + histórico de los últimos 29 días (para reportes)
  const pagos = [];
  let gid = 1;
  [["u_valen", "pp_m", "Pago Móvil", "10:42 AM"], ["u_carlo", "pp_d", "Efectivo (USD)", "9:15 AM"],
   ["u_jose", "pm_m", "Transferencia", "8:50 AM"], ["u_ricar", "pb_m", "Punto de venta", "8:20 AM"],
   ["u_maria", "pp_m", "Pago Móvil", "7:58 AM"]].forEach(([c, pl, m, h]) => {
    const mon = monedaDe(m);
    pagos.push({ id: "g" + gid++, clienteId: c, planId: pl, usd: mon === "Divisas" ? planDiv[pl] : planBcv[pl], moneda: mon, metodo: m, hora: h, fecha: todayISO });
  });
  for (let d = 1; d <= 29; d++) {
    const dt = new Date(hoy.getTime() - d * 86400000);
    const n = 1 + ((d * 3) % 4);
    for (let k = 0; k < n; k++) {
      const cid = clientesIds[(d * 2 + k) % clientesIds.length];
      const pl = planPorCliente[cid];
      const m = metodos[(d + k) % metodos.length], mon = monedaDe(m);
      pagos.push({ id: "g" + gid++, clienteId: cid, planId: pl, usd: mon === "Divisas" ? planDiv[pl] : planBcv[pl], moneda: mon, metodo: m, hora: "—", fecha: isoDate(dt) });
    }
  }

  return {
    gym: "Zona Gym",
    bcv: 51.40,
    fecha: "Domingo, 07 de junio de 2026",

    servicios: [
      { id: "s_pesas", nombre: "Pesas",        color: "#343959", tipo: "LIBRE" },
      { id: "s_boxeo", nombre: "Boxeo",        color: "#F2A30F", tipo: "DIRIGIDA" },
      { id: "s_mma",   nombre: "MMA",          color: "#BF9039", tipo: "DIRIGIDA" },
      { id: "s_baile", nombre: "Bailoterapia", color: "#F2B90C", tipo: "DIRIGIDA" },
      { id: "s_combo", nombre: "Combinados",   color: "#1f9d57", tipo: "MIXTO" },
    ],

    /* Cada plan: usdBcv = precio pagando en bolívares · usdDivisas = efectivo en dólares.
       incluye = áreas que cubre (si trae Boxeo/MMA se pide entrenador). */
    planes: [
      { id: "pp_d", areaId: "s_pesas", duracion: "Diaria",  usdBcv: 3,  usdDivisas: 2,  usd: 3,  incluye: ["s_pesas"] },
      { id: "pp_s", areaId: "s_pesas", duracion: "Semanal", usdBcv: 12, usdDivisas: 8,  usd: 12, incluye: ["s_pesas"] },
      { id: "pp_m", areaId: "s_pesas", duracion: "Mensual", usdBcv: 18, usdDivisas: 10, usd: 18, incluye: ["s_pesas"] },
      { id: "pb_d", areaId: "s_boxeo", duracion: "Diaria",  usdBcv: 4,  usdDivisas: 3,  usd: 4,  incluye: ["s_boxeo"] },
      { id: "pb_s", areaId: "s_boxeo", duracion: "Semanal", usdBcv: 16, usdDivisas: 12, usd: 16, incluye: ["s_boxeo"] },
      { id: "pb_m", areaId: "s_boxeo", duracion: "Mensual", usdBcv: 25, usdDivisas: 20, usd: 25, incluye: ["s_boxeo"] },
      { id: "pm_d", areaId: "s_mma",   duracion: "Diaria",  usdBcv: 5,  usdDivisas: 4,  usd: 5,  incluye: ["s_mma"] },
      { id: "pm_s", areaId: "s_mma",   duracion: "Semanal", usdBcv: 18, usdDivisas: 14, usd: 18, incluye: ["s_mma"] },
      { id: "pm_m", areaId: "s_mma",   duracion: "Mensual", usdBcv: 25, usdDivisas: 20, usd: 25, incluye: ["s_mma"] },
      { id: "pl_d", areaId: "s_baile", duracion: "Diaria",  usdBcv: 2.5,usdDivisas: 2,  usd: 2.5,incluye: ["s_baile"] },
      { id: "pl_s", areaId: "s_baile", duracion: "Semanal", usdBcv: 10, usdDivisas: 8,  usd: 10, incluye: ["s_baile"] },
      { id: "pl_m", areaId: "s_baile", duracion: "Mensual", usdBcv: 28, usdDivisas: 22, usd: 28, incluye: ["s_baile"] },
      { id: "pc_mmapesas", areaId: "s_combo", duracion: "Mensual", nombre: "MMA + Pesas (afiliados)",     usdBcv: 25, usdDivisas: 20, usd: 25, incluye: ["s_mma", "s_pesas"] },
      { id: "pc_boxpesas", areaId: "s_combo", duracion: "Mensual", nombre: "Boxeo + Pesas (afiliados)",   usdBcv: 25, usdDivisas: 20, usd: 25, incluye: ["s_boxeo", "s_pesas"] },
      { id: "pc_pesasbox", areaId: "s_combo", duracion: "Mensual", nombre: "Pesas + Boxeo",               usdBcv: 35, usdDivisas: 30, usd: 35, incluye: ["s_pesas", "s_boxeo"] },
      { id: "pc_pesasmma", areaId: "s_combo", duracion: "Mensual", nombre: "Pesas + MMA",                 usdBcv: 35, usdDivisas: 30, usd: 35, incluye: ["s_pesas", "s_mma"] },
      { id: "pc_boxpers",  areaId: "s_combo", duracion: "Mensual", nombre: "Boxeo personalizado",         usdBcv: 30, usdDivisas: 30, usd: 30, incluye: ["s_boxeo"], personalizado: true },
      { id: "pc_boxperspe",areaId: "s_combo", duracion: "Mensual", nombre: "Boxeo personalizado + Pesas", usdBcv: 40, usdDivisas: 40, usd: 40, incluye: ["s_boxeo", "s_pesas"], personalizado: true },
    ],

    usuarios: [
      { id: "u_admin", nombre: "Ada Díaz",     cedula: "V-18.402.119", email: "ada.diaz@zonagym.com",  telefono: "0414-0001122", rol: "EMPLEADO",   detalle: "Administradora" },
      { id: "u_recep", nombre: "Pedro Núñez",  cedula: "V-21.557.880", email: "recepcion@zonagym.com", telefono: "0412-0003344", rol: "EMPLEADO",   detalle: "Recepción" },
      { id: "u_michael", nombre: "Michael",    cedula: "V-17.880.402", email: "michael@zonagym.com",   telefono: "0424-1110022", rol: "INSTRUCTOR", disciplinaId: "s_boxeo", detalle: "Boxeo (clases y personalizado)" },
      { id: "u_emilio",  nombre: "Emilio",     cedula: "V-16.220.341", email: "emilio@zonagym.com",    telefono: "0416-1110011", rol: "INSTRUCTOR", disciplinaId: "s_boxeo", detalle: "Boxeo" },
      { id: "u_graciela",nombre: "Graciela",   cedula: "V-19.554.110", email: "graciela@zonagym.com",  telefono: "0414-1110099", rol: "INSTRUCTOR", disciplinaId: "s_boxeo", detalle: "Boxeo" },
      { id: "u_joseph",  nombre: "Joseph",     cedula: "V-16.009.771", email: "joseph@zonagym.com",    telefono: "0426-1110044", rol: "INSTRUCTOR", disciplinaId: "s_mma",   detalle: "MMA" },
      { id: "u_rodolfo", nombre: "Rodolfo",    cedula: "V-15.221.300", email: "rodolfo@zonagym.com",   telefono: "0412-1110055", rol: "INSTRUCTOR", disciplinaId: "s_mma",   detalle: "MMA" },
      { id: "u_karla",   nombre: "Karla Mora", cedula: "V-23.110.998", email: "k.mora@zonagym.com",    telefono: "0414-1110033", rol: "INSTRUCTOR", disciplinaId: "s_baile", detalle: "Bailoterapia" },
      { id: "u_maria", nombre: "María Gómez",    cedula: "V-25.481.230", email: "maria.g@gmail.com",   telefono: "0414-1234567", rol: "CLIENTE", estado: "activo",    salud: "Sin condiciones", emergencia: "Pedro Gómez · 0414-9990001", membresias: [{ id: "m1", planId: "pp_m", inicio: "01/06/2026", vence: "28/06/2026" }, { id: "m2", planId: "pb_m", inicio: "01/06/2026", vence: "28/06/2026", entrenadorId: "u_michael" }] },
      { id: "u_jose",  nombre: "José Rodríguez", cedula: "V-19.330.118", email: "jose.r@gmail.com",    telefono: "0412-7654321", rol: "CLIENTE", estado: "activo",    salud: "Lesión de rodilla (2024)", emergencia: "Ana R. · 0412-8880002", membresias: [{ id: "m3", planId: "pm_m", inicio: "13/05/2026", vence: "12/06/2026", entrenadorId: "u_joseph" }] },
      { id: "u_andre", nombre: "Andrea Pérez",   cedula: "V-27.901.554", email: "andrea.p@gmail.com",  telefono: "0424-9081726", rol: "CLIENTE", estado: "congelado", salud: "", emergencia: "", membresias: [{ id: "m4", planId: "pl_s", inicio: "28/06/2026", vence: "05/07/2026" }], congelacion: { motivo: "Viaje", dias: 10, desde: "25/06/2026", hasta: "05/07/2026" } },
      { id: "u_luis",  nombre: "Luis Hernández", cedula: "V-14.220.873", email: "luis.h@gmail.com",    telefono: "0416-3344556", rol: "CLIENTE", estado: "moroso",    salud: "Hipertensión", emergencia: "Marta H. · 0416-7770003", membresias: [{ id: "m5", planId: "pb_m", inicio: "30/04/2026", vence: "30/05/2026", entrenadorId: "u_emilio" }] },
      { id: "u_valen", nombre: "Valentina Díaz", cedula: "V-28.114.690", email: "valen.d@gmail.com",   telefono: "0414-5566778", rol: "CLIENTE", estado: "activo",    salud: "", emergencia: "", membresias: [{ id: "m6", planId: "pp_m", inicio: "22/05/2026", vence: "22/06/2026" }, { id: "m7", planId: "pl_m", inicio: "22/05/2026", vence: "22/06/2026" }] },
      { id: "u_carlo", nombre: "Carlos Mendoza", cedula: "V-16.778.401", email: "carlos.m@gmail.com",   telefono: "0412-1122334", rol: "CLIENTE", estado: "activo",    salud: "Asma leve", emergencia: "Rosa M. · 0412-6660004", membresias: [{ id: "m8", planId: "pp_d", inicio: "07/06/2026", vence: "08/06/2026" }] },
      { id: "u_danie", nombre: "Daniela Suárez", cedula: "V-26.550.992", email: "dani.s@gmail.com",     telefono: "0424-8877665", rol: "CLIENTE", estado: "moroso",    salud: "", emergencia: "", membresias: [{ id: "m9", planId: "pm_s", inicio: "25/05/2026", vence: "01/06/2026", entrenadorId: "u_joseph" }] },
      { id: "u_ricar", nombre: "Ricardo Blanco", cedula: "V-12.009.345", email: "ricardo.b@gmail.com",  telefono: "0426-4455667", rol: "CLIENTE", estado: "activo",    salud: "Sin condiciones", emergencia: "Sofía B. · 0426-5550005", membresias: [{ id: "m10", planId: "pb_m", inicio: "19/05/2026", vence: "19/06/2026", entrenadorId: "u_michael" }] },
    ],

    /* Clases: tipo "fija" o "personalizada". Algunas tienen 2 entrenadores. */
    clases: [
      { id: "c1", areaId: "s_boxeo", instructorId: "u_michael", tipo: "personalizada", dia: 0, bloque: "8:40-10:30 am" },
      { id: "c2", areaId: "s_boxeo", instructorId: "u_michael", tipo: "personalizada", dia: 1, bloque: "8:40-10:30 am" },
      { id: "c3", areaId: "s_boxeo", instructorId: "u_michael", tipo: "personalizada", dia: 2, bloque: "8:40-10:30 am" },
      { id: "c4", areaId: "s_boxeo", instructorId: "u_michael", tipo: "personalizada", dia: 3, bloque: "8:40-10:30 am" },
      { id: "c5", areaId: "s_boxeo", instructorId: "u_michael", tipo: "personalizada", dia: 4, bloque: "8:40-10:30 am" },
      { id: "c6", areaId: "s_mma", instructorId: "u_joseph", instructorId2: "u_rodolfo", tipo: "fija", dia: 5, bloque: "9:00-11:00 am" },
      { id: "c7",  areaId: "s_boxeo", instructorId: "u_michael", tipo: "personalizada", dia: 0, bloque: "2:40-3:50 pm" },
      { id: "c8",  areaId: "s_boxeo", instructorId: "u_michael", tipo: "personalizada", dia: 1, bloque: "2:40-3:50 pm" },
      { id: "c9",  areaId: "s_boxeo", instructorId: "u_michael", tipo: "personalizada", dia: 2, bloque: "2:40-3:50 pm" },
      { id: "c10", areaId: "s_boxeo", instructorId: "u_michael", tipo: "personalizada", dia: 3, bloque: "2:40-3:50 pm" },
      { id: "c11", areaId: "s_boxeo", instructorId: "u_michael", tipo: "personalizada", dia: 4, bloque: "2:40-3:50 pm" },
      { id: "c12", areaId: "s_boxeo", instructorId: "u_emilio", instructorId2: "u_graciela", tipo: "fija", dia: 1, bloque: "6:00-7:00 pm" },
      { id: "c13", areaId: "s_boxeo", instructorId: "u_emilio", instructorId2: "u_graciela", tipo: "fija", dia: 3, bloque: "6:00-7:00 pm" },
      { id: "c14", areaId: "s_boxeo", instructorId: "u_emilio", instructorId2: "u_graciela", tipo: "fija", dia: 4, bloque: "6:00-7:00 pm" },
      { id: "c15", areaId: "s_baile", instructorId: "u_karla", tipo: "fija", dia: 0, bloque: "7:00-8:00 pm" },
      { id: "c16", areaId: "s_baile", instructorId: "u_karla", tipo: "fija", dia: 2, bloque: "7:00-8:00 pm" },
      { id: "c17", areaId: "s_baile", instructorId: "u_karla", tipo: "fija", dia: 4, bloque: "7:00-8:00 pm" },
      { id: "c18", areaId: "s_boxeo", instructorId: "u_michael", tipo: "fija", dia: 0, bloque: "8:00-9:00 pm" },
      { id: "c19", areaId: "s_mma",   instructorId: "u_joseph", instructorId2: "u_rodolfo", tipo: "fija", dia: 1, bloque: "8:00-9:00 pm" },
      { id: "c20", areaId: "s_boxeo", instructorId: "u_michael", tipo: "fija", dia: 2, bloque: "8:00-9:00 pm" },
      { id: "c21", areaId: "s_mma",   instructorId: "u_joseph", instructorId2: "u_rodolfo", tipo: "fija", dia: 3, bloque: "8:00-9:00 pm" },
      { id: "c22", areaId: "s_boxeo", instructorId: "u_michael", tipo: "fija", dia: 4, bloque: "8:00-9:00 pm" },
    ],

    asistencias: [
      { id: "a1", clienteId: "u_jose",  entrada: "6:05 AM",  salida: "7:20 AM" },
      { id: "a2", clienteId: "u_maria", entrada: "7:05 AM",  salida: "8:30 AM" },
      { id: "a3", clienteId: "u_ricar", entrada: "8:15 AM",  salida: "9:50 AM" },
      { id: "a4", clienteId: "u_carlo", entrada: "9:10 AM",  salida: null },
      { id: "a5", clienteId: "u_valen", entrada: "10:40 AM", salida: null },
      { id: "a6", clienteId: "u_danie", entrada: "11:05 AM", salida: null },
    ],

    asistencia: [
      { h: "6a", v: 12 }, { h: "8a", v: 7 }, { h: "10a", v: 5 }, { h: "12m", v: 4 },
      { h: "3p", v: 9 }, { h: "5p", v: 14 }, { h: "6p", v: 18 }, { h: "8p", v: 11 },
    ],

    pagos: pagos,
  };
}
