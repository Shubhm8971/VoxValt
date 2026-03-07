'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Settings, Users, CalendarSync, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface TeamCalendar {
  id: string;
  calendar_id: string;
  calendar_name: string;
  calendar_color: string;
  is_default: boolean;
  created_at: string;
  creator: {
    full_name: string;
    email: string;
  };
}

interface TeamCalendarProps {
  teamId: string;
  className?: string;
}

export function TeamCalendar({ teamId, className = '' }: TeamCalendarProps) {
  const [calendars, setCalendars] = useState<TeamCalendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddCalendar, setShowAddCalendar] = useState(false);
  const [newCalendar, setNewCalendar] = useState({
    calendarId: '',
    calendarName: '',
    calendarColor: '#3788d8',
    isDefault: false
  });
  const [syncing, setSyncing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    if (teamId) {
      loadTeamCalendars();
    }
  }, [teamId]);

  const loadTeamCalendars = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/calendars`);
      const data = await response.json();
      
      if (data.calendars) {
        setCalendars(data.calendars);
      }
    } catch (error) {
      console.error('Failed to load team calendars:', error);
      showMessage('error', 'Failed to load calendars');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalendar.calendarId || !newCalendar.calendarName) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/calendars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCalendar)
      });

      const data = await response.json();
      
      if (response.ok) {
        setCalendars([data.teamCalendar, ...calendars]);
        setNewCalendar({ calendarId: '', calendarName: '', calendarColor: '#3788d8', isDefault: false });
        setShowAddCalendar(false);
        showMessage('success', 'Calendar added successfully');
      } else {
        showMessage('error', data.error || 'Failed to add calendar');
      }
    } catch (error) {
      console.error('Failed to add calendar:', error);
      showMessage('error', 'Failed to add calendar');
    } finally {
      setLoading(false);
    }
  };

  const syncTaskToCalendar = async (taskId: string, calendarId: string) => {
    setSyncing(taskId);
    try {
      const response = await fetch(`/api/teams/${teamId}/calendar-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, calendarId })
      });

      const data = await response.json();
      
      if (response.ok) {
        showMessage('success', 'Task synced to calendar');
      } else {
        showMessage('error', data.error || 'Failed to sync task');
      }
    } catch (error) {
      console.error('Failed to sync task:', error);
      showMessage('error', 'Failed to sync task');
    } finally {
      setSyncing(null);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  if (!teamId) {
    return (
      <div className={`bg-vox-surface border border-vox-border rounded-xl p-6 text-center ${className}`}>
        <Calendar className="w-8 h-8 text-vox-text-muted mx-auto mb-2" />
        <p className="text-sm text-vox-text-muted">Select a team to manage calendars</p>
      </div>
    );
  }

  return (
    <div className={`bg-vox-surface border border-vox-border rounded-xl ${className}`}>
      <div className="p-4 border-b border-vox-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-vox-text flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            Team Calendars
          </h3>
          <button
            onClick={() => setShowAddCalendar(!showAddCalendar)}
            className="p-2 hover:bg-vox-surface/80 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-vox-text-secondary" />
          </button>
        </div>
        <p className="text-xs text-vox-text-muted mt-1">Shared calendars for team tasks and events</p>
      </div>

      {message && (
        <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {showAddCalendar && (
        <div className="p-4 border-b border-vox-border">
          <form onSubmit={handleAddCalendar} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-vox-text mb-1">Calendar Name</label>
              <input
                type="text"
                value={newCalendar.calendarName}
                onChange={(e) => setNewCalendar({ ...newCalendar, calendarName: e.target.value })}
                placeholder="Team Calendar"
                className="w-full px-3 py-2 bg-vox-bg border border-vox-border rounded-lg text-sm text-vox-text placeholder:text-vox-text-muted focus:ring-1 focus:ring-brand-500 outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-vox-text mb-1">Google Calendar ID</label>
              <input
                type="text"
                value={newCalendar.calendarId}
                onChange={(e) => setNewCalendar({ ...newCalendar, calendarId: e.target.value })}
                placeholder="calendar-id@group.calendar.google.com"
                className="w-full px-3 py-2 bg-vox-bg border border-vox-border rounded-lg text-sm text-vox-text placeholder:text-vox-text-muted focus:ring-1 focus:ring-brand-500 outline-none"
                required
              />
              <p className="text-xs text-vox-text-muted mt-1">Get this from Google Calendar settings</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={newCalendar.isDefault}
                onChange={(e) => setNewCalendar({ ...newCalendar, isDefault: e.target.checked })}
                className="rounded border-vox-border bg-vox-bg text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="isDefault" className="text-xs text-vox-text">
                Set as default team calendar
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-brand-500 text-white text-sm font-medium py-2 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                Add Calendar
              </button>
              <button
                type="button"
                onClick={() => setShowAddCalendar(false)}
                className="px-4 py-2 bg-vox-bg border border-vox-border text-sm text-vox-text rounded-lg hover:bg-vox-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-vox-text-muted">Loading calendars...</p>
          </div>
        ) : calendars.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-vox-text-muted mx-auto mb-2" />
            <p className="text-sm text-vox-text-muted">No team calendars yet</p>
            <p className="text-xs text-vox-text-muted mt-1">Add a Google Calendar to start syncing team tasks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {calendars.map((calendar) => (
              <div key={calendar.id} className="p-3 bg-vox-bg rounded-lg border border-vox-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: calendar.calendar_color }}
                    />
                    <div>
                      <h4 className="text-sm font-medium text-vox-text">{calendar.calendar_name}</h4>
                      <p className="text-xs text-vox-text-muted">
                        Added by {calendar.creator.full_name} • {calendar.is_default ? 'Default' : 'Shared'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {calendar.is_default && (
                      <span className="text-xs bg-brand-500/10 text-brand-500 px-2 py-1 rounded-full font-medium">
                        Default
                      </span>
                    )}
                    <button
                      onClick={() => syncTaskToCalendar('example-task-id', calendar.calendar_id)}
                      disabled={syncing === 'example-task-id'}
                      className="p-1.5 hover:bg-vox-surface rounded transition-colors"
                      title="Sync tasks to this calendar"
                    >
                      <CalendarSync className={`w-4 h-4 text-vox-text-secondary ${
                        syncing === 'example-task-id' ? 'animate-spin' : ''
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
