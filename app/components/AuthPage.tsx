'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
        setEmail('');
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess?.();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      maxWidth: '400px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    heading: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '1.5rem',
      color: '#333',
      textAlign: 'center' as const,
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.95rem',
      fontWeight: '500',
      color: '#555',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e0e0e0',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      boxSizing: 'border-box' as const,
      transition: 'border-color 0.3s ease',
    },
    inputFocus: {
      borderColor: '#667eea',
      outline: 'none',
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    buttonHover: {
      backgroundColor: '#5568d3',
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
    toggleText: {
      textAlign: 'center' as const,
      marginTop: '1.5rem',
      fontSize: '0.9rem',
      color: '#666',
    },
    toggleLink: {
      color: '#667eea',
      cursor: 'pointer',
      fontWeight: 'bold',
      textDecoration: 'underline',
    },
    error: {
      backgroundColor: '#fee',
      border: '1px solid #fcc',
      color: '#c33',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      fontSize: '0.9rem',
    },
    success: {
      backgroundColor: '#efe',
      border: '1px solid #cfc',
      color: '#3c3',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      fontSize: '0.9rem',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>
          {isSignUp ? '📝 Sign Up' : '🔐 Login'}
        </h1>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="your@email.com"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : styles.buttonHover),
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div style={styles.toggleText}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span
            style={styles.toggleLink}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </span>
        </div>
      </div>
    </div>
  );
}
