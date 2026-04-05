import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { apiHelper } from '../services/axiosHelper.jsx';
import { userActions } from '../store/userSlice.jsx';

/**
 * Hook for fetching user profile data with TanStack Query
 * @param {string} userId - The user ID to fetch profile for
 * @returns {Object} TanStack Query result object
 */
export const useUserProfile = (userId) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => apiHelper.getUserProfile(userId),
    enabled: !!userId, // Only run if userId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 (user not found) or 403 (forbidden)
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });
};

/**
 * Hook for updating user profile with optimistic updates
 * @param {string} userId - The user ID to update profile for
 * @returns {Object} TanStack Query mutation object
 */
export const useUpdateUserProfile = (userId) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (profileData) =>
      apiHelper.updateUserProfile(userId, profileData),

    // Optimistic update: update UI immediately before request completes
    onMutate: async (newProfileData) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['userProfile', userId] });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(['userProfile', userId]);

      // Optimistically update the query cache
      queryClient.setQueryData(['userProfile', userId], (old) => ({
        ...old,
        profile: { ...old?.profile, ...newProfileData },
      }));

      // Also update Redux store for immediate UI feedback
      dispatch(userActions.updateUserDetails(newProfileData));

      // Return context with previous value for rollback
      return { previousProfile };
    },

    // If mutation fails, rollback to previous value
    onError: (err, newProfileData, context) => {
      console.error('Error updating profile:', err);

      // Rollback query cache
      if (context?.previousProfile) {
        queryClient.setQueryData(
          ['userProfile', userId],
          context.previousProfile
        );
      }

      // Rollback Redux store
      if (context?.previousProfile?.profile) {
        dispatch(userActions.setUserDetails(context.previousProfile.profile));
      }
    },

    // Always refetch after error or success to ensure data consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    },
  });
};
