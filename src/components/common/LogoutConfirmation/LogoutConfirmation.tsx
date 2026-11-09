import { useEffect, useRef } from 'react';
import styles from './LogoutConfirmation.module.css';

type LogoutConfirmationProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LogoutConfirmation({
  open,
  onCancel,
  onConfirm,
}: LogoutConfirmationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      aria-describedby="logout-dialog-description"
      aria-labelledby="logout-dialog-title"
      className={styles.logoutDialog}
      onClose={onCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      ref={dialogRef}
    >
      <button
        aria-label="Close log out confirmation"
        className={styles.closeLogoutDialog}
        onClick={onCancel}
        type="button"
      >
        ×
      </button>
      <span aria-hidden="true" className={styles.logoutDialogIcon}>
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M10 17l5-5-5-5m5 5H3" />
          <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
        </svg>
      </span>
      <h2 id="logout-dialog-title">Are you sure you want to log out?</h2>
      <p id="logout-dialog-description">
        You will be returned to the login page and may need to sign in again to
        access your account.
      </p>
      <div className={styles.logoutDialogActions}>
        <button
          className={styles.cancelLogout}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          autoFocus
          className={styles.confirmLogout}
          onClick={onConfirm}
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M10 17l5-5-5-5m5 5H3" />
            <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          </svg>
          Log Out
        </button>
      </div>
    </dialog>
  );
}
