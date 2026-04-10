// Configuration
const CONFIG = {
  // Pricing configuration (adjust these values)
  baseFare: 3.5, // Base fare in currency
  costPerMile: 2.0, // Cost per mile
  costPerMinute: 0.3, // Cost per minute
  currency: "£", // Currency symbol

  // API configuration for Nominatim (OpenStreetMap)
  nominatimUrl: "https://nominatim.openstreetmap.org",

  // API configuration for OpenRouteService
  // Get free API key from https://openrouteservice.org/dev/#/signup
  orsApiKey:
    "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImYyYTg1MGU3YTlmZjQyZTlhOTNjOTc0YzRmYzIzZTVjIiwiaCI6Im11cm11cjY0In0=", // Replace with your key
  orsUrl: "https://api.openrouteservice.org",
};

// State management
let map = null;
let routeLayer = null;
let pickupCoords = null;
let dropoffCoords = null;
let debounceTimer = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners();
});

function initializeEventListeners() {
  const pickupInput = document.getElementById("pickup");
  const dropoffInput = document.getElementById("dropoff");
  const calculateBtn = document.getElementById("calculate-btn");

  pickupInput.addEventListener("input", (e) =>
    handleLocationInput(e, "pickup"),
  );
  dropoffInput.addEventListener("input", (e) =>
    handleLocationInput(e, "dropoff"),
  );
  calculateBtn.addEventListener("click", calculateFare);

  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".form-group")) {
      document
        .querySelectorAll(".suggestions")
        .forEach((s) => s.classList.remove("active"));
    }
  });
}

function handleLocationInput(event, type) {
  const query = event.target.value.trim();
  const suggestionsDiv = document.getElementById(`${type}-suggestions`);

  clearTimeout(debounceTimer);

  if (query.length < 3) {
    suggestionsDiv.classList.remove("active");
    return;
  }

  debounceTimer = setTimeout(() => {
    searchLocation(query, type);
  }, 300);
}

async function searchLocation(query, type) {
  const suggestionsDiv = document.getElementById(`${type}-suggestions`);

  try {
    const response = await fetch(
      `${CONFIG.nominatimUrl}/search?` +
        new URLSearchParams({
          q: query,
          format: "json",
          addressdetails: "1",
          limit: "5",
        }),
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) throw new Error("Search failed");

    const results = await response.json();
    displaySuggestions(results, type);
  } catch (error) {
    console.error("Location search error:", error);
    showError("Unable to search locations. Please try again.");
  }
}

function displaySuggestions(results, type) {
  const suggestionsDiv = document.getElementById(`${type}-suggestions`);

  if (results.length === 0) {
    suggestionsDiv.innerHTML =
      '<div class="suggestion-item">No locations found</div>';
    suggestionsDiv.classList.add("active");
    return;
  }

  suggestionsDiv.innerHTML = results
    .map(
      (result) => `
        <div class="suggestion-item" data-lat="${result.lat}" data-lon="${result.lon}" data-name="${result.display_name}">
            <strong>${result.name || result.display_name.split(",")[0]}</strong>
            <small>${result.display_name}</small>
        </div>
    `,
    )
    .join("");

  suggestionsDiv.querySelectorAll(".suggestion-item").forEach((item) => {
    item.addEventListener("click", () => selectLocation(item, type));
  });

  suggestionsDiv.classList.add("active");
}

function selectLocation(item, type) {
  const lat = parseFloat(item.dataset.lat);
  const lon = parseFloat(item.dataset.lon);
  const name = item.dataset.name;

  if (type === "pickup") {
    pickupCoords = { lat, lon, name };
    document.getElementById("pickup").value = name;
  } else {
    dropoffCoords = { lat, lon, name };
    document.getElementById("dropoff").value = name;
  }

  document.getElementById(`${type}-suggestions`).classList.remove("active");
  hideError();
}

