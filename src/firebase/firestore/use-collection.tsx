'use client';

import { logger } from '@/lib/logger';

import { useEffect, useRef, useState } from 'react';
import {
  Query,
  onSnapshot,
  queryEqual,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Keep a stable reference so inline/unmemoized queries don't cause the
  // onSnapshot subscription to tear down and rebuild on every render.
  const queryRef = useRef<Query<T> | null>(null);
  if (
    query !== queryRef.current &&
    !(query && queryRef.current && queryEqual(query, queryRef.current))
  ) {
    queryRef.current = query;
  }
  const stableQuery = queryRef.current;

  useEffect(() => {
    if (!stableQuery) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      stableQuery,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setData(items);
        setLoading(false);
      },
      (err) => {
        logger.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [stableQuery]);

  return { data, loading, error };
}
