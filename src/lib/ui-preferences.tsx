import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "hi";

type PreferencesContextValue = {
  language: Language;
  setLanguage: (value: Language) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function UIPreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [highContrast, setHighContrastState] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("civix-language");
    const savedContrast = localStorage.getItem("civix-high-contrast");
    if (savedLang === "en" || savedLang === "hi") {
      setLanguageState(savedLang);
    }
    if (savedContrast === "1") {
      setHighContrastState(true);
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  const setLanguage = (value: Language) => {
    setLanguageState(value);
    localStorage.setItem("civix-language", value);
  };

  const setHighContrast = (value: boolean) => {
    setHighContrastState(value);
    localStorage.setItem("civix-high-contrast", value ? "1" : "0");
    document.documentElement.classList.toggle("high-contrast", value);
  };

  const contextValue = useMemo(
    () => ({ language, setLanguage, highContrast, setHighContrast }),
    [language, highContrast]
  );

  return <PreferencesContext.Provider value={contextValue}>{children}</PreferencesContext.Provider>;
}

export function useUIPreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("useUIPreferences must be used within UIPreferencesProvider");
  }
  return ctx;
}
