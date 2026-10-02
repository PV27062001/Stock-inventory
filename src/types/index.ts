
import { Timestamp } from 'firebase/firestore';

export type Unit = 'g' | 'kg' | 'l' | 'ml' | 'units';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category: 'Grocery' | 'Medicine' | string; 
  purchaseDate: Timestamp;
  expiryDate?: Timestamp;
  imageUrl?: string;
  notes?: string;
  userId: string;

  // Grocery-specific fields
  unit?: Unit;

  // Medicine-specific fields
  dosage?: number; // e.g., pills per day
  dailyAlert?: boolean;
  reminderTimes?: string[]; // Format: ["HH:MM", "HH:MM"]

  // Common optional field for both
  lowStockThreshold?: number;
}
