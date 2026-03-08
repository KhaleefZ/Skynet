'use client';

import { useState, useEffect } from 'react';
import { getPendingReviews, reviewEPR, getEPRById } from '@/lib/api';

interface PendingEPR {
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
}

export function EPRReviewPanel() {
  const [pendingEPRs, setPendingEPRs] = useState<PendingEPR[]>([]);
  const [selectedEPR, setSelectedEPR] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadPendingEPRs();
  }, []);

  const loadPendingEPRs = async () => {
    try {
      const data = await getPendingReviews();
      setPendingEPRs(data);
    } catch (error) {
      console.error('Failed to load pending EPRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEPR = async (id: string) => {
    try {
      const epr = await getEPRById(id);
      setSelectedEPR(epr);
    } catch (error) {
      console.error('Failed to load EPR details:', error);
    }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedEPR) return;
    
    setReviewing(true);
    try {
      await reviewEPR(selectedEPR.id, action, reviewNotes || undefined);
      setSelectedEPR(null);
      setReviewNotes('');
      loadPendingEPRs();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to review EPR');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">EPR Reviews</h1>
          <p className="text-gray-500 mt-1">Review and approve submitted evaluations</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Pending List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Reviews ({pendingEPRs.length})
              </h2>
            </div>
            {pendingEPRs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-4xl block mb-2">✅</span>
                No pending reviews
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {pendingEPRs.map((epr) => (
                  <button
                    key={epr.id}
                    onClick={() => handleSelectEPR(epr.id)}
                    className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedEPR?.id === epr.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{epr.personName}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(epr.periodStart).toLocaleDateString()} - {new Date(epr.periodEnd).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-yellow-500">
                        {'★'.repeat(epr.overallRating)}{'☆'.repeat(5 - epr.overallRating)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* EPR Detail & Review */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Review Details</h2>
            </div>
            {!selectedEPR ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-4xl block mb-2">👈</span>
                Select an EPR to review
              </div>
            ) : (
              <div className="p-6">
                {/* Ratings */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedEPR.overallRating}</div>
                    <div className="text-xs text-gray-500">Overall</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedEPR.technicalSkillsRating}</div>
                    <div className="text-xs text-gray-500">Technical</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedEPR.nonTechnicalSkillsRating}</div>
                    <div className="text-xs text-gray-500">Non-Technical</div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Remarks</h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                    {selectedEPR.remarks || 'No remarks provided'}
                  </div>
                </div>

                {/* Review Notes */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Review Notes (Optional)</h3>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any feedback or notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview('reject')}
                    disabled={reviewing}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {reviewing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleReview('approve')}
                    disabled={reviewing}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {reviewing ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
