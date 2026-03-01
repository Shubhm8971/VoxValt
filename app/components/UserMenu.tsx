'use client';

import { supabase } from '@/lib/supabase';
import { useState } from 'react';

interface UserMenuProps {
  userEmail?: string;
  onLogout?: () => void;
}

export function UserMenu({ userEmail, onLogout }: UserMenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
    onLogout?.();
  };

  const styles = {
    container: {
      position: 'relative' as const,
      display: 'inline-block',
    },
    button: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    menu: {
      position: 'absolute' as const,
      top: '100%',
      right: 0,
      marginTop: '0.5rem',
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 10,
      minWidth: '200px',
    },
    menuItem: {
      display: 'block',
      width: '100%',
      padding: '0.75rem 1rem',
      border: 'none',
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      cursor: 'pointer',
      fontSize: '0.9rem',
      color: '#333',
      transition: 'background-color 0.2s ease',
    },
    menuItemHover: {
      backgroundColor: '#f5f5f5',
    },
    menuDivider: {
      height: '1px',
      backgroundColor: '#e0e0e0',
      margin: '0.5rem 0',
    },
    email: {
      padding: '0.75rem 1rem',
      fontSize: '0.85rem',
      color: '#666',
      borderBottom: '1px solid #e0e0e0',
    },
  };

  return (
    <div style={styles.container}>
      <button style={styles.button} onClick={() => setShowMenu(!showMenu)}>
        👤 {userEmail?.split('@')[0] || 'User'}
      </button>
      {showMenu && (
        <div style={styles.menu}>
          <div style={styles.email}>{userEmail}</div>
          <button
            style={styles.menuItem}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}
