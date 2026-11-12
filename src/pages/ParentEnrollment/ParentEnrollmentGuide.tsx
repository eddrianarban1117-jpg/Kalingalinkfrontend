import { useEffect, useRef, useState } from 'react';
import kali from '../../../kali.png';
import {
  parentEnrollmentGuideContent,
  type GuideLanguage,
} from './parent-enrollment-guide-content';
import styles from './ParentEnrollmentGuide.module.css';

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      {direction === 'left' ? (
        <path
          d="M19 12H5m7 7-7-7 7-7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      ) : (
        <path
          d="M5 12h14m-7-7 7 7-7 7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

export function ParentEnrollmentGuide() {
  const [language, setLanguage] = useState<GuideLanguage>('en');
  const [step, setStep] = useState<number | null>(null);
  const [open, setOpen] = useState(true);
  const [contentVisible, setContentVisible] = useState(true);
  const contentTimer = useRef<number | null>(null);
  const content = parentEnrollmentGuideContent[language];
  const onFinalStep = step === content.instructions.length - 1;

  useEffect(
    () => () => {
      if (contentTimer.current !== null) {
        window.clearTimeout(contentTimer.current);
      }
    },
    [],
  );

  function transitionContent(update: () => void) {
    if (contentTimer.current !== null) {
      window.clearTimeout(contentTimer.current);
    }
    setContentVisible(false);
    contentTimer.current = window.setTimeout(() => {
      update();
      setContentVisible(true);
      contentTimer.current = null;
    }, 100);
  }

  function changeLanguage(nextLanguage: GuideLanguage) {
    if (nextLanguage === language) return;
    transitionContent(() => setLanguage(nextLanguage));
  }

  function closeGuide() {
    setOpen(false);
  }

  function reopenGuide() {
    setOpen(true);
  }

  return (
    <div className={styles.guide}>
      <section
        aria-hidden={!open}
        aria-labelledby="kali-guide-title"
        aria-live="polite"
        className={`${styles.panelShell} ${open ? styles.panelOpen : styles.panelClosed}`}
        id="kali-enrollment-guide"
        inert={!open}
      >
        <div className={styles.panel}>
          <header className={styles.header}>
            <div className={styles.identity}>
              <span className={styles.mascotFrame}>
                <img alt={content.mascotAlt} src={kali} />
              </span>
              <span className={styles.identityCopy}>
                <strong id="kali-guide-title">Kali</strong>
                <small>{content.enrollmentGuide}</small>
              </span>
            </div>
            <div className={styles.headerActions}>
              <label className={styles.languagePicker}>
                <span>{content.language}</span>
                <select
                  aria-label={content.language}
                  onChange={(event) =>
                    changeLanguage(event.target.value as GuideLanguage)
                  }
                  value={language}
                >
                  <option value="en">English</option>
                  <option value="tl">Tagalog</option>
                </select>
              </label>
              <button
                aria-label={content.close}
                aria-controls="kali-enrollment-guide"
                aria-expanded={true}
                className={styles.closeButton}
                onClick={closeGuide}
                type="button"
              >
                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <path
                    d="m6 6 12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>
          </header>

          {step === null ? (
            <div
              className={`${styles.welcome} ${contentVisible ? styles.contentVisible : ''}`}
              key={`welcome-${language}`}
            >
              <p>{content.welcome}</p>
              <button
                className={styles.primaryButton}
                onClick={() => transitionContent(() => setStep(0))}
                type="button"
              >
                {content.start}
                <ArrowIcon direction="right" />
              </button>
            </div>
          ) : (
            <div
              className={`${styles.instruction} ${contentVisible ? styles.contentVisible : ''}`}
              key={`${language}-${step}`}
            >
              <div className={styles.stepHeading}>
                <span>
                  {content.step} {step + 1} {language === 'en' ? 'of' : 'sa'}{' '}
                  {content.instructions.length}
                </span>
                <span className={styles.progressTrack}>
                  <span
                    className={styles.progressValue}
                    style={{
                      width: `${((step + 1) / content.instructions.length) * 100}%`,
                    }}
                  />
                </span>
              </div>
              <h2>{content.stepTitles[step]}</h2>
              <p>{content.instructions[step]}</p>
              <nav
                aria-label={content.stepNavigation}
                className={styles.stepActions}
              >
                {step > 0 ? (
                  <button
                    className={styles.secondaryButton}
                    onClick={() => transitionContent(() => setStep(step - 1))}
                    type="button"
                  >
                    <ArrowIcon direction="left" />
                    {content.previous}
                  </button>
                ) : (
                  <span aria-hidden="true" />
                )}
                {onFinalStep ? (
                  <button
                    className={styles.primaryButton}
                    onClick={closeGuide}
                    type="button"
                  >
                    {content.completion}
                  </button>
                ) : (
                  <button
                    className={styles.primaryButton}
                    onClick={() => transitionContent(() => setStep(step + 1))}
                    type="button"
                  >
                    {content.next}
                    <ArrowIcon direction="right" />
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </section>

      {!open && (
        <button
          aria-controls="kali-enrollment-guide"
          aria-expanded={false}
          aria-label={content.reopen}
          className={styles.floatingButton}
          onClick={reopenGuide}
          type="button"
        >
          <img alt="" src={kali} />
        </button>
      )}
    </div>
  );
}
