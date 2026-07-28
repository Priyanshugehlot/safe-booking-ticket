/**
 * RailPulse Authentic Indian Railways Coach Seat Selection Engine
 */

let activeClass = '3A';
let currentTrain = null;
let selectedSeats = [];

function initSeatPicker(train) {
  currentTrain = train;
  selectedSeats = [];
  activeClass = '3A';
  renderSeatGrid();
  updateSelectionSummary();
}

function switchCoachClass(cls) {
  activeClass = cls;
  selectedSeats = [];

  // Update class pills UI
  const pills = document.querySelectorAll('#coachClassPills button');
  pills.forEach(btn => {
    btn.classList.remove('active');
    if (btn.innerText.includes(cls)) btn.classList.add('active');
  });

  const coachName = cls === '1A' ? 'H1 (AC 1st Class)' : cls === '2A' ? 'A1 (AC 2-Tier)' : cls === '3A' ? 'B2 (AC 3-Tier)' : cls === 'EC' ? 'EC1 (Executive Chair)' : cls === 'CC' ? 'C1 (AC Chair Car)' : 'S1 (Sleeper)';
  document.getElementById('activeCoachName').innerText = `Coach: ${coachName}`;

  renderSeatGrid();
  updateSelectionSummary();
}

// Pre-occupied simulation seats per coach class
const occupiedSeatsMap = {
  '3A': [3, 7, 12, 18, 19, 25, 30, 31, 40, 44],
  '2A': [2, 5, 8, 14, 18, 22, 29],
  '1A': [1, 4, 7, 12],
  'SL': [5, 11, 16, 23, 27, 34, 42, 49, 53],
  'CC': [4, 9, 15, 22, 28, 35, 41, 48],
  'EC': [2, 6, 11, 15, 20, 26]
};

function renderSeatGrid() {
  const container = document.getElementById('seatGridMap');
  if (!container) return;

  container.innerHTML = '';
  const occupiedSeats = occupiedSeatsMap[activeClass] || [3, 7, 12];

  if (activeClass === '3A' || activeClass === 'SL') {
    render3ATierLayout(container, occupiedSeats);
  } else if (activeClass === '2A') {
    render2ATierLayout(container, occupiedSeats);
  } else if (activeClass === '1A') {
    render1AFirstClassLayout(container, occupiedSeats);
  } else if (activeClass === 'CC' || activeClass === 'EC') {
    renderChairCarLayout(container, occupiedSeats);
  }
}

// --- 1. AC 3-TIER & SLEEPER (8 berths per bay: 6 Main + 2 Side) ---
function render3ATierLayout(container, occupiedSeats) {
  const bayCount = 6; // 48 seats total
  let html = `<div class="train-bay-container">`;

  for (let b = 0; b < bayCount; b++) {
    const startNo = b * 8 + 1;
    html += `
      <div class="train-bay">
        <div class="bay-label">BAY ${b + 1} (Berths ${startNo} - ${startNo + 7})</div>
        <div class="bay-seats-wrapper">
          <!-- Main Bay: 6 Berths (LB, MB, UB | LB, MB, UB) -->
          <div class="main-bay-seats">
            ${createSeatElem(startNo, 'LB', 'Lower', occupiedSeats)}
            ${createSeatElem(startNo + 1, 'MB', 'Middle', occupiedSeats)}
            ${createSeatElem(startNo + 2, 'UB', 'Upper', occupiedSeats)}
            ${createSeatElem(startNo + 3, 'LB', 'Lower', occupiedSeats)}
            ${createSeatElem(startNo + 4, 'MB', 'Middle', occupiedSeats)}
            ${createSeatElem(startNo + 5, 'UB', 'Upper', occupiedSeats)}
          </div>
          <!-- Gangway Corridor Divider -->
          <div class="coach-gangway text-rotate">AISLE / GANGWAY</div>
          <!-- Side Bay: 2 Berths (SL, SU) -->
          <div class="side-bay-seats">
            ${createSeatElem(startNo + 6, 'SL', 'Side Lower', occupiedSeats)}
            ${createSeatElem(startNo + 7, 'SU', 'Side Upper', occupiedSeats)}
          </div>
        </div>
      </div>
    `;
  }
  html += `</div>`;
  container.innerHTML = html;
  bindSeatClickHandlers();
}

