-- ==============================================================================
-- CEYTEQ ENTERPRISE ECOSYSTEM - SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA
-- Platforms:
--   1. Digital Race: Restaurant Management System & Digital Menu
--   2. TasteTrip: Food Delivery and Order Management Application
-- Target Database: PostgreSQL 15+ (Supabase Cloud)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'SUPER_MASTER_ADMIN',
    'DIGITAL_RACE_MASTER',
    'TASTETRIP_MASTER',
    'DIVISION_ADMIN',
    'RESTAURANT_ADMIN',
    'KITCHEN_STAFF',
    'WAITER_STAFF',
    'DELIVERY_PARTNER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE platform_branch AS ENUM (
    'DIGITAL_RACE',
    'TASTETRIP'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE division AS ENUM (
    'UP_COUNTRY',
    'SOUTH',
    'WESTERN',
    'NORTH'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE province AS ENUM (
    'CENTRAL',
    'UVA',
    'SABARAGAMUWA',
    'SOUTHERN',
    'EASTERN',
    'WESTERN',
    'NORTH_WESTERN',
    'NORTHERN',
    'NORTH_CENTRAL'
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
  CREATE TYPE otp_purpose AS ENUM (
    'PASSWORD_RESET',
    'ACCOUNT_VERIFICATION',
    'MFA_LOGIN',
    'PRIVILEGED_ACTION',
    'DIVISION_RESET'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. RESTAURANTS / STORES (TENANTS TABLE)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  custom_domain_verified BOOLEAN DEFAULT FALSE,
  dns_status VARCHAR(50) DEFAULT 'NOT_CONFIGURED',
  dns_expected_cname VARCHAR(255) DEFAULT 'cname.ceyteq.com',
  
  -- Geographic Partitioning & Platform Branch
  platform_branch platform_branch NOT NULL DEFAULT 'DIGITAL_RACE',
  division division NOT NULL DEFAULT 'WESTERN',
  province province NOT NULL DEFAULT 'WESTERN',
  city VARCHAR(100) NOT NULL DEFAULT 'Colombo',
  address TEXT NOT NULL,

  -- Owner contact
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(50) NOT NULL,
  
  -- Subscription & Quotas
  tier subscription_tier NOT NULL DEFAULT 'PRO',
  status tenant_status NOT NULL DEFAULT 'ACTIVE',
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 129.00,
  
  -- Add-On Flags
  has_ai_chatbot BOOLEAN NOT NULL DEFAULT TRUE,
  has_whatsapp_bot BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_phone_number_id VARCHAR(100),
  whatsapp_webhook_verify_token VARCHAR(255),
  
  -- Operational Details
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

CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_subdomain ON public.restaurants(subdomain);
CREATE INDEX IF NOT EXISTS idx_restaurants_platform_branch ON public.restaurants(platform_branch);
CREATE INDEX IF NOT EXISTS idx_restaurants_division ON public.restaurants(division);
CREATE INDEX IF NOT EXISTS idx_restaurants_province ON public.restaurants(province);

-- 4. USERS TABLE (ENTERPRISE RBAC)
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
  platform_branch platform_branch,

  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret TEXT,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON public.users(restaurant_id);

-- 5. DIVISION ASSIGNMENTS (GEOGRAPHIC PARTITIONING FOR LEVEL 3 ADMINS)
CREATE TABLE IF NOT EXISTS public.division_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  platform_branch platform_branch NOT NULL,
  division division NOT NULL,
  allowed_provinces province[] NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_division_assignments_user ON public.division_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_division_assignments_lookup ON public.division_assignments(platform_branch, division);

-- 6. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  role user_role NOT NULL,
  can_provision_branch BOOLEAN NOT NULL DEFAULT FALSE,
  can_provision_division BOOLEAN NOT NULL DEFAULT FALSE,
  can_provision_tenant BOOLEAN NOT NULL DEFAULT FALSE,
  can_reset_credentials BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_fleet BOOLEAN NOT NULL DEFAULT FALSE,
  can_configure_gateways BOOLEAN NOT NULL DEFAULT FALSE,
  global_bypass BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_role ON public.permissions(role);

-- 7. TENANT SUBSCRIPTIONS
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

-- 8. DUAL-CHANNEL OTP VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  purpose otp_purpose NOT NULL DEFAULT 'PASSWORD_RESET',
  email_otp_hash TEXT NOT NULL,
  phone_otp_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
  failed_attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  reset_token_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ
);

-- 9. AUDIT LOGS
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

-- 10. INVITATIONS & FIRST-TIME ACCESS TOKENS TABLE (HMAC-SHA256 24-HOUR EXPIRY)
CREATE TABLE IF NOT EXISTS public.account_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token_hash TEXT NOT NULL,
  role user_role NOT NULL,
  platform_branch platform_branch,
  division division,
  allowed_provinces province[],
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.account_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.account_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_role ON public.account_invitations(role);
CREATE INDEX IF NOT EXISTS idx_invitations_division ON public.account_invitations(division);

-- ==============================================================================
-- 11. POSTGRESQL ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.division_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_invitations ENABLE ROW LEVEL SECURITY;

-- POLICY 1: SUPER_MASTER_ADMIN (Level 1 Root System Supervisor)
-- Absolute bypass across all tables
CREATE POLICY "super_master_admin_all_restaurants" ON public.restaurants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'SUPER_MASTER_ADMIN'
    )
  );

