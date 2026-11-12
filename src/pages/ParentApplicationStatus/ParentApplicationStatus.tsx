import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import { routePaths } from '../../constants/app-constants';
import { EventNotifications } from '../EventNotifications/EventNotifications';
import childrenBanner from '../../assets/images/children-banner.png';
import femalePanel from '../../../femalepanel.png';
import styles from './ParentApplicationStatus.module.css';

type ApplicationStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
type RequestedRequirement = { key: string; label: string; value: string };
type CorrectionValues = {
  enrollmentType: string;
  childFirstName: string;
  childMiddleName: string;
  childLastName: string;
  childNickname: string;
  childBirthDate: string;
  childGender: string;
  psaNumber: string;
  nationality: string;
  placeOfBirth: string;
  childAddress: string;
  bloodType: string;
  medicalCondition: string;
  allergies: string;
  immunizationStatus: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  parentName: string;
  parentGender: string;
  parentBirthDate: string;
  parentPhone: string;
  parentEmail: string;
  parentRelationship: string;
  parentAddress: string;
  parentBarangay: string;
  householdIncome: string;
  preferredLanguage: string;
  referralSource: string;
};

type Application = {
  id: number;
  number: string;
  child: string;
  age: string;
  enrollmentType: string;
  applied: string;
  time: string;
  status: ApplicationStatus;
  reviewNote: string;
  hasDocumentRequest: boolean;
  requestedRequirements: RequestedRequirement[];
  requestRemarks: string;
  corrections: CorrectionValues;
  reviewHistory: {
    to_status: string;
    note: string | null;
    created_at: string;
  }[];
  documents: {
    id: number;
    document_type: string;
    original_name: string;
    verification_status: string;
    download_url: string;
  }[];
  center: string;
  centerAddress: string;
  centerPhone: string;
};

type ApiApplication = {
  id: number;
  application_number: string;
  child_first_name: string;
  child_middle_name: string | null;
  child_last_name: string;
  child_birth_date: string;
  enrollment_type: string;
  submitted_at: string;
  status: string;
  review_note: string | null;
  documents_requested_at: string | null;
  requested_requirements: RequestedRequirement[] | null;
  request_remarks: string | null;
  child_nickname: string | null;
  child_gender: string;
  child_address: string | null;
  psa_birth_certificate_number: string | null;
  child_nationality: string | null;
  place_of_birth: string | null;
  blood_type: string | null;
  medical_notes: string | null;
  allergies: string | null;
  immunization_status: string | null;
  emergency_name: string;
  emergency_relationship: string;
  emergency_phone: string;
  review_history: Application['reviewHistory'];
  documents: Application['documents'];
  cdc_name: string;
  cdc_address: string;
  cdc_contact_number: string | null;
  parent_name: string;
  parent_relationship: string;
  parent_email: string;
  parent_phone: string;
  parent_birth_date: string | null;
  parent_gender: string | null;
  parent_address: string;
  parent_barangay: string | null;
  household_income: string | null;
  preferred_language: string | null;
  referral_source: string | null;
};

