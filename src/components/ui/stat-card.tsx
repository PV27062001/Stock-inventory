
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, color, className }: StatCardProps) {
  return (
    <Card className={cn("p-5 flex flex-col gap-3 border-none shadow-sm", className)}>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-muted-foreground text-sm font-medium">{label}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    </Card>
  );
}
