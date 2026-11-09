import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import styles from '../ChildrenRecords/ChildrenRecords.module.css';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

type DetailDocument = {
  id: number;
  document_type: string;
  original_name: string;
  mime_type: string;
  uploaded_at: string;
  verification_status: string;
  download_url: string;
};
type RequestedRequirement = { key: string; label: string; value: string };
type ReviewEntry = {
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
  reviewer_first_name: string | null;
  reviewer_last_name: string | null;
  reviewer_role: string | null;
};
type Application = {
  id: number;
  child_id: number;
  application_number: string;
  enrollment_type: string;
  school_year: string;
  parent_name: string;
  parent_relationship: string;
  parent_email: string;
  parent_phone: string;
  parent_address: string;
  parent_birth_date: string | null;
  parent_gender: string | null;
  parent_barangay: string | null;
  emergency_name: string;
  emergency_relationship: string;
  emergency_phone: string;
  household_income: string | null;
  preferred_language: string | null;
  referral_source: string | null;
  status: string;
  review_note: string | null;
  request_remarks: string | null;
  documents_requested_at: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewer_first_name: string | null;
  reviewer_last_name: string | null;
  reviewer_role: string | null;
  requested_requirements: RequestedRequirement[];
  child_first_name: string;
  child_middle_name: string | null;
  child_last_name: string;
  child_suffix: string | null;
  child_nickname: string | null;
  child_birth_date: string;
  child_gender: string;
  child_address: string | null;
  psa_birth_certificate_number: string | null;
  child_nationality: string | null;
  place_of_birth: string | null;
  blood_type: string | null;
  medical_notes: string | null;
  allergies: string | null;
  immunization_status: string | null;
  enrolled_at: string | null;
  cdc_name: string | null;
  assigned_cdc_name: string | null;
  child_class_name: string | null;
  documents: DetailDocument[];
  review_history: ReviewEntry[];
};
type Child = {
  id: number;
  parent_user_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  nickname: string | null;
  birth_date: string;
  age: number;
  gender: string;
  address: string | null;
  enrollment_status: string;
  medical_notes: string | null;
  psa_birth_certificate_number: string | null;
  nationality: string | null;
  place_of_birth: string | null;
  blood_type: string | null;
  allergies: string | null;
  immunization_status: string | null;
  enrolled_at: string | null;
  center_name: string;
  assigned_center_name: string | null;
  class_name: string | null;
  parent_first_name: string;
  parent_middle_name: string | null;
  parent_last_name: string;
  parent_suffix: string | null;
  parent_account_email: string;
  parent_account_phone: string;
  parent_contact_email: string | null;
  parent_birth_date: string | null;
  parent_gender: string | null;
  parent_relationship: string | null;
  parent_address: string | null;
  parent_barangay: string | null;
  parent_municipality: string | null;
  parent_province: string | null;
  parent_postal_code: string | null;
  profile_emergency_name: string | null;
  profile_emergency_relationship: string | null;
  profile_emergency_phone: string | null;
  household_income: string | null;
  preferred_language: string | null;
  referral_source: string | null;
};
type DetailsResponse = { data: { child: Child; applications: Application[] } };
type Field = { key: string; label: string; value: string };
const editableRequirementKeys = new Set([
  'enrollment_type',
  'child_first_name',
  'child_middle_name',
  'child_last_name',
  'child_nickname',
  'child_birth_date',
  'child_gender',
  'child_psa_number',
  'child_nationality',
  'child_place_of_birth',
  'child_address',
  'child_blood_type',
  'child_medical_condition',
  'child_allergies',
  'child_immunization_status',
  'emergency_name',
  'emergency_relationship',
  'emergency_phone',
  'parent_name',
  'parent_gender',
  'parent_birth_date',
  'parent_phone',
  'parent_email',
  'parent_relationship',
  'parent_address',
  'parent_barangay',
  'household_income',
  'preferred_language',
  'referral_source',
  'document_birth_certificate',
  'document_parent_id',
  'document_parent_photo',
  'document_barangay_clearance',
  'document_proof_of_residence',
  'document_medical_certificate',
]);