function mapApplication(record: ApiApplication): Application {
  const birthDate = new Date(record.child_birth_date);
  let age = new Date().getFullYear() - birthDate.getFullYear();
  if (new Date().getMonth() < birthDate.getMonth()) age -= 1;
  const submitted = new Date(record.submitted_at);
  return {
    id: record.id,
    number: record.application_number,
    child: [
      record.child_first_name,
      record.child_middle_name,
      record.child_last_name,
    ]
      .filter(Boolean)
      .join(' '),
    age: `${Math.max(age, 0)} years`,
    enrollmentType:
      record.enrollment_type === 'reenrollment'
        ? 'Re-enrollment'
        : 'New Enrollment',
    applied: Number.isNaN(submitted.getTime())
      ? record.submitted_at
      : submitted.toLocaleDateString(),
    time: Number.isNaN(submitted.getTime())
      ? ''
      : submitted.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
    status: record.status
      .replace('_', ' ')
      .replace(/^./, (char) => char.toUpperCase()) as ApplicationStatus,
    reviewNote: record.review_note ?? '',
    hasDocumentRequest: Boolean(record.documents_requested_at),
    requestedRequirements: record.requested_requirements ?? [],
    requestRemarks: record.request_remarks ?? '',
    corrections: {
      enrollmentType: record.enrollment_type,
      childFirstName: record.child_first_name,
      childMiddleName: record.child_middle_name ?? '',
      childLastName: record.child_last_name,
      childNickname: record.child_nickname ?? '',
      childBirthDate: record.child_birth_date,
      childGender: record.child_gender,
      psaNumber: record.psa_birth_certificate_number ?? '',
      nationality: record.child_nationality ?? '',
      placeOfBirth: record.place_of_birth ?? '',
      childAddress: record.child_address ?? '',
      bloodType: record.blood_type ?? '',
      medicalCondition: record.medical_notes ?? '',
      allergies: record.allergies ?? '',
      immunizationStatus: record.immunization_status ?? '',
      emergencyName: record.emergency_name,
      emergencyRelationship: record.emergency_relationship,
      emergencyPhone: record.emergency_phone,
      parentName: record.parent_name,
      parentGender: record.parent_gender ?? '',
      parentBirthDate: record.parent_birth_date ?? '',
      parentPhone: record.parent_phone,
      parentEmail: record.parent_email,
      parentRelationship: record.parent_relationship,
      parentAddress: record.parent_address,
      parentBarangay: record.parent_barangay ?? '',
      householdIncome: record.household_income ?? '',
      preferredLanguage: record.preferred_language ?? '',
      referralSource: record.referral_source ?? '',
    },
    reviewHistory: record.review_history ?? [],
    documents: record.documents ?? [],
    center: record.cdc_name,
    centerAddress: record.cdc_address,
    centerPhone: record.cdc_contact_number ?? '',
  };
}

const requirements = [
  'Birth Certificate (PSA)',
  'Parent/Guardian Valid ID',
  'Recent 2x2 ID Picture (Parent/Guardian)',
  'Barangay Clearance',
  'Proof of Residence',
  'Medical Certificate (if required)',
];

const correctionFields: {
  key: keyof CorrectionValues;
  label: string;
  requirementKey: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}[] = [
  {
    key: 'enrollmentType',
    requirementKey: 'enrollment_type',
    label: 'Enrollment Type',
    options: [
      { value: 'new', label: 'New Enrollment' },
      { value: 'reenrollment', label: 'Re-enrollment' },
    ],
  },
  { key: 'childFirstName', requirementKey: 'child_first_name', label: 'Child First Name', required: true },
  { key: 'childMiddleName', requirementKey: 'child_middle_name', label: 'Child Middle Name' },
  { key: 'childLastName', requirementKey: 'child_last_name', label: 'Child Last Name', required: true },
  { key: 'childNickname', requirementKey: 'child_nickname', label: 'Child Nickname' },
  { key: 'childBirthDate', requirementKey: 'child_birth_date', label: 'Birthdate', type: 'date', required: true },
  { key: 'childGender', requirementKey: 'child_gender', label: 'Gender', required: true },
  { key: 'psaNumber', requirementKey: 'child_psa_number', label: 'PSA Birth Certificate Number', required: true },
  { key: 'nationality', requirementKey: 'child_nationality', label: 'Nationality', required: true },
  { key: 'placeOfBirth', requirementKey: 'child_place_of_birth', label: 'Place of Birth', required: true },
  { key: 'childAddress', requirementKey: 'child_address', label: 'Residential Address', required: true },
  { key: 'bloodType', requirementKey: 'child_blood_type', label: 'Blood Type' },
  { key: 'medicalCondition', requirementKey: 'child_medical_condition', label: 'Medical Condition' },
  { key: 'allergies', requirementKey: 'child_allergies', label: 'Allergies' },
  { key: 'immunizationStatus', requirementKey: 'child_immunization_status', label: 'Immunization Status' },
  { key: 'emergencyName', requirementKey: 'emergency_name', label: 'Emergency Contact Name', required: true },
  {
    key: 'emergencyRelationship',
    requirementKey: 'emergency_relationship',
    label: 'Emergency Contact Relationship',
    required: true,
  },
  {
    key: 'emergencyPhone',
    requirementKey: 'emergency_phone',
    label: 'Emergency Contact Phone',
    required: true,
  },
  { key: 'parentName', requirementKey: 'parent_name', label: 'Parent / Guardian Name', required: true },
  { key: 'parentGender', requirementKey: 'parent_gender', label: 'Parent / Guardian Gender' },
  { key: 'parentBirthDate', requirementKey: 'parent_birth_date', label: 'Parent / Guardian Birthdate', type: 'date' },
  { key: 'parentPhone', requirementKey: 'parent_phone', label: 'Parent / Guardian Contact Number' },
  { key: 'parentEmail', requirementKey: 'parent_email', label: 'Parent / Guardian Email Address' },
  { key: 'parentRelationship', requirementKey: 'parent_relationship', label: 'Relationship to Child' },
  { key: 'parentAddress', requirementKey: 'parent_address', label: 'Parent / Guardian Address' },
  { key: 'parentBarangay', requirementKey: 'parent_barangay', label: 'Parent / Guardian Barangay' },
  { key: 'householdIncome', requirementKey: 'household_income', label: 'Household Income Range' },
  { key: 'preferredLanguage', requirementKey: 'preferred_language', label: 'Preferred Language' },
  { key: 'referralSource', requirementKey: 'referral_source', label: 'How They Learned About the CDC' },
];

