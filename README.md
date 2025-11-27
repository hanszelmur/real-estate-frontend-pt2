# TES Properties - Real Estate Frontend

A comprehensive real estate frontend application for TES Properties, based in Davao City, Philippines. This demo application showcases property listings, booking flows, and role-based dashboards for customers, agents, and administrators.

## Demo/Test Release Features

This release includes a complete customer dashboard overhaul with the following features:

### Customer Dashboard Enhancements
- **Status Tabs**: Filter appointments by Accepted, Pending, Rejected with notification counts for each status
- **Clickable Appointments**: All appointments open a detailed modal view showing:
  - Property information (title, address, details)
  - Agent information with rating and sales count
  - Current status and booking time
  - Per-appointment messaging (when SMS verified)
  - Action buttons based on status

### Agent Rejection Auto-Assignment
- When an agent rejects a booking, the system automatically assigns a new available agent
- Blacklisted agents are excluded from auto-assignment
- Customer must approve the new agent before status becomes "accepted"
- If customer declines, they can select from other available agents
- If no agents available, customer is prompted to rebook for a different time slot
- Clear notifications at each step of the process

### Sidebar Chat Drawer
- New chat button in header opens an overlay/side-drawer
- Lists all active appointments with property info
- Per-appointment messaging in a web-app style interface
- Clean, responsive design that works on all devices
- Closable overlay with smooth transitions

### Demo Mode
- Appointments are seeded with diverse statuses (accepted, pending, pending_approval, rejected)
- No new booking creation flow (demo-only)
- Property browsing remains active

## Features

### Public Pages
- **Home Page**: Company information, featured properties, and contact details for Davao, Philippines
- **About Page**: Company story, mission, vision, and service areas (no agent bios/profiles)
- **Properties Page**: Filterable property listings with status, price, and bedroom filters
- **Property Detail Page**: Full property information with booking functionality

### Customer Features
- Browse and filter properties
- **Status tabs dashboard** with Accepted, Pending, Rejected filters and counts
- **Clickable appointments** that open detailed modal views
- **Per-appointment chat** with assigned agents (requires SMS verification)
- **Agent rejection handling**: Auto-assignment of new agent with customer approval flow
- View appointment details including property, agent info, status, and actions
- Receive notifications about booking status, acceptance, rejection, and reassignment
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

### Agent Rejection & Auto-Assignment Flow
1. Agent rejects a booking request with optional reason
2. System automatically finds an available agent (excluding blacklisted agents)
3. **If agent found**: Appointment status becomes "pending_approval", customer notified
4. Customer can:
   - **Approve** the new agent → Status becomes "pending" (awaiting agent confirmation)
   - **Select Different** → Choose from other available agents
5. **If no agents available**: Appointment status becomes "rejected", customer prompted to rebook
6. Clear notifications at each step with rejection reasons displayed

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

### Customer Dashboard with Status Tabs
![Customer Dashboard](https://github.com/user-attachments/assets/df477f9b-f6b6-49b9-9ff0-23c9c3936a40)

### Appointment Detail Modal (Agent Approval Required)
![Appointment Detail Modal](https://github.com/user-attachments/assets/62d2d4a4-11b3-41cd-ae34-8f2a810e6a15)

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

### Agent Rejection Auto-Assignment Flow
```
Agent Rejects → System finds available agent (excluding blacklisted)
    → If found: Status = "pending_approval" → Customer approves/selects different
        → Approved: Status = "pending" → New agent accepts/rejects
    → If none available: Status = "rejected" → Customer prompted to rebook
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
