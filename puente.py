# ============================================================
# FloryApp - Puente PC -> Arduino (vía USB) -> Backend
# ============================================================
# Este programa lee los datos que envía tu Arduino por el cable
# USB (a través del puerto COM que aparece al conectarlo) y los
# envía a tu backend en Vercel para que la app los muestre en
# tiempo real.
#
# No necesitas emparejar nada: solo conecta el Arduino por USB.
#
# ANTES DE CORRERLO, EDITA ESTAS DOS LÍNEAS:
# ============================================================

PUERTO_COM = "COM5"  # <-- Cambia esto por tu puerto real (ver README)
BACKEND_URL = "https://TU-PROYECTO.vercel.app/api/sensor"  # <-- Tu URL de Vercel + /api/sensor

# ============================================================
# No necesitas tocar nada de aquí para abajo
# ============================================================

import serial
import requests
import json
import time

def main():
    print(f"🌹 FloryApp - Puente de datos")
    print(f"Conectando al puerto {PUERTO_COM}...")

    try:
        ser = serial.Serial(PUERTO_COM, 9600, timeout=2)
    except Exception as e:
        print(f"❌ No se pudo abrir el puerto {PUERTO_COM}: {e}")
        print("Revisa que el Arduino esté conectado por USB y que el número de puerto sea correcto.")
        return

    print("✅ Puerto abierto. Esperando datos del Arduino...\n")

    while True:
        try:
            linea = ser.readline().decode('utf-8', errors='ignore').strip()

            if not linea:
                continue

            if not (linea.startswith('{') and linea.endswith('}')):
                continue  # ignora líneas que no son JSON completo

            datos = json.loads(linea)

            if 'h' not in datos:
                continue  # ignora el mensaje inicial {"app":"FloryApp"}

            print(f"📡 Lectura recibida: {datos}")

            try:
                r = requests.post(BACKEND_URL, json=datos, timeout=5)
                if r.status_code == 200:
                    print(f"   ✅ Enviado a FloryApp correctamente\n")
                else:
                    print(f"   ⚠️ El servidor respondió con error {r.status_code}: {r.text}\n")
            except Exception as e:
                print(f"   ❌ No se pudo enviar al backend: {e}\n")

        except json.JSONDecodeError:
            continue  # línea corrupta, la ignoramos y seguimos
        except KeyboardInterrupt:
            print("\n👋 Puente detenido por el usuario.")
            break
        except Exception as e:
            print(f"⚠️ Error inesperado: {e}")
            time.sleep(2)

    ser.close()

if __name__ == "__main__":
    main()