const additionalDocumentTypes = [
  { value: 'birth_certificate', label: 'PSA Birth Certificate' },
  { value: 'parent_id', label: 'Parent/Guardian Valid ID' },
  { value: 'parent_photo', label: 'Parent/Guardian 2x2 Photo' },
  { value: 'barangay_clearance', label: 'Barangay Clearance' },
  { value: 'proof_of_residence', label: 'Proof of Residence' },
  { value: 'medical_certificate', label: 'Medical Certificate' },
];

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
    case 'application':
      return (
        <svg {...shared}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6m-12 5h5m-5 4h5m3-1 3 3 4-5" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'search':
      return (
        <svg {...shared}>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </svg>
      );
    case 'check':
      return (
        <svg {...shared}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case 'close':
      return (
        <svg {...shared}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...shared}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );
    case 'download':
      return (
        <svg {...shared}>
          <path d="M12 3v12m-5-5 5 5 5-5M4 19v2h16v-2" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...shared}>
          <path d="M7 3H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-3l-5-2-2 3a14 14 0 0 1-5-3 14 14 0 0 1-3-5l3-2z" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case 'location':
      return (
        <svg {...shared}>
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'info':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5m0-8h.01" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...shared}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
        </svg>
      );
  }
}

function StatusPill({ status }: { status: ApplicationStatus }) {
  const className =
    status === 'Approved'
      ? styles.approved
      : status === 'Rejected'
        ? styles.rejected
        : status === 'Under Review'
          ? styles.underReview
          : styles.pending;

  return (
    <span className={`${styles.statusPill} ${className}`}>
      <Icon
        name={
          status === 'Approved'
            ? 'check'
            : status === 'Rejected'
              ? 'close'
              : status === 'Under Review'
                ? 'search'
                : 'clock'
        }
      />
      {status}
    </span>
  );
}

