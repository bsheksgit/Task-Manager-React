import { Link } from "react-router-dom";
import ListIcon from '@mui/icons-material/List';
import TextField from "@mui/material/TextField";

export default function Welcome() {
    return (
        <div className="bg-yellow-400 
        min-h-screen 
        p-2">
            <div className="flex justify-between">
                <ListIcon className="text-6xl text-white" />
                <h1 className="text-4xl font-bold text-white">Welcome to your personal Task Manager</h1>
                <button className="mt-2 
                px-2
                py-4 
                max-w-min
                max-h-min
                bg-indigo-400 
                text-white
                ease-in-out duration-200
                rounded hover:bg-blue-600
                hover:-translate-y-1 hover:scale-105 hover:bg-indigo-500">
                    <Link to="/login">Login</Link>
                </button>
            </div>

            <div className="flex flex-col justify-center items-center m-10
            outline-1 outline-gray-500 outline-dashed rounded-lg p-10
            bg-amber-400">
                <h2 className="text-2xl font-bold text-gray-700">Organize your tasks, boost your productivity, and achieve your goals with ease.</h2>
                <form className="flex flex-col justify-center items-center">
                <TextField label="First Name" variant="outlined" required className="min-w-8 mt-4" />
                <TextField label="Last Name" variant="outlined" className="mt-4" />
                <TextField label="Email" variant="outlined" required className="mt-4" />
                <TextField label="Create Password" variant="outlined" required className="mt-4" />
                <button className="mt-4 
                px-4
                py-2 
                max-w-min
                bg-indigo-400 
                text-white
                ease-in-out duration-200
                rounded hover:bg-blue-600
                hover:-translate-y-1 hover:scale-105 hover:bg-indigo-500">
                    <Link to="/signup">Signup</Link>
                </button>
                </form>
            </div>
        </div>
    )
}