import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ProtectedRoute = ({ children }) => {
    const { user, authLoading } = useApp();

    if (authLoading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
