import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLazyImage } from "../utils/lazyLoading";

export interface ImageSize {
  width: number;
  height: number;
  url: string;
}

export interface OptimizedImageProps {
  src: string;
  alt: string;
  sizes?: ImageSize[];
  fallbackSrc?: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  lazy?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  sizes = [],
  fallbackSrc,
  placeholder,
  className = "",
  style,
  lazy = true,
  quality = 80,
  onLoad,
  onError,
  onClick,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || "");
  const imgRef = useRef<HTMLImageElement>(null);
  const { observeImage, unobserveImage } = useLazyImage();

  // Generate srcSet from sizes
  const srcSet =
    sizes.length > 0
      ? sizes.map((size) => `${size.url} ${size.width}w`).join(", ")
      : "";

  // Generate sizes attribute
  const sizesAttr =
    sizes.length > 0
      ? sizes
          .map((size) => `(max-width: ${size.width}px) ${size.width}px`)
          .join(", ")
      : "";

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    onError?.();
  }, [fallbackSrc, currentSrc, onError]);

  // Set up lazy loading
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (lazy) {
      // Set data attributes for lazy loading
      img.dataset.src = src;
      if (fallbackSrc) {
        img.dataset.fallback = fallbackSrc;
      }

      observeImage(img);

      return () => {
        unobserveImage(img);
      };
    } else {
      // Load immediately if not lazy
      setCurrentSrc(src);
    }
  }, [src, fallbackSrc, lazy, observeImage, unobserveImage]);

  // Update src when lazy loading triggers
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.classList.contains("loaded") && img.src !== currentSrc) {
      setCurrentSrc(img.src);
    }
  }, [currentSrc]);

  // Preload critical images
  const preloadImage = useCallback((imageSrc: string) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = imageSrc;
    document.head.appendChild(link);
  }, []);

  // Generate WebP sources if supported
  const generateWebPSources = () => {
    if (sizes.length === 0) return null;

    return (
      <source
        srcSet={sizes
          .map((size) => {
            const webpUrl = size.url.replace(/\.(jpg|jpeg|png)$/i, ".webp");
            return `${webpUrl} ${size.width}w`;
          })
          .join(", ")}
        sizes={sizesAttr}
        type="image/webp"
      />
    );
  };

  // Render placeholder while loading
  if (!isLoaded && !hasError && placeholder) {
    return (
      <div
        className={`image-placeholder ${className}`}
        style={{
          ...style,
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
        }}
      >
        {placeholder === "blur" ? (
          <div className="blur-placeholder" />
        ) : (
          <span>Loading...</span>
        )}
      </div>
    );
  }

  // Render error state
  if (hasError && !fallbackSrc) {
    return (
      <div
        className={`image-error ${className}`}
        style={{
          ...style,
          backgroundColor: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
          border: "1px solid #ddd",
        }}
      >
        <span>Image not available</span>
      </div>
    );
  }

  // Use picture element for multiple formats/sizes
  if (sizes.length > 0) {
    return (
      <picture className={className} onClick={onClick}>
        {generateWebPSources()}
        <img
          ref={imgRef}
          src={currentSrc}
          srcSet={srcSet}
          sizes={sizesAttr}
          alt={alt}
          style={style}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? "lazy" : "eager"}
          decoding="async"
          className={`
            ${isLoaded ? "loaded" : "loading"}
            ${hasError ? "error" : ""}
          `.trim()}
        />
      </picture>
    );
  }

  // Simple img element
  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`
        ${className}
        ${isLoaded ? "loaded" : "loading"}
        ${hasError ? "error" : ""}
      `.trim()}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
      onClick={onClick}
      loading={lazy ? "lazy" : "eager"}
      decoding="async"
    />
  );
}

/**
 * Hook for responsive image sizes
 */
export function useResponsiveImage(
  baseUrl: string,
  sizes: number[] = [400, 800, 1200]
) {
  const generateSizes = useCallback(
    (url: string): ImageSize[] => {
      return sizes.map((width) => ({
        width,
        height: Math.round(width * 0.75), // Assume 4:3 aspect ratio
        url: `${url}?w=${width}&q=80&f=webp`,
      }));
    },
    [sizes]
  );

  const getOptimalSize = useCallback(
    (containerWidth: number): ImageSize | null => {
      const imageSizes = generateSizes(baseUrl);

      // Find the smallest size that's larger than the container
      const optimalSize = imageSizes.find(
        (size) => size.width >= containerWidth
      );

      // If no size is large enough, use the largest available
      return optimalSize || imageSizes[imageSizes.length - 1] || null;
    },
    [baseUrl, generateSizes]
  );

  return {
    generateSizes,
    getOptimalSize,
  };
}

/**
 * Image compression utility
 */
export class ImageCompressor {
  static async compressImage(
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 1200,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  static async generateThumbnail(
    file: File,
    size: number = 150
  ): Promise<string> {
    const compressedBlob = await this.compressImage(file, size, size, 0.7);
    return URL.createObjectURL(compressedBlob);
  }
}
