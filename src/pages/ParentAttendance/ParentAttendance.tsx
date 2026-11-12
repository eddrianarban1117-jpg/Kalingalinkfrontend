import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import childrenBanner from '../../assets/images/children-banner.png';
import styles from './ParentAttendance.module.css';

type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Excused';

type DayRecord = {
  day: number;
  date: string;
  status: AttendanceStatus;
  note: string;
};

type ChildAttendance = {
  id: number;
  name: string;
  age: string;
  imagePosition: string;
  days: DayRecord[];
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusClass: Record<AttendanceStatus, string> = {
  Present: 'present',
  Late: 'late',
  Absent: 'absent',
  Excused: 'excused',
};

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
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18m-12 4 2 2 4-4" />
        </svg>
      );
    case 'children':
      return (
        <svg {...shared}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-1a6 6 0 0 1 12 0v1zm12-14a3 3 0 0 1 0 6m2 3a5 5 0 0 1 4 5" />
        </svg>
      );
    case 'check':
      return (
        <svg {...shared}>
          <path d="m5 12 4 4L19 6" />
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
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case 'download':
      return (
        <svg {...shared}>
          <path d="M12 3v12m-5-5 5 5 5-5M4 19v2h16v-2" />
        </svg>
      );
    case 'report':
      return (
        <svg {...shared}>
          <path d="M5 3h14v18H5zM8 8h8m-8 4h8m-8 4h5" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...shared}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" />
        </svg>
      );
    case 'search':
      return (
        <svg {...shared}>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );
  }
}

function SummaryCard({
  icon,
  label,
  count,
  note,
  tone,
}: {
  icon: string;
  label: string;
  count: number;
  note?: string;
  tone: string;
}) {
  return (
    <article className={`${styles.summaryCard} ${styles[tone]}`}>
      <span className={styles.summaryIcon}>
        <Icon name={icon} />
      </span>
      <span className={styles.summaryCopy}>
        <strong>{label}</strong>
        <b>{count}</b>
        {note && <small>{note}</small>}
      </span>
    </article>
  );
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={`${styles.statusBadge} ${styles[statusClass[status]]}`}>
      {status}
    </span>
  );
}

