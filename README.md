# TES Properties - Real Estate Frontend

> ## ⚠️ MANDATORY README UPDATE POLICY
> 
> **After every UI, feature, or logic update, always update this README with the latest screenshots or images reflecting all current views, flows, and states. Outdated images must be removed or replaced. Annotate each screenshot clearly with its context (dashboard, calendar, booking, settings, etc). Any code contributor or AI must treat this as mandatory for every PR or merge.**

---

A comprehensive real estate frontend application for TES Properties, based in Davao City, Philippines. This application showcases property listings, booking flows, and role-based dashboards for customers, agents, and administrators.

## 🎯 Latest System Enhancement Release

This release includes major enhancements to booking, property, and purchase flows:

- ✅ **Seconds-Precision Booking Records** - All bookings are recorded with millisecond timestamps for precise contention detection
- ✅ **High Demand Slot Warnings** - UI highlights popular time slots with visual indicators (🔥 High demand) and animated badges
- ✅ **Immediate Booking Status Feedback** - Customers instantly see confirmed/queued status after booking attempts
- ✅ **Enhanced Queue Promotion** - After cancellation, next customer in queue is instantly promoted with clear notification (🎉)
- ✅ **Real-Time Booking Status Display** - Customer dashboard shows all statuses (confirmed, queued, promoted, canceled) with visual distinction
- ✅ **Recently Promoted Highlighting** - Promoted customers see a special banner on their appointment
- ✅ **Agent Rating Duplicate Prevention** - Rate only once per completed appointment, enforced client-side and in business logic
- ✅ **Start-Time-Only Booking** - Customers select only a start time (no fixed end times). Agent controls when viewing ends.
- ✅ **Agent Unavailability Management** - Agents can mark any period as unavailable (e.g., lunch break, personal events) via calendar
- ✅ **Exclusive Property Viewings with Waitlist** - Properties can be set as exclusive (one customer per slot). If taken, customers join a visible waitlist with queue position display (e.g., "You are #2 in line")
- ✅ **Group Viewing Support** - Non-exclusive properties allow multiple customers to book the same time slot
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
| **Add Properties** | **Add new property listings via Add Property modal** |
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
| **Add Properties** | **Add new property listings via Add Property modal** |
| View All Appointments | See all appointments across all agents |
| View All Purchase Queues | See priority queues for all properties |
| View Sold Properties | See all sold properties with sale prices |
| Manual Override | Reassign agents to appointments with reason |
| Resolve Alerts | Handle complaints, timeouts, and system alerts |
| Agent Status View | See all agents' availability and verification status |

---

## 🏠 Add Property Feature

Agents and admins can add new property listings directly from the frontend UI. This feature is accessible from:

1. **Agent Dashboard** - "Add Property" button in the header
2. **Admin Dashboard** - "Add Property" button in the header
3. **Properties Page** - "Add Property" button visible when logged in as agent/admin

### Add Property Form Fields

| Field | Required | Description |
|-------|----------|-------------|
| Property Title | ✅ | Name/title of the property listing |
| Address | ✅ | Street address of the property |
| City | ✅ | City name (defaults to Davao City) |
| Price (₱) | ✅ | Listing price in Philippine Peso |
| Description | ✅ | Property description and details |
| Bedrooms | ✅ | Number of bedrooms (integer) |
| Bathrooms | ✅ | Number of bathrooms (integer) |
| Area (sqm) | ✅ | Property area in square meters |
| Image URL | ✅ | URL to property image (Unsplash, Imgur, etc.) |
| Features | ❌ | Comma-separated list of features (Pool, Garden, etc.) |
| Exclusive | ❌ | Checkbox to mark as exclusive listing |

### How to Add a Property

1. Log in as an **Agent** or **Admin**
2. Navigate to the **Properties** page, **Agent Dashboard**, or **Admin Dashboard**
3. Click the **"Add Property"** button
4. Fill in all required fields in the form modal
5. Optionally add features (comma-separated) and mark as exclusive
6. Click **"Add Property"** to submit
7. The new property appears immediately on the /properties page

### Access Control

