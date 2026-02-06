// components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../shared/contexts/UserContext.js';


const PrivateRoute = ({ children }) => {
  const { user } = useUser();

  // If no ID, block access and redirect to SignIn
  return user?.id ? children : <Navigate to="/signin" replace />;
};

export default PrivateRoute;
