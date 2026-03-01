'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Mail, Check } from 'lucide-react';

export default function ResetPasswordPage() {
  const { resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    setFormError(null);

    if (!email.trim()) {
      setFormError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setFormError('Please enter a valid email');
      return false;
    }

    return true;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const { error } = await resetPassword(email);

    if (error) {
      setFormError(error);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎙️ VoxValt</h1>
          <p className="text-blue-100">Your conversational memory assistant</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
          <p className="text-gray-600 text-sm mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-3">
                <Check className="w-12 h-12 text-green-600" />
              </div>
              <p className="text-green-800 font-medium mb-2">Check your email</p>
              <p className="text-green-700 text-sm mb-4">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-green-700 text-sm mb-6">
                Click the link in the email to reset your password.
              </p>
              <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error Messages */}
              {(formError || error) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{formError || error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending email...' : 'Send Reset Link'}
              </button>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <p className="text-gray-600">
                  Remember your password?{' '}
                  <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm mt-6">
          Check your email for a password reset link
        </p>
      </div>
    </div>
  );
}
