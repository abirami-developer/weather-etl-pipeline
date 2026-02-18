@echo off
REM Activate virtual environment
call .venv\Scripts\activate

echo Starting Daily ETL...
python -m ingest.fetch_weather
python -m scripts.load_raw
python -m scripts.transform_clean

echo ETL completed successfully!
exit
