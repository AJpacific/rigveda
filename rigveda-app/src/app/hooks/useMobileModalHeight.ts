'use client';

import { useState, useEffect } from 'react';

interface MobileModalHeightOptions {
  defaultHeight?: string;
  mobileHeight?: string;
  audioBarHeight?: number;
  minHeight?: string;
}

export function useMobileModalHeight(options: MobileModalHeightOptions = {}) {
  const {
    defaultHeight = '80vh',
    mobileHeight = '75vh',
    audioBarHeight = 80, // Approximate height of audio bar in pixels
    minHeight = '50vh'
  } = options;

  const [modalHeight, setModalHeight] = useState(defaultHeight);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateModalHeight = () => {
      const viewportHeight = window.innerHeight;
      const isMobileScreen = window.innerWidth < 768; // sm breakpoint
      setIsMobile(isMobileScreen);

      if (isMobileScreen) {
        // Calculate available height considering audio bar
        const availableHeight = viewportHeight - audioBarHeight;
        const availableVh = (availableHeight / viewportHeight) * 100;
        
        // Use the smaller of: mobileHeight, availableVh, or ensure minimum height
        const mobileVh = parseFloat(mobileHeight);
        const minVh = parseFloat(minHeight);
        
        const finalHeight = Math.max(
          Math.min(mobileVh, availableVh),
          minVh
        );
        
        setModalHeight(`${finalHeight}vh`);
      } else {
        setModalHeight(defaultHeight);
      }
    };

    // Initial calculation
    updateModalHeight();

    // Update on resize
    window.addEventListener('resize', updateModalHeight);
    
    return () => {
      window.removeEventListener('resize', updateModalHeight);
    };
  }, [defaultHeight, mobileHeight, audioBarHeight, minHeight]);

  return {
    modalHeight,
    isMobile,
    style: { maxHeight: modalHeight }
  };
}
