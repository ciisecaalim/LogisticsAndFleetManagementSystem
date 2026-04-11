import { Boxes, Plus, Warehouse, X, Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const warehousingApi = axios.create({ baseURL: API_BASE_URL });

function createEmptyForm() {
  return {
    name: '',
    manager: '',
    progress: '50',
    type: 'Receiving',
    timestamp: ''
  };
}

function normalizeWarehousingItem(item) {
  return {
    id: item._id || item.id,
    zoneName: item.zoneName,
    managerName: item.managerName,
    progress: Number(item.progress || 0),
    zoneType: item.zoneType,
    activityType: item.activityType,
    timestamp: item.timestamp,
    status: item.status
  };
}

function statusClass(status) {
  if (status === 'Completed') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'In Progress') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-slate-100 text-slate-600';
}

export default function WarehousingPage() {
  const [warehousingItems, setWarehousingItems] = useState(new Array());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadWarehousing = async () => {
      try {
        const response = await warehousingApi.get('/warehousing');
        const data = response.data?.data ?? response.data ?? response;

        if (!isMounted) {
          return;
        }

        const normalized = Array.isArray(data) ? data.map(normalizeWarehousingItem) : new Array();
        setWarehousingItems(normalized);
        setError('');
      } catch {
        if (isMounted) {
          setError('Unable to load warehousing data right now.');
          setWarehousingItems(new Array());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWarehousing();

    return () => {
      isMounted = false;
    };
  }, []);

  const persist = (nextItems) => {
    setWarehousingItems(nextItems);
  };

  const openForm = () => {
    setFormData(createEmptyForm());
    setEditingId('');
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.zoneName,
      manager: item.managerName,
      progress: String(item.progress),
      type: item.zoneType,
      timestamp: item.timestamp
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormData(createEmptyForm());
    setEditingId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.manager.trim()) {
      return;
    }

    const progress = Number(formData.progress);
    const zoneName = formData.name.trim();

    const payload = {
      zoneName: zoneName,
      managerName: formData.manager.trim(),
      progress: Number.isNaN(progress) ? 0 : Math.max(0, Math.min(progress, 100)),
      zoneType: formData.type,
      activityType: formData.type,
      timestamp: formData.timestamp || new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'Scheduled'
    };

    try {
      let response;

      if (editingId) {
        response = await warehousingApi.put(`/warehousing/${editingId}`, payload);
      } else {
        response = await warehousingApi.post('/warehousing', payload);
      }

      const savedItem = normalizeWarehousingItem(response.data?.data ?? response.data ?? payload);

      if (editingId) {
        persist(warehousingItems.map((item) => (item.id === editingId ? savedItem : item)));
      } else {
        persist([savedItem, ...warehousingItems]);
      }

      closeForm();
    } catch {
      setError('Unable to save the warehousing record right now.');
    }
  };

  const deleteZone = async (zoneId) => {
    try {
      await warehousingApi.delete(`/warehousing/${zoneId}`);
      persist(warehousingItems.filter((item) => item.id !== zoneId));
    } catch {
      setError('Unable to delete the warehousing record right now.');
    }
  };

  const totalStorageCapacity = 50000;
  const usedSpace = Math.round(warehousingItems.reduce((sum, zone) => sum + zone.progress, 0) / warehousingItems.length || 0);
  const activeZones = warehousingItems.length;
  const pendingShipments = warehousingItems.filter((item) => item.status !== 'Completed').length;
  const zones = warehousingItems;
  const activities = warehousingItems;

  return (
    <section className='space-y-6 rounded-3xl bg-gray-50 p-5 sm:p-6'>
      <header className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-slate-400'>Warehouse Operations</p>
          <h1 className='mt-1 text-3xl font-bold tracking-tight text-slate-800'>Warehouse Operations</h1>
          <p className='mt-1 text-sm text-slate-500'>Monitor storage, zones, and recent warehouse activities in one place.</p>
        </div>

        <button
          type='button'
          onClick={openForm}
          className='inline-flex items-center gap-2 rounded-[18px] border border-slate-950/90 bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:bg-slate-800'
        >
          <span className='grid h-6 w-6 place-items-center rounded-full bg-white/10'>
            <Plus size={14} />
          </span>
          Allocate Space
        </button>
      </header>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <article className='rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
          <p className='text-sm font-medium text-slate-500'>Total Storage Capacity</p>
          <div className='mt-3 flex items-end gap-2'>
            <h2 className='text-3xl font-bold text-slate-900'>{totalStorageCapacity.toLocaleString()}</h2>
            <span className='pb-1 text-sm text-slate-500'>sq ft</span>
          </div>
        </article>

        <article className='rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
          <p className='text-sm font-medium text-slate-500'>Used Space</p>
          <h2 className='mt-3 text-3xl font-bold text-slate-900'>{usedSpace}%</h2>
        </article>

        <article className='rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
          <p className='text-sm font-medium text-slate-500'>Active Zones</p>
          <h2 className='mt-3 text-3xl font-bold text-slate-900'>{activeZones}</h2>
        </article>

        <article className='rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
          <p className='text-sm font-medium text-slate-500'>Pending Incoming Shipments</p>
          <h2 className='mt-3 text-3xl font-bold text-slate-900'>{pendingShipments}</h2>
        </article>
      </div>

      {error ? (
        <p className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700'>{error}</p>
      ) : null}

      <div className='rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
        <div className='mb-5 flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-xl font-bold text-slate-900'>Warehouse Zones Overview</h2>
            <p className='text-sm text-slate-500'>Use the grid to see each zone, its manager, and how full it is.</p>
          </div>
          <Warehouse className='text-slate-400' size={20} />
        </div>

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {zones.map((zone) => (
            <article key={zone.id} className='rounded-[22px] border border-slate-200 bg-slate-50 p-5'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <h3 className='text-base font-bold text-slate-900'>{zone.zoneName}</h3>
                  <p className='mt-1 text-sm text-slate-500'>Manager: {zone.managerName}</p>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600'>{zone.zoneType}</span>
                  <button
                    type='button'
                    onClick={() => openEditForm(zone)}
                    className='rounded-full bg-white p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700'
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type='button'
                    onClick={() => deleteZone(zone.id)}
                    className='rounded-full bg-white p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600'
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className='mt-5'>
                <div className='mb-2 flex items-center justify-between text-sm text-slate-500'>
                  <span>Storage Usage</span>
                  <span>{zone.progress}%</span>
                </div>
                <div className='h-3 overflow-hidden rounded-full bg-slate-200'>
                  <div
                    className='h-full rounded-full bg-slate-900'
                    style={{ width: `${Math.max(0, Math.min(zone.progress, 100))}%` }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className='overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
        <div className='border-b border-slate-200 px-6 py-4'>
          <h2 className='text-xl font-bold text-slate-900'>Recent Warehouse Activities</h2>
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-slate-200'>
            <thead className='bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>
              <tr>
                <th className='px-6 py-4'>Activity ID</th>
                <th className='px-6 py-4'>Type</th>
                <th className='px-6 py-4'>Zone</th>
                <th className='px-6 py-4'>Timestamp</th>
                <th className='px-6 py-4'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {activities.map((item) => (
                <tr key={item.id} className='hover:bg-slate-50/70'>
                  <td className='px-6 py-4 text-sm font-semibold text-slate-900'>{item.id}</td>
                  <td className='px-6 py-4 text-sm text-slate-600'>{item.activityType}</td>
                  <td className='px-6 py-4 text-sm text-slate-600'>{item.zoneName}</td>
                  <td className='px-6 py-4 text-sm text-slate-600'>{item.timestamp}</td>
                  <td className='px-6 py-4'>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6'>
          <div className='w-full max-w-2xl rounded-3xl bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)]'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.28em] text-slate-400'>Warehouse Space</p>
                <h2 className='mt-1 text-2xl font-bold text-slate-800'>{editingId ? 'Edit Warehouse Zone' : 'Allocate Space'}</h2>
              </div>
              <button
                type='button'
                onClick={closeForm}
                className='rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700'
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='mt-6 grid gap-4 md:grid-cols-2'>
              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Zone Name
                <input
                  type='text'
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                />
              </label>

              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Manager Name
                <input
                  type='text'
                  value={formData.manager}
                  onChange={(event) => setFormData((current) => ({ ...current, manager: event.target.value }))}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                />
              </label>

              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Zone Type
                <select
                  value={formData.type}
                  onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value }))}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                >
                  <option value='Receiving'>Receiving</option>
                  <option value='Dispatch'>Dispatch</option>
                  <option value='Cold Chain'>Cold Chain</option>
                  <option value='Internal Transfer'>Internal Transfer</option>
                </select>
              </label>

              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Occupancy Progress
                <input
                  type='number'
                  min='0'
                  max='100'
                  value={formData.progress}
                  onChange={(event) => setFormData((current) => ({ ...current, progress: event.target.value }))}
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                />
              </label>

              <label className='grid gap-2 text-sm font-medium text-slate-600'>
                Timestamp
                <input
                  type='text'
                  value={formData.timestamp}
                  onChange={(event) => setFormData((current) => ({ ...current, timestamp: event.target.value }))}
                  placeholder='2026-04-11 08:30'
                  className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-slate-400'
                />
              </label>

              <div className='md:col-span-2 flex items-center justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={closeForm}
                  className='rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800'
                >
                  <Boxes size={16} />
                  {editingId ? 'Update Allocation' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}