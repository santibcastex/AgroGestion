# Scripts de carga de datos — AgroNúmeros

## Instalación

```bash
pip install requests yfinance beautifulsoup4
```

## Scripts disponibles

| Script | Qué hace | Frecuencia |
|--------|----------|------------|
| `01_indicadores_globales.py` | S&P500, Dow, Nasdaq, VIX, Merval, dólares, commodities, metales, crypto | Diario |
| `02_precios_agro.py` | Pizarras de granos (Rosario, Bahía Blanca, Dársena, Quequén) | Diario |
| `03_series_diarias.py` | BADLAR privados y total (BCRA) | Diario |
| `04_ganaderia_liniers.py` | Precios semanales Liniers + índice INMAG | Semanal |

## Cómo correr

```bash
cd scripts
python 01_indicadores_globales.py
python 02_precios_agro.py
python 03_series_diarias.py
python 04_ganaderia_liniers.py
```

## Automatización con GitHub Actions

Crear `.github/workflows/update_data.yml` en el repo para correr los scripts diariamente de forma automática y gratuita.

## Fuentes de datos

- **Yahoo Finance** → indicadores globales (gratuito, sin API key)
- **BCRA API** → dólar oficial, BADLAR (gratuito, público)
- **dolarapi.com** → dólar blue, MEP, CCL (gratuito)
- **Bolsa de Rosario** → precios de granos (público)
- **Mercado de Liniers** → precios ganadería (público)
