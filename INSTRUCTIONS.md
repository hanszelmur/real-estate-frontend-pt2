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

---

## 📖 Common Workflows by Role

### Customer Workflows

#### Workflow 1: Browse and Book a Property Viewing

1. **Navigate to Properties**
   - Click "Properties" in the navigation menu
   - Browse the grid of available properties

2. **Filter Properties (Optional)**
   - Use status dropdown to filter by availability
   - Select price range filter
   - Choose number of bedrooms

3. **View Property Details**
   - Click on a property card to view full details
   - Navigate through property image gallery using arrows or thumbnails
   - Review features, description, and specifications

4. **Login (If Not Already Logged In)**
   - Click "Login to Book" button
   - Select "Customer" role
   - Click "Continue as Customer"

5. **Book a Viewing**
   - On property detail page, click "Book Viewing" button
   - Select preferred agent from dropdown (or use auto-assign)
   - Choose viewing date within 7-day window
   - Select available time slot
   - Review booking details
   - Click "Confirm Booking"

6. **Check Booking Status**
   - Navigate to "My Bookings" dashboard
   - View appointment status (Pending → Accepted → Completed)
   - See priority position if property has multiple interested customers

#### Workflow 2: Manage Your Appointments

1. **Access Dashboard**
   - Click "My Bookings" in navigation

2. **Filter Appointments**
   - Use tabs: All, Accepted, Pending, Rejected
   - View appointment cards with status badges

3. **View Appointment Details**
   - Click on an appointment card
   - See property details, agent info, date/time, status

4. **Cancel Appointment (If Needed)**
   - Open appointment details
   - Click "Cancel Appointment"
   - Confirm cancellation
   - Next customer in queue is automatically promoted

5. **Rate Agent (After Completed Viewing)**
   - Open completed appointment
   - Click "Rate Agent" button
   - Select star rating (1-5)
   - Add optional feedback text
   - Submit rating

#### Workflow 3: Verify Your Phone Number

1. **Access Settings**
   - Click settings icon (gear) in navigation

2. **Verify Phone**
   - View current verification status
   - If unverified, click "Send Verification Code"
   - Enter ANY 6-digit code (demo mode)
   - Status changes to "Verified" with green indicator

3. **Why Verify?**
   - Required for messaging with agents
   - Both customer and agent must be verified to chat

### Agent Workflows

#### Workflow 1: Manage Appointment Requests

1. **Access Agent Dashboard**
   - Login as Agent (select agent from dropdown)
   - Navigate to "Dashboard"

2. **Review Pending Appointments**
   - View "Upcoming Appointments" section
   - See pending appointment requests

3. **Accept or Reject Appointment**
   - Click on appointment card
   - Review customer details and requested time
   - Click "Accept" to confirm
   - Or click "Reject" if unavailable
   - Customer is notified immediately

4. **After Viewing Completion**
   - Open accepted appointment
   - Click "Mark as Done" (viewing complete, no purchase)
   - Or click "Mark as Sold" (property purchased)
   - Property status updates automatically

#### Workflow 2: Manage Your Calendar

1. **Open Calendar**
   - Click "Calendar" in navigation
   - View full month calendar

2. **Review Schedule**
   - See appointments color-coded by status
   - Yellow = Pending, Green = Accepted, Blue = Scheduled, Gray = Completed
   - Orange blocks = Buffer periods (2 hours after viewings)

3. **View Day Details**
   - Click any day on calendar
   - See hourly breakdown (8 AM - 6 PM)
   - View all appointments for that day

4. **Mark Unavailable Periods**
   - Click "Mark Unavailable" button
   - Select date, start time, end time
   - Add reason (optional): "Lunch break", "Training", etc.
   - Customers cannot book during unavailable periods

5. **Toggle Vacation Mode**
   - On dashboard, click "Vacation Mode" toggle
   - When active, you're hidden from customer agent selection
   - Turn off when returning from vacation

#### Workflow 3: Add a New Property

1. **Access Add Property**
   - From Dashboard or Properties page, click "Add Property" button

2. **Fill Property Details**
   - Title: Property name
   - Address: Full street address
   - City: Default Davao City
   - Price (₱): Listing price in Philippine Peso
   - Description: Detailed property description
   - Bedrooms, Bathrooms, Area (sqm): Numeric values

3. **Upload Images**
   - Click upload area or drag-drop image files
   - Or paste external image URLs and click "Add URL"
   - Reorder by clicking star icon on desired primary image
   - Remove unwanted images with X button

4. **Add Features (Optional)**
   - Enter comma-separated features: "Pool, Garden, Garage"

5. **Set Exclusive Flag (Optional)**
   - Check "Exclusive" box for one-customer-per-slot bookings

6. **Submit**
   - Click "Add Property"
   - Property appears immediately on /properties page
   - Auto-assigned to you as listing agent

#### Workflow 4: Edit Existing Property

1. **Access Property**
   - Navigate to property detail page
   - Or find property card on /properties page

2. **Click Edit Button**
   - Visible if you're the assigned agent or admin
   - Edit icon appears on property card or detail page

