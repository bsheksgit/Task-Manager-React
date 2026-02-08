import { Link } from "react-router-dom";

export default function Welcome() {
    return (
        <div className="bg-yellow-400 
        min-h-screen 
        flex 
        flex-col
        items-center 
        justify-center">
            <h1 className="text-3xl font-bold text-white">Welcome to AB Task Manager</h1>
            <button className="mt-4 
            px-4
            py-2 
            bg-indigo-400 
            text-white
            ease-in-out duration-200
            rounded hover:bg-blue-600
            hover:-translate-y-1 hover:scale-105 hover:bg-indigo-500">
                <Link to="/login">Login</Link>
            </button>
        </div>
    )
}