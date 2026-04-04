import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Activity, BellRing, LocateFixed, MapPinned, Navigation, RefreshCw, Search, TriangleAlert, Truck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import FleetMapContainer from '../components/map/MapContainer';
import api, { API_BASE_URL } from '../services/api';

const MAP_CACHE_KEY = 'lfms_map_vehicles_live';
const TRIPS_CACHE_KEY = 'lfms_map_trips_live';
const DAYNIILE_CENTER = { lat: 2.0504, lng: 45.3298, label: 'Dayniile, Somalia' };
const DEFAULT_CENTER = [DAYNIILE_CENTER.lat, DAYNIILE_CENTER.lng];
const STATUS_FILTERS = ['All', 'Available', 'Assigned', 'Off'];

function normalizeVehicle(item) {
  return {
    id: item.id || item._id || item.vehicleId || item.plateNumber,
    vehicleId: item.vehicleId || item.id || item._id,
    trackerId: item.trackerId || '',
    tripId: item.tripId || '',
    plateNumber: item.plateNumber || item.name || 'Unknown',
    name: item.plateNumber || item.name || 'Unknown',
    model: item.model || 'Unknown',
    driver: item.driver || 'Unassigned',
    driverId: item.driverId || '',
    status: item.status || 'Available',
    gpsStatus: item.gpsStatus || 'Offline',
    lastUpdate: item.lastUpdate || new Date().toISOString(),
    location: item.location || 'No assigned route',
    lat: Number(item.lat ?? 0),
    lng: Number(item.lng ?? 0),
    speedKmh: Number(item.speedKmh || 0),
    distanceTraveledKm: Number(item.distanceTraveledKm || 0),
    heading: Number(item.heading || 0),
    destination: item.destination || null,
    currentLocation: item.currentLocation || null
  };
}

function normalizeTrip(item) {
  return {
    id: item.id || item._id || item.tripId,
    tripId: item.tripId || item.id || item._id,
    vehicleId: item.vehicleId || '',
    vehicle: item.vehicle || 'Unknown',
    driver: item.driver || 'Unassigned',
    status: item.status || 'Pending',
    from: item.from || item.startLocation?.label || 'Start',
    to: item.to || item.destination?.label || 'Destination',
    departureTime: item.departureTime || null,
    expectedArrivalTime: item.expectedArrivalTime || null,
    startLocation: item.startLocation,
    destination: item.destination,
    currentLocation: item.currentLocation,
    progressPercent: Number(item.progressPercent || 0),
    routeDistanceKm: Number(item.routeDistanceKm || 0),
    remainingDistanceKm: Number(item.remainingDistanceKm || 0),
    isDeviation: Boolean(item.isDeviation),
    reachedDestination: Boolean(item.reachedDestination)
  };
}

function readCache(key, normalizer) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return [];
    }

    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed.map(normalizer) : [];
  } catch {
    return [];
  }
}

