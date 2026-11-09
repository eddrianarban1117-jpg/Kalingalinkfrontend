import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button/Button';
import { routePaths } from '../../constants/app-constants';
import { useAuth } from '../../auth/AuthProvider';
import logo from '../../../logo2.png';
import styles from './ParentRegistration.module.css';

function todayForDateInput() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <span className={styles.number}>{number}</span>
        <span className={styles.sectionIcon} aria-hidden="true">
          {number === '01' ? (
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
            </svg>
          ) : number === '02' ? (
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-7h6v7" />
            </svg>
          ) : number === '03' ? (
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="15" cy="9" r="5" />
              <path d="m11.5 12.5-7 7m0-4 3 3m1-7 3 3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          )}
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  required,
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
        {required && <span className={styles.required}> *</span>}
      </label>
      {children}
    </div>
  );
}

export function ParentRegistration() {
  const navigate = useNavigate();
  const { registerParent } = useAuth();
  const [relationship, setRelationship] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [parentBarangay, setParentBarangay] = useState('');
  const [email, setEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginEmailEdited, setLoginEmailEdited] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;
  const usernameIsValid = /^[A-Za-z0-9._-]{3,80}$/.test(username);

  function updateParentBarangay(value: string) {
    setParentBarangay(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!event.currentTarget.reportValidity()) return;
    if (!usernameIsValid) {
      setMessage(
        'Use 3–80 letters, numbers, periods, underscores, or hyphens for the username.',
      );
      return;
    }
    if (passwordStrength !== 5) {
      setMessage('Please meet all password requirements before continuing.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('The passwords do not match.');
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const formValue = (name: string) => {
      const value = formData.get(name);
      return typeof value === 'string' ? value.trim() : '';
    };
    const payload = {
      firstName: formValue('parentFirstName'),
      middleName: formValue('parentMiddleName'),
      lastName: formValue('parentLastName'),
      suffix: formValue('parentSuffix'),
      username,
      email: loginEmail.trim(),
      password,
      confirmPassword,
      phone: formValue('parentContact'),
      parentEmail: email.trim(),
      birthDate: formValue('parentBirthDate'),
      gender: formValue('parentGender'),
      relationship:
        relationship === 'Other'
          ? formValue('otherRelationship')
          : relationship,
      householdIncome: formValue('householdIncome'),
      preferredLanguage: formValue('preferredLanguage'),
      preferredLanguageOther: formValue('preferredLanguageOther'),
      referralSource: formValue('referralSource'),
      referralSourceOther: formValue('referralSourceOther'),
      street: formValue('street'),
      barangay: parentBarangay.trim(),
      municipality: formValue('municipality'),
      province: formValue('province'),
      postalCode: formValue('postalCode'),
    };
    const requestPayload = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      requestPayload.append(
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      );
    });
    const photo = formData.get('parentPhoto');
    if (photo instanceof File && photo.size > 0) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) {
        setMessage('Profile photo must be a JPG, PNG, or WEBP image.');
        return;
      }
      if (photo.size > 5 * 1024 * 1024) {
        setMessage('Profile photo must be no larger than 5 MB.');
        return;
      }
      requestPayload.append('parentPhoto', photo);
    }

    setSubmitting(true);
    try {
      await registerParent(requestPayload);
      setRegistrationComplete(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Account registration failed.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (registrationComplete) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <header className={styles.topBar}>
            <div className={styles.brand}>
              <img src={logo} alt="KalingaLink" />
              <span>Child Development Center</span>
            </div>
          </header>
          <section aria-live="polite" className={styles.card}>
            <header className={`${styles.cardHeader} ${styles.successHeader}`}>
              <span className={styles.number} aria-hidden="true">
                ✓
              </span>
              <div>
                <h2>Parent account created successfully</h2>
                <p>
                  Your account is ready. Child information and enrollment
                  applications are submitted after signing in.
                </p>
              </div>
            </header>
            <div className={styles.cardBody}>
              <Button
                className={styles.primaryButton}
                onClick={() =>
                  navigate(routePaths.parentDashboard, { replace: true })
                }
                type="button"
              >
                Continue to Parent Dashboard
              </Button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.topBar}>
          <div className={styles.brand}>
            <img src={logo} alt="KalingaLink" />
            <span>Child Development Center</span>
          </div>
          <Link className={styles.loginLink} to={routePaths.login}>
            Already have an account? <strong>Log In</strong>
          </Link>
        </header>

        <header className={styles.pageHeader}>
          <div className={styles.headerCopy}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link to={routePaths.welcome}>Welcome</Link>
              <span aria-hidden="true">/</span>
              <Link to={routePaths.accountChoice}>Account Type</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Parent Registration</span>
            </nav>
            <h1>Parent Registration</h1>
            <p>
              Create your parent account first. Add child information and apply
              for enrollment from your dashboard after signing in.
            </p>
          </div>
        </header>

        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <FormSection
            number="01"
            title="Parent / Guardian Personal Information"
            description="Enter your basic contact information."
          >
            <div className={styles.grid}>
              <Field id="parentFirstName" label="First Name" required>
                <input
                  autoComplete="given-name"
                  id="parentFirstName"
                  name="parentFirstName"
                  maxLength={80}
                  placeholder="Enter first name"
                  required
                />
              </Field>
              <Field id="parentMiddleName" label="Middle Name">
                <input
                  autoComplete="additional-name"
                  id="parentMiddleName"
                  name="parentMiddleName"
                  maxLength={80}
                  placeholder="Enter middle name (optional)"
                />
              </Field>
              <Field id="parentLastName" label="Last Name" required>
                <input
                  autoComplete="family-name"
                  id="parentLastName"
                  name="parentLastName"
                  maxLength={80}
                  placeholder="Enter last name"
                  required
                />
              </Field>
              <Field id="parentSuffix" label="Suffix">
                <select defaultValue="" id="parentSuffix" name="parentSuffix">
                  <option value="">Select suffix (optional)</option>
                  <option>Jr.</option>
                  <option>Sr.</option>
                  <option>II</option>
                  <option>III</option>
                </select>
              </Field>
              <Field id="parentGender" label="Gender" required>
                <select id="parentGender" name="parentGender" required>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer not to say</option>
                </select>
              </Field>
              <Field id="parentBirthDate" label="Date of Birth" required>
                <input
                  autoComplete="bday"
                  id="parentBirthDate"
                  name="parentBirthDate"
                  max={todayForDateInput()}
                  required
                  type="date"
                />
              </Field>
              <Field id="relationship" label="Relationship to Child" required>
                <select
                  id="relationship"
                  name="relationship"
                  onChange={(event) => setRelationship(event.target.value)}
                  required
                  value={relationship}
                >
                  <option value="">Select relationship</option>
                  <option>Mother</option>
                  <option>Father</option>
                  <option>Legal Guardian</option>
                  <option>Other</option>
                </select>
              </Field>
              {relationship === 'Other' && (
                <Field
                  id="otherRelationship"
                  label="Specify Relationship"
                  required
                >
                  <input
                    id="otherRelationship"
                    name="otherRelationship"
                    maxLength={80}
                    placeholder="Enter relationship"
                    required
                  />
                </Field>
              )}
              <Field id="parentContact" label="Contact Number" required>
                <input
                  autoComplete="tel"
                  id="parentContact"
                  name="parentContact"
                  inputMode="tel"
                  pattern="(?:[+]639|09)\d{9}"
                  placeholder="e.g. 09171234567"
                  required
                  title="Enter a valid Philippine mobile number, such as 09171234567."
                  type="tel"
                />
              </Field>
              <Field id="parentEmail" label="Email Address" required>
                <input
                  autoComplete="email"
                  id="parentEmail"
                  name="parentEmail"
                  maxLength={254}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (!loginEmailEdited) setLoginEmail(event.target.value);
                  }}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={email}
                />
              </Field>
              <Field id="parentPhoto" label="Profile Photo">
                <input
                  accept="image/jpeg,image/png,image/webp"
                  id="parentPhoto"
                  name="parentPhoto"
                  type="file"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            number="02"
            title="Address Information"
            description="Provide your current residential address for CDC communication."
          >
            <div className={styles.grid}>
              <Field id="street" label="House Number / Street / Purok" required>
                <input
                  autoComplete="street-address"
                  id="street"
                  name="street"
                  maxLength={160}
                  placeholder="House number, street, or purok"
                  required
                />
              </Field>
              <Field id="parentBarangay" label="Barangay" required>
                <input
                  autoComplete="address-level3"
                  id="parentBarangay"
                  name="parentBarangay"
                  maxLength={100}
                  onChange={(event) => updateParentBarangay(event.target.value)}
                  placeholder="Enter barangay"
                  required
                  value={parentBarangay}
                />
              </Field>
              <Field id="municipality" label="Municipality" required>
                <input
                  autoComplete="address-level2"
                  id="municipality"
                  name="municipality"
                  maxLength={100}
                  readOnly
                  required
                  value="Pinamalayan"
                />
              </Field>
              <Field id="province" label="Province" required>
                <input
                  autoComplete="address-level1"
                  id="province"
                  name="province"
                  maxLength={100}
                  readOnly
                  required
                  value="Oriental Mindoro"
                />
              </Field>
              <Field id="postalCode" label="Postal Code">
                <input
                  autoComplete="postal-code"
                  id="postalCode"
                  name="postalCode"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="\d{4}"
                  placeholder="Optional"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            number="03"
            title="Social and Demographic Information"
            description="Help us understand your family’s needs and how you found out about our center."
          >
            <div className={`${styles.grid} ${styles.socialGrid}`}>
              <Field id="householdIncome" label="Household Income Range">
                <select
                  defaultValue=""
                  id="householdIncome"
                  name="householdIncome"
                >
                  <option value="">Select income range (optional)</option>
                  <option>Below ₱5,000</option>
                  <option>₱5,000–₱9,999</option>
                  <option>₱10,000–₱14,999</option>
                  <option>₱15,000–₱19,999</option>
                  <option>₱20,000–₱29,999</option>
                  <option>₱30,000–₱49,999</option>
                  <option>₱50,000 and above</option>
                  <option>Prefer not to disclose</option>
                </select>
              </Field>
              <Field id="preferredLanguage" label="Preferred Language">
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  onChange={(event) => setPreferredLanguage(event.target.value)}
                  value={preferredLanguage}
                >
                  <option value="">Select language (optional)</option>
                  <option>Filipino</option>
                  <option>English</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field
                id="preferredLanguageOther"
                label="If Other, please specify"
              >
                <input
                  disabled={preferredLanguage !== 'Other'}
                  id="preferredLanguageOther"
                  name="preferredLanguageOther"
                  maxLength={70}
                  placeholder="Enter language (optional)"
                  required={preferredLanguage === 'Other'}
                />
              </Field>
              <Field
                id="referralSource"
                label="How Did You Learn About the CDC?"
              >
                <select
                  id="referralSource"
                  name="referralSource"
                  onChange={(event) => setReferralSource(event.target.value)}
                  value={referralSource}
                >
                  <option value="">Select source (optional)</option>
                  <option>Barangay Official</option>
                  <option>MSWDO</option>
                  <option>CDC Teacher or Staff</option>
                  <option>Family or Friends</option>
                  <option>Social Media</option>
                  <option>Community Announcement</option>
                  <option>Referral</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field id="referralSourceOther" label="If Other, please specify">
                <input
                  disabled={referralSource !== 'Other'}
                  id="referralSourceOther"
                  name="referralSourceOther"
                  maxLength={110}
                  placeholder="Enter source (optional)"
                  required={referralSource === 'Other'}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            number="04"
            title="Parent Account Credentials"
            description="Choose secure sign-in details for your account."
          >
            <div className={styles.grid}>
              <Field id="parentUsername" label="Username" required>
                <input
                  autoComplete="username"
                  aria-invalid={Boolean(username) && !usernameIsValid}
                  id="parentUsername"
                  name="parentUsername"
                  maxLength={80}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Choose a username"
                  required
                  value={username}
                />
                <span className={styles.hint}>
                  Use 3–80 letters, numbers, periods, underscores, or hyphens.
                  Availability requires the account service.
                </span>
                {username && !usernameIsValid && (
                  <span className={styles.errorText} role="alert">
                    Enter a valid username using letters, numbers, periods,
                    underscores, or hyphens.
                  </span>
                )}
              </Field>
              <Field id="loginEmail" label="Login Email" required>
                <input
                  autoComplete="email"
                  id="loginEmail"
                  name="loginEmail"
                  maxLength={254}
                  onChange={(event) => {
                    setLoginEmailEdited(true);
                    setLoginEmail(event.target.value);
                  }}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={loginEmail}
                />
              </Field>
              <Field id="parentPassword" label="Password" required>
                <div className={styles.passwordInput}>
                  <input
                    autoComplete="new-password"
                    id="parentPassword"
                    name="parentPassword"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={
                      showPassword ? 'Hide passwords' : 'Show passwords'
                    }
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </Field>
              <Field id="confirmPassword" label="Confirm Password" required>
                <input
                  autoComplete="new-password"
                  id="confirmPassword"
                  name="confirmPassword"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                />
                {confirmPassword && password !== confirmPassword && (
                  <span className={styles.errorText}>
                    Passwords do not match.
                  </span>
                )}
              </Field>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <span className={styles.fieldLabel}>Password strength</span>
                <span
                  aria-label={`Password strength ${passwordStrength} of 5`}
                  className={styles.strengthTrack}
                >
                  <span
                    data-strength={passwordStrength}
                    className={styles.strengthValue}
                    style={{ width: `${passwordStrength * 20}%` }}
                  />
                </span>
                <span className={styles.hint}>
                  Use 12 or more characters with uppercase, lowercase, number,
                  and symbol.
                </span>
              </div>
              <div
                className={`${styles.field} ${styles.fullWidth} ${styles.consentPanel}`}
              >
                <label className={styles.checkbox} htmlFor="termsConsent">
                  <input
                    checked={termsConsent}
                    id="termsConsent"
                    onChange={(event) => setTermsConsent(event.target.checked)}
                    required
                    type="checkbox"
                  />
                  I agree to the Terms and Conditions.
                </label>
                <label className={styles.checkbox} htmlFor="privacyConsent">
                  <input
                    checked={privacyConsent}
                    id="privacyConsent"
                    onChange={(event) =>
                      setPrivacyConsent(event.target.checked)
                    }
                    required
                    type="checkbox"
                  />
                  I acknowledge the Privacy Notice and the use of my data for
                  account and enrollment services.
                </label>
              </div>
            </div>
          </FormSection>

          <div aria-live="polite" className={styles.formMessage} role="alert">
            {message}
          </div>
          <footer className={styles.actions}>
            <Button
              className={styles.secondaryButton}
              onClick={() => navigate(routePaths.accountChoice)}
              type="button"
            >
              Back
            </Button>
            <Button
              className={styles.primaryButton}
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Creating Account…' : 'Create Parent Account'}
            </Button>
          </footer>
        </form>
      </div>
    </main>
  );
}
