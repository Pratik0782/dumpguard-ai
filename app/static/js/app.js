let allRecords = [], locationData = [], map, locationMarker, selectedVillage = null;
const districtSelect = document.getElementById('districtSelect');
const talukaSelect = document.getElementById('talukaSelect');
const villageSelect = document.getElementById('villageSelect');
const selectedLocationInfo = document.getElementById('selectedLocationInfo');
const predictionForm = document.getElementById('predictionForm');
const predictionResult = document.getElementById('predictionResult');
const esc = v => String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const riskClass = v => "risk-" + String(v || "").toLowerCase();

function safeNumber(value){
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildVillageLookup(records){
  const rows = {};
  records.forEach(r => {
    const district = String(r.district || '').trim();
    const taluka = String(r.taluka || '').trim();
    const village = String(r.village_name || '').trim();
    if (!district || !taluka || !village) return;
    if (!rows[district]) rows[district] = {};
    if (!rows[district][taluka]) rows[district][taluka] = {};
    if (!rows[district][taluka][village]) {
      rows[district][taluka][village] = {
        district,
        taluka,
        village_name: village,
        latitude: safeNumber(r.latitude),
        longitude: safeNumber(r.longitude),
        records: []
      };
    }
    rows[district][taluka][village].records.push(r);
  });
  return rows;
}

function populateDistricts(){
  const unique = [...new Set(allRecords.map(r => String(r.district || '').trim()).filter(Boolean))].sort();
  districtSelect.innerHTML = '<option value="">Select District</option>' + unique.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');
  districtSelect.value = unique[0] || '';
  updateTalukas();
}

function updateTalukas(){
  const district = districtSelect.value;
  const villagesByDistrict = buildVillageLookup(allRecords);
  const talukas = Object.keys(villagesByDistrict[district] || {}).sort();
  talukaSelect.innerHTML = '<option value="">Select Taluka</option>' + talukas.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  if (talukas[0]) talukaSelect.value = talukas[0];
  updateVillages();
}

function updateVillages(){
  const district = districtSelect.value;
  const taluka = talukaSelect.value;
  const villagesByDistrict = buildVillageLookup(allRecords);
  const villages = Object.keys(villagesByDistrict[district]?.[taluka] || {}).sort();
  villageSelect.innerHTML = '<option value="">Select Village</option>' + villages.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if (villages[0]) villageSelect.value = villages[0];
  showSelectedLocation();
}

function showSelectedLocation(){
  const district = districtSelect.value;
  const taluka = talukaSelect.value;
  const village = villageSelect.value;
  if (!district || !taluka || !village) {
    selectedLocationInfo.textContent = 'Choose a village to see its location.';
    if (locationMarker) map.removeLayer(locationMarker);
    locationMarker = null;
    return;
  }

  const villagesByDistrict = buildVillageLookup(allRecords);
  const loc = villagesByDistrict[district]?.[taluka]?.[village];
  if (!loc) {
    selectedLocationInfo.textContent = 'Location not available.';
    return;
  }

  const lat = loc.latitude;
  const lng = loc.longitude;
  const label = `${village}, ${taluka}, ${district}`;
  selectedLocationInfo.textContent = `${label} • Latitude ${lat}, Longitude ${lng}`;

  if (lat !== null && lng !== null) {
    const point = [lat, lng];
    if (locationMarker) map.removeLayer(locationMarker);
    locationMarker = L.marker(point).addTo(map);
    locationMarker.bindPopup(`<b>${esc(village)}</b><br>${esc(taluka)}<br>${esc(district)}`);
    map.setView(point, 12);
  }
}

async function loadData(){
  locationData = (await (await fetch('/api/data')).json()).records;
  allRecords = locationData;
  populateDistricts();
}

districtSelect.addEventListener('change', updateTalukas);
talukaSelect.addEventListener('change', updateVillages);
villageSelect.addEventListener('change', showSelectedLocation);

predictionForm.addEventListener('submit', async e => {
  e.preventDefault();
  predictionResult.classList.remove('hidden');
  predictionResult.innerHTML = '<h3>Calculating...</h3>';

  const payload = Object.fromEntries(new FormData(e.target).entries());
  payload.district = districtSelect.value;
  payload.taluka = talukaSelect.value;
  payload.village_name = villageSelect.value;

  try {
    const d = await (await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })).json();

    let html = `<h3>Predicted Risk: <span class="${riskClass(d.prediction)}">${esc(d.prediction)}</span></h3><p>Model probability:</p>`;
    Object.entries(d.probabilities || {}).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
      html += `<div class="prob"><b>${esc(k)}: ${v}%</b><div class="bar"><span style="width:${v}%"></span></div></div>`;
    });
    predictionResult.innerHTML = html;
  } catch (err) {
    predictionResult.innerHTML = '<h3>Prediction error</h3><p>Check the values and try again.</p>';
  }
});

map = L.map('map', { zoomControl: true }).setView([16.85, 74.25], 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
loadData();
