import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import logo from '../../../logo2.png';
import styles from './StudentIdViewer.module.css';
import { studentCode } from './student-id-utils';

export type StudentIdDetails = {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string | null;
  name: string;
  age: number;
  birthday: string;
  gender: string;
  className: string;
  guardian: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianAddress: string;
  address: string;
};

type StudentIdViewerProps = {
  student: StudentIdDetails;
  onClose: () => void;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function IdIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="8" cy="11" r="2" fill="currentColor" />
      <path
        d="M5.5 16c.4-1.6 1.2-2.4 2.5-2.4s2.1.8 2.5 2.4M13 10h5m-5 4h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function FlipIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M20 7v5h-5M4 17v-5h5m10.2-2A7 7 0 0 0 6 6l-2 2m4 8a7 7 0 0 0 12-2l1-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 8V4h10v4m-10 9H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2m-10-3h10v6H7z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M17 11h.01" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: 'person' | 'birthday' | 'gender' | 'guardian' | 'phone' | 'address';
}) {
  const paths = {
    person: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    birthday: (
      <>
        <rect x="4" y="6" width="16" height="14" rx="2" />
        <path d="M8 3v6m8-6v6M4 11h16" />
      </>
    ),
    gender: (
      <>
        <circle cx="10" cy="14" r="6" />
        <path d="M14.5 9.5 20 4m-5 0h5v5" />
      </>
    ),
    guardian: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19a6 6 0 0 1 12 0m1-8a3 3 0 1 0 0-6m1 8a6 6 0 0 1 4 6" />
      </>
    ),
    phone: (
      <>
        <path d="M6 3h4l2 5-3 2a14 14 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" />
      </>
    ),
    address: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
  };
  return (
    <div className={styles.detail}>
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <g
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          {paths[icon]}
        </g>
      </svg>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value || 'Not provided'}</span>
    </div>
  );
}

function IdBrand() {
  return (
    <div className={styles.brand}>
      <img alt="KalingaLink" src={logo} />
      <div>
        <strong>Child Development Center</strong>
        <span>Pinamalayan, Oriental Mindoro</span>
      </div>
    </div>
  );
}

function StudentIdFront({ student }: { student: StudentIdDetails }) {
  return (
    <article
      aria-label="Front of student ID"
      className={`${styles.idCard} ${styles.front}`}
    >
      <div aria-hidden="true" className={styles.frontSweep} />
      <IdBrand />
      <div className={styles.frontContent}>
        <div
          aria-label={`${student.name} initials`}
          className={styles.studentPhoto}
          role="img"
        >
          <span>{initials(student.name)}</span>
        </div>
        <div className={styles.frontDetails}>
          {student.nickname?.trim() && (
            <span className={styles.nickname}>{student.nickname}</span>
          )}
          <h2>{student.name}</h2>
          <p>
            <span>First Name</span>
            <strong>{student.firstName || 'Not provided'}</strong>
          </p>
          <p>
            <span>Middle Name</span>
            <strong>{student.middleName || 'Not provided'}</strong>
          </p>
          <p>
            <span>Last Name</span>
            <strong>{student.lastName || 'Not provided'}</strong>
          </p>
          <p>
            <span>Age</span>
            <strong>
              {student.age} {student.age === 1 ? 'year old' : 'years old'}
            </strong>
          </p>
        </div>
      </div>
      <span className={styles.frontCode}>{studentCode(student.id)}</span>
    </article>
  );
}

