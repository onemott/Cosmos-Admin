"use client";

import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, LANGUAGES, Language } from "@/contexts/language-context";

interface LanguageSelectorProps {
  variant?: "dropdown" | "full";
  className?: string;
}

export function LanguageSelector({ variant = "dropdown", className }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const currentLanguage = LANGUAGES.find((l) => l.code === language);

  if (variant === "full") {
    // Full variant for Settings page
    return (
      <div className={className}>
        <div className="grid gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                language === lang.code
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getLanguageFlag(lang.code)}</span>
                <div className="text-left">
                  <div className="font-medium">{lang.nativeName}</div>
                  <div className="text-sm text-muted-foreground">{lang.name}</div>
                </div>
              </div>
              {language === lang.code && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Dropdown variant for Header
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Languages className="h-5 w-5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span>{getLanguageFlag(lang.code)}</span>
              <span>{lang.nativeName}</span>
            </div>
            {language === lang.code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getLanguageFlag(code: Language): string {
  switch (code) {
    case "en":
      return "🇺🇸";
    case "zh-CN":
      return "🇨🇳";
    default:
      return "🌐";
  }
}

