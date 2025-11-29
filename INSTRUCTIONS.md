# INSTRUCTIONS.md - Property Image Gallery Implementation

This document describes how property images are uploaded, stored, and displayed in the TES Properties application.

---

## Overview

The property image gallery feature allows agents and admins to:
- Upload multiple images when creating or editing a property
- View all images in a gallery format on the property detail page
- Set a primary/cover image for property cards

---

## Image Upload Workflow

### Adding Images When Creating/Editing a Property

1. **Navigate to Add/Edit Property Modal**
   - Click "Add Property" button (agents/admins)
   - Or click "Edit" button on an existing property

2. **Add Images via Upload**
   - Click the upload area to open file browser
   - Select one or more image files from your computer (Downloads, Desktop, etc.)
   - Supported formats: PNG, JPG, GIF (up to 10MB each)
   - Up to 10 images per property

3. **Add Images via URL**
   - Paste an image URL in the text field (e.g., from Unsplash, Imgur)
   - Click "Add URL" button
   - URL is validated before adding

4. **Manage Images**
   - **Remove**: Click the X button on any image thumbnail
   - **Make Primary**: Click the star icon to move an image to first position
   - First image becomes the property's primary/cover image

5. **Submit**
   - Click "Add Property" or "Save Changes"
   - Images are stored with the property data

---

## Image Storage (Frontend Demo)

In the frontend-only demo, images are stored in React context state:

### Data Structure

```typescript
interface Property {
  id: string;
  // ... other fields
  imageUrl: string;      // Primary image URL (backward compatibility)
  imageUrls?: string[];  // Array of all images for gallery
}
```

### Storage Types

| Image Source | Storage Format | Lifetime |
|--------------|---------------|----------|
| File Upload | Base64 data URL | Until page refresh |
| External URL | HTTP/HTTPS URL | Permanent (depends on source) |
| Demo/Seed Data | Unsplash URLs | Permanent |

### Example Data

```typescript
// Property with multiple images
{
  id: 'prop-1',
  title: 'Modern Villa in Lanang',
  imageUrl: 'https://images.unsplash.com/photo-1613490493576?w=800',
  imageUrls: [
    'https://images.unsplash.com/photo-1613490493576?w=800',
    'https://images.unsplash.com/photo-1600596542815?w=800',
    'https://images.unsplash.com/photo-1600607687939?w=800',
  ],
  // ... other fields
}
```

---

## Image Display

### Property Cards (Grid View)

- Shows first image from `imageUrls` array (or `imageUrl` if no array)
- 48px height, object-cover fit
- Used on `/properties` page

### Property Detail Page

- Full image gallery with navigation
- Main image display (96 height = h-96)
- Previous/Next arrow buttons
- Thumbnail strip below main image
- Image counter (e.g., "1 / 4")
- Keyboard navigation (left/right arrows)

### Gallery Component Features

```
┌─────────────────────────────────────────┐
│                                         │
│           [Main Image Display]          │
│                                         │
│  ←    (Previous/Next navigation)    →   │
│                                    1/4  │
└─────────────────────────────────────────┘
┌────┐ ┌────┐ ┌────┐ ┌────┐
│ T1 │ │ T2 │ │ T3 │ │ T4 │  ← Thumbnails
└────┘ └────┘ └────┘ └────┘
```

---

## Production Backend Integration

When integrating with a real backend, the image upload flow changes:

### Frontend Changes

1. **Collect Files**: Instead of converting to base64, collect File objects
2. **Prepare FormData**: Create multipart/form-data payload
3. **POST to Backend**: Send files with property data

```typescript
// Example production implementation
async function createPropertyWithImages(propertyData, imageFiles) {
  const formData = new FormData();
  
  // Add property fields
  formData.append('title', propertyData.title);
  formData.append('price', propertyData.price.toString());
  // ... other fields
  
  // Add image files
  imageFiles.forEach((file, index) => {
    formData.append(`images`, file);
  });
  
  const response = await fetch('/api/properties', {
    method: 'POST',
    body: formData,
    // Note: Don't set Content-Type header - browser sets it with boundary
  });
  
  return response.json();
}
```

### Backend Requirements

1. **Parse multipart/form-data**: Use middleware like `multer` (Node.js)
2. **Upload to storage**: AWS S3, Cloudinary, or local filesystem
3. **Generate URLs**: Return CDN URLs for stored images
4. **Store references**: Save URLs in database with property

### API Response Example

```json
{
  "id": "prop-123",
  "title": "New Property",
  "imageUrl": "https://cdn.example.com/properties/123/img1.jpg",
  "imageUrls": [
    "https://cdn.example.com/properties/123/img1.jpg",
    "https://cdn.example.com/properties/123/img2.jpg",
    "https://cdn.example.com/properties/123/img3.jpg"
  ]
}
```

---

## Demo/Seed Data Images

Seed properties in `src/data/mockData.ts` include multiple images from Unsplash:

| Property | Image Count | Source |
|----------|-------------|--------|
| Modern Villa in Lanang | 4 | Unsplash |
| Cozy Townhouse in Matina | 3 | Unsplash |
| Executive Condo in Abreeza | 5 | Unsplash |
| Beachfront Property in Samal | 3 | Unsplash |
| Family Home in Buhangin | 4 | Unsplash |
| Starter Home in Catalunan | 1 | Unsplash |

The last property demonstrates backward compatibility with single-image properties.

---

## Components Reference

### ImageUploader (`src/components/common/ImageUploader.tsx`)

Multi-image upload component with:
- File selection and drag-drop
- URL input
- Image preview grid
- Reorder/remove functionality

Props:
- `images: string[]` - Current image URLs
- `onImagesChange: (images: string[]) => void` - Callback when images change
- `maxImages?: number` - Maximum images allowed (default: 10)

### ImageGallery (`src/components/common/ImageGallery.tsx`)

Gallery display component with:
- Main image with navigation
- Thumbnail strip
- Keyboard navigation

Props:
- `images: string[]` - Array of image URLs
- `title?: string` - Property title for alt text

---

## User Roles and Access

| Role | Add Images | Edit Images | View Gallery |
|------|------------|-------------|--------------|
| Customer | ❌ | ❌ | ✅ |
| Agent | ✅ (own properties) | ✅ (own properties) | ✅ |
| Admin | ✅ (all properties) | ✅ (all properties) | ✅ |

---

## Technical Notes

1. **Backward Compatibility**: Properties without `imageUrls` array fall back to `imageUrl` field
2. **Primary Image Sync**: First image in `imageUrls` is always copied to `imageUrl`
3. **State Management**: Images stored in React context (demo) or backend (production)
4. **File Size**: Frontend doesn't enforce size limits; backend should validate
5. **Image Optimization**: Production backends should resize/optimize images

---

## Troubleshooting

### Images Not Displaying

1. Check browser console for CORS errors (external URLs)
2. Verify URL format is correct (starts with http:// or https://)
3. For base64 images, check if data URL is complete

### Upload Not Working

1. Ensure files are image type (png, jpg, gif)
2. Check maximum image count hasn't been reached
3. Verify file input accepts image/* MIME types

### Gallery Navigation Issues

1. Click inside gallery container for keyboard navigation
2. Ensure gallery container is focused (tabIndex=0)
3. Check images array is not empty

---

## Future Enhancements

1. **Image Cropping**: Allow crop before upload
2. **Lazy Loading**: Load thumbnails on demand
3. **Lightbox View**: Full-screen image viewing
4. **Image Captions**: Add descriptions to individual images
5. **Video Support**: Property video tours
