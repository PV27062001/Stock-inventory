
import { useState, useEffect } from 'react';
import { getInventoryItems, InventoryItem } from '@/firebase/kirayabook/inventory-service';

export function useInventory() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchInventory() {
            setIsLoading(true);
            const items = await getInventoryItems();
            setInventory(items);
            setIsLoading(false);
        }
        fetchInventory();
    }, []);

    return { inventory, isLoading };
}
