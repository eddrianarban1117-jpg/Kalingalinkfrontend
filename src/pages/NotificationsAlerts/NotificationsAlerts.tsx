import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import { EventNotifications, type AdminPublishedAnnouncement } from '../EventNotifications/EventNotifications';
import styles from './NotificationsAlerts.module.css';

type Audience = 'parents' | 'teachers' | 'all-users';
type Category =
  | 'General'
  | 'Enrollment'
  | 'Meeting'
  | 'Health'
  | 'Training'
  | 'Event'
  | 'System Update';

type Announcement = AdminPublishedAnnouncement;

type AnnouncementResponse = {
  status: boolean;
  data: Announcement[];
};

const categories: Category[] = [
  'General',
  'Enrollment',
  'Meeting',
  'Health',
  'Training',
  'Event',
  'System Update',
];

const audiences: { value: Audience; label: string }[] = [
  { value: 'parents', label: 'Parents' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'all-users', label: 'All Users' },
];

function Icon({ name }: { name: 'announcement' | 'check' | 'calendar' | 'search' | 'eye' | 'edit' | 'delete' | 'plus' | 'close' | 'file' | 'chevron' }) {
  const shared = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };
  switch (name) {
    case 'announcement':
      return <svg {...shared}><path d="m3 11 18-7v16L3 13zm0 0v2a3 3 0 0 0 3 3h2l2 4h3l-2-5" /></svg>;
    case 'check':
      return <svg {...shared}><path d="m5 12 4 4L19 6" /></svg>;
    case 'calendar':
      return <svg {...shared}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></svg>;
    case 'search':
      return <svg {...shared}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>;
    case 'eye':
      return <svg {...shared}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'edit':
      return <svg {...shared}><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /></svg>;
    case 'delete':
      return <svg {...shared}><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>;
    case 'plus':
      return <svg {...shared}><path d="M12 5v14m-7-7h14" /></svg>;
    case 'close':
      return <svg {...shared}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case 'file':
      return <svg {...shared}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8m-8 4h8" /></svg>;
    default:
      return <svg {...shared}><path d="m9 18 6-6-6-6" /></svg>;
  }
}

