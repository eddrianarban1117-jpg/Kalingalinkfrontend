import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import styles from './LearningDevelopment.module.css';

type Program = {
  id: number;
  title: string;
  domain: string;
  age_group: string;
  status: 'active' | 'inactive';
  center: string;
  progress_count: number;
  learner_count: number;
  last_recorded_at: string | null;
};

type RecentProgress = {
  id: number;
  child: string;
  skill: string;
  domain: string;
  rating: number;
  program: string;
  center: string;
  recorded_at: string;
};

type LearningOverview = {
  data: {
    year: number;
    years: number[];
    stats: {
      total_programs: number;
      active_programs: number;
      progress_records: number;
      learners: number;
    };
    programs: Program[];
    gender: { male: number; female: number; other: number };
    progress_by_month: number[];
    recent_progress: RecentProgress[];
  };
};

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
function relativeTime(value: string) {
  const timestamp = new Date(value.replace(' ', 'T')).getTime();
  if (Number.isNaN(timestamp)) return value;
  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Icon({ name }: { name: string }) {
  const base = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };
  if (name === 'search')
    return (
      <svg {...base}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </svg>
    );
  if (name === 'chevron')
    return (
      <svg {...base}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  if (name === 'filter')
    return (
      <svg {...base}>
        <path d="M4 6h16M7 12h10m-7 6h4" />
      </svg>
    );
  if (name === 'book')
    return (
      <svg {...base}>
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22z" />
        <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v17h6.5a2.5 2.5 0 0 1 2.5 2z" />
      </svg>
    );
  if (name === 'people')
    return (
      <svg {...base}>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M3 20v-1a6 6 0 0 1 12 0v1m2-5a4 4 0 0 1 4 4v1" />
      </svg>
    );
  if (name === 'cap')
    return (
      <svg {...base}>
        <path d="m2 9 10-5 10 5-10 5zM6 11v5c3.8 3 8.2 3 12 0v-5m4-2v6" />
      </svg>
    );
  if (name === 'program')
    return (
      <svg {...base}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6m-6 4h6m-6 4h3m5-1 2 2-2 2" />
      </svg>
    );
  if (name === 'calendar')
    return (
      <svg {...base}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18m-10 4v4m-2-2h4" />
      </svg>
    );
  if (name === 'check')
    return (
      <svg {...base}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  if (name === 'document')
    return (
      <svg {...base}>
        <path d="M5 3h14v18H5zM8 8h8m-8 4h8m-8 4h5" />
      </svg>
    );
  return (
    <svg {...base}>
      <circle cx="12" cy="8" r="3" />
      <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
    </svg>
  );
}

function ProgramOverview({ values }: { values: number[] }) {
  const maxValue = Math.max(0, ...values);
  const scaleMax = Math.max(5, Math.ceil(maxValue / 5) * 5);
  const barWidth = 540 / months.length / 2;
  const groupWidth = 540 / months.length;
  return (
    <div className={styles.programChart}>
      <div aria-hidden="true" className={styles.chartYAxis}>
        {Array.from({ length: 6 }, (_, index) => scaleMax - index * scaleMax / 5).map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>
      <div className={styles.chartPlot}>
        <div aria-hidden="true" className={styles.chartGrid}>
          {Array.from({ length: 6 }, (_, line) => (
            <span key={line} />
          ))}
        </div>
        <svg
          aria-label="Monthly learner progress records"
          className={styles.barChart}
          preserveAspectRatio="none"
          role="img"
          viewBox="0 0 540 120"
        >
          {values.map((value, monthIndex) => {
            const height = (value / scaleMax) * 120;
            const x = monthIndex * groupWidth + (groupWidth - barWidth) / 2;
            return (
              <rect
                className={styles.barchildren}
                height={height}
                key={monthIndex}
                rx="3"
                width={barWidth}
                x={x}
                y={120 - height}
              />
            );
          })}
        </svg>
        <div aria-hidden="true" className={styles.monthLabels}>
          {months.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ParticipantChart({ gender }: { gender: LearningOverview['data']['gender'] }) {
  const total = gender.male + gender.female + gender.other;
  const maleAngle = total ? gender.male / total * 360 : 0;
  const femaleAngle = total ? gender.female / total * 360 : 0;
  return (
    <div className={styles.participantContent}>
      <div
        aria-label={`Learners with progress records by gender; ${total} learners`}
        className={styles.participantDonut}
        style={{
          background: total
            ? `conic-gradient(#3299f5 0deg ${maleAngle}deg, #42cbb2 ${maleAngle}deg ${maleAngle + femaleAngle}deg, #b47af1 ${maleAngle + femaleAngle}deg 360deg)`
            : '#e8eff8',
        }}
        role="img"
      >
        <span>
          <strong>{total.toLocaleString()}</strong>Learners
        </span>
      </div>
      <ul className={styles.participantLegend}>
        {([
          ['Male', gender.male, styles.participantChildren],
          ['Female', gender.female, styles.participantTeachers],
          ['Other / unspecified', gender.other, styles.participantStaff],
        ] as const).map(([label, count, color]) => (
          <li key={label}>
            <i className={color} />
            {label}<strong>{count.toLocaleString()} ({total ? Math.round(count / total * 100) : 0}%)</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgramStatusChart({ active, inactive }: { active: number; inactive: number }) {
  const total = active + inactive;
  const activeAngle = total ? active / total * 360 : 0;
  return (
    <div className={styles.statusContent}>
      <div
        aria-label={`Program status: ${active} active and ${inactive} inactive`}
        className={styles.statusDonut}
        style={{
          background: total
            ? `conic-gradient(#42cbb2 0deg ${activeAngle}deg, #b47af1 ${activeAngle}deg 360deg)`
            : '#e8eff8',
        }}
        role="img"
      >
        <span>
          <strong>{total.toLocaleString()}</strong>Programs
        </span>
      </div>
      <ul className={styles.statusLegend}>
        <li>
          <i className={styles.statusOngoingDot} />
          Active<strong>{active.toLocaleString()} ({total ? Math.round(active / total * 100) : 0}%)</strong>
        </li>
        <li>
          <i className={styles.statusCompletedDot} />
          Inactive<strong>{inactive.toLocaleString()} ({total ? Math.round(inactive / total * 100) : 0}%)</strong>
        </li>
      </ul>
    </div>
  );
}

export function LearningDevelopment() {
  const { request } = useAuth();
  const [query, setQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [programs, setPrograms] = useState<Program[]>([]);
  const [overview, setOverview] = useState<LearningOverview['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);

  const reload = useCallback(async (isActive: () => boolean = () => true) => {
    const requestId = ++latestRequest.current;
    try {
      const result = await request<LearningOverview>(
        `/api/admin/learning-development?year=${year}`,
      );
      if (requestId !== latestRequest.current || !isActive()) return;
      const data = result.data;
      if (
        !data ||
        !Array.isArray(data.programs) ||
        !Array.isArray(data.years) ||
        !Array.isArray(data.progress_by_month) ||
        data.progress_by_month.length !== 12 ||
        !Array.isArray(data.recent_progress) ||
        !data.stats ||
        !data.gender
      ) {
        throw new Error('The server returned invalid learning development records.');
      }
      setOverview(data);
      setPrograms(data.programs);
      setError('');
    } catch (loadError) {
      if (requestId === latestRequest.current && isActive()) {
        setError(loadError instanceof Error
          ? loadError.message
          : 'Learning development records could not be loaded.');
      }
    } finally {
      if (requestId === latestRequest.current && isActive()) setLoading(false);
    }
  }, [request, year]);

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

  const filteredPrograms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return programs.filter((program) =>
      [program.title, program.domain, program.age_group, program.center, program.status]
        .some((value) => (value ?? '').toLowerCase().includes(normalized)) &&
      (!domainFilter || program.domain === domainFilter),
    );
  }, [domainFilter, programs, query]);
  const pageCount = Math.max(1, Math.ceil(filteredPrograms.length / 6));
  const visiblePrograms = filteredPrograms.slice((page - 1) * 6, page * 6);
  const pageNumbers = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => Math.max(1, Math.min(page - 2, pageCount - 4)) + index,
  );
  const stats = overview?.stats;
  const gender = overview?.gender ?? { male: 0, female: 0, other: 0 };
  const progress = overview?.progress_by_month ?? Array(12).fill(0);
  const domains = [...new Set(programs.map((program) => program.domain).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
  const mostActivePrograms = [...programs]
    .filter((program) => program.progress_count > 0)
    .sort((left, right) => right.progress_count - left.progress_count)
    .slice(0, 3);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.titleIcon}><Icon name="book" /></span>
        <div>
          <h1>Learning and Development</h1>
          <p>Monitor learning programs and recorded child progress across development centers.</p>
        </div>
      </header>

      {error && (
        <p className={styles.errorState} role="alert">
          {error}{programs.length > 0 && ' Showing the most recently loaded data.'}
        </p>
      )}

      <section aria-label="Learning and development summary" className={styles.stats}>
        {([
          ['Total Programs', stats?.total_programs, 'people', styles.blue],
          ['Active Programs', stats?.active_programs, 'cap', styles.teal],
          ['Learners with Progress', stats?.learners, 'people', styles.gold],
          ['Progress Records', stats?.progress_records, 'program', styles.pink],
        ] as const).map(([label, value, icon, tone]) => (
          <article className={`${styles.statCard} ${tone}`} key={label}>
            <span className={styles.statIcon}><Icon name={icon} /></span>
            <div>
              <span>{label}</span>
              <strong>{value?.toLocaleString() ?? (loading ? <BouncingDots size="small" inline /> : '—')}</strong>
            </div>
            <span aria-hidden="true" className={styles.statArrow}>›</span>
          </article>
        ))}
      </section>

      <div className={styles.topGrid}>
        <section aria-labelledby="overview-title" className={`${styles.panel} ${styles.overviewPanel}`}>
          <div className={styles.panelHeader}>
            <h2 id="overview-title">Monthly Learner Progress</h2>
            <label className={styles.yearSelect}>
              <Icon name="calendar" />
              <span className={styles.visuallyHidden}>Progress chart year</span>
              <select
                onChange={(event) => setYear(Number(event.target.value))}
                value={year}
              >
                {(overview?.years ?? [year]).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <Icon name="chevron" />
            </label>
          </div>
          <div className={styles.chartLegend}>
            <span><i className={styles.legendChildren} />Progress records</span>
          </div>
          {loading && !overview ? (
            <p className={styles.sideState}><BouncingDots label="Loading progress history" /></p>
          ) : (
            <ProgramOverview values={progress} />
          )}
        </section>
        <section aria-labelledby="participants-title" className={`${styles.panel} ${styles.participantPanel}`}>
          <div className={styles.panelHeader}>
            <h2 id="participants-title">Learners by Gender</h2>
          </div>
          {loading && !overview ? (
            <p className={styles.sideState}><BouncingDots label="Loading learner totals" /></p>
          ) : (
            <ParticipantChart gender={gender} />
          )}
        </section>
      </div>

      <div className={styles.lowerGrid}>
        <section aria-label="Learning and development programs" className={`${styles.panel} ${styles.programsPanel}`}>
          <div className={styles.panelHeader}>
            <h2>Learning Programs</h2>
            <div className={styles.programTools}>
              <label className={styles.search}>
                <Icon name="search" />
                <input
                  aria-label="Search programs"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search programs..."
                  type="search"
                  value={query}
                />
              </label>
              <label className={styles.filterButton}>
                <span className={styles.visuallyHidden}>Filter by domain</span>
                <select
                  aria-label="Filter by domain"
                  onChange={(event) => {
                    setDomainFilter(event.target.value);
                    setPage(1);
                  }}
                  value={domainFilter}
                >
                  <option value="">All domains</option>
                  {domains.map((domain) => <option key={domain}>{domain}</option>)}
                </select>
                <Icon name="filter" />
              </label>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.programTable}>
              <thead>
                <tr>
                  <th scope="col">Program Title</th>
                  <th scope="col">Domain</th>
                  <th scope="col">Age Group</th>
                  <th scope="col">CDC</th>
                  <th scope="col">Learners</th>
                  <th scope="col">Progress Records</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && programs.length === 0 && (
                  <tr><td className={styles.emptyState} colSpan={7}><BouncingDots label="Loading learning programs" /></td></tr>
                )}
                {!loading && error && programs.length === 0 && (
                  <tr><td className={styles.emptyState} colSpan={7} role="alert">{error}</td></tr>
                )}
                {visiblePrograms.map((program) => (
                  <tr key={program.id}>
                    <td data-label="Program Title">
                      <span className={styles.programIcon}><Icon name="program" /></span>
                      <strong>{program.title}</strong>
                    </td>
                    <td data-label="Domain">{program.domain || 'Unspecified'}</td>
                    <td data-label="Age Group">{program.age_group || 'Unspecified'}</td>
                    <td data-label="CDC">{program.center}</td>
                    <td data-label="Learners">{program.learner_count.toLocaleString()}</td>
                    <td data-label="Progress Records">{program.progress_count.toLocaleString()}</td>
                    <td data-label="Status">
                      <span className={`${styles.programStatus} ${program.status === 'active' ? styles.programActive : styles.programInactive}`}>
                        {program.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && (!error || programs.length > 0) && visiblePrograms.length === 0 && (
                  <tr>
                    <td className={styles.emptyState} colSpan={7}>
                      {programs.length ? 'No programs match your search.' : 'No learning programs are stored in the database.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className={styles.tableFooter}>
            <span>
              Showing {filteredPrograms.length ? (page - 1) * 6 + 1 : 0}–
              {Math.min(page * 6, filteredPrograms.length)} of {filteredPrograms.length} programs
              {!error && <small className={styles.refreshHint}> · Refreshes every 15 seconds</small>}
            </span>
            <nav aria-label="Program pages" className={styles.pagination}>
              <button aria-label="Previous page" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">‹</button>
              {pageNumbers.map((pageNumber) => (
                <button
                  aria-current={pageNumber === page ? 'page' : undefined}
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  type="button"
                >
                  {pageNumber}
                </button>
              ))}
              <button aria-label="Next page" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} type="button">›</button>
            </nav>
          </footer>
        </section>

        <aside className={styles.sideColumn}>
          <section aria-labelledby="recent-progress-title" className={`${styles.panel} ${styles.trainingPanel}`}>
            <div className={styles.panelHeader}><h2 id="recent-progress-title">Latest Learner Progress</h2></div>
            <div className={styles.trainings}>
              {loading && !overview ? (
                <p className={styles.sideState}><BouncingDots label="Loading recent progress" /></p>
              ) : overview?.recent_progress.length ? overview.recent_progress.map((record) => (
                <article className={styles.training} key={record.id}>
                  <span className={styles.progressBadge}><Icon name="check" /></span>
                  <span className={styles.trainingText}>
                    <strong>{record.child} · {record.skill}</strong>
                    <span>{record.program} · {record.center}</span>
                    <small>{record.domain} · Rating {record.rating}/5</small>
                  </span>
                  <time className={styles.recentTime} dateTime={record.recorded_at}>{relativeTime(record.recorded_at)}</time>
                </article>
              )) : (
                <p className={styles.sideState}>{error || 'No learner progress records are available.'}</p>
              )}
            </div>
          </section>
          <section aria-labelledby="status-title" className={`${styles.panel} ${styles.statusPanel}`}>
            <div className={styles.panelHeader}><h2 id="status-title">Program Status</h2></div>
            {loading && !overview ? (
              <p className={styles.sideState}><BouncingDots label="Loading program totals" /></p>
            ) : (
              <ProgramStatusChart
                active={programs.filter((program) => program.status === 'active').length}
                inactive={programs.filter((program) => program.status === 'inactive').length}
              />
            )}
          </section>
          <section aria-labelledby="activities-title" className={`${styles.panel} ${styles.activitiesPanel}`}>
            <div className={styles.panelHeader}><h2 id="activities-title">Programs with Most Progress</h2></div>
            <div className={styles.activities}>
              {loading && !overview ? (
                <p className={styles.sideState}><BouncingDots label="Loading program activity" /></p>
              ) : mostActivePrograms.length ? mostActivePrograms.map((program, index) => (
                <article className={styles.activity} key={`program-${program.id}`}>
                  <span className={`${styles.activityIcon} ${styles.activityteal}`}><Icon name="check" /></span>
                  <span className={styles.activityText}>
                    <strong>{program.title}</strong>
                    <span>{program.learner_count.toLocaleString()} learners · {program.center}</span>
                  </span>
                  <time>{program.progress_count.toLocaleString()} records{index === 0 ? ' · Most' : ''}</time>
                </article>
              )) : (
                <p className={styles.sideState}>{error || 'No program progress records are available.'}</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
