/**
 * ==============================================================================
 * CEYTEQ ENTERPRISE RBAC & GEOGRAPHIC PARTITIONING MATRIX
 * Target Path: /src/lib/rbacMatrix.ts
 * 
 * Defines:
 * 1. Platform Branches: DIGITAL_RACE, TASTETRIP
 * 2. 4 Geographic Divisions in Sri Lanka & 9 Provinces mapping
 * 3. 5-Tier User Roles:
 *    - Level 1: SUPER_MASTER_ADMIN (Root: info.ceyteq@gmail.com / +94768607143)
 *    - Level 2: DIGITAL_RACE_MASTER, TASTETRIP_MASTER
 *    - Level 3: DIVISION_ADMIN (Partitioned by Division & Provinces)
 *    - Level 4: RESTAURANT_ADMIN, KITCHEN_STAFF, WAITER_STAFF, DELIVERY_PARTNER
 * 4. Permission verification guards
 * ==============================================================================
 */

export type PlatformBranch = 'DIGITAL_RACE' | 'TASTETRIP';

export type DivisionId = 'UP_COUNTRY' | 'SOUTH' | 'WESTERN' | 'NORTH';

export type SriLankanProvince =
  | 'CENTRAL'
  | 'UVA'
  | 'SABARAGAMUWA'
  | 'SOUTHERN'
  | 'EASTERN'
  | 'WESTERN'
  | 'NORTH_WESTERN'
  | 'NORTHERN'
  | 'NORTH_CENTRAL';

export type EnterpriseUserRole =
  | 'SUPER_MASTER_ADMIN'
  | 'DIGITAL_RACE_MASTER'
  | 'TASTETRIP_MASTER'
  | 'DIVISION_ADMIN'
  | 'RESTAURANT_ADMIN'
  | 'KITCHEN_STAFF'
  | 'WAITER_STAFF'
  | 'DELIVERY_PARTNER';

export interface DivisionConfig {
  id: DivisionId;
  name: string;
  regionalCenter: string;
  provinces: SriLankanProvince[];
  description: string;
}

/**
 * 4 Distinct Operational Divisions with Assigned Provinces:
 * 1. Up Country Division: Central, Uva, Sabaragamuwa
 * 2. South Division: Southern, Eastern
 * 3. Western Division: Western, North Western
 * 4. North Division: Northern, North Central
 */
export const SRI_LANKA_DIVISIONS: Record<DivisionId, DivisionConfig> = {
  UP_COUNTRY: {
    id: 'UP_COUNTRY',
    name: 'Up Country Regional Division',
    regionalCenter: 'Kandy / Nuwara Eliya',
    provinces: ['CENTRAL', 'UVA', 'SABARAGAMUWA'],
    description: 'Highland hospitality, tea country resorts & hill capital dining networks.',
  },
  SOUTH: {
    id: 'SOUTH',
    name: 'South Regional Division',
    regionalCenter: 'Galle / Matara / Arugam Bay',
    provinces: ['SOUTHERN', 'EASTERN'],
    description: 'Coastal tourism belt, coastal eateries, seafood hubs & East coast surfer cafes.',
  },
  WESTERN: {
    id: 'WESTERN',
    name: 'Western Regional Division',
    regionalCenter: 'Colombo / Gampaha / Negombo / Kurunegala',
    provinces: ['WESTERN', 'NORTH_WESTERN'],
    description: 'Dense metro gastronomic centers, commercial hubs & high-volume delivery networks.',
  },
  NORTH: {
    id: 'NORTH',
    name: 'North Regional Division',
    regionalCenter: 'Jaffna / Anuradhapura / Vavuniya',
    provinces: ['NORTHERN', 'NORTH_CENTRAL'],
    description: 'Heritage culinary centers, northern agricultural markets & cultural hubs.',
  },
};

/**
 * Province to Division reverse lookup
 */
export const PROVINCE_TO_DIVISION_MAP: Record<SriLankanProvince, DivisionId> = {
  CENTRAL: 'UP_COUNTRY',
  UVA: 'UP_COUNTRY',
  SABARAGAMUWA: 'UP_COUNTRY',
  SOUTHERN: 'SOUTH',
  EASTERN: 'SOUTH',
  WESTERN: 'WESTERN',
  NORTH_WESTERN: 'WESTERN',
  NORTHERN: 'NORTH',
  NORTH_CENTRAL: 'NORTH',
};

/**
 * Human-readable Province Names
 */
