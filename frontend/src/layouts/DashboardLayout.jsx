import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import TopBar from '../components/TopBar';

function DashboardLayout() {
  return (
    <div
      className='min-h-screen lg:flex'
      style={{ backgroundColor: 'var(--app-layout-bg)', color: 'var(--app-text-main)' }}
    >
      <Sidebar />
      <main className='flex-1 bg-white px-4 py-6 pb-10 sm:px-6 sm:pb-12 lg:px-8 lg:py-7 lg:pb-14'>
        <div className='mx-auto w-full max-w-[1320px]'>
          <TopBar />
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
