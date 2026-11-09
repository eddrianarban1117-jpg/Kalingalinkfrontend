import { useState } from 'react';
import styles from './ListGridToggle.module.css';

type View = 'list' | 'grid';

function readSavedView(storageKey: string, initialView: View): View {
  try {
    const savedView = window.localStorage.getItem(storageKey);
    return savedView === 'list' || savedView === 'grid'
      ? savedView
      : initialView;
  } catch (error) {
    console.error('Unable to read the saved list view preference.', error);
    return initialView;
  }
}

export function ListGridToggle({
  storageKey,
  initialView = 'list',
  onChange,
}: {
  storageKey: string;
  initialView?: View;
  onChange: (view: View) => void;
}) {
  const [view, setView] = useState(() =>
    readSavedView(storageKey, initialView),
  );

  function selectView(nextView: View) {
    setView(nextView);
    try {
      window.localStorage.setItem(storageKey, nextView);
    } catch (error) {
      console.error('Unable to save the list view preference.', error);
    }
    onChange(nextView);
  }

  return (
    <div aria-label="Choose list or grid view" className={styles.toggle}>
      <button
        aria-label="List view"
        aria-pressed={view === 'list'}
        className={view === 'list' ? styles.active : ''}
        type="button"
        onClick={() => selectView('list')}
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      </button>
      <button
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        className={view === 'grid' ? styles.active : ''}
        type="button"
        onClick={() => selectView('grid')}
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
    </div>
  );
}
