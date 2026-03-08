'use client';

import { useState } from 'react';
import { usePeople } from '@/hooks/usePeople';
import type { Person, Role } from '@/lib/types';
import { classNames, getStatusColor } from '@/lib/utils';
import { PersonListSkeleton } from '@/components/ui/Loading';

interface PeopleListProps {
  selectedPerson: Person | null;
  onSelectPerson: (person: Person) => void;
}

export function PeopleList({ selectedPerson, onSelectPerson }: PeopleListProps) {
  const [activeTab, setActiveTab] = useState<Role>('student');
  const [search, setSearch] = useState('');
  
  const { people, loading, error } = usePeople({ 
    role: activeTab, 
    search: search || undefined 
  });

  const tabs: { role: Role; label: string; icon: string }[] = [
    { role: 'student', label: 'Students', icon: '🎓' },
    { role: 'instructor', label: 'Instructors', icon: '👨‍✈️' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-gray-900">People Directory</h2>
        <p className="text-xs text-gray-500">Select a person to view EPRs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.role}
            onClick={() => setActiveTab(tab.role)}
            className={classNames(
              'flex-1 py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-200',
              activeTab === tab.role
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
            <span className={classNames(
              'ml-1.5 px-1.5 py-0.5 text-xs rounded-full',
              activeTab === tab.role
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600'
            )}>
              {people.length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto border-t border-gray-100">
        {loading && <PersonListSkeleton />}

        {error && (
          <div className="p-4 m-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <span>⚠️</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && people.length === 0 && (
          <div className="p-8 text-center">
            <span className="text-4xl mb-3 block">
              {activeTab === 'student' ? '🎓' : '👨‍✈️'}
            </span>
            <p className="text-gray-500 text-sm">
              No {activeTab}s found
              {search && <span className="block mt-1">for "{search}"</span>}
            </p>
          </div>
        )}

        {!loading && !error && people.map((person, index) => (
          <button
            key={person.id}
            onClick={() => onSelectPerson(person)}
            className={classNames(
              'w-full text-left px-4 py-3 border-b border-gray-50 transition-all duration-150',
              selectedPerson?.id === person.id
                ? 'bg-blue-50 border-l-4 border-l-blue-600'
                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={classNames(
                'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm',
                activeTab === 'student' 
                  ? 'bg-gradient-to-br from-purple-400 to-purple-600' 
                  : 'bg-gradient-to-br from-blue-400 to-blue-600'
              )}>
                {person.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{person.name}</div>
                <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                  <span className="truncate">{person.courseName || 'No course'}</span>
                  {person.enrollmentStatus && (
                    <span className={classNames(
                      'px-1.5 py-0.5 text-xs rounded-full flex-shrink-0',
                      getStatusColor(person.enrollmentStatus)
                    )}>
                      {person.enrollmentStatus}
                    </span>
                  )}
                </div>
              </div>
              {selectedPerson?.id === person.id && (
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
