import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import childrenBanner from '../../assets/images/children-banner.png';
import femalePanel from '../../../femalepanel.png';
import styles from './ParentActivities.module.css';

type ActivityStatus = 'Completed' | 'In Progress' | 'Not Started';

type Activity = {
  id: number;
  title: string;
  description: string;
  subject: string;
  child_id: number;
  child_name: string;
  birth_date: string;
  scheduled_date: string | null;
  due_at: string | null;
  published_at: string;
  submission_status: 'assigned' | 'submitted' | 'reviewed';
  submitted_at: string | null;
  score: number | null;
  feedback: string | null;
  objectives: string[];
  procedure: string[];
  materials: string[];
  status: ActivityStatus;
  icon: string;
  tone: string;
};

type ApiActivity = Omit<
  Activity,
  'description' | 'subject' | 'status' | 'icon' | 'tone'
> & {
  description: string | null;
  topic: string | null;
  domain: string | null;
};

type ActivityResponse = {
  data: ApiActivity[];
};

function activityStatus(status: Activity['submission_status']): ActivityStatus {
  if (status === 'reviewed') return 'Completed';
  if (status === 'submitted') return 'In Progress';
  return 'Not Started';
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

function ageFromBirthDate(birthDate: string) {
  const [year, month, day] = birthDate.slice(0, 10).split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age -= 1;
  }
  return Math.max(0, age);
}

function Icon({ name }: { name: string }) {
  const shared = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.9,
    viewBox: '0 0 24 24',
  };

  switch (name) {
    case 'activity':
      return (
        <svg {...shared}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 3.5h8v3H8zm-1 9 3 3 7-7" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...shared}>
          <path d="M4 5h16l-6.5 7.5V19l-3 1v-7.5z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18" />
        </svg>
      );
    case 'palette':
      return (
        <svg {...shared}>
          <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.7-3.1 1.8 1.8 0 0 1 1.5-2.8H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z" />
          <path d="M7.5 10h.01M10 7h.01m5 0h.01m2.5 4h.01" />
        </svg>
      );
    case 'letters':
      return (
        <svg {...shared}>
          <path d="m4 19 6-14 6 14M6 14h8m1-7h6m-3-3v16" />
        </svg>
      );
    case 'numbers':
      return (
        <svg {...shared}>
          <path d="M5 8c0-2 1.3-3 3-3s3 1 3 3-6 4-6 8h6m3-8c0-2 1.3-3 3-3s3 1 3 3-6 4-6 8h6" />
        </svg>
      );
    case 'book':
      return (
        <svg {...shared}>
          <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22zm18 0A2.5 2.5 0 0 0 18.5 3H12v17h6.5A2.5 2.5 0 0 1 21 22z" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...shared}>
          <path d="M20.8 8.8c0 5.5-8.8 11-8.8 11S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z" />
        </svg>
      );
    case 'movement':
      return (
        <svg {...shared}>
          <circle cx="15" cy="5" r="2" />
          <path d="m13 9-4 4-4-1m8-3 3 3-2 4m-7-4-2 7m8-3 4 4m-7-7 3 3" />
        </svg>
      );
    case 'shapes':
      return (
        <svg {...shared}>
          <circle cx="7" cy="7" r="4" />
          <path d="m17 3 5 9h-10zM5 15h8v6H5z" />
        </svg>
      );
    case 'nature':
      return (
        <svg {...shared}>
          <path d="M12 21V9m0 5c-5 0-8-3-8-8 5 0 8 3 8 8Zm0-3c0-5 3-8 8-8 0 5-3 8-8 8Z" />
        </svg>
      );
    case 'download':
      return (
        <svg {...shared}>
          <path d="M12 3v12m-5-5 5 5 5-5M4 19v2h16v-2" />
        </svg>
      );
    case 'check':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'close':
      return (
        <svg {...shared}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...shared}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />
        </svg>
      );
  }
}

