import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { loginModalActions } from '../store/loginSlice.jsx';
import TextField from "@mui/material/TextField";

export default function LoginModal() {

    const loginRef = useRef(null);
    const dispatch = useDispatch();
    const isOpen = useSelector(state => state.loginModal.loginModal.isOpen);

    function handleClose() {
        dispatch(loginModalActions.closeLoginModal());
    }

    useEffect(() => {
        loginRef.current.close();
        if (loginRef.current && isOpen) {
            loginRef.current.showModal();
        } else if (loginRef.current && !isOpen) {
            loginRef.current.close();
        }
    }, [isOpen]);

    return (
        <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <dialog ref={loginRef} 
        onCancel = {(e) => e.preventDefault()}
        className="bg-green-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-10 w-1/2 flex flex-col items-center justify-center gap-4">
        <div className="absolute top-2 right-2 cursor-pointer" onClick={handleClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Login</h1>

        <form className="flex flex-col justify-center items-center w-full">
            <TextField label="Email" name="email" variant="filled" className="w-1/2 mt-10" required />
            <TextField label="Password" name="password" variant="filled" className="w-1/2 mt-4" required />
            <button type="submit" className="mt-4 px-4 py-2 w-2/3 bg-blue-500 text-white rounded hover:bg-blue-600">Login</button>
        </form>
        </dialog>
        </>
    );
}