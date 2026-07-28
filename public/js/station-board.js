/**
 * RailPulse Airport-Style Live Station Departure Board
 */

async function loadStationBoard(stationCode = 'NDLS') {
  const tbody = document.getElementById('flipBoardBody');
  const header = document.getElementById('stationBoardHeader');
  if (!tbody) return;

  try {
    const data = await ApiService.fetchStationBoard(stationCode);
    if (header) header.innerText = `${data.station} RAILWAY HUB - LIVE DEPARTURES`;

    tbody.innerHTML = data.board.map(row => `
      <tr class="align-middle">
        <td class="fw-bold text-warning">${row.trainNo}</td>
        <td class="fw-semibold text-white">${row.name}</td>
        <td class="text-info">${row.dest}</td>
        <td class="fw-bold text-white"><span class="badge bg-secondary px-2 fs-6">${row.platform}</span></td>
        <td class="text-muted">${row.schedTime}</td>
        <td class="fw-bold text-white">${row.expTime}</td>
        <td><span class="badge ${row.statusBg} fs-6 px-3 py-2 text-uppercase">${row.status}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Station board error:', err);
  }
}
