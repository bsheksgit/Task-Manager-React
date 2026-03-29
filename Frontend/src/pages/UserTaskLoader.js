import { apiHelper } from '../services/axiosHelper';
import { queryClient } from '../main.jsx';
import { redirect } from 'react-router-dom';
import store from '../store/index';
import { commonActions } from '../store/commonSlice.jsx';

export async function loader({ params }) {
  const userId = params?.userId;
  const taskId = params?.taskId;

  if (!userId || !taskId) {
    return { userId, taskId, task: null, error: 'Missing userId or taskId' };
  }

  try {
    const data = await apiHelper.getUserTask(userId, taskId);
    return { userId, taskId, task: data.task || null, error: null };
  } catch (error) {
    const status = error.response?.status;

    if (status === 404) {
      // Task doesn't exist - show snackbar and invalidate userTasks query
      store.dispatch(
        commonActions.openSnackbar({
          message: 'Task not found. Refreshing tasks list...',
        })
      );

      // Invalidate the userTasks query to refresh from server
      queryClient.invalidateQueries(['userTasks', userId]);

      // Redirect back to tasks list using redirect() from react-router-dom
      throw redirect(`/users/${userId}/tasks`);
    } else if (status === 403 || status === 401) {
      // Permission denied or session expired
      // Store session expiration flag and redirect to logout page
      try {
        localStorage.setItem('sessionExpired', 'true');
      } catch (e) {}

      // Redirect to logout page which will show appropriate message
      throw redirect('/logout');
    } else {
      // Other errors - return error state for the component to handle
      return {
        userId,
        taskId,
        task: null,
        error: error?.message || 'Error fetching task',
      };
    }
  }
}
