'use client';

// Mobile-first responsive styles helper
export const useResponsiveStyles = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return {
    isMobile,
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: isMobile ? '1rem' : '2rem',
    },
    header: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isMobile ? '1rem' : '2rem',
      paddingTop: isMobile ? '0.5rem' : '1rem',
      flexWrap: 'wrap' as const,
      gap: isMobile ? '1rem' : '0',
    },
    titleSection: {
      flex: 1,
      minWidth: isMobile ? '100%' : 'auto',
    },
    emoji: {
      fontSize: isMobile ? '1.5rem' : '2rem',
      marginRight: '0.5rem',
    },
    heading: {
      fontSize: isMobile ? '1.5rem' : '2rem',
      marginBottom: '0.25rem',
      color: 'white',
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: isMobile ? '0.8rem' : '0.9rem',
      color: 'rgba(255, 255, 255, 0.8)',
    },
    mainHeader: {
      maxWidth: '1200px',
      margin: '0 auto',
      textAlign: 'center' as const,
      color: 'white',
      marginBottom: isMobile ? '1rem' : '2rem',
    },
    mainEmoji: {
      fontSize: isMobile ? '3rem' : '4rem',
      marginBottom: isMobile ? '0.5rem' : '1rem',
    },
    mainHeading: {
      fontSize: isMobile ? '2rem' : '3rem',
      marginBottom: '0.5rem',
      fontWeight: 'bold',
    },
    mainSubtitle: {
      fontSize: isMobile ? '1rem' : '1.2rem',
      marginBottom: '0.5rem',
      opacity: 0.9,
    },
    mainDescription: {
      fontSize: isMobile ? '0.9rem' : '1rem',
      opacity: 0.8,
      marginBottom: isMobile ? '1rem' : '2rem',
    },
    buttonGroup: {
      display: 'flex',
      gap: isMobile ? '0.5rem' : '1rem',
      justifyContent: 'center',
      marginBottom: isMobile ? '1rem' : '2rem',
      flexWrap: 'wrap' as const,
    },
    button: {
      padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 2rem',
      fontSize: isMobile ? '0.9rem' : '1rem',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.3s ease',
      minHeight: isMobile ? '44px' : 'auto', // Touch-friendly size
      minWidth: isMobile ? '44px' : 'auto',
    },
    activeButton: {
      backgroundColor: '#fff',
      color: '#667eea',
    },
    inactiveButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '0' : '0 1rem',
    },
    footer: {
      textAlign: 'center' as const,
      color: 'rgba(255, 255, 255, 0.7)',
      marginTop: isMobile ? '2rem' : '3rem',
      fontSize: isMobile ? '0.8rem' : '0.9rem',
    },
  };
};
