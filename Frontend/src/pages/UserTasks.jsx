import { useEffect, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import { apiHelper } from '../services/axiosHelper';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { userActions } from '../store/userSlice';
import { commonActions } from '../store/commonSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

export default function UserTasks() {
  const dispatch = useDispatch();
  const userTasks = useSelector((state) => state.user.userTasks);
  const userDetails = useSelector((state) => state.user.userDetails);
  const authUser = useSelector((state) => state.loginModal?.auth?.user);
  const navigate = useNavigate();
  // Use auth.user as primary source, fallback to userDetails
  const storedFirstName =
    authUser?.firstName ||
    userDetails.firstName ||
    JSON.parse(localStorage.getItem('user'))?.firstName ||
    'User';

  const loaderData = useLoaderData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingTaskId, setLoadingTaskId] = useState(null); // Track which task is loading
  const userId = loaderData?.userId;

  // Loader UseEffect — sets initial tasks from route loader
  useEffect(() => {
    async function applyLoader() {
      setLoading(true);
      setError(loaderData?.error ?? null);
      if (loaderData && loaderData.tasks) {
        dispatch(userActions.setUserTasks({ tasks: loaderData.tasks }));
      }
      setLoading(false);
    }
    applyLoader();
  }, [loaderData, dispatch]);

  // TanStack Query — does NOT fetch on mount (staleTime: Infinity).
  // Only re-fetches when `invalidateQueries(['userTasks'])` is called
  // (i.e. after a task is created or deleted).
  const { data: freshTaskData } = useQuery({
    queryKey: ['userTasks', userId],
    queryFn: () => apiHelper.getUserTasks(userId),
    enabled: !!userId,
    staleTime: Infinity,
  });

  // When the query refetches (after a mutation), sync fresh server data to Redux
  useEffect(() => {
    if (freshTaskData?.tasks) {
      dispatch(userActions.setUserTasks({ tasks: freshTaskData.tasks }));
    }
  }, [freshTaskData, dispatch]);

  const handleRetry = async () => {
    const userId = loaderData?.userId;
    if (!userId) {
      setError('Missing user id');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await apiHelper.getUserTasks(userId);
      dispatch(userActions.setUserTasks({ tasks: data.tasks || [] }));
    } catch (e) {
      setError(e?.message || 'Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  function handleAddTask() {
    dispatch(commonActions.openNewTaskModal());
  }

  const handleTaskClick = (taskId) => {
    // Set loading state for this specific task
    setLoadingTaskId(taskId);

    // Navigate to the task detail page
    navigate(`/users/${userId}/tasks/${taskId}`);

    // Note: The loading state will be cleared when the component unmounts
    // or when the user navigates back. We could also add a timeout to clear
    // the loading state after a few seconds in case navigation fails.
  };

  return (
    <div className="bg-[#bec1c3] h-full w-full flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto px-2 sm:px-0">
      <div className="w-full h-auto flex flex-col items-center justify-start mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#7b5063da] w-full ml-2 md:ml-5 pt-2 md:pt-4">
          {`Welcome ${storedFirstName}!`}
        </h1>
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mt-2">
          <p className="text-gray-700 text-sm md:text-xl mt-0 md:mt-4 ml-0 md:ml-4 flex-1">
            Manage your tasks efficiently and stay organized.
          </p>
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center mt-0 md:mt-4 mr-0 md:mr-6 w-full md:w-auto">
            <button
              onClick={() => dispatch(commonActions.openSubscribeModal())}
              className="text-indigo-600 hover:underline bg-transparent border-none cursor-pointer p-0 text-left md:text-center"
            >
              Subscribe
            </button>
            <Link
              to={`/users/${userId}/profile`}
              className="text-indigo-600 hover:underline text-left md:text-center"
            >
              Manage Profile
            </Link>
            <Link
              to="/logout"
              className="text-red-600 hover:underline text-left md:text-center"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="w-full px-4 text-center py-8 sm:py-10 flex flex-col items-center justify-center gap-4">
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary">
            Loading your tasks...
          </Typography>
        </div>
      ) : error ? (
        <div className="w-full px-4 text-center py-8 sm:py-10">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={handleRetry}
            className="px-6 py-3 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded text-base sm:text-sm min-h-[44px]"
          >
            Retry
          </button>
        </div>
      ) : userTasks.tasks.length === 0 ? (
        <div className="w-full flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-gray-700 text-xl sm:text-2xl md:text-3xl mb-4 md:mb-6">
              No tasks yet. Add your first task to get started!
            </div>
            <button
              onClick={handleAddTask}
              className="cursor-pointer rounded-full bg-amber-600 p-4 text-black shadow-lg hover:scale-105 transform transition min-h-[60px] min-w-[60px]"
            >
              <span className="material-symbols-outlined rounded-full w-8 p-1 text-3xl sm:text-4xl">
                add_2
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-11/12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-10 px-2 sm:px-4 items-stretch auto-rows-[minmax(140px,auto)]">
          {userTasks.tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-yellow-300/60 backdrop-blur-sm rounded-lg shadow-md p-4 w-full flex flex-col justify-between h-full cursor-pointer hover:shadow-lg transition-shadow ${
                loadingTaskId === task.id ? 'opacity-70' : ''
              }`}
              onClick={() => handleTaskClick(task.id)}
            >
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-[#7b5063da]">
                  {task.title}
                </h2>
                <p className="text-gray-700 my-3 sm:my-5 text-sm sm:text-base">
                  {task.description}
                </p>
              </div>
              {loadingTaskId === task.id ? (
                <div className="flex flex-row justify-center items-center gap-4 py-2">
                  <CircularProgress size={24} />
                  <span className="text-gray-600">Loading task...</span>
                </div>
              ) : (
                <div
                  className="flex flex-row justify-end items-center gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() =>
                      dispatch(
                        commonActions.openDeleteConfirm({
                          taskId: task.id,
                          title: task.title,
                        })
                      )
                    }
                    size="small"
                    sx={{
                      '@media (max-width: 640px)': {
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        minHeight: '36px',
                        minWidth: '36px',
                      },
                    }}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}

          <button
            className="hidden rounded-full w-full h-full pt-2 lg:flex lg:flex-row lg:items-center lg:justify-center"
            onClick={handleAddTask}
          >
            <span
              className="material-symbols-outlined 
                        text-black bg-amber-600 rounded-full w-10 p-2 h-10
                        text-5xl cursor-pointer
                        hover:-translate-y-1 hover:scale-105 hover:cursor-pointer transition transform"
              onClick={handleAddTask}
            >
              add_2
            </span>
          </button>
        </div>
      )}
      {userTasks.tasks.length > 0 && (
        <button
          className="lg:hidden fixed bottom-4 right-4 rounded-full bg-amber-600 p-2 text-black shadow-lg 
          hover:scale-105 transform transition z-50"
          onClick={handleAddTask}
        >
          <span
            className="material-symbols-outlined 
                        text-black bg-amber-600 rounded-full w-10 p-2 h-10
                        text-5xl cursor-pointer
                        hover:-translate-y-1 hover:scale-105 hover:cursor-pointer transition transform"
            onClick={handleAddTask}
          >
            add_2
          </span>
        </button>
      )}
    </div>
  );
}
