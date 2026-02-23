"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const publicRoutes = ["/login", "/signup", "/get-started"];

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.push("/get-started");
    } else if (isAuthenticated && isPublicRoute) {
      router.push("/");
    }
  }, [isAuthenticated, pathname, router]);

  const isPublicRoute = publicRoutes.includes(pathname);

  // Show loading state while checking auth
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: "12px",
          color: "var(--text-muted)",
        }}
      >
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <span>Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
};
