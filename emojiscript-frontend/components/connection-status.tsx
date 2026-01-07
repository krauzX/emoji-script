"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";

export function ConnectionStatus() {
  const [status, setStatus] = useState<
    "connected" | "offline" | "backend-offline"
  >("connected");

  useEffect(() => {
    let isActive = true;

    const checkConnection = async () => {
      if (!isActive) return;

      if (!navigator.onLine) {
        setStatus("offline");
        return;
      }

      try {
        const response = await apiClient.healthCheck();
        if (isActive) {
          setStatus(
            response.status === "healthy" ? "connected" : "backend-offline"
          );
        }
      } catch (error) {
        if (isActive) {
          setStatus("backend-offline");
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    const handleOnline = () => {
      if (isActive) checkConnection();
    };
    const handleOffline = () => {
      if (isActive) setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isActive = false;
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const statusConfig = {
    connected: {
      label: "Connected",
      variant: "default" as const,
      icon: Wifi,
    },
    "backend-offline": {
      label: "Backend Offline",
      variant: "destructive" as const,
      icon: AlertCircle,
    },
    offline: {
      label: "Offline",
      variant: "secondary" as const,
      icon: WifiOff,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
