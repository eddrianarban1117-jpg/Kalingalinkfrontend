import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import styles from './TeacherProfile.module.css';
import { Avatar } from '../../components/common/Avatar/Avatar';
import { useAuth } from '../../auth/AuthProvider';

type ProfileSection =
  | 'Personal Information'
  | 'Account Information'
  | 'Professional Information'
  | 'Address and Emergency Contact';

type ProfileData = Record<string, string>;

const emptyProfile: ProfileData = {
  fullName: '',
  email: '',
  phone: '',
  birthDate: '',
  gender: '',
  maritalStatus: '',
  nationality: '',
  username: '',
  role: '',
  accountStatus: '',
  lastLogin: '',
  education: '',
  certification: '',
  yearsOfService: '',
  homeAddress: '',
  emergencyContact: '',
  relationship: '',
  emergencyPhone: '',
  skills: '',
  languages: '',
  workingSchedule: '',
};

type ProfileRecord = {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: number;
  last_login_at: string | null;
  birth_date: string | null;
  gender: string | null;
  marital_status: string | null;
  nationality: string | null;
  education: string | null;
  certification: string | null;
  years_of_service: string | null;
  home_address: string | null;
  emergency_name: string | null;
  emergency_relationship: string | null;
  emergency_phone: string | null;
  skills: string | null;
  languages: string | null;
  working_schedule: string | null;
};

type ProfileResponse = { data: { profile: ProfileRecord } };

function mapProfile(record: ProfileRecord): ProfileData {
  return {
    ...emptyProfile,
    fullName: [record.first_name, record.middle_name, record.last_name]
      .filter(Boolean)
      .join(' '),
    email: record.email ?? '',
    phone: record.phone ?? '',
    birthDate: record.birth_date ?? '',
    gender: record.gender ?? '',
    maritalStatus: record.marital_status ?? '',
    nationality: record.nationality ?? '',
    username: record.username ?? '',
    role: record.role ? record.role[0].toUpperCase() + record.role.slice(1) : '',
    accountStatus: Number(record.is_active) === 1 ? 'Active' : 'Inactive',
    lastLogin: record.last_login_at ?? '',
    education: record.education ?? '',
    certification: record.certification ?? '',
    yearsOfService: record.years_of_service ?? '',
    homeAddress: record.home_address ?? '',
    emergencyContact: record.emergency_name ?? '',
    relationship: record.emergency_relationship ?? '',
    emergencyPhone: record.emergency_phone ?? '',
    skills: record.skills ?? '',
    languages: record.languages ?? '',
    workingSchedule: record.working_schedule ?? '',
  };
}

function formatDate(value: string) {
  if (!value) return '';
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
}

function formatDateTime(value: string) {
  if (!value) return '';
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

const personalFields = [
  { label: 'Full Name', key: 'fullName', icon: 'person' },
  { label: 'Email Address', key: 'email', icon: 'mail' },
  { label: 'Phone Number', key: 'phone', icon: 'phone' },
  { label: 'Date of Birth', key: 'birthDate', icon: 'calendar' },
  { label: 'Gender', key: 'gender', icon: 'person' },
  { label: 'Marital Status', key: 'maritalStatus', icon: 'people' },
  { label: 'Nationality', key: 'nationality', icon: 'globe' },
] as const;

const accountFields = [
  { label: 'Username', key: 'username', icon: 'person' },
  { label: 'Email Address', key: 'email', icon: 'mail' },
  { label: 'Role', key: 'role', icon: 'person' },
  { label: 'Account Status', key: 'accountStatus', icon: 'shield' },
  { label: 'Last Login', key: 'lastLogin', icon: 'clock' },
] as const;

const professionalFields = [
  { label: 'Educational Attainment', key: 'education', icon: 'cap' },
  {
    label: 'Teaching License / Certification',
    key: 'certification',
    icon: 'certificate',
  },
  { label: 'Years of Service', key: 'yearsOfService', icon: 'clock' },
] as const;

const addressFields = [
  { label: 'Home Address', key: 'homeAddress', icon: 'home' },
  { label: 'Emergency Contact Person', key: 'emergencyContact', icon: 'phone' },
  { label: 'Relationship', key: 'relationship', icon: 'person' },
  { label: 'Contact Number', key: 'emergencyPhone', icon: 'phone' },
] as const;

function ProfileIcon({ name }: { name: string }) {
  const shared = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  };

  switch (name) {
    case 'person':
      return (
        <svg {...shared}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...shared}>
          <path d="M7 3H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-3l-5-2-2 3a14 14 0 0 1-5-3 14 14 0 0 1-3-5l3-2z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18m4 4h.01" />
        </svg>
      );
    case 'people':
      return (
        <svg {...shared}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-1a6 6 0 0 1 12 0v1zm12-14a3 3 0 0 1 0 6m2 3a5 5 0 0 1 4 5" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18m0-18a14 14 0 0 0 0 18" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...shared}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'cap':
      return (
        <svg {...shared}>
          <path d="m2 10 10-6 10 6-10 6zm4 2v5c4 3 8 3 12 0v-5m4-2v7" />
        </svg>
      );
    case 'certificate':
      return (
        <svg {...shared}>
          <path d="M5 3h14v13H5zM8 7h8m-8 4h5m1 5 2 5 2-2 3 1-2-5" />
        </svg>
      );
    case 'home':
      return (
        <svg {...shared}>
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...shared}>
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M8 7V4h8v3m-13 5h18m-11-1v2h4v-2" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...shared}>
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'star':
      return (
        <svg {...shared}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...shared}>
          <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-3.8-.8L3 21l1.8-5.7a8.5 8.5 0 1 1 16.2-3.8Z" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...shared}>
          <path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15z" />
        </svg>
      );
    default:
      return null;
  }
}

