'use client';

import { logger } from '@/lib/logger';

import { useEffect, useRef, useState } from 'react';
import {
  DocumentReference,
  onSnapshot,
  refEqual,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stabilise the reference so inline/unmemoized refs don't re-subscribe each render.
  const refRef = useRef<DocumentReference<T> | null>(null);
  if (
    ref !== refRef.current &&
    !(ref && refRef.current && refEqual(ref, refRef.current))
  ) {
    refRef.current = ref;
  }
  const stableRef = refRef.current;

  useEffect(() => {
    if (!stableRef) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      stableRef,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...snapshot.data()!, id: snapshot.id } : null);
        setLoading(false);
      },
      (err) => {
        logger.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [stableRef]);

  return { data, loading, error };
}
