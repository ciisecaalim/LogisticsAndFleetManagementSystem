import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPinned, Navigation, Route, Truck, Clock3 } from 'lucide-react';
import FleetMapContainer from '../components/map/MapContainer';
import InfoPanel from '../components/map/InfoPanel';
import api from '../services/api';

const routeStart = {
  label: 'Mogadishu Port',
  lat: 2.0469,
  lng: 45.3182
};

const routeEnd = {
  label: 'Afgooye Junction',
  lat: 2.094,
  lng: 44.851
};

const defaultCenter = [2.067, 45.084];
const MAP_CACHE_KEY = 'lfms_map_vehicles';

const initialVehicles = [
  {
    id: 1,
    name: 'VAN-204',
    driver: 'John Smith',
    status: 'Moving',
    location: 'Manhattan Distribution Center',
    lat: 40.7589,
    lng: -73.9851,
    speedKmh: 54,
    distanceTraveledKm: 128.4,
    heading: 130
  },
  {
    id: 2,
    name: 'TRK-118',
    driver: 'Sarah Johnson',
    status: 'Idle',
    location: 'Brooklyn Service Yard',
    lat: 40.6782,
    lng: -73.9442,
    speedKmh: 0,
    distanceTraveledKm: 96.7,
    heading: 25
  },
  {
    id: 3,
    name: 'TRK-309',
    driver: 'Michael Davis',
    status: 'Stopped',
    location: 'Jersey City Depot',
    lat: 40.7282,
    lng: -74.0776,
    speedKmh: 0,
    distanceTraveledKm: 154.1,
    heading: 200
  },
  {
    id: 4,
    name: 'VAN-512',
    driver: 'Emily Wilson',
    status: 'Moving',
    location: 'Queens Delivery Loop',
    lat: 40.742,
    lng: -73.7749,
    speedKmh: 47,
    distanceTraveledKm: 81.9,
    heading: 95
  },
  {
    id: 5,
    name: 'TRK-827',
    driver: 'David Brown',
    status: 'Idle',
    location: 'Harlem Fuel Stop',
    lat: 40.8116,
    lng: -73.9465,
    speedKmh: 0,
    distanceTraveledKm: 112.2,
    heading: 315
  }
];

const locationIndex = [
  { label: routeStart.label, lat: routeStart.lat, lng: routeStart.lng },
  { label: routeEnd.label, lat: routeEnd.lat, lng: routeEnd.lng },
  { label: 'Somalia Coast', lat: 0.376, lng: 44.529 },
  { label: 'Dayniile Substation', lat: 2.135, lng: 45.273 },
  { label: 'Hargeisa Logistics Park', lat: 9.561, lng: 44.082 },
  { label: 'Kismayo Port Terminal', lat: -0.35, lng: 42.545 },
  { label: 'Garowe Distribution Front', lat: 8.404, lng: 48.485 },
  { label: 'Afgooye Supply Line', lat: 2.062, lng: 44.763 },
  { label: 'Daynile Secondary Hub', lat: 2.105, lng: 45.279 },
  { label: 'Somalia', lat: 2.0469, lng: 45.3182 }
];

function matchLocation(query) {
  if (!query || !query.trim()) {
    return null;
  }

  const normalized = query.trim().toLowerCase();
  return (
    locationIndex.find((location) => location.label.toLowerCase().includes(normalized)) ||
    locationIndex.find((location) => normalized.includes(location.label.toLowerCase()))
  );
}

const routeWaypoints = [
  { lat: 2.106, lng: 45.210 },
  { lat: 2.119, lng: 44.945 },
  { lat: 2.066, lng: 44.905 }
];

