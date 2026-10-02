
import { useState, useEffect } from 'react';
import { useInventory } from '@/firebase/firestore/use-inventory';
import { InventoryItem } from '@/types';

export type AlertType = 'low-stock' | 'medicine';

export interface Alert {
  id: string;
  type: AlertType;
  item: InventoryItem;
  message: string;
  time?: string;
}

export function useAlerts() {
  const { items } = useInventory();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const newAlerts: Alert[] = [];

    // 1. Generate Low Stock Alerts
    const lowStockItems = items.filter(item => 
      item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold
    );
    lowStockItems.forEach(item => {
      newAlerts.push({
        id: `low-stock-${item.id}`,
        type: 'low-stock',
        item,
        message: `${item.name} is running low (${item.quantity} left).`,
      });
    });

    // 2. Generate Medicine Reminder Alerts for Today
    const today = new Date();
    const medicineItems = items.filter(item => item.category === 'Medicine' && item.dailyAlert && item.reminderTimes);

    medicineItems.forEach(item => {
      item.reminderTimes?.forEach(time => {
         const [hour, minute] = time.split(':').map(Number);
         const reminderDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);
        
        // For simplicity, we'll show all of today's reminders.
        // In a real app, you might only show upcoming ones.
        newAlerts.push({
            id: `med-reminder-${item.id}-${time}`,
            type: 'medicine',
            item,
            message: `Time to take ${item.name}.`,
            time,
        });
      });
    });
    
    // Sort alerts: medicine reminders first, then low stock
    newAlerts.sort((a, b) => {
        if (a.type === 'medicine' && b.type !== 'medicine') return -1;
        if (a.type !== 'medicine' && b.type === 'medicine') return 1;
        if(a.type === 'medicine' && b.type === 'medicine') {
            return (a.time || '').localeCompare(b.time || '');
        }
        return a.item.name.localeCompare(b.item.name);
    });

    setAlerts(newAlerts);
  }, [items]);

  return { alerts };
}
