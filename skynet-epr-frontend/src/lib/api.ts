// Typed API client for backend communication

import type {
  Person,
  EPRRecord,
  EPRSummary,
  CreateEPRRequest,
  UpdateEPRRequest,
  AssistRequest,
  AssistResponse,
  Role,
  User,
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AdminResetPasswordRequest,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Base fetch wrapper with cookie-based auth
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// Auth API
// =============================================================================

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/logout', {
    method: 'POST',
  });
}

export async function refreshTokens(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/refresh', {
    method: 'POST',
  });
}

export async function getCurrentUser(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>('/auth/me');
}

export async function createUser(data: CreateUserRequest): Promise<{ user: User; message: string }> {
  return apiFetch<{ user: User; message: string }>('/auth/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string; resetToken?: string }> {
  return apiFetch<{ message: string; resetToken?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminResetPassword(data: AdminResetPasswordRequest): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/admin/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =============================================================================
// People API
// =============================================================================

export async function getPeople(params?: {
  role?: Role;
  search?: string;
}): Promise<Person[]> {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.set('role', params.role);
  if (params?.search) searchParams.set('search', params.search);
  
  const query = searchParams.toString();
  return apiFetch<Person[]>(`/people${query ? `?${query}` : ''}`);
}

// =============================================================================
// EPR API
// =============================================================================

export async function getEPRs(personId: string): Promise<EPRRecord[]> {
  return apiFetch<EPRRecord[]>(`/epr?personId=${personId}`);
}

export async function getEPRById(id: string): Promise<EPRRecord> {
  return apiFetch<EPRRecord>(`/epr/${id}`);
}

export async function createEPR(data: CreateEPRRequest): Promise<EPRRecord> {
  return apiFetch<EPRRecord>('/epr', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEPR(id: string, data: UpdateEPRRequest): Promise<EPRRecord> {
  return apiFetch<EPRRecord>(`/epr/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// =============================================================================
// Level 2A: Summary API
// =============================================================================

export async function getEPRSummary(personId: string): Promise<EPRSummary> {
  return apiFetch<EPRSummary>(`/epr/summary/${personId}`);
}

// =============================================================================
// Level 2C: AI Assist API
// =============================================================================

export async function getAssistRemarks(data: AssistRequest): Promise<AssistResponse> {
  return apiFetch<AssistResponse>('/epr/assist', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =============================================================================
// Phase 3: EPR Workflow API
// =============================================================================

export async function submitEPR(id: string): Promise<EPRRecord & { message: string }> {
  return apiFetch<EPRRecord & { message: string }>(`/epr/${id}/submit`, {
    method: 'POST',
  });
}

export async function reviewEPR(id: string, action: 'approve' | 'reject', notes?: string): Promise<EPRRecord & { message: string }> {
  return apiFetch<EPRRecord & { message: string }>(`/epr/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, notes }),
  });
}

export async function getPendingReviews(): Promise<Array<{
  id: string;
  personId: string;
  evaluatorId: string;
  roleType: string;
  periodStart: string;
  periodEnd: string;
  overallRating: number;
  status: string;
  createdAt: string;
  personName: string;
}>> {
  return apiFetch<Array<{
    id: string;
    personId: string;
    evaluatorId: string;
    roleType: string;
    periodStart: string;
    periodEnd: string;
    overallRating: number;
    status: string;
    createdAt: string;
    personName: string;
  }>>('/epr/pending-reviews');
}

// =============================================================================
// Phase 4: Export & Reports API
// =============================================================================

export async function exportEPRReport(personId: string, format: 'json' | 'csv' = 'json') {
  if (format === 'csv') {
    // For CSV, we need to handle it differently
    const response = await fetch(`${API_URL}/epr/export/${personId}?format=csv`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  }
  return apiFetch<{
    generatedAt: string;
    person: { id: string; name: string; email: string; role: string };
    summary: {
      totalEvaluations: number;
      approvedEvaluations: number;
      averageRatings: { overall: number; technical: number; nonTechnical: number };
    };
    evaluations: Array<{
      id: string;
      periodStart: string;
      periodEnd: string;
      roleType: string;
      ratings: { overall: number; technical: number; nonTechnical: number };
      remarks: string;
      status: string;
      createdAt: string;
    }>;
  }>(`/epr/export/${personId}?format=json`);
}

// =============================================================================
// Phase 4: Admin API
// =============================================================================

export interface DashboardStats {
  users: {
    total: number;
    students: number;
    instructors: number;
    admins: number;
  };
  eprs: {
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
  };
  recentEprs: Array<{
    id: string;
    personId: string;
    evaluatorId: string;
    roleType: string;
    overallRating: number;
    status: string;
    createdAt: string;
    personName: string;
  }>;
  assignedStudents?: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/admin/stats');
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  eprCount: number;
  eprsWritten: number;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/admin/users');
}

export async function toggleUserActive(userId: string): Promise<{ id: string; name: string; isActive: boolean; message: string }> {
  return apiFetch<{ id: string; name: string; isActive: boolean; message: string }>(`/people/${userId}/toggle-active`, {
    method: 'POST',
  });
}

export interface Assignment {
  id: string;
  instructorId: string;
  studentId: string;
  assignedAt: string;
  isActive: boolean;
  instructorName: string;
  studentName: string;
}

export async function getAssignments(instructorId?: string): Promise<Assignment[]> {
  const query = instructorId ? `?instructorId=${instructorId}` : '';
  return apiFetch<Assignment[]>(`/admin/assignments${query}`);
}

export async function createAssignment(instructorId: string, studentId: string): Promise<Assignment & { message: string }> {
  return apiFetch<Assignment & { message: string }>('/admin/assignments', {
    method: 'POST',
    body: JSON.stringify({ instructorId, studentId }),
  });
}

export async function removeAssignment(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/assignments/${id}`, {
    method: 'DELETE',
  });
}
