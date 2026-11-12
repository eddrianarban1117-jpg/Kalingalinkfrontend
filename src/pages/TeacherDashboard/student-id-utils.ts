export function studentCode(id: number) {
  return `STU-${String(id).padStart(4, '0')}`;
}
