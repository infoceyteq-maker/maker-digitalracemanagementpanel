-- ==============================================================================
-- CEYTEQ DIGITAL RACE - ROOT MASTER ADMIN SQL SEED
-- Target: Supabase SQL Query Editor (Port 5432 or 6543)
-- Ensures Root Master Admin Info.ceyteq@gmail.com and +94768607143 is created
-- ==============================================================================

INSERT INTO public.users (
  email,
  phone,
  name,
  password_hash,
  role,
  tier,
  status,
  is_email_verified,
  is_phone_verified,
  mfa_enabled,
  failed_login_attempts
)
VALUES (
  'Info.ceyteq@gmail.com',
  '+94768607143',
  'Ceyteq Root Master Supervisor',
  crypt('CeyteqMaster@2026!', gen_salt('bf', 12)),
  'MASTER_ADMIN',
  'PRO',
  'ACTIVE',
  TRUE,
  TRUE,
  TRUE,
  0
)
ON CONFLICT (email) DO UPDATE SET
  phone = EXCLUDED.phone,
  role = 'MASTER_ADMIN',
  status = 'ACTIVE',
  is_email_verified = TRUE,
  is_phone_verified = TRUE;

-- Create default initial sample tenant only if none exist
INSERT INTO public.restaurants (
  name,
  slug,
  subdomain,
  owner_name,
  owner_email,
  owner_phone,
  tier,
  status,
  monthly_fee,
  has_ai_chatbot,
  has_whatsapp_bot,
  address,
  currency,
  table_count
)
SELECT 
  'Galle Fort Heritage Cafe',
  'galle-fort',
  'galle-fort',
  'Roshan Jayasuriya',
  'owner@gallefort.lk',
  '+94771234567',
  'PRO',
  'ACTIVE',
  129.00,
  TRUE,
  TRUE,
  'Church Street, Galle Fort, Sri Lanka',
  'LKR',
  20
WHERE NOT EXISTS (SELECT 1 FROM public.restaurants LIMIT 1);
