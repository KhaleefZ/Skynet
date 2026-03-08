import { z } from 'zod';

// Schema for Creating/Updating an EPR
export const eprSchema = z.object({
  personId: z.string().uuid(),
  evaluatorId: z.string().uuid(),
  roleType: z.enum(['student', 'instructor']),
  periodStart: z.string().transform((str) => new Date(str)),
  periodEnd: z.string().transform((str) => new Date(str)),
  overallRating: z.number().min(1).max(5),
  technicalSkillsRating: z.number().min(1).max(5),
  nonTechnicalSkillsRating: z.number().min(1).max(5),
  remarks: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'archived']).default('draft'),
}).refine((data) => data.periodEnd >= data.periodStart, {
  message: "Period end date must be after or equal to start date",
  path: ["periodEnd"],
});