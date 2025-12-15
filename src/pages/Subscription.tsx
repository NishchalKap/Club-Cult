import { useState } from 'react';
import { Check, Crown, Zap, ArrowLeft, CreditCard, Shield, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import {
    SUBSCRIPTION_CONFIG,
    formatPrice,
    getSubscriptionPrice,
    SubscriptionPlan
} from '@/lib/subscription';
import { useAuth } from '@/contexts/AuthContext';

export default function Subscription() {
    const { user } = useAuth();
    const { subscription, loading, clubId } = useSubscription();
    const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(null);
    const { toast } = useToast();
    const navigate = useNavigate();

    const isFirstSubscription = subscription?.isFirstSubscription ?? true;

    const handleSubscribe = async (plan: SubscriptionPlan) => {
        if (!user || !clubId) {
            toast({
                title: "Error",
                description: "You must be logged in and assigned to a club.",
                variant: "destructive",
            });
            return;
        }

        // Payment integration coming soon
        toast({
            title: "Coming Soon",
            description: "Payment integration is being set up. Please check back later!",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const monthlyPrice = getSubscriptionPrice('monthly', isFirstSubscription);
    const yearlyPrice = getSubscriptionPrice('yearly', isFirstSubscription);
    const yearlySavings = (SUBSCRIPTION_CONFIG.MONTHLY_PRICE * 12) - yearlyPrice;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>

                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Choose Your Plan
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Unlock the full potential of Club Cult. Create events, manage registrations,
                            and grow your club community.
                        </p>

                        {isFirstSubscription && (
                            <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-2 rounded-full">
                                <Zap className="w-4 h-4 text-primary" />
                                <span className="text-sm font-semibold text-primary">
                                    🎉 15% OFF your first subscription!
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Status */}
                {subscription && (
                    <Card className="mb-8 border-2 border-dashed border-gray-300">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${subscription.status === 'active' ? 'bg-green-100' :
                                        subscription.status === 'trial' ? 'bg-blue-100' :
                                            'bg-red-100'
                                        }`}>
                                        <Shield className={`w-5 h-5 ${subscription.status === 'active' ? 'text-green-600' :
                                            subscription.status === 'trial' ? 'text-blue-600' :
                                                'text-red-600'
                                            }`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Current Status: <span className="capitalize">{subscription.status}</span>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {subscription.daysRemaining > 0
                                                ? `${subscription.daysRemaining} days remaining`
                                                : 'Expired'
                                            }
                                        </p>
                                    </div>
                                </div>
                                {subscription.expiresAt && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        Expires: {subscription.expiresAt.toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Monthly Plan */}
                    <Card className="relative overflow-hidden hover:shadow-xl transition-shadow">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl">Monthly</CardTitle>
                            <CardDescription>Perfect for trying out</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-center mb-6">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-bold text-gray-900">
                                        {formatPrice(monthlyPrice)}
                                    </span>
                                    <span className="text-gray-500">/month</span>
                                </div>
                                {isFirstSubscription && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        <span className="line-through">{formatPrice(SUBSCRIPTION_CONFIG.MONTHLY_PRICE)}</span>
                                        {' '}with intro discount
                                    </p>
                                )}
                            </div>

                            <ul className="space-y-3 mb-8">
                                {[
                                    'Unlimited event creation',
                                    'Registration management',
                                    'Basic analytics',
                                    'Email support',
                                    'QR code tickets',
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className="w-full h-12 text-lg"
                                variant="outline"
                                onClick={() => handleSubscribe('monthly')}
                                disabled={processingPlan !== null}
                            >
                                {processingPlan === 'monthly' ? 'Processing...' : 'Subscribe Monthly'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Yearly Plan */}
                    <Card className="relative overflow-hidden border-2 border-primary hover:shadow-xl transition-shadow">
                        <div className="absolute top-0 right-0">
                            <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-primary to-accent text-white px-4 py-1">
                                <Crown className="w-4 h-4 mr-1" />
                                Best Value
                            </Badge>
                        </div>
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl">Yearly</CardTitle>
                            <CardDescription>Save {formatPrice(yearlySavings)} vs monthly</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-center mb-6">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                        {formatPrice(yearlyPrice)}
                                    </span>
                                    <span className="text-gray-500">/year</span>
                                </div>
                                {isFirstSubscription && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        <span className="line-through">{formatPrice(SUBSCRIPTION_CONFIG.YEARLY_PRICE)}</span>
                                        {' '}with intro discount
                                    </p>
                                )}
                                <p className="text-sm text-green-600 font-medium mt-1">
                                    That's just {formatPrice(Math.round(yearlyPrice / 12))}/month!
                                </p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {[
                                    'Everything in Monthly',
                                    'Priority support',
                                    'Advanced analytics',
                                    'Custom branding',
                                    'Featured placement',
                                    'API access',
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg"
                                onClick={() => handleSubscribe('yearly')}
                                disabled={processingPlan !== null}
                            >
                                {processingPlan === 'yearly' ? 'Processing...' : 'Subscribe Yearly'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-8 flex-wrap text-gray-500 text-sm">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        <span>Cancel Anytime</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        <span>Instant Activation</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
