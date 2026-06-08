# Zona Gym · Sistema de gestión (web)

Aplicación web del gimnasio: usuarios, clientes, asistencia (acceso libre),
servicios, planes, horarios de clases dirigidas, pagos y reportes.
Interfaz responsive (escritorio y móvil). Acceso con credenciales.

## Acceso
- Usuario: **admin**
- Contraseña: **zona2026**

(Se cambian en `app.js`, constante `CREDS`.)

## Contenido
```
zona_gym_web/
├── index.html      ← login + shell de la app
├── styles.css      ← sistema de diseño (paleta de marca) + responsive
├── app.js          ← lógica, módulos y validaciones
├── data.js         ← datos iniciales (clientes, planes, pagos, horario)
├── assets/
│   └── zona_gym.png ← logo
└── vercel.json
```

## Publicar en Vercel
1. Entra a https://vercel.com → *Add New… → Project*.
2. Arrastra la carpeta `zona_gym_web` (o impórtala desde GitHub).
3. *Deploy*. Vercel la detecta como sitio estático; no requiere build.

Con la CLI:
```bash
npm i -g vercel
cd zona_gym_web
vercel --prod
```

## Notas
- Los datos se guardan en el navegador del equipo (localStorage). El botón
  **↺ Restablecer** vuelve a los datos iniciales; **Cerrar sesión** sale.
- Para un sistema multi-PC con datos centralizados y reales, el backend
  Django + PostgreSQL (en la LAN del gimnasio) sigue siendo la base; esta
  web comparte exactamente el mismo diseño e interfaz.
