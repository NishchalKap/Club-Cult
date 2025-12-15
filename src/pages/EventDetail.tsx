import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Clock, Share2, Bookmark, ArrowLeft } from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string;
  banner_url: string;
  venue: string;
  event_starts: string;
  event_ends: string;
  price: number;
  is_paid: boolean;
  registered_count: number;
  capacity: number;
  registration_closes: string;
  clubs: {
    id: string;
    name: string;
    logo_url: string;
  };
}

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchEvent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          title,
          description,
          banner_url,
          venue,
          event_starts,
          event_ends,
          price,
          is_paid,
          registered_count,
          capacity,
          registration_closes,
          clubs (
            id,
            name,
            logo_url
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setEvent(data as Event);
    } catch (error: unknown) {
      console.error("Error fetching event:", error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id, fetchEvent]);



  useEffect(() => {
    if (!id) return;

    // Listen for realtime updates to this specific event
    const channel = supabase
      .channel('event-detail-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          // Update the event state with the new data from the database
          if (payload.new) {
            setEvent(prev => prev ? { ...prev, ...(payload.new as Partial<Event>) } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleRegister = async () => {
    if (!user) {
      navigate("/auth", { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    setRegistering(true);
    try {
      const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const { error } = await supabase.from("event_registrations").insert({
        event_id: id,
        user_id: user.id,
        ticket_id: ticketId,
        name: user.email,
        email: user.email,
        phone: "",
        payment_status: event?.is_paid ? "pending" : "completed",
      });

      if (error) throw error;

      // NOTE: We do NOT manually update local state anymore.
      // The Realtime subscription above will catch the database update triggered by the backend.

      toast({
        title: "Success!",
        description: "You've successfully registered for this event",
      });

      navigate("/my-tickets");
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      if (pgError.code === "23505") {
        toast({
          title: "Already Registered",
          description: "You're already registered for this event",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to register for event",
          variant: "destructive",
        });
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist</p>
          <Link to="/">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const spotsLeft = event.capacity - event.registered_count;
  const percentFilled = (event.registered_count / event.capacity) * 100;

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Image */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <img
          src={event.banner_url}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Link to="/">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>
          <Button size="sm" variant="secondary">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-purple">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={event.clubs.logo_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&q=80"}
                        alt={event.clubs.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm text-muted-foreground">Organized by</p>
                        <p className="font-semibold">{event.clubs.name}</p>
                      </div>
                    </div>
                    <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                  </div>

                  {!event.is_paid && (
                    <Badge className="bg-secondary text-secondary-foreground">
                      Free Event
                    </Badge>
                  )}
                </div>

                {/* Event Details Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8 p-6 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-semibold">{format(new Date(event.event_starts), "PPP 'at' p")}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-semibold">{format(new Date(event.event_ends), "PPP 'at' p")}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Venue</p>
                      <p className="font-semibold">{event.venue}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="font-semibold">{event.registered_count} / {event.capacity} registered</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">About this Event</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Registration Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 shadow-purple border-2 border-primary/20">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {!event.is_paid ? "Free" : `₹${event.price}`}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Registration closes: {format(new Date(event.registration_closes), "PPP")}
                  </p>
                </div>

                {/* Capacity Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Spots Remaining</span>
                    <span className="font-semibold text-secondary">
                      {spotsLeft} / {event.capacity}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-purple-cyan transition-all duration-500"
                      style={{ width: `${percentFilled}%` }}
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-gradient-purple-pink text-lg h-12 shadow-purple"
                  onClick={handleRegister}
                  disabled={registering || spotsLeft === 0}
                >
                  {registering ? "Registering..." : spotsLeft === 0 ? "Sold Out" : "Register Now"}
                </Button>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    {user
                      ? "Click above to register for this event"
                      : "You'll be asked to sign in to complete registration"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Events - Removed for now */}
      </div>
    </div>
  );
}
