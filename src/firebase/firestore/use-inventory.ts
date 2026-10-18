'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect, useCallback } from 'react';
import { InventoryItem } from '@/types';
import {
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryItems,
} from './firestore-service';
import { useAuthUser } from '@/firebase/auth/use-auth-user';

export function useInventory() {
  const { user, loading: authLoading } = useAuthUser();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async (silent = false) => {
    if (authLoading) return; // wait for auth to resolve before deciding
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const userItems = await getInventoryItems(user.uid);
      setItems(userItems);
    } catch (error) {
      logger.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'purchaseDate' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    const newItem = { ...item, userId: user.uid };
    await addInventoryItem(newItem);
    await fetchItems(true); // silent refresh to pick up the new item's id
  };

  const updateItem = async (itemId: string, updates: Partial<InventoryItem>) => {
    // Optimistic local update — no full-screen reload.
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i)));
    await updateInventoryItem(itemId, updates);
  };

  const deleteItem = async (itemId: string) => {
    // Optimistic local removal — no full-screen reload.
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await deleteInventoryItem(itemId);
  };

  return { items, loading, addItem, updateItem, deleteItem, refresh: fetchItems };
}
