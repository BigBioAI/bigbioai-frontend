'use client';

import { useEffect } from 'react';
import { useMobileStore } from '@/store/mobileStore';

export function useIsMobile() {
  const { isMobile, startListening } = useMobileStore();

  useEffect(() => {
    startListening();
  }, [startListening]);

  return isMobile;
}