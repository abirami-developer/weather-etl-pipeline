import streamlit as st
import pandas as pd
import psycopg2
import plotly.express as px

# -----------------------------
# DATABASE CONNECTION
# -----------------------------
def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="weather_db",
        user="postgres",
        password="postgresql",
        port="5432"
    )

# -----------------------------
# LOAD DATA
# -----------------------------
def load_weather_data():
    conn = get_connection()
    query = "SELECT * FROM weather_clean;"
    df = pd.read_sql(query, conn)
    conn.close()
    return df

# -----------------------------
# STREAMLIT UI
# -----------------------------
st.set_page_config(page_title="Weather Dashboard", layout="wide")
st.title("🌦️ Weather ETL Dashboard")

df = load_weather_data()

st.subheader("Raw Weather Data")
st.dataframe(df)

# -----------------------------
# Visualization
# -----------------------------
st.subheader("Temperature Trend")
fig = px.line(df, x="observed_at", y="temperature", title="Daily Temperature Trend")
st.plotly_chart(fig, use_container_width=True)
