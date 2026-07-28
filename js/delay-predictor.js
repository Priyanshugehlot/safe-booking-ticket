/**
 * RailPulse AI Delay Predictor Controller
 */

function initDelayPredictor() {
  const form = document.getElementById('delayPredictorForm');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const weather = document.getElementById('aiWeather').value;
    const densityPct = Number(document.getElementById('aiDensity').value);
    const peakHours = document.getElementById('aiPeakHours').checked;
    const maintenance = document.getElementById('aiMaintenance').checked;

    try {
      const res = await ApiService.predictDelay({ weather, densityPct, peakHours, maintenance });
      renderAiPredictorResult(res);
    } catch (err) {
      alert('Error calculating delay forecast.');
    }
  };
}

function renderAiPredictorResult(res) {
  const probEl = document.getElementById('aiDelayProb');
  const titleEl = document.getElementById('aiRiskTitle');
  const suggestEl = document.getElementById('aiSuggestedText');
  const estEl = document.getElementById('aiEstDelay');

  if (!probEl) return;

  probEl.innerText = `${res.delayProbabilityPct}%`;

  if (res.riskLevel === 'Low') {
    probEl.className = 'display-3 fw-extrabold text-success my-3';
    titleEl.innerText = 'Low Delay Risk (On Time)';
  } else if (res.riskLevel === 'Medium') {
    probEl.className = 'display-3 fw-extrabold text-warning my-3';
    titleEl.innerText = 'Moderate Risk (+15m to 25m Delay)';
  } else {
    probEl.className = 'display-3 fw-extrabold text-danger my-3';
    titleEl.innerText = 'High Risk of Heavy Delay (+45m+)';
  }

  suggestEl.innerText = res.suggestedAction;
  if (estEl) estEl.innerText = `${res.estimatedDelayMins} Mins`;
}
