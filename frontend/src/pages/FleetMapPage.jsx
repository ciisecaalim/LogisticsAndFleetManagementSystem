import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Activity, MapPinned, RefreshCw, Search, TriangleAlert, Truck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import FleetMapContainer from '../components/map/MapContainer';
import api from '../services/api';

const MAP_CACHE_KEY = 'lfms_map_vehicles_live';
const DEFAULT_CENTER = [2.067, 45.084];
const STATUS_FILTERS = ['All', 'Active', 'Idle', 'In Maintenance'];
const TYPE_FILTERS = ['All', 'Car', 'Bus', 'Van', 'Moto', 'Truck'];

function normalizeType(type) {
  const key = String(type || '')
    .trim()
    .toLowerCase();

  if (key === 'truck') {
    return 'Truck';
  }

  if (key === 'moto' || key === 'motor' || key === 'motorcycle' || key === 'bike') {
    return 'Moto';
  }

  if (key === 'van') {
    return 'Van';
  }

  if (key === 'car') {
    return 'Car';
  }

  if (key === 'bus') {
    return 'Bus';
  }

  return 'Van';
}

function getGpsStatus(lastUpdate, businessStatus) {
  const timestamp = new Date(lastUpdate || 0).getTime();

  if (Number.isNaN(timestamp) || timestamp <= 0) {
    return 'Offline';
  }

  const ageMs = Date.now() - timestamp;

  if (ageMs < 60 * 1000) {
    return 'Online';
  }

  if (businessStatus === 'Idle' || ageMs < 5 * 60 * 1000) {
    return 'Last Seen';
  }

  return 'Offline';
}

function normalizeVehicle(item) {
  const status = item.status || 'Idle';
  const lastUpdate = item.lastUpdate || item.gps?.lastUpdate || item.updatedAt || new Date().toISOString();

  return {
    id: item.id || item._id || item.plateNumber || item.name,
    plateNumber: item.plateNumber || item.name || 'Unknown',
    name: item.plateNumber || item.name || 'Unknown',
    driver: item.driver || item.assignedDriver || 'Unassigned',
    status,
    type: normalizeType(item.type),
    location: item.location || 'Unknown route',
    lat: Number(item.lat ?? item.gps?.lat ?? 0),
    lng: Number(item.lng ?? item.gps?.lng ?? 0),
    speedKmh: Number(item.speedKmh || 0),
    distanceTraveledKm: Number(item.distanceTraveledKm || 0),
    heading: Number(item.heading || 0),
    lastUpdate,
    gpsStatus: item.gpsStatus || getGpsStatus(lastUpdate, status)
  };
}

function getCachedVehicles() {
  try {
    const cached = localStorage.getItem(MAP_CACHE_KEY);
    if (!cached) {
      return [];
    }

    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed.map(normalizeVehicle) : [];
  } catch {
    return [];
  }
}

