/**
 * RailPulse Leaflet.js Live Train GPS Map Tracker
 */

let leafletMap = null;
let trainMarker = null;
let routePolylineLayer = null;
let stationMarkersGroup = null;
let autoFollow = true;
let currentTrackedId = '12952';

function initLiveMap() {
  const mapContainer = document.getElementById('leafletMap');
  if (!mapContainer || leafletMap) return;

  // Initialize Leaflet map
  leafletMap = L.map('leafletMap', {
    zoomControl: true,
    attributionControl: false
  }).setView([24.5, 76.5], 6);

  // Add OpenStreetMap Tile Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
  }).addTo(leafletMap);

  stationMarkersGroup = L.layerGroup().addTo(leafletMap);

  // Custom Train SVG Icon
  const trainSvgIcon = L.divIcon({
    className: 'custom-train-marker',
    html: `
      <div style="background: #0284c7; color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(2, 132, 199, 0.8); border: 3px solid white;">
        <i class="fa-solid fa-train-subway" style="font-size: 1.25rem;"></i>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  trainMarker = L.marker([28.6430, 77.2194], { icon: trainSvgIcon }).addTo(leafletMap);
  trainMarker.bindPopup("<b>12952 - Mumbai Rajdhani Express</b><br>Speed: 124 km/h<br>Next Stop: Kanpur Central").openPopup();

  drawRoutePolyline();
}

function drawRoutePolyline() {
  if (routePolylineLayer) leafletMap.removeLayer(routePolylineLayer);
  stationMarkersGroup.clearLayers();

  // Coordinates between New Delhi, Kanpur, Prayagraj, Ahmedabad, Mumbai
  const polyCoords = [
    [28.6430, 77.2194], // NDLS
    [26.4537, 80.3507], // CNB
    [25.4414, 81.8267], // PRYJ
    [23.0225, 72.5714], // ADI
    [18.9696, 72.8193]  // MMCT
  ];

  const stationLabels = ["New Delhi (NDLS)", "Kanpur Central (CNB)", "Prayagraj (PRYJ)", "Ahmedabad (ADI)", "Mumbai Central (MMCT)"];

  routePolylineLayer = L.polyline(polyCoords, {
    color: '#0284c7',
    weight: 5,
    opacity: 0.85,
    dashArray: '10, 8'
  }).addTo(leafletMap);

  polyCoords.forEach((coord, idx) => {
    const stationIcon = L.divIcon({
      className: 'station-dot-marker',
      html: `<div style="background: white; border: 3px solid #0284c7; width: 14px; height: 14px; border-radius: 50%; shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    const marker = L.marker(coord, { icon: stationIcon }).bindPopup(`<b>Station:</b> ${stationLabels[idx]}`);
    stationMarkersGroup.addLayer(marker);
  });

  leafletMap.fitBounds(routePolylineLayer.getBounds(), { padding: [50, 50] });
}

function updateLiveMapPosition(telemetryData) {
  if (!leafletMap || !trainMarker || !telemetryData) return;

  const t = telemetryData[currentTrackedId] || telemetryData['12952'];
  if (!t) return;

  const newLatLng = new L.LatLng(t.lat, t.lng);
  trainMarker.setLatLng(newLatLng);

  if (autoFollow) {
    leafletMap.panTo(newLatLng);
  }

  // Update overlay numbers
  const speedEl = document.getElementById('mapLiveSpeed');
  if (speedEl) speedEl.innerText = `${t.speedKmh} km/h`;

  const healthEl = document.getElementById('mapEngineHealth');
  if (healthEl) healthEl.innerText = `OPTIMAL (${t.engineTemp}°C)`;

  const statusEl = document.getElementById('mapStatusText');
  if (statusEl) statusEl.innerText = `${t.status} (+${t.delayMins}m)`;

  trainMarker.setPopupContent(`
    <div class="p-1">
      <h6 class="fw-bold mb-1 text-primary">${t.trainName} (${t.trainNumber})</h6>
      <div class="small"><b>Current Speed:</b> ${t.speedKmh} km/h</div>
      <div class="small"><b>Current Position:</b> ${t.currentStation}</div>
      <div class="small"><b>Next Stop:</b> ${t.nextStation}</div>
      <div class="small"><b>Engine Temp:</b> ${t.engineTemp} °C</div>
    </div>
  `);
}

function switchTrackedTrain(trainId) {
  currentTrackedId = trainId;
  drawRoutePolyline();
}

function toggleAutoFollowMap() {
  autoFollow = !autoFollow;
  alert(`Auto-Follow Camera is now ${autoFollow ? 'ENABLED' : 'DISABLED'}.`);
}

function toggleMapTheme() {
  alert('Map tile theme switched.');
}
