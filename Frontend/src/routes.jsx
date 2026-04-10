import { createBrowserRouter } from 'react-router-dom';
import Welcome from './pages/Welcome';
import UserTasks from './pages/UserTasks';
import UserTask from './pages/UserTask';
import UserProfile from './pages/UserProfile';
import Logout from './pages/Logout';
import { loader as userTasksLoader } from './pages/UserTasksLoader';
import { loader as userTaskLoader } from './pages/UserTaskLoader';
import RequireAuth from './components/RequireAuth';
import Layout from './components/Layout';
import ErrorPage from './pages/ErrorPage';

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <Welcome /> },
      {
        path: '/logout',
        element: <Logout />,
      },
      {
        path: '/users/:userId/tasks',
        element: (
          <RequireAuth>
            <UserTasks />
          </RequireAuth>
        ),
        loader: userTasksLoader,
      },
      {
        path: '/users/:userId/tasks/:taskId',
        element: (
          <RequireAuth>
            <UserTask />
          </RequireAuth>
        ),
        loader: userTaskLoader,
      },
      {
        path: '/users/:userId/profile',
        element: (
          <RequireAuth>
            <UserProfile />
          </RequireAuth>
        ),
      },
    ],
  },
]);

export default router;
