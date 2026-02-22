import React, { useState, Suspense, lazy } from 'react';
import { User, AppView } from './types';
import { authService } from './services/authService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { audioEngine } from './services/audioEngine';

// Lazy load pages for improved initial bundle size
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const SplashPage = lazy(() => import('./pages/SplashPage').then(m => ({ default: m.SplashPage })));
const PermissionPage = lazy(() => import('./pages/PermissionPage').then(m => ({ default: m.PermissionPage })));
const SetupProfilePage = lazy(() => import('./pages/SetupProfilePage').then(m => ({ default: m.SetupProfilePage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));

const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
    <p className="text-slate-500 dark:text-slate-400 animate-pulse text-sm">Loading Earvan...</p>
  </div>
);

// Determine initial view from persisted session — synchronous, instant, no cloud.
function getInitialState(): { user: User | null; view: AppView } {
  try {
    const user = authService.getCurrentUser();
    return user ? { user, view: 'SPLASH' } : { user: null, view: 'AUTH' };
  } catch {
    return { user: null, view: 'AUTH' };
  }
}

export default function App() {
  const initial = getInitialState();
  const [currentUser, setCurrentUser] = useState<User | null>(initial.user);
  const [currentView, setCurrentView] = useState<AppView>(initial.view);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('SPLASH');
  };

  const handleLogout = async () => {
    await authService.logout();
    await audioEngine.destroy(); // Full cleanup on logout
    setCurrentUser(null);
    setCurrentView('AUTH');
  };

  const handleSplashComplete = () => {
    setCurrentView('PERMISSIONS');
  };

  const handlePermissionsComplete = () => {
    if (currentUser?.profile) {
      setCurrentView('HOME');
    } else {
      setCurrentView('SETUP_PROFILE');
    }
  };

  const handleProfileComplete = async () => {
    const updated = authService.getCurrentUser();
    if (updated) setCurrentUser(updated);
    setCurrentView('HOME');
  };

  const handleEditProfile = () => {
    setCurrentView('SETUP_PROFILE');
  };

  return (
    <ErrorBoundary>
      <div className="font-sans text-slate-900 dark:text-white">
        <Suspense fallback={<LoadingFallback />}>
          {currentView === 'AUTH' && (
            <AuthPage onSuccess={handleAuthSuccess} />
          )}
          {currentView === 'SPLASH' && currentUser && (
            <SplashPage onGetStarted={handleSplashComplete} userName={currentUser.name} />
          )}
          {currentView === 'PERMISSIONS' && currentUser && (
            <PermissionPage onComplete={handlePermissionsComplete} />
          )}
          {currentView === 'SETUP_PROFILE' && currentUser && (
            <SetupProfilePage user={currentUser} onComplete={handleProfileComplete} />
          )}
          {currentView === 'HOME' && currentUser && (
            <DashboardPage user={currentUser} onLogout={handleLogout} onEditProfile={handleEditProfile} />
          )}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}