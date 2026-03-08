import type { Request, Response } from 'express';
import { db } from '../config/db.js';
import { users, eprRecords, instructorAssignments } from '../db/schema.js';
import { eq, and, sql, count } from 'drizzle-orm';

// Get all users with detailed info (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      eprCount: sql<number>`(SELECT count(*) FROM ${eprRecords} WHERE ${eprRecords.personId} = ${users.id})`.mapWith(Number),
      eprsWritten: sql<number>`(SELECT count(*) FROM ${eprRecords} WHERE ${eprRecords.evaluatorId} = ${users.id})`.mapWith(Number),
    })
    .from(users)
    .orderBy(users.createdAt);

    res.json(allUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  const currentUser = req.user;

  try {
    // Count users by role
    const userCounts = await db.select({
      role: users.role,
      count: count(),
    })
    .from(users)
    .where(eq(users.isActive, true))
    .groupBy(users.role);

    // Count EPRs by status
    const eprCounts = await db.select({
      status: eprRecords.status,
      count: count(),
    })
    .from(eprRecords)
    .groupBy(eprRecords.status);

    // Get recent EPRs
    const recentEprs = await db.select({
      id: eprRecords.id,
      personId: eprRecords.personId,
      evaluatorId: eprRecords.evaluatorId,
      roleType: eprRecords.roleType,
      overallRating: eprRecords.overallRating,
      status: eprRecords.status,
      createdAt: eprRecords.createdAt,
      personName: users.name,
    })
    .from(eprRecords)
    .leftJoin(users, eq(eprRecords.personId, users.id))
    .orderBy(sql`${eprRecords.createdAt} DESC`)
    .limit(10);

    // For instructors, get their assigned students count
    let assignedStudents = 0;
    if (currentUser?.role === 'instructor') {
      const assignments = await db.select({ count: count() })
        .from(instructorAssignments)
        .where(and(
          eq(instructorAssignments.instructorId, currentUser.userId),
          eq(instructorAssignments.isActive, true)
        ));
      assignedStudents = assignments[0]?.count || 0;
    }

    const stats = {
      users: {
        total: userCounts.reduce((sum, u) => sum + u.count, 0),
        students: userCounts.find(u => u.role === 'student')?.count || 0,
        instructors: userCounts.find(u => u.role === 'instructor')?.count || 0,
        admins: userCounts.find(u => u.role === 'admin')?.count || 0,
      },
      eprs: {
        total: eprCounts.reduce((sum, e) => sum + e.count, 0),
        draft: eprCounts.find(e => e.status === 'draft')?.count || 0,
        submitted: eprCounts.find(e => e.status === 'submitted')?.count || 0,
        approved: eprCounts.find(e => e.status === 'approved')?.count || 0,
        rejected: eprCounts.find(e => e.status === 'rejected')?.count || 0,
      },
      recentEprs,
      ...(currentUser?.role === 'instructor' && { assignedStudents }),
    };

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Get instructor-student assignments
export const getAssignments = async (req: Request, res: Response) => {
  const { instructorId } = req.query;

  try {
    let query = db.select({
      id: instructorAssignments.id,
      instructorId: instructorAssignments.instructorId,
      studentId: instructorAssignments.studentId,
      assignedAt: instructorAssignments.assignedAt,
      isActive: instructorAssignments.isActive,
    })
    .from(instructorAssignments);

    if (instructorId) {
      query = query.where(eq(instructorAssignments.instructorId, instructorId as string)) as typeof query;
    }

    const assignments = await query;

    // Enrich with user names
    const enrichedAssignments = await Promise.all(
      assignments.map(async (a) => {
        const [instructor] = await db.select({ name: users.name }).from(users).where(eq(users.id, a.instructorId));
        const [student] = await db.select({ name: users.name }).from(users).where(eq(users.id, a.studentId));
        return {
          ...a,
          instructorName: instructor?.name || 'Unknown',
          studentName: student?.name || 'Unknown',
        };
      })
    );

    res.json(enrichedAssignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

// Create instructor-student assignment
export const createAssignment = async (req: Request, res: Response) => {
  const { instructorId, studentId } = req.body;

  if (!instructorId || !studentId) {
    return res.status(400).json({ error: 'instructorId and studentId are required' });
  }

  try {
    // Validate instructor and student exist and have correct roles
    const [instructor] = await db.select().from(users).where(eq(users.id, instructorId));
    const [student] = await db.select().from(users).where(eq(users.id, studentId));

    if (!instructor || instructor.role !== 'instructor') {
      return res.status(400).json({ error: 'Invalid instructor ID or user is not an instructor' });
    }
    if (!student || student.role !== 'student') {
      return res.status(400).json({ error: 'Invalid student ID or user is not a student' });
    }

    // Check if assignment already exists
    const [existing] = await db.select()
      .from(instructorAssignments)
      .where(and(
        eq(instructorAssignments.instructorId, instructorId),
        eq(instructorAssignments.studentId, studentId)
      ));

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        const [updated] = await db.update(instructorAssignments)
          .set({ isActive: true, assignedAt: new Date() })
          .where(eq(instructorAssignments.id, existing.id))
          .returning();
        return res.json({ ...updated, message: 'Assignment reactivated' });
      }
      return res.status(400).json({ error: 'Assignment already exists' });
    }

    // Create new assignment
    const [newAssignment] = await db.insert(instructorAssignments)
      .values({ instructorId, studentId })
      .returning();

    res.status(201).json({
      ...newAssignment,
      instructorName: instructor.name,
      studentName: student.name,
      message: 'Assignment created successfully',
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

// Remove/deactivate assignment
export const removeAssignment = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const [updated] = await db.update(instructorAssignments)
      .set({ isActive: false })
      .where(eq(instructorAssignments.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ ...updated, message: 'Assignment removed' });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
};
