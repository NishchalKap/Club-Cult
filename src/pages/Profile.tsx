import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Mail, Phone, BookOpen, GraduationCap, Shield, Building2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
    full_name: string;
    email: string;
    phone: string | null;
    branch: string | null;
    year: string | null;
}

interface RoleData {
    role: string;
    club_id: string | null;
    club_name?: string | null;
}

export default function Profile() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [roleData, setRoleData] = useState<RoleData | null>(null);

    // Editable fields
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [branch, setBranch] = useState("");
    const [year, setYear] = useState("");

    const fetchProfileData = useCallback(async () => {
        if (!user) return;

        try {
            // Fetch profile data
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("full_name, email, phone, branch, year")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            // Fetch role data with club name
            const { data: roleDataResult, error: roleError } = await supabase
                .from("user_roles")
                .select("role, club_id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (roleError) throw roleError;

            // Fetch club name if club_id exists
            let clubName: string | null = null;
            if (roleDataResult?.club_id) {
                const { data: clubData } = await supabase
                    .from("clubs")
                    .select("name")
                    .eq("id", roleDataResult.club_id)
                    .single();
                clubName = clubData?.name || null;
            }

            // Set profile data (use auth user email if profile doesn't exist)
            const finalProfile: ProfileData = profileData || {
                full_name: user.user_metadata?.full_name || "",
                email: user.email || "",
                phone: null,
                branch: null,
                year: null,
            };

            setProfile(finalProfile);
            setFullName(finalProfile.full_name || "");
            setPhone(finalProfile.phone || "");
            setBranch(finalProfile.branch || "");
            setYear(finalProfile.year || "");

            setRoleData(roleDataResult ? {
                ...roleDataResult,
                club_name: clubName,
            } : {
                role: "student",
                club_id: null,
                club_name: null,
            });

        } catch (error) {
            console.error("Error fetching profile:", error);
            toast({
                title: "Error",
                description: "Failed to load profile data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate("/auth", { replace: true });
            return;
        }

        fetchProfileData();
    }, [user, authLoading, navigate, fetchProfileData]);

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            // Upsert profile data
            const { error } = await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    email: user.email || "",
                    full_name: fullName.trim(),
                    phone: phone.trim() || null,
                    branch: branch.trim() || null,
                    year: year.trim() || null,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: "id",
                });

            if (error) throw error;

            // Update local state
            setProfile(prev => prev ? {
                ...prev,
                full_name: fullName.trim(),
                phone: phone.trim() || null,
                branch: branch.trim() || null,
                year: year.trim() || null,
            } : null);

            toast({
                title: "Profile Updated",
                description: "Your profile has been saved successfully.",
            });

        } catch (error) {
            console.error("Error saving profile:", error);
            toast({
                title: "Error",
                description: "Failed to save profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "super_admin": return "bg-purple-500";
            case "club_admin": return "bg-blue-500";
            default: return "bg-green-500";
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "super_admin": return "Super Admin";
            case "club_admin": return "Club Admin";
            default: return "Student";
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl font-bold text-white">
                            {fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold">My Profile</h1>
                    <p className="text-muted-foreground">Manage your account information</p>
                </div>

                {/* Role & Club Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Account Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Role</span>
                            <Badge className={getRoleBadgeColor(roleData?.role || "student")}>
                                {getRoleLabel(roleData?.role || "student")}
                            </Badge>
                        </div>

                        {roleData?.role === "club_admin" && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Assigned Club
                                </span>
                                {roleData.club_name ? (
                                    <span className="font-medium">{roleData.club_name}</span>
                                ) : (
                                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                                        Not Assigned
                                    </Badge>
                                )}
                            </div>
                        )}

                        {roleData?.role === "super_admin" && (
                            <p className="text-sm text-muted-foreground bg-purple-50 p-3 rounded-lg">
                                🔐 You have full administrative access to the platform.
                            </p>
                        )}

                        {roleData?.role === "club_admin" && !roleData.club_id && (
                            <p className="text-sm text-muted-foreground bg-orange-50 p-3 rounded-lg">
                                ⚠️ Contact the super admin to get your club assigned before you can manage events.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Profile Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>
                            Update your personal details below
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Email (Read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile?.email || user?.email || ""}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed
                            </p>
                        </div>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Full Name
                            </Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={saving}
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Phone Number
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="Enter your phone number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={saving}
                            />
                        </div>

                        {/* Branch */}
                        <div className="space-y-2">
                            <Label htmlFor="branch" className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Branch / Department
                            </Label>
                            <Input
                                id="branch"
                                type="text"
                                placeholder="e.g., Computer Science, Mechanical"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                disabled={saving}
                            />
                        </div>

                        {/* Year */}
                        <div className="space-y-2">
                            <Label htmlFor="year" className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                Year
                            </Label>
                            <Input
                                id="year"
                                type="text"
                                placeholder="e.g., 2nd Year, Final Year"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                disabled={saving}
                            />
                        </div>

                        {/* Save Button */}
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-gradient-to-r from-primary to-accent"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
