import { useEffect, useState } from 'react';
import styles from './PhilippineClock.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

export function PhilippineClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <aside
      className={styles.clock}
      aria-label="Current date and time in the Philippines"
    >
      <span className={styles.label}>Philippine time</span>
      <time className={styles.value} dateTime={now.toISOString()}>
        {dateFormatter.format(now)} | {timeFormatter.format(now)}
      </time>
      <span className={styles.zone}>Asia/Manila | UTC+08:00</span>
    </aside>
  );
}
