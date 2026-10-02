
'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { app, auth, firestore, storage } from './setup';

export function FirebaseClientProvider({ 
  children
}: { 
  children: React.ReactNode 
}) {

  const firebaseServices = useMemo(() => {
    return { app, db: firestore, auth, storage };
  }, []);

  return (
    <FirebaseProvider 
      app={firebaseServices.app} 
      db={firebaseServices.db} 
      auth={firebaseServices.auth}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
