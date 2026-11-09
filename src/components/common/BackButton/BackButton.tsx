import { useNavigate } from 'react-router-dom';
import styles from './BackButton.module.css';

type BackButtonProps = {
  label?: string;
  fallbackPath: string;
};

export function BackButton({ label = 'Back', fallbackPath }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      aria-label={label}
      className={styles.button}
      type="button"
      onClick={() => {
        if (window.history.state?.idx > 0) navigate(-1);
        else navigate(fallbackPath);
      }}
    >
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="m15 18-6-6 6-6M9 12h12" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
