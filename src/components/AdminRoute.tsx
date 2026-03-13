import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getSessionUser, isAuthenticated } from "@/lib/auth";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  const user = getSessionUser();
  if (!user?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
