import { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  title?: string;
}

/**
 * ImageGallery - Displays a gallery of property images with thumbnail navigation.
 * 
 * Features:
 * - Main image display with navigation arrows
 * - Thumbnail strip for quick navigation
 * - Keyboard navigation (left/right arrows)
 * - Responsive design
 * 
 * Props:
 * - images: Array of image URLs to display
 * - title: Optional property title for alt text
 */
export default function ImageGallery({ images, title = 'Property' }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Handle empty or single image cases
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg">
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }

  // For single image, just display it without navigation
  if (images.length === 1) {
    return (
      <div className="relative w-full h-96">
        <img
          src={images[0]}
          alt={title}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  return (
    <div className="w-full" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Main Image Container */}
      <div className="relative w-full h-96 group">
        <img
          src={images[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1} of ${images.length}`}
          className="w-full h-full object-cover rounded-lg"
        />

        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Previous image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Next Button */}
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Next image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Thumbnail Navigation */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`flex-shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              index === currentIndex
                ? 'border-blue-600 ring-2 ring-blue-600'
                : 'border-transparent hover:border-gray-300'
            }`}
            aria-label={`View image ${index + 1}`}
            aria-current={index === currentIndex ? 'true' : 'false'}
          >
            <img
              src={image}
              alt={`${title} - Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
