import { useEffect, useRef, useState } from 'react';
import {
  Archive,
  Bell,
  Globe,
  Map,
  Palette,
  Shield,
  Truck,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getCountryDefaults, useAppSettings } from '../contexts/AppSettingsContext';

const sections = [
  { id: 'general', label: 'General', description: 'Company details & contact info', icon: Globe },
  { id: 'fleet', label: 'Fleet', description: 'Vehicle defaults & units', icon: Truck },
  { id: 'driver', label: 'Driver', description: 'Roles & permissions', icon: UserRound },
  { id: 'gps', label: 'GPS & Tracking', description: 'Location & routing controls', icon: Map },
  { id: 'notifications', label: 'Notifications', description: 'Alert rules & channels', icon: Bell },
  { id: 'recycle', label: 'Recycle Bin', description: 'Soft-deleted data & restores', icon: Archive },
  { id: 'security', label: 'Security', description: 'Access & session policies', icon: Shield },
  { id: 'ui', label: 'UI Preferences', description: 'Theme & layout', icon: Palette }
];

const actionButtonBase = 'rounded-2xl px-5 py-2 text-sm font-semibold transition focus:outline-none';
const primaryAction =
  `${actionButtonBase} bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.4)] hover:from-emerald-400`;
const secondaryAction =
  `${actionButtonBase} border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300`;
const accentAction =
  `${actionButtonBase} border border-emerald-200 bg-white text-emerald-600 shadow-sm hover:bg-emerald-50`;

const defaultSettings = {
  general: {
    companyName: 'Somali Logistics',
    logoName: 'fleet-logo.png',
    email: 'operations@somalilogistics.com',
    phone: '+252 61 234 5678',
    address: '123 Mogadishu Port Rd, Mogadishu, Somalia',
    country: 'Somalia',
    timezone: 'EAT (UTC+3)',
    language: 'English'
  },
  fleet: {
    defaultVehicleTypes: ['Truck', 'Bus'],
    fuelUnit: 'Liters',
    maintenanceInterval: 5000,
    vehicleStatus: ['Available', 'In Use']
  },
  driver: {
    roles: ['Driver'],
    licenseAlertDays: 30,
    workingHours: '07:00 - 17:00',
    status: 'Active'
  },
  gps: {
    trackingEnabled: true,
    trackingInterval: 5,
    mapProvider: 'google',
    routeHistory: true,
    accuracy: 'High'
  },
  notifications: {
    notificationsEnabled: true,
    alertTypes: ['Speed', 'Route', 'Geofence'],
    channels: ['In-app', 'Email'],
    speedThreshold: 80
  },
  security: {
    twoFactor: true,
    sessionTimeout: 30,
    password: ''
  },
  ui: {
    themeMode: 'light',
    accentTone: 'emerald',
    layout: 'default',
    language: 'English'
  }
};

const defaultVehicles = [
  { id: 'TRK-12', name: 'TRK-12', alertsEnabled: true },
  { id: 'VAN-24', name: 'VAN-24', alertsEnabled: false },
  { id: 'BUS-03', name: 'BUS-03', alertsEnabled: true }
];

const notificationHistory = [
  {
    id: 1,
    type: 'Speed alert',
    message: 'TRK-12 exceeded 80 km/h near Afgooye',
    timestamp: '5 minutes ago',
    channel: 'In-app'
  },
  {
    id: 2,
    type: 'Geofence exit',
    message: 'VAN-24 left Mogadishu Depot unexpectedly',
    timestamp: '12 minutes ago',
    channel: 'Email'
  },
  {
    id: 3,
    type: 'Inactivity alert',
    message: 'BUS-03 has not reported GPS for 6 minutes',
    timestamp: '38 minutes ago',
    channel: 'SMS'
  }
];

