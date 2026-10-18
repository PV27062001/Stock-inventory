import { logger } from '@/lib/logger';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  type Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// The SDK logs its own errors (including index-creation URLs that expose the
// project id) straight to the console. Silence it outside development.
if (process.env.NODE_ENV === 'production') {
  setLogLevel('silent');
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
// Ensure auth persistence is set to local so tokens survive page reloads and restarts
setPersistence(auth, browserLocalPersistence).catch((e) => {
	// Non-fatal: log and continue. Some environments (SSR) may not support persistence.
	logger.warn('Could not set auth persistence to local:', e);
});

// In the browser, keep an offline-first IndexedDB cache so reads are instant and
// writes queue up and sync automatically on poor/no network. Falls back to the
// default (memory) cache during server rendering where IndexedDB is unavailable.
// Wrapped in try/catch so Fast Refresh (which may re-run this module) reuses the
// existing instance instead of throwing "Firestore has already been started".
let firestore: Firestore;
try {
	firestore =
		typeof window !== 'undefined'
			? initializeFirestore(app, {
					localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
				})
			: getFirestore(app);
} catch {
	firestore = getFirestore(app);
}

const storage = getStorage(app);

export { app, auth, firestore, storage };
