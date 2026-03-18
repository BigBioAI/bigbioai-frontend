import { create } from 'zustand';

interface MobileState {
  isMobile: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export const useMobileStore = create<MobileState>((set, get) => {
  const checkDevice = () => {
    if (typeof window === 'undefined') {
      return;
    }
    set({ isMobile: window.innerWidth < 768 });
  };

  return {
    isMobile: false,
    isListening: false,
    startListening: () => {
      if (typeof window === 'undefined' || get().isListening) {
        return;
      }

      checkDevice();
      window.addEventListener('resize', checkDevice);
      set({ isListening: true });
    },
    stopListening: () => {
      if (typeof window === 'undefined' || !get().isListening) {
        return;
      }

      window.removeEventListener('resize', checkDevice);
      set({ isListening: false });
    },
  };
});
