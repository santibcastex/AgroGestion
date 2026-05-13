"""
Pobla precios_globales e indicadores desde Yahoo Finance + BCRA API.
Corre diariamente.

Requiere: pip install yfinance requests
"""
import yfinance as yf
import requests
from datetime import date, timedelta
from config import upsert, SUPABASE_URL, SUPABASE_KEY, HEADERS

# ── Mapeo ticker Yahoo → codigo indicador ──────────────────────────────────
TICKERS = {
    "^GSPC":  "sp500",
    "^DJI":   "dow",
    "^IXIC":  "nasdaq",
    "^VIX":   "vix",
    "GC=F":   "oro",
    "SI=F":   "plata",
    "CL=F":   "petroleo_wti",
    "ZS=F":   "soja_chicago",
    "ZC=F":   "maiz_chicago",
    "ZW=F":   "trigo_chicago",
    "BTC-USD":"bitcoin",
    "ETH-USD":"ethereum",
}

def fetch_yahoo(dias=90):
    inicio = (date.today() - timedelta(days=dias)).isoformat()
    rows = []
    for ticker, codigo in TICKERS.items():
        print(f"  Descargando {ticker} ({codigo})...")
        try:
            df = yf.download(ticker, start=inicio, progress=False, auto_adjust=True)
            if df.empty:
                print(f"    sin datos")
                continue
            # Obtener id del indicador
            r = requests.get(
                f"{SUPABASE_URL}/rest/v1/indicadores?codigo=eq.{codigo}&select=id",
                headers=HEADERS
            )
            data = r.json()
            if not data:
                print(f"    indicador {codigo} no encontrado en DB")
                continue
            ind_id = data[0]["id"]

            for fecha, row in df.iterrows():
                close = float(row["Close"].iloc[0]) if hasattr(row["Close"], "iloc") else float(row["Close"])
                rows.append({
                    "indicador_id": ind_id,
                    "fecha": str(fecha.date()),
                    "valor": round(close, 4)
                })
        except Exception as e:
            print(f"    error: {e}")
    return rows

def fetch_merval(dias=90):
    """Merval desde Yahoo Finance (^MERV)"""
    inicio = (date.today() - timedelta(days=dias)).isoformat()
    rows = []
    try:
        df = yf.download("^MERV", start=inicio, progress=False, auto_adjust=True)
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/indicadores?codigo=eq.merval&select=id",
            headers=HEADERS
        )
        data = r.json()
        if not data:
            print("  merval no encontrado en DB, insertando...")
            requests.post(f"{SUPABASE_URL}/rest/v1/indicadores", headers=HEADERS,
                json=[{"codigo": "merval", "nombre": "Merval"}])
            r = requests.get(f"{SUPABASE_URL}/rest/v1/indicadores?codigo=eq.merval&select=id", headers=HEADERS)
            data = r.json()
        ind_id = data[0]["id"]
        for fecha, row in df.iterrows():
            close = float(row["Close"].iloc[0]) if hasattr(row["Close"], "iloc") else float(row["Close"])
            rows.append({"indicador_id": ind_id, "fecha": str(fecha.date()), "valor": round(close, 2)})
    except Exception as e:
        print(f"  error merval: {e}")
    return rows

def fetch_dolar_bcra():
    """
    Tipos de dólar desde la API del BCRA.
    Dólar oficial: serie 7928 (tipo vendedor BNA)
    """
    rows = []
    series = {
        "dolar_oficial": "7928",
    }
    for codigo, serie_id in series.items():
        try:
            url = f"https://api.bcra.gob.ar/estadisticas/v3.0/monetarias/{serie_id}?desde=2024-01-01&hasta={date.today().isoformat()}&limit=500"
            r = requests.get(url, timeout=10, verify=False)
            data = r.json()
            resultados = data.get("results", [])
            r2 = requests.get(
                f"{SUPABASE_URL}/rest/v1/indicadores?codigo=eq.{codigo}&select=id",
                headers=HEADERS
            )
            d = r2.json()
            if not d:
                continue
            ind_id = d[0]["id"]
            for item in resultados:
                rows.append({
                    "indicador_id": ind_id,
                    "fecha": item["fecha"],
                    "valor": float(item["valor"])
                })
            print(f"  BCRA {codigo}: {len(resultados)} filas")
        except Exception as e:
            print(f"  error BCRA {codigo}: {e}")
    return rows

def fetch_dolar_blue():
    """Dólar blue, MEP, CCL desde dolarapi.com (gratuita)"""
    rows = []
    try:
        r = requests.get("https://dolarapi.com/v1/dolares", timeout=10)
        dolares = r.json()
        today = date.today().isoformat()
        mapeo = {
            "blue":    "dolar_blue",
            "bolsa":   "dolar_mep",
            "contadoconliqui": "dolar_ccl",
        }
        for d in dolares:
            casa = d.get("casa", "").lower()
            codigo = mapeo.get(casa)
            if not codigo:
                continue
            r2 = requests.get(
                f"{SUPABASE_URL}/rest/v1/indicadores?codigo=eq.{codigo}&select=id",
                headers=HEADERS
            )
            data = r2.json()
            if not data:
                continue
            ind_id = data[0]["id"]
            venta = d.get("venta")
            if venta:
                rows.append({"indicador_id": ind_id, "fecha": today, "valor": float(venta)})
        print(f"  dólar blue/mep/ccl: {len(rows)} filas")
    except Exception as e:
        print(f"  error dolar blue: {e}")
    return rows

if __name__ == "__main__":
    import warnings
    warnings.filterwarnings("ignore")
    print("=== Indicadores Globales ===")
    rows = []
    rows += fetch_yahoo(dias=90)
    rows += fetch_merval(dias=90)
    rows += fetch_dolar_bcra()
    rows += fetch_dolar_blue()
    upsert("precios_globales", rows)
    print("Listo.")
