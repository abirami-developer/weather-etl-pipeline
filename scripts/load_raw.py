# scripts/load_raw.py
import json
from pathlib import Path
import datetime
import psycopg2
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))
from config.db_config import DB_CONFIG

RAW_DIR = Path(__file__).resolve().parents[1] / "raw"

def load_raw_to_db():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    for file in sorted(RAW_DIR.glob("*.json")):
        location = file.stem.split("_")[0]
        with open(file, "r", encoding="utf-8") as f:
            data = json.load(f)

        cur.execute(
            "INSERT INTO weather_raw (location, timestamp, raw_json) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
            (location, datetime.datetime.utcnow(), json.dumps(data))
        )
        conn.commit()
        print(f"Loaded {file.name} into DB")

    cur.close()
    conn.close()

if __name__ == "__main__":
    load_raw_to_db()
