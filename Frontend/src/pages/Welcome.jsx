import {useState, useEffect, useRef} from "react";
import TextField from "@mui/material/TextField";
import CircularProgress from '@mui/material/CircularProgress';
import { Notebook } from "../icons/Notebook";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { loginModalActions } from '../store/loginSlice.jsx';
import { commonActions } from '../store/commonSlice.jsx';
import { apiHelper } from "../services/axiosHelper.jsx";
import useHTTP from "../hooks/useHTTP.jsx";

export default function Welcome() {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading: isLoading, error, sendRequest } = useHTTP();
    const isAuthenticated = useSelector(state => state.loginModal?.auth?.isAuthenticated);
    const prevAuthRef = useRef(isAuthenticated);

    // useEffect(() => {
    //     const isTokenExpired = (token) => {
    //         try {
    //             const parts = token.split('.');
    //             if (parts.length < 2) return true;
    //             const payload = JSON.parse(atob(parts[1]));
    //             if (!payload.exp) return false;
    //             const now = Math.floor(Date.now() / 1000);
    //             return payload.exp < now;
    //         } catch (e) {
    //             return true;
    //         }
    //     };

    //     const token = (() => {
    //         try { return localStorage.getItem('authToken'); } catch { return null; }
    //     })();

    //     if (!token || isTokenExpired(token)) {
    //         dispatch(loginModalActions.logout());
    //     }
    // }, [dispatch]);

    useEffect(() => {
        dispatch(loginModalActions.logout());
    }, [dispatch]);

    useEffect(() => {
        if (!prevAuthRef.current && isAuthenticated) {
            // user just became authenticated — navigate to protected page
            console.log('auth changed:', prevAuthRef.current, '->', isAuthenticated)
            dispatch(loginModalActions.closeLoginModal());
            navigate('/user-tasks');
        }
        prevAuthRef.current = isAuthenticated;
    }, [isAuthenticated, navigate]);

    function handleLogin() {
        dispatch(loginModalActions.openLoginModal());
    }

    async function handleSignup(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        if (password !== confirmPassword) {
            dispatch(commonActions.openSnackbar({ message: 'Error: Passwords do not match. Please try again.' }));
            return;
        }
        const userData = Object.fromEntries(Array.from(formData.entries()).filter(
        ([key]) => key !== 'confirmPassword' // adjust field name to match your form
        ));

        try {
            console.log("IsLoading before request:", isLoading);
            const response = await sendRequest(apiHelper.registerUser, userData);
            console.log("IsLoading after request:", isLoading);
            console.log('Signup response:', response);
            if (response.error) {
                dispatch(commonActions.openSnackbar({ message: response.error.detail || 'An error occurred during signup. Please try again.' }));
                return;
            }
            dispatch(commonActions.openSnackbar({ message: response.message || 'Signup successful! Please log in.' }));
        } catch (error) {
            console.error('Error during signup:', error);
            dispatch(commonActions.openSnackbar({ message: 'An error occurred during signup. Please try again.' }));
        }
    }

    return (
        <div className="bg-yellow-200 
        min-h-screen 
        p-2
        flex flex-col items-center">
            <div className="flex flex-row justify-between min-h-1/10 w-full">
                <Notebook className="text-6xl text-gray-600" />
                <h1 className="text-4xl font-bold text-gray-800 mt-2">Welcome to your personal Task Manager</h1>
                <button className="mt-2 
                px-2
                py-4 
                max-w-min
                h-fit
                bg-indigo-400 
                text-white
                ease-in-out duration-200
                rounded hover:bg-blue-600
                hover:-translate-y-1 hover:scale-105 hover:bg-indigo-500" 
                onClick={() => handleLogin()}>
                    Login
                </button>
            </div>

            <div className={`flex flex-col justify-center items-center m-10
            outline-1 outline-gray-500 outline-solid rounded-lg p-8
            bg-amber-300 max-w-2/3 justify-self-center ${isLoading ? 'blur-xs' : ''}`}>
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
                </form>
            </div>
            {isLoading && <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50"><CircularProgress color="inherit" /></div>}
        </div>
    )
}