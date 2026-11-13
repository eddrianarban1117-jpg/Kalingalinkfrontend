import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button/Button';
import {
  accountChoiceHeading,
  accountChoiceDescription,
  backButtonLabel,
  logoAltText,
  parentChoiceDescription,
  parentAccountTitle,
  routePaths,
  teacherChoiceDescription,
  teacherAccountTitle,
} from '../../constants/app-constants';
import { Logo } from '../../components/common/Logo/Logo';
import sideLayout from '../../../sidelayout.png';
import styles from './AccountChoice.module.css';

export function AccountChoice() {
  const navigate = useNavigate();

  return (
    <main className={styles.page}>
      <section
        aria-label="KalingaLink children learning"
        className={styles.hero}
        style={{ backgroundImage: `url("${sideLayout}")` }}
      >
        <div className={styles.brand}>
          <Logo alt={logoAltText} variant="login" />
        </div>
      </section>

      <section className={styles.selectionPanel}>
        <button
          aria-label={backButtonLabel}
          className={styles.back}
          type="button"
          onClick={() => navigate(routePaths.welcome)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path
              d="m14 5-7 7 7 7"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
        <div className={`${styles.content} anim-card-enter`}>
          <header className={styles.heading}>
            <h1>{accountChoiceHeading}</h1>
            <p>{accountChoiceDescription}</p>
          </header>
          <div
            aria-label="Parent and Teacher account options"
            className={`${styles.choices} anim-stagger`}
          >
            <Button
              className={styles.choiceButton}
              type="button"
              onClick={() => navigate(routePaths.parentSignup)}
            >
              <span aria-hidden="true" className={styles.choiceIconWrap}>
                <svg viewBox="0 0 40 40" fill="none">
                  <circle cx="14" cy="12" r="6" fill="currentColor" />
                  <path
                    d="M3 34v-3a11 11 0 0 1 22 0v3H3Z"
                    fill="currentColor"
                  />
                  <circle cx="29" cy="18" r="4.5" fill="currentColor" />
                  <path d="M25 26a8 8 0 0 1 12 7v1h-9" fill="currentColor" />
                </svg>
              </span>
              <span className={styles.choiceCopy}>
                <span className={styles.choiceLabel}>{parentAccountTitle}</span>
                <span className={styles.choiceDescription}>
                  {parentChoiceDescription}
                </span>
              </span>
              <span aria-hidden="true" className={styles.choiceArrow}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12h15m-6-6 6 6-6 6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </span>
            </Button>
            <Button
              className={styles.choiceButton}
              type="button"
              onClick={() => navigate(routePaths.teacherSignup)}
            >
              <span aria-hidden="true" className={styles.choiceIconWrap}>
                <svg viewBox="0 0 40 40" fill="none">
                  <path
                    d="m20 3 18 8-18 8-18-8 18-8Zm-11 14v8c6 5 16 5 22 0v-8m5-5v13"
                    fill="currentColor"
                  />
                  <circle cx="20" cy="18" r="3.5" fill="currentColor" />
                  <path
                    d="M12 35v-2a8 8 0 0 1 16 0v2H12Z"
                    fill="currentColor"
                  />
                  <path
                    d="M36 13v13"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <span className={styles.choiceCopy}>
                <span className={styles.choiceLabel}>
                  {teacherAccountTitle}
                </span>
                <span className={styles.choiceDescription}>
                  {teacherChoiceDescription}
                </span>
              </span>
              <span aria-hidden="true" className={styles.choiceArrow}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12h15m-6-6 6 6-6 6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </span>
            </Button>
          </div>
        </div>
        <p className={styles.existingAccount}>
          Already have an account?{' '}
          <button
            className={styles.loginLink}
            type="button"
            onClick={() => navigate(routePaths.login)}
          >
            Log in
          </button>
        </p>
      </section>
    </main>
  );
}
