import type { Request, Response } from 'express';
import { db } from '../config/db.js';
import { eprRecords, users, instructorAssignments } from '../db/schema.js';
import { eq, desc, and, or, inArray } from 'drizzle-orm';

export const getEprs = async (req: Request, res: Response) => {
  const { personId } = req.query;
  if (!personId) return res.status(400).json({ error: 'personId is required' });

  const records = await db.select()
    .from(eprRecords)
    .where(eq(eprRecords.personId, personId as string))
    .orderBy(desc(eprRecords.periodStart));
  
  res.json(records);
};

export const getEprDetail = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  
  try {
    const record = await db.select()
      .from(eprRecords)
      .where(eq(eprRecords.id, id));
    
    if (record.length === 0) {
      return res.status(404).json({ error: 'EPR not found' });
    }
    
    res.json(record[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch EPR' });
  }
};

export const createEpr = async (req: Request, res: Response) => {
  const data = req.body;

  // Validation: Ratings 1-5 and period logic
  if (data.overallRating < 1 || data.overallRating > 5) {
    return res.status(400).json({ error: 'Ratings must be between 1 and 5' });
  }
  if (new Date(data.periodEnd) < new Date(data.periodStart)) {
    return res.status(400).json({ error: 'periodEnd must be >= periodStart' });
  }

  try {
    const newRecord = await db.insert(eprRecords).values(data).returning();
    res.status(201).json(newRecord[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create EPR' });
  }
};

export const updateEpr = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;

  try {
    const result = await db.update(eprRecords)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(eprRecords.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'EPR not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update EPR' });
  }
};

// Level 2A: Performance Summary
export const getSummary = async (req: Request, res: Response) => {
  const personId = req.params.personId as string;
  
  if (!personId) {
    return res.status(400).json({ error: 'personId is required' });
  }

  try {
    // Get all EPRs for this person
    const records = await db.select()
      .from(eprRecords)
      .where(eq(eprRecords.personId, personId))
      .orderBy(desc(eprRecords.periodStart));

    if (records.length === 0) {
      return res.status(404).json({ error: 'No EPR records found for this person' });
    }

    // Calculate averages
    const totalRecords = records.length;
    const avgOverall = records.reduce((sum, r) => sum + r.overallRating, 0) / totalRecords;
    const avgTechnical = records.reduce((sum, r) => sum + r.technicalSkillsRating, 0) / totalRecords;
    const avgNonTechnical = records.reduce((sum, r) => sum + r.nonTechnicalSkillsRating, 0) / totalRecords;

    // Get last 3 periods for trend
    const last3 = records.slice(0, 3);
    
    // Calculate trend direction (comparing oldest to newest of last 3)
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (last3.length >= 2) {
      const newest = last3[0]!.overallRating;
      const oldest = last3[last3.length - 1]!.overallRating;
      if (newest > oldest) trend = 'improving';
      else if (newest < oldest) trend = 'declining';
    }

    res.json({
      personId,
      totalRecords,
      averages: {
        overall: Math.round(avgOverall * 10) / 10,
        technical: Math.round(avgTechnical * 10) / 10,
        nonTechnical: Math.round(avgNonTechnical * 10) / 10,
      },
      trend,
      recentPeriods: last3.map(r => ({
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        overallRating: r.overallRating,
        status: r.status,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

// Level 2C: AI-Assist for Remarks Generation (Rule-based)
export const getAssist = async (req: Request, res: Response) => {
  const { technicalSkillsRating, nonTechnicalSkillsRating, overallRating, roleType } = req.body;

  // Validate inputs
  if (technicalSkillsRating === undefined || nonTechnicalSkillsRating === undefined) {
    return res.status(400).json({ error: 'technicalSkillsRating and nonTechnicalSkillsRating are required' });
  }

  const remarks: string[] = [];
  const suggestions: string[] = [];

  // Technical skills assessment
  if (technicalSkillsRating >= 4) {
    remarks.push('Demonstrates strong technical proficiency and aircraft handling skills.');
    if (technicalSkillsRating === 5) {
      remarks.push('Exceptional command of technical procedures; ready for advanced training phases.');
    }
  } else if (technicalSkillsRating === 3) {
    remarks.push('Technical skills meet expected standards for current training phase.');
    suggestions.push('Continue practicing emergency procedures and instrument scanning.');
  } else {
    remarks.push('Technical skills require additional development and focused practice.');
    suggestions.push('Recommend additional simulator sessions for procedural reinforcement.');
    suggestions.push('Review checklist discipline and standard operating procedures.');
  }

  // Non-technical skills assessment
  if (nonTechnicalSkillsRating >= 4) {
    remarks.push('Exhibits excellent crew resource management and communication skills.');
    if (nonTechnicalSkillsRating === 5) {
      remarks.push('Outstanding situational awareness and decision-making under pressure.');
    }
  } else if (nonTechnicalSkillsRating === 3) {
    remarks.push('Non-technical skills are adequate for current training level.');
    suggestions.push('Focus on workload management during high-traffic scenarios.');
  } else {
    remarks.push('Non-technical skills need improvement, particularly in situational awareness.');
    suggestions.push('Practice radio communications and ATC interactions.');
    suggestions.push('Work on assertiveness and clear communication with crew members.');
  }

  // Overall assessment
  const avgRating = ((technicalSkillsRating + nonTechnicalSkillsRating) / 2);
  if (avgRating >= 4) {
    remarks.push('Overall performance is commendable. On track for timely course completion.');
  } else if (avgRating < 3) {
    remarks.push('Requires close monitoring and additional support to meet training objectives.');
    suggestions.push('Consider scheduling a progress review meeting.');
  }

  res.json({
    generatedRemarks: remarks.join(' '),
    suggestions,
    recommendedOverallRating: Math.round(avgRating),
  });
};

// EPR Workflow: Submit for review (Phase 3)
export const submitEpr = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const currentUser = req.user;

  try {
    // Get the EPR
    const [epr] = await db.select().from(eprRecords).where(eq(eprRecords.id, id));
    
    if (!epr) {
      return res.status(404).json({ error: 'EPR not found' });
    }

    // Only the evaluator can submit their own EPR
    if (epr.evaluatorId !== currentUser?.userId && currentUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Only the evaluator or admin can submit this EPR' });
    }

    // Can only submit drafts
    if (epr.status !== 'draft') {
      return res.status(400).json({ error: `Cannot submit EPR with status '${epr.status}'` });
    }

    // Update status to submitted
    const [updated] = await db.update(eprRecords)
      .set({ status: 'submitted', updatedAt: new Date() })
      .where(eq(eprRecords.id, id as string))
      .returning();

    res.json({
      ...updated,
      message: 'EPR submitted for review',
    });
  } catch (error) {
    console.error('Submit EPR error:', error);
    res.status(500).json({ error: 'Failed to submit EPR' });
  }
};

// EPR Workflow: Review (approve/reject) - Phase 3
export const reviewEpr = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { action, notes } = req.body; // action: 'approve' | 'reject'
  const currentUser = req.user;

  try {
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
    }

    // Get the EPR
    const [epr] = await db.select().from(eprRecords).where(eq(eprRecords.id, id));
    
    if (!epr) {
      return res.status(404).json({ error: 'EPR not found' });
    }

    // Can only review submitted EPRs
    if (epr.status !== 'submitted') {
      return res.status(400).json({ error: `Cannot review EPR with status '${epr.status}'` });
    }

    // Evaluator cannot review their own EPR
    if (epr.evaluatorId === currentUser?.userId) {
      return res.status(403).json({ error: 'Cannot review your own EPR' });
    }

    // Update EPR status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const [updated] = await db.update(eprRecords)
      .set({ 
        status: newStatus,
        reviewedBy: currentUser?.userId,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(eprRecords.id, id as string))
      .returning();

    res.json({
      ...updated,
      message: `EPR ${action}d successfully`,
    });
  } catch (error) {
    console.error('Review EPR error:', error);
    res.status(500).json({ error: 'Failed to review EPR' });
  }
};

// Get pending EPRs for review - Phase 3
export const getPendingReviews = async (req: Request, res: Response) => {
  const currentUser = req.user;

  try {
    let query = db.select({
      id: eprRecords.id,
      personId: eprRecords.personId,
      evaluatorId: eprRecords.evaluatorId,
      roleType: eprRecords.roleType,
      periodStart: eprRecords.periodStart,
      periodEnd: eprRecords.periodEnd,
      overallRating: eprRecords.overallRating,
      status: eprRecords.status,
      createdAt: eprRecords.createdAt,
      personName: users.name,
    })
    .from(eprRecords)
    .leftJoin(users, eq(eprRecords.personId, users.id))
    .where(eq(eprRecords.status, 'submitted'));

    // Instructors can only see EPRs they didn't write (for their assigned students)
    if (currentUser?.role === 'instructor') {
      // Get instructor's assigned students
      const assignments = await db.select({ studentId: instructorAssignments.studentId })
        .from(instructorAssignments)
        .where(and(
          eq(instructorAssignments.instructorId, currentUser.userId),
          eq(instructorAssignments.isActive, true)
        ));

      const assignedStudentIds = assignments.map(a => a.studentId);
      
      if (assignedStudentIds.length > 0) {
        query = db.select({
          id: eprRecords.id,
          personId: eprRecords.personId,
          evaluatorId: eprRecords.evaluatorId,
          roleType: eprRecords.roleType,
          periodStart: eprRecords.periodStart,
          periodEnd: eprRecords.periodEnd,
          overallRating: eprRecords.overallRating,
          status: eprRecords.status,
          createdAt: eprRecords.createdAt,
          personName: users.name,
        })
        .from(eprRecords)
        .leftJoin(users, eq(eprRecords.personId, users.id))
        .where(and(
          eq(eprRecords.status, 'submitted'),
          inArray(eprRecords.personId, assignedStudentIds),
          // Exclude their own EPRs
          or(
            eq(eprRecords.evaluatorId, currentUser.userId),
          )
        ));
      }
    }

    const pending = await query.orderBy(desc(eprRecords.createdAt));
    
    res.json(pending);
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
};

// Export EPR report - Phase 4
export const exportEprReport = async (req: Request, res: Response) => {
  const personId = req.params.personId as string;
  const { format = 'json' } = req.query;
  const currentUser = req.user;

  try {
    // Authorization check
    if (currentUser?.role === 'student' && currentUser.userId !== personId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get person details
    const [person] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    }).from(users).where(eq(users.id, personId));

    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // Get all EPRs for this person
    const records = await db.select()
      .from(eprRecords)
      .where(eq(eprRecords.personId, personId))
      .orderBy(desc(eprRecords.periodStart));

    // Calculate statistics
    const totalRecords = records.length;
    const approvedRecords = records.filter(r => r.status === 'approved').length;
    const avgOverall = totalRecords > 0 
      ? records.reduce((sum, r) => sum + r.overallRating, 0) / totalRecords 
      : 0;
    const avgTechnical = totalRecords > 0 
      ? records.reduce((sum, r) => sum + r.technicalSkillsRating, 0) / totalRecords 
      : 0;
    const avgNonTechnical = totalRecords > 0 
      ? records.reduce((sum, r) => sum + r.nonTechnicalSkillsRating, 0) / totalRecords 
      : 0;

    const report = {
      generatedAt: new Date().toISOString(),
      person: {
        id: person.id,
        name: person.name,
        email: person.email,
        role: person.role,
      },
      summary: {
        totalEvaluations: totalRecords,
        approvedEvaluations: approvedRecords,
        averageRatings: {
          overall: Math.round(avgOverall * 10) / 10,
          technical: Math.round(avgTechnical * 10) / 10,
          nonTechnical: Math.round(avgNonTechnical * 10) / 10,
        },
      },
      evaluations: records.map(r => ({
        id: r.id,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        roleType: r.roleType,
        ratings: {
          overall: r.overallRating,
          technical: r.technicalSkillsRating,
          nonTechnical: r.nonTechnicalSkillsRating,
        },
        remarks: r.remarks,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };

    if (format === 'csv') {
      // Generate CSV
      const headers = 'Period Start,Period End,Role Type,Overall,Technical,Non-Technical,Status,Remarks\n';
      const rows = records.map(r => 
        `${r.periodStart},${r.periodEnd},${r.roleType},${r.overallRating},${r.technicalSkillsRating},${r.nonTechnicalSkillsRating},${r.status},"${(r.remarks || '').replace(/"/g, '""')}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${person.name.replace(/\s+/g, '_')}_EPR_Report.csv"`);
      return res.send(headers + rows);
    }

    res.json(report);
  } catch (error) {
    console.error('Export EPR report error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
};