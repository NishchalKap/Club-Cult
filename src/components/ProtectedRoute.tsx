import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "club_admin" | "student" | "super_admin";
}

// Role hierarchy: super_admin > club_admin > student
const ROLE_HIERARCHY: Record<string, number> = {
  student: 1,
  club_admin: 2,
  super_admin: 3,
};

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, userRole, clubId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checkComplete, setCheckComplete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Wait for auth to complete loading
    if (loading) return;

    // Not logged in
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      navigate("/auth", { state: { from: location }, replace: true });
      return;
    }

    const checkAccess = async () => {
      // If no role required, just let them in (authenticated only)
      if (!requiredRole) {
        setIsAuthorized(true);
        setCheckComplete(true);
        return;
      }

      try {
        // Fetch fresh role data to ensure we have the latest
        const { data: profile, error } = await supabase
          .from("user_roles")
          .select("role, club_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Profile fetch error:", error);
          toast({
            title: "Access Error",
            description: "Failed to verify your permissions. Please try again.",
            variant: "destructive",
          });
          navigate("/", { replace: true });
          setCheckComplete(true);
          return;
        }

        // No profile found
        if (!profile) {
          toast({
            title: "Profile Not Found",
            description: "Your account profile was not found. Please contact support.",
            variant: "destructive",
          });
          navigate("/", { replace: true });
          setCheckComplete(true);
          return;
        }

        const userRoleLevel = ROLE_HIERARCHY[profile.role] || 0;
        const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0;

        // Check if user's role level meets or exceeds required level
        if (userRoleLevel < requiredRoleLevel) {
          toast({
            title: "Access Denied",
            description: requiredRole === "super_admin"
              ? "Super admin privileges required."
              : "Admin privileges required to access this page.",
            variant: "destructive",
          });
          navigate("/", { replace: true });
          setCheckComplete(true);
          return;
        }

        // For club_admin, ensure they have a club_id assigned
        if (profile.role === "club_admin" && !profile.club_id) {
          toast({
            title: "Club Not Assigned",
            description: "You must be assigned to a club before you can access admin features. Please contact the super admin.",
            variant: "destructive",
          });
          navigate("/", { replace: true });
          setCheckComplete(true);
          return;
        }

        // All checks passed
        setIsAuthorized(true);
        setCheckComplete(true);
      } catch (err) {
        console.error("Error in role check:", err);
        toast({
          title: "Authorization Error",
          description: "An error occurred while checking permissions.",
          variant: "destructive",
        });
        setIsAuthorized(false);
        setCheckComplete(true);
        navigate("/", { replace: true });
      }
    };

    checkAccess();
  }, [user, loading, requiredRole, navigate, location, toast]);

  // Show loading state while checking auth
  if (loading || !checkComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Render children only if authorized
  return isAuthorized ? <>{children}</> : null;
}
