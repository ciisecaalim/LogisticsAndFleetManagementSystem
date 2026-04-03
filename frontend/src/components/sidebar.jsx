import { Link, useLocation } from 'react-router-dom';
import {
  FileBarChart2,
  Fuel,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Route,
  Settings,
  Truck,
  UserRound,
  Wrench
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Vehicles', icon: Truck, path: '/vehicles' },
  { label: 'Drivers', icon: UserRound, path: '/drivers' },
  { label: 'Trips', icon: Route, path: '/trips' },
  { label: 'Fuel', icon: Fuel, path: '/fuel' },
  { label: 'Maintenance', icon: Wrench, path: '/maintenance' },
  { label: 'Fleet Map', icon: MapPinned, path: '/fleet-map' },
  { label: 'Reports', icon: FileBarChart2, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' }

];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className='w-full border border-white/10 bg-gradient-to-b from-[#0f172a] via-[#111c2c] to-[#161b2b] px-4 py-6 shadow-[0_24px_55px_rgba(0,0,0,0.45)] sm:px-5 lg:flex lg:min-h-screen lg:w-72 lg:flex-col lg:justify-between lg:px-7 lg:py-8'>
      <div className='space-y-6'>
        <div className='flex items-center gap-3'>
          <div className='grid h-11 w-11 place-items-center rounded-[18px] bg-gradient-to-br from-[#10B981] to-[#64748B] text-xs font-extrabold tracking-widest text-white'>
            FM
          </div>
          <div>
            <p className='m-0 text-base font-bold text-white'>Fleet Manager</p>
            <small className='text-xs text-white/80'>Logistics & Fleet</small>
          </div>
        </div>

        <nav className='flex flex-col gap-2'>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-semibold tracking-tight transition ${
                  isActive
                    ? 'bg-white/10 text-white shadow-[0_8px_22px_rgba(255,255,255,0.12)]'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-2xl bg-white text-[#F59E0B] transition ${
                    isActive ? 'shadow-[0_6px_18px_rgba(146,165,195,0.5)]' : ''
                  }`}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span className='text-white'>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <Link
        to='/dashboard'
        className='mt-6 flex items-center justify-between border-t border-white/20 pt-4 text-white transition hover:text-white'
      >
        <div>
          <p className='m-0 text-xs font-semibold tracking-tight'>Logout</p>
          <small className='text-[11px] text-white/70'>Sign out</small>
        </div>
        <span className='grid h-8 w-8 place-items-center rounded-full bg-[#64748B]/25 text-[#F59E0B]'>
          <LogOut size={16} strokeWidth={2.2} />
        </span>
      </Link>
    </aside>
  );
}
