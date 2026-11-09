import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import styles from './ChildrenRecords.module.css';

const ageOptions = ['0–2 years', '3–4 years', '5–6 years', '7–12 years', '13+ years'];

type ChildRecord = {
  id: number;
  name: string;
  age: number;
  gender: string;
  center: string;
  status: 'enrolled' | 'pending' | 'withdrawn';
  created_at: string;
};

type ChildrenResponse = {
  data: {
    children: ChildRecord[];
    centers: { id: number; name: string }[];
    stats: {
      total: number;
      male: number;
      female: number;
      other: number;
      pending: number;
      enrolled: number;
    };
    age_groups: { label: string; count: number }[];
    recent_children: ChildRecord[];
  };
};

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

function childNumber(id: number) {
  return `CHD-${String(id).padStart(6, '0')}`;
}

function Icon({ name }: { name: string }) {
  const common = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };
  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </svg>
    );
  }
  if (name === 'filter') {
    return (
      <svg {...common}>
        <path d="M4 6h16M7 12h10m-7 6h4" />
      </svg>
    );
  }
  if (name === 'chevron') {
    return (
      <svg {...common}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  }
  if (name === 'child') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 10h.01M16 10h.01M8.5 15a4.5 4.5 0 0 0 7 0" />
        <path d="M7 5 5 3m12 2 2-2" />
      </svg>
    );
  }
  if (name === 'male') {
    return (
      <svg {...common}>
        <circle cx="10" cy="14" r="5" />
        <path d="m14 10 6-6m-5 0h5v5" />
      </svg>
    );
  }
  if (name === 'female') {
    return (
      <svg {...common}>
        <circle cx="12" cy="9" r="6" />
        <path d="M12 15v7m-3-3h6" />
      </svg>
    );
  }
  if (name === 'special') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M2.5 20v-1a5.5 5.5 0 0 1 11 0v1m2-5a4 4 0 0 1 6 3.5V20" />
      </svg>
    );
  }
  if (name === 'user') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
      </svg>
    );
  }
  if (name === 'family') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M3 20v-1a6 6 0 0 1 12 0v1m1-5a4.5 4.5 0 0 1 5 4.5V20" />
      </svg>
    );
  }
  if (name === 'check') {
    return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  }
  if (name === 'close') {
    return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  }
  if (name === 'clock') {
    return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>;
  }
  if (name === 'building') {
    return <svg {...common}><path d="M4 20h16M6 20V8l6-4 6 4v12M9 10h.01M15 10h.01M9 14h.01M15 14h.01M11 20v-3h2v3" /></svg>;
  }
  if (name === 'drop') {
    return <svg {...common}><path d="M12 3s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Z" /></svg>;
  }
  if (name === 'refresh') {
    return <svg {...common}><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.6-2L20 12M4 12l2.9 5a7 7 0 0 0 11.6-2" /></svg>;
  }
  return (
    <svg {...common}>
      <path d="M5 3h14v18H5zM8 8h8m-8 4h8m-8 4h5" />
    </svg>
  );
}

