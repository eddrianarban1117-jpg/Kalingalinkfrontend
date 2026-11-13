import { useAuth } from '../../auth/AuthProvider';
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button/Button';
import { BouncingDots } from '../../components/animations/BouncingDots';
import logo from '../../../logo2.png';
import {
  accountStatusOptions,
  employmentStatusOptions,
  fieldCopy,
  fieldHints,
  fixedFieldValues,
  formMessages,
  placeholders,
  publicTeacherPageCopy,
  suffixOptions,
  teacherPageCopy,
  uploadLimits,
} from '../../constants/teacher-form-constants';
import { routePaths } from '../../constants/app-constants';
import styles from './AddTeacher.module.css';

type SectionIconName = 'user' | 'briefcase' | 'shield' | 'file';

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  const shared = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };

  return visible ? (
    <svg {...shared}>
      <path d="m3 3 18 18M10.6 6.2A10.6 10.6 0 0 1 12 6c6.5 0 10 6 10 6a15 15 0 0 1-3.1 3.6M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c1.4 0 2.6-.3 3.7-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  ) : (
    <svg {...shared}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function SectionIcon({ name }: { name: SectionIconName }) {
  const shared = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };

  switch (name) {
    case 'user':
      return (
        <svg {...shared}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...shared}>
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 5h18m-11 0v2h4v-2" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...shared}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'file':
      return (
        <svg {...shared}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6m-11 5h6m-6 4h6" />
        </svg>
      );
  }
}

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
};

function Field({ id, label, required = false, hint, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className={styles.requiredMark}>
            *
          </span>
        )}
      </label>
      {hint && (
        <span className={styles.fieldHint} id={hintId}>
          {hint}
        </span>
      )}
      {children}
    </div>
  );
}

type SectionCardProps = {
  number: string;
  title: string;
  description: string;
  icon: SectionIconName;
  children: ReactNode;
};

