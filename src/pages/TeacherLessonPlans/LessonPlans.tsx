import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { BouncingDots } from '../../components/animations/BouncingDots';
import childrenBanner from '../../assets/images/children-banner.png';
import styles from './LessonPlans.module.css';

type LessonStatus =
  'Finalized' | 'For Review' | 'Draft' | 'In Progress' | 'Upcoming';
type LessonTab = 'Overview' | 'Objectives' | 'Procedure' | 'Materials';
type LessonSection = 'Lesson Plans' | 'Materials' | 'Favorites';

type LessonPlan = {
  id: number;
  classId: number;
  className: string;
  title: string;
  topic: string;
  ageGroup: string;
  domain: string;
  date: string | null;
  duration: number;
  status: LessonStatus;
  objectives: string[];
  procedure: string[];
  materials: string[];
  favorite: boolean;
  completed: boolean;
};

type TeachingMaterial = {
  title: string;
  count: number;
};

type ApiLessonPlan = {
  id: number;
  class_id: number;
  class_name: string;
  title: string;
  topic: string;
  age_group: string;
  domain: string;
  date: string | null;
  duration_minutes: number;
  status: 'draft' | 'for_review' | 'finalized' | 'in_progress' | 'upcoming';
  objectives: string[];
  procedure: string[];
  materials: string[];
  favorite: boolean;
  completed: boolean;
};

type LessonPlanResponse = {
  data: {
    lessons: ApiLessonPlan[];
    classes: Array<{ id: number; name: string }>;
    materials: TeachingMaterial[];
  };
};

type LessonApiStatus = ApiLessonPlan['status'];

const statusLabels: Record<LessonApiStatus, LessonStatus> = {
  draft: 'Draft',
  for_review: 'For Review',
  finalized: 'Finalized',
  in_progress: 'In Progress',
  upcoming: 'Upcoming',
};
const statusValues: Record<LessonStatus, LessonApiStatus> = {
  Draft: 'draft',
  'For Review': 'for_review',
  Finalized: 'finalized',
  'In Progress': 'in_progress',
  Upcoming: 'upcoming',
};
const materialColors = ['blue', 'green', 'pink', 'purple', 'yellow', 'teal'];

function formatLessonDate(value: string | null) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not scheduled';
}

function getWeekKey(value: string | null) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function isLessonDateReached(value: string | null) {
  if (!value) return false;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return value <= todayKey;
}

function mapLesson(record: ApiLessonPlan): LessonPlan {
  return {
    id: record.id,
    classId: record.class_id,
    className: record.class_name,
    title: record.title,
    topic: record.topic,
    ageGroup: record.age_group,
    domain: record.domain,
    date: record.date,
    duration: record.duration_minutes,
    status: statusLabels[record.status],
    objectives: record.objectives,
    procedure: record.procedure,
    materials: record.materials,
    favorite: record.favorite,
    completed: record.completed,
  };
}

const lessonTabs: LessonTab[] = [
  'Overview',
  'Objectives',
  'Procedure',
  'Materials',
];
const lessonSections: LessonSection[] = [
  'Lesson Plans',
  'Materials',
  'Favorites',
];

