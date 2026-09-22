// ============================================================
// FloryApp Backend – Endpoint de sensor (puente PC -> App)
// ============================================================
// POST /api/sensor  -> el script en tu computador envía aquí
//                      cada lectura que recibe del Arduino por USB
// GET  /api/sensor   -> la app pregunta aquí "¿cuál es la última lectura?"
//
// Usa Upstash Redis (gratis, vía el Marketplace de Vercel) para guardar
// la última lectura, porque las funciones serverless no recuerdan nada
// entre una llamada y otra.
// ============================================================

const { Redis } = require('@upstash/redis');

// Acepta ambos nombres de variables, por si Vercel usa uno u otro
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const CLAVE = 'floryapp_ultima_lectura';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const { h, l, ok, critico } = req.body || {};

      if (typeof h !== 'number') {
        return res.status(400).json({ error: 'Falta el campo "h" (humedad) en el JSON enviado.' });
      }

      const lectura = {
        h,
        l: typeof l === 'number' ? l : null,
        ok: typeof ok !== 'undefined' ? !!ok : null,
        critico: typeof critico !== 'undefined' ? !!critico : null,
        timestamp: Date.now()
      };

      await redis.set(CLAVE, lectura);
      return res.status(200).json({ guardado: true, lectura });
    }

    if (req.method === 'GET') {
      const lectura = await redis.get(CLAVE);

      if (!lectura) {
        return res.status(404).json({ error: 'Todavía no hay ninguna lectura registrada.' });
      }

      // Avisamos si la lectura es muy vieja (más de 20 segundos = probablemente desconectado)
      const antiguedadMs = Date.now() - lectura.timestamp;
      const activo = antiguedadMs < 20000;

      return res.status(200).json({ ...lectura, activo, antiguedadMs });
    }

    return res.status(405).json({ error: 'Método no permitido. Usa GET o POST.' });

  } catch (err) {
    console.error('Error en /api/sensor:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
