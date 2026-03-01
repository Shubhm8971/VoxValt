import { useEffect, useState } from 'react';

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

export const breakpoints = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
};

export function isMobileDevice() {
  return typeof window !== 'undefined' && window.innerWidth < breakpoints.tablet;
}

export function isTabletDevice() {
  return (
    typeof window !== 'undefined' &&
    window.innerWidth >= breakpoints.tablet &&
    window.innerWidth < breakpoints.desktop
  );
}
