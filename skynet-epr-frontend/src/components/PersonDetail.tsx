'use client';

import { useState } from 'react';
import type { Person, EPRRecord } from '@/lib/types';
import { useEPRs } from '@/hooks/useEPRs';
import { classNames, getStatusColor } from '@/lib/utils';
import { PerformanceSnapshot } from './PerformanceSnapshot';
import { EPRList } from './EPRList';
import { EPRDetail } from './EPRDetail';
import { EPRForm } from './EPRForm';

interface PersonDetailProps {
  person: Person;
}

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

export function PersonDetail({ person }: PersonDetailProps) {
  const { eprs, loading, refetch } = useEPRs(person.id);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEPR, setSelectedEPR] = useState<EPRRecord | null>(null);

  const handleSelectEPR = (epr: EPRRecord) => {
    setSelectedEPR(epr);
    setViewMode('detail');
  };

  const handleCreateNew = () => {
    setSelectedEPR(null);
    setViewMode('create');
  };

  const handleEdit = () => {
    setViewMode('edit');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedEPR(null);
  };

  const handleSaved = () => {
    refetch();
    setViewMode('list');
    setSelectedEPR(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Person Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={classNames(
              'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md',
              person.role === 'student' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
              person.role === 'instructor' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
              'bg-gradient-to-br from-gray-500 to-gray-600'
            )}>
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{person.name}</h1>
              <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {person.email}
              </p>
            </div>
          </div>
          <span className={classNames(
            'px-4 py-1.5 text-sm font-semibold rounded-full capitalize flex items-center gap-1.5',
            person.role === 'student' ? 'bg-purple-100 text-purple-800' :
            person.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          )}>
            {person.role === 'student' && '🎓'}
            {person.role === 'instructor' && '👨‍🏫'}
            {person.role === 'admin' && '👤'}
            {person.role}
          </span>
        </div>

        {/* Course info */}
        {person.courseName && (
          <div className="mt-4 ml-20 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">✈️ Course:</span>
              <span className="font-medium text-gray-900">{person.courseName}</span>
            </div>
            {person.enrollmentStatus && (
              <span className={classNames(
                'px-2.5 py-1 text-xs font-medium rounded-full',
                getStatusColor(person.enrollmentStatus)
              )}>
                {person.enrollmentStatus}
              </span>
            )}
          </div>
        )}

        {/* EPRs written (for instructors) */}
        {person.role === 'instructor' && person.totalEprsWritten !== undefined && (
          <div className="mt-2 ml-20 text-sm text-gray-500 flex items-center gap-1">
            <span>📝</span> EPRs Written: <span className="font-medium text-gray-900">{person.totalEprsWritten}</span>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === 'list' && (
          <>
            {/* Performance Snapshot - Level 2A */}
            <div className="mb-6">
              <PerformanceSnapshot personId={person.id} />
            </div>

            {/* EPR List */}
            <EPRList
              eprs={eprs}
              loading={loading}
              selectedEPR={selectedEPR}
              onSelectEPR={handleSelectEPR}
              onCreateNew={handleCreateNew}
            />
          </>
        )}

        {viewMode === 'detail' && selectedEPR && (
          <EPRDetail
            epr={selectedEPR}
            onBack={handleBack}
            onEdit={handleEdit}
          />
        )}

        {(viewMode === 'create' || viewMode === 'edit') && (
          <EPRForm
            personId={person.id}
            personRole={person.role}
            epr={viewMode === 'edit' ? selectedEPR : null}
            onCancel={handleBack}
            onSaved={handleSaved}
          />
        )}
      </div>
    </div>
  );
}
