import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GUARDS_METADATA, PATH_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import type { UserRole } from '@smart/contracts';
import { beforeAll, describe, expect, it } from 'vitest';
import { TenantId, TenantScope } from './decorators/tenant-id.decorator.js';
import { PERMISSIONS_KEY, roleHasPermission, type Permission } from './guards/permissions.js';
import { ROLES_KEY } from './guards/roles.decorator.js';
import { TenantScopeGuard } from './guards/tenant-scope.guard.js';

/**
 * S6-VV-153 (#619): CI gate for tenant isolation. It scans every controller in api-core. Every
 * route institution staff can call must be scoped to the caller's institution by one of:
 * `@TenantId()`, `@TenantScope()` (SUPER_ADMIN platform-wide, staff their own institution), or
 * `TenantScopeGuard`. A route that is safe for another reason is listed in ALLOWED with the reason.
 *
 * A new staff route without scoping fails this test, and so does an ALLOWED entry that no longer
 * matches an unscoped route.
 */
const STAFF_ROLES: readonly UserRole[] = ['INSTITUTION_ADMIN', 'PLACEMENT_STAFF'];

const SELF = "only the caller's own records";
const SERVICE_FILTERS_BY_INST = "the service filters staff by the caller's institution (user.inst)";
const EVIDENCE_READ =
  'multi-role candidate evidence read; assertCanReadCandidateEvidenceVersions scopes staff';

/** `Controller.handler` → why it is safe without a tenant decorator or guard. */
const ALLOWED: Record<string, string> = {
  'AiGatewayController.complete': 'stateless AI completion proxy; reads no tenant data',
  'AssessmentController.listSkillClaims': SERVICE_FILTERS_BY_INST,
  'CandidateEducationTpoController.confirmEducation': 'assertHomeCollegeOwnership in the service',
  'CandidateEducationTpoController.rejectEducation': 'assertHomeCollegeOwnership in the service',
  'CorroborationAdminController.listReviewFlags': 'filterFlagsForActor keeps actor.inst flags',
  'CorroborationAdminController.resolveReviewFlag': 'assertActorCanAccessFlag checks actor.inst',
  'EvidenceController.createDecision': "keyed to the caller's own id as studentId",
  'MessagingController.block': SELF,
  'MessagingController.list': SELF,
  'MessagingController.listBlocks': SELF,
  'MessagingController.messages': SELF,
  'MessagingController.mute': SELF,
  'MessagingController.read': SELF,
  'MessagingController.remove': SELF,
  'MessagingController.search': SELF,
  'MessagingController.send': SELF,
  'MessagingController.start': SELF,
  'MessagingController.unblock': SELF,
  'MessagingController.unread': SELF,
  'PlacementController.getCandidateDemonstratedSkills': EVIDENCE_READ,
  'PlacementController.getCandidateEducation': EVIDENCE_READ,
  'PlacementController.getCandidateEvidenceProvenance': EVIDENCE_READ,
  'PlacementController.getCandidateEvidenceVersion': EVIDENCE_READ,
  'PlacementController.getCandidateSkillClaims': EVIDENCE_READ,
  'PlacementController.getCandidateSkillExplanation': EVIDENCE_READ,
  'PlacementController.listCandidateEvidenceVersions': EVIDENCE_READ,
  'PlacementController.reviewCandidateEvidence': EVIDENCE_READ,
  'PlansController.listPlans': 'public plan catalog',
  'ReportsController.create': 'the caller files a report; reads no tenant data',
  'SupportController.endSession': "ends the caller's own support session",
  'TrustNotificationController.getUserTrustNotifications': SELF,
  'TrustNotificationController.markRead': SELF,
  'UsersController.changePassword': SELF,
  'UsersController.me': SELF,
  'WorkExperienceController.getOpsDashboard': SERVICE_FILTERS_BY_INST,
};

type Ctor = (new (...args: never[]) => unknown) & { name: string };

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (entry.name.endsWith('.controller.ts')) out.push(path);
  }
  return out;
}

/** The factory createParamDecorator registers for a decorator, found through a probe class. */
function factoryOf(decorator: () => ParameterDecorator): unknown {
  class Probe {
    handler(_value: unknown): void {}
  }
  decorator()(Probe.prototype, 'handler', 0);
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Probe, 'handler') as Record<
    string,
    { factory?: unknown }
  >;
  return Object.values(args)[0]?.factory;
}

function staffCanCall(controller: Ctor, handler: object): boolean {
  const roles =
    (Reflect.getMetadata(ROLES_KEY, handler) as UserRole[] | undefined) ??
    (Reflect.getMetadata(ROLES_KEY, controller) as UserRole[] | undefined);
  const permissions =
    (Reflect.getMetadata(PERMISSIONS_KEY, handler) as Permission[] | undefined) ??
    (Reflect.getMetadata(PERMISSIONS_KEY, controller) as Permission[] | undefined);
  if (roles?.some((role) => STAFF_ROLES.includes(role))) return true;
  return (
    permissions?.some((permission) =>
      STAFF_ROLES.some((role) => roleHasPermission(role, permission)),
    ) ?? false
  );
}

function hasGuard(target: object, guard: unknown): boolean {
  const guards = Reflect.getMetadata(GUARDS_METADATA, target) as unknown[] | undefined;
  return guards?.includes(guard) ?? false;
}

describe('tenant scope coverage for institution staff routes (S6-VV-153, #619)', () => {
  const unscoped: string[] = [];
  const staffRoutes: string[] = [];

  beforeAll(async () => {
    const tenantFactories = [factoryOf(TenantId), factoryOf(TenantScope)];
    const root = fileURLToPath(new URL('../modules', import.meta.url));
    for (const file of walk(root)) {
      const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
      for (const exported of Object.values(mod)) {
        if (typeof exported !== 'function') continue;
        const controller = exported as Ctor;
        if (Reflect.getMetadata(PATH_METADATA, controller) === undefined) continue;
        const classScoped = hasGuard(controller, TenantScopeGuard);
        for (const name of Object.getOwnPropertyNames(controller.prototype)) {
          const handler = (controller.prototype as Record<string, unknown>)[name];
          if (name === 'constructor' || typeof handler !== 'function') continue;
          if (Reflect.getMetadata(PATH_METADATA, handler) === undefined) continue;
          if (!staffCanCall(controller, handler)) continue;
          const id = `${controller.name}.${name}`;
          staffRoutes.push(id);
          const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, controller, name) as
            Record<string, { factory?: unknown }> | undefined;
          const takesTenant = Object.values(args ?? {}).some((arg) =>
            tenantFactories.includes(arg.factory),
          );
          if (!takesTenant && !classScoped && !hasGuard(handler, TenantScopeGuard)) {
            unscoped.push(id);
          }
        }
      }
    }
  }, 120_000);

  it('finds the staff routes (sanity check on the scan itself)', () => {
    expect(staffRoutes.length).toBeGreaterThan(50);
    expect(staffRoutes).toContain('InstitutionsTpoController.listBatches');
  });

  it('scopes every staff route to the caller institution, or documents why it is safe', () => {
    const undocumented = unscoped.filter((id) => !(id in ALLOWED));
    expect(undocumented.sort()).toEqual([]);
  });

  it('keeps the allowlist honest: every entry is still an unscoped staff route', () => {
    const stale = Object.keys(ALLOWED).filter((id) => !unscoped.includes(id));
    expect(stale).toEqual([]);
  });
});
