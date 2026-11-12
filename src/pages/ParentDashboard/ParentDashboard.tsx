import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BouncingDots } from '../../components/animations/BouncingDots';
import { routePaths } from '../../constants/app-constants';
import childrenBanner from '../../assets/images/children-banner.png';
import styles from './ParentDashboard.module.css';
import { Avatar } from '../../components/common/Avatar/Avatar';
import { Logo } from '../../components/common/Logo/Logo';
import { LogoutConfirmation } from '../../components/common/LogoutConfirmation/LogoutConfirmation';
import { ParentActivities } from '../ParentActivities/ParentActivities';
import { ParentEnrollment } from '../ParentEnrollment/ParentEnrollment';
import { ParentApplicationStatus } from '../ParentApplicationStatus/ParentApplicationStatus';
import { ParentChildren } from '../ParentChildren/ParentChildren';
import { ParentAttendance } from '../ParentAttendance/ParentAttendance';
import { ParentProgress } from '../ParentProgress/ParentProgress';
import { ParentAnnouncements } from '../ParentAnnouncements/ParentAnnouncements';
import { EventsPage } from '../Events/EventsPage';
import { useAuth } from '../../auth/AuthProvider';
import { useAnnouncementFeed } from '../../hooks/useAnnouncementFeed';
import { useNotificationCount } from '../../hooks/useNotificationCount';

const navigation = [
  { label: 'Dashboard', path: routePaths.parentDashboard, icon: 'home' },
  { label: 'Events', path: routePaths.parentEvents, icon: 'calendar' },
  {
    label: 'Activities & Assignments',
    path: routePaths.parentActivities,
    icon: 'tasks',
  },
  {
    label: 'Apply for Enrollment',
    path: routePaths.parentEnrollment,
    icon: 'file',
  },
  {
    label: 'Application Status',
    path: routePaths.parentApplicationStatus,
    icon: 'status',
  },
  {
    label: 'Child / Children',
    path: routePaths.parentChildren,
    icon: 'children',
  },
  {
    label: 'Attendance Updates',
    path: routePaths.parentAttendance,
    icon: 'calendar',
  },
  {
    label: 'Child Progress',
    path: routePaths.parentProgress,
    icon: 'chart',
  },
  {
    label: 'Announcements & Notifications',
    path: routePaths.parentAnnouncements,
    icon: 'bell',
  },
  { label: 'Profile', path: routePaths.parentProfile, icon: 'profile' },
];

type DashboardChild = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  nickname: string | null;
  birth_date: string;
  gender: string | null;
  enrollment_status: 'pending' | 'enrolled' | 'withdrawn';
  class_name: string | null;
};

type DashboardActivity = {
  id: number;
  title: string;
  due_at: string | null;
  published_at: string;
  child_id: number;
  child_name: string;
  submission_status: 'assigned' | 'submitted' | 'reviewed';
};

type DashboardAttendance = {
  child_id: number;
  child_name: string;
  record_count: number;
  present_count: number;
  period_start: string;
  period_end: string;
};

type DashboardProgress = {
  child_id: number;
  child_name: string;
  score: number | null;
  record_count: number;
};

type ParentDashboardData = {
  children: DashboardChild[];
  activities: DashboardActivity[];
  upcoming_activity_count: number;
  attendance: DashboardAttendance[];
  progress: DashboardProgress[];
  enrollment_count: number;
};

type DashboardChildCard = {
  id: number;
  name: string;
  age: string;
  birthday: string;
  gender: string;
  className: string;
  status: string;
  imagePosition: string;
};

type DashboardActivityRow = {
  id: number;
  title: string;
  child: string;
  due: string;
  status: string;
  icon: string;
  color: string;
};

type DashboardAttendanceRow = {
  id: number;
  child: string;
  period: string;
  status: string;
  imagePosition: string;
};

type DashboardProgressRow = {
  id: number;
  child: string;
  score: number;
  hasRecords: boolean;
  imagePosition: string;
};

type DashboardAnnouncement = {
  id: number;
  title: string;
  date: string;
  sender: string;
  color: 'orange' | 'green' | 'purple' | 'red';
};

type ParentProfileData = {
  name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  contactEmail: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  relationship: string;
  address: string;
  emergencyContact: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  householdIncome: string;
  preferredLanguage: string;
  referralSource: string;
  username: string;
  accountStatus: string;
};

type ParentProfileDraft = {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  relationship: string;
  address: string;
  contact_email: string;
  emergency_name: string;
  emergency_relationship: string;
  emergency_phone: string;
  household_income: string;
  preferred_language: string;
  referral_source: string;
};

const profileEditFields: {
  key: keyof ParentProfileDraft;
  label: string;
  type?: string;
}[] = [
  { key: 'first_name', label: 'First Name' },
  { key: 'middle_name', label: 'Middle Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Account Email', type: 'email' },
  { key: 'phone', label: 'Contact Number', type: 'tel' },
  { key: 'birth_date', label: 'Date of Birth', type: 'date' },
  { key: 'gender', label: 'Gender' },
  { key: 'relationship', label: 'Relationship to Child' },
  { key: 'address', label: 'Residential Address' },
  { key: 'contact_email', label: 'Contact Email', type: 'email' },
  { key: 'emergency_name', label: 'Emergency Contact Name' },
  { key: 'emergency_relationship', label: 'Emergency Contact Relationship' },
  { key: 'emergency_phone', label: 'Emergency Contact Number', type: 'tel' },
  { key: 'household_income', label: 'Household Income Range' },
  { key: 'preferred_language', label: 'Preferred Language' },
  { key: 'referral_source', label: 'Referral Source' },
];

