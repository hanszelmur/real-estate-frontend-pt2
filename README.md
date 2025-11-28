# TES Properties - Real Estate Frontend

A comprehensive real estate frontend application for TES Properties, based in Davao City, Philippines. This application showcases property listings, booking flows, and role-based dashboards for customers, agents, and administrators.

## 🎯 System Refinement Release

This release establishes a **clean handoff state** with extensible foundation:

- ✅ **No seeded appointments/bookings** - Clean base state for new deployments
- ✅ **Full-month Agent Calendar** - Google Calendar style with day view
- ✅ **Profile/Settings pages** - For both customers and agents with SMS verification
- ✅ **Fixed priority warning logic** - Never shown to booking owner
- ✅ **Clean dashboards** - No demo data cluttering the UI

---

## 📸 Screenshots

### Home Page
![Home Page](https://github.com/user-attachments/assets/9207c685-600c-4ba0-aad7-9968f932cf94)

### Login Page (Role Selection)
![Login Page](https://github.com/user-attachments/assets/57c82a8c-2b57-4548-96ea-db7b9a9799fd)

### Customer Dashboard (Clean State)
![Customer Dashboard](https://github.com/user-attachments/assets/fe858aa8-0e9f-4cdd-8321-112e260ddbaf)

### Customer Settings Page
![Customer Settings](https://github.com/user-attachments/assets/dc07dbaf-9957-4e0c-8159-fce6596c0d5a)

### Agent Dashboard
![Agent Dashboard](https://github.com/user-attachments/assets/390c7494-760d-4eda-8a6b-a774facdd41d)

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

## 📞 Contact

**TES Properties**
- Address: 123 J.P. Laurel Avenue, Bajada, Davao City, Philippines 8000
- Phone: +63 82 123 4567
- Email: info@tesproperties.ph

---

## License

This project is for demonstration purposes. All rights reserved.
