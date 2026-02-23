"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut, Upload, Camera, X, Building2 } from "lucide-react";
import styles from "./ProfileMenu.module.css";

export const ProfileMenu = () => {
  const { user, logout, updateProfileImage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      try {
        await updateProfileImage(file);
      } catch (error) {
        console.error("Failed to update image:", error);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.profileMenuContainer} ref={menuRef}>
      <button className={styles.profileButton} onClick={() => setIsOpen(!isOpen)}>
        {user.image ? (
          <img src={user.image} alt={user.name} className={styles.profileImage} />
        ) : (
          <div className={styles.profileInitials}>{getInitials(user.name)}</div>
        )}
      </button>

      {isOpen && (
        <div className={styles.profileDropdown}>
          <div className={styles.profileDropdownHeader}>
            <div className={styles.profileDropdownAvatar}>
              {user.image ? (
                <img src={user.image} alt={user.name} className={styles.profileDropdownImage} />
              ) : (
                <div className={styles.profileDropdownInitials}>{getInitials(user.name)}</div>
              )}
              <button
                className={styles.profileImageChangeButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <div className={styles.profileSpinner} />
                ) : (
                  <Camera size={14} />
                )}
              </button>
            </div>
            <div className={styles.profileDropdownInfo}>
              <div className={styles.profileDropdownName}>{user.name}</div>
              {user.accountType === "organization" && user.organizationName && (
                <div className={styles.profileDropdownOrg}>
                  <Building2 size={12} />
                  <span>{user.organizationName}</span>
                </div>
              )}
              <div className={styles.profileDropdownEmail}>{user.email}</div>
            </div>
          </div>

          <div className={styles.profileDropdownDivider} />

          <div className={styles.profileDropdownSection}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
            <button
              className={styles.profileDropdownItem}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
            >
              <Upload size={16} />
              <span>{isUploadingImage ? "Uploading..." : "Change Photo"}</span>
            </button>
          </div>

          <div className={styles.profileDropdownDivider} />

          <div className={styles.profileDropdownSection}>
            <button className={styles.profileDropdownItem} onClick={logout}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
