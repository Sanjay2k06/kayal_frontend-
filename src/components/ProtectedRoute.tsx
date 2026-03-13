import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSessionUser, isAuthenticated, isProfileComplete } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireCompleteProfile?: boolean;
}

const ProtectedRoute = ({ children, requireCompleteProfile = true }: ProtectedRouteProps) => {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  if (requireCompleteProfile && !isProfileComplete(getSessionUser())) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

export default ProtectedRoute;
