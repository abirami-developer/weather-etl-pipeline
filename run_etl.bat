@echo off
:: ------------------------------
:: Weather ETL — Full Batch Script
:: ------------------------------

:: ------------------------------
:: 1. Create timestamp (safe for filenames)
:: ------------------------------
setlocal enabledelayedexpansion

for /f "tokens=1-6 delims=/:. " %%a in ("%date% %time%") do (
    set YYYY=%%f
    set MM=%%b
    set DD=%%c
    set HH=%%d
    set MN=%%e
    set SS=%%a
)

:: Format timestamp as YYYYMMDDTHHMMSS
set TIMESTAMP=%YYYY%%MM%%DD%T%HH%%MN%%SS%

:: ------------------------------
:: 2. Define log file
:: ------------------------------
set LOGFILE=logs\weather_etl_%TIMESTAMP%.log

:: Create logs folder if not exist
if not exist logs (
    mkdir logs
)

echo ------------------------------------ >> %LOGFILE%
echo Running Weather ETL: %TIMESTAMP% >> %LOGFILE%
echo ------------------------------------ >> %LOGFILE%

:: ------------------------------
:: 3. Run data ingestion
:: ------------------------------
echo Running fetch_weather.py... >> %LOGFILE%
python ingest\fetch_weather.py >> %LOGFILE% 2>&1

:: ------------------------------
:: 4. Load raw data
:: ------------------------------
echo Running load_raw.py... >> %LOGFILE%
python scripts\load_raw.py >> %LOGFILE% 2>&1

:: ------------------------------
:: 5. Run dbt transformations
:: ------------------------------
echo Running dbt run... >> %LOGFILE%
cd weather_dbt
dbt run >> ..\%LOGFILE% 2>&1
dbt test >> ..\%LOGFILE% 2>&1
cd ..

:: ------------------------------
:: 6. ETL completed
:: ------------------------------
echo ------------------------------------ >> %LOGFILE%
echo ETL completed at %time% >> %LOGFILE%
echo ------------------------------------ >> %LOGFILE%

:: ------------------------------
:: 7. Clean old logs (older than 7 days)
:: ------------------------------
forfiles /p "logs" /s /m *.log /d -7 /c "cmd /c del @path"

endlocal
