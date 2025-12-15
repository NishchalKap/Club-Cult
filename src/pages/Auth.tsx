import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, User, ArrowLeft } from "lucide-react";

type AuthMode = "signin" | "signup" | "forgot-password";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [isClubOwner, setIsClubOwner] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [clubName, setClubName] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        await signUp(email, password, fullName, isClubOwner);
      } else if (mode === "signin") {
        await signIn(email, password);
      }
    } catch (error) {
      // Error handling is done in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Check Your Email",
        description: "If an account exists with this email, you'll receive a password reset link.",
      });

      // Go back to sign in mode
      setMode("signin");
      setEmail("");

    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setIsClubOwner(false);
    if (newMode !== "forgot-password") {
      setPassword("");
    }
  };

  // Forgot Password UI
  if (mode === "forgot-password") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="flex justify-center mb-4">
              <span className="text-3xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Club Cult
                </span>
              </span>
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-primary hover:underline font-medium text-sm flex items-center justify-center gap-1 mx-auto"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sign In / Sign Up UI
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center pb-4">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <span className="text-3xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Club Cult
              </span>
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === "signup" ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {mode === "signup"
              ? "Join Club Cult to discover amazing campus events"
              : "Sign in to your account to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Account Type Toggle - Only show on Sign Up */}
          {mode === "signup" && (
            <div className="mb-6 p-4 rounded-xl bg-muted/50 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isClubOwner ? (
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Building2 className="w-5 h-5 text-accent" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {isClubOwner ? "Club Owner" : "Student"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isClubOwner
                        ? "Manage events & registrations"
                        : "Discover & register for events"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isClubOwner}
                  onCheckedChange={setIsClubOwner}
                  aria-label="Toggle club owner mode"
                />
              </div>
              {isClubOwner && (
                <p className="mt-3 text-xs text-muted-foreground bg-accent/5 p-2 rounded-lg">
                  💡 After sign up, contact the super admin to get your club assigned and admin access enabled.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                {isClubOwner && (
                  <div className="space-y-2">
                    <Label htmlFor="clubName">Club Name</Label>
                    <Input
                      id="clubName"
                      type="text"
                      placeholder="Tech Club, Drama Society, etc."
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      disabled={loading}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      This helps us identify your club request
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot-password")}
                    className="text-xs text-primary hover:underline"
                    disabled={loading}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="h-11"
              />
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              disabled={loading}
            >
              {loading ? "Loading..." : mode === "signup" ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
