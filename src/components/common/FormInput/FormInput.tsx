import styles from './FormInput.module.css';

type FormInputProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'>;

export function FormInput({
  id,
  label,
  error,
  hint,
  ...inputProps
}: FormInputProps) {
  const descriptionIds = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        aria-describedby={descriptionIds || undefined}
        aria-invalid={Boolean(error)}
        id={id}
        {...inputProps}
      />
      {hint && (
        <span className={styles.hint} id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className={styles.error} id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
