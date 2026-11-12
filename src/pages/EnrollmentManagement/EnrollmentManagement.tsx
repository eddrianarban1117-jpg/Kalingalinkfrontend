import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import { EnrollmentApplicationDetails } from './EnrollmentApplicationDetails';
import styles from './EnrollmentManagement.module.css';

type ApplicationStatus =
  | 'Pending'
  | 'Under Review'
  | 'Returned for Correction'
  | 'Approved'
  | 'Rejected';
type Application = {
  id: number;
  childId: number;
  number: string;
  cdcId: number;
  name: string;
  age: number;
  gender: string;
  center: string;
  assignedTeacherId: number | null;
  assignedTeacherName: string;
  date: string;
  status: ApplicationStatus;
  schoolYear: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentAddress: string;
  relationship: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  householdIncome: string;
  language: string;
  referral: string;
  childBirthDate: string;
  childMiddleName: string;
  childNickname: string;
  psaNumber: string;
  nationality: string;
  placeOfBirth: string;
  childAddress: string;
  bloodType: string;
  medicalCondition: string;
  allergies: string;
  immunizationStatus: string;
  enrollmentType: string;
  enrolledAt: string;
  documents: {
    id: number;
    original_name: string;
    document_type: string;
    verification_status: string;
    download_url: string;
  }[];
};

type ApiApplication = {
  id: number;
  child_id: number;
  cdc_id: number;
  assigned_teacher_user_id: number | null;
  assigned_teacher_first_name: string | null;
  assigned_teacher_last_name: string | null;
  application_number: string;
  parent_name: string;
  parent_relationship: string;
  parent_email: string;
  parent_phone: string;
  parent_address: string;
  emergency_name: string;
  emergency_relationship: string;
  emergency_phone: string;
  household_income: string | null;
  preferred_language: string | null;
  referral_source: string | null;
  child_first_name: string;
  child_middle_name: string | null;
  child_last_name: string;
  child_birth_date: string;
  child_gender: string;
  child_nickname: string | null;
  psa_birth_certificate_number: string | null;
  child_nationality: string | null;
  place_of_birth: string | null;
  child_address: string | null;
  blood_type: string | null;
  medical_notes: string | null;
  allergies: string | null;
  immunization_status: string | null;
  enrollment_type: string;
  enrolled_at: string | null;
  cdc_name: string | null;
  school_year: string;
  status: string;
  documents_requested_at: string | null;
  submitted_at: string;
  documents: Application['documents'];
};

type TrendMonth = {
  month: string;
  applications: number;
  approvals: number;
};

type EnrollmentActivity = {
  status: string;
  child_name: string;
  application_number: string;
  occurred_at: string;
};

type EnrollmentOverview = {
  school_year: string;
  stats: {
    total_applicants: number;
    enrolled_children: number;
    pending_applications: number;
    rejected_applications: number;
  };
  monthly_trend: TrendMonth[];
  gender: { male: number; female: number; other: number };
  age_groups: { label: string; count: number }[];
  activities: EnrollmentActivity[];
};

function currentSchoolYear() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

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

function formatMetric(value: number | undefined, loading: boolean) {
  if (loading) return <BouncingDots size="small" inline />;
  return value === undefined ? '—' : value.toLocaleString();
}

