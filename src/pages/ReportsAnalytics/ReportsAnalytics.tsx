import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import styles from './ReportsAnalytics.module.css';

type ReportData = {
  data: {
    stats: {
      total_children: number;
      total_teachers: number;
      total_centers: number;
      total_enrollments: number;
    };
    trend: { month: string; applications: number; approvals: number }[];
    centers: { id: number; name: string; status: 'active' | 'inactive'; enrolled: number }[];
    age_groups: { label: string; count: number }[];
    gender: { male: number; female: number; other: number };
    center_status: { active: number; inactive: number };
    generated_at: string;
    generated_by: string;
  };
};

type ExportReport = {
  name: string;
  type: string;
  rows: (string | number)[][];
};

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
  if (name === 'calendar')
    return (
      <svg {...base}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </svg>
    );
  if (name === 'chevron')
    return (
      <svg {...base}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  if (name === 'chart')
    return (
      <svg {...base}>
        <path d="M4 20V11h4v9zm6 0V4h4v16zm6 0v-7h4v7z" />
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
  if (name === 'teacher')
    return (
      <svg {...base}>
        <circle cx="12" cy="7" r="3" />
        <path d="M5 20v-1a7 7 0 0 1 14 0v1" />
      </svg>
    );
  if (name === 'center')
    return (
      <svg {...base}>
        <path d="M3 20h18M5 20V8l7-4 7 4v12M9 10h1m4 0h1m-6 4h1m4 0h1m-3 6v-4" />
      </svg>
    );
  if (name === 'document')
    return (
      <svg {...base}>
        <path d="M5 3h14v18H5zM8 8h8m-8 4h8m-8 4h5" />
      </svg>
    );
  if (name === 'arrow')
    return (
      <svg {...base}>
        <path d="M4 16 10 10l4 4 6-7m-6 0h6v6" />
      </svg>
    );
  if (name === 'book')
    return (
      <svg {...base}>
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22zM21 5.5A2.5 2.5 0 0 0 18.5 3H12v17h6.5a2.5 2.5 0 0 1 2.5 2z" />
      </svg>
    );
  if (name === 'alert')
    return (
      <svg {...base}>
        <path d="M12 3 2.8 20h18.4zM12 9v5m0 3h.01" />
      </svg>
    );
  return (
    <svg {...base}>
      <path d="M12 3v18m-9-9h18" />
    </svg>
  );
}

function TrendChart({ trend }: { trend: ReportData['data']['trend'] }) {
  const width = 600;
  const height = 118;
  const maxValue = Math.max(0, ...trend.flatMap((item) => [item.applications, item.approvals]));
  const scaleMax = Math.max(5, Math.ceil(maxValue / 5) * 5);
  const x = (index: number) => (index / Math.max(trend.length - 1, 1)) * width;
  const y = (value: number) => height - (value / scaleMax) * height;
  const points = (series: number[]) =>
    series.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  return (
    <div className={styles.trendChart}>
      <div aria-hidden="true" className={styles.yAxis}>
        {Array.from({ length: 6 }, (_, index) => scaleMax - index * scaleMax / 5).map((value) => (
          <span key={value}>{value.toLocaleString()}</span>
        ))}
      </div>
      <div className={styles.chartPlot}>
        <div aria-hidden="true" className={styles.gridLines}>
          {[0, 1, 2, 3, 4, 5].map((line) => (
            <span key={line} />
          ))}
        </div>
        <svg
          aria-label="Enrollment applications and approvals over the last 12 months"
          className={styles.lineChart}
          preserveAspectRatio="none"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <polyline
            fill="none"
            points={points(trend.map((item) => item.applications))}
            stroke="#218df0"
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            fill="none"
            points={points(trend.map((item) => item.approvals))}
            stroke="#2bbfae"
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
          />
          {trend.map((item, index) => (
            <circle
              cx={x(index)}
              cy={y(item.applications)}
              fill="#218df0"
              key={`total-${index}`}
              r="3"
            />
          ))}
          {trend.map((item, index) => (
            <circle
              cx={x(index)}
              cy={y(item.approvals)}
              fill="#2bbfae"
              key={`new-${index}`}
              r="3"
            />
          ))}
        </svg>
        <div aria-hidden="true" className={styles.monthLabels}>
          {trend.map((item, index) => (
            <span key={`${item.month}-${index}`}>{item.month}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function exportReport(report: ExportReport) {
  const content = [['Report', report.name], ['Type', report.type], [], ...report.rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','),
    )
    .join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReportsAnalytics() {
  const { request } = useAuth();
  const [range, setRange] = useState(12);
  const [reportType, setReportType] = useState('');
  const [data, setData] = useState<ReportData['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);

  const reload = useCallback(async (isActive: () => boolean = () => true) => {
    const requestId = ++latestRequest.current;
    try {
      const result = await request<ReportData>('/api/admin/reports');
      if (requestId !== latestRequest.current || !isActive()) return;
      const response = result.data;
      if (
        !response?.stats ||
        !Array.isArray(response.trend) ||
        !Array.isArray(response.centers) ||
        !Array.isArray(response.age_groups) ||
        !response.gender ||
        !response.center_status
      ) {
        throw new Error('The server returned invalid analytics data.');
      }
      setData(response);
      setError('');
    } catch (loadError) {
      if (requestId === latestRequest.current && isActive()) {
        setError(loadError instanceof Error
          ? loadError.message
          : 'Reports and analytics could not be loaded.');
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

  const exports = useMemo<ExportReport[]>(() => {
    if (!data) return [];
    const genderRows = [
      ['Gender', 'Enrolled Children'],
      ['Male', data.gender.male],
      ['Female', data.gender.female],
      ['Other / unspecified', data.gender.other],
    ];
    return [
      {
        name: 'Enrollment Trend',
        type: 'Enrollment',
        rows: [
          ['Month', 'Applications', 'Approvals'],
          ...data.trend.map((item) => [item.month, item.applications, item.approvals]),
        ],
      },
      {
        name: 'Enrollment by CDC',
        type: 'CDC Performance',
        rows: [
          ['Center', 'Enrolled Children', 'Status'],
          ...data.centers.map((center) => [center.name, center.enrolled, center.status]),
        ],
      },
      {
        name: 'Children by Age Group',
        type: 'Age Distribution',
        rows: [['Age Group', 'Enrolled Children'], ...data.age_groups.map((item) => [item.label, item.count])],
      },
      {
        name: 'Gender Distribution',
        type: 'Demographics',
        rows: genderRows,
      },
      {
        name: 'Center Status',
        type: 'CDC Performance',
        rows: [
          ['Status', 'Centers'],
          ['Active', data.center_status.active],
          ['Inactive', data.center_status.inactive],
        ],
      },
    ];
  }, [data]);

  const filteredExports = reportType
    ? exports.filter((item) => item.type === reportType)
    : exports;
  const trend = data?.trend.slice(-range) ?? [];
  const ageTotal = data?.age_groups.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const genderTotal = data
    ? data.gender.male + data.gender.female + data.gender.other
    : 0;
  const centerStatusTotal = data
    ? data.center_status.active + data.center_status.inactive
    : 0;
  const centerMax = Math.max(1, ...(data?.centers.map((center) => center.enrolled) ?? [0]));
  const distributionColors = ['#218df0', '#2bbfae', '#ffc247', '#ae76ee', '#fa70a0'];
  const createGradient = (values: number[]) => {
    const sum = values.reduce((total, value) => total + value, 0);
    if (!sum) return '#e8eff8';
    let cursor = 0;
    return `conic-gradient(${values.map((value, index) => {
      const start = cursor;
      cursor += value / sum * 360;
      return `${distributionColors[index % distributionColors.length]} ${start}deg ${cursor}deg`;
    }).join(', ')})`;
  };
  const insights = data ? [
    {
      title: 'Enrolled children',
      detail: `${data.stats.total_enrollments.toLocaleString()} currently enrolled`,
      tone: 'teal',
      icon: 'arrow',
    },
    {
      title: 'Highest enrollment',
      detail: data.centers[0]
        ? `${data.centers[0].name} (${data.centers[0].enrolled.toLocaleString()} children)`
        : 'No center records',
      tone: 'purple',
      icon: 'people',
    },
    {
      title: 'Largest age group',
      detail: [...data.age_groups].sort((left, right) => right.count - left.count)[0]?.label
        ?? 'No enrollment data',
      tone: 'gold',
      icon: 'book',
    },
    {
      title: 'Inactive centers',
      detail: `${data.center_status.inactive.toLocaleString()} centers marked inactive`,
      tone: 'pink',
      icon: 'alert',
    },
  ] : [];

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.titleIcon}>
          <Icon name="chart" />
        </span>
        <div>
          <h1>Reports and Analytics</h1>
          <p>
            View comprehensive reports and analytics to support data-driven
            decisions for child development services.
          </p>
        </div>
      </header>

      {error && (
        <p className={styles.errorState} role="alert">
          {error}{data && ' Showing the most recently loaded data.'}
        </p>
      )}

      <section aria-label="Reports summary" className={styles.stats}>
        {([
          ['Total Children', data?.stats.total_children, 'people', styles.blue],
          ['Active Teachers', data?.stats.total_teachers, 'teacher', styles.teal],
          ['Total CDCs', data?.stats.total_centers, 'center', styles.gold],
          ['Enrolled Children', data?.stats.total_enrollments, 'document', styles.pink],
        ] as const).map(([label, value, icon, tone]) => (
          <article className={`${styles.statCard} ${tone}`} key={label}>
            <span className={styles.statIcon}><Icon name={icon} /></span>
            <div>
              <span>{label}</span>
              <strong>{value?.toLocaleString() ?? (loading ? '…' : '—')}</strong>
              <small>{loading ? 'Loading database totals…' : 'Current database records'}</small>
            </div>
            <span aria-hidden="true" className={styles.statArrow}>›</span>
          </article>
        ))}
      </section>

      <div className={styles.trendsGrid}>
        <section
          aria-labelledby="enrollment-trend-title"
          className={`${styles.panel} ${styles.trendPanel}`}
        >
          <div className={styles.panelHeader}>
            <h2 id="enrollment-trend-title">Enrollment Trend</h2>
            <label className={styles.rangeSelect}>
              <Icon name="calendar" />
              <span className={styles.visuallyHidden}>
                Enrollment chart range
              </span>
              <select
                onChange={(event) => setRange(Number(event.target.value))}
                value={range}
              >
                <option value={12}>Last 12 Months</option>
                <option value={6}>Last 6 Months</option>
              </select>
              <Icon name="chevron" />
            </label>
          </div>
          <div className={styles.legend}>
            <span>
              <i className={styles.totalDot} />
              Applications
            </span>
            <span>
              <i className={styles.newDot} />
              Approvals
            </span>
          </div>
          {loading && !data ? <p className={styles.chartState}>Loading enrollment history…</p> : <TrendChart trend={trend} />}
        </section>
        <section
          aria-labelledby="cdc-enrollment-title"
          className={`${styles.panel} ${styles.cdcPanel}`}
        >
          <div className={styles.panelHeader}>
            <h2 id="cdc-enrollment-title">Enrollment by CDC</h2>
          </div>
          {loading && !data ? <p className={styles.chartState}>Loading center totals…</p> : !data?.centers.length ? <p className={styles.chartState}>No center enrollment data is available.</p> : <div
            aria-label="Enrollment by child development center"
            className={styles.centerChart}
            role="img"
          >
            <div aria-hidden="true" className={styles.centerYAxis}>
              {Array.from({ length: 5 }, (_, index) => Math.ceil(centerMax / 4) * (4 - index)).map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <div className={styles.centerPlot}>
              <div aria-hidden="true" className={styles.centerGrid}>
                {[0, 1, 2, 3, 4].map((line) => (
                  <span key={line} />
                ))}
              </div>{' '}
              <div
                className={styles.centerBars}
                style={{ gridTemplateColumns: `repeat(${Math.max(data?.centers.length ?? 0, 1)}, minmax(0, 1fr))` }}
              >
                {(data?.centers ?? []).map((center) => {
                  const barHeight = (center.enrolled / centerMax) * 100;
                  return (
                    <div className={styles.centerBar} key={center.id} title={`${center.name}: ${center.enrolled}`}>
                      <strong
                        style={{ bottom: `calc(1.05rem + ${barHeight}%)` }}
                      >
                        {center.enrolled}
                      </strong>
                      <span style={{ height: `${barHeight}%` }} />
                      <small>{center.name}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>}
        </section>
      </div>

      <div className={styles.distributionGrid}>
        <section
          aria-labelledby="age-group-title"
          className={`${styles.panel} ${styles.distributionPanel}`}
        >
          <div className={styles.panelHeader}>
            <h2 id="age-group-title">Children by Age Group</h2>
          </div>
          {loading && !data ? <p className={styles.chartState}>Loading age groups…</p> : <div className={styles.donutContent}>
            <div
              aria-label={`Enrolled children by age group; ${ageTotal} children`}
              className={styles.ageDonut}
              style={{ background: createGradient(data?.age_groups.map((item) => item.count) ?? []) }}
              role="img"
            >
              <span>
                <strong>{ageTotal.toLocaleString()}</strong>Enrolled
              </span>
            </div>
            <ul className={styles.chartLegendList}>
              {(data?.age_groups ?? []).map((item, index) => (
                <li key={item.label}>
                  <i style={{ background: distributionColors[index % distributionColors.length] }} />
                  {item.label}<strong>{item.count.toLocaleString()} ({ageTotal ? Math.round(item.count / ageTotal * 100) : 0}%)</strong>
                </li>
              ))}
            </ul>
          </div>}
        </section>
        <section
          aria-labelledby="gender-title"
          className={`${styles.panel} ${styles.distributionPanel}`}
        >
          <div className={styles.panelHeader}>
            <h2 id="gender-title">Gender Distribution</h2>
          </div>
          {loading && !data ? <p className={styles.chartState}>Loading gender totals…</p> : <div className={styles.donutContent}>
            <div
              aria-label={`Enrolled children by gender; ${genderTotal} children`}
              className={styles.genderDonut}
              style={{ background: createGradient(data ? [data.gender.male, data.gender.female, data.gender.other] : []) }}
              role="img"
            >
              <span>
                <strong>{genderTotal.toLocaleString()}</strong>Enrolled
              </span>
            </div>
            <ul className={styles.chartLegendList}>
              {([
                ['Male', data?.gender.male ?? 0],
                ['Female', data?.gender.female ?? 0],
                ['Other / unspecified', data?.gender.other ?? 0],
              ] as const).map(([label, count], index) => (
                <li key={label}>
                  <i style={{ background: distributionColors[index] }} />
                  {label}<strong>{count.toLocaleString()} ({genderTotal ? Math.round(count / genderTotal * 100) : 0}%)</strong>
                </li>
              ))}
            </ul>
          </div>}
        </section>
        <section
          aria-labelledby="center-status-title"
          className={`${styles.panel} ${styles.distributionPanel}`}
        >
          <div className={styles.panelHeader}>
            <h2 id="center-status-title">Center Status</h2>
          </div>
          {loading && !data ? <p className={styles.chartState}>Loading center status…</p> : <div className={styles.donutContent}>
            <div
              aria-label={`Center status: ${data?.center_status.active ?? 0} active and ${data?.center_status.inactive ?? 0} inactive`}
              className={styles.centerStatusDonut}
              style={{ background: createGradient([data?.center_status.active ?? 0, data?.center_status.inactive ?? 0]) }}
              role="img"
            >
              <span>
                <strong>{centerStatusTotal.toLocaleString()}</strong>Total CDCs
              </span>
            </div>
            <ul className={styles.chartLegendList}>
              {([
                ['Active', data?.center_status.active ?? 0],
                ['Inactive', data?.center_status.inactive ?? 0],
              ] as const).map(([label, count], index) => (
                <li key={label}>
                  <i style={{ background: distributionColors[index + 1] }} />
                  {label}<strong>{count.toLocaleString()} ({centerStatusTotal ? Math.round(count / centerStatusTotal * 100) : 0}%)</strong>
                </li>
              ))}
            </ul>
          </div>}
        </section>
      </div>

      <div className={styles.bottomGrid}>
        <section
          aria-labelledby="recent-reports-title"
          className={`${styles.panel} ${styles.reportsPanel}`}
        >
          <div className={styles.panelHeader}>
            <h2 id="recent-reports-title">Live Data Exports</h2>
            <label className={styles.reportFilter}>
              <span className={styles.visuallyHidden}>
                Filter exports by type
              </span>
              <select
                aria-label="Filter exports by type"
                onChange={(event) => setReportType(event.target.value)}
                value={reportType}
              >
                <option value="">All Types</option>
                {[...new Set(exports.map((report) => report.type))].map(
                  (type) => (
                    <option key={type}>{type}</option>
                  ),
                )}
              </select>
              <Icon name="chevron" />
            </label>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th scope="col">Export Name</th>
                  <th scope="col">Type</th>
                  <th scope="col">Data Refreshed</th>
                  <th scope="col">Snapshot By</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && exports.length === 0 && (
                  <tr><td className={styles.emptyState} colSpan={5}>Loading report data…</td></tr>
                )}
                {filteredExports.map((report) => (
                  <tr key={report.name}>
                    <td data-label="Export Name">
                      <span className={styles.reportIcon}>
                        <Icon name="document" />
                      </span>
                      <strong>{report.name}</strong>
                    </td>
                    <td data-label="Type">{report.type}</td>
                    <td data-label="Data Refreshed">
                      {data ? new Date(data.generated_at).toLocaleString() : '—'}
                    </td>
                    <td data-label="Snapshot By">{data?.generated_by || '—'}</td>
                    <td data-label="Actions">
                      <button
                        aria-label={`Download ${report.name} as CSV`}
                        className={styles.downloadButton}
                        onClick={() => exportReport(report)}
                        type="button"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                          <path d="M12 3v12m-5-5 5 5 5-5M4 19v2h16v-2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredExports.length === 0 && (
                  <tr>
                    <td className={styles.emptyState} colSpan={5} role={error ? 'alert' : undefined}>
                      {error || 'No live export data is available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className={styles.refreshNote}>
            {data
              ? `Live database snapshot · Updated ${new Date(data.generated_at).toLocaleString()} · Refreshes every 15 seconds`
              : 'CSV downloads contain the live database aggregates shown on this page.'}
          </p>
        </section>
        <section
          aria-labelledby="insights-title"
          className={`${styles.panel} ${styles.insightsPanel}`}
        >
          <div className={styles.panelHeader}>
            <h2 id="insights-title">Quick Insights</h2>
          </div>
          {loading && !data ? (
            <p className={styles.chartState}>Loading insights…</p>
          ) : insights.length ? (
            <div className={styles.insights}>
              {insights.map((item) => (
              <article className={styles.insight} key={item.title}>
                <span
                  className={`${styles.insightIcon} ${styles[`insight${item.tone}`]}`}
                >
                  <Icon name={item.icon} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
              </article>
              ))}
            </div>
          ) : (
            <p className={styles.chartState}>No report insights are available.</p>
          )}
        </section>
      </div>
    </section>
  );
}
