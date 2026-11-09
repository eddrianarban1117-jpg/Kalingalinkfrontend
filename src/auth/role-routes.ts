import { routePaths } from '../constants/app-constants';

export function dashboardPathForRole(role: string) {
  if (role === 'admin') return routePaths.mswdoAdmin;
  if (role === 'teacher') return routePaths.teacherDashboard;
  return routePaths.parentDashboard;
}
