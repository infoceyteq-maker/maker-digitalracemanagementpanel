// ==============================================================================
// CEYTEQ ENTERPRISE CREDENTIALS & RBAC HIERARCHY SERVICE
// Manages distinct, customizable credentials for:
// - Level 1: Super Master Admin (Root System Supervisor)
// - Level 2: Digital Race Master Admin & TasteTrip Master Admin
// - Level 3: 8 Regional Division Admins (Up Country, South, Western, North)
// - Level 4: Restaurant Admins, Kitchen staff, Waiter staff
// ==============================================================================

import { DivisionId, SriLankanProvince, PlatformBranch } from './rbacMatrix';

export interface EnterpriseAdminRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'SUPER_MASTER_ADMIN' | 'DIGITAL_RACE_MASTER' | 'TASTETRIP_MASTER' | 'DIVISION_ADMIN';
  platformBranch: PlatformBranch;
  division?: DivisionId;
  allowedProvinces: SriLankanProvince[];
  permissions: {
    canProvisionTenants: boolean;
    canResetCredentials: boolean;
    canManageFleet: boolean;
    canConfigureAddons: boolean;
    canAccessGlobalConfig: boolean;
  };
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  lastLogin?: string;
  createdAt: string;
}

export interface RoleCredentials {
  superAdminEmail: string;
  superAdminPhone: string;
  superAdminPassword: string;
  defaultKitchenPin: string;
  defaultWaiterPin: string;
  enterpriseAdmins: EnterpriseAdminRecord[];
  tenantPasswords: Record<
    string,
    {
      ownerEmail: string;
      ownerPassword: string;
      kitchenPin: string;
      waiterPin: string;
    }
  >;
}

const STORAGE_KEY = 'ceyteq_credentials_v4';

