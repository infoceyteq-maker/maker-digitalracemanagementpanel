/**
 * ==============================================================================
 * CEYTEQ — PLATFORM BRANCH SCOPE ("RBAC IRON WALL")
 * Target Path: /src/lib/branchScope.ts
 *
 * Single source of truth for branch isolation. Deliberately dependency-free so
 * it can be imported from BOTH the React SPA (src/*) and the legacy
 * Next.js-style edge middleware (middleware.ts) without pulling in DOM or
 * node-only modules.
 *
 * Branch model:
 *   DIGITAL_RACE  — restaurant SaaS vertical (clients, POS/KOT, menus)
 *   TASTETRIP     — delivery/fleet vertical (drivers, deployments)
 *   ALL           — Super Master Admin only (unrestricted)
 * ==============================================================================
 */

export type PlatformBranch = 'DIGITAL_RACE' | 'TASTETRIP';
export type BranchScope = PlatformBranch | 'ALL';

/**
 * Mirrors the ActiveView union in src/types.ts. Duplicated as a string literal
 * union (instead of importing it) so this module stays import-free.
 */
export type BranchView =
  | 'PUBLIC_MENU'
  | 'CLIENT_DASHBOARD'
  | 'PRO_OPERATIONS'
  | 'SUPER_ADMIN'
  | 'ANALYTICS'
  | 'ARCHITECTURE'
  | 'TASTE_TRIP'
  | 'TASTRIP_DASHBOARD'
  | 'SECURITY_CENTER';

/** Minimal actor shape — accepts AuthUser, session payloads, or a bare role. */
export interface BranchActor {
  role?: string | null;
  branch?: string | null;
  platformBranch?: string | null;
}

/** Roles that bypass every branch restriction. */
const SUPER_ROLES = ['SUPER_MASTER_ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'];

/**
 * Branch masters are restricted to their own vertical's data.
 * 'SUPER_ADMIN' is the Master Console view and is shared by both verticals
 * (each vertical just sees a different subset of its tabs — see SuperAdminPanel).
 */
const DIGITAL_RACE_VIEWS: BranchView[] = [
  'PUBLIC_MENU',
  'CLIENT_DASHBOARD',
  'PRO_OPERATIONS',
  'SUPER_ADMIN',
  'ANALYTICS',
  'ARCHITECTURE',
  'SECURITY_CENTER',
];

const TASTETRIP_VIEWS: BranchView[] = [
  'PUBLIC_MENU',
  'TASTE_TRIP',
  'TASTRIP_DASHBOARD',
  'SUPER_ADMIN',
  'ARCHITECTURE',
  'SECURITY_CENTER',
];

export function normalizeRole(role?: string | null): string {
  return (role || '').trim().toUpperCase();
}

/** True for the Super Master Admin ladder (unrestricted, branch = ALL). */
export function isSuperMaster(role?: string | null): boolean {
  return SUPER_ROLES.indexOf(normalizeRole(role)) !== -1;
}

/**
 * Resolve the branch an actor is allowed to see.
 *  • Super Master Admin ladder  → 'ALL'
 *  • DIGITAL_RACE_MASTER        → 'DIGITAL_RACE'
 *  • TASTETRIP_MASTER           → 'TASTETRIP'
 *  • everyone else              → their own stamped branch (defaults DIGITAL_RACE)
 */
export function resolveActorBranch(actor?: BranchActor | null): BranchScope {
  if (!actor) return 'DIGITAL_RACE';

  const role = normalizeRole(actor.role);
  if (isSuperMaster(role)) return 'ALL';
  if (role === 'DIGITAL_RACE_MASTER') return 'DIGITAL_RACE';
  if (role === 'TASTETRIP_MASTER') return 'TASTETRIP';

  const explicit = String(actor.branch || actor.platformBranch || '')
    .trim()
    .toUpperCase();
  if (explicit === 'DIGITAL_RACE' || explicit === 'TASTETRIP') {
    return explicit as PlatformBranch;
  }
  if (explicit === 'ALL') return 'ALL';

  return 'DIGITAL_RACE';
}

