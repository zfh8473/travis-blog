"use client";

import { useState } from "react";
import Image from "next/image";
import { generatePlaceholderThumbnail } from "@/lib/utils/image-extractor";

/**
 * Article thumbnail component with error handling.
 * 
 * Displays article thumbnail with fallback to placeholder if image fails to load.
 * 
 * @component
 * @param props - Component props
 * @param props.thumbnailUrl - Thumbnail URL (from extractFirstImage or placeholder)
 * @param props.articleTitle - Article title (for placeholder generation)
 * @param props.index - Article index in list (for placeholder gradient)
 * @param props.total - Total number of articles (for placeholder gradient)
 * @param props.alt - Alt text for image
 */
export default function ArticleThumbnail({
  thumbnailUrl,
  articleTitle,
  index,
  total,
  alt,
}: {
  thumbnailUrl: string;
  articleTitle: string;
  index: number;
  total: number;
  alt: string;
}) {
  const [currentUrl, setCurrentUrl] = useState(thumbnailUrl);
  const [hasError, setHasError] = useState(false);

  // If it's a data URI, use regular img tag
  if (currentUrl.startsWith("data:")) {
    return (
      <img
        src={currentUrl}
        alt={alt}
        className="w-full h-16 object-cover"
      />
    );
  }

  // If error occurred, use placeholder
  if (hasError || !currentUrl) {
    const placeholderUrl = generatePlaceholderThumbnail(articleTitle, index, total);
    return (
      <img
        src={placeholderUrl}
        alt={alt}
        className="w-full h-16 object-cover"
      />
    );
  }

  // Use Next.js Image component for regular URLs
  return (
    <div className="relative w-full h-16">
      <Image
        src={currentUrl}
        alt={alt}
        fill
        className="object-cover"
        sizes="64px"
        onError={() => {
          // Fallback to placeholder on error
          setHasError(true);
          setCurrentUrl(generatePlaceholderThumbnail(articleTitle, index, total));
        }}
      />
    </div>
  );
}

