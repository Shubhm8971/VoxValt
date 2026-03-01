'use client';

import { useWindowSize, breakpoints } from '@/lib/use-responsive';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
  danger?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDeleting = false,
  danger = true,
}: ConfirmDeleteModalProps) {
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < breakpoints.tablet;

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '1rem',
      padding: isMobile ? '1.5rem' : '2rem',
      maxWidth: '400px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    heading: {
      fontSize: isMobile ? '1.2rem' : '1.3rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: danger ? '#dc2626' : '#333',
    },
    message: {
      fontSize: '0.95rem',
      color: '#666',
      marginBottom: '1.5rem',
      lineHeight: 1.5,
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
    },
    button: {
      flex: 1,
      padding: '0.75rem 1rem',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minHeight: '44px',
    },
    cancelButton: {
      backgroundColor: '#e0e0e0',
      color: '#333',
    },
    deleteButton: {
      backgroundColor: '#ef4444',
      color: 'white',
    },
    deleteButtonDisabled: {
      backgroundColor: '#fca5a5',
      cursor: 'not-allowed',
      opacity: 0.7,
    },
  };

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.heading}>⚠️ {title}</h2>
        <p style={styles.message}>{message}</p>

        <div style={styles.buttonGroup}>
          <button
            onClick={onCancel}
            style={{ ...styles.button, ...styles.cancelButton }}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...styles.button,
              ...styles.deleteButton,
              ...(isDeleting ? styles.deleteButtonDisabled : {}),
            }}
            disabled={isDeleting}
          >
            {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
