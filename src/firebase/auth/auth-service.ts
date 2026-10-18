import { logger } from '@/lib/logger';

import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut as firebaseSignOut, setPersistence, browserLocalPersistence, UserCredential } from 'firebase/auth';
import { auth } from '@/firebase/setup';
import { isEmailAllowed } from '@/lib/allowed-users';
import { clearKirayabookCaches } from '@/firebase/kirayabook/firestore-service';

const provider = new GoogleAuthProvider();

export class UnauthorizedEmailError extends Error {
  constructor(email?: string | null) {
    super(`${email || 'This account'} is not allowed to use this app.`);
    this.name = 'UnauthorizedEmailError';
  }
}

/** Rejects and signs out any account outside the allowlist. */
const enforceAllowlist = async (credential: UserCredential) => {
  const email = credential.user.email;
  if (!isEmailAllowed(email)) {
    await firebaseSignOut(auth);
    throw new UnauthorizedEmailError(email);
  }
};

/**
 * Initiates the Google Sign-In flow using a popup where possible.
 * Falls back to redirect if popups are blocked. Ensures token persistence is set to local.
 */
export const signInWithGoogle = async () => {
  // Ensure auth persistence so tokens are cached across sessions
  await setPersistence(auth, browserLocalPersistence);

  let credential: UserCredential;
  try {
    // Try popup first (preferred UX). Some browsers/blockers may block popups,
    // so fall back to redirect if popup fails.
    credential = await signInWithPopup(auth, provider);
  } catch (popupError) {
    logger.warn('Popup sign-in failed, falling back to redirect:', popupError);
    await signInWithRedirect(auth, provider);
    return;
  }

  await enforceAllowlist(credential);
};

/**
 * Signs the current user out.
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    // Drop cached shop data so the next account never sees it.
    clearKirayabookCaches();
  } catch (error) {
    logger.error("Error signing out", error);
    throw new Error("Sign-out failed. Please try again.");
  }
};
