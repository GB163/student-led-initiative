import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from '../shared/contexts/UserContext';

const RequireRole = ({ role, children }) => {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Make role check flexible
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default RequireRole;
