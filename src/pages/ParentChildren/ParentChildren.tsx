import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import { Avatar } from '../../components/common/Avatar/Avatar';
import { routePaths } from '../../constants/app-constants';
import childrenBanner from '../../assets/images/children-banner.png';
import emergencyIllustration from '../../../emerg.png';
import medicalIllustration from '../../../medic.png';
import styles from './ParentChildren.module.css';

type ChildTab =
  | 'Personal Information'
  | 'Health Information'
  | 'Parent / Guardian Information'
  | 'Emergency Contact'
  | 'Transfer History';

type ChildProfile = {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  fullName: string;
  nickname: string;
  birthDate: string;
  gender: string;
  certificate: string;
  nationality: string;
  placeOfBirth: string;
  address: string;
  dateEnrolled: string;
  enrollmentType: string;
  enrollmentStatus: string;
  bloodType: string;
  allergies: string;
  medicalConditions: string;
  immunization: string;
  parentName: string;
  parentRelationship: string;
  parentPhone: string;
  parentEmail: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  center: string;
  teacher: string;
  hasPhoto: boolean;
};

type EditableChildKey =
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'nickname'
  | 'birthDate'
  | 'gender'
  | 'certificate'
  | 'nationality'
  | 'placeOfBirth'
  | 'address'
  | 'bloodType'
  | 'allergies'
  | 'medicalConditions'
  | 'immunization';

type ApiChildProfile = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  nickname: string | null;
  birth_date: string;
  gender: string;
  enrollment_status: string;
  application_status: string;
  psa_birth_certificate_number: string | null;
  nationality: string | null;
  place_of_birth: string | null;
  address: string | null;
  enrolled_at: string | null;
  blood_type: string | null;
  allergies: string | null;
  medical_notes: string | null;
  immunization_status: string | null;
  enrollment_type: string | null;
  emergency_name: string | null;
  emergency_relationship: string | null;
  emergency_phone: string | null;
  center_name: string;
  class_name: string;
  teacher_name: string;
  parent_name: string;
  parent_relationship: string;
  parent_phone: string;
  parent_email: string;
  has_profile_photo: boolean | number | string;
};

type TransferCenter = {
  id: number;
  name: string;
  address: string | null;
  barangay: string | null;
  teacher_name: string;
};

type ChildTransfer = {
  id: number;
  reference: string;
  reason: string;
  other_reason: string | null;
  new_address: string | null;
  new_barangay: string | null;
  new_municipality: string | null;
  requested_date: string;
  remarks: string | null;
  status: string;
  previous_teacher_remarks: string | null;
  receiving_teacher_remarks: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  previous_cdc_name: string;
  destination_cdc_name: string;
  previous_teacher_name: string | null;
  receiving_teacher_name: string | null;
  documents: Array<{
    id: number;
    original_name: string;
    download_url: string;
  }>;
  events: Array<{
    event_type: string;
    remarks: string | null;
    created_at: string;
    actor_name: string | null;
    actor_role: string | null;
  }>;
};

type TransferDraft = {
  destinationCdcId: string;
  reason: string;
  otherReason: string;
  newAddress: string;
  newBarangay: string;
  newMunicipality: string;
  requestedDate: string;
  remarks: string;
  documents: File[];
  confirmed: boolean;
};

function formatDate(value: string) {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  ).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function todayDateInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function calculateAge(value: string) {
  if (!value) return 'Not provided';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return 'Not provided';
  const birthDate = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  )
    years -= 1;
  return `${Math.max(years, 0)} ${years === 1 ? 'year' : 'years'} old`;
}

function mapChildProfile(record: ApiChildProfile): ChildProfile {
  const firstName = record.first_name ?? '';
  const middleName = record.middle_name ?? '';
  const lastName = record.last_name ?? '';
  const suffix = record.suffix ?? '';
  const status =
    record.enrollment_status === 'enrolled'
      ? 'Enrolled'
      : (record.application_status || record.enrollment_status || 'pending')
          .replaceAll('_', ' ')
          .replace(/^./, (letter) => letter.toUpperCase());
  return {
    id: record.id,
    firstName,
    middleName,
    lastName,
    suffix,
    fullName: [firstName, middleName, lastName, suffix]
      .filter(Boolean)
      .join(' '),
    nickname: record.nickname ?? '',
    birthDate: record.birth_date ?? '',
    gender: record.gender ?? '',
    certificate: record.psa_birth_certificate_number ?? '',
    nationality: record.nationality ?? '',
    placeOfBirth: record.place_of_birth ?? '',
    address: record.address ?? '',
    dateEnrolled: record.enrolled_at ? formatDate(record.enrolled_at) : '',
    enrollmentType:
      record.enrollment_type === 'reenrollment'
        ? 'Re-enrollment'
        : record.enrollment_type === 'new'
          ? 'New Enrollment'
          : '',
    enrollmentStatus: status,
    bloodType: record.blood_type ?? '',
    allergies: record.allergies ?? '',
    medicalConditions: record.medical_notes ?? '',
    immunization: record.immunization_status ?? '',
    parentName: record.parent_name.trim(),
    parentRelationship: record.parent_relationship ?? '',
    parentPhone: record.parent_phone ?? '',
    parentEmail: record.parent_email ?? '',
    emergencyName: record.emergency_name ?? '',
    emergencyRelationship: record.emergency_relationship ?? '',
    emergencyPhone: record.emergency_phone ?? '',
    center: record.center_name ?? '',
    teacher: record.teacher_name.trim(),
    hasPhoto: Number(record.has_profile_photo) === 1,
  };
}

