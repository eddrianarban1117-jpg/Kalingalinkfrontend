import styles from './Avatar.module.css';

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
};

export function Avatar({
  name,
  src,
  size = 'medium',
  className = '',
}: AvatarProps) {
  return (
    <span
      aria-label={name}
      className={`${styles.avatar} ${styles[size]} ${className}`.trim()}
      role="img"
    >
      {src ? (
        <img alt="" src={src} />
      ) : (
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        </svg>
      )}
    </span>
  );
}
