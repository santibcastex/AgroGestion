import os

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://szjxcfntvdyklnnuyepg.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_QRCmHDhrHk6rElc169-udw_GiSGiK-B")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}

def upsert(tabla, rows):
    import requests, json
    if not rows:
        print(f"  [skip] {tabla}: sin datos")
        return
    url = f"{SUPABASE_URL}/rest/v1/{tabla}"
    r = requests.post(url, headers=HEADERS, data=json.dumps(rows))
    if r.status_code in (200, 201):
        print(f"  [ok] {tabla}: {len(rows)} filas")
    else:
        print(f"  [error] {tabla}: {r.status_code} {r.text[:300]}")
