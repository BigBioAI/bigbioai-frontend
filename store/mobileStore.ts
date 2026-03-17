import { create } from 'zustand';

interface MobileState {
  isMobile: boolean;
  isListening: boolean;
  startListening: () => void;
}

export const useMobileStore = create<MobileState>((set, get) => ({
  isMobile: false,
  isListening: false,
  startListening: () => {
    if (typeof window === 'undefined' || get().isListening) {
      return;
    }

    const checkDevice = () => {
      set({ isMobile: window.innerWidth < 768 });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    set({ isListening: true });
  },
}));
