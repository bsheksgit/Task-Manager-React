import {useState} from 'react';

export default function UserTasks() {

    const [tasks, setTasks] = useState([]);

    return (
        <div className='bg-[#bec1c3] min-h-screen min-w-screen'>
            <h1 className="text-4xl font-bold text-[#7b5063da] w-full text-center">
                Welcome Abhishek!</h1>
            <p className="text-gray-700 text-xl w-full text-center mt-4">
                Manage your tasks efficiently and stay organized.</p>
        </div>
    );
}