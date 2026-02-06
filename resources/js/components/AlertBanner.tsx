import { useState, useEffect } from 'react';

interface Alert {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface AlertBannerProps {
  alerts: Alert[];
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));

  useEffect(() => {
    if (visibleAlerts.length > 0) {
      setShowAlert(true);
    }
  }, [visibleAlerts.length]);

  const dismissAlert = () => {
    const currentAlert = visibleAlerts[currentAlertIndex];
    if (currentAlert) {
      setDismissedAlerts(prev => [...prev, currentAlert.id]);
    }
    
    // Show next alert if available
    if (currentAlertIndex < visibleAlerts.length - 1) {
      setCurrentAlertIndex(prev => prev + 1);
    } else {
      setShowAlert(false);
      setCurrentAlertIndex(0);
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-950/90 dark:border-blue-300 dark:text-blue-100';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-900 dark:bg-yellow-950/90 dark:border-yellow-300 dark:text-yellow-100';
      case 'success':
        return 'bg-green-50 border-green-500 text-green-900 dark:bg-green-950/90 dark:border-green-300 dark:text-green-100';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-900 dark:bg-red-950/90 dark:border-red-300 dark:text-red-100';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-900 dark:bg-gray-950/90 dark:border-gray-300 dark:text-gray-100';
    }
  };

  const getButtonStyles = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!showAlert || visibleAlerts.length === 0) {
    return null;
  }

  const currentAlert = visibleAlerts[currentAlertIndex];
  if (!currentAlert) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40">
      <div className={`max-w-md w-full mx-4 rounded-lg border-l-4 p-6 shadow-xl backdrop-blur-sm ${getAlertStyles(currentAlert.type)}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon(currentAlert.type)}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-semibold">{currentAlert.title}</h3>
            <p className="mt-2 text-sm opacity-90">{currentAlert.message}</p>
            
            {/* Alert counter */}
            {visibleAlerts.length > 1 && (
              <p className="mt-3 text-xs opacity-75">
                Alert {currentAlertIndex + 1} of {visibleAlerts.length}
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={dismissAlert}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${getButtonStyles(currentAlert.type)}`}
          >
            {currentAlertIndex < visibleAlerts.length - 1 ? 'Next' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}