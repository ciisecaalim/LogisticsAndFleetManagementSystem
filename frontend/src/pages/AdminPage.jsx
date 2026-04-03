import { FileBarChart2, LogOut, Mail, Phone, Settings, ShieldUser } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/dashboard');
  };

  return (
    <section className='space-y-6'>
      <header>
        <h1 className='m-0 text-3xl font-bold tracking-tight text-[#1E293B] sm:text-4xl'>Admin Profile</h1>
        <p className='mt-1 text-base font-medium text-[#1E293B] sm:text-lg'>Profile and account details</p>
      </header>

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <div className='grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start'>
          <div>
            <div className='flex flex-wrap items-center gap-5'>
              <div className='grid h-20 w-20 place-items-center rounded-2xl bg-[#1E293B] text-white shadow-lg'>
                <ShieldUser size={36} strokeWidth={2.1} />
              </div>

              <div>
                <p className='m-0 text-xl font-bold text-[#1E293B]'>Admin User</p>
                <p className='mt-1 text-sm text-[#64748B]'>Admin</p>
              </div>
            </div>

            <div className='mt-8 grid gap-4 sm:grid-cols-2'>
              <div className='rounded-2xl border border-[#64748B]/15 bg-[#64748B]/5 p-5'>
                <p className='m-0 text-sm font-semibold uppercase tracking-[0.18em] text-[#64748B]'>Phone</p>
                <div className='mt-3 flex items-center gap-2 text-[#1E293B]'>
                  <Phone size={18} className='text-[#10B981]' />
                  <span className='text-base font-medium'>+1-555-0000</span>
                </div>
              </div>

              <div className='rounded-2xl border border-[#64748B]/15 bg-[#64748B]/5 p-5'>
                <p className='m-0 text-sm font-semibold uppercase tracking-[0.18em] text-[#64748B]'>Email</p>
                <div className='mt-3 flex items-center gap-2 text-[#1E293B]'>
                  <Mail size={18} className='text-[#F59E0B]' />
                  <span className='text-base font-medium'>admin@fleetmanager.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-3 lg:min-w-44'>
            <Link
              to='/settings'
              className='inline-flex items-center justify-center gap-2 rounded-xl border border-[#64748B]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#1E293B] transition hover:bg-[#64748B]/5'
            >
              <Settings size={17} />
              Settings
            </Link>
            <Link
              to='/reports'
              className='inline-flex items-center justify-center gap-2 rounded-xl border border-[#64748B]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#1E293B] transition hover:bg-[#64748B]/5'
            >
              <FileBarChart2 size={17} />
              Report
            </Link>
            <button
              type='button'
              onClick={handleLogout}
              className='inline-flex items-center justify-center gap-2 rounded-xl bg-[#020617] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B]'
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
