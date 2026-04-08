import React, { useState, useEffect } from 'react';
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

  const isOpen = modal?.isOpen;
  const step = modal?.step;
  const error = modal?.error;

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

  // Handle error from mutation
  useEffect(() => {
    if (deleteError) {
      const reason =
        deleteError?.response?.data?.detail ||
        deleteError?.message ||
        'Server error';
      const short =
        typeof reason === 'string' ? reason.slice(0, 160) : String(reason);
      dispatch(commonActions.setDeleteAccountModalError(short));
      // Stay on step 2 (credentials) to show error
      dispatch(commonActions.setDeleteAccountModalStep(2));
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
                />
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
                />
              </label>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:-translate-y-1 hover:scale-105 hover:cursor-pointer"
                onClick={handleBackToWarning}
              >
                Back
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:-translate-y-1 hover:scale-105 hover:cursor-pointer"
                onClick={handleSubmitCredentials}
                disabled={!password.trim() || !confirmationText.trim()}
              >
                Delete Account
              </button>
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
      <div className="relative bg-[#bec1c3] rounded-lg p-8 w-1/2 max-w-md flex flex-col items-center gap-4 shadow-lg">
        {renderStep()}

        {/* Close button for error state (only shown when there's an error and not in loading step) */}
        {error && step !== 3 && (
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:-translate-y-1 hover:scale-105 hover:cursor-pointer"
            onClick={closeModal}
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
}
