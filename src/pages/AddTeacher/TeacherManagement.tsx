import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { routePaths } from '../../constants/app-constants';
import styles from './TeacherManagement.module.css';

type Teacher = {
  id: number;
  name: string;
  gender: string;
  position: string;
  center: string;
  requested_center: string | null;
  email: string;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  education: string | null;
  certification: string | null;
  employee_number: string | null;
  account_active: boolean;
  status: 'pending_review' | 'under_review' | 'revision_required' | 'approved_awaiting_acceptance' | 'rejected' | 'active' | 'deactivated';
  email_status: 'pending' | 'sent' | 'failed' | 'accepted' | null;
  message_sent_at: string | null;
  email_error: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  nationality: string | null;
  years_of_service: string | null;
  skills: string | null;
  languages: string | null;
  created_at: string;
};

type TeacherReviewHistory = {
  id: number;
  status: string;
  message: string;
  created_at: string;
  reviewer: string | null;
  reviewer_role: string | null;
  review_snapshot: string | null;
};

type TeacherDocument = {
  id: number;
  original_name: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  download_url: string;
};

type TeacherDetails = Teacher & {
  username: string;
  middle_name: string | null;
  employment_status: string | null;
  verification_status: Teacher['status'];
  review_history: TeacherReviewHistory[];
  documents: TeacherDocument[];
};

type TeacherOverview = {
  data: {
    stats: {
      total: number;
      pending_review: number;
      under_review: number;
      revision_required: number;
      approved: number;
      rejected: number;
      assigned: number;
    };
    teachers: Teacher[];
    positions: { name: string; count: number }[];
    gender: { male: number; female: number; other: number };
  };
};

function teacherNumber(id: number) {
  return `TCH-${String(id).padStart(4, '0')}`;
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

function profileSnapshot(value: string | null) {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const snapshot: Record<string, string | number | null> = {};
    for (const [key, entry] of Object.entries(parsed)) {
      if (typeof entry === 'string' || typeof entry === 'number' || entry === null) {
        snapshot[key] = entry;
      }
    }
    return snapshot;
  } catch {
    return null;
  }
}

