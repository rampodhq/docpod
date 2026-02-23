"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Mail, Lock, User, Upload, AlertCircle, Loader2, Building2, ArrowLeft } from "lucide-react";
import { AccountType } from "@/types/auth.types";
import styles from "../login/auth.module.css";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Failed to create account";
};

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get account type from sessionStorage
    const type = sessionStorage.getItem("accountType") as AccountType;
    if (type) {
      setAccountType(type);
    } else {
      // If no account type is set, redirect to get-started
      router.push("/get-started");
    }
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (accountType === "organization" && !formData.organizationName.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        image: image || undefined,
        accountType,
        organizationName: accountType === "organization" ? formData.organizationName : undefined,
      });
      // Clear the account type from sessionStorage
      sessionStorage.removeItem("accountType");
      router.push("/");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <button
            type="button"
            onClick={() => router.push("/get-started")}
            className={styles.authBackButton}
          >
            <ArrowLeft size={20} />
          </button>
          {/* <div className={styles.authLogo}>
            <span className={styles.authLogoText}>
              doc<span className={styles.authLogoAccent}>pod</span>
            </span>
          </div> */}
          <div className={styles.authAccountType}>
            {accountType === "organization" ? (
              <>
                <Building2 size={20} />
                <span>Organization Account</span>
              </>
            ) : (
              <>
                <User size={20} />
                <span>Personal Account</span>
              </>
            )}
          </div>
          <h1 className={styles.authTitle}>Create your account</h1>
          <p className={styles.authSubtitle}>
            {accountType === "organization" 
              ? "Set up your organization workspace"
              : "Join docpod and start creating documents"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && (
            <div className={styles.authError}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Profile Image Upload */}
          <div className={styles.authImageUpload}>
            <input
              type="file"
              id="profile-image"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
              disabled={isLoading}
            />
            <label htmlFor="profile-image" className={styles.authImageLabel}>
              {imagePreview ? (
                <img src={imagePreview} alt="Profile preview" className={styles.authImagePreview} />
              ) : (
                <div className={styles.authImagePlaceholder}>
                  <Upload size={24} />
                  <span>Upload Photo</span>
                </div>
              )}
            </label>
          </div>

          <div className={styles.authField}>
            <label className={styles.authLabel}>
              <User size={16} />
              Full Name
            </label>
            <input
              type="text"
              className={styles.authInput}
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          {accountType === "organization" && (
            <div className={styles.authField}>
              <label className={styles.authLabel}>
                <Building2 size={16} />
                Organization Name
              </label>
              <input
                type="text"
                className={styles.authInput}
                placeholder="Acme Corporation"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                required
                disabled={isLoading}
              />
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
              placeholder="Create a password (min. 8 characters)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.authField}>
            <label className={styles.authLabel}>
              <Lock size={16} />
              Confirm Password
            </label>
            <input
              type="password"
              className={styles.authInput}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className={styles.authButton} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className={styles.authSpinner} />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className={styles.authFooter}>
          <span className={styles.authFooterText}>Already have an account?</span>
          <Link href="/login" className={styles.authFooterLink}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
