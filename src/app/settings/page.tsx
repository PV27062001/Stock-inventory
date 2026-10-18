'use client';

import { logger } from '@/lib/logger';

import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Globe, Moon, User, LogOut, ChevronRight, Languages, Users, Plus, Mail, ArrowLeft, Bell, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { signOut } from '@/firebase/auth/auth-service';
import { withAuth } from '@/components/Auth/with-auth';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useNotifications } from '@/hooks/use-notifications';
import { useStartPage } from '@/hooks/use-start-page';

function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useUser();
  const { isDark, setDark } = useDarkMode();
  const { permission, requestPermission, enabled, setEnabled } = useNotifications();
  const { startPage, setStartPage } = useStartPage();
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };
  
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState([
    { id: '1', email: 'son@example.com', role: 'viewer' }
  ]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      logger.error("Logout failed", err);
    }
  };

  const handleAddMember = () => {
    if (!email) return;
    setMembers([...members, { id: Date.now().toString(), email, role: 'viewer' }]);
    setEmail('');
  };

  return (
    <main className="p-6 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={goBack}
          aria-label="Go back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-soft transition-all active:scale-95 hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold">{t('settings')}</h1>
      </div>

      {/* Family Sharing Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">{t('members')}</h2>
        </div>
        
        <div className="space-y-3">
          {members.map((member) => (
            <Card key={member.id} className="p-4 border-none shadow-sm flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{member.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t(member.role as any)}</p>
                </div>
              </div>
            </Card>
          ))}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 gap-2 text-primary">
                <Plus className="w-5 h-5" />
                {t('addMember')}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-t-[2rem] sm:rounded-2xl top-auto bottom-0 sm:top-1/2 sm:bottom-auto translate-y-0 sm:-translate-y-1/2">
              <DialogHeader>
                <DialogTitle>{t('addMember')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('memberEmail')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="email@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 pl-12 rounded-xl"
                    />
                  </div>
                </div>
                <Button onClick={handleAddMember} className="w-full h-14 text-lg rounded-xl">
                  {t('invite')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Language Toggle */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Languages className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">{t('language')}</h2>
        </div>
        <Card className="p-2 border-none shadow-sm flex rounded-[2rem] overflow-hidden bg-card">
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              "flex-1 h-20 rounded-[1.5rem] text-2xl font-bold transition-all",
              language === 'en' ? "bg-primary text-primary-foreground shadow-lg" : "bg-transparent text-muted-foreground"
            )}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('ta')}
            className={cn(
              "flex-1 h-20 rounded-[1.5rem] text-2xl font-bold transition-all font-body",
              language === 'ta' ? "bg-primary text-primary-foreground shadow-lg" : "bg-transparent text-muted-foreground"
            )}
          >
            தமிழ்
          </button>
        </Card>
      </section>

      {/* User Info */}
      <section className="mb-8">
        <Card className="p-6 border-none shadow-sm flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{t('profile')}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-muted-foreground" />
        </Card>
      </section>

      {/* App Options */}
      <section className="space-y-4 mb-10">
        <Card className="p-6 border-none shadow-sm bg-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Start Screen</h3>
              <p className="text-sm text-muted-foreground">Which screen opens first</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'ask', label: 'Ask' },
              { id: 'kirayabook', label: 'Ledger' },
              { id: 'inventory', label: 'Personal' },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStartPage(opt.id)}
                className={cn(
                  'h-14 rounded-xl text-base font-semibold transition-all',
                  startPage === opt.id
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">Low-stock & reminder alerts</p>
            </div>
          </div>
          {permission === 'granted' ? (
            <Switch className="scale-125" checked={enabled} onCheckedChange={setEnabled} />
          ) : (
            <Button onClick={requestPermission} className="rounded-xl">Enable</Button>
          )}
        </Card>

        <Card className="p-6 border-none shadow-sm flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Moon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Dark Mode</h3>
          </div>
          <Switch className="scale-125" checked={isDark} onCheckedChange={setDark} />
        </Card>

        <Card 
          className="p-6 border-none shadow-sm flex items-center justify-between text-destructive bg-card cursor-pointer active:scale-95 transition-all"
          onClick={handleLogout}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">{t('logout')}</h3>
          </div>
        </Card>
      </section>

      <div className="text-center text-muted-foreground opacity-50 pb-10">
        <p className="text-lg font-bold">Sri Amman v1.0.0</p>
        <p>Made with love for parents</p>
      </div>
    </main>
  );
}

export default withAuth(SettingsPage);
