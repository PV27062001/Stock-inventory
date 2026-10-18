
'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, Clock, Pill, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';

interface InventoryItemProps {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  lowStockThreshold: number;
  lastUpdated: string;
  dosage?: number;
  onQuantityChange?: (id: string, qty: number) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function InventoryItem({ id, name, quantity, unit, category, lowStockThreshold, lastUpdated, dosage, onQuantityChange, onEdit, onDelete }: InventoryItemProps) {
  const [currentQty, setCurrentQty] = useState(quantity);
  const { t } = useLanguage();

  // Keep in sync if the persisted value changes (e.g. after a refetch).
  useEffect(() => {
    setCurrentQty(quantity);
  }, [quantity]);

  const isLowStock = currentQty <= lowStockThreshold;

  const setQty = (next: number) => {
    const q = Math.max(0, next);
    setCurrentQty(q);
    if (id) onQuantityChange?.(id, q);
  };

  return (
    <Card className="p-4 mb-4 flex items-center justify-between shadow-soft hover:shadow-elevated transition-shadow">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-xl font-semibold">{name}</h4>
          {isLowStock && (
            <Badge variant="destructive" className="bg-brand-orange text-[10px] uppercase font-bold py-0 h-4">
              {t('lowStock')}
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-1 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <span>{category}</span>
            <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{lastUpdated}</span>
            </div>
          </div>
          {dosage && (
            <div className="flex items-center gap-1 text-primary font-medium mt-1">
              <Pill className="w-4 h-4" />
              <span>{dosage} {t('timesPerDay')}</span>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={cn("text-2xl font-bold", isLowStock ? "text-brand-orange" : "text-primary")}>
            {currentQty}
          </span>
          <span className="text-sm font-medium text-muted-foreground uppercase">{unit}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        {(onEdit || onDelete) && id && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(id)}
                aria-label="Edit"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(id)}
                aria-label="Delete"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="w-14 h-14 rounded-2xl shadow-sm bg-primary/10 text-primary hover:bg-primary/20"
          onClick={() => setQty(currentQty + 1)}
          aria-label="Increase"
        >
          <Plus className="w-8 h-8" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="w-14 h-14 rounded-2xl shadow-sm bg-muted text-muted-foreground hover:bg-muted/80"
          onClick={() => setQty(currentQty - 1)}
          aria-label="Decrease"
        >
          <Minus className="w-8 h-8" />
        </Button>
      </div>
    </Card>
  );
}
