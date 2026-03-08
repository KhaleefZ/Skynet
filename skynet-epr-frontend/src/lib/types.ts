// TypeScript interfaces mirroring backend schema

export type Role = 'student' | 'instructor' | 'admin';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';
export type EPRStatus = 'draft' | 'submitted' | 'archived';

export interface Person {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string | null;
  // Joined fields from backend
  courseName?: string | null;
  enrollmentStatus?: EnrollmentStatus | null;
  totalEprsWritten?: number;
}

export interface Course {
  id: string;
  name: string;
  licenseType: string;
  totalRequiredHours: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  startDate: string;
  status: EnrollmentStatus;
}

export interface EPRRecord {
  id: string;
  personId: string;
  evaluatorId: string;
  roleType: Role;
  periodStart: string;
  periodEnd: string;
  overallRating: number;
  technicalSkillsRating: number;
  nonTechnicalSkillsRating: number;
  remarks: string | null;
  status: EPRStatus;
  createdAt: string;
  updatedAt: string | null;
}

// API request/response types
export interface CreateEPRRequest {
  personId: string;
  evaluatorId: string;
  roleType: Role;
  periodStart: string;
  periodEnd: string;
  overallRating: number;
  technicalSkillsRating: number;
  nonTechnicalSkillsRating: number;
  remarks?: string;
  status: EPRStatus;
}

export interface UpdateEPRRequest {
  overallRating?: number;
  technicalSkillsRating?: number;
  nonTechnicalSkillsRating?: number;
  remarks?: string;
  status?: EPRStatus;
}

// Level 2A: Summary response
export interface EPRSummary {
  personId: string;
  totalRecords: number;
  averages: {
    overall: number;
    technical: number;
    nonTechnical: number;
  };
  trend: 'improving' | 'declining' | 'stable';
  recentPeriods: {
    periodStart: string;
    periodEnd: string;
    overallRating: number;
    status: EPRStatus;
  }[];
}

// Level 2C: AI Assist request/response
export interface AssistRequest {
  technicalSkillsRating: number;
  nonTechnicalSkillsRating: number;
  overallRating?: number;
  roleType?: Role;
}

export interface AssistResponse {
  generatedRemarks: string;
  suggestions: string[];
  recommendedOverallRating: number;
}

// =============================================================================
// Auth Types
// =============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  message: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AdminResetPasswordRequest {
  userId: string;
  newPassword: string;
}
