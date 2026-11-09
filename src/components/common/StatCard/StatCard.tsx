import type { ReactNode } from 'react';
import styles from './StatCard.module.css';

export function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <article className={styles.card}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <div>
        <h2>{label}</h2>
        <strong>{value}</strong>
        {detail && <p>{detail}</p>}
      </div>
    </article>
  );
}