const tabIcons: Record<ChildTab, string> = {
  'Personal Information': 'person',
  'Health Information': 'health',
  'Parent / Guardian Information': 'family',
  'Emergency Contact': 'phone',
  'Transfer History': 'file',
};

const editableFields: Record<
  ChildTab,
  { key: EditableChildKey; label: string }[]
> = {
  'Personal Information': [
    { key: 'firstName', label: 'First Name' },
    { key: 'middleName', label: 'Middle Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'nickname', label: 'Nickname' },
    { key: 'birthDate', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'certificate', label: 'PSA Birth Certificate No.' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'placeOfBirth', label: 'Place of Birth' },
    { key: 'address', label: 'Address' },
  ],
  'Health Information': [
    { key: 'bloodType', label: 'Blood Type' },
    { key: 'allergies', label: 'Allergies' },
    { key: 'medicalConditions', label: 'Medical Conditions' },
    { key: 'immunization', label: 'Immunization Status' },
  ],
  'Parent / Guardian Information': [],
  'Emergency Contact': [],
  'Transfer History': [],
};

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
  switch (name) {
    case 'children':
      return (
        <svg {...shared}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-1a6 6 0 0 1 12 0v1zm12-14a3 3 0 0 1 0 6m2 3a5 5 0 0 1 4 5" />
        </svg>
      );
    case 'person':
      return (
        <svg {...shared}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        </svg>
      );
    case 'health':
      return (
        <svg {...shared}>
          <path d="M20.8 8.8c0 5.5-8.8 11-8.8 11S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z" />
          <path d="M12 8v6m-3-3h6" />
        </svg>
      );
    case 'family':
      return (
        <svg {...shared}>
          <circle cx="8" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M2 20v-1a6 6 0 0 1 12 0v1zm13-5a5 5 0 0 1 7 4v1h-6" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...shared}>
          <path d="M7 3H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-3l-5-2-2 3a14 14 0 0 1-5-3 14 14 0 0 1-3-5l3-2z" />
        </svg>
      );
    case 'file':
      return (
        <svg {...shared}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6m-12 5h8m-8 4h8" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18" />
        </svg>
      );
    case 'location':
      return (
        <svg {...shared}>
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...shared}>
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18m0-18a14 14 0 0 0 0 18" />
        </svg>
      );
    case 'blood':
      return (
        <svg {...shared}>
          <path d="M12 3s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Z" />
        </svg>
      );
    case 'home':
      return (
        <svg {...shared}>
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...shared}>
          <path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15z" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...shared}>
          <path d="M12 5v14m-7-7h14" />
        </svg>
      );
    case 'check':
      return (
        <svg {...shared}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...shared}>
          <path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4" />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
  }
}

