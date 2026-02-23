'use client';

import { useEffect } from 'react';
import { loadSavedTheme, applyPresetTheme, THEME_PRESETS } from '../lib/theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // First try to load preset theme
    const savedPreset = localStorage.getItem('docpod-theme-preset');
    if (savedPreset && THEME_PRESETS[savedPreset]) {
      applyPresetTheme(savedPreset as keyof typeof THEME_PRESETS);
    } else {
      // Fallback to custom color
      loadSavedTheme();
    }
  }, []);

  return <>{children}</>;
};
