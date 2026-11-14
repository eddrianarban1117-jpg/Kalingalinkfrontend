import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { routePaths } from '../../constants/app-constants';
import styles from './MswdoDashboard.module.css';
import { Avatar } from '../../components/common/Avatar/Avatar';
import { Logo } from '../../components/common/Logo/Logo';
import { LogoutConfirmation } from '../../components/common/LogoutConfirmation/LogoutConfirmation';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import { useNotificationCount } from '../../hooks/useNotificationCount';

type IconName =
  | 'dashboard'
  | 'events'
  | 'centers'
  | 'enrollment'
  | 'children'
  | 'teachers'
  | 'attendance'
  | 'learning'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'logout'
  | 'search'
  | 'calendar'
  | 'arrow'
  | 'chevron'
  | 'bell'
  | 'home'
  | 'record'
  | 'user'
  | 'menu'
  | 'close';

function Icon({ name, className }: { name: IconName; className?: string }) {
  const shared = {
    'aria-hidden': true as const,
    className,
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
    case 'close':
      return (
        <svg {...shared}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...shared}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'centers':
    case 'home':
      return (
        <svg {...shared}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9M9 20v-7h6v7" />
        </svg>
      );
    case 'enrollment':
    case 'record':
      return (
        <svg {...shared}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h3" />
          <path d="m3 6 2-2m14 14 2 2" />
        </svg>
      );
    case 'children':
    case 'teachers':
    case 'user':
      return (
        <svg {...shared}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20z" />
          <path d="M16 5.5a3.5 3.5 0 0 1 0 6.8M18 14a5 5 0 0 1 3.5 4.8V20" />
        </svg>
      );
    case 'attendance':
    case 'calendar':
    case 'events':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18M8 14h2m4 0h2m-8 3h2" />
        </svg>
      );
    case 'learning':
      return (
        <svg {...shared}>
          <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22z" />
          <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v17h6.5A2.5 2.5 0 0 1 21 22z" />
        </svg>
      );
    case 'reports':
      return (
        <svg {...shared}>
          <path d="M4 20V11h4v9zm6 0V4h4v16zm6 0v-7h4v7z" />
        </svg>
      );
    case 'notifications':
    case 'bell':
      return (
        <svg {...shared}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="3" />
          <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z" />
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
    case 'arrow':
      return (
        <svg {...shared}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...shared}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
  }
}

const navigationGroups: {
  label: string;
  items: { label: string; icon: IconName }[];
}[] = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: 'dashboard' },
      { label: 'Events', icon: 'events' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { label: 'Child Development Centers', icon: 'centers' },
      { label: 'Enrollment Management', icon: 'enrollment' },
      { label: 'Children Records', icon: 'children' },
      { label: 'Teacher Management', icon: 'teachers' },
    ],
  },
  {
    label: 'PROGRAMS & OPERATIONS',
    items: [
      { label: 'Attendance and Monitoring', icon: 'attendance' },
      { label: 'Learning and Development', icon: 'learning' },
    ],
  },
  {
    label: 'INSIGHTS & COMMUNICATION',
    items: [
      { label: 'Reports and Analytics', icon: 'reports' },
      { label: 'Notification and Alerts', icon: 'notifications' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Settings', icon: 'settings' },
      { label: 'Log Out', icon: 'logout' },
    ],
  },
];

