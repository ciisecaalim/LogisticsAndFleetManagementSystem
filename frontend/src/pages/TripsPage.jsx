import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { downloadCsv, parseCsv } from '../utils/csv';

const TRIPS_CACHE_KEY = 'lfms_trips';
const TRIP_STATUS_OPTIONS = ['Completed', 'Ongoing', 'Pending'];
const EMPTY_TRIP_FORM = {
  vehicle: '',
  driver: '',
  from: '',
  to: '',
  date: new Date().toISOString().slice(0, 10),
  distanceValue: '',
  distanceUnit: 'km',
  status: 'Pending'
};

const DISTANCE_UNITS = ['km', 'm', 'mi'];
const STATUS_PRIORITY = {
  Pending: 1,
  Ongoing: 2,
  Completed: 3
};

function getCachedTrips() {
  try {
    const cached = localStorage.getItem(TRIPS_CACHE_KEY);
    if (!cached) {
      return [];
    }

    const parsed = JSON.parse(cached);
    return parsed.map((item) => ({
      ...item,
      distanceUnit: item.distanceUnit || 'km'
    }));
  } catch {
    return [];
  }
}

function saveTripsToCache(list) {
  localStorage.setItem(TRIPS_CACHE_KEY, JSON.stringify(list));
}

function splitDistanceValue(rawDistance, fallbackUnit = 'km') {
  if (rawDistance === null || rawDistance === undefined || rawDistance === '') {
    return { value: '', unit: fallbackUnit };
  }

  if (typeof rawDistance === 'number') {
    return { value: String(rawDistance), unit: fallbackUnit };
  }

  const text = String(rawDistance).trim();
  const valueMatch = text.match(/[\d.]+/);
  const unitMatch = text.match(/[a-zA-Z]+/);

  return {
    value: valueMatch ? valueMatch[0] : '',
    unit: unitMatch ? unitMatch[0].toLowerCase() : fallbackUnit
  };
}

function formatDistanceDisplay(trip) {
  if (!trip || trip.distance === null || trip.distance === undefined || trip.distance === '') {
    return '—';
  }

  const value = Number(trip.distance);
  const unit = trip.distanceUnit || 'km';
  if (Number.isNaN(value)) {
    return `${trip.distance} ${unit}`.trim();
  }

  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
}