export const INITIAL_ENTERPRISE_ADMINS: EnterpriseAdminRecord[] = [
  // --------------------------------------------------------------------------
  // LEVEL 2A: DIGITAL RACE MASTER ADMIN
  // --------------------------------------------------------------------------
  {
    id: 'adm-dr-master',
    name: 'Digital Race Master Admin',
    email: 'digitalrace.master@ceyteq.com',
    phone: '+94771110001',
    password: 'DigitalRace@2026!',
    role: 'DIGITAL_RACE_MASTER',
    platformBranch: 'DIGITAL_RACE',
    allowedProvinces: [
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
    permissions: {
      canProvisionTenants: true,
      canResetCredentials: true,
      canManageFleet: false,
      canConfigureAddons: true,
      canAccessGlobalConfig: true,
    },
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z',
  },

  // --------------------------------------------------------------------------
  // LEVEL 2B: TASTETRIP MASTER ADMIN
  // --------------------------------------------------------------------------
  {
    id: 'adm-tt-master',
    name: 'TasteTrip Delivery Master Admin',
    email: 'tastetrip.master@ceyteq.com',
    phone: '+94771110002',
    password: 'TasteTrip@2026!',
    role: 'TASTETRIP_MASTER',
    platformBranch: 'TASTETRIP',
    allowedProvinces: [
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
    permissions: {
      canProvisionTenants: true,
      canResetCredentials: true,
      canManageFleet: true,
      canConfigureAddons: true,
      canAccessGlobalConfig: true,
    },
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z',
  },

  // --------------------------------------------------------------------------
  // LEVEL 3: 4 REGIONAL DIVISION ADMINS UNDER DIGITAL RACE
  // --------------------------------------------------------------------------
  {
    id: 'adm-dr-div-upcountry',
    name: 'Up Country Division Admin (Digital Race)',
    email: 'div.upcountry.dr@ceyteq.com',
    phone: '+94772220001',
    password: 'UpCountry@DR2026!',
    role: 'DIVISION_ADMIN',
    platformBranch: 'DIGITAL_RACE',
    division: 'UP_COUNTRY',
    allowedProvinces: ['CENTRAL', 'UVA', 'SABARAGAMUWA'],
    permissions: {
      canProvisionTenants: true,
      canResetCredentials: true,
      canManageFleet: false,
      canConfigureAddons: false,
      canAccessGlobalConfig: false,
    },
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'adm-dr-div-south',
    name: 'South Division Admin (Digital Race)',
    email: 'div.south.dr@ceyteq.com',
    phone: '+94772220002',
    password: 'South@DR2026!',
    role: 'DIVISION_ADMIN',
    platformBranch: 'DIGITAL_RACE',
    division: 'SOUTH',
    allowedProvinces: ['SOUTHERN', 'EASTERN'],
    permissions: {
      canProvisionTenants: true,
      canResetCredentials: true,
      canManageFleet: false,
      canConfigureAddons: false,
      canAccessGlobalConfig: false,
    },
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'adm-dr-div-western',
    name: 'Western Division Admin (Digital Race)',
    email: 'div.western.dr@ceyteq.com',
    phone: '+94772220003',
    password: 'Western@DR2026!',
    role: 'DIVISION_ADMIN',
    platformBranch: 'DIGITAL_RACE',
    division: 'WESTERN',
    allowedProvinces: ['WESTERN', 'NORTH_WESTERN'],
    permissions: {
      canProvisionTenants: true,
      canResetCredentials: true,
      canManageFleet: false,
      canConfigureAddons: false,
      canAccessGlobalConfig: false,
    },
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'adm-dr-div-north',
    name: 'North Division Admin (Digital Race)',
    email: 'div.north.dr@ceyteq.com',
    phone: '+94772220004',
    password: 'North@DR2026!',
    role: 'DIVISION_ADMIN',
    platformBranch: 'DIGITAL_RACE',
    division: 'NORTH',
    allowedProvinces: ['NORTHERN', 'NORTH_CENTRAL'],
    permissions: {
      canProvisionTenants: true,
      canResetCredentials: true,
      canManageFleet: false,
      canConfigureAddons: false,
      canAccessGlobalConfig: false,
    },
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:00:00.000Z',
  },

  // --------------------------------------------------------------------------
  // LEVEL 3: 4 REGIONAL DIVISION ADMINS UNDER TASTETRIP
  // --------------------------------------------------------------------------
  {
    id: 'adm-tt-div-upcountry',
    name: 'Up Country Division Admin (TasteTrip)',
    email: 'div.upcountry.tt@ceyteq.com',
    phone: '+94773330001',
    password: 'UpCountry@TT2026!',
    role: 'DIVISION_ADMIN',
    platformBranch: 'TASTETRIP',
    division: 'UP_COUNTRY',
    allowedProvinces: ['CENTRAL', 'UVA', 'SABARAGAMUWA'],
    permissions: {
      canProvisionTenants: true,
      canResetCredentials: true,
      canManageFleet: true,
      canConfigureAddons: false,
      canAccessGlobalConfig: false,
    },
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'adm-tt-div-south',
    name: 'South Division Admin (TasteTrip)',
    email: 'div.south.tt@ceyteq.com',
    phone: '+94773330002',
    password: 'South@TT2026!',
    role: 'DIVISION_ADMIN',
    platformBranch: 'TASTETRIP',
    division: 'SOUTH',
    allowedProvinces: ['SOUTHERN', 'EASTERN'],
    permissions: {
      canProvisionTenants: true,
      canResetCredentials: true,
      canManageFleet: true,
      canConfigureAddons: false,
      canAccessGlobalConfig: false,
    },
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'adm-tt-div-western',
    name: 'Western Division Admin (TasteTrip)',
    email: 'div.western.tt@ceyteq.com',
    phone: '+94773330003',
    password: 'Western@TT2026!',
    role: 'DIVISION_ADMIN',
    platformBranch: 'TASTETRIP',
    division: 'WESTERN',
    allowedProvinces: ['WESTERN', 'NORTH_WESTERN'],
    permissions: {
      canProvisionTenants: true,
      canResetCredentials: true,
      canManageFleet: true,
      canConfigureAddons: false,
      canAccessGlobalConfig: false,
    },
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'adm-tt-div-north',
    name: 'North Division Admin (TasteTrip)',
    email: 'div.north.tt@ceyteq.com',
    phone: '+94773330004',
    password: 'North@TT2026!',
    role: 'DIVISION_ADMIN',
    platformBranch: 'TASTETRIP',
    division: 'NORTH',
    allowedProvinces: ['NORTHERN', 'NORTH_CENTRAL'],
    permissions: {
      canProvisionTenants: true,
      canResetCredentials: true,
      canManageFleet: true,
      canConfigureAddons: false,
      canAccessGlobalConfig: false,
    },
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:00:00.000Z',
  },
];

const DEFAULT_CREDENTIALS: RoleCredentials = {
  superAdminEmail: 'info.ceyteq@gmail.com',
  superAdminPhone: '+94768607143',
  superAdminPassword: 'CeyteqMaster@2026!',
  defaultKitchenPin: '2026',
  defaultWaiterPin: '1122',
  enterpriseAdmins: INITIAL_ENTERPRISE_ADMINS,
  tenantPasswords: {
    'tenant-1': {
      ownerEmail: 'owner@ceylonspice.com',
      ownerPassword: 'spice@owner2026',
      kitchenPin: '2026',
      waiterPin: '1122',
    },
    'tenant-2': {
      ownerEmail: 'manager@mirissabay.com',
      ownerPassword: 'mirissa@pass2026',
      kitchenPin: '3030',
      waiterPin: '4455',
    },
  },
};

export const credentialsService = {
  getCredentials(): RoleCredentials {
    if (typeof window === 'undefined') return DEFAULT_CREDENTIALS;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_CREDENTIALS,
          ...parsed,
          enterpriseAdmins:
            Array.isArray(parsed.enterpriseAdmins) && parsed.enterpriseAdmins.length > 0
              ? parsed.enterpriseAdmins
              : INITIAL_ENTERPRISE_ADMINS,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_CREDENTIALS;
  },

  saveCredentials(creds: RoleCredentials) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
    } catch {
      // ignore
    }
  },

  setSuperAdminPassword(newPass: string) {
    const creds = this.getCredentials();
    creds.superAdminPassword = newPass;
    this.saveCredentials(creds);
  },

  setSuperAdminPhone(newPhone: string) {
    const creds = this.getCredentials();
    creds.superAdminPhone = newPhone;
    this.saveCredentials(creds);
  },

  getEnterpriseAdmins(): EnterpriseAdminRecord[] {
    return this.getCredentials().enterpriseAdmins;
  },

  upsertEnterpriseAdmin(admin: EnterpriseAdminRecord) {
    const creds = this.getCredentials();
    const index = creds.enterpriseAdmins.findIndex((a) => a.id === admin.id || a.email === admin.email);
    if (index >= 0) {
      creds.enterpriseAdmins[index] = admin;
    } else {
      creds.enterpriseAdmins.push(admin);
    }
    this.saveCredentials(creds);
  },

  deleteEnterpriseAdmin(adminId: string) {
    const creds = this.getCredentials();
    creds.enterpriseAdmins = creds.enterpriseAdmins.filter((a) => a.id !== adminId);
    this.saveCredentials(creds);
  },

  setKitchenPin(pin: string, tenantId?: string) {
    const creds = this.getCredentials();
    if (tenantId && creds.tenantPasswords[tenantId]) {
      creds.tenantPasswords[tenantId].kitchenPin = pin;
    } else {
      creds.defaultKitchenPin = pin;
    }
    this.saveCredentials(creds);
  },

  setWaiterPin(pin: string, tenantId?: string) {
    const creds = this.getCredentials();
    if (tenantId && creds.tenantPasswords[tenantId]) {
      creds.tenantPasswords[tenantId].waiterPin = pin;
    } else {
      creds.defaultWaiterPin = pin;
    }
    this.saveCredentials(creds);
  },

  setTenantPassword(tenantId: string, email: string, newPass: string, kitchenPin?: string, waiterPin?: string) {
    const creds = this.getCredentials();
    creds.tenantPasswords[tenantId] = {
      ownerEmail: email,
      ownerPassword: newPass,
      kitchenPin: kitchenPin || creds.defaultKitchenPin,
      waiterPin: waiterPin || creds.defaultWaiterPin,
    };
    this.saveCredentials(creds);
  },

  getTenantCredentials(tenantId: string) {
    const creds = this.getCredentials();
    return (
      creds.tenantPasswords[tenantId] || {
        ownerEmail: 'owner@restaurant.com',
        ownerPassword: 'owner@pass2026',
        kitchenPin: creds.defaultKitchenPin,
        waiterPin: creds.defaultWaiterPin,
      }
    );
  },

  getCurrentSessionUser(): any | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('ceyteq_session_user_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  },

  setCurrentSessionUser(user: any | null) {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        localStorage.setItem('ceyteq_session_user_v1', JSON.stringify(user));
      } else {
        localStorage.removeItem('ceyteq_session_user_v1');
      }
    } catch {
      // ignore
    }
  },

  // Find any account across Super Admin, Enterprise Admins, and Restaurant Owners
  findAccountByEmail(email: string): {
    accountType: 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'RESTAURANT_OWNER' | 'UNKNOWN';
    record?: any;
  } {
    const creds = this.getCredentials();
    const normalized = email.trim().toLowerCase();

    if (normalized === creds.superAdminEmail.toLowerCase()) {
      return {
        accountType: 'SUPER_ADMIN',
        record: {
          id: 'usr-super-root',
          email: creds.superAdminEmail,
          phone: creds.superAdminPhone,
          name: 'Ceyteq Root System Supervisor',
          role: 'SUPER_ADMIN',
        },
      };
    }

    const adm = creds.enterpriseAdmins.find((a) => a.email.toLowerCase() === normalized);
    if (adm) {
      return { accountType: 'ENTERPRISE_ADMIN', record: adm };
    }

    for (const [tenantId, tCred] of Object.entries(creds.tenantPasswords)) {
      if (tCred.ownerEmail.toLowerCase() === normalized) {
        return {
          accountType: 'RESTAURANT_OWNER',
          record: { tenantId, ...tCred },
        };
      }
    }

    return { accountType: 'UNKNOWN' };
  },

  // Reset password for ANY real email in the entire system
  resetPasswordByEmail(email: string, newPass: string): boolean {
    const creds = this.getCredentials();
    const normalized = email.trim().toLowerCase();
    let updated = false;

    // 1. Super Admin
    if (normalized === creds.superAdminEmail.toLowerCase()) {
      creds.superAdminPassword = newPass;
      updated = true;
    }

    // 2. Enterprise Admins (Division Admins, Branch Masters)
    const adminIndex = creds.enterpriseAdmins.findIndex((a) => a.email.toLowerCase() === normalized);
    if (adminIndex >= 0) {
      creds.enterpriseAdmins[adminIndex].password = newPass;
      creds.enterpriseAdmins[adminIndex].status = 'ACTIVE';
      updated = true;
    }

    // 3. Restaurant Owners
    for (const [tenantId, tCred] of Object.entries(creds.tenantPasswords)) {
      if (tCred.ownerEmail.toLowerCase() === normalized) {
        tCred.ownerPassword = newPass;
        updated = true;
      }
    }

    // 4. If not found yet, create as an Enterprise Admin so they can log in
    if (!updated) {
      creds.enterpriseAdmins.push({
        id: `adm-${Date.now()}`,
        name: normalized.split('@')[0],
        email: normalized,
        phone: '+94770000000',
        password: newPass,
        role: 'DIVISION_ADMIN',
        platformBranch: 'DIGITAL_RACE',
        division: 'UP_COUNTRY',
        allowedProvinces: ['CENTRAL', 'UVA', 'SABARAGAMUWA'],
        permissions: {
          canProvisionTenants: true,
          canResetCredentials: true,
          canManageFleet: false,
          canConfigureAddons: false,
          canAccessGlobalConfig: false,
        },
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      });
      updated = true;
    }

    this.saveCredentials(creds);
    return updated;
  },

  // Client-safe single-use invitation store
  createInvitationRecord(params: {
    email: string;
    name: string;
    role: string;
    branch?: string;
    divisionId?: string | null;
    allowedProvinces?: string[];
  }): { token: string; activationUrl: string } {
    const normalized = params.email.trim().toLowerCase();
    const token = btoa(`${normalized}:${Date.now()}:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const record = {
      token,
      email: normalized,
      name: params.name,
      role: params.role,
      branch: params.branch || 'DIGITAL_RACE',
      divisionId: params.divisionId || null,
      allowedProvinces: params.allowedProvinces || [],
      expiresAt,
      isUsed: false,
      createdAt: Date.now(),
    };

    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('ceyteq_invitations_v1') || '{}');
        existing[token] = record;
        localStorage.setItem('ceyteq_invitations_v1', JSON.stringify(existing));
      } catch {
        // ignore
      }
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://maker-digitalracemanagementpanel.vercel.app';
    const activationUrl = `${origin}/?portal=activate&token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalized)}`;

    return { token, activationUrl };
  },

  verifyInvitationRecord(token: string, email: string): {
    isValid: boolean;
    record?: any;
    error?: 'TOKEN_NOT_FOUND' | 'TOKEN_EXPIRED' | 'TOKEN_ALREADY_USED' | 'EMAIL_MISMATCH';
  } {
    if (typeof window === 'undefined') return { isValid: false, error: 'TOKEN_NOT_FOUND' };
    try {
      const existing = JSON.parse(localStorage.getItem('ceyteq_invitations_v1') || '{}');
      const record = existing[token];
      if (!record) {
        // Check if token belongs to an enterprise admin in memory
        const creds = this.getCredentials();
        const admin = creds.enterpriseAdmins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
        if (admin) {
          return {
            isValid: true,
            record: {
              token,
              email: admin.email,
              name: admin.name,
              role: admin.role,
              branch: admin.platformBranch,
              divisionId: admin.division,
              allowedProvinces: admin.allowedProvinces,
              expiresAt: Date.now() + 86400000,
              isUsed: false,
            },
          };
        }
        return { isValid: false, error: 'TOKEN_NOT_FOUND' };
      }

      if (record.isUsed) {
        return { isValid: false, error: 'TOKEN_ALREADY_USED' };
      }

      if (Date.now() > record.expiresAt) {
        return { isValid: false, error: 'TOKEN_EXPIRED' };
      }

      if (record.email.toLowerCase() !== email.trim().toLowerCase()) {
        return { isValid: false, error: 'EMAIL_MISMATCH' };
      }

      return { isValid: true, record };
    } catch {
      return { isValid: false, error: 'TOKEN_NOT_FOUND' };
    }
  },

  consumeInvitation(token: string, newPassword: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const existing = JSON.parse(localStorage.getItem('ceyteq_invitations_v1') || '{}');
      const record = existing[token];
      if (record) {
        record.isUsed = true;
        record.usedAt = Date.now();
        existing[token] = record;
        localStorage.setItem('ceyteq_invitations_v1', JSON.stringify(existing));

        // Update password for the user
        this.resetPasswordByEmail(record.email, newPassword);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },
};
