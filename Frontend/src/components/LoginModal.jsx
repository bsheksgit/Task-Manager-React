import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { loginModalActions } from '../store/loginSlice.jsx';

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
        <dialog ref={loginRef} className="bg-green-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-10 flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold text-gray-800">Login</h1>

        <button className="mt-2
                px-2
                py-4
                bg-indigo-400 
                text-white
                ease-in-out duration-200
                rounded hover:bg-blue-600
                hover:-translate-y-1 hover:scale-105 hover:bg-indigo-500"
        onClick={handleClose}>
        Close
        </button>
        </dialog>
    );
}