function saveCache(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getNotificationTone(level) {
  if (level === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (level === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-700';
}

export default function FleetMapPage() {
  const [searchParams] = useSearchParams();
  const focusPlate = searchParams.get('plate') || '';

  const [vehicles, setVehicles] = useState(() => readCache(MAP_CACHE_KEY, normalizeVehicle));
  const [trips, setTrips] = useState(() => readCache(TRIPS_CACHE_KEY, normalizeTrip));
  const [notifications, setNotifications] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [searchTerm, setSearchTerm] = useState(focusPlate);
  const [statusFilter, setStatusFilter] = useState('All');
  const [driverFilter, setDriverFilter] = useState('All');
  const [myGps, setMyGps] = useState(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [mapFocusMode, setMapFocusMode] = useState('auto');
  const [navRoutePoints, setNavRoutePoints] = useState([]);
  const [navDistanceKm, setNavDistanceKm] = useState(null);
  const [navDurationMin, setNavDurationMin] = useState(null);
  const [navLoading, setNavLoading] = useState(false);
  const [navError, setNavError] = useState('');
  const [routeStartInput, setRouteStartInput] = useState('Your location');
  const [routeDestinationInput, setRouteDestinationInput] = useState('');
  const [manualDestination, setManualDestination] = useState(null);
  const [destinationSearching, setDestinationSearching] = useState(false);
  const [routePanelTab, setRoutePanelTab] = useState('details');

  const handleUseMyGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported in this browser.');
      return;
    }

    setLocating(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyGps({
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude)
        });
        setMapFocusMode('my-location');
        setLocating(false);
      },
      () => {
        setGpsError('Unable to read your GPS location. Please allow location access.');
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000
      }
    );
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [vehicleData, tripData] = await Promise.all([api.getMapVehicles(), api.getMapTrips()]);

        if (!isMounted) {
          return;
        }

        const normalizedVehicles = Array.isArray(vehicleData) ? vehicleData.map(normalizeVehicle) : [];
        const normalizedTrips = Array.isArray(tripData) ? tripData.map(normalizeTrip) : [];

        setVehicles(normalizedVehicles);
        setTrips(normalizedTrips);
        saveCache(MAP_CACHE_KEY, normalizedVehicles);
        saveCache(TRIPS_CACHE_KEY, normalizedTrips);
        setLastRefreshAt(new Date());
        setLoadError('');
      } catch {
        if (isMounted) {
          setLoadError('Backend unavailable. Showing cached map data.');
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const stream = new EventSource(`${API_BASE_URL}/map/stream`);

    stream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data || '{}');
        const incomingVehicles = Array.isArray(payload.vehicles) ? payload.vehicles.map(normalizeVehicle) : [];
        const incomingTrips = Array.isArray(payload.trips) ? payload.trips.map(normalizeTrip) : [];
        const incomingNotifications = Array.isArray(payload.notifications) ? payload.notifications : [];

        setVehicles(incomingVehicles);
        setTrips(incomingTrips);
        saveCache(MAP_CACHE_KEY, incomingVehicles);
        saveCache(TRIPS_CACHE_KEY, incomingTrips);

        if (incomingNotifications.length) {
          setNotifications((prev) => [...incomingNotifications, ...prev].slice(0, 6));
        }

        setLastRefreshAt(new Date());
        setLoadError('');
      } catch {
        // Ignore malformed stream data and keep stream alive.
      }
    };

    stream.onerror = () => {
      setLoadError('Real-time stream interrupted. Reconnecting...');
    };

    return () => {
      stream.close();
    };
  }, []);

  useEffect(() => {
    if (focusPlate) {
      setSearchTerm(focusPlate);
    }
  }, [focusPlate]);

  useEffect(() => {
    if (myGps?.lat && myGps?.lng) {
      setRouteStartInput('Your location');
      return;
    }

    setRouteStartInput(DAYNIILE_CENTER.label);
  }, [myGps]);

  const driverOptions = useMemo(() => {
    const names = new Set(vehicles.map((vehicle) => vehicle.driver).filter(Boolean));
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const byStatus = statusFilter === 'All' ? true : vehicle.status === statusFilter;
      const byDriver = driverFilter === 'All' ? true : vehicle.driver === driverFilter;

      if (!byStatus || !byDriver) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const haystack = [
        vehicle.plateNumber,
        vehicle.driver,
        vehicle.status,
        vehicle.location,
        vehicle.model,
        vehicle.trackerId,
        vehicle.driverId,
        vehicle.vehicleId,
        vehicle.tripId
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [vehicles, searchTerm, statusFilter, driverFilter]);

  const matchedVehicle = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    if (!needle) {
      return null;
    }

    const exact = filteredVehicles.find((vehicle) => {
      const keys = [
        vehicle.plateNumber,
        vehicle.trackerId,
        vehicle.vehicleId,
        vehicle.driverId,
        vehicle.tripId
      ]
        .filter(Boolean)
        .map((item) => String(item).toLowerCase());

      return keys.includes(needle);
    });

    if (exact) {
      return exact;
    }

    return filteredVehicles[0] || null;
  }, [filteredVehicles, searchTerm]);

  const highlightedVehicle = useMemo(() => {
    if (!focusPlate) {
      return null;
    }

    const normalizedPlate = focusPlate.trim().toLowerCase();
    return vehicles.find((vehicle) => vehicle.plateNumber.toLowerCase() === normalizedPlate) || null;
  }, [focusPlate, vehicles]);

  const destinationFocus = useMemo(() => {
    if (matchedVehicle?.destination?.lat && matchedVehicle?.destination?.lng) {
      return {
        lat: Number(matchedVehicle.destination.lat),
        lng: Number(matchedVehicle.destination.lng),
        label: matchedVehicle.destination.label || 'Vehicle destination'
      };
    }

    const linkedTrip = trips.find(
      (trip) =>
        (matchedVehicle?.tripId && trip.tripId === matchedVehicle.tripId) ||
        (matchedVehicle?.vehicleId && trip.vehicleId === matchedVehicle.vehicleId)
    );

    if (linkedTrip?.destination?.lat && linkedTrip?.destination?.lng) {
      return {
        lat: Number(linkedTrip.destination.lat),
        lng: Number(linkedTrip.destination.lng),
        label: linkedTrip.destination.label || linkedTrip.to || 'Trip destination'
      };
    }

    return null;
  }, [matchedVehicle, trips]);

  useEffect(() => {
    if (manualDestination) {
      return;
    }

    if (!routeDestinationInput && destinationFocus?.label) {
      setRouteDestinationInput(destinationFocus.label);
    }
  }, [destinationFocus, manualDestination, routeDestinationInput]);

  const routeStartPoint = useMemo(() => {
    if (myGps?.lat && myGps?.lng) {
      return {
        lat: myGps.lat,
        lng: myGps.lng,
        label: 'Your location'
      };
    }

    return {
      lat: DAYNIILE_CENTER.lat,
      lng: DAYNIILE_CENTER.lng,
      label: DAYNIILE_CENTER.label
    };
  }, [myGps]);

  const routeEndPoint = manualDestination || destinationFocus;

  const handleFindDestination = async () => {
    const query = routeDestinationInput.trim();

    if (!query) {
      setManualDestination(null);
      return;
    }

    setDestinationSearching(true);
    setNavError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Destination lookup failed');
      }

      const results = await response.json();
      const first = Array.isArray(results) ? results[0] : null;

      if (!first) {
        setManualDestination(null);
        setNavError('Destination not found. Try a more specific place name.');
        return;
      }

      setManualDestination({
        lat: Number(first.lat),
        lng: Number(first.lon),
        label: first.display_name
      });
      setMapFocusMode('destination');
    } catch {
      setNavError('Could not search destination right now.');
    } finally {
      setDestinationSearching(false);
    }
  };

  useEffect(() => {
    if (!routeStartPoint || !routeEndPoint) {
      setNavRoutePoints([]);
      setNavDistanceKm(null);
      setNavDurationMin(null);
      setNavError('');
      return;
    }

    let isMounted = true;

    async function fetchRoadRoute() {
      setNavLoading(true);
      setNavError('');

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${routeStartPoint.lng},${routeStartPoint.lat};${routeEndPoint.lng},${routeEndPoint.lat}?overview=full&geometries=geojson`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch route');
        }

        const payload = await response.json();
        const route = payload?.routes?.[0];

        if (!route || !Array.isArray(route.geometry?.coordinates)) {
          throw new Error('No route available');
        }

        if (!isMounted) {
          return;
        }

        const points = route.geometry.coordinates.map(([lng, lat]) => [Number(lat), Number(lng)]);
        setNavRoutePoints(points);
        setNavDistanceKm(Number(route.distance || 0) / 1000);
        setNavDurationMin(Number(route.duration || 0) / 60);
      } catch {
        if (!isMounted) {
          return;
        }
        setNavRoutePoints([]);
        setNavDistanceKm(null);
        setNavDurationMin(null);
        setNavError('Road route unavailable right now. Showing live map only.');
      } finally {
        if (isMounted) {
          setNavLoading(false);
        }
      }
    }

    fetchRoadRoute();

    return () => {
      isMounted = false;
    };
  }, [routeEndPoint, routeStartPoint]);

  const mapCenter = useMemo(() => {
    if (mapFocusMode === 'my-location' && myGps?.lat && myGps?.lng) {
      return [myGps.lat, myGps.lng];
    }

    if (mapFocusMode === 'destination' && routeEndPoint?.lat && routeEndPoint?.lng) {
      return [routeEndPoint.lat, routeEndPoint.lng];
    }

    if (matchedVehicle && matchedVehicle.lat && matchedVehicle.lng) {
      return [matchedVehicle.lat, matchedVehicle.lng];
    }

    if (highlightedVehicle && highlightedVehicle.lat && highlightedVehicle.lng) {
      return [highlightedVehicle.lat, highlightedVehicle.lng];
    }

    if (filteredVehicles.length > 0) {
      const firstWithCoords = filteredVehicles.find((vehicle) => vehicle.lat && vehicle.lng);
      if (firstWithCoords) {
        return [firstWithCoords.lat, firstWithCoords.lng];
      }
    }

    if (myGps && myGps.lat && myGps.lng) {
      return [myGps.lat, myGps.lng];
    }

    return DEFAULT_CENTER;
  }, [filteredVehicles, highlightedVehicle, mapFocusMode, matchedVehicle, myGps, routeEndPoint]);

  const routeColors = {
    Ongoing: '#2563EB',
    Pending: '#F59E0B',
    Completed: '#10B981'
  };

  const tripRoutes = useMemo(
    () =>
      trips
        .filter((trip) => trip.startLocation && trip.destination)
        .map((trip) => {
          const points = [
            [Number(trip.startLocation.lat), Number(trip.startLocation.lng)],
            [Number(trip.currentLocation?.lat ?? trip.startLocation.lat), Number(trip.currentLocation?.lng ?? trip.startLocation.lng)],
            [Number(trip.destination.lat), Number(trip.destination.lng)]
          ];

          return {
            id: trip.id,
            points,
            startPoint: points[0],
            endPoint: points[points.length - 1],
            startLabel: trip.from,
            endLabel: trip.to,
            color: routeColors[trip.status] || '#2563EB'
          };
        }),
    [trips]
  );

  const totalCount = vehicles.length;
  const availableCount = vehicles.filter((vehicle) => vehicle.status === 'Available').length;
  const assignedCount = vehicles.filter((vehicle) => vehicle.status === 'Assigned').length;
  const offCount = vehicles.filter((vehicle) => vehicle.status === 'Off').length;

  const mapZoomKey = `${mapCenter[0]}-${mapCenter[1]}-${mapFocusMode}-${myGps?.lat || ''}-${myGps?.lng || ''}-${routeEndPoint?.lat || ''}-${routeEndPoint?.lng || ''}-${searchTerm}-${statusFilter}-${driverFilter}-${filteredVehicles.length}`;

  return (
    <section className='space-y-5 pb-4'>
      <header className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <p className='mb-1 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white'>
              <MapPinned size={14} />
              Fleet GPS Monitor
            </p>
            <h1 className='m-0 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl'>Real-Time Fleet Map</h1>
            <p className='mt-1 text-sm text-slate-600'>
              Live stream tracks vehicle GPS, route progress, and destination/deviation events.
            </p>
          </div>

          <div className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600'>
            <p className='m-0 inline-flex items-center gap-2 font-semibold'>
              <RefreshCw size={14} />
              Auto refresh: real-time stream
            </p>
            <p className='m-0 text-xs'>
              Last sync: {lastRefreshAt ? lastRefreshAt.toLocaleTimeString() : 'Waiting for first sync...'}
            </p>
            <button
              type='button'
              onClick={handleUseMyGps}
              disabled={locating}
              className='mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60'
            >
              <LocateFixed size={14} />
              {locating ? 'Reading GPS...' : 'Use My GPS'}
            </button>
          </div>
        </div>

        {gpsError ? (
          <p className='mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700'>
            <TriangleAlert size={14} />
            {gpsError}
          </p>
        ) : null}

        {myGps ? (
          <p className='mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900'>
            Your GPS: {myGps.lat.toFixed(5)}, {myGps.lng.toFixed(5)}
          </p>
        ) : null}

        {routeEndPoint ? (
          <p className='mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900'>
            Destination: {routeEndPoint.label} ({routeEndPoint.lat.toFixed(5)}, {routeEndPoint.lng.toFixed(5)})
          </p>
        ) : null}

          {routeStartPoint && routeEndPoint ? (
            <div className='mt-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900'>
              <p className='m-0 inline-flex items-center gap-2'>
                <Navigation size={14} />
                {navLoading
                  ? 'Calculating road route...'
                  : navDistanceKm && navDurationMin
                    ? `Route via roads: ${navDistanceKm.toFixed(1)} km • ${Math.round(navDurationMin)} min`
                    : 'Route metrics unavailable'}
              </p>
              {navError ? <p className='m-0 mt-1 text-[11px] text-amber-700'>{navError}</p> : null}
            </div>
          ) : null}

        <div className='mt-3 flex flex-wrap items-center gap-2'>
          <button
            type='button'
            onClick={() => setMapFocusMode('auto')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              mapFocusMode === 'auto'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Vehicle
          </button>
          <button
            type='button'
            onClick={() => setMapFocusMode('my-location')}
            disabled={!myGps}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
              mapFocusMode === 'my-location'
                ? 'border-blue-700 bg-blue-700 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            My Location
          </button>
          <button
            type='button'
            onClick={() => setMapFocusMode('destination')}
            disabled={!routeEndPoint}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
              mapFocusMode === 'destination'
                ? 'border-emerald-700 bg-emerald-700 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Destination
          </button>
          <button
            type='button'
            onClick={() => {
              setMyGps({ lat: DAYNIILE_CENTER.lat, lng: DAYNIILE_CENTER.lng });
              setRouteStartInput(DAYNIILE_CENTER.label);
              setMapFocusMode('my-location');
              setGpsError('');
            }}
            className='rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100'
          >
            Dayniile
          </button>
        </div>

        <p className='mt-2 text-xs font-medium text-slate-500'>
          Default map area is {DAYNIILE_CENTER.label}.
        </p>

        <section className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4'>
          <div className='grid gap-3 lg:grid-cols-[2fr_1fr]'>
            <div className='space-y-2'>
              <input
                value={routeStartInput}
                onChange={(event) => setRouteStartInput(event.target.value)}
                placeholder='Start location'
                className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400'
              />
              <div className='flex gap-2'>
                <input
                  value={routeDestinationInput}
                  onChange={(event) => {
                    setRouteDestinationInput(event.target.value);
                    setManualDestination(null);
                  }}
                  placeholder='Destination (example: Dayniile Hospital)'
                  className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400'
                />
                <button
                  type='button'
                  onClick={handleFindDestination}
                  disabled={destinationSearching}
                  className='rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60'
                >
                  {destinationSearching ? 'Finding...' : 'Find Route'}
                </button>
              </div>
            </div>
            <div className='rounded-xl border border-slate-200 bg-white p-3'>
              <p className='m-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>Leave now</p>
              <p className='m-0 mt-1 text-sm font-semibold text-slate-800'>Driving route mode</p>
              <p className='m-0 mt-2 text-xs text-slate-600'>
                {navDistanceKm && navDurationMin
                  ? `${navDistanceKm.toFixed(1)} km • ${Math.round(navDurationMin)} min`
                  : 'Distance/time updates after route search'}
              </p>
            </div>
          </div>

          <div className='mt-3 flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setRoutePanelTab('details')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                routePanelTab === 'details' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
              }`}
            >
              Details
            </button>
            <button
              type='button'
              onClick={() => setRoutePanelTab('preview')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                routePanelTab === 'preview' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
              }`}
            >
              Preview
            </button>
          </div>

          {routePanelTab === 'details' ? (
            <div className='mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700'>
              <p className='m-0'>Start: {routeStartPoint?.label || routeStartInput}</p>
              <p className='m-0 mt-1'>Destination: {routeEndPoint?.label || routeDestinationInput || 'Not selected'}</p>
              {navError ? <p className='m-0 mt-1 text-amber-700'>{navError}</p> : null}
            </div>
          ) : (
            <div className='mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700'>
              <p className='m-0'>Route preview is active on the map.</p>
              <p className='m-0 mt-1'>Use My Location, Destination, and Find Route to refresh the path.</p>
            </div>
          )}
        </section>

        <div className='mt-4 grid gap-3 md:grid-cols-4'>
          <label className='relative md:col-span-2'>
            <Search size={16} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder='Search plate, trackerId, vehicleId, driverId, or tripId (e.g. A123)'
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
            value={driverFilter}
            onChange={(event) => setDriverFilter(event.target.value)}
            className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400'
          >
            {driverOptions.map((driver) => (
              <option key={driver} value={driver}>
                {driver}
              </option>
            ))}
          </select>
        </div>

        <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
            <p className='m-0 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>Total Vehicles</p>
            <p className='m-0 text-2xl font-bold text-slate-900'>{totalCount}</p>
          </div>
          <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-3'>
            <p className='m-0 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700'>Available</p>
            <p className='m-0 text-2xl font-bold text-emerald-800'>{availableCount}</p>
          </div>
          <div className='rounded-xl border border-blue-200 bg-blue-50 p-3'>
            <p className='m-0 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700'>Assigned</p>
            <p className='m-0 text-2xl font-bold text-blue-800'>{assignedCount}</p>
          </div>
          <div className='rounded-xl border border-red-200 bg-red-50 p-3'>
            <p className='m-0 text-xs font-semibold uppercase tracking-[0.18em] text-red-700'>Off</p>
            <p className='m-0 text-2xl font-bold text-red-800'>{offCount}</p>
          </div>
        </div>
      </header>

      {loadError ? (
        <p className='inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700'>
          <TriangleAlert size={16} />
          {loadError}
        </p>
      ) : null}

      {matchedVehicle ? (
        <section className='rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm'>
          <h2 className='m-0 text-lg font-semibold text-blue-900'>Matched Tracker Result</h2>
          <div className='mt-2 grid gap-2 text-sm text-blue-900 sm:grid-cols-2 lg:grid-cols-3'>
            <p className='m-0'><span className='font-semibold'>Plate:</span> {matchedVehicle.plateNumber}</p>
            <p className='m-0'><span className='font-semibold'>Tracker ID:</span> {matchedVehicle.trackerId || 'N/A'}</p>
            <p className='m-0'><span className='font-semibold'>Vehicle ID:</span> {matchedVehicle.vehicleId || 'N/A'}</p>
            <p className='m-0'><span className='font-semibold'>Driver ID:</span> {matchedVehicle.driverId || 'N/A'}</p>
            <p className='m-0'><span className='font-semibold'>Trip ID:</span> {matchedVehicle.tripId || 'N/A'}</p>
            <p className='m-0'><span className='font-semibold'>GPS:</span> {matchedVehicle.lat.toFixed(5)}, {matchedVehicle.lng.toFixed(5)}</p>
          </div>
        </section>
      ) : null}

      {notifications.length > 0 ? (
        <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
          <h2 className='m-0 inline-flex items-center gap-2 text-lg font-semibold text-slate-900'>
            <BellRing size={16} />
            Fleet Notifications
          </h2>
          <div className='mt-3 grid gap-2'>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-xl border px-3 py-2 text-sm ${getNotificationTone(notification.level)}`}
              >
                <p className='m-0 font-semibold'>{notification.message}</p>
                <p className='m-0 text-xs opacity-80'>
                  {new Date(notification.timestamp).toLocaleTimeString()} • {notification.type}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <FleetMapContainer
        vehicles={filteredVehicles}
        routePoints={navRoutePoints}
        center={mapCenter}
        zoomKey={mapZoomKey}
        tripRoutes={tripRoutes}
        selectedStart={routeStartPoint ? { label: routeStartPoint.label } : null}
        selectedEnd={routeEndPoint ? { label: routeEndPoint.label } : null}
        gpsLocation={myGps}
      />

      <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
        <h2 className='m-0 text-lg font-semibold text-slate-900'>Trip Progress Monitor</h2>
        <div className='mt-3 grid gap-3'>
          {trips.slice(0, 10).map((trip) => (
            <div key={trip.id} className='rounded-xl border border-slate-100 bg-slate-50 p-3'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <p className='m-0 font-semibold text-slate-900'>
                  {trip.vehicle} • {trip.driver}
                </p>
                <p className='m-0 text-sm text-slate-600'>{trip.status}</p>
              </div>
              <p className='m-0 mt-1 text-sm text-slate-600'>
                {trip.from} {'->'} {trip.to}
              </p>
              <div className='mt-2 h-2 rounded-full bg-slate-200'>
                <div
                  className='h-2 rounded-full bg-blue-500 transition-all duration-700'
                  style={{ width: `${Math.max(0, Math.min(100, trip.progressPercent))}%` }}
                />
              </div>
              <p className='m-0 mt-2 inline-flex items-center gap-1 text-xs text-slate-500'>
                <Activity size={14} />
                {trip.progressPercent}% complete • Remaining {trip.remainingDistanceKm.toFixed(1)} km
              </p>
            </div>
          ))}
        </div>

        {trips.length === 0 ? (
          <p className='mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500'>
            No trips found for live monitoring.
          </p>
        ) : null}
      </section>

      <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
        <h2 className='m-0 text-lg font-semibold text-slate-900'>Live Vehicle Feed</h2>
        <div className='mt-3 grid gap-2'>
          {filteredVehicles.slice(0, 8).map((vehicle) => (
            <div key={vehicle.id} className='grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-5 sm:items-center'>
              <p className='m-0 font-semibold text-slate-900'>{vehicle.plateNumber}</p>
              <p className='m-0 text-sm text-slate-600'>Driver: {vehicle.driver}</p>
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
          Real-time fleet mode enabled
        </p>
        <p className='m-0 mt-1'>
          Driver assignment, trip overlays, route monitoring, and tracking notifications are synchronized from the live stream.
        </p>
      </div>
    </section>
  );
}
