import { logger } from '@/lib/logger';

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/setup';

export type SharedBarcode = { name: string; category: 'Grocery' | 'Medicine' };

/**
 * Barcodes the family has already named, shared between the allowed accounts so a pack only has to
 * be named once. Saved names win over every outside source. This list only saves typing, so a
 * failure here must never stop a scan or a save.
 */
export const getSharedBarcode = async (code: string): Promise<SharedBarcode | null> => {
  try {
    const snapshot = await getDoc(doc(firestore, 'barcodes', code));
    return snapshot.exists() ? (snapshot.data() as SharedBarcode) : null;
  } catch (error) {
    logger.error('Error reading shared barcode:', error);
    return null;
  }
};

export const saveSharedBarcode = async (code: string, entry: SharedBarcode, userId: string) => {
  try {
    await setDoc(doc(firestore, 'barcodes', code), { ...entry, updatedBy: userId, updatedAt: serverTimestamp() });
  } catch (error) {
    logger.error('Error saving shared barcode:', error);
  }
};
