import { useEffect, useState } from 'react';
import { useLoaderData, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { commonActions } from '../store/commonSlice';
import { userActions } from '../store/userSlice';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import CircularProgress from '@mui/material/CircularProgress';
import { apiHelper } from '../services/axiosHelper';

// Character limits
const TITLE_LIMIT = 30;
const DESCRIPTION_LIMIT = 90;
const TODO_ITEM_LIMIT = 60;

// Helper function to count characters
function countCharacters(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().length;
}

export default function UserTask() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const loaderData = useLoaderData();
  const navigate = useNavigate();
  const { userId, taskId, task, error } = loaderData;

  // Get userTasks from Redux store
  const userTasks = useSelector((state) => state.user.userTasks);
  const isDeletingTask = useSelector((state) => state.common.isDeletingTask);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taskData, setTaskData] = useState(task || {});
  const [todoItems, setTodoItems] = useState(task?.todoList || []);
  const [newTodo, setNewTodo] = useState('');

  // State for adding new todo mode
  const [isAddingNewTodo, setIsAddingNewTodo] = useState(false);

  // State for editing mode
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingTodoIndex, setEditingTodoIndex] = useState(null);

  // Character count validation
  const titleCharCount = countCharacters(taskData.title || '');
  const descriptionCharCount = countCharacters(taskData.description || '');
  const isTitleOverLimit = titleCharCount > TITLE_LIMIT;
  const isDescriptionOverLimit = descriptionCharCount > DESCRIPTION_LIMIT;

  // Check if any todo item exceeds limit
  const isAnyTodoOverLimit = todoItems.some(
    (item) => countCharacters(item) > TODO_ITEM_LIMIT
  );

  // Check if save should be disabled
  const isSaveDisabled =
    isTitleOverLimit || isDescriptionOverLimit || isAnyTodoOverLimit;

  // Update local state when loader data changes
  useEffect(() => {
    if (task) {
      setTaskData(task);
      setTodoItems(task.todoList || []);
    }
  }, [task]);

  // Function to update Redux store with new todo list
  const updateReduxTodoList = (updatedTodoList) => {
    if (taskId) {
      dispatch(
        userActions.updateTaskTodoList({
          taskId,
          todoList: updatedTodoList,
        })
      );
    }
  };

  const handleSave = async () => {
    if (!taskId || !userId) {
      dispatch(
        commonActions.openSnackbar({
          message: 'Cannot save: Missing task or user information',
        })
      );
      return;
    }

    // Check character limits before saving
    if (isSaveDisabled) {
      dispatch(
        commonActions.openSnackbar({
          message:
            'Cannot save: Character limits exceeded. Please fix before saving.',
        })
      );
      return;
    }

    setSaving(true);

    try {
      // Prepare task data for saving
      const taskToSave = {
        title: taskData.title,
        description: taskData.description,
        todoList: todoItems,
        id: taskId, // Include the task ID for the backend
      };

      // Call the API to save the task
      const response = await apiHelper.saveUserTask(userId, taskId, taskToSave);

      // Update local task data with the response (includes updated timestamp)
      if (response.task) {
        setTaskData(response.task);
      }

      // Show success message
      dispatch(
        commonActions.openSnackbar({
          message: response.message || 'Task saved successfully',
        })
      );

      // Invalidate TanStack Query to trigger refetch on UserTasks page
      queryClient.invalidateQueries({ queryKey: ['userTasks', userId] });
    } catch (error) {
      console.error('Error saving task:', error);

      // Show error message but keep changes in Redux
      dispatch(
        commonActions.openSnackbar({
          message:
            error.response?.data?.detail ||
            'Error saving task. Please try again.',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddTodo = () => {
    if (newTodo.trim() && countCharacters(newTodo) <= TODO_ITEM_LIMIT) {
      const updatedTodos = [...todoItems, newTodo.trim()];
      setTodoItems(updatedTodos);
      setNewTodo('');
      setIsAddingNewTodo(false);
      // Update Redux store
      updateReduxTodoList(updatedTodos);
    }
  };

  const handleDeleteTodo = (index) => {
    const updatedTodos = todoItems.filter((_, i) => i !== index);
    setTodoItems(updatedTodos);
    // Update Redux store
    updateReduxTodoList(updatedTodos);
  };

  // Handle title editing
  const handleTitleEdit = (newTitle) => {
    if (
      newTitle.trim() &&
      newTitle !== taskData.title &&
      countCharacters(newTitle) <= TITLE_LIMIT
    ) {
      const updatedTaskData = { ...taskData, title: newTitle.trim() };
      setTaskData(updatedTaskData);

      // Update Redux store
      if (taskId) {
        dispatch(
          userActions.updateTaskTitle({
            taskId,
            title: newTitle.trim(),
          })
        );
      }
    }
    setEditingTitle(false);
  };

  // Handle description editing
  const handleDescriptionEdit = (newDescription) => {
    if (
      newDescription !== taskData.description &&
      countCharacters(newDescription) <= DESCRIPTION_LIMIT
    ) {
      const updatedTaskData = { ...taskData, description: newDescription };
      setTaskData(updatedTaskData);

      // Update Redux store
      if (taskId) {
        dispatch(
          userActions.updateTaskDescription({
            taskId,
            description: newDescription,
          })
        );
      }
    }
    setEditingDescription(false);
  };

  // Handle todo item editing
  const handleTodoEdit = (index, newText) => {
    if (
      newText.trim() &&
      newText !== todoItems[index] &&
      countCharacters(newText) <= TODO_ITEM_LIMIT
    ) {
      const updatedTodos = [...todoItems];
      updatedTodos[index] = newText.trim();
      setTodoItems(updatedTodos);

      // Update Redux store
      updateReduxTodoList(updatedTodos);
    }
    setEditingTodoIndex(null);
  };

  const handleDeleteTask = () => {
    if (taskId) {
      dispatch(
        commonActions.openDeleteConfirm({
          taskId: taskId,
          userId: userId,
          title: taskData.title || 'this task',
        })
      );
    }
  };

  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';

    // Ensure the date string is treated as UTC
    // If it doesn't end with 'Z', add it
    let utcDateString = dateString;
    if (!utcDateString.endsWith('Z') && !utcDateString.includes('+')) {
      utcDateString = utcDateString + 'Z';
    }

    try {
      const date = new Date(utcDateString);
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium',
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  };

  if (error && !task) {
    return (
      <div className="bg-[#bec1c3] h-full w-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-4">{error}</div>
          <Link
            to={`/users/${userId}/tasks`}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-[#bec1c3] h-full w-full flex items-center justify-center">
        <div className="text-center">Loading task...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#bec1c3] h-full w-full flex flex-col items-center overflow-x-hidden overflow-visible">
      {/* Loading overlay for task deletion */}
      {isDeletingTask && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 bg-white/90 rounded-lg shadow-xl">
            <CircularProgress size={60} />
            <p className="text-xl font-semibold text-gray-800">
              Task deleted! Redirecting...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full h-16 flex flex-col items-center justify-start mb-4">
        <div className="w-full flex flex-row justify-between items-center">
          <h1 className="text-3xl font-bold text-[#7b5063da] ml-5 pt-4">
            {taskData.title || 'Task Details'}
          </h1>
          <div className="lg:flex gap-4 items-center mr-6 mt-4 hidden">
            <Link to="/logout" className="text-red-600 hover:underline">
              Logout
            </Link>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="w-full flex flex-row justify-between items-center mx-6 mt-4 lg:mt-0">
        <div className="text-indigo-600 hover:underline gap-2 ml-4">
          <Link to={`/users/${userId}/tasks`}>← Back to Tasks</Link>
        </div>
        <div className="gap-2 mr-6 lg:hidden">
          <Link to="/logout" className="text-red-600 hover:underline">
            Logout
          </Link>
        </div>
      </div>

      {/* Task Details */}
      <div className="w-11/12 max-w-4xl bg-yellow-300/60 backdrop-blur-sm rounded-lg shadow-md p-6 m-5">
        {/* Title */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-[#7b5063da]">Title</h2>
            {editingTitle && (
              <div
                className={`text-sm ${isTitleOverLimit ? 'text-red-600' : 'text-gray-600'}`}
              >
                {titleCharCount}/{TITLE_LIMIT} characters
                {isTitleOverLimit && ' (Limit exceeded)'}
              </div>
            )}
          </div>
          {editingTitle ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={taskData.title || ''}
                onChange={(e) =>
                  setTaskData({ ...taskData, title: e.target.value })
                }
                onKeyPress={(e) =>
                  e.key === 'Enter' &&
                  !isTitleOverLimit &&
                  handleTitleEdit(e.target.value)
                }
                onBlur={() =>
                  !isTitleOverLimit && handleTitleEdit(taskData.title)
                }
                className={`flex-1 p-2 border rounded text-gray-800 text-lg ${isTitleOverLimit ? 'border-red-500' : ''}`}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() =>
                    !isTitleOverLimit && handleTitleEdit(taskData.title)
                  }
                  className={`px-3 py-2 rounded hover:cursor-pointer ${isTitleOverLimit ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                  disabled={isTitleOverLimit}
                >
                  Done
                </button>
                <button
                  onClick={() => setEditingTitle(false)}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 hover:cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-gray-800 text-lg hover:bg-white/50 p-2 rounded hover:cursor-pointer"
              onClick={() => setEditingTitle(true)}
            >
              {taskData.title || 'Click to add title'}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-[#7b5063da]">Description</h2>
            {editingDescription && (
              <div
                className={`text-sm ${isDescriptionOverLimit ? 'text-red-600' : 'text-gray-600'}`}
              >
                {descriptionCharCount}/{DESCRIPTION_LIMIT} characters
                {isDescriptionOverLimit && ' (Limit exceeded)'}
              </div>
            )}
          </div>
          {editingDescription ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={taskData.description || ''}
                onChange={(e) =>
                  setTaskData({ ...taskData, description: e.target.value })
                }
                onKeyPress={(e) => {
                  if (
                    e.key === 'Enter' &&
                    e.ctrlKey &&
                    !isDescriptionOverLimit
                  ) {
                    handleDescriptionEdit(e.target.value);
                  }
                }}
                onBlur={() =>
                  !isDescriptionOverLimit &&
                  handleDescriptionEdit(taskData.description)
                }
                className={`flex-1 p-2 border rounded text-gray-800 text-lg h-24 ${isDescriptionOverLimit ? 'border-red-500' : ''}`}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() =>
                    !isDescriptionOverLimit &&
                    handleDescriptionEdit(taskData.description)
                  }
                  className={`px-3 py-2 rounded hover:cursor-pointer ${isDescriptionOverLimit ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                  disabled={isDescriptionOverLimit}
                >
                  Done (Ctrl+Enter)
                </button>
                <button
                  onClick={() => setEditingDescription(false)}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 hover:cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-gray-800 text-lg whitespace-pre-wrap hover:bg-white/50 p-2 rounded hover:cursor-pointer min-h-12"
              onClick={() => setEditingDescription(true)}
            >
              {taskData.description || 'Click to add description'}
            </div>
          )}
        </div>

        {/* Todo List */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#7b5063da]">Todo List</h2>
            {todoItems.length != 0 && (
              <button
                onClick={() => {
                  setIsAddingNewTodo(true);
                  setNewTodo('');
                }}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 hover:cursor-pointer"
              >
                <AddIcon /> Add Todo
              </button>
            )}
          </div>

          {todoItems.length > 0 ? (
            <div className="space-y-3">
              {todoItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/50 rounded p-3 
                  hover:bg-white/70 hover:cursor-pointer "
                >
                  {editingTodoIndex === index ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updatedTodos = [...todoItems];
                            updatedTodos[index] = e.target.value;
                            setTodoItems(updatedTodos);
                          }}
                          onKeyPress={(e) =>
                            e.key === 'Enter' &&
                            countCharacters(e.target.value) <=
                              TODO_ITEM_LIMIT &&
                            handleTodoEdit(index, e.target.value)
                          }
                          className={`flex-1 p-2 border rounded text-gray-800 ${countCharacters(item) > TODO_ITEM_LIMIT ? 'border-red-500' : ''}`}
                          autoFocus
                        />
                      </div>
                      <div className="flex flex-row">
                        <button
                          onClick={() =>
                            countCharacters(item) <= TODO_ITEM_LIMIT &&
                            handleTodoEdit(index, item)
                          }
                          className={`mx-1 px-3 py-1 rounded hover:cursor-pointer ${countCharacters(item) > TODO_ITEM_LIMIT ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                          disabled={countCharacters(item) > TODO_ITEM_LIMIT}
                        >
                          Done
                        </button>
                        <button
                          onClick={() => setEditingTodoIndex(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 hover:cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <div
                        className={`text-xs ${countCharacters(item) > TODO_ITEM_LIMIT ? 'text-red-600' : 'text-gray-600'}`}
                      >
                        {countCharacters(item)}/{TODO_ITEM_LIMIT} characters
                        {countCharacters(item) > TODO_ITEM_LIMIT &&
                          ' (Limit exceeded)'}
                      </div>
                    </div>
                  ) : (
                    <>
                      <span
                        className="text-gray-800 flex-1 hover:cursor-pointer"
                        onClick={() => setEditingTodoIndex(index)}
                      >
                        {item}
                      </span>
                      <button
                        onClick={() => handleDeleteTodo(index)}
                        className="text-red-600 hover:text-red-800 hover:cursor-pointer ml-2"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : newTodo === '' && !isAddingNewTodo ? (
            <div className="text-center py-6 bg-white/30 rounded">
              <p className="text-gray-600 mb-4">No todo items yet</p>
              <button
                onClick={() => {
                  setIsAddingNewTodo(true);
                  setNewTodo('');
                }}
                className="flex items-center gap-2 mx-auto text-indigo-600 hover:text-indigo-800 hover:cursor-pointer"
              >
                <AddIcon /> Add your first todo item
              </button>
            </div>
          ) : null}

          {/* Add Todo Input */}
          {isAddingNewTodo && (
            <div className="mt-4">
              <div className="flex gap-2 mb-1 flex-col lg:flex-row items-start lg:items-center">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' &&
                    countCharacters(newTodo) <= TODO_ITEM_LIMIT &&
                    handleAddTodo()
                  }
                  className={`w-full flex-1 p-2 border rounded ${countCharacters(newTodo) > TODO_ITEM_LIMIT ? 'border-red-500' : ''}`}
                  placeholder="Enter todo item..."
                  autoFocus
                />
                <div>
                  <button
                    onClick={handleAddTodo}
                    className={`px-4 py-2 mx-1 rounded hover:cursor-pointer ${countCharacters(newTodo) > TODO_ITEM_LIMIT ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    disabled={countCharacters(newTodo) > TODO_ITEM_LIMIT}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNewTodo(false);
                      setNewTodo('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 hover:cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div
                className={`text-xs ${countCharacters(newTodo) > TODO_ITEM_LIMIT ? 'text-red-600' : 'text-gray-600'}`}
              >
                {countCharacters(newTodo)}/{TODO_ITEM_LIMIT} characters
                {countCharacters(newTodo) > TODO_ITEM_LIMIT &&
                  ' (Limit exceeded)'}
              </div>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Created Date */}
          {taskData.created_at && (
            <div>
              <h2 className="text-2xl font-bold text-[#7b5063da] mb-2">
                Created
              </h2>
              <div className="text-gray-600">
                {formatDateForDisplay(taskData.created_at)}
              </div>
            </div>
          )}

          {/* Last Modified Date */}
          {taskData.modified_at && (
            <div>
              <h2 className="text-2xl font-bold text-[#7b5063da] mb-2">
                Last Modified
              </h2>
              <div className="text-gray-600">
                {formatDateForDisplay(taskData.modified_at)}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row justify-end items-center gap-4 pt-6 border-t">
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteTask}
          >
            Delete Task
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={
              saving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            onClick={handleSave}
            disabled={saving || isSaveDisabled}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
