import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Building2, Users, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Club {
    id: string;
    name: string;
    description: string | null;
}

interface PendingAdmin {
    id: string;
    user_id: string;
    role: string;
    club_id: string | null;
    created_at: string;
    user_email?: string;
    user_name?: string;
}

export default function SuperAdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
    const [newClubName, setNewClubName] = useState("");
    const [newClubDescription, setNewClubDescription] = useState("");
    const [creatingClub, setCreatingClub] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch all clubs
            const { data: clubsData, error: clubsError } = await supabase
                .from("clubs")
                .select("*")
                .order("name");

            if (clubsError) throw clubsError;
            setClubs(clubsData || []);

            // Fetch club admins without club_id (pending assignment)
            const { data: adminsData, error: adminsError } = await supabase
                .from("user_roles")
                .select("*")
                .eq("role", "club_admin");

            if (adminsError) throw adminsError;

            // For each admin, try to get their email from auth metadata
            const adminsWithEmail = (adminsData || []).map((admin) => ({
                ...admin,
                user_email: "Loading...",
                user_name: "Club Admin",
            }));

            setPendingAdmins(adminsWithEmail);
        } catch (error: unknown) {
            console.error("Error fetching data:", error);
            toast({
                title: "Error",
                description: "Failed to load dashboard data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const createClub = async () => {
        if (!newClubName.trim()) {
            toast({
                title: "Error",
                description: "Club name is required.",
                variant: "destructive",
            });
            return;
        }

        setCreatingClub(true);
        try {
            const { error } = await supabase.from("clubs").insert({
                name: newClubName.trim(),
                description: newClubDescription.trim() || null,
            });

            if (error) throw error;

            toast({
                title: "Club Created",
                description: `${newClubName} has been created successfully.`,
            });

            setNewClubName("");
            setNewClubDescription("");
            fetchData();
        } catch (error: unknown) {
            console.error("Error creating club:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create club.",
                variant: "destructive",
            });
        } finally {
            setCreatingClub(false);
        }
    };

    const assignClub = async (adminId: string, clubId: string) => {
        try {
            const { error } = await supabase
                .from("user_roles")
                .update({ club_id: clubId })
                .eq("id", adminId);

            if (error) throw error;

            toast({
                title: "Club Assigned",
                description: "Admin has been assigned to the club successfully.",
            });

            fetchData();
        } catch (error: unknown) {
            console.error("Error assigning club:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to assign club.",
                variant: "destructive",
            });
        }
    };

    const removeClubAssignment = async (adminId: string) => {
        try {
            const { error } = await supabase
                .from("user_roles")
                .update({ club_id: null })
                .eq("id", adminId);

            if (error) throw error;

            toast({
                title: "Assignment Removed",
                description: "Club assignment has been removed.",
            });

            fetchData();
        } catch (error: unknown) {
            console.error("Error removing assignment:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to remove assignment.",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const pendingCount = pendingAdmins.filter((a) => !a.club_id).length;
    const assignedCount = pendingAdmins.filter((a) => a.club_id).length;

    return (
        <div className="min-h-screen p-8 bg-background">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-4xl font-bold">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage clubs and assign club admins</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{clubs.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
                            <Users className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Club Admins</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">{assignedCount}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Create Club */}
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Club</CardTitle>
                        <CardDescription>Add a new club to the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="clubName">Club Name</Label>
                                <Input
                                    id="clubName"
                                    placeholder="e.g. Tech Club"
                                    value={newClubName}
                                    onChange={(e) => setNewClubName(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="clubDescription">Description (optional)</Label>
                                <Input
                                    id="clubDescription"
                                    placeholder="Brief description..."
                                    value={newClubDescription}
                                    onChange={(e) => setNewClubDescription(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={createClub} disabled={creatingClub}>
                                    {creatingClub ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4 mr-2" />
                                    )}
                                    Create Club
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Club Admins Management */}
                <Card>
                    <CardHeader>
                        <CardTitle>Club Admin Assignments</CardTitle>
                        <CardDescription>
                            Assign clubs to pending club admins. Admins without a club cannot create events.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingAdmins.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                No club admins registered yet.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Current Club</TableHead>
                                        <TableHead>Assign Club</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingAdmins.map((admin) => (
                                        <TableRow key={admin.id}>
                                            <TableCell className="font-mono text-xs">
                                                {admin.user_id.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell>
                                                {admin.club_id ? (
                                                    <Badge variant="default" className="bg-green-500">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Assigned
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {admin.club_id
                                                    ? clubs.find((c) => c.id === admin.club_id)?.name || "Unknown"
                                                    : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={admin.club_id || ""}
                                                    onValueChange={(value) => assignClub(admin.id, value)}
                                                >
                                                    <SelectTrigger className="w-48">
                                                        <SelectValue placeholder="Select a club" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {clubs.map((club) => (
                                                            <SelectItem key={club.id} value={club.id}>
                                                                {club.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                {admin.club_id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeClubAssignment(admin.id)}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Clubs List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Clubs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {clubs.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                No clubs created yet. Create one above.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {clubs.map((club) => (
                                    <Card key={club.id} className="bg-muted/50">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Building2 className="w-4 h-4" />
                                                {club.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">
                                                {club.description || "No description"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2 font-mono">
                                                ID: {club.id.slice(0, 8)}...
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
