// ==============================================================================
// CEYTEQ ENTERPRISE ENVIRONMENT SCHEMA VALIDATION (ZOD)
// Target: Zero Runtime Failures on Vercel & Production Deployments
// ==============================================================================

import { z } from 'zod';

const envSchema = z.object({
  // Node Runtime
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Application & NextAuth
  NEXTAUTH_URL: z.string().url().default('https://maker-digitalracemanagementpanel.vercel.app'),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 characters long').default('ceyteq_production_nextauth_secret_key_2026_super_secure'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('https://maker-digitalracemanagementpanel.vercel.app'),

  // Supabase PostgreSQL
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://jhvqliimklxrxdwszzfk.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('sb_publishable_vOEZVjmVUuP7zj2TchK3dQ_2YD5bll7'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Upstash Redis (Distributed Rate Limiting)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Resend API (Email OTP)
  RESEND_API_KEY: z.string().optional(),

  // Meta WhatsApp Cloud API (Mobile OTP & Bot Webhooks)
  WHATSAPP_CLOUD_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),

  // Google AI Studio (Gemini API)
  GEMINI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ CRITICAL: Invalid Environment Configuration Detected:');
    console.error(JSON.stringify(result.error.format(), null, 2));

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid production environment variables. Aborting startup to prevent tenant breach.');
    }
    return envSchema.parse({
      ...process.env,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://maker-digitalracemanagementpanel.vercel.app',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'ceyteq_production_nextauth_secret_key_2026_super_secure',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://maker-digitalracemanagementpanel.vercel.app',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jhvqliimklxrxdwszzfk.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_vOEZVjmVUuP7zj2TchK3dQ_2YD5bll7',
    });
  }

  return result.data;
}

export const env = validateEnv();
