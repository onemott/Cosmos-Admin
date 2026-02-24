"use client";

import { useIsPlatformLevel } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function TenantOnly({ children }: { children: React.ReactNode }) {
  const isPlatformLevel = useIsPlatformLevel();
  const router = useRouter();

  useEffect(() => {
    if (isPlatformLevel) {
      router.push("/dashboard");
    }
  }, [isPlatformLevel, router]);

  if (isPlatformLevel) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
