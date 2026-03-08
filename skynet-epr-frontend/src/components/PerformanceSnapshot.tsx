'use client';

import { useSummary } from '@/hooks/useSummary';
import { getTrendDisplay, renderStars, classNames } from '@/lib/utils';
import { PerformanceSnapshotSkeleton } from '@/components/ui/Loading';

interface PerformanceSnapshotProps {
  personId: string;
}

export function PerformanceSnapshot({ personId }: PerformanceSnapshotProps) {
  const { summary, loading, error } = useSummary(personId);

  if (loading) {
    return <PerformanceSnapshotSkeleton />;
  }

  if (error || !summary) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border border-gray-200">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-gray-500 text-sm font-medium">No performance data yet</p>
        <p className="text-gray-400 text-xs mt-1">EPRs will show statistics here</p>
      </div>
    );
  }

  const trend = getTrendDisplay(summary.trend);

  // Rating bar component
  const RatingBar = ({ value, label }: { value: number; label: string }) => (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500 uppercase tracking-wide font-medium">{label}</span>
        <span className="font-bold text-gray-900">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-5 border border-blue-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h3 className="font-semibold text-gray-900">Performance Snapshot</h3>
        </div>
        <div className={classNames(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
          trend.label === 'Improving' ? 'bg-green-100 text-green-700' :
          trend.label === 'Declining' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        )}>
          <span className="text-base">{trend.icon}</span>
          {trend.label}
        </div>
      </div>

      {/* Main Score */}
      <div className="flex items-center gap-4 mb-5 pb-4 border-b border-blue-200/50">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">
            {summary.averages.overall.toFixed(1)}
          </div>
          <div className="text-yellow-500 text-lg mt-1">
            {renderStars(Math.round(summary.averages.overall))}
          </div>
          <div className="text-xs text-gray-500 mt-1">Overall Avg</div>
        </div>
        <div className="flex-1 space-y-3">
          <RatingBar value={summary.averages.technical} label="Technical" />
          <RatingBar value={summary.averages.nonTechnical} label="Non-Technical" />
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          Based on <span className="font-semibold text-gray-700">{summary.totalRecords}</span> evaluation{summary.totalRecords !== 1 ? 's' : ''}
        </span>
        {summary.recentPeriods.length > 0 && (
          <span className="text-gray-500">
            Latest: <span className="font-semibold text-gray-700">{summary.recentPeriods[0]?.status}</span>
          </span>
        )}
      </div>
    </div>
  );
}
