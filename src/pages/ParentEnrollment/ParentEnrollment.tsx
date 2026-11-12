import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import childrenBanner from '../../assets/images/children-banner.png';
import femalePanel from '../../../femalepanel.png';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import { requiredCdcNames, routePaths } from '../../constants/app-constants';
import styles from './ParentEnrollment.module.css';

const steps = ['Child Information', 'Review & Submit'];

const requirements = [
  'PSA Birth Certificate',
  'Parent/Guardian Valid ID',
  'Recent 2x2 ID Picture (Parent/Guardian)',
  'Barangay Clearance',
  'Proof of Residence (Electricity/Water Bill, etc.)',
  'Medical Certificate',
];
const documentTypes = [
  'birth_certificate',
  'parent_id',
  'parent_photo',
  'barangay_clearance',
  'proof_of_residence',
  'medical_certificate',
];
const maxDocumentSize = 5 * 1024 * 1024;
const maxParentPhotoSize = 2 * 1024 * 1024;

type EnrollmentValues = Record<string, string>;
type DocumentFiles = Record<string, File | null>;
type Cdc = {
  id: number;
  name: string;
  address: string;
  barangay: string;
  status: 'active' | 'inactive' | 'pending_activation';
  enrollment_available: boolean;
  availability_reason: string;
};
type ParentAccount = {
  username: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone: string;
};
type RegisteredChild = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  nickname: string | null;
  birth_date: string;
  gender: string;
  address: string | null;
  residence_barangay: string | null;
  preferred_cdc_label: string | null;
  enrollment_status: string;
  application_id: number | null;
  latest_application_status: string | null;
  emergency_name: string;
  emergency_relationship: string;
  emergency_phone: string;
  parent_address: string;
};
type EnrollmentResponse = {
  data: { application_number: string; status: string; id: number };
};

function calculateAge(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age -= 1;
  }
  return age;
}

function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const initialValues: EnrollmentValues = {
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',
  childFirstName: '',
  childMiddleName: '',
  childLastName: '',
  childSuffix: '',
  childNickname: '',
  childBirthDate: '',
  childGender: '',
  psaNumber: '',
  nationality: '',
  placeOfBirth: '',
  childAddress: '',
  bloodType: '',
  medicalCondition: '',
  allergies: '',
  immunizationStatus: '',
  center: '',
  enrollmentType: 'new',
};

function valuesFromRegisteredChild(child: RegisteredChild, cdcs: Cdc[]) {
  const center = cdcs.find(
    (cdc) =>
      cdc.name.trim().toLowerCase() ===
      child.preferred_cdc_label?.trim().toLowerCase(),
  );
  return {
    ...initialValues,
    emergencyName: child.emergency_name,
    emergencyRelationship: child.emergency_relationship,
    emergencyPhone: child.emergency_phone,
    childFirstName: child.first_name,
    childMiddleName: child.middle_name ?? '',
    childLastName: child.last_name,
    childSuffix: child.suffix ?? '',
    childNickname: child.nickname ?? '',
    childBirthDate: child.birth_date,
    childGender: child.gender,
    childAddress:
      child.address ||
      [child.residence_barangay, child.parent_address]
        .filter(Boolean)
        .join(', '),
    center: center ? String(center.id) : '',
    enrollmentType:
      child.enrollment_status === 'enrolled' ? 'reenrollment' : 'new',
  };
}