/** Branch-level view authorization. Super Master bypasses everything. */
export function canUserAccessView(
  actor: BranchActor | null | undefined,
  view: BranchView | string,
): boolean {
  const branch = resolveActorBranch(actor);
  if (branch === 'ALL') return true;
  const allowed = branch === 'TASTETRIP' ? TASTETRIP_VIEWS : DIGITAL_RACE_VIEWS;
  return allowed.indexOf(view as BranchView) !== -1;
}

/**
 * Deterministic landing view after login:
 *   DR master → CLIENT_DASHBOARD, TT master → TASTE_TRIP, super → SUPER_ADMIN.
 * Branch masters must NEVER land on the Super Master console by default.
 */
export function homeViewFor(actor: BranchActor | null | undefined): BranchView {
  const role = normalizeRole(actor?.role);
  if (isSuperMaster(role)) return 'SUPER_ADMIN';
  if (role === 'DIGITAL_RACE_MASTER') return 'CLIENT_DASHBOARD';
  if (role === 'TASTETRIP_MASTER') return 'TASTE_TRIP';
  if (role === 'DIVISION_ADMIN' || role === 'AGENCY_ADMIN') return 'SUPER_ADMIN';

  const branch = resolveActorBranch(actor);
  return branch === 'TASTETRIP' ? 'TASTE_TRIP' : 'CLIENT_DASHBOARD';
}

/** Keep only the rows that belong to the actor's branch. */
export function filterByBranch<T extends { platformBranch?: string | null; branch?: string | null }>(
  rows: T[],
  scope: BranchScope,
): T[] {
  if (!Array.isArray(rows)) return [];
  if (scope === 'ALL') return rows;
  return rows.filter(
    (row) => String(row?.platformBranch || row?.branch || '').trim().toUpperCase() === scope,
  );
}

// ---------------------------------------------------------------------------
// Portal-link ("?portal=...") classification — used by the Level-0 portal wall
// in middleware.ts and by the PortalLauncherModal branch filtering.
// ---------------------------------------------------------------------------

const TASTETRIP_PORTALS = ['tastetrip', 'tastri', 'tt', 'tastri-dashboard', 'trip'];
const DIGITAL_RACE_PORTALS = [
  'digitalrace',
  'digital-race',
  'dr',
  'restaurant',
  'admin',
  'client',
  'clients',
  'pos',
  'kitchen',
  'kot',
  'menu',
  'customer',
];

/** Map a ?portal= value to its owning branch, or null when branch-neutral. */
export function portalBranch(portal?: string | null): PlatformBranch | null {
  const value = String(portal || '').trim().toLowerCase();
  if (!value) return null;
  if (TASTETRIP_PORTALS.indexOf(value) !== -1) return 'TASTETRIP';
  if (DIGITAL_RACE_PORTALS.indexOf(value) !== -1) return 'DIGITAL_RACE';
  return null;
}

/** Own-branch dashboard an actor should be bounced back to when blocked. */
export function dashboardPathForActor(actor: BranchActor | null | undefined): string {
  const role = normalizeRole(actor?.role);
  if (isSuperMaster(role)) return '/dashboard/super';
  if (role === 'TASTETRIP_MASTER') return '/dashboard/tastetrip';
  if (role === 'DIGITAL_RACE_MASTER') return '/dashboard/digital-race';
  if (role === 'DIVISION_ADMIN' || role === 'AGENCY_ADMIN') {
    const div = String((actor as { assignedDivision?: string } | null)?.assignedDivision || 'up-country');
    return `/dashboard/division/${div.toLowerCase().replace(/_/g, '-')}`;
  }
  return resolveActorBranch(actor) === 'TASTETRIP'
    ? '/dashboard/tastetrip'
    : '/dashboard/digital-race';
}
