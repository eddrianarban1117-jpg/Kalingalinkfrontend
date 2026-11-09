import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { routePaths } from '../../constants/app-constants';
import styles from './TeacherVerification.module.css';

type ReviewEvent = {
  id: number;
  status: string;
  message: string;
  created_at: string;
  reviewer: string | null;
  reviewer_role: string | null;
};

type Center = { id: number; name: string };

type VerificationProfile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone: string | null;
  gender: string | null;
  birth_date: string | null;
  nationality: string | null;
  home_address: string | null;
  education: string | null;
  certification: string | null;
  years_of_service: string | null;
  skills: string | null;
  languages: string | null;
  cdc_id: number | null;
  is_active: boolean;
  verification_status: string;
  review_note: string | null;
  reviewed_at: string | null;
  review_history: ReviewEvent[];
};

type ProfileValues = {
  first_name: string;
  middle_name: string;
  last_name: string;
  phone: string;
  gender: string;
  birth_date: string;
  nationality: string;
  home_address: string;
  education: string;
  certification: string;
  years_of_service: string;
  skills: string;
  languages: string;
  cdc_id: number | '';
};

type ProfileField = {
  name: Exclude<keyof ProfileValues, 'cdc_id'>;
  label: string;
  type?: string;
  required?: boolean;
  wide?: boolean;
};

