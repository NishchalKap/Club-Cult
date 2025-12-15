// Subscription pricing and configuration constants

export const SUBSCRIPTION_CONFIG = {
    // Pricing in INR
    MONTHLY_PRICE: 499,
    YEARLY_PRICE: 4999,

    // First subscription discount (15%)
    INTRO_DISCOUNT_PERCENT: 15,

    // Calculated discounted prices
    get MONTHLY_INTRO_PRICE() {
        return Math.round(this.MONTHLY_PRICE * (1 - this.INTRO_DISCOUNT_PERCENT / 100));
    },
    get YEARLY_INTRO_PRICE() {
        return Math.round(this.YEARLY_PRICE * (1 - this.INTRO_DISCOUNT_PERCENT / 100));
    },

    // Trial and grace periods (in days)
    TRIAL_DAYS: 5,
    GRACE_PERIOD_DAYS: 2,

    // Warning thresholds (days before expiry to show warnings)
    WARNING_THRESHOLD_DAYS: 7,
    CRITICAL_THRESHOLD_DAYS: 3,

    // Plan durations
    MONTHLY_DAYS: 30,
    YEARLY_DAYS: 365,
} as const;

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'grace_period' | 'none';
export type SubscriptionPlan = 'monthly' | 'yearly';

export interface SubscriptionInfo {
    status: SubscriptionStatus;
    expiresAt: Date | null;
    daysRemaining: number;
    isValid: boolean;
    isFirstSubscription: boolean;
    showWarning: boolean;
    showCritical: boolean;
    currentPlan: SubscriptionPlan | null;
}

export function calculateDaysRemaining(expiresAt: Date | null): number {
    if (!expiresAt) return 0;
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getSubscriptionPrice(
    plan: SubscriptionPlan,
    isFirstSubscription: boolean
): number {
    const basePrice = plan === 'monthly'
        ? SUBSCRIPTION_CONFIG.MONTHLY_PRICE
        : SUBSCRIPTION_CONFIG.YEARLY_PRICE;

    if (isFirstSubscription) {
        return Math.round(basePrice * (1 - SUBSCRIPTION_CONFIG.INTRO_DISCOUNT_PERCENT / 100));
    }

    return basePrice;
}

export function formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}
