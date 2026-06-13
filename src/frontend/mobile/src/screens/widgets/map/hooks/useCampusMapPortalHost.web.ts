import { useEffect, useState } from 'react';

const PORTAL_ID = 'omada-campus-map-portal';

/** Mount map DOM outside #root when the campus map route is focused. */
export function useCampusMapPortalHost(enabled: boolean): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      setHost(null);
      return;
    }

    const node = document.createElement('div');
    node.id = PORTAL_ID;
    document.body.appendChild(node);
    setHost(node);

    return () => {
      node.remove();
      setHost(null);
    };
  }, [enabled]);

  return enabled ? host : null;
}