function mapApplication(record: ApiApplication): Application {
  const birthDate = new Date(record.child_birth_date);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  if (
    now.getMonth() < birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() &&
      now.getDate() < birthDate.getDate())
  )
    age -= 1;
  const submitted = new Date(record.submitted_at);
  const status =
    record.status === 'under_review' && record.documents_requested_at
      ? 'Returned for Correction'
      : record.status.replace('_', ' ');
  return {
    id: record.id,
    childId: record.child_id,
    number: record.application_number,
    cdcId: record.cdc_id,
    name: [
      record.child_first_name,
      record.child_middle_name,
      record.child_last_name,
    ]
      .filter(Boolean)
      .join(' '),
    age: Math.max(age, 0),
    gender: record.child_gender,
    center: record.cdc_name || 'Unassigned',
    assignedTeacherId: record.assigned_teacher_user_id
      ? Number(record.assigned_teacher_user_id)
      : null,
    assignedTeacherName: [
      record.assigned_teacher_first_name,
      record.assigned_teacher_last_name,
    ]
      .filter(Boolean)
      .join(' '),
    date: Number.isNaN(submitted.getTime())
      ? record.submitted_at
      : submitted.toLocaleDateString(),
    status:
      status === 'Returned for Correction'
        ? status
        : ((status.charAt(0).toUpperCase() +
            status.slice(1)) as ApplicationStatus),
    schoolYear: record.school_year,
    parentName: record.parent_name,
    parentEmail: record.parent_email,
    parentPhone: record.parent_phone,
    parentAddress: record.parent_address,
    relationship: record.parent_relationship,
    emergencyName: record.emergency_name,
    emergencyRelationship: record.emergency_relationship,
    emergencyPhone: record.emergency_phone,
    householdIncome: record.household_income ?? '',
    language: record.preferred_language ?? '',
    referral: record.referral_source ?? '',
    childBirthDate: record.child_birth_date,
    childMiddleName: record.child_middle_name ?? '',
    childNickname: record.child_nickname ?? '',
    psaNumber: record.psa_birth_certificate_number ?? '',
    nationality: record.child_nationality ?? '',
    placeOfBirth: record.place_of_birth ?? '',
    childAddress: record.child_address ?? '',
    bloodType: record.blood_type ?? '',
    medicalCondition: record.medical_notes ?? '',
    allergies: record.allergies ?? '',
    immunizationStatus: record.immunization_status ?? '',
    enrollmentType: record.enrollment_type,
    enrolledAt: record.enrolled_at ?? '',
    documents: record.documents,
  };
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
  if (name === 'search') {
    return (
      <svg {...base}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </svg>
    );
  }
  if (name === 'chevron') {
    return (
      <svg {...base}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );
  }
  if (name === 'user') {
    return (
      <svg {...base}>
        <circle cx="12" cy="8" r="3" />
        <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
      </svg>
    );
  }
  if (name === 'check') {
    return (
      <svg {...base}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }
  if (name === 'reject') {
    return (
      <svg {...base}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6m0-6-6 6" />
      </svg>
    );
  }
  if (name === 'clock') {
    return (
      <svg {...base}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (name === 'edit') {
    return (
      <svg {...base}>
        <path d="m14 5 5 5M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z" />
      </svg>
    );
  }
  if (name === 'add') {
    return (
      <svg {...base}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-1a6 6 0 0 1 12 0v1m4-9v6m-3-3h6" />
      </svg>
    );
  }
  return (
    <svg {...base}>
      <path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function TrendChart({ data }: { data: TrendMonth[] }) {
  const chartWidth = 600;
  const chartHeight = 148;
  const maxValue = Math.max(
    10,
    Math.ceil(
      Math.max(
        0,
        ...data.flatMap(({ applications, approvals }) => [
          applications,
          approvals,
        ]),
      ) / 10,
    ) * 10,
  );
  const x = (index: number) =>
    (index / Math.max(data.length - 1, 1)) * chartWidth;
  const y = (value: number) => chartHeight - (value / maxValue) * chartHeight;
  const points = (values: number[]) =>
    values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const approvalValues = data.map(({ approvals }) => approvals);
  const applicationValues = data.map(({ applications }) => applications);
  const approvalPoints = points(approvalValues);
  const applicationPoints = points(applicationValues);

  return (
    <div className={styles.trendChart}>
      <div aria-hidden="true" className={styles.yAxis}>
        {[5, 4, 3, 2, 1, 0].map((step) => (
          <span key={step}>{Math.round((maxValue * step) / 5)}</span>
        ))}
      </div>
      <div className={styles.chartPlot}>
        <div aria-hidden="true" className={styles.gridLines}>
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <svg
          aria-label="Monthly enrollment applications and approvals"
          className={styles.lineChart}
          preserveAspectRatio="none"
          role="img"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          <defs>
            <linearGradient id="newArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2995f6" stopOpacity=".16" />
              <stop offset="100%" stopColor="#2995f6" stopOpacity=".02" />
            </linearGradient>
            <linearGradient id="totalArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#35c7c8" stopOpacity=".18" />
              <stop offset="100%" stopColor="#35c7c8" stopOpacity=".02" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${chartHeight} ${approvalPoints} ${chartWidth},${chartHeight}`}
            fill="url(#totalArea)"
          />
          <polygon
            points={`0,${chartHeight} ${applicationPoints} ${chartWidth},${chartHeight}`}
            fill="url(#newArea)"
          />
          <polyline
            points={approvalPoints}
            fill="none"
            stroke="#34c8c9"
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={applicationPoints}
            fill="none"
            stroke="#248df1"
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
          />
          {approvalValues.map((value, index) => (
            <circle
              cx={x(index)}
              cy={y(value)}
              fill="#34c8c9"
              key={`total-${index}`}
              r="3.2"
            />
          ))}
          {applicationValues.map((value, index) => (
            <circle
              cx={x(index)}
              cy={y(value)}
              fill="#248df1"
              key={`new-${index}`}
              r="3.2"
            />
          ))}
        </svg>
        <div aria-hidden="true" className={styles.monthLabels}>
          {data.map(({ month }) => (
            <span key={month}>{month}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function GenderChart({
  gender,
  total,
}: {
  gender: EnrollmentOverview['gender'];
  total: number;
}) {
  const maleAngle = total ? (gender.male / total) * 360 : 0;
  const femaleAngle = total ? (gender.female / total) * 360 : 0;
  const otherAngle = total ? (gender.other / total) * 360 : 0;
  const percent = (value: number) =>
    total ? Math.round((value / total) * 100) : 0;
  return (
    <div className={styles.genderContent}>
      <div
        aria-label={`Currently enrolled children by gender: ${gender.male} male, ${gender.female} female, ${gender.other} other`}
        className={styles.genderDonut}
        style={{
          background: total
            ? `conic-gradient(#3299f5 0deg ${maleAngle}deg, #fb77a4 ${maleAngle}deg ${maleAngle + femaleAngle}deg, #9c65e8 ${maleAngle + femaleAngle}deg ${maleAngle + femaleAngle + otherAngle}deg, #e5eff9 ${maleAngle + femaleAngle + otherAngle}deg 360deg)`
            : '#e5eff9',
        }}
        role="img"
      >
        <span>
          <strong>{total.toLocaleString()}</strong>Enrolled
        </span>
      </div>
      <ul className={styles.genderLegend}>
        <li>
          <i className={styles.maleDot} />
          Male
          <strong>
            {gender.male.toLocaleString()} ({percent(gender.male)}%)
          </strong>
        </li>
        <li>
          <i className={styles.femaleDot} />
          Female
          <strong>
            {gender.female.toLocaleString()} ({percent(gender.female)}%)
          </strong>
        </li>
        <li>
          <i className={styles.otherDot} />
          Others
          <strong>
            {gender.other.toLocaleString()} ({percent(gender.other)}%)
          </strong>
        </li>
      </ul>
    </div>
  );
}

export function EnrollmentManagement() {
  const { request } = useAuth();
  const schoolYear = currentSchoolYear();
  const [applications, setApplications] = useState<Application[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [year, setYear] = useState('This School Year');
  const selectedSchoolYear =
    year === 'This School Year'
      ? schoolYear
      : `${Number(schoolYear.slice(0, 4)) - 1}-${Number(schoolYear.slice(0, 4))}`;
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [overviewError, setOverviewError] = useState('');
  const [overview, setOverview] = useState<EnrollmentOverview | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const applicationRequestId = useRef(0);
  const overviewRequestId = useRef(0);

  const loadApplications = useCallback(
    async (isActive: () => boolean = () => true) => {
      const requestId = ++applicationRequestId.current;
      try {
        const result = await request<{ data: ApiApplication[] }>(
          '/api/enrollments',
        );
        if (requestId !== applicationRequestId.current || !isActive()) return;
        if (!Array.isArray(result.data)) {
          throw new Error('The server returned an invalid applications list.');
        }
        setApplications(result.data.map(mapApplication));
        setLoadError('');
      } catch (error) {
        if (requestId === applicationRequestId.current && isActive()) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Applications could not be loaded.',
          );
        }
      } finally {
        if (requestId === applicationRequestId.current && isActive())
          setLoading(false);
      }
    },
    [request],
  );

  const loadOverview = useCallback(
    async (
      requestedSchoolYear: string,
      isActive: () => boolean = () => true,
    ) => {
      const requestId = ++overviewRequestId.current;
      try {
        const result = await request<{ data: EnrollmentOverview }>(
          `/api/admin/enrollment-overview?school_year=${encodeURIComponent(requestedSchoolYear)}`,
        );
        if (requestId !== overviewRequestId.current || !isActive()) return;
        setOverview(result.data);
        setOverviewError('');
      } catch (error) {
        if (requestId === overviewRequestId.current && isActive()) {
          setOverviewError(
            error instanceof Error
              ? error.message
              : 'Enrollment statistics could not be loaded.',
          );
        }
      } finally {
        if (requestId === overviewRequestId.current && isActive())
          setOverviewLoading(false);
      }
    },
    [request],
  );

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active && document.visibilityState === 'visible') {
        void loadApplications(() => active);
      }
    };
    void loadApplications(() => active);
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadApplications]);

  useEffect(() => {
    let active = true;
    setOverview(null);
    setOverviewLoading(true);
    setOverviewError('');
    const refresh = () => {
      if (active && document.visibilityState === 'visible') {
        void loadOverview(selectedSchoolYear, () => active);
      }
    };
    void loadOverview(selectedSchoolYear, () => active);
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadOverview, selectedSchoolYear]);

  const filteredApplications = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    return applications.filter(
      (application) =>
        [
          application.number,
          application.name,
          application.parentName,
          application.parentEmail,
          application.center,
          application.gender,
          application.status,
        ].some((value) => value.toLowerCase().includes(searchTerm)) &&
        application.schoolYear === selectedSchoolYear,
    );
  }, [applications, query, selectedSchoolYear]);
  const stats = overview?.stats;
  const gender = overview?.gender ?? { male: 0, female: 0, other: 0 };
  const ageGroups = overview?.age_groups ?? [];
  const monthlyTrend = overview?.monthly_trend ?? [];
  const activities = overview?.activities ?? [];
  const ageMaximum = Math.max(
    100,
    Math.ceil(Math.max(0, ...ageGroups.map(({ count }) => count)) / 100) * 100,
  );
  const pageCount = Math.max(1, Math.ceil(filteredApplications.length / 5));
  const visibleApplications = filteredApplications.slice(
    (page - 1) * 5,
    page * 5,
  );

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.titleIcon}>
          <Icon name="document" />
        </span>
        <div>
          <h1>Enrollment Management</h1>
          <p>
            Manage and track enrollment applications and admissions for all
            Child Development Centers.
          </p>
        </div>
      </header>
      {(loadError || overviewError) && (
        <p className={styles.errorState} role="alert">
          {[loadError, overviewError]
            .filter(Boolean)
            .join(' ')}
          {(applications.length > 0 || overview) &&
            ' Showing the most recently loaded data where available.'}
        </p>
      )}

      <section aria-label="Enrollment overview" className={styles.stats}>
        <article className={`${styles.statCard} ${styles.statBlue}`}>
          <span className={styles.statIcon}>
            <Icon name="user" />
          </span>
          <div>
            <span>Total Applicants</span>
            <strong>
              {formatMetric(stats?.total_applicants, overviewLoading)}
            </strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.statTeal}`}>
          <span className={styles.statIcon}>
            <Icon name="check" />
          </span>
          <div>
            <span>Enrolled Children</span>
            <strong>
              {formatMetric(stats?.enrolled_children, overviewLoading)}
            </strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.statGold}`}>
          <span className={styles.statIcon}>
            <Icon name="clock" />
          </span>
          <div>
            <span>Pending Applications</span>
            <strong>
              {formatMetric(stats?.pending_applications, overviewLoading)}
            </strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.statPink}`}>
          <span className={styles.statIcon}>
            <Icon name="reject" />
          </span>
          <div>
            <span>Rejected Applications</span>
            <strong>
              {formatMetric(stats?.rejected_applications, overviewLoading)}
            </strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <section
            aria-labelledby="trend-title"
            className={`${styles.panel} ${styles.trendPanel}`}
          >
            <div className={styles.panelHeader}>
              <h2 id="trend-title">Enrollment Trend</h2>
              <label className={styles.yearSelect}>
                <span className={styles.visuallyHidden}>
                  Enrollment time range
                </span>
                <span aria-hidden="true">▣</span>
                <select
                  onChange={(event) => {
                    setYear(event.target.value);
                    setPage(1);
                  }}
                  value={year}
                >
                  <option>This School Year</option>
                  <option>Last School Year</option>
                </select>
                <Icon name="chevron" />
              </label>
            </div>
            <div className={styles.chartLegend}>
              <span>
                <i className={styles.newLegend} />
                Applications
              </span>
              <span>
                <i className={styles.totalLegend} />
                Approvals
              </span>
            </div>
            {overviewLoading && (
              <p className={styles.chartMessage}><BouncingDots label="Loading enrollment data" /></p>
            )}
            {!overviewLoading && !overview && overviewError && (
              <p className={styles.chartMessage}>{overviewError}</p>
            )}
            {overview &&
              monthlyTrend.every(
                ({ applications: total, approvals }) =>
                  total === 0 && approvals === 0,
              ) && (
                <p className={styles.chartMessage}>
                  No enrollment activity recorded for {selectedSchoolYear}.
                </p>
              )}
            {overview && <TrendChart data={monthlyTrend} />}
          </section>

          <section
            aria-labelledby="applications-title"
            className={`${styles.panel} ${styles.applicationsPanel}`}
          >
            <div className={styles.panelHeader}>
              <h2 id="applications-title">Recent Enrollment Applications</h2>
              <span className={styles.viewAll}>Updates automatically</span>
            </div>
            <label className={styles.applicationSearch}>
              <Icon name="search" />
              <input
                aria-label="Search applications"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search applications..."
                type="search"
                value={query}
              />
            </label>
            <div className={styles.tableWrap}>
              <table className={styles.applicationTable}>
                <thead>
                  <tr>
                    <th scope="col">Child Name</th>
                    <th scope="col">Age</th>
                    <th scope="col">Gender</th>
                    <th scope="col">Requested CDC</th>
                    <th scope="col">Assigned Teacher</th>
                    <th scope="col">Application Date</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleApplications.map((application, index) => {
                    const statusClass =
                      application.status === 'Under Review'
                        ? 'statusUnderReview'
                        : application.status === 'Returned for Correction'
                          ? 'statusReturned'
                          : application.status === 'Approved'
                            ? 'statusApproved'
                            : application.status === 'Rejected'
                              ? 'statusRejected'
                              : 'statusPending';
                    return (
                      <tr key={application.id}>
                        <td data-label="Child Name">
                          <span
                            className={`${styles.childAvatar} ${styles[`avatar${index % 4}`]}`}
                          >
                            <Icon name="user" />
                          </span>
                          <strong>{application.name}</strong>
                        </td>
                        <td data-label="Age">{application.age} years</td>
                        <td data-label="Gender">{application.gender}</td>
                        <td data-label="Requested CDC">{application.center}</td>
                        <td data-label="Assigned Teacher">
                          {application.assignedTeacherName || 'Not assigned'}
                        </td>
                        <td data-label="Application Date">
                          {application.date}
                        </td>
                        <td data-label="Status">
                          <span
                            className={`${styles.status} ${styles[statusClass]}`}
                          >
                            {application.status}
                          </span>
                        </td>
                        <td data-label="Actions">
                          <button
                            className={styles.more}
                            type="button"
                            onClick={() => setSelectedApplication(application)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {loading && (
                    <tr>
                      <td className={styles.emptyState} colSpan={8}>
                        <BouncingDots label="Loading applications" />
                      </td>
                    </tr>
                  )}
                  {loadError && applications.length === 0 && (
                    <tr>
                      <td
                        className={styles.emptyState}
                        colSpan={8}
                        role="alert"
                      >
                        {loadError}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !loadError &&
                    visibleApplications.length === 0 && (
                      <tr>
                        <td className={styles.emptyState} colSpan={8}>
                          {applications.length
                            ? 'No applications match this year or search.'
                            : 'No enrollment applications have been submitted.'}
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
            <footer className={styles.tableFooter}>
              <span>
                Showing {filteredApplications.length ? (page - 1) * 5 + 1 : 0}–
                {Math.min(page * 5, filteredApplications.length)} of{' '}
                {filteredApplications.length} applications
              </span>
              <span>Refreshes every 15 seconds</span>
              <nav aria-label="Application pages" className={styles.pagination}>
                <button
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
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
                    setPage((value) => Math.min(pageCount, value + 1))
                  }
                  type="button"
                >
                  ›
                </button>
              </nav>
            </footer>
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <section
            aria-labelledby="gender-title"
            className={`${styles.panel} ${styles.genderPanel}`}
          >
            <div className={styles.panelHeader}>
              <h2 id="gender-title">Enrollment by Gender</h2>
            </div>
            {overviewLoading && (
              <p className={styles.chartMessage}><BouncingDots label="Loading enrolled children" /></p>
            )}
            {!overviewLoading && overview && (
              <GenderChart
                gender={gender}
                total={stats?.enrolled_children ?? 0}
              />
            )}
            {!overviewLoading && !overview && overviewError && (
              <p className={styles.chartMessage}>{overviewError}</p>
            )}
          </section>
          <section
            aria-labelledby="age-title"
            className={`${styles.panel} ${styles.agePanel}`}
          >
            <div className={styles.panelHeader}>
              <h2 id="age-title">Enrollment by Age Group</h2>
            </div>
            {overviewLoading && (
              <p className={styles.chartMessage}><BouncingDots label="Loading enrolled children" /></p>
            )}
            {!overviewLoading && !overview && overviewError && (
              <p className={styles.chartMessage}>{overviewError}</p>
            )}
            {overview && (
              <div
                aria-label="Children enrolled by age group"
                className={styles.ageChart}
                role="img"
              >
                <div aria-hidden="true" className={styles.ageYAxis}>
                  {[4, 3, 2, 1, 0].map((step) => (
                    <span key={step}>
                      {Math.round((ageMaximum * step) / 4)}
                    </span>
                  ))}
                </div>
                <div className={styles.agePlot}>
                  <div aria-hidden="true" className={styles.ageGrid}>
                    {[0, 1, 2, 3, 4].map((line) => (
                      <span key={line} />
                    ))}
                  </div>
                  <div className={styles.ageBars}>
                    {ageGroups.map((group, index) => {
                      const barHeight = (group.count / ageMaximum) * 100;
                      const tones = ['blue', 'teal', 'gold', 'purple', 'pink'];
                      return (
                        <div className={styles.ageBarGroup} key={group.label}>
                          <strong
                            style={{
                              bottom: `calc(1.2rem + ${barHeight}%)`,
                            }}
                          >
                            {group.count.toLocaleString()}
                          </strong>
                          <span
                            className={styles[`bar${tones[index] ?? 'blue'}`]}
                            style={{ height: `${barHeight}%` }}
                          />
                          <span>
                            {group.label}
                            <small>years</small>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
          <section
            aria-labelledby="activities-title"
            className={`${styles.panel} ${styles.activityPanel}`}
          >
            <div className={styles.panelHeader}>
              <h2 id="activities-title">Recent Activities</h2>
            </div>
            <div className={styles.activities}>
              {overviewLoading ? (
                <p className={styles.chartMessage}>
                  <BouncingDots label="Loading recent applications" />
                </p>
              ) : activities.length ? (
                activities.map((activity, index) => {
                  const status = activity.status.toLowerCase();
                  const icon =
                    status === 'approved'
                      ? 'check'
                      : status === 'rejected'
                        ? 'reject'
                        : status === 'under_review'
                          ? 'clock'
                          : 'user';
                  const tone =
                    status === 'approved'
                      ? 'teal'
                      : status === 'rejected'
                        ? 'pink'
                        : status === 'under_review'
                          ? 'gold'
                          : 'blue';
                  return (
                    <article
                      className={styles.activity}
                      key={`${activity.application_number}:${activity.occurred_at}:${index}`}
                    >
                      <span
                        className={`${styles.activityIcon} ${styles[`activity${tone}`]}`}
                      >
                        <Icon name={icon} />
                      </span>
                      <span className={styles.activityText}>
                        <strong>Application {status.replace('_', ' ')}</strong>
                        <span>
                          {activity.child_name} · {activity.application_number}
                        </span>
                      </span>
                      <time dateTime={activity.occurred_at}>
                        {relativeTime(activity.occurred_at)}
                      </time>
                    </article>
                  );
                })
              ) : (
                <p className={styles.chartMessage}>
                  {overviewError || 'No enrollment activity has been recorded.'}
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
      {selectedApplication && (
        <EnrollmentApplicationDetails
          applicationId={selectedApplication.id}
          childId={selectedApplication.childId}
          role="admin"
          onClose={() => setSelectedApplication(null)}
          onReviewed={async () => {
            await loadApplications();
          }}
        />
      )}
    </section>
  );
}
