import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import styles from './AttendanceMonitoring.module.css';

type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

type AttendanceRecord = {
  id: number;
  child_id: number;
  attendance_date: string;
  status: AttendanceStatus;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  cdc_name: string;
};

type AttendanceApiResponse = {
  status: boolean;
  data: Array<Omit<AttendanceRecord, 'status'> & { status: string }>;
};

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

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
  if (name === 'calendar')
    return (
      <svg {...base}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18m-10 4v4m-2-2h4" />
      </svg>
    );
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
  if (name === 'check')
    return (
      <svg {...base}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  if (name === 'clock')
    return (
      <svg {...base}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  if (name === 'document')
    return (
      <svg {...base}>
        <path d="M5 3h14v18H5zM8 8h8m-8 4h8m-8 4h5" />
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
  if (name === 'filter')
    return (
      <svg {...base}>
        <path d="M4 6h16M7 12h10m-7 6h4" />
      </svg>
    );
  return (
    <svg {...base}>
      <circle cx="12" cy="8" r="3" />
      <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
    </svg>
  );
}

function AttendanceTrend({
  days,
  rates,
}: {
  days: string[];
  rates: number[];
}) {
  const width = 600;
  const height = 120;
  const x = (index: number) =>
    (index / Math.max(days.length - 1, 1)) * width;
  const y = (value: number) => height - (value / 100) * height;
  const getPoints = (values: number[]) =>
    values.map((value, index) => `${x(index)},${y(value)}`).join(' ');

  return (
    <div className={styles.chart}>
      <div aria-hidden="true" className={styles.yAxis}>
        {[100, 75, 50, 25, 0].map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>
      <div className={styles.chartBody}>
        <div aria-hidden="true" className={styles.gridLines}>
          {[0, 1, 2, 3, 4].map((line) => (
            <span key={line} />
          ))}
        </div>
        <svg
          aria-label="Recorded child attendance rate over the last seven days"
          className={styles.lineChart}
          preserveAspectRatio="none"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <polyline
            fill="none"
            points={getPoints(rates)}
            stroke="#278ff2"
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
          />
          {rates.map((value, index) => (
            <circle
              cx={x(index)}
              cy={y(value)}
              fill="#278ff2"
              key={`attendance-${index}`}
              r="3.4"
            />
          ))}
        </svg>
        <div aria-hidden="true" className={styles.dayLabels}>
          {days.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AttendanceCalendar({
  month,
  year,
  onMonthChange,
  markers,
}: {
  month: number;
  year: number;
  onMonthChange: (direction: number) => void;
  markers: Record<number, string[]>;
}) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const slots = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  return (
    <section
      aria-labelledby="calendar-title"
      className={`${styles.panel} ${styles.calendarPanel}`}
    >
      <div className={styles.panelHeader}>
        <h2 id="calendar-title">Attendance Calendar</h2>
      </div>
      <div className={styles.calendarMonth}>
        <button
          aria-label="Previous month"
          onClick={() => onMonthChange(-1)}
          type="button"
        >
          ‹
        </button>
        <strong>
          {monthNames[month]} {year}
        </strong>
        <button
          aria-label="Next month"
          onClick={() => onMonthChange(1)}
          type="button"
        >
          ›
        </button>
      </div>
      <div
        aria-label={`${monthNames[month]} ${year}`}
        className={styles.calendarGrid}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <span className={styles.weekday} key={day}>
            {day}
          </span>
        ))}
        {slots.map((day, index) => (
          <span
            className={styles.calendarDay}
            key={`${day ?? 'empty'}-${index}`}
          >
            {day && (
              <>
                <span
                  className={`${markers[day]?.includes('selected') ? styles.selectedDay : ''}`}
                >
                  {day}
                </span>
                {markers[day] && (
                  <i className={styles[`marker${markers[day][0]}`]} />
                )}
              </>
            )}
          </span>
        ))}
      </div>
      <div className={styles.calendarLegend}>
        <span>
          <i className={styles.legendOnTime} />
          On Time
        </span>
        <span>
          <i className={styles.legendLate} />
          Late
        </span>
        <span>
          <i className={styles.legendAbsent} />
          Absent
        </span>
        <span>
          <i className={styles.legendNoRecord} />
          No Record
        </span>
      </div>
    </section>
  );
}

export function AttendanceMonitoring() {
  const { request } = useAuth();
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('Last 7 Days');
  const [page, setPage] = useState(1);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const endDate = new Date();
    const startDate = new Date(endDate);
    if (period === 'Last 7 Days') startDate.setDate(startDate.getDate() - 6);
    else if (period === 'Last 30 Days') startDate.setDate(startDate.getDate() - 29);
    else {
      startDate.setMonth(5, 1);
      if (startDate > endDate) startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const toDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    setLoading(true);
    setError('');
    void request<AttendanceApiResponse>(
      `/api/attendance?from=${toDate(startDate)}&to=${toDate(endDate)}`,
    )
      .then((result) => {
        if (!active) return;
        setRecords(
          result.data.map((record) => ({
            ...record,
            status: (record.status.charAt(0).toUpperCase() +
              record.status.slice(1)) as AttendanceStatus,
          })),
        );
      })
      .catch((requestError: Error) => {
        if (active) {
          setRecords([]);
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, request]);

  const today = new Date();
  const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayRecords = records.filter(
    (record) => record.attendance_date === todayDate,
  );
  const presentToday = todayRecords.filter(
    (record) => record.status === 'Present' || record.status === 'Late',
  ).length;
  const countedTodayRecords = todayRecords.filter(
    (record) => record.status !== 'Excused',
  ).length;
  const absentToday = todayRecords.filter(
    (record) => record.status === 'Absent',
  ).length;
  const recordedChildren = new Set(records.map((record) => record.child_id)).size;
  const presentCount = records.filter(
    (record) => record.status === 'Present' || record.status === 'Late',
  ).length;
  const countedRecords = records.filter((record) => record.status !== 'Excused');
  const absentCount = records.filter((record) => record.status === 'Absent').length;
  const attendanceRate = countedRecords.length
    ? Math.round((presentCount / countedRecords.length) * 100)
    : 0;

  const chartDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const chartDays = chartDates.map((date) =>
    date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  );
  const chartRates = chartDates.map((date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dailyRecords = records.filter(
      (record) => record.attendance_date === dateString,
    );
    const countedDailyRecords = dailyRecords.filter(
      (record) => record.status !== 'Excused',
    );
    if (!countedDailyRecords.length) return 0;
    return Math.round(
      (countedDailyRecords.filter(
        (record) => record.status === 'Present' || record.status === 'Late',
      ).length /
        countedDailyRecords.length) *
        100,
    );
  });
  const calendarMarkers = records.reduce<Record<number, string[]>>(
    (markers, record) => {
      const date = new Date(`${record.attendance_date}T00:00:00`);
      if (
        date.getFullYear() !== monthDate.getFullYear() ||
        date.getMonth() !== monthDate.getMonth()
      ) {
        return markers;
      }
      const marker =
        record.status === 'Late'
          ? 'late'
          : record.status === 'Absent'
            ? 'absent'
            : 'ontime';
      markers[date.getDate()] ??= [];
      if (!markers[date.getDate()].includes(marker)) {
        markers[date.getDate()].push(marker);
      }
      return markers;
    },
    {},
  );
  if (
    monthDate.getFullYear() === today.getFullYear() &&
    monthDate.getMonth() === today.getMonth()
  ) {
    calendarMarkers[today.getDate()] ??= [];
    calendarMarkers[today.getDate()].push('selected');
  }

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return records.filter((record) =>
      [
        record.first_name,
        record.middle_name ?? '',
        record.last_name,
        record.cdc_name,
        record.status,
      ].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [query, records]);
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / 6));
  const visibleRecords = filteredRecords.slice((page - 1) * 6, page * 6);

  function changeMonth(direction: number) {
    setMonthDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.titleIcon}>
          <Icon name="calendar" />
        </span>
        <div>
          <h1>Attendance and Monitoring</h1>
          <p>
            Track and monitor the attendance and participation of children and
            teachers across all Child Development Centers.
          </p>
        </div>
      </header>

      <section aria-label="Attendance overview" className={styles.stats}>
        <article className={`${styles.statCard} ${styles.blue}`}>
          <span className={styles.statIcon}>
            <Icon name="people" />
          </span>
          <div>
            <span>Recorded Children</span>
            <strong>{recordedChildren.toLocaleString()}</strong>
            <small>In selected period</small>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.teal}`}>
          <span className={styles.statIcon}>
            <Icon name="user" />
          </span>
          <div>
            <span>Present Today</span>
            <strong>1,142</strong>
            <small>{countedTodayRecords ? `${Math.round((presentToday / countedTodayRecords) * 100)}% of today's records` : 'No records today'}</small>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.gold}`}>
          <span className={styles.statIcon}>
            <Icon name="calendar" />
          </span>
          <div>
            <span>Absent Today</span>
            <strong>106</strong>
            <small>{countedTodayRecords ? `${Math.round((absentToday / countedTodayRecords) * 100)}% of today's records` : 'No records today'}</small>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.pink}`}>
          <span className={styles.statIcon}>
            <Icon name="user" />
          </span>
          <div>
            <span>Attendance Records</span>
            <strong>{records.length.toLocaleString()}</strong>
            <small>In selected period</small>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
      </section>

      <div className={styles.topGrid}>
        <section
          aria-labelledby="overview-title"
          className={`${styles.panel} ${styles.overviewPanel}`}
        >
          <div className={styles.panelHeader}>
            <h2 id="overview-title">Attendance Overview</h2>
            <label className={styles.periodSelect}>
              <Icon name="calendar" />
              <span className={styles.visuallyHidden}>
                Attendance date range
              </span>
              <select
                onChange={(event) => setPeriod(event.target.value)}
                value={period}
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This School Year</option>
              </select>
              <Icon name="chevron" />
            </label>
          </div>
          <div className={styles.chartLegend}>
            <span>
              <i className={styles.childrenDot} />
              Child attendance rate
            </span>
          </div>
          <AttendanceTrend days={chartDays} rates={chartRates} />
        </section>
        <section
          aria-labelledby="rate-title"
          className={`${styles.panel} ${styles.ratePanel}`}
        >
          <div className={styles.panelHeader}>
            <h2 id="rate-title">Attendance Rate</h2>
          </div>
          <div className={styles.rateContent}>
            <div
              aria-label={`${attendanceRate} percent overall attendance`}
              className={styles.rateDonut}
              role="img"
              style={{
                background: `conic-gradient(#26bda9 ${attendanceRate}%, #f3b84b ${attendanceRate}% 100%)`,
              }}
            >
              <span>
                <strong>{attendanceRate}%</strong>Overall
                <br />
                Attendance
              </span>
            </div>
            <ul className={styles.rateLegend}>
              <li>
                <i className={styles.presentDot} />
                Present<strong>{presentCount} ({attendanceRate}%)</strong>
              </li>
              <li>
                <i className={styles.absentDot} />
                Absent<strong>{absentCount} ({countedRecords.length ? Math.round((absentCount / countedRecords.length) * 100) : 0}%)</strong>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <div className={styles.lowerGrid}>
        <section
          aria-label="Attendance records"
          className={`${styles.panel} ${styles.recordsPanel}`}
        >
          <div className={styles.panelHeader}>
            <h2>Attendance Records</h2>
            <div className={styles.recordTools}>
              <label className={styles.recordSearch}>
                <Icon name="search" />
                <input
                  aria-label="Search child or teacher name"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search child or teacher name..."
                  type="search"
                  value={query}
                />
              </label>
              <span aria-hidden="true" className={styles.filterIcon}>
                <Icon name="filter" />
              </span>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.attendanceTable}>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Type</th>
                  <th scope="col">Child Development Center</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => {
                  const name = [
                    record.first_name,
                    record.middle_name,
                    record.last_name,
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                  <tr key={record.id}>
                    <td data-label="Name">
                      <span className={styles.personAvatar}>
                        <Icon name="user" />
                      </span>
                      <strong>{name}</strong>
                    </td>
                    <td data-label="Type">Child</td>
                    <td data-label="Child Development Center">
                      {record.cdc_name}
                    </td>
                    <td data-label="Date">{new Date(`${record.attendance_date}T00:00:00`).toLocaleDateString()}</td>
                    <td data-label="Status">
                      <span
                        className={`${styles.status} ${styles[`status${record.status === 'Excused' ? 'Absent' : record.status}`]}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td data-label="Action">
                      <button
                        aria-label={`More actions for ${name}`}
                        className={styles.moreButton}
                        type="button"
                      >
                        •••
                      </button>
                    </td>
                  </tr>
                )})}
                {loading && (
                  <tr>
                    <td className={styles.emptyState} colSpan={6}>
                      <BouncingDots label="Loading attendance records" />
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td className={styles.emptyState} colSpan={6}>
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && visibleRecords.length === 0 && (
                  <tr>
                    <td className={styles.emptyState} colSpan={6}>
                      No attendance records match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className={styles.tableFooter}>
            <span>
              Showing {filteredRecords.length ? (page - 1) * 6 + 1 : 0}–
              {Math.min(page * 6, filteredRecords.length)} of{' '}
              {filteredRecords.length} records
            </span>
            <nav
              aria-label="Attendance record pages"
              className={styles.pagination}
            >
              <button
                aria-label="Previous page"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    aria-current={pageNumber === page ? 'page' : undefined}
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    type="button"
                  >
                    {pageNumber}
                  </button>
                ),
              )}
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
          <AttendanceCalendar
            month={monthDate.getMonth()}
            year={monthDate.getFullYear()}
            onMonthChange={changeMonth}
            markers={calendarMarkers}
          />
          <section
            aria-labelledby="quick-filters-title"
            className={`${styles.panel} ${styles.quickPanel}`}
          >
            <div className={styles.panelHeader}>
              <h2 id="quick-filters-title">Quick Filters</h2>
            </div>
            <div className={styles.quickList}>
              {records.slice(0, 5).map((record) => {
                const name = [record.first_name, record.last_name].join(' ');
                const title =
                  record.status === 'Late'
                    ? 'Late arrival recorded'
                    : record.status === 'Absent'
                      ? 'Absence recorded'
                      : 'Attendance recorded';
                return (
                <article className={styles.quickItem} key={record.id}>
                  <span
                    className={`${styles.quickIcon} ${styles.quickteal}`}
                  >
                    <Icon name={record.status === 'Late' ? 'clock' : 'check'} />
                  </span>
                  <span className={styles.quickText}>
                    <strong>{title}</strong>
                    <span>{name} · {record.cdc_name}</span>
                  </span>
                  <time>{new Date(`${record.attendance_date}T00:00:00`).toLocaleDateString()}</time>
                </article>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
