import { create } from 'zustand';
import { appConfigService } from '../services/app-config.service';

interface ConfigState {
  currencySign: string;
  loading: boolean;
  getConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  currencySign: '$', // Default fallback
  loading: false,
  getConfig: async () => {
    set({ loading: true });
    try {
      const config = await appConfigService.getConfig();
      set({ currencySign: config.currencySign });
    } catch (error) {
      console.error('Failed to load app config:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
