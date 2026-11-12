import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BouncingDots } from '../../components/animations/BouncingDots';
import { routePaths } from '../../constants/app-constants';
import { useAuth } from '../../auth/AuthProvider';
import { LearningActivities } from '../TeacherLearningActivities/LearningActivities';
import { LessonPlans } from '../TeacherLessonPlans/LessonPlans';
import { ChildrenProgress } from '../TeacherChildrenProgress/ChildrenProgress';
import { TeacherTasks } from '../TeacherTasks/TeacherTasks';
import { EventNotifications } from '../EventNotifications/EventNotifications';
import { TeacherProfile } from '../TeacherProfile/TeacherProfile';
import { TeacherEnrollmentPage } from '../TeacherEnrollmentManagement/TeacherEnrollmentPage';
import { EventsPage } from '../Events/EventsPage';
import femalePanel from '../../../femalepanel.png';
import styles from './TeacherDashboard.module.css';
import { Avatar } from '../../components/common/Avatar/Avatar';
import { Logo } from '../../components/common/Logo/Logo';
import { LogoutConfirmation } from '../../components/common/LogoutConfirmation/LogoutConfirmation';
import { useAnnouncementFeed } from '../../hooks/useAnnouncementFeed';
import { useNotificationCount } from '../../hooks/useNotificationCount';

type IconName =
  | 'home'
  | 'students'
  | 'enrollment'
  | 'calendar'
  | 'book'
  | 'file'
  | 'chart'
  | 'tasks'
  | 'bell'
  | 'profile'
  | 'logout'
  | 'search'
  | 'announcement'
  | 'arrow'
  | 'lightning'
  | 'plus'
  | 'chevron'
  | 'birthday'
  | 'location'
  | 'phone'
  | 'medical'
  | 'close'
  | 'back'
  | 'check'
  | 'clock'
  | 'menu';

function Icon({ name }: { name: IconName }) {
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
    case 'menu':
      return (
        <svg {...shared}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case 'home':
      return (
        <svg {...shared}>
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'students':
      return (
        <svg {...shared}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-1a6 6 0 0 1 12 0v1zm12-14a3 3 0 0 1 0 6m2 3a5 5 0 0 1 4 5" />
        </svg>
      );
    case 'enrollment':
      return (
        <svg {...shared}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6m-12 5h8m-8 4h5" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18m-12 4 2 2 4-4" />
        </svg>
      );
    case 'book':
      return (
        <svg {...shared}>
          <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22zm18 0A2.5 2.5 0 0 0 18.5 3H12v17h6.5A2.5 2.5 0 0 1 21 22z" />
        </svg>
      );
    case 'file':
      return (
        <svg {...shared}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8m-8 4h8" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...shared}>
          <path d="M4 20v-7h4v7zm6 0V4h4v16zm6 0v-10h4v10z" />
        </svg>
      );
    case 'tasks':
      return (
        <svg {...shared}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 3.5h6v3H9zm-1 8 2 2 4-4m-6 8h7" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...shared}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...shared}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
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
    case 'announcement':
      return (
        <svg {...shared}>
          <path d="m3 11 18-7v16L3 13zm0 0v2a3 3 0 0 0 3 3h2l2 4h3l-2-5" />
        </svg>
      );
    case 'lightning':
      return (
        <svg {...shared}>
          <path d="M13 2 4 14h7l-1 8 10-13h-7z" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...shared}>
          <path d="M12 5v14m-7-7h14" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...shared}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...shared}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );
    case 'birthday':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18m3 4H8v7m6-7v7m-9-7v7" />
        </svg>
      );
    case 'location':
      return (
        <svg {...shared}>
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...shared}>
          <path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 3a14 14 0 0 1-6-6l3-2z" />
        </svg>
      );
    case 'medical':
      return (
        <svg {...shared}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="M12 8v8m-4-4h8" />
        </svg>
      );
    case 'close':
      return (
        <svg {...shared}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case 'back':
      return (
        <svg {...shared}>
          <path d="m14 5-7 7 7 7m-7-7h14" />
        </svg>
      );
    case 'check':
      return (
        <svg {...shared}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
  }
}

type NavigationItem = {
  label: string;
  icon: IconName;
  active?: boolean;
};

const navigation: NavigationItem[] = [
  { label: 'Dashboard', icon: 'home', active: true },
  { label: 'Events', icon: 'calendar' },
  { label: 'Enrollment Management', icon: 'enrollment' },
  { label: 'Students', icon: 'students' },
  { label: 'Daily Attendance', icon: 'calendar' },
  { label: 'Learning Activities', icon: 'book' },
  { label: 'Lesson Plans and Materials', icon: 'file' },
  { label: 'Children Progress', icon: 'chart' },
  { label: 'My Task and Submissions', icon: 'tasks' },
  { label: 'Notifications', icon: 'bell' },
  { label: 'Profile', icon: 'profile' },
];

type StudentTab = 'general' | 'guardian' | 'medical';
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
type AttendanceEntryStatus = AttendanceStatus | null;
type AttendanceEntry = {
  studentId: string;
  classId: string;
  status: AttendanceEntryStatus;
  remarks: string;
  timeIn: string;
  saved: boolean;
  student: {
    id: string;
    name: string;
    nickname: string;
    className: string;
    cdcName: string;
    tone: string;
    face: string;
  };
};

type TeacherStudent = {
  id: number;
  nickname: string | null;
  name: string;
  age: number;
  birthday: string;
  gender: string;
  className: string;
  address: string;
  phone: string;
  guardian: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;
  medical: string;
  psaNumber: string;
  nationality: string;
  placeOfBirth: string;
  bloodType: string;
  allergies: string;
  immunizationStatus: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
};

type TeacherStudentApiRecord = {
  id: number | string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  nickname: string | null;
  birth_date: string;
  gender: string;
  address: string | null;
  medical_notes: string | null;
  psa_birth_certificate_number: string | null;
  nationality: string | null;
  place_of_birth: string | null;
  blood_type: string | null;
  allergies: string | null;
  immunization_status: string | null;
  class_names: string;
  guardian_first_name: string | null;
  guardian_last_name: string | null;
  guardian_phone: string | null;
  guardian_email: string;
  guardian_relationship: string | null;
  guardian_address: string | null;
  emergency_name: string | null;
  emergency_relationship: string | null;
  emergency_phone: string | null;
};

type TeacherDashboardData = {
  total_students: number;
  present_today: number;
  attendance_rate: number;
  recorded_today: number;
  learning_activities: number;
  pending_submissions: number;
  unread_notifications: number;
  weekly_attendance: Array<{
    attendance_date: string;
    present: number;
    absent: number;
  }>;
  recent_students: Array<{
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    birth_date: string;
    class_name: string;
    attendance_status: AttendanceStatus | null;
    enrolled_at: string;
  }>;
  upcoming_activities: Array<{
    id: number;
    title: string;
    due_at: string;
    class_name: string;
  }>;
};

type TeacherDashboardResponse = {
  status: boolean;
  data: TeacherDashboardData;
};

const attendanceStatusOptions: {
  value: AttendanceStatus;
  label: string;
}[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
];

const bulkAttendanceActions: {
  value: AttendanceStatus;
  label: string;
  icon: IconName;
}[] = [
  { value: 'present', label: 'Mark All Present', icon: 'check' },
  { value: 'absent', label: 'Mark All Absent', icon: 'close' },
  { value: 'late', label: 'Mark All Late', icon: 'clock' },
  { value: 'excused', label: 'Mark All Excused', icon: 'medical' },
];

