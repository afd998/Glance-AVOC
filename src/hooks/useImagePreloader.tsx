import { useEffect, useState } from 'react';

interface UseImagePreloaderProps {
  imageUrls: string[];
  priority?: boolean;
}

export function useImagePreloader({ imageUrls, priority = false }: UseImagePreloaderProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!priority || imageUrls.length === 0) return;

    const preloadPromises = imageUrls.map((url) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(url);
        img.src = url;
      });
    });

    Promise.allSettled(preloadPromises).then((results) => {
      const loaded = new Set<string>();
      const failed = new Set<string>();

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          loaded.add(imageUrls[index]);
        } else {
          failed.add(imageUrls[index]);
        }
      });

      setLoadedImages(loaded);
      setFailedImages(failed);
    });
  }, [imageUrls, priority]);

  return { loadedImages, failedImages };
}
