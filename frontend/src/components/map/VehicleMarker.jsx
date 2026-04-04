import { useMemo } from 'react';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';

const gpsStyles = {
  Online: {
    accent: '#10B981',
    surface: 'bg-[#10B981]/15 text-[#047857]'
  },
  'Last Seen': {
    accent: '#F59E0B',
    surface: 'bg-[#F59E0B]/15 text-[#92400E]'
  },
  Offline: {
    accent: '#EF4444',
    surface: 'bg-[#EF4444]/15 text-[#B91C1C]'
  }
};

function createVehicleIcon(gpsStatus) {
  const style = gpsStyles[gpsStatus] ?? gpsStyles.Offline;

  return L.divIcon({
    className: 'vehicle-marker-icon',
    html: `
      <div class="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-white shadow-[0_10px_25px_rgba(15,23,42,0.25)]" style="background:${style.accent}">
        <span class="absolute inset-0 animate-ping rounded-full opacity-20" style="background:${style.accent}"></span>
        <div class="relative h-3.5 w-3.5 rounded-full bg-white"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -18]
  });
}

export default function VehicleMarker({ vehicle }) {
  const icon = useMemo(() => createVehicleIcon(vehicle.gpsStatus), [vehicle.gpsStatus]);
  const style = gpsStyles[vehicle.gpsStatus] ?? gpsStyles.Offline;

  const gpsTimestamp = new Date(vehicle.lastUpdate || 0);
  const gpsTimeLabel = Number.isNaN(gpsTimestamp.getTime())
    ? 'Unknown'
    : gpsTimestamp.toLocaleString();

  return (
    <Marker position={[vehicle.lat, vehicle.lng]} icon={icon}>
      <Popup>
        <div className='min-w-56 space-y-2'>
          <div>
            <p className='m-0 text-sm font-semibold text-[#1E293B]'>
              {vehicle.name}
            </p>
            <p className='m-0 text-xs text-[#64748B]'>{vehicle.location}</p>
          </div>

          <div className='grid gap-2 text-xs text-[#1E293B]'>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-[#64748B]'>Driver</span>
              <span className='font-semibold'>{vehicle.driver}</span>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-[#64748B]'>Status</span>
              <span className='rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700'>{vehicle.status}</span>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-[#64748B]'>GPS</span>
              <span className={`rounded-full px-2 py-1 font-semibold ${style.surface}`}>{vehicle.gpsStatus}</span>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-[#64748B]'>Last GPS Update</span>
              <span className='font-semibold'>{gpsTimeLabel}</span>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-[#64748B]'>Speed</span>
              <span className='font-semibold'>{vehicle.speedKmh} km/h</span>
            </div>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-[#64748B]'>Distance</span>
              <span className='font-semibold'>{vehicle.distanceTraveledKm.toFixed(1)} km</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
