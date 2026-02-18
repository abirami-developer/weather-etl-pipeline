# scripts/transform_clean.py
import sys
from pathlib import Path
import json
import pandas as pd
import psycopg2

# add project root to path for config import
sys.path.append(str(Path(__file__).resolve().parents[1]))
from config.db_config import DB_CONFIG

RAW_DIR = Path(__file__).resolve().parents[1] / "raw"

def clean_data():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    for json_file in sorted(RAW_DIR.glob("*.json")):
        with open(json_file, "r", encoding="utf-8") as f:
            raw = json.load(f)

        hourly = raw.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        humidity = hourly.get("relativehumidity_2m", [])

        if not times:
            continue

        df = pd.DataFrame({
            "observed_at": times,
            "temperature": temps,
            "humidity": humidity
        })

        location = json_file.stem.split("_")[0]

        for _, row in df.iterrows():
            cur.execute("""
                INSERT INTO weather_clean (location, observed_at, temperature, humidity)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT DO NOTHING;
            """, (location, row["observed_at"], row["temperature"], row["humidity"]))

    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    clean_data()
    print("Transformed & loaded clean data!")
