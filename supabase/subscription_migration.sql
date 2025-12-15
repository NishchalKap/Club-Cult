-- Club Subscription System Migration
-- Run this in Supabase SQL Editor

-- 1. Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled', 'grace_period');
CREATE TYPE subscription_plan AS ENUM ('monthly', 'yearly');

-- 2. Create club_subscriptions table
CREATE TABLE club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  plan_type subscription_plan NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trial',
  is_first_subscription BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  amount INTEGER NOT NULL, -- in paise (INR * 100)
  discount_applied INTEGER DEFAULT 0, -- discount in paise
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (expires_at > starts_at)
);

-- 3. Create subscription_payments table
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES club_subscriptions(id),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  payment_gateway TEXT, -- e.g., 'stripe', 'paypal', etc.
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  amount INTEGER NOT NULL, -- in paise
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  plan_type subscription_plan NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add subscription fields to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'trial';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS first_subscription_used BOOLEAN DEFAULT false;

-- 5. Create indexes for performance
CREATE INDEX idx_club_subscriptions_club_id ON club_subscriptions(club_id);
CREATE INDEX idx_club_subscriptions_status ON club_subscriptions(status);
CREATE INDEX idx_club_subscriptions_expires_at ON club_subscriptions(expires_at);
CREATE INDEX idx_subscription_payments_club_id ON subscription_payments(club_id);

-- 6. Enable RLS
ALTER TABLE club_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for club_subscriptions

-- Club admins can view their own club's subscriptions
CREATE POLICY "club_admins_view_own_subscriptions"
ON club_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.club_id = club_subscriptions.club_id
      AND ur.role IN ('club_admin', 'super_admin')
  )
);

-- Super admins can view all subscriptions
CREATE POLICY "super_admins_view_all_subscriptions"
ON club_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

-- Only super admins can insert/update subscriptions (via Edge Functions)
CREATE POLICY "super_admins_manage_subscriptions"
ON club_subscriptions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

-- 8. RLS Policies for subscription_payments

-- Club admins can view their payment history
CREATE POLICY "club_admins_view_own_payments"
ON subscription_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.club_id = subscription_payments.club_id
      AND ur.role IN ('club_admin', 'super_admin')
  )
);

-- Super admins can view all payments
CREATE POLICY "super_admins_view_all_payments"
ON subscription_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

-- 9. Function to check subscription validity
CREATE OR REPLACE FUNCTION is_subscription_valid(p_club_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status subscription_status;
  v_expires_at TIMESTAMPTZ;
  v_grace_days INTEGER := 2;
BEGIN
  SELECT subscription_status, subscription_expires_at
  INTO v_status, v_expires_at
  FROM clubs
  WHERE id = p_club_id;

  -- Check if in valid state
  IF v_status IN ('trial', 'active') AND v_expires_at > NOW() THEN
    RETURN TRUE;
  END IF;

  -- Check if in grace period (2 days after expiry)
  IF v_expires_at IS NOT NULL AND v_expires_at + INTERVAL '2 days' > NOW() THEN
    -- Update status to grace_period
    UPDATE clubs SET subscription_status = 'grace_period' WHERE id = p_club_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to start free trial for new clubs
CREATE OR REPLACE FUNCTION start_club_trial(p_club_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE clubs
  SET 
    subscription_status = 'trial',
    subscription_expires_at = NOW() + INTERVAL '5 days',
    trial_used = true
  WHERE id = p_club_id AND trial_used = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger to auto-start trial for new clubs
CREATE OR REPLACE FUNCTION trigger_start_trial()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subscription_status := 'trial';
  NEW.subscription_expires_at := NOW() + INTERVAL '5 days';
  NEW.trial_used := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_club_created
  BEFORE INSERT ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_start_trial();
