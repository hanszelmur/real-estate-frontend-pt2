# TES Properties - Real Estate Frontend

> ## ⚠️ MANDATORY README UPDATE POLICY
> 
> **After every UI, feature, or logic update, always update this README with the latest screenshots or images reflecting all current views, flows, and states. Outdated images must be removed or replaced. Annotate each screenshot clearly with its context (dashboard, calendar, booking, settings, etc). Any code contributor or AI must treat this as mandatory for every PR or merge.**

---

A comprehensive real estate frontend application for TES Properties, based in Davao City, Philippines. This application showcases property listings, booking flows, and role-based dashboards for customers, agents, and administrators.

## 🎯 Latest System Enhancement Release

This release includes major enhancements to booking, property, and purchase flows:

- ✅ **7-Day Rolling Booking Window** - Strict limit on booking to next 7 days only
- ✅ **Purchase Priority Queue** - Fair first-come, first-served purchase rights by booking timestamp
- ✅ **Cancel Appointment Feature** - Customers can cancel with confirmation, instant priority release
- ✅ **Priority Status Display** - Professional queue position display for customers and agents
- ✅ **Sold Properties Tracking** - Visible to agents and admins with sale price reference
- ✅ **Enhanced Queue Tables** - Agent dashboard shows booking queue by property
- ✅ **Global Agent Scheduling** - Double-booking prevention and buffer enforcement across all properties

---

## 📸 Screenshots & UI States

All screenshots are current as of the latest release. Each image is annotated with its context.

### Home Page
*Public landing page showing featured properties, company info, and call-to-action buttons.*

