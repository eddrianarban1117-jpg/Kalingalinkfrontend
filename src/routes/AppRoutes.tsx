import { Navigate, Route, Routes } from 'react-router-dom';
import { routePaths } from '../constants/app-constants';
import { Login } from '../pages/Login/Login';
import { AccountChoice } from '../pages/AccountChoice/AccountChoice';
import { MswdoDashboard } from '../pages/MswdoDashboard/MswdoDashboard';
import { AddTeacher } from '../pages/AddTeacher/AddTeacher';
import { TeacherManagement } from '../pages/AddTeacher/TeacherManagement';
import { ChildDevelopmentCenters } from '../pages/ChildDevelopmentCenters/ChildDevelopmentCenters';
import { EnrollmentManagement } from '../pages/EnrollmentManagement/EnrollmentManagement';
import { ChildrenRecords } from '../pages/ChildrenRecords/ChildrenRecords';
import { AttendanceMonitoring } from '../pages/AttendanceMonitoring/AttendanceMonitoring';
import { LearningDevelopment } from '../pages/LearningDevelopment/LearningDevelopment';
import { ReportsAnalytics } from '../pages/ReportsAnalytics/ReportsAnalytics';
import { NotificationsAlerts } from '../pages/NotificationsAlerts/NotificationsAlerts';
import { Settings } from '../pages/Settings/Settings';
import { ParentRegistration } from '../pages/ParentRegistration/ParentRegistration';
import { Welcome } from '../pages/Welcome/Welcome';
import { TeacherDashboard } from '../pages/TeacherDashboard/TeacherDashboard';
import { TeacherVerification } from '../pages/TeacherVerification/TeacherVerification';
import { ParentDashboard } from '../pages/ParentDashboard/ParentDashboard';
import { RequireRole } from '../auth/RequireRole';
import { GuestOnlyRoute } from '../auth/GuestOnlyRoute';
import { EventsPage } from '../pages/Events/EventsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={routePaths.welcome} element={<GuestOnlyRoute><Welcome /></GuestOnlyRoute>} />
      <Route path={routePaths.accountChoice} element={<GuestOnlyRoute><AccountChoice /></GuestOnlyRoute>} />
      <Route path={routePaths.signup} element={<GuestOnlyRoute redirectAuthenticated={false}><Login /></GuestOnlyRoute>} />
      <Route path={routePaths.parentSignup} element={<ParentRegistration />} />
      <Route
        path={routePaths.teacherSignup}
        element={<AddTeacher mode="public" />}
      />
      <Route
        path={routePaths.teacherVerification}
        element={<RequireRole allowed={['teacher']}><TeacherVerification /></RequireRole>}
      />
      <Route
        path={routePaths.teacherDashboard}
        element={<RequireRole allowed={['teacher']}><TeacherDashboard /></RequireRole>}
      />
      <Route
        path={routePaths.teacherEvents}
        element={<RequireRole allowed={['teacher']}><TeacherDashboard /></RequireRole>}
      />
      <Route
        path={routePaths.teacherEnrollment}
        element={<RequireRole allowed={['teacher']}><TeacherDashboard /></RequireRole>}
      />
      <Route path={routePaths.teacherStudents} element={<RequireRole allowed={['teacher']}><TeacherDashboard /></RequireRole>} />
      <Route
        path={routePaths.teacherAttendance}
        element={<RequireRole allowed={['teacher']}><TeacherDashboard /></RequireRole>}
      />
      <Route
        path={routePaths.teacherLearningActivities}
        element={<RequireRole allowed={['teacher']}><TeacherDashboard /></RequireRole>}
      />
      <Route
        path={routePaths.teacherLessonPlans}
        element={<RequireRole allowed={['teacher']}><TeacherDashboard /></RequireRole>}
      />
      <Route
        path={routePaths.teacherChildrenProgress}
        element={<RequireRole allowed={['teacher']}><TeacherDashboard /></RequireRole>}
      />
      <Route path={routePaths.teacherTasks} element={<RequireRole allowed={['teacher']}><TeacherDashboard /></RequireRole>} />
      <Route
        path={routePaths.teacherNotifications}
        element={<RequireRole allowed={['teacher']}><TeacherDashboard /></RequireRole>}
      />
      <Route path={routePaths.teacherProfile} element={<RequireRole allowed={['teacher']}><TeacherDashboard /></RequireRole>} />
      <Route
        path="/parent"
        element={<Navigate to={routePaths.parentDashboard} replace />}
      />
      <Route path="/parent/*" element={<RequireRole allowed={['parent']}><ParentDashboard /></RequireRole>} />
      <Route path={routePaths.login} element={<GuestOnlyRoute redirectAuthenticated={false}><Login /></GuestOnlyRoute>} />
      <Route
        path="/admin"
        element={<Navigate to={routePaths.mswdoAdmin} replace />}
      />
      <Route path={routePaths.mswdoAdmin} element={<RequireRole allowed={['admin']}><MswdoDashboard /></RequireRole>} />
      <Route
        path={routePaths.adminEvents}
        element={
          <RequireRole allowed={['admin']}>
            <MswdoDashboard activeNavigation="Events">
              <EventsPage mode="manage" />
            </MswdoDashboard>
          </RequireRole>
        }
      />
      <Route
        path={routePaths.childDevelopmentCenters}
        element={
          <RequireRole allowed={['admin']}>
            <MswdoDashboard activeNavigation="Child Development Centers">
              <ChildDevelopmentCenters />
            </MswdoDashboard>
          </RequireRole>
        }
      />
      <Route
        path={routePaths.enrollmentManagement}
        element={
          <RequireRole allowed={['admin']}>
            <MswdoDashboard activeNavigation="Enrollment Management">
              <EnrollmentManagement />
            </MswdoDashboard>
          </RequireRole>
        }
      />
      <Route
        path={routePaths.childrenRecords}
        element={
          <RequireRole allowed={['admin']}>
            <MswdoDashboard activeNavigation="Children Records">
              <ChildrenRecords />
            </MswdoDashboard>
          </RequireRole>
        }
      />
      <Route
        path={routePaths.attendanceMonitoring}
        element={
          <RequireRole allowed={['admin']}>
            <MswdoDashboard activeNavigation="Attendance and Monitoring">
              <AttendanceMonitoring />
            </MswdoDashboard>
          </RequireRole>
        }
      />
      <Route
        path={routePaths.learningDevelopment}
        element={
          <RequireRole allowed={['admin']}>
            <MswdoDashboard activeNavigation="Learning and Development">
              <LearningDevelopment />
            </MswdoDashboard>
          </RequireRole>
        }
      />
      <Route
        path={routePaths.reportsAnalytics}
        element={
          <RequireRole allowed={['admin']}>
            <MswdoDashboard activeNavigation="Reports and Analytics">
              <ReportsAnalytics />
            </MswdoDashboard>
          </RequireRole>
        }
      />
      <Route
        path={routePaths.notificationsAlerts}
        element={
          <RequireRole allowed={['admin']}>
            <MswdoDashboard activeNavigation="Notification and Alerts">
              <NotificationsAlerts />
            </MswdoDashboard>
          </RequireRole>
        }
      />
      <Route
        path={routePaths.settings}
        element={
          <RequireRole allowed={['admin']}>
            <MswdoDashboard activeNavigation="Settings">
              <Settings />
            </MswdoDashboard>
          </RequireRole>
        }
      />
      <Route
        path={routePaths.teacherManagement}
        element={
          <RequireRole allowed={['admin']}>
            <MswdoDashboard activeNavigation="Teacher Management">
              <TeacherManagement />
            </MswdoDashboard>
          </RequireRole>
        }
      />
      <Route
        path={routePaths.addTeacher}
        element={
          <RequireRole allowed={['admin']}>
            <MswdoDashboard activeNavigation="Teacher Management">
              <AddTeacher />
            </MswdoDashboard>
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to={routePaths.welcome} replace />} />
    </Routes>
  );
}
