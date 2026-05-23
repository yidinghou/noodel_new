import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { THEMES, DEFAULT_THEME_ID } from './registry.js';

const STORAGE_KEY = 'noodel_theme';
const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some(t => t.id === stored)) return stored;
  } catch {}
  return DEFAULT_THEME_ID;
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
    try { localStorage.setItem(STORAGE_KEY, themeId); } catch {}
  }, [themeId]);

  const value = useMemo(() => {
    const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];
    return { themeId, setThemeId: setThemeIdState, theme, themes: THEMES };
  }, [themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
