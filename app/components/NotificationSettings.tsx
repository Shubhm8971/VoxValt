'use client';

import { Bell, BellOff, Volume2, VolumeX, Settings } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '@/lib/use-notifications';

interface NotificationSettingsProps {
  userId: string;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const { settings, requestPermission, updateSettings } = useNotifications(userId);
  const [showSettings, setShowSettings] = useState(false);

  const handleToggle = async () => {
    if (settings.permission !== 'granted') {
      await requestPermission();
    }
  };

  const handleLeadTimeChange = (minutes: number) => {
    updateSettings({ leadTimeMinutes: minutes });
  };

  const handleSoundToggle = () => {
    updateSettings({ sound: !settings.sound });
  };

  if (!showSettings) {
    if (settings.permission === 'granted') {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
            <Bell className="w-4 h-4" />
            <span>Notifications On</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            title="Notification settings"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-sm font-medium transition-colors"
        title="Enable notifications"
      >
        <BellOff className="w-4 h-4" />
        <span>Enable Notifications</span>
      </button>
    );
  }

  // Settings panel
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Notification Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Permission Status */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Permission Status</p>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
              <Bell className="w-4 h-4" />
              <span>Notifications Enabled</span>
            </div>
          </div>

          {/* Lead Time Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Notify me before task is due:
            </label>
            <div className="space-y-2">
              {[5, 10, 15, 30].map(minutes => (
                <label key={minutes} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input
                    type="radio"
                    name="leadTime"
                    value={minutes}
                    checked={settings.leadTimeMinutes === minutes}
                    onChange={() => handleLeadTimeChange(minutes)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    {minutes} minute{minutes > 1 ? 's' : ''} before
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sound Setting */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Sound</p>
            <button
              onClick={handleSoundToggle}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-colors w-full ${settings.sound
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
            >
              {settings.sound ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {settings.sound ? 'Sound On' : 'Sound Off'}
              </span>
            </button>
          </div>

          {/* Morning Briefing Setting */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Morning Briefing</p>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <span className="text-lg">☀️</span>
                </div>
                <div>
                  <span className="text-sm font-medium block">Daily Summary</span>
                  <span className="text-xs text-gray-500">Get a summary tasks at 9:00 AM</span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.morningBriefing}
                  onChange={() => updateSettings({ morningBriefing: !settings.morningBriefing })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

        </div>

        <button
          onClick={() => setShowSettings(false)}
          className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
}
