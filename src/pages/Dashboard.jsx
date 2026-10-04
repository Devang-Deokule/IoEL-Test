import { Link } from 'react-router-dom';
import { Activity, Boxes, CheckCircle2, ShieldCheck, TriangleAlert, Wrench } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { usePageTitle } from '../hooks/usePageTitle';
import { Card, CardHeader } from '../components/Card';
import StatCard from '../components/StatCard';
import LocationOverview from '../components/LocationOverview';
import ActivityTable from '../components/ActivityTable';
import ScannerPanel from '../components/ScannerPanel';
import AlertItem from '../components/AlertItem';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  usePageTitle('Dashboard');
  const { stats, history, alerts } = useApp();

  const recentActivity = history.slice(0, 6);
  const openAlerts = alerts.filter((a) => a.state !== 'resolved').slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total assets" value={stats.total} icon={Boxes} tone="brand" to="/assets" />
        <StatCard label="Available" value={stats.available} icon={CheckCircle2} tone="ok" to="/assets?status=Available" />
        <StatCard label="In use" value={stats.inUse} icon={Activity} tone="info" to="/assets?status=In%20Use" />
        <StatCard label="Maintenance" value={stats.maintenance} icon={Wrench} tone="warn" to="/assets?status=Maintenance" />
        <StatCard label="Alerts" value={stats.openAlerts} icon={TriangleAlert} tone="danger" to="/alerts" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Location overview" description="Where each asset was last detected." />
            <LocationOverview />
          </Card>

          <Card>
            <CardHeader
              title="Recent alerts"
              action={
                <Link to="/alerts" className="btn btn-ghost btn-sm">
                  View all
                </Link>
              }
            />
            <div className="px-5 pb-5">
              {openAlerts.length === 0 ? (
                <EmptyState icon={ShieldCheck} title="No open alerts" message="New and acknowledged alerts will show up here." />
              ) : (
                <ul className="space-y-3">
                  {openAlerts.map((a) => (
                    <AlertItem key={a.id} alert={a} compact />
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <ScannerPanel />
      </div>

      <Card>
        <CardHeader
          title="Recent tracking activity"
          action={
            <Link to="/history" className="btn btn-ghost btn-sm">
              Full history
            </Link>
          }
        />
        <ActivityTable rows={recentActivity} variant="dashboard" />
      </Card>
    </div>
  );
}
