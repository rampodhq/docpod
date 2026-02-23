"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProfileMenu } from './ProfileMenu';
import styles from './Navigation.module.css';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/templates', label: 'Templates' },
  { href: '/documents', label: 'Documents' },
  { href: '/settings', label: 'Settings' },
];

export const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <span className={styles.brandText}>
          doc<span className={styles.brandAccent}>pod</span>
        </span>
      </div>
      <div className={styles.links}>
        {navLinks.map((link) => {
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className={styles.navActions}>
        <ProfileMenu />
      </div>
    </nav>
  );
}
