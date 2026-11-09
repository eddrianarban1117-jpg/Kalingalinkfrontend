import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import childrenBanner from '../../assets/images/children-banner.png';
import { useAuth } from '../../auth/AuthProvider';
import { EnrollmentApplicationDetails } from '../EnrollmentManagement/EnrollmentApplicationDetails';
import styles from './TeacherEnrollmentPage.module.css';

type ApplicationStatus = 'Pending' | 'Under Review' | 'Returned for Correction' | 'Approved' | 'Rejected';
type DetailTab = 'Application Info' | 'Documents' | 'Notes';

type EnrollmentApplication = {
  id: number;
  childId: number;
  number: string;
  childName: string;
  nickname: string;
  age: string;
  birthDate: string;
  gender: string;
  psaNumber: string;
  nationality: string;
  placeOfBirth: string;
  childAddress: string;
  bloodType: string;
  medicalCondition: string;
  allergies: string;
  immunizationStatus: string;
  className: string;
  parentName: string;
  relationship: string;
  email: string;
  phone: string;
  address: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  householdIncome: string;
  language: string;
  referral: string;
  center: string;
  dateApplied: string;
  submittedAt: string;
  reviewedAt: string;
  status: ApplicationStatus;
  enrollmentType: string;
  remarks: string;
  note: string;
  documents: {
    id: number;
    name: string;
    fileName: string | null;
    status: string;
    downloadUrl: string;
  }[];
  history: {
    from_status: string | null;
    to_status: string;
    note: string | null;
    created_at: string;
  }[];
};

const documentNames = [
  'Birth Certificate',
  'Proof of Residence',
  'Parent/Guardian ID',
  'Recent 2x2 ID Picture',
  'Barangay Clearance',
  'Medical Certificate',
];

type ApiApplication = {
  id: number;
  child_id: number;
  application_number: string;
  parent_name: string;
  parent_relationship: string;
  parent_email: string;
  parent_phone: string;
  parent_address: string;
  parent_birth_date: string | null;
  parent_gender: string | null;
  emergency_name: string;
  emergency_relationship: string;
  emergency_phone: string;
  household_income: string | null;
  preferred_language: string | null;
  referral_source: string | null;
  child_first_name: string;
  child_middle_name: string | null;
  child_last_name: string;
  child_nickname: string | null;
  child_birth_date: string;
  child_gender: string;
  psa_birth_certificate_number: string | null;
  child_nationality: string | null;
  place_of_birth: string | null;
  child_address: string | null;
  blood_type: string | null;
  medical_notes: string | null;
  allergies: string | null;
  immunization_status: string | null;
  child_class_name: string | null;
  cdc_name: string;
  status: string;
  documents_requested_at: string | null;
  enrollment_type: string;
  submitted_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  documents: {
    id: number;
    document_type: string;
    original_name: string;
    verification_status: string;
    download_url: string;
  }[];
  review_history: EnrollmentApplication['history'];
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

function getAge(value: string) {
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  )
    age -= 1;
  return `${Math.max(age, 0)} yrs`;
}

function mapApplication(record: ApiApplication): EnrollmentApplication {
  const status = record.status === 'under_review' && record.documents_requested_at
    ? 'Returned for Correction'
    : record.status.replace('_', ' ');
  return {
    id: record.id,
    childId: record.child_id,
    number: record.application_number,
    childName: [
      record.child_first_name,
      record.child_middle_name,
      record.child_last_name,
    ]
      .filter(Boolean)
      .join(' '),
    nickname: record.child_nickname ?? '',
    age: getAge(record.child_birth_date),
    birthDate: record.child_birth_date,
    gender: record.child_gender,
    psaNumber: record.psa_birth_certificate_number ?? '',
    nationality: record.child_nationality ?? '',
    placeOfBirth: record.place_of_birth ?? '',
    childAddress: record.child_address ?? '',
    bloodType: record.blood_type ?? '',
    medicalCondition: record.medical_notes ?? '',
    allergies: record.allergies ?? '',
    immunizationStatus: record.immunization_status ?? '',
    className: record.child_class_name ?? 'Not assigned',
    parentName: record.parent_name,
    relationship: record.parent_relationship,
    email: record.parent_email,
    phone: record.parent_phone,
    address: record.parent_address,
    emergencyName: record.emergency_name,
    emergencyRelationship: record.emergency_relationship,
    emergencyPhone: record.emergency_phone,
    householdIncome: record.household_income ?? '',
    language: record.preferred_language ?? '',
    referral: record.referral_source ?? '',
    center: record.cdc_name,
    dateApplied: formatDate(record.submitted_at),
    submittedAt: record.submitted_at,
    reviewedAt: record.reviewed_at ? formatDate(record.reviewed_at) : '',
    status:
      status === 'Returned for Correction'
        ? status
        : status === 'Under Review'
          ? 'Under Review'
        : ((status.charAt(0).toUpperCase() +
            status.slice(1)) as ApplicationStatus),
    enrollmentType:
      record.enrollment_type === 'reenrollment'
        ? 'Re-enrollment'
        : 'New Enrollment',
    remarks: record.review_note ?? '',
    note: record.review_note ?? '',
    documents: record.documents.map((document) => ({
      id: document.id,
      name:
        documentNames.find((name) =>
          document.document_type.includes(
            name.toLowerCase().replaceAll(' ', '_'),
          ),
        ) ?? document.document_type,
      fileName: document.original_name,
      status:
        document.verification_status === 'verified'
          ? 'Verified'
          : document.verification_status === 'rejected'
            ? 'Rejected'
            : 'Received',
      downloadUrl: document.download_url,
    })),
    history: record.review_history ?? [],
  };
}

