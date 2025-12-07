import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, DollarSign, TrendingUp, Eye, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const MOCK_STATS = {
  totalEvents: 12,
  totalRegistrations: 1234,
  revenue: 45600,
  upcomingEvents: 5,
};

const MOCK_EVENTS = [
  {
    id: 1,
    title: "Tech Fest 2025",
    date: "Dec 15, 2025",
    registrations: 234,
    capacity: 500,
    revenue: 0,
    status: "Published",
  },
  {
    id: 2,
    title: "Annual Cultural Night",
    date: "Dec 20, 2025",
    registrations: 456,
    capacity: 1000,
    revenue: 136344,
    status: "Published",
  },
  {
    id: 3,
    title: "Startup Workshop",
    date: "Dec 18, 2025",
    registrations: 89,
    capacity: 100,
    revenue: 13261,
    status: "Published",
  },
];

export default function AdminDashboard() {
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

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{MOCK_STATS.totalEvents}</div>
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
                <div className="text-3xl font-bold">{MOCK_STATS.totalRegistrations}</div>
                <Users className="w-8 h-8 text-secondary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">₹{(MOCK_STATS.revenue / 1000).toFixed(1)}k</div>
                <DollarSign className="w-8 h-8 text-accent opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{MOCK_STATS.upcomingEvents}</div>
                <TrendingUp className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Your Events</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Published</Button>
                <Button variant="ghost" size="sm">Draft</Button>
                <Button variant="ghost" size="sm">Past</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_EVENTS.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.registrations}/{event.capacity}
                      </span>
                      {event.revenue > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ₹{event.revenue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Link to={`/admin/events/${event.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to={`/admin/events/${event.id}/registrations`}>
                      <Button variant="outline" size="sm">
                        View Registrations
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
