// User roles
export type UserRole = 'customer' | 'agent' | 'admin';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  smsVerified?: boolean; // SMS verification status for messaging
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
  imageUrl: string;
  status: 'available' | 'pending' | 'sold';
  features: string[];
  // Race logic: first customer to complete viewing has purchase rights
  firstViewerCustomerId?: string;
  firstViewerTimestamp?: string;
}

// Agent interface (extends User with agent-specific fields)
export interface Agent extends User {
  role: 'agent';
  rating: number;
  salesCount: number;
  soldProperties: string[]; // property IDs
  isOnVacation: boolean;
  availability: AgentAvailability[];
  latestRatings: AgentRating[];
  smsVerified?: boolean; // SMS verification status for messaging
}

// Agent availability slot
export interface AgentAvailability {
  id: string;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isBooked: boolean;
  bookingId?: string;
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
  endTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'cancelled';
  // Race logic fields
  hasViewingRights: boolean;
  hasPurchaseRights: boolean;
  purchaseDeclined?: boolean;
  createdAt: string;
  // New fields for enhanced features
  notes?: string; // Appointment notes
  customerName?: string; // Cached customer name for display
  customerEmail?: string; // Cached customer email
  customerPhone?: string; // Cached customer phone
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
  type: 'booking_new' | 'booking_change' | 'booking_cancel' | 'agent_change' | 'purchase_rights' | 'viewing_only' | 'complaint' | 'timeout' | 'override' | 'booking_accepted' | 'booking_rejected' | 'booking_pending';
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
