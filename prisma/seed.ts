// ==============================================================================
// CEYTEQ ENTERPRISE ECOSYSTEM - IDEMPOTENT DATABASE SEED SCRIPT
// Target: PostgreSQL 15+ (Prisma ORM / Supabase)
// Provisions: Root Super Master Admin & Default Divisions
// ==============================================================================

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://jhvqliimklxrxdwszzfk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_vOEZVjmVUuP7zj2TchK3dQ_2YD5bll7';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function seedDatabase() {
  console.log('[SEED_START] Initiating Ceyteq Enterprise Ecosystem Seed...');

  // 1. Seed Operational Divisions
  const divisions = [
    {
      id: 'UP_COUNTRY',
      name: 'Up Country Division',
      platform_branch: 'ALL',
      provinces: ['CENTRAL', 'UVA', 'SABARAGAMUWA'],
      regional_lead_email: 'samiranilan@gmail.com',
      regional_office_city: 'Kandy',
    },
    {
      id: 'SOUTH',
      name: 'Southern & Eastern Division',
      platform_branch: 'ALL',
      provinces: ['SOUTHERN', 'EASTERN'],
      regional_lead_email: 'south.admin@ceyteq.com',
      regional_office_city: 'Galle',
    },
    {
      id: 'WESTERN',
      name: 'Western & North Western Division',
      platform_branch: 'ALL',
      provinces: ['WESTERN', 'NORTH_WESTERN'],
      regional_lead_email: 'western.admin@ceyteq.com',
      regional_office_city: 'Colombo',
    },
    {
      id: 'NORTH',
      name: 'Northern & North Central Division',
      platform_branch: 'ALL',
      provinces: ['NORTHERN', 'NORTH_CENTRAL'],
      regional_lead_email: 'north.admin@ceyteq.com',
      regional_office_city: 'Jaffna',
    },
  ];

  for (const div of divisions) {
    const { error: divErr } = await supabase
      .from('divisions')
      .upsert(div, { onConflict: 'id' });

    if (divErr) {
      console.warn(`[SEED_WARN] Division upsert notice for ${div.id}:`, divErr.message);
    } else {
      console.log(`[SEED_SUCCESS] Division initialized: ${div.name}`);
    }
  }

  // 2. Hash Super Master Admin Password with 12 bcrypt salt rounds
  const rawSuperAdminPassword = process.env.SUPER_ADMIN_INITIAL_PASSWORD || 'admin@ceyteq2026';
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(rawSuperAdminPassword, salt);

  const superMasterAdmin = {
    email: 'info.ceyteq@gmail.com',
    phone: '+94768607143',
    name: 'Ceyteq Root System Supervisor',
    password_hash: passwordHash,
    role: 'SUPER_MASTER_ADMIN',
    branch: 'ALL',
    division_id: null,
    allowed_provinces: [
      'CENTRAL',
      'UVA',
      'SABARAGAMUWA',
      'SOUTHERN',
      'EASTERN',
      'WESTERN',
      'NORTH_WESTERN',
      'NORTHERN',
      'NORTH_CENTRAL',
    ],
    tenant_id: null,
    status: 'ACTIVE',
    is_email_verified: true,
    is_phone_verified: true,
    mfa_enabled: true,
  };

  const { data: user, error: userErr } = await supabase
    .from('users')
    .upsert(superMasterAdmin, { onConflict: 'email' })
    .select('id, email, role, status')
    .single();

  if (userErr) {
    console.error('[SEED_ERROR] Failed to seed Super Master Admin:', userErr);
  } else {
    console.log('[SEED_SUCCESS] Super Master Admin provisioned successfully:', user);
  }

  console.log('[SEED_COMPLETE] Ecosystem initialization finished.');
}

// Execute if run directly via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch((err) => {
    console.error('[SEED_FATAL] Error running seed script:', err);
    process.exit(1);
  });
}