const initialProfile: ParentProfileData = {
  name: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  contactEmail: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  relationship: '',
  address: '',
  emergencyContact: '',
  emergencyRelationship: '',
  emergencyPhone: '',
  householdIncome: '',
  preferredLanguage: '',
  referralSource: '',
  username: '',
  accountStatus: '',
};

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
    case 'home':
      return (
        <svg {...shared}>
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'tasks':
      return (
        <svg {...shared}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 3.5h6v3H9zm-1 8 2 2 4-4m-6 8h7" />
        </svg>
      );
    case 'file':
      return (
        <svg {...shared}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8m-8 4h8" />
        </svg>
      );
    case 'status':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'children':
      return (
        <svg {...shared}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-1a6 6 0 0 1 12 0v1zm12-14a3 3 0 0 1 0 6m2 3a5 5 0 0 1 4 5" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18m4 4h.01" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...shared}>
          <path d="M4 20v-7h4v7zm6 0V4h4v16zm6 0v-10h4v10z" />
        </svg>
      );
    case 'megaphone':
      return (
        <svg {...shared}>
          <path d="m3 11 18-7v16L3 13zm0 0v2a3 3 0 0 0 3 3h2l2 4h3l-2-5" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...shared}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...shared}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case 'close':
      return (
        <svg {...shared}>
          <path d="m6 6 12 12M18 6 6 18" />
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
    case 'eye':
      return (
        <svg {...shared}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...shared}>
          <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5m4-4 4-4-4-4m4 4H9" />
        </svg>
      );
    case 'search':
      return (
        <svg {...shared}>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...shared}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...shared}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );
    case 'childrenSmall':
      return (
        <svg {...shared}>
          <circle cx="12" cy="8" r="3" />
          <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        </svg>
      );
    case 'palette':
      return (
        <svg {...shared}>
          <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.7-3.1 1.8 1.8 0 0 1 1.5-2.8H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z" />
          <path d="M7.5 10h.01M10 7h.01m5 0h.01m2.5 4h.01" />
        </svg>
      );
    case 'book':
      return (
        <svg {...shared}>
          <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22zm18 0A2.5 2.5 0 0 0 18.5 3H12v17h6.5A2.5 2.5 0 0 1 21 22z" />
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
    case 'location':
      return (
        <svg {...shared}>
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
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

function PanelHeading({
  title,
  icon,
  action,
  onAction,
}: {
  title: string;
  icon: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <header className={styles.panelHeading}>
      <Icon name={icon} />
      <h2>{title}</h2>
      {action && (
        <button type="button" onClick={onAction}>
          {action} <Icon name="arrow" />
        </button>
      )}
    </header>
  );
}

function calculateAge(birthDate: string) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getUTCFullYear() - year;
  if (
    today.getUTCMonth() + 1 < month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() < day)
  ) {
    age -= 1;
  }
  return Math.max(0, age);
}

function formatDashboardDate(date: string) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

