import { createHashRouter, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { AllCalendar } from './pages/AllCalendar';
import { NewProject } from './pages/NewProject';
import { ProjectLayout } from './pages/ProjectLayout';
import { Overview } from './pages/Overview';
import { Register } from './pages/Register';
import { Matrix } from './pages/Matrix';
import { Tracker } from './pages/Tracker';
import { Calendar } from './pages/Calendar';
import { Outputs } from './pages/Outputs';
import { Settings } from './pages/Settings';

export const router = createHashRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/calendar', element: <AllCalendar /> },
  { path: '/project/new', element: <NewProject /> },
  {
    path: '/project/:id',
    element: <ProjectLayout />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'register', element: <Register /> },
      { path: 'matrix', element: <Matrix /> },
      { path: 'tracker', element: <Tracker /> },
      { path: 'calendar', element: <Calendar /> },
      { path: 'outputs', element: <Outputs /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
