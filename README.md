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

### Booking Flow
```
1. Customer selects property → Chooses agent (or auto-assign) → Selects time slot (within 7 days)
2. Booking submitted as PENDING → Agent notified
3. Agent ACCEPTS or REJECTS → Customer notified
4. If rejected: System auto-assigns new available agent → Customer approves or selects different
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
    
    // Check 2-hour buffer after completed appointments
    completedAppts = getCompletedAppointments(agentId, date)
    FOR EACH completed IN completedAppts:
        bufferEnd = completed.endTime + 2 hours
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

1. **7-Day Booking Window**: NEVER allow bookings beyond 7 days from today
2. **Double-booking Prevention**: NEVER allow two appointments with same agent at overlapping times (global across all properties)
3. **Buffer Period**: Agent unavailable for 2 hours after completing a viewing
4. **Purchase Priority**: Priority is ALWAYS by earliest booking timestamp, NOT viewing date
5. **Priority Promotion**: When first-in-line cancels, ALWAYS promote next customer
6. **SMS Verification**: BOTH parties must be verified for messaging to work
7. **Priority Display**: Show priority position to ALL customers, not just first
8. **Blacklist Respect**: NEVER assign blacklisted agents to a customer
9. **Property Assignment**: Only assigned agent or admin can edit a property

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
// In AgentCalendar.tsx - getBufferSlotsForDate()
// Change the '2' to desired hours
for (let i = 0; i < 2; i++) {  // ← Modify this value
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

### Latest Release - Appointment & Transaction Enhancements
- ✅ **7-Day Rolling Booking Window** - Strict limit on property viewing and booking
- ✅ **Purchase Priority Queue System** - Fair first-come, first-served by booking timestamp
- ✅ **Cancel Appointment Feature** - Customer-initiated cancellation with confirmation
- ✅ **Priority Promotion Logic** - Automatic promotion when first-in-line cancels
- ✅ **Priority Status Display** - Professional queue position for customers and agents
- ✅ **Agent Queue Tables** - Expandable property queues showing booking order
- ✅ **Sold Properties Section** - Visible to agents and admins with sale price reference
- ✅ **Admin Purchase Queues** - Overview of all property purchase queues
- ✅ **Enhanced Notifications** - New types for cancellation and priority promotion

### Previous Release
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
