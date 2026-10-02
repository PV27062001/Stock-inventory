
import { firestore } from '@/firebase/setup';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query } from 'firebase/firestore';

export interface InventoryItem {
    id?: string;
    name: string;
    price: number; // Rent per day
}

const INVENTORY_COLLECTION = 'kirayabook_inventory';

let inventoryCache: InventoryItem[] | null = null;
let inventoryCachePromise: Promise<InventoryItem[]> | null = null;

const invalidateInventoryCache = () => {
    inventoryCache = null;
    inventoryCachePromise = null;
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
        const docRef = await addDoc(collection(firestore, INVENTORY_COLLECTION), item);
        invalidateInventoryCache();
        return docRef.id;
    } catch (error) {
        console.error("Error adding inventory item: ", error);
        throw new Error('Failed to add inventory item.');
    }
};

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
    if (inventoryCache) {
        return inventoryCache;
    }

    if (!inventoryCachePromise) {
        inventoryCachePromise = (async () => {
            try {
                const q = query(collection(firestore, INVENTORY_COLLECTION));
                const querySnapshot = await getDocs(q);
                const items = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as InventoryItem));
                inventoryCache = items;
                return items;
            } catch (error) {
                inventoryCachePromise = null;
                console.error("Error getting inventory items: ", error);
                throw new Error('Failed to fetch inventory items.');
            }
        })();
    }

    return inventoryCachePromise;
};

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
        const docRef = doc(firestore, INVENTORY_COLLECTION, id);
        await updateDoc(docRef, updates);
        invalidateInventoryCache();
    } catch (error) {
        console.error("Error updating inventory item: ", error);
        throw new Error('Failed to update inventory item.');
    }
};

export const deleteInventoryItem = async (id: string) => {
    try {
        const docRef = doc(firestore, INVENTORY_COLLECTION, id);
        await deleteDoc(docRef);
        invalidateInventoryCache();
    } catch (error) {
        console.error("Error deleting inventory item: ", error);
        throw new Error('Failed to delete inventory item.');
    }
};
