
'use client';

import { useState } from 'react';
import { uploadFile } from './storage-service';

export function useFileUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);

  const upload = async (file: File, path: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = await uploadFile(file, path);
      setDownloadURL(url);
      return url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { upload, loading, error, downloadURL };
}