function revisionComparison(history: TeacherReviewHistory[]) {
  let revisionIndex = -1;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].status === 'Revision Required' && history[index].review_snapshot) {
      revisionIndex = index;
      break;
    }
  }
  if (revisionIndex < 0) return [];
  const resubmission = history
    .slice(revisionIndex + 1)
    .find((event) => event.status === 'Under Review' && event.review_snapshot);
  if (!resubmission) return [];
  const previous = profileSnapshot(history[revisionIndex].review_snapshot);
  const updated = profileSnapshot(resubmission.review_snapshot);
  if (!previous || !updated) return [];
  const labels: Record<string, string> = {
    first_name: 'First Name',
    middle_name: 'Middle Name',
    last_name: 'Last Name',
    phone: 'Phone Number',
    gender: 'Gender',
    birth_date: 'Date of Birth',
    nationality: 'Nationality',
    home_address: 'Complete Address',
    education: 'Educational Attainment',
    certification: 'Certification',
    years_of_service: 'Years of Service',
    skills: 'Skills',
    languages: 'Languages',
    cdc_id: 'Assigned CDC ID',
  };
  return Object.entries(labels)
    .filter(([key]) => (previous[key] ?? '') !== (updated[key] ?? ''))
    .map(([key, label]) => ({
      key,
      label,
      previous: previous[key] ?? 'Not provided',
      updated: updated[key] ?? 'Not provided',
    }));
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
  if (name === 'filter') {
    return (
      <svg {...base}>
        <path d="M4 6h16M7 12h10m-7 6h4" />
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
  if (name === 'teacher') {
    return (
      <svg {...base}>
        <circle cx="12" cy="7" r="3" />
        <path d="M5 20v-1a7 7 0 0 1 14 0v1M9 13l3 2 3-2" />
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
  if (name === 'reject') {
    return (
      <svg {...base}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6m0-6-6 6" />
      </svg>
    );
  }
  return (
    <svg {...base}>
      <circle cx="12" cy="8" r="3" />
      <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
    </svg>
  );
}

export function TeacherManagement() {
  const { request, download } = useAuth();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('');
  const [center, setCenter] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [positions, setPositions] = useState<TeacherOverview['data']['positions']>([]);
  const [stats, setStats] = useState<TeacherOverview['data']['stats'] | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherDetails | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);
  const openedTeacherParam = useRef('');

  const reload = useCallback(async (isActive: () => boolean = () => true) => {
    const requestId = ++latestRequest.current;
    try {
      const response = await request<TeacherOverview>('/api/admin/teachers');
      if (requestId !== latestRequest.current || !isActive()) return;
      if (
        !response.data ||
        !Array.isArray(response.data.teachers) ||
        !Array.isArray(response.data.positions) ||
        !response.data.stats ||
        !response.data.gender
      ) {
        throw new Error('The server returned invalid teacher records.');
      }
      setTeachers(response.data.teachers);
      setPositions(response.data.positions);
      setStats(response.data.stats);
      setError('');
    } catch (loadError) {
      if (requestId === latestRequest.current && isActive()) {
        setError(loadError instanceof Error ? loadError.message : 'Teachers could not be loaded.');
      }
    } finally {
      if (requestId === latestRequest.current && isActive()) setLoading(false);
    }
  }, [request]);

  async function selectTeacher(teacher: Teacher) {
    setReviewLoading(true);
    setReviewMessage('');
    setReviewError(false);
    try {
      const response = await request<{ data: TeacherDetails }>(
        `/api/admin/teachers/${teacher.id}`,
      );
      setSelectedTeacher(response.data);
      setReviewNote('');
    } catch (error) {
      setReviewMessage(
        error instanceof Error ? error.message : 'Teacher details could not be loaded.',
      );
      setReviewError(true);
    } finally {
      setReviewLoading(false);
    }
  }

  async function submitReview(action: 'approve' | 'reject') {
    if (!selectedTeacher || reviewSaving) return;
    if (action === 'reject' && !reviewNote.trim()) {
      setReviewMessage('Enter a reason for rejecting the teacher registration.');
      setReviewError(true);
      return;
    }
    const actionLabel = action === 'approve' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${selectedTeacher.name}?`)) return;

    setReviewSaving(true);
    setReviewMessage('');
    setReviewError(false);
    try {
      const result = await request<{
        data: {
          email_delivery: { sent: boolean; reason: string | null };
          verification_status: Teacher['status'];
        };
      }>(`/api/admin/teachers/${selectedTeacher.id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ action, note: reviewNote.trim() }),
      });
      const emailDelivery = result.data.email_delivery;
      await reload();
      await selectTeacher(selectedTeacher);
      setReviewMessage(
        emailDelivery.sent
          ? 'Review saved and the email was accepted by the configured mail provider.'
          : `Review saved, but the email was not sent: ${emailDelivery.reason ?? 'The configured mail provider is unavailable.'}`,
      );
      setReviewError(!emailDelivery.sent);
    } catch (error) {
      setReviewMessage(
        error instanceof Error ? error.message : 'Teacher review could not be saved.',
      );
      setReviewError(true);
    } finally {
      setReviewSaving(false);
    }
  }

  async function sendApprovalMessage() {
    if (!selectedTeacher || reviewSaving) return;
    if (!window.confirm(`Send the approval message to ${selectedTeacher.email}?`)) return;
    setReviewSaving(true);
    setReviewMessage('');
    setReviewError(false);
    try {
      const result = await request<{
        data: {
          email_delivery: { sent: boolean; reason: string | null };
          verification_status: Teacher['status'];
          is_active: boolean;
        };
      }>(`/api/admin/teachers/${selectedTeacher.id}/message`, { method: 'POST' });
      await reload();
      await selectTeacher(selectedTeacher);
      setReviewMessage(
        result.data.email_delivery.sent
          ? result.data.is_active
            ? 'Approval message sent. Teacher account access is now enabled.'
            : 'Approval message sent.'
          : `The approval message was not sent. Teacher account access remains disabled: ${result.data.email_delivery.reason ?? 'The configured mail provider is unavailable.'}`,
      );
      setReviewError(!result.data.email_delivery.sent);
    } catch (error) {
      setReviewMessage(error instanceof Error ? error.message : 'The approval message could not be sent.');
      setReviewError(true);
    } finally {
      setReviewSaving(false);
    }
  }

  async function downloadTeacherDocument(document: TeacherDocument) {
    setDownloadingDocumentId(document.id);
    setReviewMessage('');
    setReviewError(false);
    try {
      const file = await download(document.download_url);
      const objectUrl = URL.createObjectURL(file);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = document.original_name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      setReviewMessage(
        error instanceof Error ? error.message : 'Teacher document could not be downloaded.',
      );
      setReviewError(true);
    } finally {
      setDownloadingDocumentId(null);
    }
  }

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

  useEffect(() => {
    const teacherId = searchParams.get('teacherId');
    if (!teacherId || openedTeacherParam.current === teacherId) return;
    openedTeacherParam.current = teacherId;
    let active = true;
    setReviewLoading(true);
    void request<{ data: TeacherDetails }>(`/api/admin/teachers/${encodeURIComponent(teacherId)}`)
      .then((response) => {
        if (!active) return;
        setSelectedTeacher(response.data);
        setReviewNote('');
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setReviewMessage(
          loadError instanceof Error ? loadError.message : 'Teacher details could not be loaded.',
        );
        setReviewError(true);
      })
      .finally(() => {
        if (active) setReviewLoading(false);
      });
    return () => { active = false; };
  }, [request, searchParams]);

  const filteredTeachers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const matchesQuery =
        !normalizedQuery ||
        [teacherNumber(teacher.id), teacher.name, teacher.center].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const teacherStatus =
        teacher.status === 'approved_awaiting_acceptance'
          ? 'approved awaiting message'
          : teacher.status.replaceAll('_', ' ').toLowerCase();
      return (
        matchesQuery &&
        (!position || teacher.position === position) &&
        (!center || teacher.center === center) &&
        (!status || teacherStatus === status.toLowerCase())
      );
    });
  }, [center, position, query, status, teachers]);
  const pageCount = Math.max(1, Math.ceil(filteredTeachers.length / 10));
  const visibleTeachers = filteredTeachers.slice((page - 1) * 10, page * 10);
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pageNumbers = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => firstPage + index,
  );

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  const teacherStatusLabel = (teacherStatus: Teacher['status']) =>
    teacherStatus === 'approved_awaiting_acceptance'
      ? 'Approved Awaiting Message'
      : teacherStatus.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  const profileChanges = selectedTeacher
    ? revisionComparison(selectedTeacher.review_history)
    : [];

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.titleIcon}>
          <Icon name="teacher" />
        </span>
        <div>
          <h1>Teacher Management</h1>
          <p>
            Review and verify teacher accounts before granting access to the system.
          </p>
        </div>
      </header>
      {error && (
        <p className={styles.errorState} role="alert">
          {error}
          {teachers.length > 0 && ' Showing the most recently loaded data.'}
        </p>
      )}

      <section aria-label="Teacher overview" className={styles.stats}>
        <article className={`${styles.statCard} ${styles.blue}`}>
          <span className={styles.statIcon}>
            <Icon name="teacher" />
          </span>
          <div>
            <span>Total Teachers</span>
            <strong>{stats?.total?.toLocaleString() ?? (loading ? '…' : '—')}</strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.teal}`}>
          <span className={styles.statIcon}>
            <Icon name="check" />
          </span>
          <div>
            <span>Pending Review</span>
            <strong>{stats?.pending_review?.toLocaleString() ?? (loading ? '…' : '—')}</strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.gold}`}>
          <span className={styles.statIcon}>
            <Icon name="clock" />
          </span>
          <div>
            <span>Approved</span>
            <strong>{stats?.approved?.toLocaleString() ?? (loading ? '…' : '—')}</strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.pink}`}>
          <span className={styles.statIcon}>
            <Icon name="reject" />
          </span>
          <div>
            <span>Rejected</span>
            <strong>{stats?.rejected?.toLocaleString() ?? (loading ? '…' : '—')}</strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section
          aria-label="Teacher directory"
          className={`${styles.panel} ${styles.directoryPanel}`}
        >
          <div className={styles.directoryHeader}>
            <h2>Teacher Directory</h2>
            <div className={styles.directoryTools}>
              <label className={styles.search}>
                <Icon name="search" />
                <input
                  aria-label="Search teacher name, ID, or CDC"
                  onChange={(event) =>
                    updateFilter(setQuery, event.target.value)
                  }
                  placeholder="Search teacher name, ID, or CDC..."
                  type="search"
                  value={query}
                />
              </label>
              <Link className={styles.addButton} to={routePaths.addTeacher}>
                <span aria-hidden="true">+</span>Add Teacher
              </Link>
            </div>
          </div>
          <div className={styles.moreFilters}>
            <label className={styles.filterSelect}>
              <span className={styles.visuallyHidden}>Filter by position</span>
              <select
                aria-label="Filter by position"
                onChange={(event) =>
                  updateFilter(setPosition, event.target.value)
                }
                value={position}
              >
                <option value="">All Positions</option>
                {positions.map((item) => <option key={item.name}>{item.name}</option>)}
              </select>
              <Icon name="chevron" />
            </label>
            <label className={styles.filterSelect}>
              <span className={styles.visuallyHidden}>Filter by center</span>
              <select
                aria-label="Filter by center"
                onChange={(event) =>
                  updateFilter(setCenter, event.target.value)
                }
                value={center}
              >
                <option value="">All Centers</option>
                {[...new Set(teachers.map((teacher) => teacher.center))]
                  .sort((left, right) => left.localeCompare(right))
                  .map((item) => <option key={item}>{item}</option>)}
              </select>
              <Icon name="chevron" />
            </label>
            <label className={styles.filterSelect}>
              <span className={styles.visuallyHidden}>Filter by status</span>
              <select
                aria-label="Filter by status"
                onChange={(event) =>
                  updateFilter(setStatus, event.target.value)
                }
                value={status}
              >
                <option value="">All Statuses</option>
                <option>Pending Review</option>
                <option>Under Review</option>
                <option>Revision Required</option>
                <option>Approved Awaiting Message</option>
                <option>Rejected</option>
                <option>Active</option>
                <option>Deactivated</option>
              </select>
              <Icon name="chevron" />
            </label>
            <button
              className={styles.clearFilters}
              onClick={() => {
                setQuery('');
                setPosition('');
                setCenter('');
                setStatus('');
                setPage(1);
              }}
              type="button"
            >
              <Icon name="filter" />
              <span>Clear filters</span>
            </button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.teacherTable}>
              <thead>
                <tr>
                  <th scope="col">Teacher ID</th>
                  <th scope="col">Full Name</th>
                  <th scope="col">Gender</th>
                  <th scope="col">Position</th>
                  <th scope="col">Assigned CDC</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && teachers.length === 0 && (
                  <tr><td className={styles.emptyState} colSpan={7}>Loading teacher records…</td></tr>
                )}
                {!loading && error && teachers.length === 0 && (
                  <tr><td className={styles.emptyState} colSpan={7} role="alert">{error}</td></tr>
                )}
                {visibleTeachers.map((teacher, index) => (
                  <tr key={teacher.id}>
                    <td data-label="Teacher ID">{teacherNumber(teacher.id)}</td>
                    <td data-label="Full Name">
                      <span
                        className={`${styles.avatar} ${styles[`avatar${index % 4}`]}`}
                      >
                        <Icon name="user" />
                      </span>
                      <strong>{teacher.name}</strong>
                    </td>
                    <td data-label="Gender">{teacher.gender}</td>
                    <td data-label="Position">{teacher.position}</td>
                    <td data-label="Assigned CDC">
                      {teacher.center}
                      {teacher.requested_center && (
                        <small className={styles.requestedCenter}>Requested: {teacher.requested_center}</small>
                      )}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`${styles.status} ${styles[`status${teacherStatusLabel(teacher.status).replaceAll(' ', '')}`]}`}
                      >
                        {teacherStatusLabel(teacher.status)}
                      </span>
                    </td>
                    <td data-label="Action">
                      <button
                        className={styles.reviewButton}
                        onClick={() => void selectTeacher(teacher)}
                        type="button"
                      >
                        {['pending_review', 'under_review', 'revision_required'].includes(teacher.status)
                          ? 'Review'
                          : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && (!error || teachers.length > 0) && visibleTeachers.length === 0 && (
                  <tr>
                    <td className={styles.emptyState} colSpan={7}>
                      {error || (teachers.length
                        ? 'No teachers match the selected filters.'
                        : 'No teacher records are stored in the database.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className={styles.tableFooter}>
            <span>
              Showing {filteredTeachers.length ? (page - 1) * 10 + 1 : 0}–
              {Math.min(page * 10, filteredTeachers.length)} of{' '}
              {filteredTeachers.length} teachers
            </span>
            {!error && <span className={styles.refreshHint}>Refreshes every 15 seconds</span>}
            <nav
              aria-label="Teacher directory pages"
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

        <aside aria-label="Teacher review" className={`${styles.panel} ${styles.reviewPanel}`}>
          <div className={styles.panelHeader}>
            <h2>Teacher Review</h2>
          </div>
          {reviewLoading ? (
            <p className={styles.sideState}>Loading teacher details…</p>
          ) : !selectedTeacher ? (
            <p className={styles.sideState}>
              Select Review or View from the directory to inspect a teacher account.
            </p>
          ) : (
            <>
              <header className={styles.reviewIdentity}>
                <span className={styles.reviewAvatar}><Icon name="user" /></span>
                <div>
                  <h3>{selectedTeacher.name}</h3>
                  <span>{teacherNumber(selectedTeacher.id)} · {selectedTeacher.gender} · {selectedTeacher.position}</span>
                  <span>{teacherStatusLabel(selectedTeacher.status)}</span>
                </div>
              </header>

              <section className={styles.reviewSection}>
                <h3>Personal Information</h3>
                <dl className={styles.reviewDetails}>
                  <div><dt>Teacher ID</dt><dd>{teacherNumber(selectedTeacher.id)}</dd></div>
                  <div><dt>Full Name</dt><dd>{selectedTeacher.name}</dd></div>
                  <div><dt>Gender</dt><dd>{selectedTeacher.gender || 'Not provided'}</dd></div>
                  <div><dt>Date of Birth</dt><dd>{selectedTeacher.birth_date || 'Not provided'}</dd></div>
                  <div><dt>Phone Number</dt><dd>{selectedTeacher.phone || 'Not provided'}</dd></div>
                  <div><dt>Email Address</dt><dd>{selectedTeacher.email || 'Not provided'}</dd></div>
                  <div><dt>Address</dt><dd>{selectedTeacher.address || 'Not provided'}</dd></div>
                  <div><dt>Nationality</dt><dd>{selectedTeacher.nationality || 'Not provided'}</dd></div>
                </dl>
              </section>

              <section className={styles.reviewSection}>
                <h3>Professional Information</h3>
                <dl className={styles.reviewDetails}>
                  <div><dt>Position</dt><dd>{selectedTeacher.position || 'Not provided'}</dd></div>
                  <div><dt>Assigned CDC</dt><dd>{selectedTeacher.center || 'Unassigned'}</dd></div>
                  <div><dt>Requested CDC</dt><dd>{selectedTeacher.requested_center || 'Not specified'}</dd></div>
                  <div><dt>Educational Attainment</dt><dd>{selectedTeacher.education || 'Not provided'}</dd></div>
                  <div><dt>Certification</dt><dd>{selectedTeacher.certification || 'Not provided'}</dd></div>
                  <div><dt>Years of Service</dt><dd>{selectedTeacher.years_of_service || 'Not provided'}</dd></div>
                  <div><dt>Skills</dt><dd>{selectedTeacher.skills || 'Not provided'}</dd></div>
                  <div><dt>Languages</dt><dd>{selectedTeacher.languages || 'Not provided'}</dd></div>
                  <div><dt>Employee Number</dt><dd>{selectedTeacher.employee_number || 'Not provided'}</dd></div>
                  <div><dt>Last Review / Resubmission</dt><dd>{selectedTeacher.reviewed_at ? new Date(selectedTeacher.reviewed_at.replace(' ', 'T')).toLocaleString() : 'Not submitted'}</dd></div>
                </dl>
              </section>

              {profileChanges.length > 0 && (
                <section className={styles.reviewSection}>
                  <h3>Changes Since Revision Request</h3>
                  <dl className={styles.reviewDetails}>
                    {profileChanges.map((change) => (
                      <div key={change.key}>
                        <dt>{change.label}</dt>
                        <dd><del>{String(change.previous)}</del> → {String(change.updated)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              <section className={styles.reviewSection}>
                <h3>Documents</h3>
                {selectedTeacher.documents.length === 0 ? (
                  <p className={styles.sideState}>No supporting employment document was submitted.</p>
                ) : (
                  <ul className={styles.documentList}>
                    {selectedTeacher.documents.map((document) => (
                      <li key={document.id}>
                        <div>
                          <strong>{document.original_name}</strong>
                          <span>
                            {document.mime_type} · {(document.file_size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <button
                          disabled={downloadingDocumentId !== null}
                          onClick={() => void downloadTeacherDocument(document)}
                          type="button"
                        >
                          {downloadingDocumentId === document.id ? 'Downloading…' : 'Download'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className={styles.reviewSection}>
                <h3>Notes &amp; Review</h3>
                {['approved_awaiting_acceptance', 'active'].includes(selectedTeacher.status) && (
                  <div className={styles.messageStatus}>
                    <strong>Approval message</strong>
                    <span>
                      Email status: {selectedTeacher.email_status ?? 'not sent'}
                      {selectedTeacher.message_sent_at
                        ? ` · ${relativeTime(selectedTeacher.message_sent_at)}`
                        : ''}
                    </span>
                    {selectedTeacher.email_error && <span>{selectedTeacher.email_error}</span>}
                    <button
                      className={styles.reviewButton}
                      disabled={reviewSaving}
                      onClick={() => void sendApprovalMessage()}
                      type="button"
                    >
                      {reviewSaving ? 'Sending…' : 'Send message'}
                    </button>
                  </div>
                )}
                <label className={styles.reviewNoteField}>
                  <span>Admin notes</span>
                  <textarea
                    maxLength={3000}
                    onChange={(event) => setReviewNote(event.target.value)}
                    placeholder="Add review notes or the reason for rejection."
                    rows={4}
                    value={reviewNote}
                  />
                </label>
                {selectedTeacher.review_history.length > 0 && (
                  <ol className={styles.reviewHistory}>
                    {selectedTeacher.review_history.map((event) => (
                      <li key={event.id}>
                        <strong>{event.status}</strong>
                        <time dateTime={event.created_at}>{relativeTime(event.created_at)}</time>
                        <p>{event.message}</p>
                        {(event.reviewer || event.reviewer_role) && (
                          <small>
                            {event.reviewer ?? 'KalingaLink'}
                            {event.reviewer_role ? ` · ${event.reviewer_role}` : ''}
                          </small>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <div className={styles.reviewActions}>
                <button
                  className={styles.approveButton}
                  disabled={reviewSaving || ['active', 'deactivated', 'approved_awaiting_acceptance'].includes(selectedTeacher.status)}
                  onClick={() => void submitReview('approve')}
                  type="button"
                >
                  <Icon name="check" /> Approve
                </button>
                <button
                  className={styles.rejectButton}
                  disabled={reviewSaving || selectedTeacher.status === 'rejected'}
                  onClick={() => void submitReview('reject')}
                  type="button"
                >
                  <Icon name="reject" /> Reject
                </button>
              </div>
              {reviewMessage && (
                <p className={reviewError ? styles.errorState : styles.reviewSuccess} role={reviewError ? 'alert' : 'status'}>
                  {reviewMessage}
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