// --- 2. AC 2-TIER (6 berths per bay: 4 Main + 2 Side) ---
function render2ATierLayout(container, occupiedSeats) {
  const bayCount = 6; // 36 berths total
  let html = `<div class="train-bay-container">`;

  for (let b = 0; b < bayCount; b++) {
    const startNo = b * 6 + 1;
    html += `
      <div class="train-bay">
        <div class="bay-label">BAY ${b + 1} (Berths ${startNo} - ${startNo + 5})</div>
        <div class="bay-seats-wrapper">
          <!-- Main Bay: 4 Berths (LB, UB | LB, UB) -->
          <div class="main-bay-seats" style="grid-template-columns: repeat(2, 1fr);">
            ${createSeatElem(startNo, 'LB', 'Lower', occupiedSeats)}
            ${createSeatElem(startNo + 1, 'UB', 'Upper', occupiedSeats)}
            ${createSeatElem(startNo + 2, 'LB', 'Lower', occupiedSeats)}
            ${createSeatElem(startNo + 3, 'UB', 'Upper', occupiedSeats)}
          </div>
          <div class="coach-gangway">AISLE</div>
          <!-- Side Bay: 2 Berths (SL, SU) -->
          <div class="side-bay-seats">
            ${createSeatElem(startNo + 4, 'SL', 'Side Lower', occupiedSeats)}
            ${createSeatElem(startNo + 5, 'SU', 'Side Upper', occupiedSeats)}
          </div>
        </div>
      </div>
    `;
  }
  html += `</div>`;
  container.innerHTML = html;
  bindSeatClickHandlers();
}