3. **Update Fields**
   - Modify any property information
   - Add/remove/reorder images
   - Update features list

4. **Save Changes**
   - Click "Save Changes"
   - Updates reflect immediately

### Admin Workflows

#### Workflow 1: Monitor System-Wide Appointments

1. **Access Admin Dashboard**
   - Login as Admin
   - Navigate to `/internal/admin/dashboard`

2. **View All Appointments**
   - See appointments across all agents
   - Filter by status, agent, property

3. **Manual Override**
   - Select appointment requiring intervention
   - Click "Reassign Agent"
   - Choose new agent
   - Add reason for override
   - Customer is notified of agent change

4. **Resolve Complaints**
   - View alerts section
   - Click on complaint/alert
   - Review details
   - Mark as "Resolved"
   - Add resolution notes

#### Workflow 2: Review Purchase Queues

1. **Access Queue Overview**
   - On admin dashboard, scroll to "Purchase Queues" section

2. **Review Property Queues**
   - See all properties with active bookings
   - Expand queue table for each property
   - View customer order by booking timestamp (first-come, first-served)

3. **Verify Fair Queue**
   - Ensure priority is based on booking time, not viewing date
   - First customer in queue has purchase rights
   - Monitor for any disputes

#### Workflow 3: Track Sold Properties

1. **Access Sold Properties**
   - Navigate to "Sold Properties" tab on admin dashboard

2. **Review Sales**
   - See all sold properties with sale prices
   - View selling agent attribution
   - Check sale dates and customer info

3. **Generate Reports (Manual)**
   - Export data to spreadsheet for analysis
   - Calculate agent commissions
   - Track monthly/quarterly sales trends

---

## ⚠️ Known Limitations

This section outlines the current limitations of the frontend-only demo.

### Data Persistence

**Limitation:** All data resets on page refresh.

**Reason:** Application uses React Context for state management without backend persistence.

**Workaround:** For persistent data, integrate with the fullstack backend repository.

**Impact:** Users must complete workflows in single session. Refreshing loses all appointments, settings changes, and added properties.

### SMS Verification

**Limitation:** Any 6-digit code verifies phone numbers.

**Reason:** No actual SMS service integration (Twilio, etc.).

**Workaround:** This is intentional for demo purposes. Production requires SMS provider API.

**Impact:** No real security validation of phone numbers.

### Multi-User Real-Time Updates

**Limitation:** Changes only visible in current browser session.

**Reason:** No WebSocket or backend synchronization.

**Workaround:** Integrate with backend and implement WebSocket broadcasting.

**Impact:** Multiple users viewing same data don't see each other's changes until refresh (which loses data).

### Image Upload

**Limitation:** Images stored as base64 in browser memory, limited by browser storage capacity.

**Reason:** No file storage backend (AWS S3, Cloudinary, etc.).

**Workaround:** Keep images < 5MB, use external URLs when possible.

**Impact:** Large images or many properties with images may cause performance issues or browser crashes.

### User Authentication

**Limitation:** No password-based authentication, only role selection.

**Reason:** Demo mode for UI/UX evaluation.

**Workaround:** Implement JWT/OAuth with backend for production.

**Impact:** No actual security - anyone can access any role.

### Email Notifications

**Limitation:** No email notifications, only in-app notifications.

**Reason:** No email service integration (SendGrid, Mailgun, etc.).

**Workaround:** Integrate email service with backend.

**Impact:** Users only see notifications while actively using the app.

### Search Functionality

**Limitation:** No keyword search, only predefined filters.

**Reason:** Search requires backend indexing (Elasticsearch or database full-text search).

**Workaround:** Use filters (status, price, bedrooms) to narrow results.

**Impact:** Cannot search by specific keywords, addresses, or features.

### Mobile Responsiveness

**Limitation:** Layout not optimized for mobile/tablet screens.

**Reason:** Designed for desktop-first demonstration.

**Workaround:** Use desktop browser or larger viewport.

**Impact:** Poor user experience on mobile devices, layout breaks or elements overlap.

### Analytics & Reporting

**Limitation:** No charts, graphs, or downloadable reports.

**Reason:** Requires backend data aggregation and reporting libraries.

**Workaround:** Manually review data on dashboards.

**Impact:** No business insights, trend analysis, or performance tracking.

---

## ❓ Frequently Asked Questions (FAQ)

### General Questions

**Q: Is this a real real estate application?**

A: This is a frontend demonstration showcasing UI/UX flows. It uses in-memory state and resets on refresh. For production use, integrate with the fullstack backend.

**Q: Can I use this for my real estate business?**

A: This is a demo/template. You would need to:
- Integrate with backend API (database, authentication)
- Add SMS provider for real phone verification
- Implement email notifications
- Add payment processing if handling transactions
- Deploy with proper security and data protection

**Q: Why does data disappear when I refresh?**

A: This is expected behavior for the frontend-only demo. Data is stored in React Context state (browser memory) and not persisted to a database.

### Customer Questions

**Q: How do I book a property viewing?**

