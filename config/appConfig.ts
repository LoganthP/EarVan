/**
 * appConfig.ts
 * Centralized static application configuration.
 * No secrets. No API keys. No environment variables required.
 *
 * Everything in this file is safe to commit to version control.
 */

export const APP_CONFIG = {
    /** Application display name */
    name: 'Earvan',

    /** Short tagline shown on auth screen */
    tagline: 'Enhance your world.',

    /** App version */
    version: '1.0.0',

    /** localStorage key for persisted user session */
    sessionKey: 'earvan_user',

    /** localStorage key for all registered users (local-first DB) */
    usersKey: 'earvan_users',

    /** Feature flags */
    features: {
        /** Whether to show the audio test button on the dashboard */
        audioTest: true,
        /** Whether dark/light theme toggle is enabled */
        themeToggle: true,
    },

    /** Default EQ profile (flat — no boost or cut) */
    defaultEqProfile: {
        500: 0,
        1000: 0,
        2000: 0,
        4000: 0,
        8000: 0,
    },
} as const;