function getTodayLabel() {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

type DashboardData = {
  stats: {
    centers: number;
    enrolled_children: number;
    teachers: number;
    parents?: number;
    active_children: number;
  };
  monthly_enrollments: { month: number; total: number }[];
  centers: {
    id: number;
    name: string;
    location: string;
    children: number;
    capacity: number;
  }[];
  activities: {
    type: string;
    title: string;
    description: string;
    occurred_at: string;
  }[];
  year: number;
};

type DashboardResponse = { data: DashboardData };

const summaryCards = [
  {
    key: 'centers',
    label: 'Child Development Centers',
    detail: 'Active centers',
    icon: 'centers',
    color: 'teal',
  },
  {
    key: 'enrolled_children',
    label: 'Enrolled Children',
    detail: 'Currently enrolled',
    icon: 'children',
    color: 'gold',
  },
  {
    key: 'teachers',
    label: 'Teachers',
    detail: 'Active accounts',
    icon: 'teachers',
    color: 'pink',
  },
  {
    key: 'parents',
    label: 'Parents',
    detail: 'Active accounts',
    icon: 'user',
    color: 'blue',
  },
  {
    key: 'active_children',
    label: 'Active Children Records',
    detail: 'Not withdrawn',
    icon: 'record',
    color: 'purple',
  },
] as const;

const activityAppearance: Record<string, { icon: IconName; color: string }> = {
  enrollment: { icon: 'enrollment', color: 'teal' },
  enrollment_status: { icon: 'record', color: 'purple' },
  attendance: { icon: 'calendar', color: 'gold' },
  teacher: { icon: 'user', color: 'pink' },
  child: { icon: 'children', color: 'purple' },
};

function relativeTime(value: string) {
  const timestamp = new Date(value.replace(' ', 'T')).getTime();
  if (Number.isNaN(timestamp)) return value;
  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

type MswdoDashboardProps = {
  activeNavigation?: string;
  children?: ReactNode;
};

export function MswdoDashboard({
  activeNavigation: activeNavigationProp = 'Dashboard',
  children,
}: MswdoDashboardProps) {
  const { user, request, logout } = useAuth();
  const [activeNavigation, setActiveNavigation] =
    useState(activeNavigationProp);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [dashboardLoading, setDashboardLoading] = useState(!children);
  const [dashboardError, setDashboardError] = useState('');
  const latestDashboardRequest = useRef(0);
  const navigate = useNavigate();
  const unreadNotifications = useNotificationCount();
  const isDashboard = !children;
  const adminName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Admin';
  const firstName = user?.first_name || 'Admin';
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12
      ? 'Good Morning'
      : hour < 18
        ? 'Good Afternoon'
        : 'Good Evening';
  }, []);
  const enrollmentByMonth = new Map(
    dashboardData?.monthly_enrollments.map(({ month, total }) => [
      month,
      total,
    ]) ?? [],
  );
  const monthLabels = Array.from({ length: 12 }, (_, index) =>
    new Date(
      dashboardData?.year ?? new Date().getFullYear(),
      index,
      1,
    ).toLocaleDateString(undefined, { month: 'short' }),
  );
  const maxEnrollment = Math.max(
    10,
    Math.ceil(Math.max(...enrollmentByMonth.values(), 0) / 10) * 10,
  );
  const axisLabels = Array.from({ length: 6 }, (_, index) =>
    Math.round((maxEnrollment * (5 - index)) / 5),
  );

  const reloadDashboard = useCallback(
    async (isActive: () => boolean = () => true) => {
      const requestId = ++latestDashboardRequest.current;
      setDashboardError('');
      try {
        const response = await request<DashboardResponse>(
          '/api/admin/dashboard',
        );
        if (requestId !== latestDashboardRequest.current || !isActive()) return;
        setDashboardData(response.data);
      } catch (error) {
        if (requestId !== latestDashboardRequest.current || !isActive()) return;
        setDashboardData(null);
        setDashboardError(
          error instanceof Error
            ? error.message
            : 'Dashboard data could not be loaded.',
        );
      } finally {
        if (requestId === latestDashboardRequest.current && isActive()) {
          setDashboardLoading(false);
        }
      }
    },
    [request],
  );

  useEffect(() => {
    if (!isDashboard) return;
    let active = true;
    const refresh = () => {
      if (active && document.visibilityState === 'visible') {
        void reloadDashboard(() => active);
      }
    };
    void reloadDashboard(() => active);
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [isDashboard, reloadDashboard]);

  function closeLogoutDialog() {
    setIsLogoutDialogOpen(false);
  }

  async function confirmLogout() {
    closeLogoutDialog();
    try {
      await logout();
    } catch (error) {
      setDashboardError(
        error instanceof Error ? error.message : 'Could not complete sign out.',
      );
    } finally {
      navigate(routePaths.login, { replace: true });
    }
  }

  return (
    <main className={styles.dashboard}>
      {isNavigationOpen && (
        <button
          aria-label="Close navigation"
          className={styles.navigationOverlay}
          type="button"
          onClick={() => setIsNavigationOpen(false)}
        />
      )}
      <aside
        aria-label="Admin navigation"
        className={`${styles.sidebar} ${isNavigationOpen ? styles.sidebarOpen : ''}`}
      >
        <div className={styles.brand}>
          <Logo alt="KalingaLink" variant="adminSidebar" />
        </div>

        <nav className={styles.navigation} aria-label="Admin navigation">
          {navigationGroups
            .filter((group) => group.label !== 'SYSTEM')
            .map((group) => (
              <section className={styles.navigationGroup} key={group.label}>
                <h2 className={styles.navigationHeading}>{group.label}</h2>
                {group.items.map((item) => (
                  <button
                    aria-current={
                      activeNavigation === item.label ? 'page' : undefined
                    }
                    className={`${styles.navItem} ${activeNavigation === item.label ? styles.activeNavItem : ''}`}
                    key={item.label}
                    onClick={() => {
                      setIsNavigationOpen(false);
                      if (item.label === 'Dashboard') {
                        setActiveNavigation(item.label);
                        navigate(routePaths.mswdoAdmin);
                      } else if (item.label === 'Events') {
                        setActiveNavigation(item.label);
                        navigate(routePaths.adminEvents);
                      } else if (item.label === 'Child Development Centers') {
                        setActiveNavigation(item.label);
                        navigate(routePaths.childDevelopmentCenters);
                      } else if (item.label === 'Enrollment Management') {
                        setActiveNavigation(item.label);
                        navigate(routePaths.enrollmentManagement);
                      } else if (item.label === 'Children Records') {
                        setActiveNavigation(item.label);
                        navigate(routePaths.childrenRecords);
                      } else if (item.label === 'Attendance and Monitoring') {
                        setActiveNavigation(item.label);
                        navigate(routePaths.attendanceMonitoring);
                      } else if (item.label === 'Learning and Development') {
                        setActiveNavigation(item.label);
                        navigate(routePaths.learningDevelopment);
                      } else if (item.label === 'Reports and Analytics') {
                        setActiveNavigation(item.label);
                        navigate(routePaths.reportsAnalytics);
                      } else if (item.label === 'Notification and Alerts') {
                        setActiveNavigation(item.label);
                        navigate(routePaths.notificationsAlerts);
                      } else if (item.label === 'Teacher Management') {
                        setActiveNavigation(item.label);
                        navigate(routePaths.teacherManagement);
                      }
                    }}
                    type="button"
                  >
                    <Icon className={styles.navIcon} name={item.icon} />
                    <span>
                      {item.label === 'Attendance and Monitoring'
                        ? 'Attendance & Monitoring'
                        : item.label === 'Learning and Development'
                          ? 'Learning & Development'
                          : item.label === 'Reports and Analytics'
                            ? 'Reports & Analytics'
                            : item.label === 'Notification and Alerts'
                              ? 'Notifications & Alerts'
                              : item.label}
                    </span>
                    {item.label === 'Notification and Alerts' &&
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
              </section>
            ))}
        </nav>
        {navigationGroups
          .filter((group) => group.label === 'SYSTEM')
          .map((group) => (
            <section
              aria-label="System"
              className={`${styles.navigationGroup} ${styles.systemNavigationGroup}`}
              key={group.label}
            >
              <h2 className={styles.navigationHeading}>{group.label}</h2>
              {group.items.map((item) => (
                <button
                  aria-current={activeNavigation === item.label ? 'page' : undefined}
                  className={`${styles.navItem} ${activeNavigation === item.label ? styles.activeNavItem : ''}`}
                  key={item.label}
                  onClick={() => {
                    setIsNavigationOpen(false);
                    if (item.label === 'Log Out') {
                      setIsLogoutDialogOpen(true);
                    } else if (item.label === 'Settings') {
                      setActiveNavigation(item.label);
                      navigate(routePaths.settings);
                    }
                  }}
                  type="button"
                >
                  <Icon className={styles.navIcon} name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </section>
          ))}
      </aside>

      <LogoutConfirmation
        open={isLogoutDialogOpen}
        onCancel={closeLogoutDialog}
        onConfirm={() => void confirmLogout()}
      />

      <section className={styles.mainArea}>
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
            <input aria-label="Search dashboard" placeholder="Search..." />
          </label>
          <div className={styles.topbarActions}>
            <button
              className={styles.iconButton}
              type="button"
              aria-label="Notifications"
              onClick={() => navigate(routePaths.notificationsAlerts)}
            >
              <Icon name="bell" />
            </button>
            <button
              className={styles.profile}
              type="button"
              aria-label={`${adminName}, MSWDO Admin`}
            >
              <Avatar name={adminName} size="small" />
              <span className={styles.profileText}>
                <strong>{adminName}</strong>
                <span>MSWDO Admin</span>
              </span>
              <Icon className={styles.profileChevron} name="chevron" />
            </button>
          </div>
        </header>

        {children ? (
          <div className={styles.dashboardContent}>{children}</div>
        ) : (
          <div className={styles.dashboardContent}>
            <div className={styles.welcomeRow}>
              <div>
                <h1>
                  {greeting}, {firstName}!
                </h1>
                <p>
                  Manage Child Development Centers, enrollment, and children's
                  welfare services.
                </p>
              </div>
              <div className={styles.dateCard}>
                <Icon name="calendar" />
                <span>
                  <strong>{getTodayLabel()}</strong>
                  <span>Today</span>
                </span>
              </div>
            </div>

            {dashboardError && (
              <p className={styles.dashboardError} role="alert">
                {dashboardError}
              </p>
            )}

            <section
              className={styles.summaryGrid}
              aria-label="Dashboard summary"
            >
              {summaryCards.map((card) => (
                <article
                  className={`${styles.summaryCard} ${styles[card.color]}`}
                  key={card.label}
                >
                  <div className={styles.summaryTop}>
                    <span className={styles.summaryIcon}>
                      <Icon name={card.icon} />
                    </span>
                    <span className={styles.summaryLabel}>{card.label}</span>
                  </div>
                  <strong className={styles.summaryValue}>
                    {dashboardLoading ? (
                      <BouncingDots
                        label={`Loading ${card.label.toLowerCase()}`}
                        size="small"
                        inline
                      />
                    ) : (
                      (dashboardData?.stats[card.key]?.toLocaleString() ?? '—')
                    )}
                  </strong>
                  <span className={styles.summaryDetail}>{card.detail}</span>
                  <span className={styles.summaryArrow}>
                    <Icon name="arrow" />
                  </span>
                </article>
              ))}
            </section>

            <div className={styles.dashboardGrid}>
              <div className={styles.primaryColumn}>
                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2>Monthly Enrollment Applications</h2>
                    <span className={styles.panelAction}>
                      <Icon name="calendar" />
                      <span>
                        {dashboardData?.year ?? new Date().getFullYear()}
                      </span>
                    </span>
                  </div>
                  <div
                    aria-label={`Monthly enrollment applications for ${dashboardData?.year ?? new Date().getFullYear()}`}
                    className={styles.chart}
                    role="img"
                  >
                    <div className={styles.yAxis} aria-hidden="true">
                      {axisLabels.map((value, index) => (
                        <span key={`${index}:${value}`}>{value}</span>
                      ))}
                    </div>
                    <div className={styles.chartBody}>
                      <div className={styles.chartGridLines} aria-hidden="true">
                        {Array.from({ length: 6 }, (_, index) => (
                          <span key={index} />
                        ))}
                      </div>
                      <div className={styles.chartBars}>
                        {monthLabels.map((month, index) => {
                          const total = enrollmentByMonth.get(index + 1) ?? 0;
                          return (
                            <div className={styles.barColumn} key={month}>
                              <span
                                className={`${styles.bar} ${index === new Date().getMonth() ? styles.highlightBar : ''}`}
                                style={{
                                  height: `${(total / maxEnrollment) * 100}%`,
                                }}
                                title={`${month}: ${total} applications`}
                              />
                              <span className={styles.monthLabel}>{month}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {!dashboardLoading &&
                    dashboardData?.monthly_enrollments.every(
                      ({ total }) => total === 0,
                    ) && (
                      <p className={styles.dataState}>
                        No enrollment applications are recorded for this year.
                      </p>
                    )}
                </section>

                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2>Child Development Centers</h2>
                    <button
                      className={styles.viewAll}
                      type="button"
                      onClick={() =>
                        navigate(routePaths.childDevelopmentCenters)
                      }
                    >
                      View all <Icon name="chevron" />
                    </button>
                  </div>
                  <div className={styles.centerList}>
                    {dashboardLoading ? (
                      <p className={styles.dataState}><BouncingDots label="Loading centers" /></p>
                    ) : dashboardError ? (
                      <p className={styles.dataState} role="alert">
                        {dashboardError}
                      </p>
                    ) : dashboardData?.centers.length ? (
                      dashboardData.centers.map((center, index) => {
                        const color = ['teal', 'gold', 'pink', 'purple'][
                          index % 4
                        ];
                        const capacity = center.capacity;
                        return (
                          <div className={styles.centerRow} key={center.id}>
                            <span
                              className={`${styles.centerIcon} ${styles[color]}`}
                            >
                              <Icon name="home" />
                            </span>
                            <span className={styles.centerName}>
                              <strong>{center.name}</strong>
                              <span>
                                {center.location || 'Location not provided'}
                              </span>
                            </span>
                            <span className={styles.centerProgress}>
                              <span>{center.children} children</span>
                              <span className={styles.progressTrack}>
                                <span
                                  className={`${styles.progressFill} ${styles[color]}`}
                                  style={{
                                    width: `${capacity > 0 ? Math.min((center.children / capacity) * 100, 100) : 0}%`,
                                  }}
                                />
                              </span>
                            </span>
                            <span className={styles.centerCapacity}>
                              {center.children} / {capacity || '—'}
                            </span>
                            <button
                              className={styles.rowArrow}
                              type="button"
                              aria-label={`View ${center.name}`}
                              onClick={() =>
                                navigate(routePaths.childDevelopmentCenters)
                              }
                            >
                              <Icon name="chevron" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className={styles.dataState}>
                        No active centers are recorded.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <div className={styles.secondaryColumn}>
                <section className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <h2>Recent Activities</h2>
                    <span className={styles.activityHint}>
                      Latest recorded items
                    </span>
                  </div>
                  <div className={styles.activityList}>
                    {dashboardLoading ? (
                      <p className={styles.dataState}>
                        <BouncingDots label="Loading recent activity" />
                      </p>
                    ) : dashboardError ? (
                      <p className={styles.dataState} role="alert">
                        {dashboardError}
                      </p>
                    ) : dashboardData?.activities.length ? (
                      dashboardData.activities.map((activity, index) => {
                        const appearance = activityAppearance[
                          activity.type
                        ] ?? {
                          icon: 'record' as IconName,
                          color: 'purple',
                        };
                        return (
                          <article
                            className={styles.activityRow}
                            key={`${activity.type}:${activity.occurred_at}:${index}`}
                          >
                            <span
                              className={`${styles.activityIcon} ${styles[appearance.color]}`}
                            >
                              <Icon name={appearance.icon} />
                            </span>
                            <span className={styles.activityText}>
                              <strong>{activity.title}</strong>
                              <span>{activity.description}</span>
                            </span>
                            <time dateTime={activity.occurred_at}>
                              {relativeTime(activity.occurred_at)}
                            </time>
                          </article>
                        );
                      })
                    ) : (
                      <p className={styles.dataState}>
                        No recent activity is recorded.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
