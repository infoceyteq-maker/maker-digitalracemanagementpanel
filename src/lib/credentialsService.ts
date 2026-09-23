// ==============================================================================
// CEYTEQ DIGITAL RACE - ROLE PASSWORDS & CREDENTIALS SERVICE
// Manages separate, customizable passwords for Master Admin, Restaurant Owners,
// Kitchen KOT terminals, and Waiter staff.
// ==============================================================================

export interface RoleCredentials {
  superAdminPassword: string;
  superAdminEmail: string;
  superAdminPhone: string;
  defaultKitchenPin: string;
  defaultWaiterPin: string;
  tenantPasswords: Record<string, {
    ownerEmail: string;
    ownerPassword: string;
    kitchenPin: string;
    waiterPin: string;
  }>;
}

const STORAGE_KEY = 'ceyteq_credentials_v1';

const DEFAULT_CREDENTIALS: RoleCredentials = {
  superAdminEmail: 'Info.ceyteq@gmail.com',
  superAdminPhone: '+94768607143',
  superAdminPassword: 'admin@ceyteq2026',
  defaultKitchenPin: '2026',
  defaultWaiterPin: '1122',
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
        return { ...DEFAULT_CREDENTIALS, ...JSON.parse(data) };
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
    return creds.tenantPasswords[tenantId] || {
      ownerEmail: 'owner@restaurant.com',
      ownerPassword: 'owner@pass2026',
      kitchenPin: creds.defaultKitchenPin,
      waiterPin: creds.defaultWaiterPin,
    };
  },
};
