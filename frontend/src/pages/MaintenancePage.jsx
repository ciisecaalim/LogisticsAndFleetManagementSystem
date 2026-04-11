import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Pencil, Plus, Trash2, Wrench, X } from 'lucide-react';

function escapeCsv(value) {
  const text = value ?? '';
  const str = typeof text === 'string' ? text : String(text);
  if(/[\r\n",]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function downloadCsv({ columns, data, filename }) {
  const header = columns.map((col) => col.label).join(',');
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        return escapeCsv(col.format ? col.format(value) : value);
      })
      .join(',')
  );

  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseCsvText(text) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(current);
      current = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    if (char === '\n') {
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

function parseCsv(text, columns) {
  const rows = parseCsvText(text.trim());

  if (!rows.length) {
    return [];
  }

  const dataRows = rows.slice(1).map((row) => {
    const entry = {};

    columns.forEach((column, index) => {
      const rawValue = row[index] ?? '';
      const value = column.parse ? column.parse(rawValue) : rawValue;
      entry[column.key] = value;
    });

    return entry;
  });

  return dataRows;
}

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

const MAINTENANCE_CACHE_KEY = 'lfms_maintenance';
const MAINTENANCE_VEHICLES_CACHE = 'lfms_maintenance_vehicles';
const MAINTENANCE_TYPES = ['Repair', 'Inspection', 'Service'];
const MAINTENANCE_STATUS = ['Pending', 'Completed', 'In Review'];
const PAGE_SIZE = 10;
const EMPTY_MAINTENANCE_FORM = {
  date: new Date().toISOString().slice(0, 10),
  vehicle: '',
  description: '',
  type: 'Repair',
  cost: '',
  status: 'Pending',
  nextDue: ''
};
const maintenanceColumns = [
  { key: 'date', label: 'Date' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type' },
  { key: 'cost', label: 'Cost', parse: (value) => Number(value) || 0 },
  { key: 'status', label: 'Status' },
  { key: 'nextDue', label: 'Next Due' }
];

function getCachedMaintenance() {
  try {
    const cached = localStorage.getItem(MAINTENANCE_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function saveMaintenance(list) {
  localStorage.setItem(MAINTENANCE_CACHE_KEY, JSON.stringify(list));
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCache(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function getTypeClass(type) {
  if (type === 'Repair') {
    return 'bg-red-100 text-red-600';
  }

  if (type === 'Inspection') {
    return 'bg-[#E0E7FF] text-[#4338CA]';
  }

  return 'bg-[#64748B]/20 text-[#1D4ED8]';
}

function getStatusClass(status) {
  if (status === 'Completed') {
    return 'bg-[#10B981]/20 text-[#047857]';
  }

  if (status === 'Pending') {
    return 'bg-[#F59E0B]/20 text-[#92400E]';
  }

  return 'bg-[#64748B]/20 text-[#1D4ED8]';
}

function getRecordKey(record) {
  return record._id || record.id || `${record.vehicle}-${record.date}`;
}

export default function MaintenancePage() {
  const [records, setRecords] = useState(getCachedMaintenance);
  const [loading, setLoading] = useState(records.length === 0);
  const [error, setError] = useState('');
  const [formMode, setFormMode] = useState(null);
  const [formData, setFormData] = useState(EMPTY_MAINTENANCE_FORM);
  const [editingId, setEditingId] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [sortKey, setSortKey] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadMaintenance() {
      setLoading(true);

      try {
        const data = await api.getMaintenanceRecords();

        if (isMounted && Array.isArray(data)) {
          setRecords(data);
          saveMaintenance(data);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Backend unavailable. Showing cached maintenance records.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMaintenance();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalCost = useMemo(() => records.reduce((sum, row) => sum + Number(row.cost || 0), 0), [records]);
  const pendingCount = useMemo(() => records.filter((row) => row.status === 'Pending').length, [records]);
  const sortedRecords = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    return [...records].sort((a, b) => {
      const getValue = (item) => {
        const value = item[sortKey];
        if (value === undefined || value === null) {
          return '';
        }
        if (sortKey === 'cost') {
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
  }, [records, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / PAGE_SIZE));
  const normalizedPage = Math.min(Math.max(page, 1), totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
    if (page < 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedRecords = sortedRecords.slice((normalizedPage - 1) * PAGE_SIZE, normalizedPage * PAGE_SIZE);
  const visibleRecordKeys = paginatedRecords.map((record) => getRecordKey(record));
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

  function openAddForm() {
    setFormMode('add');
    setEditingId('');
    setFormData(EMPTY_MAINTENANCE_FORM);
    setError('');
  }

  function openEditForm(record) {
    const id = record._id || record.id;

    if (!id) {
      setError('Maintenance record needs backend id to edit.');
      return;
    }

    setFormMode('edit');
    setEditingId(id);
    setFormData({
      date: record.date || new Date().toISOString().slice(0, 10),
      vehicle: record.vehicle || '',
      description: record.description || '',
      type: record.type || 'Repair',
      cost: record.cost || '',
      status: record.status || 'Pending',
      nextDue: record.nextDue || ''
    });
    setError('');
  }

  function closeForm() {
    setFormMode(null);
    setEditingId('');
    setFormData(EMPTY_MAINTENANCE_FORM);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSave() {
    if (!formData.vehicle.trim() || !formData.description.trim() || !formData.nextDue.trim()) {
      setError('Vehicle, description, and next due are required.');
      return;
    }

    if (!formData.cost || Number.isNaN(Number(formData.cost))) {
      setError('Cost must be numeric.');
      return;
    }

    setSaving(true);

    try {
      if (formMode === 'add') {
        const created = await api.createMaintenanceRecord({
          ...formData,
          cost: Number(formData.cost)
        });
        const next = [created, ...records];
        setRecords(next);
        saveMaintenance(next);
      } else if (formMode === 'edit' && editingId) {
        const updated = await api.updateMaintenanceRecord(editingId, {
          ...formData,
          cost: Number(formData.cost)
        });
        const next = records.map((record) => ((record._id || record.id) === editingId ? updated : record));
        setRecords(next);
        saveMaintenance(next);
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
      setError('Maintenance record needs backend id to delete.');
      return;
    }

    try {
      await api.deleteMaintenanceRecord(id);
      const next = records.filter((item) => (item._id || item.id) !== id);
      setRecords(next);
      saveMaintenance(next);
      setError('');
    } catch {
      setError('Delete failed. Check backend server.');
    }
  }

  return (
    <section className='space-y-6'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='page-title m-0 text-3xl font-bold tracking-tight sm:text-4xl'>Maintenance</h1>
          <p className='mt-1 text-base font-medium text-[#1E293B] sm:text-lg'>Track vehicle maintenance and repairs</p>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <button
              type='button'
              onClick={() =>
                downloadCsv({
                  columns: maintenanceColumns,
                  data: records,
                  filename: 'maintenance.csv'
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
                  const rows = parseCsv(text, maintenanceColumns);
                  const created = await Promise.all(
                    rows.map((row) =>
                      api.createMaintenanceRecord({
                        ...row,
                        cost: Number(row.cost || 0)
                      })
                    )
                  );
                  const next = [...created, ...records];
                  setRecords(next);
                  saveMaintenance(next);
                } catch {
                  setError('CSV import failed. Validate the worksheet.');
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
              Add Record
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <p className='rounded-xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-4 py-2 text-sm text-[#92400E]'>{error}</p>
      ) : null}

      {formMode ? (
        <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-[#1E293B]'>{formMode === 'add' ? 'Add Maintenance' : 'Update Maintenance'}</h2>
            <button type='button' onClick={closeForm} className='text-[#1E293B]'>
              <X size={18} />
            </button>
          </div>
          <form className='mt-4 grid gap-4 md:grid-cols-2'>
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
              Vehicle
              <input
                name='vehicle'
                value={formData.vehicle}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Description
              <input
                name='description'
                value={formData.description}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Type
              <select
                name='type'
                value={formData.type}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
              >
                {MAINTENANCE_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Cost
              <input
                name='cost'
                type='number'
                min='0'
                step='0.1'
                value={formData.cost}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Status
              <select
                name='status'
                value={formData.status}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
              >
                {MAINTENANCE_STATUS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Next Due
              <input
                name='nextDue'
                type='date'
                value={formData.nextDue}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>
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
            <span className='grid h-14 w-14 place-items-center rounded-2xl bg-[#10B981]/20 text-[#16A34A]'>
              <Wrench size={27} strokeWidth={2.2} />
            </span>
            <div>
              <p className='m-0 text-lg font-semibold text-[#64748B]'>Total Cost</p>
              <p className='mt-1 leading-none font-bold text-[#1E293B]' style={{ fontSize: '2em' }}>${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </article>

        <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
          <div className='flex items-center gap-4'>
            <span className='grid h-14 w-14 place-items-center rounded-2xl bg-[#F59E0B]/20 text-[#D97706]'>
              <Wrench size={27} strokeWidth={2.2} />
            </span>
            <div>
              <p className='m-0 text-lg font-semibold text-[#64748B]'>Pending</p>
              <p className='mt-1 leading-none font-bold text-[#1E293B]' style={{ fontSize: '2em' }}>{pendingCount}</p>
            </div>
          </div>
        </article>

        <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
          <div className='flex items-center gap-4'>
            <span className='grid h-14 w-14 place-items-center rounded-2xl bg-[#F59E0B]/20 text-[#EA580C]'>
              <AlertCircle size={27} strokeWidth={2.2} />
            </span>
            <div>
              <p className='m-0 text-lg font-semibold text-[#64748B]'>Total Records</p>
              <p className='mt-1 leading-none font-bold text-[#1E293B]' style={{ fontSize: '2em' }}>{records.length}</p>
            </div>
          </div>
        </article>
      </div>

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <h2 className='m-0 text-xl font-semibold text-[#1E293B]'>Maintenance Records</h2>

        <div className='mt-6 overflow-x-auto'>
          <div className='min-w-300'>
            <div className='grid grid-cols-[0.6fr_1fr_2fr_2.5fr_1fr_0.8fr_1fr_1fr_0.8fr] border-b border-[#64748B]/20 px-3 py-3 text-left text-sm font-semibold text-[#1E293B] lg:text-base'>
              <div className='flex justify-center'>
                <button
                  type='button'
                  aria-label='Select all maintenance records'
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
              <button type='button' onClick={() => handleSort('description')} className='text-left'>
                Description {sortKey === 'description' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('type')} className='text-left'>
                Type {sortKey === 'type' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('cost')} className='text-left'>
                Cost {sortKey === 'cost' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('status')} className='text-left'>
                Status {sortKey === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('nextDue')} className='text-left'>
                Next Due {sortKey === 'nextDue' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <div>Actions</div>
            </div>

            {loading && records.length === 0 ? <p className='px-3 py-5 text-sm text-[#64748B]'>Loading maintenance records...</p> : null}
            {!loading && records.length === 0 ? <p className='px-3 py-5 text-sm text-[#64748B]'>No maintenance records found.</p> : null}

            {paginatedRecords.map((record) => {
              const recordKey = getRecordKey(record);
              const isSelected = selectedRecordIds.includes(recordKey);
              return (
              <div
                key={recordKey}
                className='grid grid-cols-[0.6fr_1fr_2fr_2.5fr_1fr_0.8fr_1fr_1fr_0.8fr] border-b border-[#64748B]/20 px-3 py-4'
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
                <div className='text-sm text-[#1E293B] lg:text-base'>{record.description}</div>
                <div>
                  <span className={`inline-flex rounded-xl px-3 py-1 text-sm font-semibold ${getTypeClass(record.type)}`}>
                    {record.type}
                  </span>
                </div>
                <div className='text-sm text-[#1E293B] lg:text-base'>${Number(record.cost || 0).toFixed(2)}</div>
                <div>
                  <span className={`inline-flex rounded-xl px-3 py-1 text-sm font-semibold ${getStatusClass(record.status)}`}>
                    {record.status}
                  </span>
                </div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{record.nextDue}</div>
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
            Page {normalizedPage} of {totalPages} • Showing {paginatedRecords.length} of {sortedRecords.length}
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