export function ParentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { request, logout, updateUser } = useAuth();
  const unreadNotifications = useNotificationCount();
  const {
    announcements: announcementFeed,
    loading: announcementsLoading,
    error: announcementsError,
  } = useAnnouncementFeed();
  const [search, setSearch] = useState('');
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [profileError, setProfileError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ParentProfileDraft>({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: '',
    relationship: '',
    address: '',
    contact_email: '',
    emergency_name: '',
    emergency_relationship: '',
    emergency_phone: '',
    household_income: '',
    preferred_language: '',
    referral_source: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [dashboardData, setDashboardData] = useState<ParentDashboardData>({
    children: [],
    activities: [],
    upcoming_activity_count: 0,
    attendance: [],
    progress: [],
    enrollment_count: 0,
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  async function handleLogout() {
    setIsLogoutDialogOpen(false);
    setIsNavigationOpen(false);
    try {
      await logout();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Could not complete sign out.',
      );
    } finally {
      navigate(routePaths.login, { replace: true });
    }
  }

  const announcements = useMemo<DashboardAnnouncement[]>(
    () =>
      announcementFeed.map((announcement) => {
        const publishedAt = new Date(
          announcement.published_at.replace(' ', 'T'),
        );
        return {
          id: announcement.id,
          title: announcement.title,
          date: publishedAt.toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          sender:
            announcement.created_by ||
            (announcement.created_by_role === 'teacher'
              ? 'Teacher'
              : announcement.created_by_role === 'parent'
                ? 'Parent'
                : 'MSWDO Admin'),
          color:
            announcement.created_by_role === 'teacher'
              ? 'green'
              : announcement.created_by_role === 'parent'
                ? 'purple'
                : 'orange',
        };
      }),
    [announcementFeed],
  );
  useEffect(() => {
    let active = true;
    const loadProfile = () =>
      request<{
        user: {
          username: string;
          email: string;
          first_name: string;
          middle_name?: string | null;
          last_name: string;
          phone: string;
        };
        parent_profile: {
          birth_date: string | null;
          gender: string | null;
          relationship: string | null;
          address: string | null;
          barangay: string | null;
          municipality: string | null;
          province: string | null;
          contact_email: string | null;
          emergency_name: string | null;
          emergency_relationship: string | null;
          emergency_phone: string | null;
          household_income: string | null;
          preferred_language: string | null;
          referral_source: string | null;
        } | null;
      }>('/api/me')
        .then(({ user: account, parent_profile: parent }) => {
          if (!active) return;
          const fullAddress =
            parent?.address ||
            [parent?.barangay, parent?.municipality, parent?.province]
              .filter(Boolean)
              .join(', ');
          setProfile({
            ...initialProfile,
            name: [account.first_name, account.middle_name, account.last_name]
              .filter(Boolean)
              .join(' '),
            firstName: account.first_name,
            middleName: account.middle_name ?? '',
            lastName: account.last_name,
            email: account.email,
            contactEmail: parent?.contact_email ?? '',
            phone: account.phone ?? '',
            dateOfBirth: parent?.birth_date ?? '',
            gender: parent?.gender ?? '',
            relationship: parent?.relationship ?? '',
            address: fullAddress,
            emergencyContact: parent?.emergency_name ?? '',
            emergencyRelationship: parent?.emergency_relationship ?? '',
            emergencyPhone: parent?.emergency_phone ?? '',
            householdIncome: parent?.household_income ?? '',
            preferredLanguage: parent?.preferred_language ?? '',
            referralSource: parent?.referral_source ?? '',
            username: account.username,
            accountStatus: 'Active',
          });
          setProfileError('');
        })
        .catch((error: unknown) => {
          if (!active) return;
          setProfileError(
            error instanceof Error
              ? error.message
              : 'Could not load parent profile information.',
          );
        });
    const refreshProfileWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadProfile();
    };
    void loadProfile();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadProfile();
    }, 30_000);
    window.addEventListener('focus', refreshProfileWhenVisible);
    document.addEventListener('visibilitychange', refreshProfileWhenVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshProfileWhenVisible);
      document.removeEventListener(
        'visibilitychange',
        refreshProfileWhenVisible,
      );
    };
  }, [request]);
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileNotice('');
    try {
      await request('/api/parent/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileDraft),
      });
      const fullName = [
        profileDraft.first_name,
        profileDraft.middle_name,
        profileDraft.last_name,
      ]
        .filter(Boolean)
        .join(' ');
      setProfile((current) => ({
        ...current,
        name: fullName,
        firstName: profileDraft.first_name,
        middleName: profileDraft.middle_name,
        lastName: profileDraft.last_name,
        email: profileDraft.email,
        contactEmail: profileDraft.contact_email,
        phone: profileDraft.phone,
        dateOfBirth: profileDraft.birth_date,
        gender: profileDraft.gender,
        relationship: profileDraft.relationship,
        address: profileDraft.address,
        emergencyContact: profileDraft.emergency_name,
        emergencyRelationship: profileDraft.emergency_relationship,
        emergencyPhone: profileDraft.emergency_phone,
        householdIncome: profileDraft.household_income,
        preferredLanguage: profileDraft.preferred_language,
        referralSource: profileDraft.referral_source,
      }));
      updateUser({
        first_name: profileDraft.first_name,
        middle_name: profileDraft.middle_name,
        last_name: profileDraft.last_name,
        email: profileDraft.email,
        phone: profileDraft.phone,
      });
      setIsEditingProfile(false);
      setProfileNotice('Your profile was saved.');
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : 'Parent profile could not be saved.',
      );
    } finally {
      setProfileSaving(false);
    }
  }
  useEffect(() => {
    let active = true;
    let hasLoaded = false;
    const loadDashboard = () => {
      if (!hasLoaded) setDashboardLoading(true);
      void request<{ data: ParentDashboardData }>('/api/parent/dashboard')
        .then(({ data }) => {
          if (!active) return;
          setDashboardData(data);
          setDashboardError('');
        })
        .catch((error: unknown) => {
          if (!active) return;
          setDashboardError(
            error instanceof Error
              ? error.message
              : 'Parent dashboard data could not be loaded.',
          );
        })
        .finally(() => {
          if (active) {
            hasLoaded = true;
            setDashboardLoading(false);
          }
        });
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadDashboard();
    };
    loadDashboard();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadDashboard();
    }, 30_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [request]);
  const currentPath =
    location.pathname === '/parent'
      ? routePaths.parentDashboard
      : location.pathname === routePaths.parentNotifications
        ? routePaths.parentAnnouncements
        : location.pathname;
  const activeItem =
    navigation.find((item) => item.path === currentPath) ?? navigation[0];
  const isDashboard = currentPath === routePaths.parentDashboard;
  const dashboardChildren = useMemo<DashboardChildCard[]>(
    () =>
      dashboardData.children.map((child, index) => {
        const age = calculateAge(child.birth_date);
        return {
          id: child.id,
          name: [child.first_name, child.middle_name, child.last_name]
            .filter(Boolean)
            .join(' '),
          age: `${age} ${age === 1 ? 'year' : 'years'} old`,
          birthday: formatDashboardDate(child.birth_date),
          gender: child.gender || 'Not provided',
          className: child.class_name || 'Not assigned',
          status: child.enrollment_status.replace(/^\w/, (letter) =>
            letter.toUpperCase(),
          ),
          imagePosition: index % 2 === 0 ? '72% 52%' : '82% 52%',
        };
      }),
    [dashboardData.children],
  );
  const dashboardActivities = useMemo<DashboardActivityRow[]>(
    () =>
      dashboardData.activities.map((activity, index) => ({
        id: activity.id,
        title: activity.title,
        child: activity.child_name,
        due: activity.due_at
          ? formatDashboardDate(activity.due_at.slice(0, 10))
          : 'No due date',
        status: activity.submission_status.replace(/^\w/, (letter) =>
          letter.toUpperCase(),
        ),
        icon: index % 2 === 0 ? 'palette' : 'file',
        color: index % 2 === 0 ? 'blue' : 'green',
      })),
    [dashboardData.activities],
  );
  const dashboardAttendance = useMemo<DashboardAttendanceRow[]>(
    () =>
      dashboardData.attendance.map((record, index) => ({
        id: record.child_id,
        child: record.child_name,
        period: `${formatDashboardDate(record.period_start)} – ${formatDashboardDate(record.period_end)}`,
        status: `${record.present_count}/${record.record_count} present`,
        imagePosition: index % 2 === 0 ? '72% 52%' : '82% 52%',
      })),
    [dashboardData.attendance],
  );
  const dashboardProgress = useMemo<DashboardProgressRow[]>(
    () =>
      dashboardData.progress.map((record, index) => ({
        id: record.child_id,
        child: record.child_name,
        score: record.score ?? 0,
        hasRecords: record.record_count > 0,
        imagePosition: index % 2 === 0 ? '72% 52%' : '82% 52%',
      })),
    [dashboardData.progress],
  );
  const filteredActivities = useMemo(
    () =>
      dashboardActivities.filter((item) =>
        `${item.title} ${item.child} ${item.status}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [dashboardActivities, search],
  );
  const filteredAnnouncements = useMemo(
    () =>
      announcements.filter((item) =>
        `${item.title} ${item.sender} ${item.date}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [announcements, search],
  );
  const firstName = profile.name.split(' ')[0] || 'Parent';
  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12
      ? 'Good Morning'
      : greetingHour < 18
        ? 'Good Afternoon'
        : 'Good Evening';

  function contentTitle() {
    if (activeItem.path === routePaths.parentEvents) return 'Events';
    if (activeItem.path === routePaths.parentActivities)
      return 'Activities & Assignments';
    if (activeItem.path === routePaths.parentEnrollment)
      return 'Apply for Enrollment';
    if (activeItem.path === routePaths.parentApplicationStatus)
      return 'Application Status';
    if (activeItem.path === routePaths.parentChildren)
      return 'Child / Children';
    if (activeItem.path === routePaths.parentAttendance)
      return 'Attendance Updates';
    if (activeItem.path === routePaths.parentProgress)
      return 'Child Progress';
    if (activeItem.path === routePaths.parentAnnouncements)
      return 'Announcements & Notifications';
    return 'Profile';
  }

  return (
    <div className={styles.workspace}>
      {isNavigationOpen && (
        <button
          aria-label="Close navigation"
          className={styles.navigationOverlay}
          type="button"
          onClick={() => setIsNavigationOpen(false)}
        />
      )}
      <aside
        aria-label="Parent navigation"
        className={`${styles.sidebar} ${isNavigationOpen ? styles.sidebarOpen : ''}`}
      >
        <button
          aria-label="KalingaLink parent dashboard"
          className={styles.brand}
          type="button"
          onClick={() => navigate(routePaths.parentDashboard)}
        >
          <Logo alt="KalingaLink" variant="sidebar" />
        </button>
        <nav aria-label="Parent workspace">
          {navigation.map((item) => (
            <button
              aria-current={activeItem.path === item.path ? 'page' : undefined}
              className={`${styles.navItem} ${activeItem.path === item.path ? styles.activeNav : ''}`}
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path);
                setIsNavigationOpen(false);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.path === routePaths.parentAnnouncements &&
                unreadNotifications > 0 && (
                <span
                  aria-label={`${unreadNotifications} unread notifications`}
                  className={styles.eventBadge}
                >
                  {unreadNotifications}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          className={styles.logout}
          type="button"
          onClick={() => setIsLogoutDialogOpen(true)}
        >
          <Icon name="logout" />
          <span>Log Out</span>
        </button>
      </aside>
      <LogoutConfirmation
        open={isLogoutDialogOpen}
        onCancel={() => setIsLogoutDialogOpen(false)}
        onConfirm={() => void handleLogout()}
      />

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            aria-expanded={isNavigationOpen}
            aria-label={
              isNavigationOpen ? 'Close navigation' : 'Open navigation'
            }
            className={styles.menuButton}
            type="button"
            onClick={() => setIsNavigationOpen((open) => !open)}
          >
            <Icon name={isNavigationOpen ? 'close' : 'menu'} />
          </button>
          <label className={styles.search}>
            <Icon name="search" />
            <input
              aria-label={
                currentPath === routePaths.parentActivities
                  ? 'Search activities by title, description, subject, or child'
                  : currentPath === routePaths.parentApplicationStatus
                    ? 'Search applications by number or child name'
                    : currentPath === routePaths.parentChildren
                      ? 'Search children by name...'
                      : currentPath === routePaths.parentAttendance
                        ? 'Search by child name, date, or attendance status...'
                        : currentPath === routePaths.parentProgress
                          ? 'Search by child name...'
                          : currentPath === routePaths.parentAnnouncements
                            ? 'Search announcements and notifications...'
                            : 'Search parent dashboard'
              }
              placeholder={
                currentPath === routePaths.parentActivities
                  ? 'Search by activity title, description, or subject...'
                  : currentPath === routePaths.parentApplicationStatus
                    ? 'Search by application number, child name, or reference number...'
                    : currentPath === routePaths.parentChildren
                      ? 'Search by child name...'
                      : currentPath === routePaths.parentAttendance
                        ? 'Search by child name, date, or attendance status...'
                        : currentPath === routePaths.parentProgress
                          ? 'Search by child name...'
                          : currentPath === routePaths.parentAnnouncements
                            ? 'Search announcements and notifications...'
                            : 'Search by name, keyword...'
              }
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className={styles.topActions}>
            <button
              aria-label="Notifications"
              className={styles.bell}
              type="button"
              onClick={() => navigate(routePaths.parentAnnouncements)}
            >
              <Icon name="bell" />
              {unreadNotifications > 0 && (
                <span>{unreadNotifications}</span>
              )}
            </button>
            <button
              className={styles.account}
              type="button"
              onClick={() => navigate(routePaths.parentProfile)}
            >
              <Avatar name={profile.name} size="small" />
              <strong>{profile.name}</strong>
              <span>⌄</span>
            </button>
          </div>
        </header>

        {isDashboard ? (
          <main aria-label="Parent dashboard" className={styles.page}>
            <section
              aria-label="Welcome"
              className={styles.welcome}
              style={{ backgroundImage: `url("${childrenBanner}")` }}
            >
              <Avatar name={profile.name} size="large" />
              <div>
                <h1>
                  {greeting}, {firstName}!
                </h1>
                <p>
                  Welcome to KalingaLink. Stay connected with your child’s
                  learning journey
                  <br className={styles.desktopBreak} /> and important updates
                  from the Child Development Center.
                </p>
              </div>
            </section>
            <section
              aria-label="Parent dashboard summary"
              className={styles.stats}
            >
              <Stat
                icon="children"
                title="My Children"
                count={
                  dashboardLoading ? <BouncingDots label="Loading child count" size="small" inline /> : String(dashboardData.children.length)
                }
                action="View child profiles"
                tone="blue"
                onClick={() => navigate(routePaths.parentChildren)}
              />
              <Stat
                icon="calendar"
                title="Upcoming Activities"
                count={
                  dashboardLoading
                    ? <BouncingDots label="Loading activity count" size="small" inline />
                    : String(dashboardData.upcoming_activity_count)
                }
                action="View activities"
                tone="green"
                onClick={() => navigate(routePaths.parentActivities)}
              />
              <Stat
                icon="file"
                title="Enrollment Status"
                count={
                  dashboardLoading
                    ? <BouncingDots label="Loading enrollment count" size="small" inline />
                    : String(dashboardData.enrollment_count)
                }
                action="View status"
                tone="purple"
                onClick={() => navigate(routePaths.parentApplicationStatus)}
              />
              <Stat
                icon="bell"
                title="Announcements"
                count={
                  announcementsLoading ? <BouncingDots label="Loading announcement count" size="small" inline /> : String(announcementFeed.length)
                }
                action="View announcements"
                tone="red"
                onClick={() => navigate(routePaths.parentAnnouncements)}
              />
            </section>
            {dashboardError && (
              <p className={styles.localNote} role="alert">
                {dashboardError}
              </p>
            )}
            {announcementsError && (
              <p className={styles.localNote} role="alert">
                {announcementsError}
              </p>
            )}
            <div className={styles.dashboardGrid}>
              <div className={styles.dashboardMainColumn}>
                <section className={styles.panel}>
                  <PanelHeading
                    title="My Children"
                    icon="children"
                    action="View All Children"
                    onAction={() => navigate(routePaths.parentChildren)}
                  />
                  <div className={styles.childrenCards}>
                    {dashboardChildren.map((child) => (
                      <ChildCard
                        child={child}
                        key={child.id}
                        onClick={() => navigate(routePaths.parentChildren)}
                      />
                    ))}
                    {!dashboardLoading && dashboardChildren.length === 0 && (
                      <p className={styles.localNote}>
                        No child profiles are linked to this account yet.
                      </p>
                    )}
                    {dashboardLoading && dashboardChildren.length === 0 && (
                      <p className={styles.localNote}>
                        <BouncingDots label="Loading child profiles" />
                      </p>
                    )}
                  </div>
                </section>
                <div className={styles.lowerGrid}>
                  <section className={styles.panel}>
                    <PanelHeading
                      title="Recent Activities / Assignments"
                      icon="tasks"
                      action="View All"
                      onAction={() => navigate(routePaths.parentActivities)}
                    />
                    <div>
                      {filteredActivities.map((item) => (
                        <ActivityRow item={item} key={item.id} />
                      ))}
                      {!dashboardLoading && filteredActivities.length === 0 && (
                        <p className={styles.localNote}>
                          No assignments have been published for your children.
                        </p>
                      )}
                      {dashboardLoading && filteredActivities.length === 0 && (
                        <p className={styles.localNote}>
                          <BouncingDots label="Loading assignments" />
                        </p>
                      )}
                    </div>
                  </section>
                  <div className={styles.stackedPanels}>
                    <section className={styles.panel}>
                      <PanelHeading
                        title="Attendance Updates"
                        icon="calendar"
                        action="View All"
                        onAction={() => navigate(routePaths.parentAttendance)}
                      />
                      <div>
                        {dashboardAttendance.map((item) => (
                          <AttendanceRow item={item} key={item.id} />
                        ))}
                        {!dashboardLoading &&
                          dashboardAttendance.length === 0 && (
                            <p className={styles.localNote}>
                              No attendance has been recorded in the last 7
                              days.
                            </p>
                          )}
                      </div>
                    </section>
                    <section className={styles.panel}>
                      <PanelHeading
                        title="Children Progress"
                        icon="chart"
                        action="View All"
                        onAction={() => navigate(routePaths.parentProgress)}
                      />
                      <div>
                        {dashboardProgress.map((item) => (
                          <ProgressRow item={item} key={item.id} />
                        ))}
                        {!dashboardLoading &&
                          dashboardProgress.length === 0 && (
                            <p className={styles.localNote}>
                              No children are linked to this account.
                            </p>
                          )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
              <div className={styles.dashboardRail}>
                <section className={styles.panel}>
                  <PanelHeading
                    title="Latest Announcements"
                    icon="megaphone"
                    action="View All"
                    onAction={() => navigate(routePaths.parentAnnouncements)}
                  />
                  <div>
                    {filteredAnnouncements.slice(0, 4).map((item) => (
                      <AnnouncementRow
                        item={item}
                        key={item.id}
                        onClick={() => navigate(routePaths.parentAnnouncements)}
                      />
                    ))}
                    {announcementsLoading && (
                      <p className={styles.localNote}>
                        <BouncingDots label="Loading announcements" />
                      </p>
                    )}
                    {!filteredAnnouncements.length &&
                      !announcementsLoading &&
                      !announcementsError && (
                        <p className={styles.localNote}>
                          No announcements are available.
                        </p>
                      )}
                  </div>
                </section>
                <section className={styles.panel}>
                  <PanelHeading
                    title="My Profile"
                    icon="profile"
                    action="Edit Profile"
                    onAction={() => navigate(routePaths.parentProfile)}
                  />
                  <div className={styles.profilePreview}>
                    <Avatar name={profile.name} />
                    <div>
                      <strong>{profile.name}</strong>
                      <span>Parent</span>
                    </div>
                  </div>
                  <div className={styles.contactList}>
                    <p>
                      <Icon name="mail" /> Email <span>{profile.email}</span>
                    </p>
                    <p>
                      <Icon name="phone" /> Phone{' '}
                      <span>{profile.phone || 'Not provided'}</span>
                    </p>
                    <p>
                      <Icon name="location" /> Address{' '}
                      <span>{profile.address || 'Not provided'}</span>
                    </p>
                  </div>
                </section>
                <div className={styles.encouragement}>
                  <span aria-hidden="true">♡</span>
                  <p>
                    Together, we build a brighter future for our children.{' '}
                    <b>♥</b>
                  </p>
                </div>
              </div>
            </div>
          </main>
        ) : (
          <div className={styles.page}>
            {currentPath !== routePaths.parentEnrollment &&
              currentPath !== routePaths.parentEvents &&
              currentPath !== routePaths.parentActivities &&
              currentPath !== routePaths.parentApplicationStatus &&
              currentPath !== routePaths.parentChildren &&
              currentPath !== routePaths.parentAttendance &&
              currentPath !== routePaths.parentProgress &&
              currentPath !== routePaths.parentAnnouncements &&
              currentPath !== routePaths.parentProfile && (
                <header className={styles.sectionHeader}>
                  <span>
                    <Icon name={activeItem.icon} />
                  </span>
                  <div>
                    <h1>{contentTitle()}</h1>
                    <p>
                      Stay connected with your children’s learning and
                      development.
                    </p>
                  </div>
                </header>
              )}
            {currentPath === routePaths.parentEvents ? (
              <EventsPage mode="parent" />
            ) : currentPath === routePaths.parentEnrollment ? (
              <ParentEnrollment />
            ) : currentPath === routePaths.parentActivities ? (
              <ParentActivities search={search} />
            ) : currentPath === routePaths.parentApplicationStatus ? (
              <ParentApplicationStatus
                search={search}
                onSearchChange={setSearch}
              />
            ) : currentPath === routePaths.parentChildren ? (
              <ParentChildren search={search} />
            ) : currentPath === routePaths.parentAttendance ? (
              <ParentAttendance search={search} />
            ) : currentPath === routePaths.parentProgress ? (
              <ParentProgress search={search} />
            ) : currentPath === routePaths.parentAnnouncements ? (
              <>
                <ParentAnnouncements
                  search={search}
                  feed={announcementFeed}
                  loading={announcementsLoading}
                  error={announcementsError}
                />
              </>
            ) : currentPath === routePaths.parentProfile ? (
              <main aria-label="Parent profile" className={styles.profilePage}>
                <section
                  aria-label="My Profile"
                  className={styles.profileBanner}
                  style={{ backgroundImage: `url("${childrenBanner}")` }}
                >
                  <span>
                    <Icon name="profile" />
                  </span>
                  <div>
                    <h1>My Profile</h1>
                    <p>
                      View and manage your personal information and your
                      children&apos;s information.
                    </p>
                  </div>
                </section>

                <section
                  aria-labelledby="parent-info-heading"
                  className={`${styles.profilePanel} ${styles.parentInfoPanel}`}
                >
                  <header className={styles.profilePanelHeading}>
                    <h2 id="parent-info-heading">
                      <Icon name="profile" /> Parent / Guardian Information
                    </h2>
                    <button
                      className={styles.profileEditButton}
                      type="button"
                      onClick={() => {
                        setProfileDraft({
                          first_name: profile.firstName,
                          middle_name: profile.middleName,
                          last_name: profile.lastName,
                          email: profile.email,
                          phone: profile.phone,
                          birth_date: profile.dateOfBirth,
                          gender: profile.gender,
                          relationship: profile.relationship,
                          address: profile.address,
                          contact_email: profile.contactEmail,
                          emergency_name: profile.emergencyContact,
                          emergency_relationship: profile.emergencyRelationship,
                          emergency_phone: profile.emergencyPhone,
                          household_income: profile.householdIncome,
                          preferred_language: profile.preferredLanguage,
                          referral_source: profile.referralSource,
                        });
                        setProfileError('');
                        setProfileNotice('');
                        setIsEditingProfile(true);
                      }}
                    >
                      <Icon name="edit" /> Edit Profile
                    </button>
                  </header>
                  <div className={styles.parentInfoBody}>
                    <div className={styles.parentIdentity}>
                      <Avatar name={profile.name} size="large" />
                      <div>
                        <h3>{profile.name}</h3>
                        <span className={styles.parentBadge}>
                          Parent / Guardian
                        </span>
                        <dl className={styles.identityDetails}>
                          <ProfileDetail
                            icon="mail"
                            label="Email Address"
                            value={profile.contactEmail}
                          />
                          <ProfileDetail
                            icon="phone"
                            label="Mobile Number"
                            value={profile.phone}
                          />
                        </dl>
                      </div>
                    </div>
                    <dl className={styles.profileDetails}>
                      <ProfileDetail
                        icon="calendar"
                        label="Date of Birth"
                        value={profile.dateOfBirth}
                      />
                      <ProfileDetail
                        icon="profile"
                        label="Gender"
                        value={profile.gender}
                      />
                      <ProfileDetail
                        icon="children"
                        label="Relationship to Child"
                        value={profile.relationship}
                      />
                    </dl>
                    <dl className={styles.profileDetailsBox}>
                      <ProfileDetail
                        icon="home"
                        label="Residential Address"
                        value={profile.address}
                      />
                    </dl>
                  </div>
                </section>

                <div className={styles.profileSections}>
                  <ProfileSectionCard
                    title="Emergency Contact"
                    icon="status"
                  >
                    <ProfileDetail
                      icon="profile"
                      label="Contact Person"
                      value={profile.emergencyContact}
                    />
                    <ProfileDetail
                      icon="children"
                      label="Relationship"
                      value={profile.emergencyRelationship}
                    />
                    <ProfileDetail
                      icon="phone"
                      label="Phone Number"
                      value={profile.emergencyPhone}
                    />
                  </ProfileSectionCard>
                  <ProfileSectionCard
                    title="Social Information"
                    icon="children"
                  >
                    <ProfileDetail
                      icon="file"
                      label="Household Income Range"
                      value={profile.householdIncome}
                    />
                    <ProfileDetail
                      icon="file"
                      label="Preferred Language"
                      value={profile.preferredLanguage}
                    />
                    <ProfileDetail
                      icon="status"
                      label="How did you learn about the CDC?"
                      value={profile.referralSource}
                    />
                  </ProfileSectionCard>
                  <ProfileSectionCard
                    title="Account Information"
                    icon="profile"
                  >
                    <ProfileDetail
                      icon="profile"
                      label="Username"
                      value={profile.username}
                    />
                    <ProfileDetail
                      icon="mail"
                      label="Email Address"
                      value={profile.email}
                    />
                    <ProfileDetail
                      icon="children"
                      label="Role"
                      value="Parent"
                    />
                    <ProfileDetail
                      icon="status"
                      label="Account Status"
                      value={profile.accountStatus}
                    />
                  </ProfileSectionCard>
                </div>

                <section
                  aria-labelledby="my-children-heading"
                  className={`${styles.profilePanel} ${styles.myChildrenPanel}`}
                >
                  <header className={styles.profilePanelHeading}>
                    <h2 id="my-children-heading">
                      <Icon name="children" /> My Children
                    </h2>
                    <button
                      className={styles.profileEditButton}
                      type="button"
                      onClick={() => navigate(routePaths.parentChildren)}
                    >
                      <Icon name="plus" /> Add Child
                    </button>
                  </header>
                  <div className={styles.profileChildrenGrid}>
                    {dashboardChildren.map((child) => (
                      <article
                        className={styles.profileChildCard}
                        key={child.id}
                      >
                        <img
                          alt=""
                          src={childrenBanner}
                          style={{ objectPosition: child.imagePosition }}
                        />
                        <div>
                          <h3>{child.name}</h3>
                          <span className={styles.childStatus}>
                            {child.status}
                          </span>
                          <p>
                            <Icon name="children" /> Age: {child.age}
                          </p>
                          <p>
                            <Icon name="calendar" /> Birthday: {child.birthday}
                          </p>
                          <p>
                            <Icon name="profile" /> Gender: {child.gender}
                          </p>
                          <p>
                            <Icon name="status" /> CDC Class: {child.className}
                          </p>
                        </div>
                        <button
                          className={styles.viewChildButton}
                          type="button"
                          onClick={() => navigate(routePaths.parentChildren)}
                        >
                          <Icon name="eye" /> View Profile
                        </button>
                      </article>
                    ))}
                  </div>
                </section>

                {profileError && (
                  <p className={styles.localNote} role="alert">
                    {profileError}
                  </p>
                )}
                {profileNotice && (
                  <p className={styles.localNote} role="status">
                    {profileNotice}
                  </p>
                )}
                {isEditingProfile && (
                  <div className={styles.profileModalBackdrop}>
                    <section
                      aria-labelledby="edit-profile-title"
                      aria-modal="true"
                      className={styles.profileModal}
                      role="dialog"
                    >
                      <header>
                        <h2 id="edit-profile-title">Edit Parent Profile</h2>
                        <button
                          aria-label="Close edit profile dialog"
                          disabled={profileSaving}
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                        >
                          ×
                        </button>
                      </header>
                      {profileError && (
                        <p className={styles.localNote} role="alert">
                          {profileError}
                        </p>
                      )}
                      <form onSubmit={(event) => void saveProfile(event)}>
                        {profileEditFields.map(({ key, label, type }) => (
                          <label key={key}>
                            {label}
                            {key === 'gender' ? (
                              <select
                                value={profileDraft.gender}
                                onChange={(event) =>
                                  setProfileDraft((current) => ({
                                    ...current,
                                    gender: event.target.value,
                                  }))
                                }
                              >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Prefer not to say">
                                  Prefer not to say
                                </option>
                              </select>
                            ) : (
                              <input
                                maxLength={key === 'address' ? 255 : undefined}
                                required={key === 'first_name' || key === 'last_name' || key === 'email'}
                                type={type ?? 'text'}
                                value={profileDraft[key]}
                                onChange={(event) =>
                                  setProfileDraft((current) => ({
                                    ...current,
                                    [key]: event.target.value,
                                  }))
                                }
                              />
                            )}
                          </label>
                        ))}
                        <div className={styles.profileModalActions}>
                          <button
                            disabled={profileSaving}
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                          >
                            Cancel
                          </button>
                          <button disabled={profileSaving} type="submit">
                            {profileSaving ? 'Saving…' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </section>
                  </div>
                )}
              </main>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileDetail({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.profileDetail}>
      <Icon name={icon} />
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

function ProfileSectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.profilePanel}>
      <header className={styles.profilePanelHeading}>
        <h2>
          <Icon name={icon} /> {title}
        </h2>
      </header>
      <dl className={styles.profileSectionDetails}>{children}</dl>
    </section>
  );
}

function Stat({
  icon,
  title,
  count,
  action,
  tone,
  onClick,
}: {
  icon: string;
  title: string;
  count: ReactNode;
  action: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`${styles.stat} ${styles[tone]}`}
      type="button"
      onClick={onClick}
    >
      <span className={styles.statIcon}>
        <Icon name={icon} />
      </span>
      <span className={styles.statCopy}>
        <strong>{title}</strong>
        <b>{count}</b>
        <span>{action} →</span>
      </span>
    </button>
  );
}

function ChildCard({
  child,
  onClick,
}: {
  child: DashboardChildCard;
  onClick: () => void;
}) {
  return (
    <article className={styles.childCard}>
      <img
        alt=""
        src={childrenBanner}
        style={{ objectPosition: child.imagePosition }}
      />
      <div className={styles.childCopy}>
        <h3>{child.name}</h3>
        <p>Age: {child.age}</p>
        <p>Birthdate: {child.birthday}</p>
        <span
          className={
            child.status === 'Enrolled' ? styles.enrolled : styles.pending
          }
        >
          {child.status}
        </span>
        <button type="button" onClick={onClick}>
          <Icon name="childrenSmall" /> View Details
        </button>
      </div>
    </article>
  );
}

function ActivityRow({ item }: { item: DashboardActivityRow }) {
  return (
    <article className={styles.listRow}>
      <span className={`${styles.rowIcon} ${styles[item.color]}`}>
        <Icon name={item.icon} />
      </span>
      <div className={styles.rowCopy}>
        <h3>{item.title}</h3>
        <p>For: {item.child}</p>
        <small>Due: {item.due}</small>
      </div>
      <span
        className={item.status === 'Assigned' ? styles.toDo : styles.completed}
      >
        {item.status}
      </span>
      <Icon name="arrow" />
    </article>
  );
}

function AttendanceRow({ item }: { item: DashboardAttendanceRow }) {
  return (
    <article className={styles.compactRow}>
      <img
        alt=""
        src={childrenBanner}
        style={{ objectPosition: item.imagePosition }}
      />
      <div className={styles.rowCopy}>
        <h3>{item.child}</h3>
        <small>{item.period}</small>
      </div>
      <span className={styles.present}>{item.status}</span>
      <Icon name="arrow" />
    </article>
  );
}

function ProgressRow({ item }: { item: DashboardProgressRow }) {
  return (
    <article className={styles.progressRow}>
      <img
        alt=""
        src={childrenBanner}
        style={{ objectPosition: item.imagePosition }}
      />
      <div className={styles.rowCopy}>
        <h3>{item.child}</h3>
        <small>
          {item.hasRecords ? 'Overall Progress' : 'No progress recorded'}
        </small>
      </div>
      {item.hasRecords && (
        <>
          <div className={styles.progressTrack}>
            <span style={{ width: `${item.score}%` }} />
          </div>
          <small>{item.score}%</small>
        </>
      )}
      <Icon name="arrow" />
    </article>
  );
}

function AnnouncementRow({
  item,
  onClick,
}: {
  item: DashboardAnnouncement;
  onClick?: () => void;
}) {
  return (
    <button className={styles.announcementRow} type="button" onClick={onClick}>
      <i className={styles[item.color]} />
      <span>
        <strong>{item.title}</strong>
        <small>
          {item.date} · {item.sender}
        </small>
      </span>
      <Icon name="arrow" />
    </button>
  );
}
