import { logger } from '@/lib/logger';

import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInWithCredential, signOut as firebaseSignOut, setPersistence, browserLocalPersistence, UserCredential } from 'firebase/auth';
import { auth } from '@/firebase/setup';
import { isEmailAllowed } from '@/lib/allowed-users';
import { isNativeApp } from '@/lib/native';
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

  // Google blocks its sign-in page inside app WebViews, so the Android app signs in with
  // the native Google account picker and hands the ID token to the web Firebase SDK.
  if (isNativeApp()) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) {
      throw new Error('Google sign-in did not return a token.');
    }
    const nativeCredential = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    await enforceAllowlist(nativeCredential);
    return;
  }

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
    if (isNativeApp()) {
      // Also forget the native Google account so the picker shows again next time.
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      await FirebaseAuthentication.signOut();
    }
    // Drop cached shop data so the next account never sees it.
    clearKirayabookCaches();
  } catch (error) {
    logger.error("Error signing out", error);
    throw new Error("Sign-out failed. Please try again.");
  }
};