- **Customers**: Cannot see or access the Add Property feature
- **Agents**: Can add properties (assigned to them automatically)
- **Admins**: Can add properties

### Technical Notes

- Properties are added via `addProperty()` function in `AppContext.tsx`
- New properties get a UUID generated by the `uuid` library
- Properties default to `status: 'available'`
- Agent-added properties are automatically assigned to that agent via `assignedAgentId`

---

## ⭐ Agent Ratings Feature

Customers can rate agents after completing a property viewing. This helps other customers make informed decisions and motivates agents to provide excellent service.

### How Agent Ratings Work

1. **After Viewing Completion**: When an agent marks a viewing as 'done' or 'completed', the customer sees a rating prompt
2. **Rating Modal**: Customer can rate 1-5 stars with optional feedback text
3. **Rating Display**: Ratings and reviews are displayed on:
   - Agent Dashboard ("My Rating" section with latest reviews)
   - Property Detail Page (Listing Agent section with reviews)
4. **One Rating Per Appointment**: Customers can only rate once per completed viewing

### Rating Flow
```
1. Agent marks viewing as DONE or COMPLETED
2. Customer opens completed appointment in dashboard
3. "Rate Your Experience" section appears with "Rate Agent" button
4. Customer clicks to open AgentRatingModal
5. Customer selects 1-5 stars and optionally adds feedback
6. Rating submitted → Agent's average rating updated
7. Rating appears in agent's "Latest Reviews" section
```

### Agent Rating Display Locations

| Location | What's Shown |
|----------|--------------|
| Agent Dashboard | Rating (4.8★), Latest Reviews list |
| Property Detail Page | Listing Agent profile with rating and recent reviews |
| Customer Appointment Modal | Rating prompt for completed appointments |

### Technical Implementation

- Ratings are stored in `Agent.latestRatings` array (keeps last 10 ratings)
- Agent's `rating` field is the calculated average of all ratings
- `addAgentRating()` function in AppContext handles rating submission
- `hasRated` field on Appointment tracks if customer already rated

---

## ✏️ Property Edit UI Feature

Agents and admins can edit existing property listings from within the UI. This allows for easy updates to property details without needing backend access.

### How Property Edit Works

1. **Edit Button**: Visible on PropertyCard and PropertyDetailPage for authorized users
2. **Pre-filled Form**: Edit modal opens with all current property data
3. **Save Changes**: Updates are saved and instantly reflected in the UI
4. **Access Control**: Only the assigned agent or admin can edit

### Who Can Edit Properties

| User Role | Can Edit |
|-----------|----------|
| Customer | ❌ No |
| Agent (not assigned) | ❌ No |
| Agent (assigned to property) | ✅ Yes |
| Admin | ✅ Yes (all properties) |

### Edit Property Form Fields

| Field | Description |
|-------|-------------|
| Property Title | Name/title of the listing |
| Address | Street address |
| City | City name |
| Price (₱) | Listing price |
| Description | Property details |
| Bedrooms | Number of bedrooms |
| Bathrooms | Number of bathrooms |
| Area (sqm) | Property size |
| Image URL | Property image URL |
| Features | Comma-separated feature list |
| Exclusive | Checkbox for exclusive listing flag |

### Technical Implementation

- Edit button appears on PropertyCard via `canEdit` check
- `EditPropertyModal` component handles form with validation
- `updateProperty()` function in AppContext saves changes
- Changes are immediately reflected across all views

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

### Booking Flow (Start-Time-Only Selection)
```
1. Customer selects property → Chooses agent (or auto-assign) → Selects START TIME only (no end time)
2. For exclusive properties: If slot is taken, customer is added to waitlist with queue position
3. For non-exclusive properties: Multiple customers can book same start time (group viewing)
4. Booking submitted as PENDING (or QUEUED for waitlisted) → Agent notified
5. Agent ACCEPTS or REJECTS → Customer notified
6. If rejected: System auto-assigns new available agent → Customer approves or selects different
7. Agent conducts viewing → Agent controls when viewing ends → Marks as DONE (available) or SOLD (purchased)

NOTE: End times are NOT selected by customers. The agent determines when the viewing ends.
```

