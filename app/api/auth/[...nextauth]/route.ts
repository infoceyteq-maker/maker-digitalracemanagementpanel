import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { credentialsService } from '@/src/lib/credentialsService';
import { DivisionId, SriLankanProvince, PlatformBranch } from '@/src/lib/rbacMatrix';

// ==============================================================================
// CEYTEQ ENTERPRISE ACCESS ARCHITECTURE: NEXTAUTH CONFIGURATION
// Multi-Tier RBAC, Division Geographic Boundaries & Tenant Isolation
// ==============================================================================

// Supabase Cloud Admin Connection
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://jhvqliimklxrxdwszzfk.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_vOEZVjmVUuP7zj2TchK3dQ_2YD5bll7';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'ceyteq_production_nextauth_secret_key_2026_super_secure',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/auth/activate',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Corporate Credentials',
      credentials: {
        email: { label: 'Corporate Email', type: 'email', placeholder: 'admin@ceyteq.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn('[AUTH_PASSWORD_HASH_CHECK] Missing credentials payload');
          throw new Error('Please enter both your corporate email and password.');
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();
        console.log(`[AUTH_PASSWORD_HASH_CHECK] Verifying credentials for email: ${normalizedEmail}`);

        let userRecord: any = null;

        // 1. Query Supabase users table with joined division assignments
        try {
          const { data: dbUser, error } = await supabase
            .from('users')
            .select(`
              id,
              email,
              name,
              password_hash,
              role,
              platform_branch,
              restaurant_id,
              status,
              is_email_verified,
              failed_login_attempts,
              locked_until,
              division_assignments (
                division,
                allowed_provinces
              )
            `)
            .eq('email', normalizedEmail)
            .maybeSingle();

          if (dbUser && !error) {
            const assignment = Array.isArray(dbUser.division_assignments)
              ? dbUser.division_assignments[0]
              : dbUser.division_assignments;

            userRecord = {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              passwordHash: dbUser.password_hash,
              role: dbUser.role,
              branch: dbUser.platform_branch || 'ALL',
              divisionId: assignment?.division || null,
              allowedProvinces: assignment?.allowed_provinces || [],
              tenantId: dbUser.restaurant_id || null,
              status: dbUser.status || 'ACTIVE',
              failedAttempts: dbUser.failed_login_attempts || 0,
              lockedUntil: dbUser.locked_until ? new Date(dbUser.locked_until).getTime() : undefined,
            };
          }
        } catch (dbErr) {
          console.warn('[AUTH_PASSWORD_HASH_CHECK] Supabase query notice (falling back to credentials store):', dbErr);
        }

        // 2. Fallback to Local / Enterprise Credential Registry
        if (!userRecord) {
          const accountLookup = credentialsService.findAccountByEmail(normalizedEmail);
          const creds = credentialsService.getCredentials();

          if (normalizedEmail === creds.superAdminEmail.toLowerCase()) {
            userRecord = {
              id: 'usr-super-root',
              email: creds.superAdminEmail,
              name: 'Ceyteq Root System Supervisor',
              passwordHash: creds.superAdminPassword, // Will support both bcrypt and raw password check
              role: 'SUPER_MASTER_ADMIN',
              branch: 'ALL',
              divisionId: null,
              allowedProvinces: ['CENTRAL', 'UVA', 'SABARAGAMUWA', 'SOUTHERN', 'EASTERN', 'WESTERN', 'NORTH_WESTERN', 'NORTHERN', 'NORTH_CENTRAL'],
              tenantId: null,
              status: 'ACTIVE',
            };
          } else if (accountLookup.accountType === 'ENTERPRISE_ADMIN' && accountLookup.record) {
            const adm = accountLookup.record;
            userRecord = {
              id: adm.id,
              email: adm.email,
              name: adm.name,
              passwordHash: adm.password,
              role: adm.role === 'SUPER_ADMIN' ? 'SUPER_MASTER_ADMIN' : adm.role,
              branch: adm.platformBranch || 'DIGITAL_RACE',
              divisionId: adm.division || null,
              allowedProvinces: adm.allowedProvinces || [],
              tenantId: null,
              status: adm.status || 'ACTIVE',
            };
          } else if (accountLookup.accountType === 'RESTAURANT_OWNER' && accountLookup.record) {
            const tCred = accountLookup.record;
            userRecord = {
              id: `usr-${tCred.tenantId}`,
              email: tCred.ownerEmail,
              name: 'Restaurant Administrator',
              passwordHash: tCred.ownerPassword,
              role: 'RESTAURANT_ADMIN',
              branch: 'DIGITAL_RACE',
              divisionId: null,
              allowedProvinces: [],
              tenantId: tCred.tenantId,
              status: 'ACTIVE',
            };
          }
        }

        // 3. User Existence Validation
        if (!userRecord) {
          console.warn(`[AUTH_PASSWORD_HASH_CHECK] User not found for email: ${normalizedEmail}`);
          throw new Error('Invalid credentials. Please verify your email and password.');
        }

        // 4. Check Account Lifecycle Status
        if (userRecord.status === 'PENDING_ACTIVATION' || userRecord.status === 'PENDING_VERIFICATION') {
          console.warn(`[AUTH_PASSWORD_HASH_CHECK] Account pending activation: ${normalizedEmail}`);
          throw new Error('Account not activated. Please use the activation link sent to your email/phone.');
        }

        if (userRecord.status === 'SUSPENDED') {
          console.warn(`[AUTH_PASSWORD_HASH_CHECK] Suspended account access attempt: ${normalizedEmail}`);
          throw new Error('Account is suspended. Please contact Ceyteq system administrator.');
        }

        // 5. Account Lockout Check
        if (userRecord.lockedUntil && Date.now() < userRecord.lockedUntil) {
          const remainingSec = Math.ceil((userRecord.lockedUntil - Date.now()) / 1000);
          console.warn(`[AUTH_PASSWORD_HASH_CHECK] Account locked: ${normalizedEmail}, remaining: ${remainingSec}s`);
          throw new Error(`Account temporarily locked due to excessive failed attempts. Please retry in ${remainingSec} seconds.`);
        }

        // 6. Password Hash Check (Supports Bcrypt 12 rounds and fallback direct match)
        let isPasswordValid = false;

        if (userRecord.passwordHash.startsWith('$2a$') || userRecord.passwordHash.startsWith('$2b$') || userRecord.passwordHash.startsWith('$2y$')) {
          isPasswordValid = await bcrypt.compare(credentials.password, userRecord.passwordHash);
        } else {
          // Direct fallback match (for plain mock/dev credentials)
          isPasswordValid = credentials.password === userRecord.passwordHash;
        }

        if (!isPasswordValid) {
          console.warn(`[AUTH_PASSWORD_HASH_CHECK] Invalid password for: ${normalizedEmail}`);
          throw new Error('Invalid credentials. Please check your password or use "Forgot Password" to reset.');
        }

        console.log(`[AUTH_PASSWORD_HASH_CHECK] Password verified successfully for: ${normalizedEmail}`);

        // Return enriched user object for JWT callback
        return {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          role: userRecord.role,
          branch: userRecord.branch,
          divisionId: userRecord.divisionId,
          allowedProvinces: userRecord.allowedProvinces,
          tenantId: userRecord.tenantId,
          status: userRecord.status,
        };
      },
    }),
  ],
  callbacks: {
    // --------------------------------------------------------------------------
    // JWT Enrichment Callback: Strict Injection of Geographic & Tenant Metadata
    // --------------------------------------------------------------------------
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.branch = user.branch;
        token.divisionId = user.divisionId;
        token.allowedProvinces = user.allowedProvinces;
        token.tenantId = user.tenantId;
        token.status = user.status;

        console.log('[AUTH_SESSION_CREATED]', {
          email: token.email,
          role: token.role,
          branch: token.branch,
          divisionId: token.divisionId,
          tenantId: token.tenantId,
          timestamp: new Date().toISOString(),
        });
      }
      return token;
    },

    // --------------------------------------------------------------------------
    // Session Enrichment Callback: Injects Metadata into Client-Side Session
    // --------------------------------------------------------------------------
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id || '';
        session.user.email = token.email || session.user.email || '';
        session.user.name = token.name || session.user.name || '';
        session.user.role = token.role || 'DIVISION_ADMIN';
        session.user.branch = token.branch || 'ALL';
        session.user.divisionId = token.divisionId || null;
        session.user.allowedProvinces = token.allowedProvinces || [];
        session.user.tenantId = token.tenantId || null;
        session.user.status = token.status || 'ACTIVE';
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
