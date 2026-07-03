import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Login, Signup, ForgotPassword } from './pages/AuthPages.jsx';
import { MfaVerify } from './pages/MfaVerify.jsx';
import AuthLayout from './components/layout/AuthLayout.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { EmployeeDetail } from './pages/EmployeeDetail.jsx';
import { Landing } from './pages/Landing.jsx';
import { Announcements, Attendance, Departments, Employees, Leaves, Payroll, Performance, Tasks } from './pages/modules.jsx';
import { TaskBoard } from './pages/TaskBoard.jsx';
import { Forbidden, NotFound, Notifications, Profile, Settings } from './pages/UtilityPages.jsx';
import SecurityDashboard from './components/SecurityDashboard.jsx';

const WithUser = ({ Component }) => {
  const { user } = useAuth();
  return <Component user={user} />;
};

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/mfa-verify', element: <MfaVerify /> }
    ]
  },
  { path: '/403', element: <Forbidden /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/employees', element: <WithUser Component={Employees} /> },
          { path: '/employees/new', element: <WithUser Component={Employees} /> },
          { path: '/employees/:id', element: <EmployeeDetail /> },
          { path: '/employees/:id/edit', element: <WithUser Component={Employees} /> },
          { path: '/departments', element: <WithUser Component={Departments} /> },
          { path: '/tasks', element: <WithUser Component={Tasks} /> },
          { path: '/tasks/board', element: <TaskBoard /> },
          { path: '/attendance', element: <WithUser Component={Attendance} /> },
          { path: '/leaves', element: <WithUser Component={Leaves} /> },
          { path: '/payroll', element: <WithUser Component={Payroll} /> },
          { path: '/performance', element: <WithUser Component={Performance} /> },
          { path: '/announcements', element: <WithUser Component={Announcements} /> },
          { path: '/notifications', element: <Notifications /> },
          { path: '/profile', element: <Profile /> },
          { path: '/settings', element: <Settings /> },
          { path: '/security', element: <SecurityDashboard /> },
          { path: '*', element: <NotFound /> }
        ]
      }
    ]
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> }
]);
