import { db } from '../config/db.js';
import { users, eprRecords, enrollments, courses } from '../db/schema.js';
import { eq, ilike, or, and, sql } from 'drizzle-orm';

export const fetchPeople = async (role?: string, search?: string) => {
  const filters = [];
  if (role) filters.push(eq(users.role, role as any));
  if (search) {
    filters.push(or(
      ilike(users.name, `%${search}%`),
      ilike(users.email, `%${search}%`)
    ));
  }

  return await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    courseName: courses.name,
    enrollmentStatus: enrollments.status,
    totalEprsWritten: sql<number>`(SELECT count(*) FROM ${eprRecords} WHERE ${eprRecords.evaluatorId} = ${users.id})`.mapWith(Number),
  })
  .from(users)
  .leftJoin(enrollments, eq(users.id, enrollments.studentId))
  .leftJoin(courses, eq(enrollments.courseId, courses.id))
  .where(and(...filters));
};