![Home Page](https://github.com/user-attachments/assets/c380dc9a-80f3-418b-84e4-681bb1bb1607)

### Login Page (Role Selection)
*Demo login page allowing selection between Customer, Agent, and Admin roles. Each role has restricted access.*

![Login Page](https://github.com/user-attachments/assets/79fff809-9a9a-45c4-a155-f6e643b145f6)

### Customer Dashboard
*Customer's main dashboard showing appointment tabs (All, Accepted, Pending, Rejected), priority status badges, notifications, and quick actions.*

**Features shown:**
- Priority position badges on each appointment (e.g., "1st in line", "2nd in line")
- Status indicators for booking confirmation
- Click to view details, cancel, or chat

![Customer Dashboard](https://github.com/user-attachments/assets/fa4c3516-063a-415f-87ab-de86dc7df818)

### Customer Appointment Modal
*Appointment detail view with cancel functionality and priority status.*

**Features shown:**
- Purchase priority status display
- Cancel appointment button with confirmation
- Agent contact and messaging options
- Professional priority text (e.g., "You currently hold the first right to purchase")

### Booking Modal - 7-Day Window
*Booking flow showing 7-day rolling window restriction.*

**Features shown:**
- Notice about 7-day booking window limit
- Available time slots within window only
- Priority position preview before confirming

### Customer Settings Page
*Customer profile settings with profile information fields and phone verification status. Shows verified state with green indicator.*

![Customer Settings](https://github.com/user-attachments/assets/5d337c52-8f6d-4e79-99f7-988c334793ab)

### Agent Dashboard - Queue Table
*Agent dashboard with purchase priority queue table by property.*

**Features shown:**
- Expandable queue tables showing customer order
- Booking timestamp for each customer
- Viewing date for each appointment
- First position highlighted

### Admin Dashboard - Sold Properties
*Admin dashboard showing sold properties section and purchase queues.*

**Features shown:**
- Sold properties list with sale price
- Agent who completed sale
- Active purchase queues by property

---

## 👥 User Roles and Permissions

### Customer Role
| Permission | Description |
|------------|-------------|
| Browse Properties | View all property listings with filters |
| Book Viewings | Schedule property viewings within 7-day window |
| View Priority Status | See purchase queue position on dashboard |
| Cancel Appointments | Cancel with confirmation, releases priority position |
| Manage Appointments | View, cancel, approve/reject agent reassignments |
| Profile Settings | Update name, email, phone; verify phone via SMS |
| Messaging | Chat with agents (requires SMS verification on both sides) |

### Agent Role
| Permission | Description |
|------------|-------------|
| View Assigned Bookings | See all appointments assigned to them |
| View Purchase Queues | See priority queue for each property with bookings |
| Accept/Reject Bookings | Confirm or decline viewing requests |
| Calendar Management | View full-month calendar, day view, manage availability |
| View Sold Properties | See properties they sold with sale prices |
| Vacation Mode | Toggle availability for new bookings |
| Profile Settings | Update profile info; verify phone via SMS |
| Messaging | Chat with customers (requires SMS verification on both sides) |

### Admin Role
| Permission | Description |
|------------|-------------|
| View All Appointments | See all appointments across all agents |
| View All Purchase Queues | See priority queues for all properties |
| View Sold Properties | See all sold properties with sale prices |
| Manual Override | Reassign agents to appointments with reason |
| Resolve Alerts | Handle complaints, timeouts, and system alerts |
| Agent Status View | See all agents' availability and verification status |

---

## 🔧 Core System Rules & Logic

### Enhanced Booking & Sales Completion Flow

This system implements an enhanced booking flow with exclusive/shared property viewings, agent-controlled appointment completion, and property state transitions.

#### Appointment Status Flow

```
┌─────────────┐     Agent      ┌──────────┐
│   PENDING   │ ─── Accept ──▶ │ ACCEPTED │
└─────────────┘                └──────────┘
       │                            │
       │ Agent                      │ Agent Action
       │ Reject                     ▼
       │                    ┌───────────────┐
       ▼                    │  DONE or SOLD │
┌──────────────────┐        └───────────────┘
│ PENDING_APPROVAL │               │
│ (new agent auto- │               │
│  assigned)       │               │
└──────────────────┘               │
       │                           ▼
       │ Customer             ┌─────────┐
       │ Approve              │ Property│
       ▼                      │ State   │
┌─────────────┐               │ Change  │
│   PENDING   │               └─────────┘
└─────────────┘
```

#### Status Behavior Summary Table

| Status | Description | Property Available? | Customer Action | Agent Action |
|--------|-------------|---------------------|-----------------|--------------|
| `pending` | Awaiting agent confirmation | Pending (first viewer) | Wait | Accept/Reject |
| `pending_approval` | New agent assigned, needs customer approval | Pending | Approve agent or Select different | Wait |
| `accepted` | Viewing confirmed | Pending | Attend viewing | Mark Done/Sold |
| `done` | Viewing finished, no purchase | ✅ Available | - | - |
| `sold` | Property purchased | ❌ Sold | - | - |
| `rejected` | Agent declined | Depends | Select new agent | - |
| `cancelled` | Booking cancelled | Depends | - | - |

#### Agent Appointment Completion Actions

When an agent has an accepted appointment, they control when and how the viewing ends:

1. **Mark as Done** (`done` status):
   - Viewing finished, customer did not purchase
   - Property immediately becomes available for new bookings
   - Queued customers are notified that property is available
   - Agent's buffer period (2 hours) applies

2. **Mark as Sold** (`sold` status):
   - Property purchased by customer
   - Property status changes to `sold`
   - Property hidden from customer search/booking
   - All other pending viewings for this property are cancelled
   - Affected customers receive cancellation notification
   - Agent's sales count incremented
   - Property added to Agent's "Sold Properties" tab

#### Property Visibility Rules

| User Role | Available | Pending | Sold |
|-----------|-----------|---------|------|
| Customer/Public | ✅ Visible | ✅ Visible | ❌ Hidden |
| Agent | ✅ Visible | ✅ Visible | ✅ Visible (Sold tab) |
| Admin | ✅ Visible | ✅ Visible | ✅ Visible (Sold tab) |

#### Notification Flow for Status Changes

| Event | Recipient | Notification Type |
|-------|-----------|-------------------|
| Viewing marked done | Customer | `viewing_done` |
| Property becomes available | Queued customers | `property_available` |
| Property sold | Buyer | `property_sold` (congratulations) |
| Property sold | Other customers with pending viewings | `property_sold` (cancelled) |

### 7-Day Rolling Booking Window
```
CONSTANT BOOKING_WINDOW_DAYS = 7

FUNCTION isDateWithinBookingWindow(dateString):
    today = getCurrentDate()
    maxDate = today + BOOKING_WINDOW_DAYS
    
    RETURN date >= today AND date <= maxDate

// Enforced in BookingModal when showing available time slots
// Prevents bookings or purchase holds beyond this window
```

### Booking Flow
```
1. Customer selects property → Chooses agent (or auto-assign) → Selects time slot (within 7 days)
2. Booking submitted as PENDING → Agent notified
3. Agent ACCEPTS or REJECTS → Customer notified
4. If rejected: System auto-assigns new available agent → Customer approves or selects different
5. Agent conducts viewing → Marks as DONE (available) or SOLD (purchased)
```

### Purchase Priority Queue Logic
```
PRIORITY RULES:
1. Priority is determined by BOOKING TIMESTAMP (createdAt), NOT viewing date/time
2. First customer to book gets purchase rights (position 1)
3. Subsequent customers join the queue in booking order
4. When a customer cancels, next in queue is automatically promoted
5. Promoted customer receives notification of new priority status

// Priority text displayed:
- Position 1: "You currently hold the first right to purchase"
- Position 2: "You are second in line"
- Position 3: "You are third in line"
- Position N: "You are Nth in line"
```

### Cancel Appointment Flow
```
WHEN customer cancels appointment:
    1. Set appointment status to 'cancelled'
    2. Notify assigned agent of cancellation
    3. IF customer had purchase rights:
        a. Find next customer in queue (by booking timestamp)
        b. Grant them purchase rights
        c. Notify them of promotion
    4. IF no other customers in queue:
        a. Reset property status to 'available'
```

### Buffer/Slot/Availability Logic

```pseudocode
FUNCTION isAgentAvailable(agentId, date, startTime, endTime):
    // Check vacation status
    IF agent.isOnVacation THEN RETURN false
    
    // Check if slot exists and is not blocked
    slot = agent.availability.find(date, startTime, endTime)
    IF slot.isBooked AND NOT slot.bookingId THEN RETURN false  // Manually blocked
    
    // Check for appointment conflicts
    FOR EACH appointment IN appointments:
        IF appointment.agentId == agentId 
           AND appointment.date == date
           AND appointment.status NOT IN ['cancelled', 'rejected']
           AND timeOverlaps(startTime, endTime, appointment.startTime, appointment.endTime):
            RETURN false
    
    // Check configurable buffer after completed appointments
    // Buffer period defined by AGENT_BUFFER_HOURS constant (default: 2 hours)
    completedAppts = getCompletedAppointments(agentId, date)
    FOR EACH completed IN completedAppts:
        bufferEnd = completed.endTime + AGENT_BUFFER_HOURS
        IF startTime < bufferEnd THEN RETURN false
    
    RETURN true

FUNCTION timeOverlaps(start1, end1, start2, end2):
    RETURN start1 < end2 AND end1 > start2
```

### Agent Assignment Priority
```pseudocode
FUNCTION findAvailableAgent(customerId, date, startTime, endTime, excludeIds):
    blacklisted = customer.blacklistedAgentIds
    
    availableAgents = agents.filter(agent =>
        NOT agent.isOnVacation
        AND agent.id NOT IN blacklisted
        AND agent.id NOT IN excludeIds
        AND isAgentAvailable(agent.id, date, startTime, endTime)
    )
    
    // Return first available (could be sorted by rating/availability)
    RETURN availableAgents[0] OR null
```

### Sold Property Management
```pseudocode
FUNCTION markPropertySold(propertyId, salePrice, agentId):
    // Update property status
    property.status = 'sold'
    property.salePrice = salePrice
    property.soldDate = now()
    property.soldByAgentId = agentId
    
    // Update agent stats
    agent.salesCount += 1
    agent.soldProperties.push(propertyId)
    
    // Cancel all pending appointments for this property
    FOR EACH appointment WHERE appointment.propertyId = propertyId:
        IF appointment.status NOT IN ['completed', 'cancelled']:
            appointment.status = 'cancelled'
```

---

## ⚠️ DO NOT BREAK - Business Rules

1. **7-Day Booking Window**: NEVER allow bookings beyond 7 days from today (configurable via `BOOKING_WINDOW_DAYS`)
2. **Double-booking Prevention**: NEVER allow two appointments with same agent at overlapping times (global across all properties)
3. **Buffer Period**: Agent unavailable for configurable hours after completing a viewing (configurable via `AGENT_BUFFER_HOURS`, default: 2 hours)
4. **Race Logic**: First viewer ALWAYS gets purchase rights (by earliest booking timestamp, NOT viewing date)
5. **Priority Promotion**: When first-in-line cancels, ALWAYS promote next customer automatically
6. **Priority Display**: Show priority position to ALL customers, not just first
7. **SMS Verification**: BOTH parties must be verified for messaging to work
8. **Priority Warning**: NEVER show "another customer has priority" to the firstViewerCustomerId
9. **Blacklist Respect**: NEVER assign blacklisted agents to a customer
10. **Sold Property Visibility**: NEVER show sold properties in customer/public property listings
11. **Agent-Only Completion**: ONLY agents can mark appointments as done or sold
12. **Cascade Cancellation**: When property is marked sold, ALL other pending appointments for that property must be cancelled automatically
13. **Instant Availability**: When marked done, property MUST become immediately available for new bookings
14. **Property Assignment**: Only assigned agent or admin can edit a property
15. **Session Check**: All protected routes MUST redirect unauthenticated users to login

---

## 📊 Sample Queue Display Table

Example of the purchase priority queue shown to agents:

| # | Customer | Booked | Viewing Date |
|---|----------|--------|--------------|
| **1st** | Juan Dela Cruz | 2 hours ago | Dec 15, 2024 |
| 2 | Maria Garcia | 1 day ago | Dec 16, 2024 |
| 3 | Jose Santos | 2 days ago | Dec 14, 2024 |

*Note: Juan is first because he booked first (2 hours ago), even though Jose's viewing is earlier (Dec 14).*

---

## 🔌 How to Extend/Modify

### Modifying Booking Window
```typescript
// In src/context/AppContext.tsx
export const BOOKING_WINDOW_DAYS = 7;  // ← Modify this value
```

### Adding New Appointment Status
1. Add status to `Appointment['status']` union type in `src/types/index.ts`
2. Add color mapping in `getStatusBadgeColor()` functions
3. Update status filters in dashboard components
4. Add notification type if needed

### Adding New User Fields
1. Update `User` or `Agent` interface in `src/types/index.ts`
2. Add to mock data in `src/data/mockData.ts`
3. Update profile settings page to handle new field
4. Add context function if field needs updating

### Modifying Buffer Period
```typescript
// In src/context/AppContext.tsx
export const AGENT_BUFFER_HOURS = 2;  // ← Modify this value (hours of rest after viewing)
```

### Adding New Notification Types
1. Add type to `Notification['type']` in `src/types/index.ts`
2. Use `addNotification()` from AppContext where needed

### Adding Real SMS Verification
Replace the demo verification in settings pages:
```typescript
// Replace this demo code:
if (smsCode.length === 6) {
  updateUserSmsVerification(currentUser.id, true);
}

// With actual API call:
const response = await verifySmsCode(phone, smsCode);
if (response.success) {
  updateUserSmsVerification(currentUser.id, true);
}
```

---

## 🏗️ Project Structure

```
src/
├── components/
│   ├── booking/         # BookingModal
│   ├── common/          # Reusable components
│   └── layout/          # Header, Footer, Layout
├── context/
│   └── AppContext.tsx   # Global state (⚠️ Core business logic here)
├── data/
│   └── mockData.ts      # Demo data (properties, agents, users)
├── pages/
│   ├── admin/           # AdminDashboard
│   ├── agent/           # AgentDashboard, AgentCalendar, AgentSettings
│   ├── customer/        # CustomerDashboard, CustomerSettings
│   └── ...              # Public pages
├── types/
│   └── index.ts         # TypeScript interfaces
└── utils/
    └── helpers.ts       # Utility functions
```

---

## 🚀 Getting Started

```bash
npm install
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run linting
```

### Demo Login
- **Customer**: Browse properties and book viewings
- **Agent**: Manage bookings and availability
- **Admin**: Access via `/internal/admin/dashboard`

---

## 📅 Calendar Logic (Agent)

### Full-Month View
- Google Calendar-style monthly grid showing all days
- Each day cell shows appointment previews (up to 3) with status colors
- Click any day to switch to day view
- Navigation: Previous/Next month, Today button

### Day View
- Hourly time slots from 8 AM to 6 PM
- Shows appointments, blocked slots, and buffer periods
- Color coding: Yellow (Pending), Green (Accepted), Blue (Scheduled), Gray (Completed)
- Buffer periods shown in orange (2-hour rest after completed viewings)

### Buffer Enforcement
```
After a COMPLETED appointment ends:
  → Next 2 hours are automatically blocked
  → Buffer slots shown in orange on calendar
  → Agent cannot be booked during buffer period
```

---

## 📱 Profile Flows & Verification

### Settings Page (Customer & Agent)
1. **Profile Information**: Name, Email, Phone (editable)
2. **Phone Verification Section**:
   - Shows current verification status (green = verified, yellow = not verified)
   - Unverified users see "Send Verification Code" button
   - Demo: Any 6-digit code verifies the phone

> **Note**: This demo app uses role-based login without passwords. Password change functionality is not currently implemented. See [Planned Enhancements](#planned-enhancements) for future authentication features.

### What Blocks Users from Acting
| Blocker | Effect |
|---------|--------|
| Not logged in | Cannot book, access dashboards |
| Not SMS verified | Cannot message (both parties need verification) |
| Agent on vacation | Hidden from agent selection |
| Blacklisted agent | Never assigned to that customer |

### Phone Verification Storage
- Stored in `User.smsVerified` and `Agent.smsVerified` fields
- Updated via `updateUserSmsVerification()` or `updateAgentSmsVerification()`
- Persisted in React context state (demo only - production needs backend)

---

## 📬 Automated Messaging & Notifications

### One-Way Notifications (System → User)
All notifications are **system-generated** and one-way. Users cannot reply to notifications.

### Notification Types
| Type | Recipient | Trigger |
|------|-----------|---------|
| `booking_new` | Agent | New booking assigned |
| `booking_accepted` | Customer | Agent accepts booking |
| `booking_rejected` | Customer | Agent rejects booking |
| `agent_reassigned` | Customer | New agent auto-assigned after rejection |
| `no_agents_available` | Customer | No agents available for slot |
| `viewing_only` | Customer | Another customer has priority |
| `viewing_done` | Customer | Agent marked viewing as completed |
| `property_available` | Queued customers | Property became available after viewing |
| `property_sold` | Buyer | Congratulations on purchase |
| `property_sold` | Other customers | Pending viewing cancelled due to sale |
| `viewing_queued` | Customer | Viewing queued due to prior bookings |
| `appointment_reminder` | Agent & Customer | Upcoming appointment reminder (24 hours before) |
| `priority_promoted` | Customer | Promoted in purchase queue after cancellation |
| `appointment_cancelled` | Agent | Customer cancelled their appointment |

### Messaging (Two-Way Chat)
- **Requirements**: Both customer AND agent must be SMS verified
- **Scope**: Only available for ACCEPTED or SCHEDULED appointments
- **Location**: Chat drawer accessible from header
- **Templates**: Distinct from notifications - conversational messages only

### Centralized Notification Service
All notifications flow through `addNotification()` in AppContext:
```typescript
addNotification({
  userId: recipientId,
  type: 'notification_type',
  title: 'Title',
  message: 'Message content',
  read: false,
  relatedId: appointmentOrPropertyId,
});
```

### Appointment Reminders
The system includes built-in reminder functionality:
- **Timing**: Reminders sent 24 hours before scheduled appointments
- **Recipients**: Both agent AND customer receive reminders
- **Deduplication**: Only one reminder per appointment per day
- **Usage**: Call `sendAppointmentReminders()` from AppContext (typically in a scheduled job or on app load)

```typescript
// To send reminders (e.g., in a useEffect or scheduled task)
const { sendAppointmentReminders } = useApp();
sendAppointmentReminders();
```

---

## 🔄 Real-Time Sync Considerations

This demo application uses React Context for state management. For production deployment with real-time features:

### Current Implementation
- All state managed via `AppContext.tsx`
- Changes are immediately reflected across all components
- State is reset on page refresh (no persistence)

### Production Enhancement Recommendations
1. **WebSocket Integration**: Add Socket.io or similar for real-time updates across clients
2. **Backend API**: Replace mock data with actual REST/GraphQL API calls
3. **State Persistence**: Add localStorage/sessionStorage or integrate with a state management library
4. **Optimistic Updates**: Implement optimistic UI updates with rollback on failure
5. **Session Management**: Add token-based authentication with refresh tokens

### Session/Authentication Checks
- All protected pages check `currentUser` state before rendering
- Unauthenticated users are redirected to login page
- Role-based access control enforced at component level
- Demo mode: Role-based login without password (production needs proper auth)

---

## ⚠️ Developer & AI Warnings

### DRY Principle
- **DO NOT** duplicate business logic - all core logic lives in `AppContext.tsx`
- **DO NOT** create duplicate notification functions - use `addNotification()`
- **DO NOT** duplicate status color mappings - reference existing `getStatusBadgeColor()` functions

### Inheritance & Type Safety
- All user types extend base `User` interface
- `Agent` extends `User` with agent-specific fields
- Always use TypeScript interfaces from `src/types/index.ts`

### Mandatory README Updates
> **Every PR must include README updates if it changes:**
> - Any UI component or page
> - Any user flow or state
> - Any business logic
> - Screenshots must be current - remove/replace outdated images

---

## 📝 Changelog / What's New

### Production-Ready Release (Current)
- ✅ **Configurable Buffer Period** - Agent rest period now centrally configurable via `AGENT_BUFFER_HOURS` constant
- ✅ **Appointment Reminder System** - Automated reminders 24 hours before appointments for both agents and customers
- ✅ **Upcoming Appointments API** - New `getUpcomingAppointments()` function for retrieving upcoming appointments within configurable hours
- ✅ **Enhanced Documentation** - Complete business logic documentation with real-time sync considerations
- ✅ **Session Management Guide** - Documentation for production authentication implementation

### Previous Release - Appointment & Transaction Enhancements
- ✅ **7-Day Rolling Booking Window** - Strict limit on property viewing and booking
- ✅ **Purchase Priority Queue System** - Fair first-come, first-served by booking timestamp
- ✅ **Cancel Appointment Feature** - Customer-initiated cancellation with confirmation
- ✅ **Priority Promotion Logic** - Automatic promotion when first-in-line cancels
- ✅ **Priority Status Display** - Professional queue position for customers and agents
- ✅ **Agent Queue Tables** - Expandable property queues showing booking order
- ✅ **Sold Properties Section** - Visible to agents and admins with sale price reference
- ✅ **Admin Purchase Queues** - Overview of all property purchase queues
- ✅ **Enhanced Notifications** - New types for cancellation and priority promotion

### Enhanced Booking & Sales Update
- ✅ **Agent-controlled appointment completion**: Agents can mark viewings as 'done' or 'sold'
- ✅ **Instant property availability**: Property becomes available immediately when marked done
- ✅ **Sold property handling**: Properties marked sold are hidden from customer search
- ✅ **Sold Properties tab**: New tab in Agent and Admin dashboards showing sold properties
- ✅ **Cascade notifications**: Customers notified when property becomes available or is sold
- ✅ **New appointment statuses**: Added 'done' and 'sold' status types
- ✅ **Agent sales tracking**: Sales count and sold properties list updated on sale

### Foundational Release
- ✅ Clean handoff state - no seeded appointments
- ✅ Full-month agent calendar with day view
- ✅ Profile/Settings pages for customers and agents
- ✅ SMS verification flow (demo mode)
- ✅ Fixed priority warning logic
- ✅ Comprehensive README documentation

### Initial Release
- Initial booking flow implementation
- Race logic for property purchase rights
- Agent assignment and reassignment
- Notification system

---

## 🔮 Future Extension / Maintenance

### Planned Enhancements
1. **Real Authentication & Password Management**: Add proper login with password, password change, and password reset functionality (currently demo uses role-based login without passwords)
2. **Real SMS Integration**: Replace demo verification with actual SMS provider (Twilio, etc.)
3. **Backend API**: Connect to real backend instead of mock data
4. **Profile Pictures**: Enable URL-based profile picture uploads
5. **Agent Ratings**: Allow customers to rate agents after viewings
6. **Email Notifications**: Add email alongside in-app notifications
7. **Property Add/Edit UI**: Full property management interface for agents and admins
8. **Real-time WebSocket**: Add Socket.io for live updates across clients

### Maintenance Notes
- Mock data in `src/data/mockData.ts` - replace with API calls
- All dates use ISO format strings
- Times use HH:mm format
- Currency formatted for Philippine Peso (₱)
- Booking window constant in `src/context/AppContext.tsx`

---

## 📞 Contact

**TES Properties**
- Address: 123 J.P. Laurel Avenue, Bajada, Davao City, Philippines 8000
- Phone: +63 82 123 4567
- Email: info@tesproperties.ph

---

## License

This project is for demonstration purposes. All rights reserved.