export function ParentActivities({ search }: { search: string }) {
  const { request } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [childFilter, setChildFilter] = useState('All Children');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const listRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await request<ActivityResponse>('/api/parent/activities');
      const tones = ['purple', 'blue', 'green', 'red', 'teal', 'orange'];
      const icons = ['palette', 'letters', 'numbers', 'book', 'heart', 'movement', 'shapes', 'nature'];
      setActivities(
        response.data.map((activity, index) => ({
          ...activity,
          description:
            activity.description ||
            activity.topic ||
            activity.objectives.join(' ') ||
            '',
          subject: activity.domain || 'Unspecified',
          status: activityStatus(activity.submission_status),
          icon: icons[index % icons.length],
          tone: tones[index % tones.length],
        })),
      );
      setLoadError('');
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Activities and assignments could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    let active = true;
    const refresh = async (showLoading = false) => {
      if (!active) return;
      await reload(showLoading);
    };
    void refresh(true);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 30_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [reload]);

  const children = useMemo(
    () => [...new Map(activities.map((activity) => [
      activity.child_id,
      { id: activity.child_id, name: activity.child_name },
    ])).values()],
    [activities],
  );
  const subjects = useMemo(
    () => [...new Set(activities.map((activity) => activity.subject))].sort(),
    [activities],
  );

  const filteredActivities = useMemo(() => {
    const term = search.trim().toLowerCase();
    return activities.filter((activity) => {
      const matchesSearch =
        !term ||
        `${activity.title} ${activity.description} ${activity.subject} ${activity.child_name} ${activity.status}`
          .toLowerCase()
          .includes(term);
      const matchesChild =
        childFilter === 'All Children' ||
        String(activity.child_id) === childFilter;
      const matchesSubject =
        subjectFilter === 'All Subjects' || activity.subject === subjectFilter;
      const matchesStatus =
        statusFilter === 'All Status' || activity.status === statusFilter;
      const activityDate = (activity.due_at || activity.scheduled_date || '').slice(0, 10);
      const matchesStart = !startDate || (activityDate !== '' && activityDate >= startDate);
      const matchesEnd = !endDate || (activityDate !== '' && activityDate <= endDate);
      return (
        matchesSearch &&
        matchesChild &&
        matchesSubject &&
        matchesStatus &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [activities, childFilter, endDate, search, startDate, statusFilter, subjectFilter]);

  function resetFilters() {
    setChildFilter('All Children');
    setSubjectFilter('All Subjects');
    setStatusFilter('All Status');
    setStartDate('');
    setEndDate('');
  }

  function downloadActivityList() {
    const rows = [
      ['Activity', 'Description', 'Subject', 'Child', 'Due Date', 'Status'],
      ...filteredActivities.map((activity) => [
        activity.title,
        activity.description,
        activity.subject,
        activity.child_name,
        activity.due_at || activity.scheduled_date
          ? formatDate((activity.due_at || activity.scheduled_date) as string)
          : '',
        activity.status,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
            return `"${safeValue.replace(/"/g, '""')}"`;
          })
          .join(','),
      )
      .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kalingalink-activities.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const upcomingActivities = activities
    .filter((activity) => {
      const dueDate = activity.due_at?.slice(0, 10);
      return activity.status !== 'Completed' && dueDate && dueDate >= new Date().toISOString().slice(0, 10);
    })
    .sort((first, second) =>
      (first.due_at ?? '').localeCompare(second.due_at ?? ''),
    )
    .slice(0, 3);

  useEffect(() => {
    if (!selectedActivity) return;
    const latest = activities.find(({ id, child_id }) =>
      id === selectedActivity.id && child_id === selectedActivity.child_id,
    );
    if (latest) setSelectedActivity(latest);
  }, [activities, selectedActivity]);

  return (
    <main aria-label="Activities and assignments" className={styles.page}>
      <section
        aria-label="Activities and assignments"
        className={styles.hero}
        style={{ backgroundImage: `url("${childrenBanner}")` }}
      >
        <span aria-hidden="true" className={styles.heroIcon}>
          <Icon name="activity" />
        </span>
        <div className={styles.heroCopy}>
          <h1>Activities / Assignments</h1>
          <p>
            View your child’s learning activities and assignments, and track
            their completion status.
          </p>
        </div>
        <img alt="" src={femalePanel} />
      </section>

      <div className={styles.layout}>
        <div className={styles.primaryColumn}>
          <section aria-label="Filter activities" className={styles.filters}>
            <label>
              <span>Child</span>
              <select
                value={childFilter}
                onChange={(event) => setChildFilter(event.target.value)}
              >
                <option value="All Children">All Children</option>
                {children.map((child) => (
                  <option key={child.id} value={String(child.id)}>
                    {child.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Subject</span>
              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
              >
                <option>All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>All Status</option>
                <option>Completed</option>
                <option>In Progress</option>
                <option>Not Started</option>
              </select>
            </label>
            <fieldset className={styles.dateRange}>
              <legend>Date Range</legend>
              <label>
                <span className={styles.visuallyHidden}>From date</span>
                <input
                  aria-label="From date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <span aria-hidden="true">–</span>
              <label>
                <span className={styles.visuallyHidden}>To date</span>
                <input
                  aria-label="To date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </fieldset>
            <button
              className={styles.resetButton}
              type="button"
              onClick={resetFilters}
            >
              Reset
            </button>
          </section>

          <section
            aria-labelledby="activity-list-heading"
            className={styles.activityListPanel}
          >
            <header className={styles.listHeading}>
              <h2 id="activity-list-heading">Activities / Assignments List</h2>
              <span>
                {loading
                  ? <BouncingDots label="Loading activities" size="small" inline />
                  : `${filteredActivities.length} of ${activities.length} activities / assignments`}
              </span>
            </header>
            <div className={styles.activityList} ref={listRef}>
              {loadError && <p className={styles.emptyState} role="alert">{loadError}</p>}
              {!loadError && loading && <p className={styles.emptyState}><BouncingDots label="Loading your child’s activities" /></p>}
              {!loadError && !loading && filteredActivities.length ? (
                filteredActivities.map((activity) => (
                  <article className={styles.activityRow} key={activity.id}>
                    <span
                      className={`${styles.activityIcon} ${styles[activity.tone]}`}
                    >
                      <Icon name={activity.icon} />
                    </span>
                    <div className={styles.activityDescription}>
                      <div className={styles.activityTitleLine}>
                        <h3>{activity.title}</h3>
                        <span
                          className={`${styles.subjectTag} ${styles[activity.tone]}`}
                        >
                          {activity.subject}
                        </span>
                      </div>
                      {activity.description && <p>{activity.description}</p>}
                    </div>
                    <div className={styles.assignee}>
                      <img alt="" src={childrenBanner} />
                      <span>
                        <strong>{activity.child_name}</strong>
                        <small>Age: {ageFromBirthDate(activity.birth_date)} years</small>
                      </span>
                      <small className={styles.dueDate}>
                        <Icon name="calendar" />
                        {activity.due_at || activity.scheduled_date
                          ? `Due: ${formatDate((activity.due_at || activity.scheduled_date) as string)}`
                          : 'No due date'}
                      </small>
                    </div>
                    <span
                      className={`${styles.statusTag} ${styles[activity.status.replace(' ', '')]}`}
                    >
                      <span aria-hidden="true" />
                      <span>{activity.status}</span>
                    </span>
                    <button
                      aria-label={`View details for ${activity.title}`}
                      className={styles.viewButton}
                      type="button"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <span aria-hidden="true">⊙</span> View Details
                    </button>
                  </article>
                ))
              ) : !loadError && !loading ? (
                <p className={styles.emptyState}>
                  {activities.length
                    ? 'No activities match these filters. Try changing or resetting your filters.'
                    : 'No published activities are available for your children yet.'}
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <aside
          aria-label="Activity summary and actions"
          className={styles.sidebar}
        >
          <section className={styles.sidePanel}>
            <h2>Summary</h2>
            <div className={styles.summaryGrid}>
              <SummaryCard
                icon="activity"
                label="Total Activities"
                count={loading ? <BouncingDots label="Loading activity count" size="small" inline /> : activities.length}
                tone="blue"
              />
              <SummaryCard
                icon="check"
                label="Completed"
                count={loading ? <BouncingDots label="Loading completed activity count" size="small" inline /> :
                  activities.filter(({ status }) => status === 'Completed')
                    .length
                }
                tone="green"
              />
              <SummaryCard
                icon="clock"
                label="In Progress"
                count={loading ? <BouncingDots label="Loading in-progress activity count" size="small" inline /> :
                  activities.filter(({ status }) => status === 'In Progress')
                    .length
                }
                tone="orange"
              />
              <SummaryCard
                icon="close"
                label="Not Started"
                count={loading ? <BouncingDots label="Loading not-started activity count" size="small" inline /> :
                  activities.filter(({ status }) => status === 'Not Started')
                    .length
                }
                tone="purple"
              />
            </div>
          </section>

          <section className={styles.sidePanel}>
            <h2>Quick Actions</h2>
            <div className={styles.quickActions}>
              <button
                className={styles.primaryAction}
                type="button"
                onClick={() => {
                  resetFilters();
                  listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <Icon name="activity" /> View All Activities
              </button>
              <button
                disabled={!filteredActivities.length}
                className={styles.secondaryAction}
                type="button"
                onClick={downloadActivityList}
              >
                <Icon name="download" /> Download Activity List
              </button>
            </div>
          </section>

          <section className={`${styles.sidePanel} ${styles.reminders}`}>
            <h2>
              <Icon name="bell" /> Important Reminders
            </h2>
            {upcomingActivities.length ? (
              <ul>
                {upcomingActivities.map((activity) => (
                  <li key={`${activity.id}-${activity.child_id}`}>
                    {activity.title} for {activity.child_name}
                    {activity.due_at && ` — due ${formatDate(activity.due_at)}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyState}>No upcoming assignments with due dates.</p>
            )}
            <img alt="" src={femalePanel} />
          </section>
        </aside>
      </div>

      {selectedActivity && (
        <div
          className={styles.dialogBackdrop}
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedActivity(null);
          }}
        >
          <section
            aria-labelledby="activity-dialog-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <button
              aria-label="Close activity details"
              className={styles.closeButton}
              type="button"
              onClick={() => setSelectedActivity(null)}
            >
              <Icon name="close" />
            </button>
            <span
              className={`${styles.activityIcon} ${styles[selectedActivity.tone]}`}
            >
              <Icon name={selectedActivity.icon} />
            </span>
            <span
              className={`${styles.subjectTag} ${styles[selectedActivity.tone]}`}
            >
              {selectedActivity.subject}
            </span>
            <h2 id="activity-dialog-title">{selectedActivity.title}</h2>
            <p>{selectedActivity.description}</p>
            <dl>
              <div>
                <dt>For</dt>
                <dd>{selectedActivity.child_name}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>
                  {selectedActivity.due_at || selectedActivity.scheduled_date
                    ? formatDate((selectedActivity.due_at || selectedActivity.scheduled_date) as string)
                    : 'Not set'}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{selectedActivity.status}</dd>
              </div>
              {selectedActivity.submitted_at && (
                <div>
                  <dt>Submitted</dt>
                  <dd>{formatDate(selectedActivity.submitted_at)}</dd>
                </div>
              )}
              {selectedActivity.score !== null && (
                <div>
                  <dt>Score</dt>
                  <dd>{selectedActivity.score}</dd>
                </div>
              )}
              {selectedActivity.feedback && (
                <div>
                  <dt>Teacher feedback</dt>
                  <dd>{selectedActivity.feedback}</dd>
                </div>
              )}
            </dl>
            {selectedActivity.objectives.length > 0 && (
              <section>
                <h3>Objectives</h3>
                <ul>{selectedActivity.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            )}
            {selectedActivity.procedure.length > 0 && (
              <section>
                <h3>Instructions</h3>
                <ol>{selectedActivity.procedure.map((item) => <li key={item}>{item}</li>)}</ol>
              </section>
            )}
            {selectedActivity.materials.length > 0 && (
              <section>
                <h3>Materials</h3>
                <ul>{selectedActivity.materials.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  count,
  tone,
}: {
  icon: string;
  label: string;
  count: ReactNode;
  tone: string;
}) {
  return (
    <article className={`${styles.summaryCard} ${styles[tone]}`}>
      <Icon name={icon} />
      <span>{label}</span>
      <strong>{count}</strong>
    </article>
  );
}