function localDateTime(value?: string) {
  const date = value ? new Date(value.replace(' ', 'T')) : new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function NotificationsAlerts() {
  const { request, accessToken } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const latestRequest = useRef(0);

  const loadAnnouncements = useCallback(async (showLoading = false) => {
    const requestId = ++latestRequest.current;
    if (showLoading) setLoading(true);
    try {
      const result = await request<AnnouncementResponse>('/api/announcements');
      if (requestId !== latestRequest.current) return;
      setAnnouncements(result.data);
      setError('');
    } catch (loadError) {
      if (requestId === latestRequest.current) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load announcements.');
      }
    } finally {
      if (showLoading && requestId === latestRequest.current) setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    let active = true;
    const refreshWhenVisible = () => {
      if (active && document.visibilityState === 'visible') {
        void loadAnnouncements();
      }
    };
    void loadAnnouncements(true);
    const interval = window.setInterval(refreshWhenVisible, 15_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      latestRequest.current += 1;
    };
  }, [loadAnnouncements]);

  const counts = {
    total: announcements.length,
    published: announcements.filter((item) => item.status === 'published').length,
    drafts: announcements.filter((item) => item.status === 'draft').length,
    scheduled: announcements.filter((item) => item.status === 'scheduled').length,
  };

  function beginCreate() {
    setEditing(null);
    setError('');
    setFormOpen(true);
  }

  function beginEdit(item: Announcement) {
    setEditing(item);
    setError('');
    setFormOpen(true);
  }

  async function submitAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const requestedStatus = formData.get('status');
    if (requestedStatus !== 'draft' && requestedStatus !== 'published' && requestedStatus !== 'scheduled') {
      setError('Choose a valid announcement status.');
      return;
    }
    const status = requestedStatus;
    if (status === 'published') formData.set('published_at', localDateTime());
    if (status === 'scheduled' && !formData.get('published_at')) {
      setError('Choose a future publication date and time to schedule this announcement.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const path = editing
        ? `/api/announcements/${editing.id}`
        : '/api/announcements';
      await request(path, { method: 'POST', body: formData });
      setFormOpen(false);
      setNotice(editing ? 'Announcement updated.' : 'Announcement created.');
      await loadAnnouncements();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the announcement.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await request(`/api/announcements/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setNotice('Announcement deleted.');
      await loadAnnouncements();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete the announcement.');
    } finally {
      setSaving(false);
    }
  }

  async function downloadAttachment(item: Announcement) {
    if (!item.attachment || !accessToken) return;
    setError('');
    try {
      const response = await fetch(item.attachment.download_url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('The attachment could not be downloaded.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = item.attachment.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'The attachment could not be downloaded.');
    }
  }

  return (
    <section className={styles.page}>
      <EventNotifications
        adminView
        announcements={announcements}
        announcementsLoading={loading}
        adminSummary={
          <>
            <header className={styles.pageHeader}>
              <span aria-hidden="true" className={styles.titleIcon}><Icon name="announcement" /></span>
              <div className={styles.headingCopy}>
                <h1>Announcement Management</h1>
                <p>Published announcements appear in the Published notification filter.</p>
              </div>
            </header>
            <section aria-label="Announcement summary" className={styles.stats}>
              {([
                ['Total Announcements', counts.total, 'blue', 'All records'],
                ['Published', counts.published, 'teal', 'Visible to audience'],
                ['Drafts', counts.drafts, 'orange', 'Saved but not published'],
                ['Scheduled', counts.scheduled, 'purple', 'Set for future release'],
              ] as const).map(([label, count, tone, detail]) => (
                <article className={`${styles.statCard} ${styles[tone]}`} key={label}>
                  <span className={styles.statIcon}><Icon name={label === 'Published' ? 'check' : label === 'Scheduled' ? 'calendar' : 'announcement'} /></span>
                  <span className={styles.statText}><span>{label}</span><strong>{loading ? <BouncingDots size="small" inline /> : count}</strong><small>{detail}</small></span>
                </article>
              ))}
            </section>
          </>
        }
        onCreateAnnouncement={beginCreate}
        onEditAnnouncement={beginEdit}
        onDeleteAnnouncement={setDeleteTarget}
        onDownloadAnnouncement={(announcement) => void downloadAttachment(announcement)}
      />

      {error && <p className={styles.errorBanner} role="alert">{error}</p>}
      {notice && <p className={styles.successBanner} role="status">{notice}</p>}

      {formOpen && (
        <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}>
          <section aria-labelledby="announcement-form-title" aria-modal="true" className={`${styles.modal} ${styles.formModal}`} role="dialog">
            <header className={styles.modalHeader}>
              <span aria-hidden="true" className={styles.modalHeaderIcon}><Icon name="announcement" /></span>
              <div className={styles.modalHeaderCopy}>
                <h2 id="announcement-form-title">{editing ? 'Edit Announcement' : 'Create Announcement'}</h2>
                <p>Share important information with your selected audience.</p>
              </div>
              <button aria-label="Close form" onClick={() => setFormOpen(false)} type="button"><Icon name="close" /></button>
            </header>
            <form onSubmit={(event) => void submitAnnouncement(event)}>
              <input defaultValue={editing?.status ?? 'draft'} name="status" type="hidden" />
              <div className={styles.formFields}>
                <div className={styles.formSectionTitle}>Announcement Details</div>
                <label className={styles.fullField}>Title *<input defaultValue={editing?.title ?? ''} maxLength={180} name="title" placeholder="Enter announcement title..." required /></label>
                <label className={styles.fullField}>Content *<textarea defaultValue={editing?.message ?? ''} name="message" placeholder="Write your announcement here..." required rows={5} /></label>
                <div className={styles.formSectionTitle}>Additional Information</div>
                <label>Category *<select defaultValue={editing?.category ?? 'General'} name="category" required>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>Target Audience *<select defaultValue={editing?.audience ?? 'all-users'} name="audience" required>{audiences.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className={styles.fullField}>Publish Date and Time<input defaultValue={localDateTime(editing?.published_at)} name="published_at" type="datetime-local" /></label>
                <label className={styles.fullField}>Cover Image or Attachment (optional, PDF, JPG, or PNG; max 10 MB)<input accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" name="attachment" type="file" /></label>
                {editing?.attachment && <div className={styles.fullField}><span className={styles.currentAttachment}><Icon name="file" /> Existing: {editing.attachment.name}</span><label className={styles.removeAttachment}><input name="remove_attachment" type="checkbox" value="true" /> Remove existing attachment</label></div>}
              </div>
              {error && <p className={styles.errorBanner} role="alert">{error}</p>}
              <footer className={styles.formActions}>
                <button className={styles.secondaryButton} disabled={saving} onClick={() => setFormOpen(false)} type="button">Cancel</button>
                <button className={styles.secondaryButton} disabled={saving} onClick={(event) => { const form = event.currentTarget.form; const statusField = form?.querySelector<HTMLInputElement>('input[name="status"]'); if (form && statusField) { statusField.value = 'draft'; form.requestSubmit(); } }} type="button">Save as Draft</button>
                <button className={styles.secondaryButton} disabled={saving} onClick={(event) => { const form = event.currentTarget.form; const statusField = form?.querySelector<HTMLInputElement>('input[name="status"]'); if (form && statusField) { statusField.value = 'scheduled'; form.requestSubmit(); } }} type="button">Schedule Announcement</button>
                <button className={styles.primaryButton} disabled={saving} onClick={(event) => { const form = event.currentTarget.form; const statusField = form?.querySelector<HTMLInputElement>('input[name="status"]'); if (form && statusField) { statusField.value = 'published'; form.requestSubmit(); } }} type="button">{saving ? 'Saving…' : 'Publish Announcement'}</button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.modalBackdrop}>
          <section aria-labelledby="delete-title" aria-modal="true" className={styles.deleteModal} role="alertdialog">
            <span className={styles.deleteIcon}><Icon name="delete" /></span>
            <h2 id="delete-title">Delete Announcement</h2>
            <p>Are you sure you want to delete this announcement?</p>
            <div className={styles.formActions}>
              <button className={styles.secondaryButton} disabled={saving} onClick={() => setDeleteTarget(null)} type="button">Cancel</button>
              <button className={styles.dangerButton} disabled={saving} onClick={() => void confirmDelete()} type="button"><Icon name="delete" />{saving ? 'Deleting…' : 'Delete'}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
