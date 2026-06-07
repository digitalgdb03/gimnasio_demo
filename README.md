# Demo · Iron House Gym Manager

Prototipo visual **estático** del sistema de administración de gimnasio.
Datos quemados (de ejemplo), sin backend. Sirve para mostrarle la interfaz
al cliente desde cualquier navegador o teléfono.

> El sistema **productivo** (Django + PostgreSQL) corre en la LAN del gimnasio.
> Esta demo NO se conecta a ninguna base de datos; solo refleja el diseño.

## Contenido
```
gimnasio_demo_vercel/
├── index.html      ← shell de la app
├── styles.css      ← sistema de diseño (paleta de marca)
├── app.js          ← navegación y render de vistas
├── data.js         ← datos estáticos de demostración
└── vercel.json     ← config (opcional para un sitio estático)
```

## Subir a Vercel (3 opciones)

**A) Arrastrar y soltar (más fácil)**
1. Entra a https://vercel.com → *Add New… → Project*.
2. Arrastra la carpeta `gimnasio_demo_vercel` a la zona de subida.
3. *Deploy*. Vercel detecta un sitio estático automáticamente.

**B) Desde GitHub**
1. Sube esta carpeta a un repositorio.
2. En Vercel: *Import Project* → selecciona el repo → *Deploy*.
   No hace falta "Build Command"; *Output Directory* = raíz.

**C) Con la CLI**
```bash
npm i -g vercel
cd gimnasio_demo_vercel
vercel        # despliegue de prueba
vercel --prod # despliegue final
```

## Editar la demo
Toda la información de ejemplo está en `data.js` (clientes, planes, pagos,
horario, tasa BCV). Cambia esos valores y se reflejan al recargar.
