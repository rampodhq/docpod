"use client";

import { useRouter } from "next/navigation";
import { Building2, User, ArrowRight } from "lucide-react";
import styles from "./get-started.module.css";

export default function GetStartedPage() {
  const router = useRouter();

  const handleSelection = (type: "organization" | "personal") => {
    // Store the account type in sessionStorage to be used during signup
    sessionStorage.setItem("accountType", type);
    router.push("/signup");
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.logo}></div>
          <h1 className={styles.title}>
            Welcome to{" "} <br/>
            <span className={styles.logoText}>
              doc<span className={styles.logoAccent}>pod</span>
            </span>
          </h1>
          <p className={styles.subtitle}>
            Choose how you&apos;ll be using docpod
          </p>
        </div>

        <div className={styles.options}>
          <button
            onClick={() => handleSelection("organization")}
            className={styles.optionCard}
          >
            <div className={styles.optionIcon}>
              <Building2 size={32} />
            </div>
            <div className={styles.optionContent}>
              <h3 className={styles.optionTitle}>Organization</h3>
              <p className={styles.optionDescription}>
                For teams and businesses with multiple members
              </p>
              <ul className={styles.optionFeatures}>
                <li>Team collaboration</li>
                <li>Shared templates</li>
                <li>Centralized workspace</li>
                <li>Member management</li>
              </ul>
            </div>
            <div className={styles.optionArrow}>
              <ArrowRight size={20} />
            </div>
          </button>

          <button
            onClick={() => handleSelection("personal")}
            className={styles.optionCard}
          >
            <div className={styles.optionIcon}>
              <User size={32} />
            </div>
            <div className={styles.optionContent}>
              <h3 className={styles.optionTitle}>Personal</h3>
              <p className={styles.optionDescription}>
                For individual use and personal projects
              </p>
              <ul className={styles.optionFeatures}>
                <li>Private workspace</li>
                <li>Personal templates</li>
                <li>Your documents only</li>
                <li>Simple & focused</li>
              </ul>
            </div>
            <div className={styles.optionArrow}>
              <ArrowRight size={20} />
            </div>
          </button>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className={styles.footerLink}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
