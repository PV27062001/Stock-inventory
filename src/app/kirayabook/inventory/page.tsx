'use client';

import { useState, useEffect } from 'react';
import { getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem, InventoryItem } from '@/firebase/kirayabook/inventory-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Edit, Trash, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [newItem, setNewItem] = useState({ name: '', price: 0 });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    const inventoryItems = await getInventoryItems();
    setItems(inventoryItems);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (editItem && editItem.id) {
      await updateInventoryItem(editItem.id, { name: editItem.name, price: editItem.price });
    } else if (newItem.name && newItem.price > 0) {
      await addInventoryItem(newItem);
    }
    setEditItem(null);
    setNewItem({ name: '', price: 0 });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteInventoryItem(id);
      fetchItems();
    }
  };

  if (isLoading) {
    return <div className="text-center text-lg p-10">Loading inventory...</div>;
  }

  return (
    <div className="bg-[#1A1A2E] min-h-screen text-white font-sans">
      <header className="flex items-center p-4 bg-[#16213E] sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4">Inventory Management</h1>
      </header>

      <main className="p-4">
        <div className="bg-[#16213E] p-5 rounded-2xl mb-6">
            <h3 className="text-lg font-semibold mb-3">Add New Item</h3>
            <div className="flex items-center gap-2">
                <Input 
                    placeholder="Item Name" 
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    className="bg-[#1A1A2E] border-none rounded-lg"
                />
                <Input 
                    type="number" 
                    placeholder="Price per day" 
                    value={newItem.price || ''}
                    onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
                    className="bg-[#1A1A2E] border-none rounded-lg w-32"
                />
                <Button onClick={handleSave}><Plus className="w-5 h-5"/></Button>
            </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-[#16213E] p-4 rounded-xl flex items-center justify-between">
              {editItem && editItem.id === item.id ? (
                <div className="flex-grow flex items-center gap-2">
                  <Input 
                    value={editItem.name} 
                    onChange={e => setEditItem(prev => prev ? { ...prev, name: e.target.value } : null)} 
                    className="bg-[#1A1A2E] border-none rounded-lg"
                  />
                  <Input 
                    type="number" 
                    value={editItem.price} 
                    onChange={e => setEditItem(prev => prev ? { ...prev, price: Number(e.target.value) } : null)} 
                    className="bg-[#1A1A2E] border-none rounded-lg w-24"
                  />
                  <Button onClick={handleSave} size="sm">Save</Button>
                  <Button onClick={() => setEditItem(null)} variant="secondary" size="sm">Cancel</Button>
                </div>
              ) : (
                <div className="flex-grow">
                  <p className="font-semibold text-lg">{item.name}</p>
                  <p className="text-gray-400">₹{item.price} / day</p>
                </div>
              )}
              <div className="flex gap-2">
                 {(!editItem || editItem.id !== item.id) && (
                   <Button variant="ghost" size="icon" onClick={() => setEditItem(item)}>
                     <Edit className="w-5 h-5"/>
                   </Button>
                 )}
                 {item.id && (
                   <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id!)}>
                     <Trash className="w-5 h-5"/>
                   </Button>
                 )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
