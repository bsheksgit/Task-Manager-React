import React from 'react';
import { useSelector, useStore } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

function isTokenExpired(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true;
  }
}

export default function RequireAuth({ children }) {
  const auth = useSelector((state) => state.loginModal?.auth);
  const location = useLocation();

  const token = auth?.token || (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null);
  const isAuthenticated = !!token && !isTokenExpired(token);

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
