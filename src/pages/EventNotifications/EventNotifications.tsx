import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import { routePaths } from '../../constants/app-constants';
import { notificationsUpdatedEvent } from '../../hooks/useNotificationCount';
import styles from './EventNotifications.module.css';

type NotificationSource = 'notification';

type NotificationRecord = {
  id: number;
  source: NotificationSource;
  title: string;
  message: string;
  related_type: string | null;
  related_module: string | null;
  related_id: number | null;
  notification_type: string;
  action_url: string | null;
  created_at: string;
  sender: string;
  unread: boolean;
};

export type AdminPublishedAnnouncement = {
  id: number;
  title: string;
  message: string;
  category: string;
  audience: string;
  status: string;
  created_at: string;
  published_at: string;
  created_by: string;
  attachment: {
    name: string;
    mime_type: string;
    size: number;
    download_url: string;
  } | null;
};

type AdminNotificationFilter = 'all' | 'unread' | 'system-updates' | 'events' | 'published';
type AdminEntry =
  | { kind: 'notification'; id: number; created_at: string; notification: NotificationRecord }
  | { kind: 'announcement'; id: number; created_at: string; announcement: AdminPublishedAnnouncement };

type NotificationsResponse = {
  data: {
    notifications: NotificationRecord[];
    unread_count: number;
  };
};

type RecipientOption = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
  cdc_ids: number[];
  cdc_names: string[];
};

type RecipientOptionsResponse = {
  data: {
    roles: { value: RecipientOption['role']; label: string }[];
    centers: { id: number; name: string }[];
    users: RecipientOption[];
    all_eligible_label: string;
  };
};

type RecipientPreview = {
  count: number;
  recipients: RecipientOption[];
  roles: string[];
  centers: string[];
};

type RecipientTarget = {
  all_eligible: boolean;
  roles: string[];
  cdc_ids: number[];
  user_ids: number[];
};

const notificationTypes = [
  'General',
  'Announcement',
  'Enrollment',
  'Attendance',
  'Progress',
  'Event',
  'System Update',
];

const adminNotificationPageSize = 5;

