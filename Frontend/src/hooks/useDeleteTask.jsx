import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { userActions } from '../store/userSlice';
import { commonActions } from '../store/commonSlice';
import { apiHelper } from '../services/axiosHelper';

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ userId, taskId }) =>
      apiHelper.deleteUserTask(userId, taskId),
    onMutate: async ({ userId, taskId }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['userTasks', userId] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['userTasks', userId]);

      // Optimistically remove the task from the query cache
      queryClient.setQueryData(['userTasks', userId], (old) => {
        if (!old?.tasks) return old;
        return {
          ...old,
          tasks: old.tasks.filter((task) => task._id !== taskId),
        };
      });

      // Also remove from Redux store for immediate UI update
      dispatch(userActions.removeTaskOptimistically({ taskId }));

      // Return context with the previous tasks for rollback
      return { previousTasks, userId, taskId };
    },
    onError: (err, variables, context) => {
      // Rollback to the previous value in query cache
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ['userTasks', context.userId],
          context.previousTasks
        );
      }

      // Rollback in Redux store
      dispatch(
        userActions.restoreTask({
          taskId: context?.taskId,
          task: context?.previousTasks?.tasks?.find(
            (t) => t._id === context?.taskId
          ),
        })
      );

      // Show error snackbar
      const reason =
        err?.response?.data?.detail || err?.message || 'Server error';
      dispatch(
        commonActions.openSnackbar({
          message: `Failed to delete task: ${reason.slice(0, 100)}`,
        })
      );
    },
    onSuccess: (data, variables, context) => {
      // Show success snackbar
      dispatch(
        commonActions.openSnackbar({
          message: 'Task deleted successfully!',
        })
      );

      // Invalidate and refetch to ensure sync with server
      queryClient.invalidateQueries({
        queryKey: ['userTasks', variables.userId],
      });
    },
    onSettled: (data, error, variables, context) => {
      // Ensure query cache is fresh
      queryClient.invalidateQueries({
        queryKey: ['userTasks', variables.userId],
      });
    },
  });
}
