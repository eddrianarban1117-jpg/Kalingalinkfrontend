import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import { notificationsUpdatedEvent } from '../../hooks/useNotificationCount';
import styles from './TeacherNotifications.module.css';

type NotificationType = string;
type NotificationTab = 'All' | NotificationType;
type NotificationSource = 'announcement' | 'notification';

type TeacherNotification = {
  id: number;
  source: NotificationSource;
  title: string;
  sender: string;
  description: string;
  type: string;
  createdAt: string;
  actionUrl: string | null;
  unread: boolean;
};

type ApiNotification = {
  id: number;
  source: NotificationSource;
  title: string;
  sender: string;
  description: string;
  type: string;
  created_at: string;
  action_url: string | null;
  unread: boolean;
};

type NotificationsResponse = {
  data: { notifications: ApiNotification[]; unread_count: number };
};

function formatDate(value: string) {
  const date = new Date(value.replace(' ', 'T'));
  return {
    date: date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function monthLabel(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function tone(type: NotificationType) {
  return type === 'Announcement' ? 'blue' : 'purple';
}

function NotificationIcon({
  type,
}: {
  type: NotificationType | 'calendar' | 'search' | 'filter' | 'reset';
}) {
  const shared = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  };
  if (type === 'Announcement') {
    return (
      <svg {...shared}>
        <path d="m3 11 18-6v14l-18-6zm0 0v2a3 3 0 0 0 3 3h2l2 4h3l-2-5" />
      </svg>
    );
  }
  if (type === 'System Update') {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z" />
      </svg>
    );
  }
  if (type === 'search') {
    return (
      <svg {...shared}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </svg>
    );
  }
  if (type === 'filter') {
    return (
      <svg {...shared}>
        <path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5z" />
      </svg>
    );
  }
  if (type === 'reset') {
    return (
      <svg {...shared}>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3" />
      </svg>
    );
  }
  return (
    <svg {...shared}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4m10-4v4M3 10h18" />
    </svg>
  );
}

export function TeacherNotifications({
  globalSearch,
}: {
  globalSearch: string;
}) {
  const { request } = useAuth();
  const navigate = useNavigate();
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationTab>('All');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [dateRange, setDateRange] = useState(currentMonth);
  const [appliedFilters, setAppliedFilters] = useState({
    type: '',
    read: '',
    date: currentMonth,
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const latestRequest = useRef(0);

  const reload = useCallback(async (isActive: () => boolean = () => true) => {
    const requestId = ++latestRequest.current;
    setLoadError('');
    try {
      const response = await request<NotificationsResponse>(
        '/api/teacher/notifications',
      );
      if (requestId !== latestRequest.current || !isActive()) return;
      setNotifications(
        response.data.notifications.map((item) => ({
          id: item.id,
          source: item.source,
          title: item.title,
          sender: item.sender,
          description: item.description,
          type: item.source === 'announcement'
            ? 'Announcement'
            : item.type || 'System Update',
          createdAt: item.created_at,
          actionUrl: item.action_url,
          unread: item.unread,
        })),
      );
    } catch (error) {
      if (requestId !== latestRequest.current || !isActive()) return;
      setNotifications([]);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Notifications could not be loaded.',
      );
    } finally {
      if (requestId === latestRequest.current && isActive()) setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active && document.visibilityState === 'visible') {
        void reload(() => active);
      }
    };
    void reload(() => active);
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reload]);

  const typeCounts = useMemo(
    () => {
      const counts: Record<string, number> = {
        All: notifications.length,
        Announcement: 0,
        'System Update': 0,
      };
      notifications.forEach(({ type }) => {
        counts[type] = (counts[type] ?? 0) + 1;
      });
      return counts;
    },
    [notifications],
  );
  const tabs = useMemo<NotificationTab[]>(
    () => [
      'All',
      'Announcement',
      'System Update',
      ...new Set(
        notifications
          .map(({ type }) => type)
          .filter((type) => type !== 'Announcement' && type !== 'System Update'),
      ),
    ],
    [notifications],
  );

  const monthOptions = useMemo(
    () =>
      [...new Set([currentMonth, ...notifications.map(({ createdAt }) => monthKey(createdAt))])]
        .sort((first, second) => second.localeCompare(first)),
    [currentMonth, notifications],
  );

  const visibleNotifications = useMemo(() => {
    const term = `${search} ${globalSearch}`.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesTerm =
        !term ||
        `${item.title} ${item.sender} ${item.description} ${item.type}`
          .toLowerCase()
          .includes(term);
      const matchesTab = activeTab === 'All' || item.type === activeTab;
      const matchesType = !appliedFilters.type || item.type === appliedFilters.type;
      const matchesRead =
        !appliedFilters.read ||
        (appliedFilters.read === 'Unread' ? item.unread : !item.unread);
      const matchesDate =
        appliedFilters.date === 'all' ||
        monthKey(item.createdAt) === appliedFilters.date;
      return (
        matchesTerm && matchesTab && matchesType && matchesRead && matchesDate
      );
    });
  }, [activeTab, appliedFilters, globalSearch, notifications, search]);

  const unreadCount = notifications.filter(({ unread }) => unread).length;
  const selectedNotification =
    notifications.find(
      (item) => `${item.source}:${item.id}` === selectedKey,
    ) ?? null;
  const selectedActionUrl = selectedNotification?.actionUrl;

  function openNotificationAction(actionUrl: string) {
    try {
      const url = new URL(actionUrl, window.location.origin);
      if (url.origin !== window.location.origin) {
        setActionError('This notification link is not available.');
        return;
      }
      navigate(`${url.pathname}${url.search}${url.hash}`);
    } catch {
      setActionError('This notification link is not available.');
    }
  }

  async function updateRead(item: TeacherNotification, read: boolean) {
    setActionError('');
    try {
      await request('/api/teacher/notifications/read', {
        method: 'PATCH',
        body: JSON.stringify({
          source: item.source,
          id: item.id,
          read,
        }),
      });
      window.dispatchEvent(new Event(notificationsUpdatedEvent));
      await reload();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Notification status could not be saved.',
      );
    }
  }

  async function markAllRead() {
    setActionError('');
    try {
      await request('/api/teacher/notifications/read-all', {
        method: 'PATCH',
      });
      window.dispatchEvent(new Event(notificationsUpdatedEvent));
      await reload();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Notifications could not be marked as read.',
      );
    }
  }

  function resetFilters() {
    setTypeFilter('');
    setReadFilter('');
    setDateRange(currentMonth);
    setAppliedFilters({ type: '', read: '', date: currentMonth });
    setActiveTab('All');
    setSearch('');
  }

  return (
    <main aria-label="Notifications" className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}>
            <NotificationIcon type="calendar" />
          </span>
          <div>
            <h1>Notifications</h1>
            <p>Latest announcements and system notifications from your account.</p>
          </div>
        </div>
        <button
          className={styles.markAllButton}
          type="button"
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </button>
      </header>

      {actionError && (
        <p aria-live="polite" className={styles.errorNotice} role="alert">
          {actionError}
        </p>
      )}
      {loadError && (
        <p aria-live="polite" className={styles.errorNotice} role="alert">
          {loadError}
        </p>
      )}

      <div className={styles.workspace}>
        <section aria-label="Notification list" className={styles.listColumn}>
          <div
            aria-label="Filter notifications by type"
            className={styles.tabs}
          >
            {tabs.map((tab) => (
              <button
                aria-pressed={activeTab === tab}
                className={activeTab === tab ? styles.activeTab : ''}
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'All'
                  ? 'All'
                  : tab === 'System Update'
                    ? 'System Updates'
                    : 'Announcements'}
                <span>{typeCounts[tab]}</span>
              </button>
            ))}
          </div>

          <label className={styles.notificationSearch}>
            <NotificationIcon type="search" />
            <span className={styles.visuallyHidden}>Search notifications</span>
            <input
              placeholder="Search by title, sender, or keyword..."
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div aria-live="polite" className={styles.notificationList}>
            {loading ? (
              <p className={styles.emptyState}><BouncingDots label="Loading notifications" /></p>
            ) : visibleNotifications.length ? (
              visibleNotifications.map((item) => {
                const date = formatDate(item.createdAt);
                return (
                  <article
                    className={`${styles.notificationRow} ${item.unread ? styles.unreadRow : ''}`}
                    key={`${item.source}:${item.id}`}
                  >
                    <button
                      aria-label={`Open ${item.title}`}
                      className={`${styles.notificationIcon} ${styles[tone(item.type)]}`}
                      type="button"
                      onClick={() => {
                        setSelectedKey(`${item.source}:${item.id}`);
                        if (item.unread) void updateRead(item, true);
                      }}
                    >
                      <NotificationIcon type={item.type} />
                    </button>
                    <button
                      className={styles.notificationCopy}
                      type="button"
                      onClick={() => {
                        setSelectedKey(`${item.source}:${item.id}`);
                        if (item.unread) void updateRead(item, true);
                      }}
                    >
                      <strong>{item.title}</strong>
                    </button>
                    <div className={styles.notificationMeta}>
                      <span className={styles.dateLine}>
                        <span aria-hidden="true">◷</span>
                        {date.date}
                        <i>·</i>
                        {date.time}
                      </span>
                    </div>
                    <button
                      aria-label={
                        item.unread
                          ? `Mark ${item.title} as read`
                          : `Mark ${item.title} as unread`
                      }
                      aria-pressed={item.unread}
                      className={`${styles.readMarker} ${item.unread ? styles.unreadMarker : ''}`}
                      type="button"
                      onClick={() => void updateRead(item, !item.unread)}
                    >
                      <span />
                    </button>
                    <button
                      aria-label={`View ${item.title}`}
                      className={styles.openArrow}
                      type="button"
                      onClick={() => {
                        setSelectedKey(`${item.source}:${item.id}`);
                        if (item.unread) void updateRead(item, true);
                      }}
                    >
                      ›
                    </button>
                  </article>
                );
              })
            ) : (
              <p className={styles.emptyState}>
                {notifications.length === 0
                  ? 'No notifications are recorded for your account.'
                  : 'No notifications match these filters.'}
              </p>
            )}
          </div>
        </section>

        <aside
          aria-label="Filter notifications and summary"
          className={styles.sideColumn}
        >
          <section className={styles.filterPanel}>
            <h2>Filter Notifications</h2>
            <label
              className={styles.visuallyHidden}
              htmlFor="notification-type"
            >
              Notification type
            </label>
            <select
              id="notification-type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="">All Types</option>
              {tabs.slice(1).map((type) => (
                <option key={type} value={type}>
                  {type === 'System Update' ? 'System Updates' : 'Announcements'}
                </option>
              ))}
            </select>
            <label
              className={styles.visuallyHidden}
              htmlFor="notification-read"
            >
              Read status
            </label>
            <select
              id="notification-read"
              value={readFilter}
              onChange={(event) => setReadFilter(event.target.value)}
            >
              <option value="">All Read Status</option>
              <option>Unread</option>
              <option>Read</option>
            </select>
            <label className={styles.dateFilter}>
              <NotificationIcon type="calendar" />
              <span className={styles.visuallyHidden}>Date range</span>
              <select
                id="notification-date"
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {monthLabel(month)}
                  </option>
                ))}
                <option value="all">All dates</option>
              </select>
            </label>
            <div className={styles.filterActions}>
              <button
                type="button"
                onClick={() =>
                  setAppliedFilters({
                    type: typeFilter,
                    read: readFilter,
                    date: dateRange,
                  })
                }
              >
                <NotificationIcon type="filter" /> Apply Filters
              </button>
              <button type="button" onClick={resetFilters}>
                <NotificationIcon type="reset" /> Reset
              </button>
            </div>
          </section>

          <section className={styles.summaryPanel}>
            <h2>Notification Summary</h2>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryAnnouncements}>
                <span>
                  <NotificationIcon type="Announcement" />
                </span>
                <strong>{typeCounts.Announcement}</strong>
                <small>Announcements</small>
              </article>
              <article className={styles.summaryUpdates}>
                <span>
                  <NotificationIcon type="System Update" />
                </span>
                <strong>{typeCounts['System Update']}</strong>
                <small>System Updates</small>
              </article>
              <article className={styles.summaryTotal}>
                <span>●</span>
                <strong>{notifications.length}</strong>
                <small>Total Notifications</small>
              </article>
              <article className={styles.summaryUnread}>
                <span>●</span>
                <strong>{unreadCount}</strong>
                <small>Unread</small>
              </article>
            </div>
          </section>
        </aside>
      </div>

      {selectedNotification && (
        <div className={styles.dialogBackdrop}>
          <section
            aria-labelledby="notification-dialog-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <header>
              <span
                className={`${styles.typeBadge} ${styles[tone(selectedNotification.type)]}`}
              >
                {selectedNotification.type}
              </span>
              <button
                aria-label="Close notification"
                type="button"
                onClick={() => setSelectedKey(null)}
              >
                ×
              </button>
            </header>
            <h2 id="notification-dialog-title">{selectedNotification.title}</h2>
            <p className={styles.dialogSender}>
              From: {selectedNotification.sender}
            </p>
            <p className={styles.dialogDescription}>
              {selectedNotification.description}
            </p>
            <p className={styles.dialogDate}>
              {formatDate(selectedNotification.createdAt).date} ·{' '}
              {formatDate(selectedNotification.createdAt).time}
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                onClick={() =>
                  void updateRead(
                    selectedNotification,
                    selectedNotification.unread,
                  )
                }
              >
                Mark as {selectedNotification.unread ? 'read' : 'unread'}
              </button>
              <button type="button" onClick={() => setSelectedKey(null)}>
                Done
              </button>
              {selectedActionUrl && (
                <button
                  type="button"
                  onClick={() => openNotificationAction(selectedActionUrl)}
                >
                  Open related module
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
