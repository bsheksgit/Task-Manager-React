import {useEffect, useState} from 'react';
import { useLoaderData } from 'react-router-dom';
import { apiHelper } from '../services/axiosHelper';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import { userActions } from '../store/userSlice';
import { commonActions } from '../store/commonSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

export default function UserTasks() {

    const dispatch = useDispatch();
    const userTasks = useSelector((state) => state.user.userTasks);
    // Prefer stored user info in localStorage for display
    let storedFirstName = 'New User';
    try {
        const raw = localStorage.getItem('user');
        if (raw) {
            const u = JSON.parse(raw);
            if (u && u.firstName) storedFirstName = u.firstName;
        } else {
            const fname = localStorage.getItem('firstName') || localStorage.getItem('userFirstName');
            if (fname) storedFirstName = fname;
        }
    } catch (e) {
        // ignore parse errors, fall back to default
    }

    const loaderData = useLoaderData();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

    return (
        <div className='bg-[#bec1c3] h-full w-full flex flex-col items-center justify-start overflow-x-hidden overflow-visible'>
            <div className="w-full h-16 flex flex-col items-center justify-start mb-10">
            <h1 className="text-4xl font-bold text-[#7b5063da] w-full ml-5 pt-4">
                {`Welcome ${storedFirstName}!`}</h1>
            <div className="w-full flex flex-row justify-between items-center">
            <p className="text-gray-700 text-xl flex-1 mt-4 ml-4">
                Manage your tasks efficiently and stay organized.</p>
            <div className="flex gap-4 items-center mr-6 mt-4">
                <Link to="/subscribe" className="text-indigo-600 hover:underline">Subscribe</Link>
                <Link to="/profile" className="text-indigo-600 hover:underline">Manage Profile</Link>
                <Link to="/logout" className="text-red-600 hover:underline">Logout</Link>
            </div>
            </div>
            </div>

            {loading ? (
                <div className="w-11/12 col-span-full text-center py-10">Loading tasks…</div>
            ) : error ? (
                <div className="w-11/12 col-span-full text-center py-10">
                    <div className="text-red-600 mb-4">{error}</div>
                    <button onClick={handleRetry} className="px-4 py-2 bg-indigo-600 text-white rounded">Retry</button>
                </div>
            ) : userTasks.tasks.length === 0 ? (
                <div className="w-full flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-gray-700 text-3xl mb-6">No tasks yet. Add your first task to get started!</div>
                        <button onClick={handleAddTask} className="cursor-pointer rounded-full bg-amber-600 p-4 text-black shadow-lg hover:scale-105 transform transition">
                            <span className="material-symbols-outlined rounded-full w-8 p-1 text-4xl">add_2</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-11/12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 px-4 items-stretch auto-rows-[minmax(150px,auto)]">
                    {userTasks.tasks.map((task) => (
                        <div key={task._id} className="bg-yellow-300/60 backdrop-blur-sm rounded-lg shadow-md p-4 w-full flex flex-col justify-between h-full">
                            <h2 className="text-2xl font-bold text-[#7b5063da]">{task.title}</h2>
                            <p className="text-gray-700 my-5">{task.description}</p>
                            <div className="flex flex-row justify-end items-center gap-4">
                                <Button variant="contained" color="primary">Edit</Button>
                                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => dispatch(commonActions.openDeleteConfirm({ taskId: task._id, title: task.title }))}> Delete </Button>
                            </div>
                        </div>
                    ))}
                    
                    <button className="rounded-full w-full h-full pt-2 flex flex-row items-center justify-center">
                        <span className="material-symbols-outlined 
                        text-black bg-amber-600 rounded-full w-10 p-2 h-10
                        text-5xl cursor-pointer
                        hover:-translate-y-1 hover:scale-105 hover:cursor-pointer transition transform"
                        onClick={handleAddTask}>
                        add_2
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
