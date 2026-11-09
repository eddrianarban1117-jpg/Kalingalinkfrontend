import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import { useAuth } from '../../auth/AuthProvider';
import childrenBanner from '../../assets/images/children-banner.png';
import styles from './ParentProgress.module.css';

type ProgressRecord = {
  id: number;
  date: string;
  domain: string;
  skill: string;
  rating: number;
  observation: string;
};

type ChildProgress = {
  id: number;
  name: string;
  age: number;
  gender: string;
  class_name: string;
  overall: number | null;
  domains: Array<{
    name: string;
    score: number;
    status: string;
    record_count: number;
  }>;
  records: ProgressRecord[];
};

type ApiProgressStudent = {
  id: number;
  name: string;
  age: number;
  birth_date: string;
  gender: string;
  class_name: string;
  overall: number | null;
  domains: ChildProgress['domains'];
  records: ProgressRecord[];
};

type ParentProgressResponse = {
  status?: boolean;
  message?: string;
  data?: {
    school_year: string;
    school_years: string[];
    students: ApiProgressStudent[];
  };
};

function currentSchoolYear() {
  const now = new Date();
  const year = now.getFullYear();
  const start = now.getMonth() >= 5 ? year : year - 1;
  return `${start}-${start + 1}`;
}

function formatDate(value: string) {
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function performanceLabel(score: number) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'On Track';
  if (score >= 60) return 'Needs Support';
  return 'Needs Attention';
}

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
    case 'book':
      return (
        <svg {...shared}>
          <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22zm18 0A2.5 2.5 0 0 0 18.5 3H12v17h6.5A2.5 2.5 0 0 1 21 22z" />
        </svg>
      );
    case 'math':
      return (
        <svg {...shared}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2" />
        </svg>
      );
    case 'physical':
      return (
        <svg {...shared}>
          <circle cx="12" cy="5" r="2" />
          <path d="m10 8-3 4 3 2 1 7m3-13 3 4-3 2-1 7m-7-9-2 5m13-5 2 5m-9-4h4" />
        </svg>
      );
    case 'people':
      return (
        <svg {...shared}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 20v-1a6 6 0 0 1 12 0v1zm13-5a5 5 0 0 1 5 5" />
        </svg>
      );
    case 'art':
      return (
        <svg {...shared}>
          <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.7-3.1 1.8 1.8 0 0 1 1.5-2.8H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z" />
          <path d="M7.5 10h.01M10 7h.01m5 0h.01m2.5 4h.01" />
        </svg>
      );
    case 'bulb':
      return (
        <svg {...shared}>
          <path d="M9 18h6m-5 4h4m-2-20a7 7 0 0 0-4 12.75c.7.5 1 1.25 1 2.25h6c0-1 .3-1.75 1-2.25A7 7 0 0 0 12 2Z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...shared}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case 'star':
      return (
        <svg {...shared}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...shared}>
          <path d="M4 20v-7h4v7zm6 0V4h4v16zm6 0v-10h4v10z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18" />
        </svg>
      );
    case 'download':
      return (
        <svg {...shared}>
          <path d="M12 3v12m-5-5 5 5 5-5M4 19v2h16v-2" />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
  }
}

