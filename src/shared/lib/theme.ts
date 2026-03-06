/**
 * Theme Manager
 * Handles dynamic theme color changes across the application
 */

export type ThemeColor = {
  primary: string;
  name: string;
  overrides?: Record<string, string>;
};

export const THEME_PRESETS: Record<string, ThemeColor> = {
  ivoryOnyx: {
    primary: '#a47148',
    name: 'Ivory Onyx Luxury',
    overrides: {
      '--secondary-color': '#3b556d',
      '--accent-color': '#3b556d',
      '--primary-hover': '#b7865f',
      '--primary-light': '#f3e6db',
      '--primary-lighter': '#faf3ed',
      '--primary-pale': '#eedbcc',
      '--bg-primary': '#f8f6f2',
      '--bg-gradient-start': '#fcfbf8',
      '--bg-gradient-mid': '#f8f4ee',
      '--bg-gradient-end': '#efe8de',
      '--bg-white': '#ffffff',
      '--bg-card': 'rgba(255, 255, 255, 0.9)',
      '--bg-hover': '#f6f2ec',
      '--bg-subtle': '#f3eee8',
      '--bg-satin-overlay': 'rgba(255, 255, 255, 0.72)',
      '--border-primary': '#e4d8ca',
      '--border-secondary': '#ddd0c2',
      '--border-light': '#e9dfd4',
      '--border-lighter': '#efe5db',
      '--border-accent': '#d5c4b2',
      '--text-primary': '#121212',
      '--text-secondary': '#2e2a27',
      '--text-muted': '#6b625a',
      '--text-light': '#8a8077',
      '--text-lighter': '#a2978e',
      '--tone-peach': '#f4e7da',
      '--tone-sage': '#e6eef1',
      '--tone-sand': '#efe7dd',
      '--ui-header-bg': '#e9dfd4',
      '--ui-divider': '#d8caba',
      '--ui-input-border': '#ddcfc2',
      '--ui-badge-bg': '#f1e3d6',
      '--ui-chip-bg': '#eee3db',
      '--ui-hover-light': '#f8f3ed',
      '--ui-active-bg': '#f0e5da',
      '--ui-active-border': '#d7c6b5',
      '--ui-placeholder-bg': '#f1e6db',
      '--ui-dashed-border': '#c9b29c',
      '--ui-panel-bg': '#fdfaf7',
      '--ui-subtle-bg': '#f7f1ea',
      '--ui-gradient-light': '#c8a07f',
      '--ui-focus-border': '#a47148',
      '--ui-overlay-bg': '#f2eae1',
      '--ui-muted-bg': '#f5ede4',
      '--ui-neutral-bg': '#ddd0c4',
      '--accent-danger': '#b94a48',
      '--accent-danger-bg': '#fff1f0',
      '--accent-warning': '#a9784b',
      '--accent-warning-bg': '#faefe3',
      '--accent-info': '#3b556d',
      '--scrollbar-track': '#f1ebe2',
      '--scrollbar-thumb': '#d9c8b8',
      '--scrollbar-thumb-hover': '#c5ac96',
      '--background': '#f8f6f2',
      '--foreground': '#121212',
    },
  },
  peach: {
    primary: '#f38a73',
    name: 'Peach Sunset',
  },
  lavender: {
    primary: '#a78bfa',
    name: 'Lavender Dream',
  },
  mint: {
    primary: '#6ee7b7',
    name: 'Mint Fresh',
  },
  coral: {
    primary: '#fb7185',
    name: 'Coral Rose',
  },
  sky: {
    primary: '#0ea5e9',
    name: 'Sky Blue',
  },
  amber: {
    primary: '#fbbf24',
    name: 'Amber Glow',
  },
};

/**
 * Convert hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Adjust color brightness
 */
function adjustColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const adjust = (value: number) => {
    const adjusted = Math.round(value + (255 - value) * (percent / 100));
    return Math.min(255, Math.max(0, adjusted));
  };

  const r = adjust(rgb.r);
  const g = adjust(rgb.g);
  const b = adjust(rgb.b);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Generate color variations from a primary color
 */
function generateColorVariations(primaryColor: string) {
  const bgPrimary = adjustColor(primaryColor, 85);
  
  return {
    primary: primaryColor,
    primaryHover: adjustColor(primaryColor, 10),
    primaryLight: adjustColor(primaryColor, 60),
    primaryLighter: adjustColor(primaryColor, 75),
    primaryPale: adjustColor(primaryColor, 65),
    bgPrimary: bgPrimary,
    bgGradientStart: bgPrimary,
    bgGradientMid: adjustColor(primaryColor, 92),
    bgGradientEnd: '#ffffff',
    bgHover: adjustColor(primaryColor, 95),
    bgSubtle: adjustColor(primaryColor, 93),
    borderPrimary: adjustColor(primaryColor, 50),
    borderSecondary: adjustColor(primaryColor, 52),
    borderLight: adjustColor(primaryColor, 70),
    borderLighter: adjustColor(primaryColor, 68),
    borderAccent: adjustColor(primaryColor, 71),
    scrollbarTrack: adjustColor(primaryColor, 93),
    scrollbarThumb: adjustColor(primaryColor, 70),
    scrollbarThumbHover: adjustColor(primaryColor, 45),
    
    // UI specific colors
    uiHeaderBg: adjustColor(primaryColor, 48),
    uiDivider: adjustColor(primaryColor, 62),
    uiInputBorder: adjustColor(primaryColor, 54),
    uiBadgeBg: adjustColor(primaryColor, 78),
    uiChipBg: adjustColor(primaryColor, 66),
    uiHoverLight: adjustColor(primaryColor, 93),
    uiActiveBg: adjustColor(primaryColor, 63),
    uiActiveBorder: adjustColor(primaryColor, 57),
    uiPlaceholderBg: adjustColor(primaryColor, 64),
    uiDashedBorder: adjustColor(primaryColor, 56),
    uiPanelBg: adjustColor(primaryColor, 96),
    uiSubtleBg: adjustColor(primaryColor, 88),
    uiGradientLight: adjustColor(primaryColor, 20),
    uiFocusBorder: adjustColor(primaryColor, 35),
  };
}

