import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, Mail, Pencil, Phone, Plus, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { downloadCsv, parseCsv } from '../utils/csv';

const DRIVERS_CACHE_KEY = 'lfms_drivers';
const DRIVER_STATUS_OPTIONS = ['All', 'Available', 'Assigned', 'Off'];
const PAGE_SIZE = 10;
const driverColumns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'licenseNumber', label: 'License Number' },
  { key: 'joinDate', label: 'Join Date' },
  { key: 'status', label: 'Status' }
];

function getCachedDrivers() {
  try {
    const cached = localStorage.getItem(DRIVERS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function saveDriversToCache(list) {
  localStorage.setItem(DRIVERS_CACHE_KEY, JSON.stringify(list));
}

function getStatusClass(status) {
  if (status === 'Available') {
    return 'bg-[#10B981]/20 text-[#047857]';
  }

  if (status === 'Assigned') {
    return 'bg-[#F59E0B]/20 text-[#92400E]';
  }

  return 'bg-[#64748B]/20 text-[#1E293B]';
}

function createDriverFormDefaults() {
  return {
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    joinDate: new Date().toISOString().slice(0, 10),
    status: 'Available'
  };
}

function getDriverKey(driver) {
  return driver._id || driver.id || driver.licenseNumber;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState(getCachedDrivers);
  const [loading, setLoading] = useState(drivers.length === 0);
  const [error, setError] = useState('');
  const [exportStatus, setExportStatus] = useState('All');
  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState(createDriverFormDefaults);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(1);
  const [selectedDriverIds, setSelectedDriverIds] = useState([]);

  function openAddForm() {
    setFormMode('add');
    setEditingId('');
    setFormData(createDriverFormDefaults());
    setError('');
  }

  function openEditForm(driver) {
    const rowId = driver._id || driver.id;

    if (!rowId) {
      setError('Edit requires backend id. Refresh from API first.');
      return;
    }

    setFormMode('edit');
    setEditingId(rowId);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      email: driver.email || '',
      licenseNumber: driver.licenseNumber || '',
      joinDate: driver.joinDate ? String(driver.joinDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: driver.status || 'Available'
    });
    setError('');
  }

  function closeForm() {
    setFormMode(null);
    setEditingId('');
    setFormData(createDriverFormDefaults());
  }

  function onFormChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSaveForm(event) {
    event.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.licenseNumber.trim()) {
      setError('Please fill all required driver fields.');
      return;
    }

    if (!formData.joinDate || !formData.joinDate.trim()) {
      setError('Please provide a join date.');
      return;
    }

    setSaving(true);

    try {
      if (formMode === 'add') {
        const created = await api.createDriver({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          joinDate: formData.joinDate,
          status: formData.status
        });

        const next = [created, ...drivers];
        setDrivers(next);
        saveDriversToCache(next);
      }

      if (formMode === 'edit') {
        const updated = await api.updateDriver(editingId, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          joinDate: formData.joinDate,
          status: formData.status
        });

        const next = drivers.map((driver) => ((driver._id || driver.id) === editingId ? updated : driver));
        setDrivers(next);
        saveDriversToCache(next);
      }

      setError('');
      closeForm();
    } catch {
      setError('Save failed. Check backend server and required fields.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDriver(driver) {
    const rowId = driver._id || driver.id;

    if (!rowId) {
      setError('Delete needs backend id. Refresh from API first.');
      return;
    }

    try {
      await api.deleteDriver(rowId);
      const next = drivers.filter((item) => (item._id || item.id) !== rowId);
      setDrivers(next);
      saveDriversToCache(next);
      setError('');
    } catch {
      setError('Delete failed. Check backend server.');
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDrivers() {
      setLoading(true);

      try {
        const data = await api.getDrivers();

        if (isMounted && Array.isArray(data)) {
          setDrivers(data);
          saveDriversToCache(data);
          setError('');
        }
      } catch {
        if (isMounted) {
          setError('Backend unavailable. Showing cached drivers.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDrivers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDrivers = useMemo(() => {
    if (exportStatus === 'All') {
      return drivers;
    }

    return drivers.filter((driver) => driver.status === exportStatus);
  }, [exportStatus, drivers]);

  const sortedDrivers = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    return [...filteredDrivers].sort((a, b) => {
      const getValue = (item) => {
        const value = item[sortKey];
        if (value === undefined || value === null) {
          return '';
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
  }, [filteredDrivers, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedDrivers.length / PAGE_SIZE));
  const normalizedPage = Math.min(Math.max(page, 1), totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
    if (page < 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedDrivers = sortedDrivers.slice((normalizedPage - 1) * PAGE_SIZE, normalizedPage * PAGE_SIZE);
  const visibleDriverKeys = paginatedDrivers.map((driver) => getDriverKey(driver));
  const allDisplayedSelected =
    visibleDriverKeys.length > 0 && visibleDriverKeys.every((id) => selectedDriverIds.includes(id));

  const toggleSelectAll = () => {
    if (allDisplayedSelected) {
      setSelectedDriverIds((prev) => prev.filter((id) => !visibleDriverKeys.includes(id)));
      return;
    }

    setSelectedDriverIds((prev) => {
      const next = [...prev];
      visibleDriverKeys.forEach((id) => {
        if (!next.includes(id)) {
          next.push(id);
        }
      });
      return next;
    });
  };

  const toggleSelectOne = (driverId) => {
    setSelectedDriverIds((prev) =>
      prev.includes(driverId) ? prev.filter((id) => id !== driverId) : [...prev, driverId]
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

  return (
    <section className='space-y-6'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='page-title m-0 text-3xl font-bold tracking-tight sm:text-4xl'>Drivers</h1>
          <p className='mt-1 text-base font-medium text-[#1E293B] sm:text-lg'>Manage your fleet drivers</p>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <button
              type='button'
              onClick={() =>
                downloadCsv({
                  columns: driverColumns,
                  data: filteredDrivers,
                  filename:
                    exportStatus === 'All'
                      ? 'drivers.csv'
                      : `drivers-${exportStatus.toLowerCase().replace(/\s+/g, '-')}.csv`
                })
              }
              className='inline-flex items-center gap-2 rounded-xl border border-[#64748B]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B]'
            >
              <Download size={17} />
              Export CSV
            </button>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='inline-flex items-center gap-2 rounded-xl border border-[#64748B]/20 bg-[#f1f5f9] px-4 py-2 text-sm font-semibold text-[#1E293B]'
            >
              <Download size={17} className='rotate-180' />
              Import CSV
            </button>
            <select
              value={exportStatus}
              onChange={(event) => setExportStatus(event.target.value)}
              className='rounded-xl border border-[#64748B]/25 bg-white px-3 py-2 text-sm text-[#1E293B]'
            >
              {DRIVER_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className='ml-auto flex items-center'>
            <button
              type='button'
              onClick={openAddForm}
              className='inline-flex items-center gap-2 rounded-xl bg-[#020617] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#1E293B]'
            >
              <Plus size={18} strokeWidth={2.4} />
              Add Driver
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
              const rows = parseCsv(text, driverColumns);
              const created = await Promise.all(
                rows.map((row) =>
                    api.createDriver({
                      name: (row.name || '').trim(),
                      phone: (row.phone || '').trim(),
                      email: (row.email || '').trim(),
                      licenseNumber: (row.licenseNumber || '').trim(),
                      joinDate: ((row.joinDate && String(row.joinDate)) || new Date().toISOString()).slice(0, 10),
                      status: row.status || 'Available'
                    })
                )
              );
              const next = [...created, ...drivers];
              setDrivers(next);
              saveDriversToCache(next);
            } catch {
              setError('CSV import failed. Validate the spreadsheet.');
            } finally {
              event.target.value = '';
            }
          }}
        />
      </header>

      {formMode ? (
        <article className='rounded-2xl border border-[#64748B]/20 bg-white p-5 shadow-lg shadow-slate-900/5'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='m-0 text-lg font-semibold text-[#1E293B]'>{formMode === 'add' ? 'Add Driver' : 'Update Driver'}</h2>
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
              Name
              <input
                name='name'
                value={formData.name}
                onChange={onFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>

            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Phone
              <input
                name='phone'
                value={formData.phone}
                onChange={onFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>

            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Email
              <input
                name='email'
                type='email'
                value={formData.email}
                onChange={onFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>

            <label className='grid gap-1 text-sm text-[#1E293B]'>
              License Number
              <input
                name='licenseNumber'
                value={formData.licenseNumber}
                onChange={onFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>

            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Join Date
              <input
                name='joinDate'
                type='date'
                value={formData.joinDate}
                onChange={onFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
                required
              />
            </label>

            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Status
              <select name='status' value={formData.status} onChange={onFormChange} className='rounded-lg border border-[#64748B]/25 px-3 py-2'>
                <option value='Available'>Available</option>
                <option value='Assigned'>Assigned</option>
                <option value='Off'>Off</option>
              </select>
            </label>

            <div className='md:col-span-2 flex items-center gap-3'>
              <button
                type='submit'
                disabled={saving}
                className='rounded-xl bg-[#020617] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:opacity-60'
              >
                {saving ? 'Saving...' : formMode === 'add' ? 'Create Driver' : 'Update Driver'}
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
        <h2 className='m-0 text-xl font-semibold text-[#1E293B]'>All Drivers</h2>

        <div className='mt-6 overflow-x-auto'>
          <div className='min-w-245'>
            <div className='grid grid-cols-[0.6fr_1.2fr_2fr_1.2fr_1fr_1fr_1fr] border-b border-[#64748B]/20 px-3 py-3 text-left text-sm font-semibold text-[#1E293B] lg:text-base'>
              <div className='flex justify-center'>
                <button
                  type='button'
                  aria-label='Select all drivers'
                  onClick={toggleSelectAll}
                  className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                    allDisplayedSelected ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#cbd5f5]'
                  }`}
                >
                  {allDisplayedSelected ? <Check size={12} strokeWidth={3} /> : null}
                </button>
              </div>
              <button type='button' onClick={() => handleSort('name')} className='text-left'>
                Name {sortKey === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('phone')} className='text-left'>
                Contact {sortKey === 'phone' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('licenseNumber')} className='text-left'>
                License Number {sortKey === 'licenseNumber' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('joinDate')} className='text-left'>
                Join Date {sortKey === 'joinDate' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button type='button' onClick={() => handleSort('status')} className='text-left'>
                Status {sortKey === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <div>Actions</div>
            </div>

            {loading && drivers.length === 0 ? <p className='px-3 py-5 text-sm text-[#64748B]'>Loading drivers...</p> : null}
            {!loading && drivers.length === 0 ? <p className='px-3 py-5 text-sm text-[#64748B]'>No drivers found.</p> : null}

            {!loading && drivers.length > 0 && filteredDrivers.length === 0 ? (
              <p className='px-3 py-5 text-sm text-[#64748B]'>No drivers match the current filter.</p>
            ) : null}

            {paginatedDrivers.map((driver) => {
              const driverKey = getDriverKey(driver);
              const isSelected = selectedDriverIds.includes(driverKey);

              return (
              <div
                key={driverKey}
                className='grid grid-cols-[0.6fr_1.2fr_2fr_1.2fr_1fr_1fr_1fr] border-b border-[#64748B]/20 px-3 py-4'
              >
                <div className='flex justify-center'>
                  <button
                    type='button'
                    onClick={() => toggleSelectOne(driverKey)}
                    className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                      isSelected ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#cbd5f5]'
                    }`}
                  >
                    {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                  </button>
                </div>
                <div className='text-sm font-semibold text-[#1E293B] lg:text-base'>{driver.name}</div>
                <div className='space-y-1 text-[#1E293B]'>
                  <div className='flex items-center gap-2 text-sm lg:text-base'>
                    <Phone size={16} className='text-[#64748B]' />
                    <span>{driver.phone}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm lg:text-base'>
                    <Mail size={16} className='text-[#64748B]' />
                    <span>{driver.email}</span>
                  </div>
                </div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{driver.licenseNumber}</div>
                <div className='text-sm text-[#1E293B] lg:text-base'>{driver.joinDate}</div>
                <div>
                  <span className={`inline-flex rounded-xl px-3 py-1 text-sm font-semibold lg:text-base ${getStatusClass(driver.status)}`}>
                    {driver.status}
                  </span>
                </div>
                <div className='flex items-center gap-3'>
                  <button
                    type='button'
                    onClick={() => openEditForm(driver)}
                    aria-label={`Edit ${driver.name}`}
                    className='text-[#1E293B] transition hover:text-[#64748B]'
                  >
                    <Pencil size={22} />
                  </button>
                  <button
                    type='button'
                    onClick={() => handleDeleteDriver(driver)}
                    aria-label={`Delete ${driver.name}`}
                    className='text-red-500 transition hover:text-red-600'
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div className='mt-4 flex items-center justify-between gap-3 border-t border-[#64748B]/20 pt-4'>
          <p className='text-sm font-medium text-[#475569]'>
            Page {normalizedPage} of {totalPages} • Showing {paginatedDrivers.length} of {sortedDrivers.length}
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
