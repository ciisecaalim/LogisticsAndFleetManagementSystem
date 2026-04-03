import { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { downloadCsv, parseCsv } from '../utils/csv';

const VEHICLES_CACHE_KEY = 'lfms_vehicles';

const emptyForm = {
  plateNumber: '',
  model: '',
  type: 'Van',
  year: new Date().getFullYear(),
  status: 'Active',
  assignedDriver: 'Unassigned'
};

const vehicleColumns = [
  { key: 'plateNumber', label: 'Plate Number' },
  { key: 'model', label: 'Model' },
  { key: 'type', label: 'Type' },
  { key: 'year', label: 'Year', parse: (value) => Number(value) || new Date().getFullYear() },
  { key: 'status', label: 'Status' },
  { key: 'assignedDriver', label: 'Assigned Driver' }
];

const VEHICLE_STATUS_OPTIONS = ['All', 'Active', 'In Maintenance', 'Idle'];

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

function getStatusClass(status) {
  if (status === 'Active') {
    return 'bg-[#10B981]/20 text-[#047857]';
  }

  if (status === 'In Maintenance') {
    return 'bg-[#F59E0B]/20 text-[#92400E]';
  }

  return 'bg-[#64748B]/20 text-[#1E293B]';
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState(getCachedVehicles);
  const [loading, setLoading] = useState(vehicles.length === 0);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const fileInputRef = useRef(null);

  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadVehicles() {
      setLoading(true);

      try {
        const data = await api.getVehicles();

        if (isMounted && Array.isArray(data)) {
          setVehicles(data);
          saveVehiclesToCache(data);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Backend unavailable. Showing cached vehicles.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  function openAddForm() {
    setFormMode('add');
    setEditingId('');
    setFormData(emptyForm);
    setError('');
  }

  function openEditForm(vehicle) {
    const rowId = vehicle._id || vehicle.id;

    if (!rowId) {
      setError('Edit needs backend id. Refresh from API first.');
      return;
    }

    setFormMode('edit');
    setEditingId(rowId);
    setFormData({
      plateNumber: vehicle.plateNumber || '',
      model: vehicle.model || '',
      type: vehicle.type || 'Van',
      year: vehicle.year || new Date().getFullYear(),
      status: vehicle.status || 'Active',
      assignedDriver: vehicle.assignedDriver || 'Unassigned'
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
    setFormData((current) => ({ ...current, [name]: name === 'year' ? Number(value) : value }));
  }

  async function handleSaveForm(event) {
    event.preventDefault();

    if (!formData.plateNumber.trim() || !formData.model.trim() || !formData.type.trim() || !formData.assignedDriver.trim()) {
      setError('Please fill all required fields.');
      return;
    }

    if (!formData.year || Number.isNaN(Number(formData.year))) {
      setError('Year is invalid.');
      return;
    }

    setSaving(true);

    try {
      if (formMode === 'add') {
        const created = await api.createVehicle({
          ...formData,
          plateNumber: formData.plateNumber.trim(),
          model: formData.model.trim(),
          type: formData.type.trim(),
          assignedDriver: formData.assignedDriver.trim(),
          lat: 0,
          lng: 0
        });

        const next = [created, ...vehicles];
        setVehicles(next);
        saveVehiclesToCache(next);
      }

      if (formMode === 'edit') {
        const updated = await api.updateVehicle(editingId, {
          ...formData,
          plateNumber: formData.plateNumber.trim(),
          model: formData.model.trim(),
          type: formData.type.trim(),
          assignedDriver: formData.assignedDriver.trim()
        });

        const next = vehicles.map((item) => ((item._id || item.id) === editingId ? updated : item));
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
      setError('Delete needs backend id. Refresh from API first.');
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
    <section className='space-y-6'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='page-title m-0 text-3xl font-bold tracking-tight sm:text-4xl'>Vehicles</h1>
          <p className='mt-1 text-base font-medium text-[#1E293B] sm:text-lg'>Manage your fleet vehicles</p>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <button
              type='button'
              onClick={() =>
                downloadCsv({
                  columns: vehicleColumns,
                  data: statusFilter === 'All' ? vehicles : vehicles.filter((vehicle) => vehicle.status === statusFilter),
                  filename:
                    statusFilter === 'All'
                      ? 'vehicles.csv'
                      : `vehicles-${statusFilter.toLowerCase().replace(/\s+/g, '-')}.csv`
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
            <div className='flex flex-wrap items-center gap-2 rounded-xl border border-[#64748B]/25 bg-white px-3 py-2 text-sm text-[#1E293B]'>
              {VEHICLE_STATUS_OPTIONS.map((status) => (
                <label key={status} className='inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#1E293B]'>
                  <input
                    type='radio'
                    name='vehicle-status'
                    value={status}
                    checked={statusFilter === status}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className='accent-[#10B981]'
                  />
                  {status}
                </label>
              ))}
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
                        model: (row.model || '').trim(),
                        type: row.type || 'Van',
                        assignedDriver: row.assignedDriver || 'Unassigned',
                        lat: 0,
                        lng: 0
                      })
                    )
                  );
                  const next = [...createdRows, ...vehicles];
                  setVehicles(next);
                  saveVehiclesToCache(next);
                } catch {
                  setError('CSV import failed. Make sure your file is valid.');
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
              Add Vehicle
            </button>
          </div>
        </div>
      </header>

      {formMode ? (
        <article className='rounded-2xl border border-[#64748B]/20 bg-white p-5 shadow-lg shadow-slate-900/5'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='m-0 text-lg font-semibold text-[#1E293B]'>{formMode === 'add' ? 'Add Vehicle' : 'Update Vehicle'}</h2>
            <button
              type='button'
              onClick={closeForm}
              className='inline-flex items-center gap-1 rounded-lg border border-[#64748B]/25 px-3 py-1.5 text-sm text-[#1E293B]'
            >
              <X size={16} />
              Close
            </button>
          </div>

          <form onSubmit={handleSaveForm} className='grid gap-4 md:grid-cols-2'>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Plate Number
              <input
                name='plateNumber'
                value={formData.plateNumber}
                onChange={onFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>

            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Model
              <input
                name='model'
                value={formData.model}
                onChange={onFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>

            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Type
              <input
                name='type'
                value={formData.type}
                onChange={onFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                placeholder='e.g. Van, Truck'
                required
              />
            </label>

            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Year
              <input
                name='year'
                type='number'
                value={formData.year}
                onChange={onFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>

            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Status
              <select name='status' value={formData.status} onChange={onFormChange} className='rounded-lg border border-[#64748B]/25 px-3 py-2'>
                <option value='Active'>Active</option>
                <option value='In Maintenance'>In Maintenance</option>
                <option value='Idle'>Idle</option>
              </select>
            </label>

            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Assigned Driver
              <input
                name='assignedDriver'
                value={formData.assignedDriver}
                onChange={onFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>

            <div className='md:col-span-2 flex items-center gap-3'>
              <button
                type='submit'
                disabled={saving}
                className='rounded-xl bg-[#020617] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:opacity-60'
              >
                {saving ? 'Saving...' : formMode === 'add' ? 'Create Vehicle' : 'Update Vehicle'}
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

      {error ? (
        <p className='rounded-xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-4 py-2 text-sm text-[#92400E]'>{error}</p>
      ) : null}

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <h2 className='m-0 text-xl font-semibold text-[#1E293B]'>All Vehicles</h2>

        <div className='mt-6 overflow-x-auto'>
          <div className='min-w-245'>
            <div className='grid grid-cols-[1.2fr_1.6fr_0.8fr_0.8fr_1.2fr_1.4fr_0.8fr] border-b border-[#64748B]/20 px-3 py-3 text-left text-xs font-semibold text-[#1E293B] sm:text-sm'>
              <div>Plate Number</div>
              <div>Model</div>
              <div>Type</div>
              <div>Year</div>
              <div>Status</div>
              <div>Assigned Driver</div>
              <div>Actions</div>
            </div>

            {loading && vehicles.length === 0 ? <p className='px-3 py-5 text-sm text-[#64748B]'>Loading vehicles...</p> : null}
            {!loading && vehicles.length === 0 ? <p className='px-3 py-5 text-sm text-[#64748B]'>No vehicles found.</p> : null}

            {vehicles.map((vehicle) => (
              <div
                key={vehicle._id || vehicle.id || vehicle.plateNumber}
                className='grid grid-cols-[1.2fr_1.6fr_0.8fr_0.8fr_1.2fr_1.4fr_0.8fr] border-b border-[#64748B]/20 px-3 py-4'
              >
                <div className='text-sm font-medium text-[#1E293B] lg:text-base'>{vehicle.plateNumber}</div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{vehicle.model}</div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{vehicle.type}</div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{vehicle.year}</div>
                <div>
                  <span className={`inline-flex rounded-xl px-3 py-1 text-sm font-semibold lg:text-base ${getStatusClass(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{vehicle.assignedDriver}</div>
                <div className='flex items-center gap-3'>
                  <button
                    type='button'
                    onClick={() => openEditForm(vehicle)}
                    aria-label={`Edit ${vehicle.plateNumber}`}
                    className='text-[#1E293B] transition hover:text-[#64748B]'
                  >
                    <Pencil size={22} />
                  </button>
                  <button
                    type='button'
                    onClick={() => handleDeleteVehicle(vehicle)}
                    aria-label={`Delete ${vehicle.plateNumber}`}
                    className='text-red-500 transition hover:text-red-600'
                  >
                    <Trash2 size={22} />
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
