'use client';

import { useState, useEffect, useRef } from 'react';
import { getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem, InventoryItem } from '@/firebase/kirayabook/inventory-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Edit, Trash, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BrandLoader } from '@/components/app/brand-loader';
import { itemEmoji } from '@/lib/item-emoji';

// Shrink a picked photo to a small JPEG data URL so it stores cheaply in Firestore.
function fileToThumb(file: File, max = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas context'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; price: number; imageUrl?: string }>({ name: '', price: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    setItems(await getInventoryItems());
    setIsLoading(false);
  };

  const resetForm = () => {
    setForm({ name: '', price: 0 });
    setEditId(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePickPhoto = async (file: File | null) => {
    if (!file) return;
    try {
      const thumb = await fileToThumb(file);
      setForm((f) => ({ ...f, imageUrl: thumb }));
    } catch {
      /* ignore */
    }
  };

  const handleSave = async () => {
    if (!form.name || form.price <= 0) return;
    if (editId) {
      await updateInventoryItem(editId, { name: form.name, price: form.price, imageUrl: form.imageUrl ?? '' });
    } else {
      const payload: Omit<InventoryItem, 'id'> = { name: form.name, price: form.price };
      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      await addInventoryItem(payload);
    }
    resetForm();
    fetchItems();
  };

  const startEdit = (item: InventoryItem) => {
    setEditId(item.id || null);
    setForm({ name: item.name, price: item.price, imageUrl: item.imageUrl });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this item?')) {
      await deleteInventoryItem(id);
      fetchItems();
    }
  };

  if (isLoading) {
    return <BrandLoader label="Loading inventory…" />;
  }

  return (
    <div className="bg-background min-h-screen text-foreground font-sans">
      <header className="flex items-center p-4 bg-card sticky top-0 z-10 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4">Inventory Management</h1>
      </header>

      <main className="p-4">
        {/* Add / Edit form */}
        <div className="bg-card p-5 rounded-2xl mb-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-3">{editId ? 'Edit Item' : 'Add New Item'}</h3>
          <div className="flex items-start gap-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePickPhoto(e.target.files?.[0] || null)} />
            <button
              onClick={() => fileRef.current?.click()}
              className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-background text-muted-foreground"
              aria-label="Add photo"
            >
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : form.name ? (
                <span className="text-3xl">{itemEmoji(form.name)}</span>
              ) : (
                <Camera className="h-6 w-6" />
              )}
            </button>
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Item name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-background border border-border rounded-lg"
              />
              <Input
                type="number"
                placeholder="Price per day"
                value={form.price || ''}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="bg-background border border-border rounded-lg"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={handleSave} className="flex-1 h-12 rounded-xl font-semibold">
              {editId ? 'Update item' : 'Add item'}
            </Button>
            {editId && (
              <Button variant="secondary" onClick={resetForm} className="h-12 rounded-xl">
                Cancel
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Tip: add a photo so items are easy to recognise.</p>
        </div>

        {/* Visual grid */}
        {items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No items yet. Add your first one above.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-secondary to-background">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-6xl">{itemEmoji(item.name)}</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-base font-bold">{item.name}</p>
                  <p className="text-sm font-semibold text-primary">₹{item.price} / day</p>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(item)} className="h-9 flex-1 rounded-lg" aria-label="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {item.id && (
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id!)} className="h-9 rounded-lg px-3" aria-label="Delete">
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
