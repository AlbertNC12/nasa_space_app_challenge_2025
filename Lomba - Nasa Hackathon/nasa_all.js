let map;
let marker;
let currentLat = -6.9024942;
let currentLng = 107.5607453;

// Set max date to today
const today = new Date().toISOString().split("T")[0];
document.getElementById("nasaDate").value = today;
document.getElementById("nasaDate").max = today;

// Navigation
const pages = {
  home: document.getElementById("homePage"),
  about: document.getElementById("aboutPage"),
  maps: document.getElementById("mapsPage"),
  contact: document.getElementById("contactPage"),
};

function showPage(pageName) {
  Object.values(pages).forEach((page) => page.classList.add("hidden"));
  if (pages[pageName]) {
    pages[pageName].classList.remove("hidden");
    if (pageName === "maps" && !map) {
      setTimeout(() => initMap(), 100);
    }
  }
}

document.querySelectorAll("#desktopNav a, .mobile-menu a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showPage(e.target.dataset.page);
    document.getElementById("mobileMenu").classList.remove("active");
  });
});

document.getElementById("hamburger").addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.add("active");
});

document.getElementById("closeMenu").addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.remove("active");
});

document.getElementById("startPredicting").addEventListener("click", () => {
  showPage("maps");
});

// Range sliders
document.getElementById("windSpeed").addEventListener("input", function () {
  document.getElementById("windSpeedValue").textContent = this.value + " km/h";
});

document.getElementById("rainProb").addEventListener("input", function () {
  document.getElementById("rainProbValue").textContent = this.value + "%";
});

document.getElementById("stormProb").addEventListener("input", function () {
  document.getElementById("stormProbValue").textContent = this.value + "%";
});

function initMap() {
  map = L.map("map").setView([currentLat, currentLng], 13);

  const osmLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }
  );

  const nasaModis = L.tileLayer(
    "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg",
    {
      attribution: "NASA GIBS",
      tileMatrixSet: "GoogleMapsCompatible_Level9",
      time: getYesterdayDate(),
      tileSize: 256,
      maxZoom: 9,
      opacity: 0.8,
    }
  );

  osmLayer.addTo(map);
  L.control
    .layers({ "Street Map": osmLayer, "NASA Satellite": nasaModis })
    .addTo(map);

  marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
  marker.bindPopup("<b>Selected Location</b>").openPopup();

  marker.on("dragend", function (e) {
    const pos = e.target.getLatLng();
    updateLocationInfo(pos.lat, pos.lng);
  });

  map.on("click", function (e) {
    marker.setLatLng(e.latlng);
    updateLocationInfo(e.latlng.lat, e.latlng.lng);
  });

  updateLocationInfo(currentLat, currentLng);
}

function getYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported");
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    map.setView([lat, lng], 14);
    marker.setLatLng([lat, lng]);
    updateLocationInfo(lat, lng);
  });
}

async function searchLocation() {
  const query = document.getElementById("searchInput").value;
  if (!query) return;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      map.setView([lat, lng], 13);
      marker.setLatLng([lat, lng]);
      updateLocationInfo(lat, lng);
    }
  } catch (error) {
    console.error("Search error:", error);
  }
}

function updateLocationInfo(lat, lng) {
  currentLat = lat;
  currentLng = lng;
  document.getElementById("nasaLat").value = lat.toFixed(7);
  document.getElementById("nasaLon").value = lng.toFixed(7);
}

document
  .getElementById("searchInput")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") searchLocation();
  });

// Submit NASA Data to Backend
async function submitNASAData() {
  const nasaData = {
    date: document.getElementById("nasaDate").value,
    latitude: parseFloat(document.getElementById("nasaLat").value),
    longitude: parseFloat(document.getElementById("nasaLon").value),
    windSpeed: parseInt(document.getElementById("windSpeed").value),
    rainProbability: parseInt(document.getElementById("rainProb").value),
    stormProbability: parseInt(document.getElementById("stormProb").value),
  };

  console.log("Sending to backend:", nasaData);

  try {
    // TODO: Replace with your actual backend URL
    const response = await fetch("YOUR_BACKEND_API_URL", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nasaData),
    });

    const result = await response.json();
    displayResults(result);
  } catch (error) {
    console.error("Error:", error);
    // Show mock results for demo
    displayResults({
      prediction: "Rainy",
      confidence: "85%",
      temperature: "24°C",
      conditions: "Expect rainfall in the next 6 hours",
    });
  }
}

function displayResults(data) {
  const resultsContent = document.getElementById("resultsContent");
  resultsContent.innerHTML = `
                <div class="result-item">
                    <span class="result-label">Weather Prediction:</span>
                    <span class="result-value">${
                      data.prediction || "Processing..."
                    }</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Confidence:</span>
                    <span class="result-value">${
                      data.confidence || "N/A"
                    }</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Temperature:</span>
                    <span class="result-value">${
                      data.temperature || "N/A"
                    }</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Conditions:</span>
                    <span class="result-value">${
                      data.conditions || "N/A"
                    }</span>
                </div>
            `;
  document.getElementById("resultsSection").classList.add("show");
}
