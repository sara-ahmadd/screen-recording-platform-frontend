import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
};

const isSuperAdmin = (user: any) => String(user?.role || "").toLowerCase() === "superadmin";

export default function ProtectedRoute({ children, requireSuperAdmin = false }: ProtectedRouteProps) {
  const { user, selectedWorkspaceId, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && !isSuperAdmin(user)) return <Navigate to="/dashboard" replace />;

  if (requireSuperAdmin) return <>{children}</>;

  const hasWorkspaces = (user.workspaces?.length || 0) > 0;

  // Super admins can skip workspace onboarding for normal app routes.
  if (!isSuperAdmin(user) && !hasWorkspaces && location.pathname !== "/workspaces") {
    return <Navigate to="/workspaces" replace />;
  }

  if (
    hasWorkspaces &&
    !selectedWorkspaceId &&
    location.pathname !== "/select-workspace"
  ) {
    return <Navigate to="/select-workspace" replace />;
  }

  return <>{children}</>;
}
