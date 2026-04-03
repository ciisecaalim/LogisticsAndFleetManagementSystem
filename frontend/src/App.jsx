import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import DriversPage from './pages/DriversPage';
import FuelPage from './pages/FuelPage';
import MaintenancePage from './pages/MaintenancePage';
import FleetMapPage from './pages/FleetMapPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import TripsPage from './pages/TripsPage';
import VehiclesPage from './pages/VehiclesPage';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path='/' element={<Navigate to='/fleet-map' replace />} />
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/admin' element={<AdminPage />} />
        <Route path='/settings' element={<SettingsPage />} />
        <Route path='/reports' element={<ReportsPage />} />
        <Route path='/vehicles' element={<VehiclesPage />} />
        <Route path='/drivers' element={<DriversPage />} />
        <Route path='/trips' element={<TripsPage />} />
        <Route path='/fuel' element={<FuelPage />} />
        <Route path='/maintenance' element={<MaintenancePage />} />
        <Route path='/fleet-map' element={<FleetMapPage />} />
        <Route path='/map-links' element={<Navigate to='/fleet-map' replace />} />
        <Route path='*' element={<Navigate to='/fleet-map' replace />} />
      </Route>
    </Routes>
  );
}

export default App;
 