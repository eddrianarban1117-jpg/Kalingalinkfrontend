import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { useAuth } from '../../auth/AuthProvider';
import childrenBanner from '../../assets/images/children-banner.png';
import styles from './LearningActivities.module.css';

type ActivityStatus = 'Ongoing' | 'Upcoming' | 'Completed';
type ActivityTab = 'Overview' | 'Instructions' | 'Students' | 'Observations';

type LearningActivity = {
  id: number;
  classId: number;
  className: string;
  title: string;
  domain: string;
  ageGroup: string;
  status: ActivityStatus;
  startDate: string;
  endDate: string;
  startDateISO: string;
  endDateISO: string;
  duration: number;
  objective: string;
  materials: string[];
  instructions: string[];
  students: string[];
  observations: string;
};

type ActivityClass = { id: number; name: string };
type ApiLearningActivity = {
  id: number;
  class_id: number;
  class_name: string;
  title: string;
  domain: string;
  age_group: string;
  start_date: string;
  end_date: string;
  duration_minutes: number;
  objective: string | null;
  materials: string[];
  instructions: string[];
  students: string[];
  observations: string | null;
  status: 'ongoing' | 'upcoming' | 'completed';
};
type LearningActivityResponse = {
  data: { activities: ApiLearningActivity[]; classes: ActivityClass[] };
};

