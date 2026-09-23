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
};
