import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where,
  orderBy, limit, startAfter, Timestamp, getAggregateFromServer, sum,
  type QueryConstraint, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '@/firebase/setup';
import { logger } from '@/lib/logger';
import { RENTALS_ENABLED } from '@/lib/features';

const assertRentalsEnabled = () => {
  if (!RENTALS_ENABLED) {
    throw new Error('Rentals are disabled (SRIAMMAN_ENABLE_RENTALS is not true).');
  }
};

// Constants for collection names
const CUSTOMERS_COLLECTION = 'kirayabook_customers';
const RENTALS_COLLECTION = 'kirayabook_rentals';

let customersCache: Customer[] | null = null;
let customersCachePromise: Promise<Customer[]> | null = null;
let customersCacheAt = 0;

const CACHE_TTL_MS = 5 * 60 * 1000;

const invalidateCustomersCache = () => {
  customersCache = null;
  customersCachePromise = null;
  customersCacheAt = 0;
};

const invalidateRentalsCache = () => {
  // Rentals are always read through bounded queries, so nothing is cached.
};

/** Call on sign-out so the next user never sees the previous session's data. */
export const clearKirayabookCaches = () => {
  invalidateCustomersCache();
};

// --- Customer Functions ---

/** 'contacted' = reached via call/WhatsApp; 'otp' is reserved for future SMS OTP. */
export type MobileVerifyMethod = 'contacted' | 'otp';

export interface Customer {
  id?: string;
  name: string;
  mobile: string;
  mobileVerifiedAt?: Date;
  mobileVerifyMethod?: MobileVerifyMethod;
  profession?: string;
  address?: string;
  photoUrl?: string;
  aadhaar?: string;
  pan?: string;
  drivingLicence?: string;
  aadhaarPhotoUrl?: string;
  panPhotoUrl?: string;
  drivingLicencePhotoUrl?: string;
}

export const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<void> => {
  try {
    await addDoc(collection(firestore, CUSTOMERS_COLLECTION), customerData);
    invalidateCustomersCache();
  } catch (error) {
    logger.error("Error adding customer: ", error);
    throw new Error('Failed to add customer.');
  }
};

/** Firestore returns Timestamps; callers expect a JS Date. */
const mapCustomer = (id: string, data: any): Customer => ({
  id,
  ...data,
  mobileVerifiedAt: data.mobileVerifiedAt?.toDate?.() ?? undefined,
});

export const getAllCustomers = async (): Promise<Customer[]> => {
  if (customersCache && Date.now() - customersCacheAt < CACHE_TTL_MS) {
    return customersCache;
  }
  if (customersCache) invalidateCustomersCache();

  if (!customersCachePromise) {
    customersCachePromise = (async () => {
      try {
        const customersCol = collection(firestore, CUSTOMERS_COLLECTION);
        const q = query(customersCol);
        const querySnapshot = await getDocs(q);
        const customers = querySnapshot.docs.map((doc) => mapCustomer(doc.id, doc.data()));

        customersCache = customers;
        customersCacheAt = Date.now();
        return customers;
      } catch (error) {
        customersCachePromise = null;
        customersCache = null;
        logger.error("Error getting all customers: ", error);
        throw new Error('Failed to fetch customers.');
      }
    })();
  }

  return customersCachePromise;
};

export const getCustomerById = async (customerId: string): Promise<Customer | null> => {
  try {
    const docRef = doc(firestore, CUSTOMERS_COLLECTION, customerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return mapCustomer(docSnap.id, docSnap.data());
    } else {
      logger.debug("No such customer document!");
      return null;
    }
  } catch (error) {
    logger.error("Error getting customer by ID: ", error);
    throw new Error('Failed to fetch customer.');
  }
};