### Exclusive Property & Waitlist Logic
```
EXCLUSIVE PROPERTY RULES:
1. Properties can be marked as "exclusive" (isExclusive = true)
2. For exclusive properties, only ONE customer can hold a confirmed booking per start time
3. If another customer tries to book an already-taken exclusive slot:
   a. They are added to a visible waitlist (status = 'queued')
   b. Their queue position is displayed (e.g., "You are #2 in line")
   c. They receive notification of their waitlist position
4. When the confirmed customer cancels:
   a. Next in queue is automatically promoted
   b. Promoted customer is notified

NON-EXCLUSIVE (GROUP VIEWING) RULES:
1. Multiple customers can book the same time slot
2. Group size indicator shown (e.g., "Group (3)")
3. All bookings are confirmed independently
```

### Seconds-Precision Booking & Contention Detection
```
SECONDS-PRECISION BOOKING RULES:
1. All booking attempts record millisecond-precision timestamps (bookingAttemptTimestamp)
2. System detects high-demand slots by checking recent booking activity (last 30 seconds)
3. UI displays high-demand indicators:
   a. 🔥 High demand badge on time slots
   b. Animated pulse indicator on contested slots
   c. Warning message before confirmation

HIGH-DEMAND DETECTION ALGORITHM:
FUNCTION checkSecondsAvailability(agentId, date, startTime):
    recentWindowMs = 30 * 1000  // 30 seconds
    now = Date.now()
    
    existingAtTime = appointments.filter(
        agentId == agentId AND date == date AND startTime == startTime
        AND status NOT IN ['cancelled', 'rejected', 'done', 'sold', 'completed']
    )
    
    recentAttempts = existingAtTime.filter(
        (now - createdAt) < recentWindowMs
    )
    
    contention = recentAttempts.length > 0
    waitlistSize = existingAtTime.length
    available = existingAtTime.length == 0
    
    RETURN { available, contention, waitlistSize }

BOOKING ATTEMPT TRACKING:
- bookingAttemptTimestamp: ISO timestamp of exact moment booking was attempted
- wasHighDemandSlot: boolean flag if slot had contention at booking time
- Used for analytics and customer transparency
```

### Queue Promotion with Instant Notification
```
QUEUE PROMOTION FLOW:
1. Customer in position #1 cancels their booking
2. System immediately identifies next customer in queue (by booking timestamp)
3. Promoted customer's appointment is updated:
   a. status: 'queued' → 'pending'
   b. hasViewingRights: false → true
   c. queuePosition: 2 → 1
   d. promotedAt: current timestamp
   e. promotedFromPosition: previous queue position
4. Clear notification sent to promoted customer:
   - Type: 'queue_promoted'
   - Title: "🎉 You've Been Promoted!"
   - Message includes previous position and new confirmed status
5. Customer dashboard shows "Recently Promoted" banner on appointment
6. Other queued customers have their positions updated automatically

PROMOTION NOTIFICATION EXAMPLES:
- "Great news! You are now confirmed for the 10:00 AM slot at Modern Villa. 
   The customer ahead of you cancelled. Your booking is pending agent confirmation."
- Previous position tracking ensures clear messaging (e.g., "Promoted from #3")
```

### Real-Time Booking Status Display
```
CUSTOMER DASHBOARD STATUS COLORS:
- 'pending': Yellow - Awaiting agent confirmation
- 'accepted': Green - Confirmed by agent
- 'queued': Amber - In waitlist for exclusive slot
- 'rejected': Red - Declined by agent
- 'cancelled': Gray - Cancelled by customer

VISUAL INDICATORS:
- Recently promoted appointments have green border + ring effect
- "🎉 Recently Promoted from #X" banner at top of appointment card
- Queue position shown in status badge: "Queued (#2)"
- High-demand warning on time selection: "🔥 High demand"

STATUS LABELS:
- 'pending': "Awaiting Confirmation"
- 'accepted': "Confirmed"
- 'queued': "Queued (#N)" (with queue position)
- 'rejected': "Declined"
- 'cancelled': "Cancelled"
```