/**
 * Apply theme to the document
 */
export function applyTheme(primaryColor: string, overrides?: Record<string, string>) {
  const colors = generateColorVariations(primaryColor);
  const root = document.documentElement;

  // Primary colors
  root.style.setProperty('--primary-color', colors.primary);
  root.style.setProperty('--primary-hover', colors.primaryHover);
  root.style.setProperty('--primary-light', colors.primaryLight);
  root.style.setProperty('--primary-lighter', colors.primaryLighter);
  root.style.setProperty('--primary-pale', colors.primaryPale);
  
  // Background colors
  root.style.setProperty('--bg-primary', colors.bgPrimary);
  root.style.setProperty('--bg-gradient-start', colors.bgGradientStart);
  root.style.setProperty('--bg-gradient-mid', colors.bgGradientMid);
  root.style.setProperty('--bg-gradient-end', colors.bgGradientEnd);
  root.style.setProperty('--bg-hover', colors.bgHover);
  root.style.setProperty('--bg-subtle', colors.bgSubtle);
  
  // Border colors
  root.style.setProperty('--border-primary', colors.borderPrimary);
  root.style.setProperty('--border-secondary', colors.borderSecondary);
  root.style.setProperty('--border-light', colors.borderLight);
  root.style.setProperty('--border-lighter', colors.borderLighter);
  root.style.setProperty('--border-accent', colors.borderAccent);
  
  // Scrollbar colors
  root.style.setProperty('--scrollbar-track', colors.scrollbarTrack);
  root.style.setProperty('--scrollbar-thumb', colors.scrollbarThumb);
  root.style.setProperty('--scrollbar-thumb-hover', colors.scrollbarThumbHover);
  
  // UI specific colors
  root.style.setProperty('--ui-header-bg', colors.uiHeaderBg);
  root.style.setProperty('--ui-divider', colors.uiDivider);
  root.style.setProperty('--ui-input-border', colors.uiInputBorder);
  root.style.setProperty('--ui-badge-bg', colors.uiBadgeBg);
  root.style.setProperty('--ui-chip-bg', colors.uiChipBg);
  root.style.setProperty('--ui-hover-light', colors.uiHoverLight);
  root.style.setProperty('--ui-active-bg', colors.uiActiveBg);
  root.style.setProperty('--ui-active-border', colors.uiActiveBorder);
  root.style.setProperty('--ui-placeholder-bg', colors.uiPlaceholderBg);
  root.style.setProperty('--ui-dashed-border', colors.uiDashedBorder);
  root.style.setProperty('--ui-panel-bg', colors.uiPanelBg);
  root.style.setProperty('--ui-subtle-bg', colors.uiSubtleBg);
  root.style.setProperty('--ui-gradient-light', colors.uiGradientLight);
  root.style.setProperty('--ui-focus-border', colors.uiFocusBorder);

  // Update shadow colors (use RGB for alpha channel)
  const rgb = hexToRgb(colors.primary);
  if (rgb) {
    root.style.setProperty(
      '--shadow-primary',
      `0 10px 16px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`
    );
    root.style.setProperty(
      '--shadow-primary-hover',
      `0 14px 22px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`
    );
    root.style.setProperty(
      '--shadow-primary-sm',
      `0 2px 8px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`
    );
    root.style.setProperty(
      '--shadow-primary-md',
      `0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`
    );
    root.style.setProperty(
      '--shadow-primary-lg',
      `0 8px 16px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`
    );
    root.style.setProperty(
      '--shadow-primary-subtle',
      `0 8px 16px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`
    );
    root.style.setProperty(
      '--shadow-primary-focus',
      `0 0 0 3px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`
    );
    root.style.setProperty(
      '--shadow-primary-focus-lg',
      `0 0 0 4px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
    );
    root.style.setProperty(
      '--shadow-button',
      `0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`
    );
  }

  if (overrides) {
    Object.entries(overrides).forEach(([cssVar, value]) => {
      root.style.setProperty(cssVar, value);
    });
  }

  // Save to localStorage
  localStorage.setItem('docpod-theme-color', primaryColor);
}

/**
 * Load theme from localStorage
 */
export function loadSavedTheme() {
  if (typeof window === 'undefined') return;
  
  const savedColor = localStorage.getItem('docpod-theme-color');
  if (savedColor) {
    applyTheme(savedColor);
  }
}

/**
 * Apply preset theme
 */
export function applyPresetTheme(presetKey: keyof typeof THEME_PRESETS) {
  const preset = THEME_PRESETS.sky ?? THEME_PRESETS[presetKey];
  if (preset) {
    applyTheme(preset.primary, preset.overrides);
    localStorage.setItem('docpod-theme-preset', 'sky');
  }
}
