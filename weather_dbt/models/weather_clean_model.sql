-- models/weather_clean_model.sql

with raw as (
    select *
    from weather_raw
),

hourly_data as (
    select
        location,
        jsonb_array_elements_text(raw_json->'hourly'->'time') as observed_at,
        jsonb_array_elements_text(raw_json->'hourly'->'temperature_2m')::double precision as temperature,
        jsonb_array_elements_text(raw_json->'hourly'->'relativehumidity_2m')::double precision as humidity
    from raw
),

final as (
    select
        row_number() over () as id,   -- generate sequential id
        location,
        observed_at,
        temperature,
        humidity
    from hourly_data
)

select *
from final
