'use client';

import { useState } from 'react';
import type { EPRRecord, Role, EPRStatus, CreateEPRRequest, UpdateEPRRequest } from '@/lib/types';
import { createEPR, updateEPR, getAssistRemarks } from '@/lib/api';
import { renderStars, classNames } from '@/lib/utils';

interface EPRFormProps {
  personId: string;
  personRole: Role;
  epr: EPRRecord | null; // null = create mode, otherwise edit mode
  onCancel: () => void;
  onSaved: () => void;
}

// Get admin ID from env (hardcoded for demo)
const EVALUATOR_ID = process.env.NEXT_PUBLIC_USER_ID || '550e8400-e29b-41d4-a716-446655440000';

export function EPRForm({ personId, personRole, epr, onCancel, onSaved }: EPRFormProps) {
  const isEdit = !!epr;
  
  // Form state
  const [periodStart, setPeriodStart] = useState(epr?.periodStart?.split('T')[0] || '');
  const [periodEnd, setPeriodEnd] = useState(epr?.periodEnd?.split('T')[0] || '');
  const [overallRating, setOverallRating] = useState(epr?.overallRating || 3);
  const [technicalSkillsRating, setTechnicalSkillsRating] = useState(epr?.technicalSkillsRating || 3);
  const [nonTechnicalSkillsRating, setNonTechnicalSkillsRating] = useState(epr?.nonTechnicalSkillsRating || 3);
  const [remarks, setRemarks] = useState(epr?.remarks || '');
  const [status, setStatus] = useState<EPRStatus>(epr?.status || 'draft');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate remarks using AI assist (Level 2C)
  const handleGenerateRemarks = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      const result = await getAssistRemarks({
        technicalSkillsRating,
        nonTechnicalSkillsRating,
        overallRating,
        roleType: personRole,
      });
      
      setRemarks(result.generatedRemarks);
      
      // Optionally set the recommended overall rating
      if (result.recommendedOverallRating !== overallRating) {
        setOverallRating(result.recommendedOverallRating);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate remarks');
    } finally {
      setGenerating(false);
    }
  };

  // Save EPR
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!periodStart || !periodEnd) {
      setError('Period start and end dates are required');
      return;
    }
    
    if (new Date(periodEnd) < new Date(periodStart)) {
      setError('Period end must be after or equal to period start');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      if (isEdit && epr) {
        // Update existing EPR
        const updateData: UpdateEPRRequest = {
          overallRating,
          technicalSkillsRating,
          nonTechnicalSkillsRating,
          remarks: remarks || undefined,
          status,
        };
        await updateEPR(epr.id, updateData);
      } else {
        // Create new EPR
        const createData: CreateEPRRequest = {
          personId,
          evaluatorId: EVALUATOR_ID,
          roleType: personRole,
          periodStart,
          periodEnd,
          overallRating,
          technicalSkillsRating,
          nonTechnicalSkillsRating,
          remarks: remarks || undefined,
          status,
        };
        await createEPR(createData);
      }
      
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save EPR');
    } finally {
      setSaving(false);
    }
  };

  // Rating input component
  const RatingInput = ({ 
    label, 
    value, 
    onChange,
    icon
  }: { 
    label: string; 
    value: number; 
    onChange: (v: number) => void;
    icon: string;
  }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <span>{icon}</span> {label}
      </label>
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="range"
            min="1"
            max="5"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2 min-w-[100px]">
          <span className="w-8 text-center text-lg font-bold text-gray-900">{value}</span>
          <span className="text-yellow-500">{renderStars(value)}</span>
        </div>
      </div>
      {/* Rating buttons for quick selection */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={classNames(
              'flex-1 py-1 text-xs font-medium rounded transition-all',
              value === rating
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {isEdit ? '✏️' : '📝'} {isEdit ? 'Edit EPR' : 'Create New EPR'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit ? 'Update performance evaluation details' : 'Enter performance evaluation for this period'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3 animate-slide-up">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-medium">Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Period dates - only for create */}
        {!isEdit && (
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              📅 Evaluation Period
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Ratings */}
        <div className="space-y-5 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            ⭐ Performance Ratings
          </h3>
          <RatingInput
            label="Technical Skills"
            value={technicalSkillsRating}
            onChange={setTechnicalSkillsRating}
            icon="🔧"
          />
          <RatingInput
            label="Non-Technical Skills"
            value={nonTechnicalSkillsRating}
            onChange={setNonTechnicalSkillsRating}
            icon="🤝"
          />
          <div className="pt-3 border-t border-gray-200">
            <RatingInput
              label="Overall Rating"
              value={overallRating}
              onChange={setOverallRating}
              icon="🎯"
            />
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              💬 Remarks
            </label>
            <button
              type="button"
              onClick={handleGenerateRemarks}
              disabled={generating}
              className={classNames(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2',
                generating
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-sm hover:shadow-md'
              )}
            >
              {generating ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <span>✨</span>
                  AI Generate Remarks
                </>
              )}
            </button>
          </div>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={5}
            placeholder="Enter performance remarks or use AI to generate..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50/50 placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-500">
            💡 Tip: Click "AI Generate Remarks" to automatically generate remarks based on ratings
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            📊 Status
          </label>
          <div className="flex gap-2">
            {(['draft', 'submitted', 'archived'] as EPRStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={classNames(
                  'flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all capitalize',
                  status === s
                    ? s === 'draft'
                      ? 'bg-gray-600 text-white'
                      : s === 'submitted'
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {s === 'draft' && '📝 '}
                {s === 'submitted' && '✅ '}
                {s === 'archived' && '🗄️ '}
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={classNames(
              'flex-1 px-4 py-3 text-sm font-medium text-white rounded-xl transition-all flex items-center justify-center gap-2',
              saving
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
            )}
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                {isEdit ? '✓ Update EPR' : '+ Create EPR'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
