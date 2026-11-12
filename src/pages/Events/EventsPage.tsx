import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import { Icon } from '../../components/common/Icon/Icon';
import styles from './EventsPage.module.css';

type EventPhoto = {
  id: number;
  caption: string | null;
  uploaded_by: string;
  uploaded_at: string;
  image_url: string;
  can_manage: boolean;
};

type EventAlbum = {
  id: number;
  name: string;
  photos: EventPhoto[];
};

type EventRecord = {
  id: number;
  title: string;
  event_date: string;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue?: string | null;
  cdc_id?: number | null;
  cdc_name?: string | null;
  created_by?: string;
  creator_id?: number | null;
  can_manage?: boolean;
  has_photos?: boolean;
  created_at?: string;
  updated_at?: string | null;
  album?: EventAlbum | null;
};

type EventDraft = {
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  cdc_id: string;
};

type Center = { id: number; name: string };
type ApiList<T> = { data: T[] };
type ApiEvent = { data: EventRecord };
type EventStatus = 'Upcoming' | 'Ongoing' | 'Past';

const EVENTS_PER_PAGE = 8;

const emptyDraft: EventDraft = {
  title: '',
  description: '',
  event_date: '',
  start_time: '',
  end_time: '',
  venue: '',
  cdc_id: '',
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
}

function formatTime(value?: string | null) {
  if (!value) return '';
  const [hours, minutes] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getEventStatus(event: EventRecord, now = new Date()): EventStatus {
  const today = localDateKey(now);
  if (event.event_date > today) return 'Upcoming';
  if (event.event_date < today) return 'Past';

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = event.start_time
    ? Number(event.start_time.slice(0, 2)) * 60 +
      Number(event.start_time.slice(3, 5))
    : null;
  const end = event.end_time
    ? Number(event.end_time.slice(0, 2)) * 60 +
      Number(event.end_time.slice(3, 5))
    : null;
  if (start !== null && currentMinutes < start) return 'Upcoming';
  if (end !== null && currentMinutes > end) return 'Past';
  return 'Ongoing';
}

function getEventTime(event: EventRecord) {
  return (
    [formatTime(event.start_time), formatTime(event.end_time)]
      .filter(Boolean)
      .join(' – ') || 'Not specified'
  );
}

function EventPhotoImage({
  photo,
  accessToken,
  imageClassName = '',
}: {
  photo: EventPhoto;
  accessToken: string | null;
  imageClassName?: string;
}) {
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    const headers = new Headers();
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    void fetch(`${apiBaseUrl}${photo.image_url}`, {
      credentials: 'include',
      headers,
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          let message = `The photo could not be loaded (HTTP ${response.status}).`;
          try {
            const body = (await response.json()) as {
              error?: string;
              message?: string;
            };
            message = body.message ?? body.error ?? message;
          } catch {
            // Keep the HTTP status message when the server does not return JSON.
          }
          throw new Error(message);
        }
        objectUrl = URL.createObjectURL(await response.blob());
        setImageUrl(objectUrl);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'The photo could not be loaded.',
          );
        }
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessToken, photo.image_url]);

  if (error)
    return (
      <div className={styles.imageError} role="img">
        {error}
      </div>
    );
  if (!imageUrl)
    return <div className={styles.imageLoading}><BouncingDots label="Loading photo" size="small" /></div>;
  return (
    <img
      alt={photo.caption || 'Event album photo'}
      className={imageClassName}
      src={imageUrl}
    />
  );
}

