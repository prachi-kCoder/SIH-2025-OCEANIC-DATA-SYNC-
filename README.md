# 🌊 OCEANIC SIH 2025 — Project Setup Guide

```
Sardinella longiceps (Indian oil sardine) – very common in Indian Ocean fisheries.
Thunnus albacares (Yellowfin tuna) – globally distributed, lots of OBIS records.
Delphinus delphis (Common dolphin) – plenty of marine mammal sightings.
Epinephelus coioides (Orange-spotted grouper) – strong fisheries + ecological data.
Charybdis feriata (Crab species, Indo-Pacific) – also present in OBIS.
```

## 🖥️ Frontend (ReactJS)
**Directory:** `OcenicSIH2025/client/frontend`

### Steps to Run:
```bash
cd OcenicSIH2025/client/frontend
npm install
npm run dev
```

🧠 Backend (FastAPI) 
Directory: server
{From the root directory}
```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload

```

- Access SWAGGER UI {TO TEST API'S}:
- Open your browser and visit: `http://127.0.0.1:8000/docs`

- Deactivate the virtual environment when done:`deactivate`


# TO TRY ON THE API PROVIDERS WE ARE USING :
on swaggerUI :http://127.0.0.1:8000/docs 

Body of req :

# NOAA :
```
{
  "provider": "noaa",
  "payload": {
    "station": "8723214",
    "product": "air_pressure",
    "begin_date": "20250801",
    "end_date": "20250803"
  }
}

```
# WORMS
```

{
  "provider": "worms",
  "payload": {
    "endpoint": "AphiaRecordsByName",
    "params": {
      "scientificname": "Panulirus homarus"
    },
    "limit": 5
  }
}
```

# OPEN-METEO
```
{
  "provider": "open-meteo",
  "payload": {
    "latitude": 15.0,
    "longitude": 73.0,
    "hourly": [
      "wave_height",
      "wave_direction",
      "wave_period",
      "sea_surface_temperature",
      "ocean_current_velocity",
      "ocean_current_direction",
      "swell_wave_height",
      "swell_wave_period"
    ]
  }
}
```
# OBIS 
```
{
  "provider": "obis",
  "payload": {
    "endpoint": "occurrence",
    "params": {
      "scientificname": "Sardinella",
      "size": 5
    }
  }
}

```

```bash
from fastapi import FastAPI, Query, HTTPException, Response
from typing import List, Optional, Dict, Any
import httpx
import asyncio
import pandas as pd
import numpy as np
from functools import lru_cache
from datetime import datetime
import io
import matplotlib.pyplot as plt
from urllib.parse import quote

app = FastAPI(title="CMLRE POC: Species x Ocean Insights")

GBIF_OCCURRENCE_URL = "https://api.gbif.org/v1/occurrence/search"
WORMS_BY_NAME = "https://www.marinespecies.org/rest/AphiaRecordsByName/{}?like=false&marine_only=true"
OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"

client = httpx.AsyncClient(timeout=30.0)

# @lru_cache(maxsize=256)
async def validate_with_worms(name: str) -> Dict[str, Any]:
    url = WORMS_BY_NAME.format(quote(name))
    r = await client.get(url)
    if r.status_code != 200:
        return {"ok": False, "error": f"WoRMS returned {r.status_code}"}
    data = r.json()
    if not data:
        return {"ok": False, "error": "No match in WoRMS"}
    # take first match
    entry = data[0]
    return {
        "ok": True,
        "scientificname": entry.get("scientificname"),
        "AphiaID": entry.get("AphiaID"),
        "status": entry.get("status"),
        "rank": entry.get("rank"),
        "valid_name": entry.get("valid_name"),
    }


async def fetch_gbif_occurrences(species: str, limit: int = 200) -> List[Dict[str, Any]]:
    params = {
        "scientificName": species,
        "hasCoordinate": "true",
        "limit": min(limit, 300),
        "offset": 0,
    }
    r = await client.get(GBIF_OCCURRENCE_URL, params=params)
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="GBIF API error")
    res = r.json()
    results = res.get("results", [])
    # simplify
    simplified = []
    for rec in results:
        lat = rec.get("decimalLatitude")
        lon = rec.get("decimalLongitude")
        date = rec.get("eventDate") or rec.get("year")
        if lat is None or lon is None:
            continue
        simplified.append({
            "gbifID": rec.get("key"),
            "species": rec.get("scientificName"),
            "lat": float(lat),
            "lon": float(lon),
            "eventDate": date,
            "dataset": rec.get("datasetTitle"),
        })
    return simplified

async def fetch_sst_for_point(lat: float, lon: float, date_str: Optional[str] = None) -> Optional[float]:
    # Open-Meteo archive: request daily sea-surface temperature for given date
    # If date_str missing, use today's date (will likely return empty - then we allow None)
    try:
        if date_str and isinstance(date_str, str) and len(date_str) >= 4:
            # try to parse only the year-month-day part if possible
            try:
                parsed = datetime.fromisoformat(date_str)
                date = parsed.date().isoformat()
            except Exception:
                # if only year provided or bad format, fallback to None
                date = None
        else:
            date = None
        # If we have a date, query daily; otherwise query recent daily using last 3 days
        params = {
            "latitude": lat,
            "longitude": lon,
            "timezone": "UTC",
        }
        if date:
            params.update({"start_date": date, "end_date": date, "daily": "sea_surface_temperature"})
        else:
            # a short recent window
            today = datetime.utcnow().date()
            params.update({"start_date": (today - pd.Timedelta(days=3)).isoformat(),
                           "end_date": today.isoformat(),
                           "daily": "sea_surface_temperature"})
        r = await client.get(OPEN_METEO_ARCHIVE, params=params)
        if r.status_code != 200:
            return None
        data = r.json()
        # try to pull daily sea_surface_temperature
        daily = data.get("daily", {})
        sst_list = daily.get("sea_surface_temperature")
        if sst_list and isinstance(sst_list, list) and len(sst_list) > 0:
            # take median
            return float(np.nanmedian([v for v in sst_list if v is not None]))
        # fallback: some APIs may provide hourly
        hourly = data.get("hourly", {})
        hsst = hourly.get("sea_surface_temperature")
        if hsst and isinstance(hsst, list) and len(hsst) > 0:
            return float(np.nanmedian([v for v in hsst if v is not None]))
        return None
    except Exception:
        return None

@app.get("/validate_species")
async def validate_species(name: str = Query(..., description="Scientific name, e.g. Thunnus albacares")):
    res = await validate_with_worms(name)
    return res

@app.get("/occurrences")
async def occurrences(species: str = Query(...), limit: int = Query(100, ge=1, le=300)):
    occ = await fetch_gbif_occurrences(species, limit)
    # return friendly summary
    summary = {
        "requested_species": species,
        "n_points": len(occ),
        "example_points": occ[:10]
    }
    return summary

@app.get("/insights")
async def insights(species: str = Query(...), limit: int = Query(100, ge=1, le=300)):
    # 1. validate species
    worms = await validate_with_worms(species)
    # 2. fetch occurrences
    occ = await fetch_gbif_occurrences(species, limit)
    if len(occ) == 0:
        raise HTTPException(status_code=404, detail="No georeferenced occurrences found for this species")
    # 3. fetch SST for each point (async gather, but cap concurrency)
    sem = asyncio.Semaphore(8)
    async def worker(pt):
        async with sem:
            sst = await fetch_sst_for_point(pt["lat"], pt["lon"], pt.get("eventDate"))
            return {**pt, "sst": sst}
    tasks = [worker(pt) for pt in occ]
    enriched = await asyncio.gather(*tasks)
    df = pd.DataFrame(enriched)
    # compute stats ignoring nulls
    sst_vals = df["sst"].dropna().astype(float)
    if len(sst_vals) == 0:
        stats = {"message": "No SST data available for these points"}
    else:
        stats = {
            "count_sst": int(len(sst_vals)),
            "mean_sst_c": float(np.round(sst_vals.mean(), 2)),
            "median_sst_c": float(np.round(sst_vals.median(), 2)),
            "min_sst_c": float(np.round(sst_vals.min(), 2)),
            "max_sst_c": float(np.round(sst_vals.max(), 2)),
        }
    # prepare user-friendly explanation
    explanation = (
        f"We found {len(occ)} georeferenced records for '{species}'. "
        + (f"For {stats.get('count_sst',0)} of those we obtained sea-surface temperature (SST) data. "
           f"The SST values range from {stats.get('min_sst_c','N/A')}°C to {stats.get('max_sst_c','N/A')}°C, "
           f"with a mean of {stats.get('mean_sst_c','N/A')}°C. This suggests the species is typically observed in waters around the stated temperatures."
           if isinstance(stats, dict) and stats.get('count_sst',0)>0 else "We couldn't retrieve SST values for these locations.")
    )
    # pick top 5 hotspots by number of records (approx using clustering by rounding coords)
    df['lat_r'] = df['lat'].round(2)
    df['lon_r'] = df['lon'].round(2)
    hotspots = df.groupby(['lat_r','lon_r']).size().reset_index(name='n').sort_values('n',ascending=False).head(5)
    hotspots_list = hotspots.to_dict('records')
    return {
        "species_validation": worms,
        "stats": stats,
        "explanation": explanation,
        "hotspots": hotspots_list,
        "sample_enriched_points": df.head(20).to_dict('records')
    }

@app.get("/insights_plot")
async def insights_plot(species: str = Query(...), limit: int = Query(100, ge=1, le=300)):
    resp = await insights(species, limit)
    # extract sst list
    sst_vals = [pt.get('sst') for pt in resp.get('sample_enriched_points', [])]
    sst_vals = [v for v in sst_vals if v is not None]
    if len(sst_vals) == 0:
        raise HTTPException(status_code=404, detail="No SST values to plot")
    # plot histogram
    fig, ax = plt.subplots(figsize=(6,4))
    ax.hist(sst_vals, bins=12)
    ax.set_title(f"SST distribution for {species} (n={len(sst_vals)})")
    ax.set_xlabel('SST (°C)')
    ax.set_ylabel('Count')
    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")

# Graceful shutdown
@app.on_event("shutdown")
async def shutdown_event():
    await client.aclose()

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')


```

