import type { ReactNode } from 'react';
import styles from './Modal.module.css';

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-label={title}
        aria-modal="true"
        className={styles.modal}
        role="dialog"
      >
        <header>
          <h2>{title}</h2>
          <button aria-label="Close dialog" type="button" onClick={onClose}>
            ×
          </button>
        </header>
        <div>{children}</div>
      </section>
    </div>
  );
}
