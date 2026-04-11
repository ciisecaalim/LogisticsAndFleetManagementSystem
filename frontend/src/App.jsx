import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import DriversPage from './pages/DriversPage';
import FuelPage from './pages/FuelPage';
import MaintenancePage from './pages/MaintenancePage';
import FleetMapPage from './pages/FleetMapPage';
import InventoryPage from './pages/InventoryPage';
import CategoryPage from './pages/CategoryPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import TripsPage from './pages/TripsPage';
import VehiclesPage from './pages/VehiclesPage';
import ShipmentsPage from './pages/ShipmentsPage';
import RecyclePinPage from './pages/RecyclePinPage';
import Sidebar from './components/sidebar';
import TopBar from './components/TopBar';

const STORAGE_KEY = 'lfms_app_settings';

const COUNTRY_PRESETS = {
  Somalia: {
    layoutBg: '#64748B',
    surfaceBg: '#ffffff',
    sidebarFrom: '#1E293B',
    sidebarTo: '#64748B'
  },
  Kenya: {
    layoutBg: '#64748B',
    surfaceBg: '#ffffff',
    sidebarFrom: '#1E293B',
    sidebarTo: '#64748B'
  },
  Ethiopia: {
    layoutBg: '#64748B',
    surfaceBg: '#ffffff',
    sidebarFrom: '#1E293B',
    sidebarTo: '#64748B'
  },
  UAE: {
    layoutBg: '#64748B',
    surfaceBg: '#ffffff',
    sidebarFrom: '#1E293B',
    sidebarTo: '#64748B'
  },
  Global: {
    layoutBg: '#64748B',
    surfaceBg: '#ffffff',
    sidebarFrom: '#1E293B',
    sidebarTo: '#64748B'
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

function buildTheme(settings) {
  const country = COUNTRY_PRESETS[settings.country] || COUNTRY_PRESETS.Somalia;
  const accent = ACCENT_PRESETS[settings.accentTone] || ACCENT_PRESETS.emerald;
  const darkMode = settings.themeMode === 'dark';

  return {
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

function applyTheme(settings) {
  if (typeof document === 'undefined') {
    return;
  }

  const theme = buildTheme(settings);
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
}

function PageShell() {
  return (
    <div
      className='min-h-screen lg:flex'
      style={{ backgroundColor: 'var(--app-layout-bg)', color: 'var(--app-text-main)' }}
    >
      <Sidebar />
      <main className='flex-1 bg-white px-4 py-6 pb-10 sm:px-6 sm:pb-12 lg:px-8 lg:py-7 lg:pb-14'>
        <div className='mx-auto w-full max-w-[1320px]'>
          <TopBar />
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function App() {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      applyTheme({ country: 'Somalia', themeMode: 'light', accentTone: 'emerald', ...saved });
    } catch {
      applyTheme({ country: 'Somalia', themeMode: 'light', accentTone: 'emerald' });
    }
  }, []);

  return (
    <Routes>
      <Route element={<PageShell />}>
        <Route path='/' element={<Navigate to='/fleet-map' replace />} />
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/admin' element={<AdminPage />} />
        <Route path='/settings' element={<SettingsPage />} />
        <Route path='/reports' element={<ReportsPage />} />
        <Route path='/vehicles' element={<VehiclesPage />} />
        <Route path='/drivers' element={<DriversPage />} />
        <Route path='/trips' element={<TripsPage />} />
        <Route path='/shipments' element={<ShipmentsPage />} />
        <Route path='/inventory' element={<InventoryPage />} />
        <Route path='/category' element={<CategoryPage />} />
        <Route path='/fuel' element={<FuelPage />} />
        <Route path='/maintenance' element={<MaintenancePage />} />
        <Route path='/fleet-map' element={<FleetMapPage />} />
        <Route path='/recycle-pin' element={<RecyclePinPage />} />
        <Route path='/map-links' element={<Navigate to='/fleet-map' replace />} />
        <Route path='*' element={<Navigate to='/fleet-map' replace />} />
      </Route>
    </Routes>
  );
}

export default App;
 
