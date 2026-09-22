// ============================================================
// FloryApp Backend – Función serverless para Vercel (GRATIS)
// ============================================================
// Este archivo se convierte automáticamente en un endpoint
// cuando lo subes a Vercel: quedará disponible en
// https://tu-proyecto.vercel.app/api/analizar
//
// Recibe la foto de la rosa y datos de humedad/temperatura desde la app,
// llama a Google Gemini con TU clave, y devuelve el diagnóstico.
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const ENFERMEDADES_IDS = ['oidio', 'velloso', 'roya', 'botrytis'];
const PLAGAS_IDS = ['thrips', 'moscaBlanca', 'afidos', 'acaros'];

function buildPrompt(humedad, temperatura) {
  let contextoAmbiental = '';
  if (humedad !== undefined && humedad !== null) {
    contextoAmbiental += `\n- Humedad relativa actual: ${humedad}%`;
  }
  if (temperatura !== undefined && temperatura !== null) {
    contextoAmbiental += `\n- Temperatura actual: ${temperatura}°C`;
  }

  return `Eres un fitopatólogo experto en rosas (Rosa spp.) de cultivo. Analiza la imagen adjunta de una hoja, tallo o flor de rosa y entrega un diagnóstico.
${contextoAmbiental ? `\nCondiciones ambientales registradas:${contextoAmbiental}\nUsa estos datos si ayudan a confirmar el riesgo o desarrollo de ciertas plagas o enfermedades (por ejemplo, alta humedad favorece mildiu velloso o botrytis).` : ''}

Debes elegir SOLO UNA de estas tres categorías de resultado:
1. "sana" - si no ves signos claros de enfermedad ni plaga
2. "enfermedad" - si identificas UNA enfermedad, debe ser exactamente uno de estos IDs: ${ENFERMEDADES_IDS.join(', ')}
   - oidio: polvo blanco harinoso en hojas/brotes
   - velloso: manchas amarillas angulares con moho grisáceo-violáceo en envés (mildiu velloso)
   - roya: pústulas anaranjadas/rojizas en envés de hojas
   - botrytis: moho gris en pétalos/hojas, podredumbre húmeda
3. "plaga" - si identificas UNA plaga, debe ser exactamente uno de estos IDs: ${PLAGAS_IDS.join(', ')}
   - thrips: rayaduras plateadas, pétalos deformados
   - moscaBlanca: insectos blancos diminutos, melaza, fumagina
   - afidos: colonias de insectos verdes/negros blandos en brotes
   - acaros: punteado amarillo fino, telaraña en envés (araña roja)

Responde ÚNICAMENTE con un objeto JSON válido, con esta forma exacta:
{
  "categoria": "sana" | "enfermedad" | "plaga",
  "id": "<id exacto de la lista o null si es sana>",
  "confianza": <número entero 0-100, qué tan seguro estás>,
  "viabilidad": <número entero 0-100, viabilidad estimada de la planta dado lo observado>,
  "observacion": "<1-2 frases en español describiendo lo que ves en la imagen que sustenta tu diagnóstico>"
}

Sé conservador: si la imagen no muestra síntomas claros, responde "sana" con confianza y viabilidad altas. Si los síntomas son ambiguos entre dos opciones, elige la más probable según lo que se observa, no al azar.`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'El servidor no tiene configurada GEMINI_API_KEY.' });
    }

    // Extraemos la imagen y los campos h (humedad) y t (temperatura) del JSON enviado
    const { imagenBase64, mediaType, h, t, humedad, temperatura } = req.body;

    if (!imagenBase64 || !mediaType) {
      return res.status(400).json({ error: 'Falta imagenBase64 o mediaType en la petición.' });
    }

    // Aceptamos 'h' o 'humedad', 't' o 'temperatura' según cómo los mande el cliente
    const valHumedad = h !== undefined ? h : humedad;
    const valTemperatura = t !== undefined ? t : temperatura;

    // Validación opcional: si tu app exige que la humedad siempre esté presente
    if (valHumedad === undefined || valHumedad === null) {
      return res.status(400).json({ 
        error: 'Falta el campo "h" (humedad) en el JSON enviado.' 
      });
    }

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: buildPrompt(valHumedad, valTemperatura) },
            { inline_data: { mime_type: mediaType, data: imagenBase64 } }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error de Gemini:', response.status, errText);
      return res.status(502).json({ error: 'Error llamando a la API de Gemini.' });
    }

    const data = await response.json();
    const textoRespuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textoRespuesta) {
      console.error('Respuesta inesperada de Gemini:', JSON.stringify(data));
      return res.status(502).json({ error: 'Respuesta sin contenido de texto.' });
    }

    const cleanText = textoRespuesta.replace(/```json|```/g, '').trim();
    let resultado;
    try {
      resultado = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('No se pudo parsear JSON:', cleanText);
      return res.status(502).json({ error: 'La IA no devolvió un JSON válido.' });
    }

    res.status(200).json(resultado);

  } catch (err) {
    console.error('Error en /api/analizar:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
