import { Check, Pencil, Plus, Trash2, X, Package, Route, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import StatsBanner from '../components/StatsBanner';

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

const SHIPMENT_STATUS_OPTIONS = ['All', 'Pending', 'Assigned', 'In Transit', 'Delivered'];

const EMPTY_SHIPMENT_FORM = {
  productName: '',
  quantity: '',
  destination: '',
  status: 'Pending',
  tripId: ''
};

function getShipmentKey(shipment) {
  return shipment._id || shipment.id || shipment.shipmentId;
}

function formatStatusBadge(status) {
  switch (status) {
    case 'Delivered':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'In Transit':
      return 'bg-sky-100 text-sky-700 border border-sky-200';
    case 'Assigned':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [availableTrips, setAvailableTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState(EMPTY_SHIPMENT_FORM);
  const [statusFilter, setStatusFilter] = useState('All');
  const [saving, setSaving] = useState(false);
  const shipmentStats = useMemo(() => {
    const total = shipments.length;
    const pending = shipments.filter((shipment) => shipment.status === 'Pending').length;
    const assigned = shipments.filter((shipment) => shipment.status === 'Assigned').length;
    const inTransit = shipments.filter((shipment) => shipment.status === 'In Transit').length;
    const delivered = shipments.filter((shipment) => shipment.status === 'Delivered').length;

    return { total, pending, assigned, inTransit, delivered };
  }, [shipments]);

  const statsItems = useMemo(
    () => [
      {
        key: 'totalShipments',
        label: 'Total Shipments',
        helper: 'All loads',
        icon: Package,
        tone: 'slate',
        value: String(shipmentStats.total)
      },
      {
        key: 'pendingShipments',
        label: 'Pending Shipments',
        helper: 'Awaiting assignment',
        icon: Check,
        tone: 'amber',
        value: String(shipmentStats.pending)
      },
      {
        key: 'assignedShipments',
        label: 'Assigned Shipments',
        helper: 'Drivers allocated',
        icon: Truck,
        tone: 'emerald',
        value: String(shipmentStats.assigned)
      },
      {
        key: 'inTransitShipments',
        label: 'In Transit',
        helper: 'On the road',
        icon: Route,
        tone: 'blue',
        value: String(shipmentStats.inTransit)
      },
      {
        key: 'deliveredShipments',
        label: 'Delivered',
        helper: 'Completed loads',
        icon: Check,
        tone: 'slate',
        value: String(shipmentStats.delivered)
      }
    ],
    [shipmentStats]
  );

  const statusCounts = useMemo(() => {
    const result = {
      Pending: shipmentStats.pending,
      Assigned: shipmentStats.assigned,
      'In Transit': shipmentStats.inTransit,
      Delivered: shipmentStats.delivered
    };
    const max = Math.max(...Object.values(result), 1);
    return { result, max };
  }, [shipmentStats]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);

      try {
        const [shipmentData, tripData] = await Promise.all([api.getShipments(), api.getTrips()]);
        if (!mounted) return;

        setShipments(Array.isArray(shipmentData) ? shipmentData : []);
        setAvailableTrips(Array.isArray(tripData) ? tripData : []);
        setError('');
      } catch (err) {
        if (mounted) {
          setError('Unable to reach backend. Try refreshing.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredShipments = useMemo(() => {
    if (statusFilter === 'All') {
      return shipments;
    }
    return shipments.filter((shipment) => shipment.status === statusFilter);
  }, [shipments, statusFilter]);

  const tripOptions = useMemo(() => {
    return availableTrips.map((trip) => ({
      value: trip._id || trip.id,
      label: trip.tripId
        ? `${trip.tripId} • ${trip.vehicle} (${trip.from} → ${trip.to})`
        : `${trip.vehicle} • ${trip.from} → ${trip.to}`
    }));
  }, [availableTrips]);

  const openAddForm = () => {
    setFormMode('add');
    setEditingId('');
    setFormData(EMPTY_SHIPMENT_FORM);
    setError('');
  };

  const openEditForm = (shipment) => {
    const shipmentKey = getShipmentKey(shipment);
    if (!shipmentKey) {
      setError('Select a valid shipment before editing.');
      return;
    }

    setFormMode('edit');
    setEditingId(shipmentKey);
    setFormData({
      productName: shipment.productName || '',
      quantity: shipment.quantity || '',
      destination: shipment.destination || '',
      status: shipment.status || 'Pending',
      tripId: shipment.tripId || ''
    });
    setError('');
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId('');
    setFormData(EMPTY_SHIPMENT_FORM);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.productName.trim() || !formData.destination.trim()) {
      setError('Product name and destination are required.');
      return;
    }

    const parsedQuantity = Number(formData.quantity);
    if (!formData.quantity || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }

    setSaving(true);

    const payload = {
      productName: formData.productName.trim(),
      destination: formData.destination.trim(),
      quantity: parsedQuantity,
      status: formData.status,
      tripId: formData.tripId || undefined
    };

    try {
      if (formMode === 'add') {
        const created = await api.createShipment(payload);
        setShipments((prev) => [created, ...prev]);
      } else if (formMode === 'edit' && editingId) {
        const updated = await api.updateShipment(editingId, payload);
        setShipments((prev) =>
          prev.map((item) => (getShipmentKey(item) === editingId ? updated : item))
        );
      }
      setError('');
      closeForm();
    } catch {
      setError('Save failed. Check backend service.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (shipment) => {
    const shipmentKey = getShipmentKey(shipment);
    if (!shipmentKey) {
      setError('Select a valid shipment before deleting.');
      return;
    }

    try {
      await api.deleteShipment(shipmentKey);
      setShipments((prev) => prev.filter((item) => getShipmentKey(item) !== shipmentKey));
      setError('');
    } catch {
      setError('Delete failed. Check backend service.');
    }
  };

  return (
    <section className='space-y-6 pb-8'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='page-title m-0 text-3xl font-bold tracking-tight sm:text-4xl'>Shipments</h1>
          <p className='mt-1 text-base font-medium text-[#1E293B] sm:text-lg'>Track all loads linked to trips</p>
        </div>

        <div className='flex items-center gap-3'>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className='rounded-xl border border-[#64748B]/25 bg-white px-3 py-2 text-sm text-[#1E293B]'
          >
            {SHIPMENT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            type='button'
            onClick={openAddForm}
            className='inline-flex items-center gap-2 rounded-xl bg-[#020617] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#1E293B]'
          >
            <Plus size={18} strokeWidth={2.4} />
            Create Shipment
          </button>
        </div>
      </header>

      <StatsBanner items={statsItems} />

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-[#1E293B]'>Shipment Status Overview</h2>
          <p className='text-sm text-[#64748B]'>Updated live</p>
        </div>
        <div className='mt-4 grid gap-4 md:grid-cols-4'>
          {Object.entries(statusCounts.result).map(([status, value]) => (
            <div key={status} className='space-y-2'>
              <div className='text-xs font-semibold uppercase tracking-[0.3em] text-[#94a3b8]'>{status}</div>
              <div className='h-2 rounded-full bg-[#e2e8f0]'>
                <div
                  className='h-full rounded-full'
                  style={{
                    width: `${(value / statusCounts.max) * 100}%`,
                    background:
                      status === 'Pending'
                        ? '#fbbf24'
                        : status === 'Assigned'
                          ? '#10b981'
                          : status === 'In Transit'
                            ? '#3b82f6'
                            : '#22c55e'
                  }}
                />
              </div>
              <p className='text-sm font-semibold text-[#1E293B]'>{value}</p>
            </div>
          ))}
        </div>
      </article>

      {error ? (
        <p className='rounded-xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-4 py-2 text-sm text-[#92400E]'>{error}</p>
      ) : null}

      {formMode ? (
        <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-[#1E293B]'>{formMode === 'add' ? 'Add Shipment' : 'Update Shipment'}</h2>
            <button type='button' onClick={closeForm} className='text-[#1E293B]'>
              <X size={18} />
            </button>
          </div>
          <div className='mt-4 grid gap-4 md:grid-cols-3'>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Product Name
              <input
                name='productName'
                value={formData.productName}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
              />
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Quantity
              <input
                name='quantity'
                type='number'
                min='1'
                value={formData.quantity}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
              />
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B]'>
              Destination
              <input
                name='destination'
                value={formData.destination}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
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
                {SHIPMENT_STATUS_OPTIONS.filter((option) => option !== 'All').map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className='grid gap-1 text-sm text-[#1E293B] md:col-span-2'>
              Assign to Trip (optional)
              <select
                name='tripId'
                value={formData.tripId}
                onChange={handleFormChange}
                className='rounded-lg border border-[#64748B]/25 px-3 py-2'
              >
                <option value=''>Select a trip</option>
                {tripOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className='mt-4 flex items-center gap-3'>
            <button
              type='button'
              onClick={handleSave}
              disabled={saving}
              className='rounded-xl bg-[#020617] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:opacity-60'
            >
              {saving ? 'Saving...' : formMode === 'add' ? 'Create Shipment' : 'Update Shipment'}
            </button>
            <button
              type='button'
              onClick={closeForm}
              className='rounded-xl border border-[#64748B]/25 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E293B]'
            >
              Cancel
            </button>
          </div>
        </article>
      ) : null}

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <h2 className='m-0 text-xl font-semibold text-[#1E293B]'>All Shipments</h2>

        <div className='mt-6 overflow-x-auto'>
          <div className='min-w-[720px]'>
            {loading && shipments.length === 0 ? (
              <p className='px-3 py-5 text-sm text-[#64748B]'>Loading shipments...</p>
            ) : null}
            {!loading && shipments.length === 0 ? (
              <p className='px-3 py-5 text-sm text-[#64748B]'>No shipments available yet.</p>
            ) : null}

            <div className='grid grid-cols-[1fr_1fr_0.6fr_1.2fr_1fr_0.9fr_0.8fr] border-b border-[#64748B]/20 px-3 py-3 text-left text-sm font-semibold text-[#1E293B]'>
              <div>Shipment</div>
              <div>Product</div>
              <div>Qty</div>
              <div>Destination</div>
              <div>Status</div>
              <div>Trip</div>
              <div>Actions</div>
            </div>

            {filteredShipments.map((shipment) => {
              const key = getShipmentKey(shipment);
              return (
                <div key={key} className='grid grid-cols-[1fr_1fr_0.6fr_1.2fr_1fr_0.9fr_0.8fr] border-b border-[#64748B]/20 px-3 py-4 text-sm text-[#1E293B]'>
                  <div className='font-semibold'>{shipment.shipmentId || '—'}</div>
                  <div>{shipment.productName}</div>
                  <div>{shipment.quantity || '—'}</div>
                  <div>{shipment.destination}</div>
                  <div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${formatStatusBadge(shipment.status)}`}>
                      {shipment.status}
                    </span>
                  </div>
                  <div className='text-sm text-[#475569]'>
                    {shipment.tripLabel || (shipment.tripId ? `Trip ${shipment.tripId}` : 'Unassigned')}
                  </div>
                  <div className='flex items-center gap-3'>
                    <button
                      type='button'
                      onClick={() => openEditForm(shipment)}
                      className='text-[#1E293B] transition hover:text-[#64748B]'
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      type='button'
                      onClick={() => handleDelete(shipment)}
                      className='text-red-500 transition hover:text-red-600'
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </article>
    </section>
  );
}