export const PROVINCE_NAMES: Record<SriLankanProvince, string> = {
  CENTRAL: 'Central Province (මධ්‍යම පළාත)',
  UVA: 'Uva Province (ඌව පළාත)',
  SABARAGAMUWA: 'Sabaragamuwa Province (සබරගමුව පළාත)',
  SOUTHERN: 'Southern Province (දකුණු පළාත)',
  EASTERN: 'Eastern Province (නැගෙනහිර පළාත)',
  WESTERN: 'Western Province (බස්නාහිර පළාත)',
  NORTH_WESTERN: 'North Western Province (වයඹ පළාත)',
  NORTHERN: 'Northern Province (උතුරු පළාත)',
  NORTH_CENTRAL: 'North Central Province (උතුරු මැද පළාත)',
};

/**
 * Enterprise RBAC Actor Session
 */
export interface EnterpriseActorSession {
  userId: string;
  email: string;
  phone?: string;
  name: string;
  role: EnterpriseUserRole;
  platformBranch?: PlatformBranch;
  assignedDivision?: DivisionId;
  assignedProvinces?: SriLankanProvince[];
  tenantId?: string;
  tier?: 'FREE' | 'PLUS' | 'PRO';
}

/**
 * Check if an actor has authority to provision or manage a tenant in a given province
 */
export function canActorManageProvince(
  actor: EnterpriseActorSession,
  province: SriLankanProvince,
  branch: PlatformBranch = 'DIGITAL_RACE'
): { allowed: boolean; reason?: string } {
  // 1. Root Super Master Admin: Global Authority across all platforms & provinces
  if (actor.role === 'SUPER_MASTER_ADMIN') {
    return { allowed: true };
  }

  // 2. Branch Master Admin: Authority across all provinces for their platform
  if (
    (actor.role === 'DIGITAL_RACE_MASTER' && branch === 'DIGITAL_RACE') ||
    (actor.role === 'TASTETRIP_MASTER' && branch === 'TASTETRIP')
  ) {
    return { allowed: true };
  }

  if (actor.role === 'DIGITAL_RACE_MASTER' && branch !== 'DIGITAL_RACE') {
    return { allowed: false, reason: 'Digital Race Master Admin cannot access TasteTrip delivery platform.' };
  }

  if (actor.role === 'TASTETRIP_MASTER' && branch !== 'TASTETRIP') {
    return { allowed: false, reason: 'TasteTrip Master Admin cannot access Digital Race restaurant platform.' };
  }

  // 3. Division Admin: Strict Partitioning
  if (actor.role === 'DIVISION_ADMIN') {
    // Check branch match
    if (actor.platformBranch && actor.platformBranch !== branch) {
      return {
        allowed: false,
        reason: `Division Admin belongs to ${actor.platformBranch} and cannot manage ${branch} resources.`,
      };
    }

    // Determine target division for the requested province
    const targetDivision = PROVINCE_TO_DIVISION_MAP[province];
    if (actor.assignedDivision !== targetDivision) {
      return {
        allowed: false,
        reason: `Access Denied: Province ${province} belongs to ${targetDivision} Division. You are restricted to ${actor.assignedDivision} Division.`,
      };
    }

    // If specific provinces are assigned, check subset
    if (actor.assignedProvinces && actor.assignedProvinces.length > 0) {
      if (!actor.assignedProvinces.includes(province)) {
        return {
          allowed: false,
          reason: `Access Denied: You do not have permissions for ${province}.`,
        };
      }
    }

    return { allowed: true };
  }

  // 4. Restaurant / Store Admin: Cannot manage provinces
  return {
    allowed: false,
    reason: 'Store and operational staff cannot manage regional provincial resources.',
  };
}

/**
 * Check if actor can trigger password resets for a target user/tenant
 */
export function canActorResetTenantPassword(
  actor: EnterpriseActorSession,
  targetTenantProvince: SriLankanProvince,
  targetTenantBranch: PlatformBranch = 'DIGITAL_RACE',
  targetTenantId?: string
): { allowed: boolean; reason?: string } {
  // Super Master Admin can reset anyone
  if (actor.role === 'SUPER_MASTER_ADMIN') {
    return { allowed: true };
  }

  // Branch Master Admins can reset anyone in their vertical
  if (
    (actor.role === 'DIGITAL_RACE_MASTER' && targetTenantBranch === 'DIGITAL_RACE') ||
    (actor.role === 'TASTETRIP_MASTER' && targetTenantBranch === 'TASTETRIP')
  ) {
    return { allowed: true };
  }

  // Division Admin can reset credentials ONLY in their assigned provinces
  if (actor.role === 'DIVISION_ADMIN') {
    return canActorManageProvince(actor, targetTenantProvince, targetTenantBranch);
  }

  // Self-reset if tenant owner matches target tenant ID
  if (actor.role === 'RESTAURANT_ADMIN' && targetTenantId && actor.tenantId === targetTenantId) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Unauthorized: You do not possess clearance to trigger credential resets for this entity.',
  };
}
