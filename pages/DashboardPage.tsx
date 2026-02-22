import React, { useEffect, useRef, useState, useCallback } from 'react';
import { User, HearingProfile, EnvironmentMode } from '../types';
import { audioEngine } from '../services/audioEngine';
import { authService } from '../services/authService';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  LogOut, Activity, Power,
  MessageCircle, CloudRain, Zap,
  PlayCircle, StopCircle, Sliders, Ear,
  AlertCircle,
} from 'lucide-react';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
  onEditProfile: () => void;
}

type AudioStatus = 'idle' | 'starting' | 'running' | 'error';

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout, onEditProfile }) => {
  // ── Audio state (minimal — audio logic lives in audioEngine) ──────────────
  const [isAssistOn, setIsAssistOn] = useState(audioEngine.isRunning());
  const [mode, setMode] = useState<EnvironmentMode>('QUIET');
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>(audioEngine.isRunning() ? 'running' : 'idle');
  const [micError, setMicError] = useState<string | null>(null);

  // We expose the analyser to <AudioVisualizer> via a ref — no re-renders
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Prevent concurrent start calls
  const startingRef = useRef(false);

  // ── Start/Stop audio ──────────────────────────────────────────────────────
  const startAudio = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setAudioStatus('starting');
    setMicError(null);

    try {
      await audioEngine.start();

      // Apply profile and mode after start
      if (user.profile) audioEngine.setProfile(user.profile);
      audioEngine.setEnvironment(mode);

      setAnalyser(audioEngine.getAnalyser());
      setAudioStatus('running');
    } catch (err: any) {
      setMicError(err.message ?? 'Could not start audio.');
      setAudioStatus('error');
      setIsAssistOn(false);
    } finally {
      startingRef.current = false;
    }
  }, [mode, user.profile]);

  const suspendAudio = useCallback(async () => {
    await audioEngine.suspend();
    setAudioStatus('idle');
  }, []);

  // ── Toggle ON/OFF ─────────────────────────────────────────────────────────
  const handleToggle = useCallback(async () => {
    const turningOn = !isAssistOn;
    setIsAssistOn(turningOn);

    if (turningOn) {
      await startAudio();
    } else {
      // Stop test audio first if running
      if (isTestingAudio) {
        await audioEngine.stopTestAudio();
        setIsTestingAudio(false);
      }
      await suspendAudio();
    }
  }, [isAssistOn, isTestingAudio, startAudio, suspendAudio]);

  // ── Mode changes ──────────────────────────────────────────────────────────
  const handleModeChange = useCallback((newMode: EnvironmentMode) => {
    setMode(newMode);
    audioEngine.setEnvironment(newMode); // Hot-swap DSP — no context restart
  }, []);

  // ── Test audio ────────────────────────────────────────────────────────────
  const toggleTestAudio = useCallback(async () => {
    if (isTestingAudio) {
      await audioEngine.stopTestAudio();
      setIsTestingAudio(false);
    } else {
      audioEngine.startTestAudio();
      setIsTestingAudio(true);
    }
  }, [isTestingAudio]);

  // ── Profile sync (if user profile changes) ────────────────────────────────
  useEffect(() => {
    if (user.profile && audioEngine.isRunning()) {
      audioEngine.setProfile(user.profile);
    }
  }, [user.profile]);

  // ── Sync analyser on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (audioEngine.isRunning()) {
      setAnalyser(audioEngine.getAnalyser());
    }
  }, []);

  // ── Cleanup on unmount (logout / global exit) ──────────────────────────────
  useEffect(() => {
    return () => {
      // NOTE: We no longer suspend/stop here because we want audio to stay 
      // alive during navigation to SetupProfilePage and back.
      // Full cleanup is now moved to handleLogout in App.tsx.
    };
  }, []);

  // ── Mode button styling ───────────────────────────────────────────────────
  const getModeStyles = (m: EnvironmentMode) => {
    const isActive = mode === m;
    const base = 'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border cursor-pointer select-none';
    if (isActive && isAssistOn && audioStatus === 'running') {
      return `${base} bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/30 scale-105`;
    }
    return `${base} bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500`;
  };

  // ── Profile EQ bars (static — shows user's EQ setup) ─────────────────────
  const getProfileBars = () => {
    if (!user.profile) return null;
    return [500, 1000, 2000, 4000, 8000].map(f => {
      const val = user.profile!.eqBands[f as keyof HearingProfile['eqBands']];
      const pct = Math.max(20, 20 + val * 2);
      const isBoosted = val > 0;
      return (
        <div key={f} className="flex flex-col items-center gap-1">
          <div className="relative w-2 bg-slate-100 dark:bg-slate-700 rounded-full h-12 flex items-end overflow-hidden">
            <div
              style={{ height: `${(pct / 44) * 100}%` }}
              className={`w-full rounded-full transition-all duration-500 ${isBoosted ? 'bg-secondary-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            />
          </div>
        </div>
      );
    });
  };

  // ── Power button status label ─────────────────────────────────────────────
  const powerLabel = () => {
    if (audioStatus === 'starting') return 'STARTING';
    return isAssistOn ? 'ON' : 'OFF';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">

      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-800 dark:text-white">Earvan</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" onClick={onLogout} className="h-9 px-3 text-sm">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center p-6 max-w-md mx-auto w-full gap-8">

        {/* 1. Power Button */}
        <div className="flex flex-col items-center gap-4 mt-4">
          <div className="relative">
            {isAssistOn && audioStatus === 'running' && (
              <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20 animate-pulse" />
            )}
            <button
              onClick={handleToggle}
              disabled={audioStatus === 'starting'}
              className={`
                relative w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-2xl
                transition-all duration-300 disabled:cursor-wait
                ${isAssistOn && audioStatus === 'running'
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white scale-110 ring-4 ring-green-500/20'
                  : audioStatus === 'starting'
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white scale-105 ring-4 ring-yellow-400/20 animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}
              `}
            >
              <Power className="w-10 h-10 mb-1" />
              <span className="text-xs font-bold tracking-widest uppercase">{powerLabel()}</span>
            </button>
          </div>
          <h2 className={`text-xl font-bold transition-colors ${isAssistOn && audioStatus === 'running' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
            Hearing Assist
          </h2>
        </div>

        {/* Mic error alert */}
        {micError && (
          <div className="w-full flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        {/* 2. Environment Mode Selector */}
        <div className={`w-full space-y-3 transition-opacity duration-300 ${(!isAssistOn || audioStatus !== 'running') ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Environment Mode</span>
            {isAssistOn && audioEngine.isRunning() && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                </span>
                Active Listening...
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button onClick={() => handleModeChange('QUIET')} className={getModeStyles('QUIET')}>
              <CloudRain className="w-4 h-4" /> Quiet
            </button>
            <button onClick={() => handleModeChange('CONVERSATION')} className={getModeStyles('CONVERSATION')}>
              <MessageCircle className="w-4 h-4" /> Conversation
            </button>
            <button onClick={() => handleModeChange('NOISY')} className={getModeStyles('NOISY')}>
              <Zap className="w-4 h-4" /> Traffic/Noisy
            </button>
          </div>
        </div>

        {/* 3. Real-time Audio Visualizer */}
        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 h-24 relative overflow-hidden">
          <AudioVisualizer
            analyser={analyser}
            isActive={isAssistOn && audioStatus === 'running'}
            barColor="blue"
          />
          {(!isAssistOn || audioStatus !== 'running') && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-800/40 backdrop-blur-[1px]">
              <span className="text-sm font-medium text-slate-400">
                {audioStatus === 'starting' ? 'Starting...' : 'Processing Paused'}
              </span>
            </div>
          )}
        </div>

        {/* 4. Profile Summary Card */}
        <div className="w-full bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Ear className="w-16 h-16 text-slate-900 dark:text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Current Profile</h3>
                <p className="text-xl font-black text-slate-900 dark:text-white mb-1">
                  {user.profile?.name || 'No Profile'}
                </p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 max-w-[200px] leading-relaxed">
                  {user.profile?.name?.includes('Speech') ? 'Optimized for high-clarity conversation.' : 'Wide-band audio enhancement active.'}
                </p>
              </div>
              <div className="flex items-end gap-1.5 h-12 pb-1">
                {getProfileBars()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button variant="outline" onClick={onEditProfile} className="text-xs h-10 border-dashed">
                <Sliders className="w-3 h-3 mr-2" /> Adjust EQ
              </Button>
              <Button
                variant={isTestingAudio ? 'secondary' : 'primary'}
                onClick={toggleTestAudio}
                className="text-xs h-10"
                disabled={!isAssistOn || audioStatus !== 'running'}
              >
                {isTestingAudio
                  ? <><StopCircle className="w-3 h-3 mr-2" /> Stop Test</>
                  : <><PlayCircle className="w-3 h-3 mr-2" /> Test Audio</>
                }
              </Button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};