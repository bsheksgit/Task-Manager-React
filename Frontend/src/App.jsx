import { useState } from 'react'
import './App.css'
import router from './routes'
import { RouterProvider } from 'react-router-dom'
import LoginModal from './components/LoginModal.jsx';
import { useSelector } from 'react-redux';


function App() {

  const isOpen = useSelector(state => state.loginModal.loginModal.isOpen);

  return (
    <>
    <RouterProvider router={router} />
    {isOpen && <LoginModal />}
    </>
  )
}

export default App;
