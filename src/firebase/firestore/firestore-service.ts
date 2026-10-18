import { logger } from '@/lib/logger';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '@/firebase/setup';
import { InventoryItem } from '@/types';

const inventoryCollection = collection(firestore, 'inventory');

/**
 * Adds a new item to the user's inventory.
 */
export const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'purchaseDate'>) => {
  try {
    await addDoc(inventoryCollection, {
      ...item,
      purchaseDate: serverTimestamp(),
      expiryDate: item.expiryDate || null,
      imageUrl: item.imageUrl || null,
    });
  } catch (error) {
    logger.error("Error adding inventory item: ", error);
    throw new Error("Failed to add item. Please try again.");
  }
};

/**
 * Fetches all inventory items for a given user.
 */
export const getInventoryItems = async (userId: string) => {
  const q = query(inventoryCollection, where("userId", "==", userId));
  try {
    const querySnapshot = await getDocs(q);
    const items: InventoryItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as InventoryItem);
    });
    return items;
  } catch (error) {
    logger.error("Error fetching inventory items: ", error);
    throw new Error("Failed to fetch inventory. Please try again.");
  }
};

/**
 * Updates an existing inventory item.
 */
export const updateInventoryItem = async (itemId: string, updates: Partial<InventoryItem>) => {
  const itemRef = doc(firestore, 'inventory', itemId);
  try {
    await updateDoc(itemRef, updates);
  } catch (error) {
    logger.error("Error updating inventory item: ", error);
    throw new Error("Failed to update item. Please try again.");
  }
};

/**
 * Deletes an inventory item.
 */
export const deleteInventoryItem = async (itemId: string) => {
  const itemRef = doc(firestore, 'inventory', itemId);
  try {
    await deleteDoc(itemRef);
  } catch (error) {
    logger.error("Error deleting inventory item: ", error);
    throw new Error("Failed to delete item. Please try again.");
  }
};