const ToggleSwitch = ({ checked, onToggle }) => (
  <button
    type='button'
    role='switch'
    aria-checked={checked}
    onClick={() => onToggle(!checked)}
    className={`relative inline-flex h-6 w-12 items-center rounded-full border transition ${
      checked ? 'border-emerald-400 bg-emerald-400' : 'border-slate-300 bg-white'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full bg-white transition ${
        checked ? 'translate-x-[18px]' : 'translate-x-[4px]'
      }`}
    />
  </button>
);

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState(defaultSettings);
  const [vehicles, setVehicles] = useState(defaultVehicles);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const { language, setLanguage } = useLanguage();
  const { appSettings, setCountry, setThemeMode, setAccentTone } = useAppSettings();
  const [alertHistoryOpen, setAlertHistoryOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message, variant = 'success') => {
    setToast({ message, variant });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleFieldChange = (sectionId, field, value) => {
    if (sectionId === 'general' && field === 'country') {
      const countryDefaults = getCountryDefaults(value);
      const nextLanguage = countryDefaults.language;
      setCountry(value);
      setLanguage(nextLanguage);
      setSettings((prev) => ({
        ...prev,
        general: {
          ...prev.general,
          country: value,
          timezone: countryDefaults.timezone,
          language: nextLanguage
        },
        ui: {
          ...prev.ui,
          language: nextLanguage
        }
      }));
      showToast(`${value} profile applied across system.`);
      return;
    }

    if (sectionId === 'ui' && field === 'themeMode') {
      setThemeMode(value);
    }

    if (sectionId === 'ui' && field === 'accentTone') {
      setAccentTone(value);
    }

    setSettings((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [field]: value }
    }));
  };

  const toggleArrayValue = (sectionId, field, value) => {
    setSettings((prev) => {
      const current = prev[sectionId][field] || [];
      const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      return { ...prev, [sectionId]: { ...prev[sectionId], [field]: next } };
    });
  };

  const toggleVehicleAlerts = (vehicleId) => {
    setVehicles((prev) =>
      prev.map((vehicle) =>
        vehicle.id === vehicleId ? { ...vehicle, alertsEnabled: !vehicle.alertsEnabled } : vehicle
      )
    );
  };

  const handleSaveSection = (sectionId) => {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    if (sectionId === 'general' && !settings.general.companyName.trim()) {
      showToast('Please add a company name before saving.', 'error');
      return;
    }

    if (sectionId === 'notifications' && settings.notifications.channels.length === 0) {
      showToast('Enable at least one notification channel.', 'error');
      return;
    }

    showToast(`${section.label} settings saved successfully.`);
  };

  useEffect(() => {
    setSettings((prev) => {
      const countryDefaults = getCountryDefaults(appSettings.country);
      const hasSameLanguage = prev.general.language === language && prev.ui.language === language;
      const hasSameCountry = prev.general.country === appSettings.country;
      const hasSameTheme = prev.ui.themeMode === appSettings.themeMode;
      const hasSameAccent = prev.ui.accentTone === appSettings.accentTone;

      if (hasSameLanguage && hasSameCountry && hasSameTheme && hasSameAccent) {
        return prev;
      }

      return {
        ...prev,
        general: {
          ...prev.general,
          country: appSettings.country,
          timezone: countryDefaults.timezone,
          language
        },
        ui: {
          ...prev.ui,
          themeMode: appSettings.themeMode,
          accentTone: appSettings.accentTone,
          language
        }
      };
    });
  }, [appSettings.accentTone, appSettings.country, appSettings.themeMode, language, setSettings]);

  const handleLanguageSelect = (sectionId, value) => {
    handleFieldChange(sectionId, 'language', value);
    setLanguage(value);
  };

  const generalErrors =
    !settings.general.companyName.trim() || !settings.general.email || !settings.general.phone
      ? [
          !settings.general.companyName.trim() && 'Company name helps coworkers identify the workspace.',
          !settings.general.email && 'Email is required for notifications and invoices.',
          !settings.general.phone && 'Phone number keeps drivers reachable.'
        ].filter(Boolean)
      : [];

  const activeSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className='space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5'>
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-slate-400'>General Settings</p>
              <h2 className='text-2xl font-bold text-slate-900'>Company & contact info</h2>
              <p className='text-sm text-slate-500'>
                Keep your mission-critical contact details and branding in sync with the rest of the platform.
              </p>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Company Name
                <input
                  value={settings.general.companyName}
                  onChange={(event) => handleFieldChange('general', 'companyName', event.target.value)}
                  placeholder='FleetX Logistics'
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                />
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Company Logo
                <input
                  type='file'
                  accept='image/*'
                  onChange={(event) =>
                    handleFieldChange(
                      'general',
                      'logoName',
                      event.target.files?.[0]?.name || settings.general.logoName
                    )
                  }
                  className='rounded-2xl border border-dashed border-slate-300 px-3 py-2 text-[0.85em] text-slate-600'
                />
                <span className='text-xs text-slate-400'>{settings.general.logoName}</span>
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Email
                <input
                  type='email'
                  value={settings.general.email}
                  onChange={(event) => handleFieldChange('general', 'email', event.target.value)}
                  placeholder='contact@example.com'
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                />
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Phone
                <input
                  type='tel'
                  value={settings.general.phone}
                  onChange={(event) => handleFieldChange('general', 'phone', event.target.value)}
                  placeholder='+1 202 555 0100'
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                />
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600 md:col-span-2'>
                Address / Location
                <textarea
                  rows={2}
                  value={settings.general.address}
                  onChange={(event) => handleFieldChange('general', 'address', event.target.value)}
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                />
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Timezone
                <select
                  value={settings.general.timezone}
                  onChange={(event) => handleFieldChange('general', 'timezone', event.target.value)}
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                >
                  <option value='EAT (UTC+3)'>EAT (UTC+3)</option>
                  <option value='UTC'>UTC</option>
                  <option value='GMT+3'>GMT+3</option>
                  <option value='CET'>CET (UTC+1)</option>
                </select>
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Country / Deployment profile
                <select
                  value={settings.general.country}
                  onChange={(event) => handleFieldChange('general', 'country', event.target.value)}
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                >
                  <option value='Somalia'>Somalia</option>
                  <option value='Kenya'>Kenya</option>
                  <option value='Ethiopia'>Ethiopia</option>
                  <option value='UAE'>UAE</option>
                  <option value='Global'>Global</option>
                </select>
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Language
                <select
                  value={settings.general.language}
                  onChange={(event) => handleLanguageSelect('general', event.target.value)}
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                >
                  <option value='English'>English</option>
                  <option value='Somali'>Somali</option>
                  <option value='Arabic'>Carabi</option>
                </select>
              </label>
            </div>

            {generalErrors.length > 0 && (
              <div className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-inner shadow-rose-50'>
                <strong className='text-xs font-semibold uppercase tracking-[0.4em] text-rose-500'>
                  Required
                </strong>
                <ul className='mt-2 space-y-1'>
                  {generalErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className='flex items-center justify-between'>
              <div className='text-sm text-slate-500'>
                Changes are staged locally — click save to push them to the backend.
              </div>
              <button type='button' onClick={() => handleSaveSection('general')} className={primaryAction}>
                Save changes
              </button>
            </div>
          </div>
        );
      case 'fleet':
        return (
          <div className='space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5'>
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-slate-400'>Fleet Settings</p>
              <h2 className='text-2xl font-bold text-slate-900'>Default vehicle behavior</h2>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <p className='text-sm font-medium text-slate-600'>Default vehicle types</p>
                <div className='flex flex-wrap gap-3'>
                  {['Truck', 'Bus', 'Car', 'Van'].map((type) => (
                    <button
                      key={type}
                      type='button'
                      onClick={() => toggleArrayValue('fleet', 'defaultVehicleTypes', type)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        settings.fleet.defaultVehicleTypes.includes(type)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Fuel unit
                <select
                  value={settings.fleet.fuelUnit}
                  onChange={(event) => handleFieldChange('fleet', 'fuelUnit', event.target.value)}
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                >
                  <option value='Liters'>Liters</option>
                  <option value='Gallons'>Gallons</option>
                </select>
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Maintenance reminder interval (km)
                <input
                  type='number'
                  min={1000}
                  value={settings.fleet.maintenanceInterval}
                  onChange={(event) =>
                    handleFieldChange('fleet', 'maintenanceInterval', Number(event.target.value))
                  }
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                />
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Vehicle statuses
                <div className='flex flex-wrap gap-3'>
                  {['Available', 'In Use', 'Maintenance'].map((status) => (
                    <button
                      key={status}
                      type='button'
                      onClick={() => toggleArrayValue('fleet', 'vehicleStatus', status)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        settings.fleet.vehicleStatus.includes(status)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-slate-500'>Fuel & maintenance controls apply to every route.</span>
              <button type='button' onClick={() => handleSaveSection('fleet')} className={secondaryAction}>
                Save fleet rules
              </button>
            </div>
          </div>
        );
      case 'driver':
        return (
          <div className='space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5'>
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-slate-400'>Driver Settings</p>
              <h2 className='text-2xl font-bold text-slate-900'>Roles, permissions & alerts</h2>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Driver roles
                <div className='flex flex-wrap gap-3'>
                  {['Driver', 'Dispatcher', 'Manager'].map((role) => (
                    <button
                      key={role}
                      type='button'
                      onClick={() => toggleArrayValue('driver', 'roles', role)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        settings.driver.roles.includes(role)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                License expiration alert (days)
                <input
                  type='number'
                  min={7}
                  value={settings.driver.licenseAlertDays}
                  onChange={(event) =>
                    handleFieldChange('driver', 'licenseAlertDays', Number(event.target.value))
                  }
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                />
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Default working hours
                <input
                  type='text'
                  value={settings.driver.workingHours}
                  onChange={(event) => handleFieldChange('driver', 'workingHours', event.target.value)}
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                />
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Driver status
                <select
                  value={settings.driver.status}
                  onChange={(event) => handleFieldChange('driver', 'status', event.target.value)}
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                >
                  <option value='Active'>Active</option>
                  <option value='Suspended'>Suspended</option>
                </select>
              </label>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-slate-500'>Permissions and alerts move with every fleet shift.</span>
              <button type='button' onClick={() => handleSaveSection('driver')} className={secondaryAction}>
                Save driver rules
              </button>
            </div>
          </div>
        );
      case 'gps':
        return (
          <div className='space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5'>
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-slate-400'>GPS & Tracking</p>
              <h2 className='text-2xl font-bold text-slate-900'>Real-time positioning</h2>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
                <div>
                  <p className='text-sm font-semibold text-slate-900'>GPS tracking</p>
                  <p className='text-xs text-slate-500'>Enable mobile devices to push coordinates.</p>
                </div>
                <ToggleSwitch
                  checked={settings.gps.trackingEnabled}
                  onToggle={(value) => handleFieldChange('gps', 'trackingEnabled', value)}
                />
              </div>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Tracking interval (seconds)
                <select
                  value={settings.gps.trackingInterval}
                  onChange={(event) =>
                    handleFieldChange('gps', 'trackingInterval', Number(event.target.value))
                  }
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                >
                  {[5, 10, 30, 60].map((interval) => (
                    <option key={interval} value={interval}>
                      {interval} seconds
                    </option>
                  ))}
                </select>
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Map provider
                <div className='flex gap-3'>
                  {[
                    { value: 'google', label: 'Google Maps' },
                    { value: 'mapbox', label: 'Mapbox' }
                  ].map((provider) => (
                    <button
                      key={provider.value}
                      type='button'
                      onClick={() => handleFieldChange('gps', 'mapProvider', provider.value)}
                      className={`rounded-2xl border px-4 py-2 text-sm transition ${
                        settings.gps.mapProvider === provider.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {provider.label}
                    </button>
                  ))}
                </div>
              </label>

              <div className='flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
                <div>
                  <p className='text-sm font-semibold text-slate-900'>Route history</p>
                  <p className='text-xs text-slate-500'>Store past coordinates for replay.</p>
                </div>
                <ToggleSwitch
                  checked={settings.gps.routeHistory}
                  onToggle={(value) => handleFieldChange('gps', 'routeHistory', value)}
                />
              </div>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Accuracy level
                <div className='flex gap-3'>
                  {['High', 'Medium', 'Low'].map((level) => (
                    <button
                      key={level}
                      type='button'
                      onClick={() => handleFieldChange('gps', 'accuracy', level)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        settings.gps.accuracy === level
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-slate-500'>Changes sync over WebSockets to the dashboard.</span>
              <button type='button' onClick={() => handleSaveSection('gps')} className={secondaryAction}>
                Save GPS settings
              </button>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className='space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5'>
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-slate-400'>Notification Settings</p>
              <h2 className='text-2xl font-bold text-slate-900'>Alerts & channels</h2>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
                <div>
                  <p className='text-sm font-semibold text-slate-900'>Enable alerts</p>
                  <p className='text-xs text-slate-500'>Master toggle for all alert types.</p>
                </div>
                <ToggleSwitch
                  checked={settings.notifications.notificationsEnabled}
                  onToggle={(value) => handleFieldChange('notifications', 'notificationsEnabled', value)}
                />
              </div>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Default speed threshold (km/h)
                <input
                  type='number'
                  min={40}
                  value={settings.notifications.speedThreshold}
                  onChange={(event) =>
                    handleFieldChange('notifications', 'speedThreshold', Number(event.target.value))
                  }
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                />
              </label>

              <div className='space-y-2'>
                <p className='text-sm font-medium text-slate-600'>Alert types</p>
                <div className='flex flex-wrap gap-3'>
                  {['Speed', 'Route', 'Geofence', 'Inactivity'].map((type) => (
                    <button
                      key={type}
                      type='button'
                      onClick={() => toggleArrayValue('notifications', 'alertTypes', type)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        settings.notifications.alertTypes.includes(type)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className='space-y-2'>
                <p className='text-sm font-medium text-slate-600'>Notification channels</p>
                <div className='flex flex-wrap gap-3'>
                  {['In-app', 'Email', 'SMS'].map((channel) => (
                    <button
                      key={channel}
                      type='button'
                      onClick={() => toggleArrayValue('notifications', 'channels', channel)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        settings.notifications.channels.includes(channel)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <p className='text-sm font-semibold text-slate-900'>Live alert preview</p>
                <div className='mt-3 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                  {notificationHistory.map((notification) => (
                    <div key={notification.id} className='flex items-start justify-between'>
                      <div>
                        <p className='text-sm font-semibold text-slate-900'>{notification.type}</p>
                        <p>{notification.message}</p>
                        <p className='text-xs text-slate-500'>{notification.timestamp}</p>
                      </div>
                      <span className='text-[0.7em] uppercase tracking-[0.3em] text-slate-400'>
                        {notification.channel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className='rounded-2xl border border-slate-100 bg-slate-50 p-4'>
                <p className='text-sm font-semibold text-slate-900'>Per-vehicle alert toggles</p>
                <div className='mt-3 space-y-2'>
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-semibold text-slate-900'>{vehicle.name}</p>
                        <p className='text-xs text-slate-500'>Toggle notifications for this vehicle.</p>
                      </div>
                      <button
                        type='button'
                        onClick={() => toggleVehicleAlerts(vehicle.id)}
                        className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                          vehicle.alertsEnabled
                            ? 'bg-emerald-500 text-white'
                            : 'border border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        {vehicle.alertsEnabled ? 'Alerts ON' : 'Alerts OFF'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-slate-500'>Notifications also reach the driver mobile app instantly.</span>
              <button
                type='button'
                onClick={() => handleSaveSection('notifications')}
                className={secondaryAction}
              >
                Save notification rules
              </button>
            </div>
          </div>
        );
      case 'recycle':
        return recycleContent;
      case 'security':
        return (
          <div className='space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5'>
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-slate-400'>Security Settings</p>
              <h2 className='text-2xl font-bold text-slate-900'>Access control & policies</h2>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Change password
                <input
                  type='password'
                  value={settings.security.password}
                  onChange={(event) => handleFieldChange('security', 'password', event.target.value)}
                  placeholder='••••••••'
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                />
              </label>

              <div className='flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
                <div>
                  <p className='text-sm font-semibold text-slate-900'>Two-factor authentication</p>
                  <p className='text-xs text-slate-500'>Secure admin logins with a second factor.</p>
                </div>
                <ToggleSwitch
                  checked={settings.security.twoFactor}
                  onToggle={(value) => handleFieldChange('security', 'twoFactor', value)}
                />
              </div>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Session timeout (minutes)
                <select
                  value={settings.security.sessionTimeout}
                  onChange={(event) =>
                    handleFieldChange('security', 'sessionTimeout', Number(event.target.value))
                  }
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                >
                  {[15, 30, 60, 120].map((timeout) => (
                    <option key={timeout} value={timeout}>
                      {timeout} minutes
                    </option>
                  ))}
                </select>
              </label>

              <div className='space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4'>
                <p className='text-sm font-semibold text-slate-900'>Recent login activity</p>
                <ul className='space-y-1 text-xs text-slate-600'>
                  <li>Today · 08:12 — Admin dashboard (41.89.76.30)</li>
                  <li>Yesterday · 21:59 — Driver portal (41.89.76.49)</li>
                  <li>Yesterday · 18:44 — API session refresh (41.89.76.23)</li>
                </ul>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-slate-500'>Security changes sync immediately to the Identity Provider.</span>
              <button type='button' onClick={() => handleSaveSection('security')} className={secondaryAction}>
                Save security preferences
              </button>
            </div>
          </div>
        );
      case 'ui':
        return (
          <div className='space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5'>
            <div className='flex flex-col gap-3'>
              <p className='text-xs font-semibold uppercase tracking-[0.4em] text-slate-400'>UI Preferences</p>
              <h2 className='text-2xl font-bold text-slate-900'>Theme, layout & language</h2>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
                <div>
                  <p className='text-sm font-semibold text-slate-900'>Dark mode</p>
                  <p className='text-xs text-slate-500'>Drivers see dashboards optimized for night shifts.</p>
                </div>
                <ToggleSwitch
                  checked={settings.ui.themeMode === 'dark'}
                  onToggle={(value) =>
                    handleFieldChange('ui', 'themeMode', value ? 'dark' : 'light')
                  }
                />
              </div>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Dashboard layout
                <select
                  value={settings.ui.layout}
                  onChange={(event) => handleFieldChange('ui', 'layout', event.target.value)}
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                >
                  <option value='default'>Default</option>
                  <option value='compact'>Compact</option>
                  <option value='grid'>Grid</option>
                </select>
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-slate-600'>
                Interface language
                <select
                  value={settings.ui.language}
                  onChange={(event) => handleLanguageSelect('ui', event.target.value)}
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                >
                  <option value='English'>English</option>
                  <option value='Somali'>Somali</option>
                  <option value='Arabic'>Carabi</option>
                </select>
              </label>

              <div className='md:col-span-2'>
                <p className='mb-2 text-sm font-medium text-slate-600'>System color profile</p>
                <div className='flex flex-wrap gap-3'>
                  {[
                    { value: 'emerald', label: 'Emerald' },
                    { value: 'sky', label: 'Sky' },
                    { value: 'amber', label: 'Amber' },
                    { value: 'rose', label: 'Rose' }
                  ].map((tone) => (
                    <button
                      key={tone.value}
                      type='button'
                      onClick={() => handleFieldChange('ui', 'accentTone', tone.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        settings.ui.accentTone === tone.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm text-slate-500'>Switch between desktop and tablet layouts on the fly.</span>
              <button type='button' onClick={() => handleSaveSection('ui')} className={secondaryAction}>
                Save UI preferences
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const recycleContent = (
    <div className='space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5'>
      <div>
        <p className='text-xs font-semibold uppercase tracking-[0.4em] text-slate-400'>Recycle Bin</p>
        <h2 className='text-2xl font-bold text-slate-900'>Recover deleted records</h2>
        <p className='mt-2 text-sm text-slate-500'>
          Soft-deleted trips, drivers, vehicles, and documents stay in the recycle bin for 30 days. Restore or purge them
          from the recycle pin view and keep telemetry data consistent.
        </p>
      </div>
      <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700'>
        <p className='font-semibold'>Last synced</p>
        <p>Every action replicates immediately across the CRM and driver apps.</p>
      </div>
      <div className='flex items-center justify-between gap-4'>
        <Link
          to='/recycle-pin'
          className={`${primaryAction} px-6`}
        >
          Open recycle bin
        </Link>
        <button type='button' className={secondaryAction} onClick={() => setActiveSection('security')}>
          Back to security
        </button>
      </div>
    </div>
  );

  const liveTimestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const activeAlertCount = vehicles.filter((vehicle) => vehicle.alertsEnabled).length;
  const idleVehicles = Math.max(0, vehicles.length - activeAlertCount);

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-100 to-slate-200'>
      <div className='mx-auto flex max-w-[1120px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12'>
        <div className='grid gap-4 lg:grid-cols-2'>
          <article className='h-full rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-none'>
            <div className='flex items-center gap-2 text-slate-600'>
              <Truck size={20} />
              <p className='text-2xl font-bold text-slate-900'>Live telemetry</p>
            </div>
            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
              <div className='flex min-h-[170px] flex-col justify-between rounded-2xl border border-slate-100 bg-white/80 px-5 py-4'>
                <div className='flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-500'>
                  <span>Vehicles reporting</span>
                  <span className='h-px w-6 bg-slate-300' />
                  <span className='text-lg font-semibold text-emerald-600'>{vehicles.length}</span>
                </div>
                <p className='mt-2 font-bold text-slate-900' style={{ fontSize: '2em' }}>{vehicles.length}</p>
                <div className='mt-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-600'>
                  Updated {liveTimestamp}
                </div>
              </div>
              <div className='flex min-h-[170px] flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4'>
                <div className='flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-700'>
                  <Bell size={16} />
                  <span>Alerts enabled</span>
                  <span className='h-px w-6 bg-emerald-200' />
                  <span className='text-lg font-semibold text-emerald-600'>{activeAlertCount}</span>
                </div>
                <p className='mt-2 font-bold text-emerald-700' style={{ fontSize: '2em' }}>{activeAlertCount}</p>
                <div className='mt-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-700'>
                  Idle / offline {idleVehicles}
                </div>
              </div>
            </div>
          </article>

          <article className='h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)]'>
            <div className='flex items-center justify-between'>
              <p className='text-2xl font-bold text-slate-900'>Alert history</p>
              <button
                type='button'
                className={`${accentAction} px-6 py-2.5 text-base`}
                onClick={() => setAlertHistoryOpen((prev) => !prev)}
              >
                {alertHistoryOpen ? 'Hide' : 'Show'}
              </button>
            </div>
            {alertHistoryOpen ? (
              <div className='mt-3 space-y-3 text-sm text-slate-500'>
                {notificationHistory.slice(0, 3).map((notification) => (
                  <div key={notification.id} className='flex items-start justify-between'>
                    <div>
                      <p className='text-lg font-semibold text-slate-900'>{notification.type}</p>
                      <p className='text-base'>{notification.message}</p>
                      <p className='text-sm text-slate-400'>{notification.timestamp}</p>
                    </div>
                    <span className='text-[0.7em] uppercase tracking-[0.2em] text-slate-400'>
                      {notification.channel}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className='mt-3 text-sm text-slate-500'>Tap show to view recent notification events.</p>
            )}
          </article>
        </div>

        <div className='rounded-[40px] border border-slate-200 bg-white/80 p-6 shadow-[0_35px_80px_rgba(15,23,42,0.15)] backdrop-blur-sm'>
          <div className='grid gap-8 lg:grid-cols-[280px_minmax(0,820px)]'>
            <aside className='space-y-6'>
              <div className='rounded-3xl border border-slate-100 bg-white p-5 shadow'>
                <p className='text-sm font-semibold text-slate-900'>Sections</p>
                <div className='mt-3 space-y-2'>
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        type='button'
                        onClick={() => setActiveSection(section.id)}
                        className={`flex items-center gap-3 w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 shadow-[0_6px_20px_rgba(16,185,129,0.15)]'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className='grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-600'>
                          <Icon size={18} />
                        </span>
                        <div className='flex-1'>
                          <p className={`text-sm font-semibold ${isActive ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {section.label}
                          </p>
                          <p className='text-xs text-slate-400'>{section.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <section className='space-y-5'>{activeSectionContent()}</section>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-xs rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg ${
            toast.variant === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
