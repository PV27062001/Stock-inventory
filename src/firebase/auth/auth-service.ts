
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut as firebaseSignOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/firebase/setup';

const provider = new GoogleAuthProvider();

/**
 * Initiates the Google Sign-In flow using a popup where possible.
 * Falls back to redirect if popups are blocked. Ensures token persistence is set to local.
 */
export const signInWithGoogle = async () => {
  try {
    // Ensure auth persistence so tokens are cached across sessions
    await setPersistence(auth, browserLocalPersistence);

    // Try popup first (preferred UX). Some browsers/blockers may block popups,
    // so fall back to redirect if popup fails.
    try {
      await signInWithPopup(auth, provider);
      return;
    } catch (popupError) {
      console.warn('Popup sign-in failed, falling back to redirect:', popupError);
      await signInWithRedirect(auth, provider);
      return;
    }
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw new Error('Google Sign-In failed. Please try again.');
  }
};

/**
 * Signs the current user out.
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw new Error("Sign-out failed. Please try again.");
  }
};
