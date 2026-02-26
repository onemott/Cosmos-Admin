import { useCallback } from "react";
import { useLanguage, Language } from "@/contexts/language-context";
import en from "./translations/en.json";
import zhCN from "./translations/zh-CN.json";

// Type-safe translations
type TranslationKeys = typeof en;

const translations: Record<Language, TranslationKeys> = {
  en,
  "zh-CN": zhCN as unknown as TranslationKeys,
};

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue(obj, "sidebar.dashboard") returns obj.sidebar.dashboard
 */
function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      console.warn(`Translation key not found: ${path} (missing segment: ${key})`);
      return path; // Return the key itself if not found
    }
  }

  return typeof current === "string" ? current : path;
}

/**
 * Hook to get translation function
 */
export function useTranslation() {
  const { language } = useLanguage();

  /**
   * Translate a key to the current language
   * @param key - Dot-notation key (e.g., "sidebar.dashboard")
   * @param params - Optional parameters for interpolation
   */
  function t(key: string, params?: Record<string, string | number>): string {
    const translation = getNestedValue(translations[language], key);

    if (params) {
      return Object.entries(params).reduce(
        (acc, [paramKey, value]) =>
          acc.replace(new RegExp(`{{${paramKey}}}`, "g"), String(value)),
        translation
      );
    }

    return translation;
  }

  return { t, language };
}

/**
 * Get localized field from an object that has both English and Chinese versions
 * e.g., getLocalizedField(module, "name", "zh-CN") returns module.name_zh || module.name
 */
export function getLocalizedField(
  obj: Record<string, unknown> | null | undefined,
  fieldName: string,
  language: Language
): string {
  if (!obj) return "";

  const record = obj as Record<string, unknown>;
  
  if (language === "zh-CN") {
    const zhField = `${fieldName}_zh`;
    const zhValue = record[zhField];
    if (zhValue && typeof zhValue === "string") {
      return zhValue;
    }
  }

  const value = record[fieldName];
  return typeof value === "string" ? value : "";
}

/**
 * Hook to get localized field helper bound to current language
 */
export function useLocalizedField() {
  const { language } = useLanguage();

  return useCallback(
    (obj: Record<string, unknown> | null | undefined, fieldName: string): string => {
      return getLocalizedField(obj, fieldName, language);
    },
    [language]
  );
}

/**
 * Format dates according to the current language
 */
export function useLocalizedDate() {
  const { language } = useLanguage();

  return {
    formatDate: (dateString: string) => {
      const locale = language === "zh-CN" ? "zh-CN" : "en-US";
      return new Date(dateString).toLocaleDateString(locale, {
        year: "numeric",
        month: language === "zh-CN" ? "numeric" : "short",
        day: "numeric",
      });
    },
    formatDateTime: (dateString: string) => {
      const locale = language === "zh-CN" ? "zh-CN" : "en-US";
      return new Date(dateString).toLocaleString(locale, {
        year: "numeric",
        month: language === "zh-CN" ? "numeric" : "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  };
}

