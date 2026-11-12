export type ThemePreference = 'light' | 'dark' | 'system';

function themeStorageKey(userId: number) {
  return `kalingalink-theme-${userId}`;
}

export function readThemePreference(
  userId: number | undefined,
): ThemePreference | null {
  if (!userId) return null;
  try {
    const preference = localStorage.getItem(themeStorageKey(userId));
    return preference === 'light' ||
      preference === 'dark' ||
      preference === 'system'
      ? preference
      : null;
  } catch (error) {
    console.warn('The saved theme preference could not be read.', error);
    return null;
  }
}

export function saveThemePreference(
  userId: number | undefined,
  preference: ThemePreference,
) {
  if (!userId) return;
  try {
    localStorage.setItem(themeStorageKey(userId), preference);
  } catch (error) {
    console.warn(
      'The saved theme preference could not be stored locally.',
      error,
    );
  }
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): 'light' | 'dark' {
  return preference === 'system'
    ? systemPrefersDark
      ? 'dark'
      : 'light'
    : preference;
}

export function applyThemePreference(preference: ThemePreference) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  document.documentElement.dataset.theme = resolveTheme(
    preference,
    media.matches,
  );
  document.documentElement.dataset.themePreference = preference;
}