export function EventsPage({ mode }: { mode: 'manage' | 'parent' }) {
  const { user, accessToken, request } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const canManageEvents =
    mode === 'manage' && (user?.role === 'admin' || user?.role === 'teacher');
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [editingPhoto, setEditingPhoto] = useState<number | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<EventPhoto | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [cdcFilter, setCdcFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const detailRequestId = useRef(0);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await request<ApiList<EventRecord>>('/api/events');
      setEvents(response.data);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Events could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  const loadEvent = useCallback(
    async (id: number) => {
      const requestId = ++detailRequestId.current;
      setDetailLoading(true);
      setError('');
      try {
        const response = await request<ApiEvent>(`/api/events/${id}`);
        if (requestId === detailRequestId.current)
          setSelectedEvent(response.data);
      } catch (cause) {
        if (requestId === detailRequestId.current) {
          setSelectedEvent(null);
          setError(
            cause instanceof Error
              ? cause.message
              : 'Event details could not be loaded.',
          );
        }
      } finally {
        if (requestId === detailRequestId.current) setDetailLoading(false);
      }
    },
    [request],
  );

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const eventId = Number(new URLSearchParams(location.search).get('event'));
    if (Number.isSafeInteger(eventId) && eventId > 0) setSelectedId(eventId);
  }, [location.search]);

  useEffect(() => {
    if (!canManageEvents) return;
    let active = true;
    void request<ApiList<Center>>('/api/cdcs')
      .then((response) => {
        if (active) setCenters(response.data);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Child Development Centers could not be loaded.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [canManageEvents, request]);

  useEffect(() => {
    if (selectedId !== null) void loadEvent(selectedId);
  }, [loadEvent, selectedId]);

  useEffect(() => {
    setPreviewPhoto(null);
    setIsUploadOpen(false);
    setShowAllPhotos(false);
    setSelectedFiles([]);
    setCaption('');
  }, [selectedId]);

  useEffect(() => {
    if (!previewPhoto) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setPreviewPhoto(null);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [previewPhoto]);

  useEffect(() => {
    setCurrentPage(1);
  }, [eventSearch, dateFilter, cdcFilter]);

  function closeEventDetails() {
    detailRequestId.current += 1;
    setSelectedId(null);
    setSelectedEvent(null);
    setDetailLoading(false);
    setError('');
    if (new URLSearchParams(location.search).has('event')) {
      navigate(location.pathname, { replace: true });
    }
  }

  function beginCreate() {
    detailRequestId.current += 1;
    setSelectedId(null);
    setSelectedEvent(null);
    setEditingId(null);
    setDraft(emptyDraft);
    setMessage('');
    setError('');
    setIsFormOpen(true);
  }

  function beginEdit(event: EventRecord) {
    if (!canManageEvents || !event.can_manage) return;
    setEditingId(event.id);
    setDraft({
      title: event.title,
      description: event.description ?? '',
      event_date: event.event_date,
      start_time: event.start_time?.slice(0, 5) ?? '',
      end_time: event.end_time?.slice(0, 5) ?? '',
      venue: event.venue ?? '',
      cdc_id: event.cdc_id ? String(event.cdc_id) : '',
    });
    setMessage('');
    setError('');
    setIsFormOpen(true);
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    const endpoint =
      editingId === null ? '/api/events' : `/api/events/${editingId}`;
    try {
      await request(endpoint, {
        method: editingId === null ? 'POST' : 'PUT',
        body: JSON.stringify({
          ...draft,
          cdc_id: draft.cdc_id || null,
        }),
      });
      setIsFormOpen(false);
      setMessage(editingId === null ? 'Event created.' : 'Event updated.');
      await loadEvents();
      if (editingId !== null && selectedId === editingId) {
        await loadEvent(editingId);
      } else if (editingId === null) {
        setSelectedId(null);
        setSelectedEvent(null);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The event could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(event: EventRecord) {
    if (!canManageEvents || !event.can_manage) return;
    if (
      !window.confirm(
        `Delete “${event.title}” and its event album? This cannot be undone.`,
      )
    ) {
      return;
    }
    setError('');
    setMessage('');
    try {
      await request(`/api/events/${event.id}`, { method: 'DELETE' });
      closeEventDetails();
      setMessage('Event and its album were deleted.');
      await loadEvents();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The event could not be deleted.',
      );
    }
  }

  async function createAlbum() {
    if (selectedId === null) return;
    setError('');
    try {
      await request(`/api/events/${selectedId}/album`, { method: 'POST' });
      await loadEvent(selectedId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The album could not be created.',
      );
    }
  }

  async function uploadPhotos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedId === null || selectedFiles.length === 0) return;
    const form = event.currentTarget;
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('photos[]', file));
    formData.append('caption', caption);
    setError('');
    setMessage('');
    setUploading(true);
    try {
      await request(`/api/events/${selectedId}/photos`, {
        method: 'POST',
        body: formData,
      });
      setSelectedFiles([]);
      setCaption('');
      setIsUploadOpen(false);
      form.reset();
      setMessage('Photos added to the shared album.');
      await loadEvent(selectedId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Photos could not be uploaded.',
      );
    } finally {
      setUploading(false);
    }
  }

  async function savePhotoCaption(photoId: number) {
    if (selectedId === null) return;
    setError('');
    try {
      await request(`/api/events/photos/${photoId}`, {
        method: 'PATCH',
        body: JSON.stringify({ caption: photoCaption }),
      });
      setEditingPhoto(null);
      await loadEvent(selectedId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The photo caption could not be saved.',
      );
    }
  }

  async function deletePhoto(photo: EventPhoto) {
    if (!window.confirm('Delete this photo from the shared event album?'))
      return;
    if (selectedId === null) return;
    setError('');
    try {
      await request(`/api/events/photos/${photo.id}`, { method: 'DELETE' });
      await loadEvent(selectedId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The photo could not be deleted.',
      );
    }
  }

  const today = localDateKey(now);
  const upcomingCount = events.filter(
    (event) => event.event_date > today,
  ).length;
  const pastCount = events.filter((event) => event.event_date < today).length;
  const photosCount = events.filter((event) => event.has_photos).length;
  const availableCdcs = Array.from(
    new Map(
      events
        .filter((event) => event.cdc_id != null && event.cdc_name)
        .map((event) => [
          String(event.cdc_id),
          { id: event.cdc_id as number, name: event.cdc_name as string },
        ]),
    ).values(),
  );
  const normalizedSearch = eventSearch.trim().toLocaleLowerCase();
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      !normalizedSearch ||
      [
        event.title,
        event.description,
        event.venue,
        event.cdc_name,
        event.created_by,
      ]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalizedSearch));
    const matchesDate =
      dateFilter === 'all' ||
      getEventStatus(event, now).toLocaleLowerCase() === dateFilter;
    const matchesCdc =
      cdcFilter === 'all' || String(event.cdc_id ?? '') === cdcFilter;
    return matchesSearch && matchesDate && matchesCdc;
  });
  const pageCount = Math.max(
    1,
    Math.ceil(filteredEvents.length / EVENTS_PER_PAGE),
  );
  const pageEvents = filteredEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE,
  );
  const firstVisibleEvent =
    filteredEvents.length === 0 ? 0 : (currentPage - 1) * EVENTS_PER_PAGE + 1;
  const lastVisibleEvent = Math.min(
    currentPage * EVENTS_PER_PAGE,
    filteredEvents.length,
  );

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  return (
    <main
      aria-label={mode === 'manage' ? 'Events management' : 'Events'}
      className={styles.page}
    >
      {selectedId === null && (
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>KALINGALINK</p>
            <h1>{mode === 'manage' ? 'Events Management' : 'Events'}</h1>
            <p>
              {mode === 'manage'
                ? 'Create and manage events for all users in the KalingaLink community.'
                : 'View upcoming events and the community photo albums.'}
            </p>
          </div>
          {canManageEvents && !isFormOpen && (
            <button
              className={styles.primaryButton}
              onClick={beginCreate}
              type="button"
            >
              <Icon name="plus" />
              Create Event
            </button>
          )}
        </header>
      )}

      {canManageEvents && selectedId === null && !isFormOpen && (
        <>
          <section aria-label="Event summaries" className={styles.summaryGrid}>
            <article className={styles.summaryCard}>
              <span className={`${styles.summaryIcon} ${styles.summaryBlue}`}>
                <Icon name="calendar" />
              </span>
              <div>
                <strong>{events.length}</strong>
                <span>Total Events</span>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={`${styles.summaryIcon} ${styles.summaryGreen}`}>
                <Icon name="clock" />
              </span>
              <div>
                <strong>{upcomingCount}</strong>
                <span>Upcoming Events</span>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={`${styles.summaryIcon} ${styles.summaryPurple}`}>
                <Icon name="calendar" />
              </span>
              <div>
                <strong>{pastCount}</strong>
                <span>Past Events</span>
              </div>
            </article>
            <article className={styles.summaryCard}>
              <span className={`${styles.summaryIcon} ${styles.summaryOrange}`}>
                <Icon name="image" />
              </span>
              <div>
                <strong>{photosCount}</strong>
                <span>With Photos</span>
              </div>
            </article>
          </section>

          <section
            aria-label="Search and filter events"
            className={styles.filters}
          >
            <label className={styles.searchField}>
              <Icon name="search" />
              <input
                onChange={(event) => setEventSearch(event.target.value)}
                placeholder="Search events..."
                value={eventSearch}
              />
            </label>
            <label className={styles.filterField}>
              <span>Date</span>
              <select
                onChange={(event) => setDateFilter(event.target.value)}
                value={dateFilter}
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Past</option>
              </select>
            </label>
            {availableCdcs.length > 0 && (
              <label className={styles.filterField}>
                <span>Child Development Center</span>
                <select
                  onChange={(event) => setCdcFilter(event.target.value)}
                  value={cdcFilter}
                >
                  <option value="all">All CDCs</option>
                  {availableCdcs.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              className={styles.refreshButton}
              disabled={loading}
              onClick={() => void loadEvents()}
              type="button"
            >
              <Icon name="refresh" />
              {loading ? <BouncingDots label="Refreshing events" size="small" inline /> : 'Refresh'}
            </button>
          </section>
        </>
      )}

      {message && (
        <p className={styles.successMessage} role="status">
          {message}
        </p>
      )}
      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}

      {isFormOpen && canManageEvents ? (
        <section aria-labelledby="event-form-heading" className={styles.panel}>
          <h2 id="event-form-heading">
            {editingId === null ? 'Create Event' : 'Edit Event'}
          </h2>
          <form
            className={styles.eventForm}
            onSubmit={(event) => void saveEvent(event)}
          >
            <label>
              Event Title
              <input
                maxLength={180}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                required
                value={draft.title}
              />
            </label>
            <label>
              Event Date
              <input
                onChange={(event) =>
                  setDraft({ ...draft, event_date: event.target.value })
                }
                required
                type="date"
                value={draft.event_date}
              />
            </label>
            <label>
              Start Time
              <input
                onChange={(event) =>
                  setDraft({ ...draft, start_time: event.target.value })
                }
                type="time"
                value={draft.start_time}
              />
            </label>
            <label>
              End Time
              <input
                onChange={(event) =>
                  setDraft({ ...draft, end_time: event.target.value })
                }
                type="time"
                value={draft.end_time}
              />
            </label>
            <label>
              Venue / Location
              <input
                maxLength={255}
                onChange={(event) =>
                  setDraft({ ...draft, venue: event.target.value })
                }
                value={draft.venue}
              />
            </label>
            <label>
              Related Child Development Center
              <select
                onChange={(event) =>
                  setDraft({ ...draft, cdc_id: event.target.value })
                }
                value={draft.cdc_id}
              >
                <option value="">All CDCs / not CDC-specific</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.fullWidth}>
              Event Description
              <textarea
                maxLength={10000}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                rows={4}
                value={draft.description}
              />
            </label>
            <div className={`${styles.formActions} ${styles.fullWidth}`}>
              <button
                className={styles.secondaryButton}
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                disabled={saving}
                type="submit"
              >
                {saving
                  ? 'Saving…'
                  : editingId === null
                    ? 'Create Event'
                    : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>
      ) : selectedId !== null ? (
        <section className={styles.detailView}>
          <button
            className={styles.backButton}
            onClick={closeEventDetails}
            type="button"
          >
            <Icon name="back" />
            Back to Events
          </button>
          {detailLoading && (
            <p className={styles.emptyState}><BouncingDots label="Loading event details" /></p>
          )}
          {selectedEvent && (
            <>
              <header className={styles.eventPageHeader}>
                <div className={styles.eventTitleBlock}>
                  <span className={styles.eventHeroIcon}>
                    <Icon name="calendar" />
                  </span>
                  <div className={styles.eventTitleText}>
                    <h1>{selectedEvent.title}</h1>
                    <p>
                      {selectedEvent.description ||
                        'Event information and shared photos.'}
                    </p>
                  </div>
                </div>
                {canManageEvents && selectedEvent.can_manage && (
                  <div className={styles.eventActions}>
                    <button
                      className={styles.primaryButton}
                      onClick={() => beginEdit(selectedEvent)}
                      type="button"
                    >
                      <Icon name="edit" />
                      Edit Event
                    </button>
                    <button
                      className={styles.dangerButton}
                      onClick={() => void deleteEvent(selectedEvent)}
                      type="button"
                    >
                      <Icon name="trash" />
                      Delete Event
                    </button>
                  </div>
                )}
              </header>

              <article
                aria-labelledby="event-details-heading"
                className={`${styles.panel} ${styles.detailsPanel}`}
              >
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>
                    <Icon name="file" />
                  </span>
                  <h2 id="event-details-heading">Event Details</h2>
                </div>
                <div className={styles.detailColumns}>
                  <div className={styles.detailColumn}>
                    <div className={styles.detailItem}>
                      <Icon className={styles.detailIcon} name="calendar" />
                      <div>
                        <h3>Event Date</h3>
                        <p>{formatDate(selectedEvent.event_date)}</p>
                      </div>
                    </div>
                    <div className={styles.detailItem}>
                      <Icon className={styles.detailIcon} name="clock" />
                      <div>
                        <h3>Start Time and End Time</h3>
                        <p>
                          {formatTime(selectedEvent.start_time) ||
                            (canManageEvents ? 'Not specified' : 'Not shared')}
                          {' – '}
                          {formatTime(selectedEvent.end_time) ||
                            (canManageEvents ? 'Not specified' : 'Not shared')}
                        </p>
                      </div>
                    </div>
                    <div className={styles.detailItem}>
                      <Icon className={styles.detailIcon} name="location" />
                      <div>
                        <h3>Venue / Location</h3>
                        <p>
                          {selectedEvent.venue ||
                            (canManageEvents ? 'Not specified' : 'Not shared')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.detailColumn}>
                    <div className={styles.detailItem}>
                      <Icon className={styles.detailIcon} name="building" />
                      <div>
                        <h3>Related Child Development Center</h3>
                        <p>
                          {selectedEvent.cdc_name ||
                            (canManageEvents
                              ? 'All CDCs / not CDC-specific'
                              : 'Not shared')}
                        </p>
                      </div>
                    </div>
                    <div className={styles.detailItem}>
                      <Icon className={styles.detailIcon} name="file" />
                      <div>
                        <h3>Event Description</h3>
                        <p className={styles.descriptionValue}>
                          {selectedEvent.description ||
                            (canManageEvents
                              ? 'No description provided.'
                              : 'Not shared')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <section
                aria-labelledby="event-album-heading"
                className={`${styles.panel} ${styles.albumPanel}`}
              >
                <div className={styles.albumHeader}>
                  <div className={styles.albumTitle}>
                    <span className={styles.sectionIcon}>
                      <Icon name="image" />
                    </span>
                    <h2 id="event-album-heading">
                      Shared Event Album
                      <span>
                        ({selectedEvent.album?.photos.length ?? 0}{' '}
                        {(selectedEvent.album?.photos.length ?? 0) === 1
                          ? 'Photo'
                          : 'Photos'}
                        )
                      </span>
                    </h2>
                  </div>
                  {selectedEvent.album || mode === 'parent' ? (
                    <button
                      className={styles.primaryButton}
                      onClick={() => setIsUploadOpen((open) => !open)}
                      type="button"
                    >
                      <Icon name="upload" />
                      {isUploadOpen ? 'Close Upload' : 'Upload Photos'}
                    </button>
                  ) : (
                    <button
                      className={styles.primaryButton}
                      onClick={() => void createAlbum()}
                      type="button"
                    >
                      <Icon name="image" />
                      Create Album
                    </button>
                  )}
                </div>

                {(selectedEvent.album || mode === 'parent') && (
                  <>
                    {isUploadOpen && (
                      <form
                        className={styles.uploadForm}
                        onSubmit={(event) => void uploadPhotos(event)}
                      >
                        <label>
                          Choose photos
                          <input
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            disabled={uploading}
                            multiple
                            onChange={(event) =>
                              setSelectedFiles(
                                Array.from(event.target.files ?? []),
                              )
                            }
                            type="file"
                          />
                        </label>
                        <label>
                          Caption (optional)
                          <input
                            disabled={uploading}
                            maxLength={500}
                            onChange={(event) => setCaption(event.target.value)}
                            value={caption}
                          />
                        </label>
                        <button
                          className={styles.primaryButton}
                          disabled={uploading || selectedFiles.length === 0}
                          type="submit"
                        >
                          <Icon name="upload" />
                          {uploading
                            ? 'Uploading…'
                            : selectedFiles.length
                              ? `Upload ${selectedFiles.length} ${
                                  selectedFiles.length === 1
                                    ? 'Photo'
                                    : 'Photos'
                                }`
                              : 'Upload Photos'}
                        </button>
                        <span className={styles.uploadHint}>
                          JPG, JPEG, PNG, or WebP · up to 5 MB each · maximum 10
                          per upload
                        </span>
                      </form>
                    )}

                    {selectedEvent.album?.photos.length ? (
                      <>
                        <div className={styles.gallery}>
                          {selectedEvent.album.photos
                            .slice(0, showAllPhotos ? undefined : 5)
                            .map((photo) => (
                              <article
                                className={styles.photoCard}
                                key={photo.id}
                              >
                                <div className={styles.photoFrame}>
                                  <button
                                    aria-label={`View photo: ${photo.caption || 'Event album photo'}`}
                                    className={styles.photoPreviewButton}
                                    onClick={() => setPreviewPhoto(photo)}
                                    type="button"
                                  >
                                    <EventPhotoImage
                                      accessToken={accessToken}
                                      photo={photo}
                                    />
                                  </button>
                                </div>
                                <div className={styles.photoInfo}>
                                  {editingPhoto === photo.id ? (
                                    <div className={styles.captionEditor}>
                                      <input
                                        aria-label="Photo caption"
                                        maxLength={500}
                                        onChange={(event) =>
                                          setPhotoCaption(event.target.value)
                                        }
                                        value={photoCaption}
                                      />
                                      <button
                                        onClick={() =>
                                          void savePhotoCaption(photo.id)
                                        }
                                        type="button"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingPhoto(null)}
                                        type="button"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    photo.caption && <p>{photo.caption}</p>
                                  )}
                                  <span>Uploaded by {photo.uploaded_by}</span>
                                  <time dateTime={photo.uploaded_at}>
                                    {new Date(
                                      photo.uploaded_at,
                                    ).toLocaleDateString('en-PH')}
                                  </time>
                                  {photo.can_manage &&
                                    editingPhoto !== photo.id && (
                                      <div className={styles.photoActions}>
                                        <button
                                          onClick={() => {
                                            setEditingPhoto(photo.id);
                                            setPhotoCaption(
                                              photo.caption ?? '',
                                            );
                                          }}
                                          type="button"
                                        >
                                          Edit caption
                                        </button>
                                        <button
                                          onClick={() =>
                                            void deletePhoto(photo)
                                          }
                                          type="button"
                                        >
                                          Delete photo
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </article>
                            ))}
                        </div>
                        {selectedEvent.album.photos.length > 5 && (
                          <div className={styles.galleryFooter}>
                            <button
                              className={styles.viewAllButton}
                              onClick={() =>
                                setShowAllPhotos((showing) => !showing)
                              }
                              type="button"
                            >
                              {showAllPhotos
                                ? 'Show fewer photos'
                                : `View All Photos (${selectedEvent.album.photos.length})`}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className={styles.emptyState}>
                        <Icon name="image" />
                        No photos have been uploaded yet.
                      </p>
                    )}
                  </>
                )}
              </section>
              {previewPhoto && (
                <div
                  aria-label="Photo preview"
                  aria-modal="true"
                  className={styles.photoLightbox}
                  onClick={() => setPreviewPhoto(null)}
                  role="dialog"
                >
                  <div
                    className={styles.lightboxContent}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      aria-label="Close photo preview"
                      className={styles.lightboxClose}
                      onClick={() => setPreviewPhoto(null)}
                      type="button"
                    >
                      <Icon name="close" />
                    </button>
                    <EventPhotoImage
                      accessToken={accessToken}
                      imageClassName={styles.lightboxImage}
                      photo={previewPhoto}
                    />
                    {previewPhoto.caption && <p>{previewPhoto.caption}</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <section aria-label="Events list" className={styles.eventsTablePanel}>
          {loading ? (
            <p className={styles.emptyState}><BouncingDots label="Loading events" /></p>
          ) : events.length === 0 ? (
            <div className={styles.emptyTableState}>
              <Icon name="calendar" />
              <strong>There are no events yet.</strong>
              {canManageEvents && (
                <span>Create an event to share it with the community.</span>
              )}
            </div>
          ) : canManageEvents ? (
            filteredEvents.length === 0 ? (
              <div className={styles.emptyTableState}>
                <Icon name="search" />
                <strong>No events match your search or filters.</strong>
                <button
                  className={styles.secondaryButton}
                  onClick={() => {
                    setEventSearch('');
                    setDateFilter('all');
                    setCdcFilter('all');
                  }}
                  type="button"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.managementTable}>
                    <thead>
                      <tr>
                        <th>Event Title</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Related CDC</th>
                        <th>Status</th>
                        <th>Created By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageEvents.map((event) => {
                        const status = getEventStatus(event, now);
                        return (
                          <tr key={event.id}>
                            <td>
                              <button
                                className={styles.eventLink}
                                onClick={() => {
                                  setSelectedEvent(null);
                                  setSelectedId(event.id);
                                }}
                                type="button"
                              >
                                {event.title}
                              </button>
                              {event.description && (
                                <span className={styles.eventSubtitle}>
                                  {event.description}
                                </span>
                              )}
                            </td>
                            <td>{formatDate(event.event_date)}</td>
                            <td>{getEventTime(event)}</td>
                            <td>{event.cdc_name || 'All CDCs'}</td>
                            <td>
                              <span
                                className={`${styles.statusBadge} ${
                                  status === 'Upcoming'
                                    ? styles.statusUpcoming
                                    : status === 'Ongoing'
                                      ? styles.statusOngoing
                                      : styles.statusPast
                                }`}
                              >
                                <span />
                                {status}
                              </span>
                            </td>
                            <td>{event.created_by || '—'}</td>
                            <td>
                              <div className={styles.rowActions}>
                                <button
                                  aria-label={`View ${event.title}`}
                                  onClick={() => {
                                    setSelectedEvent(null);
                                    setSelectedId(event.id);
                                  }}
                                  type="button"
                                >
                                  <Icon name="eye" />
                                  View
                                </button>
                                {event.can_manage && (
                                  <>
                                    <button
                                      aria-label={`Edit ${event.title}`}
                                      onClick={() => beginEdit(event)}
                                      type="button"
                                    >
                                      <Icon name="edit" />
                                      Edit
                                    </button>
                                    <button
                                      aria-label={`Delete ${event.title}`}
                                      className={styles.deleteAction}
                                      onClick={() => void deleteEvent(event)}
                                      type="button"
                                    >
                                      <Icon name="trash" />
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <footer className={styles.pagination}>
                  <span>
                    Showing {firstVisibleEvent} to {lastVisibleEvent} of{' '}
                    {filteredEvents.length} events
                  </span>
                  <div>
                    <button
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      type="button"
                    >
                      Previous
                    </button>
                    <span className={styles.currentPage}>{currentPage}</span>
                    <button
                      disabled={currentPage >= pageCount}
                      onClick={() =>
                        setCurrentPage((page) => Math.min(pageCount, page + 1))
                      }
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                </footer>
              </>
            )
          ) : (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Event Title</th>
                    <th>Event Date</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <button
                          className={styles.eventLink}
                          onClick={() => {
                            setSelectedEvent(null);
                            setSelectedId(event.id);
                          }}
                          type="button"
                        >
                          {event.title}
                        </button>
                      </td>
                      <td>{formatDate(event.event_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
