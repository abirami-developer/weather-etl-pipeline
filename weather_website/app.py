import sys
from pathlib import Path

# Ensure project root is in Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from flask import Flask, jsonify, request, render_template
import pandas as pd

# Import DB helper functions
from services.db import fetch_weather_data, get_unique_locations

# Initialize Flask app
app = Flask(__name__, template_folder="templates", static_folder="static")

# Home page
@app.route("/")
def index():
    return render_template("index.html")

# Get list of available cities
@app.route("/api/locations")
def api_locations():
    try:
        locations = get_unique_locations()
        return jsonify(locations)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Fetch weather data for selected cities and date range
@app.route("/api/weather")
def api_weather():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    locations = request.args.getlist("locations[]")

    try:
        df = fetch_weather_data(start_date, end_date, locations)
        if df.empty:
            return jsonify({"error": "No data found"}), 404

        # Prepare data for charts
        data = df.to_dict(orient="records")

        # Prepare summary for KPIs
        summary = []
        for loc, group in df.groupby("location"):
            summary.append({
                "location": loc,
                "avg_temp": group["temperature"].mean(),
                "max_temp": group["temperature"].max(),
                "min_temp": group["temperature"].min(),
                "avg_humidity": group["humidity"].mean(),
                "weather_summary": group["weather_condition"].mode()[0] if "weather_condition" in group else "Unknown"
            })

        return jsonify({"data": data, "summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the app
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
