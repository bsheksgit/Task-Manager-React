import {useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';

export default function UserTasks() {

    const [tasks, setTasks] = useState([]);

    useEffect(() => {
    setTasks([
        { id: 1, title: 'Complete project report', description: 'Finish the final report for the project by Friday.' },
        { id: 2, title: 'Team meeting', description: 'Attend the weekly team meeting on Wednesday at 10 AM.' },
        { id: 3, title: 'Code review', description: 'Review code submissions from team members by Thursday.' },
    ]);}, []);

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

            <div className="w-11/12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 px-4">
                {tasks.map((task) => (
                    <div key={task.id} className="bg-yellow-300 rounded-lg shadow-md p-4 w-full flex-col justify-start">
                        <h2 className="text-2xl font-bold text-[#7b5063da]">{task.title}</h2>
                        <p className="text-gray-700">{task.description}</p>
                        <div className="flex flex-row justify-end items-end gap-4 mt-2 w-full h-full">
                            <button className="text-green-600 hover:underline mr-4">Edit</button>
                            <button className="text-red-600 hover:underline">Delete</button>
                        </div>
                    </div>
                ))}
                <button className="rounded-full w-full h-full pt-2 flex flex-row items-center justify-center mt-5">
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