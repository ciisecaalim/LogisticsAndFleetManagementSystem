import { useEffect, useMemo, useState } from 'react';
import { Fuel, Route, Truck, UserRound } from 'lucide-react';

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

const DASHBOARD_SUMMARY_KEY = 'lfms_dashboard_summary';
const DASHBOARD_TRIPS_KEY = 'lfms_dashboard_trips';
const DASHBOARD_FUEL_KEY = 'lfms_dashboard_fuel';
const DASHBOARD_DRIVERS_KEY = 'lfms_dashboard_drivers';
const DASHBOARD_MAINTENANCE_KEY = 'lfms_dashboard_maintenance';

function readCache(key, fallback) {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function buildSmoothPath(points) {
  if (!points.length) {
    return '';
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const midX = (prev.x + current.x) / 2;
    d += ` Q ${midX} ${prev.y}, ${current.x} ${current.y}`;
  }

  return d;
}

const accentStyles = {
  blue: 'border-t-4 border-t-[#64748B]',
  green: 'border-t-4 border-t-[#10B981]',
  amber: 'border-t-4 border-t-[#F59E0B]'
};

const accentIconStyles = {
  blue: 'bg-[#64748B]/15 text-[#64748B]',
  green: 'bg-[#10B981]/18 text-[#10B981]',
  amber: 'bg-[#F59E0B]/18 text-[#F59E0B]'
};

export default function DashboardPage() {
  const [summary, setSummary] = useState(() =>
    readCache(DASHBOARD_SUMMARY_KEY, {
      totalVehicles: 0,
      activeTrips: 0,
      totalDrivers: 0,
      fuelExpenses: 0
    })
  );
  const [trips, setTrips] = useState(() => readCache(DASHBOARD_TRIPS_KEY, []));
  const [fuelRecords, setFuelRecords] = useState(() => readCache(DASHBOARD_FUEL_KEY, []));
  const [drivers, setDrivers] = useState(() => readCache(DASHBOARD_DRIVERS_KEY, []));
  const [maintenanceRecords, setMaintenanceRecords] = useState(() => readCache(DASHBOARD_MAINTENANCE_KEY, []));
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [summaryData, tripsData, fuelData, driversData, maintenanceData] = await Promise.all([
          api.getDashboardSummary(),
          api.getTrips(),
          api.getFuelRecords(),
          api.getDrivers(),
          api.getMaintenanceRecords()
        ]);

        if (!isMounted) {
          return;
        }

        if (summaryData && typeof summaryData === 'object') {
          setSummary(summaryData);
          writeCache(DASHBOARD_SUMMARY_KEY, summaryData);
        }

        if (Array.isArray(tripsData)) {
          setTrips(tripsData);
          writeCache(DASHBOARD_TRIPS_KEY, tripsData);
        }

        if (Array.isArray(fuelData)) {
          setFuelRecords(fuelData);
          writeCache(DASHBOARD_FUEL_KEY, fuelData);
        }

        if (Array.isArray(driversData)) {
          setDrivers(driversData);
          writeCache(DASHBOARD_DRIVERS_KEY, driversData);
        }

        if (Array.isArray(maintenanceData)) {
          setMaintenanceRecords(maintenanceData);
          writeCache(DASHBOARD_MAINTENANCE_KEY, maintenanceData);
        }

        setError('');
      } catch {
        if (isMounted) {
          setError('Backend unavailable. Showing cached dashboard data.');
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const summaryCards = [
    { title: 'Total Vehicles', value: String(summary.totalVehicles || 0), description: 'Active fleet units', accent: 'blue', icon: Truck },
    { title: 'Active Trips', value: String(summary.activeTrips || 0), description: 'Routes in motion', accent: 'green', icon: Route },
    { title: 'Total Drivers', value: String(summary.totalDrivers || 0), description: 'On rotation', accent: 'amber', icon: UserRound },
    {
      title: 'Fuel Expenses',
      value: `$${Number(summary.fuelExpenses || 0).toFixed(2)}`,
      description: 'This month',
      accent: 'blue',
      icon: Fuel
    }
  ];

  const tripBars = useMemo(() => {
    const groupedByDate = trips.reduce((acc, trip) => {
      const date = trip.date || 'Unknown';

      if (!acc[date]) {
        acc[date] = { label: date, value: 0, status: trip.status || 'Pending' };
      }

      acc[date].value += 1;

      if (trip.status === 'Ongoing') {
        acc[date].status = 'Ongoing';
      } else if (trip.status === 'Pending' && acc[date].status !== 'Ongoing') {
        acc[date].status = 'Pending';
      }

      return acc;
    }, {});

    return Object.values(groupedByDate).slice(0, 5);
  }, [trips]);

  const fuelPoints = useMemo(() => {
    return fuelRecords.slice(0, 7).map((record) => ({
      label: record.date,
      cost: Number(record.cost || 0),
      liters: Number(record.liters || 0)
    }));
  }, [fuelRecords]);

  const quickStats = useMemo(() => {
    const maintenancePending = maintenanceRecords.filter((row) => row.status === 'Pending').length;
    const activeDrivers = drivers.filter((driver) => driver.status === 'Active').length;
    const totalFuelCost = fuelRecords.reduce((sum, record) => sum + Number(record.cost || 0), 0);
    const avgFuelCost = fuelRecords.length > 0 ? totalFuelCost / fuelRecords.length : 0;
    const upcomingTrips = trips.filter((trip) => trip.status === 'Pending').length;

    return [
      { label: 'Vehicles in Maintenance', value: String(maintenancePending) },
      { label: 'Active Drivers', value: String(activeDrivers) },
      { label: 'Avg. Fuel Cost/Day', value: `$${avgFuelCost.toFixed(2)}` },
      { label: 'Upcoming Trips', value: String(upcomingTrips) }
    ];
  }, [drivers, fuelRecords, maintenanceRecords, trips]);

  const maxTripValue = Math.max(...tripBars.map((bar) => bar.value), 1);
  const fuelChartWidth = 520;
  const fuelChartHeight = 220;
  const fuelMaxCost = Math.max(...fuelPoints.map((point) => point.cost), 1);
  const fuelMaxLiters = Math.max(...fuelPoints.map((point) => point.liters), 1);
  const fuelCostPoints = fuelPoints.map((point, index) => ({
    x: fuelPoints.length > 1 ? (index / (fuelPoints.length - 1)) * fuelChartWidth : 0,
    y: fuelChartHeight - (point.cost / fuelMaxCost) * fuelChartHeight
  }));
  const fuelLitersPoints = fuelPoints.map((point, index) => ({
    x: fuelPoints.length > 1 ? (index / (fuelPoints.length - 1)) * fuelChartWidth : 0,
    y: fuelChartHeight - (point.liters / fuelMaxLiters) * fuelChartHeight
  }));
  const fuelCostPath = buildSmoothPath(fuelCostPoints);
  const fuelLitersPath = buildSmoothPath(fuelLitersPoints);
  const yAxisCostLevels = [fuelMaxCost, fuelMaxCost * 0.75, fuelMaxCost * 0.5, fuelMaxCost * 0.25, 0].map((v) =>
    Number(v.toFixed(0))
  );
  const yAxisLitersLevels = [fuelMaxLiters, fuelMaxLiters * 0.75, fuelMaxLiters * 0.5, fuelMaxLiters * 0.25, 0].map((v) =>
    Number(v.toFixed(0))
  );
  const xAxisVisibleLabels = new Set(fuelPoints.filter((_, index) => index % 2 === 0).map((point) => point.label));
  const tripLevels = [2, 1.5, 1, 0.5, 0];
  const tripStatusColors = {
    Completed: '#10B981',
    Ongoing: '#64748B',
    Pending: '#F59E0B'
  };

  return (
    <div className='flex flex-col gap-6'>
      <header>
        <p className='m-0 text-xs font-bold uppercase tracking-[0.28em] text-[#64748B]'>Dashboard</p>
        <h1 className='page-title mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl'>Overview of my fleet</h1>
        <p className='m-0 text-[#64748B]'>Insights for the logistics team</p>
      </header>

      {error ? (
        <p className='rounded-xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-4 py-2 text-sm text-[#92400E]'>{error}</p>
      ) : null}

      <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className={`rounded-2xl border border-[#64748B]/15 bg-white p-5 shadow-lg shadow-slate-900/5 ${accentStyles[card.accent]}`}
            >
              <div className='flex items-start gap-4'>
                <span className={`grid h-14 w-14 place-items-center rounded-2xl ${accentIconStyles[card.accent]}`}>
                  <Icon size={26} strokeWidth={2.2} />
                </span>
                <div>
                  <p className='m-0 font-semibold text-[#64748B]'>{card.title}</p>
                  <p className='mt-1 leading-none font-extrabold text-[#1E293B]' style={{ fontSize: '2em' }}>{card.value}</p>
                  <p className='mt-1 text-sm text-[#64748B]'>{card.description}</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className='grid gap-5 xl:grid-cols-2'>
        <article className='rounded-2xl border border-[#64748B]/15 bg-white p-5 shadow-lg shadow-slate-900/5'>
          <header className='mb-4 flex items-center justify-between text-base font-semibold text-[#1E293B]'>
            <p>Trip Statistics</p>
          </header>
          <div className='mb-2 rounded-xl border border-[#64748B]/15 '>
            <div className='grid grid-cols-[44px_1fr] gap-3'>
              <div className='relative h-60'>
                {tripLevels.map((level, index) => (
                  <span
                    key={level}
                    className='absolute right-0 -translate-y-1/2 text-xs text-[#64748B]'
                    style={{ top: `${(index / (tripLevels.length - 1)) * 100}%` }}
                  >
                    {level}
                  </span>
                ))}
              </div>

              <div>
                <div className='relative h-60 border-l border-b border-[#64748B]/50'>
                  {tripLevels.map((_, index) => (
                    <div
                      key={index}
                      className='absolute left-0 right-0 border-t border-dashed border-[#64748B]/25'
                      style={{ top: `${(index / (tripLevels.length - 1)) * 100}%` }}
                    />
                  ))}

                  <div className='absolute inset-0 grid grid-cols-5 gap-6 px-4 pt-4'>
                    {(tripBars.length ? tripBars : [{ label: 'N/A', value: 0, status: 'Pending' }]).map((bar) => (
                      <div key={bar.label} className='relative flex h-full items-end justify-center'>
                        <div
                          className='w-6 rounded-t-sm'
                          style={{
                            height: `${(bar.value / maxTripValue) * 100}%`,
                            backgroundColor: tripStatusColors[bar.status] || tripStatusColors.Pending
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className='mt-2 grid grid-cols-5 gap-6 px-4 text-center text-xs text-[#64748B]'>
                  {(tripBars.length ? tripBars : [{ label: 'N/A', value: 0, status: 'Pending' }]).map((bar) => (
                    <p key={bar.label} className='m-0 truncate'>
                      {bar.label}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className='flex items-center justify-center gap-5 p-4 text-sm'>
              <span className='inline-flex items-center gap-1 text-[#10B981]'>
                <span className='h-3 w-3 bg-[#10B981]' />
                Completed
              </span>
              <span className='inline-flex items-center gap-1 text-[#64748B]'>
                <span className='h-3 w-3 bg-[#64748B]' />
                Ongoing
              </span>
              <span className='inline-flex items-center gap-1 text-[#F59E0B]'>
                <span className='h-3 w-3 bg-[#F59E0B]' />
                Pending
              </span>
            </div>
          </div>
        </article>

        <article className='rounded-2xl border border-[#64748B]/15 bg-white p-5 shadow-lg shadow-slate-900/5'>
          <header className='mb-4 flex items-center justify-between text-base font-semibold text-[#1E293B]'>
            <p>Fuel Usage & Costs</p>
          </header>
          <div className='rounded-xl border border-[#64748B]/15 p-4'>
            <div className='grid grid-cols-[36px_1fr_36px] gap-2'>
              <div className='relative h-56'>
                {yAxisCostLevels.map((level, index) => (
                  <span
                    key={level}
                    className='absolute right-0 -translate-y-1/2 text-xs text-[#64748B]'
                    style={{ top: `${(index / (yAxisCostLevels.length - 1)) * 100}%` }}
                  >
                    {level}
                  </span>
                ))}
              </div>

              <div>
                <div className='relative h-56 border-x border-b border-[#64748B]/50'>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <div
                      key={`h-${index}`}
                      className='absolute left-0 right-0 border-t border-dashed border-[#64748B]/25'
                      style={{ top: `${(index / 4) * 100}%` }}
                    />
                  ))}
                  {[1, 2, 3].map((index) => (
                    <div
                      key={`v-${index}`}
                      className='absolute bottom-0 top-0 border-l border-dashed border-[#64748B]/25'
                      style={{ left: `${(index / 4) * 100}%` }}
                    />
                  ))}

                  {fuelPoints.length > 0 ? (
                    <svg
                      viewBox={`0 0 ${fuelChartWidth} ${fuelChartHeight}`}
                      aria-hidden='true'
                      className='absolute inset-0 h-full w-full'
                      preserveAspectRatio='none'
                    >
                      <path d={fuelCostPath} fill='none' stroke='#EF4444' strokeWidth='3' />
                      <path d={fuelLitersPath} fill='none' stroke='#8B5CF6' strokeWidth='3' />

                      {fuelCostPoints.map((point, index) => (
                        <circle key={`cost-${fuelPoints[index].label}`} cx={point.x} cy={point.y} r='4' fill='white' stroke='#EF4444' strokeWidth='2' />
                      ))}
                      {fuelLitersPoints.map((point, index) => (
                        <circle
                          key={`liters-${fuelPoints[index].label}`}
                          cx={point.x}
                          cy={point.y}
                          r='4'
                          fill='white'
                          stroke='#8B5CF6'
                          strokeWidth='2'
                        />
                      ))}
                    </svg>
                  ) : (
                    <div className='grid h-full place-items-center text-sm text-[#64748B]'>No fuel data</div>
                  )}
                </div>

                <div className='mt-2 grid grid-cols-7 text-center text-xs text-[#64748B]'>
                  {(fuelPoints.length ? fuelPoints : [{ label: '' }]).map((point, index) => (
                    <p key={`${point.label}-${index}`} className='m-0'>
                      {xAxisVisibleLabels.has(point.label) ? point.label : ''}
                    </p>
                  ))}
                </div>
              </div>

              <div className='relative h-56'>
                {yAxisLitersLevels.map((level, index) => (
                  <span
                    key={level}
                    className='absolute left-0 -translate-y-1/2 text-xs text-[#64748B]'
                    style={{ top: `${(index / (yAxisLitersLevels.length - 1)) * 100}%` }}
                  >
                    {level}
                  </span>
                ))}
              </div>
            </div>

            <div className='mt-4 flex items-center justify-center gap-5 text-sm'>
              <span className='inline-flex items-center gap-1 text-[#EF4444]'>
                <span className='h-2.5 w-2.5 rounded-full bg-[#EF4444]' />
                Cost
              </span>
              <span className='inline-flex items-center gap-1 text-[#8B5CF6]'>
                <span className='h-2.5 w-2.5 rounded-full bg-[#8B5CF6]' />
                Liters
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className='rounded-2xl border border-[#64748B]/15 bg-white p-5 shadow-lg shadow-slate-900/5'>
        <header className='mb-4 text-base font-semibold text-[#1E293B]'>
          <p>Quick Stats</p>
        </header>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className='rounded-xl bg-gradient-to-b from-white to-[#64748B]/5 p-4 text-center shadow-[inset_0_0_0_1px_rgba(100,116,139,0.15)]'
              >
              <p className='m-0 text-xl font-bold text-[#1E293B] sm:text-2xl'>{stat.value}</p>
              <small className='text-[#64748B]'>{stat.label}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