// --- 3. AC 1st CLASS (1A Cabins & Coupes) ---
function render1AFirstClassLayout(container, occupiedSeats) {
  let html = `<div class="train-bay-container">`;

  // 4 Cabins (4 berths each) & 2 Coupes (2 berths each)
  const cabins = [
    { name: 'Cabin A (4 Berths)', start: 1, count: 4 },
    { name: 'Cabin B (4 Berths)', start: 5, count: 4 },
    { name: 'Coupe C (2 Berths)', start: 9, count: 2 },
    { name: 'Cabin D (4 Berths)', start: 11, count: 4 },
    { name: 'Coupe E (2 Berths)', start: 15, count: 2 }
  ];

  cabins.forEach(c => {
    html += `
      <div class="train-bay border-primary border-opacity-50">
        <div class="bay-label text-warning"><i class="fa-solid fa-door-closed me-1"></i> ${c.name}</div>
        <div class="d-flex gap-3 flex-wrap">
          ${Array.from({ length: c.count }).map((_, idx) => {
      const num = c.start + idx;
      const bType = idx % 2 === 0 ? 'LB' : 'UB';
      return createSeatElem(num, bType, bType === 'LB' ? 'Lower' : 'Upper', occupiedSeats);
    }).join('')}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
  bindSeatClickHandlers();
}

// --- 4. CHAIR CAR & EXECUTIVE CLASS (3x2 or 2x2 Seating Rows) ---
function renderChairCarLayout(container, occupiedSeats) {
  const isEc = activeClass === 'EC';
  const rowCount = 8;
  let html = `<div class="train-bay-container">`;

  for (let r = 0; r < rowCount; r++) {
    const seatsPerRow = isEc ? 4 : 5;
    const startNo = r * seatsPerRow + 1;

    html += `
      <div class="chair-row border-bottom border-secondary border-opacity-25 pb-2">
        <span class="small fw-bold text-muted me-2" style="width: 50px;">ROW ${r + 1}</span>
        
        <!-- Left Side (3 seats for CC, 2 seats for EC) -->
        <div class="chair-side-left">
          ${createSeatElem(startNo, 'W', 'Window Seat', occupiedSeats)}
          ${!isEc ? createSeatElem(startNo + 1, 'M', 'Middle Seat', occupiedSeats) : ''}
          ${createSeatElem(startNo + (isEc ? 1 : 2), 'A', 'Aisle Seat', occupiedSeats)}
        </div>

        <div class="coach-gangway px-3">AISLE</div>

        <!-- Right Side (2 seats for CC & EC) -->
        <div class="chair-side-right">
          ${createSeatElem(startNo + (isEc ? 2 : 3), 'A', 'Aisle Seat', occupiedSeats)}
          ${createSeatElem(startNo + (isEc ? 3 : 4), 'W', 'Window Seat', occupiedSeats)}
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
  bindSeatClickHandlers();
}

// Helper to create HTML string for seat element
function createSeatElem(seatNum, berthCode, berthFull, occupiedSeats) {
  const isOccupied = occupiedSeats.includes(seatNum);
  const isSelected = selectedSeats.includes(seatNum);

  let statusClass = 'seat-available';
  let title = `Seat ${seatNum} (${berthFull} - Available)`;

  if (isOccupied) {
    statusClass = 'seat-occupied';
    title = `Seat ${seatNum} (Occupied)`;
  } else if (isSelected) {
    statusClass = 'seat-selected';
    title = `Seat ${seatNum} (Selected)`;
  }

  return `
    <div class="seat-item ${statusClass}" data-seat-no="${seatNum}" data-occupied="${isOccupied}" title="${title}">
      <span>${seatNum}</span>
      <span class="seat-berth-badge">${berthCode}</span>
    </div>
  `;
}

function bindSeatClickHandlers() {
  document.querySelectorAll('.seat-item').forEach(el => {
    const isOccupied = el.dataset.occupied === 'true';
    const seatNum = Number(el.dataset.seatNo);
    if (!isOccupied) {
      el.onclick = () => toggleSeatSelection(seatNum);
    }
  });
}

function toggleSeatSelection(seatNum) {
  const idx = selectedSeats.indexOf(seatNum);
  if (idx > -1) {
    selectedSeats.splice(idx, 1);
  } else {
    if (selectedSeats.length >= 6) {
      alert('You can select a maximum of 6 seats per booking.');
      return;
    }
    selectedSeats.push(seatNum);
  }

  renderSeatGrid();
  updateSelectionSummary();
}

function updateSelectionSummary() {
  const badgeContainer = document.getElementById('selectedSeatsBadgeList');
  const btnProceed = document.getElementById('btnProceedPassengers');

  if (selectedSeats.length === 0) {
    badgeContainer.innerHTML = '<span class="badge bg-secondary">No seats selected yet</span>';
    document.getElementById('seatCountText').innerText = '0';
    document.getElementById('seatBaseFareText').innerText = '₹0';
    document.getElementById('seatGstText').innerText = '₹0';
    document.getElementById('seatTotalAmountText').innerText = '₹0';
    if (btnProceed) btnProceed.disabled = true;
    return;
  }

  badgeContainer.innerHTML = selectedSeats
    .sort((a, b) => a - b)
    .map(s => `<span class="badge bg-primary fs-6">Seat ${s}</span>`)
    .join('');

  const unitPrice = currentTrain && currentTrain.classes[activeClass] ? currentTrain.classes[activeClass].price : 2040;
  const baseFare = unitPrice * selectedSeats.length;
  const gst = Math.round(baseFare * 0.05);
  const grandTotal = baseFare + gst + 35 + 35; // GST + fee + insurance

  document.getElementById('seatCountText').innerText = selectedSeats.length;
  document.getElementById('seatBaseFareText').innerText = `₹${baseFare.toLocaleString()}`;
  document.getElementById('seatGstText').innerText = `₹${gst.toLocaleString()}`;
  document.getElementById('seatTotalAmountText').innerText = `₹${grandTotal.toLocaleString()}`;

  if (btnProceed) btnProceed.disabled = false;

  // Save into draft
  window.bookingDraft = {
    train: currentTrain,
    coachClass: activeClass,
    seats: selectedSeats,
    baseFare,
    gst,
    totalAmount: grandTotal
  };
}

function proceedToPassengers() {
  if (!selectedSeats.length) return;
  renderPassengerInputs(selectedSeats);
  navigateTo('passengerView');
}

function renderPassengerInputs(seats) {
  const container = document.getElementById('passengerInputContainer');
  if (!container) return;

  const sampleAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
  ];

  container.innerHTML = seats.map((seatNum, idx) => `
    <div class="card glass-card border-0 rounded-4 p-4 mb-4 shadow-sm">
      <div class="fw-bold mb-3 text-primary d-flex justify-content-between align-items-center border-bottom pb-2">
        <span class="fs-5"><i class="fa-solid fa-user-check me-2"></i> Passenger ${idx + 1} Details</span>
        <span class="badge bg-primary fs-6 px-3 py-2">Train Seat #${seatNum}</span>
      </div>

      <!-- Passenger Basic Info & Aadhaar -->
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <label class="form-label small fw-bold">Full Name (As per Govt ID)</label>
          <input type="text" class="form-control passenger-name" placeholder="Full Name" required>
        </div>
        <div class="col-md-2">
          <label class="form-label small fw-bold">Age</label>
          <input type="number" class="form-control passenger-age" placeholder="Age" min="1" max="100" required>
        </div>
        <div class="col-md-2">
          <label class="form-label small fw-bold">Gender</label>
          <select class="form-select passenger-gender">
            <option value="Male" selected>Male</option>
            <option value="Female">Female</option>
            <option value="Transgender">Transgender</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label small fw-bold"><i class="fa-solid fa-phone text-info me-1"></i> Seat #${seatNum} Mobile (+91)</label>
          <div class="input-group input-group-sm">
            <span class="input-group-text fw-bold">+91</span>
            <input type="tel" class="form-control passenger-phone" placeholder="9876543210" maxlength="10" pattern="^[6-9]\d{9}$" required>
          </div>
          <div class="form-text small text-muted" style="font-size: 0.68rem;">10 digits starting with 6, 7, 8, 9</div>
        </div>
        <div class="col-12">
          <label class="form-label small fw-bold"><i class="fa-solid fa-envelope text-warning me-1"></i> Seat #${seatNum} Email ID</label>
          <input type="email" class="form-control passenger-email" placeholder="passenger${idx + 1}@example.com" required>
          <div class="form-text small text-muted">Individual PDF E-Ticket will be dispatched to this email</div>
        </div>
      </div>

      <!-- Individual 12-Digit Aadhaar Card & e-KYC OTP for Seat #${seatNum} -->
      <div class="p-3 bg-light rounded-4 border mb-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="fw-bold small text-success"><i class="fa-solid fa-shield-halved me-1"></i> Seat #${seatNum} Govt Aadhaar Card (12-Digit)</span>
          <span class="badge bg-danger-subtle text-danger border border-danger-subtle" id="aadhaarVerifyBadge_${idx}"><i class="fa-solid fa-circle-xmark me-1"></i> Aadhaar Unverified</span>
        </div>
        <div class="input-group">
          <input type="text" class="form-control fw-bold letter-spacing passenger-aadhaar" id="passengerAadhaar_${idx}" placeholder="1234 5678 9012" maxlength="14" oninput="formatAadhaarInput(this)" required>
          <button type="button" class="btn btn-outline-primary fw-bold" id="btnSendAadhaarOtp_${idx}" onclick="triggerAadhaarOtpSendForPassenger(${idx})">
            <i class="fa-solid fa-mobile-screen-button me-1"></i> Verify via Aadhaar OTP
          </button>
        </div>
        <div class="form-text small text-muted">Aadhaar e-KYC authentication is required as per Indian Railways safety regulations.</div>
      </div>

      <!-- Individual WebCam Live Photo Capture for Seat #${seatNum} -->
      <div class="p-3 bg-body rounded-4 border mb-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="fw-bold small text-danger"><i class="fa-solid fa-camera me-1"></i> Live WebCam Photo for Seat #${seatNum}</span>
          <span class="badge bg-secondary" id="livePhotoBadge_${idx}">Photo Pending</span>
        </div>
        <div class="row align-items-center gy-2">
          <div class="col-sm-5 col-md-4">
            <div class="webcam-box rounded-3 overflow-hidden border bg-dark text-center relative" style="height: 120px;">
              <video id="webcamStream_${idx}" autoplay playsinline class="w-100 h-100 object-fit-cover d-none"></video>
              <img id="capturedPhotoPreview_${idx}" src="${sampleAvatars[idx % sampleAvatars.length]}" class="w-100 h-100 object-fit-cover" alt="Seat ${seatNum} Photo">
              <canvas id="photoCanvas_${idx}" class="d-none" width="160" height="160"></canvas>
            </div>
          </div>
          <div class="col-sm-7 col-md-8">
            <div class="d-flex flex-wrap gap-2">
              <button type="button" class="btn btn-outline-primary btn-sm rounded-pill" onclick="startWebcamCameraForPassenger(${idx})">
                <i class="fa-solid fa-video me-1"></i> Camera #${seatNum}
              </button>
              <button type="button" class="btn btn-danger btn-sm rounded-pill fw-bold" onclick="captureLiveSnapshotForPassenger(${idx})">
                <i class="fa-solid fa-camera-retro me-1"></i> Snap Photo #${seatNum}
              </button>
            </div>
            <span class="small text-muted d-block mt-2">Individual photo required for boarding pass verification on Seat #${seatNum}.</span>
          </div>
        </div>
      </div>

      <!-- Individual Visual Security CAPTCHA for Seat #${seatNum} -->
      <div class="p-3 bg-light rounded-4 border">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="fw-bold small text-warning"><i class="fa-solid fa-shield-cat me-1"></i> Seat #${seatNum} Security CAPTCHA</span>
          <span class="badge bg-info-subtle text-info" id="captchaStatus_${idx}">CAPTCHA Required</span>
        </div>
        <div class="row align-items-center gy-2">
          <div class="col-sm-5 text-center">
            <div class="d-flex align-items-center justify-content-center gap-2">
              <canvas id="captchaCanvas_${idx}" width="140" height="42" class="rounded border bg-white shadow-sm"></canvas>
              <button type="button" class="btn btn-icon btn-outline-secondary btn-sm rounded-circle" onclick="refreshSecurityCaptchaForPassenger(${idx})" title="Refresh CAPTCHA">
                <i class="fa-solid fa-arrows-rotate"></i>
              </button>
            </div>
          </div>
          <div class="col-sm-7">
            <input type="text" class="form-control fw-bold text-center letter-spacing passenger-captcha-input" id="captchaInputText_${idx}" placeholder="ENTER CAPTCHA FOR SEAT #${seatNum}" maxlength="5" required>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Update payment summary card
  document.getElementById('payBaseFare').innerText = `₹${window.bookingDraft.baseFare.toLocaleString()}`;
  document.getElementById('payGst').innerText = `₹${window.bookingDraft.gst.toLocaleString()}`;
  document.getElementById('payGrandTotal').innerText = `₹${window.bookingDraft.totalAmount.toLocaleString()}`;
  document.getElementById('modalPayAmount').innerText = `₹${window.bookingDraft.totalAmount.toLocaleString()}`;

  // Automatically generate distinct individual CAPTCHA for each selected seat!
  setTimeout(() => {
    seats.forEach((_, idx) => refreshSecurityCaptchaForPassenger(idx));
  }, 100);
}
