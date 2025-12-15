import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Filter, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EventCard from "@/components/EventCard";

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

  const fetchEvents = useCallback(async () => {
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
      setEvents((data as Event[]) || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);



  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const trendingEvents = filteredEvents.slice(0, 2);
  const allEvents = filteredEvents;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading amazing events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary via-accent to-secondary py-16 sm:py-24 px-4 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Discover Campus Life</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              Your Campus, Your Culture
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Discover, register, and experience the best university events.
              From workshops to concerts — find your next adventure.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search events, venues, or clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-lg bg-white border-0 shadow-2xl rounded-full focus-visible:ring-4 focus-visible:ring-white/30"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trending Section */}
        {trendingEvents.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Trending Events
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {trendingEvents.map((event) => (
                <EventCard key={event.id} event={event} variant="trending" />
              ))}
            </div>
          </section>
        )}

        {/* All Events Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              All Events
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  rounded-full px-5 whitespace-nowrap transition-all
                  ${selectedCategory === cat
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                    : "hover:border-primary hover:text-primary"
                  }
                `}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Events Grid */}
          {allEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎭</div>
              <p className="text-xl text-gray-500 mb-2">No events found</p>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
