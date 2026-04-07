import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, Fuel, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import api from '../services/api';
import { downloadCsv, parseCsv } from '../utils/csv';

const FUEL_CACHE_KEY = 'lfms_fuel';
const FUEL_VEHICLES_CACHE = 'lfms_fuel_vehicles';
const EMPTY_FUEL_FORM = {
  date: new Date().toISOString().slice(0, 10),
  vehicle: '',
  liters: '',
  cost: '',
  pricePerLiter: '',
  station: '',
  odometer: ''
};
const CHART_HEIGHT = 220;
const CHART_MIN_WIDTH = 640;
const PAGE_SIZE = 10;
const fuelColumns = [
  { key: 'date', label: 'Date' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'liters', label: 'Liters', parse: (value) => Number(value) || 0 },
  { key: 'cost', label: 'Cost', parse: (value) => Number(value) || 0 },
  { key: 'pricePerLiter', label: 'Price/L', parse: (value) => Number(value) || 0 },
  { key: 'station', label: 'Station' },
  { key: 'odometer', label: 'Odometer' }
];

function getCachedFuelRecords() {
  try {
    const cached = localStorage.getItem(FUEL_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function saveFuelRecords(list) {
  localStorage.setItem(FUEL_CACHE_KEY, JSON.stringify(list));
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

function buildLinePath(points) {
  if (!points.length) {
    return '';
  }

  return points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }, '');
}

function getFuelRecordKey(record) {
  return record._id || record.id || `${record.vehicle}-${record.date}`;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function FuelPage() {
  const [fuelRecords, setFuelRecords] = useState(getCachedFuelRecords);
  const [loading, setLoading] = useState(fuelRecords.length === 0);
  const [error, setError] = useState('');
  const [formMode, setFormMode] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FUEL_FORM);
  const [editingId, setEditingId] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [stationFilter, setStationFilter] = useState('All');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableVehicles, setAvailableVehicles] = useState(() => readCache(FUEL_VEHICLES_CACHE));
  const [chartWidth, setChartWidth] = useState(CHART_MIN_WIDTH);
  const chartWrapperRef = useRef(null);
  const [sortKey, setSortKey] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadFuelRecords() {
      setLoading(true);

      try {
        const data = await api.getFuelRecords();

        if (isMounted && Array.isArray(data)) {
          setFuelRecords(data);
          saveFuelRecords(data);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Backend unavailable. Showing cached fuel records.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFuelRecords();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    api
      .getVehicles()
      .then((vehicles) => {
        if (!isMounted || !Array.isArray(vehicles) || vehicles.length === 0) {
          return;
        }

        setAvailableVehicles(vehicles);
        saveCache(FUEL_VEHICLES_CACHE, vehicles);
      })
      .catch(() => {
        /* keep cache */
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const element = chartWrapperRef.current;

    if (!element) {
      return undefined;
    }

    const updateWidth = () => {
      const width = Math.max(element.clientWidth, CHART_MIN_WIDTH);
      setChartWidth(width);
    };

    updateWidth();
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const totalCost = useMemo(() => fuelRecords.reduce((sum, record) => sum + Number(record.cost || 0), 0), [fuelRecords]);
  const totalLiters = useMemo(() => fuelRecords.reduce((sum, record) => sum + Number(record.liters || 0), 0), [fuelRecords]);
  const averagePrice = totalLiters > 0 ? totalCost / totalLiters : 0;

  const chartData = useMemo(() => {
    const sorted = [...fuelRecords]
      .filter((record) => record.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const window = sorted.slice(-5);

    if (window.length === 0) {
      return [];
    }

    const maxCost = Math.max(...window.map((record) => Number(record.cost || 0)), 1);
    const maxLiters = Math.max(...window.map((record) => Number(record.liters || 0)), 1);
    const width = Math.max(chartWidth, CHART_MIN_WIDTH);

    return window.map((record, index) => {
      const x = window.length === 1 ? width / 2 : (index / (window.length - 1)) * width;
      const cost = Number(record.cost || 0);
      const liters = Number(record.liters || 0);
      const costY = CHART_HEIGHT - (cost / maxCost) * (CHART_HEIGHT * 0.8) - 10;
      const litersY = CHART_HEIGHT - (liters / maxLiters) * (CHART_HEIGHT * 0.8) - 10;

      return {
        label: record.date,
        cost,
        liters,
        costPoint: { x, y: Math.max(12, costY) },
        litersPoint: { x, y: Math.max(12, litersY) }
      };
    });
  }, [fuelRecords, chartWidth]);

  const costPath = buildLinePath(chartData.map((point) => point.costPoint));
  const litersPath = buildLinePath(chartData.map((point) => point.litersPoint));
  const responsiveChartWidth = Math.max(chartWidth, CHART_MIN_WIDTH);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const maxCostValue = Math.max(...chartData.map((point) => point.cost), 1);
  const maxLitersValue = Math.max(...chartData.map((point) => point.liters), 1);
  const yAxisCostLevels = useMemo(
    () => [0, 150, 300, 450, 600, 750].filter((value) => value <= maxCostValue || value === 0),
    [maxCostValue]
  );
  const yAxisLitersLevels = useMemo(
    () => [0, 25, 50, 75, 100].filter((value) => value <= maxLitersValue || value === 0),
    [maxLitersValue]
  );
  const stationOptions = useMemo(() => {
    const stations = Array.from(new Set(fuelRecords.map((record) => record.station).filter(Boolean)));
    return ['All', ...stations];
  }, [fuelRecords]);
  const filteredFuelRecords = useMemo(() => {
    const searchTerm = searchQuery.trim().toLowerCase();

    return fuelRecords.filter((record) => {
      if (stationFilter !== 'All' && record.station !== stationFilter) {
        return false;
      }

      if (vehicleFilter !== 'All' && record.vehicle !== vehicleFilter) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const haystack = [record.vehicle, record.station, record.date, record.odometer]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [fuelRecords, stationFilter, vehicleFilter, searchQuery]);
  const sortedFuelRecords = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    return [...filteredFuelRecords].sort((a, b) => {
      const getValue = (item) => {
        const value = item[sortKey];
        if (value === undefined || value === null) {
          return '';
        }

        if (sortKey === 'liters' || sortKey === 'cost' || sortKey === 'pricePerLiter' || sortKey === 'odometer') {
          return Number(value) || 0;
        }

        return typeof value === 'string' ? value.toLowerCase() : value;
      };

      const aval = getValue(a);
      const bval = getValue(b);
      if (aval === bval) {
        return 0;
      }
      return direction * (aval > bval ? 1 : -1);
    });
  }, [filteredFuelRecords, sortDirection, sortKey]);
  const totalPages = Math.max(1, Math.ceil(sortedFuelRecords.length / PAGE_SIZE));
  const normalizedPage = Math.min(Math.max(page, 1), totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
    if (page < 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [stationFilter, vehicleFilter, searchQuery]);

  const paginatedFuelRecords = sortedFuelRecords.slice((normalizedPage - 1) * PAGE_SIZE, normalizedPage * PAGE_SIZE);
  const visibleRecordKeys = paginatedFuelRecords.map((record) => getFuelRecordKey(record));
  const allDisplayedSelected =
    visibleRecordKeys.length > 0 && visibleRecordKeys.every((id) => selectedRecordIds.includes(id));

  const toggleSelectAll = () => {
    if (allDisplayedSelected) {
      setSelectedRecordIds((prev) => prev.filter((id) => !visibleRecordKeys.includes(id)));
      return;
    }

    setSelectedRecordIds((prev) => {
      const next = [...prev];
      visibleRecordKeys.forEach((id) => {
        if (!next.includes(id)) {
          next.push(id);
        }
      });
      return next;
    });
  };

  const toggleSelectOne = (recordId) => {
    setSelectedRecordIds((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    );
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  };
  const vehicleOptions = useMemo(() => {
    return availableVehicles
      .filter((vehicle) => vehicle && (vehicle.plateNumber || vehicle.model))
      .map((vehicle) => ({
        value: vehicle.plateNumber || vehicle.model,
        label: vehicle.plateNumber ? `${vehicle.plateNumber} • ${vehicle.model || 'Vehicle'}` : vehicle.model
      }));
  }, [availableVehicles]);

  const vehicleFilterOptions = useMemo(() => {
    const uniqueVehicles = Array.from(
      new Set(fuelRecords.map((record) => record.vehicle).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return ['All', ...uniqueVehicles];
  }, [fuelRecords]);

  const exportFilenameSuffix = useMemo(() => {
    const segments = [];
    if (stationFilter !== 'All') {
      segments.push(slugify(stationFilter));
    }
    if (vehicleFilter !== 'All') {
      segments.push(slugify(vehicleFilter));
    }

    return segments.length ? `-${segments.join('-')}` : '';
  }, [stationFilter, vehicleFilter]);

  function openAddForm() {
    setFormMode('add');
    setEditingId('');
    setFormData(EMPTY_FUEL_FORM);
    setError('');
  }

  function openEditForm(record) {
    const id = record._id || record.id;

    if (!id) {
      setError('Fuel record needs backend id to edit.');
      return;
    }

    setFormMode('edit');
    setEditingId(id);
    setFormData({
      date: record.date || new Date().toISOString().slice(0, 10),
      vehicle: record.vehicle || '',
      liters: record.liters || '',
      cost: record.cost || '',
      pricePerLiter: record.pricePerLiter || '',
      station: record.station || '',
      odometer: record.odometer || ''
    });
    setError('');
  }

  function closeForm() {
    setFormMode(null);
    setEditingId('');
    setFormData(EMPTY_FUEL_FORM);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSave() {
    if (!formData.vehicle.trim() || !formData.station.trim() || !formData.odometer.trim()) {
      setError('Vehicle, station, and odometer are required.');
      return;
    }

    if (!formData.liters || Number.isNaN(Number(formData.liters)) || !formData.cost || Number.isNaN(Number(formData.cost))) {
      setError('Cost and liters must be numeric.');
      return;
    }

    setSaving(true);

    try {
      if (formMode === 'add') {
        const created = await api.createFuelRecord({
          ...formData,
          liters: Number(formData.liters),
          cost: Number(formData.cost),
          pricePerLiter: Number(formData.pricePerLiter || 0)
        });
        const next = [created, ...fuelRecords];
        setFuelRecords(next);
        saveFuelRecords(next);
      } else if (formMode === 'edit' && editingId) {
        const updated = await api.updateFuelRecord(editingId, {
          ...formData,
          liters: Number(formData.liters),
          cost: Number(formData.cost),
          pricePerLiter: Number(formData.pricePerLiter || 0)
        });
        const next = fuelRecords.map((record) => ((record._id || record.id) === editingId ? updated : record));
        setFuelRecords(next);
        saveFuelRecords(next);
      }

      setError('');
      closeForm();
    } catch {
      setError('Save failed. Check backend server.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    const id = record._id || record.id;

    if (!id) {
      setError('Fuel record needs backend id to delete.');
      return;
    }

    try {
      await api.deleteFuelRecord(id);
      const next = fuelRecords.filter((item) => (item._id || item.id) !== id);
      setFuelRecords(next);
      saveFuelRecords(next);
      setError('');
    } catch {
      setError('Delete failed. Check backend server.');
    }
  }

  async function handleDeleteSelected() {
    if (selectedRecordIds.length === 0) {
      return;
    }

    if (!window.confirm(`Delete ${selectedRecordIds.length} selected fuel record(s)? This action cannot be undone.`)) {
      return;
    }

    const lookup = new Map(fuelRecords.map((record) => [getFuelRecordKey(record), record]));
    const pickedRecords = selectedRecordIds.map((key) => lookup.get(key)).filter(Boolean);
    const deletableRecords = pickedRecords.filter((record) => record._id || record.id);

    if (deletableRecords.length === 0) {
      setError('Selected records need backend ids before they can be deleted.');
      return;
    }

    const recordIds = deletableRecords.map((record) => record._id || record.id);
    const skippedCount = pickedRecords.length - deletableRecords.length;

    setBulkDeleting(true);

    try {
      const results = await Promise.allSettled(recordIds.map((id) => api.deleteFuelRecord(id)));
      const succeededIds = results
        .map((result, index) => (result.status === 'fulfilled' ? recordIds[index] : null))
        .filter(Boolean);

      if (succeededIds.length === 0) {
        setError('Bulk delete failed. Check backend server.');
        return;
      }

      const next = fuelRecords.filter((record) => !succeededIds.includes(record._id || record.id));
      setFuelRecords(next);
      saveFuelRecords(next);

      const deletedKeys = deletableRecords
        .filter((record) => succeededIds.includes(record._id || record.id))
        .map((record) => getFuelRecordKey(record));

      setSelectedRecordIds((prev) => prev.filter((id) => !deletedKeys.includes(id)));

      if (results.some((result) => result.status === 'rejected')) {
        setError('Some records failed to delete. Refresh and try again.');
      } else if (skippedCount > 0) {
        setError('Some selections were skipped because they lack backend ids.');
      } else {
        setError('');
      }
    } catch {
      setError('Bulk delete failed. Check backend server.');
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <section className='space-y-6'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='page-title m-0 text-3xl font-bold tracking-tight sm:text-4xl'>Fuel Management</h1>
          <p className='mt-1 text-base font-medium text-[#1E293B] sm:text-lg'>Track fuel consumption and costs</p>
        </div>

        <div className='flex flex-wrap items-start gap-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <button
              type='button'
              className='inline-flex items-center gap-2 rounded-xl border border-[#64748B]/25 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B]'
              onClick={() =>
                downloadCsv({
                  columns: fuelColumns,
                  data: filteredFuelRecords,
                  filename: `fuel-records${exportFilenameSuffix}.csv`
                })
              }
            >
              <Download size={18} strokeWidth={2.2} />
              Export CSV
            </button>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='inline-flex items-center gap-2 rounded-xl border border-[#64748B]/20 bg-[#f1f5f9] px-4 py-2 text-sm font-semibold text-[#1E293B]'
            >
              <Upload size={18} strokeWidth={2.2} />
              Import CSV
            </button>
            <input
              type='search'
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder='Search vehicles, stations, dates...'
              className='rounded-xl border border-[#64748B]/25 bg-white px-3 py-2 text-sm text-[#1E293B] placeholder:text-[#94a3b8]'
            />
            <select
              value={stationFilter}
              onChange={(event) => setStationFilter(event.target.value)}
              className='rounded-xl border border-[#64748B]/25 bg-white px-3 py-2 text-sm text-[#1E293B]'
            >
              {stationOptions.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
            <select
              value={vehicleFilter}
              onChange={(event) => setVehicleFilter(event.target.value)}
              className='rounded-xl border border-[#64748B]/25 bg-white px-3 py-2 text-sm text-[#1E293B]'
            >
              {vehicleFilterOptions.map((vehicle) => (
                <option key={vehicle} value={vehicle}>
                  {vehicle === 'All' ? 'All vehicles' : vehicle}
                </option>
              ))}
            </select>
          </div>
          <div className='ml-auto flex items-center gap-2'>
            <button
              type='button'
              onClick={handleDeleteSelected}
              disabled={selectedRecordIds.length === 0 || bulkDeleting}
              className='inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedRecordIds.length})`}
            </button>
            <button
              type='button'
              onClick={openAddForm}
              className='inline-flex items-center gap-2 rounded-xl bg-[#020617] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#1E293B]'
            >
              <Plus size={18} strokeWidth={2.4} />
              Add Record
            </button>
          </div>
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
              const rows = parseCsv(text, fuelColumns);
              const created = await Promise.all(
                rows.map((row) =>
                  api.createFuelRecord({
                    ...row,
                    liters: Number(row.liters || 0),
                    cost: Number(row.cost || 0),
                    pricePerLiter: Number(row.pricePerLiter || 0)
                  })
                )
              );
              const next = [...created, ...fuelRecords];
              setFuelRecords(next);
              saveFuelRecords(next);
            } catch {
              setError('CSV import failed. Validate the worksheet.');
            } finally {
              event.target.value = '';
            }
          }}
        />
      </header>

      {error ? (
        <p className='rounded-xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-4 py-2 text-sm text-[#92400E]'>{error}</p>
      ) : null}

      {formMode ? (
        <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-[#1E293B]'>{formMode === 'add' ? 'Add Fuel Record' : 'Update Fuel Record'}</h2>
            <button type='button' onClick={closeForm} className='text-[#1E293B]'>
              <X size={18} />
            </button>
          </div>
          <form className='mt-4 grid gap-4 md:grid-cols-2'>
            {[
              { name: 'date', type: 'date', label: 'Date' },
              { name: 'vehicle', type: 'text', label: 'Vehicle' },
              { name: 'liters', type: 'number', label: 'Liters' },
              { name: 'cost', type: 'number', label: 'Cost' },
              { name: 'pricePerLiter', type: 'number', label: 'Price/L' },
              { name: 'station', type: 'text', label: 'Station' },
              { name: 'odometer', type: 'text', label: 'Odometer' }
            ].map((field) => {
              if (field.name === 'vehicle') {
                return (
                  <label key={field.name} className='grid gap-1 text-sm text-[#1E293B]'>
                    {field.label}
                    <select
                      name='vehicle'
                      value={formData.vehicle}
                      onChange={handleFormChange}
                      className='rounded-lg border border-[#64748B]/25 px-3 py-2 bg-white'
                      required
                    >
                      <option value='' disabled>
                        Select vehicle
                      </option>
                      {vehicleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }

              return (
                <label key={field.name} className='grid gap-1 text-sm text-[#1E293B]'>
                  {field.label}
                  <input
                    name={field.name}
                    type={field.type}
                    value={formData[field.name]}
                    onChange={handleFormChange}
                    className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                    required={field.name !== 'pricePerLiter'}
                  />
                </label>
              );
            })}
            <div className='md:col-span-2 flex items-center gap-3'>
              <button
                type='button'
                onClick={handleSave}
                disabled={saving}
                className='rounded-xl bg-[#020617] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:opacity-60'
              >
                {saving ? 'Saving...' : formMode === 'add' ? 'Create Record' : 'Update Record'}
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

      <div className='grid gap-4 lg:grid-cols-3'>
        <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
          <div className='flex items-center gap-4'>
            <span className='grid h-14 w-14 place-items-center rounded-2xl bg-[#F59E0B]/20 text-[#EA580C]'>
              <Fuel size={27} strokeWidth={2.2} />
            </span>
            <div>
              <p className='m-0 text-lg font-semibold text-[#64748B]'>Total Cost</p>
              <p className='mt-1 leading-none font-bold text-[#1E293B]' style={{ fontSize: '2em' }}>${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </article>

        <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
          <div className='flex items-center gap-4'>
            <span className='grid h-14 w-14 place-items-center rounded-2xl bg-[#64748B]/20 text-[#1D4ED8]'>
              <Fuel size={27} strokeWidth={2.2} />
            </span>
            <div>
              <p className='m-0 text-lg font-semibold text-[#64748B]'>Total Liters</p>
              <p className='mt-1 leading-none font-bold text-[#1E293B]' style={{ fontSize: '2em' }}>{totalLiters.toFixed(2)}</p>
            </div>
          </div>
        </article>

        <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
          <div className='flex items-center gap-4'>
            <span className='grid h-14 w-14 place-items-center rounded-2xl bg-[#10B981]/20 text-[#16A34A]'>
              <Fuel size={27} strokeWidth={2.2} />
            </span>
            <div>
              <p className='m-0 text-lg font-semibold text-[#64748B]'>Avg. Price/L</p>
              <p className='mt-1 leading-none font-bold text-[#1E293B]' style={{ fontSize: '2em' }}>${averagePrice.toFixed(2)}</p>
            </div>
          </div>
        </article>
      </div>

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <h2 className='m-0 text-xl font-semibold text-[#1E293B]'>Fuel Usage & Costs</h2>
        <div className='mt-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm'>
          <div ref={chartWrapperRef} className='relative h-[240px] w-full overflow-hidden rounded-2xl border border-[#E5E7EB]'>
            <svg
              viewBox={`0 0 ${responsiveChartWidth} ${CHART_HEIGHT}`}
              preserveAspectRatio='none'
              className='h-full w-full'
            >
              {yAxisCostLevels.map((value) => {
                const y = CHART_HEIGHT - (value / Math.max(maxCostValue, 1)) * CHART_HEIGHT;
                return (
                  <line
                    key={`cost-grid-${value}`}
                    x1='0'
                    x2={responsiveChartWidth - 30}
                    y1={y}
                    y2={y}
                    stroke='#E2E8F0'
                    strokeWidth={1}
                  />
                );
              })}
              {yAxisLitersLevels.map((value) => {
                const y = CHART_HEIGHT - (value / Math.max(maxLitersValue, 1)) * CHART_HEIGHT;
                return (
                  <line
                    key={`liters-grid-${value}`}
                    x1='0'
                    x2={responsiveChartWidth}
                    y1={y}
                    y2={y}
                    stroke='#E2E8F0'
                    strokeWidth={1}
                    strokeDasharray='4'
                  />
                );
              })}

              <path d={costPath} fill='none' stroke='#EF4444' strokeWidth='3' />
              <path d={litersPath} fill='none' stroke='#A855F7' strokeWidth='3' />

              {chartData.map((point) => (
                <circle
                  key={`cost-dot-${point.label}`}
                  cx={point.costPoint.x}
                  cy={point.costPoint.y}
                  r='4'
                  className='cursor-pointer'
                  fill='#fff'
                  stroke='#EF4444'
                  strokeWidth='2'
                  onMouseEnter={() =>
                    setHoveredPoint({
                      ...point,
                      position: point.costPoint,
                      valueLabel: 'Cost',
                      value: point.cost,
                      color: '#EF4444'
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
              {chartData.map((point) => (
                <circle
                  key={`liters-dot-${point.label}`}
                  cx={point.litersPoint.x}
                  cy={point.litersPoint.y}
                  r='4'
                  className='cursor-pointer'
                  fill='#fff'
                  stroke='#A855F7'
                  strokeWidth='2'
                  onMouseEnter={() =>
                    setHoveredPoint({
                      ...point,
                      position: point.litersPoint,
                      valueLabel: 'Liters',
                      value: point.liters,
                      color: '#A855F7'
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {yAxisCostLevels.map((value) => {
                const y = CHART_HEIGHT - (value / Math.max(maxCostValue, 1)) * CHART_HEIGHT;
                return (
                  <text key={`cost-label-${value}`} x='5' y={y - 4} fontSize='10' fill='#475569'>
                    {value}
                  </text>
                );
              })}
              {yAxisLitersLevels.map((value) => {
                const y = CHART_HEIGHT - (value / Math.max(maxLitersValue, 1)) * CHART_HEIGHT;
                return (
                  <text
                    key={`liters-label-${value}`}
                    x={responsiveChartWidth - 45}
                    y={y - 4}
                    fontSize='10'
                    fill='#475569'
                  >
                    {value}
                  </text>
                );
              })}
            </svg>
            {hoveredPoint ? (
              <div
                className='pointer-events-none absolute left-0 top-0 z-10 w-max rounded-xl border border-[#64748B]/20 bg-white p-3 text-xs text-[#1E293B] shadow-lg shadow-slate-900/20'
                style={{
                  transform: 'translate(-50%, -110%)',
                  left: `${(hoveredPoint.position.x / responsiveChartWidth) * 100}%`,
                  top: `${(hoveredPoint.position.y / CHART_HEIGHT) * 100}%`
                }}
              >
                <p className='m-0 text-xs font-semibold text-[#1E293B]'>{hoveredPoint.label}</p>
                <p className='m-0 text-xs' style={{ color: hoveredPoint.color }}>
                  {hoveredPoint.valueLabel} : {hoveredPoint.value}
                </p>
              </div>
            ) : null}
          </div>
          <div className='mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-[#64748B]'>
            <div className='flex justify-between'>
              <span className='flex items-center gap-1 text-[#EF4444]'>
                <span className='h-2.5 w-2.5 rounded-full bg-[#EF4444]' />
                Cost
              </span>
              <span className='text-[#1E293B]'>{chartData[chartData.length - 1]?.label || '—'}</span>
            </div>
            <div className='flex justify-between'>
              <span className='flex items-center gap-1 text-[#A855F7]'>
                <span className='h-2.5 w-2.5 rounded-full bg-[#A855F7]' />
                Liters
              </span>
              <span className='text-[#1E293B]'>{chartData[0]?.label || '—'}</span>
            </div>
          </div>
        </div>
      </article>

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <h2 className='m-0 text-xl font-semibold text-[#1E293B]'>Fuel Records</h2>

        <div className='mt-6 overflow-x-auto'>
          <div className='min-w-300'>
            <div className='grid grid-cols-[0.6fr_1fr_2fr_0.8fr_0.8fr_0.7fr_1.5fr_1fr_0.8fr] border-b border-[#64748B]/20 px-3 py-3 text-left text-sm font-semibold text-[#1E293B] lg:text-base'>
              <div className='flex justify-center'>
                <button
                  type='button'
                  aria-label='Select all fuel records'
                  onClick={toggleSelectAll}
                  className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                    allDisplayedSelected ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#cbd5f5]'
                  }`}
                >
                  {allDisplayedSelected ? <Check size={12} strokeWidth={3} /> : null}
                </button>
              </div>
              <button type='button' onClick={() => handleSort('date')} className='text-left'>
                Date {sortKey === 'date' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('vehicle')} className='text-left'>
                Vehicle {sortKey === 'vehicle' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('liters')} className='text-left'>
                Liters {sortKey === 'liters' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('cost')} className='text-left'>
                Cost {sortKey === 'cost' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('pricePerLiter')} className='text-left'>
                Price/L {sortKey === 'pricePerLiter' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('station')} className='text-left'>
                Station {sortKey === 'station' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('odometer')} className='text-left'>
                Odometer {sortKey === 'odometer' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <div>Actions</div>
            </div>

            {loading && fuelRecords.length === 0 ? <p className='px-3 py-5 text-sm text-[#64748B]'>Loading fuel records...</p> : null}
            {!loading && fuelRecords.length === 0 ? <p className='px-3 py-5 text-sm text-[#64748B]'>No fuel records found.</p> : null}

            {!loading && fuelRecords.length > 0 && filteredFuelRecords.length === 0 ? (
              <p className='px-3 py-5 text-sm text-[#64748B]'>No fuel records match the current filter.</p>
            ) : null}

            {paginatedFuelRecords.map((record) => {
              const recordKey = getFuelRecordKey(record);
              const isSelected = selectedRecordIds.includes(recordKey);
              return (
              <div
                key={recordKey}
                className='grid grid-cols-[0.6fr_1fr_2fr_0.8fr_0.8fr_0.7fr_1.5fr_1fr_0.8fr] border-b border-[#64748B]/20 px-3 py-4'
              >
                <div className='flex justify-center'>
                  <button
                    type='button'
                    onClick={() => toggleSelectOne(recordKey)}
                    className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                      isSelected ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#cbd5f5]'
                    }`}
                  >
                    {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                  </button>
                </div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{record.date}</div>
                <div className='text-sm font-semibold text-[#1E293B] lg:text-base'>{record.vehicle}</div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{Number(record.liters || 0).toFixed(2)} L</div>
                <div className='text-sm text-[#1E293B] lg:text-base'>${Number(record.cost || 0).toFixed(2)}</div>
                <div className='text-sm text-[#1E293B] lg:text-base'>${Number(record.pricePerLiter || 0).toFixed(2)}</div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{record.station}</div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{record.odometer}</div>
                <div className='flex items-center gap-3'>
                  <button
                    type='button'
                    onClick={() => openEditForm(record)}
                    aria-label={`Edit ${record.vehicle}`}
                    className='text-[#1E293B] transition hover:text-[#64748B]'
                  >
                    <Pencil size={21} />
                  </button>
                  <button
                    type='button'
                    onClick={() => handleDelete(record)}
                    aria-label={`Delete ${record.vehicle}`}
                    className='text-red-500 transition hover:text-red-600'
                  >
                    <Trash2 size={21} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div className='mt-4 flex items-center justify-between gap-3 border-t border-[#64748B]/20 pt-4'>
          <p className='text-sm font-medium text-[#475569]'>
            Page {normalizedPage} of {totalPages} • Showing {paginatedFuelRecords.length} of {sortedFuelRecords.length}
          </p>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={normalizedPage <= 1}
              className='rounded-lg border border-[#64748B]/25 bg-white px-3 py-1.5 text-sm font-semibold text-[#1E293B] disabled:cursor-not-allowed disabled:opacity-50'
            >
              Prev
            </button>
            <button
              type='button'
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={normalizedPage >= totalPages}
              className='rounded-lg border border-[#64748B]/25 bg-white px-3 py-1.5 text-sm font-semibold text-[#1E293B] disabled:cursor-not-allowed disabled:opacity-50'
            >
              Next
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