export const updateCustomer = async (customerId: string, updates: Partial<Customer>): Promise<void> => {
  try {
    const docRef = doc(firestore, CUSTOMERS_COLLECTION, customerId);
    await updateDoc(docRef, updates);
    invalidateCustomersCache();
  } catch (error) {
    logger.error("Error updating customer: ", error);
    throw new Error('Failed to update customer.');
  }
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, CUSTOMERS_COLLECTION, customerId));
    invalidateCustomersCache();
  } catch (error) {
    logger.error("Error deleting customer: ", error);
    throw new Error('Failed to delete customer.');
  }
};


// --- Rental Functions ---

export interface RentalItem {
  itemId: string;
  name: string;
  quantity: number;
  rate: number;
}

export interface Rental {
  id?: string;
  customerId: string;
  items: RentalItem[];
  rentalFrom: Date;
  rentalTo?: Date; // Made optional as it might not be set for active rentals
  advanceAmount: number;
  totalAmount: number;
  balanceDue: number;
  /** Owed back to the customer when the advance exceeded the final bill. */
  refundDue?: number;
  status: 'Active' | 'Settled' | 'Overdue' | 'Completed'; // Added 'Completed' status
  remarks?: string; // Changed from 'remarks' to 'remarks' to match existing usage
  damageNotes?: string;
  settledDate?: Date;
}

export const addRental = async (rentalData: Omit<Rental, 'id'>): Promise<void> => {
  assertRentalsEnabled();
  try {
    await addDoc(collection(firestore, RENTALS_COLLECTION), rentalData);
    invalidateRentalsCache();
  } catch (error) {
    logger.error("Error adding rental: ", error);
    throw new Error('Failed to add rental.');
  }
};

const mapRental = (id: string, data: any): Rental => ({
  id,
  ...data,
  rentalFrom: data.rentalFrom?.toDate(),
  rentalTo: data.rentalTo?.toDate(),
  settledDate: data.settledDate?.toDate(),
} as Rental);

export interface RentalPageOptions {
  pageSize?: number;
  cursor?: QueryDocumentSnapshot | null;
  status?: Rental['status'];
  /** Max 30 ids (Firestore `in` limit). */
  customerIds?: string[];
  /** Inclusive range on rentalFrom. */
  from?: Date;
  to?: Date;
}

