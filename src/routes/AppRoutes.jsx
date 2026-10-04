import { Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Dashboard from '../pages/Dashboard';
import Assets from '../pages/Assets';
import AssetDetails from '../pages/AssetDetails';
import TrackingHistory from '../pages/TrackingHistory';
import Checkpoints from '../pages/Checkpoints';
import Alerts from '../pages/Alerts';
import SecurityMonitoring from '../pages/SecurityMonitoring';
import SystemStatus from '../pages/SystemStatus';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="assets" element={<Assets />} />
        <Route path="assets/:id" element={<AssetDetails />} />
        <Route path="history" element={<TrackingHistory />} />
        <Route path="checkpoints" element={<Checkpoints />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="security-monitoring" element={<SecurityMonitoring />} />
        <Route path="system-status" element={<SystemStatus />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
