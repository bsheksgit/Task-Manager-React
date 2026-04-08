import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { loginModalActions } from '../store/loginSlice.jsx';
import { commonActions } from '../store/commonSlice.jsx';
import { apiHelper } from '../services/axiosHelper.jsx';
import { useNavigate } from 'react-router-dom';

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ userId, password, confirmationText }) =>
      apiHelper.deleteUser(userId, password, confirmationText),
    onMutate: () => {
      // Show loading state - modal will handle this
    },
    onError: (err) => {
      // Error will be handled in the modal component
      // We don't need to show snackbar here since modal shows error
      console.error('Error deleting user:', err);
    },
    onSuccess: (data, variables) => {
      // Clear TanStack Query cache for user-related queries
      queryClient.removeQueries({ queryKey: ['userTasks', variables.userId] });
      queryClient.removeQueries({
        queryKey: ['userProfile', variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ['userTasks'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      // Dispatch logout action to clear Redux state
      dispatch(loginModalActions.logout());

      // Navigate to welcome page
      navigate('/');

      // Show success snackbar
      dispatch(
        commonActions.openSnackbar({
          message: "Account deleted successfully. We're sorry to see you go!",
        })
      );
    },
  });
}
