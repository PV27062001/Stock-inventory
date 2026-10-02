
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
// Ensure auth persistence is set to local so tokens survive page reloads and restarts
setPersistence(auth, browserLocalPersistence).catch((e) => {
	// Non-fatal: log and continue. Some environments (SSR) may not support persistence.
	console.warn('Could not set auth persistence to local:', e);
});
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };
