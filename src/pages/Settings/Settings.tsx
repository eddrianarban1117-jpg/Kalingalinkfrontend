import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { routePaths } from '../../constants/app-constants';
import { BouncingDots } from '../../components/animations/BouncingDots';
import {
  applyThemePreference,
  readThemePreference,
  saveThemePreference,
} from '../../styles/theme';
import styles from './Settings.module.css';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en-US' | 'fil';

type SettingsState = {
  language: Language;
  theme: Theme;
  notifications: {
    announcements: boolean;
    systemAlerts: boolean;
    reminders: boolean;
    email: boolean;
    inApp: boolean;
  };
  dateFormat: string;
  timeFormat: string;
  timeZone: string;
  defaultDashboard: string;
};

type Profile = {
  first_name: string;
  last_name: string;
  email: string;
};

type SettingsResponse = {
  data: {
    profile: Profile;
    preferences: Partial<SettingsState>;
  };
};

type ProfilePhotoResponse = {
  data: {
    profile: Profile & { profile_photo: string | null };
  };
};

type ProfileDraft = {
  full_name: string;
  email: string;
};

const defaultSettings: SettingsState = {
  language: 'en-US',
  theme: 'light',
  notifications: {
    announcements: true,
    systemAlerts: true,
    reminders: true,
    email: true,
    inApp: true,
  },
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12-hour (AM/PM)',
  timeZone: '(UTC+08:00) Manila',
  defaultDashboard: 'MSWDO Dashboard',
};

const notificationOptions: {
  key: keyof SettingsState['notifications'];
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    key: 'announcements',
    title: 'Announcements',
    description: 'Updates from teachers, MSWDO admin, and system admin.',
    icon: 'announcement',
  },
  {
    key: 'systemAlerts',
    title: 'System Alerts',
    description: 'Important system notifications and maintenance alerts.',
    icon: 'alert',
  },
  {
    key: 'reminders',
    title: 'Reminders',
    description: 'Upcoming events and deadlines.',
    icon: 'calendar',
  },
  {
    key: 'email',
    title: 'Email Notifications',
    description: 'Receive notifications via email.',
    icon: 'mail',
  },
  {
    key: 'inApp',
    title: 'In-App Notifications',
    description: 'Show notifications within the system.',
    icon: 'bell',
  },
];

function Icon({ name }: { name: string }) {
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
    case 'account':
      return (
        <svg {...shared}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18m0-18a14 14 0 0 0 0 18" />
        </svg>
      );
    case 'palette':
      return (
        <svg {...shared}>
          <path d="M12 3a9 9 0 1 0 0 18h1.3a2 2 0 0 0 1.5-3.3 1.8 1.8 0 0 1 1.4-3h1.1A3.7 3.7 0 0 0 21 11C21 6.6 17 3 12 3Z" />
          <path d="M7.5 11h.01M10 7.5h.01m4 0h.01m3 3.5h.01" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...shared}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" />
        </svg>
      );
    case 'announcement':
      return (
        <svg {...shared}>
          <path d="m3 11 18-5v12L3 13zM7 14l2 7h4l-2.3-6.2m8.3-7.5 2-2" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...shared}>
          <path d="M12 3 2.8 20h18.4zM12 9v5m0 3h.01" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18M8 14h2m4 0h2" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case 'sliders':
      return (
        <svg {...shared}>
          <path d="M4 6h9m4 0h3M4 12h3m4 0h9M4 18h9m4 0h3" />
          <circle cx="15" cy="6" r="2" />
          <circle cx="9" cy="12" r="2" />
          <circle cx="15" cy="18" r="2" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="3" />
          <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...shared}>
          <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />
        </svg>
      );
    case 'system':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 0 18z" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...shared}>
          <path d="m14 5 5 5M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z" />
        </svg>
      );
    case 'save':
      return (
        <svg {...shared}>
          <path d="M5 3h12l4 4v14H3V3zM7 3v6h10V3M7 21v-8h10v8" />
        </svg>
      );
    case 'check':
      return (
        <svg {...shared}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case 'close':
      return (
        <svg {...shared}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case 'info':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" fill="#0872ed" stroke="none" />
          <path
            d="M12 11v5m0-8h.01"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
          />
        </svg>
      );
    case 'camera':
      return (
        <svg {...shared}>
          <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
          <circle cx="12" cy="13" r="3.2" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...shared}>
          <path d="M12 16V4m-5 5 5-5 5 5" />
          <path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...shared}>
          <path
            d="M12 3 19 6v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6z"
            fill="#0865e7"
            stroke="none"
          />
          <path
            d="m9.5 12 1.7 1.7 3.5-3.5"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );
  }
}