const quickActions = [
  {
    label: 'Create Learning Activity',
    icon: 'plus',
    path: routePaths.teacherLearningActivities,
  },
  {
    label: 'View Lesson Plans',
    icon: 'book',
    path: routePaths.teacherLessonPlans,
  },
  {
    label: 'Mark Attendance',
    icon: 'calendar',
    path: routePaths.teacherAttendance,
  },
  {
    label: 'View Students',
    icon: 'students',
    path: routePaths.teacherStudents,
  },
] as const;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getDateLabel() {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

function dateInputValue(date = new Date()) {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

function csvCell(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function TeacherDashboard() {
  const navigate = useNavigate();
  const { request, user, logout } = useAuth();
  const unreadNotifications = useNotificationCount();
  const { announcements: announcementFeed, error: announcementsError } =
    useAnnouncementFeed(false);
  const announcements = announcementFeed.map((announcement) => {
    const publishedAt = new Date(announcement.published_at.replace(' ', 'T'));
    const authorIsTeacher = announcement.created_by_role === 'teacher';
    return {
      title: announcement.title,
      source: authorIsTeacher
        ? `From: ${announcement.created_by}`
        : 'From: MSWDO Admin',
      time: publishedAt.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      tone: authorIsTeacher ? 'purple' : 'green',
    };
  });
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const location = useLocation();
  const [welcomeMessage, setWelcomeMessage] = useState('');
  useEffect(() => {
    const state = location.state as { welcomeMessage?: unknown } | null;
    if (typeof state?.welcomeMessage !== 'string') return;
    setWelcomeMessage(state.welcomeMessage);
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: null,
    });
  }, [location, navigate]);
  const isTeacherEnrollmentPage =
    location.pathname === routePaths.teacherEnrollment;
  const isStudentsPage = location.pathname === routePaths.teacherStudents;
  const isAttendancePage = location.pathname === routePaths.teacherAttendance;
  const isLearningActivitiesPage =
    location.pathname === routePaths.teacherLearningActivities;
  const isLessonPlansPage = location.pathname === routePaths.teacherLessonPlans;
  const isChildrenProgressPage =
    location.pathname === routePaths.teacherChildrenProgress;
  const isTeacherTasksPage = location.pathname === routePaths.teacherTasks;
  const isTeacherNotificationsPage =
    location.pathname === routePaths.teacherNotifications;
  const isTeacherProfilePage = location.pathname === routePaths.teacherProfile;
  const isTeacherDashboardPage =
    location.pathname === routePaths.teacherDashboard;
  const isTeacherEventsPage = location.pathname === routePaths.teacherEvents;
  const [dashboardData, setDashboardData] =
    useState<TeacherDashboardData | null>(null);
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

  const reloadDashboard = useCallback(async () => {
    setDashboardError('');
    try {
      const response = await request<TeacherDashboardResponse>(
        '/api/teacher/dashboard',
      );
      setDashboardData(response.data);
    } catch (error) {
      setDashboardData(null);
      setDashboardError(
        error instanceof Error
          ? error.message
          : 'The teacher dashboard could not be loaded.',
      );
    } finally {
      setDashboardLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (!isTeacherDashboardPage) return;
    void reloadDashboard();
  }, [isTeacherDashboardPage, reloadDashboard]);

  const [query, setQuery] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [classStudents, setClassStudents] = useState<TeacherStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const [studentTab, setStudentTab] = useState<StudentTab>('general');
  const [attendanceDate, setAttendanceDate] = useState(() => dateInputValue());
  const [attendanceTime, setAttendanceTime] = useState('07:30');
  const [attendanceClass, setAttendanceClass] = useState('');
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const attendanceDirtyKeys = useRef(new Set<string>());
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<string[]>(
    [],
  );
  const [attendanceNotice, setAttendanceNotice] = useState('');

  useEffect(() => {
    if (!isStudentsPage) return;
    let active = true;
    const loadStudents = async () => {
      setStudentsError('');
      try {
        const response = await request<{ data: TeacherStudentApiRecord[] }>(
          '/api/teacher/students',
        );
        if (!active) return;
        const currentDate = new Date();
        const students = response.data.map((record) => {
          const birthDate = new Date(`${record.birth_date}T00:00:00`);
          let age = currentDate.getFullYear() - birthDate.getFullYear();
          if (
            currentDate.getMonth() < birthDate.getMonth() ||
            (currentDate.getMonth() === birthDate.getMonth() &&
              currentDate.getDate() < birthDate.getDate())
          ) {
            age -= 1;
          }
          return {
            id: Number(record.id),
            nickname: record.nickname,
            name: [record.first_name, record.middle_name, record.last_name]
              .filter(Boolean)
              .join(' '),
            age: Math.max(age, 0),
            birthday: birthDate.toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            gender: record.gender,
            className: record.class_names,
            address: record.address ?? '',
            phone: record.guardian_phone ?? '',
            guardian: [record.guardian_first_name, record.guardian_last_name]
              .filter(Boolean)
              .join(' '),
            guardianRelation: record.guardian_relationship ?? '',
            guardianPhone: record.guardian_phone ?? '',
            guardianEmail: record.guardian_email,
            guardianAddress: record.guardian_address ?? '',
            medical: record.medical_notes ?? '',
            psaNumber: record.psa_birth_certificate_number ?? '',
            nationality: record.nationality ?? '',
            placeOfBirth: record.place_of_birth ?? '',
            bloodType: record.blood_type ?? '',
            allergies: record.allergies ?? '',
            immunizationStatus: record.immunization_status ?? '',
            emergencyName: record.emergency_name ?? '',
            emergencyRelationship: record.emergency_relationship ?? '',
            emergencyPhone: record.emergency_phone ?? '',
          };
        });
        setClassStudents(students);
        setSelectedStudentId((current) =>
          students.some((student) => student.id === current)
            ? current
            : (students[0]?.id ?? null),
        );
      } catch (error) {
        if (active) {
          setClassStudents([]);
          setSelectedStudentId(null);
          setStudentsError(
            error instanceof Error
              ? error.message
              : 'Student records could not be loaded.',
          );
        }
      } finally {
        if (active) setStudentsLoading(false);
      }
    };
    setStudentsLoading(true);
    void loadStudents();
    const refresh = () => {
      if (active && document.visibilityState === 'visible') {
        void loadStudents();
      }
    };
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [isStudentsPage, request]);

  useEffect(() => {
    if (!isAttendancePage) return;
    let active = true;
    let hasLoaded = false;
    let hasLoadedSuccessfully = false;
    let requestInFlight = false;
    setAttendanceLoading(true);
    setAttendanceNotice('');
    const loadAttendance = async () => {
      if (!active || requestInFlight) return;
      requestInFlight = true;
      setAttendanceLoading(!hasLoaded);
      try {
        const { data } = await request<{
          data: Array<{
            child_id: number | string;
            class_id: number | string;
            first_name: string;
            middle_name: string | null;
            last_name: string;
            nickname: string | null;
            class_name: string;
            cdc_name: string;
            attendance_id: number | string | null;
            status: AttendanceStatus | null;
            time_in: string | null;
            remarks: string | null;
          }>;
        }>(`/api/attendance?date=${encodeURIComponent(attendanceDate)}`);
        if (!active) return;
        setAttendanceEntries((currentEntries) => {
          const currentByKey = new Map(
            currentEntries.map((entry) => [
              `${attendanceDate}:${entry.classId}:${entry.studentId}`,
              entry,
            ]),
          );
          return data.map((record) => {
            const studentId = String(record.child_id);
            const classId = String(record.class_id);
            const key = `${attendanceDate}:${classId}:${studentId}`;
            const current = currentByKey.get(key);
            const isSaved = record.attendance_id !== null
              && record.attendance_id !== undefined;
            const preserveLocalChanges =
              !isSaved && attendanceDirtyKeys.current.has(key);
            if (isSaved) attendanceDirtyKeys.current.delete(key);
            const name = [
              record.first_name,
              record.middle_name,
              record.last_name,
            ]
              .filter(Boolean)
              .join(' ');
            return {
              studentId,
              classId,
              status: preserveLocalChanges
                ? (current?.status ?? null)
                : (record.status ?? null),
              remarks: preserveLocalChanges
                ? (current?.remarks ?? '')
                : (record.remarks ?? ''),
              timeIn: preserveLocalChanges
                ? (current?.timeIn ?? attendanceTime)
                : (record.time_in?.slice(0, 5) ?? attendanceTime),
              saved: isSaved,
              student: {
                id: studentId,
                name,
                nickname: record.nickname ?? '',
                className: record.class_name,
                cdcName: record.cdc_name,
                tone: 'blue',
                face: '•',
              },
            };
          });
        });
        if (!hasLoadedSuccessfully) setAttendanceNotice('');
        hasLoadedSuccessfully = true;
      } catch (error: unknown) {
        if (active && !hasLoaded) {
          setAttendanceEntries([]);
          setAttendanceNotice(
            error instanceof Error
              ? error.message
              : 'Attendance could not be loaded.',
          );
        }
      } finally {
        hasLoaded = true;
        requestInFlight = false;
        if (active) setAttendanceLoading(false);
      }
    };
    void loadAttendance();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadAttendance();
    }, 15_000);
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void loadAttendance();
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [attendanceDate, attendanceTime, isAttendancePage, request]);

  const filteredStudents = (dashboardData?.recent_students ?? []).filter(
    (student) =>
      `${student.first_name} ${student.middle_name ?? ''} ${student.last_name} ${student.class_name}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const today = new Date();
  const weeklyAttendance = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const item = dashboardData?.weekly_attendance.find(
      (record) => record.attendance_date === isoDate,
    );
    return {
      date: date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
      }),
      day: date.toLocaleDateString('en-PH', { weekday: 'short' }),
      present: Number(item?.present ?? 0),
      absent: Number(item?.absent ?? 0),
    };
  });
  const attendanceChartMaximum = Math.max(
    1,
    ...weeklyAttendance.map((item) => item.present + item.absent),
  );
  const attendanceScale = [
    attendanceChartMaximum,
    Math.round(attendanceChartMaximum * (2 / 3)),
    Math.round(attendanceChartMaximum / 3),
    0,
  ];
  const filteredClassStudents = classStudents.filter((student) => {
    const matchesQuery = `${student.name} ${student.nickname ?? ''}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesClass =
      !studentClass || student.className.split(', ').includes(studentClass);
    return matchesQuery && matchesClass;
  });
  const selectedStudent =
    classStudents.find((student) => student.id === selectedStudentId) ?? null;
  const attendanceStudents = attendanceEntries.filter(
    ({ student, classId }) => {
      const matchesQuery = `${student.name} ${student.nickname}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return matchesQuery && (!attendanceClass || classId === attendanceClass);
    },
  );
  const attendanceSummary = attendanceEntries.reduce(
    (summary, entry) => {
      if (entry.status) summary[entry.status] += 1;
      else summary.notRecorded += 1;
      return summary;
    },
    { present: 0, absent: 0, late: 0, excused: 0, notRecorded: 0 },
  );
  const attendanceTotal = attendanceEntries.length;
  const attendanceGradient = (() => {
    let start = 0;
    return [
      ...attendanceStatusOptions.map(({ value }) => {
        const end =
          start +
          (attendanceTotal
            ? (attendanceSummary[value] / attendanceTotal) * 100
            : 0);
        const segment = `var(--attendance-${value}) ${start}% ${end}%`;
        start = end;
        return segment;
      }),
      `var(--attendance-not-recorded) ${start}% 100%`,
    ].join(', ');
  })();

  function updateAttendanceStatus(studentId: string, status: AttendanceStatus) {
    const entry = attendanceEntries.find(
      (candidate) => candidate.studentId === studentId,
    );
    if (entry && !entry.saved) {
      attendanceDirtyKeys.current.add(
        `${attendanceDate}:${entry.classId}:${studentId}`,
      );
    }
    setAttendanceEntries((entries) =>
      entries.map((entry) =>
        entry.studentId === studentId && !entry.saved
          ? {
              ...entry,
              status,
              timeIn:
                status === 'late' && !entry.timeIn
                  ? attendanceTime
                  : entry.timeIn,
            }
          : entry,
      ),
    );
    setAttendanceNotice('');
  }

  function updateAttendanceRemarks(studentId: string, remarks: string) {
    const entry = attendanceEntries.find(
      (candidate) => candidate.studentId === studentId,
    );
    if (entry && !entry.saved) {
      attendanceDirtyKeys.current.add(
        `${attendanceDate}:${entry.classId}:${studentId}`,
      );
    }
    setAttendanceEntries((entries) =>
      entries.map((entry) =>
        entry.studentId === studentId && !entry.saved
          ? { ...entry, remarks }
          : entry,
      ),
    );
    setAttendanceNotice('');
  }

  function updateAttendanceTime(studentId: string, timeIn: string) {
    const entry = attendanceEntries.find(
      (candidate) => candidate.studentId === studentId,
    );
    if (entry && !entry.saved) {
      attendanceDirtyKeys.current.add(
        `${attendanceDate}:${entry.classId}:${studentId}`,
      );
    }
    setAttendanceEntries((entries) =>
      entries.map((entry) =>
        entry.studentId === studentId && !entry.saved
          ? { ...entry, timeIn }
          : entry,
      ),
    );
    setAttendanceNotice('');
  }

  function applyBulkAttendanceStatus(status: AttendanceStatus) {
    const targetIds =
      selectedAttendanceIds.length > 0
        ? selectedAttendanceIds.filter((studentId) =>
            attendanceEntries.some(
              (entry) => entry.studentId === studentId && !entry.saved,
            ),
          )
        : attendanceStudents
            .filter(({ saved }) => !saved)
            .map(({ student }) => student.id);
    const targetIdSet = new Set<string>(targetIds);
    attendanceEntries.forEach((entry) => {
      if (targetIdSet.has(entry.studentId)) {
        attendanceDirtyKeys.current.add(
          `${attendanceDate}:${entry.classId}:${entry.studentId}`,
        );
      }
    });
    setAttendanceEntries((entries) =>
      entries.map((entry) =>
        targetIdSet.has(entry.studentId) && !entry.saved
          ? {
              ...entry,
              status,
              timeIn:
                status === 'late' && !entry.timeIn
                  ? attendanceTime
                  : entry.timeIn,
            }
          : entry,
      ),
    );
    setSelectedAttendanceIds([]);
    setAttendanceNotice(
      selectedAttendanceIds.length > 0
        ? `Updated attendance for ${targetIds.length} selected students.`
        : `Updated attendance for all ${targetIds.length} students in this class and section.`,
    );
  }

  function toggleAttendanceSelection(studentId: string) {
    setSelectedAttendanceIds((selected) =>
      selected.includes(studentId)
        ? selected.filter((id) => id !== studentId)
        : [...selected, studentId],
    );
  }

  function toggleAllAttendanceSelection() {
    const visibleIds: string[] = attendanceStudents
      .filter(({ saved }) => !saved)
      .map(
      ({ student }) => student.id,
    );
    const selectedIds = new Set<string>(selectedAttendanceIds);
    const allVisibleSelected = visibleIds.every((id) => selectedIds.has(id));
    const visibleIdSet = new Set(visibleIds);
    setSelectedAttendanceIds((selected) =>
      allVisibleSelected
        ? selected.filter((id) => !visibleIdSet.has(id))
        : [...new Set([...selected, ...visibleIds])],
    );
  }

  async function saveAttendance() {
    const visibleEntries = attendanceEntries
      .filter(({ classId }) => !attendanceClass || classId === attendanceClass)
    if (!visibleEntries.length) {
      setAttendanceNotice(
        'There are no students in the selected class to save.',
      );
      return;
    }
    const pendingEntries = visibleEntries.filter(({ saved }) => !saved);
    if (!pendingEntries.length) {
      setAttendanceNotice('Attendance has already been saved for all students in this selection.');
      return;
    }
    const unrecordedCount = pendingEntries.filter(
      ({ status }) => status === null,
    ).length;
    if (unrecordedCount > 0) {
      setAttendanceNotice(
        `Select an attendance status for all students before saving. ${unrecordedCount} not recorded.`,
      );
      return;
    }
    const incompleteLate = pendingEntries.find(
      ({ status, timeIn, remarks }) =>
        status === 'late' && (!timeIn || !remarks.trim()),
    );
    if (incompleteLate) {
      setAttendanceNotice(
        'For every late student, enter the arrival time and a note explaining the delay.',
      );
      return;
    }
    const incompleteExcuse = pendingEntries.find(
      ({ status, remarks }) => status === 'excused' && !remarks.trim(),
    );
    if (incompleteExcuse) {
      setAttendanceNotice('Enter a note explaining why each excused student is excused.');
      return;
    }
    const entries = pendingEntries
      .filter(
        (entry): entry is typeof entry & { status: AttendanceStatus } =>
          entry.status !== null,
      )
      .map(({ studentId, classId, status, remarks, timeIn }) => ({
        child_id: Number(studentId),
        class_id: Number(classId),
        status,
        remarks,
        time_in: status === 'late' ? timeIn : null,
      }));
    setAttendanceSaving(true);
    setAttendanceNotice('');
    try {
      const result = await request<{ message: string }>('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({ attendance_date: attendanceDate, entries }),
      });
      entries.forEach((entry) => {
        attendanceDirtyKeys.current.delete(
          `${attendanceDate}:${entry.class_id}:${entry.child_id}`,
        );
      });
      const savedEntries = new Map(
        entries.map((entry) => [String(entry.child_id), entry]),
      );
      setSelectedAttendanceIds([]);
      setAttendanceEntries((currentEntries) =>
        currentEntries.map((entry) => {
          const savedEntry = savedEntries.get(entry.studentId);
          return savedEntry
            ? {
                ...entry,
                status: savedEntry.status,
                remarks: savedEntry.remarks,
                timeIn: savedEntry.time_in ?? '',
                saved: true,
              }
            : entry;
        }),
      );
      setAttendanceNotice(result.message);
    } catch (error) {
      setAttendanceNotice(
        error instanceof Error
          ? error.message
          : 'Attendance could not be saved.',
      );
    } finally {
      setAttendanceSaving(false);
    }
  }

  function exportAttendance(format: 'word' | 'excel') {
    const savedEntries = attendanceEntries
      .filter((entry) => entry.saved && entry.status !== null)
      .map((entry) => ({
        name: entry.student.name,
        nickname: entry.student.nickname,
        center: entry.student.cdcName,
        className: entry.student.className,
        status: entry.status as AttendanceStatus,
        timeIn: entry.status === 'late' ? entry.timeIn : '',
        remarks: entry.remarks,
      }));
    if (!savedEntries.length) {
      setAttendanceNotice(`No saved attendance is available to export for ${attendanceDate}.`);
      return;
    }

    const headers = [
      'Date',
      'Student Name',
      'Nickname',
      'CDC',
      'Class',
      'Status',
      'Arrival Time',
      'Notes',
    ];
    const rows = savedEntries.map((entry) => [
      attendanceDate,
      entry.name,
      entry.nickname,
      entry.center,
      entry.className,
      entry.status,
      entry.timeIn,
      entry.remarks,
    ]);
    let file: Blob;
    let extension: string;
    if (format === 'excel') {
      const csv = [headers, ...rows]
        .map((row) => row.map(csvCell).join(','))
        .join('\r\n');
      file = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
      extension = 'csv';
    } else {
      const tableRows = rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
        )
        .join('');
      const tableHeaders = headers
        .map((header) => `<th>${escapeHtml(header)}</th>`)
        .join('');
      const documentContent = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #777;padding:6px;text-align:left}th{background:#e8f1fb}</style></head><body><h1>KalingaLink Daily Attendance</h1><p>Date: ${escapeHtml(attendanceDate)}</p><table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
      file = new Blob([documentContent], { type: 'application/msword;charset=utf-8' });
      extension = 'doc';
    }
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `attendance-${attendanceDate}.${extension}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setAttendanceNotice(
      `Attendance for ${attendanceDate} exported as ${format === 'excel' ? 'an Excel-compatible CSV' : 'a Word document'}.`,
    );
  }

  return (
    <div
      className={`${styles.dashboard} ${isTeacherEnrollmentPage ? styles.enrollmentDashboard : ''}`}
      id="dashboard"
    >
      {isNavigationOpen && (
        <button
          aria-label="Close navigation"
          className={styles.navigationOverlay}
          type="button"
          onClick={() => setIsNavigationOpen(false)}
        />
      )}
      <aside
        aria-label="Teacher navigation"
        className={`${styles.sidebar} ${isNavigationOpen ? styles.sidebarOpen : ''}`}
      >
        <Link
          aria-label="KalingaLink teacher dashboard"
          className={styles.brand}
          to={routePaths.teacherDashboard}
        >
          <span className={styles.logoFrame}>
            <Logo alt="KalingaLink" variant="sidebar" />
          </span>
        </Link>

        <nav aria-label="Teacher workspace" className={styles.navigation}>
          {navigation.map((item) => (
            <button
              aria-current={
                (isTeacherEnrollmentPage &&
                  item.label === 'Enrollment Management') ||
                (isStudentsPage && item.label === 'Students') ||
                (isAttendancePage && item.label === 'Daily Attendance') ||
                (isLearningActivitiesPage &&
                  item.label === 'Learning Activities') ||
                (isLessonPlansPage &&
                  item.label === 'Lesson Plans and Materials') ||
                (isChildrenProgressPage &&
                  item.label === 'Children Progress') ||
                (isTeacherTasksPage &&
                  item.label === 'My Task and Submissions') ||
                (isTeacherNotificationsPage &&
                  item.label === 'Notifications') ||
                (isTeacherProfilePage && item.label === 'Profile') ||
                (isTeacherEventsPage && item.label === 'Events') ||
                (!isStudentsPage &&
                  !isTeacherEventsPage &&
                  !isTeacherEnrollmentPage &&
                  !isAttendancePage &&
                  !isLearningActivitiesPage &&
                  !isLessonPlansPage &&
                  !isChildrenProgressPage &&
                  !isTeacherTasksPage &&
                  !isTeacherNotificationsPage &&
                  !isTeacherProfilePage &&
                  item.label === 'Dashboard')
                  ? 'page'
                  : undefined
              }
              className={`${styles.navItem} ${
                (isTeacherEnrollmentPage &&
                  item.label === 'Enrollment Management') ||
                (isStudentsPage && item.label === 'Students') ||
                (isAttendancePage && item.label === 'Daily Attendance') ||
                (isLearningActivitiesPage &&
                  item.label === 'Learning Activities') ||
                (isLessonPlansPage &&
                  item.label === 'Lesson Plans and Materials') ||
                (isChildrenProgressPage &&
                  item.label === 'Children Progress') ||
                (isTeacherTasksPage &&
                  item.label === 'My Task and Submissions') ||
                (isTeacherNotificationsPage &&
                  item.label === 'Notifications') ||
                (isTeacherProfilePage && item.label === 'Profile') ||
                (isTeacherEventsPage && item.label === 'Events') ||
                (!isStudentsPage &&
                  !isTeacherEventsPage &&
                  !isTeacherEnrollmentPage &&
                  !isAttendancePage &&
                  !isLearningActivitiesPage &&
                  !isLessonPlansPage &&
                  !isChildrenProgressPage &&
                  !isTeacherTasksPage &&
                  !isTeacherNotificationsPage &&
                  !isTeacherProfilePage &&
                  item.label === 'Dashboard')
                  ? styles.activeNavItem
                  : ''
              }`}
              type="button"
              disabled={
                ![
                  'Dashboard',
                  'Events',
                  'Enrollment Management',
                  'Students',
                  'Daily Attendance',
                  'Learning Activities',
                  'Lesson Plans and Materials',
                  'Children Progress',
                  'My Task and Submissions',
                  'Notifications',
                  'Profile',
                ].includes(item.label)
              }
              key={item.label}
              onClick={() => {
                setIsNavigationOpen(false);
                if (item.label === 'Dashboard') {
                  setQuery('');
                  navigate(routePaths.teacherDashboard);
                } else if (item.label === 'Events') {
                  setQuery('');
                  navigate(routePaths.teacherEvents);
                } else if (item.label === 'Enrollment Management') {
                  setQuery('');
                  navigate(routePaths.teacherEnrollment);
                } else if (item.label === 'Students') {
                  setQuery('');
                  navigate(routePaths.teacherStudents);
                } else if (item.label === 'Daily Attendance') {
                  setQuery('');
                  navigate(routePaths.teacherAttendance);
                } else if (item.label === 'Learning Activities') {
                  setQuery('');
                  navigate(routePaths.teacherLearningActivities);
                } else if (item.label === 'Lesson Plans and Materials') {
                  setQuery('');
                  navigate(routePaths.teacherLessonPlans);
                } else if (item.label === 'Children Progress') {
                  setQuery('');
                  navigate(routePaths.teacherChildrenProgress);
                } else if (item.label === 'My Task and Submissions') {
                  setQuery('');
                  navigate(routePaths.teacherTasks);
                } else if (item.label === 'Notifications') {
                  setQuery('');
                  navigate(routePaths.teacherNotifications);
                } else if (item.label === 'Profile') {
                  setQuery('');
                  navigate(routePaths.teacherProfile);
                }
              }}
              title={
                [
                  'Dashboard',
                  'Events',
                  'Enrollment Management',
                  'Students',
                  'Daily Attendance',
                  'Learning Activities',
                  'Lesson Plans and Materials',
                  'Children Progress',
                  'My Task and Submissions',
                  'Notifications',
                  'Profile',
                ].includes(item.label)
                  ? undefined
                  : `${item.label} is not available yet`
              }
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === 'Notifications' && unreadNotifications > 0 && (
                <span
                  aria-label={`${unreadNotifications} unread notifications`}
                  className={styles.navBadge}
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
          <span>Logout</span>
        </button>
        <LogoutConfirmation
          open={isLogoutDialogOpen}
          onCancel={() => setIsLogoutDialogOpen(false)}
          onConfirm={() => void handleLogout()}
        />
      </aside>

      <div className={styles.mainArea}>
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
              placeholder={
                isStudentsPage || isAttendancePage
                  ? 'Search by name or nickname...'
                  : isTeacherEnrollmentPage
                    ? 'Search applications by child or parent...'
                    : isLearningActivitiesPage
                      ? 'Search by activity title or domain...'
                      : isLessonPlansPage
                        ? 'Search by lesson title, topic, or keyword...'
                        : isChildrenProgressPage
                          ? 'Search by name or keyword...'
                          : isTeacherTasksPage
                            ? 'Search by task title, description, or status...'
                            : isTeacherNotificationsPage
                              ? 'Search by title, sender, or keyword...'
                              : isTeacherProfilePage
                                ? 'Search your profile...'
                                : 'Search students, activities, or anything...'
              }
              aria-label={
                isAttendancePage
                  ? 'Search students by name or nickname'
                  : isTeacherEnrollmentPage
                    ? 'Search applications by child or parent'
                    : isStudentsPage
                      ? 'Search students by name or nickname'
                      : isLearningActivitiesPage
                        ? 'Search learning activities by title or domain'
                        : isLessonPlansPage
                          ? 'Search lesson plans by title, topic, or keyword'
                          : isChildrenProgressPage
                            ? 'Search children by name'
                            : isTeacherTasksPage
                              ? 'Search tasks by title, description, or status'
                              : isTeacherNotificationsPage
                                ? 'Search notifications by title, sender, or keyword'
                                : isTeacherProfilePage
                                  ? 'Search profile information'
                                  : 'Search students and activities'
              }
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className={styles.topbarActions}>
            <button
              aria-label={`Notifications, ${unreadNotifications} unread`}
              className={styles.notificationButton}
              type="button"
              aria-current={isTeacherNotificationsPage ? 'page' : undefined}
              onClick={() => navigate(routePaths.teacherNotifications)}
            >
              <Icon name="bell" />
              {unreadNotifications > 0 && (
                <span>{unreadNotifications}</span>
              )}
            </button>
            <button
              aria-label="View my profile"
              className={styles.profile}
              type="button"
              onClick={() => navigate(routePaths.teacherProfile)}
            >
              <Avatar
                name={
                  `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() ||
                  'Teacher'
                }
                size="small"
              />
              <span className={styles.profileCopy}>
                <strong>
                  {[user?.first_name, user?.last_name]
                    .filter(Boolean)
                    .join(' ') || 'Teacher'}
                </strong>
                <span>Teacher</span>
              </span>
              <span aria-hidden="true" className={styles.profileChevron}>
                ⌄
              </span>
            </button>
          </div>
        </header>

        {welcomeMessage && (
          <p aria-live="polite" className={styles.welcomeNotice} role="status">
            {welcomeMessage}
          </p>
        )}

        {isTeacherEventsPage ? (
          <EventsPage mode="manage" />
        ) : isTeacherEnrollmentPage ? (
          <TeacherEnrollmentPage />
        ) : isTeacherNotificationsPage ? (
          <EventNotifications />
        ) : isTeacherProfilePage ? (
          <TeacherProfile />
        ) : isTeacherTasksPage ? (
          <TeacherTasks globalSearch={query} />
        ) : isChildrenProgressPage ? (
          <ChildrenProgress globalSearch={query} />
        ) : isLessonPlansPage ? (
          <LessonPlans globalSearch={query} />
        ) : isLearningActivitiesPage ? (
          <LearningActivities globalSearch={query} />
        ) : isAttendancePage ? (
          <main
            aria-label="Daily Attendance"
            className={styles.dailyAttendancePage}
          >
            <header className={styles.attendancePageHeader}>
              <div className={styles.attendancePageTitle}>
                <span aria-hidden="true" className={styles.attendanceTitleIcon}>
                  <Icon name="calendar" />
                </span>
                <span>
                  <h1>Daily Attendance</h1>
                  <p>Record and manage your students’ attendance for the selected date.</p>
                </span>
              </div>
            </header>

            <div className={styles.attendanceToolbar}>
              <label className={styles.attendanceControl}>
                <Icon name="calendar" />
                <span className={styles.visuallyHidden}>Attendance date</span>
                <input
                  aria-label="Attendance date"
                  max={dateInputValue()}
                  required
                  type="date"
                  value={attendanceDate}
                  onChange={(event) => {
                    if (!event.target.value) return;
                    setAttendanceDate(event.target.value);
                    setSelectedAttendanceIds([]);
                    setAttendanceNotice('');
                  }}
                />
              </label>
              <label className={styles.attendanceControl}>
                <Icon name="clock" />
                <span className={styles.visuallyHidden}>Default late arrival time</span>
                <input
                  aria-label="Default late arrival time"
                  type="time"
                  value={attendanceTime}
                  onChange={(event) => {
                    setAttendanceTime(event.target.value);
                    setAttendanceNotice('');
                  }}
                />
              </label>
              <label className={styles.attendanceControl}>
                <span className={styles.visuallyHidden}>Attendance class</span>
                <select
                  aria-label="Attendance class"
                  value={attendanceClass}
                  onChange={(event) => {
                    setAttendanceClass(event.target.value);
                    setSelectedAttendanceIds([]);
                    setAttendanceNotice('');
                  }}
                >
                  <option value="">All assigned classes</option>
                  {[
                    ...new Map(
                      attendanceEntries.map(({ classId, student }) => [
                        classId,
                        student.className,
                      ]),
                    ).entries(),
                  ].map(([classId, className]) => (
                    <option key={classId} value={classId}>
                      {className}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" />
              </label>
              <button
                className={styles.saveAttendance}
                disabled={
                  attendanceLoading ||
                  attendanceSaving ||
                  !attendanceEntries.some(
                    (entry) =>
                      !entry.saved &&
                      (!attendanceClass || entry.classId === attendanceClass),
                  )
                }
                type="button"
                onClick={() => void saveAttendance()}
              >
                <Icon name="file" />
                {attendanceSaving ? 'Saving…' : 'Save Attendance'}
              </button>
              <div aria-label="Export attendance" className={styles.attendanceExports}>
                <button
                  className={styles.exportAttendance}
                  disabled={attendanceLoading}
                  onClick={() => exportAttendance('word')}
                  type="button"
                >
                  Export Word
                </button>
                <button
                  className={styles.exportAttendance}
                  disabled={attendanceLoading}
                  onClick={() => exportAttendance('excel')}
                  type="button"
                >
                  Export Excel (.csv)
                </button>
              </div>
            </div>

            {attendanceNotice && (
              <p aria-live="polite" className={styles.attendanceNotice}>
                {attendanceNotice}
              </p>
            )}

            <div className={styles.attendanceContent}>
              <section
                aria-label="Student attendance roster"
                className={styles.attendanceRosterPanel}
              >
                <div className={styles.attendanceTableScroll}>
                  <table className={styles.attendanceTable}>
                    <thead>
                      <tr>
                        <th scope="col">
                          <input
                            aria-label="Select all visible students"
                            checked={
                              attendanceStudents.some(({ saved }) => !saved) &&
                              attendanceStudents
                                .filter(({ saved }) => !saved)
                                .every(({ student }) =>
                                selectedAttendanceIds.includes(student.id),
                              )
                            }
                            disabled={!attendanceStudents.some(({ saved }) => !saved)}
                            type="checkbox"
                            onChange={toggleAllAttendanceSelection}
                          />
                        </th>
                        <th scope="col">#</th>
                        <th scope="col">Student Name</th>
                        <th scope="col">Nickname</th>
                        <th scope="col">Status</th>
                        <th scope="col">Arrival Time / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceLoading && (
                        <tr>
                          <td
                            className={styles.noAttendanceStudents}
                            colSpan={6}
                          >
                            <BouncingDots label="Loading attendance" />
                          </td>
                        </tr>
                      )}
                      {attendanceStudents.map(
                        ({ student, status, remarks, timeIn, saved }, index) => (
                          <tr key={student.id}>
                            <td>
                              <input
                                aria-label={`Select ${student.name}`}
                                checked={selectedAttendanceIds.includes(
                                  student.id,
                                )}
                                disabled={saved}
                                type="checkbox"
                                onChange={() =>
                                  toggleAttendanceSelection(student.id)
                                }
                              />
                            </td>
                            <td className={styles.attendanceNumber}>
                              {index + 1}
                            </td>
                            <th
                              className={styles.attendanceStudent}
                              scope="row"
                            >
                              <span
                                aria-hidden="true"
                                className={`${styles.attendanceAvatar} ${styles[`${student.tone}Portrait`]}`}
                              >
                                {student.face}
                              </span>
                              <span>{student.name}</span>
                            </th>
                            <td>{student.nickname}</td>
                            <td>
                              <div
                                aria-label={`Attendance status for ${student.name}`}
                                className={styles.statusChoices}
                                role="radiogroup"
                              >
                                {attendanceStatusOptions.map((option) => (
                                  <label
                                    className={`${styles.statusOption} ${
                                      styles[`status-${option.value}`]
                                    } ${
                                      status === option.value
                                        ? styles.selectedStatus
                                        : ''
                                    }`}
                                    key={option.value}
                                    title={option.label}
                                  >
                                    <input
                                      aria-label={option.label}
                                      checked={status === option.value}
                                      disabled={saved}
                                      name={`attendance-${student.id}`}
                                      type="radio"
                                      value={option.value}
                                      onChange={() =>
                                        updateAttendanceStatus(
                                          student.id,
                                          option.value,
                                        )
                                      }
                                    />
                                    <span>{option.label}</span>
                                  </label>
                                ))}
                                {status === null && (
                                  <span className={styles.unrecordedStatus}>
                                    Not recorded
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className={styles.attendanceDetails}>
                                {status === 'late' && (
                                  <label>
                                    <span>Arrival time</span>
                                    <input
                                      aria-label={`Arrival time for ${student.name}`}
                                      className={styles.attendanceRemarks}
                                      disabled={saved}
                                      required
                                      type="time"
                                      value={timeIn}
                                      onChange={(event) =>
                                        updateAttendanceTime(
                                          student.id,
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </label>
                                )}
                                <input
                                  aria-label={`Notes for ${student.name}`}
                                  aria-required={status === 'late' || status === 'excused'}
                                  className={styles.attendanceRemarks}
                                  disabled={saved}
                                  maxLength={2000}
                                  placeholder={
                                    status === 'late'
                                      ? 'Reason for being late'
                                      : status === 'excused'
                                        ? 'Reason for excuse'
                                        : 'Optional remarks'
                                  }
                                  required={status === 'late' || status === 'excused'}
                                  type="text"
                                  value={remarks}
                                  onChange={(event) =>
                                    updateAttendanceRemarks(
                                      student.id,
                                      event.target.value,
                                    )
                                  }
                                />
                                {saved && (
                                  <span className={styles.savedAttendanceNote}>
                                    Saved — cannot be changed
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                      {attendanceStudents.length === 0 && (
                        <tr>
                          <td
                            className={styles.noAttendanceStudents}
                            colSpan={6}
                          >
                            No students match your search or selected class.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {selectedAttendanceIds.length > 0 && (
                  <p aria-live="polite" className={styles.selectionNotice}>
                    {selectedAttendanceIds.length} student
                    {selectedAttendanceIds.length === 1 ? '' : 's'} selected.
                    Bulk actions will apply to this selection.
                  </p>
                )}
              </section>

              <aside
                aria-label="Attendance summary and actions"
                className={styles.attendanceAside}
              >
                <section
                  className={`${styles.attendancePanel} ${styles.summaryPanel}`}
                >
                  <h2>Attendance Summary</h2>
                  <div className={styles.summaryContent}>
                    <div
                      aria-label={`${attendanceSummary.present} present, ${attendanceSummary.absent} absent, ${attendanceSummary.late} late, ${attendanceSummary.excused} excused, ${attendanceSummary.notRecorded} not recorded, ${attendanceTotal} total students`}
                      className={styles.attendanceDonut}
                      role="img"
                      style={{
                        background: `conic-gradient(${attendanceGradient})`,
                      }}
                    >
                      <span>
                        <strong>{attendanceTotal}</strong>
                        <small>Total Students</small>
                      </span>
                    </div>
                    <ul className={styles.summaryLegend}>
                      {attendanceStatusOptions.map((option) => (
                        <li key={option.value}>
                          <i className={styles[`legend-${option.value}`]} />
                          <span>{option.label}</span>
                          <strong>{attendanceSummary[option.value]}</strong>
                        </li>
                      ))}
                      <li>
                        <i className={styles.legendNotRecorded} />
                        <span>Not recorded</span>
                        <strong>{attendanceSummary.notRecorded}</strong>
                      </li>
                    </ul>
                  </div>
                </section>

                <section
                  className={`${styles.attendancePanel} ${styles.quickAttendancePanel}`}
                >
                  <h2>Quick Actions</h2>
                  <div className={styles.bulkActions}>
                    {bulkAttendanceActions.map((action) => (
                      <button
                        className={`${styles.bulkAction} ${
                          styles[`bulk-${action.value}`]
                        }`}
                        key={action.value}
                        type="button"
                        onClick={() => applyBulkAttendanceStatus(action.value)}
                      >
                        <Icon name={action.icon} />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className={styles.attendanceTip}>
                    <Icon name="announcement" />
                    <span>
                      Review attendance before saving. Saved records are shared
                      with authorized administrators and the child’s parent.
                    </span>
                  </p>
                </section>
              </aside>
            </div>
          </main>
        ) : isStudentsPage ? (
          <main aria-label="Students" className={styles.studentsPage}>
            <section
              aria-labelledby="student-page-title"
              className={styles.studentsMain}
            >
              <header className={styles.studentsHeader}>
                <div className={styles.studentsTitle}>
                  <span aria-hidden="true" className={styles.studentsTitleIcon}>
                    <Icon name="students" />
                  </span>
                  <span>
                    <h1 id="student-page-title">Students</h1>
                    <p>Manage and view your students’ information.</p>
                  </span>
                </div>
                <span className={styles.studentCount}>
                  Total Students:{' '}
                  <strong>
                    {studentsLoading ? <BouncingDots label="Loading student count" size="small" inline /> : classStudents.length}
                  </strong>
                </span>
              </header>

              <div className={styles.studentFilters}>
                <label>
                  <span className={styles.visuallyHidden}>Filter by class</span>
                  <select
                    value={studentClass}
                    onChange={(event) => setStudentClass(event.target.value)}
                  >
                    <option value="">All Classes</option>
                    {[
                      ...new Set(
                        classStudents.flatMap((student) =>
                          student.className.split(', '),
                        ),
                      ),
                    ].map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron" />
                </label>
              </div>

              <div className={styles.studentCards}>
                {filteredClassStudents.map((student) => (
                  <article
                    className={`${styles.studentCard} ${
                      selectedStudentId === student.id
                        ? styles.selectedCard
                        : ''
                    }`}
                    key={student.id}
                  >
                    <div
                      className={`${styles.studentPortrait} ${styles.bluePortrait}`}
                    >
                      <span aria-hidden="true">
                        {student.name
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')}
                      </span>
                      <span className={styles.nickname}>
                        {student.nickname || 'No nickname'}
                      </span>
                    </div>
                    <strong className={styles.cardStudentName}>
                      {student.name}
                    </strong>
                    <span className={styles.cardInfo}>
                      <Icon name="profile" /> Age: {student.age}
                    </span>
                    <span className={styles.cardInfo}>
                      <Icon name="birthday" /> Birthday: {student.birthday}
                    </span>
                    <button
                      aria-pressed={selectedStudentId === student.id}
                      className={styles.viewProfile}
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setStudentTab('general');
                      }}
                    >
                      <Icon name="profile" />
                      View Profile
                    </button>
                  </article>
                ))}
                {studentsLoading && (
                  <p aria-live="polite" className={styles.emptyStudents}>
                    <BouncingDots label="Loading student records" />
                  </p>
                )}
                {studentsError && (
                  <p role="alert" className={styles.emptyStudents}>
                    {studentsError}
                  </p>
                )}
                {!studentsLoading &&
                  !studentsError &&
                  filteredClassStudents.length === 0 && (
                    <p className={styles.emptyStudents}>
                      {classStudents.length
                        ? 'No students match your search or selected class.'
                        : 'No enrolled students are assigned to your center.'}
                    </p>
                  )}
              </div>
            </section>

            {selectedStudent && (
              <aside
                aria-labelledby="student-profile-title"
                className={styles.profilePanel}
              >
                <button
                  aria-label="Close student profile"
                  className={styles.closeProfile}
                  type="button"
                  onClick={() => setSelectedStudentId(null)}
                >
                  <Icon name="close" />
                </button>
                <header className={styles.profileHeader}>
                  <div
                    className={`${styles.profilePortrait} ${styles.bluePortrait}`}
                  >
                    <span aria-hidden="true">
                      {selectedStudent.name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                  </div>
                  <div className={styles.profileHeading}>
                    <span
                      className={`${styles.profileNickname} ${styles.blueNickname}`}
                    >
                      {selectedStudent.nickname || 'No nickname'}
                    </span>
                    <h2 id="student-profile-title">{selectedStudent.name}</h2>
                    <span className={styles.gradePill}>
                      {selectedStudent.className}
                    </span>
                  </div>
                </header>

                <div
                  aria-label="Student profile sections"
                  className={styles.profileTabs}
                  role="tablist"
                >
                  <button
                    aria-selected={studentTab === 'general'}
                    aria-controls="student-profile-tabpanel"
                    className={
                      studentTab === 'general' ? styles.activeProfileTab : ''
                    }
                    id="student-tab-general"
                    role="tab"
                    type="button"
                    onClick={() => setStudentTab('general')}
                  >
                    General Information
                  </button>
                  <button
                    aria-selected={studentTab === 'guardian'}
                    aria-controls="student-profile-tabpanel"
                    className={
                      studentTab === 'guardian' ? styles.activeProfileTab : ''
                    }
                    id="student-tab-guardian"
                    role="tab"
                    type="button"
                    onClick={() => setStudentTab('guardian')}
                  >
                    Parents / Guardian
                  </button>
                  <button
                    aria-selected={studentTab === 'medical'}
                    aria-controls="student-profile-tabpanel"
                    className={
                      studentTab === 'medical' ? styles.activeProfileTab : ''
                    }
                    id="student-tab-medical"
                    role="tab"
                    type="button"
                    onClick={() => setStudentTab('medical')}
                  >
                    Medical Information
                  </button>
                </div>

                <div
                  aria-labelledby={`student-tab-${studentTab}`}
                  className={styles.profileTabContent}
                  id="student-profile-tabpanel"
                  role="tabpanel"
                >
                  {studentTab === 'general' && (
                    <>
                      <section className={styles.infoSection}>
                        <h3>
                          <Icon name="profile" />
                          General Information
                        </h3>
                        <dl className={styles.infoList}>
                          <div>
                            <dt>
                              <Icon name="students" />
                              Nickname
                            </dt>
                            <dd>
                              {selectedStudent.nickname || 'Not provided'}
                            </dd>
                          </div>
                          <div>
                            <dt>
                              <Icon name="profile" />
                              Full Name
                            </dt>
                            <dd>{selectedStudent.name}</dd>
                          </div>
                          <div>
                            <dt>
                              <Icon name="students" />
                              Age
                            </dt>
                            <dd>{selectedStudent.age} years old</dd>
                          </div>
                          <div>
                            <dt>
                              <Icon name="birthday" />
                              Birthday
                            </dt>
                            <dd>{selectedStudent.birthday}</dd>
                          </div>
                          <div>
                            <dt>
                              <Icon name="profile" />
                              Gender
                            </dt>
                            <dd>{selectedStudent.gender}</dd>
                          </div>
                          <div>
                            <dt>PSA Birth Certificate Number</dt>
                            <dd>
                              {selectedStudent.psaNumber || 'Not provided'}
                            </dd>
                          </div>
                          <div>
                            <dt>Nationality</dt>
                            <dd>
                              {selectedStudent.nationality || 'Not provided'}
                            </dd>
                          </div>
                          <div>
                            <dt>Place of Birth</dt>
                            <dd>
                              {selectedStudent.placeOfBirth || 'Not provided'}
                            </dd>
                          </div>
                          <div>
                            <dt>
                              <Icon name="book" />
                              Class
                            </dt>
                            <dd>{selectedStudent.className}</dd>
                          </div>
                          <div>
                            <dt>
                              <Icon name="file" />
                              Student ID
                            </dt>
                            <dd>
                              STU-{String(selectedStudent.id).padStart(4, '0')}
                            </dd>
                          </div>
                        </dl>
                      </section>
                      <section className={styles.infoSection}>
                        <h3>
                          <Icon name="phone" />
                          Contact Information
                        </h3>
                        <dl className={styles.infoList}>
                          <div>
                            <dt>
                              <Icon name="location" />
                              Address
                            </dt>
                            <dd>{selectedStudent.address || 'Not provided'}</dd>
                          </div>
                          <div>
                            <dt>
                              <Icon name="phone" />
                              Phone Number
                            </dt>
                            <dd>{selectedStudent.phone || 'Not provided'}</dd>
                          </div>
                        </dl>
                      </section>
                    </>
                  )}
                  {studentTab === 'guardian' && (
                    <section className={styles.infoSection}>
                      <h3>
                        <Icon name="students" />
                        Parent / Guardian Information
                      </h3>
                      <dl className={styles.infoList}>
                        <div>
                          <dt>
                            <Icon name="profile" />
                            Full Name
                          </dt>
                          <dd>{selectedStudent.guardian || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt>
                            <Icon name="students" />
                            Relationship
                          </dt>
                          <dd>
                            {selectedStudent.guardianRelation || 'Not provided'}
                          </dd>
                        </div>
                        <div>
                          <dt>
                            <Icon name="phone" />
                            Phone Number
                          </dt>
                          <dd>
                            {selectedStudent.guardianPhone || 'Not provided'}
                          </dd>
                        </div>
                        <div>
                          <dt>Email Address</dt>
                          <dd>
                            {selectedStudent.guardianEmail || 'Not provided'}
                          </dd>
                        </div>
                        <div>
                          <dt>
                            <Icon name="location" />
                            Address
                          </dt>
                          <dd>
                            {selectedStudent.guardianAddress ||
                              selectedStudent.address ||
                              'Not provided'}
                          </dd>
                        </div>
                      </dl>
                    </section>
                  )}
                  {studentTab === 'medical' && (
                    <section className={styles.infoSection}>
                      <h3>
                        <Icon name="medical" />
                        Medical Information
                      </h3>
                      <dl className={styles.infoList}>
                        <div>
                          <dt>
                            <Icon name="medical" />
                            Medical Notes
                          </dt>
                          <dd>
                            {selectedStudent.medical ||
                              'No medical notes recorded.'}
                          </dd>
                        </div>
                        <div>
                          <dt>Blood Type</dt>
                          <dd>{selectedStudent.bloodType || 'Not provided'}</dd>
                        </div>
                        <div>
                          <dt>Allergies</dt>
                          <dd>
                            {selectedStudent.allergies || 'None recorded'}
                          </dd>
                        </div>
                        <div>
                          <dt>Immunization Status</dt>
                          <dd>
                            {selectedStudent.immunizationStatus ||
                              'Not provided'}
                          </dd>
                        </div>
                        <div>
                          <dt>
                            <Icon name="phone" />
                            Emergency Contact
                          </dt>
                          <dd>
                            {selectedStudent.emergencyName || 'Not provided'}
                            {selectedStudent.emergencyPhone
                              ? ` · ${selectedStudent.emergencyPhone}`
                              : ''}
                            {selectedStudent.emergencyRelationship
                              ? ` · ${selectedStudent.emergencyRelationship}`
                              : ''}
                          </dd>
                        </div>
                      </dl>
                    </section>
                  )}
                </div>
                <button
                  className={styles.backToStudents}
                  type="button"
                  onClick={() => setSelectedStudentId(null)}
                >
                  <Icon name="back" />
                  Back to Students
                </button>
              </aside>
            )}
          </main>
        ) : (
          <main aria-label="Teacher dashboard" className={styles.dashboardBody}>
            <div className={styles.primaryColumn}>
              <section
                aria-label="Welcome"
                className={styles.welcomePanel}
                style={{ backgroundImage: `url("${femalePanel}")` }}
              >
                <div className={styles.welcomeCopy}>
                  <h1>
                    {getGreeting()},{' '}
                    {[user?.first_name, user?.last_name]
                      .filter(Boolean)
                      .join(' ') || 'Teacher'}
                    !
                  </h1>
                  <p>
                    Here’s an overview of your class and activities for today.
                  </p>
                </div>
                <div className={styles.date}>
                  <Icon name="calendar" />
                  <span>
                    <strong>{getDateLabel()}</strong>
                    <small>Class overview</small>
                  </span>
                </div>
              </section>

              {dashboardError && (
                <p className={styles.dashboardError} role="alert">
                  {dashboardError}
                </p>
              )}

              <section aria-label="Class summary" className={styles.stats}>
                <article className={`${styles.statCard} ${styles.statBlue}`}>
                  <span className={styles.statIcon}>
                    <Icon name="students" />
                  </span>
                  <span className={styles.statLabel}>Total Students</span>
                  <strong className={styles.statValue}>
                    {dashboardData?.total_students ??
                      (dashboardLoading ? <BouncingDots size="small" inline /> : '—')}
                  </strong>
                  <span className={styles.statDetail}>
                    Enrolled in your class
                  </span>
                  <span aria-hidden="true" className={styles.statArrow}>
                    <Icon name="chevron" />
                  </span>
                </article>
                <article className={`${styles.statCard} ${styles.statGreen}`}>
                  <span className={styles.statIcon}>
                    <Icon name="calendar" />
                  </span>
                  <span className={styles.statLabel}>Present Today</span>
                  <strong className={styles.statValue}>
                    {dashboardData?.present_today ??
                      (dashboardLoading ? <BouncingDots size="small" inline /> : '—')}
                  </strong>
                  <span className={styles.statDetail}>
                    {dashboardData
                      ? `Attendance rate: ${dashboardData.attendance_rate}%`
                      : 'Attendance rate unavailable'}
                  </span>
                  <span aria-hidden="true" className={styles.statArrow}>
                    <Icon name="chevron" />
                  </span>
                </article>
                <article className={`${styles.statCard} ${styles.statYellow}`}>
                  <span className={styles.statIcon}>
                    <Icon name="book" />
                  </span>
                  <span className={styles.statLabel}>Learning Activities</span>
                  <strong className={styles.statValue}>
                    {dashboardData?.learning_activities ??
                      (dashboardLoading ? <BouncingDots size="small" inline /> : '—')}
                  </strong>
                  <span className={styles.statDetail}>Created this week</span>
                  <span aria-hidden="true" className={styles.statArrow}>
                    <Icon name="chevron" />
                  </span>
                </article>
                <article className={`${styles.statCard} ${styles.statPurple}`}>
                  <span className={styles.statIcon}>
                    <Icon name="tasks" />
                  </span>
                  <span className={styles.statLabel}>Pending Submissions</span>
                  <strong className={styles.statValue}>
                    {dashboardData?.pending_submissions ??
                      (dashboardLoading ? <BouncingDots size="small" inline /> : '—')}
                  </strong>
                  <span className={styles.statDetail}>From your tasks</span>
                  <span aria-hidden="true" className={styles.statArrow}>
                    <Icon name="chevron" />
                  </span>
                </article>
              </section>

              <div className={styles.analyticsRow}>
                <section
                  aria-labelledby="attendance-heading"
                  className={styles.panel}
                >
                  <header className={styles.panelHeader}>
                    <h2 id="attendance-heading">
                      <Icon name="calendar" />
                      Attendance Overview
                    </h2>
                    <span
                      className={styles.periodButton}
                    >
                      This Week
                    </span>
                  </header>
                  <div
                    aria-label="Weekly attendance bar chart showing present and absent students"
                    className={styles.chart}
                    role="img"
                  >
                    <div className={styles.chartScale}>
                      {attendanceScale.map((value, index) => (
                        <span key={`${value}-${index}`}>{value}</span>
                      ))}
                    </div>
                    <div
                      className={styles.chartPlot}
                      style={{
                        gridTemplateColumns: `repeat(${weeklyAttendance.length}, minmax(0, 1fr))`,
                      }}
                    >
                      <div className={styles.gridLine} />
                      <div className={styles.gridLine} />
                      <div className={styles.gridLine} />
                      <div className={styles.gridLine} />
                      {weeklyAttendance.map((item) => (
                        <div
                          className={styles.barGroup}
                          key={`${item.day}-${item.date}`}
                        >
                          <div className={styles.bars}>
                            <span
                              className={styles.presentBar}
                              style={{
                                height: `${(item.present / attendanceChartMaximum) * 100}%`,
                              }}
                            />
                            <span
                              className={styles.absentBar}
                              style={{
                                height: `${(item.absent / attendanceChartMaximum) * 100}%`,
                              }}
                            />
                          </div>
                          <span className={styles.barDay}>{item.day}</span>
                          <small>{item.date}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.chartLegend}>
                    <span>
                      <i className={styles.legendPresent} />
                      Present
                    </span>
                    <span>
                      <i className={styles.legendAbsent} />
                      Absent
                    </span>
                  </div>
                </section>

                <section
                  aria-labelledby="students-heading"
                  className={styles.panel}
                >
                  <header className={styles.panelHeader}>
                    <h2 id="students-heading">
                      <Icon name="students" />
                      Recent Students
                    </h2>
                    <Link
                      to={routePaths.teacherStudents}
                      className={styles.viewAll}
                    >
                      View All
                    </Link>
                  </header>
                  <ul className={styles.studentList} id="students">
                    {filteredStudents.map((student, index) => (
                      <li className={styles.studentRow} key={student.id}>
                        {(() => {
                          const name = [
                            student.first_name,
                            student.middle_name,
                            student.last_name,
                          ]
                            .filter(Boolean)
                            .join(' ');
                          const status = student.attendance_status;
                          const age = Math.max(
                            0,
                            today.getFullYear() -
                              new Date(student.birth_date).getFullYear() -
                              (today <
                              new Date(
                                today.getFullYear(),
                                new Date(student.birth_date).getMonth(),
                                new Date(student.birth_date).getDate(),
                              )
                                ? 1
                                : 0),
                          );
                          return (
                            <>
                              <span
                                className={`${styles.studentAvatar} ${styles[`avatar${index + 1}`]}`}
                              >
                                {student.first_name.charAt(0)}
                                {student.last_name.charAt(0)}
                              </span>
                              <span className={styles.studentCopy}>
                                <strong>{name}</strong>
                                <small>
                                  {age} years old · {student.class_name}
                                </small>
                              </span>
                              <span
                                className={`${styles.attendanceStatus} ${
                                  status === 'absent'
                                    ? styles.absent
                                    : status
                                      ? styles.present
                                      : styles.notRecorded
                                }`}
                              >
                                {status
                                  ? status.charAt(0).toUpperCase() +
                                    status.slice(1)
                                  : 'Not recorded'}
                              </span>
                              <span className={styles.studentDate}>
                                {new Date(
                                  student.enrolled_at.replace(' ', 'T'),
                                ).toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </>
                          );
                        })()}
                      </li>
                    ))}
                    {!dashboardLoading && filteredStudents.length === 0 && (
                      <li className={styles.noResults}>
                        {dashboardError
                          ? 'Student data is unavailable.'
                          : query
                            ? 'No students match your search.'
                            : 'No students are enrolled in your center yet.'}
                      </li>
                    )}
                    {dashboardLoading && (
                      <li className={styles.noResults}><BouncingDots label="Loading students" /></li>
                    )}
                  </ul>
                </section>
              </div>

              <section
                aria-labelledby="quick-actions-heading"
                className={`${styles.panel} ${styles.quickPanel}`}
              >
                <header className={styles.panelHeader}>
                  <h2 id="quick-actions-heading">
                    <Icon name="lightning" />
                    Quick Actions
                  </h2>
                </header>
                <div className={styles.quickActions}>
                  {quickActions.map((action) => (
                    <button
                      className={styles.quickAction}
                      key={action.label}
                      type="button"
                      onClick={() => navigate(action.path)}
                    >
                      <Icon name={action.icon} />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <aside aria-label="Class updates" className={styles.rightRail}>
              <section
                aria-labelledby="announcements-heading"
                className={styles.panel}
              >
                <header className={styles.panelHeader}>
                  <h2 id="announcements-heading">
                    <Icon name="announcement" />
                    Latest Announcements
                  </h2>
                  <a className={styles.viewAll} href="#announcements">
                    View All
                  </a>
                </header>
                <ul className={styles.announcementList} id="announcements">
                  {announcements.map((announcement, index) => (
                    <li
                      className={styles.announcement}
                      key={announcement.title}
                    >
                      <span
                        className={`${styles.announcementIcon} ${styles[announcement.tone]}`}
                      >
                        {index === 0 ? (
                          <Icon name="file" />
                        ) : index === 1 ? (
                          <Icon name="calendar" />
                        ) : (
                          <Icon name="students" />
                        )}
                      </span>
                      <span className={styles.announcementCopy}>
                        <strong>{announcement.title}</strong>
                        <small>
                          {announcement.source}
                          <i />
                          {announcement.time}
                        </small>
                      </span>
                    </li>
                  ))}
                  {announcements.length === 0 && (
                    <li className={styles.noResults}>
                      {announcementsError
                        ? announcementsError
                        : 'No announcements available.'}
                    </li>
                  )}
                </ul>
              </section>

              <section
                aria-labelledby="activities-heading"
                className={styles.panel}
              >
                <header className={styles.panelHeader}>
                  <h2 id="activities-heading">
                    <Icon name="calendar" />
                    Upcoming Activities
                  </h2>
                  <a className={styles.viewAll} href="#activities">
                    View All
                  </a>
                </header>
                <ul className={styles.activityList} id="activities">
                  {(dashboardData?.upcoming_activities ?? []).map(
                    (activity) => {
                      const dueAt = new Date(activity.due_at.replace(' ', 'T'));
                      return (
                        <li className={styles.activity} key={activity.id}>
                          <time
                            className={styles.activityDate}
                            dateTime={activity.due_at.replace(' ', 'T')}
                          >
                            <small>
                              {dueAt.toLocaleDateString('en-PH', {
                                month: 'short',
                              })}
                            </small>
                            <strong>{dueAt.getDate()}</strong>
                          </time>
                          <span className={styles.activityCopy}>
                            <strong>{activity.title}</strong>
                            <small>
                              {dueAt.toLocaleTimeString('en-PH', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}{' '}
                              · {activity.class_name}
                            </small>
                          </span>
                          <Icon name="chevron" />
                        </li>
                      );
                    },
                  )}
                  {!dashboardLoading &&
                    !dashboardError &&
                    dashboardData?.upcoming_activities.length === 0 && (
                      <li className={styles.noResults}>
                        No upcoming published activities.
                      </li>
                    )}
                  {dashboardLoading && (
                    <li className={styles.noResults}>
                      <BouncingDots label="Loading upcoming activities" />
                    </li>
                  )}
                  {dashboardError && (
                    <li className={styles.noResults}>
                      Activities are unavailable.
                    </li>
                  )}
                </ul>
              </section>
            </aside>
          </main>
        )}
      </div>
    </div>
  );
}
