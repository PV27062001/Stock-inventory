
'use client';

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
  const { user } = useAuthUser();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userItems = await getInventoryItems(user.uid);
      setItems(userItems);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'purchaseDate' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");
    const newItem = { ...item, userId: user.uid };
    await addInventoryItem(newItem);
    fetchItems(); // Refresh list
  };

  const updateItem = async (itemId: string, updates: Partial<InventoryItem>) => {
    await updateInventoryItem(itemId, updates);
    fetchItems(); // Refresh list
  };

  const deleteItem = async (itemId: string) => {
    await deleteInventoryItem(itemId);
    fetchItems(); // Refresh list
  };

  return { items, loading, addItem, updateItem, deleteItem, refresh: fetchItems };
}
