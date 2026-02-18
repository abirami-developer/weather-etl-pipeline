from sqlalchemy import create_engine, text
import pandas as pd

# PostgreSQL credentials
DB_USER = "postgres"
DB_PASSWORD = "postgresql"  # your password
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "weather_db"

def get_engine():
    engine = create_engine(f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    return engine

def fetch_weather_data(start_date=None, end_date=None, locations=None):
    engine = get_engine()
    sql = "SELECT observed_at, location, temperature, humidity, weather_condition FROM weather_clean WHERE 1=1"
    params = {}

    if start_date:
        sql += " AND observed_at::date >= :start_date"
        params["start_date"] = start_date
    if end_date:
        sql += " AND observed_at::date <= :end_date"
        params["end_date"] = end_date
    if locations:
        sql += " AND location = ANY(:locations)"
        params["locations"] = locations

    sql += " ORDER BY observed_at"

    with engine.connect() as conn:
        df = pd.read_sql(text(sql), conn, params=params)
    return df

def get_unique_locations():
    engine = get_engine()
    sql = "SELECT DISTINCT location FROM weather_clean ORDER BY location"
    with engine.connect() as conn:
        df = pd.read_sql(sql, conn)
    return df['location'].tolist()
