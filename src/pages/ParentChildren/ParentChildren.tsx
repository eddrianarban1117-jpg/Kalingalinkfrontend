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
import otherInformationIllustration from '../../../other_info.png';
import styles from './ParentChildren.module.css';

type ChildTab =
  | 'Personal Information'
  | 'Health Information'
  | 'Parent / Guardian Information'
  | 'Emergency Contact'
  | 'Other Information';

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
  };
}

const tabIcons: Record<ChildTab, string> = {
  'Personal Information': 'person',
  'Health Information': 'health',
  'Parent / Guardian Information': 'family',
  'Emergency Contact': 'phone',
  'Other Information': 'file',
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
  'Other Information': [],
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
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const requestId = useRef(0);

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
          </div>

          <header className={styles.profileHeader}>
            <Avatar
              className={styles.childAvatar}
              name={viewingChild.fullName || 'Child profile'}
              size="large"
            />
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
                <div className={`${styles.sectionGrid} ${styles.otherLayout}`}>
                  <InfoCard icon="file" title="Enrollment Details">
                    <dl className={styles.detailGrid}>
                      <Detail
                        icon="file"
                        label="Enrollment Type"
                        value={viewingChild.enrollmentType}
                      />
                      <Detail
                        icon="calendar"
                        label="Enrollment Date"
                        value={viewingChild.dateEnrolled}
                      />
                      <Detail
                        icon="location"
                        label="Child Development Center"
                        value={viewingChild.center}
                      />
                    </dl>
                  </InfoCard>
                  <img
                    alt=""
                    className={styles.otherIllustration}
                    src={otherInformationIllustration}
                  />
                </div>
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