const personalFields: ProfileField[] = [
  { name: 'first_name', label: 'First Name', required: true },
  { name: 'middle_name', label: 'Middle Name' },
  { name: 'last_name', label: 'Last Name', required: true },
  { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
  { name: 'gender', label: 'Gender', type: 'select', required: true },
  { name: 'birth_date', label: 'Date of Birth', type: 'date', required: true },
  { name: 'nationality', label: 'Nationality', required: true },
  { name: 'home_address', label: 'Complete Address', required: true, wide: true },
];

const employmentFields: ProfileField[] = [
  { name: 'education', label: 'Educational Attainment', type: 'select', required: true },
  { name: 'certification', label: 'Certification', type: 'select' },
  { name: 'years_of_service', label: 'Years of Service', type: 'number', required: true },
  { name: 'skills', label: 'Skills', wide: true },
  { name: 'languages', label: 'Languages', wide: true },
];

const fieldOptions: Partial<Record<ProfileField['name'], string[]>> = {
  gender: ['Female', 'Male', 'Other'],
  education: [
    'Elementary Graduate',
    'High School Graduate',
    'Vocational/Technical',
    'Associate Degree',
    "Bachelor's Degree",
    "Master's Degree",
    'Doctorate',
  ],
  certification: [
    'Professional Teacher License (PRC)',
    'Early Childhood Education Certificate',
    'Child Development Worker Training Certificate',
    'None',
    'Other',
  ],
};

const requiredFields: (keyof ProfileValues)[] = [
  'first_name',
  'last_name',
  'phone',
  'gender',
  'birth_date',
  'nationality',
  'home_address',
  'education',
  'years_of_service',
  'cdc_id',
];

function profileValues(profile: VerificationProfile): ProfileValues {
  return {
    first_name: profile.first_name ?? '',
    middle_name: profile.middle_name ?? '',
    last_name: profile.last_name ?? '',
    phone: profile.phone ?? '',
    gender: profile.gender ?? '',
    birth_date: profile.birth_date ?? '',
    nationality: profile.nationality ?? '',
    home_address: profile.home_address ?? '',
    education: profile.education ?? '',
    certification: profile.certification ?? '',
    years_of_service: profile.years_of_service ?? '',
    skills: profile.skills ?? '',
    languages: profile.languages ?? '',
    cdc_id: profile.cdc_id ?? '',
  };
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_review: 'Pending Approval',
    revision_required: 'Revision Required',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return labels[status] ?? status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function validate(values: ProfileValues) {
  const errors: Partial<Record<keyof ProfileValues, string>> = {};
  for (const field of requiredFields) {
    if (String(values[field] ?? '').trim() === '') {
      errors[field] = 'This field is required.';
    }
  }
  if (
    values.years_of_service.trim() !== '' &&
    (!Number.isFinite(Number(values.years_of_service)) || Number(values.years_of_service) < 0)
  ) {
    errors.years_of_service = 'Enter a non-negative number of years.';
  }
  if (values.birth_date && values.birth_date > new Date().toISOString().slice(0, 10)) {
    errors.birth_date = 'Date of birth cannot be in the future.';
  }
  return errors;
}

export function TeacherVerification() {
  const { request, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<VerificationProfile | null>(null);
  const [values, setValues] = useState<ProfileValues | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileValues, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const reload = useCallback(async () => {
    setError('');
    try {
      const [result, centerResult] = await Promise.all([
        request<{ data: VerificationProfile }>('/api/teacher/verification'),
        request<{ data: Center[] }>('/api/cdcs?include_unavailable=1'),
      ]);
      setProfile(result.data);
      setValues(profileValues(result.data));
      if (result.data.is_active && result.data.verification_status === 'approved') {
        updateUser({ is_active: true });
      }
      setCenters(centerResult.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Your verification details could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [request, updateUser]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function updateField<K extends keyof ProfileValues>(name: K, value: ProfileValues[K]) {
    setValues((current) => current ? { ...current, [name]: value } : current);
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function saveProfile(resubmit: boolean) {
    if (!values || saving) return;
    const errors = resubmit ? validate(values) : {};
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError('Complete the highlighted required fields before resubmitting.');
      return;
    }
    if (
      resubmit &&
      !window.confirm(
        'Your updated profile will be sent to MSWDO Admin for another verification review. Continue?',
      )
    ) return;

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await request<{ message: string; data?: VerificationProfile }>(
        '/api/teacher/verification',
        {
          method: resubmit ? 'PUT' : 'PATCH',
          body: JSON.stringify(values),
        },
      );
      if (result.data) {
        setProfile(result.data);
        setValues(profileValues(result.data));
      }
      setNotice(result.message);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : resubmit
            ? 'Your profile could not be resubmitted.'
            : 'Your draft could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    try {
      await logout();
    } finally {
      navigate(routePaths.login, { replace: true });
    }
  }

  const canEdit =
    profile?.verification_status === 'pending_review' ||
    profile?.verification_status === 'revision_required';

  function renderField({ name, label, type, required, wide }: ProfileField) {
    const id = `teacher-${name}`;
    const errorMessage = fieldErrors[name];
    const options = fieldOptions[name];
    const currentValue = values?.[name] ?? '';
    return (
      <label className={wide ? styles.wideField : ''} htmlFor={id} key={name}>
        <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
        {options ? (
          <select
            aria-describedby={errorMessage ? `${id}-error` : undefined}
            aria-invalid={Boolean(errorMessage)}
            disabled={!canEdit}
            id={id}
            onChange={(event) => updateField(name, event.target.value)}
            required={required}
            value={currentValue}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {currentValue && !options.includes(currentValue) && (
              <option value={currentValue}>{currentValue}</option>
            )}
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : (
          <input
            aria-describedby={errorMessage ? `${id}-error` : undefined}
            aria-invalid={Boolean(errorMessage)}
            id={id}
            max={name === 'birth_date' ? new Date().toISOString().slice(0, 10) : undefined}
            maxLength={name === 'years_of_service' ? undefined : name === 'skills' ? 2000 : 255}
            min={name === 'years_of_service' ? '0' : undefined}
            onChange={(event) => updateField(name, event.target.value)}
            readOnly={!canEdit}
            required={required}
            step={name === 'years_of_service' ? '0.5' : undefined}
            type={type ?? 'text'}
            value={currentValue}
          />
        )}
        {errorMessage && <small className={styles.fieldError} id={`${id}-error`}>{errorMessage}</small>}
      </label>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>KalingaLink&nbsp; / &nbsp;Teacher Account</span>
          <h1>Complete Your Teacher Profile</h1>
          <p>Complete or correct the required information before final verification.</p>
        </div>
        <button onClick={() => void signOut()} type="button">Sign Out</button>
      </header>

      {loading ? (
        <p className={styles.state}>Loading your account details…</p>
      ) : error && !profile ? (
        <p className={styles.error} role="alert">{error}</p>
      ) : profile && values ? (
        <div className={styles.content}>
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <h2>{profile.first_name} {profile.last_name}</h2>
                <p>Teacher ID TCH-{String(profile.id).padStart(4, '0')} · {profile.email}</p>
              </div>
              <span className={`${styles.status} ${styles[`status_${profile.verification_status}`] ?? ''}`}>
                {statusLabel(profile.verification_status)}
              </span>
            </header>

            {profile.review_note && (
              <section className={styles.feedback}>
                <h3>MSWDO Admin Feedback</h3>
                <p>{profile.review_note}</p>
                {profile.reviewed_at && (
                  <time dateTime={profile.reviewed_at}>
                    {new Date(profile.reviewed_at.replace(' ', 'T')).toLocaleString()}
                  </time>
                )}
                {profile.is_active && profile.verification_status === 'approved' && (
                  <p className={styles.success} role="status">
                    Your teacher account is approved and active.
                    {' '}
                    <button
                      className={styles.dashboardLink}
                      onClick={() => navigate(routePaths.teacherDashboard, { replace: true })}
                      type="button"
                    >
                      Go to Teacher Dashboard
                    </button>
                  </p>
                )}
              </section>
            )}

            <form noValidate onSubmit={(event) => { event.preventDefault(); void saveProfile(true); }}>
              <section className={styles.formSection}>
                <h3>Personal Information</h3>
                <div className={styles.fields}>{personalFields.map(renderField)}</div>
              </section>
              <section className={styles.formSection}>
                <h3>Employment Information</h3>
                <div className={styles.fields}>
                  <label htmlFor="teacher-cdc">
                    <span>Preferred Child Development Center <b aria-hidden="true">*</b></span>
                    <select
                      aria-describedby={fieldErrors.cdc_id ? 'teacher-cdc-error' : undefined}
                      aria-invalid={Boolean(fieldErrors.cdc_id)}
                      disabled={!canEdit}
                      id="teacher-cdc"
                      onChange={(event) => updateField('cdc_id', event.target.value ? Number(event.target.value) : '')}
                      required
                      value={values.cdc_id}
                    >
                      <option value="">Select a center</option>
                      {centers.map((center) => (
                        <option key={center.id} value={center.id}>{center.name}</option>
                      ))}
                    </select>
                    <small>MSWDO Admin confirms your official CDC assignment after approval.</small>
                    {fieldErrors.cdc_id && <small className={styles.fieldError} id="teacher-cdc-error">{fieldErrors.cdc_id}</small>}
                  </label>
                  {employmentFields.map(renderField)}
                </div>
              </section>

              {error && <p className={styles.error} role="alert">{error}</p>}
              {notice && <p className={styles.success} role="status">{notice}</p>}
              {canEdit && (
                <div className={styles.actions}>
                  <p>Resubmission sends your updated profile to MSWDO Admin for re-review.</p>
                  <div>
                    <button className={styles.secondary} disabled={saving} onClick={() => void saveProfile(false)} type="button">
                      {saving ? 'Saving…' : 'Save Draft'}
                    </button>
                    <button className={styles.submit} disabled={saving} type="submit">
                      {saving ? 'Submitting…' : 'Resubmit for Verification'}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <section className={styles.history}>
              <h3>Review History</h3>
              {profile.review_history.length ? (
                <ol>
                  {profile.review_history.map((event) => (
                    <li key={event.id}>
                      <strong>{statusLabel(event.status)}</strong>
                      <time dateTime={event.created_at}>
                        {new Date(event.created_at.replace(' ', 'T')).toLocaleString()}
                      </time>
                      <small>
                        {event.reviewer ?? 'KalingaLink'}
                        {event.reviewer_role ? ` · ${event.reviewer_role}` : ''}
                      </small>
                      <p>{event.message}</p>
                    </li>
                  ))}
                </ol>
              ) : <p>No review history is available yet.</p>}
            </section>
          </section>
        </div>
      ) : null}
    </main>
  );
}
