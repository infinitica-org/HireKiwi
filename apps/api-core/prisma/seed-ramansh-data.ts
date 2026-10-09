/**
 * Seed script to add intermediate Python skill claim, assessment, and project for ramansh/first student
 * Usage: npm run db:seed (or this specifically: npx tsx prisma/seed-ramansh-data.ts)
 */

import { loadDotenv } from '../src/platform/config/load-dotenv.js';

loadDotenv();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ??
  'postgresql://hirekiwi:hirekiwi@127.0.0.1:5433/hirekiwi?schema=public';

async function seedRamansh(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: DATABASE_URL }),
  });

  console.log('🌱 Seeding data for first student...\n');

  // 1. Find first student or use student@hirekiwi.local
  let student = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
  });

  if (!student) {
    console.error('❌ No student found in database');
    process.exit(1);
  }

  console.log(`✅ Found student: ${student.email} (${student.id})\n`);

  // 2. Find or create Python skill
  let pythonSkill = await prisma.skill.findFirst({
    where: { code: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT' },
  });

  if (!pythonSkill) {
    pythonSkill = await prisma.skill.create({
      data: {
        code: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
        name: 'Python',
        domain: 'SOFTWARE_IT',
        cooldownDays: 60,
        validityDays: 180,
        beginnerPassThreshold: 60,
        active: true,
      },
    });
    console.log(`✅ Created Python skill`);
  } else {
    console.log(`✅ Found Python skill`);
  }

  // 3. Find or create skill claim (INTERMEDIATE level)
  let skillClaim = await prisma.skillClaim.findUnique({
    where: { studentId_skillId: { studentId: student.id, skillId: pythonSkill.id } },
  });

  if (!skillClaim) {
    skillClaim = await prisma.skillClaim.create({
      data: {
        studentId: student.id,
        skillId: pythonSkill.id,
        proficiency: 'INTERMEDIATE',
        status: 'DECLARED',
        source: 'MANUAL',
        sourceMetadata: null,
        strikes: 0,
      },
    });
    console.log(`✅ Created skill claim: ${skillClaim.id} (INTERMEDIATE, DECLARED)`);
  } else {
    // Update to INTERMEDIATE if not already
    if (skillClaim.proficiency !== 'INTERMEDIATE') {
      skillClaim = await prisma.skillClaim.update({
        where: { id: skillClaim.id },
        data: { proficiency: 'INTERMEDIATE' },
      });
      console.log(`✅ Updated skill claim to INTERMEDIATE`);
    } else {
      console.log(`✅ Skill claim already exists (INTERMEDIATE)`);
    }
  }

  // 4. Find a track to attach levels (levels belong to tracks)
  let track = await prisma.track.findFirst();

  if (!track) {
    track = await prisma.track.create({
      data: {
        code: 'TECH_FULLSTACK',
        name: 'Tech Fullstack',
      },
    });
    console.log(`✅ Created Track: ${track.code}`);
  } else {
    console.log(`✅ Found Track: ${track.code}`);
  }

  // 5. Find or create Level (INTERMEDIATE = level 2 for the track)
  let level = await prisma.level.findFirst({
    where: {
      trackId: track.id,
      levelNumber: 2, // INTERMEDIATE = 2nd level
    },
  });

  if (!level) {
    level = await prisma.level.create({
      data: {
        trackId: track.id,
        levelNumber: 2,
        name: 'INTERMEDIATE',
        format: 'SANDBOX',
        durationMinutes: 45,
        itemCount: 20,
      },
    });
    console.log(`✅ Created Level 2 (INTERMEDIATE) under track ${track.code}`);
  } else {
    console.log(`✅ Found Level 2 (INTERMEDIATE) for track`);
  }

  // 6. Create assessment attempt (SUBMITTED status, passing score)
  const attempt = await prisma.attempt.create({
    data: {
      userId: student.id,
      levelId: level.id,
      status: 'SUBMITTED',
      integrityFlag: 'CLEAN',
      startedAt: new Date(Date.now() - 30 * 60000), // 30 mins ago
      completedAt: new Date(Date.now() - 5 * 60000), // 5 mins ago
      expiresAt: new Date(Date.now() + 24 * 60 * 60000), // expires tomorrow
    },
  });

  console.log(`✅ Created assessment attempt: ${attempt.id}`);

  // 7. Create level result with passing score (INTERMEDIATE requires 65% pass)
  const levelResult = await prisma.levelResult.create({
    data: {
      attemptId: attempt.id,
      levelId: level.id,
      rawScore: 85, // 85% passing score
      tierAwarded: 'SILVER',
      confidenceBand: 'MEDIUM',
    },
  });

  console.log(`✅ Created level result: ${levelResult.id} (85% score, SILVER tier)\n`);

  // 8. Create skill verification attempt linking the assessment to the skill claim
  const verificationAttempt = await prisma.skillVerificationAttempt.create({
    data: {
      claimId: skillClaim.id,
      assessmentAttemptId: attempt.id,
      claimedProficiency: 'INTERMEDIATE',
      passed: true,
      marksEarned: 17,
      marksTotal: 20,
      scorePercent: 85,
      technicalFailure: false,
    },
  });

  console.log(`✅ Created skill verification attempt: ${verificationAttempt.id}`);

  // 9. Update skill claim to VERIFIED (since assessment passed and no interview required for INTERMEDIATE)
  const verifiedClaim = await prisma.skillClaim.update({
    where: { id: skillClaim.id },
    data: {
      status: 'VERIFIED',
      lastAttemptId: verificationAttempt.id,
      verifiedUntil: new Date(Date.now() + 180 * 24 * 60 * 60000), // 180 days validity
    },
  });

  console.log(`✅ Updated skill claim to VERIFIED (valid until ${verifiedClaim.verifiedUntil})\n`);

  // 10. Create a project with skill mapping
  const project = await prisma.project.create({
    data: {
      studentId: student.id,
      title: 'E-Commerce API Backend',
      problem:
        'Build a scalable REST API for an online marketplace supporting millions of users and transactions',
      approach:
        'Implemented microservices architecture with FastAPI and PostgreSQL, using Redis for caching and RabbitMQ for async tasks',
      stack: 'Python, FastAPI, PostgreSQL, Redis, Docker, AWS',
      outcome:
        'Achieved 99.9% uptime, handled 10k concurrent users, reduced API latency by 60% through caching strategies',
      loomUrl: 'https://www.loom.com/share/sample-project-demo',
      githubUrl: 'https://github.com/ramansh/ecommerce-api',
      liveUrl: 'https://api.example-ecommerce.com',
      status: 'SUBMITTED',
      isActive: true,
      ndaStatus: 'NO_NDA',
    },
  });

  console.log(`✅ Created project: ${project.id}`);

  // 11. Link project to Python skill
  const skillMapping = await prisma.projectSkillMapping.create({
    data: {
      projectId: project.id,
      skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
      specificContribution:
        'Built entire backend API service using FastAPI framework, implemented database models, API endpoints, authentication, and async job processing',
    },
  });

  console.log(`✅ Created project skill mapping\n`);

  console.log('✨ Data seeding complete!\n');
  console.log(`📊 Summary:`);
  console.log(`  ✓ Student: ${student.email}`);
  console.log(`  ✓ Skill: Python (INTERMEDIATE)`);
  console.log(`  ✓ Skill Claim Status: VERIFIED`);
  console.log(`  ✓ Assessment: Passed (85%)`);
  console.log(`  ✓ Project: E-Commerce API Backend`);
  console.log(`  ✓ Project Skill Mapping: Python\n`);

  await prisma.$disconnect();
}

seedRamansh().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
