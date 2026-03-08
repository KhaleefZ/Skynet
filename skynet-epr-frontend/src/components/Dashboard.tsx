'use client';

import { useState, useEffect } from 'react';
import type { User, Person, EPRRecord } from '@/lib/types';
import { getPeople, getEPRs, getEPRSummary } from '@/lib/api';

interface DashboardProps {
  user: User;
  onSelectPerson: (person: Person) => void;
}

interface DashboardStats {
  totalStudents: number;
  totalInstructors: number;
  totalEPRs: number;
  draftEPRs: number;
  submittedEPRs: number;
  recentEPRs: EPRRecord[];
}

export function Dashboard({ user, onSelectPerson }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [myPerson, setMyPerson] = useState<Person | null>(null);
  const [myEPRs, setMyEPRs] = useState<EPRRecord[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (user.role === 'student') {
        // For students, load their own data
        const people = await getPeople({ search: user.email });
        const me = people.find(p => p.email === user.email);
        if (me) {
          setMyPerson(me);
          const eprs = await getEPRs(me.id);
          setMyEPRs(eprs);
        }
      } else {
        // For admin/instructor, load aggregate stats
        const [students, instructors] = await Promise.all([
          getPeople({ role: 'student' }),
          getPeople({ role: 'instructor' }),
        ]);

        // Get EPRs for first few students to calculate stats
        let allEPRs: EPRRecord[] = [];
        const studentsToCheck = students.slice(0, 10);
        for (const student of studentsToCheck) {
          try {
            const eprs = await getEPRs(student.id);
            allEPRs = [...allEPRs, ...eprs];
          } catch {
            // Skip if error
          }
        }

        setStats({
          totalStudents: students.length,
          totalInstructors: instructors.length,
          totalEPRs: allEPRs.length,
          draftEPRs: allEPRs.filter(e => e.status === 'draft').length,
          submittedEPRs: allEPRs.filter(e => e.status === 'submitted').length,
          recentEPRs: allEPRs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).slice(0, 5),
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Student Dashboard
  if (user.role === 'student') {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}!</h1>
            <p className="text-gray-500 mt-1">Here's your performance overview</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-3xl font-bold text-gray-900">{myEPRs.length}</div>
              <div className="text-gray-500 text-sm">Total Evaluations</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-3xl font-bold text-gray-900">
                {myEPRs.length > 0 
                  ? (myEPRs.reduce((acc, e) => acc + e.overallRating, 0) / myEPRs.length).toFixed(1)
                  : '-'
                }
              </div>
              <div className="text-gray-500 text-sm">Average Rating</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-4xl mb-2">✈️</div>
              <div className="text-3xl font-bold text-gray-900">{myPerson?.courseName?.split(' - ')[0] || '-'}</div>
              <div className="text-gray-500 text-sm">Current Course</div>
            </div>
          </div>

          {/* Recent EPRs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Your Evaluations</h2>
            </div>
            {myEPRs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-4xl block mb-2">📋</span>
                No evaluations yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {myEPRs.map((epr) => (
                  <div key={epr.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(epr.periodStart).toLocaleDateString()} - {new Date(epr.periodEnd).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {epr.remarks?.substring(0, 100)}...
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-500 text-lg">
                          {'★'.repeat(epr.overallRating)}{'☆'.repeat(5 - epr.overallRating)}
                        </div>
                        <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block mt-1 ${
                          epr.status === 'submitted' ? 'bg-green-100 text-green-700' :
                          epr.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {epr.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin/Instructor Dashboard
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user.role === 'admin' ? 'Admin Dashboard' : 'Instructor Dashboard'}
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-sm">Total Students</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalStudents || 0}</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎓</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-sm">Instructors</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalInstructors || 0}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👨‍🏫</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-sm">Total EPRs</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalEPRs || 0}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-sm">Draft EPRs</div>
                <div className="text-3xl font-bold text-yellow-600 mt-1">{stats?.draftEPRs || 0}</div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <p className="text-blue-100 text-sm mb-4">Common tasks at your fingertips</p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                + New EPR
              </button>
              {user.role === 'admin' && (
                <button className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                  + Add User
                </button>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Backend API</span>
                <span className="flex items-center gap-2 text-green-600 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database</span>
                <span className="flex items-center gap-2 text-green-600 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent EPRs</h2>
            <span className="text-sm text-gray-500">{stats?.recentEPRs?.length || 0} records</span>
          </div>
          {!stats?.recentEPRs?.length ? (
            <div className="p-8 text-center text-gray-500">
              <span className="text-4xl block mb-2">📊</span>
              No recent activity
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.recentEPRs.map((epr) => (
                <div key={epr.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        EPR for {epr.roleType}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(epr.periodStart).toLocaleDateString()} - {new Date(epr.periodEnd).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-500">
                        {'★'.repeat(epr.overallRating)}{'☆'.repeat(5 - epr.overallRating)}
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block mt-1 ${
                        epr.status === 'submitted' ? 'bg-green-100 text-green-700' :
                        epr.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {epr.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
