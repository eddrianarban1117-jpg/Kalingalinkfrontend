import { useEffect, useMemo, useState } from 'react';
import teacherArtwork from '../../../femalepanel.png';
import { ListGridToggle } from '../../components/common/ListGridToggle/ListGridToggle';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import type { AnnouncementFeedItem } from '../../hooks/useAnnouncementFeed';
import { EventNotifications } from '../EventNotifications/EventNotifications';
import styles from './ParentAnnouncements.module.css';

type AnnouncementSource = 'Teacher' | 'MSWDO Admin' | 'System Admin';
type SourceFilter = 'all' | AnnouncementSource;

type Announcement = {
  id: number;
  title: string;
  source: AnnouncementSource;
  sender: string;
  date: string;
  time: string;
  publishedAt: string;
  message: string;
  tone: 'teacher' | 'mswdo' | 'system';
  attachment: {
    name: string;
    mime_type: string;
    size: number;
    download_url: string;
  } | null;
};

const sourceLabels: AnnouncementSource[] = [
  'Teacher',
  'MSWDO Admin',
  'System Admin',
];

function Icon({ name }: { name: string }) {
  const shared = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  };
  switch (name) {
    case 'megaphone':
      return (
        <svg {...shared}>
          <path d="m3 11 18-7v16L3 13zm0 0v2a3 3 0 0 0 3 3h2l2 4h3l-2-5" />
        </svg>
      );
    case 'teacher':
      return (
        <svg {...shared}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-1a6 6 0 0 1 12 0v1zm12-14a3 3 0 0 1 0 6m2 3a5 5 0 0 1 4 5" />
        </svg>
      );
    case 'building':
      return (
        <svg {...shared}>
          <path d="M4 21h16M6 21V7l6-4 6 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-5 8v-4h4v4" />
        </svg>
      );
    case 'system':
      return (
        <svg {...shared}>
          <path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...shared}>
          <path d="M4 5h16l-6 7v5l-4 2v-7z" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...shared}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'close':
      return (
        <svg {...shared}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case 'file':
      return (
        <svg {...shared}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8m-8 4h8" />
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

export function ParentAnnouncements({
  search,
  feed,
  loading,
  error,
}: {
  search: string;
  feed: AnnouncementFeedItem[];
  loading: boolean;
  error: string;
}) {
  const { accessToken } = useAuth();
  const announcements = useMemo<Announcement[]>(
    () =>
      feed.map((item) => {
        const authorSource = item.created_by_role === 'teacher' ? 'Teacher' : 'MSWDO Admin';
        const published = new Date(item.published_at.replace(' ', 'T'));
        return {
          id: item.id,
          title: item.title,
          source: authorSource,
          sender: item.created_by,
          date: item.published_at.slice(0, 10),
          time: published.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          publishedAt: item.published_at,
          message: item.message,
          tone: authorSource === 'Teacher' ? 'teacher' : 'mswdo',
          attachment: item.attachment,
        };
      }),
    [feed],
  );
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [enabledSources, setEnabledSources] =
    useState<AnnouncementSource[]>(sourceLabels);
  const [dateRange, setDateRange] = useState('30');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [attachmentError, setAttachmentError] = useState('');

  const filteredAnnouncements = useMemo(() => {
    const term = search.trim().toLowerCase();
    const newestDate = Math.max(
      ...announcements.map(({ date }) =>
        new Date(`${date}T00:00:00Z`).getTime(),
      ),
    );
    const rangeStart =
      dateRange === 'all'
        ? Number.NEGATIVE_INFINITY
        : newestDate - Number(dateRange) * 24 * 60 * 60 * 1000;
    return announcements
      .filter((announcement) => {
        const dateTime = new Date(`${announcement.date}T00:00:00Z`).getTime();
        const matchesSearch =
          !term ||
          `${announcement.title} ${announcement.source} ${announcement.sender} ${announcement.date} ${announcement.message}`
            .toLowerCase()
            .includes(term);
        const matchesTab =
          sourceFilter === 'all' || announcement.source === sourceFilter;
        return (
          matchesSearch &&
          matchesTab &&
          enabledSources.includes(announcement.source) &&
          dateTime >= rangeStart
        );
      })
      .sort((first, second) => {
        const difference =
          new Date(second.publishedAt.replace(' ', 'T')).getTime() -
          new Date(first.publishedAt.replace(' ', 'T')).getTime();
        return sortOrder === 'latest' ? difference : -difference;
      });
  }, [announcements, dateRange, enabledSources, search, sortOrder, sourceFilter]);

  const announcementPageSize = 3;
  const announcementPageCount = Math.max(
    1,
    Math.ceil(filteredAnnouncements.length / announcementPageSize),
  );
  const visibleAnnouncements = filteredAnnouncements.slice(
    (announcementPage - 1) * announcementPageSize,
    announcementPage * announcementPageSize,
  );

  useEffect(() => {
    setAnnouncementPage((current) => Math.min(current, announcementPageCount));
  }, [announcementPageCount]);

  function toggleSource(source: AnnouncementSource) {
    setEnabledSources((current) =>
      current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source],
    );
  }

  async function downloadAttachment(announcement: Announcement) {
    if (!announcement.attachment || !accessToken) return;
    setAttachmentError('');
    try {
      const response = await fetch(announcement.attachment.download_url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('The attachment could not be downloaded.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = announcement.attachment.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setAttachmentError(downloadError instanceof Error ? downloadError.message : 'The attachment could not be downloaded.');
    }
  }

  const counts = sourceLabels.map((source) => ({
    source,
    count: announcements.filter(
      (announcement) => announcement.source === source,
    ).length,
  }));
  const firstVisibleAnnouncement = filteredAnnouncements.length
    ? (announcementPage - 1) * announcementPageSize + 1
    : 0;
  const lastVisibleAnnouncement = Math.min(
    announcementPage * announcementPageSize,
    filteredAnnouncements.length,
  );

  return (
    <main aria-label="Announcements and notifications" className={styles.page}>
      <section
        aria-label="Announcements and notifications"
        className={styles.hero}
      >
        <span className={styles.heroIcon}>
          <Icon name="megaphone" />
        </span>
        <div>
          <h1>Announcements &amp; Notifications</h1>
          <p>
            Stay updated with the latest announcements and notifications from
            your child&apos;s teachers, MSWDO, and system administrators.
          </p>
        </div>
      </section>

      {error && <p role="alert" className={styles.emptyState}>{error}</p>}
      {attachmentError && <p role="alert" className={styles.emptyState}>{attachmentError}</p>}
      {loading && <p className={styles.emptyState}><BouncingDots label="Loading announcements" /></p>}

      <div className={styles.announcementsGrid}>
        <section aria-label="Announcement list" className={styles.listPanel}>
          <header className={styles.listPanelHeading}>
            <span className={styles.listPanelIcon}>
              <Icon name="megaphone" />
            </span>
            <div>
              <h2>Announcements</h2>
              <p>Important updates and information for you.</p>
            </div>
          </header>
          <div className={styles.listToolbar}>
            <div
              aria-label="Filter announcements by source"
              className={styles.tabs}
            >
              {(
                [
                  ['all', 'All Announcements', 'megaphone'],
                  ['Teacher', 'From Teacher', 'teacher'],
                  ['MSWDO Admin', 'From MSWDO', 'building'],
                ] as const
              ).map(([value, label, icon]) => (
                <button
                  aria-pressed={sourceFilter === value}
                  className={sourceFilter === value ? styles.activeTab : ''}
                  key={value}
                  type="button"
                  onClick={() => setSourceFilter(value)}
                >
                  <Icon name={icon} />
                  {label}
                </button>
              ))}
            </div>
            <label className={styles.sortControl}>
              <span>Sort by:</span>
              <span className={styles.visuallyHidden}>Sort announcements</span>
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as 'latest' | 'oldest')
                }
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>
            </label>
            <ListGridToggle
              initialView="list"
              onChange={setView}
              storageKey="parent-announcements-view"
            />
          </div>

          <div
            className={`${styles.announcementList} ${view === 'grid' ? styles.announcementGrid : ''}`}
          >
            {visibleAnnouncements.map((announcement) => (
              <article
                className={styles.announcementCard}
                key={announcement.id}
              >
                <span
                  className={`${styles.senderAvatar} ${styles[announcement.tone]}`}
                >
                  {announcement.source === 'Teacher' ? (
                    <img alt="" src={teacherArtwork} />
                  ) : (
                    <Icon
                      name={
                        announcement.source === 'MSWDO Admin'
                          ? 'building'
                          : 'system'
                      }
                    />
                  )}
                </span>
                <div className={styles.announcementCopy}>
                  <h2>{announcement.title}</h2>
                  <p className={styles.senderLine}>
                    From: {announcement.source} <i /> {announcement.sender}
                  </p>
                  <p className={styles.message}>{announcement.message}</p>
                </div>
                <div className={styles.announcementMeta}>
                  <time dateTime={`${announcement.date}T${announcement.time}`}>
                    <Icon name="calendar" />
                    {formatDate(announcement.date)} <i /> {announcement.time}
                  </time>
                  <span
                    className={`${styles.sourceBadge} ${styles[announcement.tone]}`}
                  >
                    {announcement.source === 'MSWDO Admin'
                      ? 'MSWDO'
                      : announcement.source}
                  </span>
                  <button
                    className={styles.detailsButton}
                    type="button"
                    onClick={() => setSelectedAnnouncement(announcement)}
                  >
                    <Icon name="eye" /> View Details
                  </button>
                </div>
              </article>
            ))}
            {!filteredAnnouncements.length && (
              <p className={styles.emptyState}>
                No announcements match your search and filters.
              </p>
            )}
          </div>
          <footer className={styles.announcementPagination}>
            <span>
              Showing {firstVisibleAnnouncement}–{lastVisibleAnnouncement} of{' '}
              {filteredAnnouncements.length} announcements
            </span>
            <div aria-label="Announcement pages" className={styles.paginationControls}>
              <button
                aria-label="Previous announcement page"
                disabled={announcementPage === 1}
                type="button"
                onClick={() =>
                  setAnnouncementPage((current) => Math.max(1, current - 1))
                }
              >
                ‹
              </button>
              <span>
                {announcementPage} / {announcementPageCount}
              </span>
              <button
                aria-label="Next announcement page"
                disabled={announcementPage >= announcementPageCount}
                type="button"
                onClick={() =>
                  setAnnouncementPage((current) =>
                    Math.min(announcementPageCount, current + 1),
                  )
                }
              >
                ›
              </button>
            </div>
          </footer>
        </section>

        <EventNotifications parentDashboard />
      </div>

      <aside className={styles.rightRail}>
          <section
            aria-labelledby="filter-heading"
            className={styles.railPanel}
          >
            <header className={styles.railHeading}>
              <Icon name="filter" />
              <h2 id="filter-heading">Quick Filters</h2>
            </header>
            <fieldset className={styles.sourceFilters}>
              <legend>From</legend>
              {counts.map(({ source, count }) => (
                <label key={source}>
                  <input
                    checked={enabledSources.includes(source)}
                    type="checkbox"
                    onChange={() => toggleSource(source)}
                  />
                  <span
                    className={`${styles.sourceDot} ${styles[source === 'Teacher' ? 'teacher' : source === 'MSWDO Admin' ? 'mswdo' : 'system']}`}
                  >
                    <Icon
                      name={
                        source === 'Teacher'
                          ? 'teacher'
                          : source === 'MSWDO Admin'
                            ? 'building'
                            : 'system'
                      }
                    />
                  </span>
                  {source}
                  <b>{count}</b>
                </label>
              ))}
            </fieldset>
            <label className={styles.dateFilter}>
              <span>
                <Icon name="calendar" /> Date Range
              </span>
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
              >
                <option value="30">Last 30 days</option>
                <option value="7">Last 7 days</option>
                <option value="all">All dates</option>
              </select>
            </label>
          </section>

          <section
            aria-labelledby="summary-heading"
            className={styles.railPanel}
          >
            <header className={styles.railHeading}>
              <Icon name="building" />
              <h2 id="summary-heading">Summary</h2>
            </header>
            <ul className={styles.summaryList}>
              {counts.map(({ source, count }) => (
                <li key={source}>
                  <span
                    className={`${styles.summaryIcon} ${styles[source === 'Teacher' ? 'teacher' : source === 'MSWDO Admin' ? 'mswdo' : 'system']}`}
                  >
                    <Icon
                      name={
                        source === 'Teacher'
                          ? 'teacher'
                          : source === 'MSWDO Admin'
                            ? 'building'
                            : 'system'
                      }
                    />
                  </span>
                  <span>
                    {source === 'Teacher'
                      ? 'Teacher Announcements'
                      : source === 'MSWDO Admin'
                        ? 'MSWDO Announcements'
                        : 'System Announcements'}
                  </span>
                  <b>{count}</b>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Stay informed" className={styles.stayInformed}>
            <Icon name="bulb" />
            <div>
              <h2>Stay Informed!</h2>
              <p>
                Check regularly for updates, important notices, and events from
                your child&apos;s teacher and the MSWDO.
              </p>
            </div>
            <span aria-hidden="true">📣</span>
          </section>
      </aside>

      {selectedAnnouncement && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedAnnouncement(null);
            }
          }}
        >
          <section
            aria-labelledby="announcement-dialog-title"
            aria-modal="true"
            className={styles.modal}
            role="dialog"
          >
            <header>
              <span
                className={`${styles.senderAvatar} ${styles[selectedAnnouncement.tone]}`}
              >
                {selectedAnnouncement.source === 'Teacher' ? (
                  <img alt="" src={teacherArtwork} />
                ) : (
                  <Icon name="building" />
                )}
              </span>
              <div>
                <h2 id="announcement-dialog-title">
                  {selectedAnnouncement.title}
                </h2>
                <p>
                  From: {selectedAnnouncement.source} ·{' '}
                  {selectedAnnouncement.sender}
                </p>
              </div>
              <button
                aria-label="Close announcement details"
                className={styles.closeButton}
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
              >
                <Icon name="close" />
              </button>
            </header>
            <p className={styles.modalMessage}>
              {selectedAnnouncement.message}
            </p>
            {selectedAnnouncement.attachment && (
              <button
                className={styles.detailsButton}
                type="button"
                onClick={() => void downloadAttachment(selectedAnnouncement)}
              >
                <Icon name="file" /> Download {selectedAnnouncement.attachment.name}
              </button>
            )}
            <time
              dateTime={`${selectedAnnouncement.date}T${selectedAnnouncement.time}`}
            >
              <Icon name="calendar" /> {formatDate(selectedAnnouncement.date)} ·{' '}
              {selectedAnnouncement.time}
            </time>
            <button
              className={styles.doneButton}
              type="button"
              onClick={() => setSelectedAnnouncement(null)}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
