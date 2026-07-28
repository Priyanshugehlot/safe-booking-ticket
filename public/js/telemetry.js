/**
 * RailPulse Telemetry & Sensor Analytics Engine (Chart.js)
 */

let telemetryChartInstance = null;
let speedDataPoints = [95, 105, 112, 120, 124, 126, 124];
let powerDataPoints = [2600, 2800, 3100, 3350, 3420, 3450, 3420];
let labelTimestamps = ['12:00', '12:01', '12:02', '12:03', '12:04', '12:05', '12:06'];

function initTelemetryChart() {
  const ctx = document.getElementById('telemetryChart');
  if (!ctx || telemetryChartInstance) return;

  telemetryChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labelTimestamps,
      datasets: [
        {
          label: 'Loco Speed (km/h)',
          data: speedDataPoints,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Traction Power (kWh)',
          data: powerDataPoints,
          borderColor: '#06b6d4',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Speed (km/h)' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Power (kWh)' }
        }
      }
    }
  });
}

function updateTelemetryGauges(data) {
  const t = data['12952'] || data[Object.keys(data)[0]];
  if (!t) return;

  const spdEl = document.getElementById('telemSpeed');
  if (spdEl) spdEl.innerHTML = `${t.speedKmh} <small class="fs-6">km/h</small>`;

  const spdBar = document.getElementById('telemSpeedBar');
  if (spdBar) spdBar.style.width = `${(t.speedKmh / t.maxSpeed) * 100}%`;

  const tmpEl = document.getElementById('telemTemp');
  if (tmpEl) tmpEl.innerHTML = `${t.engineTemp} <small class="fs-6">°C</small>`;

  const tmpBar = document.getElementById('telemTempBar');
  if (tmpBar) tmpBar.style.width = `${(t.engineTemp / 110) * 100}%`;

  const pwrEl = document.getElementById('telemPower');
  if (pwrEl) pwrEl.innerHTML = `${t.powerKwh} <small class="fs-6">kWh</small>`;

  const occEl = document.getElementById('telemOccupancy');
  if (occEl) occEl.innerHTML = `${t.occupancyPct} <small class="fs-6">%</small>`;

  // Append new data point to graph
  if (telemetryChartInstance) {
    const timeNow = new Date().toLocaleTimeString().slice(0, 5);
    speedDataPoints.push(t.speedKmh);
    powerDataPoints.push(t.powerKwh);
    labelTimestamps.push(timeNow);

    if (speedDataPoints.length > 12) {
      speedDataPoints.shift();
      powerDataPoints.shift();
      labelTimestamps.shift();
    }

    telemetryChartInstance.update();
  }
}
