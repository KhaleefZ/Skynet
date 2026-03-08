import { db } from '../config/db.js';
import { users, courses, enrollments, eprRecords } from './schema.js';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

// Default password for all seeded users (for demo purposes)
const DEFAULT_PASSWORD = 'Password123!';
const SALT_ROUNDS = 10;

async function seed() {
  console.log('🌱 Seeding database...');
  
  // Hash the default password
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // 0. Create Admin
  const adminId = randomUUID();
  await db.insert(users).values({
    id: adminId,
    name: 'Admin User',
    email: 'admin@skynet.com',
    passwordHash,
    role: 'admin',
  });

  // 1. Create Instructors (3 total)
  const instructorIds = [randomUUID(), randomUUID(), randomUUID()];
  await db.insert(users).values([
    { id: instructorIds[0], name: 'Capt. Sarah Miller', email: 'sarah.m@skynet.com', passwordHash, role: 'instructor' },
    { id: instructorIds[1], name: 'Capt. James Chen', email: 'james.c@skynet.com', passwordHash, role: 'instructor' },
    { id: instructorIds[2], name: 'Capt. Maria Santos', email: 'maria.s@skynet.com', passwordHash, role: 'instructor' },
  ]);

  // 2. Create Courses
  const courseIds = [randomUUID(), randomUUID()];
  await db.insert(courses).values([
    { id: courseIds[0], name: 'PPL - Private Pilot License', licenseType: 'PPL', totalRequiredHours: 45 },
    { id: courseIds[1], name: 'CPL Integrated', licenseType: 'CPL', totalRequiredHours: 150 },
  ]);

  // 3. Create Students (8)
  const students = Array.from({ length: 8 }).map((_, i) => ({
    id: randomUUID(),
    name: `Student Pilot ${i + 1}`,
    email: `student${i + 1}@airman.edu`,
    passwordHash,
    role: 'student' as const,
  }));
  await db.insert(users).values(students);

  // 4. Create Enrollments
  for (let i = 0; i < students.length; i++) {
    const student = students[i]!;
    await db.insert(enrollments).values({
      studentId: student.id,
      courseId: i % 2 === 0 ? courseIds[0]! : courseIds[1]!,
      startDate: '2025-01-01',
      status: 'active',
    });
  }

  // 5. Create EPR Records (~12 total, mix of statuses and periods)
  const eprData = [
    // Student 1: 3 EPRs (showing progress over time)
    {
      personId: students[0]!.id,
      evaluatorId: instructorIds[0]!,
      roleType: 'student',
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      overallRating: 3,
      technicalSkillsRating: 3,
      nonTechnicalSkillsRating: 3,
      remarks: 'Initial training phase. Shows promise but needs more practice on basic maneuvers.',
      status: 'submitted' as const,
    },
    {
      personId: students[0]!.id,
      evaluatorId: instructorIds[0]!,
      roleType: 'student',
      periodStart: '2025-02-01',
      periodEnd: '2025-02-28',
      overallRating: 4,
      technicalSkillsRating: 4,
      nonTechnicalSkillsRating: 4,
      remarks: 'Significant improvement in navigation skills. Good radio communication.',
      status: 'submitted' as const,
    },
    {
      personId: students[0]!.id,
      evaluatorId: instructorIds[0]!,
      roleType: 'student',
      periodStart: '2025-03-01',
      periodEnd: '2025-03-31',
      overallRating: 5,
      technicalSkillsRating: 5,
      nonTechnicalSkillsRating: 4,
      remarks: 'Excellent progress! Ready for solo cross-country flights.',
      status: 'draft' as const,
    },
    // Student 2: 2 EPRs
    {
      personId: students[1]!.id,
      evaluatorId: instructorIds[1]!,
      roleType: 'student',
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      overallRating: 4,
      technicalSkillsRating: 4,
      nonTechnicalSkillsRating: 4,
      remarks: 'Strong start. Natural aptitude for instrument flying.',
      status: 'submitted' as const,
    },
    {
      personId: students[1]!.id,
      evaluatorId: instructorIds[1]!,
      roleType: 'student',
      periodStart: '2025-02-01',
      periodEnd: '2025-02-28',
      overallRating: 4,
      technicalSkillsRating: 5,
      nonTechnicalSkillsRating: 3,
      remarks: 'Technical skills improving. Needs work on crew coordination.',
      status: 'submitted' as const,
    },
    // Student 3: 2 EPRs (needs improvement)
    {
      personId: students[2]!.id,
      evaluatorId: instructorIds[0]!,
      roleType: 'student',
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      overallRating: 2,
      technicalSkillsRating: 2,
      nonTechnicalSkillsRating: 3,
      remarks: 'Struggling with basic procedures. Additional ground school recommended.',
      status: 'submitted' as const,
    },
    {
      personId: students[2]!.id,
      evaluatorId: instructorIds[0]!,
      roleType: 'student',
      periodStart: '2025-02-01',
      periodEnd: '2025-02-28',
      overallRating: 3,
      technicalSkillsRating: 3,
      nonTechnicalSkillsRating: 3,
      remarks: 'Some improvement noted after extra simulator sessions.',
      status: 'draft' as const,
    },
    // Student 4: 1 EPR
    {
      personId: students[3]!.id,
      evaluatorId: instructorIds[2]!,
      roleType: 'student',
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      overallRating: 5,
      technicalSkillsRating: 5,
      nonTechnicalSkillsRating: 5,
      remarks: 'Exceptional performance across all areas. Potential instructor candidate.',
      status: 'submitted' as const,
    },
    // Student 5: 1 EPR (archived)
    {
      personId: students[4]!.id,
      evaluatorId: instructorIds[1]!,
      roleType: 'student',
      periodStart: '2024-10-01',
      periodEnd: '2024-12-31',
      overallRating: 4,
      technicalSkillsRating: 4,
      nonTechnicalSkillsRating: 4,
      remarks: 'Completed pre-solo phase successfully.',
      status: 'archived' as const,
    },
    // Instructor EPRs (evaluation of instructors)
    {
      personId: instructorIds[0]!,
      evaluatorId: adminId,
      roleType: 'instructor',
      periodStart: '2024-10-01',
      periodEnd: '2024-12-31',
      overallRating: 5,
      technicalSkillsRating: 5,
      nonTechnicalSkillsRating: 5,
      remarks: 'Capt. Miller continues to demonstrate exceptional instructional abilities.',
      status: 'submitted' as const,
    },
    {
      personId: instructorIds[1]!,
      evaluatorId: adminId,
      roleType: 'instructor',
      periodStart: '2024-10-01',
      periodEnd: '2024-12-31',
      overallRating: 4,
      technicalSkillsRating: 5,
      nonTechnicalSkillsRating: 4,
      remarks: 'Capt. Chen shows strong technical instruction. Developing mentorship skills.',
      status: 'submitted' as const,
    },
    // Student 6: 1 draft EPR
    {
      personId: students[5]!.id,
      evaluatorId: instructorIds[2]!,
      roleType: 'student',
      periodStart: '2025-03-01',
      periodEnd: '2025-03-31',
      overallRating: 3,
      technicalSkillsRating: 3,
      nonTechnicalSkillsRating: 4,
      remarks: 'Mid-term evaluation in progress.',
      status: 'draft' as const,
    },
  ];

  await db.insert(eprRecords).values(eprData);

  console.log('✅ Seeding complete!');
  console.log(`   - 1 Admin`);
  console.log(`   - 3 Instructors`);
  console.log(`   - 8 Students`);
  console.log(`   - 2 Courses`);
  console.log(`   - 8 Enrollments`);
  console.log(`   - ${eprData.length} EPR Records`);
  console.log('');
  console.log('📧 Login Credentials (same password for all):');
  console.log(`   Admin:      admin@skynet.com`);
  console.log(`   Instructor: sarah.m@skynet.com`);
  console.log(`   Student:    student1@airman.edu`);
  console.log(`   Password:   ${DEFAULT_PASSWORD}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});