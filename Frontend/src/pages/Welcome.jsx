import { Link } from "react-router-dom";
import TextField from "@mui/material/TextField";
import { Notebook } from "../icons/Notebook";
import { useDispatch } from "react-redux";
import { loginModalActions } from '../store/loginSlice.jsx';


export default function Welcome() {

    const dispatch = useDispatch();

    function handleLogin(isOpen) {
    dispatch(loginModalActions.openLoginModal(isOpen));
    }

    return (
        <div className="bg-yellow-200 
        min-h-screen 
        p-2
        flex-col">
            <div className="flex justify-between min-h-1/10">
                {/* <ListIcon className="text-6xl text-gray-600" /> */}
                <Notebook className="text-6xl text-gray-600" />
                <h1 className="text-4xl font-bold text-gray-800 mt-2">Welcome to your personal Task Manager</h1>
                <button className="mt-2 
                px-2
                py-4 
                max-w-min
                max-h-min
                bg-indigo-400 
                text-white
                ease-in-out duration-200
                rounded hover:bg-blue-600
                hover:-translate-y-1 hover:scale-105 hover:bg-indigo-500" 
                onClick={() => handleLogin(true)}>
                    Login
                </button>
            </div>

            <div className="flex flex-col justify-center items-center m-10
            outline-1 outline-gray-500 outline-solid rounded-lg p-8
            bg-amber-300 max-w-2/3 justify-self-center">
                <h2 className="text-2xl font-bold text-gray-700">Organize your tasks, boost your productivity, and achieve your goals with ease.</h2>
                <h2 className="text-2xl font-bold mt-5 text-gray-700">Sign up now to get started!</h2>
                <form className="flex flex-col justify-center items-center w-full">
                <TextField label="First Name" variant="filled" required className="min-w-1/2 mt-10" />
                <TextField label="Last Name" variant="filled" className="min-w-1/2 mt-4" />
                <TextField label="Email" variant="filled" required className="min-w-1/2 mt-4" />
                <TextField label="Create Password" variant="filled" required className="min-w-1/2 mt-4" />
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