import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Calendar, MapPin, Users, TrendingUp, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  banner_url: string;
  venue: string;
  event_starts: string;
  price: number;
  is_paid: boolean;
  registered_count: number;
  capacity: number;
  category: string;
  clubs: {
    name: string;
  };
}

const CATEGORIES = ["All", "Workshop", "Concert", "Competition", "Social"];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          title,
          banner_url,
          venue,
          event_starts,
          price,
          is_paid,
          registered_count,
          capacity,
          category,
          clubs (name)
        `)
        .eq("status", "published")
        .order("event_starts", { ascending: true });

      if (error) throw error;
      setEvents(data as any);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const trendingEvents = filteredEvents.slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-purple-pink text-primary-foreground py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZ2LTZoNnYtNmgzMHYzMGgtMzB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-center">
            Your Campus, Your Culture
          </h1>
          <p className="text-xl text-center mb-8 text-white/90">
            Discover, Register, and Experience Amazing Events
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-lg bg-white text-foreground border-0 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Trending Section */}
        {trendingEvents.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">Trending Events</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {trendingEvents.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`}>
                  <Card className="overflow-hidden hover:shadow-purple transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 border-primary/20">
                    <div className="relative h-48">
                      <img 
                        src={event.banner_url} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-4 right-4 bg-accent">
                        Trending
                      </Badge>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{event.clubs.name}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-secondary" />
                          <span>{format(new Date(event.event_starts), "PPP 'at' p")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-secondary" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-secondary" />
                          <span>{event.registered_count} registered • {event.capacity - event.registered_count} spots left</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-primary">
                          {!event.is_paid ? "Free" : `₹${event.price}`}
                        </div>
                        <Button className="bg-gradient-purple-pink">
                          Register Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Events Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">All Events</h2>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? "bg-primary" : ""}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Events Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="overflow-hidden hover:shadow-card transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <div className="relative h-40">
                    <img 
                      src={event.banner_url} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    {!event.is_paid && (
                      <Badge className="absolute top-3 left-3 bg-secondary">
                        Free
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{event.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{event.clubs.name}</p>
                    
                    <div className="space-y-1 text-xs mb-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{format(new Date(event.event_starts), "PPP")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="font-bold text-primary">
                        {!event.is_paid ? "Free" : `₹${event.price}`}
                      </div>
                      <Button size="sm" className="bg-primary">
                        Register
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
