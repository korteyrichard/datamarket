import { useEffect, useState } from 'react';
import usePwaInstall from '../hooks/usePwaInstall';

const PwaInstallBanner = () => {
  const { showPrompt, isIos, triggerInstall, dismissPrompt, isStandalone, clearDismissal } =
    usePwaInstall();
  const [mounted, setMounted] = useState(false);
  const [devMode, setDevMode] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Enable dev mode by adding ?pwa-dev=true to URL
    const params = new URLSearchParams(window.location.search);
    setDevMode(params.get('pwa-dev') === 'true');
  }, []);

  // In dev mode, show a small debug button to toggle the banner
  if (devMode && mounted) {
    return (
      <>
        {/* Debug Button in Top Right */}
        <div className="fixed top-4 right-4 z-[9999] space-y-2 flex flex-col">
          <button
            onClick={() => {
              clearDismissal();
              window.location.reload();
            }}
            className="px-3 py-2 text-xs font-medium bg-purple-500 text-white rounded hover:bg-purple-600 whitespace-nowrap cursor-pointer"
            title="Clear dismissal flag and show banner"
          >
            ✓ Clear Dismissal
          </button>
          <a
            href="?pwa-dev=false"
            className="px-3 py-2 text-xs font-medium bg-gray-500 text-white rounded hover:bg-gray-600 text-center whitespace-nowrap cursor-pointer"
          >
            Exit Dev Mode
          </a>
        </div>

        {/* Always Show Banner in Dev Mode */}
        {showPrompt || isIos ? (
          <div className="fixed bottom-0 left-0 right-0 z-[9998] transition-all duration-300 ease-in-out translate-y-0 opacity-100">
            <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl">
              <div className="flex items-center gap-4 px-4 py-4 sm:px-6 sm:py-5">
                {/* App Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    D
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    [DEV] Testing Install Banner
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    showPrompt: <span className="font-mono">{String(showPrompt)}</span> | isIos:{' '}
                    <span className="font-mono">{String(isIos)}</span> | standalone:{' '}
                    <span className="font-mono">{String(isStandalone)}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-2">
                  {!isIos && (
                    <button
                      onClick={triggerInstall}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                      Test Install
                    </button>
                  )}
                  <button
                    onClick={dismissPrompt}
                    className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 cursor-pointer"
                    aria-label="Dismiss"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 right-0 z-[9998] bg-yellow-100 border-t border-yellow-300 px-4 py-3">
            <p className="text-xs text-yellow-800">
              <strong>[DEV MODE]</strong> Banner not showing - showPrompt is false. Click "✓ Clear Dismissal" above to show it.
            </p>
          </div>
        )}
      </>
    );
  }

  if (!mounted || !showPrompt || isStandalone) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        showPrompt ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl">
        <div className="flex items-center gap-4 px-4 py-4 sm:px-6 sm:py-5">
          {/* App Icon */}
          <div className="flex-shrink-0">
            <img
              src="/icons/icon-192.png"
              alt="DataMarket"
              className="w-12 h-12 rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/logo.svg';
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Get DataMarket
            </h3>
            {isIos ? (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Tap the share icon (↑) then "Add to Home Screen"
              </p>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Install our app for a faster, app-like experience
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex gap-2">
            {!isIos && (
              <button
                onClick={triggerInstall}
                className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                Install
              </button>
            )}
            <button
              onClick={dismissPrompt}
              className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallBanner;
