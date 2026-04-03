import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Database,
  Globe,
  Lock,
  Map,
  Palette,
  Shield,
  Truck,
  UserRound,
  Users
} from 'lucide-react';

const sections = [
  { id: 'general', label: 'General', description: 'Company details & contact info', icon: Globe },
  { id: 'fleet', label: 'Fleet', description: 'Vehicle defaults & units', icon: Truck },
  { id: 'driver', label: 'Driver', description: 'Roles & permissions', icon: UserRound },
  { id: 'gps', label: 'GPS & Tracking', description: 'Location & routing controls', icon: Map },
  { id: 'notifications', label: 'Notifications', description: 'Alert rules & channels', icon: Bell },
  { id: 'security', label: 'Security', description: 'Access & session policies', icon: Shield },
  { id: 'users', label: 'Users', description: 'Team management', icon: Users },
  { id: 'ui', label: 'UI Preferences', description: 'Theme & layout', icon: Palette },
  { id: 'backup', label: 'Backup & System', description: 'Data export & logs', icon: Database }
];

const defaultSettings = {
  general: {
    companyName: 'Somali Logistics',
    logoName: 'fleet-logo.png',
    email: 'operations@somalilogistics.com',
    phone: '+252 61 234 5678',
    address: '123 Mogadishu Port Rd, Mogadishu, Somalia',
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
    layout: 'default',
    language: 'English'
  },
  backup: {
    backupMode: 'auto',
    exportFormat: 'CSV',
    apiKeyAlias: 'lkj39-ds0j',
    systemLogs:
      'Auto backup completed 2 hours ago. Next scheduled sync at 02:00 UTC. API key rotated 12 days ago.'
  }
};

const defaultVehicles = [
  { id: 'TRK-12', name: 'TRK-12', alertsEnabled: true },
  { id: 'VAN-24', name: 'VAN-24', alertsEnabled: false },
  { id: 'BUS-03', name: 'BUS-03', alertsEnabled: true }
];

const initialUsers = [
  {
    id: 1,
    name: 'Amina Ahmed',
    role: 'Manager',
    status: 'Active',
    permissions: { read: true, write: true, manage: true }
  },
  {
    id: 2,
    name: 'Hassan Yusuf',
    role: 'Driver',
    status: 'Active',
    permissions: { read: true, write: false, manage: false }
  },
  {
    id: 3,
    name: 'Leyla Mohamed',
    role: 'Admin',
    status: 'Suspended',
    permissions: { read: true, write: true, manage: true }
  }
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

const systemLogs = [
  { id: 1, title: 'Database backup', detail: 'Completed successfully', time: 'Today · 06:32' },
  { id: 2, title: 'API key rotation', detail: 'Key lkj39-ds0j rotated', time: 'Yesterday · 21:10' },
  { id: 3, title: 'Security review', detail: '2FA enforced for all admin accounts', time: 'Yesterday · 14:55' }
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
  const [users, setUsers] = useState(initialUsers);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

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

  const handleUserRoleChange = (userId, role) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role } : user)));
  };

  const toggleUserStatus = (userId) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: user.status === 'Active' ? 'Suspended' : 'Active' } : user
      )
    );
    const updated = users.find((user) => user.id === userId);
    showToast(
      `${updated?.name || 'User'} has been ${
        updated?.status === 'Active' ? 'suspended' : 'reactivated'
      }`,
      'success'
    );
  };

  const toggleUserPermission = (userId, permission) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, permissions: { ...user.permissions, [permission]: !user.permissions[permission] } }
          : user
      )
    );
  };

  const handleDeleteUser = (userId) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
    showToast('User removed. Changes synced to the backend.', 'error');
  };

  const handleAddUser = () => {
    const nextId = Math.max(...users.map((user) => user.id)) + 1;
    setUsers((prev) => [
      ...prev,
      {
        id: nextId,
        name: `New User ${nextId}`,
        role: 'Driver',
        status: 'Active',
        permissions: { read: true, write: false, manage: false }
      }
    ]);
    showToast('User template added — customize the profile to activate it.');
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
                Language
                <select
                  value={settings.general.language}
                  onChange={(event) => handleFieldChange('general', 'language', event.target.value)}
                  className='rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none'
                >
                  <option value='English'>English</option>
                  <option value='Arabic'>Arabic</option>
                  <option value='French'>French</option>
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
              <button
                type='button'
                onClick={() => handleSaveSection('general')}
                className='rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
              >
                Save changes
              </button>
            </div>
          </div>
        );
