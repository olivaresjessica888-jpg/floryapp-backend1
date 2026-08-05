# FloryApp Backend 🌹 (Vercel + Gemini — 100% GRATIS, siempre)

Este es el servidor que hace posible que el botón **"Analizar con IA"** funcione
cuando abres FloryApp.html fuera de Claude.ai. Usa **Vercel** para el hosting
(plan gratuito permanente, sin tarjeta de crédito) y **Google Gemini** para el
análisis de imágenes (también gratis).

A diferencia de otros hostings, Vercel no "duerme" tu servicio ni te limita
por tiempo — las funciones se ejecutan bajo demanda cada vez que las llamas,
así que no pagas nada mientras no las uses, y no hay sorpresas de facturación.

## Paso 1 — Consigue tu clave de API de Gemini (gratis)

1. Ve a **https://aistudio.google.com**
2. Inicia sesión con tu cuenta de Google.
3. Click en **"Get API Key"** → **"Create API Key"**.
4. Copia la clave (empieza con `AIza...`). Guárdala.

## Paso 2 — Sube este proyecto a GitHub

1. Crea una cuenta gratis en **https://github.com** si no tienes.
2. Crea un repositorio nuevo, por ejemplo `floryapp-backend`.
3. Sube estos archivos **respetando la carpeta**:
   - `api/analizar.js` (debe quedar dentro de una carpeta llamada `api`)
   - `package.json`
   - `.env.example`
   - `README.md`

   En GitHub, para crear la carpeta `api` al subir: cuando arrastres el
   archivo `analizar.js`, escribe `api/analizar.js` en el nombre del archivo
   antes de confirmar la subida — GitHub crea la carpeta automáticamente.

## Paso 3 — Despliega en Vercel (gratis, sin tarjeta)

1. Ve a **https://vercel.com** y haz clic en **"Sign Up"**.
2. Elige **"Continue with GitHub"** para conectar tu cuenta más rápido.
3. Autoriza el acceso cuando te lo pida.
4. En el panel de Vercel, haz clic en **"Add New..."** → **"Project"**.
5. Busca tu repositorio `floryapp-backend` en la lista y haz clic en **"Import"**.
6. Antes de darle a "Deploy", despliega la sección **"Environment Variables"**
   y agrega:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** tu clave `AIza...` del Paso 1
7. Haz clic en **"Deploy"**. Espera 1-2 minutos.
8. Cuando termine, Vercel te muestra una URL como:
   `https://floryapp-backend.vercel.app`

   Tu endpoint completo para usar en la app será:
   `https://floryapp-backend.vercel.app/api/analizar`

## Paso 4 — Conecta FloryApp.html con tu backend

Abre tu archivo `FloryApp.html`, busca esta línea:

```javascript
const BACKEND_URL = "https://TU-BACKEND-AQUI.onrender.com/api/analizar";
```

Reemplázala completa por:

```javascript
const BACKEND_URL = "https://floryapp-backend.vercel.app/api/analizar";
```

(usando tu URL real de Vercel, no exactamente esta). Guarda el archivo.

## Paso 5 — ¡Listo!

Abre `FloryApp.html` en tu navegador y prueba "Analizar con IA". Debería
responder en 2-5 segundos, sin esperas de "servidor despertando" como pasaba
con otros hostings.

## Probar el backend directamente (opcional)

Visita `https://TU-PROYECTO.vercel.app/api/analizar` en el navegador — verás
un error de "Método no permitido" porque esa ruta espera un POST, pero eso
confirma que la función está viva y respondiendo.

## Costos

- **Vercel (hosting):** gratis en el plan Hobby, permanente, sin tarjeta.
  Límite generoso: 100 GB de transferencia y ~100,000 ejecuciones al mes,
  más que suficiente para uso personal.
- **Google Gemini API:** gratis en el nivel "Free tier" de aistudio.google.com,
  con límites de peticiones por minuto/día (suficiente para uso personal).

## Si algo falla

- **Error 500 "no configurada GEMINI_API_KEY":** revisa que agregaste la
  variable de entorno en Vercel → tu proyecto → Settings → Environment
  Variables, y que hiciste un nuevo deploy después de agregarla.
- **Error 404:** confirma que el archivo quedó exactamente en `api/analizar.js`
  (con esa carpeta), no suelto en la raíz del repositorio.
- **CORS / no responde desde el navegador:** confirma que copiaste la URL
  completa terminada en `/api/analizar` en el `BACKEND_URL` del HTML.
