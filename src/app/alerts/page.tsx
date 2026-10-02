
'use client';

import { useAlerts, Alert } from '@/hooks/use-alerts';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Pill, ShoppingBasket, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AlertsPage() {
  const { alerts } = useAlerts();
  const router = useRouter();

  const getIcon = (alert: Alert) => {
    switch (alert.type) {
      case 'low-stock':
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      case 'medicine':
        return <Bell className="w-6 h-6 text-blue-500" />;
      default:
        return null;
    }
  };

  const handleAlertClick = (alert: Alert) => {
    // Navigate to the main inventory page for now.
    // In the future, this could navigate to the specific item's detail page.
    router.push('/');
  };

  return (
    <main className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Your Alerts</h1>
        <p className="text-muted-foreground font-medium">
          Here's what needs your attention today.
        </p>
      </header>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">All clear!</p>
            <p>You have no alerts right now.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <Card 
              key={alert.id} 
              className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleAlertClick(alert)}
            >
              <div className="flex items-center gap-4">
                {getIcon(alert)}
                <div>
                  <p className="font-semibold">{alert.message}</p>
                  {alert.type === 'medicine' && (
                    <p className="text-sm text-muted-foreground">Scheduled for {alert.time}</p>
                  )}
                   {alert.type === 'low-stock' && (
                    <p className="text-sm text-muted-foreground">
                        {alert.item.category === 'Medicine' ? <Pill className="w-3 h-3 inline mr-1"/> : <ShoppingBasket className="w-3 h-3 inline mr-1"/>}
                       Only {alert.item.quantity} {alert.item.unit || 'units'} remaining.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
