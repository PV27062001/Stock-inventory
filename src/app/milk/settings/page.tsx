'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { withAuth } from '@/components/Auth/with-auth';
import { ErrorNote, LoadingNote, chip, fieldClass, pill } from '@/components/apps/shared';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { getMilkSettings, saveMilkSettings } from '@/firebase/apps/household';
import { logger } from '@/lib/logger';

const LITRE_CHIPS = [0.25, 0.5, 0.75, 1, 1.5, 2];

function MilkSettingsPage() {
  const router = useRouter();
  const { user } = useAuthUser();
  const [supplier, setSupplier] = useState('');
  const [phone, setPhone] = useState('');
  const [rate, setRate] = useState('');
  const [defaultLitres, setDefaultLitres] = useState('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getMilkSettings(user.uid)
      .then((s) => {
        if (!s) return;
        setSupplier(s.supplier);
        setPhone(s.phone ?? '');
        setRate(String(s.rate));
        setDefaultLitres(String(s.defaultLitres));
      })
      .catch((e) => {
        logger.error('Loading milk settings failed', e);
        setError('Saved details could not be loaded. Check the internet connection.');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const rateNum = Number(rate);
  const litresNum = Number(defaultLitres);
  const valid = rateNum > 0 && litresNum > 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await saveMilkSettings(user.uid, {
        supplier: supplier.trim() || 'Milkman',
        phone: phone.replace(/\D/g, ''),
        rate: Math.round(rateNum * 100) / 100,
        defaultLitres: Math.round(litresNum * 100) / 100,
      });
      router.push('/milk');
    } catch (err) {
      logger.error('Saving milk settings failed', err);
      setError('Not saved. Check the internet connection and try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader title="Milk setup" subtitle="Milk" backHref="/milk" />
      {loading ? (
        <LoadingNote />
      ) : (
        <form onSubmit={save} className="mx-auto max-w-md space-y-6 p-4">
          {error && <ErrorNote message={error} />}

          <label className="block space-y-2">
            <span className="text-base font-semibold">Price per litre (₹)</span>
            <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="e.g. 50" className={fieldClass} />
          </label>

          <div className="space-y-2">
            <span className="block text-base font-semibold">Usual milk each day (litres)</span>
            <div className="flex flex-wrap gap-2">
              {LITRE_CHIPS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setDefaultLitres(String(l))}
                  className={`${chip(litresNum === l)} min-w-16`}
                >
                  {l} L
                </button>
              ))}
            </div>
            <input
              inputMode="decimal"
              value={defaultLitres}
              onChange={(e) => setDefaultLitres(e.target.value.replace(/[^0-9.]/g, ''))}
              aria-label="Usual litres"
              className={fieldClass}
            />
          </div>

          <label className="block space-y-2">
            <span className="text-base font-semibold">Milkman's name</span>
            <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Milkman" className={fieldClass} />
          </label>

          <label className="block space-y-2">
            <span className="text-base font-semibold">Milkman's mobile (for sharing the bill)</span>
            <input inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="Optional" className={fieldClass} />
          </label>

          <p className="text-sm text-muted-foreground">A new price applies from the next day you enter. Days already entered keep their price.</p>

          <button
            type="submit"
            disabled={!valid || saving}
            className={`${pill('filled', 'lg')} w-full`}
          >
            {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            Save
          </button>
        </form>
      )}
    </div>
  );
}

export default withAuth(MilkSettingsPage);
