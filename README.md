# TES Properties - Real Estate Frontend

A comprehensive real estate frontend application for TES Properties, based in Davao City, Philippines. This demo application showcases property listings, booking flows, and role-based dashboards for customers, agents, and administrators.

## Features

### Public Pages
- **Home Page**: Company information, featured properties, and contact details for Davao, Philippines
- **About Page**: Company story, mission, vision, and service areas (no agent bios/profiles)
- **Properties Page**: Filterable property listings with status, price, and bedroom filters
- **Property Detail Page**: Full property information with booking functionality

### Customer Features
- Browse and filter properties
- Book property viewings with agent selection (choose or auto-assign)
- View appointment details in personal dashboard
- Change assigned agent at any time (per appointment only)
- Receive notifications about booking status, acceptance, rejection, and race condition alerts
- SMS verification for enabling messaging with agents

### Agent Dashboard
- **Enhanced slot-based interactive calendar** with larger touch targets for easy availability management
- **Appointment detail modal** showing full customer info, property details, booking time, and status
- Accept/reject booking requests with instant customer notifications
- **In-app messaging** with customers (requires both parties to be SMS verified)
- Appointment notes for tracking customer preferences
- Notifications panel for new bookings and changes
- Metrics: property sales count and property names
- Latest ratings panel
- Vacation toggle (hides agent from customer choices)
- **Strict double-booking prevention** - no overlapping appointments allowed

### Admin Dashboard
- **Separate undiscoverable path** (`/internal/admin/dashboard`) - not linked in public navigation
- Appointment detail modal with full customer/property/agent info
- Manual agent-property assignment with **slot availability check** - only shows agents free for selected time
- Assignment override with double-booking prevention
- Alert panel for timeouts, complaints, and manual interventions
- Agent status overview with SMS verification status
- Resolution tracking
- Global appointment filter by status

## Business Logic

### Booking Flow
1. Customer selects a property
2. Customer chooses an agent OR lets system auto-assign (from agents with available slots)
3. Customer selects available time slot from agent's calendar
4. **Booking is submitted as pending** - agent receives notification
5. **Agent can accept or reject** the booking request
6. Customer is notified instantly of acceptance or rejection
7. Customer can change agent as many times as desired from dashboard
8. Agent assignment is per-appointment only (does not persist beyond single appointments)

### Double-Booking Prevention
- **Strict enforcement across all flows**: No agent can be assigned to two overlapping appointments
- Checked during customer booking, agent assignment override, and admin override
- Time slot availability is instantly reflected when agents toggle availability
- Error shown if attempting to assign an agent with a conflicting appointment

### SMS Verification & Messaging
- **Required for both customer and agent** to enable in-app chat
- Messaging is **appointment-specific** - each conversation is tied to a specific booking
- Agent can only see customer contact info (email/phone) when:
  - Both parties are SMS verified
  - Appointment is accepted
- Messaging panel available in appointment detail modal

### Race Logic (Competing Property Interests)
- If two customers book the same property (same or different time):
  - Both customers can view the property
  - Only the FIRST customer to complete viewing has purchase rights
  - Second customer is notified they can view but cannot purchase unless the first declines
  - Property status changes to "pending" when first viewer books

### Agent Availability
- Agents manage their own calendar with interactive slot toggles
- No double-booking possible (slots become unavailable when booked)
- Vacation mode hides agent from customer selection
- Agents receive notifications for all booking changes

### Security (Role-Gated Access)
- **Customer**: Can only access customer dashboard and public pages
- **Agent**: Can only access agent dashboard and public pages
- **Admin**: Can only access admin dashboard via undiscoverable path
- No cross-role access allowed
- Redirects to login if unauthorized

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling
- **date-fns** for date manipulation
- **uuid** for unique identifiers

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Demo Login

The application includes a demo login system with three roles:
- **Customer**: Browse properties and book viewings
- **Agent**: Manage bookings, accept/reject requests, and toggle availability
- **Admin**: Manage assignments and handle complaints (access via `/internal/admin/dashboard`)

## Project Structure

```
src/
├── components/
│   ├── booking/         # Booking modal and related components
│   ├── common/          # Reusable components (PropertyCard, AgentCard, AppointmentDetailModal, etc.)
│   └── layout/          # Header, Footer, Layout wrapper
├── context/
│   └── AppContext.tsx   # Global state management with messaging and double-booking prevention
├── data/
│   └── mockData.ts      # Demo data for properties, agents, appointments
├── pages/
│   ├── admin/           # Admin dashboard (undiscoverable path)
│   ├── agent/           # Agent dashboard with enhanced calendar
│   ├── customer/        # Customer dashboard
│   ├── HomePage.tsx
│   ├── AboutPage.tsx
│   ├── PropertiesPage.tsx
│   ├── PropertyDetailPage.tsx
│   └── LoginPage.tsx
├── types/
│   └── index.ts         # TypeScript interfaces including messaging types
└── utils/
    └── helpers.ts       # Utility functions
```

## Screenshots

### Home Page
![Home Page](https://github.com/user-attachments/assets/2ff5ed6b-15c0-44ce-b752-f40138cc15a2)

### Login Page (Role Selection)
![Login Page](https://github.com/user-attachments/assets/cfa7421c-0256-4f73-9251-9dea4d400a9b)

### Properties Page
![Properties Page](https://github.com/user-attachments/assets/99a290dd-778c-4583-bc64-ad88e36f5fa4)

### Property Detail Page
![Property Detail](https://github.com/user-attachments/assets/3d7ed6f3-205e-4a95-bbbd-fb0f624437f7)

### Booking Modal - Agent Selection
![Booking Modal](https://github.com/user-attachments/assets/eac4829a-07b6-411f-a3aa-27dd94653517)

## System Flows

### Customer Booking Flow
```
Customer → Properties → Select Property → Schedule Viewing
    → Select Agent (or Auto-assign) → Select Time Slot → Submit
    → Booking Pending → Agent Accepts/Rejects
    → Customer Notified → Dashboard → Change Agent (optional)
```

### Race Condition Flow
```
Customer A books Property X → Property becomes "pending"
    → Customer A has purchase rights
Customer B books Property X → Can view but NO purchase rights
    → Notified of viewing-only status
Customer A declines → Customer B gets purchase rights
```

### Agent Workflow
```
Agent → Dashboard → View Pending Requests → Accept/Reject
    → View Appointment Details → Message Customer (if SMS verified)
    → Manage Availability → Toggle Vacation Mode
    → View Metrics & Ratings
```

### Admin Workflow
```
Admin → /internal/admin/dashboard → View All Appointments
    → Click Appointment → View Full Details
    → Override Assignment (only free agents shown)
    → View Alerts → Resolve Complaints/Timeouts
    → Track Resolutions
```

## Contact

**TES Properties**
- Address: 123 J.P. Laurel Avenue, Bajada, Davao City, Philippines 8000
- Phone: +63 82 123 4567
- Email: info@tesproperties.ph
- Hours: Monday - Saturday: 8:00 AM - 5:00 PM

## License

This project is for demonstration purposes. All rights reserved.
