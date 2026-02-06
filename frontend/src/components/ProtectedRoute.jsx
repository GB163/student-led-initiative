// src/components/ProtectedRoute.jsx
import React from "react";
import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from '../shared/contexts/UserContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useUser();  // ✅ ADD loading!
  const location = useLocation();

  // ✅ CRITICAL: Wait for loading to complete!
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Check user from context OR localStorage
  const effectiveUser = React.useMemo(() => {
    if (user) return user;
    
    try {
      const stored = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      return (stored && token) ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }, [user]);

  // No user - redirect to signin
  if (!effectiveUser) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // Check role permissions
  if (allowedRoles.length && !allowedRoles.includes(effectiveUser.role)) {
    const redirectPath = effectiveUser.role === 'admin' ? '/admin' 
      : effectiveUser.role === 'staff' ? '/staff'
      : '/user';
    
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;