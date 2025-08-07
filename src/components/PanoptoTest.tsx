import React from 'react';
import { usePanoptoChecks } from '../hooks/usePanoptoChecks';

export const PanoptoTest: React.FC = () => {
  const { clearAllPanoptoMonitoringNotifications } = usePanoptoChecks();

  const handleClearAllMonitoringNotifications = async () => {
    console.log('🧹 User requested to clear all Panopto monitoring notifications');
    await clearAllPanoptoMonitoringNotifications();
  };

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
        Panopto Monitoring Debug
      </h3>
      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
        Use this to clear all Panopto monitoring notifications if they keep reappearing.
      </p>
      <button
        onClick={handleClearAllMonitoringNotifications}
        className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
      >
        Clear All Monitoring Notifications
      </button>
    </div>
  );
};

export default PanoptoTest; 