function InfoCard({
  icon,
  title,
  children,
  className = '',
}: {
  icon: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.infoCard} ${className}`.trim()}>
      <h3 className={styles.infoCardTitle}>
        <span aria-hidden="true">
          <Icon name={icon} />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.detail}>
      <span aria-hidden="true">
        <Icon name={icon} />
      </span>
      <div>
        <dt>{label}</dt>
        <dd>
          {(value || 'Not provided').split('\n').map((line) => (
            <span key={line}>{line}</span>
          ))}
        </dd>
      </div>
    </div>
  );
}

export function ParentChildren({ search }: { search: string }) {
  const navigate = useNavigate();
  const { request, download, user } = useAuth();
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [activeTabs, setActiveTabs] = useState<Record<number, ChildTab>>({});
  const [viewingChildId, setViewingChildId] = useState<number | null>(null);
  const [editingChild, setEditingChild] = useState<number | null>(null);
  const [draft, setDraft] = useState<ChildProfile | null>(null);
  const [parentPhotoUrl, setParentPhotoUrl] = useState('');
  const [parentPhotoError, setParentPhotoError] = useState('');
  const [childPhotoUrls, setChildPhotoUrls] = useState<Record<number, string>>(
    {},
  );
  const [photoError, setPhotoError] = useState('');
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<number | null>(
    null,
  );
  const [photoRefresh, setPhotoRefresh] = useState(0);
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [transferHistory, setTransferHistory] = useState<ChildTransfer[]>([]);
  const [transferHistoryError, setTransferHistoryError] = useState('');
  const [transferHistoryLoading, setTransferHistoryLoading] = useState(false);
  const [transferCenters, setTransferCenters] = useState<TransferCenter[]>([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferDraft, setTransferDraft] = useState<TransferDraft | null>(null);
  const [transferSaving, setTransferSaving] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferNotice, setTransferNotice] = useState('');
  const requestId = useRef(0);
  const photoIds = useMemo(
    () =>
      profiles
        .filter((child) => child.hasPhoto)
        .map((child) => child.id)
        .join(','),
    [profiles],
  );

  useEffect(() => {
    let active = true;
    let photoUrl = '';
    setParentPhotoUrl('');
    setParentPhotoError('');
    if (!user?.profile_photo) return;

    void download('/api/settings/profile-photo')
      .then((blob) => {
        if (!active) return;
        if (blob.size === 0) {
          setParentPhotoError('Parent profile photo could not be loaded.');
          return;
        }
        photoUrl = URL.createObjectURL(blob);
        setParentPhotoUrl(photoUrl);
      })
      .catch(() => {
        if (active)
          setParentPhotoError('Parent profile photo could not be loaded.');
      });

    return () => {
      active = false;
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [download, user?.profile_photo]);

  useEffect(() => {
    let active = true;
    const loadedUrls: Record<number, string> = {};
    setChildPhotoUrls({});
    setPhotoError('');
    if (!photoIds) return;

    const childIds = photoIds.split(',').map(Number);
    void Promise.all(
      childIds.map(async (childId) => {
        try {
          const blob = await download(
            `/api/parent/children/${childId}/photo?v=${photoRefresh}`,
          );
          if (!active) return;
          if (blob.size === 0) {
            setPhotoError('A child profile photo could not be loaded.');
            return;
          }
          const url = URL.createObjectURL(blob);
          loadedUrls[childId] = url;
        } catch {
          if (active)
            setPhotoError('A child profile photo could not be loaded.');
        }
      }),
    ).then(() => {
      if (active) setChildPhotoUrls(loadedUrls);
    });

    return () => {
      active = false;
      Object.values(loadedUrls).forEach(URL.revokeObjectURL);
    };
  }, [download, photoIds, photoRefresh]);

  const loadProfiles = useCallback(
    async (isActive: () => boolean = () => true) => {
      const currentRequestId = ++requestId.current;
      try {
        const response = await request<{ data: ApiChildProfile[] }>(
          '/api/parent/children',
        );
        if (!isActive() || currentRequestId !== requestId.current) return;
        if (!Array.isArray(response.data)) {
          throw new Error(
            'The server returned an invalid child profiles list.',
          );
        }
        const nextProfiles = response.data.map(mapChildProfile);
        setProfiles(nextProfiles);
        setActiveTabs((current) => {
          const next = { ...current };
          nextProfiles.forEach(({ id }) => {
            next[id] ??= 'Personal Information';
          });
          return next;
        });
        setLoadError('');
      } catch (error) {
        if (isActive() && currentRequestId === requestId.current) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Child profiles could not be loaded.',
          );
        }
      } finally {
        if (isActive() && currentRequestId === requestId.current)
          setLoading(false);
      }
    },
    [request],
  );

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active && document.visibilityState === 'visible')
        void loadProfiles(() => active);
    };
    void loadProfiles(() => active);
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadProfiles]);

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return profiles.filter((child) =>
      `${child.fullName} ${child.nickname} ${child.center} ${child.teacher}`
        .toLowerCase()
        .includes(term),
    );
  }, [profiles, search]);
  const viewingChild = filteredProfiles.find(({ id }) => id === viewingChildId);
  const activeTab = viewingChild
    ? (activeTabs[viewingChild.id] ?? 'Personal Information')
    : null;
  const activeViewingChildId = viewingChild?.id;

  useEffect(() => {
    if (!activeViewingChildId || activeTab !== 'Transfer History') {
      setTransferHistory([]);
      return;
    }
    let active = true;
    setTransferHistoryLoading(true);
    setTransferHistoryError('');
    void request<{ data: ChildTransfer[] }>(
      `/api/parent/children/${activeViewingChildId}/transfers`,
    )
      .then((response) => {
        if (active) setTransferHistory(response.data);
      })
      .catch((error: unknown) => {
        if (active) {
          setTransferHistoryError(
            error instanceof Error
              ? error.message
              : 'Transfer history could not be loaded.',
          );
        }
      })
      .finally(() => {
        if (active) setTransferHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, activeViewingChildId, request]);

  async function openTransferRequest() {
    if (!viewingChild) return;
    setTransferError('');
    setTransferNotice('');
    try {
      const response = await request<{ data: TransferCenter[] }>(
        '/api/parent/child-transfers/centers',
      );
      setTransferCenters(response.data);
      setTransferDraft({
        destinationCdcId: '',
        reason: '',
        otherReason: '',
        newAddress: '',
        newBarangay: '',
        newMunicipality: '',
        requestedDate: todayDateInputValue(),
        remarks: '',
        documents: [],
        confirmed: false,
      });
      setTransferModalOpen(true);
    } catch (error) {
      setTransferError(
        error instanceof Error
          ? error.message
          : 'Centers could not be loaded. Please try again.',
      );
    }
  }

  async function submitTransferRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewingChild || !transferDraft) return;
    if (!transferDraft.confirmed) {
      setTransferError('Confirm that the transfer information is accurate before submitting.');
      return;
    }
    if (transferDraft.documents.length > 5) {
      setTransferError('Upload no more than five supporting documents.');
      return;
    }
    if (
      transferDraft.documents.some(
        (file) =>
          !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) ||
          file.size > 5 * 1024 * 1024,
      )
    ) {
      setTransferError('Each file must be a PDF, JPG, or PNG no larger than 5 MB.');
      return;
    }
    setTransferSaving(true);
    setTransferError('');
    try {
      const payload = new FormData();
      payload.append('destination_cdc_id', transferDraft.destinationCdcId);
      payload.append('reason', transferDraft.reason);
      payload.append('other_reason', transferDraft.otherReason);
      payload.append('new_address', transferDraft.newAddress);
      payload.append('new_barangay', transferDraft.newBarangay);
      payload.append('new_municipality', transferDraft.newMunicipality);
      payload.append('requested_date', transferDraft.requestedDate);
      payload.append('remarks', transferDraft.remarks);
      payload.append('confirmed', transferDraft.confirmed ? '1' : '0');
      transferDraft.documents.forEach((file) => payload.append('documents[]', file));
      await request(`/api/parent/children/${viewingChild.id}/transfers`, {
        method: 'POST',
        body: payload,
      });
      setTransferModalOpen(false);
      setTransferDraft(null);
      setTransferNotice('Transfer request submitted. Your child remains enrolled at the current CDC until approval is complete.');
      selectTab('Transfer History');
    } catch (error) {
      setTransferError(
        error instanceof Error
          ? error.message
          : 'The transfer request could not be submitted.',
      );
    } finally {
      setTransferSaving(false);
    }
  }

  async function cancelTransfer(transfer: ChildTransfer) {
    if (
      !window.confirm(
        `Cancel transfer request ${transfer.reference}? The child will remain enrolled at the current CDC.`,
      )
    ) {
      return;
    }
    try {
      await request(`/api/parent/child-transfers/${transfer.id}`, {
        method: 'PATCH',
      });
      setTransferHistory((current) =>
        current.map((item) =>
          item.id === transfer.id
            ? {
                ...item,
                status: 'cancelled_by_parent',
                cancelled_at: new Date().toISOString(),
              }
            : item,
        ),
      );
      setTransferNotice('Transfer request cancelled.');
    } catch (error) {
      setTransferHistoryError(
        error instanceof Error
          ? error.message
          : 'The transfer request could not be cancelled.',
      );
    }
  }

  async function downloadTransferFile(transfer: ChildTransfer, fileId: number, name: string) {
    try {
      const blob = await download(
        `/api/child-transfers/${transfer.id}/documents/${fileId}`,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setTransferHistoryError(
        error instanceof Error
          ? error.message
          : 'The supporting document could not be downloaded.',
      );
    }
  }

  function selectTab(tab: ChildTab) {
    if (!viewingChild) return;
    setActiveTabs((current) => ({ ...current, [viewingChild.id]: tab }));
  }

  function openEdit(child: ChildProfile) {
    setDraft({ ...child });
    setEditingChild(child.id);
    setNotice('');
    setSaveError('');
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setSaveError('');
    try {
      await request(`/api/parent/children/${draft.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: draft.firstName,
          middleName: draft.middleName,
          lastName: draft.lastName,
          nickname: draft.nickname,
          birthDate: draft.birthDate,
          gender: draft.gender,
          certificate: draft.certificate,
          nationality: draft.nationality,
          placeOfBirth: draft.placeOfBirth,
          address: draft.address,
          bloodType: draft.bloodType,
          allergies: draft.allergies,
          medicalConditions: draft.medicalConditions,
          immunization: draft.immunization,
        }),
      });
      setEditingChild(null);
      setDraft(null);
      setNotice('Child profile updated.');
      await loadProfiles();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Child profile could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadChildPhoto(childId: number, file: File) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setPhotoError('Choose a JPG or PNG image for the child profile photo.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Child profile photos must be no larger than 2 MB.');
      return;
    }

    setUploadingPhotoFor(childId);
    setPhotoError('');
    try {
      const payload = new FormData();
      payload.append('profile_photo', file);
      await request(`/api/parent/children/${childId}/photo`, {
        method: 'POST',
        body: payload,
      });
      setNotice('Child profile photo updated.');
      setPhotoRefresh((current) => current + 1);
      await loadProfiles();
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : 'Child profile photo could not be uploaded.',
      );
    } finally {
      setUploadingPhotoFor(null);
    }
  }

  const currentEditTab =
    editingChild === null
      ? null
      : (activeTabs[editingChild] ?? 'Personal Information');
  const currentEditFields = currentEditTab
    ? editableFields[currentEditTab]
    : [];

  return (
    <main aria-label="My children" className={styles.page}>
      <section
        aria-label="My children"
        className={styles.hero}
        style={{ backgroundImage: `url("${childrenBanner}")` }}
      >
        <span aria-hidden="true" className={styles.heroIcon}>
          <Icon name="children" />
        </span>
        <div>
          <h1>My Children</h1>
          <p>View and manage your child’s profile information.</p>
        </div>
      </section>

      <div className={styles.toolbar}>
        <span>
          {loading ? (
            <BouncingDots label="Loading child profiles" size="small" inline />
          ) : (
            `${filteredProfiles.length} ${
              filteredProfiles.length === 1 ? 'child profile' : 'child profiles'
            }`
          )}
        </span>
        <button
          className={styles.addButton}
          type="button"
          onClick={() => navigate(routePaths.parentEnrollment)}
        >
          <Icon name="plus" /> Add Child
        </button>
      </div>

      {loadError && (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      {photoError && (
        <p className={styles.error} role="alert">
          {photoError}
        </p>
      )}
      {transferError && !transferModalOpen && (
        <p className={styles.error} role="alert">
          {transferError}
        </p>
      )}

      {viewingChild && activeTab ? (
        <section
          aria-label={`${viewingChild.fullName} profile`}
          className={styles.profileView}
        >
          <div className={styles.profileActions}>
            <button
              className={styles.backButton}
              type="button"
              onClick={() => setViewingChildId(null)}
            >
              <span aria-hidden="true">←</span> Back to Children
            </button>
            <button
              className={styles.printButton}
              type="button"
              onClick={() => window.print()}
            >
              <span aria-hidden="true">⎙</span> Print Profile
            </button>
            {viewingChild.enrollmentStatus === 'Enrolled' && (
              <button
                className={styles.transferButton}
                type="button"
                onClick={() => void openTransferRequest()}
              >
                Request CDC Transfer
              </button>
            )}
          </div>

          <header className={styles.profileHeader}>
            <div className={styles.childPhotoControl}>
              <Avatar
                className={styles.childAvatar}
                name={viewingChild.fullName || 'Child profile'}
                size="large"
                src={childPhotoUrls[viewingChild.id] ?? null}
              />
              <label className={styles.photoUpload}>
                <Icon name="upload" />
                {uploadingPhotoFor === viewingChild.id
                  ? 'Uploading…'
                  : 'Change photo'}
                <input
                  accept="image/jpeg,image/png"
                  aria-label={`Upload a profile photo for ${viewingChild.fullName}`}
                  disabled={uploadingPhotoFor !== null}
                  type="file"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = '';
                    if (file) void uploadChildPhoto(viewingChild.id, file);
                  }}
                />
              </label>
            </div>
            <div className={styles.profileHeaderDetails}>
              <div className={styles.profileNameRow}>
                <h2>{viewingChild.fullName || 'Child profile'}</h2>
                <span
                  className={`${styles.enrolled} ${viewingChild.enrollmentStatus === 'Enrolled' ? '' : viewingChild.enrollmentStatus === 'Rejected' ? styles.rejectedStatus : styles.otherStatus}`}
                >
                  {viewingChild.enrollmentStatus === 'Enrolled' && (
                    <Icon name="check" />
                  )}
                  {viewingChild.enrollmentStatus || 'Status unavailable'}
                </span>
              </div>
              <div className={styles.profileMeta}>
                <span>
                  <Icon name="person" />
                  Age: {calculateAge(viewingChild.birthDate)}
                </span>
                <span>
                  <Icon name="calendar" />
                  Date of Birth:{' '}
                  {formatDate(viewingChild.birthDate) || 'Not provided'}
                </span>
              </div>
            </div>
          </header>

          <section className={styles.informationPanel}>
            <div
              aria-label={`${viewingChild.fullName} information`}
              className={styles.tabs}
              role="tablist"
            >
              {(Object.keys(tabIcons) as ChildTab[]).map((tab) => (
                <button
                  aria-selected={activeTab === tab}
                  className={activeTab === tab ? styles.activeTab : ''}
                  id={`child-${viewingChild.id}-${tab.replaceAll(/[^a-z]/gi, '-').toLowerCase()}`}
                  key={tab}
                  role="tab"
                  type="button"
                  onClick={() => selectTab(tab)}
                >
                  <Icon name={tabIcons[tab]} />
                  <span>{tab}</span>
                </button>
              ))}
              <button
                className={styles.editButton}
                disabled={!editableFields[activeTab].length}
                title={
                  editableFields[activeTab].length
                    ? 'Edit child information'
                    : 'Only personal and health information can be edited here'
                }
                type="button"
                onClick={() => openEdit(viewingChild)}
              >
                <Icon name="edit" /> Edit
              </button>
            </div>

            <div
              aria-labelledby={`child-${viewingChild.id}-${activeTab.replaceAll(/[^a-z]/gi, '-').toLowerCase()}`}
              className={styles.details}
              role="tabpanel"
            >
              {activeTab === 'Personal Information' ? (
                <div className={styles.sectionGrid}>
                  <InfoCard icon="person" title="Basic Information">
                    <dl className={styles.detailGrid}>
                      <Detail
                        icon="person"
                        label="Full Name"
                        value={viewingChild.fullName}
                      />
                      <Detail
                        icon="edit"
                        label="Nickname"
                        value={viewingChild.nickname}
                      />
                      <Detail
                        icon="person"
                        label="Gender"
                        value={viewingChild.gender}
                      />
                      <Detail
                        icon="calendar"
                        label="Date of Birth"
                        value={formatDate(viewingChild.birthDate)}
                      />
                      <Detail
                        icon="clock"
                        label="Age"
                        value={calculateAge(viewingChild.birthDate)}
                      />
                      <Detail
                        icon="children"
                        label="Enrollment Status"
                        value={viewingChild.enrollmentStatus}
                      />
                    </dl>
                  </InfoCard>
                  <InfoCard icon="file" title="Additional Personal Details">
                    <dl className={styles.detailGrid}>
                      <Detail
                        icon="file"
                        label="PSA Birth Certificate Number"
                        value={viewingChild.certificate}
                      />
                      <Detail
                        icon="globe"
                        label="Nationality"
                        value={viewingChild.nationality}
                      />
                      <Detail
                        icon="location"
                        label="Place of Birth"
                        value={viewingChild.placeOfBirth}
                      />
                      <Detail
                        icon="home"
                        label="Residential Address"
                        value={viewingChild.address}
                      />
                    </dl>
                  </InfoCard>
                </div>
              ) : activeTab === 'Health Information' ? (
                <div className={`${styles.sectionGrid} ${styles.healthGrid}`}>
                  <InfoCard
                    className={styles.healthDetails}
                    icon="health"
                    title="Health Details"
                  >
                    <dl className={styles.detailGrid}>
                      <Detail
                        icon="blood"
                        label="Blood Type"
                        value={viewingChild.bloodType}
                      />
                      <Detail
                        icon="health"
                        label="Medical Conditions"
                        value={viewingChild.medicalConditions}
                      />
                      <Detail
                        icon="check"
                        label="Immunization Status"
                        value={viewingChild.immunization}
                      />
                    </dl>
                  </InfoCard>
                  <InfoCard
                    className={styles.medicalHistory}
                    icon="file"
                    title="Medical History"
                  >
                    <img alt="" src={medicalIllustration} />
                    <p>No medical history records yet.</p>
                    <span>This section will be updated as needed.</span>
                  </InfoCard>
                  <InfoCard
                    className={styles.allergiesCard}
                    icon="health"
                    title="Allergies"
                  >
                    <p className={styles.allergyValue}>
                      {viewingChild.allergies || 'Not provided'}
                    </p>
                  </InfoCard>
                </div>
              ) : activeTab === 'Parent / Guardian Information' ? (
                <div className={styles.sectionGrid}>
                  <InfoCard
                    className={styles.parentCard}
                    icon="family"
                    title="Parent / Guardian"
                  >
                    <div className={styles.parentProfile}>
                      <Avatar
                        className={styles.parentAvatar}
                        name={viewingChild.parentName || 'Parent or guardian'}
                        size="large"
                        src={parentPhotoUrl || null}
                      />
                      <dl className={styles.detailGrid}>
                        <Detail
                          icon="person"
                          label="Full Name"
                          value={viewingChild.parentName}
                        />
                        <Detail
                          icon="family"
                          label="Relationship"
                          value={viewingChild.parentRelationship}
                        />
                        <Detail
                          icon="phone"
                          label="Contact Number"
                          value={viewingChild.parentPhone}
                        />
                        <Detail
                          icon="file"
                          label="Email Address"
                          value={viewingChild.parentEmail}
                        />
                      </dl>
                    </div>
                    {parentPhotoError && (
                      <p className={styles.photoNotice} role="status">
                        {parentPhotoError}
                      </p>
                    )}
                  </InfoCard>
                </div>
              ) : activeTab === 'Emergency Contact' ? (
                <div
                  className={`${styles.sectionGrid} ${styles.emergencyLayout}`}
                >
                  <div className={styles.emergencyIllustration}>
                    <img alt="" src={emergencyIllustration} />
                    <p>In case of emergency, please contact:</p>
                  </div>
                  <InfoCard icon="phone" title="Emergency Contact">
                    <dl className={styles.detailGrid}>
                      <Detail
                        icon="person"
                        label="Contact Person"
                        value={viewingChild.emergencyName}
                      />
                      <Detail
                        icon="family"
                        label="Relationship"
                        value={viewingChild.emergencyRelationship}
                      />
                      <Detail
                        icon="phone"
                        label="Contact Number"
                        value={viewingChild.emergencyPhone}
                      />
                    </dl>
                  </InfoCard>
                </div>
              ) : (
                <section aria-label="Transfer history" className={styles.transferHistoryPanel}>
                  <header className={styles.transferHistoryHeader}>
                    <div>
                      <h2>CDC Transfer History</h2>
                      <p>
                        Current center: <strong>{viewingChild.center || 'Not assigned'}</strong>
                      </p>
                    </div>
                    {viewingChild.enrollmentStatus === 'Enrolled' && (
                      <button
                        className={styles.transferButton}
                        type="button"
                        onClick={() => void openTransferRequest()}
                      >
                        Request transfer
                      </button>
                    )}
                  </header>
                  {transferNotice && <p className={styles.transferSuccess} role="status">{transferNotice}</p>}
                  {transferHistoryError && <p className={styles.error} role="alert">{transferHistoryError}</p>}
                  {transferHistoryLoading && <BouncingDots label="Loading transfer history" />}
                  {!transferHistoryLoading && transferHistory.length === 0 && (
                    <p className={styles.transferEmpty}>
                      No transfer requests yet. Your child will remain enrolled at the current CDC until a transfer is approved by both centers.
                    </p>
                  )}
                  <div className={styles.transferHistoryList}>
                    {transferHistory.map((transfer) => (
                      <article className={styles.transferHistoryCard} key={transfer.id}>
                        <div className={styles.transferHistoryCardHeader}>
                          <div>
                            <strong>{transfer.reference}</strong>
                            <span>{transfer.previous_cdc_name} → {transfer.destination_cdc_name}</span>
                          </div>
                          <span className={`${styles.transferStatus} ${styles[`transferStatus_${transfer.status}`] ?? ''}`}>
                            {transfer.status.replaceAll('_', ' ')}
                          </span>
                        </div>
                        <dl>
                          <div><dt>Reason</dt><dd>{transfer.reason === 'Other' ? transfer.other_reason : transfer.reason}</dd></div>
                          <div><dt>Requested</dt><dd>{formatDate(transfer.requested_date)}</dd></div>
                          {transfer.previous_teacher_remarks && <div><dt>Current CDC remarks</dt><dd>{transfer.previous_teacher_remarks}</dd></div>}
                          {transfer.receiving_teacher_remarks && <div><dt>Receiving CDC remarks</dt><dd>{transfer.receiving_teacher_remarks}</dd></div>}
                        </dl>
                        {transfer.documents.length > 0 && (
                          <div className={styles.transferFileList}>
                            {transfer.documents.map((file) => (
                              <button
                                key={file.id}
                                type="button"
                                onClick={() => void downloadTransferFile(transfer, file.id, file.original_name)}
                              >
                                {file.original_name}
                              </button>
                            ))}
                          </div>
                        )}
                        {transfer.events.length > 0 && (
                          <ol className={styles.transferEvents}>
                            {transfer.events.map((event, index) => (
                              <li key={`${transfer.id}-${index}`}>
                                <strong>{event.event_type.replaceAll('_', ' ')}</strong>
                                <span>
                                  {event.actor_name || 'System'} · {new Date(event.created_at.replace(' ', 'T')).toLocaleString()}
                                </span>
                                {event.remarks && <p>{event.remarks}</p>}
                              </li>
                            ))}
                          </ol>
                        )}
                        {['pending', 'awaiting_receiving_cdc'].includes(transfer.status) && (
                          <button
                            className={styles.cancelTransferButton}
                            type="button"
                            onClick={() => void cancelTransfer(transfer)}
                          >
                            Cancel request
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </section>
        </section>
      ) : (
        <div className={styles.profileList}>
          {filteredProfiles.map((child) => (
            <article
              aria-label={`${child.fullName} profile`}
              className={styles.childProfile}
              key={child.id}
            >
              <Avatar
                className={styles.listAvatar}
                name={child.fullName || 'Child profile'}
                size="large"
                src={childPhotoUrls[child.id] ?? null}
              />
              <div className={styles.listIdentity}>
                <h2>{child.fullName || 'Child profile'}</h2>
                <p>Age: {calculateAge(child.birthDate)}</p>
                <span
                  className={`${styles.enrolled} ${child.enrollmentStatus === 'Enrolled' ? '' : child.enrollmentStatus === 'Rejected' ? styles.rejectedStatus : styles.otherStatus}`}
                >
                  {child.enrollmentStatus === 'Enrolled' && (
                    <Icon name="check" />
                  )}
                  {child.enrollmentStatus || 'Status unavailable'}
                </span>
              </div>
              <button
                className={styles.viewButton}
                type="button"
                onClick={() => setViewingChildId(child.id)}
              >
                <span aria-hidden="true">→</span>
                View Profile
              </button>
            </article>
          ))}
          {!loading && !loadError && !filteredProfiles.length && (
            <p className={styles.emptyState}>
              {profiles.length
                ? 'No child profiles match your search.'
                : 'No child profiles are linked to your account yet. Submit an enrollment application to add a child.'}
            </p>
          )}
        </div>
      )}

      {transferModalOpen && viewingChild && transferDraft && (
        <div className={styles.dialogBackdrop}>
          <form
            aria-labelledby="request-transfer-title"
            aria-modal="true"
            className={`${styles.dialog} ${styles.transferDialog}`}
            role="dialog"
            onSubmit={submitTransferRequest}
          >
            <button
              aria-label="Close transfer request"
              className={styles.closeButton}
              disabled={transferSaving}
              type="button"
              onClick={() => setTransferModalOpen(false)}
            >
              ×
            </button>
            <h2 id="request-transfer-title">Request a CDC Transfer</h2>
            <p>
              {viewingChild.fullName} remains enrolled at {viewingChild.center || 'the current CDC'} until all required reviews are complete.
            </p>
            <label className={styles.editField}>
              Destination CDC
              <select
                required
                value={transferDraft.destinationCdcId}
                onChange={(event) =>
                  setTransferDraft((current) =>
                    current
                      ? { ...current, destinationCdcId: event.target.value }
                      : current,
                  )
                }
              >
                <option value="">Select a destination center</option>
                {transferCenters
                  .filter((center) => center.name !== viewingChild.center)
                  .map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name} · {center.teacher_name}
                    </option>
                  ))}
              </select>
              {transferCenters.filter((center) => center.name !== viewingChild.center).length === 0 && (
                <small>No active destination CDC with an approved teacher is available.</small>
              )}
            </label>
            <label className={styles.editField}>
              Reason for transfer
              <select
                required
                value={transferDraft.reason}
                onChange={(event) =>
                  setTransferDraft((current) =>
                    current
                      ? {
                          ...current,
                          reason: event.target.value,
                          otherReason: '',
                          newAddress: '',
                          newBarangay: '',
                          newMunicipality: '',
                        }
                      : current,
                  )
                }
              >
                <option value="">Choose a reason</option>
                {[
                  'Change of Residence',
                  'Closer to Home',
                  'Parent/Guardian Request',
                  "Change in Parent's Workplace",
                  'Family Circumstances',
                  'Accessibility and Transportation',
                  'CDC Preference',
                  'Other',
                ].map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </label>
            {transferDraft.reason === 'Other' && (
              <label className={styles.editField}>
                Other reason
                <textarea
                  required
                  maxLength={500}
                  value={transferDraft.otherReason}
                  onChange={(event) =>
                    setTransferDraft((current) =>
                      current ? { ...current, otherReason: event.target.value } : current,
                    )
                  }
                />
              </label>
            )}
            {transferDraft.reason === 'Change of Residence' && (
              <div className={styles.transferAddressFields}>
                <label className={styles.editField}>
                  New address
                  <input
                    maxLength={255}
                    value={transferDraft.newAddress}
                    onChange={(event) =>
                      setTransferDraft((current) =>
                        current ? { ...current, newAddress: event.target.value } : current,
                      )
                    }
                  />
                </label>
                <label className={styles.editField}>
                  Barangay
                  <input
                    maxLength={120}
                    value={transferDraft.newBarangay}
                    onChange={(event) =>
                      setTransferDraft((current) =>
                        current ? { ...current, newBarangay: event.target.value } : current,
                      )
                    }
                  />
                </label>
                <label className={styles.editField}>
                  Municipality / City
                  <input
                    maxLength={120}
                    value={transferDraft.newMunicipality}
                    onChange={(event) =>
                      setTransferDraft((current) =>
                        current ? { ...current, newMunicipality: event.target.value } : current,
                      )
                    }
                  />
                </label>
              </div>
            )}
            <label className={styles.editField}>
              Requested transfer date
              <input
                required
                min={todayDateInputValue()}
                type="date"
                value={transferDraft.requestedDate}
                onChange={(event) =>
                  setTransferDraft((current) =>
                    current ? { ...current, requestedDate: event.target.value } : current,
                  )
                }
              />
            </label>
            <label className={styles.editField}>
              Notes for reviewers
              <textarea
                maxLength={5000}
                rows={3}
                value={transferDraft.remarks}
                onChange={(event) =>
                  setTransferDraft((current) =>
                    current ? { ...current, remarks: event.target.value } : current,
                  )
                }
              />
            </label>
            <label className={styles.editField}>
              Supporting documents (PDF, JPG, PNG; up to 5 files, 5 MB each)
              <input
                accept="application/pdf,image/jpeg,image/png"
                multiple
                type="file"
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files ?? []);
                  event.currentTarget.value = '';
                  if (files.length > 5) {
                    setTransferError('Upload no more than five supporting documents.');
                    return;
                  }
                  setTransferError('');
                  setTransferDraft((current) =>
                    current ? { ...current, documents: files } : current,
                  );
                }}
              />
            </label>
            {transferDraft.documents.length > 0 && (
              <p className={styles.transferSelectedFiles}>
                Selected: {transferDraft.documents.map((file) => file.name).join(', ')}
              </p>
            )}
            <label className={styles.transferConfirmation}>
              <input
                required
                type="checkbox"
                checked={transferDraft.confirmed}
                onChange={(event) =>
                  setTransferDraft((current) =>
                    current ? { ...current, confirmed: event.target.checked } : current,
                  )
                }
              />
              I confirm these details are accurate and understand that the child will remain enrolled at the current CDC until transfer approval is completed.
            </label>
            {transferError && <p className={styles.error} role="alert">{transferError}</p>}
            <div className={styles.dialogActions}>
              <button
                className={styles.secondaryButton}
                disabled={transferSaving}
                type="button"
                onClick={() => setTransferModalOpen(false)}
              >
                Cancel
              </button>
              <button className={styles.addButton} disabled={transferSaving} type="submit">
                {transferSaving ? 'Submitting…' : 'Submit Transfer Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingChild !== null && draft && currentEditTab && (
        <div className={styles.dialogBackdrop}>
          <form
            aria-labelledby="edit-child-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
            onSubmit={saveEdit}
          >
            <button
              aria-label="Close edit child dialog"
              className={styles.closeButton}
              disabled={saving}
              type="button"
              onClick={() => {
                setEditingChild(null);
                setDraft(null);
              }}
            >
              ×
            </button>
            <h2 id="edit-child-title">Edit {draft.fullName}</h2>
            <p>Update {currentEditTab.toLowerCase()} for this child.</p>
            {currentEditFields.map(({ key, label }) => (
              <label className={styles.editField} key={key}>
                {label}
                {key === 'gender' || key === 'bloodType' ? (
                  <select
                    required={key === 'gender'}
                    value={draft[key]}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, [key]: event.target.value }
                          : current,
                      )
                    }
                  >
                    <option value="">Select {label.toLowerCase()}</option>
                    {(key === 'gender'
                      ? ['Female', 'Male']
                      : ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
                    ).map((choice) => (
                      <option key={choice} value={choice}>
                        {choice}
                      </option>
                    ))}
                  </select>
                ) : key === 'birthDate' ? (
                  <input
                    required
                    max={todayDateInputValue()}
                    type="date"
                    value={draft[key]}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, [key]: event.target.value }
                          : current,
                      )
                    }
                  />
                ) : (
                  <textarea
                    rows={
                      draft[key].includes('\n') ||
                      key === 'address' ||
                      key === 'allergies' ||
                      key === 'medicalConditions'
                        ? 3
                        : 1
                    }
                    required={key === 'firstName' || key === 'lastName'}
                    maxLength={
                      key === 'address'
                        ? 255
                        : key === 'certificate'
                          ? 60
                          : key === 'placeOfBirth'
                            ? 180
                            : key === 'nationality'
                              ? 80
                              : key === 'allergies' ||
                                  key === 'medicalConditions'
                                ? 2000
                                : key === 'immunization'
                                  ? 120
                                  : 100
                    }
                    value={draft[key]}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, [key]: event.target.value }
                          : current,
                      )
                    }
                  />
                )}
              </label>
            ))}
            {saveError && (
              <p className={styles.error} role="alert">
                {saveError}
              </p>
            )}
            <div className={styles.dialogActions}>
              <button
                className={styles.secondaryButton}
                disabled={saving}
                type="button"
                onClick={() => {
                  setEditingChild(null);
                  setDraft(null);
                }}
              >
                Cancel
              </button>
              <button
                className={styles.addButton}
                disabled={saving}
                type="submit"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