function EditButton({
  section,
  onEdit,
}: {
  section: ProfileSection;
  onEdit: (section: ProfileSection) => void;
}) {
  return (
    <button
      aria-label={`Edit ${section}`}
      className={styles.editButton}
      type="button"
      onClick={() => onEdit(section)}
    >
      <ProfileIcon name="edit" />
    </button>
  );
}

export function TeacherProfile() {
  const { request } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [editingSection, setEditingSection] = useState<ProfileSection | null>(
    null,
  );
  const [draft, setDraft] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const latestRequest = useRef(0);

  const reloadProfile = useCallback(async (isActive: () => boolean = () => true) => {
    const requestId = ++latestRequest.current;
    setError('');
    try {
      const response = await request<ProfileResponse>('/api/teacher/profile');
      if (requestId !== latestRequest.current || !isActive()) return;
      setProfile(mapProfile(response.data.profile));
    } catch (loadError) {
      if (requestId !== latestRequest.current || !isActive()) return;
      setProfile(emptyProfile);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Profile could not be loaded.',
      );
    } finally {
      if (requestId === latestRequest.current && isActive()) setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active && document.visibilityState === 'visible') {
        void reloadProfile(() => active);
      }
    };
    void reloadProfile(() => active);
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reloadProfile]);

  function startEditing(section: ProfileSection) {
    setDraft(profile);
    setNotice('');
    setEditingSection(section);
  }

  async function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const name = draft.fullName.trim().split(/\s+/);
    if (name.length < 2) {
      setError('Provide both a first name and a last name.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await request('/api/teacher/profile', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: name[0],
          middle_name: name.length > 2 ? name.slice(1, -1).join(' ') : '',
          last_name: name[name.length - 1],
          username: draft.username,
          email: draft.email,
          phone: draft.phone,
          birth_date: draft.birthDate,
          gender: draft.gender,
          marital_status: draft.maritalStatus,
          nationality: draft.nationality,
          education: draft.education,
          certification: draft.certification,
          years_of_service: draft.yearsOfService,
          home_address: draft.homeAddress,
          emergency_name: draft.emergencyContact,
          emergency_relationship: draft.relationship,
          emergency_phone: draft.emergencyPhone,
          skills: draft.skills,
          languages: draft.languages,
          working_schedule: draft.workingSchedule,
        }),
      });
      await reloadProfile();
      setEditingSection(null);
      setNotice('Profile changes saved.');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Profile changes could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: {
    label: string;
    key: keyof ProfileData;
    icon: string;
  }) {
    const rawValue = profile[field.key];
    const value =
      field.key === 'birthDate'
        ? formatDate(rawValue) || 'Not provided'
        : field.key === 'lastLogin'
          ? formatDateTime(rawValue) || 'Not provided'
          : rawValue || 'Not provided';
    return (
      <div className={styles.detail} key={field.key}>
        <span aria-hidden="true" className={styles.detailIcon}>
          <ProfileIcon name={field.icon} />
        </span>
        <div>
          <dt>{field.label}</dt>
          {field.key === 'accountStatus' ? (
            <dd>
              <span className={styles.status}>{value}</span>
            </dd>
          ) : (
            <dd>
              {value.split('\n').map((line, index) => (
                <span key={`${field.key}:${index}`}>{line}</span>
              ))}
            </dd>
          )}
        </div>
      </div>
    );
  }

  const editableFields =
    editingSection === 'Personal Information'
      ? personalFields
      : editingSection === 'Account Information'
        ? accountFields.filter(
            ({ key }) =>
              key !== 'role' && key !== 'accountStatus' && key !== 'lastLogin',
          )
        : editingSection === 'Professional Information'
          ? professionalFields
          : addressFields;

  return (
    <main aria-label="Teacher profile" className={styles.page}>
      <header className={styles.pageHeader}>
        <span aria-hidden="true" className={styles.headerIcon}>
          <ProfileIcon name="person" />
        </span>
        <div>
          <h1>My Profile</h1>
          <p>
            View and manage your personal information and professional details.
          </p>
        </div>
      </header>

      {error && (
        <p aria-live="polite" className={styles.errorNotice} role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p aria-live="polite" className={styles.successNotice}>
          {notice}
        </p>
      )}

      <div className={styles.profileGrid}>
        <section
          aria-labelledby="personal-heading"
          className={`${styles.card} ${styles.personalCard}`}
        >
          <CardHeading
            id="personal-heading"
            icon="person"
            title="Personal Information"
            editSection="Personal Information"
            onEdit={startEditing}
          />
          <div className={styles.personalContent}>
            <div className={styles.photoColumn}>
              <Avatar
                className={styles.avatarPlaceholder}
                name={profile.fullName || 'Teacher'}
              />
            </div>
            {loading ? (
              <p className={styles.profileState}>Loading profile…</p>
            ) : (
              <dl className={styles.personalDetails}>
                {personalFields.map(renderField)}
              </dl>
            )}
          </div>
        </section>

        <section
          aria-labelledby="account-heading"
          className={`${styles.card} ${styles.accountCard}`}
        >
          <CardHeading
            id="account-heading"
            icon="shield"
            title="Account Information"
            editSection="Account Information"
            onEdit={startEditing}
          />
          {loading ? (
            <p className={styles.profileState}>Loading profile…</p>
          ) : (
            <dl className={styles.accountDetails}>
              {accountFields.map(renderField)}
            </dl>
          )}
        </section>

        <section
          aria-labelledby="professional-heading"
          className={`${styles.card} ${styles.professionalCard}`}
        >
          <CardHeading
            id="professional-heading"
            icon="briefcase"
            title="Professional Information"
            editSection="Professional Information"
            onEdit={startEditing}
          />
          {loading ? (
            <p className={styles.profileState}>Loading profile…</p>
          ) : (
            <dl className={styles.stackedDetails}>
              {professionalFields.map(renderField)}
            </dl>
          )}
        </section>

        <section
          aria-labelledby="address-heading"
          className={`${styles.card} ${styles.addressCard}`}
        >
          <CardHeading
            id="address-heading"
            icon="pin"
            title="Address and Emergency Contact"
            editSection="Address and Emergency Contact"
            onEdit={startEditing}
          />
          {loading ? (
            <p className={styles.profileState}>Loading profile…</p>
          ) : (
            <dl className={styles.addressDetails}>
              {addressFields.map(renderField)}
            </dl>
          )}
        </section>

        <section
          aria-labelledby="additional-heading"
          className={`${styles.card} ${styles.additionalCard}`}
        >
          <CardHeading
            id="additional-heading"
            icon="certificate"
            title="Additional Information"
          />
          {loading ? (
            <p className={styles.profileState}>Loading profile…</p>
          ) : (
            <div className={styles.additionalDetails}>
              <ProfileSummary
                icon="star"
                label="Skills and Specializations"
                value={profile.skills}
              />
              <ProfileSummary
                icon="chat"
                label="Languages Spoken"
                value={profile.languages}
              />
              <ProfileSummary
                icon="calendar"
                label="Working Schedule"
                value={profile.workingSchedule}
              />
            </div>
          )}
        </section>
      </div>

      {editingSection && (
        <div className={styles.dialogBackdrop}>
          <form
            aria-labelledby="edit-profile-title"
            aria-modal="true"
            className={styles.editDialog}
            role="dialog"
            onSubmit={saveChanges}
          >
            <h2 id="edit-profile-title">Edit {editingSection}</h2>
            {editableFields.map((field) => (
              <label className={styles.formField} key={field.key}>
                <span>{field.label}</span>
                {field.key === 'birthDate' ? (
                  <input
                    aria-label={field.label}
                    type="date"
                    value={draft[field.key]}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                ) : (
                  <textarea
                    aria-label={field.label}
                    rows={draft[field.key].includes('\n') ? 3 : 1}
                    value={draft[field.key]}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                )}
              </label>
            ))}
            <div className={styles.dialogActions}>
              <button type="button" onClick={() => setEditingSection(null)}>
                Cancel
              </button>
              <button disabled={saving} type="submit">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function CardHeading({
  id,
  icon,
  title,
  editSection,
  onEdit,
}: {
  id: string;
  icon: string;
  title: string;
  editSection?: ProfileSection;
  onEdit?: (section: ProfileSection) => void;
}) {
  return (
    <div className={styles.cardHeading}>
      <span aria-hidden="true">
        <ProfileIcon name={icon} />
      </span>
      <h2 id={id}>{title}</h2>
      {editSection && onEdit && (
        <EditButton section={editSection} onEdit={onEdit} />
      )}
    </div>
  );
}

function ProfileSummary({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.summaryItem}>
      <span aria-hidden="true" className={styles.detailIcon}>
        <ProfileIcon name={icon} />
      </span>
      <div>
        <h3>{label}</h3>
        {value ? (
          <ul>
            {value.split('\n').map((line, index) => (
              <li key={`${label}:${index}`}>{line}</li>
            ))}
          </ul>
        ) : (
          <p>Not provided</p>
        )}
      </div>
    </div>
  );
}
