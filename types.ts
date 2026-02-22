export interface HearingProfile {
  name: string;
  eqBands: {
    500: number;
    1000: number;
    2000: number;
    4000: number;
    8000: number;
  };
}

export interface User {
  id: string; // Unique user ID
  name: string;
  email: string;
  username: string;
  profile?: HearingProfile;
  createdAt?: string;
  updatedAt?: string;
}

export type AuthMode = 'LOGIN' | 'SIGNUP';

export type AppView = 'AUTH' | 'SPLASH' | 'PERMISSIONS' | 'SETUP_PROFILE' | 'HOME';

export type EnvironmentMode = 'QUIET' | 'CONVERSATION' | 'NOISY';