export function ParentProgress({ search }: { search: string }) {
  const { request } = useAuth();
  const [students, setStudents] = useState<ChildProgress[]>([]);
  const [schoolYears, setSchoolYears] = useState<string[]>([]);
  const [schoolYear, setSchoolYear] = useState(currentSchoolYear);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [showAllReports, setShowAllReports] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadProgress = useCallback(
    async (active: () => boolean = () => true) => {
      try {
        const response = await request<ParentProgressResponse>(
          `/api/parent/progress?school_year=${encodeURIComponent(schoolYear)}`,
        );
        if (!active()) return;
        if (
          !response.status ||
          !response.data ||
          !Array.isArray(response.data.students)
        ) {
          throw new Error(
            response.message ?? 'The server returned invalid progress data.',
          );
        }
        const data = response.data;
        setStudents(data.students);
        setSchoolYears(data.school_years ?? [data.school_year]);
        setSelectedChildId((current) =>
          data.students.some(({ id }) => id === current)
            ? current
            : (data.students[0]?.id ?? null),
        );
        setLoadError('');
      } catch (error) {
        if (active()) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Progress could not be loaded.',
          );
        }
      } finally {
        if (active()) setLoading(false);
      }
    },
    [request, schoolYear],
  );

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active && document.visibilityState === 'visible')
        void loadProgress(() => active);
    };
    void loadProgress(() => active);
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadProgress]);

  const filteredChildren = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter(({ name }) => name.toLowerCase().includes(term));
  }, [search, students]);
  const child =
    filteredChildren.find(({ id }) => id === selectedChildId) ??
    filteredChildren[0];

  if (!child) {
    return (
      <main aria-label="Children Progress" className={styles.page}>
        <section
          aria-label="Children Progress"
          className={styles.hero}
          style={{ backgroundImage: `url("${childrenBanner}")` }}
        >
          <span className={styles.heroIcon}>
            <Icon name="chart" />
          </span>
          <div>
            <h1>Children Progress</h1>
            <p>View progress recorded by your child&apos;s teacher.</p>
          </div>
        </section>
        {loadError ? (
          <p className={styles.errorState} role="alert">
            {loadError}
          </p>
        ) : loading ? (
          <p className={styles.emptyState} aria-live="polite">
            Loading child progress…
          </p>
        ) : (
          <p className={styles.emptyState}>
            {students.length
              ? 'No child progress matches your search.'
              : 'No child profiles are linked to your account yet.'}
          </p>
        )}
      </main>
    );
  }

  const onTrack = child.domains.filter(({ score }) => score >= 75).length;
  const needsAttention = child.domains.filter(({ score }) => score < 75).length;
  const reportRows = showAllReports ? child.records : child.records.slice(0, 5);
  const overall = child.overall;

  return (
    <main aria-label="Children Progress" className={styles.page}>
      <section
        aria-label="Children Progress"
        className={styles.hero}
        style={{ backgroundImage: `url("${childrenBanner}")` }}
      >
        <span className={styles.heroIcon}>
          <Icon name="chart" />
        </span>
        <div>
          <h1>Children Progress</h1>
          <p>
            Track your child&apos;s teacher-recorded learning and development
            progress across observed domains
            <br className={styles.desktopBreak} /> at the Child Development
            Center.
          </p>
        </div>
      </section>
      {loadError && (
        <p className={styles.errorState} role="alert">
          {loadError}
        </p>
      )}

      <section aria-label="Child progress overview" className={styles.overview}>
        <article className={styles.childCard}>
          <img alt="" src={childrenBanner} />
          <div>
            <strong>{child.name}</strong>
            <span>
              Age: {child.age} years <i /> {child.gender}
            </span>
            <small>
              {child.class_name
                ? `CDC Class: ${child.class_name}`
                : 'No class assigned'}
            </small>
          </div>
          <label className={styles.visuallyHidden} htmlFor="progress-child">
            Select child
          </label>
          <select
            id="progress-child"
            value={child.id}
            onChange={(event) => setSelectedChildId(Number(event.target.value))}
          >
            {filteredChildren.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </article>
        <article className={`${styles.metricCard} ${styles.blueMetric}`}>
          <span className={styles.metricIcon}>
            <Icon name="book" />
          </span>
          <div>
            <span>Total Domains</span>
            <strong>{child.domains.length}</strong>
          </div>
        </article>
        <article className={`${styles.metricCard} ${styles.greenMetric}`}>
          <span className={styles.metricIcon}>
            <Icon name="chart" />
          </span>
          <div>
            <span>On Track</span>
            <strong>{onTrack}</strong>
          </div>
        </article>
        <article className={`${styles.metricCard} ${styles.orangeMetric}`}>
          <span className={styles.metricIcon}>
            <Icon name="chart" />
          </span>
          <div>
            <span>Needs Attention</span>
            <strong>{needsAttention}</strong>
          </div>
        </article>
        <article className={`${styles.metricCard} ${styles.purpleMetric}`}>
          <span className={styles.metricIcon}>
            <Icon name="star" />
          </span>
          <div>
            <span>Overall Progress</span>
            <strong>{overall === null ? '—' : `${overall}%`}</strong>
          </div>
          <span
            aria-label={
              overall === null
                ? 'No progress recorded'
                : `${overall}% overall progress`
            }
            className={styles.progressRing}
            role="img"
            style={{ '--progress': `${overall ?? 0}%` } as CSSProperties}
          />
        </article>
      </section>

      <div className={styles.contentGrid}>
        <div className={styles.primaryColumn}>
          <section aria-labelledby="subject-heading" className={styles.panel}>
            <header className={styles.panelHeading}>
              <h2 id="subject-heading">
                <Icon name="book" /> Progress by Domain
              </h2>
              <label className={styles.yearSelect}>
                <Icon name="calendar" />
                <span className={styles.visuallyHidden}>School year</span>
                <select
                  value={schoolYear}
                  onChange={(event) => setSchoolYear(event.target.value)}
                >
                  {schoolYears.map((year) => (
                    <option key={year} value={year}>
                      {year.replace('-', ' – ')}
                    </option>
                  ))}
                </select>
              </label>
            </header>
            <div className={styles.subjectGrid}>
              {child.domains.map((domain) => {
                const attention = domain.score < 75;
                return (
                  <article
                    className={`${styles.subjectCard} ${attention ? styles.subjectAttention : ''}`}
                    key={domain.name}
                  >
                    <span
                      className={`${styles.subjectIcon} ${attention ? styles.attentionIcon : ''}`}
                    >
                      <Icon name="book" />
                    </span>
                    <div className={styles.subjectInfo}>
                      <strong>{domain.name}</strong>
                      <b>{domain.score}%</b>
                      <span className={styles.track}>
                        <span
                          className={attention ? styles.attentionBar : ''}
                          style={{ width: `${domain.score}%` }}
                        />
                      </span>
                      <small className={attention ? styles.attentionText : ''}>
                        <Icon name={attention ? 'chart' : 'check'} />
                        {domain.status} · {domain.record_count}{' '}
                        {domain.record_count === 1 ? 'record' : 'records'}
                      </small>
                    </div>
                  </article>
                );
              })}
              {!child.domains.length && (
                <p className={styles.emptyState}>
                  No progress has been recorded for this child during this
                  school year.
                </p>
              )}
            </div>
          </section>

          <section aria-labelledby="report-heading" className={styles.panel}>
            <header className={styles.panelHeading}>
              <h2 id="report-heading">
                <Icon name="calendar" /> Detailed Progress Report
              </h2>
              <button
                className={styles.outlineButton}
                type="button"
                onClick={() => setShowAllReports((current) => !current)}
              >
                <Icon name="chart" />
                {showAllReports ? 'Show Recent Reports' : 'View All Reports'}
              </button>
            </header>
            <div className={styles.reportScroll}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Domain</th>
                    <th>Skill / Activity</th>
                    <th>Performance</th>
                    <th>Teacher&apos;s Note</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((report) => (
                    <tr key={report.id}>
                      <td>{formatDate(report.date)}</td>
                      <td>{report.domain}</td>
                      <td>{report.skill}</td>
                      <td>
                        <span>
                          {report.rating}/5 ({report.rating * 20}%)
                        </span>
                        <b
                          className={
                            report.rating * 20 < 75
                              ? styles.reportAttention
                              : styles.reportGood
                          }
                        >
                          {performanceLabel(report.rating * 20)}
                        </b>
                      </td>
                      <td>{report.observation || 'No note provided'}</td>
                    </tr>
                  ))}
                  {!reportRows.length && (
                    <tr>
                      <td colSpan={5} className={styles.emptyState}>
                        No progress records for this child and school year.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className={styles.reportNote}>
              Showing teacher-recorded progress for school year{' '}
              {schoolYear.replace('-', ' – ')}.
            </p>
          </section>
        </div>

        <aside className={styles.rightRail}>
          <section aria-labelledby="summary-heading" className={styles.panel}>
            <header className={styles.panelHeading}>
              <h2 id="summary-heading">Progress Summary</h2>
            </header>
            <div className={styles.summaryContent}>
              <span
                aria-label={
                  overall === null
                    ? 'No progress recorded'
                    : `${overall}% overall progress`
                }
                className={styles.summaryRing}
                role="img"
                style={{ '--progress': `${overall ?? 0}%` } as CSSProperties}
              >
                <strong>{overall === null ? '—' : `${overall}%`}</strong>
              </span>
              <ul>
                <li className={styles.summaryTrack}>
                  <i /> On Track <b>{onTrack}</b>
                </li>
                <li className={styles.summaryAttention}>
                  <i /> Needs Support / Attention <b>{needsAttention}</b>
                </li>
                <li className={styles.summaryNotStarted}>
                  <i /> Domains Recorded <b>{child.domains.length}</b>
                </li>
              </ul>
            </div>
          </section>

          <section aria-labelledby="milestone-heading" className={styles.panel}>
            <header className={styles.panelHeading}>
              <h2 id="milestone-heading">
                <Icon name="star" /> Skills Recorded
              </h2>
            </header>
            <ul className={styles.milestones}>
              {[...new Set(child.records.map(({ skill }) => skill))].map(
                (skill) => (
                  <li key={skill}>
                    <span>
                      <Icon name="check" />
                    </span>
                    {skill}
                  </li>
                ),
              )}
              {!child.records.length && (
                <li className={styles.noMilestones}>
                  No skills have been recorded for this school year.
                </li>
              )}
            </ul>
          </section>

          <aside
            aria-label="Progress encouragement"
            className={styles.encouragement}
          >
            <span>
              <Icon name="bulb" />
            </span>
            <div>
              <strong>
                {overall === null
                  ? 'Progress Updates'
                  : overall >= 75
                    ? 'On Track'
                    : 'Keep Practicing'}
              </strong>
              <p>
                {overall === null
                  ? 'Teacher progress records will appear here when they are available.'
                  : 'This summary reflects progress recorded by your child’s teacher for the selected school year.'}
              </p>
            </div>
            <span aria-hidden="true" className={styles.plant}>
              ✿
            </span>
          </aside>
        </aside>
      </div>
    </main>
  );
}
