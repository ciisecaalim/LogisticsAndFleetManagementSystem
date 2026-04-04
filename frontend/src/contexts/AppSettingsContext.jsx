import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'lfms_app_settings';

const COUNTRY_PRESETS = {
  Somalia: {
    layoutBg: '#64748B',
    surfaceBg: '#ffffff',
    sidebarFrom: '#1E293B',
    sidebarTo: '#64748B',
    timezone: 'EAT (UTC+3)',
    language: 'Somali'
  },
  Kenya: {
    layoutBg: '#64748B',
    surfaceBg: '#ffffff',
    sidebarFrom: '#1E293B',
    sidebarTo: '#64748B',
    timezone: 'EAT (UTC+3)',
    language: 'English'
  },
  Ethiopia: {
    layoutBg: '#64748B',
    surfaceBg: '#ffffff',
    sidebarFrom: '#1E293B',
    sidebarTo: '#64748B',
    timezone: 'EAT (UTC+3)',
    language: 'English'
  },
  UAE: {
    layoutBg: '#64748B',
    surfaceBg: '#ffffff',
    sidebarFrom: '#1E293B',
    sidebarTo: '#64748B',
    timezone: 'GST (UTC+4)',
    language: 'Arabic'
  },
  Global: {
    layoutBg: '#64748B',
    surfaceBg: '#ffffff',
    sidebarFrom: '#1E293B',
    sidebarTo: '#64748B',
    timezone: 'UTC',
    language: 'English'
  }
};

const ACCENT_PRESETS = {
  emerald: {
    accent: '#10B981',
    accentStrong: '#1E293B'
  },
  sky: {
    accent: '#64748B',
    accentStrong: '#1E293B'
  },
  amber: {
    accent: '#F59E0B',
    accentStrong: '#1E293B'
  },
  rose: {
    accent: '#F59E0B',
    accentStrong: '#64748B'
  }
};

const defaultSettings = {
  country: 'Somalia',
  themeMode: 'light',
  accentTone: 'emerald'
};

const AppSettingsContext = createContext();

function getSavedSettings() {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultSettings;
    }

    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

function buildTheme(settings) {
  const country = COUNTRY_PRESETS[settings.country] || COUNTRY_PRESETS.Somalia;
  const accent = ACCENT_PRESETS[settings.accentTone] || ACCENT_PRESETS.emerald;
  const darkMode = settings.themeMode === 'dark';

  return {
    country,
    accent,
    layoutBg: darkMode ? '#1E293B' : country.layoutBg,
    surfaceBg: darkMode ? '#1E293B' : country.surfaceBg,
    cardBg: darkMode ? '#64748B' : '#ffffff',
    textMain: darkMode ? '#e2e8f0' : '#1e293b',
    textMuted: darkMode ? '#64748B' : '#64748B',
    sidebarFrom: darkMode ? '#1E293B' : country.sidebarFrom,
    sidebarTo: darkMode ? '#64748B' : country.sidebarTo,
    topbarBg: darkMode ? '#1E293B' : '#ffffff'
  };
}

export function AppSettingsProvider({ children }) {
  const [appSettings, setAppSettings] = useState(getSavedSettings);

  const theme = useMemo(() => buildTheme(appSettings), [appSettings]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.style.setProperty('--app-accent', theme.accent.accent);
    root.style.setProperty('--app-accent-strong', theme.accent.accentStrong);
    root.style.setProperty('--app-layout-bg', theme.layoutBg);
    root.style.setProperty('--app-surface-bg', theme.surfaceBg);
    root.style.setProperty('--app-card-bg', theme.cardBg);
    root.style.setProperty('--app-text-main', theme.textMain);
    root.style.setProperty('--app-text-muted', theme.textMuted);
    root.style.setProperty('--app-sidebar-from', theme.sidebarFrom);
    root.style.setProperty('--app-sidebar-to', theme.sidebarTo);
    root.style.setProperty('--app-topbar-bg', theme.topbarBg);
  }, [theme]);

  const value = useMemo(
    () => ({
      appSettings,
      theme,
      setCountry: (country) => setAppSettings((prev) => ({ ...prev, country })),
      setThemeMode: (themeMode) => setAppSettings((prev) => ({ ...prev, themeMode })),
      setAccentTone: (accentTone) => setAppSettings((prev) => ({ ...prev, accentTone })),
      setAppSettings
    }),
    [appSettings, theme]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
}

export function getCountryDefaults(country) {
  return COUNTRY_PRESETS[country] || COUNTRY_PRESETS.Somalia;
}
