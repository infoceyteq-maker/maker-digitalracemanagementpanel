import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { credentialsService } from '@/lib/credentialsService';
import { getPostLoginRedirect } from '@/lib/invitationService';
import { DivisionId, SriLankanProvince, PlatformBranch } from '@/lib/rbacMatrix';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'SUPER_MASTER_ADMIN' | 'DIGITAL_RACE_MASTER' | 'TASTETRIP_MASTER' | 'DIVISION_ADMIN' | 'RESTAURANT_ADMIN';
      branch: PlatformBranch | 'ALL';
      divisionId?: DivisionId | null;
      allowedProvinces: SriLankanProvince[] | string[];
      tenantId?: string | null;
      redirectUrl: string;
      status: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_MASTER_ADMIN' | 'DIGITAL_RACE_MASTER' | 'TASTETRIP_MASTER' | 'DIVISION_ADMIN' | 'RESTAURANT_ADMIN';
    branch: PlatformBranch | 'ALL';
    divisionId?: DivisionId | null;
    allowedProvinces: SriLankanProvince[] | string[];
    tenantId?: string | null;
    status: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'SUPER_MASTER_ADMIN' | 'DIGITAL_RACE_MASTER' | 'TASTETRIP_MASTER' | 'DIVISION_ADMIN' | 'RESTAURANT_ADMIN';
    branch: PlatformBranch | 'ALL';
    divisionId?: DivisionId | null;
    allowedProvinces: SriLankanProvince[] | string[];
    tenantId?: string | null;
    redirectUrl: string;
    status: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Ceyteq Enterprise Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@ceyteq.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn('[AUTH_STEP: LOGIN_FAILED] Missing credentials');
          throw new Error('Email and password required');
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();
        console.log('[AUTH_STEP: LOGIN_ATTEMPT]', { email: normalizedEmail, timestamp: new Date().toISOString() });

        // 1. Check Root Super Master Admin
        const systemCreds = credentialsService.getCredentials();
        if (normalizedEmail === systemCreds.superAdminEmail.toLowerCase()) {
          const isSuperMatch =
            credentials.password === systemCreds.superAdminPassword ||
            (await bcrypt.compare(credentials.password, systemCreds.superAdminPassword).catch(() => false));

          console.log('[AUTH_STEP: BCRYPT_HASH_COMPARISON]', {
            target: 'SUPER_MASTER_ADMIN',
            email: normalizedEmail,
            match: isSuperMatch,
          });

          if (!isSuperMatch) {
            throw new Error('Invalid Super Master Admin credentials');
          }

          return {
            id: 'usr-super-root',
            email: systemCreds.superAdminEmail,
            name: 'Root System Supervisor (Ceyteq)',
            role: 'SUPER_MASTER_ADMIN',
            branch: 'ALL',
            divisionId: null,
            allowedProvinces: [
              'CENTRAL', 'UVA', 'SABARAGAMUWA', 'SOUTHERN', 'EASTERN', 'WESTERN', 'NORTH_WESTERN', 'NORTHERN', 'NORTH_CENTRAL',
            ],
            tenantId: null,
            status: 'ACTIVE',
          };
        }

        // 2. Check Enterprise Admins (Branch Masters & 8 Division Admins)
        const enterpriseAdmins = credentialsService.getEnterpriseAdmins();
        const foundAdmin = enterpriseAdmins.find((a) => a.email.toLowerCase() === normalizedEmail);

        if (foundAdmin) {
          if (foundAdmin.status !== 'ACTIVE') {
            console.warn('[AUTH_STEP: ACCOUNT_INACTIVE]', { email: normalizedEmail, status: foundAdmin.status });
            throw new Error(`Account is currently ${foundAdmin.status}. Please activate your account first.`);
          }

          // Compare password (supports bcrypt hash or legacy provisioned string)
          let isMatch = false;
          if (foundAdmin.password.startsWith('$2a$') || foundAdmin.password.startsWith('$2b$')) {
            isMatch = await bcrypt.compare(credentials.password, foundAdmin.password);
          } else {
            isMatch = credentials.password === foundAdmin.password;
          }

          console.log('[AUTH_STEP: BCRYPT_HASH_COMPARISON]', {
            role: foundAdmin.role,
            divisionId: foundAdmin.division,
            email: normalizedEmail,
            match: isMatch,
          });

          if (!isMatch) {
            throw new Error('Invalid credentials provided.');
          }

          return {
            id: foundAdmin.id,
            email: foundAdmin.email,
            name: foundAdmin.name,
            role: foundAdmin.role,
            branch: foundAdmin.platformBranch,
            divisionId: foundAdmin.division || null,
            allowedProvinces: foundAdmin.allowedProvinces,
            tenantId: null,
            status: foundAdmin.status,
          };
        }

        // 3. Check Restaurant Admins / Tenants
        const tenantPasswords = systemCreds.tenantPasswords;
        for (const [tenantId, tCred] of Object.entries(tenantPasswords)) {
          if (tCred.ownerEmail.toLowerCase() === normalizedEmail) {
            const isMatch =
              credentials.password === tCred.ownerPassword ||
              (await bcrypt.compare(credentials.password, tCred.ownerPassword).catch(() => false));

            console.log('[AUTH_STEP: BCRYPT_HASH_COMPARISON]', {
              role: 'RESTAURANT_ADMIN',
              tenantId,
              email: normalizedEmail,
              match: isMatch,
            });

            if (!isMatch) {
              throw new Error('Invalid restaurant owner credentials.');
            }

            return {
              id: `usr-tenant-${tenantId}`,
              email: tCred.ownerEmail,
              name: `Restaurant Owner (${tenantId})`,
              role: 'RESTAURANT_ADMIN',
              branch: 'DIGITAL_RACE',
              divisionId: null,
              allowedProvinces: [],
              tenantId,
              status: 'ACTIVE',
            };
          }
        }

        console.warn('[AUTH_STEP: USER_NOT_FOUND]', { email: normalizedEmail });
        throw new Error('No account found with this email address.');
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.branch = user.branch;
        token.divisionId = user.divisionId;
        token.allowedProvinces = user.allowedProvinces;
        token.tenantId = user.tenantId;
        token.status = user.status;
        token.redirectUrl = getPostLoginRedirect(user);

        console.log('[AUTH_STEP: SESSION_CREATION]', {
          email: token.email,
          role: token.role,
          branch: token.branch,
          divisionId: token.divisionId,
          redirectUrl: token.redirectUrl,
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.branch = token.branch;
        session.user.divisionId = token.divisionId;
        session.user.allowedProvinces = token.allowedProvinces;
        session.user.tenantId = token.tenantId;
        session.user.redirectUrl = token.redirectUrl;
        session.user.status = token.status;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'ceyteq_nextauth_jwt_super_secret_key_2026',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
