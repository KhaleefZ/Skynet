'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Person } from '@/lib/types';
import { PeopleList } from '@/components/PeopleList';
import { PersonDetail } from '@/components/PersonDetail';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { Dashboard } from '@/components/Dashboard';
import { AdminPanel } from '@/components/AdminPanel';
import { EPRReviewPanel } from '@/components/EPRReviewPanel';

type ViewType = 'dashboard' | 'person' | 'admin' | 'reviews';

function MainApp() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { showToast } = useToast();

  // Check backend connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('http://localhost:3000/health');
        const wasConnected = isConnected;
        const nowConnected = res.ok;
        setIsConnected(nowConnected);
        
        // Show toast on reconnection
        if (wasConnected === false && nowConnected) {
          showToast('Backend connection restored', 'success');
        }
      } catch {
        if (isConnected === true) {
          showToast('Backend connection lost', 'error');
        }
        setIsConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [isConnected, showToast]);

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
    setCurrentView('person');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      showToast('Logout failed', 'error');
    }
  };

  const handleShowDashboard = () => {
    setSelectedPerson(null);
    setCurrentView('dashboard');
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-3xl">✈️</span>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (middleware will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 shadow-xl">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={handleShowDashboard} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-2xl">✈️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Skynet EPR</h1>
                <p className="text-xs text-slate-400">Electronic Progress & Performance Records</p>
              </div>
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShowDashboard}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Dashboard
              </button>
              {(user.role === 'admin' || user.role === 'instructor') && (
                <button
                  onClick={() => setCurrentView('reviews')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'reviews' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Reviews
                </button>
              )}
              {user.role === 'admin' && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'admin' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Admin
                </button>
              )}
            </div>
            
            {/* Connection status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50">
              {isConnected === null ? (
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              ) : isConnected ? (
                <span className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
              ) : (
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
              )}
              <span className="text-sm text-slate-300">
                {isConnected === null ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* User menu */}
            <div className="flex items-center gap-3 pl-6 border-l border-slate-700">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg ${
                user.role === 'admin' ? 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-500/25' :
                user.role === 'instructor' ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/25' :
                'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/25'
              }`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <div className="text-white font-medium">{user.name}</div>
                <div className="text-slate-400 text-xs capitalize">{user.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - split pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - People list (hidden for students viewing own data) */}
        {(user.role === 'admin' || user.role === 'instructor') && (
          <div className="w-80 flex-shrink-0 shadow-2xl z-10">
            <PeopleList
              selectedPerson={selectedPerson}
              onSelectPerson={handleSelectPerson}
            />
          </div>
        )}

        {/* Right panel - Dashboard or Person detail */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'dashboard' && (
            <Dashboard user={user} onSelectPerson={handleSelectPerson} />
          )}
          {currentView === 'admin' && user.role === 'admin' && (
            <AdminPanel />
          )}
          {currentView === 'reviews' && (user.role === 'admin' || user.role === 'instructor') && (
            <EPRReviewPanel />
          )}
          {currentView === 'person' && selectedPerson && (
            <div key={selectedPerson.id} className="h-full animate-fade-in">
              <PersonDetail person={selectedPerson} />
            </div>
          )}
          {currentView === 'person' && !selectedPerson && (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
              <div className="text-center max-w-md px-8 animate-fade-in">
                <div className="w-28 h-28 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/10">
                  <span className="text-6xl">👨‍✈️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Welcome to Skynet EPR
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Select a student or instructor from the list to view and manage their electronic performance records.
                </p>
                <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-400 rounded-full"></span>
                    Students
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                    Instructors
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
