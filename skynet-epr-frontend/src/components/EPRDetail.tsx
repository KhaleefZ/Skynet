'use client';

import type { EPRRecord } from '@/lib/types';
import { formatPeriodRange, formatDate, getStatusColor, renderStars, classNames } from '@/lib/utils';

interface EPRDetailProps {
  epr: EPRRecord;
  onBack: () => void;
  onEdit: () => void;
}

export function EPRDetail({ epr, onBack, onEdit }: EPRDetailProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-50';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to list
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit EPR
        </button>
      </div>

      {/* EPR Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Period and Status Header */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                📅 {formatPeriodRange(epr.periodStart, epr.periodEnd)}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Created {formatDate(epr.createdAt)}
                </span>
                {epr.updatedAt && epr.updatedAt !== epr.createdAt && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Updated {formatDate(epr.updatedAt)}
                  </span>
                )}
              </div>
            </div>
            <span className={classNames(
              'px-4 py-1.5 text-sm font-semibold rounded-full capitalize',
              getStatusColor(epr.status)
            )}>
              {epr.status === 'draft' && '📝 '}
              {epr.status === 'submitted' && '✅ '}
              {epr.status === 'archived' && '🗄️ '}
              {epr.status}
            </span>
          </div>
        </div>

        {/* Ratings */}
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            ⭐ Performance Ratings
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className={classNames('p-4 rounded-xl text-center', getRatingColor(epr.overallRating))}>
              <div className="text-xs font-medium uppercase tracking-wide opacity-80 mb-1">Overall</div>
              <div className="text-3xl font-bold">{epr.overallRating}</div>
              <div className="text-yellow-500 mt-1">{renderStars(epr.overallRating)}</div>
            </div>
            <div className={classNames('p-4 rounded-xl text-center', getRatingColor(epr.technicalSkillsRating))}>
              <div className="text-xs font-medium uppercase tracking-wide opacity-80 mb-1">🔧 Technical</div>
              <div className="text-3xl font-bold">{epr.technicalSkillsRating}</div>
              <div className="text-yellow-500 mt-1">{renderStars(epr.technicalSkillsRating)}</div>
            </div>
            <div className={classNames('p-4 rounded-xl text-center', getRatingColor(epr.nonTechnicalSkillsRating))}>
              <div className="text-xs font-medium uppercase tracking-wide opacity-80 mb-1">🤝 Non-Technical</div>
              <div className="text-3xl font-bold">{epr.nonTechnicalSkillsRating}</div>
              <div className="text-yellow-500 mt-1">{renderStars(epr.nonTechnicalSkillsRating)}</div>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            💬 Remarks
          </h3>
          {epr.remarks ? (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{epr.remarks}</p>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
              <span className="text-2xl mb-2 block">📝</span>
              <p className="text-gray-400 italic">No remarks provided</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
