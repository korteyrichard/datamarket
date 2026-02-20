# Progressive Web App (PWA) Installation Feature

This document describes the PWA installation feature implemented for the DataMarket application.

## Overview

The PWA feature allows users to install the DataMarket app on their devices (iOS and Android) for a native app-like experience. The install banner appears only on the homepage (`/`) and dashboard (`/dashboard`) pages.

## Architecture & Files

### 1. **Web App Manifest** (`public/manifest.json`)
- Defines PWA metadata (name, icons, theme colors, start URL)
- Includes icons for different sizes (192x192, 512x512)
- Supports both standard and maskable icons for Android adaptive icons
- References the start URL and display mode (standalone)

### 2. **Blade Layout** (`resources/views/app.blade.php`)
- Added manifest.json link in `<head>`
- Added Apple PWA meta tags for iOS support
- Added theme-color meta tag for browser UI
- Apple touch icon for iOS home screen

### 3. **Service Worker** (`public/sw.js`)
- Handles offline functionality and caching
- Implements network-first strategy (tries network first, falls back to cache)
- Automatically updates cache on successful network requests
- Manages lifecycle events: install, activate, fetch

### 4. **Service Worker Registration** (`resources/js/app.tsx`)
- Registers the service worker on window load
- Only registers if the browser supports service workers
- Logs success/error messages to console

### 5. **Custom Hook** (`resources/js/hooks/usePwaInstall.js`)
- **usePwaInstall()** hook provides PWA installation logic
- Features:
  - Route-aware: only shows on allowed routes (`/`, `/dashboard`)
  - Platform detection: detects iOS vs Android
  - Standalone mode detection: checks if already installed
  - Dismissal tracking: remembers dismissals for 7 days
  - `beforeinstallprompt` event handling for Chrome/Android

### 6. **Install Banner Component** (`resources/js/Components/PwaInstallBanner.tsx`)
- Fixed bottom banner with responsive design
- Shows different text based on platform:
  - **iOS**: Instructions to tap share icon and add to home screen
  - **Android/Desktop**: Standard "Install" button
- Dismiss logic with 7-day cooldown using localStorage
- Smooth animations with Tailwind CSS transitions
- Fallback to logo if icon fails to load

### 7. **Page Integration**
- Added `<PwaInstallBanner />` component to:
  - `resources/js/pages/welcome.tsx` (homepage)
  - `resources/js/pages/Dashboard/dashboard.tsx` (dashboard)

## Features

### ✓ Route-Based Display
The banner only appears on:
- Homepage (`/`)
- Dashboard (`/dashboard`)

