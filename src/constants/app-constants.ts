export const appName = 'KalingaLink';
export const requiredCdcNames = [
  'Cacawan Centro Pamana CDC',
  'Marfrancisco CDC',
  'Papandayan Highway CDC',
] as const;
export const tagline = 'Learn • Grow • Build a Brighter Future';
export const welcomeButtonLabel = 'Get Started';
export const logoAltText = `${appName} logo. ${tagline}`;
export const accountChoiceHeading = 'Are you new to KalingaLink?';
export const accountChoiceDescription = 'Choose the account that fits you.';
export const parentAccountTitle = 'Parent';
export const parentChoiceDescription =
  "Access your child's records, updates, and important announcements.";
export const parentAccountDescription =
  'Create an account to enroll your child in a Child Development Center, track application status, and monitor your child’s development.';
export const parentAccountAction = 'Create Parent Account';
export const teacherAccountTitle = 'Teacher';
export const teacherChoiceDescription =
  "Manage your class, track children's progress, and view reports.";
export const teacherAccountDescription =
  'Create an account to access your assigned Child Development Center, manage attendance, and monitor children’s learning progress.';
export const teacherAccountAction = 'Create Teacher Account';
export const existingAccountButtonLabel = 'No, I already have an account';
export const existingAccountDescription =
  'Log in to your existing KalingaLink account.';
export const backButtonLabel = 'Back';

export const routePaths = {
  welcome: '/',
  accountChoice: '/get-started',
  signup: '/signup',
  parentSignup: '/signup/parent',
  teacherSignup: '/signup/teacher',
  login: '/login',
  mswdoAdmin: '/admin/dashboard',
  adminEvents: '/admin/events',
  childDevelopmentCenters: '/admin/centers',
  enrollmentManagement: '/admin/enrollment',
  childrenRecords: '/admin/children',
  attendanceMonitoring: '/admin/attendance',
  learningDevelopment: '/admin/learning-development',
  reportsAnalytics: '/admin/reports',
  notificationsAlerts: '/admin/notifications',
  settings: '/admin/settings',
  teacherManagement: '/admin/teachers',
  addTeacher: '/admin/teachers/add',
  teacherDashboard: '/teacher/dashboard',
  teacherEvents: '/teacher/events',
  teacherEnrollment: '/teacher/enrollment',
  teacherStudents: '/teacher/students',
  teacherAttendance: '/teacher/attendance',
  teacherLearningActivities: '/teacher/learning-activities',
  teacherLessonPlans: '/teacher/lesson-plans',
  teacherChildrenProgress: '/teacher/children-progress',
  teacherTasks: '/teacher/tasks',
  teacherNotifications: '/teacher/notifications',
  teacherProfile: '/teacher/profile',
  teacherVerification: '/teacher/verification',
  parentDashboard: '/parent/dashboard',
  parentEvents: '/parent/events',
  parentNotifications: '/parent/notifications',
  parentActivities: '/parent/activities',
  parentEnrollment: '/parent/enrollment',
  parentApplicationStatus: '/parent/application-status',
  parentChildren: '/parent/children',
  parentAttendance: '/parent/attendance',
  parentProgress: '/parent/progress',
  parentAnnouncements: '/parent/announcements',
  parentProfile: '/parent/profile',
} as const;