const statusLabel: Record<ApiLearningActivity['status'], ActivityStatus> = {
  ongoing: 'Ongoing',
  upcoming: 'Upcoming',
  completed: 'Completed',
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function mapActivity(record: ApiLearningActivity): LearningActivity {
  return {
    id: record.id,
    classId: record.class_id,
    className: record.class_name,
    title: record.title,
    domain: record.domain,
    ageGroup: record.age_group,
    status: statusLabel[record.status],
    startDate: formatDate(record.start_date),
    endDate: formatDate(record.end_date),
    startDateISO: record.start_date,
    endDateISO: record.end_date,
    duration: record.duration_minutes,
    objective: record.objective ?? '',
    materials: record.materials,
    instructions: record.instructions,
    students: record.students,
    observations: record.observations ?? '',
  };
}

const tabs: ActivityTab[] = [
  'Overview',
  'Instructions',
  'Students',
  'Observations',
];

const statusTabs: Array<'All Activities' | ActivityStatus> = [
  'All Activities',
  'Ongoing',
  'Upcoming',
  'Completed',
];

function ActivityIcon({
  kind,
}: {
  kind: 'book' | 'plus' | 'search' | 'clock' | 'calendar';
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

  if (kind === 'book') {
    return (
      <svg {...shared}>
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22zm18 0A2.5 2.5 0 0 0 18.5 3H12v17h6.5A2.5 2.5 0 0 1 21 22z" />
      </svg>
    );
  }

  if (kind === 'plus') {
    return (
      <svg {...shared}>
        <path d="M12 5v14m-7-7h14" />
      </svg>
    );
  }

  if (kind === 'search') {
    return (
      <svg {...shared}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </svg>
    );
  }

  if (kind === 'clock') {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
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

function formatActivityDate(start: string, end: string) {
  return `${start} – ${end}`;
}

export function LearningActivities({ globalSearch }: { globalSearch: string }) {
  const { request } = useAuth();
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [classes, setClasses] = useState<ActivityClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeStatus, setActiveStatus] =
    useState<(typeof statusTabs)[number]>('All Activities');
  const [titleSearch, setTitleSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ActivityTab>('Overview');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formDuration, setFormDuration] = useState(30);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formObjective, setFormObjective] = useState('');
  const [formMaterials, setFormMaterials] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formObservations, setFormObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [monthDate] = useState(() => new Date());

  const reloadActivities = useCallback(async () => {
    setLoadError('');
    try {
      const response = await request<LearningActivityResponse>(
        '/api/teacher/learning-activities',
      );
      const mapped = response.data.activities.map(mapActivity);
      setActivities(mapped);
      setClasses(response.data.classes);
      setSelectedId((current) =>
        current !== null && mapped.some(({ id }) => id === current)
          ? current
          : (mapped[0]?.id ?? null),
      );
    } catch (error) {
      setActivities([]);
      setClasses([]);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Learning activities could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active && document.visibilityState === 'visible') {
        void reloadActivities();
      }
    };
    void reloadActivities();
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reloadActivities]);

  const activityCounts = useMemo(
    () => ({
      'All Activities': activities.length,
      Ongoing: activities.filter(({ status }) => status === 'Ongoing').length,
      Upcoming: activities.filter(({ status }) => status === 'Upcoming').length,
      Completed: activities.filter(({ status }) => status === 'Completed')
        .length,
    }),
    [activities],
  );

  const visibleActivities = useMemo(() => {
    const search = `${titleSearch} ${globalSearch}`.trim().toLowerCase();
    const startOfMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
    );
    return activities.filter((activity) => {
      const startDate = new Date(`${activity.startDateISO}T00:00:00`);
      const endDate = new Date(`${activity.endDateISO}T00:00:00`);
      const matchesSearch =
        !search ||
        `${activity.title} ${activity.domain} ${activity.className}`
          .toLowerCase()
          .includes(search);
      const matchesDomain = !domainFilter || activity.domain === domainFilter;
      const matchesAge = !ageFilter || activity.ageGroup === ageFilter;
      const matchesStatus = !statusFilter || activity.status === statusFilter;
      const matchesTab =
        activeStatus === 'All Activities' || activity.status === activeStatus;
      const matchesDate =
        dateRange === 'all' ||
        (startDate <= endOfMonth && endDate >= startOfMonth);
      return (
        matchesSearch &&
        matchesDomain &&
        matchesAge &&
        matchesStatus &&
        matchesTab &&
        matchesDate
      );
    });
  }, [
    activities,
    activeStatus,
    ageFilter,
    dateRange,
    domainFilter,
    globalSearch,
    monthDate,
    statusFilter,
    titleSearch,
  ]);

  const selectedActivity =
    selectedId === null
      ? undefined
      : (visibleActivities.find(({ id }) => id === selectedId) ??
        visibleActivities[0]);

  function openActivityDialog(activity?: LearningActivity) {
    setEditingId(activity?.id ?? null);
    setFormTitle(activity?.title ?? '');
    setFormClassId(
      activity ? String(activity.classId) : String(classes[0]?.id ?? ''),
    );
    setFormDomain(activity?.domain ?? '');
    setFormAge(activity?.ageGroup ?? '');
    setFormDuration(activity?.duration ?? 30);
    setFormStartDate(activity?.startDateISO ?? '');
    setFormEndDate(activity?.endDateISO ?? '');
    setFormObjective(activity?.objective ?? '');
    setFormMaterials(activity?.materials.join('\n') ?? '');
    setFormInstructions(activity?.instructions.join('\n') ?? '');
    setFormObservations(activity?.observations ?? '');
    setDialogOpen(true);
  }

  async function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = formTitle.trim();
    if (!title || saving) return;

    setSaving(true);
    setNotice('');
    const payload = {
      class_id: Number(formClassId),
      title,
      domain: formDomain.trim(),
      age_group: formAge.trim(),
      start_date: formStartDate,
      end_date: formEndDate,
      duration_minutes: formDuration,
      objective: formObjective.trim(),
      materials: formMaterials
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
      instructions: formInstructions
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
      observations: formObservations.trim(),
    };
    try {
      await request(
        editingId === null
          ? '/api/teacher/learning-activities'
          : `/api/teacher/learning-activities/${editingId}`,
        {
          method: editingId === null ? 'POST' : 'PUT',
          body: JSON.stringify(payload),
        },
      );
      await reloadActivities();
      setNotice(editingId === null ? 'Activity created.' : 'Activity updated.');
      setDialogOpen(false);
      setActiveStatus('All Activities');
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'The activity could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  function renderActivityDetails() {
    if (!selectedActivity) return null;
    if (activeTab === 'Instructions') {
      return (
        <ol className={styles.detailList}>
          {selectedActivity.instructions.map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
        </ol>
      );
    }
    if (activeTab === 'Students') {
      return selectedActivity.students.length ? (
        <ul className={styles.detailList}>
          {selectedActivity.students.map((student) => (
            <li key={student}>{student}</li>
          ))}
        </ul>
      ) : (
        <p className={styles.detailCopy}>No students have been assigned yet.</p>
      );
    }
    if (activeTab === 'Observations') {
      return (
        <p className={styles.detailCopy}>
          {selectedActivity.observations || 'No observations recorded.'}
        </p>
      );
    }
    return (
      <>
        <section className={styles.detailSection}>
          <h3>
            <span aria-hidden="true">◎</span> Objective
          </h3>
          <p>{selectedActivity.objective || 'No objective recorded.'}</p>
        </section>
        <section className={styles.detailSection}>
          <h3>
            <span aria-hidden="true">◇</span> Materials Needed
          </h3>
          <ul>
            {selectedActivity.materials.map((material) => (
              <li key={material}>{material}</li>
            ))}
          </ul>
        </section>
        <section className={styles.detailSection}>
          <h3>
            <span aria-hidden="true">☷</span> Instructions
          </h3>
          <ol>
            {selectedActivity.instructions.slice(0, 3).map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
            {!selectedActivity.instructions.length && (
              <li>No instructions recorded.</li>
            )}
          </ol>
        </section>
      </>
    );
  }

  return (
    <main aria-label="Learning Activities" className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.heading}>
          <span aria-hidden="true" className={styles.headingIcon}>
            <ActivityIcon kind="book" />
          </span>
          <div>
            <h1>Learning Activities</h1>
            <p>Manage and track your students’ learning activities.</p>
          </div>
        </div>
        <button
          className={styles.createButton}
          type="button"
          disabled={!classes.length}
          onClick={() => openActivityDialog()}
        >
          <ActivityIcon kind="plus" />
          Create Activity
        </button>
      </header>

      {notice && (
        <p aria-live="polite" className={styles.notice}>
          {notice}
          <button
            aria-label="Dismiss message"
            type="button"
            onClick={() => setNotice('')}
          >
            ×
          </button>
        </p>
      )}
      {loadError && (
        <p className={styles.errorNotice} role="alert">
          {loadError}
        </p>
      )}

      <section aria-label="Activity filters" className={styles.filters}>
        <label className={styles.searchFilter}>
          <ActivityIcon kind="search" />
          <span className={styles.visuallyHidden}>Search activity titles</span>
          <input
            type="search"
            placeholder="Search by activity title..."
            value={titleSearch}
            onChange={(event) => setTitleSearch(event.target.value)}
          />
        </label>
        <label className={styles.visuallyHidden} htmlFor="activity-domain">
          Learning domain
        </label>
        <select
          id="activity-domain"
          value={domainFilter}
          onChange={(event) => setDomainFilter(event.target.value)}
        >
          <option value="">All Learning Domains</option>
          {[...new Set(activities.map(({ domain }) => domain))].map(
            (domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ),
          )}
        </select>
        <label className={styles.visuallyHidden} htmlFor="activity-age">
          Age group
        </label>
        <select
          id="activity-age"
          value={ageFilter}
          onChange={(event) => setAgeFilter(event.target.value)}
        >
          <option value="">All Age Groups</option>
          {[...new Set(activities.map(({ ageGroup }) => ageGroup))].map(
            (age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ),
          )}
        </select>
        <label className={styles.visuallyHidden} htmlFor="activity-status">
          Activity status
        </label>
        <select
          id="activity-status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">All Status</option>
          {statusTabs.slice(1).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <label className={styles.dateFilter}>
          <ActivityIcon kind="calendar" />
          <span className={styles.visuallyHidden}>Date range</span>
          <select
            aria-label="Activity date range"
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
          >
            <option value="month">
              {new Date(
                monthDate.getFullYear(),
                monthDate.getMonth(),
                1,
              ).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}{' '}
              –{' '}
              {new Date(
                monthDate.getFullYear(),
                monthDate.getMonth() + 1,
                0,
              ).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </option>
            <option value="all">All dates</option>
          </select>
        </label>
      </section>

      <div className={styles.workspace}>
        <section aria-label="Activity list" className={styles.listColumn}>
          <div
            aria-label="Filter activities by status"
            className={styles.statusTabs}
          >
            {statusTabs.map((status) => (
              <button
                aria-pressed={activeStatus === status}
                className={`${styles.statusTab} ${
                  activeStatus === status ? styles.activeStatusTab : ''
                }`}
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
              >
                {status}
                <span>{activityCounts[status]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <p aria-live="polite" className={styles.emptyState}>
              Loading learning activities…
            </p>
          ) : visibleActivities.length ? (
            <div className={styles.activityGrid}>
              {visibleActivities.map((activity) => (
                <article
                  className={`${styles.activityCard} ${
                    selectedActivity?.id === activity.id
                      ? styles.selectedCard
                      : ''
                  }`}
                  key={activity.id}
                >
                  <button
                    aria-label={`View ${activity.title} details`}
                    className={styles.cardSelect}
                    type="button"
                    onClick={() => {
                      setSelectedId(activity.id);
                      setActiveTab('Overview');
                    }}
                  >
                    <span
                      className={styles.cardStatus}
                      data-status={activity.status}
                    >
                      {activity.status}
                    </span>
                    <span aria-hidden="true" className={styles.activityArt}>
                      <img src={childrenBanner} alt="" />
                    </span>
                    <strong className={styles.cardTitle}>
                      {activity.title}
                    </strong>
                    <span className={styles.cardMeta}>
                      <span aria-hidden="true">✿</span>
                      {activity.domain}
                    </span>
                    <span className={styles.cardMeta}>
                      <span aria-hidden="true">♟</span>
                      {activity.ageGroup}
                    </span>
                    <span className={styles.cardMeta}>
                      <ActivityIcon kind="calendar" />
                      {formatActivityDate(activity.startDate, activity.endDate)}
                    </span>
                    <span className={styles.cardMeta}>
                      <ActivityIcon kind="clock" />
                      {activity.duration} minutes
                    </span>
                    <span className={styles.cardMeta}>
                      {activity.className}
                    </span>
                  </button>
                  <button
                    className={styles.viewDetails}
                    type="button"
                    onClick={() => {
                      setSelectedId(activity.id);
                      setActiveTab('Overview');
                    }}
                  >
                    <span aria-hidden="true">⊙</span> View Details
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>
              {loadError
                ? 'Activities are unavailable until the connection is restored.'
                : activities.length
                  ? 'No activities match these filters. Try changing your search or filters.'
                  : 'No learning activities have been created for your classes yet.'}
            </p>
          )}
        </section>

        {selectedId !== null && selectedActivity && (
          <aside
            aria-label="Selected activity details"
            className={styles.detailPanel}
          >
            <header className={styles.detailHeader}>
              <span
                className={styles.cardStatus}
                data-status={selectedActivity.status}
              >
                {selectedActivity.status}
              </span>
              <button
                aria-label="Close activity details"
                className={styles.closeDetail}
                type="button"
                onClick={() => setSelectedId(null)}
              >
                ×
              </button>
            </header>
            {selectedId !== null && (
              <>
                <div aria-hidden="true" className={styles.detailArt}>
                  <img src={childrenBanner} alt="" />
                </div>
                <h2>{selectedActivity.title}</h2>
                <div className={styles.detailMeta}>
                  <span>
                    <span aria-hidden="true">✿</span>
                    {selectedActivity.domain}
                  </span>
                  <span>
                    <span aria-hidden="true">♟</span>
                    {selectedActivity.ageGroup}
                  </span>
                  <span>{selectedActivity.className}</span>
                  <span>
                    <ActivityIcon kind="calendar" />
                    {formatActivityDate(
                      selectedActivity.startDate,
                      selectedActivity.endDate,
                    )}
                  </span>
                  <span>
                    <ActivityIcon kind="clock" />
                    {selectedActivity.duration} minutes
                  </span>
                </div>
                <div
                  aria-label="Activity information"
                  className={styles.detailTabs}
                >
                  {tabs.map((tab) => (
                    <button
                      aria-pressed={activeTab === tab}
                      className={
                        activeTab === tab ? styles.activeDetailTab : ''
                      }
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className={styles.detailContent}>
                  {renderActivityDetails()}
                </div>
                <footer className={styles.detailFooter}>
                  <p data-status={selectedActivity.status}>
                    <span aria-hidden="true">●</span>
                    Activity is {selectedActivity.status.toLowerCase()}
                  </p>
                  <button
                    className={styles.editButton}
                    type="button"
                    onClick={() => openActivityDialog(selectedActivity)}
                  >
                    Edit Activity <span aria-hidden="true">↗</span>
                  </button>
                </footer>
              </>
            )}
          </aside>
        )}
      </div>

      {dialogOpen && (
        <div className={styles.dialogBackdrop}>
          <section
            aria-labelledby="activity-dialog-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <header>
              <h2 id="activity-dialog-title">
                {editingId === null ? 'Create Activity' : 'Edit Activity'}
              </h2>
              <button
                aria-label="Close dialog"
                type="button"
                onClick={() => setDialogOpen(false)}
              >
                ×
              </button>
            </header>
            <form onSubmit={saveActivity}>
              <label>
                <span>Activity title</span>
                <input
                  autoFocus
                  required
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.target.value)}
                />
              </label>
              <label>
                <span>Class</span>
                <select
                  required
                  value={formClassId}
                  onChange={(event) => setFormClassId(event.target.value)}
                >
                  <option value="">Select a class</option>
                  {classes.map((activityClass) => (
                    <option key={activityClass.id} value={activityClass.id}>
                      {activityClass.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Learning domain</span>
                <input
                  required
                  value={formDomain}
                  onChange={(event) => setFormDomain(event.target.value)}
                />
              </label>
              <label>
                <span>Age group</span>
                <input
                  required
                  value={formAge}
                  onChange={(event) => setFormAge(event.target.value)}
                />
              </label>
              <label>
                <span>Start date</span>
                <input
                  required
                  type="date"
                  value={formStartDate}
                  onChange={(event) => setFormStartDate(event.target.value)}
                />
              </label>
              <label>
                <span>End date</span>
                <input
                  required
                  type="date"
                  value={formEndDate}
                  onChange={(event) => setFormEndDate(event.target.value)}
                />
              </label>
              <label>
                <span>Duration in minutes</span>
                <input
                  min="1"
                  required
                  type="number"
                  value={formDuration}
                  onChange={(event) =>
                    setFormDuration(Number(event.target.value))
                  }
                />
              </label>
              <label className={styles.dialogWideField}>
                <span>Objective</span>
                <textarea
                  rows={3}
                  value={formObjective}
                  onChange={(event) => setFormObjective(event.target.value)}
                />
              </label>
              <label className={styles.dialogWideField}>
                <span>Materials (one per line)</span>
                <textarea
                  rows={3}
                  value={formMaterials}
                  onChange={(event) => setFormMaterials(event.target.value)}
                />
              </label>
              <label className={styles.dialogWideField}>
                <span>Instructions (one per line)</span>
                <textarea
                  rows={4}
                  value={formInstructions}
                  onChange={(event) => setFormInstructions(event.target.value)}
                />
              </label>
              <label className={styles.dialogWideField}>
                <span>Observations</span>
                <textarea
                  rows={3}
                  value={formObservations}
                  onChange={(event) => setFormObservations(event.target.value)}
                />
              </label>
              <div className={styles.dialogActions}>
                <button type="button" onClick={() => setDialogOpen(false)}>
                  Cancel
                </button>
                <button disabled={saving || !classes.length} type="submit">
                  {saving
                    ? 'Saving…'
                    : editingId === null
                      ? 'Create Activity'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
