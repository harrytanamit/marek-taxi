async function checkAvailability(datetime, durationMin) {
  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datetime, durationMin: durationMin || 90 }),
    });
    const data = await response.json();
    return data.available;
  } catch {
    // If backend unreachable, allow booking to proceed (Marek handles conflicts)
    console.warn('Availability check failed — proceeding without check');
    return true;
  }
}
