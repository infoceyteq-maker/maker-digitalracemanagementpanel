/**
 * ==============================================================================
 * CEYTEQ DIGITAL RACE - IDEMPOTENT MASTER ADMIN DATABASE SEED SCRIPT
 * Target: Supabase PostgreSQL (via DIRECT_URL port 5432 or pooled DATABASE_URL)
 * Executable via: `npx tsx scripts/seed.ts`
 * ==============================================================================
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const MASTER_ADMIN_EMAIL = 'Info.ceyteq@gmail.com';
const MASTER_ADMIN_PHONE = '+94768607143';
const MASTER_ADMIN_NAME = 'Ceyteq Root Master Supervisor';
const DEFAULT_INITIAL_PASSWORD = process.env.INITIAL_MASTER_PASSWORD || 'CeyteqMaster@2026!';

// Cryptographic Salted Hashing for Zero-Trust Baseline
function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

async function runMasterAdminSeed() {
  console.log('🚀 [SEED] Starting Ceyteq Master Admin verification & provisioning pipeline...');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  [SEED] SUPABASE_URL or SERVICE_KEY missing in environment.');
    console.log('ℹ️  [SEED] Outputting idempotent SQL statement for direct database execution instead:');
    printDirectSql();
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    // 1. Check if Master Admin already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, phone, role, status')
      .eq('email', MASTER_ADMIN_EMAIL)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [SEED] Query error checking user:', checkError.message);
      printDirectSql();
      return;
    }

    if (existingUser) {
      console.log(`✅ [SEED] Master Admin already provisioned: ${existingUser.email} (ID: ${existingUser.id})`);
      // Ensure phone and role are updated to root specification if needed
      if (existingUser.phone !== MASTER_ADMIN_PHONE || existingUser.role !== 'MASTER_ADMIN') {
        const { error: updateErr } = await supabase
          .from('users')
          .update({
            phone: MASTER_ADMIN_PHONE,
            role: 'MASTER_ADMIN',
            status: 'ACTIVE',
            is_email_verified: true,
            is_phone_verified: true
          })
          .eq('id', existingUser.id);

        if (!updateErr) {
          console.log(`🔄 [SEED] Synchronized Master Admin credentials: phone=${MASTER_ADMIN_PHONE}, role=MASTER_ADMIN`);
        }
      }
      return;
    }

    // 2. Insert new Root Master Admin
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(DEFAULT_INITIAL_PASSWORD, salt);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: MASTER_ADMIN_EMAIL,
        phone: MASTER_ADMIN_PHONE,
        name: MASTER_ADMIN_NAME,
        password_hash: `${salt}:${passwordHash}`,
        role: 'MASTER_ADMIN',
        tier: 'PRO',
        status: 'ACTIVE',
        is_email_verified: true,
        is_phone_verified: true,
        mfa_enabled: true,
        failed_login_attempts: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ [SEED] Failed to insert Master Admin:', insertError.message);
      printDirectSql();
    } else {
      console.log('🎉 [SEED] Root Master Admin successfully instantiated!');
      console.log(`   - Email:  ${newUser.email}`);
      console.log(`   - Phone:  ${newUser.phone}`);
      console.log(`   - Role:   ${newUser.role}`);
      console.log(`   - Status: ${newUser.status}`);
      console.log('   - Security: Zero-Trust Dual-Channel OTP enabled');
    }
  } catch (err: any) {
    console.error('❌ [SEED] Unexpected error:', err.message);
    printDirectSql();
  }
}

function printDirectSql() {
  console.log(`
-- ==============================================================================
-- IDEMPOTENT SQL SEED: Execute in Supabase SQL Editor
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
  '${MASTER_ADMIN_EMAIL}',
  '${MASTER_ADMIN_PHONE}',
  '${MASTER_ADMIN_NAME}',
  crypt('${DEFAULT_INITIAL_PASSWORD}', gen_salt('bf', 12)),
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
`);
}

// Run when called directly
runMasterAdminSeed();
