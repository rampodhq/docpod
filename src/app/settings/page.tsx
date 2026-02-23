'use client';

import { useState, useEffect } from 'react';
import styles from './settings.module.css';
import { THEME_PRESETS, applyPresetTheme } from '@/shared/lib/theme';


export default function SettingsPage() {
  const [tone, setTone] = useState('Professional');
  const [theme, setTheme] = useState('Executive');
  const [exportFormat, setExportFormat] = useState('DOCX');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('peach');

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('docpod-theme-preset');
    if (savedTheme && THEME_PRESETS[savedTheme]) {
      setSelectedTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (themeKey: string) => {
    setSelectedTheme(themeKey);
    applyPresetTheme(themeKey as keyof typeof THEME_PRESETS);
    localStorage.setItem('docpod-theme-preset', themeKey);
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate save operation
    setTimeout(() => {
      setIsSaving(false);
      // Show success feedback
    }, 1000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all app data? This action cannot be undone.')) {
      // Reset logic here
      console.log('Resetting app data...');
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>Customize your document creation experience</p>
          </div>
          <button className={styles.resetButton} type="button" onClick={handleReset}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M4 14C4 14.55 4.45 15 5 15H11C11.55 15 12 14.55 12 14V4H4V14ZM13 2H10.5L9.5 1H6.5L5.5 2H3V3.5H13V2Z" fill="currentColor"/>
            </svg>
            <span>Reset App Data</span>
          </button>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={styles.headerIcon}>
              <path d="M15.95 10.78C15.98 10.53 16 10.27 16 10C16 9.73 15.98 9.47 15.95 9.22L17.63 7.9C17.78 7.78 17.82 7.56 17.73 7.39L16.13 4.62C16.04 4.45 15.82 4.39 15.65 4.45L13.66 5.24C13.24 4.91 12.78 4.63 12.28 4.41L11.98 2.3C11.96 2.11 11.8 2 11.6 2H8.4C8.2 2 8.04 2.11 8.02 2.3L7.72 4.41C7.22 4.63 6.76 4.91 6.34 5.24L4.35 4.45C4.18 4.39 3.96 4.45 3.87 4.62L2.27 7.39C2.18 7.56 2.22 7.78 2.37 7.9L4.05 9.22C4.02 9.47 4 9.73 4 10C4 10.27 4.02 10.53 4.05 10.78L2.37 12.1C2.22 12.22 2.18 12.44 2.27 12.61L3.87 15.38C3.96 15.55 4.18 15.61 4.35 15.55L6.34 14.76C6.76 15.09 7.22 15.37 7.72 15.59L8.02 17.7C8.04 17.89 8.2 18 8.4 18H11.6C11.8 18 11.96 17.89 11.98 17.7L12.28 15.59C12.78 15.37 13.24 15.09 13.66 14.76L15.65 15.55C15.82 15.61 16.04 15.55 16.13 15.38L17.73 12.61C17.82 12.44 17.78 12.22 17.63 12.1L15.95 10.78ZM10 13C8.35 13 7 11.65 7 10C7 8.35 8.35 7 10 7C11.65 7 13 8.35 13 10C13 11.65 11.65 13 10 13Z" fill="currentColor"/>
            </svg>
            <span>My Templates</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className={styles.labelIcon}>
                <path d="M2.5 15.8333C2.5 16.75 3.25 17.5 4.16667 17.5H15.8333C16.75 17.5 17.5 16.75 17.5 15.8333V7.5H2.5V15.8333ZM15.8333 3.33333H13.75L12.9167 2.5H7.08333L6.25 3.33333H4.16667V5.83333H15.8333V3.33333Z" fill="currentColor"/>
              </svg>
              Default Tone
            </span>
            <select 
              className={styles.select} 
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Conversational">Conversational</option>
            </select>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className={styles.labelIcon}>
                <path d="M16.6667 2.5H3.33333C2.41667 2.5 1.66667 3.25 1.66667 4.16667V15.8333C1.66667 16.75 2.41667 17.5 3.33333 17.5H16.6667C17.5833 17.5 18.3333 16.75 18.3333 15.8333V4.16667C18.3333 3.25 17.5833 2.5 16.6667 2.5ZM16.6667 15.8333H3.33333V4.16667H16.6667V15.8333Z" fill="currentColor"/>
              </svg>
              Default Theme
            </span>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="theme"
                  value="Executive"
                  checked={theme === 'Executive'}
                  onChange={(e) => setTheme(e.target.value)}
                  className={styles.radioInput}
                />
                <span className={`${styles.radio} ${theme === 'Executive' ? styles.radioActive : ''}`} />
                <span>Executive</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="theme"
                  value="Minimal"
                  checked={theme === 'Minimal'}
                  onChange={(e) => setTheme(e.target.value)}
                  className={styles.radioInput}
                />
                <span className={`${styles.radio} ${theme === 'Minimal' ? styles.radioActive : ''}`} />
                <span>Minimal</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="theme"
                  value="Academic"
                  checked={theme === 'Academic'}
                  onChange={(e) => setTheme(e.target.value)}
                  className={styles.radioInput}
                />
                <span className={`${styles.radio} ${theme === 'Academic' ? styles.radioActive : ''}`} />
                <span>Academic</span>
              </label>
            </div>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className={styles.labelIcon}>
                <path d="M14 11V14H2V11H0.5V14C0.5 14.825 1.175 15.5 2 15.5H14C14.825 15.5 15.5 14.825 15.5 14V11H14ZM13.25 6.5L12.1925 5.4425L8.75 8.8775V0.5H7.25V8.8775L3.8075 5.4425L2.75 6.5L8 11.75L13.25 6.5Z" fill="currentColor"/>
              </svg>
              Default Export Format
            </span>
            <select 
              className={styles.select} 
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="DOCX">DOCX</option>
              <option value="PDF">PDF</option>
              <option value="TXT">TXT</option>
            </select>
          </div>
          <div className={styles.saveWrap}>
            <button 
              className={`${styles.saveButton} ${isSaving ? styles.saveButtonLoading : ''}`}
              type="button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className={styles.spinner} width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 16C6.69 16 4 13.31 4 10C4 6.69 6.69 4 10 4C13.31 4 16 6.69 16 10C16 13.31 13.31 16 10 16Z" fill="currentColor" opacity="0.3"/>
                    <path d="M10 2C5.58 2 2 5.58 2 10H4C4 6.69 6.69 4 10 4V2Z" fill="currentColor"/>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M15.8333 5.34175L7.08333 14.0917L3.75 10.7584L2.575 11.9334L7.08333 16.4417L17.0083 6.51675L15.8333 5.34175Z" fill="currentColor"/>
                  </svg>
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={styles.headerIcon}>
              <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 16C6.69 16 4 13.31 4 10C4 6.69 6.69 4 10 4C13.31 4 16 6.69 16 10C16 13.31 13.31 16 10 16ZM14 10C14 12.21 12.21 14 10 14C7.79 14 6 12.21 6 10C6 7.79 7.79 6 10 6C12.21 6 14 7.79 14 10Z" fill="currentColor"/>
            </svg>
            <span>Theme Color</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className={styles.labelIcon}>
                <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 16C6.69 16 4 13.31 4 10C4 6.69 6.69 4 10 4C13.31 4 16 6.69 16 10C16 13.31 13.31 16 10 16Z" fill="currentColor"/>
              </svg>
              Primary Color
            </span>
            <div className={styles.themeColorGrid}>
              {Object.entries(THEME_PRESETS).map(([key, themePreset]) => (
                <button
                  key={key}
                  className={`${styles.themeColorOption} ${selectedTheme === key ? styles.themeColorActive : ''}`}
                  onClick={() => handleThemeChange(key)}
                  style={{ backgroundColor: themePreset.primary }}
                  title={themePreset.name}
                >
                  {selectedTheme === key && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M15.8333 5.34175L7.08333 14.0917L3.75 10.7584L2.575 11.9334L7.08333 16.4417L17.0083 6.51675L15.8333 5.34175Z" fill="white" stroke="white" strokeWidth="1"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.themePreview}>
            <div className={styles.previewLabel}>Selected: {THEME_PRESETS[selectedTheme as keyof typeof THEME_PRESETS]?.name}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