### Agent Unavailability Management
```
UNAVAILABLE PERIOD RULES:
1. Agents can mark any time period as unavailable via calendar
2. Unavailable periods have: date, startTime, endTime, optional reason
3. Examples: "Lunch break", "Personal event", "Training"
4. Unavailable periods are excluded from customer booking selector
5. Multiple unavailable periods can overlap

FUNCTION isStartTimeAvailable(agentId, date, startTime):
    // Check unavailable periods
    FOR EACH period IN agent.unavailablePeriods:
        IF period.date == date AND startTime >= period.startTime AND startTime < period.endTime:
            RETURN false
    
    // Check existing bookings and vacation status
    ... existing availability checks ...
```

### Agent Rating Duplicate Prevention
```
RATING RULES:
1. Customers can rate agents ONLY for completed appointments (status: 'done' or 'completed')
2. Each appointment can be rated ONLY ONCE
3. Duplicate prevention is enforced in multiple ways:
   a. appointment.hasRated: boolean flag set to true after rating
   b. appointment.ratingId: stores ID of rating for reference
   c. UI hides rating option if hasRated is true

RATING FLOW:
1. Agent marks appointment as DONE or COMPLETED
2. Customer views completed appointment in dashboard
3. IF NOT appointment.hasRated:
   a. "Rate Your Experience" section appears
   b. Customer clicks "Rate Agent"
   c. Rating modal opens (1-5 stars + optional feedback)
   d. Customer submits rating
   e. appointment.hasRated = true
   f. appointment.ratingId = new rating ID
   g. Agent's rating average is recalculated
4. IF appointment.hasRated:
   a. "Thank you for rating!" message shown
   b. No rating option available

DUPLICATE PREVENTION CHECK:
FUNCTION hasCustomerRatedAppointment(appointmentId, customerId):
    appointment = getAppointment(appointmentId)
    IF NOT appointment THEN RETURN false
    IF appointment.hasRated THEN RETURN true
    IF appointment.ratingId THEN RETURN true
    RETURN false
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

### Agent Ratings & Property Edit UI Release (Current)
- ✅ **Agent Ratings System** - Customers can rate agents (1-5 stars) after completing a viewing
- ✅ **Rating Modal** - Beautiful star rating modal with optional feedback text
- ✅ **Agent Reviews Display** - Agent profile section shows rating and latest reviews on dashboard and property pages
- ✅ **Property Edit UI** - Agents and admins can edit existing property listings
- ✅ **Edit Property Modal** - Pre-filled form modal for editing property details
- ✅ **Edit Button on Property Cards** - Visible to property owner agent and admins
- ✅ **Edit Button on Property Detail Page** - Quick edit access from property view
- ✅ **Rating Tracking** - Appointments track whether customer has rated to prevent duplicate ratings

### Add Property Feature Release
- ✅ **Add Property Modal** - Agents and admins can now add new property listings via a form modal
- ✅ **Add Property Button on Agent Dashboard** - Quick access to add properties from the agent dashboard header
- ✅ **Add Property Button on Admin Dashboard** - Admins can add properties from their dashboard
- ✅ **Add Property Button on Properties Page** - Visible for agents/admins when logged in
- ✅ **Form Validation** - Complete validation for all required fields (title, address, price, description, bedrooms, bathrooms, area, image URL)
- ✅ **Exclusive Listing Flag** - Optional checkbox to mark properties as exclusive
- ✅ **Features Input** - Comma-separated feature list support
- ✅ **Instant Property Display** - New properties appear immediately on the /properties page after submission
- ✅ **Role-Based Access Control** - Only agents and admins can see and use the Add Property feature

### Production-Ready Release
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
5. ~~**Agent Ratings**: Allow customers to rate agents after viewings~~ ✅ **COMPLETED** - Agent rating system with 1-5 stars and reviews
6. **Email Notifications**: Add email alongside in-app notifications
7. ~~**Property Add/Edit UI**: Full property management interface for agents and admins~~ ✅ **COMPLETED** - Add and Edit Property features implemented
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