async function calculateFare() {
  if (!pickupCoords || !dropoffCoords) {
    showError("Please select both pickup and drop-off locations");
    return;
  }

  const calculateBtn = document.getElementById("calculate-btn");
  calculateBtn.disabled = true;
  calculateBtn.textContent = "Calculating...";
  hideError();

  try {
    const route = await getRoute(pickupCoords, dropoffCoords);
    displayResults(route);
    displayMap(route);
  } catch (error) {
    console.error("Route calculation error:", error);
    showError("Unable to calculate route. Please try different locations.");
  } finally {
    calculateBtn.disabled = false;
    calculateBtn.textContent = "Calculate Fare";
  }
}

async function getRoute(start, end) {
  // Check if ORS API key is configured
  if (CONFIG.orsApiKey === "YOUR_ORS_API_KEY_HERE") {
    // Fallback to straight-line distance with warning
    return calculateStraightLineRoute(start, end);
  }

  try {
    const response = await fetch(
      `${CONFIG.orsUrl}/v2/directions/driving-car/geojson`,
      {
        method: 'POST',
        headers: {
          'Authorization': CONFIG.orsApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/geo+json'
        },
        body: JSON.stringify({
          coordinates: [[start.lon, start.lat], [end.lon, end.lat]]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ORS API error:', errorText);
      throw new Error("Routing service error");
    }

    const data = await response.json();
    const feature = data.features[0];
    const properties = feature.properties.segments[0];

    return {
      distance: properties.distance / 1609.34, // Convert meters to miles
      duration: properties.duration / 60, // Convert to minutes
      geometry: feature.geometry.coordinates,
      isActualRoute: true,
    };
  } catch (error) {
    console.warn("ORS routing failed, using fallback:", error);
    return calculateStraightLineRoute(start, end);
  }
}

function calculateStraightLineRoute(start, end) {
  // Haversine formula for distance
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(end.lat - start.lat);
  const dLon = toRad(end.lon - start.lon);
  const lat1 = toRad(start.lat);
  const lat2 = toRad(end.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Estimate driving distance as 1.3x straight line
  const drivingDistance = distance * 1.3;

  // Estimate duration (assuming 25 mph average in city)
  const duration = (drivingDistance / 25) * 60;

  return {
    distance: drivingDistance,
    duration: duration,
    geometry: [
      [start.lon, start.lat],
      [end.lon, end.lat],
    ],
    isActualRoute: false,
  };
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

function displayResults(route) {
  const resultDiv = document.getElementById("result");
  const distanceSpan = document.getElementById("distance");
  const durationSpan = document.getElementById("duration");
  const fareSpan = document.getElementById("fare");

  const fare = calculatePrice(route.distance, route.duration);

  distanceSpan.textContent = `${route.distance.toFixed(2)} miles`;
  durationSpan.textContent = `${Math.round(route.duration)} minutes`;
  fareSpan.textContent = `${CONFIG.currency}${fare.toFixed(2)}`;

  resultDiv.classList.remove("hidden");

  if (!route.isActualRoute) {
    showError(
      "Note: Using estimated route. For accurate pricing, configure OpenRouteService API key in script.js",
    );
  }
}

function calculatePrice(distanceMiles, durationMin) {
  const distanceCost = distanceMiles * CONFIG.costPerMile;
  const timeCost = durationMin * CONFIG.costPerMinute;
  const totalFare = CONFIG.baseFare + distanceCost + timeCost;
  return totalFare;
}

function displayMap(route) {
  const mapDiv = document.getElementById("map");
  mapDiv.classList.remove("hidden");

  if (!map) {
    map = L.map("map");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
  }

  // Clear previous route
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }

  // Convert coordinates to Leaflet format [lat, lon]
  const coords = route.geometry.map((coord) => [coord[1], coord[0]]);

  // Add route line
  routeLayer = L.layerGroup([
    L.polyline(coords, { color: "#f59e0b", weight: 4 }),
    L.marker(coords[0]).bindPopup("Pickup"),
    L.marker(coords[coords.length - 1]).bindPopup("Drop-off"),
  ]).addTo(map);

  // Fit map to show entire route
  map.fitBounds(L.polyline(coords).getBounds(), { padding: [50, 50] });
}

function showError(message) {
  const errorDiv = document.getElementById("error");
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
}

function hideError() {
  const errorDiv = document.getElementById("error");
  errorDiv.classList.add("hidden");
}
