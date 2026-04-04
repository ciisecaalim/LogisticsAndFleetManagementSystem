import { useEffect } from 'react';
import { MapContainer as LeafletMapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import VehicleMarker from './VehicleMarker';

const endpointIcons = {
  start: L.divIcon({
    className: 'route-endpoint-icon',
    html: '<div class="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#10B981] shadow-[0_10px_25px_rgba(15,23,42,0.25)]"><div class="h-3 w-3 rounded-full bg-white"></div></div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -16]
  }),
  end: L.divIcon({
    className: 'route-endpoint-icon',
    html: '<div class="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#F59E0B] shadow-[0_10px_25px_rgba(15,23,42,0.25)]"><div class="h-3 w-3 rounded-full bg-white"></div></div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -16]
  })
};

function MapFocus({ center, zoomKey }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map, zoomKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

const gpsIcon = L.divIcon({
  className: 'gps-blue-icon',
  html: '<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#2563EB]/90 text-xs font-bold text-white">GPS</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -18]
});

export default function MapContainer({
  vehicles,
  routePoints,
  center,
  zoomKey,
  selectedStart,
  selectedEnd,
  gpsLocation,
  tripRoutes = []
}) {
  const startPoint = routePoints[0];
  const endPoint = routePoints[routePoints.length - 1];
  const hasRoute = Array.isArray(routePoints) && routePoints.length > 1;

  return (
    <div className='h-[440px] min-h-[440px] w-full overflow-hidden rounded-2xl border border-[#64748B]/15 bg-[#0f172a] p-2 shadow-lg shadow-slate-900/10 lg:h-[560px] lg:min-h-[560px]'>
      <LeafletMapContainer center={center} zoom={12} scrollWheelZoom className='h-full w-full rounded-xl' zoomControl={false}>
        <MapFocus center={center} zoomKey={zoomKey} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {hasRoute ? (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: '#10B981',
              weight: 5,
              opacity: 0.95,
              dashArray: '10 10',
              lineCap: 'round'
            }}
          />
        ) : null}

        {tripRoutes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points}
            pathOptions={{
              color: route.color || '#2563EB',
              weight: 4,
              opacity: 0.85
            }}
          />
        ))}

        {hasRoute ? (
          <Marker position={startPoint} icon={endpointIcons.start}>
            <Popup>
              <div className='space-y-1'>
                <p className='m-0 text-sm font-semibold text-[#1E293B]'>Route Start</p>
                <p className='m-0 text-xs text-[#64748B]'>{selectedStart?.label || 'Fleet origin point'}</p>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {tripRoutes.map((route) => (
          <Marker key={`${route.id}-start`} position={route.startPoint} icon={endpointIcons.start}>
            <Popup>
              <div className='space-y-1'>
                <p className='m-0 text-sm font-semibold text-[#1E293B]'>Trip Start</p>
                <p className='m-0 text-xs text-[#64748B]'>{route.startLabel}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {hasRoute ? (
          <Marker position={endPoint} icon={endpointIcons.end}>
            <Popup>
              <div className='space-y-1'>
                <p className='m-0 text-sm font-semibold text-[#1E293B]'>Destination</p>
                <p className='m-0 text-xs text-[#64748B]'>{selectedEnd?.label || 'Planned delivery endpoint'}</p>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {tripRoutes.map((route) => (
          <Marker key={`${route.id}-end`} position={route.endPoint} icon={endpointIcons.end}>
            <Popup>
              <div className='space-y-1'>
                <p className='m-0 text-sm font-semibold text-[#1E293B]'>Trip Destination</p>
                <p className='m-0 text-xs text-[#64748B]'>{route.endLabel}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {gpsLocation ? (
          <Marker position={[gpsLocation.lat, gpsLocation.lng]} icon={gpsIcon}>
            <Popup>
              <div className='space-y-1'>
                <p className='m-0 text-sm font-semibold text-[#1E293B]'>GPS Start</p>
                <p className='m-0 text-xs text-[#64748B]'>
                  {gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {vehicles.map((vehicle) => (
          <VehicleMarker key={vehicle.id} vehicle={vehicle} />
        ))}
      </LeafletMapContainer>
    </div>
  );
}