function normalizeCdcName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function Icon({ name }: { name: string }) {
  const shared = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.9,
    viewBox: '0 0 24 24',
  };
  if (name === 'file')
    return (
      <svg {...shared}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6m-12 5h8m-8 4h6" />
      </svg>
    );
  if (name === 'person')
    return (
      <svg {...shared}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  if (name === 'child')
    return (
      <svg {...shared}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
      </svg>
    );
  if (name === 'upload')
    return (
      <svg {...shared}>
        <path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4" />
      </svg>
    );
  if (name === 'camera')
    return (
      <svg {...shared}>
        <path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v11H3V8a1 1 0 0 1 1-1Z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    );
  if (name === 'preview')
    return (
      <svg {...shared}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  if (name === 'undo')
    return (
      <svg {...shared}>
        <path d="M3 7v5h5M4.5 11a8 8 0 1 1 1.8 6.8" />
      </svg>
    );
  if (name === 'remove')
    return (
      <svg {...shared}>
        <path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6" />
      </svg>
    );
  if (name === 'check')
    return (
      <svg {...shared}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  if (name === 'shield')
    return (
      <svg {...shared}>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  if (name === 'info')
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5m0-8h.01" />
      </svg>
    );
  if (name === 'back')
    return (
      <svg {...shared}>
        <path d="m14 5-7 7 7 7m-7-7h14" />
      </svg>
    );
  if (name === 'arrow')
    return (
      <svg {...shared}>
        <path d="M5 12h14m-6-6 6 6-6 6" />
      </svg>
    );
  if (name === 'close')
    return (
      <svg {...shared}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  if (name === 'home')
    return (
      <svg {...shared}>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
      </svg>
    );
  return (
    <svg {...shared}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function Field({
  id,
  label,
  required = false,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
    </div>
  );
}

function useFileUrl(file: File | null) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file) {
      setUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);
  return url;
}

function DocumentThumbnail({ file }: { file: File }) {
  const url = useFileUrl(file);
  if (!file.type.startsWith('image/') || !url) return null;
  return (
    <img
      alt={`Preview of ${file.name}`}
      className={styles.documentThumbnail}
      src={url}
    />
  );
}

function DocumentPreview({
  file,
  onClose,
}: {
  file: File;
  onClose: () => void;
}) {
  const url = useFileUrl(file);
  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="document-preview-title"
        aria-modal="true"
        className={`${styles.modal} ${styles.documentPreviewModal}`}
        role="dialog"
      >
        <header className={styles.modalHeader}>
          <div>
            <h2 id="document-preview-title">Document Preview</h2>
            <p>{file.name}</p>
          </div>
          <button
            aria-label="Close preview"
            className={styles.modalClose}
            onClick={onClose}
            type="button"
          >
            <Icon name="close" />
          </button>
        </header>
        <div className={styles.documentPreviewBody}>
          {url && file.type.startsWith('image/') ? (
            <img alt={`Preview of ${file.name}`} src={url} />
          ) : (
            <iframe title={`Preview of ${file.name}`} src={url} />
          )}
        </div>
        <footer className={styles.modalActions}>
          <button
            className={styles.secondaryButton}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

function CameraScanner({
  label,
  maxSize,
  onCancel,
  onUsePhoto,
}: {
  label: string;
  maxSize: number;
  onCancel: () => void;
  onUsePhoto: (file: File) => boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capture, setCapture] = useState<File | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState('');
  const captureUrl = useFileUrl(capture);

  useEffect(() => {
    let active = true;
    const startCamera = async () => {
      if (!window.isSecureContext) {
        setError(
          'Camera access requires HTTPS or localhost. Use Upload instead.',
        );
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          'This browser does not support camera access. Use Upload instead.',
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          if (active) setCameraReady(true);
        }
      } catch (cameraError) {
        if (!active) return;
        const name =
          cameraError instanceof DOMException ? cameraError.name : '';
        setError(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'Camera permission was denied. Allow camera access or use Upload instead.'
            : name === 'NotFoundError' || name === 'DevicesNotFoundError'
              ? 'No camera was found on this device. Use Upload instead.'
              : 'The camera could not be started. Check camera access or use Upload instead.',
        );
      }
    };
    void startCamera();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError(
        'The camera is not ready yet. Wait for the preview, then try again.',
      );
      return;
    }
    setError('');
    const initialScale = Math.min(
      1,
      2000 / Math.max(video.videoWidth, video.videoHeight),
    );
    const scales = [
      initialScale,
      initialScale * 0.85,
      initialScale * 0.7,
      initialScale * 0.55,
    ];
    const qualities = [0.9, 0.84, 0.78, 0.72];
    for (const scale of scales) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        setError('The captured image could not be prepared. Please try again.');
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      for (const quality of qualities) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', quality),
        );
        if (blob && blob.size <= maxSize) {
          setCapture(
            new File(
              [blob],
              `${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_scan.jpg`,
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              },
            ),
          );
          return;
        }
      }
    }
    setError(
      'The captured image exceeds this document’s size limit. Retake it closer to the document or use Upload.',
    );
  }

  function usePhoto() {
    if (capture && onUsePhoto(capture)) onCancel();
  }

  return (
    <div className={styles.modalBackdrop}>
      <section
        aria-labelledby="scan-document-title"
        aria-modal="true"
        className={styles.modal}
        role="dialog"
      >
        <header className={styles.modalHeader}>
          <div>
            <h2 id="scan-document-title">Scan Document</h2>
            <p>{label}</p>
          </div>
          <button
            aria-label="Close camera"
            className={styles.modalClose}
            onClick={onCancel}
            type="button"
          >
            <Icon name="close" />
          </button>
        </header>
        <p className={styles.cameraInstruction}>
          Position your document inside the frame and capture a clear image.
        </p>
        <div className={styles.cameraStage}>
          <video
            autoPlay
            className={`${styles.cameraVideo} ${capture ? styles.cameraVideoHidden : ''}`}
            playsInline
            ref={videoRef}
          />
          {capture && captureUrl && (
            <img
              alt="Captured document preview"
              className={styles.cameraImage}
              src={captureUrl}
            />
          )}
          {!capture && (
            <div aria-hidden="true" className={styles.documentGuide} />
          )}
        </div>
        {error && (
          <p className={styles.cameraError} role="alert">
            {error}
          </p>
        )}
        <footer className={styles.modalActions}>
          <button
            className={styles.secondaryButton}
            onClick={onCancel}
            type="button"
          >
            {error ? 'Use Upload' : 'Cancel'}
          </button>
          {capture ? (
            <>
              <button
                className={styles.secondaryButton}
                onClick={() => setCapture(null)}
                type="button"
              >
                Retake
              </button>
              <button
                className={styles.primaryButton}
                onClick={usePhoto}
                type="button"
              >
                Use Photo
              </button>
            </>
          ) : (
            <button
              className={styles.primaryButton}
              disabled={!cameraReady}
              onClick={() => void capturePhoto()}
              type="button"
            >
              <Icon name="camera" /> Capture
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

export function ParentEnrollment() {
  const navigate = useNavigate();
  const { request, user } = useAuth();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(initialValues);
  const [files, setFiles] = useState<DocumentFiles>({});
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [cameraDocumentType, setCameraDocumentType] = useState<string | null>(
    null,
  );
  const [removeDocumentType, setRemoveDocumentType] = useState<string | null>(
    null,
  );
  const [parentAccount, setParentAccount] = useState<ParentAccount | null>(
    null,
  );
  const [registeredChildren, setRegisteredChildren] = useState<
    RegisteredChild[]
  >([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [cdcs, setCdcs] = useState<Cdc[]>([]);
  const [loadingCdcs, setLoadingCdcs] = useState(true);
  const [cdcError, setCdcError] = useState('');
  const [cdcWarning, setCdcWarning] = useState('');
  const [fileError, setFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');

  useEffect(() => {
    let active = true;
    const loadPageData = async () => {
      try {
        const [centers, account, children] = await Promise.all([
          request<{ data: Cdc[] }>('/api/cdcs?include_unavailable=1'),
          request<{
            user: ParentAccount;
          }>('/api/me'),
          request<{ data: RegisteredChild[] }>('/api/parent/children'),
        ]);
        if (!active) return;
        const allowedCenters = (centers.data ?? []).flatMap((center) => {
          const canonicalName = requiredCdcNames.find(
            (name) => normalizeCdcName(name) === normalizeCdcName(center.name),
          );
          return canonicalName ? [{ ...center, name: canonicalName }] : [];
        });
        setCdcs(allowedCenters);
        setCdcWarning(
          allowedCenters.length < (centers.data ?? []).length
            ? 'Some CDC records are not on the approved list and are hidden. Contact MSWDO Admin to resolve them.'
            : '',
        );
        setParentAccount(account.user);
        const availableChildren = (children.data ?? []).filter(
          (child) =>
            !['pending', 'under_review'].includes(
              child.latest_application_status ?? '',
            ),
        );
        setRegisteredChildren(availableChildren);
        if (!selectedChildId && availableChildren[0]) {
          setSelectedChildId(String(availableChildren[0].id));
          setValues(
            valuesFromRegisteredChild(availableChildren[0], allowedCenters),
          );
        }
        setCdcError('');
      } catch (error) {
        if (active) {
          setCdcError(
            error instanceof Error
              ? error.message
              : 'Enrollment information could not be loaded.',
          );
        }
      } finally {
        if (active) setLoadingCdcs(false);
      }
    };
    void loadPageData();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadPageData();
    }, 30_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadPageData();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [request, selectedChildId]);

  function selectRegisteredChild(childId: string) {
    setSelectedChildId(childId);
    const child = registeredChildren.find(
      (record) => String(record.id) === childId,
    );
    if (!child) return;
    setValues(valuesFromRegisteredChild(child, cdcs));
    setFiles({});
    setFileError('');
  }

  function updateValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleFile(key: string, file: File | undefined) {
    if (!file) return false;
    const isPhoto = key === 'parent_photo';
    const allowedTypes = isPhoto
      ? ['image/jpeg', 'image/png']
      : ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = isPhoto ? maxParentPhotoSize : maxDocumentSize;
    if (!allowedTypes.includes(file.type)) {
      setFileError(
        isPhoto
          ? 'The parent photo must be a JPG or PNG image.'
          : 'Choose a PDF, JPG, or PNG document.',
      );
      return false;
    }
    if (file.size > maxSize) {
      setFileError(
        isPhoto
          ? 'The parent photo must be 2 MB or smaller.'
          : 'Each document must be 5 MB or smaller.',
      );
      return false;
    }
    setFileError('');
    setFiles((current) => ({ ...current, [key]: file }));
    return true;
  }

  function openCamera(key: string) {
    setCameraDocumentType(key);
    setFileError('');
  }

  function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateChildInformation()) return;
    setStep(2);
  }

  function previousStep() {
    setStep(1);
  }

  function validateChildInformation() {
    if (
      !parentAccount ||
      !parentAccount.first_name ||
      !parentAccount.last_name ||
      !parentAccount.email
    ) {
      setSubmitError(
        'Your parent account information could not be verified. Refresh the page and try again.',
      );
      return false;
    }
    if (loadingCdcs || cdcs.length === 0) {
      setSubmitError(
        cdcError ||
          'No registered Child Development Centers are available.',
      );
      return false;
    }
    const required = [
      ['childFirstName', 'Child full name'],
      ['childLastName', 'Child full name'],
      ['childBirthDate', 'Birthdate'],
      ['childGender', 'Gender'],
      ['psaNumber', 'PSA Birth Certificate Number'],
      ['nationality', 'Nationality'],
      ['placeOfBirth', 'Place of Birth'],
      ['childAddress', 'Residential Address'],
      ['emergencyName', 'Emergency Contact Person'],
      ['emergencyRelationship', 'Emergency Contact Relationship'],
      ['emergencyPhone', 'Emergency Contact Number'],
      ['center', 'Child Development Center'],
      ['enrollmentType', 'Enrollment Type'],
    ] as const;
    const missing = required.find(([key]) => !values[key]?.trim());
    if (missing) {
      setSubmitError(`${missing[1]} is required.`);
      return false;
    }
    const selectedCdc = cdcs.find((cdc) => String(cdc.id) === values.center);
    if (!selectedCdc?.enrollment_available) {
      setSubmitError(
        selectedCdc?.availability_reason
          ? `${selectedCdc.name} is unavailable: ${selectedCdc.availability_reason}. Choose an available CDC.`
          : 'Choose an available Child Development Center.',
      );
      return false;
    }
    const birthDate = new Date(`${values.childBirthDate}T00:00:00`);
    if (
      Number.isNaN(birthDate.getTime()) ||
      values.childBirthDate > localDateString(new Date())
    ) {
      setSubmitError('Enter a valid birthdate that is not in the future.');
      return false;
    }
    if (!/^[A-Za-z0-9-]{5,60}$/.test(values.psaNumber.trim())) {
      setSubmitError(
        'Enter a valid PSA Birth Certificate Number (5–60 letters, numbers, or hyphens).',
      );
      return false;
    }
    if (!/^[+0-9() -]{7,30}$/.test(values.emergencyPhone.trim())) {
      setSubmitError('Enter a valid emergency contact number.');
      return false;
    }
    const missingFiles = documentTypes
      .slice(0, 5)
      .filter((type) => !files[type]);
    if (values.medicalCondition.trim() && !files.medical_certificate) {
      missingFiles.push('medical_certificate');
    }
    if (missingFiles.length) {
      const labels = missingFiles.map(
        (type) => requirements[documentTypes.indexOf(type)],
      );
      setFileError(
        `Upload the following required documents: ${labels.join(', ')}.`,
      );
      setSubmitError('Required documents are missing.');
      return false;
    }
    setFileError('');
    setSubmitError('');
    return true;
  }

  async function finishApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity() || !validateChildInformation())
      return;
    const confirmation = event.currentTarget.elements.namedItem(
      'confirmation',
    ) as HTMLInputElement | null;
    if (!confirmation?.checked) {
      setSubmitError(
        'Confirm that the information is accurate before submitting.',
      );
      return;
    }
    setSubmitError('');

    const selectedCenter = cdcs.find((cdc) => String(cdc.id) === values.center);
    if (!selectedCenter?.enrollment_available) {
      setSubmitError(
        selectedCenter?.availability_reason
          ? `${selectedCenter.name} is unavailable: ${selectedCenter.availability_reason}. Choose an available CDC.`
          : 'Choose an available Child Development Center before submitting.',
      );
      setStep(1);
      return;
    }

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) =>
      formData.append(key, value),
    );
    formData.set('center', String(selectedCenter.id));
    if (selectedChildId) formData.set('child_id', selectedChildId);
    documentTypes.forEach((type) => {
      const file = files[type];
      if (file) formData.append(`document_${type}`, file);
    });

    setSubmitting(true);
    try {
      const response = await request<EnrollmentResponse>('/api/enrollments', {
        method: 'POST',
        body: formData,
      });
      if (!response.data?.application_number) {
        throw new Error(
          'The application was submitted, but the server did not return its confirmation number. Check application status before retrying.',
        );
      }
      setApplicationNumber(response.data.application_number);
      setComplete(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Application could not be submitted.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function renderInput(
    key: string,
    label: string,
    placeholder: string,
    required = true,
    type = 'text',
  ) {
    return (
      <Field id={key} key={key} label={label} required={required}>
        <input
          autoComplete={key === 'email' ? 'email' : 'off'}
          id={key}
          maxLength={
            type === 'text'
              ? key === 'childFirstName' ||
                key === 'childMiddleName' ||
                key === 'childLastName' ||
                key === 'childNickname'
                ? 100
                : key === 'nationality'
                  ? 80
                  : key === 'placeOfBirth'
                    ? 180
                    : key === 'childAddress'
                      ? 255
                      : key === 'psaNumber'
                        ? 60
                        : key === 'emergencyName'
                          ? 160
                          : key === 'medicalCondition' || key === 'allergies'
                            ? 2000
                            : key === 'immunizationStatus'
                              ? 120
                              : key === 'emergencyPhone'
                                ? 30
                                : 160
              : undefined
          }
          max={type === 'date' ? localDateString(new Date()) : undefined}
          pattern={key === 'psaNumber' ? '[A-Za-z0-9-]{5,60}' : undefined}
          placeholder={placeholder}
          required={required}
          type={type}
          value={values[key]}
          onChange={(event) => updateValue(key, event.target.value)}
        />
      </Field>
    );
  }

  function renderSelect(
    key: string,
    label: string,
    choices: (string | { value: string; label: string })[],
    required = true,
  ) {
    return (
      <Field id={key} key={key} label={label} required={required}>
        <select
          id={key}
          required={required}
          value={values[key]}
          onChange={(event) => updateValue(key, event.target.value)}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {choices.map((choice) => (
            <option
              key={typeof choice === 'string' ? choice : choice.value}
              value={typeof choice === 'string' ? choice : choice.value}
            >
              {typeof choice === 'string' ? choice : choice.label}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  const requiredDocumentTypes = documentTypes.slice(0, 5);
  if (values.medicalCondition.trim())
    requiredDocumentTypes.push('medical_certificate');
  const documentsComplete = requiredDocumentTypes.every((type) =>
    Boolean(files[type]),
  );
  const informationComplete = [
    'childFirstName',
    'childLastName',
    'childBirthDate',
    'childGender',
    'psaNumber',
    'nationality',
    'placeOfBirth',
    'childAddress',
    'emergencyName',
    'emergencyRelationship',
    'emergencyPhone',
    'center',
    'enrollmentType',
  ].every((key) => Boolean(values[key]?.trim()));

  return (
    <main aria-label="Apply for enrollment" className={styles.page}>
      <section
        aria-label="Apply for Enrollment"
        className={styles.hero}
        style={{ backgroundImage: `url("${childrenBanner}")` }}
      >
        <span aria-hidden="true" className={styles.heroIcon}>
          <Icon name="file" />
        </span>
        <div className={styles.heroCopy}>
          <h1>Apply for Enrollment</h1>
          <p>
            Complete an application for each child you want to enroll in a Child
            Development Center.
          </p>
          <p>Make sure to provide accurate and complete information.</p>
        </div>
        <img alt="" src={femalePanel} />
      </section>

      {complete ? (
        <section aria-live="polite" className={styles.completeCard}>
          <span className={styles.completeIcon}>
            <Icon name="check" />
          </span>
          <h2>Application submitted</h2>
          <p>
            Your application has been received by the Child Development Center.
          </p>
          {applicationNumber && <strong>{applicationNumber}</strong>}
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => navigate(routePaths.parentApplicationStatus)}
          >
            View Application Status
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => {
              if (selectedChildId) {
                setRegisteredChildren((current) =>
                  current.filter(
                    (child) => String(child.id) !== selectedChildId,
                  ),
                );
              }
              setStep(1);
              setValues(initialValues);
              setFiles({});
              setSelectedChildId('');
              setSubmitError('');
              setApplicationNumber('');
              setComplete(false);
            }}
          >
            Apply for Another Child
          </button>
        </section>
      ) : (
        <>
          <nav
            aria-label="Enrollment application steps"
            className={styles.stepper}
          >
            {steps.map((label, index) => (
              <button
                aria-current={
                  (step === 1 && index === 0) || (step === 2 && index === 1)
                    ? 'step'
                    : undefined
                }
                className={`${styles.step} ${(step === 1 && index === 0) || (step === 2 && index === 1) ? styles.activeStep : ''} ${step === 2 && index === 0 ? styles.finishedStep : ''}`}
                key={label}
                type="button"
                onClick={() => {
                  if (index === 0) setStep(1);
                  else if (validateChildInformation()) setStep(2);
                }}
              >
                <span>
                  {step === 2 && index === 0 ? (
                    <Icon name="check" />
                  ) : (
                    index + 1
                  )}
                </span>
                <strong>{label}</strong>
              </button>
            ))}
          </nav>

          <div className={styles.contentGrid}>
            <form
              aria-labelledby="form-section-title"
              className={styles.formCard}
              noValidate
              onSubmit={step === 2 ? finishApplication : nextStep}
            >
              {step === 1 && (
                <>
                  <header className={styles.formHeader}>
                    <span>
                      <Icon name="child" />
                    </span>
                    <div>
                      <h2 id="form-section-title">Child Information</h2>
                      <p>
                        Enter the information for the child you are applying to
                        enroll.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formFields}>
                    {registeredChildren.length > 0 && (
                      <Field id="registered-child" label="Child Profile">
                        <select
                          id="registered-child"
                          value={selectedChildId}
                          onChange={(event) =>
                            selectRegisteredChild(event.target.value)
                          }
                        >
                          {registeredChildren.map((child) => (
                            <option key={child.id} value={child.id}>
                              {child.first_name} {child.last_name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}
                    {renderInput(
                      'childFirstName',
                      'First Name',
                      'Enter child’s first name',
                    )}
                    {renderInput(
                      'childMiddleName',
                      'Middle Name',
                      'Enter middle name (optional)',
                      false,
                    )}
                    {renderInput(
                      'childLastName',
                      'Last Name',
                      'Enter last name',
                    )}
                    {renderInput(
                      'childSuffix',
                      'Suffix',
                      'e.g. Jr. (optional)',
                      false,
                    )}
                    {renderInput(
                      'childNickname',
                      'Nickname',
                      'Enter nickname (optional)',
                      false,
                    )}
                    {renderInput(
                      'childBirthDate',
                      'Birthdate',
                      '',
                      true,
                      'date',
                    )}
                    {renderSelect('childGender', 'Gender', ['Female', 'Male'])}
                    {renderInput(
                      'psaNumber',
                      'PSA Birth Certificate Number',
                      'Enter PSA certificate number',
                    )}
                    {renderInput(
                      'nationality',
                      'Nationality',
                      'Enter nationality',
                    )}
                    {renderInput(
                      'placeOfBirth',
                      'Place of Birth',
                      'Enter place of birth',
                    )}
                    {renderInput(
                      'childAddress',
                      'Residential Address',
                      'House No./Street, Barangay, City/Municipality, Province',
                    )}
                  </div>
                  <div className={styles.subsection}>
                    <header>
                      <span>
                        <Icon name="shield" />
                      </span>
                      <div>
                        <h3>Health Information</h3>
                        <p>
                          Optional health information used for enrollment
                          review.
                        </p>
                      </div>
                    </header>
                    <div className={styles.formFields}>
                      {renderSelect(
                        'bloodType',
                        'Blood Type',
                        ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
                        false,
                      )}
                      {renderInput(
                        'medicalCondition',
                        'Medical Condition (if any)',
                        'Enter medical condition',
                        false,
                      )}
                      {renderInput(
                        'allergies',
                        'Allergies (if any)',
                        'Enter allergies',
                        false,
                      )}
                      {renderInput(
                        'immunizationStatus',
                        'Immunization Status',
                        'Enter immunization status',
                        false,
                      )}
                    </div>
                  </div>
                  <div className={styles.subsection}>
                    <header>
                      <span>
                        <Icon name="shield" />
                      </span>
                      <div>
                        <h3>Emergency Contact</h3>
                        <p>Provide someone we can contact in an emergency.</p>
                      </div>
                    </header>
                    <div className={styles.formFields}>
                      {renderInput(
                        'emergencyName',
                        'Contact Person Name',
                        'Enter contact person name',
                      )}
                      {renderSelect(
                        'emergencyRelationship',
                        'Relationship to Child',
                        [
                          'Parent',
                          'Mother',
                          'Father',
                          'Guardian',
                          'Sibling',
                          'Relative',
                          'Other',
                        ],
                      )}
                      {renderInput(
                        'emergencyPhone',
                        'Contact Number',
                        'Enter contact number',
                        true,
                        'tel',
                      )}
                    </div>
                  </div>
                  <div className={styles.subsection}>
                    <header>
                      <span>
                        <Icon name="person" />
                      </span>
                      <div>
                        <h3>Other Information</h3>
                        <p>Enrollment placement details.</p>
                      </div>
                    </header>
                    <div className={styles.formFields}>
                      <Field
                        id="center"
                        label="Child Development Center"
                        required
                      >
                        <select
                          id="center"
                          required
                          value={values.center}
                          onChange={(event) =>
                            updateValue('center', event.target.value)
                          }
                        >
                          <option value="">
                            Select Child Development Center
                          </option>
                          {cdcs.map((cdc) => (
                            <option
                              key={cdc.id}
                              disabled={!cdc.enrollment_available}
                              value={cdc.id}
                            >
                              {cdc.name} — {cdc.availability_reason}
                            </option>
                          ))}
                        </select>
                      </Field>
                      {renderSelect('enrollmentType', 'Enrollment Type', [
                        { value: 'new', label: 'New Enrollment' },
                        { value: 'reenrollment', label: 'Re-enrollment' },
                      ])}
                      <p className={styles.helperNote}>
                        Assigned teacher is determined by the CDC. The official
                        enrollment date will be set after approval.
                      </p>
                    </div>
                  </div>
                  {loadingCdcs && (
                    <p className={styles.helperNote}>
                      <BouncingDots label="Loading Child Development Centers" />
                    </p>
                  )}
                  {cdcError && (
                    <p className={styles.fileError} role="alert">
                      {cdcError}
                    </p>
                  )}
                  {cdcWarning && (
                    <p className={styles.helperNote} role="status">
                      {cdcWarning}
                    </p>
                  )}
                  <div className={styles.subsection}>
                    <header>
                      <span>
                        <Icon name="upload" />
                      </span>
                      <div>
                        <h3>Required Enrollment Documents</h3>
                        <p>
                          PDF/JPG/PNG up to 5 MB. Parent photo: JPG/PNG up to 2
                          MB.
                        </p>
                      </div>
                    </header>
                    <div className={styles.documentList}>
                      {requirements.map((requirement, index) => {
                        const key = documentTypes[index];
                        const selectedFile = files[key];
                        const isRequired =
                          index < 5 ||
                          (key === 'medical_certificate' &&
                            Boolean(values.medicalCondition.trim()));
                        return (
                          <div className={styles.documentItem} key={key}>
                            <span className={styles.documentIcon}>
                              <Icon name={selectedFile ? 'check' : 'file'} />
                            </span>
                            <span className={styles.documentCopy}>
                              <strong>
                                {requirement}
                                {key === 'medical_certificate'
                                  ? ' (if applicable)'
                                  : ' *'}
                              </strong>
                              <small>
                                {selectedFile?.name ?? 'No file selected'}
                              </small>
                              {selectedFile && (
                                <DocumentThumbnail file={selectedFile} />
                              )}
                              <small className={styles.documentStatus}>
                                {isRequired
                                  ? selectedFile
                                    ? 'Ready for submission'
                                    : 'Required'
                                  : selectedFile
                                    ? 'Ready for submission'
                                    : 'Not Required unless requested'}
                              </small>
                            </span>
                            <div className={styles.documentActions}>
                              {!selectedFile ? (
                                <div className={styles.documentPrimaryActions}>
                                  <label className={styles.uploadButton}>
                                    Upload <Icon name="upload" />
                                    <input
                                      accept={
                                        key === 'parent_photo'
                                          ? '.jpg,.jpeg,.png,image/jpeg,image/png'
                                          : '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
                                      }
                                      aria-label={`Upload ${requirement}`}
                                      className={styles.fileInput}
                                      type="file"
                                      onChange={(event) => {
                                        handleFile(
                                          key,
                                          event.target.files?.[0],
                                        );
                                        event.currentTarget.value = '';
                                      }}
                                    />
                                  </label>
                                  <button
                                    className={styles.scanButton}
                                    onClick={() => openCamera(key)}
                                    type="button"
                                  >
                                    <Icon name="camera" /> Scan
                                  </button>
                                </div>
                              ) : (
                                <div className={styles.documentManageActions}>
                                  <button
                                    className={styles.documentActionButton}
                                    onClick={() => setPreviewFile(selectedFile)}
                                    type="button"
                                  >
                                    <Icon name="preview" /> Preview
                                  </button>
                                  <button
                                    className={styles.documentActionButton}
                                    onClick={() => {
                                      setFiles((current) => ({
                                        ...current,
                                        [key]: null,
                                      }));
                                      setFileError('');
                                    }}
                                    type="button"
                                  >
                                    <Icon name="undo" /> Undo
                                  </button>
                                  <button
                                    className={`${styles.documentActionButton} ${styles.removeAction}`}
                                    onClick={() => setRemoveDocumentType(key)}
                                    type="button"
                                  >
                                    <Icon name="remove" /> Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {fileError && (
                      <p className={styles.fileError} role="alert">
                        {fileError}
                      </p>
                    )}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <header className={styles.formHeader}>
                    <span>
                      <Icon name="check" />
                    </span>
                    <div>
                      <h2 id="form-section-title">Review &amp; Submit</h2>
                      <p>
                        Check your information before preparing the application.
                      </p>
                    </div>
                  </header>
                  <ReviewSection title="Child Personal Information">
                    <ReviewRow
                      label="Child Full Name"
                      value={`${values.childFirstName} ${values.childMiddleName} ${values.childLastName} ${values.childSuffix}`
                        .replace(/\s+/g, ' ')
                        .trim()}
                    />
                    <ReviewRow label="Nickname" value={values.childNickname} />
                    <ReviewRow
                      label="Birthdate / Age"
                      value={`${values.childBirthDate}${values.childBirthDate ? ` (${calculateAge(values.childBirthDate)} years old)` : ''}`}
                    />
                    <ReviewRow label="Gender" value={values.childGender} />
                    <ReviewRow
                      label="PSA Birth Certificate Number"
                      value={values.psaNumber}
                    />
                    <ReviewRow label="Nationality" value={values.nationality} />
                    <ReviewRow
                      label="Place of Birth"
                      value={values.placeOfBirth}
                    />
                    <ReviewRow
                      label="Residential Address"
                      value={values.childAddress}
                    />
                  </ReviewSection>
                  <ReviewSection title="Health Information">
                    <ReviewRow label="Blood Type" value={values.bloodType} />
                    <ReviewRow
                      label="Medical Condition"
                      value={values.medicalCondition}
                    />
                    <ReviewRow label="Allergies" value={values.allergies} />
                    <ReviewRow
                      label="Immunization Status"
                      value={values.immunizationStatus}
                    />
                  </ReviewSection>
                  <ReviewSection title="Emergency Contact">
                    <ReviewRow
                      label="Contact Person Name"
                      value={values.emergencyName}
                    />
                    <ReviewRow
                      label="Relationship to Child"
                      value={values.emergencyRelationship}
                    />
                    <ReviewRow
                      label="Contact Number"
                      value={values.emergencyPhone}
                    />
                  </ReviewSection>
                  <ReviewSection title="Other Information">
                    <ReviewRow
                      label="Parent / Guardian"
                      value={
                        parentAccount
                          ? [
                              parentAccount.first_name,
                              parentAccount.middle_name,
                              parentAccount.last_name,
                            ]
                              .filter(Boolean)
                              .join(' ')
                          : ''
                      }
                    />
                    <ReviewRow
                      label="Parent Email / Phone"
                      value={`${parentAccount?.email ?? user?.email ?? ''} · ${parentAccount?.phone ?? user?.phone ?? ''}`}
                    />
                    <ReviewRow
                      label="Child Development Center"
                      value={
                        cdcs.find((cdc) => String(cdc.id) === values.center)
                          ?.name ?? ''
                      }
                    />
                    <ReviewRow
                      label="Assigned Teacher"
                      value="Assigned by the CDC after review"
                    />
                    <ReviewRow
                      label="Enrollment Type"
                      value={
                        values.enrollmentType === 'new'
                          ? 'New Enrollment'
                          : 'Re-enrollment'
                      }
                    />
                    <ReviewRow
                      label="Date Enrolled"
                      value="Will be set after approval"
                    />
                  </ReviewSection>
                  <ReviewSection title="Required Documents">
                    {requirements.map((requirement, index) => {
                      const file = files[documentTypes[index]];
                      const optionalMedical =
                        index === 5 && !values.medicalCondition.trim();
                      return (
                        <div className={styles.reviewRow} key={requirement}>
                          <dt>{requirement}</dt>
                          <dd className={styles.reviewDocumentValue}>
                            <span>
                              {file?.name ??
                                (optionalMedical ? 'Not Required' : 'Missing')}
                              {' · '}
                              {file
                                ? 'Ready for submission'
                                : optionalMedical
                                  ? 'Not Required'
                                  : 'Missing'}
                            </span>
                            {file && (
                              <button
                                className={styles.documentActionButton}
                                onClick={() => setPreviewFile(file)}
                                type="button"
                              >
                                <Icon name="preview" /> Preview
                              </button>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </ReviewSection>
                  <label className={styles.consent}>
                    <input name="confirmation" required type="checkbox" /> I
                    confirm that the information provided is accurate and
                    consent to processing for enrollment.
                  </label>
                </>
              )}

              {submitError && (
                <p className={styles.fileError} role="alert">
                  {submitError}
                </p>
              )}

              <footer className={styles.formActions}>
                {step === 2 ? (
                  <>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      onClick={previousStep}
                    >
                      <Icon name="back" /> Back
                    </button>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      onClick={previousStep}
                    >
                      Edit Child Information
                    </button>
                  </>
                ) : (
                  <span />
                )}
                <button
                  className={styles.primaryButton}
                  disabled={submitting}
                  type="submit"
                >
                  {step === 2
                    ? submitting
                      ? 'Submitting…'
                      : 'Submit Application'
                    : 'Continue to Review'}
                  {step === 1 && <Icon name="arrow" />}
                </button>
              </footer>
            </form>

            <aside className={styles.rightRail}>
              <section className={styles.railCard}>
                <header>
                  <span>
                    <Icon name="file" />
                  </span>
                  <div>
                    <h2>
                      {step === 2
                        ? 'Application Summary'
                        : 'Required Documents'}
                    </h2>
                    <p>
                      {step === 2
                        ? 'Check the information and requirements before submitting.'
                        : 'Upload required documents before continuing to review.'}
                    </p>
                  </div>
                </header>
                {step === 2 ? (
                  <ol className={styles.workflowSummary}>
                    <li>
                      <span>
                        {informationComplete && documentsComplete ? (
                          <Icon name="check" />
                        ) : (
                          '1'
                        )}
                      </span>
                      <strong>Child Information</strong>
                      <small>
                        {informationComplete && documentsComplete
                          ? 'Complete'
                          : 'Needs attention'}
                      </small>
                    </li>
                    <li>
                      <span>
                        {informationComplete && documentsComplete ? '2' : '!'}
                      </span>
                      <strong>Review &amp; Submit</strong>
                      <small>
                        {informationComplete && documentsComplete
                          ? 'Ready for confirmation'
                          : 'Complete required fields/documents'}
                      </small>
                    </li>
                  </ol>
                ) : (
                  <ul>
                    {requirements.map((requirement, index) => (
                      <li key={requirement}>
                        <Icon
                          name={files[documentTypes[index]] ? 'check' : 'file'}
                        />
                        {requirement}
                        {index === 5 ? ' (conditional)' : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section
                className={`${styles.railCard} ${styles.informationCard}`}
              >
                <header>
                  <span>
                    <Icon name="info" />
                  </span>
                  <h2>Important Information</h2>
                </header>
                <ul>
                  <li>
                    Verify all details and document filenames before submission.
                  </li>
                  <li>
                    The CDC will review your application and update its status.
                  </li>
                  <li>
                    The official enrollment date is assigned only after
                    approval.
                  </li>
                </ul>
              </section>
              <div
                aria-hidden="true"
                className={styles.encouragement}
                style={{ backgroundImage: `url("${childrenBanner}")` }}
              >
                <img alt="" src={femalePanel} />
                <strong>A Brighter Future Starts Here!</strong>
              </div>
            </aside>
          </div>
        </>
      )}
      {cameraDocumentType && (
        <CameraScanner
          label={requirements[documentTypes.indexOf(cameraDocumentType)]}
          maxSize={
            cameraDocumentType === 'parent_photo'
              ? maxParentPhotoSize
              : maxDocumentSize
          }
          onCancel={() => setCameraDocumentType(null)}
          onUsePhoto={(file) => handleFile(cameraDocumentType, file)}
        />
      )}
      {previewFile && (
        <DocumentPreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
      {removeDocumentType && (
        <div className={styles.modalBackdrop}>
          <section
            aria-labelledby="remove-document-title"
            aria-modal="true"
            className={`${styles.modal} ${styles.removeConfirmation}`}
            role="alertdialog"
          >
            <header className={styles.modalHeader}>
              <h2 id="remove-document-title">Remove Document?</h2>
            </header>
            <p className={styles.removeConfirmationMessage}>
              Are you sure you want to remove this document?
            </p>
            <footer className={styles.modalActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => setRemoveDocumentType(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.confirmRemoveButton}
                onClick={() => {
                  setFiles((current) => ({
                    ...current,
                    [removeDocumentType]: null,
                  }));
                  setFileError('');
                  setRemoveDocumentType(null);
                }}
                type="button"
              >
                Yes
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.reviewSection}>
      <h3>{title}</h3>
      <dl>{children}</dl>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.reviewRow}>
      <dt>{label}</dt>
      <dd>{value || 'Not provided'}</dd>
    </div>
  );
}
