import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

const usePwaInstall = () => {
  const { url } = usePage();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const allowedRoutes = ['/', '/dashboard'];
  const DISMISS_KEY = 'pwa-install-dismissed-until';
  const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  // Check if current page is in allowed routes
  const isAllowedRoute = allowedRoutes.some((route) =>
    url === route || url.startsWith(route + '/')
  );

  // Detect iOS
  const detectIos = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };

  // Check if app is in standalone mode (already installed)
  const checkStandalone = () => {
    // Check for standalone mode
    if (navigator.standalone === true) {
      return true;
    }
    // Check for display-mode media query
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    return false;
  };

  // Check if install was dismissed recently
  const isDismissedRecently = () => {
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (!dismissedUntil) return false;

    const dismissTime = parseInt(dismissedUntil, 10);
    return Date.now() < dismissTime;
  };

  // Clear dismissal (for testing)
  const clearDismissal = () => {
    localStorage.removeItem(DISMISS_KEY);
    console.log('[PWA] Dismissal cleared - banner will show next time');
  };

  // Dismiss the prompt for 7 days
  const dismissPrompt = () => {
    const dismissUntil = Date.now() + DISMISS_DURATION;
    localStorage.setItem(DISMISS_KEY, dismissUntil.toString());
    setShowPrompt(false);
    console.log('[PWA] Prompt dismissed for 7 days');
  };

  // Trigger the install prompt (for Android/Chrome)
  const triggerInstall = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install prompt outcome: ${outcome}`);

      if (outcome === 'accepted') {
        console.log('[PWA] Installation accepted');
        dismissPrompt();
        setDeferredPrompt(null);
      } else {
        console.log('[PWA] Installation dismissed by user');
      }
    } catch (error) {
      console.error('[PWA] Error triggering install prompt:', error);
    }
  };

  // Setup event listeners and state management
  useEffect(() => {
    // Detect iOS
    const isIOSDevice = detectIos();
    setIsIos(isIOSDevice);
    console.log('[PWA] iOS device detected:', isIOSDevice);

    // Check if already installed
    const isAlreadyInstalled = checkStandalone();
    setIsStandalone(isAlreadyInstalled);
    console.log('[PWA] Already installed (standalone mode):', isAlreadyInstalled);

    // Check if dismissed recently
    const recentlyDismissed = isDismissedRecently();
    console.log('[PWA] Recently dismissed:', recentlyDismissed);
    console.log('[PWA] Current route:', url);
    console.log('[PWA] Is allowed route:', isAllowedRoute);

    // Determine if we should show the prompt
    const shouldShow =
      isAllowedRoute && !isAlreadyInstalled && !recentlyDismissed;
    console.log('[PWA] Should show prompt:', shouldShow);

    // Listen for beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event fired');
      setDeferredPrompt(e);

      // Show prompt if we should
      if (shouldShow) {
        setShowPrompt(true);
        console.log('[PWA] Showing install prompt (Android/Chrome)');
      }
    };

    // Add listener for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // On iOS, always show if conditions are met (beforeinstallprompt won't fire on iOS)
    if (isIOSDevice && shouldShow) {
      setShowPrompt(true);
      console.log('[PWA] Showing install prompt (iOS)');
    } else if (isIOSDevice) {
      console.log('[PWA] iOS device but not showing prompt because:', {
        isAllowedRoute,
        isAlreadyInstalled,
        recentlyDismissed,
      });
    }

    // For Android/desktop, log if beforeinstallprompt never fires (development environment)
    const timeoutId = setTimeout(() => {
      if (!isIOSDevice && shouldShow && !deferredPrompt) {
        console.log(
          '[PWA] No beforeinstallprompt fired after 2 seconds. This is normal in development on localhost.',
          'In production (HTTPS), Chrome will fire the event when criteria are met.'
        );
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timeoutId);
    };
  }, [url, isAllowedRoute, deferredPrompt]);

  return {
    showPrompt,
    isIos,
    triggerInstall,
    dismissPrompt,
    isStandalone,
    clearDismissal, // Expose for testing/debugging
  };
};

export default usePwaInstall;
