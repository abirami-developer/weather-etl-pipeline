@echo off
call .venv\Scripts\activate

echo Fetching weather data...
python -m ingest.fetch_weather

echo Loading raw data into DB...
python -m scripts.load_raw

echo Transforming and loading clean data...
python -m scripts.transform_clean

echo Starting Flask dashboard...
cd weather_website
python app.py

pause
