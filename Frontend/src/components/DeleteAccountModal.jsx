import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { commonActions } from '../store/commonSlice.jsx';
import { useDeleteUser } from '../hooks/useDeleteUser.jsx';
import CircularProgress from '@mui/material/CircularProgress';

export default function DeleteAccountModal() {
  const dispatch = useDispatch();
  const modal = useSelector((state) => state.common.deleteAccountModal);
  const loginUser = useSelector((state) => state.loginModal?.auth?.user);

  const {
    mutate: deleteUser,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteUser();

  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const hasProcessedError = useRef(false);

  const isOpen = modal?.isOpen;
  const step = modal?.step;
  const error = modal?.error;
  const attemptsRemaining = modal?.attemptsRemaining || 3;
  const isLocked = modal?.isLocked || false;
  const lockoutUntil = modal?.lockoutUntil;

  // Get userId from redux or localStorage
  const userId =
    loginUser?.user_id ||
    JSON.parse(localStorage.getItem('user') || '{}')?.user_id ||
    null;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmationText('');
    }
  }, [isOpen]);

  // Handle error from mutation - use structured error data
  useEffect(() => {
    if (deleteError && !hasProcessedError.current) {
      hasProcessedError.current = true;

      // Track whether the account is locked (used later to decide on step change)
      let isLockedError = false;

      // Get structured error data from backend
      const errorData = deleteError?.response?.data;

      if (errorData) {
        // Handle structured error response
        // The backend returns error data in a nested structure: {detail: {...}}
        // where the inner object has: detail (string), attempts_remaining, is_locked, lockout_until
        let errorDetail = errorData;
        let attempts_remaining, is_locked, lockout_until;

        // Check if errorData has a nested 'detail' field (structured error)
        if (errorData.detail && typeof errorData.detail === 'object') {
          // Structured error from backend
          const structuredError = errorData.detail;
          errorDetail = structuredError.detail || 'An error occurred';
          attempts_remaining = structuredError.attempts_remaining;
          is_locked = structuredError.is_locked;
          lockout_until = structuredError.lockout_until;
        } else if (typeof errorData === 'object') {
          // Direct structured error (fallback)
          errorDetail = errorData.detail || 'An error occurred';
          attempts_remaining = errorData.attempts_remaining;
          is_locked = errorData.is_locked;
          lockout_until = errorData.lockout_until;
        } else {
          // String error
          errorDetail = errorData;
        }

        // Set error message
        dispatch(
          commonActions.setDeleteAccountModalError(
            typeof errorDetail === 'string' ? errorDetail : 'An error occurred'
          )
        );

        // Process structured error data
        if (
          attempts_remaining !== undefined ||
          is_locked !== undefined ||
          lockout_until !== undefined
        ) {
          dispatch(
            commonActions.processDeleteAccountError({
              attempts_remaining,
              is_locked,
              lockout_until,
            })
          );
        } else if (
          typeof errorDetail === 'string' &&
          errorDetail.toLowerCase().includes('incorrect password')
        ) {
          // Fallback for non-structured errors
          dispatch(commonActions.decrementDeleteAccountAttempts());
        }

        // Handle lockout for structured errors
        if (is_locked) {
          isLockedError = true;
          dispatch(
            commonActions.setDeleteAccountModalLockout({
              isLocked: true,
              lockoutUntil:
                lockout_until ||
                new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            })
          );

          // Show snackbar and close modal on lockout (3rd failed attempt)
          dispatch(
            commonActions.openSnackbar({
              message:
                'You have exceeded the number of account delete attempts for the day.',
            })
          );
          dispatch(commonActions.closeDeleteAccountModal());
        } else if (attempts_remaining === 1) {
          // 2nd failed attempt - show warning snackbar
          dispatch(
            commonActions.openSnackbar({
              message:
                'Incorrect password. Deletion will be locked after 3 failed attempts.',
            })
          );
        } else if (attempts_remaining === 2) {
          // 1st failed attempt - show remaining attempts snackbar
          dispatch(
            commonActions.openSnackbar({
              message: 'Incorrect password. 2 attempts remaining.',
            })
          );
        }
      } else {
        // Fallback for non-structured errors (legacy support)
        const reason = deleteError?.message || 'Server error';
        const errorText = String(reason).toLowerCase();

        dispatch(
          commonActions.setDeleteAccountModalError(reason.slice(0, 160))
        );

        if (errorText.includes('incorrect password')) {
          dispatch(commonActions.decrementDeleteAccountAttempts());
        }

        if (
          errorText.includes('locked for') ||
          errorText.includes('maximum attempts')
        ) {
          dispatch(
            commonActions.setDeleteAccountModalLockout({
              isLocked: true,
              lockoutUntil: new Date(
                Date.now() + 24 * 60 * 60 * 1000
              ).toISOString(),
            })
          );
        }
      }

      // Stay on step 2 (credentials) to show error (unless modal is being closed due to lockout)
      if (!isLockedError) {
        dispatch(commonActions.setDeleteAccountModalStep(2));
      }

      // Reset flag when error changes
      return () => {
        hasProcessedError.current = false;
      };
    }
  }, [deleteError, dispatch]);

  const closeModal = () => {
    dispatch(commonActions.closeDeleteAccountModal());
  };

  const handleContinueFromWarning = () => {
    if (!userId) {
      dispatch(
        commonActions.setDeleteAccountModalError(
          'Unable to identify user. Please log in again.'
        )
      );
      return;
    }
    dispatch(commonActions.setDeleteAccountModalStep(2));
  };

  const handleBackToWarning = () => {
    dispatch(commonActions.setDeleteAccountModalStep(1));
    dispatch(commonActions.setDeleteAccountModalError(null));
  };

  const handleSubmitCredentials = () => {
    if (!password.trim()) {
      dispatch(
        commonActions.setDeleteAccountModalError('Password is required')
      );
      return;
    }

    if (!confirmationText.trim()) {
      dispatch(
        commonActions.setDeleteAccountModalError(
          'Confirmation text is required'
        )
      );
      return;
    }

    // Case-insensitive check
    if (confirmationText.toLowerCase() !== 'i want to delete my account') {
      dispatch(
        commonActions.setDeleteAccountModalError(
          'Confirmation text must be exactly: "I want to delete my account" (case-insensitive)'
        )
      );
      return;
    }

    if (!userId) {
      dispatch(
        commonActions.setDeleteAccountModalError(
          'Unable to identify user. Please log in again.'
        )
      );
      return;
    }

    // Move to loading step
    dispatch(commonActions.setDeleteAccountModalStep(3));

    // Trigger deletion mutation
    deleteUser({ userId, password, confirmationText });
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (step) {
      case 1: // Warning step
        return (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-[#7b5063da] text-2xl font-bold">
              Delete Account
            </h2>
            <div className="text-gray-700 text-center">
              <p className="mb-2">
                This action is{' '}
                <strong className="text-red-600">irreversible</strong>.
              </p>
              <p className="mb-2">
                All your tasks and profile data will be permanently deleted.
              </p>
              <p>You will be logged out and redirected to the welcome page.</p>
            </div>
            <div className="flex gap-4 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:-translate-y-1 hover:scale-105 hover:cursor-pointer"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:-translate-y-1 hover:scale-105 hover:cursor-pointer"
                onClick={handleContinueFromWarning}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 2: // Credentials step
        return (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-[#7b5063da] text-2xl font-bold">
              Confirm Deletion
            </h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-full">
                <p className="font-bold">Error</p>
                <p>{error}</p>
                {/* Show attempt counter for password errors */}
                {typeof error === 'string' &&
                  error.toLowerCase().includes('incorrect password') &&
                  attemptsRemaining > 0 && (
                    <p className="mt-2 text-sm">
                      {attemptsRemaining} attempt(s) remaining
                    </p>
                  )}
              </div>
            )}

            <div className="w-full">
              <label className="block text-gray-700 mb-2">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                  placeholder="Enter your password"
                  disabled={isLocked}
                />
                {/* Show attempt counter below password field */}
                {!error && attemptsRemaining < 3 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {attemptsRemaining} attempt(s) remaining
                  </p>
                )}
              </label>

              <label className="block text-gray-700 mb-2">
                Type the following text exactly:
                <p className="text-sm text-gray-500 mb-1">
                  "I want to delete my account"
                </p>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                  placeholder='Type "I want to delete my account"'
                  disabled={isLocked}
                />
              </label>
            </div>

            <div className="flex gap-4 mt-4">
              {isLocked ? (
                // Locked state - only show Close button
                <button
                  className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
                  disabled
                >
                  Account Deletion Locked
                </button>
              ) : (
                // Normal state - show Back and Delete Account buttons
                <>
                  <button
                    className="px-4 py-2 bg-gray-300 rounded hover:-translate-y-1 hover:scale-105 hover:cursor-pointer"
                    onClick={handleBackToWarning}
                  >
                    Back
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:-translate-y-1 hover:scale-105 hover:cursor-pointer"
                    onClick={handleSubmitCredentials}
                    disabled={
                      !password.trim() || !confirmationText.trim() || isLocked
                    }
                  >
                    Delete Account
                  </button>
                </>
              )}
            </div>
          </div>
        );

      case 3: // Loading step
        return (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-[#7b5063da] text-2xl font-bold">
              Deleting Account
            </h2>
            <div className="text-gray-700 text-center">
              <p>Please wait while we delete your account...</p>
              <p className="text-sm text-gray-500">
                This may take a few moments.
              </p>
            </div>
            <CircularProgress size={40} />

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-full mt-4">
                <p className="font-bold">Error</p>
                <p>{error}</p>
                <button
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => {
                    dispatch(commonActions.setDeleteAccountModalStep(2));
                    dispatch(commonActions.setDeleteAccountModalError(null));
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />
      <div className="relative bg-[#bec1c3] rounded-lg p-8 w-11/12 lg:w-1/2 max-w-md flex flex-col items-center gap-4 shadow-lg">
        {renderStep()}
      </div>
    </div>
  );
}