### ✓ Platform-Specific UX
- **iOS**: Manual instructions (Apple doesn't support programmatic installation)
- **Android/Chrome**: One-click install button
- **Already Installed**: Banner doesn't show if app is running in standalone mode

### ✓ Dismissal Management
- Users can dismiss the banner by clicking the ✕ button
- Dismissal is remembered for 7 days via localStorage
- Key in localStorage: `pwa-install-dismissed-until`

### ✓ Inertia.js Compatibility
- Hook re-evaluates on every Inertia page visit (not just full page loads)
- Works seamlessly with client-side navigation

## Customization

### Update App Name & Description
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "Short Name",
  "description": "Your app description"
}
```

### Update Theme Colors
Edit multiple files:
- `public/manifest.json`: `theme_color`, `background_color`
- `resources/views/app.blade.php`: `content="#4B5563"` in meta tags
- `resources/js/app.tsx`: `color: '#4B5563'` in progress config

### Customize Banner Text & Styling
Edit `resources/js/Components/PwaInstallBanner.tsx`:
- Update heading text ("Get DataMarket")
- Modify colors and Tailwind classes
- Adjust padding and layout

### Change Allowed Routes
Edit `resources/js/hooks/usePwaInstall.js`:
```javascript
const allowedRoutes = ['/', '/dashboard', '/new-route'];
```

### Adjust Dismissal Duration
Edit `resources/js/hooks/usePwaInstall.js`:
```javascript
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
```

## Icons

### Placeholder Icons
Placeholder PNG icons have been generated and placed in `public/icons/`:
- `icon-192.png` - Home screen icon (192x192)
- `icon-192-maskable.png` - Adaptive icon for Android
- `icon-512.png` - Splash screen icon (512x512)
- `icon-512-maskable.png` - Adaptive splash icon

### Replacing with Real Icons

You can regenerate placeholder icons anytime:
```bash
npm run generate-pwa-icons
```

To use your own icons:
1. Create 192x192 and 512x512 PNG files
2. Optionally create maskable versions for Android adaptive icons
3. Replace files in `public/icons/`
4. Update manifest.json if file names differ

### Icon Requirements
- **Format**: PNG (recommended) or SVG
- **192x192**: Used for home screen shortcuts
- **512x512**: Used for splash screens and PWA stores
- **Maskable icons**: For Android adaptive icons (safe area within 66-pixel center circle)

## Browser Support

- ✅ Chrome/Edge (Android): Full support with install button
- ✅ Safari (iOS 15.1+): Supported via meta tags (manual install only)
- ✅ Samsung Internet: Full support
- ✅ Firefox (Android): Full support

## Testing

### Test on Android (Chrome)
1. Open app in Chrome on Android
2. Navigate to homepage or dashboard
3. Banner should appear with "Install" button
4. Click install and follow prompts
5. App appears on home screen

### Test on iOS
1. Open app in Safari on iOS
2. Navigate to homepage or dashboard
3. Banner should appear with instructions
4. Tap share icon (↑) and select "Add to Home Screen"
5. App icon appears on home screen

### Test Dismissal
1. Dismiss banner on any page where it shows
2. Banner won't reappear for 7 days
3. Clear localStorage or wait 7 days to see it again

### Test Service Worker
1. Open DevTools → Application → Service Workers
2. Should see `/sw.js` registered and active
3. Go offline and navigate to a cached page
4. Page should still load from cache

## Offline Support

The service worker implements a network-first strategy:
1. Tries to fetch from network first
2. If successful, updates cache and returns response
3. If network fails, returns cached version
4. If nothing in cache, returns error message

Currently cached URLs:
- `/`
- `/dashboard`
- `/index.php`
- `/manifest.json`

Expand the `urlsToCache` array in `public/sw.js` to cache additional routes.

## Troubleshooting

### Banner not appearing?
- Check allowed routes in `usePwaInstall.js`
- Check browser console for errors
- Ensure app is not already installed (check standalone mode)
- Clear localStorage (especially `pwa-install-dismissed-until`)

### Icons not loading?
- Verify files exist in `public/icons/`
- Check browser DevTools Network tab
- Ensure MIME types are correct (image/png)
- Try regenerating: `npm run generate-pwa-icons`

### Service worker not registering?
- Check browser console for errors
- Ensure app is served over HTTPS (required for production)
- Verify `/sw.js` file exists and is accessible
- Check Application tab in DevTools

### Install button not working?
- Only works on Chrome/Android or Samsung Internet
- Requires `beforeinstallprompt` event (browser-dependent)
- Try installing again - some browsers limit frequency

## Production Considerations

1. **HTTPS Required**: Service workers only work over HTTPS
2. **Icon Optimization**: Replace placeholder icons with branded ones
3. **Manifest Updates**: Keep manifest.json in sync with app name/description
4. **Cache Strategy**: Review and update cache strategy in `sw.js` for production
5. **Analytics**: Consider adding analytics for install events

## Security Notes

- The service worker has access to network requests
- LocalStorage for dismissal tracking stores client-side only
- No sensitive data stored in manifest or service worker
- Dismissal flag persists browser-locally only

## Files Modified/Created

```
Created:
  public/manifest.json
  public/sw.js
  public/icons/
    - icon-192.png
    - icon-192-maskable.png
    - icon-512.png
    - icon-512-maskable.png
    - icon-192.svg
    - icon-512.svg
    - screenshot-540.svg
  resources/js/hooks/usePwaInstall.js
  resources/js/Components/PwaInstallBanner.tsx
  scripts/generate-pwa-icons.js
  scripts/generate-pwa-icons.php

Modified:
  resources/views/app.blade.php
  resources/js/app.tsx
  resources/js/pages/welcome.tsx
  resources/js/pages/Dashboard/dashboard.tsx
  package.json
```

## Next Steps

1. ✅ PWA feature is fully implemented
2. 📸 Replace placeholder icons with real branded icons
3. 🎨 Customize colors and text in manifest and components
4. 🧪 Test on actual iOS and Android devices
5. 📱 Add splash screen images (optional)
6. 📊 Monitor installation metrics (optional)

---

For questions or issues, refer to the [Web App Manifest MDN Docs](https://developer.mozilla.org/en-US/docs/Web/Manifest) or [Service Workers MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).