function createRequestKey() {
  if (typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isNotificationCategory(notification: NotificationRecord, filter: AdminNotificationFilter) {
  const type = notification.notification_type.toLocaleLowerCase();
  if (filter === 'system-updates') return type.includes('system');
  if (filter === 'events') return type.includes('event');
  return filter === 'all' || (filter === 'unread' && notification.unread);
}

function isAnnouncementCategory(announcement: AdminPublishedAnnouncement, filter: AdminNotificationFilter) {
  const category = announcement.category.toLocaleLowerCase();
  if (filter === 'system-updates') return category.includes('system');
  if (filter === 'events') return category.includes('event');
  return false;
}

function displayDate(value: string) {
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}

function Icon({ name }: { name: 'announcement' | 'bell' | 'calendar' | 'chevron' | 'close' | 'filter' | 'grid' | 'info' | 'mail' | 'plus' | 'settings' }) {
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
    case 'announcement':
      return <svg {...shared}><path d="m3 11 18-7v16L3 13zm0 0v2a3 3 0 0 0 3 3h2l2 4h3l-2-5" /></svg>;
    case 'bell':
      return <svg {...shared}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" /></svg>;
    case 'calendar':
      return <svg {...shared}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></svg>;
    case 'chevron':
      return <svg {...shared}><path d="m9 18 6-6-6-6" /></svg>;
    case 'close':
      return <svg {...shared}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case 'filter':
      return <svg {...shared}><path d="M4 5h16l-6 7v6l-4 2v-8z" /></svg>;
    case 'grid':
      return <svg {...shared}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
    case 'mail':
      return <svg {...shared}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
    case 'plus':
      return <svg {...shared}><path d="M12 5v14m-7-7h14" /></svg>;
    case 'settings':
      return <svg {...shared}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a8 8 0 0 0 0-6l1.4-1.1-1.4-2.4-1.7.7a8 8 0 0 0-1.6-.9L15.8 3h-2.8l-.3 2.3a8 8 0 0 0-1.6.9l-1.7-.7L8 7.9 9.4 9a8 8 0 0 0 0 6L8 16.1l1.4 2.4 1.7-.7a8 8 0 0 0 1.6.9l.3 2.3h2.8l.3-2.3a8 8 0 0 0 1.6-.9l1.7.7 1.4-2.4z" transform="translate(-1 -1)" /></svg>;
    default:
      return <svg {...shared}><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></svg>;
  }
}

export function EventNotifications({
  adminView = false,
  parentDashboard = false,
  onCreateAnnouncement,
  announcements = [],
  announcementsLoading = false,
  onEditAnnouncement,
  onDeleteAnnouncement,
  onDownloadAnnouncement,
  adminSummary,
}: {
  adminView?: boolean;
  parentDashboard?: boolean;
  onCreateAnnouncement?: () => void;
  announcements?: AdminPublishedAnnouncement[];
  announcementsLoading?: boolean;
  onEditAnnouncement?: (announcement: AdminPublishedAnnouncement) => void;
  onDeleteAnnouncement?: (announcement: AdminPublishedAnnouncement) => void;
  onDownloadAnnouncement?: (announcement: AdminPublishedAnnouncement) => void;
  adminSummary?: ReactNode;
}) {
  const { user, request, accessToken } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selected, setSelected] = useState<NotificationRecord | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AdminPublishedAnnouncement | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageError, setCoverImageError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [adminFilter, setAdminFilter] = useState<AdminNotificationFilter>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [notificationPage, setNotificationPage] = useState(1);
  const [composerOpen, setComposerOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [recipientOptions, setRecipientOptions] = useState<RecipientOptionsResponse['data'] | null>(null);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [allEligible, setAllEligible] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [preview, setPreview] = useState<RecipientPreview | null>(null);
  const [previewKey, setPreviewKey] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('General');
  const [relatedModule, setRelatedModule] = useState('');
  const [requestKey, setRequestKey] = useState(createRequestKey);
  const [publishing, setPublishing] = useState(false);
  const latestRequest = useRef(0);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const canSend = user?.role === 'admin' || user?.role === 'teacher';

  const recipientTarget: RecipientTarget = {
    all_eligible: allEligible,
    roles: selectedRoles,
    cdc_ids: selectedCenters,
    user_ids: selectedUsers,
  };
  const filteredRecipients = recipientOptions?.users.filter((recipient) =>
    `${recipient.name} ${recipient.email} ${recipient.role}`
      .toLocaleLowerCase()
      .includes(recipientSearch.trim().toLocaleLowerCase()),
  ) ?? [];
  const unreadNotifications = notifications.filter((notification) => notification.unread).length;
  const publishedAnnouncements = useMemo(
    () => announcements.filter((announcement) => announcement.status === 'published'),
    [announcements],
  );
  const adminFilterCounts: Record<AdminNotificationFilter, number> = {
    all: notifications.length + publishedAnnouncements.length,
    unread: unreadNotifications,
    'system-updates': notifications.filter((item) => isNotificationCategory(item, 'system-updates')).length
      + publishedAnnouncements.filter((item) => isAnnouncementCategory(item, 'system-updates')).length,
    events: notifications.filter((item) => isNotificationCategory(item, 'events')).length
      + publishedAnnouncements.filter((item) => isAnnouncementCategory(item, 'events')).length,
    published: publishedAnnouncements.length,
  };
  const adminEntries = useMemo<AdminEntry[]>(() => {
    const notificationEntries: AdminEntry[] = adminFilter === 'published'
      ? []
      : notifications
        .filter((notification) => isNotificationCategory(notification, adminFilter))
        .map((notification) => ({
          kind: 'notification',
          id: notification.id,
          created_at: notification.created_at,
          notification,
        }));
    const announcementEntries: AdminEntry[] = publishedAnnouncements
      .filter((announcement) => (
        adminFilter === 'all'
        || adminFilter === 'published'
        || isAnnouncementCategory(announcement, adminFilter)
      ))
      .map((announcement) => ({
        kind: 'announcement',
        id: announcement.id,
        created_at: announcement.published_at,
        announcement,
      }));
    return [...notificationEntries, ...announcementEntries].sort((left, right) => {
      const difference = new Date(left.created_at.replace(' ', 'T')).getTime()
        - new Date(right.created_at.replace(' ', 'T')).getTime();
      return sortOrder === 'newest' ? -difference : difference;
    });
  }, [adminFilter, notifications, publishedAnnouncements, sortOrder]);
  const adminPages = Math.max(1, Math.ceil(adminEntries.length / adminNotificationPageSize));
  const adminPageEntries = adminEntries.slice(
    (notificationPage - 1) * adminNotificationPageSize,
    notificationPage * adminNotificationPageSize,
  );

  useEffect(() => {
    if (notificationPage > adminPages) setNotificationPage(adminPages);
  }, [adminPages, notificationPage]);

  const reload = useCallback(async (isActive: () => boolean = () => true) => {
    const requestId = ++latestRequest.current;
    try {
      const response = await request<NotificationsResponse>('/api/notifications');
      if (requestId !== latestRequest.current || !isActive()) return;
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
      setLoadError('');
    } catch (error) {
      if (requestId !== latestRequest.current || !isActive()) return;
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
      latestRequest.current += 1;
    };
  }, [reload]);

  useEffect(() => {
    if (!createMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !createMenuRef.current?.contains(event.target)) {
        setCreateMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCreateMenuOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [createMenuOpen]);

  useEffect(() => {
    if (!selectedAnnouncement?.attachment?.mime_type.startsWith('image/')) {
      setCoverImageUrl('');
      setCoverImageError('');
      return;
    }
    let active = true;
    setCoverImageUrl('');
    setCoverImageError('');
    void fetch(selectedAnnouncement.attachment.download_url, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('The announcement cover image could not be loaded.');
        return URL.createObjectURL(await response.blob());
      })
      .then((url) => {
        if (active) setCoverImageUrl(url);
        else URL.revokeObjectURL(url);
      })
      .catch((error: unknown) => {
        if (active) {
          setCoverImageError(error instanceof Error ? error.message : 'The announcement cover image could not be loaded.');
        }
      });
    return () => {
      active = false;
      setCoverImageUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return '';
      });
    };
  }, [accessToken, selectedAnnouncement]);

  const eventPath =
    user?.role === 'admin'
      ? routePaths.adminEvents
      : user?.role === 'teacher'
        ? routePaths.teacherEvents
        : routePaths.parentEvents;

  const destination = useCallback((notification: NotificationRecord) => {
    if (
      notification.action_url &&
      notification.action_url.startsWith('/') &&
      !notification.action_url.startsWith('//') &&
      !notification.action_url.includes('\\')
    ) {
      return notification.action_url;
    }
    switch (notification.related_type) {
      case 'event':
      case 'events':
        return notification.related_id
          ? `${eventPath}?event=${notification.related_id}`
          : eventPath;
      case 'enrollment':
        if (user?.role === 'parent') {
          return notification.related_id
            ? `${routePaths.parentApplicationStatus}?application=${notification.related_id}`
            : routePaths.parentApplicationStatus;
        }
        return user?.role === 'admin'
          ? routePaths.enrollmentManagement
          : user?.role === 'teacher'
            ? routePaths.teacherEnrollment
            : null;
      case 'teacher_verification':
        return user?.role === 'admin'
          ? routePaths.teacherManagement
          : user?.role === 'teacher'
            ? routePaths.teacherVerification
            : null;
      case 'teacher_management':
        return user?.role === 'admin'
          ? routePaths.teacherManagement
          : user?.role === 'teacher'
            ? routePaths.teacherVerification
            : null;
      case 'attendance':
        return user?.role === 'admin'
          ? routePaths.attendanceMonitoring
          : user?.role === 'teacher'
            ? routePaths.teacherAttendance
            : routePaths.parentAttendance;
      case 'progress':
      case 'children_progress':
        return user?.role === 'admin'
          ? routePaths.learningDevelopment
          : user?.role === 'teacher'
            ? routePaths.teacherChildrenProgress
            : routePaths.parentProgress;
      case 'tasks':
        return user?.role === 'teacher'
          ? routePaths.teacherTasks
          : user?.role === 'parent'
            ? routePaths.parentActivities
            : null;
      case 'activity':
      case 'learning_activity':
      case 'assignment':
        return user?.role === 'admin'
          ? null
          : user?.role === 'teacher'
            ? routePaths.teacherLearningActivities
            : routePaths.parentActivities;
      default:
        return null;
    }
  }, [eventPath, user?.role]);

  async function openComposer() {
    setComposerOpen(true);
    setActionError('');
    if (recipientOptions || recipientLoading) return;
    setRecipientLoading(true);
    try {
      const response = await request<RecipientOptionsResponse>('/api/notifications/recipients');
      setRecipientOptions(response.data);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Recipient options could not be loaded.');
    } finally {
      setRecipientLoading(false);
    }
  }

  function closeComposer() {
    setComposerOpen(false);
    setRequestKey(createRequestKey());
  }

  function invalidatePreview() {
    setPreview(null);
    setPreviewKey('');
  }

  async function previewRecipients() {
    setActionError('');
    setNotice('');
    try {
      const response = await request<{ data: RecipientPreview }>('/api/notifications/preview', {
        method: 'POST',
        body: JSON.stringify(recipientTarget),
      });
      setPreview(response.data);
      setPreviewKey(JSON.stringify(recipientTarget));
    } catch (error) {
      setPreview(null);
      setPreviewKey('');
      setActionError(error instanceof Error ? error.message : 'Recipients could not be previewed.');
    }
  }

  async function publishNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError('');
    setNotice('');
    if (!preview || previewKey !== JSON.stringify(recipientTarget)) {
      setActionError('Preview the current recipient selection before publishing.');
      return;
    }
    const summary = [
      `Recipients: ${preview.count}`,
      `Roles: ${preview.roles.join(', ') || 'Specific users'}`,
      `CDCs: ${preview.centers.join(', ') || 'All eligible centers'}`,
    ].join('\n');
    if (!window.confirm(`Publish this notification?\n\n${summary}`)) return;

    setPublishing(true);
    try {
      await request('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          notification_type: notificationType,
          related_module: relatedModule,
          request_key: requestKey,
          ...recipientTarget,
        }),
      });
      setNotice(`Notification published to ${preview.count} recipient${preview.count === 1 ? '' : 's'}.`);
      setComposerOpen(false);
      setTitle('');
      setMessage('');
      setNotificationType('General');
      setRelatedModule('');
      setRequestKey(createRequestKey());
      setAllEligible(false);
      setSelectedRoles([]);
      setSelectedCenters([]);
      setSelectedUsers([]);
      setPreview(null);
      setPreviewKey('');
      await reload();
      window.dispatchEvent(new Event(notificationsUpdatedEvent));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Notification could not be published.');
    } finally {
      setPublishing(false);
    }
  }

  async function markRead(notification: NotificationRecord) {
    if (!notification.unread) return true;
    setActionError('');
    try {
      const response = await request<{ data?: { unread_count?: number } }>('/api/notifications/read', {
        method: 'PATCH',
        body: JSON.stringify({
          id: notification.id,
          source: notification.source,
          read: true,
        }),
      });
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id && item.source === notification.source
            ? { ...item, unread: false }
            : item,
        ),
      );
      setUnreadCount(response.data?.unread_count ?? Math.max(0, unreadCount - 1));
      window.dispatchEvent(new Event(notificationsUpdatedEvent));
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Notification status could not be saved.',
      );
      return false;
    }
  }

  async function openNotification(notification: NotificationRecord) {
    setSelected(notification);
    await markRead(notification);
  }

  async function markAllRead() {
    setActionError('');
    try {
      await request('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((current) =>
        current.map((item) => ({ ...item, unread: false })),
      );
      setUnreadCount(0);
      window.dispatchEvent(new Event(notificationsUpdatedEvent));
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Notifications could not be marked as read.',
      );
    }
  }

  const filteredNotifications = useMemo(
    () =>
      notifications
        .filter(
          (notification) =>
            readFilter === 'all' ||
            (readFilter === 'unread'
              ? notification.unread
              : !notification.unread),
        )
        .sort((first, second) => {
          if (!parentDashboard) return 0;
          const firstCreatedAt = Date.parse(first.created_at.replace(' ', 'T'));
          const secondCreatedAt = Date.parse(second.created_at.replace(' ', 'T'));
          if (!Number.isFinite(firstCreatedAt)) {
            return Number.isFinite(secondCreatedAt)
              ? 1
              : second.id - first.id;
          }
          if (!Number.isFinite(secondCreatedAt)) return -1;
          return secondCreatedAt - firstCreatedAt || second.id - first.id;
        }),
    [notifications, parentDashboard, readFilter],
  );
  const notificationPageSize = 5;
  const notificationPageCount = Math.max(
    1,
    Math.ceil(filteredNotifications.length / notificationPageSize),
  );
  const visibleNotifications = parentDashboard
    ? filteredNotifications.slice(
        (notificationPage - 1) * notificationPageSize,
        notificationPage * notificationPageSize,
      )
    : filteredNotifications;
  const firstVisibleNotification = filteredNotifications.length
    ? (notificationPage - 1) * notificationPageSize + 1
    : 0;
  const lastVisibleNotification = Math.min(
    notificationPage * notificationPageSize,
    filteredNotifications.length,
  );
  const readCount = notifications.filter((notification) => !notification.unread).length;
  useEffect(() => {
    if (parentDashboard && notificationPage > notificationPageCount) {
      setNotificationPage(notificationPageCount);
    }
  }, [notificationPage, notificationPageCount, parentDashboard]);
  const filterAdminNotifications = (filter: AdminNotificationFilter) => {
    setAdminFilter(filter);
    setNotificationPage(1);
    setSelected(null);
    setSelectedAnnouncement(null);
  };

  return (
    <section aria-label="Notifications" className={`${styles.panel} ${adminView ? styles.adminPanel : ''} ${parentDashboard ? styles.parentDashboardPanel : ''}`}>
      <header className={`${styles.header} ${adminView ? styles.adminHeader : ''} ${parentDashboard ? styles.parentDashboardHeader : ''}`}>
        <div>
          {parentDashboard && <span aria-hidden="true" className={styles.parentTitleIcon}><Icon name="bell" /></span>}
          {adminView && <span aria-hidden="true" className={styles.adminTitleIcon}><Icon name="bell" /></span>}
          <div className={adminView ? styles.adminHeadingCopy : undefined}>
            <h2>Notifications</h2>
            <p>{adminView || parentDashboard ? 'Stay informed about important updates.' : 'Updates assigned to your account, newest first.'}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {canSend && !adminView && <button className={styles.markAll} onClick={() => void openComposer()} type="button">Create notification</button>}
          <button className={`${styles.markAll} ${parentDashboard ? styles.parentMarkAll : ''}`} disabled={unreadCount === 0} onClick={() => void markAllRead()} type="button">
            {parentDashboard ? 'Mark All as Read' : 'Mark all as read'}
          </button>
        </div>
      </header>

      {actionError && (!adminView || !composerOpen) && <p className={styles.error} role="alert">{actionError}</p>}
      {loadError && <p className={styles.error} role="alert">{loadError}</p>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {adminView && adminSummary}

      {composerOpen && (
        <div
          className={adminView ? styles.composerBackdrop : styles.composerShell}
          onMouseDown={adminView ? (event) => { if (event.target === event.currentTarget) closeComposer(); } : undefined}
        >
          <form
            aria-labelledby={adminView ? 'notification-composer-title' : undefined}
            aria-modal={adminView || undefined}
            className={`${styles.composer} ${adminView ? styles.adminComposer : ''}`}
            onSubmit={(event) => void publishNotification(event)}
            role={adminView ? 'dialog' : undefined}
          >
            <div className={styles.composerHeading}>
              {adminView && <span aria-hidden="true" className={styles.composerIcon}><Icon name="bell" /></span>}
              <div>
                <h3 id={adminView ? 'notification-composer-title' : undefined}>{adminView ? 'Create Notification' : 'Create notification'}</h3>
                <p>{adminView ? 'Send important updates to selected users.' : 'Recipients are validated and saved at publish time.'}</p>
              </div>
              <button aria-label="Close notification form" className={styles.close} onClick={closeComposer} type="button">
                {adminView ? <Icon name="close" /> : '×'}
              </button>
            </div>
            {adminView && actionError && <p className={styles.error} role="alert">{actionError}</p>}
            {recipientLoading ? <p className={styles.empty}><BouncingDots label="Loading eligible recipients" /></p> : recipientOptions && (
              <>
                <div className={styles.composerFields}>
                  <label>Title *<input maxLength={180} onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
                  <label>Category *<select onChange={(event) => setNotificationType(event.target.value)} value={notificationType}>{notificationTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
                  <label>Related module<select onChange={(event) => setRelatedModule(event.target.value)} value={relatedModule}><option value="">None</option>{['Enrollment', 'Events', 'Attendance', 'Children Progress', 'Teacher Management', 'Tasks'].map((module) => <option key={module} value={module.toLowerCase().replaceAll(' ', '_')}>{module}</option>)}</select></label>
                  <label className={styles.fullField}>Message *<textarea maxLength={10000} onChange={(event) => setMessage(event.target.value)} required rows={4} value={message} /></label>
                  <label className={styles.allEligible}>
                    <input checked={allEligible} onChange={(event) => { setAllEligible(event.target.checked); if (event.target.checked) { setSelectedRoles([]); setSelectedUsers([]); } invalidatePreview(); }} type="checkbox" />
                    <span>{recipientOptions.all_eligible_label}</span>
                  </label>
                  <fieldset disabled={allEligible}>
                    <legend>Recipient roles</legend>
                    {recipientOptions.roles.map((role) => (
                      <label className={styles.choice} key={role.value}>
                        <input checked={selectedRoles.includes(role.value)} onChange={(event) => { setAllEligible(false); setSelectedRoles((current) => event.target.checked ? [...current, role.value] : current.filter((value) => value !== role.value)); invalidatePreview(); }} type="checkbox" />
                        {role.label}
                      </label>
                    ))}
                  </fieldset>
                  {recipientOptions.centers.length > 0 && (
                    <label>Specific CDCs<select multiple onChange={(event) => { setAllEligible(false); setSelectedCenters(Array.from(event.currentTarget.selectedOptions, (option) => Number(option.value))); invalidatePreview(); }} value={selectedCenters.map(String)}>
                      {recipientOptions.centers.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
                    </select><small>Hold Ctrl (Windows) or Command (Mac) to select several.</small></label>
                  )}
                  <label className={styles.userSelector}>Specific users
                    <input onChange={(event) => setRecipientSearch(event.target.value)} placeholder="Search name, email, or role" value={recipientSearch} />
                    <select disabled={allEligible} multiple onChange={(event) => { setAllEligible(false); setSelectedUsers(Array.from(event.currentTarget.selectedOptions, (option) => Number(option.value))); invalidatePreview(); }} value={selectedUsers.map(String)}>
                      {filteredRecipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.name} · {recipient.role}</option>)}
                    </select>
                  </label>
                </div>
                <button className={styles.markAll} onClick={() => void previewRecipients()} type="button">Preview recipients</button>
                {preview && previewKey === JSON.stringify(recipientTarget) && (
                  <section aria-label="Recipient summary" className={styles.preview}>
                    <strong>Recipient preview · {preview.count} total</strong>
                    <span>Roles: {preview.roles.join(', ') || 'Specific users'}</span>
                    <span>CDCs: {preview.centers.join(', ') || (selectedCenters.length ? 'No matching centers' : 'All eligible centers')}</span>
                    {selectedUsers.length > 0 && <span>Selected users: {selectedUsers.map((id) => recipientOptions.users.find((item) => item.id === id)?.name).filter(Boolean).join(', ')}</span>}
                    <span className={styles.previewUsers}>{preview.recipients.slice(0, 10).map((recipient) => recipient.name).join(', ')}{preview.count > 10 ? ` and ${preview.count - 10} more` : ''}</span>
                  </section>
                )}
                <div className={styles.composerActions}>
                  <button className={styles.markAll} onClick={closeComposer} type="button">Cancel</button>
                  <button className={styles.destination} disabled={publishing || !preview || previewKey !== JSON.stringify(recipientTarget) || !title.trim() || !message.trim()} type="submit">
                    {publishing ? 'Publishing…' : adminView ? 'Send Notification' : 'Publish notification'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {adminView ? (
        <div className={styles.adminLayout}>
          <aside aria-label="Filter notifications" className={styles.adminFilters}>
            <h3><Icon name="filter" /> Filter Notifications</h3>
            {([
              ['all', 'All', 'grid'],
              ['unread', 'Unread', 'mail'],
              ['system-updates', 'System Updates', 'settings'],
              ['events', 'Events', 'calendar'],
              ['published', 'Published', 'announcement'],
            ] as const).map(([filter, label, icon]) => (
              <button
                aria-pressed={adminFilter === filter}
                className={adminFilter === filter ? styles.adminFilterActive : undefined}
                key={filter}
                onClick={() => filterAdminNotifications(filter)}
                type="button"
              >
                <Icon name={icon} /><span>{label}</span><strong>{adminFilterCounts[filter]}</strong>
              </button>
            ))}
            <label className={styles.sortControl}>Sort By
              <select onChange={(event) => setSortOrder(event.target.value === 'oldest' ? 'oldest' : 'newest')} value={sortOrder}>
                <option value="newest">Newest First</option><option value="oldest">Oldest First</option>
              </select>
            </label>
          </aside>
          <div aria-live="polite" className={styles.adminListPanel}>
            {loading || (announcementsLoading && (adminFilter === 'all' || adminFilter === 'published')) ? <p className={styles.empty}><BouncingDots label={loading ? 'Loading notifications' : 'Loading published announcements'} /></p> : adminPageEntries.length === 0 ? (
              <p className={styles.empty}>{adminFilter === 'published' ? 'No published announcements are available.' : adminEntries.length === 0 ? 'No notifications yet.' : 'No notifications match this filter.'}</p>
            ) : (
              <ul className={styles.adminList}>
                {adminPageEntries.map((entry) => entry.kind === 'notification' ? (
                  <li className={`${styles.adminItem} ${entry.notification.unread ? styles.adminUnread : ''}`} key={`notification:${entry.id}`}>
                    <button className={styles.adminNotificationOpen} onClick={() => void openNotification(entry.notification)} type="button">
                      <span className={`${styles.adminNotificationIcon} ${entry.notification.notification_type.toLocaleLowerCase().includes('event') ? styles.eventIcon : entry.notification.notification_type.toLocaleLowerCase().includes('system') ? styles.systemIcon : styles.generalIcon}`}>
                        <Icon name={entry.notification.notification_type.toLocaleLowerCase().includes('event') ? 'calendar' : entry.notification.notification_type.toLocaleLowerCase().includes('system') ? 'settings' : 'info'} />
                      </span>
                      <span className={styles.adminNotificationCopy}>
                        <span className={styles.adminNotificationTitle}>{entry.notification.title}{entry.notification.unread && <span className={styles.new}>New</span>}</span>
                        <span className={styles.adminNotificationMessage}>{entry.notification.message}</span>
                      </span>
                      <time className={styles.adminNotificationDate} dateTime={entry.notification.created_at}>{displayDate(entry.notification.created_at)}</time>
                      <Icon name="chevron" />
                    </button>
                  </li>
                ) : (
                  <li className={`${styles.adminItem} ${styles.publishedItem}`} key={`announcement:${entry.id}`}>
                    <button className={styles.adminNotificationOpen} onClick={() => setSelectedAnnouncement(entry.announcement)} type="button">
                      <span className={`${styles.adminNotificationIcon} ${styles.announcementIcon}`}><Icon name="announcement" /></span>
                      <span className={styles.adminNotificationCopy}>
                        <span className={styles.adminNotificationTitle}>{entry.announcement.title}</span>
                        <span className={styles.adminNotificationMessage}>{entry.announcement.message}</span>
                        <span className={styles.announcementAudience}>Audience: {entry.announcement.audience}</span>
                      </span>
                      <span className={styles.adminAnnouncementMeta}>
                        <time className={styles.adminNotificationDate} dateTime={entry.announcement.published_at}>{displayDate(entry.announcement.published_at)}</time>
                        <span className={styles.statusBadge}>Published</span>
                      </span>
                      <Icon name="chevron" />
                    </button>
                    <div className={styles.publishedActions}>
                      <button aria-label={`Edit ${entry.announcement.title}`} disabled={!onEditAnnouncement} onClick={() => { setSelectedAnnouncement(null); onEditAnnouncement?.(entry.announcement); }} type="button">Edit</button>
                      <button aria-label={`Delete ${entry.announcement.title}`} disabled={!onDeleteAnnouncement} onClick={() => { setSelectedAnnouncement(null); onDeleteAnnouncement?.(entry.announcement); }} type="button">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <footer className={styles.adminPagination}>
              <div className={styles.adminPageButtons}>
                <button aria-label="Previous page" disabled={notificationPage <= 1} onClick={() => setNotificationPage((current) => current - 1)} type="button">‹</button>
                {Array.from({ length: adminPages }, (_, index) => index + 1).map((number) => (
                  <button aria-current={notificationPage === number ? 'page' : undefined} key={number} onClick={() => setNotificationPage(number)} type="button">{number}</button>
                ))}
                <button aria-label="Next page" disabled={notificationPage >= adminPages} onClick={() => setNotificationPage((current) => current + 1)} type="button">›</button>
              </div>
              <span>Showing {adminEntries.length ? (notificationPage - 1) * adminNotificationPageSize + 1 : 0}–{Math.min(notificationPage * adminNotificationPageSize, adminEntries.length)} of {adminEntries.length} {adminFilter === 'published' ? 'announcements' : 'records'}</span>
            </footer>
          </div>
          {canSend && (
            <div className={styles.createMenu} ref={createMenuRef}>
              {createMenuOpen && (
                <div className={styles.createMenuPopover}>
                  <button onClick={() => { setCreateMenuOpen(false); void openComposer(); }} type="button"><Icon name="bell" />Create Notification</button>
                  <button onClick={() => { setCreateMenuOpen(false); onCreateAnnouncement?.(); }} type="button"><Icon name="announcement" />Create Announcement</button>
                </div>
              )}
              <button aria-expanded={createMenuOpen} aria-label="Create notification or announcement" className={styles.createMenuButton} onClick={() => setCreateMenuOpen((open) => !open)} type="button">
                <Icon name="plus" />
              </button>
            </div>
          )}
        </div>
      ) : (
      <>
        <div aria-label="Filter notifications" className={`${styles.filters} ${parentDashboard ? styles.parentDashboardFilters : ''}`}>
          {(['all', 'unread', 'read'] as const).map((filter) => (
            <button
              aria-pressed={readFilter === filter}
              className={readFilter === filter ? styles.activeFilter : ''}
              key={filter}
              onClick={() => {
                setReadFilter(filter);
                setNotificationPage(1);
              }}
              type="button"
            >
              {filter === 'all' ? `All (${notifications.length})` : filter === 'unread' ? `Unread (${unreadCount})` : `Read (${readCount})`}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={styles.empty}><BouncingDots label="Loading notifications" /></p>
        ) : visibleNotifications.length === 0 ? (
          <p className={`${styles.empty} ${parentDashboard ? styles.parentEmpty : ''}`}>
            {notifications.length
              ? 'No notifications match this filter.'
              : parentDashboard
                ? (
                  <>
                    <strong>You&apos;re all caught up!</strong>
                    <span>No new notifications at the moment.</span>
                  </>
                )
                : 'No notifications yet.'}
          </p>
        ) : (
          <ul className={styles.list}>
            {visibleNotifications.map((notification) => (
              <li
                className={`${styles.item} ${notification.unread ? styles.unread : ''} ${parentDashboard ? styles.parentDashboardItem : ''}`}
                key={`${notification.source}:${notification.id}`}
              >
                <button
                  className={`${styles.open} ${parentDashboard ? styles.parentDashboardOpen : ''}`}
                  onClick={() => void openNotification(notification)}
                  type="button"
                >
                  {parentDashboard && (
                    <span className={`${styles.parentNotificationIcon} ${notification.notification_type.toLocaleLowerCase().includes('event') ? styles.eventNotificationIcon : notification.notification_type.toLocaleLowerCase().includes('enrollment') ? styles.enrollmentNotificationIcon : styles.generalNotificationIcon}`}>
                      <Icon name={notification.notification_type.toLocaleLowerCase().includes('event') ? 'calendar' : notification.notification_type.toLocaleLowerCase().includes('enrollment') ? 'announcement' : 'info'} />
                    </span>
                  )}
                  <span className={parentDashboard ? styles.parentNotificationCopy : undefined}>
                    <span className={styles.itemHeading}>
                      <strong>{notification.title}</strong>
                      {notification.unread && <span className={styles.new}>Unread</span>}
                    </span>
                    {parentDashboard && <span className={styles.parentNotificationMessage}>{notification.message}</span>}
                    <span className={`${styles.itemMeta} ${parentDashboard ? styles.parentNotificationMeta : ''}`}>
                      <span>{notification.notification_type}</span>
                      <time dateTime={notification.created_at}>{displayDate(notification.created_at)}</time>
                    </span>
                  </span>
                  {parentDashboard && notification.unread && <span aria-label="Unread" className={styles.parentUnreadDot} />}
                </button>
              </li>
            ))}
          </ul>
        )}
        {parentDashboard && !loading && filteredNotifications.length > 0 && (
          <footer className={styles.parentNotificationPagination}>
            <span>
              Showing {firstVisibleNotification}–{lastVisibleNotification} of{' '}
              {filteredNotifications.length} notifications
            </span>
            <div aria-label="Notification pages" className={styles.parentNotificationPaginationControls}>
              <button
                aria-label="Previous notification page"
                disabled={notificationPage <= 1}
                onClick={() =>
                  setNotificationPage((current) => Math.max(1, current - 1))
                }
                type="button"
              >
                ‹
              </button>
              <span>
                {notificationPage} / {notificationPageCount}
              </span>
              <button
                aria-label="Next notification page"
                disabled={notificationPage >= notificationPageCount}
                onClick={() =>
                  setNotificationPage((current) =>
                    Math.min(notificationPageCount, current + 1),
                  )
                }
                type="button"
              >
                ›
              </button>
            </div>
          </footer>
        )}
      </>
      )}

      {selected && (
        <div
          className={styles.backdrop}
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <section
            aria-labelledby="notification-detail-title"
            aria-modal="true"
            className={styles.detail}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className={styles.detailHeader}>
              <div>
                <p>From {selected.sender} · {displayDate(selected.created_at)}</p>
                <h3 id="notification-detail-title">{selected.title}</h3>
              </div>
              <button
                aria-label="Close notification details"
                className={styles.close}
                onClick={() => setSelected(null)}
                type="button"
              >
                ×
              </button>
            </header>
            <p className={styles.detailType}>{selected.notification_type}{selected.related_module ? ` · ${selected.related_module}` : ''}</p>
            <p className={styles.message}>{selected.message}</p>
            {destination(selected) && (
              <button
                className={styles.destination}
                onClick={() => navigate(destination(selected)!)}
                type="button"
              >
                Open related page
              </button>
            )}
          </section>
        </div>
      )}
      {selectedAnnouncement && (
        <div
          className={styles.backdrop}
          onClick={() => setSelectedAnnouncement(null)}
          role="presentation"
        >
          <section
            aria-labelledby="published-announcement-title"
            aria-modal="true"
            className={styles.publishedDetail}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className={styles.detailHeader}>
              <div>
                <p>Published · {displayDate(selectedAnnouncement.published_at)}</p>
                <h3 id="published-announcement-title">{selectedAnnouncement.title}</h3>
              </div>
              <button
                aria-label="Close announcement details"
                className={styles.close}
                onClick={() => setSelectedAnnouncement(null)}
                type="button"
              >
                ×
              </button>
            </header>
            <dl className={styles.publishedDetailMeta}>
              <div><dt>Target audience</dt><dd>{selectedAnnouncement.audience}</dd></div>
              <div><dt>Category</dt><dd>{selectedAnnouncement.category}</dd></div>
              <div><dt>Publication status</dt><dd>Published</dd></div>
              <div><dt>Published by</dt><dd>{selectedAnnouncement.created_by}</dd></div>
            </dl>
            <div className={styles.publishedFullMessage}>{selectedAnnouncement.message}</div>
            {selectedAnnouncement.attachment && (
              <section className={styles.publishedAttachment}>
                <h4>Cover image or attachment</h4>
                {selectedAnnouncement.attachment.mime_type.startsWith('image/') && coverImageUrl ? (
                  <img alt={`Cover image for ${selectedAnnouncement.title}`} src={coverImageUrl} />
                ) : null}
                {coverImageError && <p className={styles.error} role="alert">{coverImageError}</p>}
                <button
                  className={styles.destination}
                  onClick={() => onDownloadAnnouncement?.(selectedAnnouncement)}
                  type="button"
                >
                  {selectedAnnouncement.attachment.name}
                </button>
              </section>
            )}
            <footer className={styles.publishedDetailActions}>
              <button className={styles.markAll} onClick={() => { setSelectedAnnouncement(null); onDeleteAnnouncement?.(selectedAnnouncement); }} type="button">Delete</button>
              <button className={styles.destination} onClick={() => { setSelectedAnnouncement(null); onEditAnnouncement?.(selectedAnnouncement); }} type="button">Edit Announcement</button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
