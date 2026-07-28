/**
 * RailPulse Main Frontend Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize AOS Scroll Animations
  if (typeof AOS !== 'undefined') AOS.init({ duration: 800, once: true });

  // Initialize Canvas Train Animation in Hero Banner
  initHeroTrainCanvas();

  // Set default travel date in search forms to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dateInput = document.getElementById('searchTravelDate');
  if (dateInput) dateInput.value = tomorrowStr;

  // Sync Auth State
  syncAuthState();

  // Dark Mode Toggle Bindings
  const darkToggle = document.getElementById('darkModeToggle');
  const darkToggleMobile = document.getElementById('darkModeToggleMobile');
  if (darkToggle) darkToggle.onclick = toggleDarkMode;
  if (darkToggleMobile) darkToggleMobile.onclick = toggleDarkMode;

  // Forms submit bindings
  const heroForm = document.getElementById('heroSearchForm');
  if (heroForm) {
    heroForm.onsubmit = (e) => {
      e.preventDefault();
      executeSearch();
    };
  }

  const resultsFilterForm = document.getElementById('resultsFilterForm');
  if (resultsFilterForm) {
    resultsFilterForm.onsubmit = (e) => {
      e.preventDefault();
      executeSearch();
    };
  }

  const pnrForm = document.getElementById('pnrSearchForm');
  if (pnrForm) {
    pnrForm.onsubmit = (e) => {
      e.preventDefault();
      executePnrSearch();
    };
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPassword').value;
      try {
        const res = await ApiService.login(email, pass);
        syncAuthState();
        
        const modalEl = document.getElementById('loginModal');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          if (modal) modal.hide();
        }
        
        // Clean backdrop artifacts
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style = '';

        // If user was booking, proceed directly to payment modal
        if (window.bookingDraft && window.bookingDraft.train) {
          openPaymentModal();
        } else {
          alert(`Welcome back, ${res.user.name}!`);
        }
      } catch (err) {
        alert(err.message || 'Login failed. Please check credentials.');
      }
    };
  }

  // Connect to SSE Live Stream
  initLiveStreamConnection();

  // Initial load default search
  executeSearch();
});

// View Navigation Router
function navigateTo(viewId, subParam = '') {
  document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add('active');

  // Update navbar links active state
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const navLink = document.getElementById(`nav-${viewId}`);
  if (navLink) navLink.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // View specific initializations
  if (viewId === 'liveStatusView') {
    setTimeout(initLiveMap, 100);
  } else if (viewId === 'telemetryView') {
    setTimeout(initTelemetryChart, 100);
  } else if (viewId === 'stationBoardView') {
    loadStationBoard('NDLS');
  } else if (viewId === 'tripPlannerView') {
    initDelayPredictor();
  } else if (viewId === 'dashboardView') {
    renderUserDashboard(subParam || 'trips');
  } else if (viewId === 'passengerView') {
    setTimeout(refreshSecurityCaptcha, 100);
  } else if (viewId === 'adminView') {
    initAdminPanel();
  }
}

// Search trains execution
async function executeSearch() {
  const from = document.getElementById('searchFromStation')?.value || document.getElementById('filterFrom')?.value || 'NDLS';
  const to = document.getElementById('searchToStation')?.value || document.getElementById('filterTo')?.value || 'MMCT';
  const cls = document.getElementById('searchClass')?.value || document.getElementById('filterClass')?.value || 'ALL';

  const container = document.getElementById('trainResultsContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Searching optimal train routes and seat availability...</p>
    </div>
  `;

  try {
    const trains = await ApiService.searchTrains(from, to, '', cls);
    renderTrainResults(trains);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Error fetching trains: ${err.message}</div>`;
  }
}

function quickSearchRoute(from, to) {
  if (document.getElementById('searchFromStation')) document.getElementById('searchFromStation').value = from;
  if (document.getElementById('searchToStation')) document.getElementById('searchToStation').value = to;
  navigateTo('searchView');
  executeSearch();
}

function renderTrainResults(trains) {
  const container = document.getElementById('trainResultsContainer');
  if (!container) return;

  if (trains.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 card glass-card border-0 rounded-4 p-4">
        <i class="fa-solid fa-train-subway text-muted fs-1 mb-2"></i>
        <h5>No trains found for selected route</h5>
        <p class="text-muted small">Try switching stations or selecting "All Classes".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = trains.map(t => `
    <div class="card glass-card border-0 rounded-4 shadow-sm p-4 card-hover">
      <div class="row align-items-center gy-3">
        <div class="col-lg-4">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">${t.number}</span>
            <span class="badge bg-secondary-subtle text-secondary small">${t.type}</span>
          </div>
          <h4 class="fw-bold mb-1">${t.name}</h4>
          <div class="small text-muted"><i class="fa-regular fa-calendar me-1"></i> Runs on: ${t.runningDays.join(', ')}</div>
        </div>

        <div class="col-lg-4">
          <div class="d-flex justify-content-between align-items-center text-center">
            <div>
              <div class="fs-4 fw-bold text-dark">${t.depTime}</div>
              <div class="small text-muted fw-semibold">${t.sourceName} (${t.sourceCode})</div>
            </div>
            <div class="px-3">
              <span class="small text-muted fw-bold d-block">${t.duration}</span>
              <div class="d-flex align-items-center gap-1 text-primary">
                <i class="fa-solid fa-circle" style="font-size: 0.4rem;"></i>
                <div style="height: 2px; width: 60px; background: currentColor;"></div>
                <i class="fa-solid fa-arrow-right"></i>
              </div>
              <span class="small text-muted d-block mt-1">${t.distanceKm} km</span>
            </div>
            <div>
              <div class="fs-4 fw-bold text-dark">${t.arrTime}</div>
              <div class="small text-muted fw-semibold">${t.destName} (${t.destCode})</div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <!-- Coach Classes Grid -->
          <div class="d-flex flex-wrap gap-2 mb-3">
            ${Object.keys(t.classes).map(c => `
              <div class="p-2 border rounded-3 text-center bg-body flex-fill" style="min-width: 75px;">
                <div class="fw-bold small">${c}</div>
                <div class="small text-success fw-semibold">AVL ${t.classes[c].available}</div>
                <div class="fw-extrabold text-primary small">₹${t.classes[c].price}</div>
              </div>
            `).join('')}
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-primary w-100 rounded-3 fw-bold shadow-sm" onclick="startSeatBooking('${t.id}')">
              <i class="fa-solid fa-chair me-1"></i> Select Seats & Book
            </button>
            <button class="btn btn-outline-secondary rounded-3" title="Live Status" onclick="navigateTo('liveStatusView')">
              <i class="fa-solid fa-location-dot"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

async function startSeatBooking(trainId) {
  try {
    const train = await ApiService.getTrainDetails(trainId);
    document.getElementById('seatTrainTitle').innerText = `Train #${train.number} - ${train.name}`;
    initSeatPicker(train);
    navigateTo('seatView');
  } catch (err) {
    alert('Failed to load train layout.');
  }
}

// PNR Search
async function executePnrSearch() {
  const pnrNum = document.getElementById('pnrInputNumber').value.trim();
  const card = document.getElementById('pnrResultCard');
  if (!card) return;

  if (!pnrNum) {
    alert('Please enter a 10-digit PNR number');
    return;
  }

  card.classList.remove('d-none');
  card.innerHTML = `<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>`;

  try {
    const booking = await ApiService.checkPnr(pnrNum);
    card.innerHTML = `
      <div class="border-bottom pb-3 mb-3 d-flex justify-content-between align-items-center">
        <div>
          <span class="badge bg-success mb-1">PNR: ${booking.pnr}</span>
          <h5 class="fw-bold mb-0">${booking.trainNumber} - ${booking.trainName}</h5>
        </div>
        <span class="badge bg-primary fs-6">${booking.chartStatus}</span>
      </div>

      <div class="row g-2 mb-3 small">
        <div class="col-6"><strong>From:</strong> ${booking.fromStationName} (${booking.fromStation})</div>
        <div class="col-6"><strong>To:</strong> ${booking.toStationName} (${booking.toStation})</div>
        <div class="col-6"><strong>Date:</strong> ${booking.travelDate}</div>
        <div class="col-6"><strong>Quota:</strong> ${booking.quota} (${booking.coachClass})</div>
      </div>

      <h6 class="fw-bold border-top pt-2">Passenger Manifest:</h6>
      <ul class="list-group list-group-flush mb-3 small">
        ${booking.passengers.map(p => `
          <li class="list-group-item bg-transparent d-flex justify-content-between">
            <span>${p.name} (${p.age}, ${p.gender})</span>
            <strong class="text-primary">${p.coach} / Seat ${p.seatNumber} (${p.status})</strong>
          </li>
        `).join('')}
      </ul>
    `;
  } catch (err) {
    card.innerHTML = `<div class="alert alert-danger mb-0"><i class="fa-solid fa-triangle-exclamation me-1"></i> ${err.message}</div>`;
  }
}

// User Dashboard Renderer
async function renderUserDashboard(tab = 'trips') {
  const container = document.getElementById('dashTabContent');
  if (!container) return;

  const user = ApiService.getCurrentUser();
  if (!user) {
    container.innerHTML = `<div class="alert alert-warning">Please login to view dashboard.</div>`;
    return;
  }

  document.getElementById('dashName').innerText = user.name;
  document.getElementById('dashEmail').innerText = user.email;
  document.getElementById('dashAvatar').innerText = user.name[0].toUpperCase();

  if (tab === 'trips') {
    container.innerHTML = `
      <h4 class="fw-bold mb-3"><i class="fa-solid fa-ticket text-primary me-2"></i> My Bookings & PNR Records</h4>
      <div id="dashBookingsList">
        <div class="spinner-border text-primary"></div>
      </div>
    `;

    try {
      const bookings = await ApiService.getUserBookings();
      const listEl = document.getElementById('dashBookingsList');
      if (!bookings.length) {
        listEl.innerHTML = `<p class="text-muted">No booking records found.</p>`;
        return;
      }
      listEl.innerHTML = bookings.map(b => `
        <div class="card bg-body border rounded-4 p-3 mb-3 shadow-sm">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-primary">PNR: ${b.pnr}</span>
            <span class="badge ${b.status === 'CONFIRMED' ? 'bg-success' : 'bg-danger'}">${b.status}</span>
          </div>
          <h5 class="fw-bold">${b.trainNumber} - ${b.trainName}</h5>
          <div class="small text-muted mb-2">${b.fromStationName} -> ${b.toStationName} | Date: ${b.travelDate}</div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="displayConfirmedTicket('${b.pnr}')">View Ticket PDF</button>
            ${b.status === 'CONFIRMED' ? `<button class="btn btn-outline-danger btn-sm rounded-pill" onclick="handleCancelTicket('${b.pnr}')">Cancel & Instant Refund</button>` : ''}
          </div>
        </div>
      `).join('');
    } catch (e) {}
  } else if (tab === 'wallet') {
    container.innerHTML = `
      <h4 class="fw-bold mb-3"><i class="fa-solid fa-wallet text-success me-2"></i> RailPulse Wallet & Instant Refunds</h4>
      <div class="p-4 bg-primary text-white rounded-4 mb-4 shadow">
        <span class="small text-white-70 text-uppercase fw-bold">Available Wallet Balance</span>
        <div class="display-5 fw-extrabold my-1">₹${(user.walletBalance || 3450).toLocaleString()}</div>
        <span class="small text-white-80">Instant 2-second credit on ticket cancellations</span>
      </div>
    `;
  }
}

async function handleCancelTicket(pnr) {
  if (confirm(`Confirm cancellation of PNR ${pnr}? 85% refund will be credited instantly to your RailPulse Wallet.`)) {
    try {
      const res = await ApiService.cancelBooking(pnr);
      alert(`Ticket Cancelled! ₹${res.refundAmount} credited to your Wallet.`);
      renderUserDashboard('trips');
    } catch (err) {
      alert('Cancellation failed.');
    }
  }
}

function displayConfirmedTicket(pnr) {
  ApiService.checkPnr(pnr).then(booking => {
    document.getElementById('ticketPnr').innerText = booking.pnr;
    document.getElementById('tFromCity').innerText = `${booking.fromStationName} (${booking.fromStation})`;
    document.getElementById('tToCity').innerText = `${booking.toStationName} (${booking.toStation})`;
    document.getElementById('tTrainNum').innerText = booking.trainNumber;
    document.getElementById('tBookingId').innerText = booking.bookingId;
    document.getElementById('tQuota').innerText = booking.quota;
    document.getElementById('tClass').innerText = booking.coachClass;
    document.getElementById('tTotalPaid').innerText = `₹${booking.fareDetails.totalAmount.toLocaleString()}`;

    const pList = document.getElementById('ticketPassengerList');
    if (pList) {
      pList.innerHTML = booking.passengers.map((p, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td class="fw-bold">
            ${p.name}
            <div class="small text-muted"><i class="fa-solid fa-phone me-1 text-info"></i> ${p.phone || '+91 9876543210'}</div>
            <div class="small text-muted"><i class="fa-solid fa-envelope me-1 text-warning"></i> ${p.email || 'passenger' + (idx+1) + '@example.com'}</div>
          </td>
          <td>${p.age} / ${p.gender}</td>
          <td><span class="badge bg-primary-subtle text-primary">${p.coach}</span></td>
          <td><strong>Seat ${p.seatNumber}</strong> (${p.berthType})</td>
          <td><span class="badge bg-success">${p.status}</span></td>
        </tr>
      `).join('');
    }

    // Render QR Code
    const qrContainer = document.getElementById('ticketQrCode');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
          text: `RAILPULSE:PNR=${booking.pnr}:TRAIN=${booking.trainNumber}`,
          width: 110,
          height: 110
        });
      }
    }

    navigateTo('confirmationView');
  });
}

// Aadhaar Input Auto-Formatting (1234 5678 9012)
function formatAadhaarInput(input) {
  let val = input.value.replace(/\D/g, ''); // Remove non-digits
  if (val.length > 12) val = val.substring(0, 12);
  const parts = [];
  for (let i = 0; i < val.length; i += 4) {
    parts.push(val.substring(i, i + 4));
  }
  input.value = parts.join(' ');
}

// Trigger Aadhaar OTP Modal
function triggerAadhaarOtpSend() {
  const aadhaarVal = (document.getElementById('contactAadhaar')?.value || '').replace(/\s/g, '');
  const phoneVal = document.getElementById('contactPhone')?.value || '';
  const emailVal = document.getElementById('contactEmail')?.value || '';

  if (aadhaarVal.length !== 12 || !/^\d{12}$/.test(aadhaarVal)) {
    alert('Please enter a valid 12-digit Aadhaar Card Number (e.g. 1234 5678 9012).');
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phoneVal)) {
    alert('Please enter a valid 10-digit Indian Mobile Number starting with 6, 7, 8, or 9.');
    return;
  }

  if (!emailVal || !emailVal.includes('@')) {
    alert('Please enter a valid Email Address for receiving PDF tickets.');
    return;
  }

  const masked = `XXXX-XXXX-${aadhaarVal.slice(-4)}`;
  const displayEl = document.getElementById('aadhaarMaskedDisplay');
  if (displayEl) displayEl.innerText = masked;

  const modal = new bootstrap.Modal(document.getElementById('aadhaarOtpModal'));
  modal.show();
}

// Verify Aadhaar OTP Code
function verifyAadhaarOtpCode() {
  const otpInput = document.getElementById('aadhaarOtpInput')?.value || '';
  if (otpInput.trim() !== '123456' && otpInput.trim().length !== 6) {
    alert('Invalid OTP. Please enter the 6-digit test code: 123456');
    return;
  }

  window.isAadhaarVerified = true;
  const badge = document.getElementById('aadhaarVerifyBadge');
  if (badge) {
    badge.className = 'badge bg-success-subtle text-success border border-success-subtle';
    badge.innerHTML = '<i class="fa-solid fa-circle-check me-1"></i> Aadhaar Verified (UIDAI e-KYC)';
  }

  const btnSend = document.getElementById('btnSendAadhaarOtp');
  if (btnSend) {
    btnSend.className = 'btn btn-success fw-bold';
    btnSend.innerHTML = '<i class="fa-solid fa-check-double me-1"></i> Verified';
    btnSend.disabled = true;
  }

  const modalEl = document.getElementById('aadhaarOtpModal');
  if (modalEl) {
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }

  alert('Aadhaar e-KYC authentication successful! You can now proceed to secure payment.');
}

// Per-Passenger WebCam Streams & CAPTCHA State
let passengerCaptchaTexts = {};
let passengerWebcamStreams = {};
window.passengerPhotos = {};

// Generate Visual Security CAPTCHA for specific passenger index
function refreshSecurityCaptchaForPassenger(idx) {
  const canvas = document.getElementById(`captchaCanvas_${idx}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Clear background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Generate 5 random characters
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let text = '';
  for (let i = 0; i < 5; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  passengerCaptchaTexts[idx] = text;

  // Draw noise lines
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(${Math.random()*150}, ${Math.random()*150}, ${Math.random()*150}, 0.4)`;
    ctx.lineWidth = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // Draw distorted text
  ctx.font = 'bold 22px "Outfit", sans-serif';
  ctx.fillStyle = '#0284c7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = 20 + i * 24;
    const y = 21 + (Math.random() * 6 - 3);
    const angle = (Math.random() * 0.4 - 0.2);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }

  const inputEl = document.getElementById(`captchaInputText_${idx}`);
  if (inputEl) inputEl.value = '';

  const statusBadge = document.getElementById(`captchaStatus_${idx}`);
  if (statusBadge) {
    statusBadge.className = 'badge bg-info-subtle text-info';
    statusBadge.innerText = 'CAPTCHA Required';
  }
}

// WebCam Camera Stream Handler per passenger
async function startWebcamCameraForPassenger(idx) {
  const video = document.getElementById(`webcamStream_${idx}`);
  const imgPreview = document.getElementById(`capturedPhotoPreview_${idx}`);
  const badge = document.getElementById(`livePhotoBadge_${idx}`);

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('WebCam API is not supported by your browser.');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    passengerWebcamStreams[idx] = stream;
    if (video) {
      video.srcObject = stream;
      video.classList.remove('d-none');
      if (imgPreview) imgPreview.classList.add('d-none');
    }
    if (badge) {
      badge.className = 'badge bg-warning text-dark';
      badge.innerHTML = '<i class="fa-solid fa-video me-1"></i> Camera Active';
    }
  } catch (err) {
    alert(`WebCam access denied or unavailable. Sample avatar will be used for Passenger ${idx + 1}.`);
  }
}

// Snap Live Snapshot from WebCam per passenger
function captureLiveSnapshotForPassenger(idx) {
  const video = document.getElementById(`webcamStream_${idx}`);
  const canvas = document.getElementById(`photoCanvas_${idx}`);
  const imgPreview = document.getElementById(`capturedPhotoPreview_${idx}`);
  const badge = document.getElementById(`livePhotoBadge_${idx}`);

  const activeStream = passengerWebcamStreams[idx];

  if (video && !video.classList.contains('d-none') && activeStream) {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    window.passengerPhotos[idx] = dataUrl;

    if (imgPreview) {
      imgPreview.src = dataUrl;
      imgPreview.classList.remove('d-none');
    }
    video.classList.add('d-none');

    activeStream.getTracks().forEach(track => track.stop());
    delete passengerWebcamStreams[idx];
  } else {
    if (imgPreview) window.passengerPhotos[idx] = imgPreview.src;
  }

  if (badge) {
    badge.className = 'badge bg-success-subtle text-success border border-success-subtle';
    badge.innerHTML = '<i class="fa-solid fa-camera-retro me-1"></i> Live Photo Captured';
  }

  alert(`Live photo captured for Passenger ${idx + 1}!`);
}

// Payment Flow with Per-Seat Aadhaar, Contact & Individual CAPTCHA Validation
function openPaymentModal() {
  if (!ApiService.getCurrentUser()) {
    openLoginModal();
    return;
  }

  // Validate PER-SEAT Security CAPTCHA, Aadhaar, Mobile, Email ID & Passenger Info for ALL selected seats!
  const seats = (window.bookingDraft && window.bookingDraft.seats) || [];
  for (let idx = 0; idx < seats.length; idx++) {
    const seatNum = seats[idx];
    const nameEl = document.querySelectorAll('.passenger-name')[idx];
    const ageEl = document.querySelectorAll('.passenger-age')[idx];
    const phoneEl = document.querySelectorAll('.passenger-phone')[idx];
    const emailEl = document.querySelectorAll('.passenger-email')[idx];
    const aadhaarEl = document.getElementById(`passengerAadhaar_${idx}`);
    const aadhaarVal = (aadhaarEl?.value || '').replace(/\s/g, '');
    const captchaInputEl = document.getElementById(`captchaInputText_${idx}`);

    const enteredCaptcha = (captchaInputEl?.value || '').trim().toUpperCase();
    const expectedCaptcha = passengerCaptchaTexts[idx];

    if (!nameEl || !nameEl.value.trim()) {
      alert(`Please enter Full Name for Passenger ${idx + 1} (Seat #${seatNum}).`);
      nameEl?.focus();
      return;
    }

    if (!ageEl || !ageEl.value || Number(ageEl.value) < 1) {
      alert(`Please enter a valid Age for Passenger ${idx + 1} (Seat #${seatNum}).`);
      ageEl?.focus();
      return;
    }

    const phoneVal = phoneEl ? phoneEl.value.trim() : '';
    if (!phoneVal || !/^[6-9]\d{9}$/.test(phoneVal)) {
      alert(`Please enter a valid 10-digit Indian Mobile Number (+91) starting with 6, 7, 8, or 9 for Passenger ${idx + 1} (Seat #${seatNum}).`);
      phoneEl?.focus();
      return;
    }

    if (!emailEl || !emailEl.value || !emailEl.value.includes('@')) {
      alert(`Please enter a valid individual Email ID for Passenger ${idx + 1} (Seat #${seatNum}).`);
      emailEl?.focus();
      return;
    }

    if (aadhaarVal.length !== 12 || !/^\d{12}$/.test(aadhaarVal)) {
      alert(`Please enter a valid 12-digit Aadhaar Card Number for Passenger ${idx + 1} (Seat #${seatNum}).`);
      aadhaarEl?.focus();
      return;
    }

    if (!passengerAadhaarVerified[idx]) {
      alert(`Aadhaar e-KYC verification is required for Passenger ${idx + 1} (Seat #${seatNum})! Please click 'Verify via Aadhaar OTP'.`);
      triggerAadhaarOtpSendForPassenger(idx);
      return;
    }

    if (!enteredCaptcha || enteredCaptcha !== expectedCaptcha) {
      alert(`Invalid Security CAPTCHA entered for Passenger ${idx + 1} (Seat #${seatNum})! Please re-type the CAPTCHA code shown.`);
      captchaInputEl?.focus();
      refreshSecurityCaptchaForPassenger(idx);
      return;
    }

    const badge = document.getElementById(`captchaStatus_${idx}`);
    if (badge) {
      badge.className = 'badge bg-success-subtle text-success';
      badge.innerText = 'CAPTCHA Verified';
    }
  }

  const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
  modal.show();
}

async function processPayment() {
  const btn = document.getElementById('btnConfirmPay');
  btn.disabled = true;
  btn.innerText = 'Processing Payment...';

  try {
    const passengersData = (window.bookingDraft.seats || [1, 2]).map((seat, idx) => {
      const nameEl = document.querySelectorAll('.passenger-name')[idx];
      const ageEl = document.querySelectorAll('.passenger-age')[idx];
      const genderEl = document.querySelectorAll('.passenger-gender')[idx];
      const phoneEl = document.querySelectorAll('.passenger-phone')[idx];
      const emailEl = document.querySelectorAll('.passenger-email')[idx];
      return {
        name: nameEl ? nameEl.value : `Passenger ${idx + 1}`,
        age: ageEl ? Number(ageEl.value) : 28,
        gender: genderEl ? genderEl.value : 'Male',
        phone: phoneEl ? `+91 ${phoneEl.value.trim()}` : '+91 9876543210',
        email: emailEl ? emailEl.value : `passenger${idx + 1}@example.com`,
        berthPreference: document.getElementById('berthPreferenceSelect')?.value || 'No Preference'
      };
    });

    const payload = {
      trainId: window.bookingDraft.train.id,
      travelDate: document.getElementById('searchTravelDate')?.value || new Date().toISOString().split('T')[0],
      coachClass: window.bookingDraft.coachClass,
      passengers: passengersData,
      fareDetails: {
        baseFare: window.bookingDraft.baseFare,
        gst: window.bookingDraft.gst,
        convenienceFee: 35,
        insurance: 35,
        totalAmount: window.bookingDraft.totalAmount
      },
      paymentMethod: 'UPI (GPay)'
    };

    const res = await ApiService.createBooking(payload);
    const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
    if (modal) modal.hide();

    displayConfirmedTicket(res.booking.pnr);
  } catch (err) {
    alert(err.message || 'Payment processing error');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Pay & Confirm Ticket';
  }
}

// Auth State Helper
function syncAuthState() {
  const user = ApiService.getCurrentUser();
  const guestBtns = document.getElementById('authGuestButtons');
  const userDropdown = document.getElementById('authUserDropdown');

  if (user) {
    if (guestBtns) guestBtns.classList.add('d-none');
    if (userDropdown) userDropdown.classList.remove('d-none');
    document.getElementById('userAvatarChar').innerText = user.name[0].toUpperCase();
    document.getElementById('navUserName').innerText = user.name.split(' ')[0];
    document.getElementById('dropdownUserFullName').innerText = user.name;
    document.getElementById('dropdownUserEmail').innerText = user.email;
    document.getElementById('navWalletBadge').innerText = `Wallet: ₹${(user.walletBalance || 0).toLocaleString()}`;

    if (user.role === 'admin') {
      document.getElementById('adminNavMenuItem')?.classList.remove('d-none');
    }
  } else {
    if (guestBtns) guestBtns.classList.remove('d-none');
    if (userDropdown) userDropdown.classList.add('d-none');
  }
}

function openLoginModal() {
  const modal = new bootstrap.Modal(document.getElementById('loginModal'));
  modal.show();
}

function openSignupModal() {
  openLoginModal();
}

function logoutUser() {
  ApiService.logout();
  syncAuthState();
  navigateTo('homeView');
}

function toggleDarkMode() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
}

// SSE Connection Listener for Live Telemetry
function initLiveStreamConnection() {
  if (typeof EventSource === 'undefined') return;

  const eventSource = new EventSource('/api/live-stream');
  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'telemetry_update') {
        updateLiveMapPosition(payload.data);
        updateTelemetryGauges(payload.data);
      }
    } catch (e) {}
  };
}

// Canvas Train Animation in Hero
function initHeroTrainCanvas() {
  const canvas = document.getElementById('trainCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let trainX = -200;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw track lines
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3;
    const trackY = canvas.height - 40;
    ctx.beginPath();
    ctx.moveTo(0, trackY);
    ctx.lineTo(canvas.width, trackY);
    ctx.stroke();

    // Draw Train Bullet Silhouette
    trainX += 3;
    if (trainX > canvas.width + 300) trainX = -300;

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(trainX, trackY - 35, 180, 30, 8);
    ctx.fill();

    // Windows
    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(trainX + 20 + (i * 30), trackY - 26, 18, 12);
    }

    requestAnimationFrame(animate);
  }
  animate();
}

// Ticket PDF Download Wrapper
function downloadPdfTicket() {
  if (typeof window.jspdf === 'undefined') {
    alert('jsPDF library initializing...');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const pnr = document.getElementById('ticketPnr').innerText;
  doc.setFontSize(22);
  doc.text("RailPulse E-Ticket Receipt", 20, 20);
  doc.setFontSize(12);
  doc.text(`PNR Number: ${pnr}`, 20, 35);
  doc.text(`Train: ${document.getElementById('tTrainNum').innerText}`, 20, 45);
  doc.text(`From: ${document.getElementById('tFromCity').innerText}`, 20, 55);
  doc.text(`To: ${document.getElementById('tToCity').innerText}`, 20, 65);
  doc.text(`Total Amount: ${document.getElementById('tTotalPaid').innerText}`, 20, 75);
  doc.text("Status: CONFIRMED (CNF)", 20, 85);

  doc.save(`RailPulse_Ticket_${pnr}.pdf`);
}
