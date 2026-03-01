import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { commonActions } from '../store/commonSlice.jsx';

export default function ErrorModal() {

    const errorModalRef = useRef(null);
    const dispatch = useDispatch();
    const isOpen = useSelector(state => state.common.errorModal.isOpen);

    function handleClose() {
        dispatch(commonActions.closeErrorModal());
    }

    useEffect(() => {
        errorModalRef.current.close();
        if (errorModalRef.current && isOpen) {
            errorModalRef.current.showModal();
        } else if (errorModalRef.current && !isOpen) {
            errorModalRef.current.close();
        }
    }, [isOpen]);

    return (
        <>
        <div className={"fixed inset-0 bg-black/50 backdrop-blur-sm"}></div>
        
        <dialog ref={errorModalRef} 
        onCancel = {(e) => e.preventDefault()}
        className="bg-gray-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-10 w-1/2 flex flex-col items-center justify-center gap-4">
        <div className="absolute top-2 right-2 cursor-pointer hover:bg-red-600" onClick={handleClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Error!</h1>

        </dialog>
        </>
    );
}