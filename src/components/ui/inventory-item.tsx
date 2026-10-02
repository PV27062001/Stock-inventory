
'use client';

import { useState } from 'react';
import { Plus, Minus, Clock, Pill } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';

interface InventoryItemProps {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  lowStockThreshold: number;
  lastUpdated: string;
  dosage?: number;
}

export function InventoryItem({ name, quantity, unit, category, lowStockThreshold, lastUpdated, dosage }: InventoryItemProps) {
  const [currentQty, setCurrentQty] = useState(quantity);
  const { t } = useLanguage();
  
  const isLowStock = currentQty <= lowStockThreshold;

  return (
    <Card className="p-4 mb-4 flex items-center justify-between border-none shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h4 className="text-xl font-semibold">{name}</h4>
          {isLowStock && (
            <Badge variant="destructive" className="bg-orange-500 text-[10px] uppercase font-bold py-0 h-4">
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
          <span className={cn("text-2xl font-bold", isLowStock ? "text-orange-600" : "text-primary")}>
            {currentQty}
          </span>
          <span className="text-sm font-medium text-muted-foreground uppercase">{unit}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button 
          size="icon" 
          variant="secondary" 
          className="w-14 h-14 rounded-2xl shadow-sm bg-primary/10 text-primary hover:bg-primary/20"
          onClick={() => setCurrentQty(prev => prev + 1)}
        >
          <Plus className="w-8 h-8" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          className="w-14 h-14 rounded-2xl shadow-sm bg-muted text-muted-foreground hover:bg-muted/80"
          onClick={() => setCurrentQty(prev => Math.max(0, prev - 1))}
        >
          <Minus className="w-8 h-8" />
        </Button>
      </div>
    </Card>
  );
}
