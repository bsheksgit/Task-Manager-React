import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { commonActions } from '../store/commonSlice.jsx';
import { userActions } from '../store/userSlice.jsx';
import useHTTP from '../hooks/useHTTP.jsx';
import { apiHelper } from '../services/axiosHelper.jsx';
import { useQueryClient } from '@tanstack/react-query';
import { redirect } from 'react-router-dom';

export default function DeleteConfirmModal() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { loading, error, sendRequest } = useHTTP();
  const modal = useSelector((state) => state.common.deleteConfirmModal);
  const userTasks = useSelector((state) => state.user.userTasks);
  const loginUser = useSelector((state) => state.loginModal?.auth?.user);
  const [failedReason, setFailedReason] = useState(null);

  const isOpen = modal?.isOpen;
  const taskId = modal?.taskId;

  const handleClose = () => {
    dispatch(commonActions.closeDeleteConfirm());
    setFailedReason(null);
  };

  const handleConfirm = async () => {
    // determine userId from redux or localStorage
    const userId =
      loginUser?.user_id ||
      JSON.parse(localStorage.getItem('user') || '{}')?.user_id ||
      null;

    try {
      await sendRequest(apiHelper.deleteUserTask, userId, taskId);
      // Invalidate the tasks query so UserTasks re-fetches the latest list from server.
      queryClient.invalidateQueries({ queryKey: ['userTasks'] });
      handleClose();
      window.location.href = `/users/${userId}/tasks`;
      dispatch(
        commonActions.openSnackbar({ message: 'Task deleted Successfully!' })
      );
    } catch (err) {
      // Do NOT remove locally. Show snackbar and display short reason on modal.
      const reason =
        err?.response?.data?.detail || err?.message || 'Server error';
      const short =
        typeof reason === 'string' ? reason.slice(0, 160) : String(reason);
      setFailedReason(short);
      dispatch(
        commonActions.openSnackbar({ message: 'Failed to delete task.' })
      );
      // leave modal open and show OK button
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-[#bec1c3] rounded-lg p-8 w-1/2 flex flex-col items-center gap-2 shadow-lg">
        <h2 className="text-[#7b5063da] text-2xl font-bold mb-2">
          {failedReason ? 'Delete Failed' : 'Confirm Delete'}
        </h2>
        <p className="text-gray-700 text-center">
          {failedReason
            ? `Could not delete:`
            : `Are you sure you want to delete the task:`}
        </p>
        <p className="text-gray-700 text-center">
          {failedReason
            ? `${failedReason}`
            : `"${modal?.title || 'this task'}"?`}
        </p>
        <div className="flex gap-4 mt-4">
          {!failedReason ? (
            <>
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:-translate-y-1 hover:scale-105 hover:cursor-pointer"
                onClick={handleClose}
              >
                No
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:-translate-y-1 hover:scale-105 hover:cursor-pointer"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Yes'}
              </button>
            </>
          ) : (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:-translate-y-1 hover:scale-105 hover:cursor-pointer"
              onClick={handleClose}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
