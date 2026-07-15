"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "ib-theme";

/**
 * Script inline para evitar "flash" do tema errado: corre antes da
 * hidratação do React e aplica a classe `.light` no <html> logo que o
 * primeiro byte de CSS chega, lendo a preferência guardada.
 */
export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem("${STORAGE_KEY}");
    var theme = stored === "light" || stored === "dark" ? stored : "dark";
    if (theme === "light") document.documentElement.classList.add("light");
  } catch (e) {}
})();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") setThemeState(stored);
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle("light", next === "light");
    window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  const setTheme = useCallback((next: Theme) => applyTheme(next), [applyTheme]);
  const toggleTheme = useCallback(() => applyTheme(theme === "dark" ? "light" : "dark"), [applyTheme, theme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de <ThemeProvider>");
  return ctx;
}
