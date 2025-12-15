import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
    SubscriptionInfo,
    SubscriptionStatus,
    SUBSCRIPTION_CONFIG,
    calculateDaysRemaining
} from '@/lib/subscription';

export function useSubscription() {
    const { user, userRole } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [clubId, setClubId] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !['club_admin', 'super_admin'].includes(userRole || '')) {
            setLoading(false);
            return;
        }

        const fetchSubscription = async () => {
            try {
                // Get user's club_id
                const { data: roleData, error: roleError } = await supabase
                    .from('user_roles')
                    .select('club_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (roleError) throw roleError;

                // Super admin without club assignment can bypass
                if (userRole === 'super_admin' && !roleData?.club_id) {
                    setSubscription({
                        status: 'active',
                        expiresAt: null,
                        daysRemaining: 999,
                        isValid: true,
                        isFirstSubscription: false,
                        showWarning: false,
                        showCritical: false,
                        currentPlan: null,
                    });
                    setLoading(false);
                    return;
                }

                if (!roleData?.club_id) {
                    setLoading(false);
                    return;
                }

                setClubId(roleData.club_id);

                // Fetch club subscription info
                // Note: subscription_status, subscription_expires_at, first_subscription_used columns
                // will be added via the subscription_migration.sql file
                const { data: clubData, error: clubError } = await supabase
                    .from('clubs')
                    .select('*')
                    .eq('id', roleData.club_id)
                    .single();

                if (clubError) throw clubError;

                // Type assertion for new columns (added via migration)
                interface ClubWithSubscription {
                    subscription_expires_at?: string | null;
                    subscription_status?: string | null;
                    first_subscription_used?: boolean;
                }
                const clubInfo = clubData as ClubWithSubscription;

                const expiresAt = clubInfo.subscription_expires_at
                    ? new Date(clubInfo.subscription_expires_at)
                    : null;

                const daysRemaining = calculateDaysRemaining(expiresAt);
                const status = (clubInfo.subscription_status || 'none') as SubscriptionStatus;

                // Check validity including grace period
                const isInGracePeriod = status === 'grace_period' ||
                    (daysRemaining < 0 && daysRemaining >= -SUBSCRIPTION_CONFIG.GRACE_PERIOD_DAYS);

                const isValid = ['trial', 'active'].includes(status) && daysRemaining > 0 || isInGracePeriod;

                setSubscription({
                    status,
                    expiresAt,
                    daysRemaining,
                    isValid,
                    isFirstSubscription: !clubInfo.first_subscription_used,
                    showWarning: daysRemaining <= SUBSCRIPTION_CONFIG.WARNING_THRESHOLD_DAYS && daysRemaining > SUBSCRIPTION_CONFIG.CRITICAL_THRESHOLD_DAYS,
                    showCritical: daysRemaining <= SUBSCRIPTION_CONFIG.CRITICAL_THRESHOLD_DAYS,
                    currentPlan: null, // Will be fetched from subscriptions table if needed
                });

            } catch (error) {
                console.error('Error fetching subscription:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [user, userRole]);

    return { subscription, loading, clubId };
}
