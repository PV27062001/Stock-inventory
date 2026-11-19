'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { HeaderButton, PageHeader } from '@/components/ui/page-header';
import { withAuth } from '@/components/Auth/with-auth';
import { BrandLoader } from '@/components/app/brand-loader';
import { ErrorNote, LoadingNote, chip, fieldClass, pill } from '@/components/apps/shared';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { deleteBill, getBill, saveBill } from '@/firebase/apps/household';
import { logger } from '@/lib/logger';

const CATEGORIES = ['Electricity (EB)', 'Water', 'Gas', 'Phone', 'Internet', 'TV / DTH', 'Rent', 'School fees', 'Insurance', 'Loan EMI', 'Chit fund', 'Other'];

function BillFormContent() {
  const router = useRouter();
  const id = useSearchParams()?.get('id') ?? undefined;
  const { user } = useAuthUser();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !user) return;
    getBill(user.uid, id)
      .then((b) => {
        if (!b) {
          setError('This bill no longer exists.');
          return;
        }
        setName(b.name);
        setCategory(b.category);
        setAmount(String(b.amount));
        setDueDay(String(b.dueDay));
      })
      .catch((e) => {
        logger.error('Loading bill failed', e);
        setError('The bill could not be loaded. Check the internet connection.');
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  const day = Number(dueDay);
  const finalName = name.trim() || category;
  const valid = finalName !== '' && Number(amount) > 0 && Number.isInteger(day) && day >= 1 && day <= 31;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await saveBill(user.uid, { name: finalName, category: category || 'Other', amount: Math.round(Number(amount) * 100) / 100, dueDay: day }, id);
      router.push('/money/bills');
    } catch (err) {
      logger.error('Saving bill failed', err);
      setError('Not saved. Check the internet connection and try again.');
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!user || !id || !window.confirm(`Delete the bill "${finalName}"? Past payments stay in their months.`)) return;
    try {
      await deleteBill(user.uid, id);
      router.push('/money/bills');
    } catch (err) {
      logger.error('Deleting bill failed', err);
      setError('Not deleted. Check the internet connection and try again.');
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader
        title={id ? 'Edit bill' : 'Add bill'}
        subtitle="Money · Bills"
        backHref="/money/bills"
        actions={id ? <HeaderButton icon={Trash2} label="Delete" danger onClick={remove} /> : undefined}
      />
      {loading ? (
        <LoadingNote />
      ) : (
        <form onSubmit={save} className="mx-auto max-w-md space-y-6 p-4">
          {error && <ErrorNote message={error} />}

          <fieldset className="space-y-2">
            <legend className="mb-2 text-base font-semibold">Which bill</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={chip(category === c)}>
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-2">
            <span className="text-base font-semibold">Name (optional)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={category || 'e.g. House rent'} className={fieldClass} />
          </label>

          <label className="block space-y-2">
            <span className="text-base font-semibold">Usual amount (₹)</span>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className={fieldClass} />
          </label>

          <label className="block space-y-2">
            <span className="text-base font-semibold">Due on day of the month (1–31)</span>
            <input inputMode="numeric" value={dueDay} onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="e.g. 10" className={fieldClass} />
          </label>

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

function BillFormPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <BillFormContent />
    </Suspense>
  );
}

export default withAuth(BillFormPage);
