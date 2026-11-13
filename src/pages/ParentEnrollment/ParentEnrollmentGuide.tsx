import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
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

function CompletionIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function isGuideLanguage(value: string): value is GuideLanguage {
  return value === 'en' || value === 'tl';
}

export function ParentEnrollmentGuide() {
  const [language, setLanguage] = useState<GuideLanguage>('en');
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  const [contentVisible, setContentVisible] = useState(true);
  const [widgetPosition, setWidgetPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const contentTimer = useRef<number | null>(null);
  const guideRef = useRef<HTMLDivElement | null>(null);
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
  const activeStep = content.steps[step] ?? content.steps[0];
  const isFinalStep = step === content.steps.length - 1;

  useEffect(
    () => () => {
      if (contentTimer.current !== null) {
        window.clearTimeout(contentTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    function keepWidgetInViewport() {
      const widget = guideRef.current;
      if (!widget) return;
      const bounds = widget.getBoundingClientRect();
      setWidgetPosition((current) =>
        current
          ? {
              left: Math.max(
                0,
                Math.min(window.innerWidth - bounds.width, current.left),
              ),
              top: Math.max(
                0,
                Math.min(window.innerHeight - bounds.height, current.top),
              ),
            }
          : null,
      );
    }

    window.addEventListener('resize', keepWidgetInViewport);
    return () => window.removeEventListener('resize', keepWidgetInViewport);
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

  function navigateToStep(nextStep: number) {
    if (nextStep < 0 || nextStep >= content.steps.length || nextStep === step) {
      return;
    }
    transitionContent(() => setStep(nextStep));
  }

  function changeLanguage(value: string) {
    if (!isGuideLanguage(value) || value === language) return;
    transitionContent(() => setLanguage(value));
  }

  function closeGuide() {
    mascotRef.current?.focus();
    setOpen(false);
  }

  function handleMascotPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const guide = guideRef.current;
    if (!guide) return;
    suppressMascotClick.current = false;
    const bounds = guide.getBoundingClientRect();
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
    const guide = guideRef.current;
    if (!guide) return;
    const deltaX = event.clientX - start.startX;
    const deltaY = event.clientY - start.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) start.moved = true;
    if (!start.moved) return;

    const bounds = guide.getBoundingClientRect();
    setWidgetPosition({
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
    const widget = guideRef.current;
    if (!widget) return;
    const movement: Record<string, number> = {
      ArrowLeft: -20,
      ArrowRight: 20,
      ArrowUp: -20,
      ArrowDown: 20,
    };
    const delta = movement[event.key];
    if (delta === undefined) return;

    event.preventDefault();
    const bounds = widget.getBoundingClientRect();
    const currentLeft = widgetPosition?.left ?? bounds.left;
    const currentTop = widgetPosition?.top ?? bounds.top;
    const nextLeft =
      event.key === 'ArrowLeft' || event.key === 'ArrowRight'
        ? currentLeft + delta
        : currentLeft;
    const nextTop =
      event.key === 'ArrowUp' || event.key === 'ArrowDown'
        ? currentTop + delta
        : currentTop;
    setWidgetPosition({
      left: Math.max(0, Math.min(window.innerWidth - bounds.width, nextLeft)),
      top: Math.max(0, Math.min(window.innerHeight - bounds.height, nextTop)),
    });
  }

  function toggleGuide() {
    if (suppressMascotClick.current) {
      suppressMascotClick.current = false;
      return;
    }
    if (open) closeGuide();
    else setOpen(true);
  }

  return createPortal(
    <div
      className={styles.guide}
      ref={guideRef}
      style={
        widgetPosition
          ? {
              left: widgetPosition.left,
              top: widgetPosition.top,
              right: 'auto',
              bottom: 'auto',
            }
          : undefined
      }
    >
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
              <strong id="kali-guide-title">Kali</strong>
              <span>{content.enrollmentGuide}</span>
            </div>
            <div className={styles.headerActions}>
              <label className={styles.languagePicker}>
                <span>{content.language}</span>
                <select
                  aria-label={content.language}
                  onChange={(event) => changeLanguage(event.target.value)}
                  value={language}
                >
                  <option value="en">English</option>
                  <option value="tl">Tagalog</option>
                </select>
              </label>
              <button
                aria-controls="kali-enrollment-guide"
                aria-expanded={open}
                aria-label={content.close}
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

          <div className={styles.stepStage}>
            <button
              aria-label={content.previous}
              className={styles.navigationButton}
              disabled={step === 0 || !contentVisible}
              onClick={() => navigateToStep(step - 1)}
              type="button"
            >
              <ArrowIcon direction="left" />
            </button>

            <div
              className={`${styles.instruction} ${contentVisible ? styles.contentVisible : ''}`}
              key={`${language}-${step}`}
            >
              <span className={styles.stepCount}>
                {content.step} {step + 1} {content.of} {content.steps.length}
              </span>
              <h2>{activeStep.title}</h2>
              <p>{activeStep.instruction}</p>
            </div>

            <button
              aria-label={isFinalStep ? content.completion : content.next}
              className={`${styles.navigationButton} ${styles.nextButton}`}
              disabled={!contentVisible}
              onClick={() => {
                if (isFinalStep) closeGuide();
                else navigateToStep(step + 1);
              }}
              type="button"
            >
              {isFinalStep ? (
                <CompletionIcon />
              ) : (
                <ArrowIcon direction="right" />
              )}
            </button>
          </div>
        </div>
      </section>

      <button
        aria-controls="kali-enrollment-guide"
        aria-expanded={open}
        aria-label={open ? content.close : content.reopen}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
        className={`${styles.floatingButton} ${open ? styles.mascotOpen : ''}`}
        onClick={toggleGuide}
        onKeyDown={handleMascotKeyDown}
        onPointerCancel={handleMascotPointerCancel}
        onPointerDown={handleMascotPointerDown}
        onPointerMove={handleMascotPointerMove}
        onPointerUp={handleMascotPointerUp}
        ref={mascotRef}
        type="button"
      >
        <img alt={content.mascotAlt} draggable={false} src={kali} />
      </button>
    </div>,
    document.body,
  );
}
