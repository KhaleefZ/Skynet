import type { Request, Response } from 'express';
import { db } from '../config/db.js';
import { users, eprRecords, instructorAssignments } from '../db/schema.js';
import { eq, ilike, or, and, sql, inArray } from 'drizzle-orm';

export const getPeople = async (req: Request, res: Response) => {
  const { role, search } = req.query;
  const currentUser = req.user;

  try {
    const filters = [];
    
    // Role-based access control
    if (currentUser?.role === 'student') {
      // Students can only see themselves
      filters.push(eq(users.id, currentUser.userId));
    } else if (currentUser?.role === 'instructor') {
      // Instructors can see their assigned students + other instructors
      const assignments = await db.select({ studentId: instructorAssignments.studentId })
        .from(instructorAssignments)
        .where(and(
          eq(instructorAssignments.instructorId, currentUser.userId),
          eq(instructorAssignments.isActive, true)
        ));
      
      const assignedStudentIds = assignments.map(a => a.studentId);
      
      // Show self + assigned students + other instructors
      if (assignedStudentIds.length > 0) {
        filters.push(or(
          eq(users.id, currentUser.userId),
          inArray(users.id, assignedStudentIds),
          eq(users.role, 'instructor')
        ));
      } else {
        // No assignments - show only self and instructors
        filters.push(or(
          eq(users.id, currentUser.userId),
          eq(users.role, 'instructor')
        ));
      }
    }
    // Admins can see all users (no filter applied)
    
    // Apply query filters
    if (role) filters.push(eq(users.role, role as any));
    if (search) {
      filters.push(or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`)
      ));
    }

    const people = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      // For instructors: count of EPRs written
      totalEprsWritten: sql<number>`(SELECT count(*) FROM ${eprRecords} WHERE ${eprRecords.evaluatorId} = ${users.id})`.mapWith(Number),
    })
    .from(users)
    .where(filters.length > 0 ? and(...filters) : undefined);

    res.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({ error: 'Failed to fetch people' });
  }
};

export const getPersonById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const currentUser = req.user;

  try {
    // Check access permission
    if (currentUser?.role === 'student' && currentUser.userId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [person] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(eq(users.id, id));

    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json(person);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch person' });
  }
};

export const updatePerson = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, email, role } = req.body;

  try {
    const [updated] = await db.update(users)
      .set({ 
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isActive: updated.isActive,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update person' });
  }
};

export const toggleUserActive = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    // Get current status
    const [user] = await db.select().from(users).where(eq(users.id, id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Toggle active status
    const [updated] = await db.update(users)
      .set({ 
        isActive: !user.isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    res.json({
      id: updated!.id,
      name: updated!.name,
      isActive: updated!.isActive,
      message: updated!.isActive ? 'User activated' : 'User deactivated',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
};