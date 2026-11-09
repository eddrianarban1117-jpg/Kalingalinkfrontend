import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useAuth } from '../../auth/AuthProvider';
import { requiredCdcNames } from '../../constants/app-constants';
import styles from './ChildDevelopmentCenters.module.css';
import 'leaflet/dist/leaflet.css';

type Center = {
  id: number;
  name: string;
  address: string;
  barangay: string;
  center_head: string;
  contact_number: string;
  capacity: number;
  status: 'active' | 'inactive';
  children: number;
  teachers: number;
  assigned_teacher_user_id: number | null;
  assigned_teacher_name: string | null;
  enrollment_available: boolean;
};

type EligibleTeacher = {
  id: number;
  name: string;
  cdc_id: number | null;
};

type AffectedApplication = {
  id: number;
  application_number: string;
  child_name: string;
  parent_name: string;
  cdc_name: string;
  teacher_name: string | null;
  status: string;
  submitted_at: string;
  documents_requested_at: string | null;
  transfer_allowed: boolean;
  transfer_block_reason: string | null;
};

type TransferHistory = {
  id: number;
  application_number: string;
  child_name: string;
  previous_cdc_name: string;
  destination_cdc_name: string;
  previous_teacher_name: string | null;
  new_teacher_name: string;
  reason: string;
  transferred_at: string;
  admin_name: string;
};

type CenterActivity = {
  type: 'enrollment' | 'teacher' | 'center';
  title: string;
  description: string;
  occurred_at: string;
};

type MappedCenter = Center & {
  latitude: number;
  longitude: number;
};

type CentersResponse = {
  data: {
    stats: {
      total_centers: number;
      total_children: number;
      total_teachers: number;
      operating_centers: number;
      inactive_centers: number;
      pending_activation_centers: number;
    };
    centers: Array<Omit<Center, 'status'> & {
      status: Center['status'] | 'pending_activation';
    }>;
    eligible_teachers: EligibleTeacher[];
    activities: CenterActivity[];
  };
};

const emptyStats = {
  total_centers: 0,
  total_children: 0,
  total_teachers: 0,
  operating_centers: 0,
  inactive_centers: 0,
  pending_activation_centers: 0,
};

const mapCenterNames = requiredCdcNames;

// Coordinates from the user-confirmed Google Maps pins and Plus Code.
const verifiedMapCoordinates: Record<string, [number, number]> = {
  'papandayan highway cdc': [13.0079776, 121.4792957],
  'cacawan centro pamana cdc': [13.0459175, 121.4816733],
  'marfrancisco cdc': [13.034063, 121.479187],
};

const pinamalayanMapCenter: [number, number] = [13.0386691, 121.4801563];

function normalizeCenterName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

const cdcMarkerIcon = L.divIcon({
  className: styles.mapMarker,
  html: `<span class="${styles.mapMarkerPin}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/></svg></span>`,
  iconSize: [32, 38],
  iconAnchor: [16, 36],
});

function MapBounds({ centers }: { centers: MappedCenter[] }) {
  const map = useMap();

  useEffect(() => {
    if (centers.length === 1) {
      map.setView([centers[0].latitude, centers[0].longitude], 15);
    } else if (centers.length > 1) {
      map.fitBounds(
        L.latLngBounds(
          centers.map((center) => L.latLng(center.latitude, center.longitude)),
        ),
        { padding: [28, 28] },
      );
    }
  }, [centers, map]);

  return null;
}

function mapTargetMatches(center: Center) {
  const normalizedName = normalizeCenterName(center.name);
  return mapCenterNames.some(
    (name) => normalizedName === normalizeCenterName(name),
  );
}

function getVerifiedMapCoordinates(center: Center) {
  const normalizedName = normalizeCenterName(center.name);
  return verifiedMapCoordinates[normalizedName];
}

function googleMapsStreetViewUrl(center: Pick<MappedCenter, 'latitude' | 'longitude'>) {
  const url = new URL('https://www.google.com/maps/@');
  url.searchParams.set('api', '1');
  url.searchParams.set('map_action', 'pano');
  url.searchParams.set('viewpoint', `${center.latitude},${center.longitude}`);
  return url.toString();
}

