import type { ReactNode } from 'react';
import { useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [active, setActive] = useState(false);

  useLayoutEffect(() => {
    setActive(false);
    const frame = window.requestAnimationFrame(() => setActive(true));
    const timeout = window.setTimeout(() => setActive(false), 350);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return (
    <div data-motion-active={active} data-motion-page>
      {children}
    </div>
  );
}
