import {useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import { userActions } from '../store/userSlice';
import { commonActions } from '../store/commonSlice';
import { useDispatch, useSelector } from 'react-redux';

export default function UserTasks() {

    const dispatch = useDispatch();
    const userTasks = useSelector((state) => state.user.userTasks);

    useEffect(() => {
    const initialTasks = [
        { id: 1, title: 'Complete project report', description: 'Finish the final report for the project by Friday.' },
        { id: 2, title: 'Team meeting', description: 'Attend the weekly team meeting on Wednesday at 10 AM.' },
        { id: 3, title: 'Code review', description: 'Review code submissions from team members by Thursday.' },
    ];
    dispatch(userActions.setUserTasks({ tasks: initialTasks }));
    }, []);

    function handleAddTask() {
        dispatch(commonActions.openNewTaskModal());
    }

    return (
        <div className='bg-[#bec1c3] min-h-screen min-w-screen flex flex-col items-center justify-start overflow-y-auto'>
            <div className="w-full h-16 flex flex-col items-center justify-start mb-10">
            <h1 className="text-4xl font-bold text-[#7b5063da] w-full ml-5 pt-4">
                Welcome Abhishek!</h1>
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

            <div className="w-11/12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 px-4 items-stretch">
                {userTasks.tasks.map((task) => (
                    <div key={task.id} className="bg-yellow-300 rounded-lg shadow-md p-4 w-full flex flex-col justify-between h-full">
                        <h2 className="text-2xl font-bold text-[#7b5063da]">{task.title}</h2>
                        <p className="text-gray-700 my-5">{task.description}</p>
                        <div className="flex flex-row justify-end items-center gap-4">
                            <Button variant="contained" color="primary">Edit</Button>
                            <Button variant="contained" color="error" startIcon={<DeleteIcon />}> Delete </Button>
                        </div>
                    </div>
                ))}
                <button className="rounded-full w-full h-full pt-2 flex flex-row items-center justify-center mt-5" onClick={handleAddTask}>
                        <span className="material-symbols-outlined 
                        text-black bg-amber-600 rounded-full w-10 p-2
                        text-5xl cursor-pointer
                        hover:-translate-y-1 hover:scale-105 hover:cursor-pointer">
                        add_2
                        </span>
                </button>
            </div>
        </div>
    );
}