export function ChildrenRecords() {
  const { request } = useAuth();
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [centerOptions, setCenterOptions] = useState<ChildrenResponse['data']['centers']>([]);
  const [stats, setStats] = useState<ChildrenResponse['data']['stats'] | null>(null);
  const [ageGroups, setAgeGroups] = useState<ChildrenResponse['data']['age_groups']>([]);
  const [recentChildren, setRecentChildren] = useState<ChildRecord[]>([]);
  const [query, setQuery] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);

  const reload = useCallback(async (isActive: () => boolean = () => true) => {
    const requestId = ++latestRequest.current;
    try {
      const response = await request<ChildrenResponse>('/api/admin/children');
      if (requestId !== latestRequest.current || !isActive()) return;
      if (
        !response.data ||
        !Array.isArray(response.data.children) ||
        !Array.isArray(response.data.centers) ||
        !Array.isArray(response.data.age_groups) ||
        !Array.isArray(response.data.recent_children) ||
        !response.data.stats
      ) {
        throw new Error('The server returned invalid children records.');
      }
      setChildren(response.data.children);
      setCenterOptions(response.data.centers);
      setStats(response.data.stats);
      setAgeGroups(response.data.age_groups);
      setRecentChildren(response.data.recent_children);
      setError('');
    } catch (loadError) {
      if (requestId === latestRequest.current && isActive()) {
        setError(loadError instanceof Error ? loadError.message : 'Children could not be loaded.');
      }
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

  const filteredChildren = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return children.filter((child) => {
      const matchesSearch =
        !normalizedQuery ||
        [childNumber(child.id), child.name, child.center].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const matchesCenter = !centerFilter || child.center === centerFilter;
      const matchesAge =
        !ageFilter ||
        (ageFilter === '0–2 years' && child.age <= 2) ||
        (ageFilter === '3–4 years' && child.age >= 3 && child.age <= 4) ||
        (ageFilter === '5–6 years' && child.age >= 5 && child.age <= 6) ||
        (ageFilter === '7–12 years' && child.age >= 7 && child.age <= 12) ||
        (ageFilter === '13+ years' && child.age >= 13);
      const matchesStatus = !statusFilter || child.status === statusFilter;
      return matchesSearch && matchesCenter && matchesAge && matchesStatus;
    });
  }, [ageFilter, centerFilter, children, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredChildren.length / 10));
  const visibleChildren = filteredChildren.slice((page - 1) * 10, page * 10);
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pageNumbers = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => firstPage + index,
  );
  const total = stats?.total ?? 0;
  const percent = (value: number) => total ? Math.round((value / total) * 100) : 0;
  const ageColors = ['#389cf4', '#55d0b7', '#ffc94a', '#bd7df0', '#ef78a5'];
  let ageOffset = 0;
  const ageGradient = ageGroups.map((group, index) => {
    const start = ageOffset;
    ageOffset += total ? (group.count / total) * 360 : 0;
    return `${ageColors[index % ageColors.length]} ${start}deg ${ageOffset}deg`;
  });

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function applyFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.titleIcon}>
          <Icon name="special" />
        </span>
        <div>
          <h1>Children Records</h1>
          <p>
            View registered child records across all Child Development Centers.
          </p>
        </div>
      </header>
      {error && (
        <p className={styles.errorState} role="alert">
          {error}
          {children.length > 0 && ' Showing the most recently loaded data.'}
        </p>
      )}

      <section aria-label="Children overview" className={styles.stats}>
        <article className={`${styles.statCard} ${styles.blue}`}>
          <span className={styles.statIcon}>
            <Icon name="child" />
          </span>
          <div>
            <span>Total Children</span>
            <strong>{stats ? stats.total.toLocaleString() : loading ? '…' : '—'}</strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.teal}`}>
          <span className={styles.statIcon}>
            <Icon name="male" />
          </span>
          <div>
            <span>Male</span>
            <strong>
              {stats ? stats.male.toLocaleString() : loading ? '…' : '—'}{' '}
              {stats && <small>({stats.total ? Math.round(stats.male / stats.total * 100) : 0}%)</small>}
            </strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.pink}`}>
          <span className={styles.statIcon}>
            <Icon name="female" />
          </span>
          <div>
            <span>Female</span>
            <strong>
              {stats ? stats.female.toLocaleString() : loading ? '…' : '—'}{' '}
              {stats && <small>({stats.total ? Math.round(stats.female / stats.total * 100) : 0}%)</small>}
            </strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.purple}`}>
          <span className={styles.statIcon}>
            <Icon name="special" />
          </span>
          <div>
            <span>Pending Enrollment</span>
            <strong>{stats ? stats.pending.toLocaleString() : loading ? '…' : '—'}</strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section
          aria-label="Children list"
          className={`${styles.panel} ${styles.recordsPanel}`}
        >
          <div className={styles.filters}>
            <label className={styles.search}>
              <Icon name="search" />
              <input
                aria-label="Search child name, ID, or CDC"
                onChange={(event) => applyFilter(setQuery, event.target.value)}
                placeholder="Search child name, ID, or CDC..."
                type="search"
                value={query}
              />
            </label>
            <label className={styles.selectFilter}>
              <span aria-hidden="true">▦</span>
              <span className={styles.visuallyHidden}>Filter by center</span>
              <select
                aria-label="Filter by center"
                onChange={(event) =>
                  applyFilter(setCenterFilter, event.target.value)
                }
                value={centerFilter}
              >
                <option value="">All Centers</option>
                {centerOptions.map((center) => (
                  <option key={center.id} value={center.name}>{center.name}</option>
                ))}
              </select>
              <Icon name="chevron" />
            </label>
            <label className={styles.selectFilter}>
              <span aria-hidden="true">☷</span>
              <span className={styles.visuallyHidden}>Filter by age group</span>
              <select
                aria-label="Filter by age group"
                onChange={(event) =>
                  applyFilter(setAgeFilter, event.target.value)
                }
                value={ageFilter}
              >
                <option value="">All Age Groups</option>
                {ageOptions.map((age) => (
                  <option key={age}>{age}</option>
                ))}
              </select>
              <Icon name="chevron" />
            </label>
            <label className={styles.selectFilter}>
              <span aria-hidden="true">◉</span>
              <span className={styles.visuallyHidden}>Filter by status</span>
              <select
                aria-label="Filter by status"
                onChange={(event) =>
                  applyFilter(setStatusFilter, event.target.value)
                }
                value={statusFilter}
              >
                <option value="">All Status</option>
                <option value="enrolled">Enrolled</option>
                <option value="pending">Pending</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
              <Icon name="chevron" />
            </label>
            <button
              aria-label="Clear all filters"
              className={styles.clearFilters}
              onClick={() => {
                setQuery('');
                setCenterFilter('');
                setAgeFilter('');
                setStatusFilter('');
                setPage(1);
              }}
              type="button"
            >
              <Icon name="filter" />
            </button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.childrenTable}>
              <thead>
                <tr>
                  <th scope="col">Child ID</th>
                  <th scope="col">Full Name</th>
                  <th scope="col">Age</th>
                  <th scope="col">Gender</th>
                  <th scope="col">Child Development Center</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                  {loading && children.length === 0 && (
                  <tr><td className={styles.emptyState} colSpan={6}>Loading children records…</td></tr>
                )}
                {!loading && error && children.length === 0 && (
                  <tr><td className={styles.emptyState} colSpan={6} role="alert">{error}</td></tr>
                )}
                {visibleChildren.map((child, index) => (
                  <tr key={child.id}>
                    <td data-label="Child ID">{childNumber(child.id)}</td>
                    <td data-label="Full Name">
                      <span
                        className={`${styles.childAvatar} ${styles[`avatar${index % 5}`]}`}
                      >
                        <Icon name="user" />
                      </span>
                      <strong>{child.name}</strong>
                    </td>
                    <td data-label="Age">{child.age} years</td>
                    <td data-label="Gender">
                      <span
                        className={`${styles.gender} ${child.gender.toLowerCase() === 'male' ? styles.genderMale : child.gender.toLowerCase() === 'female' ? styles.genderFemale : styles.genderOther}`}
                      >
                        {child.gender.toLowerCase() === 'male' ? '♂' : child.gender.toLowerCase() === 'female' ? '♀' : '•'}{' '}
                        <span>{child.gender}</span>
                      </span>
                    </td>
                    <td data-label="Child Development Center">
                      {child.center}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`${styles.status} ${styles[child.status]}`}
                      >
                        {child.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && (!error || children.length > 0) && visibleChildren.length === 0 && (
                  <tr>
                    <td className={styles.emptyState} colSpan={6}>
                      {error || (children.length
                        ? 'No child records match these filters.'
                        : 'No child records are stored in the database.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className={styles.tableFooter}>
            <span>
              Showing {filteredChildren.length ? (page - 1) * 10 + 1 : 0}–
              {Math.min(page * 10, filteredChildren.length)} of{' '}
              {filteredChildren.length} children
            </span>
            {!error && <span className={styles.refreshHint}>Refreshes every 15 seconds</span>}
            <nav aria-label="Child record pages" className={styles.pagination}>
              <button
                aria-label="Previous page"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                ‹
              </button>
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
              <button
                aria-label="Next page"
                disabled={page === pageCount}
                onClick={() =>
                  setPage((current) => Math.min(pageCount, current + 1))
                }
                type="button"
              >
                ›
              </button>
            </nav>
          </footer>
        </section>

        <aside className={styles.sideColumn}>
          <section
            aria-labelledby="age-group-title"
            className={`${styles.panel} ${styles.agePanel}`}
          >
            <div className={styles.panelHeader}>
              <h2 id="age-group-title">Children by Age Group</h2>
            </div>
            <div className={styles.ageContent}>
              <div
                aria-label={`Age distribution for ${total} children`}
                className={styles.ageDonut}
                style={{
                  background: total
                    ? `conic-gradient(${ageGradient.join(', ')})`
                    : '#e8eef9',
                }}
                role="img"
              >
                <span>
                  <strong>{loading ? '…' : total.toLocaleString()}</strong>Total Children
                </span>
              </div>
              <ul className={styles.legend}>
                {ageGroups.map((group, index) => (
                  <li key={group.label}>
                    <i className={styles[`ageTone${index}`]} />
                    {group.label} years
                    <strong>{group.count.toLocaleString()} ({percent(group.count)}%)</strong>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section
            aria-labelledby="gender-distribution-title"
            className={`${styles.panel} ${styles.genderPanel}`}
          >
            <div className={styles.panelHeader}>
              <h2 id="gender-distribution-title">Gender Distribution</h2>
            </div>
            <div className={styles.genderSummary}>
              <article>
                <span className={`${styles.genderIcon} ${styles.blue}`}>
                  <Icon name="child" />
                </span>
                <strong>{stats?.male.toLocaleString() ?? (loading ? '…' : '—')}</strong>
                <span>Male ({stats ? percent(stats.male) : 0}%)</span>
              </article>
              <article>
                <span className={`${styles.genderIcon} ${styles.pink}`}>
                  <Icon name="female" />
                </span>
                <strong>{stats?.female.toLocaleString() ?? (loading ? '…' : '—')}</strong>
                <span>Female ({stats ? percent(stats.female) : 0}%)</span>
              </article>
              <article>
                <span className={`${styles.genderIcon} ${styles.purple}`}>
                  <Icon name="user" />
                </span>
                <strong>{stats?.other.toLocaleString() ?? (loading ? '…' : '—')}</strong>
                <span>Other / unspecified ({stats ? percent(stats.other) : 0}%)</span>
              </article>
            </div>
          </section>
          <section
            aria-labelledby="recent-children-title"
            className={`${styles.panel} ${styles.recentPanel}`}
          >
            <div className={styles.panelHeader}>
              <h2 id="recent-children-title">Recent Children Added</h2>
              <span className={styles.viewAll}>Latest records</span>
            </div>
            <div className={styles.recentList}>
              {loading && recentChildren.length === 0 ? (
                <p className={styles.sideState}>Loading recent children…</p>
              ) : recentChildren.length ? recentChildren.map((child, index) => (
                <article className={styles.recentChild} key={child.id}>
                  <span
                    className={`${styles.recentAvatar} ${styles[`recent${['blue', 'gold', 'teal', 'pink'][index % 4]}`]}`}
                  >
                    <Icon name="user" />
                  </span>
                  <span className={styles.recentText}>
                    <strong>{child.name}</strong>
                    <span>
                      {childNumber(child.id)} • {child.center}
                    </span>
                  </span>
                  <time dateTime={child.created_at}>{relativeTime(child.created_at)}</time>
                </article>
              )) : (
                <p className={styles.sideState}>
                  {error || 'No child records are stored in the database.'}
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>

    </section>
  );
}
