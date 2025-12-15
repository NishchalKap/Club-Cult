import { Link } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EventCardProps {
    event: {
        id: string;
        title: string;
        banner_url: string;
        venue: string;
        event_starts: string;
        is_paid: boolean;
        price?: number;
        capacity: number;
        registered_count: number;
        clubs?: {
            name: string;
        };
    };
    variant?: "default" | "trending";
}

export default function EventCard({ event, variant = "default" }: EventCardProps) {
    const spotsLeft = event.capacity - event.registered_count;
    const isSoldOut = spotsLeft <= 0;
    const isLowStock = spotsLeft > 0 && spotsLeft < 10;

    return (
        <Link to={`/events/${event.id}`}>
            <Card className={`
        overflow-hidden transition-all duration-300 cursor-pointer group
        hover:-translate-y-2 hover:shadow-xl
        ${variant === "trending" ? "border-2 border-primary/20" : "border border-gray-200"}
      `}>
                {/* Banner Image */}
                <div className={`relative overflow-hidden ${variant === "trending" ? "h-52" : "h-44"}`}>
                    <img
                        src={event.banner_url || "/placeholder-event.jpg"}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Overlay badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        {event.is_paid ? (
                            <Badge className="bg-accent text-white font-semibold shadow-lg">
                                ₹{event.price}
                            </Badge>
                        ) : (
                            <Badge className="bg-secondary text-white font-semibold shadow-lg">
                                FREE
                            </Badge>
                        )}
                        {variant === "trending" && (
                            <Badge className="bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg">
                                🔥 Trending
                            </Badge>
                        )}
                    </div>

                    {/* Sold out overlay */}
                    {isSoldOut && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="px-6 py-2 bg-red-500 text-white text-lg font-bold rounded-full">
                                SOLD OUT
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <CardContent className={`p-5 ${variant === "trending" ? "p-6" : "p-5"}`}>
                    <h3 className={`
            font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors
            ${variant === "trending" ? "text-xl" : "text-lg"}
          `}>
                        {event.title}
                    </h3>

                    {event.clubs?.name && (
                        <p className="text-xs text-muted-foreground mb-3">{event.clubs.name}</p>
                    )}

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="truncate">
                                {format(new Date(event.event_starts), "PPP 'at' p")}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                            <span className="truncate">{event.venue}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-secondary flex-shrink-0" />
                            <span className={isLowStock ? "text-red-500 font-semibold" : ""}>
                                {isSoldOut ? "Sold out" : `${spotsLeft} spots left`}
                            </span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                        className={`
              w-full font-semibold rounded-xl transition-all
              ${isSoldOut
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg"
                            }
            `}
                        disabled={isSoldOut}
                    >
                        {isSoldOut ? "Sold Out" : "Register Now"}
                    </Button>
                </CardContent>
            </Card>
        </Link>
    );
}