function SectionCard({
  number,
  title,
  description,
  icon,
  children,
}: SectionCardProps) {
  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <span className={styles.sectionNumber}>{number}</span>
        <span className={styles.sectionIcon}>
          <SectionIcon name={icon} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function getGeneratedUsername(firstName: string, lastName: string) {
  const normalizeName = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');

  return [normalizeName(firstName), normalizeName(lastName)]
    .filter(Boolean)
    .join('.');
}

function isAcceptedFile(
  file: File,
  acceptedTypes: string[],
  maximumSize: number,
) {
  return acceptedTypes.includes(file.type) && file.size <= maximumSize;
}

type AddTeacherProps = {
  mode?: 'admin' | 'public';
};

export function AddTeacher({ mode = 'admin' }: AddTeacherProps) {
  const navigate = useNavigate();
  const { request } = useAuth();
  const isPublicRegistration = mode === 'public';
  const backPath = isPublicRegistration
    ? routePaths.accountChoice
    : routePaths.teacherManagement;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginEmailEdited, setLoginEmailEdited] = useState(false);
  const [username, setUsername] = useState('');
  const [registrationPassword, setRegistrationPassword] = useState('');
  const [confirmRegistrationPassword, setConfirmRegistrationPassword] = useState('');
  const [showRegistrationPassword, setShowRegistrationPassword] = useState(false);
  const [showConfirmRegistrationPassword, setShowConfirmRegistrationPassword] =
    useState(false);
  const [selectedCdc, setSelectedCdc] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [activationLinkEnabled, setActivationLinkEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeCenters, setActiveCenters] = useState<Array<{ id: number; name: string; barangay: string }>>([]);
  const [centersLoading, setCentersLoading] = useState(false);
  const [centersError, setCentersError] = useState('');

  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview],
  );

  const selectedBarangay =
    activeCenters.find((cdc) => String(cdc.id) === selectedCdc)?.barangay ?? '';

  useEffect(() => {
    let active = true;
    setCentersLoading(true);
    void request<{ data: Array<{ id: number; name: string; barangay: string }> }>('/api/cdcs?include_unavailable=1')
      .then((result) => {
        if (active) setActiveCenters(result.data ?? []);
      })
      .catch((error: unknown) => {
        if (active) setCentersError(error instanceof Error ? error.message : 'Centers could not be loaded.');
      })
      .finally(() => {
        if (active) setCentersLoading(false);
      });
    return () => { active = false; };
  }, [request]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPhotoError('');
    setPhotoPreview('');

    if (!file) return;
    if (
      !isAcceptedFile(
        file,
        ['image/jpeg', 'image/png', 'image/webp'],
        uploadLimits.profilePhotoBytes,
      )
    ) {
      setPhotoError(formMessages.uploadImageInvalid);
      event.target.value = '';
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!event.currentTarget.reportValidity()) return;
    if (photoError) {
      setMessage(photoError);
      return;
    }
    if (registrationPassword !== confirmRegistrationPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const teacherAccount = {
        first_name: firstName,
        last_name: lastName,
        email: loginEmail,
        phone: String(formData.get('contactNumber') ?? ''),
        username,
        cdc_id: Number(selectedCdc),
        position: 'Teacher',
        password: registrationPassword,
        password_confirmation: confirmRegistrationPassword,
      };
      if (isPublicRegistration) {
        const registrationPayload = new FormData();
        Object.entries({
          firstName,
          lastName,
          email: loginEmail,
          contactEmail: personalEmail,
          phone: teacherAccount.phone,
          username,
          cdc: selectedCdc,
          password: registrationPassword,
          confirmPassword: confirmRegistrationPassword,
        }).forEach(([key, value]) => registrationPayload.append(key, value));
        formData.getAll('teacher_documents[]').forEach((value) => {
          if (value instanceof File) registrationPayload.append('teacher_documents[]', value);
        });
        await request('/api/register/teacher', {
          method: 'POST',
          body: registrationPayload,
        });
        navigate(routePaths.login, {
          replace: true,
          state: {
            message:
              'Your teacher account was submitted for MSWDO Admin review. After approval, accept the invitation sent to your email to activate your account.',
          },
        });
      } else {
        await request('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify({ role: 'teacher', ...teacherAccount }),
        });
        navigate(routePaths.teacherManagement, { replace: true });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Teacher account could not be created.');
    } finally {
      setSubmitting(false);
    }
  }

  function generateUsername() {
    if (!firstName.trim() || !lastName.trim()) {
      setMessage(formMessages.usernameMissingNames);
      return;
    }

    setUsername(getGeneratedUsername(firstName, lastName));
    setMessage('');
  }

  function updatePersonalEmail(value: string) {
    setPersonalEmail(value);
    if (!loginEmailEdited) setLoginEmail(value);
  }

  return (
    <div
      className={`${styles.page} ${isPublicRegistration ? styles.publicPage : ''}`}
    >
      {isPublicRegistration && (
        <div className={styles.brandBar}>
          <Link
            aria-label="KalingaLink home"
            className={styles.brand}
            to={routePaths.welcome}
          >
            <img src={logo} alt="KalingaLink" />
          </Link>
          <Link className={styles.loginLink} to={routePaths.login}>
            Already have an account? <strong>Log In</strong>
          </Link>
        </div>
      )}
      {!isPublicRegistration && (
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link to={routePaths.mswdoAdmin}>
            {teacherPageCopy.breadcrumbAdmin}
          </Link>
          <span aria-hidden="true">/</span>
          <Link to={routePaths.teacherManagement}>
            {teacherPageCopy.breadcrumbManagement}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{teacherPageCopy.breadcrumbAdd}</span>
        </nav>
      )}

      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          {isPublicRegistration && (
            <span aria-hidden="true" className={styles.titleIcon}>
              <SectionIcon name="user" />
            </span>
          )}
          <div>
            <h1>
              {isPublicRegistration
                ? publicTeacherPageCopy.breadcrumbCreate
                : teacherPageCopy.title}
            </h1>
            <p>{teacherPageCopy.description}</p>
          </div>
        </div>
        <Link className={styles.backLink} to={backPath}>
          {isPublicRegistration
            ? publicTeacherPageCopy.back
            : teacherPageCopy.back}
        </Link>
      </header>

      <div className={styles.backendNotice} role="note">
        <SectionIcon name="shield" />
        <p>
          {isPublicRegistration
            ? 'Teacher account details are saved securely when you submit this form. Profile photo uploads are optional.'
            : teacherPageCopy.backendNotice}
        </p>
      </div>

      <form className={styles.form} noValidate onSubmit={handleCreate}>
        <div className={styles.cardGrid}>
          <SectionCard
            number="01"
            title={teacherPageCopy.personalTitle}
            description={teacherPageCopy.personalDescription}
            icon="user"
          >
            <div className={styles.fieldGrid}>
              <Field id="firstName" label={fieldCopy.firstName} required>
                <input
                  autoComplete="given-name"
                  id="firstName"
                  maxLength={80}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder={placeholders.firstName}
                  required
                />
              </Field>
              <Field
                id="middleName"
                label={fieldCopy.middleName}
                hint={fieldHints.middleName}
              >
                <input
                  aria-describedby="middleName-hint"
                  autoComplete="additional-name"
                  id="middleName"
                  maxLength={80}
                  placeholder={placeholders.middleName}
                />
              </Field>
              <Field id="lastName" label={fieldCopy.lastName} required>
                <input
                  autoComplete="family-name"
                  id="lastName"
                  maxLength={80}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder={placeholders.lastName}
                  required
                />
              </Field>
              <Field
                id="suffix"
                label={fieldCopy.suffix}
                hint={fieldHints.suffix}
              >
                <select
                  aria-describedby="suffix-hint"
                  defaultValue=""
                  id="suffix"
                >
                  <option value="">{placeholders.suffix}</option>
                  {suffixOptions.map((suffix) => (
                    <option key={suffix} value={suffix}>
                      {suffix}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                id="contactNumber"
                label={fieldCopy.contactNumber}
                required
                hint={fieldHints.contactNumber}
              >
                <input
                  aria-describedby="contactNumber-hint"
                  autoComplete="tel"
                  id="contactNumber"
                  name="contactNumber"
                  inputMode="tel"
                  maxLength={16}
                  pattern="(?:[+]639|09)\d{9}"
                  placeholder={placeholders.contactNumber}
                  required
                  title={fieldHints.contactNumber}
                  type="tel"
                />
              </Field>
              <Field id="emailAddress" label={fieldCopy.emailAddress} required>
                <input
                  autoComplete="email"
                  id="emailAddress"
                  maxLength={254}
                  onChange={(event) => updatePersonalEmail(event.target.value)}
                  placeholder={placeholders.emailAddress}
                  required
                  type="email"
                  value={personalEmail}
                />
              </Field>
              <Field
                id="profilePhoto"
                label={fieldCopy.profilePhoto}
                hint={fieldHints.profilePhoto}
              >
                <div className={styles.photoControl}>
                  <span className={styles.photoPreview}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Selected teacher profile" />
                    ) : (
                      <SectionIcon name="user" />
                    )}
                  </span>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    aria-describedby={
                      photoError
                        ? 'profilePhoto-hint profilePhoto-error'
                        : 'profilePhoto-hint'
                    }
                    aria-invalid={Boolean(photoError)}
                    id="profilePhoto"
                    onChange={handlePhotoChange}
                    type="file"
                  />
                </div>
                {photoError && (
                  <span
                    className={styles.fieldError}
                    id="profilePhoto-error"
                    role="alert"
                  >
                    {photoError}
                  </span>
                )}
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            number="02"
            title={teacherPageCopy.employmentTitle}
            description={teacherPageCopy.employmentDescription}
            icon="briefcase"
          >
            <div className={styles.fieldGrid}>
              <Field
                id="teacherId"
                label={fieldCopy.teacherId}
                hint={fieldHints.teacherId}
              >
                <input
                  aria-describedby="teacherId-hint"
                  id="teacherId"
                  readOnly
                  value={fixedFieldValues.pendingTeacherId}
                />
              </Field>
              <Field
                id="employeeNumber"
                label={fieldCopy.employeeNumber}
                hint={fieldHints.employeeNumber}
              >
                <input
                  autoComplete="off"
                  aria-describedby="employeeNumber-hint"
                  id="employeeNumber"
                  maxLength={40}
                  placeholder={placeholders.employeeNumber}
                />
              </Field>
              <Field id="position" label={fieldCopy.position}>
                <input
                  id="position"
                  readOnly
                  value={fixedFieldValues.teacherPosition}
                />
              </Field>
              <Field id="employmentStatus" label={fieldCopy.employmentStatus}>
                <select defaultValue="Active" id="employmentStatus">
                  {employmentStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="dateHired" label={fieldCopy.dateHired}>
                <input id="dateHired" type="date" />
              </Field>
              <Field
                id="cdc"
                label={fieldCopy.cdc}
                required
                hint={fieldHints.cdc}
              >
                <select
                  aria-describedby="cdc-hint"
                  id="cdc"
                  onChange={(event) => setSelectedCdc(event.target.value)}
                  required
                  value={selectedCdc}
                  disabled={centersLoading || activeCenters.length === 0}
                >
                  <option value="">{placeholders.cdc}</option>
                  {activeCenters.map((cdc) => (
                    <option key={cdc.id} value={cdc.id}>
                      {cdc.name}
                    </option>
                  ))}
                </select>
                {centersLoading && <BouncingDots className={styles.fieldHint} label="Loading centers" />}
                {centersError && <span className={styles.fieldError} role="alert">{centersError}</span>}
                {!centersLoading && !centersError && activeCenters.length === 0 && (
                  <span className={styles.fieldHint}>No registered centers are available.</span>
                )}
              </Field>
              <Field
                id="barangay"
                label={fieldCopy.barangay}
                hint={fieldHints.barangay}
              >
                <input
                  aria-describedby="barangay-hint"
                  id="barangay"
                  readOnly
                  value={selectedBarangay}
                />
              </Field>
            </div>
            {isPublicRegistration && (
              <Field
                id="teacherDocuments"
                label="Supporting Employment Documents"
                hint="Optional. PDF, JPG, or PNG; up to 5 files, 10 MB each (30 MB total)."
              >
                <input
                  accept="application/pdf,image/jpeg,image/png"
                  id="teacherDocuments"
                  multiple
                  name="teacher_documents[]"
                  type="file"
                />
              </Field>
            )}
          </SectionCard>

          <SectionCard
            number="03"
            title={teacherPageCopy.credentialsTitle}
            description={teacherPageCopy.credentialsDescription}
            icon="shield"
          >
            <div className={styles.fieldGrid}>
              <Field
                id="username"
                label={fieldCopy.username}
                required
                hint={fieldHints.username}
              >
                <div className={styles.inputWithAction}>
                  <input
                    autoComplete="username"
                    aria-describedby="username-hint"
                    id="username"
                    maxLength={80}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder={placeholders.username}
                    required
                    value={username}
                  />
                  <button onClick={generateUsername} type="button">
                    Generate
                  </button>
                </div>
              </Field>
              <Field id="loginEmail" label={fieldCopy.loginEmail} required>
                <input
                  autoComplete="email"
                  id="loginEmail"
                  maxLength={254}
                  onChange={(event) => {
                    setLoginEmailEdited(true);
                    setLoginEmail(event.target.value);
                  }}
                  placeholder={placeholders.loginEmail}
                  required
                  type="email"
                  value={loginEmail}
                />
              </Field>
              {isPublicRegistration && (
                <>
                  <Field id="teacherRegistrationPassword" label="Password" required>
                    <div className={styles.inputWithToggle}>
                      <input
                        autoComplete="new-password"
                        id="teacherRegistrationPassword"
                        minLength={12}
                        onChange={(event) => setRegistrationPassword(event.target.value)}
                        required
                        type={showRegistrationPassword ? 'text' : 'password'}
                        value={registrationPassword}
                      />
                      <button
                        aria-label={showRegistrationPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showRegistrationPassword}
                        className={styles.passwordToggle}
                        onClick={() => setShowRegistrationPassword((visible) => !visible)}
                        type="button"
                      >
                        <PasswordVisibilityIcon visible={showRegistrationPassword} />
                      </button>
                    </div>
                  </Field>
                  <Field id="teacherConfirmPassword" label="Confirm Password" required>
                    <div className={styles.inputWithToggle}>
                      <input
                        autoComplete="new-password"
                        id="teacherConfirmPassword"
                        minLength={12}
                        onChange={(event) => setConfirmRegistrationPassword(event.target.value)}
                        required
                        type={showConfirmRegistrationPassword ? 'text' : 'password'}
                        value={confirmRegistrationPassword}
                      />
                      <button
                        aria-label={showConfirmRegistrationPassword ? 'Hide confirm password' : 'Show confirm password'}
                        aria-pressed={showConfirmRegistrationPassword}
                        className={styles.passwordToggle}
                        onClick={() => setShowConfirmRegistrationPassword((visible) => !visible)}
                        type="button"
                      >
                        <PasswordVisibilityIcon visible={showConfirmRegistrationPassword} />
                      </button>
                    </div>
                  </Field>
                </>
              )}
              {isPublicRegistration && (
                <p className={styles.credentialsNotice}>
                  Keep your password private. It will not be sent by email.
                  After the administrator approves your application, activate
                  your account from the invitation email and sign in with the
                  password you confirmed here.
                </p>
              )}
              {!isPublicRegistration && (
                <>
                  <Field id="accountRole" label={fieldCopy.accountRole}>
                    <input id="accountRole" readOnly value={fixedFieldValues.teacherRole} />
                  </Field>
                  <Field id="accountStatus" label={fieldCopy.accountStatus}>
                    <select defaultValue="Pending Activation" id="accountStatus">
                      {accountStatusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </Field>
                  <div className={styles.fullWidthField}>
                    <label className={styles.checkboxRow} htmlFor="activationLink">
                      <input
                        checked={activationLinkEnabled}
                        id="activationLink"
                        onChange={(event) => setActivationLinkEnabled(event.target.checked)}
                        type="checkbox"
                      />
                      <span>{fieldCopy.activation}</span>
                    </label>
                    <span className={styles.fieldHint} id="activationLink-hint">
                      {fieldHints.activation}
                    </span>
                  </div>
                </>
              )}
            </div>
          </SectionCard>

        </div>

        <div aria-live="polite" className={styles.formMessage} role="alert">
          {message}
        </div>

        <footer className={styles.formActions}>
          <Button
            className={styles.secondaryButton}
            onClick={() => navigate(backPath)}
            type="button"
          >
            {teacherPageCopy.cancel}
          </Button>
          <Button
            className={styles.secondaryButton}
            onClick={() => setMessage(formMessages.draftUnavailable)}
            type="button"
          >
            {teacherPageCopy.saveDraft}
          </Button>
          <Button className={styles.primaryButton} disabled={submitting} type="submit">
            {submitting ? 'Creating Account…' : teacherPageCopy.createAccount}
          </Button>
        </footer>
      </form>
    </div>
  );
}
