import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  clubId: string | null;
  signUp: (email: string, password: string, fullName: string, isClubOwner?: boolean) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.error("Supabase is not properly configured. Check .env file.");
      setLoading(false);
      return;
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch user role when user logs in
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock issues
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setClubId(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error.message);
        toast({
          title: "Authentication Error",
          description: "Failed to restore session. Please try logging in again.",
          variant: "destructive",
        });
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Use maybeSingle() for robustness - won't crash if row missing or duplicates
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, club_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        // Don't throw - just set defaults
        setUserRole("student");
        setClubId(null);
        return;
      }

      if (!data) {
        // No role assigned yet - default to student
        console.log("No user_roles entry found for user, defaulting to student");
        setUserRole("student");
        setClubId(null);
        return;
      }

      setUserRole(data.role || "student");
      setClubId(data.club_id || null);
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
      setUserRole("student");
      setClubId(null);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, isClubOwner: boolean = false) => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured. Check your .env file.");
      }

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            is_club_owner: isClubOwner,
          },
        },
      });

      if (error) throw error;

      // Create user_roles entry if we have a user
      if (data.user) {
        const role = isClubOwner ? "club_admin" : "student";
        console.log("Creating user role:", { userId: data.user.id, role, isClubOwner });

        // Use upsert to prevent duplicate entries
        const { error: roleError, data: roleData } = await supabase
          .from("user_roles")
          .upsert({
            user_id: data.user.id,
            role: role,
            club_id: null,
          }, {
            onConflict: 'user_id', // If user_id already exists, update instead
          })
          .select();

        if (roleError) {
          console.error("Error creating user role:", roleError);
        } else {
          console.log("User role created successfully:", roleData);
        }
      } else {
        console.log("No data.user returned from signUp - email confirmation may be required");
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        toast({
          title: "Check your email",
          description: isClubOwner
            ? "We've sent you a confirmation link. After verifying, contact the super admin to get your club assigned."
            : "We've sent you a confirmation link. Please check your email to verify your account.",
        });
      } else {
        toast({
          title: "Success!",
          description: isClubOwner
            ? "Account created! Contact the super admin to get your club assigned and start creating events."
            : "Your account has been created. Welcome to Club Cult!",
        });
      }
    } catch (error: unknown) {
      console.error("Sign up error:", error);
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured. Check your .env file.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide more helpful error messages
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please check your credentials.");
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Please verify your email before signing in. Check your inbox.");
        }
        throw error;
      }

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
      }
    } catch (error: unknown) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "Failed to sign in. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setUserRole(null);
      setClubId(null);

      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error: unknown) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign out",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userRole,
        clubId,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
