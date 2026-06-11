// Current booking state — populated before payment
let currentBooking = null;

function calculatePrice(distanceMiles, durationMin) {
  return CONFIG.baseFare + (distanceMiles * CONFIG.costPerMile) + (durationMin * CONFIG.costPerMinute);
}

// ── Dynamic tab ──────────────────────────────────────────────────────────────

async function calculateDynamicFare() {
  if (!pickupCoords || !dropoffCoords) {
    showError('Please select both pickup and drop-off locations');
    return;
  }
  const btn = document.getElementById('calculate-btn');
  btn.disabled = true;
  btn.textContent = 'Calculating...';
  hideError();
  try {
    const route = await getRoute(pickupCoords, dropoffCoords);
    const price = calculatePrice(route.distance, route.duration);
    currentBooking = {
      pickup: pickupCoords.name,
      dropoff: dropoffCoords.name,
      price: parseFloat(price.toFixed(2)),
      durationMin: Math.round(route.duration),
      type: 'dynamic',
    };
    document.getElementById('distance').textContent = `${route.distance.toFixed(2)} miles`;
    document.getElementById('duration').textContent = `${Math.round(route.duration)} min`;
    document.getElementById('fare').textContent = `${CONFIG.currency}${price.toFixed(2)}`;
    document.getElementById('result').classList.remove('hidden');
    showBookingForm();
    displayMap(route);
    if (!route.isActualRoute) showError('Note: using estimated route distance.');
  } catch {
    showError('Unable to calculate route. Please try different locations.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Calculate Fare';
  }
}

// ── Fixed routes tab ─────────────────────────────────────────────────────────

function renderFixedRoutes() {
  const container = document.getElementById('fixed-routes-list');
  if (!container) return;
  container.innerHTML = CONFIG.fixedRoutes.map((r, i) => `
    <div class="fixed-route-item" data-index="${i}">
      <div class="route-label">
        <span class="route-from">${r.from}</span>
        <span class="route-arrow">→</span>
        <span class="route-to">${r.to}</span>
      </div>
      <div class="route-price">${CONFIG.currency}${r.price.toFixed(2)}</div>
      <button class="btn-select-route" onclick="selectFixedRoute(${i})">Select</button>
    </div>
  `).join('');
}

function selectFixedRoute(index) {
  const route = CONFIG.fixedRoutes[index];
  currentBooking = {
    pickup: route.from,
    dropoff: route.to,
    price: route.price,
    durationMin: null,
    type: 'fixed',
  };
  document.querySelectorAll('.fixed-route-item').forEach(el => el.classList.remove('selected'));
  document.querySelector(`.fixed-route-item[data-index="${index}"]`).classList.add('selected');
  document.getElementById('fixed-fare').textContent = `${CONFIG.currency}${route.price.toFixed(2)}`;
  document.getElementById('fixed-result').classList.remove('hidden');
  showBookingForm();
}

// ── Booking form ─────────────────────────────────────────────────────────────

function showBookingForm() {
  const form = document.getElementById('booking-form-section');
  form.classList.remove('hidden');
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setMinDateTime();
  if (currentBooking) {
    document.getElementById('booking-summary').innerHTML =
      `<strong>${currentBooking.pickup}</strong> → <strong>${currentBooking.dropoff}</strong> &nbsp;|&nbsp; ${CONFIG.currency}${currentBooking.price.toFixed(2)}`;
  }
}

function setMinDateTime() {
  const input = document.getElementById('booking-datetime');
  if (!input) return;
  const now = new Date();
  now.setHours(now.getHours() + 1); // minimum 1 hour ahead
  input.min = now.toISOString().slice(0, 16);
}

function getBookingFormData() {
  return {
    name: document.getElementById('booking-name').value.trim(),
    phone: document.getElementById('booking-phone').value.trim(),
    email: document.getElementById('booking-email').value.trim(),
    datetime: document.getElementById('booking-datetime').value,
    notes: document.getElementById('booking-notes').value.trim(),
  };
}

function validateBookingForm(data) {
  if (!data.name) return 'Please enter your name.';
  if (!data.phone) return 'Please enter your phone number.';
  if (!data.email || !data.email.includes('@')) return 'Please enter a valid email.';
  if (!data.datetime) return 'Please select a pickup date and time.';
  return null;
}
