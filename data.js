/* Datos de arranque (semilla) de Zona Gym. seed() devuelve un estado nuevo que
   la app persiste en el navegador. La tasa BCV es ilustrativa.
   Áreas: tipo LIBRE (acceso libre, siempre abierto) o DIRIGIDA (clase con horario). */

function isoDate(dt) {
  return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
}

function seed() {
  const hoy = new Date();
  const todayISO = isoDate(hoy);

  const planUsd = { pp_d: 3, pp_s: 12, pp_m: 35, pb_d: 4, pb_s: 16, pb_m: 45, pm_d: 5, pm_s: 18, pm_m: 50, pl_d: 2.5, pl_s: 10, pl_m: 28 };
  const planPorCliente = { u_maria: "pp_m", u_jose: "pm_m", u_andre: "pl_s", u_luis: "pb_m", u_valen: "pp_m", u_carlo: "pp_d", u_danie: "pm_s", u_ricar: "pb_m" };
  const clientesIds = Object.keys(planPorCliente);
  const metodos = ["Pago Móvil", "Efectivo (USD)", "Transferencia", "Punto de venta", "Efectivo (Bs)"];

  // Pagos: 5 de hoy + histórico de los últimos 29 días (para reportes)
  const pagos = [];
  let gid = 1;
  [["u_valen", "pp_m", "Pago Móvil", "10:42 AM"], ["u_carlo", "pp_d", "Efectivo (USD)", "9:15 AM"],
   ["u_jose", "pm_m", "Transferencia", "8:50 AM"], ["u_ricar", "pb_m", "Punto de venta", "8:20 AM"],
   ["u_maria", "pp_m", "Pago Móvil", "7:58 AM"]].forEach(([c, pl, m, h]) =>
    pagos.push({ id: "g" + gid++, clienteId: c, planId: pl, usd: planUsd[pl], metodo: m, hora: h, fecha: todayISO }));
  for (let d = 1; d <= 29; d++) {
    const dt = new Date(hoy.getTime() - d * 86400000);
    const n = 1 + ((d * 3) % 4);
    for (let k = 0; k < n; k++) {
      const cid = clientesIds[(d * 2 + k) % clientesIds.length];
      const pl = planPorCliente[cid];
      pagos.push({ id: "g" + gid++, clienteId: cid, planId: pl, usd: planUsd[pl], metodo: metodos[(d + k) % metodos.length], hora: "—", fecha: isoDate(dt) });
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
    ],

    planes: [
      { id: "pp_d", areaId: "s_pesas", duracion: "Diaria",  usd: 3 },
      { id: "pp_s", areaId: "s_pesas", duracion: "Semanal", usd: 12 },
      { id: "pp_m", areaId: "s_pesas", duracion: "Mensual", usd: 35 },
      { id: "pb_d", areaId: "s_boxeo", duracion: "Diaria",  usd: 4 },
      { id: "pb_s", areaId: "s_boxeo", duracion: "Semanal", usd: 16 },
      { id: "pb_m", areaId: "s_boxeo", duracion: "Mensual", usd: 45 },
      { id: "pm_d", areaId: "s_mma",   duracion: "Diaria",  usd: 5 },
      { id: "pm_s", areaId: "s_mma",   duracion: "Semanal", usd: 18 },
      { id: "pm_m", areaId: "s_mma",   duracion: "Mensual", usd: 50 },
      { id: "pl_d", areaId: "s_baile", duracion: "Diaria",  usd: 2.5 },
      { id: "pl_s", areaId: "s_baile", duracion: "Semanal", usd: 10 },
      { id: "pl_m", areaId: "s_baile", duracion: "Mensual", usd: 28 },
    ],

    usuarios: [
      { id: "u_admin", nombre: "Ada Díaz",      cedula: "V-18.402.119", email: "ada.diaz@zonagym.com",  telefono: "0414-0001122", rol: "EMPLEADO",   detalle: "Administradora" },
      { id: "u_recep", nombre: "Pedro Núñez",   cedula: "V-21.557.880", email: "recepcion@zonagym.com", telefono: "0412-0003344", rol: "EMPLEADO",   detalle: "Recepción" },
      { id: "u_salas", nombre: "Rolando Salas", cedula: "V-15.220.341", email: "r.salas@zonagym.com",   telefono: "0416-1110011", rol: "INSTRUCTOR", detalle: "Monitor sala de pesas" },
      { id: "u_leon",  nombre: "Miguel León",   cedula: "V-17.880.402", email: "m.leon@zonagym.com",    telefono: "0424-1110022", rol: "INSTRUCTOR", detalle: "Boxeo" },
      { id: "u_mora",  nombre: "Karla Mora",    cedula: "V-23.110.998", email: "k.mora@zonagym.com",    telefono: "0414-1110033", rol: "INSTRUCTOR", detalle: "Bailoterapia" },
      { id: "u_ortiz", nombre: "Diego Ortiz",   cedula: "V-16.009.771", email: "d.ortiz@zonagym.com",   telefono: "0426-1110044", rol: "INSTRUCTOR", detalle: "MMA" },
      { id: "u_maria", nombre: "María Gómez",    cedula: "V-25.481.230", email: "maria.g@gmail.com",     telefono: "0414-1234567", rol: "CLIENTE", estado: "activo",    salud: "Sin condiciones", emergencia: "Pedro Gómez · 0414-9990001", membresias: [{ id: "m1", planId: "pp_m", vence: "28/06/2026" }, { id: "m2", planId: "pb_m", vence: "28/06/2026" }] },
      { id: "u_jose",  nombre: "José Rodríguez", cedula: "V-19.330.118", email: "jose.r@gmail.com",      telefono: "0412-7654321", rol: "CLIENTE", estado: "activo",    salud: "Lesión de rodilla (2024)", emergencia: "Ana R. · 0412-8880002", membresias: [{ id: "m3", planId: "pm_m", vence: "12/06/2026" }] },
      { id: "u_andre", nombre: "Andrea Pérez",   cedula: "V-27.901.554", email: "andrea.p@gmail.com",    telefono: "0424-9081726", rol: "CLIENTE", estado: "congelado", salud: "", emergencia: "", membresias: [{ id: "m4", planId: "pl_s", vence: "05/07/2026" }] },
      { id: "u_luis",  nombre: "Luis Hernández", cedula: "V-14.220.873", email: "luis.h@gmail.com",      telefono: "0416-3344556", rol: "CLIENTE", estado: "moroso",    salud: "Hipertensión", emergencia: "Marta H. · 0416-7770003", membresias: [{ id: "m5", planId: "pb_m", vence: "30/05/2026" }] },
      { id: "u_valen", nombre: "Valentina Díaz", cedula: "V-28.114.690", email: "valen.d@gmail.com",     telefono: "0414-5566778", rol: "CLIENTE", estado: "activo",    salud: "", emergencia: "", membresias: [{ id: "m6", planId: "pp_m", vence: "22/06/2026" }, { id: "m7", planId: "pl_m", vence: "22/06/2026" }] },
      { id: "u_carlo", nombre: "Carlos Mendoza", cedula: "V-16.778.401", email: "carlos.m@gmail.com",    telefono: "0412-1122334", rol: "CLIENTE", estado: "activo",    salud: "Asma leve", emergencia: "Rosa M. · 0412-6660004", membresias: [{ id: "m8", planId: "pp_d", vence: "07/06/2026" }] },
      { id: "u_danie", nombre: "Daniela Suárez", cedula: "V-26.550.992", email: "dani.s@gmail.com",      telefono: "0424-8877665", rol: "CLIENTE", estado: "moroso",    salud: "", emergencia: "", membresias: [{ id: "m9", planId: "pm_s", vence: "01/06/2026" }] },
      { id: "u_ricar", nombre: "Ricardo Blanco", cedula: "V-12.009.345", email: "ricardo.b@gmail.com",   telefono: "0426-4455667", rol: "CLIENTE", estado: "activo",    salud: "Sin condiciones", emergencia: "Sofía B. · 0426-5550005", membresias: [{ id: "m10", planId: "pb_m", vence: "19/06/2026" }] },
    ],

    clases: [
      { id: "c1",  areaId: "s_boxeo", instructorId: "u_leon",  dia: 0, bloque: "6:00" },
      { id: "c2",  areaId: "s_boxeo", instructorId: "u_leon",  dia: 2, bloque: "6:00" },
      { id: "c3",  areaId: "s_boxeo", instructorId: "u_leon",  dia: 4, bloque: "6:00" },
      { id: "c4",  areaId: "s_mma",   instructorId: "u_ortiz", dia: 5, bloque: "6:00" },
      { id: "c5",  areaId: "s_baile", instructorId: "u_mora",  dia: 1, bloque: "8:00" },
      { id: "c6",  areaId: "s_baile", instructorId: "u_mora",  dia: 3, bloque: "8:00" },
      { id: "c7",  areaId: "s_baile", instructorId: "u_mora",  dia: 5, bloque: "8:00" },
      { id: "c8",  areaId: "s_mma",   instructorId: "u_ortiz", dia: 0, bloque: "10:00" },
      { id: "c9",  areaId: "s_mma",   instructorId: "u_ortiz", dia: 2, bloque: "10:00" },
      { id: "c10", areaId: "s_boxeo", instructorId: "u_leon",  dia: 0, bloque: "5:00 PM" },
      { id: "c11", areaId: "s_mma",   instructorId: "u_ortiz", dia: 1, bloque: "5:00 PM" },
      { id: "c12", areaId: "s_boxeo", instructorId: "u_leon",  dia: 2, bloque: "5:00 PM" },
      { id: "c13", areaId: "s_mma",   instructorId: "u_ortiz", dia: 3, bloque: "5:00 PM" },
      { id: "c14", areaId: "s_boxeo", instructorId: "u_leon",  dia: 4, bloque: "5:00 PM" },
      { id: "c15", areaId: "s_boxeo", instructorId: "u_leon",  dia: 0, bloque: "6:00 PM" },
      { id: "c16", areaId: "s_baile", instructorId: "u_mora",  dia: 0, bloque: "6:00 PM" },
      { id: "c17", areaId: "s_mma",   instructorId: "u_ortiz", dia: 1, bloque: "6:00 PM" },
      { id: "c18", areaId: "s_baile", instructorId: "u_mora",  dia: 1, bloque: "6:00 PM" },
      { id: "c19", areaId: "s_boxeo", instructorId: "u_leon",  dia: 2, bloque: "6:00 PM" },
      { id: "c20", areaId: "s_baile", instructorId: "u_mora",  dia: 2, bloque: "6:00 PM" },
      { id: "c21", areaId: "s_mma",   instructorId: "u_ortiz", dia: 4, bloque: "6:00 PM" },
      { id: "c22", areaId: "s_baile", instructorId: "u_mora",  dia: 4, bloque: "6:00 PM" },
      { id: "c23", areaId: "s_mma",   instructorId: "u_ortiz", dia: 0, bloque: "8:00 PM" },
      { id: "c24", areaId: "s_boxeo", instructorId: "u_leon",  dia: 2, bloque: "8:00 PM" },
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
