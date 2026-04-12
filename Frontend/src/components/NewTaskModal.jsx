import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { commonActions } from '../store/commonSlice.jsx';
import { userActions } from '../store/userSlice.jsx';
import useHTTP from '../hooks/useHTTP.jsx';
import { apiHelper } from '../services/axiosHelper.jsx';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useQueryClient } from '@tanstack/react-query';

const NAME_LIMIT = 30;
const DESC_LIMIT = 90;

function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().length;
}

export default function NewTaskModal() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const userTasks = useSelector((state) => state.user.userTasks);
  const loginUser = useSelector((state) => state.loginModal?.auth?.user);
  const { loading: saveLoading, error: saveError, sendRequest } = useHTTP();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const nameWords = countWords(name);
  const descWords = countWords(description);
  const isNameOver = nameWords > NAME_LIMIT;
  const isDescOver = descWords > DESC_LIMIT;
  const isSaveDisabled =
    !name.trim() ||
    isNameOver ||
    isDescOver ||
    nameWords === 0 ||
    descWords === 0;

  const handleSave = () => {
    if (isSaveDisabled) return;
    const newTask = {
      id: Date.now(),
      title: name,
      description: description,
    };
    const updated = { tasks: [...(userTasks?.tasks || []), newTask] };

    // prepare payload without local-only `id` fields
    const tasksToSend = updated.tasks.map(({ id, ...rest }) => rest);

    // determine userId from redux or localStorage
    const userId =
      loginUser?.user_id ||
      JSON.parse(localStorage.getItem('user') || '{}')?.user_id ||
      null;

    // call API via useHTTP helper
    sendRequest(apiHelper.saveUserTasks, userId, tasksToSend)
      .then((data) => {
        dispatch(
          commonActions.openSnackbar({
            message: data?.message || 'Tasks saved successfully.',
          })
        );
        // Invalidate the tasks query so UserTasks re-fetches from server.
        // This syncs the real `_id` assigned by the backend into Redux.
        queryClient.invalidateQueries({ queryKey: ['userTasks'] });
      })
      .catch((err) => {
        console.error('Save tasks failed:', err);
        dispatch(
          commonActions.openSnackbar({
            message: 'Failed to save tasks. Please try again.',
          })
        );
      })
      .finally(() => {
        dispatch(commonActions.closeNewTaskModal());
      });
  };

  const handleClose = () => {
    dispatch(commonActions.closeNewTaskModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-yellow-200 rounded-lg p-6 lg:p-10 w-10/12 lg:w-1/2 flex flex-col items-center justify-center gap-4">
        <div
          className="absolute top-2 right-2 cursor-pointer hover:bg-red-600/50 rounded-lg"
          onClick={handleClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">
          Add Task Details
        </h1>
        <div className="flex flex-col items-center gap-4 w-full">
          <TextField
            label="Task Name"
            name="name"
            variant="filled"
            className="w-11/12 lg:w-3/4 mt-5"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={isNameOver}
            helperText={
              isNameOver
                ? `Limit exceeded (${nameWords}/${NAME_LIMIT} characters)`
                : `${nameWords}/${NAME_LIMIT} characters`
            }
          />
          <TextField
            label="Task Description"
            name="description"
            variant="filled"
            className="w-11/12 lg:w-3/4 mt-4 mb-5"
            required
            multiline
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={isDescOver}
            helperText={
              isDescOver
                ? `Limit exceeded (${descWords}/${DESC_LIMIT} characters)`
                : `${descWords}/${DESC_LIMIT} characters`
            }
          />
          <div className="flex gap-4">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={isSaveDisabled || saveLoading}
            >
              {saveLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// (previously used a wrapper hook; mutation is created directly in the component)
