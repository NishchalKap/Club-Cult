import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Download, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Registration {
  id: string;
  ticket_id: string;
  registered_at: string;
  payment_status: string;
  events: {
    id: string;
    title: string;
    banner_url: string;
    venue: string;
    event_starts: string;
    is_paid: boolean;
    price: number;
  };
}

export default function MyTickets() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRegistrations();
    }
  }, [user]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          id,
          ticket_id,
          registered_at,
          payment_status,
          events (
            id,
            title,
            banner_url,
            venue,
            event_starts,
            is_paid,
            price
          )
        `)
        .eq("user_id", user?.id)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (!confirm("Are you sure you want to cancel this registration?")) return;

    try {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", registrationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Registration cancelled successfully",
      });

      fetchRegistrations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to cancel registration",
        variant: "destructive",
      });
    }
  };

  const upcomingRegistrations = registrations.filter(
    (r) => new Date(r.events.event_starts) > new Date()
  );

  const pastRegistrations = registrations.filter(
    (r) => new Date(r.events.event_starts) <= new Date()
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Tickets</h1>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingRegistrations.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastRegistrations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcomingRegistrations.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No upcoming events yet
                </p>
                <Button asChild>
                  <a href="/">Browse Events</a>
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {upcomingRegistrations.map((reg) => (
                  <Card key={reg.id} className="overflow-hidden hover:shadow-card transition-shadow">
                    <div className="h-40 relative">
                      <img
                        src={reg.events.banner_url}
                        alt={reg.events.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge
                        className={`absolute top-3 right-3 ${
                          reg.payment_status === "completed"
                            ? "bg-secondary"
                            : "bg-yellow-500"
                        }`}
                      >
                        {reg.payment_status === "completed" ? "Confirmed" : "Pending"}
                      </Badge>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-3">{reg.events.title}</h3>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(reg.events.event_starts), "PPP 'at' p")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{reg.events.venue}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-primary">
                          <Download className="w-4 h-4 mr-2" />
                          Download Ticket
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelRegistration(reg.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastRegistrations.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No past events</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {pastRegistrations.map((reg) => (
                  <Card key={reg.id} className="overflow-hidden opacity-75">
                    <div className="h-40 relative grayscale">
                      <img
                        src={reg.events.banner_url}
                        alt={reg.events.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-3">{reg.events.title}</h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(reg.events.event_starts), "PPP")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{reg.events.venue}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
