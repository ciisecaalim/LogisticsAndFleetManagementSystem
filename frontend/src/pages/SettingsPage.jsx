import { Bell, Lock, Palette, UserRound } from 'lucide-react';

export default function SettingsPage() {
  return (
    <section className='space-y-6'>
      <header>
        <h1 className='m-0 text-3xl font-bold tracking-tight text-[#1E293B] sm:text-4xl'>Settings</h1>
        <p className='mt-1 text-base font-medium text-[#1E293B] sm:text-lg'>Manage your account and preferences</p>
      </header>

      <article className='rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-lg shadow-slate-900/5'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='rounded-2xl border border-[#64748B]/15 bg-[#64748B]/5 p-5'>
            <div className='flex items-center gap-3'>
              <UserRound className='text-[#10B981]' size={20} />
              <p className='m-0 text-base font-semibold text-[#1E293B]'>Profile Settings</p>
            </div>
          </div>
          <div className='rounded-2xl border border-[#64748B]/15 bg-[#64748B]/5 p-5'>
            <div className='flex items-center gap-3'>
              <Lock className='text-[#F59E0B]' size={20} />
              <p className='m-0 text-base font-semibold text-[#1E293B]'>Security</p>
            </div>
          </div>
          <div className='rounded-2xl border border-[#64748B]/15 bg-[#64748B]/5 p-5'>
            <div className='flex items-center gap-3'>
              <Bell className='text-[#64748B]' size={20} />
              <p className='m-0 text-base font-semibold text-[#1E293B]'>Notifications</p>
            </div>
          </div>
          <div className='rounded-2xl border border-[#64748B]/15 bg-[#64748B]/5 p-5'>
            <div className='flex items-center gap-3'>
              <Palette className='text-[#1E293B]' size={20} />
              <p className='m-0 text-base font-semibold text-[#1E293B]'>Theme</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
