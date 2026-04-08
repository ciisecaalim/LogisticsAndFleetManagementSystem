export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

export const api = {
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

export default api;
