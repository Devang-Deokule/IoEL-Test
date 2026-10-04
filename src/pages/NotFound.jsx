import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Card } from '../components/Card';
import EmptyState from '../components/EmptyState';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <Card>
      <EmptyState
        icon={SearchX}
        title="Page not found"
        message="This page does not exist."
        action={
          <Link to="/" className="btn btn-primary">
            Go to dashboard
          </Link>
        }
      />
    </Card>
  );
}