function AttendanceRow({
  child,
  day,
  selected,
  showChild,
  onSelect,
}: {
  child: ChildAttendance;
  day: DayRecord;
  selected: boolean;
  showChild: boolean;
  onSelect: () => void;
}) {
  return (
    <tr className={selected ? styles.selectedRow : ''}>
      {showChild && (
        <th
          className={styles.childCell}
          rowSpan={child.days.length}
          scope="rowgroup"
        >
          <span className={styles.childSummary}>
            <img
              alt=""
              src={childrenBanner}
              style={{ objectPosition: child.imagePosition }}
            />
            <span>
              <strong>{child.name}</strong>
              <small>Age: {child.age}</small>
            </span>
          </span>
        </th>
      )}
      <td>{new Date(`${day.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      <td>
        <StatusMark status={day.status} expected="Present" />
      </td>
      <td>
        <StatusMark status={day.status} expected="Late" />
      </td>
      <td>
        <StatusMark status={day.status} expected="Absent" />
      </td>
      <td>
        <StatusMark status={day.status} expected="Excused" />
      </td>
      <td>
        <StatusBadge status={day.status} />
      </td>
      <td>
        <button
          aria-label={`${child.name} attendance on ${new Date(`${day.date}T00:00:00`).toLocaleDateString('en-PH')}: ${day.status}. View note`}
          className={styles.noteButton}
          type="button"
          onClick={onSelect}
        >
          View Note
        </button>
      </td>
    </tr>
  );
}

function StatusMark({
  status,
  expected,
}: {
  status: AttendanceStatus;
  expected: AttendanceStatus;
}) {
  if (status !== expected) return <span className={styles.noMark}>—</span>;
  return (
    <span className={`${styles.mark} ${styles[statusClass[status]]}`}>
      <Icon
        name={
          status === 'Present' ? 'check' : status === 'Late' ? 'clock' : 'close'
        }
      />
      <span className={styles.visuallyHidden}>{status}</span>
    </span>
  );
}

export function ParentAttendance({ search }: { search: string }) {
  const { request } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [childRecords, setChildRecords] = useState<ChildAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showReports, setShowReports] = useState(false);
  const [note, setNote] = useState<{
    child: string;
    date: string;
    detail: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const year = month.getUTCFullYear();
    const monthNumber = month.getUTCMonth();
    const from = `${year}-${String(monthNumber + 1).padStart(2, '0')}-01`;
    const to = new Date(Date.UTC(year, monthNumber + 1, 0)).toISOString().slice(0, 10);
    setLoading(true);
    setLoadError('');
    void request<{ data: Array<{
      child_id: number;
      first_name: string;
      middle_name: string | null;
      last_name: string;
      birth_date: string;
      attendance_date: string;
      status: string;
      time_in: string | null;
      remarks: string | null;
    }> }>(`/api/attendance?from=${from}&to=${to}`)
      .then(({ data }) => {
        if (!active) return;
        const grouped = new Map<number, ChildAttendance>();
        for (const record of data) {
          const id = Number(record.child_id);
          const child = grouped.get(id) ?? {
            id,
            name: [record.first_name, record.middle_name, record.last_name]
              .filter(Boolean)
              .join(' '),
            age: `${Math.max(0, Math.floor((Date.now() - new Date(record.birth_date).getTime()) / 31557600000))} years`,
            imagePosition: '70% 52%',
            days: [],
          };
          const status = record.status.charAt(0).toUpperCase() + record.status.slice(1);
          if (['Present', 'Late', 'Absent', 'Excused'].includes(status)) {
            child.days.push({
              day: Number(record.attendance_date.slice(8, 10)),
              date: record.attendance_date,
              status: status as AttendanceStatus,
              note: record.remarks || (record.time_in ? `Time in: ${record.time_in}` : 'No additional note.'),
            });
          }
          grouped.set(id, child);
        }
        setChildRecords([...grouped.values()]);
      })
      .catch((error: unknown) => {
        if (active) {
          setChildRecords([]);
          setLoadError(error instanceof Error ? error.message : 'Attendance could not be loaded.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [month, request]);

  const term = search.trim().toLowerCase();
  const filteredChildren = useMemo(
    () => childRecords.filter(({ name }) => name.toLowerCase().includes(term)),
    [childRecords, term],
  );
  const allDays = childRecords.flatMap(({ days }) => days);
  const totals = {
    children: childRecords.length,
    present: allDays.filter(({ status }) => status === 'Present').length,
    late: allDays.filter(({ status }) => status === 'Late').length,
    absent: allDays.filter(({ status }) => status === 'Absent').length,
  };
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(month);
  const monthKey = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`;
  const firstWeekday = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1),
  ).getUTCDay();
  const daysInMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const dateStatus = new Map<number, AttendanceStatus[]>();
  for (const child of childRecords) {
    for (const record of child.days) {
      dateStatus.set(record.day, [
        ...(dateStatus.get(record.day) ?? []),
        record.status,
      ]);
    }
  }
  const updateRecords = childRecords
    .flatMap((child) => child.days.map((day) => ({
      child: child.name,
      message: `${day.status.toLowerCase()} on ${new Date(`${day.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
      date: new Date(`${day.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: '',
      status: day.status,
      day: day.day,
      detail: day.note,
      dateValue: day.date,
    })))
    .sort((a, b) => b.dateValue.localeCompare(a.dateValue))
    .slice(0, 5);

  function exportSummary() {
    const lines = [
      'Child,Date,Present,Late,Absent,Excused,Status,Note',
      ...childRecords.flatMap((child) =>
        child.days.map((day) =>
          [
            child.name,
            day.date,
            day.status === 'Present' ? '1' : '0',
            day.status === 'Late' ? '1' : '0',
            day.status === 'Absent' ? '1' : '0',
            day.status === 'Excused' ? '1' : '0',
            day.status,
            `"${day.note.replaceAll('"', '""')}"`,
          ].join(','),
        ),
      ),
    ];
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }),
    );
    link.download = 'kalingalink-attendance-summary.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function changeMonth(offset: number) {
    setMonth(
      (current) =>
        new Date(
          Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 1),
        ),
    );
  }

  return (
    <main aria-label="Attendance Updates" className={styles.page}>
      <section
        aria-label="Attendance updates"
        className={styles.hero}
        style={{ backgroundImage: `url("${childrenBanner}")` }}
      >
        <span aria-hidden="true" className={styles.heroIcon}>
          <Icon name="calendar" />
        </span>
        <div>
          <h1>Attendance Updates</h1>
          <p>
            View your child/children’s attendance records and stay updated with
            their daily
          </p>
          <p>attendance status at the Child Development Center.</p>
        </div>
      </section>

      <section aria-label="Attendance summary" className={styles.summary}>
        <SummaryCard
          icon="children"
          label="Total Children Monitored"
          count={totals.children}
          tone="blue"
        />
        <SummaryCard
          icon="check"
          label="Present"
          count={totals.present}
          note={`${totals.children ? Math.round((totals.present / (totals.present + totals.late + totals.absent)) * 100) || 0 : 0}%`}
          tone="green"
        />
        <SummaryCard
          icon="clock"
          label="Late"
          count={totals.late}
          note={`${totals.children ? Math.round((totals.late / (totals.present + totals.late + totals.absent)) * 100) || 0 : 0}%`}
          tone="orange"
        />
        <SummaryCard
          icon="close"
          label="Absent"
          count={totals.absent}
          note={`${totals.children ? Math.round((totals.absent / (totals.present + totals.late + totals.absent)) * 100) || 0 : 0}%`}
          tone="red"
        />
        <label className={styles.periodSelect}>
          <Icon name="calendar" />
          <span>
            <strong>Attendance Period</strong>
            <select
              value={monthKey}
              onChange={(event) => {
                const [year, monthNumber] = event.target.value.split('-').map(Number);
                setMonth(new Date(Date.UTC(year, monthNumber - 1, 1)));
                setSelectedDay(null);
              }}
            >
              {Array.from({ length: 12 }, (_, index) => {
                const optionDate = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - index, 1));
                const value = `${optionDate.getUTCFullYear()}-${String(optionDate.getUTCMonth() + 1).padStart(2, '0')}`;
                return <option key={value} value={value}>{optionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</option>;
              })}
            </select>
          </span>
          <Icon name="arrow" />
        </label>
      </section>

      <div className={styles.mainGrid}>
        <div className={styles.primaryColumn}>
          <section
            aria-labelledby="attendance-heading"
            className={styles.attendancePanel}
          >
            <header className={styles.panelHeading}>
              <h2 id="attendance-heading">
                <Icon name="report" /> Children Attendance
              </h2>
              <div className={styles.tableActions}>
                <label>
                  <Icon name="search" />
                  <span className={styles.visuallyHidden}>
                    Search child attendance
                  </span>
                  <input
                    aria-label="Search child attendance"
                    placeholder="Search by child name..."
                    type="search"
                    value={search}
                    readOnly
                  />
                </label>
              </div>
            </header>
            {loading && <p><BouncingDots label="Loading attendance records" /></p>}
            {loadError && <p aria-live="polite" role="alert">{loadError}</p>}
            <div className={styles.tableScroll}>
              <table>
                <thead>
                  <tr>
                    <th>Child Name</th>
                    <th>Date</th>
                    <th>Present</th>
                    <th>Late</th>
                    <th>Absent</th>
                    <th>Excused</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                {filteredChildren.map((child) => (
                  <tbody className={styles.childGroup} key={child.id}>
                    {child.days.map((day, index) => (
                      <AttendanceRow
                        child={child}
                        day={day}
                        key={day.date}
                        selected={selectedDay === day.day}
                        showChild={index === 0}
                        onSelect={() =>
                          setNote({
                            child: child.name,
                            date: day.date,
                            detail: day.note,
                          })
                        }
                      />
                    ))}
                  </tbody>
                ))}
                {!loading && !loadError && !filteredChildren.length && (
                  <tbody>
                    <tr>
                      <td className={styles.emptyState} colSpan={8}>
                        No attendance records match your search.
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
            </div>
          </section>

          <section
            aria-labelledby="recent-heading"
            className={styles.recentPanel}
          >
            <header className={styles.panelHeading}>
              <h2 id="recent-heading">
                <Icon name="bell" /> Recent Attendance Updates
              </h2>
              <span>Latest notifications</span>
            </header>
            <div>
              {updateRecords.map((record, index) => (
                <article
                  className={styles.updateRow}
                  key={`${record.child}-${record.date}`}
                >
                  <i className={styles[statusClass[record.status]]} />
                  <p>
                    <strong>{record.child}</strong> {record.message}
                  </p>
                  <time>
                    {record.date} · {record.time}
                  </time>
                  <StatusBadge status={record.status} />
                  <button
                    aria-label={`View update ${index + 1}`}
                    type="button"
                    onClick={() =>
                      setNote({
                        child: record.child,
                        date: record.dateValue,
                        detail: record.message,
                      })
                    }
                  >
                    <Icon name="arrow" />
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.rightRail}>
          <section
            aria-label="Attendance calendar"
            className={styles.railPanel}
          >
            <header className={styles.calendarHeading}>
              <h2>
                <Icon name="calendar" /> Calendar
              </h2>
              <div>
                <button
                  aria-label="Previous month"
                  type="button"
                  onClick={() => changeMonth(-1)}
                >
                  ‹
                </button>
                <strong>{monthLabel}</strong>
                <button
                  aria-label="Next month"
                  type="button"
                  onClick={() => changeMonth(1)}
                >
                  ›
                </button>
              </div>
            </header>
            <div
              className={styles.calendarGrid}
              role="grid"
              aria-label={monthLabel}
            >
              {weekdays.map((day) => (
                <span className={styles.weekday} key={day}>
                  {day}
                </span>
              ))}
              {Array.from({ length: firstWeekday }, (_, index) => (
                <span
                  aria-hidden="true"
                  className={styles.emptyDay}
                  key={`empty-${index}`}
                />
              ))}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const statuses = dateStatus.get(day) ?? [];
                const marker = statuses.includes('Absent')
                  ? styles.calendarAbsent
                  : statuses.includes('Late')
                    ? styles.calendarLate
                    : statuses.length
                      ? styles.calendarPresent
                      : '';
                return (
                  <button
                    aria-pressed={selectedDay === day}
                    className={`${styles.calendarDay} ${marker} ${selectedDay === day ? styles.selectedDay : ''}`}
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <p className={styles.calendarNote}>
              Select a date to highlight its attendance records.
            </p>
          </section>

          <section className={`${styles.railPanel} ${styles.quickPanel}`}>
            <h2>Quick Actions</h2>
            <button
              className={styles.primaryAction}
              type="button"
              onClick={() => setShowReports(true)}
            >
              <Icon name="report" /> View Attendance Reports
            </button>
            <button
              className={styles.secondaryAction}
              type="button"
              onClick={exportSummary}
            >
              <Icon name="download" /> Download Attendance Summary
            </button>
          </section>

          <section className={`${styles.railPanel} ${styles.stayUpdated}`}>
            <h2>
              <Icon name="bell" /> Stay Updated
            </h2>
            <ul>
              <li>Check your child’s daily attendance and status.</li>
              <li>
                Receive notifications for late, absent, or excused absences.
              </li>
              <li>Contact your child’s teacher for any attendance concerns.</li>
            </ul>
            <img alt="" src={childrenBanner} />
          </section>
        </aside>
      </div>

      {(note || showReports) && (
        <div className={styles.dialogBackdrop}>
          <section
            aria-labelledby="attendance-dialog-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <button
              aria-label="Close dialog"
              className={styles.closeButton}
              type="button"
              onClick={() => {
                setNote(null);
                setShowReports(false);
              }}
            >
              ×
            </button>
            {note ? (
              <>
                <h2 id="attendance-dialog-title">Attendance Note</h2>
                <p>
                  <strong>{note.child}</strong> · {new Date(`${note.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p>{note.detail}</p>
              </>
            ) : (
              <>
                <h2 id="attendance-dialog-title">Attendance Reports</h2>
                <p>Attendance summary for {monthLabel}</p>
                <dl>
                  <div>
                    <dt>Children monitored</dt>
                    <dd>{totals.children}</dd>
                  </div>
                  <div>
                    <dt>Present records</dt>
                    <dd>{totals.present}</dd>
                  </div>
                  <div>
                    <dt>Late records</dt>
                    <dd>{totals.late}</dd>
                  </div>
                  <div>
                    <dt>Absent records</dt>
                    <dd>{totals.absent}</dd>
                  </div>
                </dl>
                <button
                  className={styles.primaryAction}
                  type="button"
                  onClick={exportSummary}
                >
                  <Icon name="download" /> Download CSV Summary
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
