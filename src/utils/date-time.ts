export const PHILIPPINE_TIME_ZONE = 'Asia/Manila';

type DateTimeValue = string | Date;

export function parsePhilippineDateTime(value: DateTimeValue): Date {
  if (value instanceof Date) return value;

  const normalized = value.trim().replace(' ', 'T');
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return new Date(`${normalized}T00:00:00+08:00`);
  }

  const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized);
  return new Date(hasTimeZone ? normalized : `${normalized}+08:00`);
}

export function toPhilippineISOString(value: string): string {
  const date = parsePhilippineDateTime(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function formatPhilippineDateTime(
  value: DateTimeValue,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = parsePhilippineDateTime(value);
  if (Number.isNaN(date.getTime())) {
    return value instanceof Date ? '' : value;
  }

  const dateFields = ['weekday', 'era', 'year', 'month', 'day'];
  const timeFields = [
    'hour',
    'minute',
    'second',
    'fractionalSecondDigits',
    'dayPeriod',
  ];
  const hasDateFields = dateFields.some((field) => field in options);
  const hasTimeFields = timeFields.some((field) => field in options);

  return new Intl.DateTimeFormat('en-PH', {
    ...(hasDateFields ? {} : { dateStyle: 'medium' }),
    ...(hasTimeFields ? {} : { timeStyle: 'short' }),
    ...options,
    timeZone: PHILIPPINE_TIME_ZONE,
  }).format(date);
}

export function formatPhilippineTime(
  value: DateTimeValue,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = parsePhilippineDateTime(value);
  if (Number.isNaN(date.getTime())) {
    return value instanceof Date ? '' : value;
  }

  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    ...options,
    timeZone: PHILIPPINE_TIME_ZONE,
  }).format(date);
}

export function formatPhilippineDate(
  value: DateTimeValue,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const isDateOnly =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  const date = isDateOnly
    ? new Date(`${value.trim()}T00:00:00Z`)
    : parsePhilippineDateTime(value);

  if (Number.isNaN(date.getTime())) {
    return value instanceof Date ? '' : value;
  }

  const hasDateFields = ['weekday', 'era', 'year', 'month', 'day'].some(
    (field) => field in options,
  );
  return new Intl.DateTimeFormat('en-PH', {
    ...(hasDateFields ? {} : { dateStyle: 'medium' }),
    ...options,
    timeZone: isDateOnly ? 'UTC' : PHILIPPINE_TIME_ZONE,
  }).format(date);
}

export function philippineDateTimeInputValue(value?: string): string {
  const date = value ? parsePhilippineDateTime(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PHILIPPINE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const fields = Object.fromEntries(
    parts.map(({ type, value: partValue }) => [type, partValue]),
  );

  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}

export function getPhilippineDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PHILIPPINE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const fields = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${fields.year}-${fields.month}-${fields.day}`;
}

export function getPhilippineDateKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
  const date = parsePhilippineDateTime(value);
  return Number.isNaN(date.getTime())
    ? value.slice(0, 10)
    : getPhilippineDateString(date);
}
