import { loadDotenv } from '../src/platform/config/load-dotenv.js';

loadDotenv();
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgresql://smart:smart@127.0.0.1:5433/smart?schema=public';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const load = <T>(f: string): T[] =>
  JSON.parse(readFileSync(path.join(DIRNAME, 'seed-data', `${f}.json`), 'utf8'));
const chunks = <T>(a: T[], n = 500) =>
  Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

export async function seedSkills(): Promise<void> {
  console.log('Seeding skills taxonomy & competency data...');

  await prisma.$transaction(
    async (tx) => {
      for (const c of load<any>('capabilities'))
        await tx.capability.upsert({
          where: { id: c.id },
          update: { name: c.name },
          create: { id: c.id, name: c.name },
        });

      for (const g of load<any>('competency_groups'))
        await tx.competencyGroup.upsert({
          where: { id: g.id },
          update: { name: g.name, capabilityId: g.capability_id },
          create: { id: g.id, name: g.name, capabilityId: g.capability_id },
        });

      for (const f of load<any>('skill_families'))
        await tx.skillFamily.upsert({
          where: { id: f.id },
          update: { name: f.name },
          create: { id: f.id, name: f.name },
        });

      for (const t of load<any>('tool_categories'))
        await tx.toolCategory.upsert({
          where: { name: t.name },
          update: { examples: t.examples },
          create: t,
        });

      for (const p of load<any>('parent_skills')) {
        const d = {
          name: p.name,
          definition: p.definition,
          l1ItemFormats: p.l1_item_formats,
          l2DominantMode: p.l2_dominant_mode,
          recommendedFamily: p.recommended_family,
          weightReliability: p.weight_reliability,
          primaryItemCount: p.primary_item_count,
          competencyGroupId: p.competency_group_id,
          capabilityId: p.capability_id,
        };
        await tx.parentSkill.upsert({ where: { id: p.id }, update: d, create: { id: p.id, ...d } });
      }

      for (const s of load<any>('skills')) {
        const d = {
          name: s.name,
          code: s.id,
          domain: s.family ?? 'GENERAL',
          type: s.type,
          family: s.family,
          toolCategory: s.tool_category,
          sfiaCode: s.sfia_code,
          importanceTier: s.importance_tier,
          primaryWeight: s.primary_weight,
          l1Format: s.l1_format,
          l2Mode: s.l2_mode,
          l2Environment: s.l2_environment,
          l2SandboxFit: s.l2_sandbox_fit,
          l5Deliverable: s.l5_deliverable,
          programmingInL2: s.programming_in_l2 === 'Yes',
          notes: s.notes,
          primaryParentId: s.primary_parent_id,
        };
        await tx.skill.upsert({ where: { id: s.id }, update: d, create: { id: s.id, ...d } });
      }
    },
    { timeout: 120_000 },
  );

  // Bulk tables (no per-row upsert needed): wipe-and-reload keeps them in sync with the sheet.
  const links = load<any>('skill_parent_links').map((l) => ({
    skillId: l.skill_id,
    parentId: l.parent_id,
    role: l.role,
    tier: l.tier,
    tierScore: l.tier_score,
    weight: l.weight,
  }));
  await prisma.skillParentLink.deleteMany();
  for (const c of chunks(links)) await prisma.skillParentLink.createMany({ data: c });

  const edges = load<any>('ontology_edges').map((e) => ({
    id: e.id,
    source: e.source,
    relation: e.relation,
    target: e.target,
    weight: typeof e.weight === 'number' ? e.weight : null,
    reviewStatus: e.review_status,
    rationale: e.rationale,
  }));
  await prisma.ontologyEdge.deleteMany();
  for (const c of chunks(edges)) await prisma.ontologyEdge.createMany({ data: c });

  const counts = {
    capabilities: await prisma.capability.count(),
    parentSkills: await prisma.parentSkill.count(),
    skills: await prisma.skill.count(),
    links: await prisma.skillParentLink.count(),
    edges: await prisma.ontologyEdge.count(),
  };

  console.log('Skills seed complete:', counts);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  seedSkills()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
