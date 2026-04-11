import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, RefreshCw, Repeat, Trash2 } from 'lucide-react';

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

const deriveTitle = (entry = {}) => {
  const data = entry.data || {};
  return (
    data.name ||
    data.title ||
    data.vehicle ||
    data.driver ||
    data.plateNumber ||
    data.label ||
    String(entry.originalId || entry._id || entry.id || entry.type || 'Item')
  );
};

const buildSearchValues = (entry = {}) => {
  const data = entry.data || {};
  return [
    entry.type,
    deriveTitle(entry),
    data.vehicleId,
    data.driverId,
    data.email,
    data.phone,
    data.description
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
};

export default function RecyclePinPage() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [actionState, setActionState] = useState({});

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const data = await api.getRecycleBin();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Unable to load recycle bin entries.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const refreshEntries = () => {
    loadEntries();
  };

  const types = useMemo(() => {
    const collected = new Set(items.map((entry) => entry.type || 'Unknown').filter(Boolean));
    return ['All', ...Array.from(collected).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return items.filter((entry) => {
      if (typeFilter !== 'All' && entry.type !== typeFilter) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const matches = buildSearchValues(entry);
      return matches.some((value) => value.includes(needle));
    });
  }, [items, searchTerm, typeFilter]);

  const totalCount = items.length;

  const summaryCards = [
    { label: 'Total deleted', value: totalCount, intent: 'from-slate-900 to-slate-600', icon: Archive },
    {
      label: 'Vehicles archived',
      value: items.filter((entry) => entry.type === 'Vehicle').length,
      intent: 'from-emerald-500 to-blue-500',
      icon: Repeat
    },
    {
      label: 'Trips & drivers',
      value: items.filter((entry) => entry.type === 'Trip' || entry.type === 'Driver').length,
      intent: 'from-amber-500 to-rose-500',
      icon: Trash2
    }
  ];

  const handleActionState = (key, value) => {
    setActionState((prev) => ({ ...prev, [key]: value }));
  };

  const handleRestore = async (entry) => {
    const key = `restore-${entry._id}`;

    try {
      handleActionState(key, true);
      await api.restoreRecycleBinItem(entry._id);
      setStatusMessage({ type: 'success', text: `${deriveTitle(entry)} restored.` });
      loadEntries();
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Unable to restore the item right now.' });
    } finally {
      handleActionState(key, false);
    }
  };

  const handlePermanentDelete = async (entry) => {
    const key = `delete-${entry._id}`;

    try {
      handleActionState(key, true);
      await api.deleteRecycleBinItem(entry._id);
      setStatusMessage({ type: 'success', text: `${deriveTitle(entry)} removed permanently.` });
      loadEntries();
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Unable to delete the item permanently.' });
    } finally {
      handleActionState(key, false);
    }
  };

  const isActionLoading = (key) => Boolean(actionState[key]);

  return (
    <section className='space-y-6'>
      <header className='flex flex-wrap items-center gap-4'>
        <span className='grid h-12 w-12 place-items-center rounded-2xl bg-slate-900/5 text-slate-900'>
          <Archive size={26} />
        </span>
        <div>
          <h1 className='m-0 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl'>Recycle Bin</h1>
          <p className='mt-1 text-sm text-slate-600'>
            Every deleted record is kept here until you choose to restore it or remove it permanently.
          </p>
        </div>
        <button
          type='button'
          onClick={refreshEntries}
          disabled={loading}
          className='ml-auto inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60'
        >
          <RefreshCw size={16} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      <div className='grid gap-4 md:grid-cols-3'>
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300'
            >
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <p className='m-0 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400'>{card.label}</p>
                  <p className='m-0 text-3xl font-bold tracking-tight text-slate-900'>{card.value}</p>
                </div>
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.intent} text-white`}
                >
                  <Icon size={20} />
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <article className='space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm'>
        <div className='flex flex-wrap items-center gap-3'>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400'
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder='Search by name, plate, driver, etc.'
            className='flex-1 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400'
          />

          <span className='text-xs text-slate-500'>Showing {filteredItems.length} of {totalCount}</span>
        </div>

        {statusMessage ? (
          <p
            className={`rounded-2xl border px-4 py-2 text-sm ${
              statusMessage.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {statusMessage.text}
          </p>
        ) : null}

        <div className='overflow-x-auto'>
          <table className='min-w-full border-collapse text-left text-sm'>
            <thead className='border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500'>
              <tr>
                <th className='px-3 py-2 font-semibold'>Type</th>
                <th className='px-3 py-2 font-semibold'>Name / Title</th>
                <th className='px-3 py-2 font-semibold'>Deleted At</th>
                <th className='px-3 py-2 font-semibold'>Deleted By</th>
                <th className='px-3 py-2 font-semibold text-right'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan='5' className='px-3 py-6 text-center text-xs text-slate-500'>
                    {loading ? 'Loading recycle bin...' : 'No deleted items found.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((entry) => {
                  const key = entry._id || entry.id;
                  return (
                    <tr key={key} className='border-b border-slate-100 last:border-0'>
                      <td className='px-3 py-3 font-semibold text-slate-900'>{entry.type}</td>
                      <td className='px-3 py-3 text-slate-600'>{deriveTitle(entry)}</td>
                      <td className='px-3 py-3 text-slate-600'>
                        {entry.deletedAt ? new Date(entry.deletedAt).toLocaleString() : 'Unknown'}
                      </td>
                      <td className='px-3 py-3 text-slate-600'>{entry.deletedBy || 'System'}</td>
                      <td className='px-3 py-3 text-right'>
                        <div className='flex flex-wrap justify-end gap-2'>
                          <button
                            type='button'
                            onClick={() => handleRestore(entry)}
                            disabled={isActionLoading(`restore-${key}`)}
                            className='inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60'
                          >
                            {isActionLoading(`restore-${key}`) ? 'Restoring...' : 'Restore'}
                          </button>
                          <button
                            type='button'
                            onClick={() => handlePermanentDelete(entry)}
                            disabled={isActionLoading(`delete-${key}`)}
                            className='inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60'
                          >
                            {isActionLoading(`delete-${key}`) ? 'Deleting...' : 'Delete Permanently'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
