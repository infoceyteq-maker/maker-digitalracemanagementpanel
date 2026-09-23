-- ==============================================================================
-- CEYTEQ DIGITAL RACE - SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA
-- Target Database: PostgreSQL 15+ (Supabase Cloud)
-- Connection Architecture:
--   1. Transaction Pooler (PgBouncer - Port 6543): 
--      DATABASE_URL="postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
--      Used for all Serverless Next.js App Router queries & Edge functions.
--   2. Direct Connection (Port 5432):
--      DIRECT_URL="postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
--      Used strictly for Schema Migrations, DDL & Idempotent Seeding.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'MASTER_ADMIN',
    'RESTAURANT_ADMIN',
    'KITCHEN_STAFF',
    'WAITER_STAFF'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM (
    'FREE',
    'PLUS',
    'PRO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_status AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'PENDING_VERIFICATION',
    'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE otp_channel AS ENUM (
    'EMAIL',
    'WHATSAPP',
    'DUAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE otp_purpose AS ENUM (
    'PASSWORD_RESET',
    'ACCOUNT_VERIFICATION',
    'MFA_LOGIN',
    'PRIVILEGED_ACTION'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. RESTAURANTS (TENANTS) TABLE
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  custom_domain_verified BOOLEAN DEFAULT FALSE,
  dns_status VARCHAR(50) DEFAULT 'NOT_CONFIGURED',
  dns_expected_cname VARCHAR(255) DEFAULT 'cname.ceyteq.com',
  
  -- Owner contact
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(50) NOT NULL,
  
  -- Subscription & Quotas
  tier subscription_tier NOT NULL DEFAULT 'PRO',
  status tenant_status NOT NULL DEFAULT 'ACTIVE',
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 129.00,
  
  -- Add-On Flags (Explicit Master Admin Toggles)
  has_ai_chatbot BOOLEAN NOT NULL DEFAULT TRUE,
  has_whatsapp_bot BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_phone_number_id VARCHAR(100),
  whatsapp_webhook_verify_token VARCHAR(255),
  
  -- Operational Details
  address TEXT NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'LKR',
  table_count INT NOT NULL DEFAULT 15,
  accent_color VARCHAR(50) DEFAULT '#00C8FF',
  logo_url TEXT,
  cover_image_url TEXT,
  delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  payment_gateway_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Staff PINs
  kitchen_pin VARCHAR(10) DEFAULT '2026',
  waiter_pin VARCHAR(10) DEFAULT '1122',
  
  -- Metrics
  total_views BIGINT NOT NULL DEFAULT 0,
  total_orders BIGINT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for subdomain and slug routing
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_subdomain ON public.restaurants(subdomain);
CREATE INDEX IF NOT EXISTS idx_restaurants_custom_domain ON public.restaurants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_email ON public.restaurants(owner_email);

-- 4. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'RESTAURANT_ADMIN',
  tier subscription_tier NOT NULL DEFAULT 'PRO',
  status tenant_status NOT NULL DEFAULT 'ACTIVE',
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret TEXT,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: Only MASTER_ADMIN can have NULL restaurant_id
  CONSTRAINT check_master_or_restaurant CHECK (
    (role = 'MASTER_ADMIN' AND restaurant_id IS NULL) OR
    (role != 'MASTER_ADMIN' AND restaurant_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON public.users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 5. TENANT SUBSCRIPTIONS & INVOICES
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL,
  monthly_fee NUMERIC(10, 2) NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  payment_method VARCHAR(50) DEFAULT 'STRIPE_CARD',
  has_ai_chatbot_addon BOOLEAN NOT NULL DEFAULT FALSE,
  has_whatsapp_bot_addon BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON public.tenant_subscriptions(restaurant_id);

-- 6. DUAL-CHANNEL OTP VERIFICATIONS (Zero-Trust Password Reset & MFA)
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  purpose otp_purpose NOT NULL DEFAULT 'PASSWORD_RESET',
  
  -- Dual Token Hashes
  email_otp_hash TEXT NOT NULL,
  phone_otp_hash TEXT NOT NULL,
  
  -- Verification state
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Attempt throttling (Upstash Redis backup)
  failed_attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  reset_token_hash TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_otp_user_id ON public.otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON public.otp_verifications(expires_at);

-- 7. AUDIT LOGS (Cybersecurity & Privileged Action Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255) NOT NULL,
  actor_role user_role NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_resource VARCHAR(100) NOT NULL,
  target_id VARCHAR(100),
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor_email ON public.audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Master Admin full access policy
CREATE POLICY "master_admin_full_access_restaurants" ON public.restaurants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'MASTER_ADMIN'
    )
  );

-- Restaurant Admin isolated access
CREATE POLICY "restaurant_admin_isolated_restaurants" ON public.restaurants
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT restaurant_id FROM public.users
      WHERE users.id = auth.uid()
    )
  );

-- Public read for customer menu via slug/subdomain
CREATE POLICY "public_read_active_restaurants" ON public.restaurants
  FOR SELECT
  TO anon
  USING (status = 'ACTIVE');

-- 9. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
