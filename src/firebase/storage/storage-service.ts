
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/setup';

/**
 * Uploads a file to a specified path in Firebase Storage.
 * @param file The file to upload.
 * @param path The path to upload the file to.
 * @returns The download URL of the uploaded file.
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("File upload failed. Please try again.");
  }
};