function placeTextMatches(value: string, candidate: string) {
  const normalize = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const normalizedCandidate = normalize(candidate);
  const contextWords = new Set(['barangay', 'pinamalayan', 'oriental', 'mindoro', 'philippines']);
  const addressWords = normalize(value)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !contextWords.has(word));
  return (
    addressWords.length > 0 &&
    addressWords.every((word) => normalizedCandidate.includes(word))
  );
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

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-7h6v7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 6h16M7 12h10m-7 6h4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function StatIcon({ type }: { type: 'children' | 'teachers' | 'centers' }) {
  if (type === 'children') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M3 20v-1.5a6 6 0 0 1 12 0V20zm13-6a4.5 4.5 0 0 1 5 4.5v1.3h-4" />
      </svg>
    );
  }
  if (type === 'teachers') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="3" />
        <path d="M6 21v-2a6 6 0 0 1 12 0v2M4 8l1.5-3 2 1M20 8l-1.5-3-2 1" />
      </svg>
    );
  }
  return <HomeIcon />;
}

function ActivityIcon({ type }: { type: CenterActivity['type'] }) {
  if (type === 'teacher') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.3" />
        <path d="M3 20v-1a6 6 0 0 1 12 0v1m2-5a4 4 0 0 1 4 4v1" />
      </svg>
    );
  }
  if (type === 'center') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M6 3h8l4 4v14H6zM14 3v5h5m-9 4h5m-5 4h5" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3" />
      <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
    </svg>
  );
}

