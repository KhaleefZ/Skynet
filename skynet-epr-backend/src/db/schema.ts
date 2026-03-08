import { pgTable, uuid, text, integer, timestamp, date, pgEnum, boolean } from 'drizzle-orm/pg-core';

// Enums for Roles and Statuses [cite: 64, 79, 92]
export const roleEnum = pgEnum('role', ['student', 'instructor', 'admin']);
export const statusEnum = pgEnum('status', ['active', 'completed', 'dropped']);
export const eprStatusEnum = pgEnum('epr_status', ['draft', 'submitted', 'approved', 'rejected', 'archived']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpiry: timestamp('password_reset_expiry'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Refresh tokens for JWT rotation
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // e.g. "PPL" [cite: 69]
  licenseType: text('license_type').notNull(),
  totalRequiredHours: integer('total_required_hours').notNull(),
});

export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'restrict' }),
  courseId: uuid('course_id').references(() => courses.id),
  startDate: date('start_date').notNull(),
  status: statusEnum('status').default('active'),
});

export const eprRecords = pgTable('epr_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').references(() => users.id).notNull(),
  evaluatorId: uuid('evaluator_id').references(() => users.id).notNull(),
  roleType: text('role_type').notNull(), // "student" or "instructor" [cite: 85]
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  overallRating: integer('overall_rating').notNull(), // 1-5 [cite: 150]
  technicalSkillsRating: integer('technical_skills_rating').notNull(),
  nonTechnicalSkillsRating: integer('non_technical_skills_rating').notNull(),
  remarks: text('remarks'),
  status: eprStatusEnum('status').default('draft'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Instructor-Student Assignments (Phase 4)
export const instructorAssignments = pgTable('instructor_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  instructorId: uuid('instructor_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});