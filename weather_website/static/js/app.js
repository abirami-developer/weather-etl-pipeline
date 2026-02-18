let tempChart, humChart, heatmapChart, chartData = [], summaryData = [];

const iconMap = {
    "Sunny": "/static/icons/sunny.png",
    "Cloudy": "/static/icons/cloudy.png",
    "Rain": "/static/icons/rain.png",
    "Unknown": "/static/icons/unknown.png"
};

// Load locations into select
async function loadLocations() {
    const res = await fetch("/api/locations");
    const locations = await res.json();
    const select = document.getElementById("locationSelect");
    select.innerHTML = "";
    locations.forEach(loc => {
        const option = document.createElement("option");
        option.value = loc;
        option.text = loc;
        select.add(option);
    });
}
loadLocations();

// Fetch weather data & summary
async function fetchData() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const select = document.getElementById("locationSelect");
    const selectedLocations = Array.from(select.selectedOptions).map(o => o.value);

    if(selectedLocations.length === 0) { alert("Select at least one location"); return; }
    if(startDate && endDate && startDate > endDate) { alert("Start date cannot be after end date"); return; }

    const params = new URLSearchParams();
    if(startDate) params.append("start_date", startDate);
    if(endDate) params.append("end_date", endDate);
    selectedLocations.forEach(loc => params.append("locations[]", loc));

    const res = await fetch("/api/weather?" + params.toString());
    const result = await res.json();

    if(result.error) { alert(result.error); return; }

    chartData = result.data;
    summaryData = result.summary;

    renderKPIs(summaryData);
    renderCharts(chartData, selectedLocations);
    renderHeatmap(chartData, selectedLocations);
}

// Render KPI cards dynamically
function renderKPIs(summary) {
    const container = document.getElementById("kpiContainer");
    container.innerHTML = "";
    summary.forEach(s => {
        const icon = iconMap[s.weather_summary.split(",")[0]] || iconMap["Unknown"];
        container.innerHTML += `
        <div class="kpi-card">
            <h3>${s.location}</h3>
            <p>Avg Temp: ${s.avg_temp.toFixed(1)} °C</p>
            <p>Max Temp: ${s.max_temp} °C</p>
            <p>Min Temp: ${s.min_temp} °C</p>
            <p>Avg Humidity: ${s.avg_humidity.toFixed(1)} %</p>
            <p>Weather: ${s.weather_summary} <img src="${icon}" width="24"></p>
        </div>
        `;
    });
}

// Render line charts
function renderCharts(data, locations){
    const allLabels=[...new Set(data.map(d=>d.observed_at))];
    const labels=allLabels.map(d=>new Date(d).toLocaleDateString('en-GB'));

    const datasetsTemp=locations.map((loc,idx)=>({
        label: loc,
        data:data.filter(d=>d.location===loc).map(d=>d.temperature),
        borderColor:`hsl(${idx*60},70%,50%)`,
        fill:false
    }));

    const datasetsHum=locations.map((loc,idx)=>({
        label: loc,
        data:data.filter(d=>d.location===loc).map(d=>d.humidity),
        borderColor:`hsl(${idx*60},50%,50%)`,
        fill:false
    }));

    if(tempChart) tempChart.destroy();
    if(humChart) humChart.destroy();

    const commonOptions={
        responsive:true,
        plugins:{
            legend:{position:'top'},
            tooltip:{mode:'index', intersect:false}
        },
        scales:{x:{ticks:{maxRotation:45,minRotation:45,autoSkip:true,maxTicksLimit:10}}}
    };

    tempChart = new Chart(document.getElementById("tempChart").getContext("2d"), {
        type:"line",
        data:{labels,datasets:datasetsTemp},
        options:{...commonOptions, plugins:{...commonOptions.plugins,title:{display:true,text:"Temperature (°C)"}}}
    });

    humChart = new Chart(document.getElementById("humChart").getContext("2d"), {
        type:"line",
        data:{labels,datasets:datasetsHum},
        options:{...commonOptions, plugins:{...commonOptions.plugins,title:{display:true,text:"Humidity (%)"}}}
    });
}

// Render heatmap
function renderHeatmap(data, locations){
    if(heatmapChart) heatmapChart.destroy();
    const ctx=document.getElementById("heatmapChart").getContext("2d");
    const allLabels=[...new Set(data.map(d=>d.observed_at))];
    const labels=allLabels.map(d=>new Date(d).toLocaleDateString('en-GB'));

    const datasets=locations.map((loc,idx)=>({
        label: loc,
        data:data.filter(d=>d.location===loc).map(d=>d.temperature),
        backgroundColor:data.filter(d=>d.location===loc).map(d=>`rgba(${Math.min(255,d.temperature*5)},0,${255-Math.min(255,d.temperature*5)},0.6)`)
    }));

    heatmapChart = new Chart(ctx,{
        type:"bar",
        data:{labels,datasets},
        options:{
            responsive:true,
            plugins:{
                title:{display:true,text:"Temperature Heatmap"},
                legend:{position:"top"},
                tooltip:{enabled:true, callbacks:{
                    label:function(context){
                        return `${context.dataset.label}: ${context.raw} °C`;
                    }
                }}
            },
            scales:{x:{ticks:{maxRotation:45,minRotation:45,autoSkip:true,maxTicksLimit:10}}}
        }
    });
}

// Export CSV
function exportCSV(){
    if(chartData.length===0) return alert("No data to export!");
    let csv="observed_at,location,temperature,humidity,weather_condition\n";
    chartData.forEach(d=>{ csv+=`${d.observed_at},${d.location},${d.temperature},${d.humidity},${d.weather_condition}\n`; });
    const blob=new Blob([csv],{type:"text/csv"});
    const link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download="weather_data.csv";
    link.click();
}

// Export all charts as PNG
function exportCharts(){
    if(!tempChart && !humChart && !heatmapChart) return alert("No charts to export!");
    [tempChart, humChart, heatmapChart].forEach((c,idx)=>{
        if(!c) return;
        const link=document.createElement("a");
        link.href=c.toBase64Image();
        link.download=`chart_${idx+1}.png`;
        link.click();
    });
}

// Toggle dark/light mode
function toggleMode(){
    document.body.classList.toggle("light-mode");
}
