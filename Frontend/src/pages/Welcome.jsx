import {useState} from "react";
import TextField from "@mui/material/TextField";
import { Notebook } from "../icons/Notebook";
import { useDispatch } from "react-redux";
import { loginModalActions } from '../store/loginSlice.jsx';
import { apiHelper } from "../services/axiosHelper.jsx";
import useHTTP from "../hooks/useHTTP.jsx";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function Welcome() {

    const dispatch = useDispatch();
    const { isLoading, error, sendRequest } = useHTTP();
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    function handleLogin(isOpen) {
    dispatch(loginModalActions.openLoginModal(isOpen));
    }

    async function handleSignup(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        if (password !== confirmPassword) {
            setSnackbarMessage('Error: Passwords do not match. Please try again.');
            setSnackbarOpen(true);
            return;
        }
        const userData = Object.fromEntries(Array.from(formData.entries()).filter(
        ([key]) => key !== 'confirmPassword' // adjust field name to match your form
        ));

        try {
            const response = await sendRequest(apiHelper.registerUser, userData);
            console.log('Signup response:', response);
            if (response.error) {
                setSnackbarMessage(response.error.detail || 'An error occurred during signup. Please try again.');
                setSnackbarOpen(true);
                return;
            }
            setSnackbarMessage(response.message || 'Signup successful! Please log in.');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error during signup:', error);
            setSnackbarMessage('An error occurred during signup. Please try again.');
            setSnackbarOpen(true);
        }
    }

    return (
        <div className="bg-yellow-200 
        min-h-screen 
        p-2
        flex-col">
            <div className="flex justify-between min-h-1/10">
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
                <form onSubmit={handleSignup} className="flex flex-col justify-center items-center w-full">
                <TextField label="First Name" name="firstName" variant="filled" required className="min-w-1/2 mt-10" />
                <TextField label="Last Name" name="lastName" variant="filled" className="min-w-1/2 mt-4" />
                <TextField label="Email" name="email" variant="filled" required className="min-w-1/2 mt-4" />
                <TextField label="Create Password" name="password" variant="filled" type="password" required className="min-w-1/2 mt-4" />
                <TextField label="Re-Enter Password" name="confirmPassword" variant="filled" type="password" required className="min-w-1/2 mt-4" />
                <button className={`mt-4 
                px-4
                py-2 
                max-w-min
                ${isLoading ? 'bg-gray-200' : 'bg-indigo-400'} 
                text-white
                ease-in-out duration-200
                rounded hover:bg-blue-600
                ${isLoading ? '' : 'hover:-translate-y-1 hover:scale-105 hover:bg-indigo-500'}`}
                disabled={isLoading} type="submit">
                    Signup
                </button>
                <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarMessage.toLowerCase().includes('error') ? 'error' : 'success'}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
                </Snackbar>
                </form>
            </div>
        </div>
    )
}