export function ChildDevelopmentCenters() {
  const { request } = useAuth();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [centers, setCenters] = useState<Center[]>([]);
  const [mappedCenters, setMappedCenters] = useState<MappedCenter[]>([]);
  const [streetViewCenter, setStreetViewCenter] = useState<MappedCenter | null>(null);
  const [streetViewLoadFailed, setStreetViewLoadFailed] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');
  const [activities, setActivities] = useState<CenterActivity[]>([]);
  const [eligibleTeachers, setEligibleTeachers] = useState<EligibleTeacher[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [centerFormOpen, setCenterFormOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [savingCenter, setSavingCenter] = useState(false);
  const [savingCenterId, setSavingCenterId] = useState<number | null>(null);
  const [teacherSelections, setTeacherSelections] = useState<Record<number, string>>({});
  const [managementCenter, setManagementCenter] = useState<Center | null>(null);
  const [affectedApplications, setAffectedApplications] = useState<AffectedApplication[]>([]);
  const [transferDestinations, setTransferDestinations] = useState<Array<{ id: number; name: string }>>([]);
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);
  const [transferDestinationSelections, setTransferDestinationSelections] = useState<Record<number, string>>({});
  const [transferReasons, setTransferReasons] = useState<Record<number, string>>({});
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [savingTransferId, setSavingTransferId] = useState<number | null>(null);
  const latestRequest = useRef(0);
  const centersRef = useRef(centers);
  centersRef.current = centers;
  const targetCenters = centers.filter(mapTargetMatches);
  const streetViewApiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY?.trim() ?? '';
  const mapQueryKey = targetCenters
    .map((center) => `${center.id}|${center.name}|${center.address}|${center.barangay}`)
    .join('::');

  useEffect(() => {
    if (!streetViewCenter) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setStreetViewCenter(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [streetViewCenter]);

  useEffect(() => {
    if (!mapQueryKey) {
      setMappedCenters([]);
      setGeocoding(false);
      setGeocodingError('');
      return;
    }

    const controller = new AbortController();
    const resolvedCenters = centersRef.current
      .filter(mapTargetMatches)
      .flatMap((center) => {
        const coordinates = getVerifiedMapCoordinates(center);
        return coordinates
          ? [{
              ...center,
              latitude: coordinates[0],
              longitude: coordinates[1],
            }]
          : [];
      });
    const targets = centersRef.current.filter(
      (center) => mapTargetMatches(center) && !getVerifiedMapCoordinates(center),
    );
    let active = true;
    setMappedCenters(resolvedCenters);
    setGeocodingError('');
    setGeocoding(true);

    async function geocodeCenters() {
      const locations: MappedCenter[] = [...resolvedCenters];
      let failed = false;

      for (const [index, center] of targets.entries()) {
        if (index > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 1100));
        }
        if (!active) return;

        const locationParts = [
          center.name,
          center.barangay,
          center.address,
          'Pinamalayan',
          'Oriental Mindoro',
          'Philippines',
        ].filter(Boolean);
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.search = new URLSearchParams({
          q: locationParts.join(', '),
          format: 'jsonv2',
          limit: '5',
        }).toString();

        try {
          const response = await fetch(url, {
            headers: { 'Accept-Language': 'en' },
            signal: controller.signal,
          });
          if (!response.ok) {
            failed = true;
            continue;
          }
          const payload: unknown = await response.json();
          const results = Array.isArray(payload)
            ? (payload as Array<{
                lat: string;
                lon: string;
                display_name: string;
              }>)
            : [];
          const centerAddress = [center.barangay, center.address]
            .filter(Boolean)
            .join(' ');
          const result = results.find((candidate) => {
            const latitude = Number(candidate.lat);
            const longitude = Number(candidate.lon);
            return (
              Number.isFinite(latitude) &&
              Number.isFinite(longitude) &&
              latitude >= -90 &&
              latitude <= 90 &&
              longitude >= -180 &&
              longitude <= 180 &&
              placeTextMatches('Pinamalayan', candidate.display_name) &&
              placeTextMatches('Oriental Mindoro', candidate.display_name) &&
              placeTextMatches(centerAddress, candidate.display_name)
            );
          });
          if (result) {
            locations.push({
              ...center,
              latitude: Number(result.lat),
              longitude: Number(result.lon),
            });
          }
        } catch {
          if (controller.signal.aborted) return;
          failed = true;
        }
      }

      if (active) {
        setMappedCenters(locations);
        setGeocodingError(
          failed
            ? 'Some center addresses could not be checked. Unverified locations are not shown.'
            : '',
        );
        setGeocoding(false);
      }
    }

    void geocodeCenters();
    return () => {
      active = false;
      controller.abort();
    };
  }, [mapQueryKey]);

  const reload = useCallback(async (isActive: () => boolean = () => true) => {
    const requestId = ++latestRequest.current;
    setError('');
    try {
      const response = await request<CentersResponse>('/api/admin/centers');
      if (requestId !== latestRequest.current || !isActive()) return;
      if (!Array.isArray(response.data.centers)) {
        throw new Error('The server returned an invalid CDC list.');
      }
      const normalizedCenters = response.data.centers.map((center) => ({
        ...center,
        status: center.assigned_teacher_user_id !== null ? 'active' as const : 'inactive' as const,
      }));
      const expectedNames = new Set(mapCenterNames.map(normalizeCenterName));
      const actualNames = new Set(normalizedCenters.map((center) => normalizeCenterName(center.name)));
      const hasExpectedCenters = normalizedCenters.length === mapCenterNames.length
        && [...expectedNames].every((name) => actualNames.has(name))
        && [...actualNames].every((name) => expectedNames.has(name));
      setCenters(normalizedCenters);
      setEligibleTeachers(response.data.eligible_teachers);
      setTeacherSelections(Object.fromEntries(normalizedCenters.map((center) => [
        center.id,
        center.assigned_teacher_user_id === null ? '' : String(center.assigned_teacher_user_id),
      ])));
      setActivities(response.data.activities);
      const operatingCenters = normalizedCenters.filter((center) => center.assigned_teacher_user_id !== null).length;
      setStats({
        ...response.data.stats,
        total_centers: normalizedCenters.length,
        operating_centers: operatingCenters,
        inactive_centers: normalizedCenters.length - operatingCenters,
        pending_activation_centers: 0,
      });
      setError(
        hasExpectedCenters
          ? ''
          : `The CDC records must contain exactly ${mapCenterNames.join(', ')}. The database currently returns ${normalizedCenters.length} centers.`,
      );
    } catch (loadError) {
      if (requestId !== latestRequest.current || !isActive()) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Centers could not be loaded.',
      );
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

  const filteredCenters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return centers.filter((center) => {
      const matchesQuery =
        !normalizedQuery ||
        `${center.name} ${center.barangay} ${center.address}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = status === 'all' || center.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [centers, query, status]);

  const activeAngle = stats.total_centers
    ? (stats.operating_centers / stats.total_centers) * 360
    : 0;
  function openCenterForm(center: Center) {
    setEditingCenter(center);
    setError('');
    setNotice('');
    setCenterFormOpen(true);
  }

  async function saveCenter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingCenter) return;
    if (!editingCenter) {
      setError('Only the three existing Child Development Centers can be updated.');
      return;
    }
    const values = new FormData(event.currentTarget);
    const payload = {
      name: String(values.get('name') ?? '').trim(),
      address: String(values.get('address') ?? '').trim(),
      barangay: String(values.get('barangay') ?? '').trim(),
      center_head: String(values.get('center_head') ?? '').trim(),
      contact_number: String(values.get('contact_number') ?? '').trim(),
      capacity: Number(values.get('capacity')),
    };
    setSavingCenter(true);
    setError('');
    setNotice('');
    try {
      await request(`/api/admin/centers/${editingCenter.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setCenterFormOpen(false);
      setNotice('Center details updated.');
      await reload();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Center could not be saved.');
    } finally {
      setSavingCenter(false);
    }
  }

  async function saveTeacherAssignment(center: Center) {
    if (savingCenterId !== null) return;
    const selectedTeacher = teacherSelections[center.id] ?? '';
    setSavingCenterId(center.id);
    setError('');
    setNotice('');
    try {
      await request(`/api/admin/centers/${center.id}/teacher`, {
        method: 'PATCH',
        body: JSON.stringify({
          teacher_id: selectedTeacher ? Number(selectedTeacher) : null,
        }),
      });
      setNotice('CDC teacher assignment updated.');
      await reload();
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : 'Teacher assignment could not be updated.');
    } finally {
      setSavingCenterId(null);
    }
  }

  async function openCenterManagement(center: Center) {
    setManagementCenter(center);
    setLoadingTransfers(true);
    setError('');
    try {
      const [applications, history] = await Promise.all([
        request<{
          data: {
            applications: AffectedApplication[];
            destinations: Array<{ id: number; name: string }>;
          };
        }>(`/api/admin/centers/${center.id}/affected-enrollments`),
        request<{ data: TransferHistory[] }>(`/api/admin/centers/${center.id}/transfer-history`),
      ]);
      setAffectedApplications(applications.data.applications);
      setTransferDestinations(applications.data.destinations);
      setTransferHistory(history.data);
      setTransferDestinationSelections({});
      setTransferReasons({});
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'CDC enrollment records could not be loaded.');
    } finally {
      setLoadingTransfers(false);
    }
  }

  async function transferApplication(application: AffectedApplication) {
    const destinationCdcId = transferDestinationSelections[application.id];
    const reason = transferReasons[application.id]?.trim() ?? '';
    if (!destinationCdcId || !reason || savingTransferId !== null) {
      setError('Choose an active destination CDC and enter a transfer reason.');
      return;
    }
    setSavingTransferId(application.id);
    setError('');
    setNotice('');
    try {
      await request(`/api/admin/enrollment-applications/${application.id}/transfer`, {
        method: 'POST',
        body: JSON.stringify({
          destination_cdc_id: Number(destinationCdcId),
          reason,
        }),
      });
      setNotice(`${application.application_number} was transferred.`);
      if (managementCenter) await openCenterManagement(managementCenter);
      await reload();
    } catch (transferError) {
      setError(transferError instanceof Error ? transferError.message : 'Enrollment application could not be transferred.');
    } finally {
      setSavingTransferId(null);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.titleIcon}>
          <HomeIcon />
        </span>
        <div>
          <h1>Child Development Centers</h1>
          <p>
            Manage and monitor all Child Development Centers (CDC) in the
            municipality.
          </p>
        </div>
      </header>
      {error && (
        <p className={styles.errorState} role="alert">
          {error}
          {centers.length > 0 && ' Showing the most recently loaded data.'}
        </p>
      )}
      {notice && <p className={styles.successState} role="status">{notice}</p>}

      {centerFormOpen && (
        <div className={styles.modalBackdrop}>
          <section aria-labelledby="center-form-title" aria-modal="true" className={styles.centerModal} role="dialog">
            <header className={styles.modalHeader}>
              <div>
                <h2 id="center-form-title">Edit Center</h2>
                <p>Only details for the three existing CDCs can be updated.</p>
              </div>
              <button aria-label="Close center form" className={styles.closeButton} disabled={savingCenter} onClick={() => setCenterFormOpen(false)} type="button">×</button>
            </header>
            <form onSubmit={saveCenter}>
              <div className={styles.centerFormGrid}>
                <label>
                  <span>Center name *</span>
                  <input autoComplete="organization" maxLength={160} name="name" readOnly required defaultValue={editingCenter?.name ?? ''} />
                </label>
                <label>
                  <span>Barangay *</span>
                  <input maxLength={120} name="barangay" required defaultValue={editingCenter?.barangay ?? ''} />
                </label>
                <label className={styles.fullWidthField}>
                  <span>Address *</span>
                  <input maxLength={255} name="address" required defaultValue={editingCenter?.address ?? ''} />
                </label>
                <label>
                  <span>Center head</span>
                  <input maxLength={160} name="center_head" defaultValue={editingCenter?.center_head ?? ''} />
                </label>
                <label>
                  <span>Contact number</span>
                  <input maxLength={30} name="contact_number" type="tel" defaultValue={editingCenter?.contact_number ?? ''} />
                </label>
                <label>
                  <span>Capacity *</span>
                  <input min="0" name="capacity" required type="number" defaultValue={editingCenter?.capacity ?? 0} />
                </label>
              </div>
              {error && <p className={styles.errorState} role="alert">{error}</p>}
              <footer className={styles.modalActions}>
                <button className={styles.secondaryButton} disabled={savingCenter} onClick={() => setCenterFormOpen(false)} type="button">Cancel</button>
                <button className={styles.primaryButton} disabled={savingCenter} type="submit">{savingCenter ? 'Saving…' : 'Save Changes'}</button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {managementCenter && (
        <div className={styles.modalBackdrop}>
          <section
            aria-labelledby="center-management-title"
            aria-modal="true"
            className={`${styles.centerModal} ${styles.transferModal}`}
            role="dialog"
          >
            <header className={styles.modalHeader}>
              <div>
                <h2 id="center-management-title">Enrollment transfers · {managementCenter.name}</h2>
                <p>Only eligible pending applications can be transferred to an active CDC with an approved assigned teacher.</p>
              </div>
              <button
                aria-label="Close enrollment transfer history"
                className={styles.closeButton}
                onClick={() => setManagementCenter(null)}
                type="button"
              >
                ×
              </button>
            </header>
            {error && <p className={styles.errorState} role="alert">{error}</p>}
            {notice && <p className={styles.successState} role="status">{notice}</p>}
            {loadingTransfers ? (
              <p className={styles.sideState}>Loading applications and transfer history…</p>
            ) : (
              <>
                <section aria-labelledby="affected-applications-title" className={styles.transferSection}>
                  <h3 id="affected-applications-title">Applications associated with this CDC</h3>
                  {affectedApplications.length === 0 ? (
                    <p className={styles.sideState}>No enrollment applications are recorded for this CDC.</p>
                  ) : (
                    <div className={styles.transferList}>
                      {affectedApplications.map((application) => (
                        <article className={styles.transferCard} key={application.id}>
                          <div>
                            <strong>{application.child_name}</strong>
                            <span>{application.application_number} · {application.parent_name}</span>
                            <span>Current CDC: {application.cdc_name} · Teacher: {application.teacher_name || 'Unassigned'}</span>
                            <span>
                              Status: {application.documents_requested_at ? 'For Completion' : application.status}
                              {' · Submitted '}
                              {new Date(application.submitted_at.replace(' ', 'T')).toLocaleDateString()}
                            </span>
                          </div>
                          {application.transfer_allowed ? (
                            <div className={styles.transferControls}>
                              <label>
                                <span>Destination CDC</span>
                                <select
                                  disabled={savingTransferId !== null || transferDestinations.length === 0}
                                  onChange={(event) => setTransferDestinationSelections((current) => ({
                                    ...current,
                                    [application.id]: event.target.value,
                                  }))}
                                  value={transferDestinationSelections[application.id] ?? ''}
                                >
                                  <option value="">Select an active CDC</option>
                                  {transferDestinations.map((destination) => (
                                    <option key={destination.id} value={destination.id}>
                                      {destination.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                <span>Transfer reason</span>
                                <input
                                  disabled={savingTransferId !== null}
                                  maxLength={2000}
                                  onChange={(event) => setTransferReasons((current) => ({
                                    ...current,
                                    [application.id]: event.target.value,
                                  }))}
                                  value={transferReasons[application.id] ?? ''}
                                />
                              </label>
                              <button
                                className={styles.primaryButton}
                                disabled={savingTransferId !== null || transferDestinations.length === 0}
                                onClick={() => void transferApplication(application)}
                                type="button"
                              >
                                {savingTransferId === application.id ? 'Transferring…' : 'Confirm Transfer'}
                              </button>
                              {transferDestinations.length === 0 && (
                                <small>No active destination CDC with an approved teacher is available.</small>
                              )}
                            </div>
                          ) : (
                            <p className={styles.transferBlockReason}>
                              {application.transfer_block_reason || 'This application cannot be transferred.'}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
                <section aria-labelledby="transfer-history-title" className={styles.transferSection}>
                  <h3 id="transfer-history-title">CDC transfer history</h3>
                  {transferHistory.length === 0 ? (
                    <p className={styles.sideState}>No transfers have been recorded for this CDC.</p>
                  ) : (
                    <div className={styles.transferList}>
                      {transferHistory.map((transfer) => (
                        <article className={styles.transferCard} key={transfer.id}>
                          <div>
                            <strong>{transfer.child_name} · {transfer.application_number}</strong>
                            <span>{transfer.previous_cdc_name} → {transfer.destination_cdc_name}</span>
                            <span>Teacher: {transfer.previous_teacher_name || 'Unassigned'} → {transfer.new_teacher_name}</span>
                            <span>{transfer.reason}</span>
                            <span>{new Date(transfer.transferred_at.replace(' ', 'T')).toLocaleString()} · Admin: {transfer.admin_name}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      )}

      <section aria-label="Center overview" className={styles.stats}>
        <article className={`${styles.statCard} ${styles.statBlue}`}>
          <span className={styles.statIcon}>
            <StatIcon type="centers" />
          </span>
          <div>
            <span>Total CDCs</span>
            <strong>{loading ? '…' : stats.total_centers.toLocaleString()}</strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.statTeal}`}>
          <span className={styles.statIcon}>
            <StatIcon type="children" />
          </span>
          <div>
            <span>Total Children</span>
            <strong>{loading ? '…' : stats.total_children.toLocaleString()}</strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.statGold}`}>
          <span className={styles.statIcon}>
            <StatIcon type="teachers" />
          </span>
          <div>
            <span>Total Teachers</span>
            <strong>{loading ? '…' : stats.total_teachers.toLocaleString()}</strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
        <article className={`${styles.statCard} ${styles.statPurple}`}>
          <span className={styles.statIcon}>
            <StatIcon type="centers" />
          </span>
          <div>
            <span>
              Operating Centers
              <br />
              (Active)
            </span>
            <strong>{loading ? '…' : stats.operating_centers.toLocaleString()}</strong>
          </div>
          <span aria-hidden="true" className={styles.statArrow}>
            ›
          </span>
        </article>
      </section>

      <div className={styles.contentGrid}>
        <section
          aria-labelledby="centers-list-title"
          className={`${styles.panel} ${styles.centerPanel}`}
        >
          <div className={styles.panelHeader}>
            <div className={styles.centerHeading}>
              <span className={styles.centerHeadingIcon}>
                <HomeIcon />
              </span>
              <div>
                <h2 id="centers-list-title">Child Development Centers</h2>
              </div>
            </div>
            <div className={styles.tableTools}>
              <label className={styles.centerSearch}>
                <SearchIcon />
                <input
                  aria-label="Search centers"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search center..."
                  type="search"
                  value={query}
                />
              </label>
              <label className={styles.filterControl}>
                <span className={styles.visuallyHidden}>Filter by status</span>
                <FilterIcon />
                <select
                  aria-label="Filter by status"
                  onChange={(event) => {
                    const selectedStatus = event.currentTarget.value;
                    if (
                      selectedStatus === 'all' ||
                      selectedStatus === 'active' ||
                      selectedStatus === 'inactive'
                    ) {
                      setStatus(selectedStatus);
                    }
                  }}
                  value={status}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.centerTable}>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">CDC Name</th>
                  <th scope="col">Location</th>
                  <th scope="col">Total Children</th>
                  <th scope="col">Total Teachers</th>
                  <th scope="col">Assigned Teacher</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className={styles.emptyState} colSpan={8}>
                      Loading centers…
                    </td>
                  </tr>
                ) : error && centers.length === 0 ? (
                  <tr>
                    <td className={styles.emptyState} colSpan={7}>
                      {error}
                    </td>
                  </tr>
                ) : filteredCenters.map((center, index) => (
                  <tr key={center.id}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Name of Center">
                      <span className={styles.centerIdentity}>
                        <span
                          className={`${styles.rowIcon} ${styles[`rowTone${index % 4}`]}`}
                        >
                          <HomeIcon />
                        </span>
                        <span className={styles.centerTitle}>{center.name}</span>
                      </span>
                    </td>
                    <td className={styles.centerLocation} data-label="Location">
                      {[center.barangay, center.address]
                        .filter(Boolean)
                        .join(', ') || 'Not provided'}
                    </td>
                    <td data-label="Total Children">{center.children}</td>
                    <td data-label="Total Teachers">{center.teachers}</td>
                    <td data-label="Assigned Teacher">
                      <div className={styles.assignmentControl}>
                        <select
                          aria-label={`Assign teacher to ${center.name}`}
                          disabled={savingCenterId !== null}
                          onChange={(event) => setTeacherSelections((current) => ({
                            ...current,
                            [center.id]: event.target.value,
                          }))}
                          value={teacherSelections[center.id] ?? ''}
                        >
                          <option value="">No teacher assigned</option>
                          {eligibleTeachers
                            .filter((teacher) => teacher.cdc_id === null || teacher.cdc_id === center.id)
                            .map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </option>
                            ))}
                        </select>
                        <button
                          className={styles.rowAction}
                          disabled={
                            savingCenterId !== null ||
                            (teacherSelections[center.id] ?? '') ===
                              (center.assigned_teacher_user_id === null
                                ? ''
                                : String(center.assigned_teacher_user_id))
                          }
                          onClick={() => void saveTeacherAssignment(center)}
                          type="button"
                        >
                          {savingCenterId === center.id ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </td>
                    <td data-label="Status">
                      <span
                        className={`${styles.statusBadge} ${center.status === 'inactive' ? styles.inactiveBadge : ''}`}
                      >
                        {center.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <small className={styles.availabilityNote}>
                        {center.assigned_teacher_name
                          ? `Assigned: ${center.assigned_teacher_name}`
                          : 'No approved teacher assigned'}
                        {center.status === 'active' && !center.enrollment_available
                          ? ' · Enrollment unavailable'
                          : ''}
                      </small>
                    </td>
                    <td data-label="Actions">
                      <div className={styles.rowActions}>
                        <button
                          aria-label={`Edit ${center.name}`}
                          className={`${styles.rowAction} ${styles.editAction}`}
                          disabled={savingCenterId !== null}
                          onClick={() => openCenterForm(center)}
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <path d="m4 16.5-.8 4.3 4.3-.8L19.7 7.8a2.1 2.1 0 0 0-3-3L4 16.5Z" />
                            <path d="m14.9 6.6 3 3" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className={styles.rowAction}
                          disabled={savingCenterId !== null}
                          onClick={() => void openCenterManagement(center)}
                          type="button"
                        >
                          Applications &amp; History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && (!error || centers.length > 0) && filteredCenters.length === 0 && (
                  <tr>
                    <td className={styles.emptyState} colSpan={8}>
                      {centers.length
                        ? 'No centers match your search or selected status.'
                        : 'No centers are recorded in the database.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className={styles.tableFooter}>
            <span>Showing {filteredCenters.length} of {centers.length} centers</span>
            {!error && <span>Refreshes automatically every 15 seconds</span>}
          </footer>
        </section>

        <aside className={styles.sideColumn}>
          <section
            aria-labelledby="map-title"
            className={`${styles.panel} ${styles.locationPanel}`}
          >
            <div className={`${styles.panelHeader} ${styles.mapHeader}`}>
              <h2 id="map-title">
                <PinIcon />
                CDC Locations Map
              </h2>
              <a
                className={styles.viewMapLink}
                href={
                  mappedCenters.length
                    ? `https://www.openstreetmap.org/?mlat=${mappedCenters[0].latitude}&mlon=${mappedCenters[0].longitude}#map=14/${mappedCenters[0].latitude}/${mappedCenters[0].longitude}`
                    : 'https://www.openstreetmap.org/search?query=Pinamalayan%2C%20Oriental%20Mindoro'
                }
                rel="noreferrer"
                target="_blank"
              >
                View Map
              </a>
            </div>
            <div className={styles.mapLegend}>
              <span>Pinamalayan, Oriental Mindoro</span>
              <small>{mappedCenters.length} of 3 CDC locations</small>
            </div>
            <MapContainer
              aria-label="Map of selected Child Development Centers"
              className={styles.mapCanvas}
              center={pinamalayanMapCenter}
              scrollWheelZoom={false}
              zoom={13}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapBounds centers={mappedCenters} />
              {mappedCenters.map((center) => (
                <Marker
                  icon={cdcMarkerIcon}
                  key={center.id}
                  position={[center.latitude, center.longitude]}
                >
                  <Popup>
                    <strong>{center.name}</strong>
                    <br />
                    {[center.barangay, center.address].filter(Boolean).join(', ')}
                    <br />
                    <button
                      className={styles.streetViewAction}
                      onClick={(event) => {
                        event.stopPropagation();
                        setStreetViewLoadFailed(false);
                        setStreetViewCenter(center);
                      }}
                      type="button"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" />
                        <path d="M3 12.5 12 17l9-4.5M3 16.5 12 21l9-4.5" />
                      </svg>
                      View Street View
                    </button>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            {loading && <p className={styles.mapMessage}>Loading CDC records…</p>}
            {!loading && geocoding && (
              <p className={styles.mapMessage}>Checking recorded addresses…</p>
            )}
            {!loading && !geocoding && !mappedCenters.length && (
              <p className={styles.mapMessage}>
                {geocodingError ||
                  (targetCenters.length
                    ? `No verified address match found for ${targetCenters
                        .map((center) => center.name)
                        .join(', ')}. Add a full street-level address to map a center.`
                    : 'The three specified CDCs are not present in the current center records.')}
              </p>
            )}
            {!loading && !geocoding && mappedCenters.length > 0 &&
              targetCenters.some((center) =>
                !mappedCenters.some((mappedCenter) => mappedCenter.id === center.id),
              ) && (
                <p className={styles.mapMessage} role="status">
                  No verified address match for:{' '}
                  {targetCenters
                    .filter(
                      (center) =>
                        !mappedCenters.some((mappedCenter) => mappedCenter.id === center.id),
                    )
                    .map((center) => center.name)
                    .join(', ')}
                  . No marker is shown for those records.
                </p>
              )}
            {geocodingError && mappedCenters.length > 0 && (
              <p className={styles.mapMessage} role="status">{geocodingError}</p>
            )}
          </section>
          <section
            aria-labelledby="status-title"
            className={`${styles.panel} ${styles.statusPanel}`}
          >
            <div className={styles.panelHeader}>
              <h2 id="status-title">Center Status</h2>
            </div>
            <div className={styles.statusContent}>
              <div
                aria-label={`${stats.operating_centers} active and ${stats.inactive_centers} inactive centers`}
                className={styles.donut}
                style={{
                  background: stats.total_centers
                    ? `conic-gradient(#25b99e 0deg ${activeAngle}deg, #7b83ef ${activeAngle}deg 360deg)`
                    : '#e9eff8',
                }}
              >
                <span>
                  <strong>{loading ? '…' : stats.total_centers}</strong>Total CDCs
                </span>
              </div>
              <ul className={styles.statusLegend}>
                <li>
                  <i className={styles.legendActive} />
                  Active<strong>{loading ? '…' : stats.operating_centers}</strong>
                </li>
                <li>
                  <i className={styles.legendInactive} />
                  Inactive<strong>{loading ? '…' : stats.inactive_centers}</strong>
                </li>
              </ul>
            </div>
          </section>
          <section
            aria-labelledby="activities-title"
            className={`${styles.panel} ${styles.activityPanel}`}
          >
            <div className={styles.panelHeader}>
              <h2 id="activities-title">Recent Activities</h2>
            </div>
            <div className={styles.activities}>
              {loading ? (
                <p className={styles.sideState}>Loading recent activity…</p>
              ) : activities.length ? activities.map((activity, index) => (
                <article
                  className={styles.activity}
                  key={`${activity.type}:${activity.occurred_at}:${index}`}
                >
                  <span
                    className={`${styles.activityIcon} ${styles[`activity${activity.type === 'teacher' ? 'gold' : activity.type === 'center' ? 'purple' : 'blue'}`]}`}
                  >
                    <ActivityIcon type={activity.type} />
                  </span>
                  <span className={styles.activityDescription}>
                    <strong>{activity.title}</strong>
                    <span>{activity.description}</span>
                  </span>
                  <time dateTime={activity.occurred_at}>
                    {relativeTime(activity.occurred_at)}
                  </time>
                </article>
              )) : (
                <p className={styles.sideState}>
                  {error || 'No recent center activity is recorded.'}
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
      {streetViewCenter && (
        <div
          className={styles.streetViewBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setStreetViewCenter(null);
          }}
        >
          <section
            aria-labelledby="street-view-title"
            aria-modal="true"
            className={styles.streetViewDialog}
            role="dialog"
          >
            <header className={styles.streetViewHeader}>
              <div>
                <h2 id="street-view-title">Street View</h2>
                <p>{streetViewCenter.name}</p>
              </div>
              <button
                aria-label="Close Street View"
                className={styles.streetViewClose}
                onClick={() => setStreetViewCenter(null)}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </header>
            {streetViewApiKey ? (
              streetViewLoadFailed ? (
                <p className={styles.streetViewUnavailable} role="status">
                  Street View is currently unavailable for this location.
                </p>
              ) : (
                <iframe
                  allow="fullscreen"
                  className={styles.streetViewFrame}
                  loading="lazy"
                  onError={() => setStreetViewLoadFailed(true)}
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={`https://www.google.com/maps/embed/v1/streetview?${new URLSearchParams({
                    key: streetViewApiKey,
                    location: `${streetViewCenter.latitude},${streetViewCenter.longitude}`,
                    language: 'en',
                    region: 'PH',
                  }).toString()}`}
                  title={`360-degree Street View near ${streetViewCenter.name}`}
                />
              )
            ) : (
              <div className={styles.streetViewUnavailable} role="status">
                <p>In-app Street View needs a Google Maps Embed API key configured for this application.</p>
                <a href={googleMapsStreetViewUrl(streetViewCenter)} rel="noreferrer" target="_blank">
                  Open this location in Google Maps
                </a>
              </div>
            )}
            {streetViewApiKey && !streetViewLoadFailed && (
              <footer className={styles.streetViewFooter}>
                <a href={googleMapsStreetViewUrl(streetViewCenter)} rel="noreferrer" target="_blank">
                  Open in Google Maps
                </a>
              </footer>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
