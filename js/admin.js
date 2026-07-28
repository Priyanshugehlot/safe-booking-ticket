/**
 * RailPulse Admin Control Panel & CRUD Controller
 */

let activeAdminTab = 'trains';

async function initAdminPanel() {
  try {
    const data = await ApiService.getAdminDashboard();
    renderAdminStats(data.stats);
    renderAdminTabContent(activeAdminTab, data);
  } catch (err) {
    document.getElementById('adminTabContent').innerHTML = `
      <div class="alert alert-danger shadow-sm border-0 rounded-4">
        <i class="fa-solid fa-triangle-exclamation me-2"></i> Admin authentication required. Please login with an admin account (admin@railpulse.com / admin123).
      </div>
    `;
  }
}

function renderAdminStats(stats) {
  const container = document.getElementById('adminStatsRow');
  if (!container) return;

  container.innerHTML = `
    <div class="col-md-3 col-sm-6">
      <div class="card glass-card border-0 rounded-4 p-3 shadow-sm">
        <span class="small text-muted fw-bold">TOTAL REGISTERED USERS</span>
        <div class="fs-2 fw-extrabold text-primary my-1">${stats.totalUsers}</div>
        <span class="small text-success"><i class="fa-solid fa-arrow-up me-1"></i> Active Passengers</span>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="card glass-card border-0 rounded-4 p-3 shadow-sm">
        <span class="small text-muted fw-bold">ACTIVE RUNNING TRAINS</span>
        <div class="fs-2 fw-extrabold text-info my-1">${stats.totalTrains}</div>
        <span class="small text-muted">Across 14 Corridors</span>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="card glass-card border-0 rounded-4 p-3 shadow-sm">
        <span class="small text-muted fw-bold">TOTAL REVENUE</span>
        <div class="fs-2 fw-extrabold text-success my-1">₹${stats.totalRevenue.toLocaleString()}</div>
        <span class="small text-success"><i class="fa-solid fa-chart-line me-1"></i> +14% this month</span>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="card glass-card border-0 rounded-4 p-3 shadow-sm">
        <span class="small text-muted fw-bold">AVERAGE OCCUPANCY</span>
        <div class="fs-2 fw-extrabold text-warning my-1">${stats.occupancyRatePct}%</div>
        <span class="small text-muted">Punctuality: ${stats.onTimeRatePct}%</span>
      </div>
    </div>
  `;
}

function switchAdminTab(tab) {
  activeAdminTab = tab;
  initAdminPanel();
}

async function renderAdminTabContent(tab, data) {
  const container = document.getElementById('adminTabContent');
  if (!container) return;

  if (tab === 'trains') {
    const trains = await ApiService.searchTrains('', '');
    container.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold mb-0">Train Inventory Management</h5>
        <button class="btn btn-primary btn-sm rounded-pill" onclick="openAddTrainModal()"><i class="fa-solid fa-plus me-1"></i> Add New Train</button>
      </div>

      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Train #</th>
              <th>Train Name</th>
              <th>Route</th>
              <th>Departure / Arrival</th>
              <th>Speed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${trains.map(t => `
              <tr>
                <td class="fw-bold text-primary">${t.number}</td>
                <td class="fw-semibold">${t.name}</td>
                <td>${t.sourceCode} <i class="fa-solid fa-arrow-right text-muted mx-1"></i> ${t.destCode}</td>
                <td>${t.depTime} / ${t.arrTime}</td>
                <td><span class="badge bg-info-subtle text-info fw-bold">${t.speedKmh} km/h</span></td>
                <td>
                  <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="handleDeleteTrain('${t.id}')">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (tab === 'bookings') {
    container.innerHTML = `
      <h5 class="fw-bold mb-3">All Passenger Bookings Manifest</h5>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>PNR</th>
              <th>Booking ID</th>
              <th>Passenger Email</th>
              <th>Train</th>
              <th>Travel Date</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(data.recentBookings || []).map(b => `
              <tr>
                <td class="fw-bold text-dark">${b.pnr}</td>
                <td><small>${b.bookingId}</small></td>
                <td>${b.userEmail}</td>
                <td>${b.trainNumber} - ${b.trainName}</td>
                <td>${b.travelDate}</td>
                <td><span class="badge bg-success">${b.status}</span></td>
                <td class="fw-bold text-success">₹${b.fareDetails.totalAmount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (tab === 'logs') {
    container.innerHTML = `
      <h5 class="fw-bold mb-3">System Audit & Security Logs</h5>
      <div class="list-group">
        ${(data.auditLogs || []).map(log => `
          <div class="list-group-item bg-transparent d-flex justify-content-between align-items-center">
            <div>
              <strong class="text-primary">${log.action}</strong> - <span class="small text-muted">${log.details}</span>
              <div class="small text-muted">User: ${log.user}</div>
            </div>
            <span class="badge bg-secondary small">${new Date(log.timestamp).toLocaleTimeString()}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}

async function handleDeleteTrain(trainId) {
  if (confirm('Are you sure you want to delete this train?')) {
    try {
      await ApiService.deleteTrain(trainId);
      alert('Train deleted.');
      initAdminPanel();
    } catch (err) {
      alert('Failed to delete train.');
    }
  }
}

function exportAdminCsv() {
  alert('Exporting system bookings & passenger manifest as CSV file...');
  const csvContent = "data:text/csv;charset=utf-8,PNR,TrainNumber,PassengerEmail,Amount,Status\n8429104721,12952,rahul.sharma@example.com,4389,CONFIRMED";
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "railpulse_bookings_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