const tabs: DetailTab[] = ['Application Info', 'Documents', 'Notes'];
const pageSize = 8;

function Icon({
  name,
}: {
  name:
    | 'application'
    | 'clock'
    | 'search'
    | 'check'
    | 'close'
    | 'calendar'
    | 'file';
}) {
  const base = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.9,
    viewBox: '0 0 24 24',
  };
  switch (name) {
    case 'clock':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'search':
      return (
        <svg {...base}>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
      );
    case 'check':
      return (
        <svg {...base}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case 'close':
      return (
        <svg {...base}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...base}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18" />
        </svg>
      );
    case 'file':
      return (
        <svg {...base}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6m-12 5h8m-8 4h6" />
        </svg>
      );
    default:
      return (
        <svg {...base}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6m-12 5h5m-5 4h5m3-1 3 3 4-5" />
        </svg>
      );
  }
}

function statusClass(status: ApplicationStatus) {
  return status === 'Returned for Correction'
    ? 'returnedforcorrection'
    : status.toLowerCase().replace(' ', '');
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value || 'Not provided'}</dd>
    </div>
  );
}

export function TeacherEnrollmentPage() {
  const { request, accessToken } = useAuth();
  const [applications, setApplications] = useState<EnrollmentApplication[]>([]);
  const [detailsApplication, setDetailsApplication] = useState<EnrollmentApplication | null>(null);
  const [selectedNumber, setSelectedNumber] = useState('');
  const selectedNumberRef = useRef('');
  const [selectedTab, setSelectedTab] = useState<DetailTab>('Application Info');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Enrollment Types');
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const reloadApplications = useCallback(
    async (initialLoad = false) => {
      if (initialLoad) setLoading(true);
      setLoadError('');
      try {
        const result = await request<{ data: ApiApplication[] }>(
          '/api/enrollments',
        );
        const records = (result.data ?? []).map(mapApplication);
        setApplications(records);
        const selectedStillExists = records.some(
          (record) => record.number === selectedNumberRef.current,
        );
        if (!selectedNumberRef.current || !selectedStillExists) {
          const nextNumber = records[0]?.number ?? '';
          selectedNumberRef.current = nextNumber;
          setSelectedNumber(nextNumber);
        }
      } catch (error: unknown) {
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Applications could not be loaded.',
        );
      } finally {
        if (initialLoad) setLoading(false);
      }
    },
    [request],
  );

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active && document.visibilityState === 'visible') {
        void reloadApplications();
      }
    };
    void reloadApplications(true);
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reloadApplications]);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications
      .filter((application) => {
        const matchesSearch =
          !term ||
          `${application.number} ${application.childName} ${application.parentName} ${application.email}`
            .toLowerCase()
            .includes(term);
        const matchesStatus =
          statusFilter === 'All Status' || application.status === statusFilter;
        const matchesType =
          typeFilter === 'All Enrollment Types' ||
          application.enrollmentType === typeFilter;
        const matchesDate =
          !dateFilter || application.submittedAt.slice(0, 10) === dateFilter;
        return matchesSearch && matchesStatus && matchesType && matchesDate;
      })
      .sort((first, second) => {
        const difference =
          new Date(first.submittedAt.replace(' ', 'T')).getTime() -
          new Date(second.submittedAt.replace(' ', 'T')).getTime();
        return sortOrder === 'newest' ? -difference : difference;
      });
  }, [applications, search, statusFilter, typeFilter, dateFilter, sortOrder]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredApplications.length / pageSize),
  );
  const visibleApplications = filteredApplications.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const selectedApplication =
    applications.find(({ number }) => number === selectedNumber) ?? null;
  const counts = {
    total: applications.length,
    pending: applications.filter(({ status }) => status === 'Pending').length,
    review: applications.filter(({ status }) => status === 'Under Review')
      .length,
    approved: applications.filter(({ status }) => status === 'Approved').length,
    rejected: applications.filter(({ status }) => status === 'Rejected').length,
  };

  function clearFilters() {
    setSearch('');
    setStatusFilter('All Status');
    setTypeFilter('All Enrollment Types');
    setDateFilter('');
    setSortOrder('newest');
    setPage(1);
  }

  function selectApplication(application: EnrollmentApplication) {
    selectedNumberRef.current = application.number;
    setSelectedNumber(application.number);
    setNotice('');
  }

  return (
    <main aria-label="Teacher enrollment management" className={styles.page}>
      <header
        className={styles.hero}
        style={{
          backgroundImage: `linear-gradient(90deg, #eaf6ff 0%, rgb(234 246 255 / 96%) 50%, rgb(234 246 255 / 20%) 100%), url("${childrenBanner}")`,
        }}
      >
        <span aria-hidden="true" className={styles.heroIcon}>
          <Icon name="application" />
        </span>
        <div>
          <h1>Enrollment Management</h1>
          <p>
            Review and manage enrollment applications from parents/guardians.
          </p>
          <p>
            Check the details, verify documents, and update the status of each
            application.
          </p>
        </div>
        <span aria-live="polite" className={styles.previewLabel}>
          {loadError
            ? 'Connection issue'
            : loading
              ? 'Loading applications'
              : 'Auto-refreshes every 15 seconds'}
        </span>
      </header>

      <section aria-label="Application summary" className={styles.stats}>
        <Summary
          icon="application"
          label="Total Applications"
          count={counts.total}
          tone="blue"
        />
        <Summary
          icon="clock"
          label="Pending"
          count={counts.pending}
          tone="orange"
        />
        <Summary
          icon="search"
          label="Under Review"
          count={counts.review}
          tone="sky"
        />
        <Summary
          icon="check"
          label="Approved"
          count={counts.approved}
          tone="green"
        />
        <Summary
          icon="close"
          label="Rejected"
          count={counts.rejected}
          tone="red"
        />
      </section>

      <section aria-label="Filter applications" className={styles.filters}>
        <label className={styles.searchFilter}>
          <Icon name="search" />
          <span className={styles.visuallyHidden}>Search applications</span>
          <input
            placeholder="Search by child's name, parent's name, or application number..."
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          <span className={styles.visuallyHidden}>Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option>All Status</option>
            <option>Pending</option>
            <option>Under Review</option>
            <option>Returned for Correction</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </label>
        <label>
          <span className={styles.visuallyHidden}>
            Filter by enrollment type
          </span>
          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPage(1);
            }}
          >
            <option>All Enrollment Types</option>
            <option>New Enrollment</option>
            <option>Re-enrollment</option>
          </select>
        </label>
        <label className={styles.dateFilter}>
          <Icon name="calendar" />
          <span className={styles.visuallyHidden}>Filter by date applied</span>
          <input
            aria-label="Filter by date applied"
            type="date"
            value={dateFilter}
            onChange={(event) => {
              setDateFilter(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          <span className={styles.visuallyHidden}>
            Sort applications by submission date
          </span>
          <select
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(
                event.target.value === 'oldest' ? 'oldest' : 'newest',
              );
              setPage(1);
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </label>
        <button
          className={styles.clearButton}
          type="button"
          onClick={clearFilters}
        >
          × <span>Clear Filters</span>
        </button>
      </section>

      <div className={styles.contentGrid}>
        <section
          aria-labelledby="application-list-title"
          className={styles.listPanel}
        >
          <header className={styles.listHeader}>
            <h2 id="application-list-title">
              Enrollment Applications ({filteredApplications.length})
            </h2>
          </header>
          {loading && (
            <p aria-live="polite" className={styles.emptyState}>
              Loading applications…
            </p>
          )}
          {loadError && (
            <p className={styles.loadError} role="alert">
              {loadError}
            </p>
          )}
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th>
                    <span className={styles.visuallyHidden}>Select</span>
                  </th>
                  <th>Application No.</th>
                  <th>Child's Name</th>
                  <th>Age</th>
                  <th>Parent/Guardian</th>
                  <th>Date Applied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleApplications.map((application) => (
                  <tr
                    className={
                      selectedNumber === application.number
                        ? styles.selectedRow
                        : ''
                    }
                    key={application.number}
                    onClick={() => selectApplication(application)}
                  >
                    <td>
                      <input
                        aria-label={`Select ${application.number}`}
                        checked={selectedNumber === application.number}
                        onChange={() => selectApplication(application)}
                        type="checkbox"
                      />
                    </td>
                    <td>
                      <strong className={styles.applicationNumber}>
                        {application.number}
                      </strong>
                    </td>
                    <td>
                      <span className={styles.childCell}>
                        <span className={styles.avatar}>
                          {application.childName
                            .split(' ')
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join('')}
                        </span>
                        <span>
                          <strong>{application.childName}</strong>
                          <small>
                            {application.nickname} · {application.age}
                          </small>
                        </span>
                      </span>
                    </td>
                    <td>{application.age}</td>
                    <td>
                      <span className={styles.parentCell}>
                        <span className={styles.avatar}>
                          {application.parentName
                            .split(' ')
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join('')}
                        </span>
                        <span>
                          <strong>{application.parentName}</strong>
                          <small>{application.phone}</small>
                        </span>
                      </span>
                    </td>
                    <td>{application.dateApplied}</td>
                    <td>
                      <StatusPill status={application.status} />
                    </td>
                    <td>
                      <button
                        className={styles.reviewButton}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          selectApplication(application);
                          setDetailsApplication(application);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && !loadError && !visibleApplications.length && (
                  <tr>
                    <td className={styles.emptyState} colSpan={8}>
                      No applications match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className={styles.tableFooter}>
            <span>
              Showing{' '}
              {filteredApplications.length ? (page - 1) * pageSize + 1 : 0}–
              {Math.min(page * pageSize, filteredApplications.length)} of{' '}
              {filteredApplications.length}
            </span>
            <nav aria-label="Application pages" className={styles.pagination}>
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

        {selectedApplication && (
          <aside
            aria-labelledby="application-details-title"
            className={styles.detailsPanel}
          >
            <header className={styles.detailsHeader}>
              <h2 id="application-details-title">Application Details</h2>
              <StatusPill status={selectedApplication.status} />
            </header>
            <p className={styles.detailsNumber}>{selectedApplication.number}</p>
            <div
              aria-label="Application detail sections"
              className={styles.tabs}
              role="tablist"
            >
              {tabs.map((tab) => (
                <button
                  aria-selected={selectedTab === tab}
                  className={selectedTab === tab ? styles.activeTab : ''}
                  id={`tab-${tab.replaceAll(' ', '-')}`}
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  role="tab"
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>
            <div
              aria-labelledby={`tab-${selectedTab.replaceAll(' ', '-')}`}
              className={styles.tabContent}
              role="tabpanel"
            >
              {selectedTab === 'Application Info' && (
                <>
                  <section className={styles.detailSection}>
                    <h3>Child Information</h3>
                    <Detail
                      label="Full Name"
                      value={selectedApplication.childName}
                    />
                    <Detail
                      label="Nickname"
                      value={selectedApplication.nickname}
                    />
                    <Detail label="Age" value={selectedApplication.age} />
                    <Detail
                      label="Birthday"
                      value={selectedApplication.birthDate}
                    />
                    <Detail label="Gender" value={selectedApplication.gender} />
                    <Detail
                      label="PSA Birth Certificate Number"
                      value={selectedApplication.psaNumber}
                    />
                    <Detail
                      label="Nationality"
                      value={selectedApplication.nationality}
                    />
                    <Detail
                      label="Place of Birth"
                      value={selectedApplication.placeOfBirth}
                    />
                    <Detail
                      label="Residential Address"
                      value={selectedApplication.childAddress}
                    />
                    <Detail
                      label="Blood Type"
                      value={selectedApplication.bloodType}
                    />
                    <Detail
                      label="Medical Conditions"
                      value={selectedApplication.medicalCondition}
                    />
                    <Detail
                      label="Allergies"
                      value={selectedApplication.allergies}
                    />
                    <Detail
                      label="Immunization Status"
                      value={selectedApplication.immunizationStatus}
                    />
                    <Detail
                      label="Class"
                      value={selectedApplication.className}
                    />
                  </section>
                  <section className={styles.detailSection}>
                    <h3>Parent / Guardian Information</h3>
                    <Detail
                      label="Name"
                      value={selectedApplication.parentName}
                    />
                    <Detail
                      label="Relationship"
                      value={selectedApplication.relationship}
                    />
                    <Detail label="Email" value={selectedApplication.email} />
                    <Detail label="Phone" value={selectedApplication.phone} />
                    <Detail
                      label="Address"
                      value={selectedApplication.address}
                    />
                    <Detail
                      label="Emergency Contact"
                      value={selectedApplication.emergencyName}
                    />
                    <Detail
                      label="Emergency Relationship"
                      value={selectedApplication.emergencyRelationship}
                    />
                    <Detail
                      label="Emergency Phone"
                      value={selectedApplication.emergencyPhone}
                    />
                  </section>
                  <section className={styles.applicationMeta}>
                    <h3>Enrollment Type</h3>
                    <strong>{selectedApplication.enrollmentType}</strong>
                    <Detail
                      label="Date Applied"
                      value={selectedApplication.dateApplied}
                    />
                    <Detail
                      label="Reviewed At"
                      value={selectedApplication.reviewedAt}
                    />
                    <Detail
                      label="Selected CDC"
                      value={selectedApplication.center}
                    />
                    <Detail
                      label="Household Income"
                      value={selectedApplication.householdIncome}
                    />
                    <Detail
                      label="Preferred Language"
                      value={selectedApplication.language}
                    />
                    <Detail
                      label="Referral Source"
                      value={selectedApplication.referral}
                    />
                    <Detail
                      label="Remarks"
                      value={selectedApplication.remarks}
                    />
                  </section>
                </>
              )}
              {selectedTab === 'Documents' && (
                <section className={styles.detailSection}>
                  <h3>Submitted Documents</h3>
                  <ul className={styles.documents}>
                    {selectedApplication.documents.map((record) => (
                      <li key={record.id}>
                        <Icon name="file" />
                        <span>
                          <strong>{record.name}</strong>
                          <small>{record.fileName}</small>
                          <a
                            href={record.downloadUrl}
                            onClick={async (event) => {
                              event.preventDefault();
                              try {
                                const response = await fetch(
                                  record.downloadUrl,
                                  {
                                    headers: accessToken
                                      ? {
                                          Authorization: `Bearer ${accessToken}`,
                                        }
                                      : {},
                                    credentials: 'include',
                                  },
                                );
                                if (!response.ok)
                                  throw new Error(
                                    'Document could not be opened.',
                                  );
                                const file = await response.blob();
                                const objectUrl = URL.createObjectURL(file);
                                const link = document.createElement('a');
                                link.href = objectUrl;
                                link.download = record.fileName ?? record.name;
                                link.click();
                                URL.revokeObjectURL(objectUrl);
                              } catch (error) {
                                setNotice(
                                  error instanceof Error
                                    ? error.message
                                    : 'Document could not be opened.',
                                );
                              }
                            }}
                          >
                            View / Download
                          </a>
                        </span>
                        <span className={styles.documentStatus}>
                          {record.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {selectedTab === 'Notes' && (
                <section className={styles.detailSection}>
                  <h3>Review Notes</h3>
                  <p className={styles.noteHistory}>
                    {selectedApplication.note || 'No review notes yet.'}
                  </p>
                  <p className={styles.emergencyDetails}>
                    Open Child Record Details to review the full history or take an action.
                  </p>
                </section>
              )}
            </div>
            {notice && (
              <p aria-live="polite" className={styles.notice} role="status">
                {notice}
              </p>
            )}
          </aside>
        )}
      </div>
      {detailsApplication && (
        <EnrollmentApplicationDetails
          applicationId={detailsApplication.id}
          childId={detailsApplication.childId}
          role="teacher"
          onClose={() => setDetailsApplication(null)}
          onReviewed={async () => { await reloadApplications(); }}
        />
      )}
    </main>
  );
}

function Summary({
  icon,
  label,
  count,
  tone,
}: {
  icon: 'application' | 'clock' | 'search' | 'check' | 'close';
  label: string;
  count: number;
  tone: string;
}) {
  return (
    <article className={`${styles.summaryCard} ${styles[tone]}`}>
      <span className={styles.summaryIcon}>
        <Icon name={icon} />
      </span>
      <span className={styles.summaryCopy}>
        <small>{label}</small>
        <strong>{count}</strong>
      </span>
    </article>
  );
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  const icon =
    status === 'Approved'
      ? 'check'
      : status === 'Rejected'
        ? 'close'
        : status === 'Under Review'
          ? 'search'
          : 'clock';
  return (
    <span className={`${styles.status} ${styles[statusClass(status)]}`}>
      <Icon name={icon} />
      {status}
    </span>
  );
}
