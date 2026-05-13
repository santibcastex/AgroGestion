"""
Pobla precios_agro desde la API pública de la Bolsa de Comercio de Rosario (BCR).
Corre diariamente.

Requiere: pip install requests beautifulsoup4
"""
import requests
from datetime import date, timedelta
from config import upsert, SUPABASE_URL, HEADERS

# IDs de cultivos en nuestra DB
CULTIVO_CODIGOS = ["soja", "maiz", "trigo", "girasol", "sorgo"]

def get_cultivo_ids():
    r = requests.get(f"{SUPABASE_URL}/rest/v1/cultivos?select=id,codigo", headers=HEADERS)
    return {row["codigo"]: row["id"] for row in r.json()}

def fetch_bcr_disponible():
    """
    Precios disponibles de la BCR para Rosario.
    Endpoint público de la BCR: https://www.bcr.com.ar/es/mercados/granos/disponible-y-a-termino
    Usamos la API JSON que expone la BCR.
    """
    rows = []
    cultivo_ids = get_cultivo_ids()
    today = date.today().isoformat()

    # BCR expone datos en formato JSON en este endpoint
    url = "https://www.bcr.com.ar/es/mercados/granos/pizarra-granos-disponible"
    try:
        r = requests.get(url, timeout=15, headers={"Accept": "application/json",
                                                    "User-Agent": "Mozilla/5.0"})
        data = r.json()
        mapeo_bcr = {
            "Soja":    "soja",
            "Maíz":    "maiz",
            "Trigo":   "trigo",
            "Girasol": "girasol",
            "Sorgo":   "sorgo",
        }
        zonas_bcr = {
            "Rosario":      "rosario",
            "Bahía Blanca": "bahia_blanca",
            "Dársena":      "darsena",
            "Quequén":      "quequen",
        }
        for item in data:
            cultivo_nombre = item.get("cultivo") or item.get("nombre")
            codigo = mapeo_bcr.get(cultivo_nombre)
            if not codigo or codigo not in cultivo_ids:
                continue
            cultivo_id = cultivo_ids[codigo]
            for zona_nombre, zona_cod in zonas_bcr.items():
                precio_ars = item.get(zona_nombre) or item.get(zona_cod)
                if precio_ars:
                    try:
                        precio_ars = float(str(precio_ars).replace(".", "").replace(",", "."))
                    except:
                        continue
                    rows.append({
                        "cultivo_id": cultivo_id,
                        "zona": zona_cod,
                        "fecha": today,
                        "precio_ars": precio_ars,
                    })
        print(f"  BCR disponible: {len(rows)} filas")
    except Exception as e:
        print(f"  error BCR: {e}")
        print("  Intentando scraping alternativo...")
        rows += fetch_agromercado_scrape(cultivo_ids, today)
    return rows

def fetch_agromercado_scrape(cultivo_ids, today):
    """
    Alternativa: scraping de agromercado.com.ar (fuente pública)
    """
    from bs4 import BeautifulSoup
    rows = []
    zonas = {
        "rosario":      "https://www.agromercado.com.ar/pizarra-rosario",
        "bahia_blanca": "https://www.agromercado.com.ar/pizarra-bahia-blanca",
        "quequen":      "https://www.agromercado.com.ar/pizarra-quequen",
    }
    mapeo = {"Soja": "soja", "Maíz": "maiz", "Trigo": "trigo", "Girasol": "girasol", "Sorgo": "sorgo"}
    for zona_cod, url in zonas.items():
        try:
            r = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            soup = BeautifulSoup(r.text, "html.parser")
            for row in soup.select("table tr"):
                cols = row.find_all("td")
                if len(cols) >= 2:
                    nombre = cols[0].text.strip()
                    codigo = mapeo.get(nombre)
                    if codigo and codigo in cultivo_ids:
                        try:
                            precio = float(cols[1].text.strip().replace("$", "").replace(".", "").replace(",", "."))
                            rows.append({
                                "cultivo_id": cultivo_ids[codigo],
                                "zona": zona_cod,
                                "fecha": today,
                                "precio_ars": precio,
                            })
                        except:
                            pass
        except Exception as e:
            print(f"  error {zona_cod}: {e}")
    print(f"  agromercado scrape: {len(rows)} filas")
    return rows

if __name__ == "__main__":
    print("=== Precios Agro (Pizarras) ===")
    rows = fetch_bcr_disponible()
    upsert("precios_agro", rows)
    print("Listo.")
