

function createDailyArray(parameterData) {
    return Object.entries(parameterData)
        .filter(([date, value]) => value !== -999)
        .map(([date, value]) => ({ date, value }));
}

async function submitNASAData() {
    const lat = document.getElementById("nasaLat").value;
    const lon = document.getElementById("nasaLon").value;
    const datestart = document.getElementById("nasaStartDate").value.replace(/-/g,'');
    const dateend = document.getElementById("nasaEndDate").value.replace(/-/g,'');

    const urls = {
        tempMax: `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX&community=AG&longitude=${lon}&latitude=${lat}&start=${datestart}&end=${dateend}&format=JSON`,
        humidity: `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=RH2M&community=AG&longitude=${lon}&latitude=${lat}&start=${datestart}&end=${dateend}&format=JSON`,
        wind: `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=WS10M&community=AG&longitude=${lon}&latitude=${lat}&start=${datestart}&end=${dateend}&format=JSON`,
        precipitation: `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR&community=AG&longitude=${lon}&latitude=${lat}&start=${datestart}&end=${dateend}&format=JSON`
    };

    // Fetch all data in parallel
    const [tempRes, humRes, windRes, precRes] = await Promise.all([
        fetch(urls.tempMax),
        fetch(urls.humidity),
        fetch(urls.wind),
        fetch(urls.precipitation)
    ]);

    const tempData = await tempRes.json();
    const humData = await humRes.json();
    const windData = await windRes.json();
    const precData = await precRes.json();

    // Get the date keys (assuming they all have same dates)
    const dates = Object.keys(tempData.properties.parameter.T2M_MAX);

    // Build an array of objects
    const weatherArray = dates.map(date => ({
        date: formatNASAdate(date),
        temperature: tempData.properties.parameter.T2M_MAX[date],
        humidity: humData.properties.parameter.RH2M[date],
        windSpeed: windData.properties.parameter.WS10M[date],
        precipitation: precData.properties.parameter.PRECTOTCORR[date]
    })).filter(d => d.temperature !== -999 && d.humidity !== -999 && d.windSpeed !== -999 && d.precipitation !== -999);;
    // Your array ready to use
    return weatherArray;
}
function formatNASAdate(d) {
    // '20251002' → '2025-10-02'
    return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
}