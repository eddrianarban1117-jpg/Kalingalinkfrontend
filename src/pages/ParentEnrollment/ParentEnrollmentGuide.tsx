import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
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

function wrapInstructionLines(element: HTMLElement, text: string) {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return [text];
  const style = getComputedStyle(element);
  context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const maxWidth = element.clientWidth;
  if (!maxWidth) return [text];

  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function ParentEnrollmentGuide() {
  const [language, setLanguage] = useState<GuideLanguage>('en');
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  const [contentVisible, setContentVisible] = useState(true);
  const [instructionLines, setInstructionLines] = useState<{
    text: string;
    lines: string[];
  }>({ text: '', lines: [] });
  const [widgetPosition, setWidgetPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [bubbleToRight, setBubbleToRight] = useState(false);
  const contentTimer = useRef<number | null>(null);
  const guideRef = useRef<HTMLDivElement | null>(null);
  const mascotRef = useRef<HTMLButtonElement | null>(null);
  const instructionRef = useRef<HTMLParagraphElement | null>(null);
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
  const visibleLines =
    instructionLines.text === activeStep.instruction
      ? instructionLines.lines
      : [activeStep.instruction];

  useEffect(
    () => () => {
      if (contentTimer.current !== null) {
        window.clearTimeout(contentTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    const paragraph = instructionRef.current;
    if (!paragraph) return;

    const updateLines = () => {
      setInstructionLines({
        text: activeStep.instruction,
        lines: wrapInstructionLines(paragraph, activeStep.instruction),
      });
    };
    updateLines();
    const observer = new ResizeObserver(updateLines);
    observer.observe(paragraph);
    return () => observer.disconnect();
  }, [activeStep.instruction]);

  useEffect(() => {
    function keepWidgetInViewport() {
      const mascot = mascotRef.current;
      const widget = guideRef.current;
      if (!mascot || !widget || !widgetPosition) return;
      const mascotWidth = mascot.getBoundingClientRect().width;
      const panelWidth = widget.getBoundingClientRect().width - mascotWidth;
      const toRight =
        widgetPosition.left + mascotWidth / 2 < window.innerWidth / 2;
      const widgetLeft = toRight
        ? widgetPosition.left
        : widgetPosition.left - panelWidth;
      const clampedWidgetLeft = Math.max(
        0,
        Math.min(
          window.innerWidth - widget.getBoundingClientRect().width,
          widgetLeft,
        ),
      );
      const mascotLeft = toRight
        ? clampedWidgetLeft
        : clampedWidgetLeft + panelWidth;
      setBubbleToRight(toRight);
      setWidgetPosition({
        left: mascotLeft,
        top: Math.max(
          0,
          Math.min(
            window.innerHeight - mascot.getBoundingClientRect().height,
            widgetPosition.top,
          ),
        ),
      });
    }

    window.addEventListener('resize', keepWidgetInViewport);
    return () => window.removeEventListener('resize', keepWidgetInViewport);
  }, [widgetPosition]);

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
    const widget = guideRef.current;
    const mascot = mascotRef.current;
    if (!widget || !mascot) return;
    const deltaX = event.clientX - start.startX;
    const deltaY = event.clientY - start.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) start.moved = true;
    if (!start.moved) return;

    const mascotBounds = mascot.getBoundingClientRect();
    const widgetWidth = widget.getBoundingClientRect().width;
    const mascotLeft = start.left + deltaX;
    const toRight = mascotLeft + mascotBounds.width / 2 < window.innerWidth / 2;
    const panelWidth = widgetWidth - mascotBounds.width;
    const widgetLeft = toRight ? mascotLeft : mascotLeft - panelWidth;
    const clampedWidgetLeft = Math.max(
      0,
      Math.min(window.innerWidth - widgetWidth, widgetLeft),
    );
    const clampedMascotLeft = toRight
      ? clampedWidgetLeft
      : clampedWidgetLeft + panelWidth;
    const panel = widget.querySelector<HTMLElement>(
      `[id="kali-enrollment-guide"]`,
    );
    const panelHeight = panel?.getBoundingClientRect().height ?? 0;
    setBubbleToRight(toRight);
    setWidgetPosition({
      left: clampedMascotLeft,
      top: Math.max(
        open ? panelHeight + 20 : 0,
        Math.min(window.innerHeight - mascotBounds.height, start.top + deltaY),
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
    const mascot = mascotRef.current;
    if (!widget || !mascot) return;
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
    const mascotBounds = mascot.getBoundingClientRect();
    const currentLeft = widgetPosition?.left ?? mascotBounds.left;
    const currentTop = widgetPosition?.top ?? mascotBounds.top;
    const nextLeft =
      event.key === 'ArrowLeft' || event.key === 'ArrowRight'
        ? currentLeft + delta
        : currentLeft;
    const nextTop =
      event.key === 'ArrowUp' || event.key === 'ArrowDown'
        ? currentTop + delta
        : currentTop;
    const toRight = nextLeft + mascotBounds.width / 2 < window.innerWidth / 2;
    const panelWidth = bounds.width - mascotBounds.width;
    const rootLeft = toRight ? nextLeft : nextLeft - panelWidth;
    const clampedRootLeft = Math.max(
      0,
      Math.min(window.innerWidth - bounds.width, rootLeft),
    );
    setBubbleToRight(toRight);
    setWidgetPosition({
      left: toRight ? clampedRootLeft : clampedRootLeft + panelWidth,
      top: Math.max(
        open
          ? (widget
              .querySelector('#kali-enrollment-guide')
              ?.getBoundingClientRect().height ?? 0) + 20
          : 0,
        Math.min(window.innerHeight - mascotBounds.height, nextTop),
      ),
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
      className={`${styles.guide} ${bubbleToRight ? styles.bubbleToRight : ''}`}
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
              <p aria-label={activeStep.instruction} ref={instructionRef}>
                {visibleLines.map((line, index) => {
                  const previousLength = visibleLines
                    .slice(0, index)
                    .reduce(
                      (length, previousLine) => length + previousLine.length,
                      0,
                    );
                  return (
                    <span
                      aria-hidden="true"
                      className={styles.typewriterLine}
                      key={`${line}-${index}`}
                      style={
                        {
                          '--line-chars': line.length,
                          '--line-delay': `${previousLength * 22}ms`,
                        } as CSSProperties
                      }
                    >
                      {line}
                    </span>
                  );
                })}
              </p>
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