function haversineDistanceKm(start, end) {
  const radius = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;
  const deltaLat = toRadians(end[0] - start[0]);
  const deltaLng = toRadians(end[1] - start[1]);
  const lat1 = toRadians(start[0]);
  const lat2 = toRadians(end[0]);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTravelTime(hours) {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (wholeHours === 0) {
    return `${minutes}m`;
  }

  return `${wholeHours}h ${minutes}m`;
}

export default function FleetMapPage() {
  const [vehicles, setVehicles] = useState(() => {
    try {
      const cached = localStorage.getItem(MAP_CACHE_KEY);
      return cached ? JSON.parse(cached) : initialVehicles;
    } catch {
      return initialVehicles;
    }
  });
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [focusKey, setFocusKey] = useState('default');
  const [selectedStartLabel, setSelectedStartLabel] = useState(routeStart.label);
  const [selectedEndLabel, setSelectedEndLabel] = useState(routeEnd.label);
  const [startInput, setStartInput] = useState(routeStart.label);
  const [endInput, setEndInput] = useState(routeEnd.label);
  const [useGpsStart, setUseGpsStart] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const locationLookup = useMemo(
    () =>
      locationIndex.reduce((acc, location) => {
        acc[location.label] = location;
        return acc;
      }, {}),
    []
  );
  const selectedStart = useMemo(() => {
    if (useGpsStart && gpsLocation) {
      return {
        label: gpsLocation.label || 'My Location',
        lat: gpsLocation.lat,
        lng: gpsLocation.lng
      };
    }

    return locationLookup[selectedStartLabel] || routeStart;
  }, [useGpsStart, gpsLocation, selectedStartLabel, locationLookup]);
  const selectedEnd = useMemo(() => locationLookup[selectedEndLabel] || routeEnd, [selectedEndLabel, locationLookup]);

  useEffect(() => {
    if (useGpsStart && gpsLocation) {
      setStartInput('My Location');
      return;
    }

    setStartInput(selectedStartLabel);
  }, [selectedStartLabel, useGpsStart, gpsLocation]);

  useEffect(() => {
    setEndInput(selectedEndLabel);
  }, [selectedEndLabel]);

  useEffect(() => {
    let isMounted = true;

    api
      .getMapVehicles()
      .then((backendVehicles) => {
        if (isMounted && Array.isArray(backendVehicles) && backendVehicles.length > 0) {
          setVehicles(backendVehicles);
          localStorage.setItem(MAP_CACHE_KEY, JSON.stringify(backendVehicles));
          setLoadError('');
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError('Backend unavailable. Showing cached map data.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) => {
          if (vehicle.status !== 'Moving') {
            return vehicle;
          }

          const deltaHours = 2.5 / 3600;
          const distanceKm = vehicle.speedKmh * deltaHours;
          const angle = (vehicle.heading * Math.PI) / 180;
          const drift = distanceKm * 0.006;
          const randomJitter = (Math.random() - 0.5) * 0.0012;
          const nextHeading = (vehicle.heading + (Math.random() * 14 - 7) + 360) % 360;

          return {
            ...vehicle,
            lat: vehicle.lat + Math.cos(angle) * drift + randomJitter,
            lng: vehicle.lng + Math.sin(angle) * drift + randomJitter,
            heading: nextHeading,
            distanceTraveledKm: vehicle.distanceTraveledKm + distanceKm
          };
        })
      );
    }, 2500);

    return () => window.clearInterval(interval);
  }, []);

  const filteredVehicles = useMemo(() => {
    if (filterMode === 'active') {
      return vehicles.filter((vehicle) => vehicle.status === 'Moving');
    }

    if (filterMode === 'idle') {
      return vehicles.filter((vehicle) => vehicle.status === 'Idle');
    }

    return vehicles;
  }, [filterMode, vehicles]);

  const searchMatch = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return null;
    }

    return (
      vehicles.find(
        (vehicle) =>
          vehicle.name.toLowerCase().includes(query) ||
          vehicle.driver.toLowerCase().includes(query) ||
          vehicle.location.toLowerCase().includes(query) ||
          vehicle.status.toLowerCase().includes(query)
      ) ||
      locationIndex.find((location) => location.label.toLowerCase().includes(query)) ||
      null
    );
  }, [searchTerm, vehicles]);

  const mapCenter = useMemo(() => {
    if (searchMatch) {
      return [searchMatch.lat, searchMatch.lng];
    }

    return [selectedStart.lat, selectedStart.lng];
  }, [searchMatch, selectedStart]);

  const dynamicRoutePoints = useMemo(() => {
    const points = [selectedStart, ...routeWaypoints, selectedEnd];
    return points.map((point) => [point.lat, point.lng]);
  }, [selectedStart, selectedEnd]);

  useEffect(() => {
    setFocusKey(
      `${searchTerm}-${filterMode}-${searchMatch ? searchMatch.label || searchMatch.name : 'default'}-${selectedStart.label}-${selectedEnd.label}`
    );
  }, [searchMatch, searchTerm, filterMode, selectedStart.label, selectedEnd.label]);

  function handleRequestGps() {
    if (!navigator.geolocation) {
      setGpsError('GPS is not supported by this browser.');
      return;
    }

    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          label: 'My Location',
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setUseGpsStart(true);
      },
      () => {
        setGpsError('Unable to fetch GPS coordinates. Please allow location access.');
      }
    );
  }

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((vehicle) => vehicle.status === 'Moving').length;
  const distanceTraveledKm = vehicles.reduce((total, vehicle) => total + vehicle.distanceTraveledKm, 0);
  const routeDistanceKm = haversineDistanceKm([selectedStart.lat, selectedStart.lng], [selectedEnd.lat, selectedEnd.lng]);
  const estimatedTravelTimeHours = routeDistanceKm / 58;

  const metrics = [
    { label: 'Total Vehicles', value: totalVehicles, icon: Truck },
    { label: 'Active Vehicles', value: activeVehicles, icon: Navigation },
    { label: 'Distance Traveled', value: `${distanceTraveledKm.toFixed(1)} KM`, icon: Route },
    { label: 'Est. Travel Time', value: formatTravelTime(estimatedTravelTimeHours), icon: Clock3 },
    { label: 'Visible Vehicles', value: `${filteredVehicles.length} / ${totalVehicles}`, icon: MapPinned }
  ];

  const routePoints = [
    [routeStart.lat, routeStart.lng],
    [40.7167, -74.0458],
    [40.7005, -73.9526],
    [40.6827, -73.8694],
    [routeEnd.lat, routeEnd.lng]
  ];

  return (
    <section className='grid gap-5 text-[1em]'>
      <header className='grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start'>
        <div className='grid grid-cols-[auto_1fr] gap-3'>
          <span className='grid h-11 w-11 place-items-center rounded-2xl bg-[#64748B]/15 text-[#1E293B]'>
            <MapPinned size={20} />
          </span>
          <div>
            <p className='m-0 text-[0.75em] font-bold uppercase tracking-[0.28em] text-[#64748B]'>Fleet Tracking Map</p>
            <h1 className='mt-2 text-[1.45em] font-bold tracking-tight text-[#10B981]'>Fleet Tracking Map</h1>
            <p className='m-0 text-[1em] font-medium text-[#1E293B]'>Real-time vehicle tracking and route monitoring</p>
          </div>
        </div>

        <div className='justify-self-start rounded-full border border-[#64748B]/15 bg-white px-4 py-2 text-[0.85em] font-semibold text-[#64748B] shadow-sm xl:justify-self-end'>
          Live dummy telemetry
        </div>
      </header>

        <div className='grid gap-5'>
        {loadError ? (
          <p className='rounded-2xl border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-4 py-3 text-sm text-[#92400E]'>
            {loadError}
          </p>
        ) : null}

        <InfoPanel
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          metrics={metrics}
          visibleCount={filteredVehicles.length}
          totalCount={totalVehicles}
          routeStart={selectedStart.label}
          routeEnd={selectedEnd.label}
        />

        <div className='rounded-2xl border border-[#64748B]/25 bg-white p-5 shadow-lg shadow-slate-900/10'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='m-0 text-xs font-bold uppercase tracking-[0.3em] text-[#64748B]'>Route Builder</p>
              <h2 className='text-[1.1em] font-semibold text-[#1E293B]'>Start & Destination</h2>
            </div>
            <button
              type='button'
              onClick={handleRequestGps}
              className='rounded-full border border-[#10B981]/60 bg-[#10B981]/10 px-4 py-2 text-xs font-semibold text-[#10B981] transition hover:bg-[#10B981]/20'
            >
              Use GPS
            </button>
          </div>

        <div className='mt-4 grid gap-3 md:grid-cols-3'>
          <label className='grid gap-2 text-sm text-[#1E293B]'>
            Start location
            <input
              list='fleet-locations'
              value={startInput}
              onChange={(event) => {
                const value = event.target.value;
                setStartInput(value);
                const match = matchLocation(value);
                if (match) {
                  setSelectedStartLabel(match.label);
                  setUseGpsStart(false);
                }
              }}
              placeholder='Type to search route'
              className='rounded-xl border border-[#64748B]/25 bg-white px-3 py-2 text-sm text-[#1E293B]'
            />
          </label>

          <label className='grid gap-2 text-sm text-[#1E293B]'>
            Destination
            <input
              list='fleet-locations'
              value={endInput}
              onChange={(event) => {
                const value = event.target.value;
                setEndInput(value);
                const match = matchLocation(value);
                if (match) {
                  setSelectedEndLabel(match.label);
                }
              }}
              placeholder='Type to search route'
              className='rounded-xl border border-[#64748B]/25 bg-white px-3 py-2 text-sm text-[#1E293B]'
            />
          </label>

          <div className='space-y-1 rounded-xl border border-dashed border-[#64748B]/30 bg-[#f8fafc] px-3 py-2 text-sm text-[#1E293B]'>
            <p className='m-0 text-xs font-semibold text-[#64748B]'>GPS coordinates</p>
            {useGpsStart && gpsLocation ? (
              <p className='m-0 text-[0.85em]'>
                {gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}
              </p>
            ) : (
              <p className='m-0 text-[0.85em] text-[#64748B]/70'>Not set</p>
            )}
              <button
                type='button'
                onClick={() => setUseGpsStart(false)}
                className='text-xs font-semibold text-[#64748B] underline decoration-dotted underline-offset-2 hover:text-[#1E293B]'
              >
                Reset GPS
              </button>
            </div>
          </div>

          {gpsError ? (
            <p className='mt-3 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-2 text-xs text-[#92400E]'>{gpsError}</p>
          ) : null}
          <div className='mt-3 flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={() => window.open('https://maps.app.goo.gl/tnrzoNqeCe8MMqoE8?g_st=ac', '_blank')}
              className='rounded-xl border border-[#64748B]/25 bg-[#f1f5f9] px-4 py-2 text-xs font-semibold text-[#1E293B] transition hover:bg-white'
            >
              Open Google Maps link
            </button>
            <button
              type='button'
              onClick={handleRequestGps}
              className='rounded-xl border border-[#10B981]/25 bg-[#10B981]/10 px-4 py-2 text-xs font-semibold text-[#10B981] transition hover:bg-[#10B981]/20'
            >
              Find my GPS
            </button>
          </div>
          <datalist id='fleet-locations'>
          {locationIndex.map((location) => (
            <option key={`option-${location.label}`} value={location.label} />
          ))}
        </datalist>
      </div>

        {searchMatch ? (
          <div className='rounded-2xl border border-[#64748B]/15 bg-white px-4 py-3 shadow-sm'>
            <p className='m-0 text-[0.9em] text-[#64748B]'>Focused location</p>
            <p className='mt-1 text-[1em] font-semibold text-[#1E293B]'>
              {searchMatch.label || searchMatch.name}
            </p>
          </div>
        ) : null}

        <FleetMapContainer
          vehicles={filteredVehicles}
          routePoints={dynamicRoutePoints}
          center={mapCenter}
          zoomKey={focusKey}
          selectedStart={selectedStart}
          selectedEnd={selectedEnd}
          gpsLocation={gpsLocation}
        />

        {filteredVehicles.length === 0 ? (
          <div className='rounded-2xl border border-[#64748B]/15 bg-white p-4 text-sm text-[#64748B] shadow-sm'>
            No vehicles match the selected filter.
          </div>
        ) : null}
      </div>
    </section>
  );
}