export interface RentalPage {
  rentals: Rental[];
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Bounded, cursor-paginated rental query ordered by rentalFrom desc.
 * Never reads the whole collection. Required composite indexes are in firestore.indexes.json.
 */
export const getRentalsPage = async (opts: RentalPageOptions = {}): Promise<RentalPage> => {
  const pageSize = Math.min(Math.max(opts.pageSize ?? 30, 1), 100);
  try {
    const c: QueryConstraint[] = [];
    if (opts.customerIds) {
      if (opts.customerIds.length === 0) return { rentals: [], cursor: null, hasMore: false };
      c.push(where('customerId', 'in', opts.customerIds.slice(0, 30)));
    }
    if (opts.status) c.push(where('status', '==', opts.status));
    if (opts.from) c.push(where('rentalFrom', '>=', Timestamp.fromDate(opts.from)));
    if (opts.to) c.push(where('rentalFrom', '<=', Timestamp.fromDate(opts.to)));
    c.push(orderBy('rentalFrom', 'desc'));
    if (opts.cursor) c.push(startAfter(opts.cursor));
    c.push(limit(pageSize));

    const snap = await getDocs(query(collection(firestore, RENTALS_COLLECTION), ...c));
    return {
      rentals: snap.docs.map((d) => mapRental(d.id, d.data())),
      cursor: snap.docs.length ? snap.docs[snap.docs.length - 1] : (opts.cursor ?? null),
      hasMore: snap.docs.length === pageSize,
    };
  } catch (error) {
    logger.error('Error getting rentals page: ', error);
    throw new Error('Failed to fetch rentals.');
  }
};

/** Latest N rentals (default 30). */
export const getRecentRentals = async (n = 30): Promise<Rental[]> =>
  (await getRentalsPage({ pageSize: n })).rentals;

/** All rentals started on the given calendar day (local time), capped at 100. */
export const getRentalsByDate = async (day: Date): Promise<Rental[]> => {
  const from = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const to = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
  return (await getRentalsPage({ from, to, pageSize: 100 })).rentals;
};

/** Only open (Active/Overdue) rentals; bounded by the number of unsettled accounts. */
export const getUnsettledRentals = async (): Promise<Rental[]> => {
  try {
    const snap = await getDocs(
      query(collection(firestore, RENTALS_COLLECTION), where('status', 'in', ['Active', 'Overdue'])),
    );
    return snap.docs.map((d) => mapRental(d.id, d.data()));
  } catch (error) {
    logger.error('Error getting unsettled rentals: ', error);
    throw new Error('Failed to fetch unsettled rentals.');
  }
};

/** Server-side totals (no documents transferred). */
export const getLedgerTotals = async (): Promise<{ moneyReceived: number; pendingAmount: number; refundOwed: number }> => {
  try {
    const col = collection(firestore, RENTALS_COLLECTION);
    const closed = query(col, where('status', 'in', ['Completed', 'Settled']));
    const open = query(col, where('status', 'in', ['Active', 'Overdue']));

    const [received, pending] = await Promise.all([
      getAggregateFromServer(closed, { total: sum('advanceAmount') }),
      getAggregateFromServer(open, { total: sum('balanceDue') }),
    ]);

    // Refund totals need their own index; treat them as 0 rather than failing
    // the whole ledger if that index is still building.
    let refundClosed = 0;
    let refundOpen = 0;
    try {
      const [rc, ro] = await Promise.all([
        getAggregateFromServer(closed, { total: sum('refundDue') }),
        getAggregateFromServer(open, { total: sum('refundDue') }),
      ]);
      refundClosed = rc.data().total ?? 0;
      refundOpen = ro.data().total ?? 0;
    } catch (error) {
      logger.warn('Refund totals unavailable (index may be building).', error);
    }

    return {
      // Refunds still owed are not money the shop has kept.
      moneyReceived: (received.data().total ?? 0) - refundClosed,
      pendingAmount: pending.data().total ?? 0,
      refundOwed: refundClosed + refundOpen,
    };
  } catch (error) {
    logger.error('Error getting ledger totals: ', error);
    throw new Error('Failed to fetch ledger totals.');
  }
};

export const getRental = async (rentalId: string): Promise<Rental | null> => {
    try {
        const docRef = doc(firestore, RENTALS_COLLECTION, rentalId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return mapRental(docSnap.id, docSnap.data());
        } else {
            logger.debug("No such rental document!");
            return null;
        }
    } catch (error) {
        logger.error("Error getting rental: ", error);
        throw new Error('Failed to fetch rental.');
    }
}

export const getRentalsByCustomerId = async (customerId: string): Promise<Rental[]> => {
  try {
    const rentalsCol = collection(firestore, RENTALS_COLLECTION);
    const q = query(rentalsCol, where('customerId', '==', customerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => mapRental(d.id, d.data()));
  } catch (error) {
    logger.error("Error getting rentals by customer ID: ", error);
    throw new Error('Failed to fetch customer rentals.');
  }
};

export const updateRental = async (rentalId: string, updates: Partial<Rental>): Promise<void> => {
  assertRentalsEnabled();
  try {
    const docRef = doc(firestore, RENTALS_COLLECTION, rentalId);
    await updateDoc(docRef, updates);
    invalidateRentalsCache();
  } catch (error) {
    logger.error("Error updating rental: ", error);
    throw new Error('Failed to update rental.');
  }
};

export const deleteRental = async (rentalId: string): Promise<void> => {
  assertRentalsEnabled();
  try {
    await deleteDoc(doc(firestore, RENTALS_COLLECTION, rentalId));
    invalidateRentalsCache();
  } catch (error) {
    logger.error("Error deleting rental: ", error);
    throw new Error('Failed to delete rental.');
  }
};

// --- Storage Functions ---
export const uploadFile = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `files/${Date.now()}_${file.name}`);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        logger.error("Error uploading file: ", error);
        throw new Error('Failed to upload file.');
    }
};
