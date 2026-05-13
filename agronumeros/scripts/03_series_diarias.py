"""
Pobla series_diarias (BADLAR) desde la API pública del BCRA.
Corre diariamente.

Requiere: pip install requests
"""
import requests
import warnings
from datetime import date
from config import upsert

warnings.filterwarnings("ignore")

# Series BCRA: https://api.bcra.gob.ar/estadisticas/v3.0/monetarias
SERIES = {
    "badlar_privados": "7,Entidades privadas,badlar",   # Serie 7
    "badlar_total":    "6,Total,badlar",                 # Serie 6
}

# IDs reales de las series BADLAR en la API del BCRA
BCRA_SERIES = {
    "badlar_privados": 7,
    "badlar_total":    6,
}

def fetch_badlar():
    rows = []
    desde = "2023-01-01"
    hasta = date.today().isoformat()
    for codigo, serie_id in BCRA_SERIES.items():
        try:
            url = f"https://api.bcra.gob.ar/estadisticas/v3.0/monetarias/{serie_id}?desde={desde}&hasta={hasta}&limit=1000"
            r = requests.get(url, timeout=15, verify=False)
            data = r.json()
            resultados = data.get("results", [])
            for item in resultados:
                rows.append({
                    "codigo": codigo,
                    "fecha":  item["fecha"],
                    "valor":  float(item["valor"])
                })
            print(f"  BADLAR {codigo}: {len(resultados)} filas")
        except Exception as e:
            print(f"  error {codigo}: {e}")
    return rows

if __name__ == "__main__":
    print("=== Series Diarias (BADLAR) ===")
    rows = fetch_badlar()
    upsert("series_diarias", rows)
    print("Listo.")
