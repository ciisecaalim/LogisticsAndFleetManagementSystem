import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import TopBar from '../components/TopBar';

function DashboardLayout() {
  return (
    <div className='min-h-screen lg:flex bg-[#e2e8f0] text-[#1E293B]'>
      <Sidebar />
      <main className='flex-1 px-4 py-6 pb-10 sm:px-6 sm:pb-12 lg:px-8 lg:py-7 lg:pb-14'>
        <div className='mx-auto w-full max-w-[1320px]'>
          <TopBar />
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
