import styles from './BouncingDots.module.css';

type BouncingDotsProps = {
  className?: string;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  inline?: boolean;
};

export function BouncingDots({
  className,
  label,
  size = 'medium',
  inline = false,
}: BouncingDotsProps) {
  const indicatorClassName = [
    styles.indicator,
    styles[size],
    inline ? styles.inline : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      aria-label={label ?? 'Loading'}
      className={indicatorClassName}
      role="status"
      aria-live="polite"
    >
      <span aria-hidden="true" className={styles.dots}>
        <span />
        <span />
        <span />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </span>
  );
}
