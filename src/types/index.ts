// User roles
export type UserRole = 'customer' | 'agent' | 'admin';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  profilePicUrl?: string; // Profile picture URL
  smsVerified?: boolean; // SMS verification status for messaging
  // Customer-specific: blacklisted agent IDs (agents they don't want assigned)
  blacklistedAgentIds?: string[];
}

// Property interface
export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  imageUrl: string; // Primary/legacy image URL
  imageUrls?: string[]; // Array of image URLs for gallery (runtime-uploaded or external URLs)
  status: 'available' | 'pending' | 'sold' | 'rented';
  features: string[];
  // Race logic: first customer to complete viewing has purchase rights
  firstViewerCustomerId?: string;
  firstViewerTimestamp?: string;
  // Sold/Rented property tracking
  salePrice?: number; // Final sale price (for reference only)
  soldDate?: string; // ISO date when property was sold/rented
  soldBy?: string; // User ID of agent who sold/rented the property
  soldByAgentId?: string; // Legacy - Agent who sold the property (use soldBy instead)
  // Archive functionality
  isArchived?: boolean; // Whether property is archived
  // Listing type to determine sold vs rented
  listingType?: 'sale' | 'rent'; // Type of listing
  // Agent assignment for property management
  assignedAgentId?: string; // Primary agent assigned to this property
  // Exclusive viewing mode - only one customer per start time when enabled
  isExclusive?: boolean;
}

// Agent interface (extends User with agent-specific fields)
export interface Agent extends User {
  role: 'agent';
  rating: number;
  salesCount: number;
  soldProperties: string[]; // property IDs
  isOnVacation: boolean;
  availability: AgentAvailability[];
  unavailablePeriods?: AgentUnavailablePeriod[]; // Custom blocked periods (lunch, personal events, etc.)
  latestRatings: AgentRating[];
  profilePicUrl?: string; // Profile picture URL
  smsVerified?: boolean; // SMS verification status for messaging
}

// Agent availability slot
export interface AgentAvailability {
  id: string;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime?: string; // HH:mm format - optional (start-time-only selection)
  isBooked: boolean;
  bookingId?: string;
}

// Agent unavailable period (blocked time, e.g., lunch, personal events)
export interface AgentUnavailablePeriod {
  id: string;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  reason?: string; // e.g., "Lunch break", "Personal event"
}

// Agent rating
export interface AgentRating {
  id: string;
  customerId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

// Appointment/Booking interface
export interface Appointment {
  id: string;
  propertyId: string;
  customerId: string;
  agentId: string;
  date: string;
  startTime: string;
  endTime?: string; // Optional - agent controls when viewing ends
  /**
   * Appointment status flow:
   * - 'pending': Initial state after customer booking - awaiting agent confirmation
   * - 'pending_approval': Agent was auto-assigned after rejection - awaiting customer approval
   * - 'accepted': Agent has confirmed the appointment
   * - 'rejected': Agent has declined the appointment
   * - 'scheduled': Appointment is confirmed and scheduled (legacy/alternative to accepted)
   * - 'completed': Appointment has been completed (legacy - use 'done' for new flow)
   * - 'done': Agent marked viewing as finished, property still available
   * - 'sold': Agent marked property as sold during/after viewing
   * - 'cancelled': Appointment was cancelled by customer or admin
   * - 'queued': Customer is waitlisted for an exclusive slot
   */
  status: 'pending' | 'pending_approval' | 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'cancelled' | 'done' | 'sold' | 'queued';
  // Race logic fields
  hasViewingRights: boolean;
  hasPurchaseRights: boolean;
  purchaseDeclined?: boolean;
  createdAt: string; // ISO timestamp with seconds precision for booking contention detection
  // New fields for enhanced features
  notes?: string; // Appointment notes
  customerName?: string; // Cached customer name for display
  customerEmail?: string; // Cached customer email
  customerPhone?: string; // Cached customer phone
  // Agent reassignment tracking
  previousAgentId?: string; // Previous agent before rejection/reassignment
  rejectionReason?: string; // Reason for rejection
  // Waitlist/queue position for exclusive properties
  queuePosition?: number; // Position in waitlist (1 = confirmed, 2+ = queued)
  // Rating tracking
  hasRated?: boolean; // Whether the customer has rated this appointment
  // Rating duplicate prevention - appointment ID to ensure one rating per appointment
  ratingId?: string; // ID of the rating submitted for this appointment (prevents duplicates)
  // Contention tracking with millisecond precision
  bookingAttemptTimestamp?: string; // ISO timestamp with millisecond precision when booking was attempted
  wasHighDemandSlot?: boolean; // Whether this slot had contention at booking time
  promotedAt?: string; // ISO timestamp when customer was promoted from queue (for clear notifications)
  promotedFromPosition?: number; // Previous queue position before promotion
}

// Message for appointment-specific messaging
export interface AppointmentMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  type: 'booking_new' | 'booking_change' | 'booking_cancel' | 'agent_change' | 'purchase_rights' | 'viewing_only' | 'complaint' | 'timeout' | 'override' | 'booking_accepted' | 'booking_rejected' | 'booking_pending' | 'agent_reassigned' | 'approval_required' | 'no_agents_available' | 'viewing_done' | 'property_sold' | 'property_available' | 'viewing_queued' | 'priority_promoted' | 'appointment_cancelled' | 'appointment_reminder' | 'queue_promoted' | 'slot_waitlisted' | 'high_demand_warning' | 'booking_confirmed' | 'slot_contention';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string; // appointment or property ID
}

// Admin complaint/intervention
export interface AdminAlert {
  id: string;
  type: 'complaint' | 'timeout' | 'manual_override';
  status: 'pending' | 'resolved';
  description: string;
  appointmentId?: string;
  customerId?: string;
  agentId?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

// Assignment override by admin
export interface AssignmentOverride {
  id: string;
  appointmentId: string;
  previousAgentId: string;
  newAgentId: string;
  reason: string;
  createdAt: string;
  createdBy: string;
}
