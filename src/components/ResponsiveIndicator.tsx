// src/components/ResponsiveIndicator.tsx
import React, { useEffect, useState } from 'react';

export function ResponsiveIndicator() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function updateSize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }

    window.addEventListener('resize', updateSize);
    updateSize();

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getBreakpoint = () => {
    if (windowSize.width >= 1280) return 'xl';
    if (windowSize.width >= 1024) return 'lg';
    if (windowSize.width >= 768) return 'md';
    if (windowSize.width >= 640) return 'sm';
    return 'xs';
  };

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/75 text-white px-3 py-2 rounded-lg text-xs font-mono z-50">
      <div>Width: {windowSize.width}px</div>
      <div>Breakpoint: {getBreakpoint()}</div>
    </div>
  );
}

export default ResponsiveIndicator;
