import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const languageResources = {
  English: {
    code: 'en',
    languageLabel: 'Eng (US)',
    searchPlaceholder: 'Search',
    adminTitle: 'Admin Profile',
    adminSubtitle: 'Admin User',
    notificationLabel: 'Notifications',
    languageMenu: 'Language'
  },
  Somali: {
    code: 'so',
    languageLabel: 'Somali',
    searchPlaceholder: 'Raadi',
    adminTitle: 'Astaanta Maamulaha',
    adminSubtitle: 'Adeegsade Maamul',
    notificationLabel: 'Ogeysiisyo',
    languageMenu: 'Luqad'
  },
  Arabic: {
    code: 'ar',
    languageLabel: 'عربى',
    searchPlaceholder: 'بحث',
    adminTitle: 'ملف المسؤول',
    adminSubtitle: 'مسؤول',
    notificationLabel: 'الإشعارات',
    languageMenu: 'اللغة'
  }
};

const defaultLanguage = 'English';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultLanguage;
    }
    return window.localStorage.getItem('appLanguage') || defaultLanguage;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('appLanguage', language);
  }, [language]);

  const resources = languageResources[language] ?? languageResources[defaultLanguage];

  const value = useMemo(() => ({ language, setLanguage, resources }), [language, resources]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
