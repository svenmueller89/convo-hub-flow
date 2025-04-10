
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, checkAndRedirectToSetup } = useAuth();
  const location = useLocation();
  const [isCheckingSetup, setIsCheckingSetup] = useState(false);

  useEffect(() => {
    if (user && location.pathname !== '/setup') {
      setIsCheckingSetup(true);
      checkAndRedirectToSetup().finally(() => {
        setIsCheckingSetup(false);
      });
    }
  }, [user, location.pathname]);

  if (loading || isCheckingSetup) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
