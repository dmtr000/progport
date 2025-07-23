import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface TeacherRouteProps {
  children: React.ReactElement;
}

const TeacherRoute: React.FC<TeacherRouteProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

export default TeacherRoute; 