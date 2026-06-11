async function submitBooking() {
  if (!currentBooking) {
    showError('Please select a route first.');
    return;
  }

  const formData = getBookingFormData();
  const validationError = validateBookingForm(formData);
  if (validationError) {
    showError(validationError);
    return;
  }

  const btn = document.getElementById('book-pay-btn');
  btn.disabled = true;
  btn.textContent = 'Checking availability...';
  hideError();

  try {
    const available = await checkAvailability(formData.datetime, currentBooking.durationMin);
    if (!available) {
      showError('Sorry, that time slot is not available. Please choose a different time.');
      btn.disabled = false;
      btn.textContent = 'Book & Pay';
      return;
    }

    btn.textContent = 'Redirecting to payment...';

    const response = await fetch(`${CONFIG.apiBaseUrl}/create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...currentBooking, ...formData }),
    });

    if (!response.ok) throw new Error('Payment initiation failed');

    const { checkoutUrl } = await response.json();
    window.location.href = checkoutUrl;

  } catch (err) {
    showError('Unable to process booking. Please call us directly: ' + CONFIG.phone);
    btn.disabled = false;
    btn.textContent = 'Book & Pay';
  }
}
