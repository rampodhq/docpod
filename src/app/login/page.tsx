"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import styles from "./auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authLogo}>
            <span className={styles.authLogoText}>
              doc<span className={styles.authLogoAccent}>pod</span>
            </span>
          </div>
          <h1 className={styles.authTitle}>Welcome back</h1>
          <p className={styles.authSubtitle}>Sign in to continue to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && (
            <div className={styles.authError}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.authField}>
            <label className={styles.authLabel}>
              <Mail size={16} />
              Email
            </label>
            <input
              type="email"
              className={styles.authInput}
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.authField}>
            <label className={styles.authLabel}>
              <Lock size={16} />
              Password
            </label>
            <input
              type="password"
              className={styles.authInput}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className={styles.authButton} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className={styles.authSpinner} />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className={styles.authFooter}>
          <span className={styles.authFooterText}>Don't have an account?</span>
          <Link href="/get-started" className={styles.authFooterLink}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
