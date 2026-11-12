import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import styles from './ChildrenProgress.module.css';

type DomainStatus = 'On Track' | 'Needs Support' | 'Needs Attention';
type ProgressTab =
  'Overview' | 'Domain Progress' | 'Observations' | 'Recorded Skills';
type ProgressEntry = {
  id: number;
  date: string;
  domain: string;
  skill: string;
  rating: number;
  observation: string | null;
};

type StudentProgress = {
  id: number;
  name: string;
  age: number;
  birthday: string | null;
  overall: number;
  status: DomainStatus | null;
  domains: Array<{
    name: string;
    score: number;
    status: DomainStatus;
    recordCount: number;
    skills: string[];
  }>;
  notes: ProgressEntry[];
  observations: ProgressEntry[];
  records: ProgressEntry[];
};

type ApiStudentProgress = Omit<StudentProgress, 'birthday' | 'domains'> & {
  birthday: string | null;
  domains: Array<{
    name: string;
    score: number;
    status: DomainStatus;
    record_count: number;
    skills: string[];
  }>;
};

type ChildrenProgressResponse = {
  data: { month: string; students: ApiStudentProgress[]; domains: string[] };
};

type ProgressSaveResponse = {
  message?: string;
  warning?: string | null;
};

type ProgressNotice = {
  kind: 'success' | 'warning' | 'error';
  message: string;
};

const domainColors = ['teal', 'blue', 'purple', 'yellow', 'pink'];
const noteColors = ['green', 'blue', 'yellow', 'purple'];
const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

function formatDate(value: string | null) {
  if (!value) return 'Not provided';
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
    undefined,
    { month: 'long', day: 'numeric', year: 'numeric' },
  );
}

