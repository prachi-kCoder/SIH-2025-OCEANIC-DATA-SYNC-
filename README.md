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

# FRONTEND
```
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Loader2, Thermometer, MapPin, AlertTriangle, ShieldCheck } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

// Mock cache (static fallback data for prototype)
const staticInsights = {
  "Thunnus albacares": {
    sstRange: "23°C – 29°C",
    regions: ["Tropical Pacific", "Indian Ocean"],
    risk: "High (Overfishing)",
    recommendation: "Strengthen tuna stock monitoring and enforce quotas.",
    chartData: [
      { temp: 22, density: 20 },
      { temp: 24, density: 45 },
      { temp: 26, density: 60 },
      { temp: 28, density: 40 },
      { temp: 30, density: 15 },
    ],
  },
  "Cyanea capillata": {
    sstRange: "2°C – 12°C",
    regions: ["North Atlantic", "Arctic waters"],
    risk: "Low",
    recommendation: "Monitor blooms; climate shifts may expand range.",
    chartData: [
      { temp: 0, density: 10 },
      { temp: 4, density: 35 },
      { temp: 8, density: 50 },
      { temp: 12, density: 25 },
      { temp: 16, density: 5 },
    ],
  },
  "Sardinella longiceps": {
    sstRange: "22°C – 28°C",
    regions: ["Arabian Sea", "Bay of Bengal"],
    risk: "Medium (Climate-sensitive)",
    recommendation: "Implement adaptive seasonal fishing bans.",
    chartData: [
      { temp: 20, density: 15 },
      { temp: 22, density: 40 },
      { temp: 24, density: 55 },
      { temp: 26, density: 50 },
      { temp: 28, density: 30 },
    ],
  },
}

export default function InsightsUI() {
  const [species, setSpecies] = useState("")
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState(null)

  const handleFetchInsights = () => {
    if (!species) return
    setLoading(true)

    // Simulated API call with fallback
    setTimeout(() => {
      const fetched = staticInsights[species]
      setInsight(fetched || { error: "No insights available" })
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
      {/* Species Selector */}
      <Card className="shadow-lg rounded-2xl p-4">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Select a Species</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-4">
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="border rounded-lg p-2 w-full md:w-1/2"
          >
            <option value="">-- Choose Species --</option>
            {Object.keys(staticInsights).map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
          <Button onClick={handleFetchInsights} disabled={!species || loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Get Insights
          </Button>
        </CardContent>
      </Card>

      {/* Insights Panel */}
      {insight && (
        <Card className="shadow-xl rounded-2xl p-4">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex justify-between items-center">
              AI-Driven Insights for <span className="text-blue-600">{species}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insight.error ? (
              <p className="text-red-500">{insight.error}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Thermometer className="inline mr-2 text-blue-600" />
                  <strong>Temperature Range:</strong>
                  <p>{insight.sstRange}</p>
                </div>

                <div className="p-3 bg-green-50 rounded-xl">
                  <MapPin className="inline mr-2 text-green-600" />
                  <strong>Regions:</strong>
                  <p>{insight.regions.join(", ")}</p>
                </div>

                <div className="p-3 bg-red-50 rounded-xl">
                  <AlertTriangle className="inline mr-2 text-red-600" />
                  <strong>Risk Level:</strong>
                  <p>{insight.risk}</p>
                </div>

                <div className="p-3 bg-yellow-50 rounded-xl">
                  <ShieldCheck className="inline mr-2 text-yellow-600" />
                  <strong>Recommendation:</strong>
                  <p>{insight.recommendation}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart Section */}
      {insight && insight.chartData && (
        <Card className="shadow-xl rounded-2xl p-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Habitat Suitability vs Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={insight.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="temp" label={{ value: "Temperature (°C)", position: "insideBottom", offset: -5 }} />
                <YAxis label={{ value: "Occurrence Density", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Line type="monotone" dataKey="density" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

```
```
import * as React from "react"

export function Button({ className = "", ...props }) {
  return (
    <button
      className={`px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition ${className}`}
      {...props}
    />
  )
}
```
```
import * as React from "react"

export function Card({ className = "", children }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md border border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ className = "", children }) {
  return (
    <div className={`p-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ className = "", children }) {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  )
}

export function CardContent({ className = "", children }) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ className = "", children }) {
  return (
    <div className={`p-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

```
```
import * as React from "react"

export function Select({ value, onValueChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="w-full px-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring focus:border-blue-400"
    >
      {children}
    </select>
  )
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>
}

export function SelectTrigger({ children }) {
  return <>{children}</>
}

export function SelectValue({ placeholder }) {
  return <option value="">{placeholder}</option>
}

export function SelectContent({ children }) {
  return <>{children}</>
}
```
