
// No real cloud storage is configured, so uploaded images are compressed and stored
// directly as base64 data URLs in Firestore. These render offline and never break.

const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.8;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const uploadFile = async (file: File): Promise<string> => {
  const original = await readAsDataUrl(file);

  // Only images can be downscaled; anything else is stored as-is.
  if (!file.type.startsWith('image/')) return original;

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = original;
    });

    let width = img.width;
    let height = img.height;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width >= height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } catch {
    return original;
  }
};

// Old records may hold a placeholder URL from the previous mock that points to a
// non-existent bucket. Treat those (and empty values) as "no photo".
export const isUsablePhoto = (url?: string): url is string =>
  !!url && !url.includes('your-project-id.appspot.com');
