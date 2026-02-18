# ingest/fetch_weather.py
import requests
import json
from pathlib import Path
from datetime import datetime
import os

RAW_DIR = Path(__file__).resolve().parents[1] / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

locations = [
    ("Bengaluru", 12.97, 77.59),
    ("Chennai", 13.08, 80.27),
    ("Mumbai", 19.07, 72.88),
    ("Delhi", 28.61, 77.21),
    ("Kolkata", 22.57, 88.36),
    ("Hyderabad", 17.38, 78.47),
    ("Pune", 18.52, 73.85),
    ("Ahmedabad", 23.03, 72.58),
    ("Jaipur", 26.91, 75.79),
    ("Lucknow", 26.85, 80.95),
    ("Bhubaneswar", 20.27, 85.84),
    ("Chandigarh", 30.74, 76.79),
    ("Kochi", 9.97, 76.28),
    ("Goa", 15.49, 73.83)
]

API_URL = "https://api.open-meteo.com/v1/forecast?hourly=temperature_2m,relativehumidity_2m&timezone=UTC"

def fetch_weather(lat, lon):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relativehumidity_2m&timezone=UTC"
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    return response.json()

def main():
    for loc, lat, lon in locations:
        try:
            data = fetch_weather(lat, lon)
            timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
            filename = RAW_DIR / f"{loc}_{timestamp}.json"
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"Saved raw data for {loc}")
        except Exception as e:
            print(f"Failed fetching {loc}: {e}")

if __name__ == "__main__":
    main()
