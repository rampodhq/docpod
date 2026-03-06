"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const publicRoutes = ["/login", "/signup", "/get-started"];

const isPublicRoute = (pathname: string): boolean => {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return publicRoutes.some((route) => normalized === route || normalized.endsWith(route));
};

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isRoutePublic = isPublicRoute(pathname);

    if (!isAuthenticated && !isRoutePublic) {
      router.push("/get-started");
    } else if (isAuthenticated && isRoutePublic) {
      router.push("/");
    }
  }, [isAuthenticated, pathname, router]);

  const isRoutePublic = isPublicRoute(pathname);

  // Show loading state while checking auth
  if (!isAuthenticated && !isRoutePublic) {
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
