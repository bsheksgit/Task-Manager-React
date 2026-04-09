import { useState } from 'react';
import './App.css';
import router from './routes';
import { RouterProvider } from 'react-router-dom';
import LoginModal from './components/LoginModal.jsx';
import { useSelector, useDispatch } from 'react-redux';
import { commonActions } from './store/commonSlice.jsx';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ErrorModal from './components/ErrorModal.jsx';
import NewTaskModal from './components/NewTaskModal.jsx';
import DeleteConfirmModal from './components/DeleteConfirmModal.jsx';
import SubscribeModal from './components/SubscribeModal.jsx';

function App() {
  const loginModalIsOpen = useSelector(
    (state) => state.loginModal.loginModal.isOpen
  );
  const errorModalIsOpen = useSelector(
    (state) => state.common.errorModal.isOpen
  );
  const newTaskModalIsOpen = useSelector(
    (state) => state.common.newTaskModal.isOpen
  );
  const snackbar = useSelector((state) => state.common.snackbar);
  const dispatch = useDispatch();

  return (
    <>
      <RouterProvider router={router} />
      {loginModalIsOpen && <LoginModal />}
      <Snackbar
        open={snackbar.isOpen}
        autoHideDuration={3000}
        onClose={() => dispatch(commonActions.closeSnackbar())}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ zIndex: 9999 }}
      >
        <Alert
          onClose={() => dispatch(commonActions.closeSnackbar())}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      {errorModalIsOpen && <ErrorModal />}
      {newTaskModalIsOpen && <NewTaskModal />}
      <DeleteConfirmModal />
      <SubscribeModal />
    </>
  );
}

export default App;
