import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '@/firebase/setup';

// Constants for collection names
const CUSTOMERS_COLLECTION = 'kirayabook_customers';
const RENTALS_COLLECTION = 'kirayabook_rentals';

let customersCache: Customer[] | null = null;
let customersCachePromise: Promise<Customer[]> | null = null;
let rentalsCache: Rental[] | null = null;
let rentalsCachePromise: Promise<Rental[]> | null = null;

const invalidateCustomersCache = () => {
  customersCache = null;
  customersCachePromise = null;
};

const invalidateRentalsCache = () => {
  rentalsCache = null;
  rentalsCachePromise = null;
};

// --- Customer Functions ---

export interface Customer {
  id?: string;
  name: string;
  mobile: string;
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
    console.error("Error adding customer: ", error);
    throw new Error('Failed to add customer.');
  }
};

export const getAllCustomers = async (): Promise<Customer[]> => {
  if (customersCache) {
    return customersCache;
  }

  if (!customersCachePromise) {
    customersCachePromise = (async () => {
      try {
        const customersCol = collection(firestore, CUSTOMERS_COLLECTION);
        const q = query(customersCol);
        const querySnapshot = await getDocs(q);
        const customers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Customer));

        customersCache = customers;
        return customers;
      } catch (error) {
        customersCachePromise = null;
        console.error("Error getting all customers: ", error);
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
      return { id: docSnap.id, ...docSnap.data() } as Customer;
    } else {
      console.log("No such customer document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting customer by ID: ", error);
    throw new Error('Failed to fetch customer.');
  }
};

export const getCustomerByMobile = async (mobile: string): Promise<Customer | null> => {
    try {
        const cachedCustomer = customersCache?.find(customer => customer.mobile === mobile);
        if (cachedCustomer) {
            return cachedCustomer;
        }

        const customersCol = collection(firestore, CUSTOMERS_COLLECTION);
        const q = query(customersCol, where('mobile', '==', mobile));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Customer;
        } else {
            console.log("No customer found with that mobile number!");
            return null;
        }
    } catch (error) {
        console.error("Error getting customer by mobile: ", error);
        throw new Error('Failed to fetch customer.');
    }
};

export const updateCustomer = async (customerId: string, updates: Partial<Customer>): Promise<void> => {
  try {
    const docRef = doc(firestore, CUSTOMERS_COLLECTION, customerId);
    await updateDoc(docRef, updates);
    invalidateCustomersCache();
  } catch (error) {
    console.error("Error updating customer: ", error);
    throw new Error('Failed to update customer.');
  }
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, CUSTOMERS_COLLECTION, customerId));
    invalidateCustomersCache();
  } catch (error) {
    console.error("Error deleting customer: ", error);
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
  status: 'Active' | 'Settled' | 'Overdue' | 'Completed'; // Added 'Completed' status
  remarks?: string; // Changed from 'remarks' to 'remarks' to match existing usage
  damageNotes?: string;
  settledDate?: Date;
}

export const addRental = async (rentalData: Omit<Rental, 'id'>): Promise<void> => {
  try {
    await addDoc(collection(firestore, RENTALS_COLLECTION), rentalData);
    invalidateRentalsCache();
  } catch (error) {
    console.error("Error adding rental: ", error);
    throw new Error('Failed to add rental.');
  }
};

export const getAllRentals = async (): Promise<Rental[]> => {
  if (rentalsCache) {
    return rentalsCache;
  }

  if (!rentalsCachePromise) {
    rentalsCachePromise = (async () => {
      try {
        const rentalsCol = collection(firestore, RENTALS_COLLECTION);
        const q = query(rentalsCol);
        const querySnapshot = await getDocs(q);
        const rentals = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            rentalFrom: data.rentalFrom?.toDate(),
            rentalTo: data.rentalTo?.toDate(),
            settledDate: data.settledDate?.toDate(),
          } as Rental;
        });

        rentalsCache = rentals;
        return rentals;
      } catch (error) {
        rentalsCachePromise = null;
        console.error("Error getting all rentals: ", error);
        throw new Error('Failed to fetch rentals.');
      }
    })();
  }

  return rentalsCachePromise;
};

export const getRental = async (rentalId: string): Promise<Rental | null> => {
    try {
        const docRef = doc(firestore, RENTALS_COLLECTION, rentalId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                rentalFrom: data.rentalFrom?.toDate(),
                rentalTo: data.rentalTo?.toDate(),
                settledDate: data.settledDate?.toDate(),
            } as Rental;
        } else {
            console.log("No such rental document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting rental: ", error);
        throw new Error('Failed to fetch rental.');
    }
}

export const getRentalsByCustomerId = async (customerId: string): Promise<Rental[]> => {
  try {
    const rentalsCol = collection(firestore, RENTALS_COLLECTION);
    const q = query(rentalsCol, where('customerId', '==', customerId));
    const querySnapshot = await getDocs(q);
    const rentals: Rental[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      rentals.push({
        id: doc.id,
        ...data,
        rentalFrom: data.rentalFrom?.toDate(),
        rentalTo: data.rentalTo?.toDate(),
        settledDate: data.settledDate?.toDate(),
      } as Rental);
    });
    return rentals;
  } catch (error) {
    console.error("Error getting rentals by customer ID: ", error);
    throw new Error('Failed to fetch customer rentals.');
  }
};

export const updateRental = async (rentalId: string, updates: Partial<Rental>): Promise<void> => {
  try {
    const docRef = doc(firestore, RENTALS_COLLECTION, rentalId);
    await updateDoc(docRef, updates);
    invalidateRentalsCache();
  } catch (error) {
    console.error("Error updating rental: ", error);
    throw new Error('Failed to update rental.');
  }
};

export const deleteRental = async (rentalId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, RENTALS_COLLECTION, rentalId));
    invalidateRentalsCache();
  } catch (error) {
    console.error("Error deleting rental: ", error);
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
        console.error("Error uploading file: ", error);
        throw new Error('Failed to upload file.');
    }
};
