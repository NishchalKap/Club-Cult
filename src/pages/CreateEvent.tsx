import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// File validation constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Schema - FIX-01: Added description, FIX-03: Added registration dates
const formSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    event_starts: z.date({ required_error: "Event start date is required" }),
    event_ends: z.date({ required_error: "Event end date is required" }),
    registration_opens: z.date({ required_error: "Registration open date is required" }),
    registration_closes: z.date({ required_error: "Registration close date is required" }),
    venue: z.string().min(2, "Venue is required"),
    capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
    is_paid: z.boolean().default(false),
    price: z.coerce.number().optional(),
    banner: z.any().optional(), // File list
}).refine((data) => data.event_ends >= data.event_starts, {
    message: "Event end date must be after start date",
    path: ["event_ends"],
}).refine((data) => data.registration_closes <= data.event_starts, {
    message: "Registration must close before or when event starts",
    path: ["registration_closes"],
}).refine((data) => data.registration_opens <= data.registration_closes, {
    message: "Registration open date must be before close date",
    path: ["registration_opens"],
});

export default function CreateEvent() {
    const { id } = useParams(); // If present, we are in Edit mode
    const isEditMode = !!id;
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, userRole } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
    const [clubId, setClubId] = useState<string | null>(null);
    const [bannerError, setBannerError] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            venue: "",
            capacity: 100,
            is_paid: false,
            price: 0,
            registration_opens: new Date(),
            registration_closes: undefined,
        },
    });

    const isPaid = form.watch("is_paid");

    // Check club access on mount - FIX-08: Block form if not club_admin
    useEffect(() => {
        const checkClubAccess = async () => {
            if (!user) {
                navigate("/auth");
                return;
            }

            try {
                // FIX-07: Using maybeSingle() for robustness
                const { data: profile, error } = await supabase
                    .from("user_roles")
                    .select("club_id, role")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (error) throw error;

                if (!profile) {
                    toast({
                        title: "Profile Not Found",
                        description: "Your profile could not be found. Please contact support.",
                        variant: "destructive",
                    });
                    navigate("/");
                    return;
                }

                // Super admin can create events without club_id
                if (profile.role === "super_admin") {
                    setClubId("super_admin"); // Special marker for super admin
                } else if (profile.role !== "club_admin") {
                    toast({
                        title: "Access Denied",
                        description: "Only club admins can create events.",
                        variant: "destructive",
                    });
                    navigate("/");
                    return;
                } else if (!profile.club_id) {
                    toast({
                        title: "Club Not Assigned",
                        description: "You must be assigned to a club to create events. Contact super admin.",
                        variant: "destructive",
                    });
                    navigate("/admin");
                    return;
                } else {
                    setClubId(profile.club_id);
                }

                // If in edit mode, fetch event data
                if (isEditMode && id) {
                    const { data: eventData, error: eventError } = await supabase
                        .from("events")
                        .select("*")
                        .eq("id", id)
                        .single();

                    if (eventError) throw eventError;

                    form.reset({
                        title: eventData.title,
                        description: eventData.description || "",
                        event_starts: new Date(eventData.event_starts),
                        event_ends: new Date(eventData.event_ends),
                        registration_opens: new Date(eventData.registration_opens),
                        registration_closes: new Date(eventData.registration_closes),
                        venue: eventData.venue,
                        capacity: eventData.capacity,
                        is_paid: eventData.is_paid,
                        price: eventData.price || 0,
                    });
                    setExistingBannerUrl(eventData.banner_url);
                }
            } catch (error) {
                console.error("Error in access check:", error);
                toast({
                    title: "Error",
                    description: "Failed to verify access. Please try again.",
                    variant: "destructive",
                });
                navigate("/admin");
            } finally {
                setInitialLoading(false);
            }
        };

        checkClubAccess();
    }, [user, isEditMode, id, form, navigate, toast]);

    // FIX-02: File validation handler - NOW ACTUALLY USED
    const validateBannerFile = (file: File): boolean => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setBannerError("Only JPEG, PNG, and WebP images are allowed");
            return false;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            setBannerError("Image must be less than 5MB");
            return false;
        }
        setBannerError(null);
        return true;
    };

    // Handle banner file change with validation - FIX-02
    const handleBannerChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        onChange: (value: FileList | null) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) {
            setBannerPreview(null);
            onChange(null);
            return;
        }

        // Validate the file
        if (!validateBannerFile(file)) {
            e.target.value = ''; // Clear the input
            setBannerPreview(null);
            onChange(null);
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setBannerPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        onChange(e.target.files);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) return;

        // Check if banner is required for new events
        if (!isEditMode && !values.banner?.[0] && !existingBannerUrl) {
            setBannerError("Banner image is required");
            return;
        }

        setLoading(true);

        let bannerUrl = existingBannerUrl;
        let uploadedPath: string | null = null;

        try {
            // 1. Get Club ID
            const { data: profile } = await supabase
                .from("user_roles")
                .select("club_id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!profile?.club_id) {
                throw new Error("You are not associated with a club.");
            }

            // 2. Handle Image Upload
            const file = values.banner?.[0];
            if (file) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${crypto.randomUUID()}.${fileExt}`;
                const filePath = `${profile.club_id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("event-banners")
                    .upload(filePath, file);

                if (uploadError) {
                    toast({
                        title: "Upload Failed",
                        description: "Failed to upload banner image. Please try again.",
                        variant: "destructive",
                    });
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from("event-banners")
                    .getPublicUrl(filePath);

                bannerUrl = publicUrl;
                uploadedPath = filePath; // Keep track for cleanup
            }

            // 3. Insert or Update Event - FIX-01 & FIX-03: Include all required fields
            const eventData = {
                title: values.title,
                description: values.description,
                event_starts: values.event_starts.toISOString(),
                event_ends: values.event_ends.toISOString(),
                registration_opens: values.registration_opens.toISOString(),
                registration_closes: values.registration_closes.toISOString(),
                venue: values.venue,
                capacity: values.capacity,
                is_paid: values.is_paid,
                price: values.is_paid ? values.price : null,
                banner_url: bannerUrl!,
                club_id: profile.club_id,
                status: 'published' as const, // Auto-publish events
            };

            let error;
            if (isEditMode) {
                const { error: updateError } = await supabase
                    .from("events")
                    .update(eventData)
                    .eq("id", id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("events")
                    .insert([eventData]);
                error = insertError;
            }

            if (error) {
                // FIX-04: CLEANUP with robust error handling
                if (uploadedPath) {
                    try {
                        await supabase.storage.from("event-banners").remove([uploadedPath]);
                    } catch (cleanupError) {
                        console.error("Failed to cleanup orphaned banner:", cleanupError);
                        // Retry once after delay
                        setTimeout(async () => {
                            try {
                                await supabase.storage.from("event-banners").remove([uploadedPath!]);
                            } catch (retryError) {
                                console.error("Retry cleanup also failed:", retryError);
                            }
                        }, 1000);
                    }
                }
                throw error;
            }

            toast({
                title: isEditMode ? "Event Updated" : "Event Created",
                description: isEditMode ? "Your event has been updated successfully." : "Your event is now live!",
            });

            // FIX-06: Reset form on success
            form.reset();
            setBannerPreview(null);
            setExistingBannerUrl(null);

            navigate("/admin");
        } catch (error: unknown) {
            console.error("Submission error:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save event.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-background">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link to="/admin" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold">{isEditMode ? "Edit Event" : "Create New Event"}</h1>
                    <p className="text-muted-foreground">
                        {isEditMode ? "Update your event details below." : "Fill in the details below to publish your event."}
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Annual Tech Symposium" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* FIX-01: Added description field */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe your event in detail. What will attendees experience?"
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Minimum 10 characters. Be descriptive to attract attendees.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="event_starts"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Event Starts At</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP HH:mm")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date()
                                                    }
                                                    initialFocus
                                                />
                                                <div className="p-3 border-t">
                                                    <Input
                                                        type="time"
                                                        onChange={(e) => {
                                                            const date = field.value || new Date();
                                                            const [hours, minutes] = e.target.value.split(":");
                                                            date.setHours(parseInt(hours), parseInt(minutes));
                                                            field.onChange(date);
                                                        }}
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="event_ends"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Event Ends At</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP HH:mm")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date()
                                                    }
                                                    initialFocus
                                                />
                                                <div className="p-3 border-t">
                                                    <Input
                                                        type="time"
                                                        onChange={(e) => {
                                                            const date = field.value || new Date();
                                                            const [hours, minutes] = e.target.value.split(":");
                                                            date.setHours(parseInt(hours), parseInt(minutes));
                                                            field.onChange(date);
                                                        }}
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* FIX-03: Added registration date fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="registration_opens"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Registration Opens</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP HH:mm")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                                <div className="p-3 border-t">
                                                    <Input
                                                        type="time"
                                                        onChange={(e) => {
                                                            const date = field.value || new Date();
                                                            const [hours, minutes] = e.target.value.split(":");
                                                            date.setHours(parseInt(hours), parseInt(minutes));
                                                            field.onChange(date);
                                                        }}
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            When users can start registering
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="registration_closes"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Registration Closes</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP HH:mm")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                                <div className="p-3 border-t">
                                                    <Input
                                                        type="time"
                                                        onChange={(e) => {
                                                            const date = field.value || new Date();
                                                            const [hours, minutes] = e.target.value.split(":");
                                                            date.setHours(parseInt(hours), parseInt(minutes));
                                                            field.onChange(date);
                                                        }}
                                                    />
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            Must be before event starts
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="venue"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Venue</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Main Auditorium" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="capacity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Capacity</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Paid Event</FormLabel>
                                <FormDescription>
                                    Is this a paid event?
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={isPaid}
                                    onCheckedChange={(checked) => form.setValue("is_paid", checked)}
                                />
                            </FormControl>
                        </div>

                        {isPaid && (
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ticket Price (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* FIX-02 & FIX-05: Banner upload with validation and error display */}
                        <FormField
                            control={form.control}
                            name="banner"
                            render={({ field: { value, onChange, ...field } }) => (
                                <FormItem>
                                    <FormLabel>Event Banner {!isEditMode && <span className="text-destructive">*</span>}</FormLabel>
                                    <FormControl>
                                        <div className="space-y-4">
                                            {/* Preview existing or new banner */}
                                            {(bannerPreview || existingBannerUrl) && (
                                                <img
                                                    src={bannerPreview || existingBannerUrl!}
                                                    alt="Banner Preview"
                                                    className="w-full h-48 object-cover rounded-md border"
                                                />
                                            )}
                                            <Input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={(e) => handleBannerChange(e, onChange)}
                                                {...field}
                                            />
                                            {/* FIX-05: Display banner error inline */}
                                            {bannerError && (
                                                <p className="text-destructive text-sm font-medium">{bannerError}</p>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Upload a banner image (JPEG, PNG, WebP). Max 5MB.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={loading || !!bannerError}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isEditMode ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                isEditMode ? "Update Event" : "Create Event"
                            )}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
