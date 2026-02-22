/**
 * databaseService.ts
 * Local-first data layer using localStorage.
 *
 * No API keys. No cloud. No external dependencies.
 * All data is persisted on-device in the browser's localStorage.
 */

import { APP_CONFIG } from '../config/appConfig';
import { User, HearingProfile } from '../types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Load all users from the local store. */
function loadUsers(): Record<string, User & { _passwordHash: string }> {
    try {
        const raw = localStorage.getItem(APP_CONFIG.usersKey);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

/** Persist users back to the local store. */
function saveUsers(users: Record<string, User & { _passwordHash: string }>): void {
    localStorage.setItem(APP_CONFIG.usersKey, JSON.stringify(users));
}

/**
 * Minimal, deterministic string hash.
 * NOT cryptographically secure — this is client-side local storage only.
 * Sufficient to prevent accidental plaintext credential exposure.
 */
function simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32-bit integer
    }
    return `sha_${Math.abs(hash).toString(36)}`;
}

/** Generate a simple unique ID (no uuid dependency needed). */
function generateId(): string {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Strip internal fields before returning a User object. */
function toPublicUser(stored: User & { _passwordHash: string }): User {
    const { _passwordHash: _, ...user } = stored;
    return user;
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

/** Centralized data service — all CRUD operations for EarVan. */
export const databaseService = {
    /**
     * Register a new user.
     * Throws if the email or username is already taken.
     */
    createUser: async (name: string, email: string, username: string, password: string): Promise<User> => {
        const users = loadUsers();

        const emailTaken = Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase());
        if (emailTaken) throw new Error('This email is already registered.');

        const usernameTaken = Object.values(users).some(u => u.username.toLowerCase() === username.toLowerCase());
        if (usernameTaken) throw new Error('This username is already taken.');

        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const id = generateId();
        const now = new Date().toISOString();
        const newUser: User & { _passwordHash: string } = {
            id,
            name,
            email,
            username,
            createdAt: now,
            updatedAt: now,
            _passwordHash: simpleHash(password),
        };

        users[id] = newUser;
        saveUsers(users);
        return toPublicUser(newUser);
    },

    /**
     * Authenticate a user by email and password.
     * Throws with a user-friendly message on failure.
     */
    loginUser: async (email: string, password: string): Promise<User> => {
        const users = loadUsers();

        const stored = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!stored) throw new Error('No account found with this email.');

        if (stored._passwordHash !== simpleHash(password)) {
            throw new Error('Incorrect password. Please try again.');
        }

        return toPublicUser(stored);
    },

    /** Sign out — no-op for local-first, kept for API parity. */
    logoutUser: async (): Promise<void> => {
        // Local-first: actual session clearing is handled by authService
    },

    /**
     * Save the user's hearing profile to local storage.
     */
    updateHearingProfile: async (userId: string, profile: HearingProfile): Promise<void> => {
        const users = loadUsers();
        if (!users[userId]) throw new Error('User not found.');

        users[userId] = {
            ...users[userId],
            profile,
            updatedAt: new Date().toISOString(),
        };
        saveUsers(users);
    },

    /**
     * Fetch a user's data by ID.
     */
    getUserData: async (userId: string): Promise<User | null> => {
        const users = loadUsers();
        const stored = users[userId];
        return stored ? toPublicUser(stored) : null;
    },
};
