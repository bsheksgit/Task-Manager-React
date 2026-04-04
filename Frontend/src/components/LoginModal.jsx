import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginModalActions } from '../store/loginSlice.jsx';
import { userActions } from '../store/userSlice.jsx';
import { commonActions } from '../store/commonSlice.jsx';
import TextField from '@mui/material/TextField';
import { apiHelper } from '../services/axiosHelper.jsx';
import useHTTP from '../hooks/useHTTP.jsx';
import CircularProgress from '@mui/material/CircularProgress';

export default function LoginModal() {
  const loginRef = useRef(null);
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.loginModal.loginModal.isOpen);
  const loginFailed = useSelector(
    (state) => state.loginModal.loginModal.loginFailed
  );
  const { loading: isLoading, error, sendRequest } = useHTTP();

  function handleClose() {
    dispatch(loginModalActions.closeLoginModal());
  }

  async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    try {
      const response = await sendRequest(apiHelper.loginUser, {
        email,
        password,
      });
      console.log('Login response:', response);
      if (response.error) {
        console.error('Login error:', response.error);
        dispatch(
          commonActions.openSnackbar({
            message:
              'Login failed. ' +
              (response.error.detail ||
                'Please check your credentials and try again.'),
          })
        );
        dispatch(
          loginModalActions.loginFailure(
            response.error.detail || 'Login failed'
          )
        );
        return;
      }
      // Handle successful login: save token and optionally user data
      console.log('Login successful:', response);
      if (response.token) {
        // update redux auth state
        dispatch(
          loginModalActions.loginSuccess({
            token: response.token,
            user: {
              user_id: response.user_id,
              firstName: response.firstName,
              email: email,
            },
          })
        );

        // Also update user details in user slice with new field structure
        dispatch(
          userActions.setUserDetails({
            firstName: response.firstName,
            lastName: '', // Backend doesn't return lastName yet
            email: email,
            dateOfBirth: '',
            profession: '',
            bio: '',
            location: '',
            phone: '',
          })
        );
      }
      dispatch(
        commonActions.openSnackbar({
          message: response.message || 'Login successful!',
        })
      );
    } catch (error) {
      console.error('Error during login:', error);
      dispatch(
        commonActions.openSnackbar({
          message: 'Login failed. Please try again.',
        })
      );
      dispatch(loginModalActions.loginFailure(error.message || 'Login failed'));
    }
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
      <div className={'fixed inset-0 bg-black/50 backdrop-blur-sm'}></div>

      <dialog
        ref={loginRef}
        onCancel={(e) => e.preventDefault()}
        className="bg-gray-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-10 w-1/2 flex flex-col items-center justify-center gap-4"
      >
        <div
          className="absolute top-2 right-2 cursor-pointer hover:bg-red-600 rounded-lg"
          onClick={handleClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-800">
          Enter your credentials
        </h1>

        <form
          className={`flex flex-col justify-center items-center w-full ${isLoading ? 'blur-xs' : ''}`}
          onSubmit={handleLogin}
        >
          <TextField
            label="Email"
            name="email"
            variant="filled"
            className="w-1/2 mt-5"
            required
          />
          <TextField
            label="Password"
            name="password"
            variant="filled"
            className="w-1/2 mt-4 mb-5"
            required
            type="password"
          />
          <button
            type="submit"
            className="mt-4 px-4 py-2 w-1/3 bg-blue-500 text-white rounded hover:bg-blue-600 hover:cursor-pointer"
          >
            Login
          </button>
        </form>
        {loginFailed && (
          <p className="text-red-500">Login failed. Please try again.</p>
        )}
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
            <CircularProgress color="inherit" />
          </div>
        )}
      </dialog>
    </>
  );
}
