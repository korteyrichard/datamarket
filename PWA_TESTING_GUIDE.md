# PWA Installation Banner - Testing & Debugging Guide

## Why You're Not Seeing the Banner

There are several possible reasons and ways to debug them:

### 1. **Check Browser Console**
Open DevTools (F12 → Console) and look for `[PWA]` log messages:

```
[PWA] iOS device detected: false
[PWA] Already installed (standalone mode): false
[PWA] Recently dismissed: false
[PWA] Current route: /
[PWA] Is allowed route: true
[PWA] Should show prompt: true
```

### 2. **Using Development Mode (Localhost)**
On localhost/development, Chrome won't fire the `beforeinstallprompt` event. To test the banner:

#### **Enable Dev Mode:**
Add `?pwa-dev=true` to your URL:
```
http://localhost:5173/?pwa-dev=true
http://localhost:5173/dashboard?pwa-dev=true
```

In dev mode, you'll see:
- A purple button "PWA: Clear Dismissal" in top right
- The banner is **always visible** for testing
- Debug info showing: `showPrompt`, `isIos`, `isStandalone` status

#### **To Exit Dev Mode:**
- Click "Disable Dev Mode" button, or
- Remove `?pwa-dev=true` from the URL

### 3. **Clear Dismissal Flag (for Testing)**
If the banner was dismissed, it won't show for 7 days. To reset:

**Option A: Dev Mode (Easiest)**
- Go to `?pwa-dev=true`
- Click "PWA: Clear Dismissal" button

**Option B: DevTools Console**
```javascript
// Run in DevTools console (F12)
localStorage.removeItem('pwa-install-dismissed-until');
location.reload();
```

**Option C: Manual via Inspect Element**
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Find and delete `pwa-install-dismissed-until` key
4. Reload page

### 4. **Verify You're on the Right Page**
The banner only shows on:
- `https://yoursite.com/` (homepage)
- `https://yoursite.com/dashboard` (dashboard)

If you're on a different page, the banner won't appear (by design).

### 5. **Check Route Detection**
In console, look for:
```
[PWA] Current route: /
[PWA] Is allowed route: true
```

If it says `false` for allowed route, the page is not in the allowed list.

### 6. **Test on Real Devices**

#### **Android (Chrome)**
1. Build and deploy to HTTPS server (or use ngrok/Expose for localhost)
2. Open Chrome on Android
3. Navigate to homepage or dashboard
4. Banner should appear at bottom
5. Tap "Install" → follow prompts
6. App appears on home screen

#### **iOS (Safari)**
1. Build and deploy to HTTPS server (or use ngrok/Expose for localhost)
2. Open Safari on iOS
3. Navigate to homepage or dashboard
4. Banner should appear at bottom
5. Follow instructions: "Tap share icon (↑) then Add to Home Screen"

### 7. **CommonIssues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| No banner on localhost | `beforeinstallprompt` not fired in dev | Use `?pwa-dev=true` to enable test mode |
| Banner disappeared after dismiss | 7-day dismissal active | Clear dismissal: `localStorage.removeItem('pwa-install-dismissed-until')` |
| Banner shows "Install" but button does nothing | No deferred prompt available | Only works on Chrome/Edge with HTTPS |
| Banner on iOS shows wrong text | Not detecting iOS properly | Check console: should show `iOS device detected: true` |
| Banner not showing at all | Not on allowed route | Check you're on `/` or `/dashboard` |
| Banner shows but can't install on Android | Not HTTPS | PWA requires HTTPS in production |

## Console Debug Messages Explained

```javascript
// Good state - banner should show
[PWA] iOS device detected: false
[PWA] Already installed (standalone mode): false
[PWA] Recently dismissed: false
[PWA] Current route: /
[PWA] Is allowed route: true
[PWA] Should show prompt: true
[PWA] Showing install prompt (Android/Chrome)  // or (iOS)
```

```javascript
// Dev environment - beforeinstallprompt won't fire
[PWA] No beforeinstallprompt fired after 2 seconds. This is normal in development on localhost.
In production (HTTPS), Chrome will fire the event when criteria are met.
```

## Testing Timeline (How Banner Appears)

1. **User visits homepage**
   - Banner checks dismissal status
   - If not dismissed, banner attempts to show
   - On Android: Waits for `beforeinstallprompt` event
   - On iOS: Shows immediately

2. **User sees banner**
   - Android: "Install our app for a faster experience" + Install button
   - iOS: "Tap the share icon (↑) then 'Add to Home Screen'"

3. **User clicks Install (Android) or dismisses**
   - If Install → Chrome shows system install dialog
   - If Dismiss → Dismissed for 7 days, no banner until then

4. **App installed & opened in standalone mode**
   - `navigator.standalone === true` (iOS) or `(display-mode: standalone)` (Android)
   - Banner doesn't appear (app is already installed)

## Deploy Instructions for HTTPS Testing

### Using ngrok (Easiest for Testing)
```bash
# Terminal 1: Start your dev server
npm run dev

# Terminal 2: Tunnel localhost to HTTPS
npx ngrok http 5173
```

Then navigate to the ngrok URL on your phone's browser.

### Using Vercel (For Production)
```bash
npm install -g vercel
vercel
```

## Clear All PWA Data

If you want to completely reset and test from scratch:

```javascript
// Run in DevTools console
// Clear dismissal flag
localStorage.removeItem('pwa-install-dismissed-until');

// Clear service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});

// Reload
location.reload();
```

Then uninstall app from home screen and test fresh installation.

## Expected Behavior

### ✅ Correct Behavior
- Banner appears on `/` and `/dashboard` 
- On Android Chrome: Shows "Install" button that triggers system dialog
- On iOS: Shows instructions to manually add via share menu
- Clicking dismiss hides banner for 7 days
- After installing, banner never shows (app in standalone mode)
- Service worker registers successfully

### ❌ Incorrect Behavior
- Banner always shows/never shows
- Banner shows on pages other than `/` and `/dashboard`
- Install button doesn't work (should only work on HTTPS with Chrome)
- No console messages at all (PWA hook not running)

## Viewing PWA Installation in Browser

### Chrome/Edge DevTools
1. F12 → Application tab
2. Service Workers section shows registration status
3. Manifest section shows manifest.json details
4. Storage → Local Storage → See `pwa-install-dismissed-until` key

### Firefox DevTools
1. F12 → Storage tab
2. Local Storage → See PWA cookies

### Safari DevTools
1. Develop → [Device] → [App]
2. Service workers not shown (Safari PWA support is limited)

---

**Summary:**
- Use `?pwa-dev=true` for testing on localhost
- Check console for `[PWA]` messages
- Clear dismissal if you can't see banner
- Test on real Android/iOS devices with HTTPS
- Check DevTools → Application for registration status

Happy testing! 🚀
