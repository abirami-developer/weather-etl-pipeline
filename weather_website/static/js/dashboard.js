let tempChart, humChart, heatmapChart, chartData = [], summaryData = [];

const colorPalette = [
    "#1f77b4","#ff7f0e","#2ca02c","#d62728",
    "#9467bd","#8c564b","#e377c2","#7f7f7f",
    "#bcbd22","#17becf"
];

const iconMap = {
    "Sunny": "/static/icons/sunny.png",
    "Cloudy": "/static/icons/cloudy.png",
    "Rain": "/static/icons/rain.png",
    "Unknown": "/static/icons/unknown.png"
};

// Load locations
async function loadLocations() {
    const res = await fetch("/api/locations");
    const locations = await res.json();
    const select = document.getElementById("locationSelect");
    select.innerHTML = "";
    locations.forEach((loc) => {
        const option = document.createElement("option");
        option.value = loc;
        option.text = loc;
        select.add(option);
    });
}
loadLocations();

// Fetch weather data
async function fetchData() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const select = document.getElementById("locationSelect");
    const selectedLocations = Array.from(select.selectedOptions).map(o => o.value);

    if(selectedLocations.length === 0){ alert("Select at least one location"); return; }
    if(startDate && endDate && startDate > endDate){ alert("Start date cannot be after end date"); return; }

    document.getElementById('loadingSpinner').classList.remove('d-none');

    try {
        const params = new URLSearchParams();
        if(startDate) params.append("start_date", startDate);
        if(endDate) params.append("end_date", endDate);
        selectedLocations.forEach(loc => params.append("locations[]", loc));

        const res = await fetch("/api/weather?" + params.toString());
        const result = await res.json();
        if(result.error){ alert(result.error); return; }

        chartData = result.data;
        summaryData = result.summary;

        renderKPIs(summaryData);
        renderCharts(chartData, selectedLocations);
        renderHeatmap(chartData, selectedLocations);

        document.getElementById("lastUpdated").innerText = new Date().toLocaleString();
    } finally {
        document.getElementById('loadingSpinner').classList.add('d-none');
    }
}

// Render KPIs
function renderKPIs(summary){
    const container = document.getElementById("kpiContainer");
    container.innerHTML = "";
    summary.forEach((s, idx) => {
        const icon = iconMap[s.weather_summary.split(",")[0]] || iconMap["Unknown"];
        container.innerHTML += `
        <div class="col-md-3">
            <div class="kpi-card">
                <h5>${s.location}</h5>
                <p>Avg Temp: ${s.avg_temp.toFixed(1)} °C</p>
                <p>Max Temp: ${s.max_temp} °C</p>
                <p>Min Temp: ${s.min_temp} °C</p>
                <p>Avg Humidity: ${s.avg_humidity.toFixed(1)} %</p>
                <p>Weather: ${s.weather_summary} <img src="${icon}" width="24"></p>
            </div>
        </div>`;
    });
}

// Smooth charts
function renderCharts(data, locations){
    const allLabels=[...new Set(data.map(d=>d.observed_at))];
    const labels=allLabels.map(d=>new Date(d).toLocaleDateString('en-GB'));

    const datasetsTemp = locations.map((loc, idx)=>({
        label: loc,
        data:data.filter(d=>d.location===loc).map(d=>d.temperature),
        borderColor: colorPalette[idx % colorPalette.length],
        backgroundColor: colorPalette[idx % colorPalette.length]+"33",
        fill: true,
        tension: 0.4,
        pointRadius: 3
    }));

    const datasetsHum = locations.map((loc, idx)=>({
        label: loc,
        data:data.filter(d=>d.location===loc).map(d=>d.humidity),
        borderColor: colorPalette[idx % colorPalette.length],
        backgroundColor: colorPalette[idx % colorPalette.length]+"22",
        fill: true,
        tension: 0.4,
        pointRadius: 3
    }));

    const commonOptions={
        responsive:true,
        plugins:{legend:{position:'top'}, tooltip:{mode:'index', intersect:false}},
        interaction:{mode:'nearest', intersect:false},
        scales:{x:{ticks:{maxRotation:45,minRotation:45,autoSkip:true,maxTicksLimit:10}}},
        animation:{duration:800, easing:'easeOutQuart'}
    };

    if(tempChart) tempChart.destroy();
    if(humChart) humChart.destroy();

    tempChart=new Chart(document.getElementById("tempChart").getContext("2d"),{
        type:"line",
        data:{labels,datasets:datasetsTemp},
        options:{...commonOptions, plugins:{...commonOptions.plugins, title:{display:true,text:"Temperature (°C)"}}}
    });

    humChart=new Chart(document.getElementById("humChart").getContext("2d"),{
        type:"line",
        data:{labels,datasets:datasetsHum},
        options:{...commonOptions, plugins:{...commonOptions.plugins, title:{display:true,text:"Humidity (%)"}}}
    });
}

// Heatmap
function renderHeatmap(data, locations){
    if(heatmapChart) heatmapChart.destroy();
    const ctx = document.getElementById("heatmapChart").getContext("2d");
    const allLabels=[...new Set(data.map(d=>d.observed_at))];
    const labels=allLabels.map(d=>new Date(d).toLocaleDateString('en-GB'));

    const datasets = locations.map((loc, idx)=>{
        const locData = data.filter(d=>d.location===loc).map(d=>d.temperature);
        return {
            label: loc,
            data: locData,
            backgroundColor: locData.map(t=>{
                const r=Math.min(255,t*5); const g=0; const b=255-Math.min(255,t*5);
                return `rgba(${r},${g},${b},0.6)`;
            })
        };
    });

    heatmapChart=new Chart(ctx,{
        type:"bar",
        data:{labels,datasets},
        options:{
            responsive:true,
            plugins:{title:{display:true,text:"Temperature Heatmap"}, legend:{position:"top"}, tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.raw} °C`}} },
            scales:{x:{stacked:true},y:{stacked:false}},
            animation:{duration:800,easing:'easeOutQuart'}
        }
    });
}
