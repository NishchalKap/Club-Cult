import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [hasValidSession, setHasValidSession] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Validation states
    const isPasswordLongEnough = password.length >= 8;
    const doPasswordsMatch = password === confirmPassword && password.length > 0;
    const isFormValid = isPasswordLongEnough && doPasswordsMatch;

    useEffect(() => {
        // Check if user has a valid session from the reset email link
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Session check error:", error);
                    setError("Failed to verify your reset link. Please try again.");
                    setHasValidSession(false);
                } else if (session) {
                    setHasValidSession(true);
                } else {
                    setError("Invalid or expired reset link. Please request a new password reset.");
                    setHasValidSession(false);
                }
            } catch (err) {
                console.error("Error checking session:", err);
                setError("An error occurred. Please try again.");
                setHasValidSession(false);
            } finally {
                setCheckingSession(false);
            }
        };

        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid) return;

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                if (error.message.includes("same")) {
                    setError("New password must be different from your current password.");
                } else {
                    setError(error.message);
                }
                return;
            }

            toast({
                title: "Password Updated",
                description: "Your password has been changed successfully. Please sign in with your new password.",
            });

            // Sign out the user so they can log in fresh with new password
            await supabase.auth.signOut();

            // Redirect to auth page
            navigate("/auth", { replace: true });

        } catch (err) {
            console.error("Password update error:", err);
            setError("Failed to update password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Verifying your reset link...</p>
                </div>
            </div>
        );
    }

    if (!hasValidSession) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
                <Card className="w-full max-w-md shadow-xl border-0">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl">Link Expired</CardTitle>
                        <CardDescription>
                            {error || "This password reset link is invalid or has expired."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => navigate("/auth")}
                            className="w-full bg-gradient-to-r from-primary to-accent"
                        >
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your new password below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Error Display */}
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="h-11"
                            />
                            <div className="flex items-center gap-2 text-xs">
                                {password.length > 0 && (
                                    isPasswordLongEnough ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            At least 8 characters
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            Must be at least 8 characters
                                        </span>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                className="h-11"
                            />
                            <div className="flex items-center gap-2 text-xs">
                                {confirmPassword.length > 0 && (
                                    doPasswordsMatch ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Passwords match
                                        </span>
                                    ) : (
                                        <span className="text-destructive">
                                            Passwords do not match
                                        </span>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                            disabled={loading || !isFormValid}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating Password...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <button
                            type="button"
                            onClick={() => navigate("/auth")}
                            className="text-primary hover:underline font-medium"
                            disabled={loading}
                        >
                            Back to Login
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
