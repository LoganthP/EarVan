/**
 * authService.ts
 * Session management for EarVan — local-first, no cloud dependencies.
 */

import { User, HearingProfile } from '../types';
import { databaseService } from './databaseService';
import { APP_CONFIG } from '../config/appConfig';

const SESSION_KEY = APP_CONFIG.sessionKey;

export const authService = {
  /** Authenticate and persist session. */
  login: async (email: string, password: string): Promise<User> => {
    const user = await databaseService.loginUser(email, password);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  /** Create account and persist session. */
  signup: async (name: string, email: string, username: string, password: string): Promise<User> => {
    const user = await databaseService.createUser(name, email, username, password);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  /** Save hearing profile and refresh persisted session. */
  updateProfile: async (userId: string, profile: HearingProfile): Promise<User> => {
    await databaseService.updateHearingProfile(userId, profile);

    const updatedUser = await databaseService.getUserData(userId);
    if (!updatedUser) throw new Error('Failed to retrieve updated user.');

    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  /** Clear session. */
  logout: async (): Promise<void> => {
    await databaseService.logoutUser();
    localStorage.removeItem(SESSION_KEY);
  },

  /** Read the currently persisted session, or null if none exists. */
  getCurrentUser: (): User | null => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  },
};
