


import React, { useEffect, useState } from 'react';
import { HearingProfile, User } from '../types';
import { authService } from '../services/authService';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { Sliders, Ear, ArrowRight, Activity } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface SetupProfilePageProps {
  user: User;
  onComplete: () => void;
}

const DEFAULT_PROFILE: HearingProfile = {
  name: 'Mild Loss Profile',
  eqBands: {
    500: 0,
    1000: 0,
    2000: 0,
    4000: 0,
    8000: 0
  }
};

const EQ_BANDS = [
  { key: 500 as const, label: 'Warmth & Body', desc: 'Low frequencies, fullness' },
  { key: 1000 as const, label: 'Speech Core', desc: 'Vowels, main energy' },
  { key: 2000 as const, label: 'Clarity', desc: 'Consonants clarity' },
  { key: 4000 as const, label: 'Presence', desc: 'Definition, closeness' },
  { key: 8000 as const, label: 'Detail & Air', desc: 'High details, crispness' }
];

export const SetupProfilePage: React.FC<SetupProfilePageProps> = ({ user, onComplete }) => {
  const [profile, setProfile] = useState<HearingProfile>(user.profile || DEFAULT_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the parent re-provides user with a profile, sync it
  useEffect(() => {
    if (user.profile) {
      setProfile(user.profile);
    }
  }, [user.profile]);

  // LIVE AUDIO TUNING: Start/Resume audio on mount and sync profile changes
  useEffect(() => {
    const startLiveTuning = async () => {
      if (audioEngine.isRunning()) {
        audioEngine.setProfile(profile);
        return;
      }

      try {
        await audioEngine.start();
        audioEngine.setProfile(profile);
      } catch (e) {
        console.error("Failed to start live tuning audio", e);
      }
    };
    startLiveTuning();
  }, []);

  useEffect(() => {
    if (audioEngine.isRunning()) {
      audioEngine.setProfile(profile);
    }
  }, [profile]);

  const handleSliderChange = (freq: 500 | 1000 | 2000 | 4000 | 8000, value: number) => {
    setProfile(prev => ({
      ...prev,
      name: prev.name?.includes('Custom') ? prev.name : 'Custom Profile',
      eqBands: {
        ...prev.eqBands,
        [freq]: value
      }
    }));
  };

  const handleUseBalancedProfile = () => {
    setProfile({
      name: 'Balanced Profile',
      eqBands: {
        500: 0,
        1000: 2,
        2000: 3,
        4000: 3,
        8000: 1
      }
    });
  };

  const handleUseSpeechProfile = () => {
    setProfile({
      name: 'Speech Focus Profile',
      eqBands: {
        500: -2,
        1000: 4,
        2000: 6,
        4000: 4,
        8000: 0
      }
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await authService.updateProfile(user.id, profile);
      onComplete();
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      {/* Top bar */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
            <Ear className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-800 dark:text-white">Earvan</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full animate-pulse border border-emerald-100 dark:border-emerald-800/30">
            <Activity className="w-3 h-3" />
            Live Listening Active
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex justify-center items-center px-4 py-8">
        <div className="max-w-3xl w-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-2xl dark:shadow-sky-500/10 transition-all duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                Tune your hearing profile
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Adjust the sliders while listening to your surroundings. We’ll use this profile in every mode.
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">Quick start</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use our balanced enhancement, then fine-tune if needed.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleUseBalancedProfile}
                  className="text-xs px-3 py-1.5"
                >
                  Balanced
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUseSpeechProfile}
                  className="text-xs px-3 py-1.5"
                >
                  Speech Focus
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {EQ_BANDS.map(band => {
              const value = profile.eqBands[band.key];
              return (
                <div
                  key={band.key}
                  className="p-4 md:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-50">
                        {band.label}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {band.key} Hz • {band.desc}
                      </p>
                    </div>
                    <span className="text-sm font-mono font-bold text-primary-600 dark:text-sky-400">
                      {value > 0 ? `+${value} dB` : `${value} dB`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={value}
                    onChange={(e) => handleSliderChange(band.key, Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:accent-sky-400"
                  />
                </div>
              );
            })}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              className="flex items-center gap-2"
            >
              <span>Save & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
