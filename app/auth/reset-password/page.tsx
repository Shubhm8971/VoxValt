'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                if (!supabase) {
                    setError('Supabase is not configured.');
                    setVerifying(false);
                    return;
                }
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setError('Invalid or expired session. Please request a new reset link.');
                }
            } catch (err) {
                setError('Failed to verify session.');
            } finally {
                setVerifying(false);
            }
        };
        checkSession();
    }, [router]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!supabase) {
            setError('Supabase is not configured.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setMessage('Password updated successfully! Redirecting to login...');
            setTimeout(() => {
                router.push('/auth');
            }, 2000);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
        },
        card: {
            backgroundColor: '#1e293b',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
        },
        heading: {
            fontSize: '1.75rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            color: 'white',
            textAlign: 'center' as const,
        },
        formGroup: {
            marginBottom: '1.5rem',
        },
        label: {
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: '500',
            color: '#94a3b8',
        },
        input: {
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            color: 'white',
            boxSizing: 'border-box' as const,
            outline: 'none',
        },
        button: {
            width: '100%',
            padding: '0.875rem',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
        error: {
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '1rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            textAlign: 'center' as const,
        },
        success: {
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            color: '#22c55e',
            padding: '1rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            textAlign: 'center' as const,
        },
    };

    if (verifying) {
        return (
            <div style={styles.container}>
                <div style={{ color: 'white' }}>Verifying security token...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.heading}>🔒 New Password</h1>

                {error && <div style={styles.error}>{error}</div>}
                {message && <div style={styles.success}>{message}</div>}

                {!error && (
                    <form onSubmit={handleUpdatePassword}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Create Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={styles.input}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={styles.input}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                ...styles.button,
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Set New Password'}
                        </button>
                    </form>
                )}

                {error && (
                    <button
                        onClick={() => router.push('/auth')}
                        style={styles.button}
                    >
                        Back to Login
                    </button>
                )}
            </div>
        </div>
    );
}
