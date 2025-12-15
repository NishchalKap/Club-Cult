import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, XCircle, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_CONFIG } from '@/lib/subscription';

export default function SubscriptionBanner() {
    const { subscription, loading } = useSubscription();

    if (loading || !subscription) return null;

    // Don't show for super admins without club assignment
    if (subscription.status === 'active' && subscription.daysRemaining === 999) return null;

    // Trial banner
    if (subscription.status === 'trial') {
        return (
            <div className="bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Free Trial Active</p>
                            <p className="text-sm text-gray-600">
                                {subscription.daysRemaining} days remaining • Upgrade to unlock all features
                            </p>
                        </div>
                    </div>
                    <Link to="/admin/subscription">
                        <Button className="bg-gradient-to-r from-primary to-accent text-white">
                            Upgrade Now
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Grace period banner (critical)
    if (subscription.status === 'grace_period' || (subscription.daysRemaining < 0 && subscription.daysRemaining >= -SUBSCRIPTION_CONFIG.GRACE_PERIOD_DAYS)) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-red-700">Subscription Expired - Grace Period</p>
                            <p className="text-sm text-red-600">
                                Your access will be blocked in {SUBSCRIPTION_CONFIG.GRACE_PERIOD_DAYS + subscription.daysRemaining} days. Renew now!
                            </p>
                        </div>
                    </div>
                    <Link to="/admin/subscription">
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                            Renew Now
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Expired (past grace period)
    if (subscription.status === 'expired' || subscription.daysRemaining < -SUBSCRIPTION_CONFIG.GRACE_PERIOD_DAYS) {
        return (
            <div className="bg-red-100 border-2 border-red-300 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-200 rounded-xl">
                            <XCircle className="w-6 h-6 text-red-700" />
                        </div>
                        <div>
                            <p className="font-bold text-red-800 text-lg">Subscription Expired</p>
                            <p className="text-sm text-red-600">
                                Your club's subscription has expired. Renew to continue creating events.
                            </p>
                        </div>
                    </div>
                    <Link to="/admin/subscription">
                        <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                            Renew Subscription
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Critical warning (3 days or less)
    if (subscription.showCritical) {
        return (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-orange-700">Subscription Expiring Soon!</p>
                            <p className="text-sm text-orange-600">
                                Only {subscription.daysRemaining} days left. Renew to avoid service interruption.
                            </p>
                        </div>
                    </div>
                    <Link to="/admin/subscription">
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                            Renew Now
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Warning (7 days or less)
    if (subscription.showWarning) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-yellow-700">Subscription Expiring</p>
                            <p className="text-sm text-yellow-600">
                                {subscription.daysRemaining} days remaining. Consider renewing soon.
                            </p>
                        </div>
                    </div>
                    <Link to="/admin/subscription">
                        <Button variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50">
                            View Plans
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Active subscription - subtle indicator
    if (subscription.status === 'active' && subscription.daysRemaining > SUBSCRIPTION_CONFIG.WARNING_THRESHOLD_DAYS) {
        return (
            <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                <CheckCircle className="w-4 h-4" />
                <span>Subscription active • {subscription.daysRemaining} days remaining</span>
            </div>
        );
    }

    return null;
}
