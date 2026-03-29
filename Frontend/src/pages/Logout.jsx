import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginModalActions } from '../store/loginSlice.jsx';
import { commonActions } from '../store/commonSlice.jsx';
import CircularProgress from '@mui/material/CircularProgress';

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
      <div className="flex flex-col justify-between items-center text-center">
        <div className="text-5xl text-gray-700 mb-4">Logging out....</div>
        <div className="text-gray-600 text-2xl">
          You will be redirected to the welcome page shortly.
        </div>
        <CircularProgress size={60} color="inherit" className="mt-5" />
      </div>
    </div>
  );
}
