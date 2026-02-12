import styles from './settings.module.css';

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <button className={styles.resetButton} type="button">
            🗑️ Reset App Data
          </button>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHeader}>My Templates</div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Default Tone</span>
            <select className={styles.select} defaultValue="Professional">
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Conversational">Conversational</option>
            </select>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Default Theme</span>
            <div className={styles.radioGroup}>
              <div className={styles.radioOption}>
                <span className={`${styles.radio} ${styles.radioActive}`} />
                Executive
              </div>
              <div className={styles.radioOption}>
                <span className={styles.radio} />
                Minimal
              </div>
              <div className={styles.radioOption}>
                <span className={styles.radio} />
                Academic
              </div>
            </div>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Default Export Format</span>
            <select className={styles.select} defaultValue="DOCX">
              <option value="DOCX">DOCX</option>
              <option value="PDF">PDF</option>
              <option value="TXT">TXT</option>
            </select>
          </div>
          <div className={styles.saveWrap}>
            <button className={styles.saveButton} type="button">
              Save Settings
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
