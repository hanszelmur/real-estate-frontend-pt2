import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Property } from '../../types';
import ImageUploader from './ImageUploader';

interface AddPropertyModalProps {
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
 * AddPropertyModal - Modal form for agents and admins to add new property listings.
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
 * - Exclusive (optional): Flag for exclusive listings
 * - Features (optional): Comma-separated feature list
 * 
 * Image Upload:
 * - Supports multiple image selection from local files (Downloads, etc.)
 * - Supports pasting image URLs (Unsplash, Imgur, etc.)
 * - Images are converted to base64 data URLs for frontend-only demo
 * - In production, images would be sent as multipart/form-data to backend
 * - First image in the list becomes the primary/cover image
 * 
 * Access Control: Only agents and admins can add properties.
 */
export default function AddPropertyModal({ onClose, onSuccess }: AddPropertyModalProps) {
  const { addProperty, currentUser } = useApp();

  // Form state
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Davao City');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sqft, setSqft] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        ? ['Exclusive', ...featureList] 
        : featureList;

      // Create property data
      // First image becomes the primary imageUrl for backward compatibility
      // All images are stored in imageUrls array for gallery display
      const propertyData: Omit<Property, 'id'> = {
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
        status: 'available',
        // Assign the current agent to this property if they are an agent
        assignedAgentId: currentUser?.role === 'agent' ? currentUser.id : undefined,
      };

      // Add property via context
      const newProperty = addProperty(propertyData);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(newProperty);
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error adding property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
            <h2 className="text-xl font-semibold text-gray-900">Add New Property</h2>
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
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
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
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
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
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
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
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₱) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
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
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="bedrooms"
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
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="bathrooms"
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
                <label htmlFor="sqft" className="block text-sm font-medium text-gray-700 mb-1">
                  Area (sqm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="sqft"
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
                <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-1">
                  Features
                </label>
                <input
                  type="text"
                  id="features"
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
                  id="exclusive"
                  checked={isExclusive}
                  onChange={(e) => setIsExclusive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="exclusive" className="ml-2 block text-sm text-gray-700">
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
                {isSubmitting ? 'Adding Property...' : 'Add Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