CREATE POLICY "super_master_admin_all_users" ON public.users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid() AND u.role = 'SUPER_MASTER_ADMIN'
    )
  );

CREATE POLICY "super_master_admin_all_assignments" ON public.division_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'SUPER_MASTER_ADMIN'
    )
  );

-- POLICY 2: BRANCH MASTER ADMINS (Level 2: DIGITAL_RACE_MASTER & TASTETRIP_MASTER)
-- Full access to restaurants in their respective vertical only
CREATE POLICY "branch_master_admin_restaurants" ON public.restaurants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND (
        (users.role = 'DIGITAL_RACE_MASTER' AND restaurants.platform_branch = 'DIGITAL_RACE') OR
        (users.role = 'TASTETRIP_MASTER' AND restaurants.platform_branch = 'TASTETRIP')
      )
    )
  );

-- POLICY 3: REGIONAL DIVISION ADMINS (Level 3: Geographic Province Partitioning)
-- Division Admins can only view and manage restaurants within their assigned platform branch and provinces
CREATE POLICY "division_admin_province_restaurants" ON public.restaurants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.division_assignments da
      JOIN public.users u ON u.id = da.user_id
      WHERE u.id = auth.uid() 
        AND u.role = 'DIVISION_ADMIN'
        AND da.platform_branch = restaurants.platform_branch
        AND restaurants.province = ANY(da.allowed_provinces)
    )
  );

-- Division Admins can view users of restaurants in their assigned provinces
CREATE POLICY "division_admin_province_users" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.division_assignments da
      JOIN public.restaurants r ON r.id = users.restaurant_id
      WHERE da.user_id = auth.uid()
        AND da.platform_branch = r.platform_branch
        AND r.province = ANY(da.allowed_provinces)
    )
  );

-- POLICY 4: RESTAURANT ADMINS & STORE STAFF (Level 4: Tenant Isolation)
CREATE POLICY "restaurant_admin_isolated_restaurants" ON public.restaurants
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT restaurant_id FROM public.users
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY "restaurant_admin_isolated_users" ON public.users
  FOR SELECT TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.users
      WHERE users.id = auth.uid()
    )
  );

-- POLICY 5: PUBLIC ACCESS
-- Anonymous guests can query active restaurant menus and digital storefronts
CREATE POLICY "public_read_active_restaurants" ON public.restaurants
  FOR SELECT TO anon
  USING (status = 'ACTIVE');

-- 11. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER tr_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_users_updated_at ON public.users;
CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
