'use client';

import { useEffect } from 'react';
import { applyPresetTheme } from '../lib/theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Force a single global theme across the app.
    applyPresetTheme('sky');
    localStorage.setItem('docpod-theme-preset', 'sky');
    localStorage.setItem('docpod-theme-color', '#0ea5e9');
  }, []);

  return <>{children}</>;
};