function LessonIcon({
  name,
}: {
  name:
    | 'book'
    | 'plus'
    | 'search'
    | 'calendar'
    | 'clock'
    | 'list'
    | 'materials'
    | 'star'
    | 'topic'
    | 'age'
    | 'domain'
    | 'class'
    | 'check'
    | 'edit'
    | 'view'
    | 'close';
}) {
  const shared = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
  };
  if (name === 'book' || name === 'materials') {
    return (
      <svg {...shared}>
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v17H5.5A2.5 2.5 0 0 0 3 22zm18 0A2.5 2.5 0 0 0 18.5 3H12v17h6.5A2.5 2.5 0 0 1 21 22z" />
      </svg>
    );
  }
  if (name === 'plus') {
    return (
      <svg {...shared}>
        <path d="M12 5v14m-7-7h14" />
      </svg>
    );
  }
  if (name === 'search') {
    return (
      <svg {...shared}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </svg>
    );
  }
  if (name === 'clock') {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (name === 'list') {
    return (
      <svg {...shared}>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <circle cx="4" cy="6" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="18" r="1" />
      </svg>
    );
  }
  if (name === 'star') {
    return (
      <svg {...shared}>
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
      </svg>
    );
  }
  if (name === 'topic' || name === 'domain') {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (name === 'age' || name === 'class') {
    return (
      <svg {...shared}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-1a6 6 0 0 1 12 0v1m2-9a3 3 0 0 0 0-6m1 9a5 5 0 0 1 3 5" />
      </svg>
    );
  }
  if (name === 'check') {
    return (
      <svg {...shared}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }
  if (name === 'edit') {
    return (
      <svg {...shared}>
        <path d="m14 5 5 5M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
      </svg>
    );
  }
  if (name === 'view') {
    return (
      <svg {...shared}>
        <path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }
  if (name === 'close') {
    return (
      <svg {...shared}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }
  return (
    <svg {...shared}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4m10-4v4M3 10h18" />
    </svg>
  );
}

export function LessonPlans({ globalSearch }: { globalSearch: string }) {
  const { request } = useAuth();
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>(
    [],
  );
  const [materialsLibrary, setMaterialsLibrary] = useState<TeachingMaterial[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [section, setSection] = useState<LessonSection>('Lesson Plans');
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('');
  const [age, setAge] = useState('');
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState('');
  const [week, setWeek] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<LessonTab>('Overview');
  const [materialCategory, setMaterialCategory] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formDuration, setFormDuration] = useState(45);
  const [formClassId, setFormClassId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStatus, setFormStatus] = useState<LessonApiStatus>('draft');
  const [formObjectives, setFormObjectives] = useState('');
  const [formProcedure, setFormProcedure] = useState('');
  const [formMaterials, setFormMaterials] = useState('');
  const [saving, setSaving] = useState(false);
  const hasLoadedLessons = useRef(false);

  const reloadLessons = useCallback(async () => {
    setLoadError('');
    try {
      const response = await request<LessonPlanResponse>(
        '/api/teacher/lesson-plans',
      );
      const mapped = response.data.lessons.map(mapLesson);
      setLessons(mapped);
      setClasses(response.data.classes);
      setMaterialsLibrary(response.data.materials);
      setSelectedId((current) => {
        if (current !== null && mapped.some(({ id }) => id === current)) {
          return current;
        }
        return hasLoadedLessons.current ? current : (mapped[0]?.id ?? null);
      });
      hasLoadedLessons.current = true;
    } catch (error) {
      setLessons([]);
      setClasses([]);
      setMaterialsLibrary([]);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Lesson plans could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active && document.visibilityState === 'visible') {
        void reloadLessons();
      }
    };
    void reloadLessons();
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reloadLessons]);

  const filteredLessons = useMemo(() => {
    const term = `${search} ${globalSearch}`.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesSearch =
        !term ||
        `${lesson.title} ${lesson.topic} ${lesson.domain}`
          .toLowerCase()
          .includes(term);
      return (
        matchesSearch &&
        (!week || getWeekKey(lesson.date) === week) &&
        (!topic || lesson.topic === topic) &&
        (!age || lesson.ageGroup === age) &&
        (!domain || lesson.domain === domain) &&
        (!status || lesson.status === status) &&
        (section !== 'Favorites' || lesson.favorite)
      );
    });
  }, [age, domain, globalSearch, lessons, search, section, status, topic, week]);

  const selectedLesson =
    selectedId === null
      ? undefined
      : (filteredLessons.find(({ id }) => id === selectedId) ??
        filteredLessons[0]);

  function openDialog(lesson?: LessonPlan) {
    setEditingId(lesson?.id ?? null);
    setFormTitle(lesson?.title ?? '');
    setFormTopic(lesson?.topic ?? '');
    setFormAge(lesson?.ageGroup ?? '');
    setFormDomain(lesson?.domain ?? '');
    setFormDuration(lesson?.duration ?? 45);
    setFormClassId(
      lesson ? String(lesson.classId) : String(classes[0]?.id ?? ''),
    );
    setFormDate(lesson?.date ?? '');
    setFormStatus(lesson ? statusValues[lesson.status] : 'draft');
    setFormObjectives(lesson?.objectives.join('\n') ?? '');
    setFormProcedure(lesson?.procedure.join('\n') ?? '');
    setFormMaterials(lesson?.materials.join('\n') ?? '');
    setNotice('');
    setDialogOpen(true);
  }

  async function saveLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = formTitle.trim();
    if (!title || saving) return;
    setSaving(true);
    setNotice('');
    const toList = (value: string) =>
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    try {
      await request(
        editingId === null
          ? '/api/teacher/lesson-plans'
          : `/api/teacher/lesson-plans/${editingId}`,
        {
          method: editingId === null ? 'POST' : 'PUT',
          body: JSON.stringify({
            class_id: Number(formClassId),
            title,
            topic: formTopic.trim(),
            age_group: formAge.trim(),
            domain: formDomain.trim(),
            date: formDate,
            duration_minutes: formDuration,
            status: formStatus,
            objectives: toList(formObjectives),
            procedure: toList(formProcedure),
            materials: toList(formMaterials),
          }),
        },
      );
      await reloadLessons();
      setSection('Lesson Plans');
      setNotice(
        editingId === null ? 'Lesson plan created.' : 'Lesson plan updated.',
      );
      setDialogOpen(false);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'The lesson plan could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleFavorite(lesson: LessonPlan) {
    setNotice('');
    try {
      await request(`/api/teacher/lesson-plans/${lesson.id}/favorite`, {
        method: 'PATCH',
        body: JSON.stringify({ favorite: !lesson.favorite }),
      });
      await reloadLessons();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Favorite could not be updated.',
      );
    }
  }

  async function toggleCompleted(lesson: LessonPlan) {
    setNotice('');
    try {
      await request(`/api/teacher/lesson-plans/${lesson.id}/completion`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !lesson.completed }),
      });
      await reloadLessons();
      setNotice(
        lesson.completed
          ? 'Lesson marked as not complete.'
          : 'Lesson marked complete.',
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Lesson completion could not be updated.',
      );
    }
  }

  function lessonDetails() {
    if (!selectedLesson) return null;
    if (activeTab === 'Objectives') {
      return selectedLesson.objectives.length ? (
        <ul className={styles.detailList}>
          {selectedLesson.objectives.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No objectives have been added.</p>
      );
    }
    if (activeTab === 'Procedure') {
      return selectedLesson.procedure.length ? (
        <ol className={styles.detailList}>
          {selectedLesson.procedure.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      ) : (
        <p>No procedure steps have been added.</p>
      );
    }
    if (activeTab === 'Materials') {
      return selectedLesson.materials.length ? (
        <ul className={styles.detailList}>
          {selectedLesson.materials.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No materials have been added.</p>
      );
    }
    return (
      <div className={styles.overviewGrid}>
        <section>
          <h3>Learning Objectives</h3>
          <ul>
            {selectedLesson.objectives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Teaching Procedure</h3>
          <ol>
            {selectedLesson.procedure.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
        <aside>
          <h3>
            <LessonIcon name="calendar" /> Schedule
          </h3>
          <p>{formatLessonDate(selectedLesson.date)}</p>
          <p>
            <LessonIcon name="clock" /> {selectedLesson.duration} minutes
          </p>
          <h3 className={styles.materialHeading}>Required Materials</h3>
          <ul>
            {selectedLesson.materials.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>
    );
  }

  const filteredMaterials = materialsLibrary.filter(
    ({ title }) => !materialCategory || title === materialCategory,
  );
  const weekOptions = [
    ...new Set(
      lessons
        .map(({ date }) => getWeekKey(date))
        .filter((value) => value !== ''),
    ),
  ].sort((first, second) => second.localeCompare(first));
  const today = new Date();
  const thisWeek = getWeekKey(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
  );
  const completedLessons = lessons.filter(({ completed }) => completed).length;
  const upcomingLessons = lessons.filter(
    ({ date, status: lessonStatus }) =>
      !isLessonDateReached(date) &&
      lessonStatus !== 'Draft' &&
      lessonStatus !== 'For Review',
  ).length;

  return (
    <main aria-label="Lesson Plans and Materials" className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.heading}>
          <span aria-hidden="true" className={styles.headingIcon}>
            <LessonIcon name="book" />
          </span>
          <div>
            <h1>Lesson Plans and Materials</h1>
            <p>Create and manage your lesson plans and teaching resources.</p>
          </div>
        </div>
        <button
          className={styles.createButton}
          disabled={loading || classes.length === 0}
          type="button"
          onClick={() => openDialog()}
        >
          <LessonIcon name="plus" /> Create Lesson Plan
        </button>
      </header>

      {notice && (
        <p aria-live="polite" className={styles.notice}>
          {notice}
          <button
            aria-label="Dismiss message"
            type="button"
            onClick={() => setNotice('')}
          >
            <LessonIcon name="close" />
          </button>
        </p>
      )}
      {loadError && (
        <p aria-live="polite" className={styles.errorNotice}>
          {loadError}
        </p>
      )}

      <section aria-label="Lesson plan summary" className={styles.summaryCards}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryCardIcon}><LessonIcon name="list" /></span>
          <span><strong>{lessons.length}</strong><small>Total lesson plans</small></span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryCardIcon}><LessonIcon name="calendar" /></span>
          <span><strong>{lessons.filter(({ date }) => getWeekKey(date) === thisWeek).length}</strong><small>Scheduled this week</small></span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryCardIcon}><LessonIcon name="check" /></span>
          <span><strong>{completedLessons}</strong><small>Completed lessons</small></span>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryCardIcon}><LessonIcon name="clock" /></span>
          <span><strong>{upcomingLessons}</strong><small>Upcoming lessons</small></span>
        </article>
      </section>

      <section aria-label="Lesson plan filters" className={styles.filters}>
        <label className={styles.searchFilter}>
          <LessonIcon name="search" />
          <span className={styles.visuallyHidden}>Search lesson plans</span>
          <input
            type="search"
            placeholder="Search by title, topic, or keyword..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className={styles.visuallyHidden} htmlFor="lesson-week">
          Scheduled week
        </label>
        <select
          id="lesson-week"
          value={week}
          onChange={(event) => setWeek(event.target.value)}
        >
          <option value="">All Weeks</option>
          {weekOptions.map((item) => (
            <option key={item} value={item}>
              Week {Number(item.slice(-2))}, {item.slice(0, 4)}
            </option>
          ))}
        </select>
        <label className={styles.visuallyHidden} htmlFor="lesson-topic">
          Topic
        </label>
        <select
          id="lesson-topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
        >
          <option value="">All Topics</option>
          {[
            ...new Set(lessons.map(({ topic: lessonTopic }) => lessonTopic)),
          ].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className={styles.visuallyHidden} htmlFor="lesson-age">
          Age group
        </label>
        <select
          id="lesson-age"
          value={age}
          onChange={(event) => setAge(event.target.value)}
        >
          <option value="">All Age Groups</option>
          {[...new Set(lessons.map(({ ageGroup }) => ageGroup))].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className={styles.visuallyHidden} htmlFor="lesson-domain">
          Learning domain
        </label>
        <select
          id="lesson-domain"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
        >
          <option value="">All Learning Domains</option>
          {[
            ...new Set(lessons.map(({ domain: lessonDomain }) => lessonDomain)),
          ].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className={styles.visuallyHidden} htmlFor="lesson-status">
          Lesson status
        </label>
        <select
          id="lesson-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All Statuses</option>
          {(
            [
              'Finalized',
              'For Review',
              'Draft',
              'In Progress',
              'Upcoming',
            ] as LessonStatus[]
          ).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </section>

      <div className={styles.workspace}>
        <section
          aria-label="Lesson plans and teaching resources"
          className={styles.lessonColumn}
        >
          <div aria-label="Lesson plan sections" className={styles.sectionTabs}>
            {lessonSections.map((item) => {
              const count =
                item === 'Materials'
                  ? materialsLibrary.reduce(
                      (total, material) => total + material.count,
                      0,
                    )
                  : item === 'Favorites'
                    ? lessons.filter(({ favorite }) => favorite).length
                    : lessons.length;
              return (
                <button
                  aria-pressed={section === item}
                  className={section === item ? styles.activeSectionTab : ''}
                  key={item}
                  type="button"
                  onClick={() => {
                    setSection(item);
                    setMaterialCategory('');
                    if (item !== 'Materials') {
                      setSelectedId(filteredLessons[0]?.id ?? null);
                    }
                  }}
                >
                  <LessonIcon
                    name={
                      item === 'Lesson Plans'
                        ? 'list'
                        : item === 'Materials'
                          ? 'materials'
                          : 'star'
                    }
                  />
                  {item}
                  <span className={styles.count}>{count}</span>
                </button>
              );
            })}
          </div>

          {section === 'Materials' ? (
            <>
              <h2 className={styles.sectionHeading}>
                Materials Used in Lesson Plans
              </h2>
              {filteredMaterials.length ? (
                <div className={styles.materialGrid}>
                  {filteredMaterials.map((material, index) => (
                    <button
                      className={`${styles.materialCard} ${styles[materialColors[index % materialColors.length]]}`}
                      key={material.title}
                      type="button"
                      onClick={() => setMaterialCategory(material.title)}
                    >
                      <span aria-hidden="true">
                        <LessonIcon name="materials" />
                      </span>
                      <span>
                        <strong>{material.title}</strong>
                        <small>
                          Used in {material.count}{' '}
                          {material.count === 1
                            ? 'lesson plan'
                            : 'lesson plans'}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>
                  {loading
                    ? <BouncingDots label="Loading lesson plan materials" />
                    : 'No materials have been added to your lesson plans yet.'}
                </p>
              )}
              {materialCategory && (
                <p aria-live="polite" className={styles.notice}>
                  Showing this material from saved lesson plans:{' '}
                  {materialCategory}.
                  <button
                    aria-label="Clear material category"
                    type="button"
                    onClick={() => setMaterialCategory('')}
                  >
                    <LessonIcon name="close" />
                  </button>
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className={styles.sectionHeading}>{section}</h2>
              {loading ? (
                <p className={styles.emptyState}><BouncingDots label="Loading lesson plans" /></p>
              ) : filteredLessons.length ? (
                <div className={styles.lessonGrid}>
                  {filteredLessons.map((lesson) => (
                    <article
                      className={`${styles.lessonCard} ${selectedLesson?.id === lesson.id ? styles.selectedLesson : ''}`}
                      key={lesson.id}
                    >
                      <button
                        aria-label={`View ${lesson.title} details`}
                        className={styles.lessonSelect}
                        type="button"
                        onClick={() => {
                          setSelectedId(lesson.id);
                          setActiveTab('Overview');
                        }}
                      >
                        <span
                          className={styles.lessonStatus}
                          data-status={lesson.status}
                        >
                          {lesson.status}
                          {lesson.completed && (
                            <span className={styles.completedBadge}>
                              <LessonIcon name="check" /> Completed
                            </span>
                          )}
                        </span>
                        <span className={styles.lessonArt}>
                          <img src={childrenBanner} alt="" />
                        </span>
                        <strong className={styles.lessonTitle}>
                          {lesson.title}
                        </strong>
                        <span className={styles.lessonMeta}>
                          <LessonIcon name="topic" />Topic:{' '}
                          {lesson.topic || 'Not specified'}
                        </span>
                        <span className={styles.lessonMeta}>
                          <LessonIcon name="age" />Age Group:{' '}
                          {lesson.ageGroup || 'Not specified'}
                        </span>
                        <span className={styles.lessonMeta}>
                          <LessonIcon name="domain" />Learning Domain:{' '}
                          {lesson.domain || 'Not specified'}
                        </span>
                        <span className={styles.lessonMeta}>
                          <LessonIcon name="class" />Class:{' '}
                          {lesson.className}
                        </span>
                        <span className={styles.lessonMeta}>
                          <LessonIcon name="calendar" />
                          Date: {formatLessonDate(lesson.date)}
                        </span>
                        <span className={styles.lessonMeta}>
                          <LessonIcon name="clock" />
                          Duration: {lesson.duration} minutes
                        </span>
                      </button>
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(lesson.id);
                            setActiveTab('Overview');
                          }}
                        >
                          <LessonIcon name="view" /> View Details
                        </button>
                        <button
                          aria-label={`${lesson.favorite ? 'Remove' : 'Add'} ${lesson.title} ${lesson.favorite ? 'from' : 'to'} favorites`}
                          type="button"
                          disabled={loading}
                          onClick={() => void toggleFavorite(lesson)}
                        >
                          <LessonIcon name="star" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>
                  {lessons.length === 0
                    ? classes.length === 0
                      ? 'No active class is assigned to your account yet.'
                      : 'No lesson plans have been created for your assigned classes yet.'
                    : 'No lesson plans match these filters. Try changing your search or filters.'}
                </p>
              )}
            </>
          )}
        </section>

        <aside className={styles.rightColumn}>
          <section
            aria-label="Teaching materials library"
            className={styles.libraryPanel}
          >
            <header>
              <h2>Materials Used in Lesson Plans</h2>
              <button
                type="button"
                onClick={() => {
                  setSection('Materials');
                  setMaterialCategory('');
                }}
              >
                View All
              </button>
            </header>
            {materialsLibrary.length ? (
              <div className={styles.libraryGrid}>
                {materialsLibrary.map((material, index) => (
                  <button
                    className={`${styles.libraryTile} ${styles[materialColors[index % materialColors.length]]}`}
                    key={material.title}
                    type="button"
                    onClick={() => {
                      setSection('Materials');
                      setMaterialCategory(material.title);
                    }}
                  >
                    <span aria-hidden="true">
                      <LessonIcon name="materials" />
                    </span>
                    <span>
                      <strong>{material.title}</strong>
                      <small>
                        Used in {material.count}{' '}
                        {material.count === 1 ? 'plan' : 'plans'}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>
                {loading ? <BouncingDots label="Loading materials" /> : 'No saved materials yet.'}
              </p>
            )}
          </section>

          {selectedLesson && section !== 'Materials' && (
            <section
              aria-label="Lesson plan details"
              className={styles.detailPanel}
            >
              <header className={styles.detailHeading}>
                <h2>Lesson Plan Details</h2>
                <button type="button" onClick={() => setSelectedId(null)}>
                  Back to List
                </button>
              </header>
              <div className={styles.lessonSummary}>
                <span className={styles.summaryArt}>
                  <img src={childrenBanner} alt="" />
                </span>
                <span className={styles.summaryCopy}>
                  <strong>{selectedLesson.title}</strong>
                  <span>
                    <LessonIcon name="topic" /> Topic:{' '}
                    {selectedLesson.topic || 'Not specified'}
                  </span>
                  <span>
                    <LessonIcon name="age" /> Age Group:{' '}
                    {selectedLesson.ageGroup || 'Not specified'}
                  </span>
                  <span>
                    <LessonIcon name="domain" /> Domain: {selectedLesson.domain}
                  </span>
                </span>
                <span
                  className={styles.lessonStatus}
                  data-status={selectedLesson.status}
                >
                  {selectedLesson.status}
                  {selectedLesson.completed && (
                    <span className={styles.completedBadge}>
                      <LessonIcon name="check" /> Completed
                    </span>
                  )}
                </span>
              </div>
              <div
                aria-label="Lesson plan detail tabs"
                className={styles.detailTabs}
              >
                {lessonTabs.map((tab) => (
                  <button
                    aria-pressed={activeTab === tab}
                    className={activeTab === tab ? styles.activeDetailTab : ''}
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className={styles.detailContent}>{lessonDetails()}</div>
              <footer className={styles.detailFooter}>
                <span>
                  <LessonIcon name="calendar" />{' '}
                  {formatLessonDate(selectedLesson.date)} &nbsp;{' '}
                  <LessonIcon name="clock" /> {selectedLesson.duration} min
                </span>
                <div className={styles.detailActions}>
                  <button
                    disabled={
                      !isLessonDateReached(selectedLesson.date) ||
                      selectedLesson.status === 'Draft' ||
                      selectedLesson.status === 'For Review'
                    }
                    type="button"
                    onClick={() => void toggleCompleted(selectedLesson)}
                  >
                    <LessonIcon name="check" />
                    {selectedLesson.completed
                      ? 'Mark not complete'
                      : 'Mark complete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openDialog(selectedLesson)}
                  >
                    <LessonIcon name="edit" /> Edit Lesson Plan
                  </button>
                </div>
              </footer>
            </section>
          )}
        </aside>
      </div>

      {dialogOpen && (
        <div className={styles.dialogBackdrop}>
          <section
            aria-labelledby="lesson-dialog-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <header>
              <h2 id="lesson-dialog-title">
                {editingId === null ? 'Create Lesson Plan' : 'Edit Lesson Plan'}
              </h2>
              <button
                aria-label="Close dialog"
                type="button"
                onClick={() => setDialogOpen(false)}
              >
                <LessonIcon name="close" />
              </button>
            </header>
            <form onSubmit={saveLesson}>
              <label>
                <span>Class</span>
                <select
                  required
                  value={formClassId}
                  onChange={(event) => setFormClassId(event.target.value)}
                >
                  <option value="">Select a class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Lesson title</span>
                <input
                  autoFocus
                  required
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.target.value)}
                />
              </label>
              <label>
                <span>Topic</span>
                <input
                  required
                  value={formTopic}
                  onChange={(event) => setFormTopic(event.target.value)}
                />
              </label>
              <label>
                <span>Age group</span>
                <select
                  required
                  value={formAge}
                  onChange={(event) => setFormAge(event.target.value)}
                >
                  <option value="">Select an age group</option>
                  {['3–4 years old', '4–5 years old', '5–6 years old'].map(
                    (item) => (
                      <option key={item}>{item}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                <span>Learning domain</span>
                <select
                  required
                  value={formDomain}
                  onChange={(event) => setFormDomain(event.target.value)}
                >
                  <option value="">Select a learning domain</option>
                  {['Cognitive', 'Language', 'Creative', 'Motor'].map(
                    (item) => (
                      <option key={item}>{item}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                <span>Scheduled date</span>
                <input
                  required
                  type="date"
                  value={formDate}
                  onChange={(event) => setFormDate(event.target.value)}
                />
              </label>
              <label>
                <span>Duration in minutes</span>
                <input
                  min="1"
                  required
                  type="number"
                  value={formDuration}
                  onChange={(event) =>
                    setFormDuration(Number(event.target.value))
                  }
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  value={formStatus}
                  onChange={(event) =>
                    setFormStatus(event.target.value as LessonApiStatus)
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.dialogWideField}>
                <span>Learning objectives (one per line)</span>
                <textarea
                  rows={3}
                  value={formObjectives}
                  onChange={(event) => setFormObjectives(event.target.value)}
                />
              </label>
              <label className={styles.dialogWideField}>
                <span>Teaching procedure (one step per line)</span>
                <textarea
                  rows={4}
                  value={formProcedure}
                  onChange={(event) => setFormProcedure(event.target.value)}
                />
              </label>
              <label className={styles.dialogWideField}>
                <span>Required materials (one per line)</span>
                <textarea
                  rows={3}
                  value={formMaterials}
                  onChange={(event) => setFormMaterials(event.target.value)}
                />
              </label>
              <p>
                Published plans are shared with your selected class and notify
                its parents. Drafts are not sent to parents.
              </p>
              <div className={styles.dialogActions}>
                <button type="button" onClick={() => setDialogOpen(false)}>
                  Cancel
                </button>
                <button disabled={saving || classes.length === 0} type="submit">
                  {saving
                    ? 'Saving…'
                    : editingId === null
                      ? 'Create Lesson Plan'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
