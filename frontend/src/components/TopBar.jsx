import { useEffect, useState } from 'react';
import { Bell, ChevronDown, Globe, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const defaultLanguage = 'English';

const languageResources = {
  English: {
    languageLabel: 'Eng (US)',
    searchPlaceholder: 'Search',
    adminTitle: 'Admin Profile',
    adminSubtitle: 'Admin User'
  },
  Somali: {
    languageLabel: 'Somali',
    searchPlaceholder: 'Raadi',
    adminTitle: 'Astaanta Maamulaha',
    adminSubtitle: 'Adeegsade Maamul'
  },
  Arabic: {
    languageLabel: 'عربى',
    searchPlaceholder: 'بحث',
    adminTitle: 'ملف المسؤول',
    adminSubtitle: 'مسؤول'
  }
};

export default function TopBar() {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultLanguage;
    }
    return window.localStorage.getItem('appLanguage') || defaultLanguage;
  });

  useEffect(() => {
    const syncLanguage = () => {
      const saved = window.localStorage.getItem('appLanguage') || defaultLanguage;
      setLanguage(saved);
    };

    window.addEventListener('lfms-language-changed', syncLanguage);
    return () => {
      window.removeEventListener('lfms-language-changed', syncLanguage);
    };
  }, []);

  const resources = languageResources[language] ?? languageResources[defaultLanguage];
  const {
    languageLabel = 'Eng (US)',
    searchPlaceholder = 'Search',
    adminTitle = 'Admin Profile',
    adminSubtitle = 'Admin User'
  } = resources;

  return (
    <div
      className='mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 shadow-sm'
      style={{ borderColor: 'color-mix(in srgb, var(--app-text-muted) 20%, white)', backgroundColor: 'var(--app-topbar-bg)' }}
    >
      <label className='flex w-full max-w-sm items-center gap-2 rounded-xl border border-[#64748B]/20 bg-slate-50 px-3 py-2 text-xs text-[#64748B]'>
        <Search size={13} />
        <input
          type='text'
          placeholder={searchPlaceholder}
          className='w-full bg-transparent text-xs text-[#1E293B] outline-none placeholder:text-[#94A3B8]'
        />
      </label>

      <div className='ml-auto flex items-center gap-2.5'>
        <button
          type='button'
          className='inline-flex items-center gap-1 rounded-xl border border-[#64748B]/20 bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#1E293B]'
          style={{ color: 'var(--app-text-main)' }}
        >
          <Globe size={12} style={{ color: 'var(--app-accent-strong)' }} />
          {languageLabel}
          <ChevronDown size={11} style={{ color: 'var(--app-text-muted)' }} />
        </button>

        <button
          type='button'
          className='grid h-8 w-8 place-items-center rounded-full bg-[#64748B]/10 text-[#1E293B]'
          aria-label='Notifications'
          style={{ color: 'var(--app-text-main)' }}
        >
          <Bell size={14} />
        </button>

        <Link
          to='/admin'
          className='inline-flex items-center gap-2 rounded-xl border border-[#64748B]/20 bg-white px-2.5 py-1.5 transition hover:bg-[#64748B]/5'
          aria-label='Open admin profile'
        >
          <div className='text-right leading-tight'>
            <p className='m-0 text-[11px] font-semibold text-[#1E293B]'>{adminTitle}</p>
            <small className='text-[10px] text-[#64748B]'>{adminSubtitle}</small>
          </div>
          <span className='grid h-7 w-7 place-items-center rounded-full bg-[#64748B]/15 text-[#F59E0B]'>
            A
          </span>
          <ChevronDown size={11} className='text-[#64748B]' />
        </Link>
      </div>
    </div>
  );
}
