# Taxi Company Website

A professional website for a one-person taxi company with a route-based fare calculator.

## Features

- **Route-Based Fare Calculator**: Calculates accurate fares based on actual driving routes
- **Location Autocomplete**: Smart location suggestions using OpenStreetMap's Nominatim
- **Interactive Map**: Visual route display with pickup and drop-off markers
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Professional Layout**: Clean, modern design with hero section, about, and contact information

## Setup Instructions

### 1. Basic Setup (Works Immediately)

The website works out of the box with estimated routes. Simply open `index.html` in a web browser.

### 2. Enhanced Setup (Recommended for Production)

For accurate route-based pricing, get a free API key from OpenRouteService:

1. Go to https://openrouteservice.org/dev/#/signup
2. Sign up for a free account
3. Get your API key
4. Open `script.js` and replace `YOUR_ORS_API_KEY_HERE` with your actual API key:
   ```javascript
   orsApiKey: 'your-actual-api-key-here',
   ```

### 3. Customize Your Settings

Edit the configuration in `script.js`:

```javascript
const CONFIG = {
    baseFare: 3.50,           // Starting fare
    costPerKm: 1.20,          // Price per kilometer
    costPerMinute: 0.30,      // Price per minute
    currency: '$',            // Currency symbol
    // ...
};
```

### 4. Customize Contact Information

Edit the contact details in `index.html`:
- Phone number (search for `+1 (234) 567-890`)
- Email address (search for `info@quicktaxi.com`)
- Company name (search for `Quick Taxi`)

## How It Works

1. **Location Search**: Uses OpenStreetMap's Nominatim API for free geocoding and location suggestions
2. **Route Calculation**: Uses OpenRouteService API for accurate driving routes (or falls back to estimated routes)
3. **Fare Calculation**: Combines base fare, distance cost, and time cost for accurate pricing
4. **Map Display**: Uses Leaflet.js with OpenStreetMap tiles for interactive map visualization

## Technologies Used

- HTML5
- CSS3 (with CSS Grid and Flexbox)
- Vanilla JavaScript (no frameworks required)
- Leaflet.js for maps
- OpenStreetMap for map tiles and geocoding
- OpenRouteService for routing (optional but recommended)

## Browser Support

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Deployment

### Option 1: GitHub Pages (Free)
1. Create a GitHub repository
2. Upload all files
3. Enable GitHub Pages in repository settings
4. Your site will be live at `https://yourusername.github.io/repository-name`

### Option 2: Netlify (Free)
1. Drag and drop the `taxi-website` folder to https://app.netlify.com/drop
2. Your site will be live instantly with a free URL

### Option 3: Traditional Web Hosting
Upload all files to your web hosting provider via FTP.

## API Rate Limits

- **Nominatim (Geocoding)**: 1 request per second (sufficient for normal use)
- **OpenRouteService (Free tier)**: 2,000 requests per day

## Customization Tips

1. **Change colors**: Edit the CSS variables in `styles.css`:
   ```css
   :root {
       --primary-color: #f59e0b;  /* Change taxi theme color */
       --secondary-color: #1f2937;
   }
   ```

2. **Add more features**: Consider adding:
   - Booking form integration
   - Payment gateway
   - Customer reviews section
   - Service area map
   - Multiple vehicle types with different pricing

3. **SEO optimization**: Add meta tags in `index.html`:
   ```html
   <meta name="description" content="Your description">
   <meta name="keywords" content="taxi, cab, transportation">
   ```

## Support

For issues or questions, refer to:
- Leaflet.js docs: https://leafletjs.com/
- OpenRouteService docs: https://openrouteservice.org/dev/
- Nominatim docs: https://nominatim.org/

## License

Free to use for your taxi business. No attribution required.
