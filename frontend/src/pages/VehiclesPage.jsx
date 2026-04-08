import {
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Fuel,
  MapPinned,
  Pencil,
  Plus,
  Route,
  Search,
  Trash2,
  Truck,
  Upload,
  Users,
  Download,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { downloadCsv, parseCsv } from '../utils/csv';
import StatsBanner from '../components/StatsBanner';
import useEntityCounts from '../hooks/useEntityCounts';
import StatsBanner from '../components/StatsBanner';
import useEntityCounts from '../hooks/useEntityCounts';

const VEHICLES_CACHE_KEY = 'lfms_vehicles';
const PAGE_SIZE = 8;
const VEHICLE_STATUS_OPTIONS = ['All', 'Active', 'In Maintenance', 'Idle'];
const VEHICLE_TYPE_OPTIONS = ['Car', 'Bus', 'Van', 'Moto', 'Truck'];
const VEHICLE_TYPE_FILTER_OPTIONS = ['All', ...VEHICLE_TYPE_OPTIONS];
const VEHICLE_TYPE_LOOKUP = {
  truck: 'Truck',
  moto: 'Moto',
  motor: 'Moto',
  motorcycle: 'Moto',
  bike: 'Moto',
  van: 'Van',
  bus: 'Bus',
  car: 'Car'
};

const emptyForm = {
  plateNumber: '',
  brand: '',
  model: '',
  type: '',
  year: new Date().getFullYear(),
  status: 'Active'
};

const vehicleColumns = [
  { key: 'plateNumber', label: 'Plate Number' },
  { key: 'brand', label: 'Brand' },
  { key: 'model', label: 'Model' },
  { key: 'type', label: 'Type' },
  { key: 'year', label: 'Year', parse: (value) => Number(value) || new Date().getFullYear() },
  { key: 'status', label: 'Status' }
];

const SUMMARY_STATS = [
  { key: 'vehicles', label: 'Total Vehicles', helper: 'Active fleet units', icon: Truck, tone: 'slate' },
  { key: 'trips', label: 'Active Trips', helper: 'Routes in motion', icon: Route, tone: 'emerald' },
  { key: 'drivers', label: 'Total Drivers', helper: 'On rotation', icon: Users, tone: 'amber' },
  { key: 'fuel', label: 'Fuel Expenses', helper: 'This month', icon: Fuel, tone: 'slate' }
];

function getCachedVehicles() {
  try {
    const cached = localStorage.getItem(VEHICLES_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function saveVehiclesToCache(list) {
  localStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(list));
}

function getVehicleKey(vehicle) {
  return vehicle._id || vehicle.id || vehicle.plateNumber;
}

function normalizePlateNumber(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizeVehicleType(type) {
  const key = String(type || '')
    .trim()
    .toLowerCase();
  return VEHICLE_TYPE_LOOKUP[key] || '';
}

function getGpsStatus(lastUpdate) {
  const timestamp = new Date(lastUpdate || 0).getTime();

  if (Number.isNaN(timestamp) || timestamp <= 0) {
    return 'Offline';
  }

  return Date.now() - timestamp < 60 * 1000 ? 'Online' : 'Offline';
}

function getStatusClass(status) {
  if (status === 'Active') {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  }

  if (status === 'In Maintenance') {
    return 'bg-amber-100 text-amber-700 border border-amber-200';
  }

  return 'bg-slate-100 text-slate-700 border border-slate-200';
}

function getNormalizedVehicles(list) {
  return list.map((vehicle) => ({
    ...vehicle,
    brand: vehicle.brand || vehicle.make || 'Unknown',
    model: vehicle.model || 'Unknown',
    type: normalizeVehicleType(vehicle.type),
    status: vehicle.status || 'Idle',
    year: Number(vehicle.year) || new Date().getFullYear(),
    gpsOnline: typeof vehicle.gpsOnline === 'boolean' ? vehicle.gpsOnline : false
  }));
}

export default function VehiclesPage() {
  const { counts, loading: statsLoading, error: statsError } = useEntityCounts();
  const statsItems = useMemo(
    () =>
      SUMMARY_STATS.map((item) => ({
        ...item,
        value: statsLoading ? '—' : counts[item.key]
      })),
    [counts, statsLoading]
  );
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState(() => getNormalizedVehicles(getCachedVehicles()));
  const { counts, loading: statsLoading, error: statsError } = useEntityCounts();
  const statsItems = useMemo(
    () =>
      SUMMARY_STATS.map((item) => {
        if (item.key === 'fuel') {
          return { ...item, value: statsLoading ? '—' : '$0.00' };
        }

        return {
          ...item,
          value: statsLoading ? '—' : counts[item.key]
        };
      }),
    [counts, statsLoading]
  );
  const [mapVehicles, setMapVehicles] = useState([]);
  const [loading, setLoading] = useState(vehicles.length === 0);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);

      try {
        const [vehicleData, mapData] = await Promise.allSettled([
          api.getVehicles(),
          api.getMapVehicles()
        ]);

        if (!isMounted) {
          return;
        }

        if (vehicleData.status === 'fulfilled' && Array.isArray(vehicleData.value)) {
          const normalized = getNormalizedVehicles(vehicleData.value);
          setVehicles(normalized);
          saveVehiclesToCache(normalized);
          setError('');
        } else {
          setError('Backend unavailable. Showing cached vehicles.');
        }

        if (mapData.status === 'fulfilled' && Array.isArray(mapData.value)) {
          setMapVehicles(mapData.value);
        }
      } catch {
        if (isMounted) {
          setError('Data loading failed. Showing cached vehicles.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const refreshMapData = async () => {
      try {
        const data = await api.getMapVehicles();
        if (isMounted && Array.isArray(data)) {
          setMapVehicles(data);
        }
      } catch {
        // Keep existing map state when live refresh fails.
      }
    };

    const intervalId = window.setInterval(refreshMapData, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const vehicleStats = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter((v) => v.status === 'Active').length;
    const maintenance = vehicles.filter((v) => v.status === 'In Maintenance').length;
    const idle = vehicles.filter((v) => v.status === 'Idle').length;

    return { total, active, maintenance, idle };
  }, [vehicles]);

  const mapVehicleLookup = useMemo(() => {
    return mapVehicles.reduce((acc, item) => {
      const key = normalizePlateNumber(item.name || item.plateNumber);
      if (key) {
        acc[key] = item;
      }
      return acc;
    }, {});
  }, [mapVehicles]);

  const hasLiveGps = mapVehicles.length > 0;

  const filteredVehicles = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const byStatus = statusFilter === 'All' ? true : vehicle.status === statusFilter;
      const byType = typeFilter === 'All' ? true : vehicle.type === typeFilter;

      if (!byStatus || !byType) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const haystack = [
        vehicle.plateNumber,
        vehicle.brand,
        vehicle.model,
        vehicle.type,
        String(vehicle.year)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [vehicles, statusFilter, typeFilter, searchQuery]);

  const statusDistribution = useMemo(() => {
    const { active, maintenance, idle } = vehicleStats;
    const total = Math.max(1, active + maintenance + idle);

    return {
      active,
      maintenance,
      idle,
      total,
      activePct: Math.round((active / total) * 100),
      maintenancePct: Math.round((maintenance / total) * 100),
      idlePct: Math.round((idle / total) * 100)
    };
  }, [vehicleStats]);

  const typeDistribution = useMemo(() => {
    return VEHICLE_TYPE_OPTIONS.map((type) => ({
      type,
      count: vehicles.filter((vehicle) => normalizeVehicleType(vehicle.type) === type).length
    }));
  }, [vehicles]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const normalizedPage = Math.min(Math.max(page, 1), totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
    if (page < 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedVehicles = filteredVehicles.slice((normalizedPage - 1) * PAGE_SIZE, normalizedPage * PAGE_SIZE);

  const displayedVehicleKeys = paginatedVehicles.map((vehicle) => getVehicleKey(vehicle));

  const allDisplayedSelected =
    displayedVehicleKeys.length > 0 && displayedVehicleKeys.every((id) => selectedVehicleIds.includes(id));

  function openAddForm() {
    setFormMode('add');
    setEditingId('');
    setFormData(emptyForm);
    setError('');
  }

  function openEditForm(vehicle) {
    const rowId = vehicle._id || vehicle.id;

    if (!rowId) {
      setError('Edit requires backend id. Refresh from API first.');
      return;
    }

    setFormMode('edit');
    setEditingId(rowId);
    setFormData({
      plateNumber: vehicle.plateNumber || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      type: vehicle.type || '',
      year: vehicle.year || new Date().getFullYear(),
      status: vehicle.status || 'Idle'
    });
    setError('');
  }

  function closeForm() {
    setFormMode(null);
    setEditingId('');
    setFormData(emptyForm);
  }

  function onFormChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'year' ? Number(value) : value }));
  }

  async function handleSaveForm(event) {
    event.preventDefault();

    if (!formData.plateNumber.trim() || !formData.brand.trim() || !formData.model.trim() || !formData.type.trim()) {
      setError('Please fill all required vehicle fields.');
      return;
    }

    if (!formData.year || Number.isNaN(Number(formData.year))) {
      setError('Year is invalid.');
      return;
    }

    const normalizedType = normalizeVehicleType(formData.type);

    if (!normalizedType) {
      setError('Type must be one of: Truck, Moto, Van, Bus, Car.');
      return;
    }

    setSaving(true);

    try {
      if (formMode === 'add') {
        const created = await api.createVehicle({
          plateNumber: formData.plateNumber.trim(),
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          type: normalizedType,
          year: Number(formData.year),
          status: formData.status,
          lat: 0,
          lng: 0
        });

        const normalizedCreated = getNormalizedVehicles([created])[0];
        const next = [normalizedCreated, ...vehicles];
        setVehicles(next);
        saveVehiclesToCache(next);
      }

      if (formMode === 'edit') {
        const updated = await api.updateVehicle(editingId, {
          plateNumber: formData.plateNumber.trim(),
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          type: normalizedType,
          year: Number(formData.year),
          status: formData.status
        });

        const normalizedUpdated = getNormalizedVehicles([updated])[0];
        const next = vehicles.map((vehicle) =>
          (vehicle._id || vehicle.id) === editingId ? normalizedUpdated : vehicle
        );
        setVehicles(next);
        saveVehiclesToCache(next);
      }

      setError('');
      closeForm();
    } catch {
      setError('Save failed. Check backend server and required fields.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVehicle(vehicle) {
    const rowId = vehicle._id || vehicle.id;

    if (!rowId) {
      setError('Delete requires backend id. Refresh from API first.');
      return;
    }

    try {
      await api.deleteVehicle(rowId);
      const next = vehicles.filter((item) => (item._id || item.id) !== rowId);
      setVehicles(next);
      saveVehiclesToCache(next);
      setError('');
    } catch {
      setError('Delete failed. Check backend server.');
    }
  }

  return (
    <section className='space-y-6 pb-4'>
      <header className='rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-5 shadow-sm sm:p-6'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <p className='mb-1 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white'>
              <Car size={14} />
              Fleet Analytics
            </p>
            <h1 className='m-0 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl'>Vehicles Report</h1>
            <p className='mt-1 text-sm text-slate-600 sm:text-base'>
              Monitor vehicle health, assignment, and availability from one dashboard.
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
            <button
              type='button'
              onClick={() =>
                downloadCsv({
                  columns: vehicleColumns,
                  data: filteredVehicles,
                  filename:
                    statusFilter === 'All'
                      ? 'vehicles-report.csv'
                      : `vehicles-report-${statusFilter.toLowerCase().replace(/\s+/g, '-')}.csv`
                })
              }
              className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50'
            >
              <Download size={16} />
              Export CSV
            </button>

            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50'
            >
              <Upload size={16} />
              Import CSV
            </button>

            <button
              type='button'
              onClick={openAddForm}
              className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700'
            >
              <Plus size={16} />
              Add Vehicle
            </button>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400'
            >
              {VEHICLE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setPage(1);
              }}
              className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400'
            >
              {VEHICLE_TYPE_FILTER_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
          <div className='relative min-w-[220px] flex-1'>
            <Search size={16} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
              placeholder='Search plate, brand, model, type, year, driver...'
              className='w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400'
            />
          </div>

          {hasLiveGps ? (
            <div className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'>
              <span className='relative flex h-2.5 w-2.5'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75'></span>
                <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600'></span>
              </span>
              Live GPS Tracking ({mapVehicles.length})
            </div>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type='file'
          accept='.csv'
          className='hidden'
          onChange={async (event) => {
            const file = event.target.files?.[0];

            if (!file) {
              return;
            }

            try {
              setError('');
              const text = await file.text();
              const rows = parseCsv(text, vehicleColumns);
              const createdRows = await Promise.all(
                rows.map((row) =>
                  api.createVehicle({
                    ...row,
                    plateNumber: (row.plateNumber || '').trim(),
                    brand: (row.brand || '').trim(),
                    model: (row.model || '').trim(),
                    type: normalizeVehicleType(row.type) || 'Van',
                    year: Number(row.year) || new Date().getFullYear(),
                    lat: 0,
                    lng: 0
                  })
                )
              );

              const normalized = getNormalizedVehicles(createdRows);
              const next = [...normalized, ...vehicles];
              setVehicles(next);
              saveVehiclesToCache(next);
            } catch {
              setError('CSV import failed. Make sure your file format is valid.');
            } finally {
              event.target.value = '';
            }
          }}
        />
      </header>

      <StatsBanner items={statsItems} error={statsError} />

      <StatsBanner items={statsItems} error={statsError} />

      <section className='grid gap-4 xl:grid-cols-2'>
        <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
          <h2 className='m-0 text-lg font-semibold text-slate-900'>Vehicle Status Distribution</h2>
          <p className='mt-1 text-sm text-slate-500'>Pie chart by current vehicle availability status.</p>
          <div className='mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start'>
            <div
              className='h-44 w-44 rounded-full border border-slate-200 shadow-inner'
              style={{
                background: `conic-gradient(#10b981 0% ${statusDistribution.activePct}%, #f59e0b ${statusDistribution.activePct}% ${
                  statusDistribution.activePct + statusDistribution.maintenancePct
                }%, #94a3b8 ${statusDistribution.activePct + statusDistribution.maintenancePct}% 100%)`
              }}
            ></div>
            <div className='space-y-2 text-sm text-slate-700'>
              <p className='m-0 flex items-center gap-2'>
                <span className='inline-block h-2.5 w-2.5 rounded-full bg-emerald-500'></span>
                Active: {statusDistribution.active} ({statusDistribution.activePct}%)
              </p>
              <p className='m-0 flex items-center gap-2'>
                <span className='inline-block h-2.5 w-2.5 rounded-full bg-amber-500'></span>
                In Maintenance: {statusDistribution.maintenance} ({statusDistribution.maintenancePct}%)
              </p>
              <p className='m-0 flex items-center gap-2'>
                <span className='inline-block h-2.5 w-2.5 rounded-full bg-slate-400'></span>
                Idle: {statusDistribution.idle} ({statusDistribution.idlePct}%)
              </p>
            </div>
          </div>
        </article>

        <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
          <h2 className='m-0 text-lg font-semibold text-slate-900'>Vehicles By Type</h2>
          <p className='mt-1 text-sm text-slate-500'>Bar chart breakdown for Truck, Moto, Van, Bus, and Car fleet mix.</p>
          <div className='mt-5 space-y-4'>
            {typeDistribution.map((item) => {
              const maxValue = Math.max(1, ...typeDistribution.map((x) => x.count));
              const width = `${Math.round((item.count / maxValue) * 100)}%`;

              return (
                <div key={item.type}>
                  <div className='mb-1 flex items-center justify-between text-sm text-slate-700'>
                    <span>{item.type}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className='h-3 rounded-full bg-slate-100'>
                    <div className='h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500' style={{ width }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      {formMode ? (
        <section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='m-0 text-lg font-semibold text-slate-900'>
              {formMode === 'add' ? 'Add New Vehicle' : 'Update Vehicle'}
            </h2>
            <button
              type='button'
              onClick={closeForm}
              className='inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
            >
              <X size={15} />
              Close
            </button>
          </div>

          <form onSubmit={handleSaveForm} className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <label className='grid gap-1 text-sm text-slate-700'>
              Plate Number
              <input
                name='plateNumber'
                value={formData.plateNumber}
                onChange={onFormChange}
                className='rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-blue-400'
                required
              />
            </label>
            <label className='grid gap-1 text-sm text-slate-700'>
              Brand
              <input
                name='brand'
                value={formData.brand}
                onChange={onFormChange}
                className='rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-blue-400'
                required
              />
            </label>
            <label className='grid gap-1 text-sm text-slate-700'>
              Model
              <input
                name='model'
                value={formData.model}
                onChange={onFormChange}
                className='rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-blue-400'
                required
              />
            </label>
            <label className='grid gap-1 text-sm text-slate-700'>
              Type
              <select
                name='type'
                value={formData.type}
                onChange={onFormChange}
                className='rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-blue-400'
                required
              >
                <option value=''>Select type</option>
                {VEHICLE_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className='grid gap-1 text-sm text-slate-700'>
              Year
              <input
                name='year'
                type='number'
                value={formData.year}
                onChange={onFormChange}
                className='rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-blue-400'
                required
              />
            </label>
            <label className='grid gap-1 text-sm text-slate-700'>
              Status
              <select
                name='status'
                value={formData.status}
                onChange={onFormChange}
                className='rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-blue-400'
              >
                <option value='Active'>Active</option>
                <option value='In Maintenance'>In Maintenance</option>
                <option value='Idle'>Idle</option>
              </select>
            </label>
            <div className='md:col-span-2 xl:col-span-4 flex flex-wrap items-center gap-2'>
              <button
                type='submit'
                disabled={saving}
                className='rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {saving ? 'Saving...' : formMode === 'add' ? 'Create Vehicle' : 'Update Vehicle'}
              </button>
              <button
                type='button'
                onClick={closeForm}
                className='rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {error ? (
        <p className='rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700'>{error}</p>
      ) : null}

      <section className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='min-w-[1080px] w-full'>
            <thead className='bg-slate-50'>
              <tr className='text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'>
                <th className='px-4 py-3'>
                  <button
                    type='button'
                    aria-label='Select all rows on current page'
                    onClick={() => {
                      if (allDisplayedSelected) {
                        setSelectedVehicleIds((prev) => prev.filter((id) => !displayedVehicleKeys.includes(id)));
                        return;
                      }

                      setSelectedVehicleIds((prev) => {
                        const next = [...prev];
                        displayedVehicleKeys.forEach((id) => {
                          if (!next.includes(id)) {
                            next.push(id);
                          }
                        });
                        return next;
                      });
                    }}
                    className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                      allDisplayedSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <Check size={12} strokeWidth={3} />
                  </button>
                </th>
                <th className='px-4 py-3'>Plate Number</th>
                <th className='px-4 py-3'>Brand</th>
                <th className='px-4 py-3'>Model</th>
                <th className='px-4 py-3'>Type</th>
                <th className='px-4 py-3'>Year</th>
                <th className='px-4 py-3'>Status</th>
                <th className='px-4 py-3'>GPS</th>
                <th className='px-4 py-3'>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && vehicles.length === 0 ? (
                <tr>
                  <td className='px-4 py-8 text-sm text-slate-500' colSpan={9}>
                    Loading vehicles...
                  </td>
                </tr>
              ) : null}

              {!loading && filteredVehicles.length === 0 ? (
                <tr>
                  <td className='px-4 py-8 text-sm text-slate-500' colSpan={9}>
                    No vehicles match your current search/filter.
                  </td>
                </tr>
              ) : null}

              {paginatedVehicles.map((vehicle) => {
                const vehicleKey = getVehicleKey(vehicle);
                const selected = selectedVehicleIds.includes(vehicleKey);
                const mapVehicle = mapVehicleLookup[normalizePlateNumber(vehicle.plateNumber)];
                const gpsStatus = mapVehicle?.gpsStatus || getGpsStatus(mapVehicle?.lastUpdate);
                const isGpsOnline = gpsStatus === 'Online';

                return (
                  <tr key={vehicleKey} className='border-t border-slate-100 text-sm text-slate-700 transition hover:bg-slate-50'>
                    <td className='px-4 py-3'>
                      <button
                        type='button'
                        onClick={() =>
                          setSelectedVehicleIds((prev) =>
                            prev.includes(vehicleKey) ? prev.filter((id) => id !== vehicleKey) : [...prev, vehicleKey]
                          )
                        }
                        className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                          selected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {selected ? <Check size={12} strokeWidth={3} /> : null}
                      </button>
                    </td>
                    <td className='px-4 py-3 font-semibold text-slate-900'>{vehicle.plateNumber}</td>
                    <td className='px-4 py-3'>{vehicle.brand}</td>
                    <td className='px-4 py-3'>{vehicle.model}</td>
                    <td className='px-4 py-3'>{vehicle.type}</td>
                    <td className='px-4 py-3'>{vehicle.year}</td>
                    <td className='px-4 py-3'>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600'>
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            isGpsOnline ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        ></span>
                        {isGpsOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={() => navigate(`/fleet-map?plate=${encodeURIComponent(vehicle.plateNumber)}`)}
                          className='rounded-lg border border-blue-200 p-1.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700'
                          aria-label={`View ${vehicle.plateNumber} on map`}
                        >
                          <MapPinned size={16} />
                        </button>
                        <button
                          type='button'
                          onClick={() => setSelectedVehicle(vehicle)}
                          className='rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'
                          aria-label={`View details for ${vehicle.plateNumber}`}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type='button'
                          onClick={() => openEditForm(vehicle)}
                          className='rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'
                          aria-label={`Edit ${vehicle.plateNumber}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type='button'
                          onClick={() => handleDeleteVehicle(vehicle)}
                          className='rounded-lg border border-red-200 p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-600'
                          aria-label={`Delete ${vehicle.plateNumber}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className='flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3'>
          <p className='text-sm text-slate-600'>
            Page {normalizedPage} of {totalPages} - Showing {paginatedVehicles.length} of {filteredVehicles.length}
          </p>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={normalizedPage <= 1}
              className='inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
            >
              <ChevronLeft size={15} />
              Prev
            </button>
            <button
              type='button'
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={normalizedPage >= totalPages}
              className='inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {selectedVehicle ? (
        <div className='fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4'>
          <div className='w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='m-0 text-lg font-semibold text-slate-900'>Vehicle Details</h2>
              <button
                type='button'
                onClick={() => setSelectedVehicle(null)}
                className='rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50'
              >
                <X size={16} />
              </button>
            </div>

            <div className='grid grid-cols-2 gap-3 text-sm text-slate-700'>
              <p className='m-0 rounded-lg bg-slate-50 p-2'>
                <strong className='block text-slate-900'>Plate Number</strong>
                {selectedVehicle.plateNumber}
              </p>
              <p className='m-0 rounded-lg bg-slate-50 p-2'>
                <strong className='block text-slate-900'>Brand</strong>
                {selectedVehicle.brand}
              </p>
              <p className='m-0 rounded-lg bg-slate-50 p-2'>
                <strong className='block text-slate-900'>Model</strong>
                {selectedVehicle.model}
              </p>
              <p className='m-0 rounded-lg bg-slate-50 p-2'>
                <strong className='block text-slate-900'>Type</strong>
                {selectedVehicle.type}
              </p>
              <p className='m-0 rounded-lg bg-slate-50 p-2'>
                <strong className='block text-slate-900'>Year</strong>
                {selectedVehicle.year}
              </p>
              <p className='m-0 rounded-lg bg-slate-50 p-2 col-span-2'>
                <strong className='block text-slate-900'>Status</strong>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(selectedVehicle.status)}`}>
                  {selectedVehicle.status}
                </span>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
