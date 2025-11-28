# TES Properties - Real Estate Frontend

> ## ⚠️ MANDATORY README UPDATE POLICY
> 
> **After every UI, feature, or logic update, always update this README with the latest screenshots or images reflecting all current views, flows, and states. Outdated images must be removed or replaced. Annotate each screenshot clearly with its context (dashboard, calendar, booking, settings, etc). Any code contributor or AI must treat this as mandatory for every PR or merge.**

---

A comprehensive real estate frontend application for TES Properties, based in Davao City, Philippines. This application showcases property listings, booking flows, and role-based dashboards for customers, agents, and administrators.

## 🎯 System Refinement Release

This release establishes a **clean handoff state** with extensible foundation:

- ✅ **No seeded appointments/bookings** - Clean base state for new deployments
- ✅ **Full-month Agent Calendar** - Google Calendar style with day view
- ✅ **Profile/Settings pages** - For both customers and agents with SMS verification
- ✅ **Fixed priority warning logic** - Never shown to booking owner
- ✅ **Clean dashboards** - No demo data cluttering the UI

---

## 📸 Screenshots & UI States

All screenshots are current as of the latest release. Each image is annotated with its context.

### Home Page
*Public landing page showing featured properties, company info, and call-to-action buttons.*

![Home Page](https://github.com/user-attachments/assets/c380dc9a-80f3-418b-84e4-681bb1bb1607)

### Login Page (Role Selection)
*Demo login page allowing selection between Customer, Agent, and Admin roles. Each role has restricted access.*

![Login Page](https://github.com/user-attachments/assets/79fff809-9a9a-45c4-a155-f6e643b145f6)

### Customer Dashboard (Clean State)
*Customer's main dashboard showing appointment tabs (All, Accepted, Pending, Rejected), notifications, and quick actions. Clean state with no appointments.*

![Customer Dashboard](https://github.com/user-attachments/assets/fa4c3516-063a-415f-87ab-de86dc7df818)

### Customer Settings Page
*Customer profile settings with profile information fields and phone verification status. Shows verified state with green indicator.*

![Customer Settings](https://github.com/user-attachments/assets/5d337c52-8f6d-4e79-99f7-988c334793ab)

---

## 👥 User Roles and Permissions

### Customer Role
| Permission | Description |
|------------|-------------|
| Browse Properties | View all property listings with filters |
| Book Viewings | Schedule property viewings with agents |
| Manage Appointments | View, cancel, approve/reject agent reassignments |
| Profile Settings | Update name, email, phone; verify phone via SMS |
| Messaging | Chat with agents (requires SMS verification on both sides) |

### Agent Role
| Permission | Description |
|------------|-------------|
| View Assigned Bookings | See all appointments assigned to them |
| Accept/Reject Bookings | Confirm or decline viewing requests |
| Calendar Management | View full-month calendar, day view, manage availability |
| Vacation Mode | Toggle availability for new bookings |
| Profile Settings | Update profile info; verify phone via SMS |
| Messaging | Chat with customers (requires SMS verification on both sides) |

### Admin Role
| Permission | Description |
|------------|-------------|
| View All Appointments | See all appointments across all agents |
| Manual Override | Reassign agents to appointments with reason |
| Resolve Alerts | Handle complaints, timeouts, and system alerts |
| Agent Status View | See all agents' availability and verification status |

---

## 🔧 Core System Rules & Logic

### Booking Flow
```
1. Customer selects property → Chooses agent (or auto-assign) → Selects time slot
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

### Race Logic (Competing Property Interests)
```pseudocode
ON createAppointment(propertyId, customerId):
    existingViewers = appointments.filter(propertyId, status != 'cancelled')
    
    IF existingViewers.length == 0:
        // First viewer gets purchase rights
        appointment.hasPurchaseRights = true
        property.status = 'pending'
        property.firstViewerCustomerId = customerId
    ELSE:
        // Subsequent viewers - viewing only
        appointment.hasPurchaseRights = false
        notifyCustomer("Another customer has priority purchase rights")
```

---

## ⚠️ DO NOT BREAK - Business Rules

1. **Double-booking Prevention**: NEVER allow two appointments with same agent at overlapping times
2. **Buffer Period**: Agent unavailable for 2 hours after completing a viewing
3. **Race Logic**: First viewer ALWAYS gets purchase rights
4. **SMS Verification**: BOTH parties must be verified for messaging to work
5. **Priority Warning**: NEVER show "another customer has priority" to the firstViewerCustomerId
6. **Blacklist Respect**: NEVER assign blacklisted agents to a customer

---

## 🔌 How to Extend/Modify

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

### Current Release
- ✅ Clean handoff state - no seeded appointments
- ✅ Full-month agent calendar with day view
- ✅ Profile/Settings pages for customers and agents
- ✅ SMS verification flow (demo mode)
- ✅ Fixed priority warning logic
- ✅ Comprehensive README documentation

### Previous Updates
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

### Maintenance Notes
- Mock data in `src/data/mockData.ts` - replace with API calls
- All dates use ISO format strings
- Times use HH:mm format
- Currency formatted for Philippine Peso (₱)

---

## 📞 Contact

**TES Properties**
- Address: 123 J.P. Laurel Avenue, Bajada, Davao City, Philippines 8000
- Phone: +63 82 123 4567
- Email: info@tesproperties.ph

---

## License

This project is for demonstration purposes. All rights reserved.
