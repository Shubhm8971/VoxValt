// app/settings/components/ProfileSection.tsx
'use client';

import { useState } from 'react';
import type { UserInfo, ProfileData } from '../SettingsPageClient';

interface ProfileSectionProps {
    user: UserInfo;
    profile: ProfileData;
    onSave: (updates: Partial<ProfileData>) => Promise<void>;
    saving: boolean;
}

const TIMEZONES = [
    { value: 'Asia/Kolkata', label: '🇮🇳 India (IST)' },
    { value: 'Asia/Dubai', label: '🇦🇪 Dubai (GST)' },
    { value: 'Asia/Singapore', label: '🇸🇬 Singapore (SGT)' },
    { value: 'America/New_York', label: '🇺🇸 New York (EST)' },
    { value: 'America/Los_Angeles', label: '🇺🇸 Los Angeles (PST)' },
    { value: 'America/Chicago', label: '🇺🇸 Chicago (CST)' },
    { value: 'Europe/London', label: '🇬🇧 London (GMT)' },
    { value: 'Europe/Berlin', label: '🇩🇪 Berlin (CET)' },
    { value: 'Asia/Tokyo', label: '🇯🇵 Tokyo (JST)' },
    { value: 'Australia/Sydney', label: '🇦🇺 Sydney (AEDT)' },
];

const LANGUAGES = [
    { value: 'en', label: '🇬🇧 English' },
    { value: 'hi', label: '🇮🇳 हिन्दी (Hindi)', disabled: true },
    { value: 'ta', label: '🇮🇳 தமிழ் (Tamil)', disabled: true },
    { value: 'te', label: '🇮🇳 తెలుగు (Telugu)', disabled: true },
];

export default function ProfileSection({
    user,
    profile,
    onSave,
    saving,
}: ProfileSectionProps) {
    const [name, setName] = useState(profile.display_name);
    const [timezone, setTimezone] = useState(profile.timezone);
    const [language, setLanguage] = useState(profile.language);
    const [editing, setEditing] = useState(false);

    const hasChanges =
        name !== profile.display_name ||
        timezone !== profile.timezone ||
        language !== profile.language;

    const handleSave = async () => {
        await onSave({
            display_name: name.trim(),
            timezone,
            language,
        });
        setEditing(false);
    };

    const handleCancel = () => {
        setName(profile.display_name);
        setTimezone(profile.timezone);
        setLanguage(profile.language);
        setEditing(false);
    };

    // Get initials for avatar fallback
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    const providerLabel: Record<string, string> = {
        google: 'Google',
        phone: 'Phone',
        email: 'Email',
    };

    return (
        <section className="glass-card overflow-hidden animate-fade-in-up">
            {/* Profile Header */}
            <div className="p-4 pb-0">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={name}
                                className="w-16 h-16 rounded-2xl object-cover border-2 border-vox-border"
                            />
                        ) : (
                            <div
                                className="
                  w-16 h-16 rounded-2xl
                  bg-brand-gradient
                  flex items-center justify-center
                  text-white text-xl font-bold
                  border-2 border-brand-500/30
                "
                            >
                                {initials}
                            </div>
                        )}
                        <div
                            className="
                absolute -bottom-1 -right-1
                w-5 h-5 rounded-full
                bg-green-500 border-2 border-vox-bg
              "
                            title="Online"
                        />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-vox-text truncate">
                            {name}
                        </h2>
                        <p className="text-sm text-vox-text-secondary truncate">
                            {user.email || user.phone}
                        </p>
                        <p className="text-xs text-vox-text-muted mt-0.5">
                            Signed in with {providerLabel[user.provider] || user.provider}
                        </p>
                    </div>

                    {/* Edit Button */}
                    <button
                        onClick={() => setEditing(!editing)}
                        className="
              w-9 h-9 rounded-xl
              flex items-center justify-center
              hover:bg-vox-surface active:scale-95
              transition-all duration-200
              text-vox-text-secondary
            "
                        aria-label="Edit profile"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Edit Form */}
            {editing && (
                <div className="p-4 pt-4 space-y-4 animate-fade-in-down">
                    <div className="divider" />

                    {/* Display Name */}
                    <div>
                        <label className="block text-xs font-medium text-vox-text-secondary mb-1.5">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="vox-input"
                            maxLength={50}
                        />
                    </div>

                    {/* Timezone */}
                    <div>
                        <label className="block text-xs font-medium text-vox-text-secondary mb-1.5">
                            Timezone
                        </label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="vox-input appearance-none cursor-pointer"
                        >
                            {TIMEZONES.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Language */}
                    <div>
                        <label className="block text-xs font-medium text-vox-text-secondary mb-1.5">
                            Language
                        </label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="vox-input appearance-none cursor-pointer"
                        >
                            {LANGUAGES.map((lang) => (
                                <option
                                    key={lang.value}
                                    value={lang.value}
                                    disabled={lang.disabled}
                                >
                                    {lang.label} {lang.disabled ? '(Coming Soon)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Save/Cancel */}
                    {hasChanges && (
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handleSave}
                                disabled={saving || !name.trim()}
                                className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50"
                            >
                                {saving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </span>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="btn-secondary flex-1 py-2.5 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Quick info when not editing */}
            {!editing && (
                <div className="px-4 pb-4 pt-3">
                    <div className="flex items-center gap-4 text-xs text-vox-text-muted">
                        <span>🌍 {TIMEZONES.find((t) => t.value === timezone)?.label || timezone}</span>
                        <span>•</span>
                        <span>{LANGUAGES.find((l) => l.value === language)?.label || language}</span>
                    </div>
                </div>
            )}
        </section>
    );
}