import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
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
  const [mascotPosition, setMascotPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const contentTimer = useRef<number | null>(null);
  const mascotRef = useRef<HTMLButtonElement | null>(null);
  const dragStart = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const suppressMascotClick = useRef(false);
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

  useEffect(() => {
    function keepMascotInViewport() {
      const mascot = mascotRef.current;
      if (!mascot) return;

      const { width, height } = mascot.getBoundingClientRect();
      setMascotPosition((current) =>
        current
          ? {
              left: Math.max(
                0,
                Math.min(window.innerWidth - width, current.left),
              ),
              top: Math.max(
                0,
                Math.min(window.innerHeight - height, current.top),
              ),
            }
          : null,
      );
    }

    window.addEventListener('resize', keepMascotInViewport);
    return () => window.removeEventListener('resize', keepMascotInViewport);
  }, []);

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

  function handleMascotPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    suppressMascotClick.current = false;
    const bounds = event.currentTarget.getBoundingClientRect();
    dragStart.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: bounds.left,
      top: bounds.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleMascotPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - start.startX;
    const deltaY = event.clientY - start.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) start.moved = true;
    if (!start.moved) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    setMascotPosition({
      left: Math.max(
        0,
        Math.min(window.innerWidth - bounds.width, start.left + deltaX),
      ),
      top: Math.max(
        0,
        Math.min(window.innerHeight - bounds.height, start.top + deltaY),
      ),
    });
  }

  function handleMascotPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (dragStart.current?.pointerId !== event.pointerId) return;
    suppressMascotClick.current = dragStart.current.moved;
    dragStart.current = null;
  }

  function handleMascotPointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (dragStart.current?.pointerId !== event.pointerId) return;
    dragStart.current = null;
    suppressMascotClick.current = false;
  }

  function handleMascotKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const movement: Record<string, [number, number]> = {
      ArrowLeft: [-20, 0],
      ArrowRight: [20, 0],
      ArrowUp: [0, -20],
      ArrowDown: [0, 20],
    };
    const delta = movement[event.key];
    if (!delta) return;

    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    setMascotPosition((current) => ({
      left: Math.max(
        0,
        Math.min(
          window.innerWidth - bounds.width,
          (current?.left ?? bounds.left) + delta[0],
        ),
      ),
      top: Math.max(
        0,
        Math.min(
          window.innerHeight - bounds.height,
          (current?.top ?? bounds.top) + delta[1],
        ),
      ),
    }));
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

      <button
        aria-controls="kali-enrollment-guide"
        aria-expanded={open}
        aria-label={open ? content.close : content.reopen}
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
        className={styles.floatingButton}
        onClick={() => {
          if (suppressMascotClick.current) {
            suppressMascotClick.current = false;
            return;
          }
          if (open) closeGuide();
          else reopenGuide();
        }}
        onKeyDown={handleMascotKeyDown}
        onPointerCancel={handleMascotPointerCancel}
        onPointerDown={handleMascotPointerDown}
        onPointerMove={handleMascotPointerMove}
        onPointerUp={handleMascotPointerUp}
        style={
          mascotPosition
            ? {
                bottom: 'auto',
                left: mascotPosition.left,
                right: 'auto',
                top: mascotPosition.top,
              }
            : undefined
        }
        ref={mascotRef}
        type="button"
      >
        <img alt={content.mascotAlt} draggable={false} src={kali} />
      </button>
    </div>
  );
}
