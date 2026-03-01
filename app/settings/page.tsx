import { CalendarSettings } from '../components/CalendarSettings';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
  const userId = 'user-id-placeholder'; // This should come from auth

  const { theme, setTheme } = useTheme();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="mb-8 p-6 glass-card rounded-2xl border border-vox-border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-vox-text">Theme</p>
            <p className="text-xs text-vox-text-muted">Switch between light and dark mode</p>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-4 py-2 bg-vox-surface border border-vox-border rounded-xl text-sm font-medium hover:bg-white/5 transition-all"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Integrations</h2>
        <CalendarSettings userId={userId} />
      </div>
    </div>
  );
}