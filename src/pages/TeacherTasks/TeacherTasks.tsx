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
import styles from './TeacherTasks.module.css';

type TaskStatus =
  'Pending' | 'Not Started' | 'In Progress' | 'Submitted' | 'Overdue';
type TaskFilter =
  'All Tasks' | 'Pending' | 'In Progress' | 'Submitted' | 'Overdue';

type TeacherTask = {
  id: number;
  title: string;
  description: string;
  type: string;
  dueAt: string;
  status: TaskStatus;
  submission: { id: number; text: string | null; submittedAt: string } | null;
};

type ApiTask = {
  id: number;
  title: string;
  description: string;
  type: string;
  due_at: string;
  status: 'pending' | 'not_started' | 'in_progress' | 'submitted' | 'overdue';
  submission: { id: number; text: string | null; submitted_at: string } | null;
};

type TasksResponse = { data: { tasks: ApiTask[] } };

const taskStatusLabels: Record<ApiTask['status'], TaskStatus> = {
  pending: 'Pending',
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  overdue: 'Overdue',
};

function formatDueDate(value: string) {
  const date = new Date(value.replace(' ', 'T'));
  return {
    date: date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

function mapTask(record: ApiTask): TeacherTask {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    type: record.type,
    dueAt: record.due_at,
    status: taskStatusLabels[record.status],
    submission: record.submission
      ? {
          id: record.submission.id,
          text: record.submission.text,
          submittedAt: record.submission.submitted_at,
        }
      : null,
  };
}

const taskFilters: TaskFilter[] = [
  'All Tasks',
  'Pending',
  'In Progress',
  'Submitted',
  'Overdue',
];

function TaskIcon({
  name,
}: {
  name: 'clipboard' | 'calendar' | 'search' | 'file' | 'check' | 'clock';
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
  if (name === 'clipboard') {
    return (
      <svg {...shared}>
        <rect x="5" y="4" width="14" height="18" rx="2" />
        <path d="M9 4V2h6v2m-6 6h6m-6 4h6m-6 4h4" />
      </svg>
    );
  }
  if (name === 'calendar') {
    return (
      <svg {...shared}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18m-12 4 2 2 4-4" />
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
  if (name === 'check') {
    return (
      <svg {...shared}>
        <path d="m5 12 4 4L19 6" />
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
  return (
    <svg {...shared}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8m-8 4h8" />
    </svg>
  );
}

export function TeacherTasks({ globalSearch }: { globalSearch: string }) {
  const { request } = useAuth();
  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('All Tasks');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('Report');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('17:00');
  const latestRequest = useRef(0);

  const reloadTasks = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoadError('');
    try {
      const response = await request<TasksResponse>(
        `/api/teacher/tasks?month=${encodeURIComponent(dateRange)}`,
      );
      if (requestId !== latestRequest.current) return;
      setTasks(response.data.tasks.map(mapTask));
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setTasks([]);
      setLoadError(
        error instanceof Error ? error.message : 'Tasks could not be loaded.',
      );
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [dateRange, request]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active && document.visibilityState === 'visible') {
        void reloadTasks();
      }
    };
    void reloadTasks();
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reloadTasks]);

  const counts = useMemo(
    () => ({
      'All Tasks': tasks.length,
      Pending: tasks.filter(
        ({ status }) => status === 'Pending' || status === 'Not Started',
      ).length,
      'In Progress': tasks.filter(({ status }) => status === 'In Progress')
        .length,
      Submitted: tasks.filter(({ status }) => status === 'Submitted').length,
      Overdue: tasks.filter(({ status }) => status === 'Overdue').length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(() => {
    const term = `${search} ${globalSearch}`.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesTerm =
        !term ||
        `${task.title} ${task.description} ${task.type} ${task.status}`
          .toLowerCase()
          .includes(term);
      const matchesFilter =
        filter === 'All Tasks' ||
        task.status === filter ||
        (filter === 'Pending' && task.status === 'Not Started');
      return matchesTerm && matchesFilter;
    });
  }, [filter, globalSearch, search, tasks]);

  const selectedTask = tasks.find(({ id }) => id === selectedTaskId) ?? null;

  function startTask(task: TeacherTask) {
    setSelectedTaskId(task.id);
    setSubmissionText('');
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask || !submissionText.trim() || saving) return;
    setSaving(true);
    setNotice('');
    try {
      await request(`/api/teacher/tasks/${selectedTask.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ text: submissionText.trim() }),
      });
      await reloadTasks();
      setSelectedTaskId(null);
      setSubmissionText('');
      setNotice('Task submission saved.');
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Task submission could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title || !newDueDate || saving) return;
    setSaving(true);
    setNotice('');
    try {
      await request('/api/teacher/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: newDescription.trim(),
          type: newType,
          due_at: `${newDueDate}T${newDueTime}`,
        }),
      });
      const newMonth = newDueDate.slice(0, 7);
      if (newMonth !== dateRange) setDateRange(newMonth);
      else await reloadTasks();
      setFilter('All Tasks');
      setSearch('');
      setCreateDialogOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNotice('Task created.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Task could not be created.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main aria-label="My Task and Submissions" className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}>
            <TaskIcon name="clipboard" />
          </span>
          <div>
            <h1>My Task and Submissions</h1>
            <p>Create tasks, track due dates, and save your submissions.</p>
          </div>
        </div>
      </header>

      {notice && (
        <p aria-live="polite" className={styles.notice}>
          {notice}
          <button
            aria-label="Dismiss message"
            type="button"
            onClick={() => setNotice('')}
          >
            ×
          </button>
        </p>
      )}
      {loadError && (
        <p aria-live="polite" className={styles.errorNotice}>
          {loadError}
        </p>
      )}

      <div className={styles.taskToolbar}>
        <div aria-label="Filter tasks by status" className={styles.statusTabs}>
          {taskFilters.map((item) => (
            <button
              aria-pressed={filter === item}
              className={`${styles.statusTab} ${filter === item ? styles.activeStatusTab : ''}`}
              key={item}
              type="button"
              onClick={() => setFilter(item)}
            >
              {item}
              <span>{counts[item]}</span>
            </button>
          ))}
        </div>
        <label className={styles.dateFilter}>
          <TaskIcon name="calendar" />
          <span className={styles.visuallyHidden}>Task date range</span>
          <input
            aria-label="Task month"
            type="month"
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
          />
        </label>
      </div>

      <div className={styles.contentGrid}>
        <section aria-label="Tasks" className={styles.taskPanel}>
          <header className={styles.taskPanelHeader}>
            <h2>Tasks</h2>
            <label className={styles.taskSearch}>
              <TaskIcon name="search" />
              <span className={styles.visuallyHidden}>Search tasks</span>
              <input
                placeholder="Search tasks..."
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </header>
          <div className={styles.tableScroll}>
            <table className={styles.taskTable}>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th aria-label="Task icon" scope="col">
                    ♯
                  </th>
                  <th scope="col">Task Title</th>
                  <th scope="col">Type</th>
                  <th scope="col">Due Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className={styles.emptyRow} colSpan={7}>
                      <BouncingDots label="Loading tasks" />
                    </td>
                  </tr>
                ) : visibleTasks.map((task, index) => {
                  const due = formatDueDate(task.dueAt);
                  return (
                  <tr key={task.id}>
                    <td className={styles.rowNumber}>{index + 1}</td>
                    <td>
                      <span
                        className={`${styles.taskTypeIcon} ${styles[`type${task.type.replace(/\s/g, '')}`]}`}
                      >
                        {task.type === 'Report' ? (
                          <TaskIcon name="file" />
                        ) : task.type === 'Media' ? (
                          '▧'
                        ) : task.type === 'Data Entry' ? (
                          '▤'
                        ) : task.type === 'Review' ? (
                          '▣'
                        ) : (
                          '▧'
                        )}
                      </span>
                    </td>
                    <th className={styles.taskName} scope="row">
                      <strong>{task.title}</strong>
                      <small>{task.description}</small>
                    </th>
                    <td>
                      <span
                        className={`${styles.typeBadge} ${styles[`badge${task.type.replace(/\s/g, '')}`]}`}
                      >
                        {task.type}
                      </span>
                    </td>
                    <td className={styles.dueDate}>
                      <span>
                        <TaskIcon name="calendar" />
                        {due.date}
                      </span>
                      <small>{due.time}</small>
                    </td>
                    <td>
                      <span
                        className={styles.taskStatus}
                        data-status={task.status}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.viewButton}
                        type="button"
                        onClick={() => startTask(task)}
                      >
                        <span aria-hidden="true">⊙</span> View
                      </button>
                    </td>
                  </tr>
                );
                })}
                {!loading && visibleTasks.length === 0 && (
                  <tr>
                    <td className={styles.emptyRow} colSpan={7}>
                      {tasks.length === 0
                        ? 'No tasks are recorded for this month. Create a task to get started.'
                        : 'No tasks match your search or selected status.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside
          aria-label="Task summary and quick actions"
          className={styles.sideColumn}
        >
          <section className={styles.summaryPanel}>
            <h2>Task Summary</h2>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryTotal}>
                <span>▤</span>
                <strong>{counts['All Tasks']}</strong>
                <small>Total Tasks</small>
              </article>
              <article className={styles.summaryPending}>
                <span>◷</span>
                <strong>{counts.Pending}</strong>
                <small>Pending</small>
              </article>
              <article className={styles.summarySubmitted}>
                <span>
                  <TaskIcon name="check" />
                </span>
                <strong>{counts.Submitted}</strong>
                <small>Submitted</small>
              </article>
              <article className={styles.summaryOverdue}>
                <span>!</span>
                <strong>{counts.Overdue}</strong>
                <small>Overdue</small>
              </article>
            </div>
          </section>
          <section className={styles.quickActions}>
            <h2>Quick Actions</h2>
            <button
              className={styles.allTasksButton}
              type="button"
              onClick={() => {
                setFilter('All Tasks');
                setSearch('');
              }}
            >
              <span aria-hidden="true">＋</span> View All Tasks
            </button>
            <button
              className={styles.submitNewButton}
              type="button"
              onClick={() => {
                setNewDueDate(`${dateRange}-${new Date().getDate().toString().padStart(2, '0')}`);
                setCreateDialogOpen(true);
              }}
            >
              <TaskIcon name="file" /> Create Task
            </button>
          </section>
        </aside>
      </div>

      {selectedTask && (
        <div className={styles.dialogBackdrop}>
          <section
            aria-labelledby="task-dialog-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <header>
              <span
                className={styles.dialogEyebrow}
                data-status={selectedTask.status}
              >
                {selectedTask.status}
              </span>
              <button
                aria-label="Close task details"
                type="button"
                onClick={() => setSelectedTaskId(null)}
              >
                ×
              </button>
            </header>
            <h2 id="task-dialog-title">{selectedTask.title}</h2>
            <p className={styles.dialogDescription}>
              {selectedTask.description}
            </p>
            <dl className={styles.taskDetails}>
              <div>
                <dt>Task type</dt>
                <dd>{selectedTask.type}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>
                    {formatDueDate(selectedTask.dueAt).date} at{' '}
                    {formatDueDate(selectedTask.dueAt).time}
                </dd>
              </div>
            </dl>
            {selectedTask.status === 'Submitted' ? (
              <p className={styles.submittedNotice}>
                <TaskIcon name="check" />
                Submitted {selectedTask.submission?.submittedAt
                  ? formatDueDate(selectedTask.submission.submittedAt).date
                  : ''}
                {selectedTask.submission?.text
                  ? `: ${selectedTask.submission.text}`
                  : '.'}
              </p>
            ) : (
              <form onSubmit={submitTask}>
                <label className={styles.submissionLabel}>
                  Submission notes
                  <textarea
                    placeholder="Add a note about your submission..."
                    value={submissionText}
                    onChange={(event) => setSubmissionText(event.target.value)}
                  />
                </label>
                <div className={styles.dialogActions}>
                  <button type="button" onClick={() => setSelectedTaskId(null)}>
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={!submissionText.trim() || saving}
                  >
                    {saving ? 'Saving…' : 'Submit Task'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {createDialogOpen && (
        <div className={styles.dialogBackdrop}>
          <section
            aria-labelledby="create-task-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <header>
              <span className={styles.dialogEyebrow}>New task</span>
              <button
                aria-label="Close task form"
                type="button"
                onClick={() => setCreateDialogOpen(false)}
              >
                ×
              </button>
            </header>
            <h2 id="create-task-title">Create Task</h2>
            <form onSubmit={createTask}>
              <label className={styles.submissionLabel}>
                Task title
                <input
                  required
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                />
              </label>
              <label className={styles.submissionLabel}>
                Description
                <textarea
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                />
              </label>
              <label className={styles.submissionLabel}>
                Task type
                <select
                  value={newType}
                  onChange={(event) => setNewType(event.target.value)}
                >
                  {[
                    'Report',
                    'Data Entry',
                    'Media',
                    'Review',
                    'Document',
                    'Materials',
                  ].map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className={styles.submissionLabel}>
                Due date
                <input
                  required
                  type="date"
                  value={newDueDate}
                  onChange={(event) => setNewDueDate(event.target.value)}
                />
              </label>
              <label className={styles.submissionLabel}>
                Due time
                <input
                  required
                  type="time"
                  value={newDueTime}
                  onChange={(event) => setNewDueTime(event.target.value)}
                />
              </label>
              <p className={styles.previewNote}>
                This task will be saved to your account.
              </p>
              <div className={styles.dialogActions}>
                <button
                  type="button"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </button>
                <button disabled={saving} type="submit">
                  {saving ? 'Saving…' : 'Create Task'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
