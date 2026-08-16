/**
 * Public configuration.
 *
 * Both values below are meant to be public. The anon key is a Supabase
 * *publishable* key: it grants exactly what the RLS policies in
 * supabase/002_shugon_schema.sql allow — read everything, write nothing —
 * and it is useless for writing without an authenticated session.
 *
 * That is why these live in the repo rather than in GitHub secrets: making
 * them build-time secrets would add a whole layer of Actions configuration
 * to protect a string that is served to every visitor in the bundle anyway.
 *
 * The service_role key must NEVER appear here or anywhere in this app.
 */
export const SUPABASE_URL = 'https://larkrtuakavfxfsxxgba.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcmtydHVha2F2Znhmc3h4Z2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3OTY0NTYsImV4cCI6MjEwMjM3MjQ1Nn0.7-l34SugoNbWPMDKaHAGCMbGbFBLZXRPrdL_hckXMw8';

/**
 * The shared editor account. Only the password is secret, and it is never
 * stored here — it is typed into the Edit dialog and handed straight to
 * Supabase Auth, which decides whether it is right.
 */
export const EDITOR_EMAIL = 'editor@shugon.app';

export const APP_NAME = 'Shugon';
export const APP_TAGLINE = 'Trip Planning';

/** localStorage namespace for the offline cache and local preferences. */
export const NS = 'shugon:';
