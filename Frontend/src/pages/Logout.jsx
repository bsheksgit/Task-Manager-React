import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginModalActions } from '../store/loginSlice.jsx';
import { commonActions } from '../store/commonSlice.jsx';

export default function Logout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // Dispatch logout action to clear token and user details
    dispatch(loginModalActions.logout());
    
    // Show success message
    dispatch(
      commonActions.openSnackbar({
        message: 'Successfully logged out',
      })
    );

    // Redirect to welcome page after a brief delay
    const timer = setTimeout(() => {
      navigate('/');
    }, 500); // Half second delay to show the message

    return () => clearTimeout(timer);
  }, [dispatch, navigate]);

  return (
    <div className="bg-[#bec1c3] h-full w-full flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="text-2xl text-gray-700 mb-4">Logging out...</div>
        <div className="text-gray-600">You will be redirected to the welcome page shortly.</div>
      </div>
    </div>
  );
}