function value(input: string | null | undefined) {
  return input?.trim() || 'Not provided';
}

function date(input: string | null | undefined) {
  if (!input) return 'Not provided';
  const parsed = new Date(input.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? input : parsed.toLocaleDateString();
}

function dateTime(input: string | null | undefined) {
  if (!input) return 'Not provided';
  const parsed = new Date(input.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? input : parsed.toLocaleString();
}

function childNumber(id: number) {
  return `CHD-${String(id).padStart(6, '0')}`;
}

function displayStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusLabel(application: Application) {
  if (application.status === 'under_review' && application.documents_requested_at) {
    return 'Returned for Correction';
  }
  return application.status === 'under_review' ? 'Reviewing' : displayStatus(application.status);
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
  if (name === 'family') return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M3 20v-1a6 6 0 0 1 12 0v1m1-5a4.5 4.5 0 0 1 5 4.5V20" /></svg>;
  if (name === 'user') return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M6 21v-2a6 6 0 0 1 12 0v2" /></svg>;
  if (name === 'check') return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (name === 'close') return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  if (name === 'refresh') return <svg {...common}><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.6-2L20 12M4 12l2.9 5a7 7 0 0 0 11.6-2" /></svg>;
  return <svg {...common}><path d="M5 3h14v18H5zM8 8h8m-8 4h8m-8 4h5" /></svg>;
}

function rows(fields: { label: string; value: string }[]) {
  return (
    <dl className={styles.detailRows}>
      {fields.map((field) => (
        <div className={styles.detailRow} key={field.label}>
          <dt>{field.label}</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function makeGroups(child: Child, app: Application): { title: string; fields: Field[] }[] {
  const documents = new Map(app.documents.map((document) => [document.document_type, document]));
  const parentName = [child.parent_first_name, child.parent_middle_name, child.parent_last_name, child.parent_suffix].filter(Boolean).join(' ');
  const fields = (items: [string, string, string][]): Field[] => items.map(([key, label, current]) => ({ key, label, value: current || 'Not provided' }));
  return [
    { title: 'Child Information', fields: fields([
      ['child_id', 'Child ID', childNumber(child.id)],
      ['child_first_name', 'First Name', app.child_first_name || child.first_name],
      ['child_middle_name', 'Middle Name', app.child_middle_name || child.middle_name || 'Not provided'],
      ['child_last_name', 'Last Name', app.child_last_name || child.last_name],
      ['child_suffix', 'Suffix', app.child_suffix || child.suffix || 'Not provided'],
      ['child_nickname', 'Nickname', app.child_nickname || child.nickname || 'Not provided'],
      ['child_gender', 'Gender', app.child_gender || child.gender],
      ['child_birth_date', 'Birthdate', app.child_birth_date || child.birth_date],
      ['child_age', 'Age', `${child.age} years`],
      ['child_address', 'Address', app.child_address || child.address || 'Not provided'],
      ['child_psa_number', 'PSA Birth Certificate Number', app.psa_birth_certificate_number || child.psa_birth_certificate_number || 'Not provided'],
      ['child_nationality', 'Nationality', app.child_nationality || child.nationality || 'Not provided'],
      ['child_place_of_birth', 'Place of Birth', app.place_of_birth || child.place_of_birth || 'Not provided'],
      ['child_blood_type', 'Blood Type', app.blood_type || child.blood_type || 'Not provided'],
      ['child_allergies', 'Allergies', app.allergies || child.allergies || 'Not provided'],
      ['child_medical_condition', 'Medical Notes', app.medical_notes || child.medical_notes || 'Not provided'],
      ['child_immunization_status', 'Immunization Status', app.immunization_status || child.immunization_status || 'Not provided'],
    ]) },
    { title: 'Parent / Guardian Information', fields: fields([
      ['parent_name', 'Full Name', app.parent_name || parentName],
      ['parent_gender', 'Gender', app.parent_gender || child.parent_gender || 'Not provided'],
      ['parent_birth_date', 'Birthdate', app.parent_birth_date || child.parent_birth_date || 'Not provided'],
      ['parent_phone', 'Contact Number', app.parent_phone || child.parent_account_phone],
      ['parent_email', 'Email Address', app.parent_email || child.parent_contact_email || child.parent_account_email],
      ['parent_relationship', 'Relationship to Child', app.parent_relationship || child.parent_relationship || 'Not provided'],
      ['parent_address', 'Address', app.parent_address || child.parent_address || 'Not provided'],
      ['parent_barangay', 'Barangay', app.parent_barangay || child.parent_barangay || 'Not provided'],
      ['household_income', 'Household Income Range', app.household_income || child.household_income || 'Not provided'],
      ['preferred_language', 'Preferred Language', app.preferred_language || child.preferred_language || 'Not provided'],
      ['referral_source', 'How They Learned About the CDC', app.referral_source || child.referral_source || 'Not provided'],
    ]) },
    { title: 'Emergency Contact Information', fields: fields([
      ['emergency_name', 'Contact Person', app.emergency_name || child.profile_emergency_name || 'Not provided'],
      ['emergency_relationship', 'Relationship to Child', app.emergency_relationship || child.profile_emergency_relationship || 'Not provided'],
      ['emergency_phone', 'Phone Number', app.emergency_phone || child.profile_emergency_phone || 'Not provided'],
    ]) },
    { title: 'Enrollment Information', fields: [
      ...fields([
        ['application_number', 'Enrollment Application ID', app.application_number],
        ['application_date', 'Application Date', app.submitted_at],
        ['cdc_name', 'Child Development Center Selection', app.cdc_name || 'Not provided'],
        ['assigned_cdc_class', 'Assigned CDC / Class', `${value(app.assigned_cdc_name || child.assigned_center_name || child.center_name)} / ${value(app.child_class_name || child.class_name)}`],
        ['application_status', 'Enrollment Status', statusLabel(app)],
        ['enrollment_type', 'Enrollment Type', app.enrollment_type === 'new' ? 'New Enrollment' : 'Re-enrollment'],
      ]),
      ...([
        ['birth_certificate', 'PSA Birth Certificate'],
        ['parent_id', 'Parent/Guardian Valid ID'],
        ['parent_photo', 'Parent/Guardian Photo'],
        ['barangay_clearance', 'Barangay Clearance'],
        ['proof_of_residence', 'Proof of Residence'],
        ['medical_certificate', 'Medical Certificate'],
      ] as [string, string][]).map(([type, label]) => {
        const document = documents.get(type);
        return { key: `document_${type}`, label, value: document ? `${document.original_name} (${displayStatus(document.verification_status)})` : 'Not provided' };
      }),
    ] },
  ];
}

export function EnrollmentApplicationDetails({
  applicationId,
  childId,
  role,
  onClose,
  onReviewed,
}: {
  applicationId: number;
  childId: number;
  role: 'admin' | 'teacher';
  onClose: () => void;
  onReviewed: () => Promise<void>;
}) {
  const { request, accessToken } = useAuth();
  const [child, setChild] = useState<Child | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | 'requirements' | null>(null);
  const [note, setNote] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<{ title: string; fields: Field[] }[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setChild(null);
    setApplication(null);
    setGroups([]);
    void request<DetailsResponse>(`/api/admin/enrollment-applications/${applicationId}`)
      .then((response) => {
        if (!active) return;
        const selectedApp = response.data.applications?.find((item) => item.id === applicationId);
        if (!response.data.child || !selectedApp || response.data.child.id !== childId) {
          throw new Error('The selected enrollment application could not be matched to its child record.');
        }
        setChild(response.data.child);
        setApplication(selectedApp);
        setGroups(makeGroups(response.data.child, selectedApp));
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Child details could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [applicationId, childId, request]);

  const selectedFields = useMemo(
    () => groups.flatMap((group) => group.fields).filter((field) => selected.includes(field.key)),
    [groups, selected],
  );

  async function submitReview() {
    if (!application || !action || saving) return;
    const trimmedNote = note.trim();
    if (action === 'reject' && !trimmedNote) {
      setError('A rejection reason is required.');
      return;
    }
    if (action === 'requirements' && selected.length === 0) {
      setError('Select at least one field or document that needs attention.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await request(`/api/enrollments/${application.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'under_review',
          note: trimmedNote,
          request_documents: action === 'requirements',
          required_fields: action === 'requirements' ? selected : [],
          remarks: action === 'requirements' ? remarks.trim() : '',
        }),
      });
      setAction(null);
      setNote('');
      setRemarks('');
      setSelected([]);
      setPreview(false);
      await onReviewed();
      const response = await request<DetailsResponse>(`/api/admin/enrollment-applications/${applicationId}`);
      const updatedApp = response.data.applications?.find((item) => item.id === applicationId);
      if (!response.data.child || !updatedApp) throw new Error('The application was updated, but refreshed details were unavailable.');
      setChild(response.data.child);
      setApplication(updatedApp);
      setGroups(makeGroups(response.data.child, updatedApp));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The enrollment decision could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  const fullName = application
    ? [application.child_first_name, application.child_middle_name, application.child_last_name, application.child_suffix].filter(Boolean).join(' ')
    : '';
  const parentName = application?.parent_name || '';
  const tone = application?.status === 'approved' ? 'approved'
    : application?.status === 'rejected' ? 'rejected'
      : application?.status === 'under_review' ? 'reviewing'
        : application?.documents_requested_at ? 'returned' : 'pending';
  const applicationStatus = application ? statusLabel(application) : '';
  const canReview = application
    && role === 'teacher'
    && ['pending', 'under_review'].includes(application.status)
    && !application.documents_requested_at;
  const requestedKeys = new Set((application?.requested_requirements ?? []).map(({ key }) => key));

  async function downloadDocument(document: DetailDocument) {
    try {
      const response = await fetch(`${apiBaseUrl}${document.download_url}`, {
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!response.ok) throw new Error('Document could not be downloaded.');
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = document.original_name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Document could not be downloaded.');
    }
  }

  return (
    <div className={styles.dialogBackdrop} onClick={onClose} role="presentation">
      <section aria-labelledby="child-details-title" aria-modal="true" className={styles.detailsDialog} onClick={(event) => event.stopPropagation()} role="dialog">
        <header className={styles.detailsHeader}>
          <span className={styles.detailTitleIcon}><Icon name="family" /></span>
          <div className={styles.detailTitle}>
            <h2 id="child-details-title">Child Record Details</h2>
            <p>{child ? childNumber(child.id) : application?.application_number}</p>
          </div>
          <button aria-label="Close child details" className={styles.closeDetails} onClick={onClose} type="button"><Icon name="close" /></button>
        </header>
        <div className={styles.detailBody}>
          {loading && <p className={styles.detailState}>Loading child details…</p>}
          {error && <p className={styles.detailError} role="alert">{error}</p>}
          {child && application && (
            <>
              <section className={styles.childSummary}>
                <span className={styles.childSummaryAvatar}><Icon name="user" /></span>
                <div className={styles.childSummaryName}>
                  <strong>{value(fullName)}</strong>
                  <span className={`${styles.statusBadge} ${styles[tone]}`}>{applicationStatus}</span>
                </div>
                <div className={styles.summaryItem}><span>Gender</span><strong>{value(application.child_gender)}</strong></div>
                <div className={styles.summaryItem}><span>Age</span><strong>{child.age} years</strong></div>
                <div className={styles.summaryItem}><span>Birthdate</span><strong>{date(application.child_birth_date)}</strong></div>
                <div className={styles.summaryItem}><span>Assigned CDC / Class</span><strong>{value(application.assigned_cdc_name || child.center_name)} / {value(application.child_class_name || child.class_name)}</strong></div>
                <div className={styles.summaryItem}><span>Blood Type</span><strong>{value(application.blood_type || child.blood_type)}</strong></div>
              </section>
              <div className={styles.detailCardGrid}>
                <section className={styles.detailCard}>
                  <h3><Icon name="user" />Child Information</h3>
                  {rows(groups[0]?.fields.map(({ label, value: current }) => ({ label, value: current })) ?? [])}
                </section>
                <section className={styles.detailCard}>
                  <h3><Icon name="family" />Parent / Guardian Information</h3>
                  {rows(groups[1]?.fields.map(({ label, value: current }) => ({ label, value: current })) ?? [])}
                  <div className={styles.emergencyCard}>
                    <strong>Emergency Contact</strong>
                    {rows(groups[2]?.fields.map(({ label, value: current }) => ({ label, value: current })) ?? [])}
                  </div>
                </section>
              </div>
              <section className={styles.detailCard}>
                <h3><Icon name="document" />Enrollment Information</h3>
                {rows([
                  { label: 'Application ID', value: application.application_number },
                  { label: 'Application Date', value: date(application.submitted_at) },
                  { label: 'Enrollment Status', value: applicationStatus },
                  { label: 'Enrollment Type', value: application.enrollment_type === 'new' ? 'New Enrollment' : 'Re-enrollment' },
                  { label: 'Child Development Center', value: value(application.cdc_name) },
                  { label: 'Assigned CDC / Class', value: `${value(application.assigned_cdc_name || child.center_name)} / ${value(application.child_class_name || child.class_name)}` },
                  { label: 'Medical Notes', value: value(application.medical_notes || child.medical_notes) },
                  { label: 'Allergies', value: value(application.allergies || child.allergies) },
                  { label: 'Immunization Status', value: value(application.immunization_status || child.immunization_status) },
                  { label: 'Previous Review Notes', value: value(application.review_note) },
                  { label: 'Reviewer', value: value([application.reviewer_first_name, application.reviewer_last_name].filter(Boolean).join(' ')) },
                  { label: 'Reviewer Role', value: value(application.reviewer_role) },
                  { label: 'Last Reviewed', value: dateTime(application.reviewed_at) },
                ])}
                <h4 className={styles.detailSubheading}>Uploaded Documents and Requirements</h4>
                {application.documents.length
                  ? <ul className={styles.documentList}>{application.documents.map((document) => <li key={document.id}><strong>{document.document_type.replaceAll('_', ' ')}</strong>: {document.original_name} ({document.mime_type || 'File type unavailable'}; {displayStatus(document.verification_status)}; uploaded {dateTime(document.uploaded_at)}) <button className={styles.documentLink} onClick={() => void downloadDocument(document)} type="button">Download</button></li>)}</ul>
                  : <p className={styles.detailHint}>No enrollment documents are linked to this application.</p>}
                <h4 className={styles.detailSubheading}>Requirements Completion Status</h4>
                <ul className={styles.requirementStatusList}>
                  {groups.slice(0, 3).flatMap((group) => group.fields).map((field) => {
                    const status = requestedKeys.has(field.key)
                      ? 'Correction Requested'
                      : field.value === 'Not provided' ? 'Incomplete' : 'For Verification';
                    return <li key={field.key}><span>{field.label}</span><strong className={styles[`requirement${status.replaceAll(' ', '')}`]}>{status}</strong><small>{field.value}</small></li>;
                  })}
                  {[
                    ['birth_certificate', 'PSA Birth Certificate'],
                    ['parent_id', 'Parent/Guardian Valid ID'],
                    ['parent_photo', 'Parent/Guardian Photo'],
                    ['barangay_clearance', 'Barangay Clearance'],
                    ['proof_of_residence', 'Proof of Residence'],
                    ...(application.medical_notes?.trim() ? [['medical_certificate', 'Medical Certificate']] : []),
                  ].map(([type, label]) => {
                    const document = application.documents.find((item) => item.document_type === type);
                    const status = requestedKeys.has(`document_${type}`)
                      ? 'Correction Requested'
                      : !document ? 'Incomplete'
                        : document.verification_status === 'verified' ? 'Complete'
                          : document.verification_status === 'rejected' ? 'Correction Requested' : 'For Verification';
                    return <li key={type}><span>{label}</span><strong className={styles[`requirement${status.replaceAll(' ', '')}`]}>{status}</strong><small>{document ? document.original_name : 'Not provided'}</small></li>;
                  })}
                </ul>
                {application.documents_requested_at && (
                  <div className={styles.requestedRequirements}>
                    <strong>Correction request sent {dateTime(application.documents_requested_at)}</strong>
                    {application.request_remarks && <p>{application.request_remarks}</p>}
                  </div>
                )}
                {application.review_history.length > 0 && <>
                  <h4 className={styles.detailSubheading}>Review History</h4>
                  <ol className={styles.reviewHistory}>{application.review_history.map((entry, index) => <li key={`${application.id}-${index}`}><strong>{displayStatus(entry.to_status)}</strong><time>{dateTime(entry.created_at)}</time><span>By {value([entry.reviewer_first_name, entry.reviewer_last_name].filter(Boolean).join(' '))} ({value(entry.reviewer_role)})</span>{entry.note && <p>{entry.note}</p>}</li>)}</ol>
                </>}
                <p className={styles.applicationLinkBanner}><Icon name="check" />Enrollment application is linked to this child record.</p>
              </section>
            </>
          )}
        </div>
        <footer className={styles.detailActions}>
          {action === 'approve' && (
            <form className={styles.reviewForm} onSubmit={(event) => { event.preventDefault(); void submitReview(); }}>
              <label htmlFor="application-approval-note">Optional approval notes</label>
              <textarea id="application-approval-note" maxLength={3000} onChange={(event) => setNote(event.target.value)} rows={3} value={note} />
              <div className={styles.reviewButtons}><button disabled={saving} type="submit">{saving ? 'Saving…' : 'Confirm Approval'}</button><button disabled={saving} onClick={() => setAction(null)} type="button">Cancel</button></div>
            </form>
          )}
          {error && action === 'approve' && <p className={styles.detailError} role="alert">{error}</p>}
          <div className={styles.detailActionButtons}>
            <button className={styles.closeAction} disabled={saving} onClick={onClose} type="button"><Icon name="close" />Close</button>
            {canReview && <>
              <button className={styles.approveAction} disabled={saving || action !== null} onClick={() => { setError(''); setAction('approve'); setNote(''); }} type="button"><Icon name="check" />Approve Enrollment</button>
              <button className={styles.rejectAction} disabled={saving || action !== null} onClick={() => { setError(''); setAction('reject'); setNote(''); }} type="button"><Icon name="close" />Reject Enrollment</button>
              <button className={styles.requirementsAction} disabled={saving || action !== null} onClick={() => { setError(''); setAction('requirements'); setSelected([]); setRemarks(''); setPreview(false); }} type="button"><Icon name="refresh" />Request Requirements</button>
            </>}
          </div>
        </footer>
        {action === 'reject' && application && child && (
          <div className={styles.reviewOverlay}>
            <section aria-labelledby="reject-application-title" aria-modal="true" className={styles.reviewDialog} role="dialog">
              <h2 id="reject-application-title">Reject Enrollment Application</h2>
              <p><strong>Child:</strong> {fullName}</p><p><strong>Child ID:</strong> {childNumber(child.id)}</p>
              <form onSubmit={(event) => { event.preventDefault(); void submitReview(); }}>
                <label htmlFor="rejection-reason">Reason for Rejection</label>
                <textarea autoFocus id="rejection-reason" maxLength={3000} onChange={(event) => setNote(event.target.value)} required rows={5} value={note} />
                {error && <p className={styles.detailError} role="alert">{error}</p>}
                <div className={styles.reviewDialogActions}><button disabled={saving} onClick={() => setAction(null)} type="button">Cancel</button><button className={styles.rejectAction} disabled={saving} type="submit">{saving ? 'Rejecting…' : 'Confirm Rejection'}</button></div>
              </form>
            </section>
          </div>
        )}
        {action === 'requirements' && application && child && (
          <div className={styles.reviewOverlay}>
            <section aria-labelledby="requirements-title" aria-modal="true" className={`${styles.reviewDialog} ${styles.requirementsDialog}`} role="dialog">
              <h2 id="requirements-title">{preview ? 'Preview Parent Notification' : 'Request Additional Requirements'}</h2>
              <div className={styles.requirementContext}><span><strong>Child:</strong> {fullName}</span><span><strong>Child ID:</strong> {childNumber(child.id)}</span><span><strong>Parent / Guardian:</strong> {parentName}</span><span><strong>Application:</strong> {application.application_number}</span></div>
              {!preview ? <>
                <div className={styles.requirementChecklist}>
                  {groups.map((group) => {
                    const applicableFields = group.fields.filter((field) => editableRequirementKeys.has(field.key));
                    return applicableFields.length > 0 && <fieldset key={group.title}><legend>{group.title}</legend>{applicableFields.map((field) => <label className={styles.requirementOption} key={field.key}><input checked={selected.includes(field.key)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, field.key] : current.filter((key) => key !== field.key))} type="checkbox" /><span><strong>{field.label}:</strong> {field.value}</span></label>)}</fieldset>;
                  })}
                </div>
                <label className={styles.requirementRemarksLabel} htmlFor="requirement-remarks">Additional Remarks / Instructions (optional)</label>
                <textarea id="requirement-remarks" maxLength={2000} onChange={(event) => setRemarks(event.target.value)} rows={3} value={remarks} />
                {error && <p className={styles.detailError} role="alert">{error}</p>}
                <div className={styles.reviewDialogActions}><button disabled={saving} onClick={() => setAction(null)} type="button">Cancel</button><button className={styles.approveAction} disabled={!selected.length || saving} onClick={() => { setError(''); setPreview(true); }} type="button">Preview Request</button></div>
              </> : <>
                <div className={styles.requirementPreview}>
                  <h3>Enrollment Information Requires Attention</h3>
                  <p>Hello {parentName},</p>
                  <p>We have reviewed the enrollment application for {fullName}. Please review, verify, or provide corrections for the following information:</p>
                  <ul>{selectedFields.map((field) => <li key={field.key}><strong>{field.label}:</strong> {field.value}</li>)}</ul>
                  {remarks.trim() && <p><strong>Additional Remarks:</strong> {remarks.trim()}</p>}
                  <p>Please log in to your KalingaLink Parent Account, open your child's enrollment application, and update the requested information.</p>
                  <p>Thank you,<br />KalingaLink – Child Development Center</p>
                </div>
                {error && <p className={styles.detailError} role="alert">{error}</p>}
                <div className={styles.reviewDialogActions}><button disabled={saving} onClick={() => { setError(''); setPreview(false); }} type="button">Back / Edit Checklist</button><button disabled={saving} onClick={() => setAction(null)} type="button">Cancel</button><button className={styles.requirementsAction} disabled={saving} onClick={() => void submitReview()} type="button">{saving ? 'Sending…' : 'Send Request'}</button></div>
              </>}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
