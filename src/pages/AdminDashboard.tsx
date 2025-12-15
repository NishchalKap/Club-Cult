import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, TrendingUp, Eye, Edit, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import SubscriptionBanner from "@/components/SubscriptionBanner";

interface Event {
  id: string;
  title: string;
  event_starts: string;
  event_ends: string;
  venue: string;
  capacity: number;
  is_paid: boolean;
  price: number | null;
  banner_url: string | null;
  created_at: string;
  registrations?: { count: number }[];
  registered_count?: number;
}

const PAGE_SIZE = 10;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
  });
  const [events, setEvents] = useState<Event[]>([]);

  // Pagination State
  const [page, setPage] = useState(0); // 0-indexed
  const [totalEventsCount, setTotalEventsCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get user's club_id first (Strict Check)
        const { data: profile, error: profileError } = await supabase
          .from("user_roles") // Mapping user_profiles -> user_roles
          .select("club_id, role")
          .eq("user_id", user.id)
          .single();

        if (profileError || !profile?.club_id || profile.role !== 'club_admin') {
          toast({
            title: "Access Denied",
            description: "You must be assigned to a club to view admin dashboard.",
            variant: "destructive"
          });
          navigate("/");
          return;
        }

        const clubId = profile.club_id;

        // 1. Fetch Stats (Strictly Scoped)
        const { count: eventsCount, error: eventsError } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("club_id", clubId);

        if (eventsError) throw eventsError;
        setTotalEventsCount(eventsCount || 0);

        // Upcoming Events
        const now = new Date().toISOString();
        const { count: upcomingCount, error: upcomingError } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("club_id", clubId)
          .gt("event_starts", now);

        if (upcomingError) throw upcomingError;

        // 2. Fetch User's Club Events (Paginated)
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: clubEvents, error: clubEventsError } = await supabase
          .from("events")
          .select(`
            *,
            registrations:event_registrations(count)
          `)
          .eq("club_id", clubId)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (clubEventsError) throw clubEventsError;

        // Total Registrations Calculation
        // Using RLS-safe count on event_registrations as per final prompt
        const { count: totalRegs } = await supabase
          .from("event_registrations")
          .select("*", { count: "exact", head: true });

        setStats({
          totalEvents: eventsCount || 0,
          totalRegistrations: totalRegs,
          upcomingEvents: upcomingCount || 0,
        });

        setEvents((clubEvents as Event[]) || []);

      } catch (error: unknown) {
        console.error("Dashboard fetch error:", error);
        toast({
          title: "Error loading dashboard",
          description: error instanceof Error ? error.message : "Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, toast, page, navigate]);

  const totalPages = Math.ceil(totalEventsCount / PAGE_SIZE) || 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Club Dashboard</h1>
            <p className="text-muted-foreground">Manage your events and track performance</p>
          </div>
          <Link to="/admin/create-event">
            <Button size="lg" className="bg-gradient-purple-pink shadow-purple">
              <Plus className="w-5 h-5 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>

        {/* Subscription Status Banner */}
        <SubscriptionBanner />

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalEvents}</div>
                <Calendar className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalRegistrations}</div>
                <Users className="w-8 h-8 text-secondary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.upcomingEvents}</div>
                <TrendingUp className="w-8 h-8 text-accent opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Your Events</CardTitle>
              {events.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No events yet.</p>
                <Link to="/admin/create-event" className="mt-4 inline-block">
                  <Button variant="outline">Create your first event</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.event_starts), "PPP p")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {/* registrations is now typed */}
                          {event.registrations?.[0]?.count ?? 0} / {event.capacity}
                        </span>
                        <span className="flex items-center gap-1">
                          {event.is_paid ? `Paid (₹${event.price})` : 'Free'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/events/${event.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link to={`/admin/edit-event/${event.id}`}>
                        <Button variant="ghost" size="sm" title="Edit Event">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
