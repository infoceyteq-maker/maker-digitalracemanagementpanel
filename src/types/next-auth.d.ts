import { DefaultSession } from 'next-auth';
import { DivisionId, SriLankanProvince, PlatformBranch } from '../lib/rbacMatrix';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'SUPER_MASTER_ADMIN' | 'DIGITAL_RACE_MASTER' | 'TASTETRIP_MASTER' | 'DIVISION_ADMIN' | 'RESTAURANT_ADMIN';
      branch: PlatformBranch | 'ALL';
      divisionId: DivisionId | null;
      allowedProvinces: (SriLankanProvince | string)[];
      tenantId: string | null;
      status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'SUSPENDED';
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_MASTER_ADMIN' | 'DIGITAL_RACE_MASTER' | 'TASTETRIP_MASTER' | 'DIVISION_ADMIN' | 'RESTAURANT_ADMIN';
    branch: PlatformBranch | 'ALL';
    divisionId: DivisionId | null;
    allowedProvinces: (SriLankanProvince | string)[];
    tenantId: string | null;
    status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'SUSPENDED';
    passwordHash?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    email?: string;
    name?: string;
    role?: 'SUPER_MASTER_ADMIN' | 'DIGITAL_RACE_MASTER' | 'TASTETRIP_MASTER' | 'DIVISION_ADMIN' | 'RESTAURANT_ADMIN';
    branch?: PlatformBranch | 'ALL';
    divisionId?: DivisionId | null;
    allowedProvinces?: (SriLankanProvince | string)[];
    tenantId?: string | null;
    status?: 'ACTIVE' | 'PENDING_ACTIVATION' | 'SUSPENDED';
  }
}