function StudentIdBack({
  student,
  qrCode,
  qrError,
}: {
  student: StudentIdDetails;
  qrCode: string;
  qrError: string;
}) {
  return (
    <article
      aria-label="Back of student ID"
      className={`${styles.idCard} ${styles.back}`}
    >
      <div className={styles.backBrand}>
        <IdBrand />
      </div>
      <div className={styles.backContent}>
        <div className={styles.backDetails}>
          <Detail
            icon="birthday"
            label="Child's Birthday"
            value={student.birthday}
          />
          <Detail icon="gender" label="Gender" value={student.gender} />
          <Detail
            icon="guardian"
            label="Parent / Guardian"
            value={student.guardian}
          />
          <Detail
            icon="guardian"
            label="Relationship"
            value={student.guardianRelation}
          />
          <Detail
            icon="phone"
            label="Phone Number"
            value={student.guardianPhone}
          />
          <Detail
            icon="address"
            label="Address"
            value={student.guardianAddress || student.address}
          />
        </div>
        <div className={styles.qrSection}>
          {qrCode ? (
            <img
              className={styles.qrCode}
              alt={`Verification code for ${studentCode(student.id)}`}
              src={qrCode}
            />
          ) : (
            <div
              className={styles.qrPlaceholder}
              role={qrError ? 'alert' : 'status'}
            >
              {qrError || 'Preparing secure verification code…'}
            </div>
          )}
          <strong>Scan to Verify Student</strong>
          <span>{studentCode(student.id)}</span>
        </div>
      </div>
    </article>
  );
}

export function StudentIdViewer({ student, onClose }: StudentIdViewerProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [qrCode, setQrCode] = useState('');
  const [qrError, setQrError] = useState('');
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const isClosing = useRef(false);
  const closeAction = useRef<() => void>(() => {});

  closeAction.current = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 180);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAction.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const verificationUrl = new URL(
      '/teacher/students',
      window.location.origin,
    );
    verificationUrl.searchParams.set('verify', studentCode(student.id));
    setQrCode('');
    setQrError('');
    void QRCode.toDataURL(verificationUrl.toString(), {
      errorCorrectionLevel: 'Q',
      margin: 4,
      width: 360,
      color: { dark: '#063d82', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (active) setQrCode(dataUrl);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setQrError('Could not generate the verification code.');
        console.error('Student ID QR code generation failed.', error);
      });
    return () => {
      active = false;
    };
  }, [student.id]);

  function toggleSide() {
    setSide((current) => (current === 'front' ? 'back' : 'front'));
  }

  function handleClose() {
    closeAction.current();
  }

  return (
    <div
      className={`${styles.backdrop} ${closing ? styles.backdropClosing : ''}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        aria-labelledby="student-id-title"
        aria-modal="true"
        className={`${styles.viewer} ${closing ? styles.viewerClosing : ''}`}
        role="dialog"
      >
        <header className={styles.viewerHeader}>
          <div className={styles.viewerTitle}>
            <span className={styles.titleIcon}>
              <IdIcon />
            </span>
            <h2 id="student-id-title">Student ID Card</h2>
          </div>
          <button
            aria-label="Close student ID card"
            className={styles.closeButton}
            type="button"
            onClick={handleClose}
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
        </header>

        <div className={styles.viewerBody}>
          <div
            aria-label="ID card side"
            className={styles.sideSelector}
            role="group"
          >
            <button
              aria-pressed={side === 'front'}
              className={side === 'front' ? styles.activeSide : ''}
              type="button"
              onClick={() => setSide('front')}
            >
              Front
            </button>
            <button
              aria-pressed={side === 'back'}
              className={side === 'back' ? styles.activeSide : ''}
              type="button"
              onClick={() => setSide('back')}
            >
              Back
            </button>
          </div>

          <div className={styles.cardStage}>
            <div
              className={`${styles.flipper} ${side === 'back' ? styles.flipped : ''}`}
            >
              <div className={styles.previewFront}>
                <StudentIdFront student={student} />
              </div>
              <div className={styles.previewBack}>
                <StudentIdBack
                  student={student}
                  qrCode={qrCode}
                  qrError={qrError}
                />
              </div>
            </div>
          </div>

          <div className={styles.viewerActions}>
            <button
              className={styles.primaryAction}
              type="button"
              onClick={toggleSide}
            >
              <FlipIcon /> Flip
            </button>
            <button
              className={styles.secondaryAction}
              type="button"
              onClick={() => window.print()}
            >
              <PrintIcon /> Print
            </button>
          </div>
        </div>

        <div className={styles.printLayout}>
          <StudentIdFront student={student} />
          <StudentIdBack student={student} qrCode={qrCode} qrError={qrError} />
        </div>
      </section>
    </div>
  );
}
