"use client";

import { ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface UserDataTooltipProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps user-entered database fields (like client names, account names, user names)
 * with a tooltip indicating this is original user data that is not translated.
 */
export function UserDataTooltip({ children, className }: UserDataTooltipProps) {
  const { t } = useTranslation();

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>{children}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("userDataTooltip.message")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