function readCache(key) {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function saveCache(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function getStatusClass(status) {
  if (status === 'Completed') {
    return 'bg-[#10B981]/20 text-[#047857]';
  }

  if (status === 'Ongoing') {
    return 'bg-[#64748B]/20 text-[#1D4ED8]';
  }

  return 'bg-[#F59E0B]/20 text-[#92400E]';
}

export default function TripsPage() {
  const [trips, setTrips] = useState(getCachedTrips);
  const [loading, setLoading] = useState(trips.length === 0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState(EMPTY_TRIP_FORM);
  const [saving, setSaving] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState(() => readCache('lfms_trips_vehicles'));
  const [availableDrivers, setAvailableDrivers] = useState(() => readCache('lfms_trips_drivers'));

  useEffect(() => {
    let isMounted = true;

    async function loadTrips() {
      setLoading(true);

      try {
        const data = await api.getTrips();

        if (isMounted && Array.isArray(data)) {
          const normalized = data.map((item) => ({ ...item, distanceUnit: item.distanceUnit || 'km' }));
          setTrips(normalized);
          saveTripsToCache(normalized);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Backend unavailable. Showing cached trips.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadReferences() {
      try {
        const [vehiclesData, driversData] = await Promise.all([api.getVehicles(), api.getDrivers()]);

        if (!isMounted) {
          return;
        }

        if (Array.isArray(vehiclesData) && vehiclesData.length) {
          setAvailableVehicles(vehiclesData);
          saveCache('lfms_trips_vehicles', vehiclesData);
        }

        if (Array.isArray(driversData) && driversData.length) {
          setAvailableDrivers(driversData);
          saveCache('lfms_trips_drivers', driversData);
        }
      } catch {
        /* fallback to cached lists */
      }
    }

    loadReferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const vehicleOptions = useMemo(
    () =>
      availableVehicles
        .map((vehicle) => {
          const value = vehicle.plateNumber || vehicle.id || vehicle._id || '';
          if (!value) {
            return null;
          }

          return {
            value,
            label: vehicle.plateNumber ? `${vehicle.plateNumber} • ${vehicle.model || 'Vehicle'}` : vehicle.model || value
          };
        })
        .filter(Boolean),
    [availableVehicles]
  );

  const vehicleLookup = useMemo(() => {
    const map = {};
    availableVehicles.forEach((vehicle) => {
      const keys = [
        vehicle.id,
        vehicle._id,
        vehicle.plateNumber,
        vehicle.model,
        `${vehicle.plateNumber || vehicle.model || ''}-${vehicle.driver || ''}`.trim()
      ];

      keys.forEach((key) => {
        if (key) {
          map[String(key)] = vehicle;
        }
      });
    });
    return map;
  }, [availableVehicles]);

  function resolveVehicleLabel(trip) {
    const directName = trip.vehicleName || trip.vehicleLabel || trip.modelName;
    if (directName) {
      return directName;
    }

    const referenceKeys = [
      trip.vehicle,
      trip.vehicleId,
      trip.plateNumber,
      trip.model,
      trip.vehicle?.id,
      trip.vehicle?.plateNumber
    ]
      .filter(Boolean)
      .map((key) => String(key));

    for (const key of referenceKeys) {
      const lookup = vehicleLookup[key];
      if (lookup) {
        return lookup.plateNumber || lookup.model || lookup.name || key;
      }
    }

    if (typeof trip.vehicle === 'object' && trip.vehicle !== null) {
      return trip.vehicle.name || trip.vehicle.plateNumber || trip.vehicle.model || '—';
    }

    return referenceKeys[0] || String(trip.vehicle || '—');
  }

  const driverOptions = useMemo(
    () =>
      availableDrivers
        .map((driver) => {
          const value = driver.name || driver._id || driver.id || '';

          if (!value) {
            return null;
          }

          return {
            value,
            label: driver.name || `Driver ${value}`
          };
        })
        .filter(Boolean),
    [availableDrivers]
  );

  const filteredTrips = useMemo(
    () => (statusFilter === 'All' ? trips : trips.filter((trip) => trip.status === statusFilter)),
    [statusFilter, trips]
  );

  const tripStatusColors = {
    Completed: '#10B981',
    Ongoing: '#2563EB',
    Pending: '#F59E0B'
  };
  const TRIP_CHART_WIDTH = 640;
  const TRIP_CHART_HEIGHT = 240;
  const TRIP_CHART_PADDING = 30;

  const tripBars = useMemo(() => {
    const grouped = {};

    filteredTrips.forEach((trip) => {
      const dateKey = trip.date || new Date().toISOString().slice(0, 10);

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          label: dateKey,
          value: 0,
          status: trip.status || 'Pending'
        };
      }

      grouped[dateKey].value += 1;
      const existingPriority = STATUS_PRIORITY[grouped[dateKey].status] || 0;
      const incomingPriority = STATUS_PRIORITY[trip.status] || 0;

      if (incomingPriority >= existingPriority) {
        grouped[dateKey].status = trip.status || 'Pending';
      }
    });

    return Object.values(grouped).sort((a, b) => new Date(a.label) - new Date(b.label));
  }, [trips]);

  const uniqueStores = useMemo(() => {
    const names = new Set();
    trips.forEach((trip) => {
      if (trip.from) {
        names.add(trip.from);
      }
      if (trip.to) {
        names.add(trip.to);
      }
    });
    return names.size;
  }, [trips]);

  const totalSpending = useMemo(() => {
    return trips.reduce((sum, trip) => sum + (Number(trip.spending) || 0), 0);
  }, [trips]);

  const completedCount = useMemo(() => trips.filter((trip) => trip.status === 'Completed').length, [trips]);
  const ongoingCount = useMemo(() => trips.filter((trip) => trip.status === 'Ongoing').length, [trips]);
  const tripSummaryBoxes = [
    { label: 'Tracked Stores', value: uniqueStores, accent: 'emerald' },
    {
      label: 'Total Spending',
      value: `$${totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      accent: 'amber'
    },
    { label: 'Completed Trips', value: completedCount, accent: 'emerald' },
    { label: 'Ongoing Trips', value: ongoingCount, accent: 'blue' }
  ];

  const maxTripValue = Math.max(...tripBars.map((bar) => bar.value), 1);
  const tripLevels = [
    maxTripValue,
    Math.ceil((maxTripValue * 0.75) || 0),
    Math.ceil((maxTripValue * 0.5) || 0),
    Math.ceil((maxTripValue * 0.25) || 0),
    0
  ];
  const hasTripStats = tripBars.length > 0 && tripBars.some((bar) => bar.value > 0);
  const chartBarCount = tripBars.length;
  const chartInnerHeight = TRIP_CHART_HEIGHT - TRIP_CHART_PADDING * 2;
  const barWidth = chartBarCount
    ? Math.min(84, Math.max(chartInnerHeight / 2, 32))
    : 32;
  const gap = chartBarCount > 0 ? Math.min(24, Math.max(barWidth * 0.4, 10)) : 0;
  const chartBarsWithPosition = chartBarCount
    ? tripBars.map((bar, index) => {
        const height = (bar.value / maxTripValue) * chartInnerHeight;
        const y = TRIP_CHART_PADDING + chartInnerHeight - height;
        const x = TRIP_CHART_PADDING + gap + index * (barWidth + gap);
        return {
          ...bar,
          height,
          y,
          x,
          color: tripStatusColors[bar.status] || tripStatusColors.Pending
        };
      })
    : [];
  const computedChartWidth = chartBarCount
    ? TRIP_CHART_PADDING * 2 + gap + chartBarCount * (barWidth + gap)
    : TRIP_CHART_WIDTH;
  const svgWidth = Math.max(computedChartWidth, TRIP_CHART_WIDTH / 2, TRIP_CHART_PADDING * 2 + barWidth + gap);
  const statsSection = (
    <article className='rounded-[36px] border border-[#dce2f0] bg-white px-6 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]'>
      <h2 className='text-xl font-semibold text-[#1E293B]'>Trip Statistics</h2>
      <div className='mt-5 rounded-[26px] border border-dashed border-[#dce2f0] bg-white/70 p-6 shadow-sm'>
        <div className='relative h-[260px] w-full overflow-hidden'>
          <svg
            viewBox={`0 0 ${svgWidth} ${TRIP_CHART_HEIGHT}`}
            preserveAspectRatio='none'
            className='h-full w-full'
          >
            {tripLevels.map((level) => {
              const normalized = level / maxTripValue;
              const y = TRIP_CHART_PADDING + chartInnerHeight - normalized * chartInnerHeight;

              return (
                <line
                  key={`grid-${level}`}
                  x1={TRIP_CHART_PADDING}
                  x2={svgWidth - TRIP_CHART_PADDING}
                  y1={y}
                  y2={y}
                  stroke='#d7dde7'
                  strokeWidth={1}
                  strokeDasharray='4'
                />
              );
            })}

            {chartBarsWithPosition.map((bar) => (
              <rect
                key={`${bar.label}-${bar.status}`}
                x={bar.x}
                y={bar.y}
                width={barWidth}
                height={Math.max(bar.height, 4)}
                rx={8}
                fill={bar.color}
              />
            ))}

            {chartBarsWithPosition.map((bar) => (
              <text
                key={`label-${bar.label}-${bar.status}`}
                x={bar.x + barWidth / 2}
                y={TRIP_CHART_HEIGHT - 8}
                textAnchor='middle'
                fontSize='12'
                fill='#64748B'
              >
                {bar.label}
              </text>
            ))}

            {!hasTripStats ? (
              <text
                x={TRIP_CHART_WIDTH / 2}
                y={TRIP_CHART_HEIGHT / 2}
                textAnchor='middle'
                fontSize='13'
                fill='#64748B'
              >
                Add trips to populate the statistics.
              </text>
            ) : null}
          </svg>
        </div>
      </div>
      {hasTripStats ? (
        <div className='mt-4 flex items-center justify-center gap-8 text-xs font-semibold text-[#1E293B]'>
          <span className='flex items-center gap-2 text-[#10B981]'>
            <span className='h-2.5 w-2.5 rounded-full bg-[#10B981]' />
            Completed
          </span>
          <span className='flex items-center gap-2 text-[#2563EB]'>
            <span className='h-2.5 w-2.5 rounded-full bg-[#2563EB]' />
            Ongoing
          </span>
          <span className='flex items-center gap-2 text-[#F59E0B]'>
            <span className='h-2.5 w-2.5 rounded-full bg-[#F59E0B]' />
            Pending
          </span>
        </div>
      ) : null}
    </article>
  );

  function openAddForm() {
    setFormMode('add');
    setEditingId('');
    setFormData(EMPTY_TRIP_FORM);
    setError('');
  }

  function openEditForm(trip) {
    const tripId = trip._id || trip.id;

    if (!tripId) {
      setError('Trip needs backend id for editing.');
      return;
    }

    setFormMode('edit');
    setEditingId(tripId);
    const currentDistance = splitDistanceValue(trip.distance, trip.distanceUnit || 'km');
    setFormData({
      vehicle: trip.vehicle || '',
      driver: trip.driver || '',
      from: trip.from || '',
      to: trip.to || '',
      date: trip.date || new Date().toISOString().slice(0, 10),
      distanceValue: currentDistance.value,
      distanceUnit: currentDistance.unit,
      status: trip.status || 'Pending'
    });
    setError('');
  }

  function closeForm() {
    setFormMode(null);
    setEditingId('');
    setFormData(EMPTY_TRIP_FORM);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSave() {
    if (!formData.vehicle.trim() || !formData.driver.trim() || !formData.from.trim() || !formData.to.trim()) {
      setError('Please fill all required fields.');
      return;
    }

    const distanceValue = Number(formData.distanceValue);

    if (!formData.distanceValue || Number.isNaN(distanceValue)) {
      setError('Distance must be a number.');
      return;
    }

    setSaving(true);

    const payload = {
      vehicle: formData.vehicle.trim(),
      driver: formData.driver.trim(),
      from: formData.from.trim(),
      to: formData.to.trim(),
      date: formData.date || new Date().toISOString().slice(0, 10),
      distance: distanceValue,
      status: formData.status,
      distanceUnit: formData.distanceUnit || 'km'
    };

    try {
      if (formMode === 'add') {
        const created = await api.createTrip(payload);
        const stamped = { ...created, distanceUnit: payload.distanceUnit };
        const next = [stamped, ...trips];
        setTrips(next);
        saveTripsToCache(next);
      } else if (formMode === 'edit' && editingId) {
        const updated = await api.updateTrip(editingId, payload);
        const stamped = { ...updated, distanceUnit: payload.distanceUnit };
        const next = trips.map((item) => ((item._id || item.id) === editingId ? stamped : item));
        setTrips(next);
        saveTripsToCache(next);
      }

      setError('');
      closeForm();
    } catch {
      setError('Save failed. Check backend server.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(trip) {
    const tripId = trip._id || trip.id;

    if (!tripId) {
      setError('Trip needs backend id for deletion.');
      return;
    }

    try {
      await api.deleteTrip(tripId);
      const next = trips.filter((item) => (item._id || item.id) !== tripId);
      setTrips(next);
      saveTripsToCache(next);
      setError('');
    } catch {
      setError('Delete failed. Check backend server.');
    }
  }

  return (
    <section className='space-y-6'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='page-title m-0 text-3xl font-bold tracking-tight sm:text-4xl'>Trips</h1>
          <p className='mt-1 text-base font-medium text-[#1E293B] sm:text-lg'>Manage and track all trips</p>
        </div>

      <div className='flex flex-wrap items-center gap-3'>
        <div className='flex flex-wrap items-center gap-2'>
            <button
              type='button'
              onClick={() =>
                downloadCsv({
                  columns: [
                    { key: 'vehicle', label: 'Vehicle' },
                    { key: 'driver', label: 'Driver' },
                    { key: 'from', label: 'From' },
                    { key: 'to', label: 'To' },
                    { key: 'date', label: 'Date' },
                    { key: 'distance', label: 'Distance' },
                    { key: 'status', label: 'Status' }
                  ],
                data: statusFilter === 'All' ? trips : trips.filter((trip) => trip.status === statusFilter),
                  filename:
                    exportFilter === 'All'
                      ? 'trips.csv'
                      : `trips-${exportFilter.toLowerCase().replace(/\s+/g, '-')}.csv`
                })
              }
              className='inline-flex items-center gap-2 rounded-xl border border-[#64748B]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B]'
            >
              Export CSV
            </button>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='inline-flex items-center gap-2 rounded-xl border border-[#64748B]/20 bg-[#f1f5f9] px-4 py-2 text-sm font-semibold text-[#1E293B]'
            >
              Import CSV
            </button>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className='rounded-xl border border-[#64748B]/25 bg-white px-3 py-2 text-sm text-[#1E293B]'
              >
                <option value='All'>All statuses</option>
              {TRIP_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              ref={fileInputRef}
              type='file'
              accept='.csv'
              className='hidden'
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                try {
                  setError('');
                const text = await file.text();
                const rows = parseCsv(text, [
                  { key: 'vehicle', label: 'Vehicle' },
                  { key: 'driver', label: 'Driver' },
                  { key: 'from', label: 'From' },
                  { key: 'to', label: 'To' },
                  { key: 'date', label: 'Date' },
                  { key: 'distance', label: 'Distance' },
                  { key: 'status', label: 'Status' }
                ]);
                const created = await Promise.all(
                  rows.map((row) => {
                    const parsedDistance = splitDistanceValue(row.distance, 'km');
                    const payload = {
                      ...row,
                      date: row.date || new Date().toISOString().slice(0, 10),
                      distance: Number(parsedDistance.value) || 0,
                      status: row.status || 'Pending',
                      distanceUnit: parsedDistance.unit
                    };

                    return api.createTrip(payload).then((saved) => ({ ...saved, distanceUnit: payload.distanceUnit }));
                  })
                );
                const next = [...created, ...trips];
                setTrips(next);
                saveTripsToCache(next);
                } catch {
                  setError('CSV import failed. Check the file format.');
                } finally {
                  event.target.value = '';
                }
              }}
            />
          </div>
          <div className='ml-auto flex items-center'>
            <button
              type='button'
              onClick={openAddForm}
              className='inline-flex items-center gap-2 rounded-xl bg-[#020617] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#1E293B]'
            >
              <Plus size={18} strokeWidth={2.4} />
              Create Trip
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <p className='rounded-xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-4 py-2 text-sm text-[#92400E]'>{error}</p>
      ) : null}

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {tripSummaryBoxes.map((box) => (
          <article
            key={box.label}
            className={`rounded-2xl border border-[#64748B]/20 bg-white p-4 shadow-lg shadow-slate-900/5`}
          >
            <p className='text-xs font-semibold uppercase tracking-[0.3em] text-[#64748B]'>{box.label}</p>
            <p className={`mt-2 text-3xl font-extrabold ${box.accent === 'emerald' ? 'text-[#10B981]' : box.accent === 'amber' ? 'text-[#F59E0B]' : 'text-[#2563EB]'}`}>
              {box.value}
            </p>
          </article>
        ))}
      </div>

      {formMode ? (
        <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-[#1E293B]'>{formMode === 'add' ? 'Add Trip' : 'Update Trip'}</h2>
            <button type='button' onClick={closeForm} className='text-[#1E293B]'>
              <X size={18} />
            </button>
          </div>
          <form className='mt-4 grid gap-4 md:grid-cols-2'>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Vehicle
              <select
                name='vehicle'
                value={formData.vehicle}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2 bg-white'
                required
              >
                <option value='' disabled>
                  Select a vehicle
                </option>
                {vehicleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Driver
              <select
                name='driver'
                value={formData.driver}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2 bg-white'
                required
              >
                <option value='' disabled>
                  Select a driver
                </option>
                {driverOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              From
              <input
                name='from'
                value={formData.from}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              To
              <input
                name='to'
                value={formData.to}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Date
              <input
                name='date'
                type='date'
                value={formData.date}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Distance
              <div className='flex items-center gap-2'>
                <input
                  name='distanceValue'
                  type='number'
                  min='0'
                  step='0.1'
                  value={formData.distanceValue}
                  onChange={handleFormChange}
                  className='flex-1 rounded-lg border border-[#64748B]/25 px-3 py-2'
                  required
                />
                <select
                  name='distanceUnit'
                  value={formData.distanceUnit}
                  onChange={handleFormChange}
                  className='rounded-lg border border-[#64748B]/25 bg-white px-3 py-2 text-sm text-[#1E293B]'
                >
                  {DISTANCE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Status
              <select
                name='status'
                value={formData.status}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
              >
                {TRIP_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className='md:col-span-2 flex items-center gap-3'>
              <button
                type='button'
                onClick={handleSave}
                disabled={saving}
                className='rounded-xl bg-[#020617] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:opacity-60'
              >
                {saving ? 'Saving...' : formMode === 'add' ? 'Create Trip' : 'Update Trip'}
              </button>
              <button
                type='button'
                onClick={closeForm}
                className='rounded-xl border border-[#64748B]/25 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E293B]'
              >
                Cancel
              </button>
            </div>
          </form>
        </article>
      ) : null}

      {statsSection}

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <h2 className='m-0 text-xl font-semibold text-[#1E293B]'>All Trips</h2>

        <div className='mt-6 overflow-x-auto'>
          <div className='min-w-280'>
            <div className='grid grid-cols-[1.8fr_0.9fr_1.4fr_0.9fr_0.7fr_0.8fr_0.8fr] border-b border-[#64748B]/20 px-3 py-3 text-left text-sm font-semibold text-[#1E293B] lg:text-base'>
              <div>Vehicle</div>
              <div>Driver</div>
              <div>Route</div>
              <div>Date</div>
              <div>Distance</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {loading && trips.length === 0 ? <p className='px-3 py-5 text-sm text-[#64748B]'>Loading trips...</p> : null}
            {!loading && trips.length === 0 ? <p className='px-3 py-5 text-sm text-[#64748B]'>No trips found.</p> : null}

            {trips.map((trip) => (
              <div
                key={trip._id || trip.id || `${trip.vehicle}-${trip.date}`}
                className='grid grid-cols-[1.8fr_0.9fr_1.4fr_0.9fr_0.7fr_0.8fr_0.8fr] border-b border-[#64748B]/20 px-3 py-4'
              >
                <div className='text-sm font-semibold text-[#1E293B] lg:text-base'>{resolveVehicleLabel(trip)}</div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{trip.driver}</div>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2 text-sm text-[#1E293B] lg:text-base'>
                    <MapPin size={16} className='text-[#10B981]' />
                    {trip.from}
                  </div>
                  <div className='text-sm text-[#64748B] lg:text-base'>→ {trip.to}</div>
                </div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{trip.date}</div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{formatDistanceDisplay(trip)}</div>
                <div>
                  <span className={`inline-flex rounded-xl px-3 py-1 text-sm font-semibold lg:text-base ${getStatusClass(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>
                <div className='flex items-center gap-3'>
                  <button
                    type='button'
                    onClick={() => openEditForm(trip)}
                    aria-label={`Edit ${trip.vehicle}`}
                    className='text-[#1E293B] transition hover:text-[#64748B]'
                  >
                    <Pencil size={21} />
                  </button>
                  <button
                    type='button'
                    onClick={() => handleDelete(trip)}
                    aria-label={`Delete ${trip.vehicle}`}
                    className='text-red-500 transition hover:text-red-600'
                  >
                    <Trash2 size={21} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}
