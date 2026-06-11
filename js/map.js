let map = null;
let routeLayer = null;
let pickupCoords = null;
let dropoffCoords = null;
let debounceTimer = null;

function initMap() {
  // Map initialised lazily when first route is displayed
}

function handleLocationInput(event, type) {
  const query = event.target.value.trim();
  const suggestionsDiv = document.getElementById(`${type}-suggestions`);
  clearTimeout(debounceTimer);
  if (query.length < 3) {
    suggestionsDiv.classList.remove('active');
    return;
  }
  debounceTimer = setTimeout(() => searchLocation(query, type), 300);
}

async function searchLocation(query, type) {
  const suggestionsDiv = document.getElementById(`${type}-suggestions`);
  try {
    const response = await fetch(
      `${CONFIG.nominatimUrl}/search?` + new URLSearchParams({ q: query, format: 'json', addressdetails: '1', limit: '5' }),
      { headers: { Accept: 'application/json' } }
    );
    if (!response.ok) throw new Error('Search failed');
    const results = await response.json();
    displaySuggestions(results, type);
  } catch {
    showError('Unable to search locations. Please try again.');
  }
}

function displaySuggestions(results, type) {
  const suggestionsDiv = document.getElementById(`${type}-suggestions`);
  if (results.length === 0) {
    suggestionsDiv.innerHTML = '<div class="suggestion-item">No locations found</div>';
    suggestionsDiv.classList.add('active');
    return;
  }
  suggestionsDiv.innerHTML = results.map(r => `
    <div class="suggestion-item" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.display_name}">
      <strong>${r.name || r.display_name.split(',')[0]}</strong>
      <small>${r.display_name}</small>
    </div>
  `).join('');
  suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => selectLocation(item, type));
  });
  suggestionsDiv.classList.add('active');
}

function selectLocation(item, type) {
  const lat = parseFloat(item.dataset.lat);
  const lon = parseFloat(item.dataset.lon);
  const name = item.dataset.name;
  if (type === 'pickup') {
    pickupCoords = { lat, lon, name };
    document.getElementById('pickup').value = name;
  } else {
    dropoffCoords = { lat, lon, name };
    document.getElementById('dropoff').value = name;
  }
  document.getElementById(`${type}-suggestions`).classList.remove('active');
  hideError();
}

async function getRoute(start, end) {
  if (!CONFIG.orsApiKey || CONFIG.orsApiKey === 'YOUR_ORS_API_KEY_HERE') {
    return calculateStraightLineRoute(start, end);
  }
  try {
    const response = await fetch(`${CONFIG.orsUrl}/v2/directions/driving-car/geojson`, {
      method: 'POST',
      headers: { 'Authorization': CONFIG.orsApiKey, 'Content-Type': 'application/json', 'Accept': 'application/json, application/geo+json' },
      body: JSON.stringify({ coordinates: [[start.lon, start.lat], [end.lon, end.lat]] })
    });
    if (!response.ok) throw new Error('ORS error');
    const data = await response.json();
    const seg = data.features[0].properties.segments[0];
    return {
      distance: seg.distance / 1609.34,
      duration: seg.duration / 60,
      geometry: data.features[0].geometry.coordinates,
      isActualRoute: true,
    };
  } catch {
    return calculateStraightLineRoute(start, end);
  }
}

function calculateStraightLineRoute(start, end) {
  const R = 3958.8;
  const dLat = toRad(end.lat - start.lat);
  const dLon = toRad(end.lon - start.lon);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(start.lat)) * Math.cos(toRad(end.lat)) * Math.sin(dLon/2)**2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.3;
  return {
    distance,
    duration: (distance / 25) * 60,
    geometry: [[start.lon, start.lat], [end.lon, end.lat]],
    isActualRoute: false,
  };
}

function toRad(deg) { return deg * Math.PI / 180; }

function displayMap(route) {
  const mapDiv = document.getElementById('map');
  mapDiv.classList.remove('hidden');
  if (!map) {
    map = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
  }
  if (routeLayer) map.removeLayer(routeLayer);
  const coords = route.geometry.map(c => [c[1], c[0]]);
  routeLayer = L.layerGroup([
    L.polyline(coords, { color: '#f59e0b', weight: 4 }),
    L.marker(coords[0]).bindPopup('Pickup'),
    L.marker(coords[coords.length - 1]).bindPopup('Drop-off'),
  ]).addTo(map);
  map.fitBounds(L.polyline(coords).getBounds(), { padding: [50, 50] });
}