export default function FleetMapPage() {
  const [searchParams] = useSearchParams();
  const focusPlate = searchParams.get('plate') || '';

  const [vehicles, setVehicles] = useState(getCachedVehicles);
  const [loadError, setLoadError] = useState('');
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [searchTerm, setSearchTerm] = useState(focusPlate);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    let isMounted = true;

    async function refreshMapData() {
      try {
        const data = await api.getMapVehicles();

        if (!isMounted || !Array.isArray(data)) {
          return;
        }

        const normalized = data.map(normalizeVehicle);
        setVehicles(normalized);
        localStorage.setItem(MAP_CACHE_KEY, JSON.stringify(normalized));
        setLastRefreshAt(new Date());
        setLoadError('');
      } catch {
        if (isMounted) {
          setLoadError('Backend unavailable. Showing cached map data.');
        }
      }
    }

    refreshMapData();
    const timerId = window.setInterval(refreshMapData, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (focusPlate) {
      setSearchTerm(focusPlate);
    }
  }, [focusPlate]);

  const filteredVehicles = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const byStatus = statusFilter === 'All' ? true : vehicle.status === statusFilter;
      const byType = typeFilter === 'All' ? true : vehicle.type === typeFilter;

      if (!byStatus || !byType) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const haystack = `${vehicle.plateNumber} ${vehicle.driver} ${vehicle.status} ${vehicle.type} ${vehicle.location}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [vehicles, searchTerm, statusFilter, typeFilter]);

  const highlightedVehicle = useMemo(() => {
    if (!focusPlate) {
      return null;
    }

    const normalizedPlate = focusPlate.trim().toLowerCase();
    return vehicles.find((vehicle) => vehicle.plateNumber.toLowerCase() === normalizedPlate) || null;
  }, [focusPlate, vehicles]);

  const mapCenter = useMemo(() => {
    if (highlightedVehicle && highlightedVehicle.lat && highlightedVehicle.lng) {
      return [highlightedVehicle.lat, highlightedVehicle.lng];
    }

    if (filteredVehicles.length > 0) {
      const firstWithCoords = filteredVehicles.find((vehicle) => vehicle.lat && vehicle.lng);
      if (firstWithCoords) {
        return [firstWithCoords.lat, firstWithCoords.lng];
      }
    }

    return DEFAULT_CENTER;
  }, [filteredVehicles, highlightedVehicle]);

  const totalCount = vehicles.length;
  const onlineCount = vehicles.filter((vehicle) => vehicle.gpsStatus === 'Online').length;
  const lastSeenCount = vehicles.filter((vehicle) => vehicle.gpsStatus === 'Last Seen').length;
  const offlineCount = vehicles.filter((vehicle) => vehicle.gpsStatus === 'Offline').length;

  const mapZoomKey = `${mapCenter[0]}-${mapCenter[1]}-${searchTerm}-${statusFilter}-${typeFilter}-${filteredVehicles.length}`;

  return (
    <section className='space-y-5 pb-4'>
      <header className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <p className='mb-1 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white'>
              <MapPinned size={14} />
              Fleet GPS Monitor
            </p>
            <h1 className='m-0 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl'>Dedicated Map Page</h1>
            <p className='mt-1 text-sm text-slate-600'>
              Live map updates every 10 seconds. GPS online/offline is calculated independently from vehicle status.
            </p>
          </div>

          <div className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600'>
            <p className='m-0 inline-flex items-center gap-2 font-semibold'>
              <RefreshCw size={14} />
              Auto refresh: 10s
            </p>
            <p className='m-0 text-xs'>
              Last sync: {lastRefreshAt ? lastRefreshAt.toLocaleTimeString() : 'Waiting for first sync...'}
            </p>
          </div>
        </div>

        <div className='mt-4 grid gap-3 md:grid-cols-3'>
          <label className='relative md:col-span-1'>
            <Search size={16} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder='Search plate, driver, status, type...'
              className='w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400'
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400'
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400'
          >
            {TYPE_FILTERS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
            <p className='m-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>Total</p>
            <p className='m-0 text-2xl font-bold text-slate-900'>{totalCount}</p>
          </div>
          <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-3'>
            <p className='m-0 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700'>Online GPS</p>
            <p className='m-0 text-2xl font-bold text-emerald-800'>{onlineCount}</p>
          </div>
          <div className='rounded-xl border border-amber-200 bg-amber-50 p-3'>
            <p className='m-0 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700'>Last Seen</p>
            <p className='m-0 text-2xl font-bold text-amber-800'>{lastSeenCount}</p>
          </div>
          <div className='rounded-xl border border-red-200 bg-red-50 p-3'>
            <p className='m-0 text-xs font-semibold uppercase tracking-[0.18em] text-red-700'>Offline</p>
            <p className='m-0 text-2xl font-bold text-red-800'>{offlineCount}</p>
          </div>
        </div>
      </header>

      {loadError ? (
        <p className='inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700'>
          <TriangleAlert size={16} />
          {loadError}
        </p>
      ) : null}

      <FleetMapContainer
        vehicles={filteredVehicles}
        routePoints={[]}
        center={mapCenter}
        zoomKey={mapZoomKey}
      />

      <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
        <h2 className='m-0 text-lg font-semibold text-slate-900'>Live Vehicle Feed</h2>
        <div className='mt-3 grid gap-2'>
          {filteredVehicles.slice(0, 8).map((vehicle) => (
            <div key={vehicle.id} className='grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-5 sm:items-center'>
              <p className='m-0 font-semibold text-slate-900'>{vehicle.plateNumber}</p>
              <p className='m-0 text-sm text-slate-600'>Type: {vehicle.type}</p>
              <p className='m-0 text-sm text-slate-600'>Status: {vehicle.status}</p>
              <p className='m-0 text-sm text-slate-600'>GPS: {vehicle.gpsStatus}</p>
              <p className='m-0 inline-flex items-center gap-1 text-sm text-slate-500'>
                <Activity size={14} />
                {new Date(vehicle.lastUpdate).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>

        {filteredVehicles.length === 0 ? (
          <p className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500'>
            No vehicles match the selected filters.
          </p>
        ) : null}
      </section>

      <div className='rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600'>
        <p className='m-0 inline-flex items-center gap-2 font-semibold text-slate-800'>
          <Truck size={15} />
          Optional enhancements enabled in architecture
        </p>
        <p className='m-0 mt-1'>Route overlays, maintenance alerts, and expanded driver details can be layered on this page without changing core GPS logic.</p>
      </div>
    </section>
  );
}
