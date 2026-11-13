import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button/Button';
import {
  logoAltText,
  routePaths,
  welcomeButtonLabel,
} from '../../constants/app-constants';
import logo from '../../assets/images/logo.png';
import introBackground from '../../../introbg.png';
import styles from './Welcome.module.css';

export function Welcome() {
  const navigate = useNavigate();

  return (
    <main
      className={styles.page}
      style={
        { '--welcome-background': `url("${introBackground}")` } as CSSProperties
      }
    >
      <div className={`${styles.content} anim-card-enter`}>
        <img className={styles.logo} src={logo} alt={logoAltText} />
        <span aria-hidden="true" className={styles.accent} />
        <p className={styles.description}>
          A smarter, more connected platform for Child Development Centers in
          Pinamalayan.
        </p>
        <Button
          className={styles.getStarted}
          type="button"
          onClick={() => navigate(routePaths.accountChoice)}
        >
          {welcomeButtonLabel}
          <svg
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            className={styles.arrow}
          >
            <path
              d="M4.5 12h14m-6-6 6 6-6 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </Button>
      </div>
    </main>
  );
}