function mapStudent(record: ApiStudentProgress): StudentProgress {
  return {
    ...record,
    domains: record.domains.map((domain) => ({
      ...domain,
      recordCount: domain.record_count,
    })),
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const progressTabs: ProgressTab[] = [
  'Overview',
  'Domain Progress',
  'Observations',
  'Recorded Skills',
];

const statusOptions: Array<'All Status' | DomainStatus> = [
  'All Status',
  'On Track',
  'Needs Support',
  'Needs Attention',
];

function ProgressIcon({
  name,
}: {
  name: 'chart' | 'calendar' | 'book' | 'bulb' | 'note';
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
  if (name === 'chart') {
    return (
      <svg {...shared}>
        <path d="M3 20h18M5 18V9m5 9V5m5 13v-7m5 7V3" />
        <path d="m4 7 6-3 5 4 5-5" />
      </svg>
    );
  }
  if (name === 'calendar') {
    return (
      <svg {...shared}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </svg>
    );
  }
  if (name === 'book') {
    return (
      <svg {...shared}>
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22zm18 0A2.5 2.5 0 0 0 18.5 3H12v17h6.5A2.5 2.5 0 0 1 21 22z" />
      </svg>
    );
  }
  if (name === 'bulb') {
    return (
      <svg {...shared}>
        <path d="M9 18h6m-5 4h4m-2-20a7 7 0 0 0-4 12.75c.7.5 1 1.25 1 2.25h6c0-1 .3-1.75 1-2.25A7 7 0 0 0 12 2Z" />
      </svg>
    );
  }
  return (
    <svg {...shared}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8m-8 4h8" />
    </svg>
  );
}

function progressGradient(student: StudentProgress) {
  if (!student.domains.length) return '#e8f1fa 0% 100%';
  let offset = 0;
  return student.domains
    .map((_, index) => {
      const next = offset + 100 / student.domains.length;
      const color = domainColors[index % domainColors.length];
      const segment = `var(--progress-${color}) ${offset}% ${next}%`;
      offset = next;
      return segment;
    })
    .join(', ');
}

export function ChildrenProgress({ globalSearch }: { globalSearch: string }) {
  const { request } = useAuth();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ProgressTab>('Overview');
  const [search, setSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState(currentMonth);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<ProgressNotice | null>(null);
  const [formChildId, setFormChildId] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formSkill, setFormSkill] = useState('');
  const [formRating, setFormRating] = useState<number | null>(null);
  const [formObservation, setFormObservation] = useState('');
  const [formDate, setFormDate] = useState(() => `${currentMonth()}-01`);
  const latestRequest = useRef(0);
  const isMounted = useRef(false);

  const reloadProgress = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoadError('');
    try {
      const response = await request<ChildrenProgressResponse>(
        `/api/teacher/children-progress?month=${encodeURIComponent(dateRange)}`,
      );
      if (!isMounted.current || requestId !== latestRequest.current) return;
      const mapped = response.data.students.map(mapStudent);
      setStudents(mapped);
      setAvailableDomains(response.data.domains);
      setSelectedId((current) =>
        current !== null && mapped.some(({ id }) => id === current)
          ? current
          : (mapped[0]?.id ?? null),
      );
    } catch (error) {
      if (!isMounted.current || requestId !== latestRequest.current) return;
      setStudents([]);
      setAvailableDomains([]);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Children progress could not be loaded.',
      );
    } finally {
      if (isMounted.current && requestId === latestRequest.current) {
        setLoading(false);
      }
    }
  }, [dateRange, request]);

  useEffect(() => {
    isMounted.current = true;
    void reloadProgress();
    return () => {
      isMounted.current = false;
    };
  }, [reloadProgress]);

  const filteredStudents = useMemo(() => {
    const term = `${search} ${globalSearch}`.trim().toLowerCase();
    return students.filter((student) => {
      const matchesTerm = !term || student.name.toLowerCase().includes(term);
      const matchesAge = !ageFilter || String(student.age) === ageFilter;
      const matchesDomain =
        !domainFilter ||
        student.domains.some(({ name }) => name === domainFilter);
      const matchesStatus =
        !statusFilter ||
        student.status === statusFilter ||
        student.domains.some(({ status }) => status === statusFilter);
      return matchesTerm && matchesAge && matchesDomain && matchesStatus;
    });
  }, [ageFilter, domainFilter, globalSearch, search, statusFilter, students]);

  const selectedStudent =
    filteredStudents.find(({ id }) => id === selectedId) ?? filteredStudents[0];

  function openProgressDialog() {
    setFormChildId(
      selectedStudent
        ? String(selectedStudent.id)
        : String(students[0]?.id ?? ''),
    );
    setFormDomain(availableDomains[0] ?? '');
    setFormSkill('');
    setFormRating(null);
    setFormObservation('');
    setFormDate(`${dateRange}-01`);
    setNotice(null);
    setDialogOpen(true);
  }

  async function saveProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const response = await request<ProgressSaveResponse>(
        '/api/teacher/children-progress',
        {
          method: 'POST',
          body: JSON.stringify({
            child_id: Number(formChildId),
            domain: formDomain.trim(),
            skill: formSkill.trim(),
            rating: formRating,
            observation: formObservation.trim(),
            recorded_at: formDate,
          }),
        },
      );
      await reloadProgress();
      setNotice({
        kind: response.warning ? 'warning' : 'success',
        message: response.warning
          ? `${response.message ?? 'Progress record saved.'} ${response.warning}`
          : (response.message ?? 'Progress record saved.'),
      });
      setDialogOpen(false);
    } catch (error) {
      setNotice({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Progress record could not be saved.',
      });
    } finally {
      setSaving(false);
    }
  }

  function renderProgressContent() {
    if (!selectedStudent) {
      return (
        <p className={styles.emptyStudents}>
          {loading ? (
            <BouncingDots label="Loading progress records" />
          ) : (
            'No student is available for this selection.'
          )}
        </p>
      );
    }
    if (activeTab === 'Observations') {
      return selectedStudent.observations.length ? (
        <div className={styles.observationList}>
          {selectedStudent.observations.map((observation, index) => (
            <article className={styles.observationCard} key={observation.id}>
              <span
                className={`${styles.observationIcon} ${styles[`note${index}`]}`}
              >
                <ProgressIcon name="note" />
              </span>
              <span>
                <strong>{formatDate(observation.date)}</strong>
                <span>
                  {observation.domain} · {observation.skill}
                </span>
                <span>{observation.observation}</span>
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.emptyStudents}>
          No observations are recorded for this child during the selected month.
        </p>
      );
    }
    if (activeTab === 'Recorded Skills') {
      return selectedStudent.records.length ? (
        <div className={styles.milestoneList}>
          {selectedStudent.records.map((record) => (
            <article key={record.id}>
              <span className={styles.milestoneCheck}>
                {record.rating >= 4 ? '✓' : '•'}
              </span>
              <span>
                <strong>{record.skill}</strong>
                <small>
                  {record.domain} · Rating {record.rating}/5 ·{' '}
                  {formatDate(record.date)}
                </small>
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.emptyStudents}>
          No skills are recorded for this child during the selected month.
        </p>
      );
    }
    return selectedStudent.domains.length ? (
      <div className={styles.domainList}>
        {selectedStudent.domains.map((domain, index) => {
          const color = domainColors[index % domainColors.length];
          return (
            <article className={styles.domainCard} key={domain.name}>
              <span className={`${styles.domainIcon} ${styles[color]}`}>
                {domain.name.slice(0, 1)}
              </span>
              <span className={styles.domainInfo}>
                <strong>{domain.name}</strong>
                <small>
                  {domain.recordCount} recorded{' '}
                  {domain.recordCount === 1 ? 'rating' : 'ratings'} ·{' '}
                  {domain.skills.join(', ')}
                </small>
                <span className={styles.progressTrack}>
                  <span
                    className={`${styles.progressBar} ${styles[color]}`}
                    style={{ width: `${domain.score}%` }}
                  />
                  <b>{domain.score}%</b>
                </span>
              </span>
              <span className={styles.domainStatus} data-status={domain.status}>
                {domain.status}
              </span>
            </article>
          );
        })}
      </div>
    ) : (
      <p className={styles.emptyStudents}>
        No progress has been recorded for this child during the selected month.
      </p>
    );
  }

  return (
    <main aria-label="Children Progress" className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}>
            <ProgressIcon name="chart" />
          </span>
          <div>
            <h1>Children Progress</h1>
            <p>
              Track and view the developmental progress of your students across
              different learning domains.
            </p>
          </div>
        </div>
        <button
          className={styles.addProgressButton}
          disabled={loading || students.length === 0}
          type="button"
          onClick={openProgressDialog}
        >
          + Add Progress Record
        </button>
      </header>
      {notice && (
        <p
          aria-live={notice.kind === 'error' ? 'assertive' : 'polite'}
          className={
            notice.kind === 'error'
              ? styles.errorNotice
              : notice.kind === 'warning'
                ? styles.warningNotice
                : styles.notice
          }
          role={notice.kind === 'error' ? 'alert' : 'status'}
        >
          {notice.message}
          <button
            aria-label="Dismiss message"
            type="button"
            onClick={() => setNotice(null)}
          >
            ×
          </button>
        </p>
      )}
      {loadError && (
        <p aria-live="polite" className={styles.errorNotice}>
          {loadError}
        </p>
      )}

      <section aria-label="Progress filters" className={styles.filters}>
        <label className={styles.searchFilter}>
          <span aria-hidden="true">⌕</span>
          <span className={styles.visuallyHidden}>Search students</span>
          <input
            placeholder="Search by name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="search"
          />
        </label>
        <label className={styles.visuallyHidden} htmlFor="progress-age">
          Age group
        </label>
        <select
          id="progress-age"
          value={ageFilter}
          onChange={(event) => setAgeFilter(event.target.value)}
        >
          <option value="">All Age Groups</option>
          {[...new Set(students.map(({ age }) => String(age)))]
            .sort()
            .map((age) => (
              <option key={age} value={age}>
                Age {age} years old
              </option>
            ))}
        </select>
        <label className={styles.visuallyHidden} htmlFor="progress-domain">
          Learning domain
        </label>
        <select
          id="progress-domain"
          value={domainFilter}
          onChange={(event) => setDomainFilter(event.target.value)}
        >
          <option value="">All Learning Domains</option>
          {availableDomains.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <label className={styles.visuallyHidden} htmlFor="progress-status">
          Progress status
        </label>
        <select
          id="progress-status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status === 'All Status' ? '' : status}>
              {status}
            </option>
          ))}
        </select>
        <label className={styles.dateFilter}>
          <ProgressIcon name="calendar" />
          <span className={styles.visuallyHidden}>Progress date range</span>
          <input
            aria-label="Progress month"
            type="month"
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
          />
        </label>
      </section>

      <div className={styles.workspace}>
        <section aria-label="Students" className={styles.studentPanel}>
          <header className={styles.studentPanelHeader}>
            <h2>Students</h2>
            <span>{filteredStudents.length} students</span>
          </header>
          <div className={styles.studentList}>
            {filteredStudents.map((student) => (
              <button
                aria-pressed={selectedStudent?.id === student.id}
                className={`${styles.studentRow} ${selectedStudent?.id === student.id ? styles.selectedStudent : ''}`}
                key={student.id}
                type="button"
                onClick={() => setSelectedId(student.id)}
              >
                <span
                  className={`${styles.studentAvatar} ${styles.blueAvatar}`}
                >
                  {initials(student.name)}
                </span>
                <span className={styles.studentCopy}>
                  <strong>{student.name}</strong>
                  <small>Age: {student.age} years old</small>
                </span>
                <span className={styles.rowArrow} aria-hidden="true">
                  ›
                </span>
              </button>
            ))}
            {loading ? (
              <p className={styles.emptyStudents}>
                <BouncingDots label="Loading students" />
              </p>
            ) : (
              filteredStudents.length === 0 && (
                <p className={styles.emptyStudents}>
                  {students.length === 0
                    ? 'No enrolled students are assigned to your active classes.'
                    : 'No students match these filters.'}
                </p>
              )
            )}
          </div>
        </section>

        {selectedStudent ? (
          <section
            aria-label={`${selectedStudent.name} progress`}
            className={styles.profilePanel}
          >
            <header className={styles.profileHeader}>
              <span className={`${styles.profileAvatar} ${styles.blueAvatar}`}>
                {initials(selectedStudent.name)}
              </span>
              <span className={styles.profileCopy}>
                <strong>{selectedStudent.name}</strong>
                <span>♟ &nbsp;Age: {selectedStudent.age} years old</span>
                <span>
                  <ProgressIcon name="calendar" /> Birthday:{' '}
                  {formatDate(selectedStudent.birthday)}
                </span>
              </span>
              {selectedStudent.status && (
                <span
                  className={styles.overallStatus}
                  data-status={selectedStudent.status}
                >
                  {selectedStudent.status}
                </span>
              )}
            </header>
            <div
              aria-label="Student progress tabs"
              className={styles.progressTabs}
            >
              {progressTabs.map((tab) => (
                <button
                  aria-pressed={activeTab === tab}
                  className={activeTab === tab ? styles.activeTab : ''}
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className={styles.domainSection}>
              <h2>
                {activeTab === 'Overview' || activeTab === 'Domain Progress'
                  ? 'Learning Domain Progress'
                  : activeTab}
              </h2>
              {renderProgressContent()}
            </div>
          </section>
        ) : (
          <section className={styles.profilePanel}>
            <p className={styles.emptyStudents}>
              {loading ? (
                <BouncingDots label="Loading progress" />
              ) : (
                'Select an enrolled student to view recorded progress.'
              )}
            </p>
          </section>
        )}

        {selectedStudent && (
          <aside
            aria-label="Progress summary and recent notes"
            className={styles.rightColumn}
          >
            <section className={styles.summaryPanel}>
              <h2>
                <ProgressIcon name="chart" />
                Progress Summary
              </h2>
              <div className={styles.summaryBody}>
                <div
                  aria-label={`Overall progress ${selectedStudent.overall}%`}
                  className={styles.progressDonut}
                  style={{
                    background: `conic-gradient(${progressGradient(selectedStudent)})`,
                  }}
                >
                  <span>
                    <small>
                      Overall
                      <br />
                      Progress
                    </small>
                    <strong>{selectedStudent.overall}%</strong>
                  </span>
                </div>
                <ul className={styles.summaryLegend}>
                  <li>
                    <i className={styles.legendOnTrack} />
                    <span>On Track</span>
                    <strong>
                      {
                        selectedStudent.domains.filter(
                          ({ status }) => status === 'On Track',
                        ).length
                      }
                    </strong>
                  </li>
                  <li>
                    <i className={styles.legendSupport} />
                    <span>Needs Support</span>
                    <strong>
                      {
                        selectedStudent.domains.filter(
                          ({ status }) => status === 'Needs Support',
                        ).length
                      }
                    </strong>
                  </li>
                  <li>
                    <i className={styles.legendAttention} />
                    <span>Needs Attention</span>
                    <strong>
                      {
                        selectedStudent.domains.filter(
                          ({ status }) => status === 'Needs Attention',
                        ).length
                      }
                    </strong>
                  </li>
                </ul>
              </div>
              <div className={styles.encouragement}>
                <ProgressIcon name="bulb" />
                <p>
                  <strong>
                    {selectedStudent.domains.length
                      ? 'Recorded progress'
                      : 'No progress records'}
                  </strong>
                  {selectedStudent.domains.length
                    ? `${selectedStudent.domains.reduce((total, domain) => total + domain.recordCount, 0)} ratings recorded for ${selectedStudent.name} during ${dateRange}.`
                    : `No ratings or observations have been recorded for ${selectedStudent.name} during ${dateRange}.`}
                </p>
              </div>
            </section>
            <section className={styles.notesPanel}>
              <header>
                <h2>
                  <ProgressIcon name="note" />
                  Recent Notes
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAllNotes((value) => !value)}
                >
                  {showAllNotes ? 'Show Less' : 'View All'}{' '}
                  <span aria-hidden="true">›</span>
                </button>
              </header>
              <div className={styles.noteList}>
                {(showAllNotes
                  ? selectedStudent.notes
                  : selectedStudent.notes.slice(0, 4)
                ).map((note, index) => (
                  <article className={styles.noteRow} key={note.id}>
                    <span
                      className={`${styles.noteIcon} ${styles[noteColors[index % noteColors.length]]}`}
                    >
                      <ProgressIcon name="note" />
                    </span>
                    <span>
                      <strong>{formatDate(note.date)}</strong>
                      <small>
                        {note.domain} · {note.skill}: {note.observation}
                      </small>
                    </span>
                  </article>
                ))}
                {selectedStudent.notes.length === 0 && (
                  <p className={styles.emptyStudents}>
                    No observations recorded this month.
                  </p>
                )}
              </div>
            </section>
          </aside>
        )}
      </div>
      {dialogOpen && (
        <div className={styles.dialogBackdrop}>
          <section
            aria-labelledby="progress-dialog-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <header>
              <h2 id="progress-dialog-title">Add Progress Record</h2>
              <button
                aria-label="Close dialog"
                type="button"
                onClick={() => setDialogOpen(false)}
              >
                ×
              </button>
            </header>
            <form onSubmit={saveProgress}>
              <label>
                Student
                <select
                  required
                  value={formChildId}
                  onChange={(event) => setFormChildId(event.target.value)}
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Learning domain
                <input
                  required
                  maxLength={120}
                  value={formDomain}
                  onChange={(event) => setFormDomain(event.target.value)}
                  list="progress-domains"
                />
                <datalist id="progress-domains">
                  {availableDomains.map((domain) => (
                    <option key={domain} value={domain} />
                  ))}
                </datalist>
              </label>
              <label>
                Skill assessed
                <input
                  required
                  maxLength={180}
                  value={formSkill}
                  onChange={(event) => setFormSkill(event.target.value)}
                />
              </label>
              <label>
                Rating (1–5)
                <select
                  required
                  value={formRating ?? ''}
                  onChange={(event) =>
                    setFormRating(
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                >
                  <option value="">Select rating</option>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Record date
                <input
                  required
                  type="date"
                  value={formDate}
                  onChange={(event) => setFormDate(event.target.value)}
                />
              </label>
              <label>
                Observation
                <textarea
                  maxLength={10000}
                  rows={4}
                  value={formObservation}
                  onChange={(event) => setFormObservation(event.target.value)}
                />
              </label>
              <div className={styles.dialogActions}>
                <button type="button" onClick={() => setDialogOpen(false)}>
                  Cancel
                </button>
                <button
                  disabled={saving || students.length === 0}
                  type="submit"
                >
                  {saving ? 'Saving…' : 'Save Progress'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
