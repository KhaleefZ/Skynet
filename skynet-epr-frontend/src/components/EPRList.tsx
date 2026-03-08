'use client';

import type { EPRRecord } from '@/lib/types';
import { classNames, formatPeriodRange, getStatusColor, renderStars } from '@/lib/utils';
import { EPRListSkeleton } from '@/components/ui/Loading';

interface EPRListProps {
  eprs: EPRRecord[];
  loading: boolean;
  selectedEPR: EPRRecord | null;
  onSelectEPR: (epr: EPRRecord) => void;
  onCreateNew: () => void;
}

export function EPRList({ eprs, loading, selectedEPR, onSelectEPR, onCreateNew }: EPRListProps) {
  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>📋</span> Performance Records
          </h3>
        </div>
        <EPRListSkeleton />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span>📋</span> Performance Records
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
            {eprs.length}
          </span>
        </h3>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New EPR
        </button>
      </div>

      {/* List */}
      {eprs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <p className="text-gray-900 font-medium mb-1">No EPR records yet</p>
          <p className="text-gray-500 text-sm mb-4">Create the first evaluation record</p>
          <button
            onClick={onCreateNew}
            className="text-blue-600 text-sm font-medium hover:text-blue-700"
          >
            + Create First EPR
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {eprs.map((epr, index) => (
            <button
              key={epr.id}
              onClick={() => onSelectEPR(epr)}
              className={classNames(
                'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 animate-fade-in',
                selectedEPR?.id === epr.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 bg-white'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold text-gray-900">
                    {formatPeriodRange(epr.periodStart, epr.periodEnd)}
                  </span>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-yellow-500 text-sm">
                      {renderStars(epr.overallRating)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      T:{epr.technicalSkillsRating} • NT:{epr.nonTechnicalSkillsRating}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={classNames(
                    'px-2.5 py-1 text-xs font-medium rounded-full',
                    getStatusColor(epr.status)
                  )}>
                    {epr.status}
                  </span>
                  <svg className={classNames(
                    'w-5 h-5 transition-colors',
                    selectedEPR?.id === epr.id ? 'text-blue-500' : 'text-gray-300'
                  )} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {epr.remarks && (
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                  {epr.remarks.substring(0, 100)}{epr.remarks.length > 100 ? '...' : ''}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