A: 
1. Browse properties on /properties page
2. Click property to view details
3. Login as Customer if not already logged in
4. Click "Book Viewing" button
5. Select agent, date (within 7 days), and time
6. Confirm booking

**Q: What does priority position mean?**

A: If multiple customers are interested in a property, priority determines purchase rights. First customer to book gets first priority (position #1), regardless of viewing date/time.

**Q: Can I change my agent after booking?**

A: Yes, from your dashboard you can request a different agent. If your current agent rejects your booking, the system auto-assigns a new available agent for your approval.

**Q: What is SMS verification?**

A: In demo mode, enter any 6-digit code to verify. In production, you'd receive a real SMS code. Verification is required for messaging with agents.

**Q: Can I cancel my appointment?**

A: Yes, open the appointment from your dashboard and click "Cancel Appointment". If you had first priority, the next customer in line is automatically promoted.

### Agent Questions

**Q: How do I add a new property listing?**

A: Click "Add Property" button on your dashboard or properties page. Fill in details, upload images, and submit. Property appears immediately on the site.

**Q: What is vacation mode?**

A: Toggle this on your dashboard to temporarily make yourself unavailable for new bookings. You won't appear in customer agent selection. Turn off when you return.

**Q: What happens when I mark an appointment as "Sold"?**

A: 
- Property status changes to "sold"
- Property removed from customer browsing
- All other pending viewings for that property are cancelled
- Your sales count increases
- Property moves to your "Sold Properties" tab

**Q: What is the buffer period?**

A: After completing a viewing, you're automatically unavailable for 2 hours (configurable). This rest period prevents double-booking and allows time for travel/paperwork.

**Q: Can I accept multiple appointments at the same time?**

A: No, the system prevents double-booking. You can only have one appointment per time slot across all properties to ensure you can attend each viewing.

### Admin Questions

**Q: How do I add new agents or customers?**

A: Currently, user management is not implemented in the UI. This would require backend integration and an admin user CRUD interface. Users are defined in `src/data/mockData.ts`.

**Q: Can I approve properties before they go live?**

A: Currently, agents can add properties that immediately go live. A property approval workflow is a suggested future enhancement.

**Q: How do I generate sales reports?**

A: Reporting is not yet implemented. You can manually review the "Sold Properties" section on the admin dashboard and export data to spreadsheet for analysis.

**Q: What is manual override?**

A: Admins can reassign agents to customer appointments. This is useful when an agent becomes unavailable or a customer has a complaint. Always add a reason for audit purposes.

### Technical Questions

**Q: What technology stack is used?**

A: React 19 + TypeScript + Vite + Tailwind CSS + React Router DOM. See the Dependencies section in README for full list.

**Q: How do I deploy this?**

A: 
```bash
npm run build
# Deploy dist/ folder to:
# - Netlify/Vercel (automatic)
# - GitHub Pages
# - AWS S3 + CloudFront
# - Any static web host
```

**Q: Can I customize the booking window (7 days)?**

A: Yes, edit the `BOOKING_WINDOW_DAYS` constant in `src/context/AppContext.tsx`. Change the value from 7 to your desired number of days.

**Q: How do I change the agent buffer period (2 hours)?**

A: Edit the `AGENT_BUFFER_HOURS` constant in `src/context/AppContext.tsx`. Change from 2 to your desired number of hours.

**Q: Where is the fullstack backend?**

A: Reference the `hanszelmur/real-estate-fullstack` repository for backend integration with database, authentication, and real API endpoints.

**Q: Can I add more roles (e.g., property owner, investor)?**

A: Yes, but requires code changes:
1. Add role to User type in `src/types/index.ts`
2. Create role-specific pages in `src/pages/`
3. Add routes in `src/App.tsx`
4. Update login page with new role option
5. Add role-specific permissions throughout app

---

## 📸 Screenshot Reference Guide

Screenshots in the README demonstrate the following views:

### Customer Screenshots

1. **Home Page** - Public landing page with featured properties, company info, and CTA buttons
2. **Login Page** - Demo role selection (Customer, Agent, Admin) with security notice
3. **Customer Dashboard** - Appointment tabs (All, Accepted, Pending, Rejected), priority status, notifications
4. **Properties Listing** - Grid view with filters (status, price, bedrooms), showing all properties
5. **Property Detail Page** - Image gallery with navigation, features list, booking button, property specs
6. **Customer Settings** - Profile information, SMS verification status (currently using GitHub-hosted images from README)

### Agent Screenshots

7. **Agent Dashboard** - Appointment management, vacation mode toggle, metrics, rating display, sold properties tab
8. **Agent Calendar** - Full month view with day detail panel, color-coded appointments, buffer periods
9. **Add Property Modal** - Form with all property fields, image uploader component (currently using GitHub-hosted images from README)

### Admin Screenshots

10. **Admin Dashboard** - System-wide appointment view, sold properties section, purchase queues, manual override options (currently using GitHub-hosted images from README)

> **Note:** Screenshots are embedded in README.md using GitHub-hosted URLs from previous commits. These images demonstrate the actual UI and data states. To update screenshots, capture new images of the running application and update the image URLs in README.md.
