import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Property } from '../../types';
import ImageUploader from './ImageUploader';

interface EditPropertyModalProps {
  property: Property;
  onClose: () => void;
  onSuccess?: (property: Property) => void;
}

interface FormErrors {
  title?: string;
  address?: string;
  city?: string;
  price?: string;
  description?: string;
  bedrooms?: string;
  bathrooms?: string;
  sqft?: string;
  images?: string;
}

/**
 * EditPropertyModal - Modal form for agents and admins to edit existing property listings.
 * 
 * Pre-fills all fields with current property data.
 * Only the assigned agent or admin can edit the property.
 * 
 * Fields:
 * - Title (required): Property name/title
 * - Address (required): Street address
 * - City (required): City name
 * - Price (required): Listing price in PHP
 * - Description (required): Property description
 * - Bedrooms (required): Number of bedrooms
 * - Bathrooms (required): Number of bathrooms
 * - Area/sqm (required): Property area in square meters
 * - Images (required): One or more property images (upload or URL)
 * - Features (optional): Comma-separated feature list
 * - Exclusive (optional): Flag for exclusive listings
 * 
 * Image Management:
 * - Displays existing images with ability to remove/reorder
 * - Supports adding new images via file upload or URL
 * - First image becomes the primary/cover image
 */
export default function EditPropertyModal({ property, onClose, onSuccess }: EditPropertyModalProps) {
  const { updateProperty, currentUser } = useApp();

  // Initialize images array from property
  // Use imageUrls if available, otherwise fall back to single imageUrl
  const getInitialImages = (): string[] => {
    if (property.imageUrls && property.imageUrls.length > 0) {
      return property.imageUrls;
    }
    return property.imageUrl ? [property.imageUrl] : [];
  };

  // Form state - initialized with current property values
  const [title, setTitle] = useState(property.title);
  const [address, setAddress] = useState(property.address);
  const [city, setCity] = useState(property.city);
  const [price, setPrice] = useState(property.price.toString());
  const [description, setDescription] = useState(property.description);
  const [bedrooms, setBedrooms] = useState(property.bedrooms.toString());
  const [bathrooms, setBathrooms] = useState(property.bathrooms.toString());
  const [sqft, setSqft] = useState(property.sqft.toString());
  const [images, setImages] = useState<string[]>(getInitialImages);
  const [features, setFeatures] = useState(
    property.features.filter(f => f !== 'Exclusive').join(', ')
  );
  const [isExclusive, setIsExclusive] = useState(property.isExclusive || property.features.includes('Exclusive'));
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when property changes
  useEffect(() => {
    setTitle(property.title);
    setAddress(property.address);
    setCity(property.city);
    setPrice(property.price.toString());
    setDescription(property.description);
    setBedrooms(property.bedrooms.toString());
    setBathrooms(property.bathrooms.toString());
    setSqft(property.sqft.toString());
    // Reset images from property
    if (property.imageUrls && property.imageUrls.length > 0) {
      setImages(property.imageUrls);
    } else if (property.imageUrl) {
      setImages([property.imageUrl]);
    } else {
      setImages([]);
    }
    setFeatures(property.features.filter(f => f !== 'Exclusive').join(', '));
    setIsExclusive(property.isExclusive || property.features.includes('Exclusive'));
  }, [property]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!bedrooms.trim()) {
      newErrors.bedrooms = 'Number of bedrooms is required';
    } else if (isNaN(Number(bedrooms)) || Number(bedrooms) < 0 || !Number.isInteger(Number(bedrooms))) {
      newErrors.bedrooms = 'Bedrooms must be a non-negative integer';
    }

    if (!bathrooms.trim()) {
      newErrors.bathrooms = 'Number of bathrooms is required';
    } else if (isNaN(Number(bathrooms)) || Number(bathrooms) < 0 || !Number.isInteger(Number(bathrooms))) {
      newErrors.bathrooms = 'Bathrooms must be a non-negative integer';
    }

    if (!sqft.trim()) {
      newErrors.sqft = 'Area is required';
    } else if (isNaN(Number(sqft)) || Number(sqft) <= 0) {
      newErrors.sqft = 'Area must be a positive number';
    }

    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse features from comma-separated string
      const featureList = features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      // Add exclusive flag as a feature if checked
      const allFeatures = isExclusive 
        ? ['Exclusive', ...featureList.filter(f => f !== 'Exclusive')] 
        : featureList.filter(f => f !== 'Exclusive');

      // Update property data
      // First image becomes the primary imageUrl for backward compatibility
      // All images are stored in imageUrls array for gallery display
      const updates: Partial<Property> = {
        title: title.trim(),
        address: address.trim(),
        city: city.trim(),
        price: Number(price),
        description: description.trim(),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        sqft: Number(sqft),
        imageUrl: images[0], // Primary image for backward compatibility
        imageUrls: images, // All images for gallery
        features: allFeatures,
        isExclusive,
      };

      // Update property via context
      updateProperty(property.id, updates);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess({ ...property, ...updates });
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user can edit this property
  const canEdit = currentUser && (
    currentUser.role === 'admin' || 
    (currentUser.role === 'agent' && property.assignedAgentId === currentUser.id)
  );

  if (!canEdit) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to edit this property.</p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
            <h2 className="text-xl font-semibold text-gray-900">Edit Property</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full rounded-md shadow-sm text-sm p-2.5 border ${
                    errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., Modern Villa in Lanang"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full rounded-md shadow-sm text-sm p-2.5 border ${
                    errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., 123 Lanang Boulevard"
                />
                {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
              </div>

              {/* City */}
              <div>
                <label htmlFor="edit-city" className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full rounded-md shadow-sm text-sm p-2.5 border ${
                    errors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., Davao City"
                />
                {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
              </div>

              {/* Price */}
              <div>
                <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₱) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="edit-price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`w-full rounded-md shadow-sm text-sm p-2.5 border ${
                    errors.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., 25000000"
                  min="0"
                />
                {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`w-full rounded-md shadow-sm text-sm p-2.5 border ${
                    errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Describe the property features, location, and other details..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
              </div>

              {/* Bedrooms and Bathrooms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="edit-bedrooms"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className={`w-full rounded-md shadow-sm text-sm p-2.5 border ${
                      errors.bedrooms ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder="e.g., 4"
                    min="0"
                  />
                  {errors.bedrooms && <p className="mt-1 text-sm text-red-500">{errors.bedrooms}</p>}
                </div>
                <div>
                  <label htmlFor="edit-bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="edit-bathrooms"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className={`w-full rounded-md shadow-sm text-sm p-2.5 border ${
                      errors.bathrooms ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder="e.g., 3"
                    min="0"
                  />
                  {errors.bathrooms && <p className="mt-1 text-sm text-red-500">{errors.bathrooms}</p>}
                </div>
              </div>

              {/* Area */}
              <div>
                <label htmlFor="edit-sqft" className="block text-sm font-medium text-gray-700 mb-1">
                  Area (sqm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="edit-sqft"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  className={`w-full rounded-md shadow-sm text-sm p-2.5 border ${
                    errors.sqft ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="e.g., 350"
                  min="0"
                />
                {errors.sqft && <p className="mt-1 text-sm text-red-500">{errors.sqft}</p>}
              </div>

              {/* Property Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Images <span className="text-red-500">*</span>
                </label>
                <ImageUploader
                  images={images}
                  onImagesChange={setImages}
                  maxImages={10}
                />
                {errors.images && <p className="mt-1 text-sm text-red-500">{errors.images}</p>}
              </div>

              {/* Features */}
              <div>
                <label htmlFor="edit-features" className="block text-sm font-medium text-gray-700 mb-1">
                  Features
                </label>
                <input
                  type="text"
                  id="edit-features"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  className="w-full rounded-md shadow-sm text-sm p-2.5 border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Swimming Pool, Garden, Garage (comma-separated)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter features separated by commas.
                </p>
              </div>

              {/* Exclusive Flag */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-exclusive"
                  checked={isExclusive}
                  onChange={(e) => setIsExclusive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-exclusive" className="ml-2 block text-sm text-gray-700">
                  Mark as Exclusive Listing
                </label>
              </div>
              <p className="text-xs text-gray-500 -mt-4 ml-6">
                Exclusive listings are highlighted and may receive priority placement.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