export function Settings() {
  const { request, download, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    theme: readThemePreference(user?.id) ?? defaultSettings.theme,
  }));
  const [profile, setProfile] = useState<Profile>({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
  });
  const [savedDashboard, setSavedDashboard] = useState(
    defaultSettings.defaultDashboard,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [profileModalMounted, setProfileModalMounted] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    full_name: '',
    email: user?.email ?? '',
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [selectedPhotoPreviewUrl, setSelectedPhotoPreviewUrl] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileToast, setProfileToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const selectedPhotoPreviewRef = useRef('');
  const modalCloseTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const locale = settings.language === 'fil' ? 'fil-PH' : 'en-US';
  const timeZone = {
    '(UTC+08:00) Manila': 'Asia/Manila',
    '(UTC+00:00) UTC': 'UTC',
    '(UTC-05:00) Eastern Time': 'America/New_York',
  }[settings.timeZone];
  const now = new Date();
  const previewDateParts = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const dateParts = Object.fromEntries(
    previewDateParts.map(({ type, value }) => [type, value]),
  );
  const previewDate =
    settings.dateFormat === 'DD/MM/YYYY'
      ? `${dateParts.day}/${dateParts.month}/${dateParts.year}`
      : settings.dateFormat === 'YYYY-MM-DD'
        ? `${dateParts.year}-${dateParts.month}-${dateParts.day}`
        : `${dateParts.month}/${dateParts.day}/${dateParts.year}`;
  const previewTime = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: settings.timeFormat === '12-hour (AM/PM)',
  }).format(now);

  const loadSettings = useCallback(async () => {
    try {
      const result = await request<SettingsResponse>('/api/settings');
      if (!result.data?.profile || !result.data?.preferences) {
        throw new Error('The server returned invalid account settings.');
      }
      setProfile(result.data.profile);
      setSettings((current) => ({
        ...current,
        ...result.data.preferences,
        notifications: {
          ...current.notifications,
          ...(result.data.preferences.notifications ?? {}),
        },
      }));
      if (
        result.data.preferences.theme === 'light' ||
        result.data.preferences.theme === 'dark' ||
        result.data.preferences.theme === 'system'
      ) {
        saveThemePreference(user?.id, result.data.preferences.theme);
      }
      setSavedDashboard(
        result.data.preferences.defaultDashboard ??
          defaultSettings.defaultDashboard,
      );
      updateUser({
        first_name: result.data.profile.first_name,
        last_name: result.data.profile.last_name,
        email: result.data.profile.email,
      });
    } catch (error) {
      setStatusType('error');
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Account settings could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [request, updateUser, user?.id]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    let active = true;
    let photoUrl = '';
    if (!user?.profile_photo) {
      setProfilePhotoUrl('');
      return;
    }

    void download('/api/settings/profile-photo')
      .then((blob) => {
        if (!active || blob.size === 0) return;
        photoUrl = URL.createObjectURL(blob);
        setProfilePhotoUrl(photoUrl);
      })
      .catch((error: unknown) => {
        if (active) {
          setStatusType('error');
          setStatusMessage(
            error instanceof Error
              ? error.message
              : 'The profile picture could not be loaded.',
          );
        }
      });

    return () => {
      active = false;
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [download, user?.profile_photo]);

  useEffect(() => {
    if (!profileModalMounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [profileModalMounted]);

  useEffect(() => {
    if (profileModalVisible) {
      document
        .querySelector<HTMLInputElement>(
          `.${styles.profileModal} input:not([readonly])`,
        )
        ?.focus();
    }
  }, [profileModalVisible]);

  useEffect(
    () => () => {
      if (modalCloseTimerRef.current !== null) {
        window.clearTimeout(modalCloseTimerRef.current);
      }
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (selectedPhotoPreviewRef.current) {
        URL.revokeObjectURL(selectedPhotoPreviewRef.current);
      }
    },
    [],
  );

  function updateSetting<Key extends keyof SettingsState>(
    key: Key,
    value: SettingsState[Key],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
    setStatusMessage('');
    setStatusType('success');
  }

  function showProfileToast(type: 'success' | 'error', message: string) {
    setProfileToast({ type, message });
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(
      () => setProfileToast(null),
      4200,
    );
  }

  const releaseSelectedPhotoPreview = useCallback(() => {
    if (selectedPhotoPreviewRef.current) {
      URL.revokeObjectURL(selectedPhotoPreviewRef.current);
      selectedPhotoPreviewRef.current = '';
    }
    setSelectedPhotoPreviewUrl('');
    setSelectedPhoto(null);
  }, []);

  function openProfileModal() {
    if (modalCloseTimerRef.current !== null) {
      window.clearTimeout(modalCloseTimerRef.current);
      modalCloseTimerRef.current = null;
    }
    releaseSelectedPhotoPreview();
    setProfileDraft({
      full_name: [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(' '),
      email: profile.email,
    });
    setProfileError('');
    setProfileModalMounted(true);
    window.requestAnimationFrame(() => setProfileModalVisible(true));
  }

  const closeProfileModal = useCallback(
    (force = false) => {
      if (profileSaving) return;
      const currentFullName = [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(' ');
      const hasUnsavedChanges =
        profileDraft.full_name.trim() !== currentFullName ||
        profileDraft.email.trim() !== profile.email ||
        selectedPhoto !== null;
      if (
        !force &&
        hasUnsavedChanges &&
        !window.confirm('Discard your unsaved profile changes?')
      ) {
        return;
      }
      releaseSelectedPhotoPreview();
      setProfileModalVisible(false);
      modalCloseTimerRef.current = window.setTimeout(() => {
        setProfileModalMounted(false);
        modalCloseTimerRef.current = null;
      }, 190);
    },
    [
      profile,
      profileDraft,
      profileSaving,
      releaseSelectedPhotoPreview,
      selectedPhoto,
    ],
  );

  useEffect(() => {
    if (!profileModalMounted || profileSaving) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeProfileModal();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeProfileModal, profileModalMounted, profileSaving]);

  function selectProfilePhoto(file?: File) {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (
      !['jpg', 'jpeg', 'png'].includes(extension ?? '') ||
      (file.type && !['image/jpeg', 'image/png'].includes(file.type))
    ) {
      setProfileError('Choose a JPG, JPEG, or PNG image.');
      return;
    }
    if (file.size === 0 || file.size > 2 * 1024 * 1024) {
      setProfileError('The profile picture must be no larger than 2 MB.');
      return;
    }
    releaseSelectedPhotoPreview();
    const previewUrl = URL.createObjectURL(file);
    selectedPhotoPreviewRef.current = previewUrl;
    setSelectedPhoto(file);
    setSelectedPhotoPreviewUrl(previewUrl);
    setProfileError('');
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;

    const fullName = profileDraft.full_name.trim().replace(/\s+/g, ' ');
    const nameParts = fullName.split(' ');
    if (nameParts.length < 2) {
      setProfileError('Enter your first and last name.');
      return;
    }
    const [first_name, ...lastNameParts] = nameParts;
    const last_name = lastNameParts.join(' ');
    setProfileSaving(true);
    setProfileError('');
    try {
      const payload = new FormData();
      payload.append('first_name', first_name);
      payload.append('last_name', last_name);
      payload.append('email', profileDraft.email.trim());
      if (selectedPhoto) payload.append('profile_photo', selectedPhoto);

      const response = await request<ProfilePhotoResponse>(
        '/api/settings/profile-photo',
        {
          method: 'POST',
          body: payload,
        },
      );
      if (!response.data?.profile) {
        throw new Error('The server did not confirm the profile update.');
      }

      setProfile({
        first_name: response.data.profile.first_name,
        last_name: response.data.profile.last_name,
        email: response.data.profile.email,
      });
      updateUser({
        first_name: response.data.profile.first_name,
        last_name: response.data.profile.last_name,
        email: response.data.profile.email,
        profile_photo: response.data.profile.profile_photo,
      });
      releaseSelectedPhotoPreview();
      showProfileToast('success', 'Your profile was updated successfully.');
      setProfileModalVisible(false);
      modalCloseTimerRef.current = window.setTimeout(() => {
        setProfileModalMounted(false);
        modalCloseTimerRef.current = null;
      }, 190);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Your profile could not be saved. Please try again.';
      setProfileError(message);
      showProfileToast('error', message);
    } finally {
      setProfileSaving(false);
    }
  }

  function updateNotification(
    key: keyof SettingsState['notifications'],
    enabled: boolean,
  ) {
    setSettings((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: enabled },
    }));
    setStatusMessage('');
    setStatusType('success');
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const response = await request<SettingsResponse>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          profile: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
          },
          settings,
        }),
      });
      if (!response.data?.profile || !response.data?.preferences) {
        throw new Error(
          'The server did not confirm the account settings update.',
        );
      }
      const savedTheme = response.data.preferences.theme;
      if (
        savedTheme === 'light' ||
        savedTheme === 'dark' ||
        savedTheme === 'system'
      ) {
        saveThemePreference(user?.id, savedTheme);
      } else {
        saveThemePreference(user?.id, settings.theme);
      }
      updateUser({
        first_name: response.data.profile.first_name,
        last_name: response.data.profile.last_name,
        email: response.data.profile.email,
      });
      const dashboardPaths: Record<string, string> = {
        'MSWDO Dashboard': routePaths.mswdoAdmin,
        'Child Development Centers': routePaths.childDevelopmentCenters,
        'Enrollment Management': routePaths.enrollmentManagement,
        'Reports and Analytics': routePaths.reportsAnalytics,
      };
      setStatusType('success');
      setStatusMessage(
        'Your profile and preferences were saved to your account.',
      );
      if (
        settings.defaultDashboard !== savedDashboard &&
        dashboardPaths[settings.defaultDashboard]
      ) {
        navigate(dashboardPaths[settings.defaultDashboard]);
      }
      setSavedDashboard(settings.defaultDashboard);
    } catch (error) {
      setStatusType('error');
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Account settings could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applySettings = () => {
      applyThemePreference(settings.theme);
      document.documentElement.dataset.dateFormat = settings.dateFormat;
      document.documentElement.dataset.timeFormat = settings.timeFormat;
      document.documentElement.dataset.timeZone = timeZone;
    };
    applySettings();
    document.documentElement.lang = settings.language;
    if (settings.theme !== 'system') return;
    media.addEventListener('change', applySettings);
    return () => media.removeEventListener('change', applySettings);
  }, [
    settings.dateFormat,
    settings.language,
    settings.theme,
    settings.timeFormat,
    timeZone,
  ]);

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'sun' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'system', label: 'System (Auto)', icon: 'system' },
  ];

  const roleLabel =
    user?.role === 'admin'
      ? 'MSWDO Administrator'
      : user?.role === 'teacher'
        ? 'Teacher'
        : 'Parent';

  return (
    <>
      <section aria-busy={loading || saving} className={styles.page}>
        <header className={styles.pageHeader}>
          <span aria-hidden="true" className={styles.titleIcon}>
            <Icon name="settings" />
          </span>
          <div>
            <h1>Settings</h1>
            <p>Customize your account preferences and system settings.</p>
          </div>
        </header>

        <div className={styles.topGrid}>
          <section
            aria-labelledby="account-information-title"
            className={`${styles.card} ${styles.accountCard}`}
          >
            <div className={styles.cardHeader}>
              <span className={styles.sectionIcon}>
                <Icon name="account" />
              </span>
              <h2 id="account-information-title">Account Information</h2>
            </div>
            <div className={styles.accountContent}>
              <div aria-hidden="true" className={styles.avatar}>
                {profilePhotoUrl ? (
                  <img alt="" src={profilePhotoUrl} />
                ) : (
                  profile.first_name.trim().charAt(0).toUpperCase() || 'A'
                )}
              </div>
              <div className={styles.accountDetails}>
                <strong>
                  {[profile.first_name, profile.last_name]
                    .filter(Boolean)
                    .join(' ')}
                </strong>
                <span>{profile.email}</span>
                <span>{roleLabel}</span>
                <button
                  className={styles.editButton}
                  onClick={openProfileModal}
                  type="button"
                >
                  <Icon name="edit" />
                  Edit Profile
                </button>
              </div>
            </div>
            <p className={styles.localNote}>
              Profile details are loaded from and saved to your account.
            </p>
          </section>

          <section
            aria-labelledby="language-title"
            className={`${styles.card} ${styles.languageCard}`}
          >
            <div className={styles.cardHeader}>
              <span className={styles.sectionIcon}>
                <Icon name="globe" />
              </span>
              <h2 id="language-title">Language</h2>
            </div>
            <p className={styles.cardDescription}>
              Select your preferred language for the system.
            </p>
            <label className={styles.selectField}>
              <span className={styles.languageIcon}>
                <Icon name="globe" />
              </span>
              <span className={styles.visuallyHidden}>Preferred language</span>
              <select
                onChange={(event) =>
                  updateSetting('language', event.target.value as Language)
                }
                value={settings.language}
              >
                <option value="en-US">English (United States)</option>
                <option value="fil">Filipino</option>
              </select>
              <Icon name="chevron" />
            </label>
            <p className={styles.helperText}>
              Language selection will apply where translations are available.
            </p>
          </section>

          <section
            aria-labelledby="theme-title"
            className={`${styles.card} ${styles.themeCard}`}
          >
            <div className={styles.cardHeader}>
              <span className={styles.sectionIcon}>
                <Icon name="palette" />
              </span>
              <h2 id="theme-title">Theme</h2>
            </div>
            <p className={styles.cardDescription}>
              Choose your preferred appearance.
            </p>
            <div aria-label="Appearance theme" className={styles.themeOptions}>
              {themes.map((theme) => (
                <button
                  aria-pressed={settings.theme === theme.value}
                  className={`${styles.themeOption} ${settings.theme === theme.value ? styles.selectedTheme : ''}`}
                  key={theme.value}
                  onClick={() => updateSetting('theme', theme.value)}
                  type="button"
                >
                  {settings.theme === theme.value && (
                    <span aria-hidden="true" className={styles.themeCheck}>
                      <Icon name="check" />
                    </span>
                  )}
                  <Icon name={theme.icon} />
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.bottomGrid}>
          <section
            aria-labelledby="notification-preferences-title"
            className={`${styles.card} ${styles.notificationCard}`}
          >
            <div className={styles.cardHeader}>
              <span className={styles.sectionIcon}>
                <Icon name="bell" />
              </span>
              <div>
                <h2 id="notification-preferences-title">
                  Notification Preferences
                </h2>
                <p>Manage how you want to receive notifications and alerts.</p>
              </div>
            </div>
            <div className={styles.preferenceList}>
              {notificationOptions.map((option) => (
                <div className={styles.preferenceRow} key={option.key}>
                  <span className={styles.preferenceIcon}>
                    <Icon name={option.icon} />
                  </span>
                  <span className={styles.preferenceCopy}>
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </span>
                  <button
                    aria-checked={settings.notifications[option.key]}
                    aria-label={option.title}
                    className={`${styles.switch} ${settings.notifications[option.key] ? styles.switchOn : ''}`}
                    onClick={() =>
                      updateNotification(
                        option.key,
                        !settings.notifications[option.key],
                      )
                    }
                    role="switch"
                    type="button"
                  >
                    <span />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="system-preferences-title"
            className={`${styles.card} ${styles.systemCard}`}
          >
            <div className={styles.cardHeader}>
              <span className={styles.sectionIcon}>
                <Icon name="sliders" />
              </span>
              <div>
                <h2 id="system-preferences-title">System Preferences</h2>
                <p>Configure additional system settings.</p>
              </div>
            </div>

            <div className={styles.systemOptions}>
              <label className={styles.systemRow}>
                <span className={styles.preferenceIcon}>
                  <Icon name="calendar" />
                </span>
                <span>Date Format</span>
                <select
                  onChange={(event) =>
                    updateSetting('dateFormat', event.target.value)
                  }
                  value={settings.dateFormat}
                >
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </label>
              <label className={styles.systemRow}>
                <span className={styles.preferenceIcon}>
                  <Icon name="bell" />
                </span>
                <span>Time Format</span>
                <select
                  onChange={(event) =>
                    updateSetting('timeFormat', event.target.value)
                  }
                  value={settings.timeFormat}
                >
                  <option>12-hour (AM/PM)</option>
                  <option>24-hour</option>
                </select>
              </label>
              <label className={styles.systemRow}>
                <span className={styles.preferenceIcon}>
                  <Icon name="globe" />
                </span>
                <span>Time Zone</span>
                <select
                  onChange={(event) =>
                    updateSetting('timeZone', event.target.value)
                  }
                  value={settings.timeZone}
                >
                  <option>(UTC+08:00) Manila</option>
                  <option>(UTC+00:00) UTC</option>
                  <option>(UTC-05:00) Eastern Time</option>
                </select>
              </label>
              <label className={styles.systemRow}>
                <span className={styles.preferenceIcon}>
                  <Icon name="account" />
                </span>
                <span>Default Dashboard</span>
                <select
                  onChange={(event) =>
                    updateSetting('defaultDashboard', event.target.value)
                  }
                  value={settings.defaultDashboard}
                >
                  <option>MSWDO Dashboard</option>
                  <option>Child Development Centers</option>
                  <option>Enrollment Management</option>
                  <option>Reports and Analytics</option>
                </select>
              </label>
            </div>
            <p className={styles.preferencePreview}>
              Preview: {previewDate} · {previewTime} ({settings.timeZone})
            </p>

            <div className={styles.saveArea}>
              <p
                aria-live="polite"
                className={
                  statusType === 'error'
                    ? styles.errorStatus
                    : styles.successStatus
                }
              >
                <Icon name={statusType === 'error' ? 'alert' : 'check'} />
                {statusMessage ||
                  (loading ? (
                    <BouncingDots label="Loading your account settings" />
                  ) : (
                    'Changes are saved to your account when you select Save Changes.'
                  ))}
              </p>
              <button
                className={styles.saveButton}
                onClick={saveSettings}
                disabled={loading || saving}
                type="button"
              >
                <Icon name="save" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </section>
        </div>
      </section>
      {profileModalMounted && (
        <div
          className={`${styles.modalBackdrop} ${profileModalVisible ? styles.modalBackdropVisible : styles.modalBackdropClosing}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeProfileModal();
          }}
        >
          <section
            aria-labelledby="edit-profile-title"
            aria-modal="true"
            className={`${styles.profileModal} ${profileModalVisible ? styles.profileModalVisible : styles.profileModalClosing}`}
            role="dialog"
          >
            <header className={styles.profileModalHeader}>
              <span className={styles.profileModalTitleIcon}>
                <Icon name="account" />
              </span>
              <h2 id="edit-profile-title">Edit Profile</h2>
              <button
                aria-label="Close edit profile"
                className={styles.modalCloseButton}
                disabled={profileSaving}
                onClick={() => closeProfileModal()}
                type="button"
              >
                <Icon name="close" />
              </button>
            </header>
            <form
              aria-busy={profileSaving}
              className={styles.profileForm}
              onSubmit={saveProfile}
            >
              <div className={styles.profileInfoNotice}>
                <Icon name="info" />
                <span>Update your profile information below.</span>
              </div>

              <div className={styles.pictureEditor}>
                <div
                  aria-hidden="true"
                  className={styles.profilePicturePreview}
                >
                  {selectedPhotoPreviewUrl || profilePhotoUrl ? (
                    <img
                      alt=""
                      src={selectedPhotoPreviewUrl || profilePhotoUrl}
                    />
                  ) : (
                    <span>
                      {profileDraft.full_name.trim().charAt(0).toUpperCase() ||
                        'A'}
                    </span>
                  )}
                </div>
                <button
                  aria-label="Change profile picture"
                  className={styles.cameraButton}
                  disabled={profileSaving}
                  onClick={() => photoInputRef.current?.click()}
                  type="button"
                >
                  <Icon name="camera" />
                </button>
                <button
                  className={styles.uploadArea}
                  disabled={profileSaving}
                  onClick={() => photoInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    selectProfilePhoto(event.dataTransfer.files[0]);
                  }}
                  type="button"
                >
                  <Icon name="upload" />
                  <span className={styles.uploadCopy}>
                    <strong>Change Profile Picture</strong>
                    <small>Click to upload or drag and drop</small>
                    <small>(JPG, PNG, up to 2MB)</small>
                  </span>
                </button>
                <input
                  ref={photoInputRef}
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className={styles.hiddenFileInput}
                  onChange={(event) => {
                    selectProfilePhoto(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                  type="file"
                />
              </div>

              <label className={styles.modalField}>
                <span>Full Name</span>
                <span className={styles.modalInputWrap}>
                  <Icon name="account" />
                  <input
                    autoComplete="name"
                    maxLength={201}
                    onChange={(event) => {
                      setProfileDraft((current) => ({
                        ...current,
                        full_name: event.target.value,
                      }));
                      setProfileError('');
                    }}
                    required
                    value={profileDraft.full_name}
                  />
                </span>
              </label>
              <label className={styles.modalField}>
                <span>Email Address</span>
                <span className={styles.modalInputWrap}>
                  <Icon name="mail" />
                  <input
                    autoComplete="email"
                    maxLength={255}
                    onChange={(event) => {
                      setProfileDraft((current) => ({
                        ...current,
                        email: event.target.value,
                      }));
                      setProfileError('');
                    }}
                    required
                    type="email"
                    value={profileDraft.email}
                  />
                </span>
              </label>
              <label className={styles.modalField}>
                <span>Role</span>
                <span
                  className={`${styles.modalInputWrap} ${styles.readOnlyField}`}
                >
                  <Icon name="shield" />
                  <input aria-readonly="true" readOnly value={roleLabel} />
                  <Icon name="chevron" />
                </span>
              </label>

              {profileError && (
                <p aria-live="assertive" className={styles.profileFormError}>
                  {profileError}
                </p>
              )}

              <footer className={styles.profileModalFooter}>
                <button
                  className={styles.cancelProfileButton}
                  disabled={profileSaving}
                  onClick={() => closeProfileModal()}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={styles.saveProfileButton}
                  disabled={profileSaving}
                  type="submit"
                >
                  {profileSaving ? (
                    <span
                      aria-hidden="true"
                      className={styles.profileSpinner}
                    />
                  ) : (
                    <Icon name="save" />
                  )}
                  {profileSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {profileToast && (
        <div
          aria-live="polite"
          className={`${styles.profileToast} ${profileToast.type === 'error' ? styles.profileToastError : ''}`}
          role="status"
        >
          <span className={styles.toastIcon}>
            <Icon name={profileToast.type === 'success' ? 'check' : 'alert'} />
          </span>
          {profileToast.message}
        </div>
      )}
    </>
  );
}
