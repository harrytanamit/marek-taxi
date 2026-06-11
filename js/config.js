const CONFIG = {
  // Dynamic pricing
  baseFare: 3.50,
  costPerMile: 2.00,
  costPerMinute: 0.30,
  currency: '£',

  // Availability buffer — how long to block after estimated journey ends
  bufferMinutes: 60,

  // Fixed routes — edit this list to add/remove/change prices
  fixedRoutes: [
    { from: 'Edinburgh Airport', to: 'Edinburgh City Centre', price: 35 },
    { from: 'Edinburgh City Centre', to: 'Edinburgh Airport', price: 35 },
    { from: 'Edinburgh Airport', to: 'Leith', price: 40 },
    { from: 'Edinburgh Airport', to: 'Livingston', price: 55 },
    { from: 'Edinburgh Airport', to: 'Falkirk', price: 65 },
    { from: 'Edinburgh City Centre', to: 'Livingston', price: 45 },
    { from: 'Edinburgh City Centre', to: 'Glasgow City Centre', price: 110 },
  ],

  // External APIs
  nominatimUrl: 'https://nominatim.openstreetmap.org',
  orsApiKey: 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImYyYTg1MGU3YTlmZjQyZTlhOTNjOTc0YzRmYzIzZTVjIiwiaCI6Im11cm11cjY0In0=',
  orsUrl: 'https://api.openrouteservice.org',

  // Backend API — change this when OCI backend is deployed
  apiBaseUrl: 'https://your-oci-server.com/api',

  // Contact details
  phone: '+44 7700 000000',
  email: 'marek@example.com',
  companyName: 'Marek Taxi',
};
