import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} | Hospital Asset Tracker`;
  }, [title]);
}
