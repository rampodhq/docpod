import type { ReactNode } from 'react';
import styles from './builder.module.css';

interface BuilderShellProps {
  sidebar: ReactNode;
  main: ReactNode;
  preview: ReactNode;
}

export const BuilderShell = ({ sidebar, main, preview }: BuilderShellProps) => {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <aside className={styles.sidebar}>{sidebar}</aside>
        <section className={styles.main}>{main}</section>
        <aside className={styles.previewPanel}>{preview}</aside>
      </div>
    </div>
  );
}