export function ParentApplicationStatus({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { request, accessToken } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [additionalFiles, setAdditionalFiles] = useState<Record<string, File>>(
    {},
  );
  const [correctionValues, setCorrectionValues] = useState<
    Partial<CorrectionValues>
  >({});
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState(false);
  const linkedApplicationId = Number(new URLSearchParams(location.search).get('application'));

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const loadApplications = async () => {
      const currentRequestId = ++requestId;
      try {
        const result = await request<{ data: ApiApplication[] }>(
          '/api/enrollments',
        );
        if (!active || currentRequestId !== requestId) return;
        const records = (result.data ?? []).map(mapApplication);
        setApplications(records);
        const linkedApplication = records.find(
          (application) => application.id === linkedApplicationId,
        );
        setSelectedApplication((current) =>
          linkedApplication
            ?? records.find((application) => application.id === current?.id)
            ?? records[0]
            ?? null,
        );
        if (linkedApplication) setShowApplicationDetails(true);
        setLoadError('');
      } catch (error) {
        if (active && currentRequestId === requestId) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Applications could not be loaded.',
          );
        }
      } finally {
        if (active && currentRequestId === requestId) setLoading(false);
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadApplications();
      }
    };
    void loadApplications();
    const interval = window.setInterval(refreshWhenVisible, 15_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [linkedApplicationId, request]);

  function selectAdditionalDocument(type: string, file?: File) {
    if (!file) return;
    const isParentPhoto = type === 'parent_photo';
    const allowedTypes = isParentPhoto
      ? ['image/jpeg', 'image/png']
      : ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = isParentPhoto ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      setUploadError(true);
      setUploadMessage(
        isParentPhoto
          ? 'The parent photo must be a JPG or PNG image.'
          : 'Choose a PDF, JPG, or PNG document.',
      );
      return;
    }
    if (file.size <= 0 || file.size > maxSize) {
      setUploadError(true);
      setUploadMessage(
        isParentPhoto
          ? 'The parent photo must be no larger than 2 MB.'
          : 'Each document must be no larger than 5 MB.',
      );
      return;
    }
    setUploadError(false);
    setUploadMessage('');
    setAdditionalFiles((current) => ({ ...current, [type]: file }));
  }

  async function submitAdditionalDocuments() {
    if (
      !selectedApplication ||
      (!Object.keys(additionalFiles).length && !correctionsChanged) ||
      uploadingAdditional
    ) {
      return;
    }
    const formData = new FormData();
    const submittedCorrections = {
      ...selectedApplication.corrections,
      ...correctionValues,
    };
    const activeCorrectionFields = correctionFields.filter(
      ({ requirementKey }) =>
        !selectedApplication.requestedRequirements.length
        || selectedApplication.requestedRequirements.some(({ key }) => key === requirementKey),
    );
    activeCorrectionFields.forEach(({ key }) => {
      const value = submittedCorrections[key];
      formData.append(key, value);
    });
    Object.entries(additionalFiles).forEach(([type, file]) => {
      formData.append(`document_${type}`, file);
    });
    setUploadingAdditional(true);
    setUploadError(false);
    setUploadMessage('');
    try {
      const result = await request<{
        data: { status: string; documents: Application['documents'] };
      }>(`/api/enrollments/${selectedApplication.id}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!Array.isArray(result.data?.documents)) {
        throw new Error('The server did not confirm the uploaded documents.');
      }
      const updateApplication = (application: Application): Application =>
        application.id === selectedApplication.id
          ? {
              ...application,
              status: 'Pending',
              hasDocumentRequest: false,
              requestedRequirements: [],
              requestRemarks: '',
              corrections: submittedCorrections,
              documents: result.data.documents,
              reviewHistory: [
                ...application.reviewHistory,
                {
                  to_status: result.data.status,
                  note: 'Application resubmitted for review.',
                  created_at: new Date().toISOString(),
                },
              ],
            }
          : application;
      setApplications((current) => current.map(updateApplication));
      setSelectedApplication((current) =>
        current ? updateApplication(current) : current,
      );
      setAdditionalFiles({});
      setCorrectionValues({});
      setUploadError(false);
      setUploadMessage('Additional documents were submitted for review.');
    } catch (error) {
      setUploadError(true);
      setUploadMessage(
        error instanceof Error
          ? error.message
          : 'Additional documents could not be uploaded.',
      );
    } finally {
      setUploadingAdditional(false);
    }
  }

  async function downloadDocument(
    documentRecord: Application['documents'][number],
  ) {
    setUploadError(false);
    setUploadMessage('');
    try {
      const response = await fetch(documentRecord.download_url, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: 'include',
      });
      if (!response.ok)
        throw new Error('The document could not be downloaded.');
      const file = await response.blob();
      const objectUrl = URL.createObjectURL(file);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = documentRecord.original_name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      setUploadError(true);
      setUploadMessage(
        error instanceof Error
          ? error.message
          : 'The document could not be downloaded.',
      );
    }
  }

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter((application) =>
      `${application.number} ${application.child} ${application.status} ${application.enrollmentType}`
        .toLowerCase()
        .includes(term),
    );
  }, [applications, search]);

  const totals = {
    total: applications.length,
    pending: applications.filter(({ status }) => status === 'Pending').length,
    review: applications.filter(({ status }) => status === 'Under Review')
      .length,
    approved: applications.filter(({ status }) => status === 'Approved').length,
    rejected: applications.filter(({ status }) => status === 'Rejected').length,
  };
  const activeCorrectionFields = selectedApplication
    ? correctionFields.filter(
        ({ requirementKey }) =>
          !selectedApplication.requestedRequirements.length
          || selectedApplication.requestedRequirements.some(({ key }) => key === requirementKey),
      )
    : [];
  const requestedDocumentTypes = selectedApplication
    ? additionalDocumentTypes.filter(({ value }) =>
        !selectedApplication.requestedRequirements.length
        || selectedApplication.requestedRequirements.some(({ key }) => key === `document_${value}`),
      )
    : [];
  const correctionsChanged = selectedApplication
    ? activeCorrectionFields.some(
        ({ key }) =>
          correctionValues[key] !== undefined &&
          correctionValues[key] !== selectedApplication.corrections[key],
      )
    : false;
  const progressSteps =
    selectedApplication?.status === 'Rejected'
      ? [
          {
            title: 'Application Submitted',
            detail: 'Your application was received.',
          },
          {
            title: 'Rejected',
            detail:
              selectedApplication.reviewNote ||
              'The application was not approved.',
          },
        ]
      : [
          {
            title: 'Application Submitted',
            detail: 'Your application was received.',
          },
          {
            title:
              !selectedApplication || selectedApplication.status === 'Pending'
                ? 'Pending'
                : 'Under Review',
            detail:
              !selectedApplication || selectedApplication.status === 'Pending'
                ? 'Awaiting teacher review.'
                : 'The application is being evaluated.',
          },
          { title: 'Approval', detail: 'A decision will be shared here.' },
          {
            title: 'Enrollment Complete',
            detail: 'Enrollment has been finalized.',
          },
        ];

  return (
    <main aria-label="Application Status" className={styles.page}>
      <section
        aria-label="Application status"
        className={styles.hero}
        style={{ backgroundImage: `url("${childrenBanner}")` }}
      >
        <span aria-hidden="true" className={styles.heroIcon}>
          <Icon name="application" />
          <Icon name="search" />
        </span>
        <div className={styles.heroCopy}>
          <h1>Application Status</h1>
          <p>
            Track the status of your enrollment applications and view updates
          </p>
          <p>from the Child Development Center.</p>
        </div>
      </section>

      <EventNotifications />

      <section aria-label="Application summary" className={styles.stats}>
        <SummaryStat
          icon="application"
          label="Total Applications"
          count={totals.total}
          tone="blue"
        />
        <SummaryStat
          icon="clock"
          label="Pending"
          count={totals.pending}
          tone="orange"
        />
        <SummaryStat
          icon="search"
          label="Under Review"
          count={totals.review}
          tone="blue"
        />
        <SummaryStat
          icon="check"
          label="Approved"
          count={totals.approved}
          tone="green"
        />
        <SummaryStat
          icon="close"
          label="Rejected"
          count={totals.rejected}
          tone="red"
        />
      </section>

      <div className={styles.contentGrid}>
        <section
          aria-labelledby="applications-heading"
          className={styles.applicationsPanel}
        >
          <header className={styles.panelHeader}>
            <h2 id="applications-heading">
              <Icon name="application" /> My Applications
            </h2>
            <label className={styles.tableSearch}>
              <Icon name="search" />
              <span className={styles.visuallyHidden}>Search applications</span>
              <input
                aria-label="Search applications"
                placeholder="Search by application number or child name..."
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </label>
          </header>
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th>Application No.</th>
                  <th>Child Name</th>
                  <th>Enrollment Type</th>
                  <th>Date Applied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => (
                  <tr
                    className={styles.applicationRow}
                    key={application.number}
                  >
                    <td>
                      <strong className={styles.applicationNumber}>
                        {application.number}
                      </strong>
                    </td>
                    <td>
                      <div className={styles.childCell}>
                        <img alt="" src={childrenBanner} />
                        <span>
                          <strong>{application.child}</strong>
                          <small>Age: {application.age}</small>
                        </span>
                      </div>
                    </td>
                    <td>{application.enrollmentType}</td>
                    <td>
                      <span className={styles.appliedDate}>
                        {application.applied}
                        <small>{application.time}</small>
                      </span>
                    </td>
                    <td>
                      <StatusPill status={application.status} />
                    </td>
                    <td>
                      <button
                        aria-label={`View ${application.number} details`}
                        className={styles.viewButton}
                        type="button"
                        onClick={() => {
                          setCorrectionValues({});
                          setSelectedApplication(application);
                          setShowApplicationDetails(true);
                        }}
                      >
                        <span aria-hidden="true">⊙</span> View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr>
                    <td className={styles.emptyState} colSpan={6}>
                      <BouncingDots label="Loading your applications" />
                    </td>
                  </tr>
                )}
                {loadError && (
                  <tr>
                    <td className={styles.emptyState} colSpan={6} role="alert">
                      {loadError}
                    </td>
                  </tr>
                )}
                {!loading && !loadError && !filteredApplications.length && (
                  <tr>
                    <td className={styles.emptyState} colSpan={6}>
                      {applications.length
                        ? 'No applications match your search.'
                        : 'You have not submitted an enrollment application yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={styles.rightRail}>
          <section
            aria-labelledby="progress-heading"
            className={styles.railPanel}
          >
            <h2 id="progress-heading">Application Progress</h2>
            <ol className={styles.timeline}>
              {progressSteps.map((item, index) => {
                const activeIndex =
                  selectedApplication?.status === 'Approved'
                    ? 3
                    : selectedApplication?.status === 'Rejected'
                      ? 1
                      : selectedApplication?.status === 'Under Review' ||
                          selectedApplication?.status === 'Pending'
                        ? 1
                        : 0;
                const completed = index === 0 || index < activeIndex;
                const active = index === activeIndex;
                return (
                  <li
                    className={`${completed ? styles.timelineComplete : ''} ${active ? styles.timelineActive : ''}`}
                    key={item.title}
                  >
                    <span className={styles.timelineIcon}>
                      <Icon
                        name={completed ? 'check' : active ? 'clock' : 'check'}
                      />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>
                        {index === 0 && selectedApplication
                          ? `${selectedApplication.applied} · ${selectedApplication.time}`
                          : item.detail}
                      </small>
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className={styles.timelineCaption}>
              {selectedApplication
                ? `Tracking ${selectedApplication.number}`
                : 'Select an application to view its progress.'}
            </p>
          </section>

          <section className={`${styles.railPanel} ${styles.quickPanel}`}>
            <h2>
              <Icon name="shield" /> Quick Actions
            </h2>
            <button
              className={styles.primaryAction}
              type="button"
              onClick={() => navigate(routePaths.parentEnrollment)}
            >
              <Icon name="application" /> Apply for Enrollment
            </button>
            <button
              className={styles.secondaryAction}
              type="button"
              onClick={() => setShowRequirements(true)}
            >
              <Icon name="application" /> View Enrollment Requirements
            </button>
          </section>
        </aside>
      </div>

      <section className={styles.helpPanel}>
        <span className={styles.helpIcon}>
          <Icon name="application" />
        </span>
        <div className={styles.helpCopy}>
          <h2>Need Help?</h2>
          <p>
            {selectedApplication
              ? 'Use the contact information recorded for the Child Development Center handling your application.'
              : 'Submit an application to see the contact details for its selected Child Development Center.'}
          </p>
        </div>
        <span className={styles.office}>
          <Icon name="location" />
          <span>
            <strong>
              {selectedApplication?.center || 'Child Development Center'}
            </strong>
            <small>
              {selectedApplication?.centerAddress || 'Address not provided'}
            </small>
          </span>
        </span>
        {selectedApplication?.centerPhone ? (
          <a href={`tel:${selectedApplication.centerPhone}`}>
            <Icon name="phone" />
            <span>
              <strong>{selectedApplication.centerPhone}</strong>
              <small>CDC contact number</small>
            </span>
          </a>
        ) : (
          <span className={styles.office}>
            <Icon name="info" />
            <span>
              <strong>Phone contact not listed</strong>
              <small>Contact details are maintained by the CDC.</small>
            </span>
          </span>
        )}
        <img alt="" src={femalePanel} />
      </section>

      {((showApplicationDetails && selectedApplication) ||
        showRequirements) && (
        <div className={styles.dialogBackdrop}>
          <section
            aria-labelledby="application-dialog-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <button
              aria-label="Close dialog"
              className={styles.closeButton}
              type="button"
              onClick={() => {
                setShowApplicationDetails(false);
                setShowRequirements(false);
              }}
            >
              <Icon name="close" />
            </button>
            {showApplicationDetails && selectedApplication ? (
              <>
                <h2 id="application-dialog-title">Application Details</h2>
                <p className={styles.dialogNumber}>
                  {selectedApplication.number}
                </p>
                <dl>
                  <Detail
                    label="Child Name"
                    value={selectedApplication.child}
                  />
                  <Detail label="Age" value={selectedApplication.age} />
                  <Detail
                    label="Enrollment Type"
                    value={selectedApplication.enrollmentType}
                  />
                  <Detail
                    label="Date Applied"
                    value={`${selectedApplication.applied} · ${selectedApplication.time}`}
                  />
                  <Detail
                    label="Current Status"
                    value={selectedApplication.status}
                  />
                  <Detail
                    label="Review Feedback"
                    value={
                      selectedApplication.reviewNote ||
                      'No review feedback yet.'
                    }
                  />
                </dl>
                {selectedApplication.reviewHistory.length > 0 && (
                  <section className={styles.reviewHistory}>
                    <h3>Application Updates</h3>
                    <ol>
                      {selectedApplication.reviewHistory.map((entry, index) => (
                        <li key={`${entry.created_at}-${index}`}>
                          <strong>
                            {entry.to_status
                              .replace('_', ' ')
                              .replace(/^./, (character) =>
                                character.toUpperCase(),
                              )}
                          </strong>
                          <time dateTime={entry.created_at}>
                            {new Date(
                              entry.created_at.replace(' ', 'T'),
                            ).toLocaleString()}
                          </time>
                          {entry.note && <p>{entry.note}</p>}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                <section className={styles.reviewHistory}>
                  <h3>Submitted Documents</h3>
                  {selectedApplication.documents.length ? (
                    <ul className={styles.documentList}>
                      {selectedApplication.documents.map((documentRecord) => (
                        <li key={documentRecord.id}>
                          <span>
                            <strong>
                              {additionalDocumentTypes.find(
                                ({ value }) =>
                                  value === documentRecord.document_type,
                              )?.label ??
                                documentRecord.document_type.replaceAll(
                                  '_',
                                  ' ',
                                )}
                            </strong>
                            <small>
                              {documentRecord.original_name} ·{' '}
                              {documentRecord.verification_status}
                            </small>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void downloadDocument(documentRecord)
                            }
                          >
                            Download
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No documents are recorded for this application.</p>
                  )}
                </section>
                {selectedApplication.hasDocumentRequest && (
                  <section className={styles.additionalUpload}>
                    <h3>Information Requested by the CDC</h3>
                    <p>{selectedApplication.reviewNote}</p>
                    {selectedApplication.requestedRequirements.length > 0 && (
                      <ul className={styles.requestedFieldList}>
                        {selectedApplication.requestedRequirements.map((field) => (
                          <li key={field.key}>
                            <strong>{field.label}:</strong> {field.value || 'Not provided'}
                          </li>
                        ))}
                      </ul>
                    )}
                    {selectedApplication.requestRemarks && (
                      <p><strong>Additional instructions:</strong> {selectedApplication.requestRemarks}</p>
                    )}
                    <div className={styles.additionalUploadFields}>
                      {activeCorrectionFields.map(({ key, label, type, required, options }) => (
                        <label key={key}>
                          <span>{label}{required ? ' *' : ''}</span>
                          {options ? (
                            <select
                              onChange={(event) => setCorrectionValues((current) => ({
                                ...current,
                                [key]: event.target.value,
                              }))}
                              required={required}
                              value={correctionValues[key] ?? selectedApplication.corrections[key]}
                            >
                              {options.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              maxLength={key === 'medicalCondition' || key === 'allergies' ? 2000 : undefined}
                              onChange={(event) =>
                                setCorrectionValues((current) => ({
                                  ...current,
                                  [key]: event.target.value,
                                }))
                              }
                              required={required}
                              type={type ?? 'text'}
                              value={correctionValues[key] ?? selectedApplication.corrections[key]}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                    <div className={styles.additionalUploadFields}>
                      {requestedDocumentTypes.map(({ value, label }) => (
                        <label key={value}>
                          <span>{label}</span>
                          <input
                            accept={
                              value === 'parent_photo'
                                ? 'image/jpeg,image/png'
                                : 'application/pdf,image/jpeg,image/png'
                            }
                            onChange={(event) =>
                              selectAdditionalDocument(
                                value,
                                event.target.files?.[0],
                              )
                            }
                            type="file"
                          />
                          {additionalFiles[value] && (
                            <span className={styles.selectedFile}>
                              {additionalFiles[value].name}
                              <button
                                aria-label={`Remove ${label}`}
                                onClick={(event) => {
                                  const input = event.currentTarget
                                    .closest('label')
                                    ?.querySelector('input');
                                  if (input) input.value = '';
                                  setAdditionalFiles((current) => {
                                    const next = { ...current };
                                    delete next[value];
                                    return next;
                                  });
                                }}
                                type="button"
                              >
                                Remove
                              </button>
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                    <button
                      className={styles.uploadDocumentsButton}
                      disabled={
                        (!Object.keys(additionalFiles).length &&
                          !correctionsChanged) ||
                        uploadingAdditional
                      }
                      onClick={() => void submitAdditionalDocuments()}
                      type="button"
                    >
                      {uploadingAdditional
                        ? 'Submitting…'
                        : 'Resubmit Application'}
                    </button>
                  </section>
                )}
                {uploadMessage && (
                  <p
                    aria-live={uploadError ? 'assertive' : 'polite'}
                    className={`${styles.uploadMessage} ${uploadError ? styles.uploadError : ''}`}
                    role={uploadError ? 'alert' : 'status'}
                  >
                    {uploadMessage}
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 id="application-dialog-title">Enrollment Requirements</h2>
                <p>
                  Prepare these documents for your Child Development Center
                  application:
                </p>
                <ul className={styles.requirementsList}>
                  {requirements.map((item) => (
                    <li key={item}>
                      <Icon name="check" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className={styles.dialogNote}>
                  Requirements may vary by center. Please confirm with your
                  local CDC office.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryStat({
  icon,
  label,
  count,
  tone,
}: {
  icon: string;
  label: string;
  count: number;
  tone: string;
}) {
  return (
    <article className={`${styles.stat} ${styles[tone]}`}>
      <span className={styles.statIcon}>
        <Icon name={icon} />
      </span>
      <span className={styles.statCopy}>
        <strong>{label}</strong>
        <b>{count}</b>
      </span>
      <Icon name="arrow" />
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
