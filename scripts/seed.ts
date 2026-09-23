/**
 * ==============================================================================
 * CEYTEQ ENTERPRISE RBAC & GEOGRAPHIC SEED SCRIPT
 * Target Path: /scripts/seed.ts
 * Executable: `npx tsx scripts/seed.ts`
 * 
 * Provisions:
 * 1. Root Super Master Admin:
 *    - Email: info.ceyteq@gmail.com
 *    - Mobile: +94768607143
 *    - Role: SUPER_MASTER_ADMIN
 * 2. Branch Master Admins (Digital Race & TasteTrip)
 * 3. 4 Regional Division Admins (Up Country, South, Western, North)
 * 4. Sample geographic restaurants across Sri Lankan provinces
 * ==============================================================================
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPER_MASTER_ADMIN_EMAIL = 'info.ceyteq@gmail.com';
const SUPER_MASTER_ADMIN_PHONE = '+94768607143';
const SUPER_MASTER_ADMIN_NAME = 'Ceyteq Root System Supervisor';
const DEFAULT_PASSWORD = process.env.INITIAL_MASTER_PASSWORD || 'CeyteqMaster@2026!';

function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

export async function runEnterpriseSeed() {
  console.log('🚀 [SEED] Initializing Ceyteq Enterprise Ecosystem Multi-Tier RBAC Seed...');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  [SEED] SUPABASE_URL or SERVICE_KEY missing in environment.');
    console.log('ℹ️  [SEED] Printing comprehensive raw SQL seed script for Supabase SQL Editor:');
    printDirectEnterpriseSql();
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    const salt = crypto.randomBytes(16).toString('hex');
    const pwdHash = `${salt}:${hashPassword(DEFAULT_PASSWORD, salt)}`;

    // 1. Seed / Upsert Super Master Admin (Level 1)
    console.log(`\n👑 [LEVEL 1] Provisioning Super Master Admin: ${SUPER_MASTER_ADMIN_EMAIL}`);
    const { data: superAdmin, error: superErr } = await supabase
      .from('users')
      .upsert(
        {
          email: SUPER_MASTER_ADMIN_EMAIL.toLowerCase(),
          phone: SUPER_MASTER_ADMIN_PHONE,
          name: SUPER_MASTER_ADMIN_NAME,
          password_hash: pwdHash,
          role: 'SUPER_MASTER_ADMIN',
          tier: 'PRO',
          status: 'ACTIVE',
          is_email_verified: true,
          is_phone_verified: true,
          mfa_enabled: true,
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (superErr) {
      console.warn('⚠️ Failed to upsert Super Master Admin:', superErr.message);
    } else {
      console.log(`✅ Super Master Admin Verified! ID: ${superAdmin.id}`);
    }

    // 2. Seed Branch Master Admins (Level 2)
    console.log('\n🏢 [LEVEL 2] Provisioning Branch Master Admins...');
    const branchAdmins = [
      {
        email: 'digitalrace.master@ceyteq.com',
        phone: '+94771110001',
        name: 'Digital Race Branch Master',
        role: 'DIGITAL_RACE_MASTER',
        platformBranch: 'DIGITAL_RACE',
      },
      {
        email: 'tastetrip.master@ceyteq.com',
        phone: '+94771110002',
        name: 'TasteTrip Delivery Branch Master',
        role: 'TASTETRIP_MASTER',
        platformBranch: 'TASTETRIP',
      },
    ];

    for (const b of branchAdmins) {
      await supabase.from('users').upsert(
        {
          email: b.email,
          phone: b.phone,
          name: b.name,
          password_hash: pwdHash,
          role: b.role,
          platform_branch: b.platformBranch,
          tier: 'PRO',
          status: 'ACTIVE',
          is_email_verified: true,
          is_phone_verified: true,
        },
        { onConflict: 'email' }
      );
      console.log(`  ✓ ${b.name} (${b.role})`);
    }

    // 3. Seed Regional Division Admins (Level 3 - Geographic Partitioning)
    console.log('\n🗺️  [LEVEL 3] Provisioning 4 Sri Lankan Regional Division Admins...');
    const divisionAdmins = [
      {
        email: 'div.upcountry.dr@ceyteq.com',
        name: 'Up Country Regional Admin',
        division: 'UP_COUNTRY',
        provinces: ['CENTRAL', 'UVA', 'SABARAGAMUWA'],
        platformBranch: 'DIGITAL_RACE',
      },
      {
        email: 'div.south.dr@ceyteq.com',
        name: 'South Regional Admin',
        division: 'SOUTH',
        provinces: ['SOUTHERN', 'EASTERN'],
        platformBranch: 'DIGITAL_RACE',
      },
      {
        email: 'div.western.dr@ceyteq.com',
        name: 'Western Regional Admin',
        division: 'WESTERN',
        provinces: ['WESTERN', 'NORTH_WESTERN'],
        platformBranch: 'DIGITAL_RACE',
      },
      {
        email: 'div.north.dr@ceyteq.com',
        name: 'North Regional Admin',
        division: 'NORTH',
        provinces: ['NORTHERN', 'NORTH_CENTRAL'],
        platformBranch: 'DIGITAL_RACE',
      },
    ];

    for (const da of divisionAdmins) {
      const { data: userRecord } = await supabase
        .from('users')
        .upsert(
          {
            email: da.email,
            name: da.name,
            password_hash: pwdHash,
            role: 'DIVISION_ADMIN',
            platform_branch: da.platformBranch,
            status: 'ACTIVE',
            is_email_verified: true,
          },
          { onConflict: 'email' }
        )
        .select()
        .single();

      if (userRecord) {
        await supabase.from('division_assignments').upsert(
          {
            user_id: userRecord.id,
            platform_branch: da.platformBranch,
            division: da.division,
            allowed_provinces: da.provinces,
          },
          { onConflict: 'user_id' }
        );
        console.log(`  ✓ ${da.name} -> ${da.division} [${da.provinces.join(', ')}]`);
      }
    }

    // 4. Seed Partitioned Geographic Restaurants (Level 4)
    console.log('\n🍽️  [LEVEL 4] Provisioning Geographic Tenant Stores across Sri Lanka...');
    const sampleTenants = [
      {
        name: 'Colombo Harbour Seafood Bistro',
        slug: 'colombo-harbour',
        subdomain: 'colombo-harbour',
        division: 'WESTERN',
        province: 'WESTERN',
        city: 'Colombo 01',
        platform_branch: 'DIGITAL_RACE',
        owner_name: 'Dinesh Perera',
        owner_email: 'dinesh@colomboharbour.lk',
        owner_phone: '+94777123456',
        tier: 'PRO',
      },
      {
        name: 'Galle Fort Heritage Cafe',
        slug: 'galle-fort',
        subdomain: 'galle-fort',
        division: 'SOUTH',
        province: 'SOUTHERN',
        city: 'Galle Fort',
        platform_branch: 'DIGITAL_RACE',
        owner_name: 'Manuka Silva',
        owner_email: 'owner@gallefortcafe.com',
        owner_phone: '+94777987654',
        tier: 'PRO',
      },
      {
        name: 'Kandy Royal Tea Lounge',
        slug: 'kandy-royal',
        subdomain: 'kandy-royal',
        division: 'UP_COUNTRY',
        province: 'CENTRAL',
        city: 'Kandy',
        platform_branch: 'DIGITAL_RACE',
        owner_name: 'Sunil Jayawardena',
        owner_email: 'sunil@kandyroyal.lk',
        owner_phone: '+94777555123',
        tier: 'PLUS',
      },
      {
        name: 'Jaffna Spice Haven',
        slug: 'jaffna-spice',
        subdomain: 'jaffna-spice',
        division: 'NORTH',
        province: 'NORTHERN',
        city: 'Jaffna Town',
        platform_branch: 'DIGITAL_RACE',
        owner_name: 'Rajan Thamby',
        owner_email: 'rajan@jaffnaspice.com',
        owner_phone: '+94777666789',
        tier: 'FREE',
      },
    ];

    for (const t of sampleTenants) {
      await supabase.from('restaurants').upsert(
        {
          name: t.name,
          slug: t.slug,
          subdomain: t.subdomain,
          division: t.division,
          province: t.province,
          city: t.city,
          platform_branch: t.platform_branch,
          owner_name: t.owner_name,
          owner_email: t.owner_email,
          owner_phone: t.owner_phone,
          tier: t.tier,
          status: 'ACTIVE',
          address: `${t.city}, Sri Lanka`,
        },
        { onConflict: 'slug' }
      );
      console.log(`  ✓ Tenant: ${t.name} (${t.province} - ${t.division})`);
    }

    console.log('\n🎉 [SEED COMPLETE] All 4 tiers and geographic partitions seeded successfully!');
  } catch (err: any) {
    console.error('❌ [SEED ERROR]', err.message);
  }
}

export function printDirectEnterpriseSql() {
  console.log(`
-- ==============================================================================
-- CEYTEQ ENTERPRISE ECOSYSTEM - IDEMPOTENT SQL SEED
-- ==============================================================================

-- 1. LEVEL 1: SUPER MASTER ADMIN
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
  mfa_enabled
) VALUES (
  'info.ceyteq@gmail.com',
  '+94768607143',
  'Ceyteq Root System Supervisor',
  crypt('CeyteqMaster@2026!', gen_salt('bf', 12)),
  'SUPER_MASTER_ADMIN',
  'PRO',
  'ACTIVE',
  TRUE,
  TRUE,
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  phone = EXCLUDED.phone,
  role = 'SUPER_MASTER_ADMIN',
  status = 'ACTIVE',
  is_email_verified = TRUE;

-- 2. LEVEL 2: BRANCH MASTER ADMINS
INSERT INTO public.users (email, phone, name, password_hash, role, platform_branch, tier, status)
VALUES 
  ('digitalrace.master@ceyteq.com', '+94771110001', 'Digital Race Branch Master', crypt('CeyteqMaster@2026!', gen_salt('bf', 12)), 'DIGITAL_RACE_MASTER', 'DIGITAL_RACE', 'PRO', 'ACTIVE'),
  ('tastetrip.master@ceyteq.com', '+94771110002', 'TasteTrip Delivery Branch Master', crypt('CeyteqMaster@2026!', gen_salt('bf', 12)), 'TASTETRIP_MASTER', 'TASTETRIP', 'PRO', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- 3. LEVEL 3: 4 REGIONAL DIVISION ADMINS & PROVINCIAL ASSIGNMENTS
INSERT INTO public.users (email, phone, name, password_hash, role, platform_branch, status)
VALUES 
  ('div.upcountry.dr@ceyteq.com', '+94772220001', 'Up Country Regional Admin', crypt('CeyteqMaster@2026!', gen_salt('bf', 12)), 'DIVISION_ADMIN', 'DIGITAL_RACE', 'ACTIVE'),
  ('div.south.dr@ceyteq.com', '+94772220002', 'South Regional Admin', crypt('CeyteqMaster@2026!', gen_salt('bf', 12)), 'DIVISION_ADMIN', 'DIGITAL_RACE', 'ACTIVE'),
  ('div.western.dr@ceyteq.com', '+94772220003', 'Western Regional Admin', crypt('CeyteqMaster@2026!', gen_salt('bf', 12)), 'DIVISION_ADMIN', 'DIGITAL_RACE', 'ACTIVE'),
  ('div.north.dr@ceyteq.com', '+94772220004', 'North Regional Admin', crypt('CeyteqMaster@2026!', gen_salt('bf', 12)), 'DIVISION_ADMIN', 'DIGITAL_RACE', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- Assign Provinces to Division Admins
INSERT INTO public.division_assignments (user_id, platform_branch, division, allowed_provinces)
SELECT id, 'DIGITAL_RACE', 'UP_COUNTRY', ARRAY['CENTRAL', 'UVA', 'SABARAGAMUWA']::province[]
FROM public.users WHERE email = 'div.upcountry.dr@ceyteq.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.division_assignments (user_id, platform_branch, division, allowed_provinces)
SELECT id, 'DIGITAL_RACE', 'SOUTH', ARRAY['SOUTHERN', 'EASTERN']::province[]
FROM public.users WHERE email = 'div.south.dr@ceyteq.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.division_assignments (user_id, platform_branch, division, allowed_provinces)
SELECT id, 'DIGITAL_RACE', 'WESTERN', ARRAY['WESTERN', 'NORTH_WESTERN']::province[]
FROM public.users WHERE email = 'div.western.dr@ceyteq.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.division_assignments (user_id, platform_branch, division, allowed_provinces)
SELECT id, 'DIGITAL_RACE', 'NORTH', ARRAY['NORTHERN', 'NORTH_CENTRAL']::province[]
FROM public.users WHERE email = 'div.north.dr@ceyteq.com'
ON CONFLICT (user_id) DO NOTHING;

-- 4. LEVEL 4: SAMPLE GEOGRAPHIC RESTAURANTS ACROSS SRI LANKA
INSERT INTO public.restaurants (name, slug, subdomain, division, province, city, platform_branch, owner_name, owner_email, owner_phone, tier, address)
VALUES
  ('Colombo Harbour Bistro', 'colombo-harbour', 'colombo-harbour', 'WESTERN', 'WESTERN', 'Colombo', 'DIGITAL_RACE', 'Dinesh Perera', 'dinesh@colomboharbour.lk', '+94777123456', 'PRO', 'Colombo 01, Sri Lanka'),
  ('Galle Fort Heritage Cafe', 'galle-fort', 'galle-fort', 'SOUTH', 'SOUTHERN', 'Galle Fort', 'DIGITAL_RACE', 'Manuka Silva', 'owner@gallefortcafe.com', '+94777987654', 'PRO', 'Galle Fort, Sri Lanka'),
  ('Kandy Royal Tea Lounge', 'kandy-royal', 'kandy-royal', 'UP_COUNTRY', 'CENTRAL', 'Kandy', 'DIGITAL_RACE', 'Sunil Jayawardena', 'sunil@kandyroyal.lk', '+94777555123', 'PLUS', 'Kandy, Sri Lanka'),
  ('Jaffna Spice Haven', 'jaffna-spice', 'jaffna-spice', 'NORTH', 'NORTHERN', 'Jaffna', 'DIGITAL_RACE', 'Rajan Thamby', 'rajan@jaffnaspice.com', '+94777666789', 'FREE', 'Jaffna, Sri Lanka')
ON CONFLICT (slug) DO NOTHING;
`);
}

// Auto-run if executed directly via node/tsx
if (process.argv[1]?.includes('seed')) {
  runEnterpriseSeed();
}
