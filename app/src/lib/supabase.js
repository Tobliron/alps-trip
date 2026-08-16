import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, EDITOR_EMAIL, NS } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,          // "remembered until logout"
    autoRefreshToken: true,
    storageKey: NS + 'auth'
  }
});

/**
 * Unlock editing.
 *
 * The password goes straight to Supabase Auth. We never hash it, compare it,
 * or store it ourselves — and crucially the answer is not a boolean we could
 * choose to ignore: a wrong password means no session, and with no session
 * Postgres refuses every write regardless of what the UI does. Hiding the
 * edit buttons is a courtesy; RLS is the actual lock.
 *
 * @returns {Promise<{ok: true} | {ok: false, message: string}>}
 */
export async function unlockEditing(password) {
  const { error } = await supabase.auth.signInWithPassword({
    email: EDITOR_EMAIL,
    password
  });
  if (!error) return { ok: true };

  // Supabase returns the same "Invalid login credentials" for a bad password
  // and a missing account, so say something useful about both.
  const raw = error.message || 'could not sign in';
  const message = /invalid login credentials/i.test(raw)
    ? "That password didn't work."
    : /email not confirmed/i.test(raw)
      ? 'The editor account exists but is unconfirmed — tick "Auto Confirm User" on it in Supabase.'
      : raw;
  return { ok: false, message };
}

export async function lockEditing() {
  await supabase.auth.signOut();
}

/** Current session, or null. Used to decide whether edit affordances show. */
export async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export function onAuthChange(fn) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => fn(session));
  return () => data.subscription.unsubscribe();
}
