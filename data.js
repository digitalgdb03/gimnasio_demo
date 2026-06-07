/* Datos de DEMOSTRACIÓN (semilla). seed() devuelve un estado nuevo que la app
   persiste en el navegador (localStorage). La tasa BCV es ilustrativa.

   IMPORTANTE: las áreas tienen 'tipo':
     LIBRE    -> acceso libre, el gimnasio siempre está abierto (ej: Pesas).
     DIRIGIDA -> clase con instructor y horario (ej: Boxeo, MMA, Bailoterapia).
   Solo las áreas DIRIGIDA se programan en el calendario. */
function seed() {
  return {
    gym: "Iron House",
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
      { id: "u_admin", nombre: "Ada Díaz",       cedula: "V-18.402.119", telefono: "0414-0001122", rol: "EMPLEADO",   detalle: "Administradora" },
      { id: "u_recep", nombre: "Pedro Núñez",    cedula: "V-21.557.880", telefono: "0412-0003344", rol: "EMPLEADO",   detalle: "Recepción" },
      { id: "u_salas", nombre: "Rolando Salas",  cedula: "V-15.220.341", telefono: "0416-1110011", rol: "INSTRUCTOR", detalle: "Monitor sala de pesas" },
      { id: "u_leon",  nombre: "Miguel León",    cedula: "V-17.880.402", telefono: "0424-1110022", rol: "INSTRUCTOR", detalle: "Boxeo" },
      { id: "u_mora",  nombre: "Karla Mora",     cedula: "V-23.110.998", telefono: "0414-1110033", rol: "INSTRUCTOR", detalle: "Bailoterapia" },
      { id: "u_ortiz", nombre: "Diego Ortiz",    cedula: "V-16.009.771", telefono: "0426-1110044", rol: "INSTRUCTOR", detalle: "MMA" },
      { id: "u_maria", nombre: "María Gómez",     cedula: "V-25.481.230", telefono: "0414-1234567", rol: "CLIENTE", estado: "activo",    planId: "pp_m", vence: "28/06/2026" },
      { id: "u_jose",  nombre: "José Rodríguez",  cedula: "V-19.330.118", telefono: "0412-7654321", rol: "CLIENTE", estado: "activo",    planId: "pm_m", vence: "12/06/2026" },
      { id: "u_andre", nombre: "Andrea Pérez",    cedula: "V-27.901.554", telefono: "0424-9081726", rol: "CLIENTE", estado: "congelado", planId: "pl_s", vence: "05/07/2026" },
      { id: "u_luis",  nombre: "Luis Hernández",  cedula: "V-14.220.873", telefono: "0416-3344556", rol: "CLIENTE", estado: "moroso",    planId: "pb_m", vence: "30/05/2026" },
      { id: "u_valen", nombre: "Valentina Díaz",  cedula: "V-28.114.690", telefono: "0414-5566778", rol: "CLIENTE", estado: "activo",    planId: "pp_m", vence: "22/06/2026" },
      { id: "u_carlo", nombre: "Carlos Mendoza",  cedula: "V-16.778.401", telefono: "0412-1122334", rol: "CLIENTE", estado: "activo",    planId: "pp_d", vence: "07/06/2026" },
      { id: "u_danie", nombre: "Daniela Suárez",  cedula: "V-26.550.992", telefono: "0424-8877665", rol: "CLIENTE", estado: "moroso",    planId: "pm_s", vence: "01/06/2026" },
      { id: "u_ricar", nombre: "Ricardo Blanco",  cedula: "V-12.009.345", telefono: "0426-4455667", rol: "CLIENTE", estado: "activo",    planId: "pb_m", vence: "19/06/2026" },
    ],

    /* Solo clases DIRIGIDAS. dia: índice 0..5 (Lun..Sáb). */
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
      // Bloque pico 6:00 PM: 2 clases simultáneas (tope permitido)
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

    /* Pagos del día */
    pagos: [
      { id: "g1", clienteId: "u_valen", planId: "pp_m", usd: 35, metodo: "Pago Móvil",     hora: "10:42 AM" },
      { id: "g2", clienteId: "u_carlo", planId: "pp_d", usd: 3,  metodo: "Efectivo (USD)", hora: "9:15 AM" },
      { id: "g3", clienteId: "u_jose",  planId: "pm_m", usd: 50, metodo: "Transferencia",  hora: "8:50 AM" },
      { id: "g4", clienteId: "u_ricar", planId: "pb_m", usd: 45, metodo: "Punto de venta", hora: "8:20 AM" },
      { id: "g5", clienteId: "u_maria", planId: "pp_m", usd: 35, metodo: "Pago Móvil",     hora: "7:58 AM" },
    ],

    /* Registro de asistencia (check-in/check-out) de hoy.
       salida: null => el cliente está actualmente en el gimnasio. */
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
  };
}
