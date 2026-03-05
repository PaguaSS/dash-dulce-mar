import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file if it is larger than the specified size in MB.
 * Default max size is 1.5MB.
 */
export const compressImage = async (
  file: File,
  maxSizeMB: number = 1.5
): Promise<File> => {
  if (file.size / 1024 / 1024 <= maxSizeMB) {
    return file;
  }

  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // browser-image-compression returns a Blob/File, ensure it has the original name/type if needed
    // It usually preserves them, but good to be safe if specific props are lost
    return new File([compressedFile], file.name, { type: file.type });
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original if compression fails
  }
};
