import { lazy, ComponentType, LazyExoticComponent } from "react";

/**
 * Enhanced lazy loading with retry mechanism
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Failed to load component (attempt ${i + 1}/${retries}):`,
          error
        );

        // Wait before retrying (exponential backoff)
        if (i < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 1000)
          );
        }
      }
    }

    throw lastError;
  });
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return componentImport();
}

/**
 * Create a lazy component with preloading capability
 */
export function createLazyComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3
) {
  const LazyComponent = lazyWithRetry(componentImport, retries);

  return {
    Component: LazyComponent,
    preload: () => preloadComponent(componentImport),
  };
}

/**
 * Intersection Observer based lazy loading for images
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private imageCache = new Set<string>();

  constructor() {
    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImage(img);
              this.observer?.unobserve(img);
            }
          });
        },
        {
          rootMargin: "50px 0px", // Start loading 50px before the image enters viewport
          threshold: 0.01,
        }
      );
    }
  }

  observe(img: HTMLImageElement): void {
    if (this.observer && img.dataset.src) {
      this.observer.observe(img);
    }
  }

  unobserve(img: HTMLImageElement): void {
    if (this.observer) {
      this.observer.unobserve(img);
    }
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (!src) return;

    // Check if image is already cached
    if (this.imageCache.has(src)) {
      img.src = src;
      img.classList.add("loaded");
      return;
    }

    // Create a new image to preload
    const imageLoader = new Image();

    imageLoader.onload = () => {
      img.src = src;
      img.classList.add("loaded");
      this.imageCache.add(src);
    };

    imageLoader.onerror = () => {
      img.classList.add("error");
      // Set fallback image if available
      if (img.dataset.fallback) {
        img.src = img.dataset.fallback;
      }
    };

    imageLoader.src = src;
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Global lazy image loader instance
export const lazyImageLoader = new LazyImageLoader();

/**
 * Hook for lazy loading images
 */
export function useLazyImage() {
  const observeImage = (img: HTMLImageElement | null) => {
    if (img) {
      lazyImageLoader.observe(img);
    }
  };

  const unobserveImage = (img: HTMLImageElement | null) => {
    if (img) {
      lazyImageLoader.unobserve(img);
    }
  };

  return { observeImage, unobserveImage };
}
