import { createBrowserRouter } from 'react-router-dom';
import Welcome from './pages/Welcome';
import UserTasks from './pages/UserTasks';
import UserTask from './pages/UserTask';
import Logout from './pages/Logout';
import { loader as userTasksLoader } from './pages/UserTasksLoader';
import { loader as userTaskLoader } from './pages/UserTaskLoader';
import RequireAuth from './components/RequireAuth';
import { apiHelper } from './services/axiosHelper';

const router = createBrowserRouter([
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
]);

export default router;
