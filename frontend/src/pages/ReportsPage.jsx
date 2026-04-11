import { BarChart3, Download, Package, Route, Truck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function unwrapResponse(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }

  return payload;
}

async function request(path, options = {}) {
  const { headers: userHeaders, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...userHeaders },
    ...rest
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  const payload = await response.json();
  return unwrapResponse(payload);
}

const api = {
  health: () => request('/health'),
  getSystem: () => request('/system'),
  getDashboardSummary: () => request('/dashboard/summary'),
  getMapVehicles: () => request('/map/vehicles'),
  getMapTrips: () => request('/map/trips'),
  assignDriverToVehicle: (payload) => request('/map/assign', { method: 'POST', body: JSON.stringify(payload) }),
  updateVehicleTracking: (payload) => request('/map/tracking', { method: 'POST', body: JSON.stringify(payload) }),
  getReports: () => request('/reports'),
  getSettings: () => request('/settings'),

  getVehicles: () => request('/vehicles'),
  createVehicle: (payload) => request('/vehicles', { method: 'POST', body: JSON.stringify(payload) }),
  updateVehicle: (id, payload) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteVehicle: (id, options = {}) => request(`/vehicles/${id}`, { method: 'DELETE', ...options }),

  getDrivers: () => request('/drivers'),
  createDriver: (payload) => request('/drivers', { method: 'POST', body: JSON.stringify(payload) }),
  updateDriver: (id, payload) => request(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteDriver: (id, options = {}) => request(`/drivers/${id}`, { method: 'DELETE', ...options }),

  getTrips: () => request('/trips'),
  createTrip: (payload) => request('/trips', { method: 'POST', body: JSON.stringify(payload) }),
  updateTrip: (id, payload) => request(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTrip: (id, options = {}) => request(`/trips/${id}`, { method: 'DELETE', ...options }),
  getShipments: () => request('/shipments'),
  createShipment: (payload) => request('/shipments', { method: 'POST', body: JSON.stringify(payload) }),
  updateShipment: (id, payload) => request(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteShipment: (id, options = {}) => request(`/shipments/${id}`, { method: 'DELETE', ...options }),

  getFuelRecords: () => request('/fuel'),
  createFuelRecord: (payload) => request('/fuel', { method: 'POST', body: JSON.stringify(payload) }),
  updateFuelRecord: (id, payload) => request(`/fuel/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteFuelRecord: (id, options = {}) => request(`/fuel/${id}`, { method: 'DELETE', ...options }),

  getMaintenanceRecords: () => request('/maintenance'),
  createMaintenanceRecord: (payload) => request('/maintenance', { method: 'POST', body: JSON.stringify(payload) }),
  updateMaintenanceRecord: (id, payload) => request(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteMaintenanceRecord: (id, options = {}) => request(`/maintenance/${id}`, { method: 'DELETE', ...options }),
  getRecycleBin: () => request('/recycle-bin'),
  restoreRecycleBinItem: (id) => request(`/recycle-bin/restore/${id}`, { method: 'POST' }),
  deleteRecycleBinItem: (id) => request(`/recycle-bin/${id}`, { method: 'DELETE' })
};

const STAT_CONFIG = [
  { key: 'drivers', label: 'Total Drivers', icon: Users, tone: 'emerald', helper: 'All active drivers' },
  { key: 'vehicles', label: 'Total Vehicles', icon: Truck, tone: 'slate', helper: 'Cars, trucks, motos' },
  { key: 'trips', label: 'Total Trips', icon: Route, tone: 'blue', helper: 'Recorded journeys' },
  { key: 'shipments', label: 'Total Shipments', icon: Package, tone: 'amber', helper: 'Loads assigned' }
];

const toneClasses = {
  emerald: 'from-emerald-500 to-emerald-600 text-white',
  slate: 'from-slate-500 to-slate-600 text-white',
  blue: 'from-sky-500 to-cyan-500 text-white',
  amber: 'from-amber-500 to-orange-500 text-white'
};

function StatsCard({ icon: Icon, label, value, tone, helper }) {
  return (
    <article className='rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]'>{label}</p>
          <p className='mt-2 text-3xl font-bold text-[#0f172a]'>{value ?? '0'}</p>
          <p className='mt-1 text-xs font-medium text-[#64748b]'>{helper}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${toneClasses[tone] || toneClasses.slate}`}>
          <Icon size={20} />
        </div>
      </div>
    </article>
  );
}

export default function ReportsPage() {
  const [stats, setStats] = useState({ drivers: 0, vehicles: 0, trips: 0, shipments: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const [drivers, vehicles, trips, shipments] = await Promise.all([
          api.getDrivers(),
          api.getVehicles(),
          api.getTrips(),
          api.getShipments()
        ]);

        if (!mounted) return;

        setStats({
          drivers: Array.isArray(drivers) ? drivers.length : 0,
          vehicles: Array.isArray(vehicles) ? vehicles.length : 0,
          trips: Array.isArray(trips) ? trips.length : 0,
          shipments: Array.isArray(shipments) ? shipments.length : 0
        });
        setStatsError('');
      } catch {
        if (!mounted) return;
        setStatsError('Unable to load quick stats. Refresh to retry.');
      } finally {
        if (!mounted) return;
        setLoadingStats(false);
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className='space-y-6'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='m-0 text-3xl font-bold tracking-tight text-[#10B981] sm:text-4xl'>Reports</h1>
          <p className='mt-1 text-base font-medium text-[#1E293B] sm:text-lg'>View and export fleet performance reports</p>
        </div>

        <button
          type='button'
          className='inline-flex items-center gap-2 rounded-xl bg-[#020617] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B]'
        >
          <Download size={17} />
          Export
        </button>
      </header>

      <section className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {STAT_CONFIG.map((item) => (
          <StatsCard key={item.key} label={item.label} value={loadingStats ? '—' : stats[item.key]} tone={item.tone} helper={item.helper} icon={item.icon} />
        ))}
      </section>
      {statsError ? (
        <p className='rounded-xl border border-[#fecaca] bg-[#fffbeb] px-4 py-2 text-sm text-[#b45309]'>{statsError}</p>
      ) : null}

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <div className='flex items-center gap-3'>
          <BarChart3 className='text-[#10B981]' size={22} />
          <p className='m-0 text-base font-semibold text-[#1E293B]'>Monthly reports are ready to review.</p>
        </div>
      </article>
    </section>
  );
}
