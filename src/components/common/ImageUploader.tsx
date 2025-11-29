import { useState, useRef } from 'react';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

/**
 * ImageUploader - Component for selecting and previewing multiple property images.
 * 
 * In the frontend-only demo, images are converted to base64 data URLs for preview.
 * In production with a backend, this component would prepare files for multipart/form-data upload.
 * 
 * Features:
 * - Multiple file selection
 * - Drag and drop support
 * - Image preview with removal
 * - Reordering capability (first image is primary)
 * - URL input option for external images
 * 
 * Props:
 * - images: Current array of image URLs (can be data URLs or http URLs)
 * - onImagesChange: Callback when images array changes
 * - maxImages: Maximum number of images allowed (default: 10)
 */
export default function ImageUploader({ images, onImagesChange, maxImages = 10 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    // Filter to only image files and warn if non-images were included
    const imageFiles = filesToProcess.filter((file) => file.type.startsWith('image/'));
    const skippedCount = filesToProcess.length - imageFiles.length;
    if (skippedCount > 0) {
      setUrlError(`${skippedCount} non-image file(s) were skipped`);
      setTimeout(() => setUrlError(''), 3000);
    }

    // Process all files and collect results to update state once
    const readPromises = imageFiles.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            resolve(dataUrl);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    });

    // Wait for all files to be read, then update state once
    Promise.all(readPromises).then((newDataUrls) => {
      if (newDataUrls.length > 0) {
        onImagesChange([...images, ...newDataUrls]);
      }
    }).catch((error) => {
      console.error('Error reading files:', error);
    });
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle URL input
  const handleUrlAdd = () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;

    // Check max images first before validating URL
    if (images.length >= maxImages) {
      setUrlError(`Maximum ${maxImages} images allowed`);
      return;
    }

    try {
      new URL(trimmedUrl);
      onImagesChange([...images, trimmedUrl]);
      setUrlInput('');
      setUrlError('');
    } catch {
      setUrlError('Please enter a valid URL');
    }
  };

  // Remove image at index
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  // Move image to front (make it primary)
  const makeImagePrimary = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [image] = newImages.splice(index, 1);
    newImages.unshift(image);
    onImagesChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            className="hidden"
          />
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, GIF up to 10MB each ({images.length}/{maxImages} images)
          </p>
        </div>
      )}

      {/* URL Input */}
      {canAddMore && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setUrlError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUrlAdd();
              }
            }}
            placeholder="Or paste an image URL (Unsplash, Imgur, etc.)"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleUrlAdd}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
          >
            Add URL
          </button>
        </div>
      )}
      {urlError && <p className="text-sm text-red-500">{urlError}</p>}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className={`aspect-square rounded-lg overflow-hidden border-2 ${
                index === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}>
                <img
                  src={image}
                  alt={`Property image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Primary badge */}
              {index === 0 && (
                <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                  Primary
                </span>
              )}

              {/* Action buttons */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeImagePrimary(index)}
                    className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Make primary image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        {images.length === 0
          ? 'Add at least one image for your property listing.'
          : `First image will be the primary/cover image. You can reorder by clicking the star icon.`}
      </p>
    </div>
  );
}
