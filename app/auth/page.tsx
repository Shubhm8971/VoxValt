'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { signInWithOtpAction, verifyOtpAction } from './actions';

export default function AuthPage() {

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const signInWithGoogle = async () => {
        setLoading(true);
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!email) return setError('Please enter your email address');
        console.log('[Auth] Starting OTP flow for:', email);
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, origin: window.location.origin }),
            });

            const result = await response.json();
            console.log('[Auth] API result:', result);

            if (!response.ok || result.error) {
                throw new Error(result.error || `Server error: ${response.status}`);
            }

            setStep('otp');
            setMessage('Magic code sent! Please check your email.');
        } catch (err: any) {
            console.error('[Auth] Local error:', err);
            setError(err.message || 'Failed to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return setError('Please enter the OTP');
        setLoading(true);
        setError('');

        try {
            const result = await verifyOtpAction(email, otp);
            if (result.error) throw new Error(result.error);

            // Redirect on client to ensure persistence works or refresh happens
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 to-black">
            <div className="max-w-md w-full p-8 text-center">
                <h1 className="text-4xl font-bold text-white mb-2">
                    Vox<span className="text-indigo-400">Valt</span>
                </h1>
                <p className="text-gray-400 mb-6">
                    Never forget what you said you'd do
                </p>

                {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">{error}</div>}
                {message && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-500 rounded-lg text-sm">{message}</div>}

                <button
                    onClick={signInWithGoogle}
                    className="w-full py-3 bg-white text-gray-800 rounded-xl 
                     font-medium hover:bg-gray-100 transition mb-4"
                >
                    Continue with Google
                </button>

                {/* Email OTP instead of Phone to avoid SMS provider requirement */}
                <div className="mt-4 p-4 bg-gray-800 rounded-xl text-left">
                    <p className="text-gray-400 text-sm mb-2 text-center">
                        {step === 'email' ? 'Or sign in with Email Code' : 'Enter the code sent to your email'}
                    </p>

                    {step === 'email' ? (
                        <>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 bg-gray-700 text-white rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleSendOtp}
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {loading ? 'Sending Code...' : 'Send Magic Code'}
                            </button>
                        </>
                    ) : (
                        <>
                            <input
                                type="text"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full p-3 bg-gray-700 text-white rounded-lg mb-3 tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleVerifyOtp}
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>
                            <button
                                onClick={() => setStep('email')}
                                className="w-full mt-3 text-sm text-gray-400 hover:text-white transition"
                            >
                                Wait, I need to change my email
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}