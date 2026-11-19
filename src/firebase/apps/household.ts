import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Query,
} from 'firebase/firestore';
import { firestore } from '@/firebase/setup';

/**
 * Data for the Medicines, Milk and Money apps. Everything lives under `users/{uid}/…`, which
 * firestore.rules already keeps private to that signed-in account, so no rules change is needed.
 * Documents use readable ids (a date, a month) so one write per day or month replaces, never
 * duplicates.
 */
const col = (uid: string, name: string) => collection(firestore, 'users', uid, name);
const ref = (uid: string, name: string, id: string) => doc(firestore, 'users', uid, name, id);
const list = async <T>(q: Query) =>
  (await getDocs(q)).docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T);

// ── Medicines ────────────────────────────────────────────────────────────────
// The medicines themselves are the `Medicine` items in Personal stock (`inventory`).

export interface MedicineDose {
  id: string; // `${date}_${itemId}_${slot}`
  itemId: string;
  date: string; // YYYY-MM-DD
  slot: string; // "09:00" or "dose-1"
}

export const doseId = (date: string, itemId: string, slot: string) => `${date}_${itemId}_${slot.replace(':', '')}`;

export const getDosesForDay = (uid: string, date: string) =>
  list<MedicineDose>(query(col(uid, 'medicineDoses'), where('date', '==', date)));

export const markDoseTaken = (uid: string, dose: Omit<MedicineDose, 'id'>) =>
  setDoc(ref(uid, 'medicineDoses', doseId(dose.date, dose.itemId, dose.slot)), { ...dose, takenAt: serverTimestamp() });

export const unmarkDose = (uid: string, dose: Omit<MedicineDose, 'id'>) =>
  deleteDoc(ref(uid, 'medicineDoses', doseId(dose.date, dose.itemId, dose.slot)));

// ── Milk ─────────────────────────────────────────────────────────────────────

export interface MilkSettings {
  supplier: string;
  phone?: string;
  rate: number; // ₹ per litre
  defaultLitres: number;
}

export interface MilkEntry {
  id: string; // YYYY-MM-DD
  date: string;
  month: string; // YYYY-MM
  litres: number; // 0 = no milk that day
  rate: number; // the rate on that day, so a rate change never rewrites old bills
}

export interface MilkPayment {
  id: string; // YYYY-MM
  amount: number;
}

export const getMilkSettings = async (uid: string) => {
  const snap = await getDoc(ref(uid, 'milkSettings', 'main'));
  return snap.exists() ? (snap.data() as MilkSettings) : null;
};

export const saveMilkSettings = (uid: string, settings: MilkSettings) =>
  setDoc(ref(uid, 'milkSettings', 'main'), { ...settings, updatedAt: serverTimestamp() });

export const getMilkMonth = (uid: string, month: string) =>
  list<MilkEntry>(query(col(uid, 'milkEntries'), where('month', '==', month)));

export const setMilkDay = (uid: string, date: string, litres: number, rate: number) =>
  setDoc(ref(uid, 'milkEntries', date), { date, month: date.slice(0, 7), litres, rate, updatedAt: serverTimestamp() });

export const clearMilkDay = (uid: string, date: string) => deleteDoc(ref(uid, 'milkEntries', date));

export const getMilkPayment = async (uid: string, month: string) => {
  const snap = await getDoc(ref(uid, 'milkPayments', month));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as MilkPayment) : null;
};

export const setMilkPaid = (uid: string, month: string, amount: number) =>
  setDoc(ref(uid, 'milkPayments', month), { amount, paidAt: serverTimestamp() });

export const clearMilkPaid = (uid: string, month: string) => deleteDoc(ref(uid, 'milkPayments', month));

// ── Money (bills, income, spending) ──────────────────────────────────────────

export interface Bill {
  id: string;
  name: string;
  amount: number; // usual amount; the paid amount can differ each month
  dueDay: number; // 1–31, clamped to the month's length
  category: string;
}

export interface BillPayment {
  id: string; // `${billId}_${month}`
  billId: string;
  month: string;
  amount: number;
}

export type MoneyType = 'income' | 'expense';

export interface MoneyEntry {
  id: string;
  type: MoneyType;
  amount: number;
  category: string;
  note?: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
}

export const getBills = async (uid: string) =>
  (await list<Bill>(col(uid, 'bills'))).sort((a, b) => a.dueDay - b.dueDay || a.name.localeCompare(b.name));

export const getBill = async (uid: string, id: string) => {
  const snap = await getDoc(ref(uid, 'bills', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Bill) : null;
};

export const saveBill = (uid: string, bill: Omit<Bill, 'id'>, id?: string) =>
  setDoc(id ? ref(uid, 'bills', id) : doc(col(uid, 'bills')), { ...bill, updatedAt: serverTimestamp() });

export const deleteBill = (uid: string, id: string) => deleteDoc(ref(uid, 'bills', id));

export const getBillPayments = (uid: string, month: string) =>
  list<BillPayment>(query(col(uid, 'billPayments'), where('month', '==', month)));

export const payBill = (uid: string, billId: string, month: string, amount: number) =>
  setDoc(ref(uid, 'billPayments', `${billId}_${month}`), { billId, month, amount, paidAt: serverTimestamp() });

export const unpayBill = (uid: string, billId: string, month: string) =>
  deleteDoc(ref(uid, 'billPayments', `${billId}_${month}`));

export const getMoneyMonth = async (uid: string, month: string) =>
  (await list<MoneyEntry>(query(col(uid, 'moneyEntries'), where('month', '==', month)))).sort((a, b) =>
    b.date.localeCompare(a.date)
  );

export const addMoneyEntry = (uid: string, entry: Omit<MoneyEntry, 'id' | 'month'>) =>
  setDoc(doc(col(uid, 'moneyEntries')), { ...entry, month: entry.date.slice(0, 7), createdAt: serverTimestamp() });

export const deleteMoneyEntry = (uid: string, id: string) => deleteDoc(ref(uid, 'moneyEntries', id));
