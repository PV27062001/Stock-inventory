'use client';

import { logger } from '@/lib/logger';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Globe, Moon, User, LogOut, ChevronRight, Languages, Users, Plus, Mail, Bell, Home, Check, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUser } from '@/firebase';
import { signOut } from '@/firebase/auth/auth-service';
import { withAuth } from '@/components/Auth/with-auth';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useNotifications } from '@/hooks/use-notifications';
import { useStartPage, type StartPage } from '@/hooks/use-start-page';
import { MODULES } from '@/modules/registry';
import { PageHeader } from '@/components/ui/page-header';

function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useUser();
  const { isDark, setDark } = useDarkMode();
  const { permission, requestPermission, enabled, setEnabled } = useNotifications();
  const { startPage, setStartPage } = useStartPage();

  // The launcher's "Opens first … Change" links here; the page renders after sign-in, so scroll then.
  useEffect(() => {
    if (window.location.hash === '#start-screen') {
      document.getElementById('start-screen')?.scrollIntoView({ block: 'start' });
    }
  }, []);

  
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
    <>
      <PageHeader title={t('settings')} />

      <main className="p-4">

      {/* Family Sharing Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold">{t('members')}</h2>
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
              <Button variant="outline" className="w-full h-12 rounded-2xl border-dashed border-2 gap-2 text-primary">
                <Plus className="w-5 h-5" />
                {t('addMember')}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-t-[2rem] sm:rounded-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))] top-auto bottom-0 sm:top-1/2 sm:bottom-auto translate-y-0 sm:-translate-y-1/2">
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
                      className="h-12 pl-12 rounded-xl"
                    />
                  </div>
                </div>
                <Button onClick={handleAddMember} className="w-full h-12 text-base rounded-xl">
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
          <h2 className="text-lg font-bold">{t('language')}</h2>
        </div>
        <Card className="p-2 border-none shadow-sm flex rounded-2xl overflow-hidden bg-card">
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              "flex-1 h-12 rounded-xl text-base font-bold transition-all",
              language === 'en' ? "bg-primary text-primary-foreground shadow-lg" : "bg-transparent text-muted-foreground"
            )}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('ta')}
            className={cn(
              "flex-1 h-12 rounded-xl text-base font-bold transition-all font-body",
              language === 'ta' ? "bg-primary text-primary-foreground shadow-lg" : "bg-transparent text-muted-foreground"
            )}
          >
            தமிழ்
          </button>
        </Card>
      </section>

      {/* User Info */}
      <section className="mb-8">
        <Card className="p-4 border-none shadow-sm flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">{t('profile')}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-muted-foreground" />
        </Card>
      </section>

      {/* App Options */}
      <section className="space-y-4 mb-10">
        <Card id="start-screen" className="scroll-mt-40 p-4 border-none shadow-sm bg-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Start Screen</h3>
              <p className="text-sm text-muted-foreground">Which screen opens first</p>
            </div>
          </div>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Start screen">
            {[
              { id: 'apps' as StartPage, label: 'Apps screen', note: 'All apps as icons', icon: LayoutGrid, colorVar: '--primary' },
              ...MODULES.map((m) => ({ id: m.id as StartPage, label: m.name, note: m.description, icon: m.icon, colorVar: m.colorVar })),
            ].map((opt) => {
              const selected = startPage === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setStartPage(opt.id)}
                  className={cn(
                    'flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition-all',
                    selected ? 'border-primary bg-primary/10' : 'border-border bg-secondary'
                  )}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: `hsl(var(${opt.colorVar}))` }}
                  >
                    <opt.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold">{opt.label}</span>
                    <span className="block truncate text-sm text-muted-foreground">{opt.note}</span>
                  </span>
                  {selected && <Check className="h-6 w-6 shrink-0 text-primary" aria-hidden />}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 border-none shadow-sm flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">Low-stock & reminder alerts</p>
            </div>
          </div>
          {permission === 'granted' ? (
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          ) : (
            <Button onClick={requestPermission} className="rounded-xl">Enable</Button>
          )}
        </Card>

        <Card className="p-4 border-none shadow-sm flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold">Dark Mode</h3>
          </div>
          <Switch checked={isDark} onCheckedChange={setDark} />
        </Card>

        <Card 
          className="p-4 border-none shadow-sm flex items-center justify-between text-destructive bg-card cursor-pointer active:scale-95 transition-all"
          onClick={handleLogout}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold">{t('logout')}</h3>
          </div>
        </Card>
      </section>

      <div className="text-center text-muted-foreground opacity-50 pb-10">
        <p className="text-base font-bold">Sri Amman v1.0.0</p>
        <p>Made with love for parents</p>
      </div>
      </main>
    </>
  );
}

export default withAuth(SettingsPage);
