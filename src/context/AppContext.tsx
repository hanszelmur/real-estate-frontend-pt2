import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Property, Agent, Appointment, Notification, AdminAlert, UserRole, AppointmentMessage } from '../types';
import { mockUsers, mockProperties, mockAgents, mockAppointments, mockNotifications, mockAdminAlerts } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

// Constants for booking window
export const BOOKING_WINDOW_DAYS = 7;

interface AppContextType {
  // Current user
  currentUser: User | Agent | null;
  setCurrentUser: (user: User | Agent | null) => void;
  login: (role: UserRole, userId?: string) => void;
  logout: () => void;

  // Properties
  properties: Property[];
  getProperty: (id: string) => Property | undefined;
  updatePropertyStatus: (id: string, status: Property['status'], firstViewerId?: string) => void;
  addProperty: (property: Omit<Property, 'id'>) => Property;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  markPropertySold: (id: string, salePrice: number, agentId: string) => void;
  getSoldProperties: () => Property[];

  // Agents
  agents: Agent[];
  getAgent: (id: string) => Agent | undefined;
  getAvailableAgents: () => Agent[];
  getAvailableAgentsForCustomer: (customerId: string, date: string, startTime: string, endTime?: string, excludeAgentIds?: string[]) => Agent[];
  toggleAgentVacation: (agentId: string) => void;
  updateAgentAvailability: (agentId: string, slotId: string, isBooked: boolean, bookingId?: string) => void;
  updateAgentSmsVerification: (agentId: string, verified: boolean) => void;

  // Users
  users: User[];
  getUser: (id: string) => User | undefined;
  updateUserSmsVerification: (userId: string, verified: boolean) => void;
  updateUserProfile: (userId: string, updates: Partial<Pick<User, 'name' | 'email' | 'phone' | 'profilePicUrl'>>) => void;
  updateAgentProfile: (agentId: string, updates: Partial<Pick<Agent, 'name' | 'email' | 'phone' | 'profilePicUrl'>>) => void;

  // Appointments
  appointments: Appointment[];
  getAppointmentsByUser: (userId: string, role: UserRole) => Appointment[];
  getAppointmentsByProperty: (propertyId: string) => Appointment[];
  createAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  changeAgent: (appointmentId: string, newAgentId: string) => void;
  cancelAppointment: (id: string) => void;
  acceptAppointment: (id: string) => void;
  rejectAppointment: (id: string, reason?: string) => void;
  approveNewAgent: (appointmentId: string) => void;
  selectDifferentAgent: (appointmentId: string, newAgentId: string) => void;
  hasAgentConflict: (agentId: string, date: string, startTime: string, endTime?: string, excludeAppointmentId?: string) => boolean;
  getAgentsFreeForSlot: (date: string, startTime: string, endTime?: string, excludeAppointmentId?: string) => Agent[];
  markAppointmentDone: (id: string) => void;
  markAppointmentSold: (id: string) => void;
  getAvailablePropertiesForBooking: () => Property[];
  hasPendingViewingsForProperty: (propertyId: string, excludeCustomerId?: string) => boolean;
  
  // Priority queue functions
  getPurchasePriorityQueue: (propertyId: string) => Appointment[];
  getCustomerPriorityPosition: (propertyId: string, customerId: string) => number;
  isDateWithinBookingWindow: (dateString: string) => boolean;

  // Messages
  messages: AppointmentMessage[];
  getMessagesByAppointment: (appointmentId: string) => AppointmentMessage[];
  sendMessage: (appointmentId: string, content: string) => void;
  canMessage: (appointmentId: string) => boolean;

  // Notifications
  notifications: Notification[];
  getNotificationsByUser: (userId: string) => Notification[];
  markNotificationRead: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;

  // Admin alerts
  adminAlerts: AdminAlert[];
  resolveAlert: (id: string, resolution: string, resolvedBy: string) => void;
  createOverride: (appointmentId: string, newAgentId: string, reason: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [adminAlerts, setAdminAlerts] = useState<AdminAlert[]>(mockAdminAlerts);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [messages, setMessages] = useState<AppointmentMessage[]>([]);

  // Auth functions
  const login = useCallback((role: UserRole, userId?: string) => {
    if (role === 'customer') {
      const user = userId ? mockUsers.find(u => u.id === userId) : mockUsers.find(u => u.role === 'customer');
      setCurrentUser(user || null);
    } else if (role === 'agent') {
      const agent = userId ? agents.find(a => a.id === userId) : agents[0];
      setCurrentUser(agent || null);
    } else if (role === 'admin') {
      const admin = mockUsers.find(u => u.role === 'admin');
      setCurrentUser(admin || null);
    }
  }, [agents]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // Property functions
  const getProperty = useCallback((id: string) => {
    return properties.find(p => p.id === id);
  }, [properties]);

  const updatePropertyStatus = useCallback((id: string, status: Property['status'], firstViewerId?: string) => {
    setProperties(prev => prev.map(p => 
      p.id === id 
        ? { 
            ...p, 
            status, 
            firstViewerCustomerId: firstViewerId || p.firstViewerCustomerId,
            firstViewerTimestamp: firstViewerId ? new Date().toISOString() : p.firstViewerTimestamp
          } 
        : p
    ));
  }, []);

  // Add a new property (agents and admins)
  const addProperty = useCallback((propertyData: Omit<Property, 'id'>): Property => {
    const newProperty: Property = {
      ...propertyData,
      id: uuidv4(),
    };
    setProperties(prev => [...prev, newProperty]);
    return newProperty;
  }, []);

  // Update a property (only assigned agent or admin can edit)
  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  }, []);

  // Mark a property as sold
  const markPropertySold = useCallback((id: string, salePrice: number, agentId: string) => {
    setProperties(prev => prev.map(p => 
      p.id === id 
        ? { 
            ...p, 
            status: 'sold' as const,
            salePrice,
            soldDate: new Date().toISOString(),
            soldByAgentId: agentId
          } 
        : p
    ));
    
    // Update agent's sales count
    setAgents(prev => prev.map(a => 
      a.id === agentId 
        ? { 
            ...a, 
            salesCount: a.salesCount + 1,
            soldProperties: [...a.soldProperties, id]
          } 
        : a
    ));

    // Cancel all pending appointments for this property
    setAppointments(prev => prev.map(appt => 
      appt.propertyId === id && !['completed', 'cancelled'].includes(appt.status)
        ? { ...appt, status: 'cancelled' as const }
        : appt
    ));
  }, []);

  // Get all sold properties
  const getSoldProperties = useCallback(() => {
    return properties.filter(p => p.status === 'sold');
  }, [properties]);

  // Agent functions
  const getAgent = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  const getAvailableAgents = useCallback(() => {
    return agents.filter(a => !a.isOnVacation);
  }, [agents]);

  // Get available agents for a customer, excluding blacklisted and already-tried agents
  const getAvailableAgentsForCustomer = useCallback((
    customerId: string,
    date: string,
    startTime: string,
    endTime?: string,
    excludeAgentIds: string[] = []
  ): Agent[] => {
    const customer = users.find(u => u.id === customerId);
    const blacklistedIds = customer?.blacklistedAgentIds || [];
    const effectiveEndTime = endTime || startTime;
    
    return agents.filter(agent => {
      // Skip if on vacation
      if (agent.isOnVacation) return false;
      
      // Skip if blacklisted by customer
      if (blacklistedIds.includes(agent.id)) return false;
      
      // Skip if in exclude list (already tried agents)
      if (excludeAgentIds.includes(agent.id)) return false;
      
      // Check if agent has availability for this slot
      const hasSlotAvailable = agent.availability.some(slot => 
        slot.date === date && 
        slot.startTime === startTime && 
        (!endTime || slot.endTime === endTime) && 
        !slot.isBooked
      );
      
      // Check for conflicts with existing appointments
      const hasConflict = appointments.filter(a => {
        if (a.status === 'cancelled' || a.status === 'rejected') return false;
        if (a.agentId !== agent.id) return false;
        if (a.date !== date) return false;
        // Handle optional endTime - use a default duration if not set
        const apptEndTime = a.endTime || a.startTime;
        return startTime < apptEndTime && effectiveEndTime > a.startTime;
      }).length > 0;
      
      return hasSlotAvailable && !hasConflict;
    });
  }, [agents, users, appointments]);

  const toggleAgentVacation = useCallback((agentId: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, isOnVacation: !a.isOnVacation } : a
    ));
  }, []);

  const updateAgentAvailability = useCallback((agentId: string, slotId: string, isBooked: boolean, bookingId?: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId 
        ? {
            ...a,
            availability: a.availability.map(slot =>
              slot.id === slotId ? { ...slot, isBooked, bookingId } : slot
            )
          }
        : a
    ));
  }, []);

  const updateAgentSmsVerification = useCallback((agentId: string, verified: boolean) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, smsVerified: verified } : a
    ));
  }, []);

  // User functions
  const getUser = useCallback((id: string) => {
    return users.find(u => u.id === id);
  }, [users]);

  const updateUserSmsVerification = useCallback((userId: string, verified: boolean) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, smsVerified: verified } : u
    ));
    // Update currentUser if it's the same user
    setCurrentUser(prev => prev && prev.id === userId ? { ...prev, smsVerified: verified } : prev);
  }, []);

  const updateUserProfile = useCallback((userId: string, updates: Partial<Pick<User, 'name' | 'email' | 'phone' | 'profilePicUrl'>>) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, ...updates } : u
    ));
    // Update currentUser if it's the same user
    setCurrentUser(prev => prev && prev.id === userId && prev.role === 'customer' ? { ...prev, ...updates } : prev);
  }, []);

  const updateAgentProfile = useCallback((agentId: string, updates: Partial<Pick<Agent, 'name' | 'email' | 'phone' | 'profilePicUrl'>>) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, ...updates } : a
    ));
    // Update currentUser if it's the same agent
    setCurrentUser(prev => prev && prev.id === agentId && prev.role === 'agent' ? { ...prev, ...updates } : prev);
  }, []);

  // Notification functions (defined early because used by appointment functions)
  const getNotificationsByUser = useCallback((userId: string) => {
    return notifications.filter(n => n.userId === userId);
  }, [notifications]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  // Appointment functions
  const getAppointmentsByUser = useCallback((userId: string, role: UserRole) => {
    if (role === 'customer') {
      return appointments.filter(a => a.customerId === userId);
    } else if (role === 'agent') {
      return appointments.filter(a => a.agentId === userId);
    }
    return appointments;
  }, [appointments]);

  const getAppointmentsByProperty = useCallback((propertyId: string) => {
    return appointments.filter(a => a.propertyId === propertyId);
  }, [appointments]);

  const createAppointment = useCallback((appointmentData: Omit<Appointment, 'id' | 'createdAt'>): Appointment => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    setAppointments(prev => [...prev, newAppointment]);

    // Check race condition - if property already has a first viewer, this customer only has viewing rights
    const existingAppointments = appointments.filter(a => a.propertyId === appointmentData.propertyId && a.status !== 'cancelled');
    if (existingAppointments.length > 0) {
      // Already has appointments - this is not the first viewer
      newAppointment.hasPurchaseRights = false;
      
      // Notify customer about viewing-only rights
      const property = properties.find(p => p.id === appointmentData.propertyId);
      addNotification({
        userId: appointmentData.customerId,
        type: 'viewing_only',
        title: 'Viewing Rights Notice',
        message: `Another customer has priority purchase rights for ${property?.title || 'this property'}. You may view the property, but cannot purchase unless they decline.`,
        read: false,
        relatedId: appointmentData.propertyId,
      });
    } else {
      // First viewer - update property status
      updatePropertyStatus(appointmentData.propertyId, 'pending', appointmentData.customerId);
    }

    // Notify agent
    const property = properties.find(p => p.id === appointmentData.propertyId);
    addNotification({
      userId: appointmentData.agentId,
      type: 'booking_new',
      title: 'New Booking',
      message: `You have a new property viewing scheduled for ${property?.title || 'a property'}`,
      read: false,
      relatedId: newAppointment.id,
    });

    return newAppointment;
  }, [appointments, properties, updatePropertyStatus, addNotification]);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, ...updates } : a
    ));
  }, []);

  const changeAgent = useCallback((appointmentId: string, newAgentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    const oldAgentId = appointment.agentId;
    
    // Update appointment
    setAppointments(prev => prev.map(a => 
      a.id === appointmentId ? { ...a, agentId: newAgentId } : a
    ));

    // Notify old agent
    addNotification({
      userId: oldAgentId,
      type: 'agent_change',
      title: 'Appointment Reassigned',
      message: 'A customer has requested a different agent for their viewing.',
      read: false,
      relatedId: appointmentId,
    });

    // Notify new agent
    const property = properties.find(p => p.id === appointment.propertyId);
    addNotification({
      userId: newAgentId,
      type: 'booking_new',
      title: 'New Booking Assignment',
      message: `You have been assigned to a property viewing for ${property?.title || 'a property'}`,
      read: false,
      relatedId: appointmentId,
    });
  }, [appointments, properties, addNotification]);

  const cancelAppointment = useCallback((id: string) => {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;
    
    const property = properties.find(p => p.id === appointment.propertyId);
    
    // Check if this customer had purchase priority
    const hadPurchaseRights = appointment.hasPurchaseRights;
    
    // Update the appointment status to cancelled
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'cancelled' } : a
    ));

    // Notify agent about cancellation
    addNotification({
      userId: appointment.agentId,
      type: 'appointment_cancelled',
      title: 'Booking Cancelled',
      message: `The viewing for ${property?.title || 'a property'} has been cancelled by the customer.`,
      read: false,
      relatedId: id,
    });

    // If this customer had purchase rights, promote the next in queue
    if (hadPurchaseRights && property) {
      // Get all active appointments for this property, ordered by booking time
      const activeAppointments = appointments.filter(a => 
        a.propertyId === appointment.propertyId && 
        a.id !== id &&
        !['cancelled', 'rejected'].includes(a.status)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (activeAppointments.length > 0) {
        // Promote the next customer in queue
        const nextInQueue = activeAppointments[0];
        
        // Update the next appointment to have purchase rights
        setAppointments(prev => prev.map(a => 
          a.id === nextInQueue.id ? { ...a, hasPurchaseRights: true } : a
        ));

        // Update property first viewer
        setProperties(prev => prev.map(p => 
          p.id === property.id 
            ? { 
                ...p, 
                firstViewerCustomerId: nextInQueue.customerId,
                firstViewerTimestamp: nextInQueue.createdAt
              } 
            : p
        ));

        // Notify the promoted customer
        addNotification({
          userId: nextInQueue.customerId,
          type: 'priority_promoted',
          title: 'Purchase Priority Granted',
          message: `You now hold the first right to purchase ${property?.title || 'this property'}. The previous priority holder has cancelled.`,
          read: false,
          relatedId: nextInQueue.id,
        });
      } else {
        // No other appointments - reset property to available
        setProperties(prev => prev.map(p => 
          p.id === property.id 
            ? { 
                ...p, 
                status: 'available' as const,
                firstViewerCustomerId: undefined,
                firstViewerTimestamp: undefined
              } 
            : p
        ));
      }
    }
  }, [appointments, properties, addNotification]);

  // Double-booking prevention: check if agent has conflict for given time slot
  const hasAgentConflict = useCallback((
    agentId: string,
    date: string,
    startTime: string,
    endTime?: string,
    excludeAppointmentId?: string
  ): boolean => {
    // Use provided endTime or assume 1 hour duration as minimum
    const effectiveEndTime = endTime || (() => {
      const [hours, mins] = startTime.split(':').map(Number);
      const endHour = Math.min(hours + 1, 23);
      return `${String(endHour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    })();
    
    const conflictingAppointments = appointments.filter(a => {
      // Exclude cancelled/rejected/done/sold appointments and the current appointment being changed
      if (['cancelled', 'rejected', 'done', 'sold', 'completed'].includes(a.status)) return false;
      if (excludeAppointmentId && a.id === excludeAppointmentId) return false;
      if (a.agentId !== agentId) return false;
      if (a.date !== date) return false;
      
      // Check for time overlap - handle optional endTime with 1 hour minimum assumption
      const aStart = a.startTime;
      const aEnd = a.endTime || (() => {
        const [hours, mins] = a.startTime.split(':').map(Number);
        const endHour = Math.min(hours + 1, 23);
        return `${String(endHour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      })();
      // Overlap exists if: start < otherEnd AND end > otherStart
      return startTime < aEnd && effectiveEndTime > aStart;
    });
    
    return conflictingAppointments.length > 0;
  }, [appointments]);

  // Get agents who are free for a specific slot
  const getAgentsFreeForSlot = useCallback((
    date: string,
    startTime: string,
    endTime?: string,
    excludeAppointmentId?: string
  ): Agent[] => {
    return agents.filter(agent => {
      if (agent.isOnVacation) return false;
      
      // Check if agent has availability for this slot
      const hasSlotAvailable = agent.availability.some(slot => 
        slot.date === date && 
        slot.startTime === startTime && 
        (!endTime || slot.endTime === endTime) && 
        !slot.isBooked
      );
      
      // Check for conflicts
      const hasConflict = hasAgentConflict(agent.id, date, startTime, endTime, excludeAppointmentId);
      
      return hasSlotAvailable && !hasConflict;
    });
  }, [agents, hasAgentConflict]);

  // Get purchase priority queue for a property (ordered by booking timestamp - earliest first)
  const getPurchasePriorityQueue = useCallback((propertyId: string): Appointment[] => {
    return appointments
      .filter(a => 
        a.propertyId === propertyId && 
        !['cancelled', 'rejected'].includes(a.status)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [appointments]);

  // Get customer's position in the purchase priority queue (1-indexed, 0 means not in queue)
  const getCustomerPriorityPosition = useCallback((propertyId: string, customerId: string): number => {
    const queue = appointments
      .filter(a => 
        a.propertyId === propertyId && 
        !['cancelled', 'rejected'].includes(a.status)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const position = queue.findIndex(a => a.customerId === customerId);
    return position === -1 ? 0 : position + 1;
  }, [appointments]);

  // Check if a date is within the 7-day booking window
  const isDateWithinBookingWindow = useCallback((dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + BOOKING_WINDOW_DAYS);
    
    return date >= today && date <= maxDate;
  }, []);

  // Accept appointment
  const acceptAppointment = useCallback((id: string) => {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'accepted' } : a
    ));

    // Notify customer about acceptance
    const property = properties.find(p => p.id === appointment.propertyId);
    addNotification({
      userId: appointment.customerId,
      type: 'booking_accepted',
      title: 'Booking Accepted',
      message: `Your viewing for ${property?.title || 'a property'} has been confirmed by the agent.`,
      read: false,
      relatedId: id,
    });
  }, [appointments, properties, addNotification]);

  // Reject appointment - with auto-assignment of new agent
  const rejectAppointment = useCallback((id: string, reason?: string) => {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    const property = properties.find(p => p.id === appointment.propertyId);
    const currentAgentId = appointment.agentId;
    const customer = users.find(u => u.id === appointment.customerId);
    const blacklistedIds = customer?.blacklistedAgentIds || [];
    
    // Find available agents for auto-assignment (excluding current agent and blacklisted)
    const availableAgents = agents.filter(agent => {
      if (agent.id === currentAgentId) return false;
      if (agent.isOnVacation) return false;
      if (blacklistedIds.includes(agent.id)) return false;
      
      // Check if agent has availability for this slot
      const hasSlotAvailable = agent.availability.some(slot => 
        slot.date === appointment.date && 
        slot.startTime === appointment.startTime && 
        slot.endTime === appointment.endTime && 
        !slot.isBooked
      );
      
      // Check for conflicts
      const hasConflict = appointments.filter(a => {
        if (a.status === 'cancelled' || a.status === 'rejected') return false;
        if (a.id === id) return false; // Exclude current appointment
        if (a.agentId !== agent.id) return false;
        if (a.date !== appointment.date) return false;
        // Handle optional endTime
        const apptEndTime = appointment.endTime || appointment.startTime;
        const aEndTime = a.endTime || a.startTime;
        return appointment.startTime < aEndTime && apptEndTime > a.startTime;
      }).length > 0;
      
      return hasSlotAvailable && !hasConflict;
    });

    if (availableAgents.length > 0) {
      // Auto-assign new agent - pick first available (or could be random)
      const newAgent = availableAgents[0];
      
      setAppointments(prev => prev.map(a => 
        a.id === id ? { 
          ...a, 
          status: 'pending_approval',
          previousAgentId: currentAgentId,
          agentId: newAgent.id,
          rejectionReason: reason
        } : a
      ));

      // Notify customer about rejection and new agent assignment
      addNotification({
        userId: appointment.customerId,
        type: 'agent_reassigned',
        title: 'Agent Reassigned',
        message: `Your viewing request for ${property?.title || 'a property'} was declined by the previous agent.${reason ? ` Reason: ${reason}` : ''} A new agent (${newAgent.name}) has been assigned. Please approve or select a different agent.`,
        read: false,
        relatedId: id,
      });

      // Notify new agent about pending assignment
      addNotification({
        userId: newAgent.id,
        type: 'booking_pending',
        title: 'Pending Assignment',
        message: `You have been assigned to a viewing for ${property?.title || 'a property'}, pending customer approval.`,
        read: false,
        relatedId: id,
      });
    } else {
      // No available agents - mark as rejected and notify customer
      setAppointments(prev => prev.map(a => 
        a.id === id ? { 
          ...a, 
          status: 'rejected',
          previousAgentId: currentAgentId,
          rejectionReason: reason
        } : a
      ));

      // Notify customer about rejection with no available agents
      addNotification({
        userId: appointment.customerId,
        type: 'no_agents_available',
        title: 'No Agents Available',
        message: `Your viewing request for ${property?.title || 'a property'} was declined.${reason ? ` Reason: ${reason}` : ''} Unfortunately, no other agents are available for this time slot. Please select a different time.`,
        read: false,
        relatedId: id,
      });
    }
  }, [appointments, properties, users, agents, addNotification]);

  // Customer approves the newly assigned agent
  const approveNewAgent = useCallback((appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment || appointment.status !== 'pending_approval') return;

    const property = properties.find(p => p.id === appointment.propertyId);
    const agent = agents.find(a => a.id === appointment.agentId);

    // Update status to pending (waiting for agent acceptance)
    setAppointments(prev => prev.map(a => 
      a.id === appointmentId ? { ...a, status: 'pending' } : a
    ));

    // Notify agent about the booking
    addNotification({
      userId: appointment.agentId,
      type: 'booking_new',
      title: 'New Booking',
      message: `You have a new property viewing for ${property?.title || 'a property'}. Customer has approved your assignment.`,
      read: false,
      relatedId: appointmentId,
    });

    // Notify customer that agent has been notified
    addNotification({
      userId: appointment.customerId,
      type: 'booking_pending',
      title: 'Awaiting Agent Confirmation',
      message: `${agent?.name || 'The agent'} has been notified of your viewing request for ${property?.title || 'a property'}.`,
      read: false,
      relatedId: appointmentId,
    });
  }, [appointments, properties, agents, addNotification]);

  // Customer selects a different agent (from available agents)
  const selectDifferentAgent = useCallback((appointmentId: string, newAgentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    if (appointment.status !== 'pending_approval' && appointment.status !== 'rejected') return;

    const property = properties.find(p => p.id === appointment.propertyId);
    const newAgent = agents.find(a => a.id === newAgentId);

    // Update appointment with new agent and set to pending_approval
    setAppointments(prev => prev.map(a => 
      a.id === appointmentId ? { 
        ...a, 
        agentId: newAgentId,
        status: 'pending'
      } : a
    ));

    // Notify new agent about the booking
    addNotification({
      userId: newAgentId,
      type: 'booking_new',
      title: 'New Booking',
      message: `You have been assigned to a property viewing for ${property?.title || 'a property'}`,
      read: false,
      relatedId: appointmentId,
    });

    // Notify customer
    addNotification({
      userId: appointment.customerId,
      type: 'booking_pending',
      title: 'Agent Selected',
      message: `${newAgent?.name || 'Your selected agent'} has been notified of your viewing request for ${property?.title || 'a property'}.`,
      read: false,
      relatedId: appointmentId,
    });
  }, [appointments, properties, agents, addNotification]);

  // Messaging functions
  const getMessagesByAppointment = useCallback((appointmentId: string) => {
    return messages.filter(m => m.appointmentId === appointmentId).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  const canMessage = useCallback((appointmentId: string): boolean => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return false;
    if (appointment.status !== 'accepted' && appointment.status !== 'scheduled') return false;
    
    // Get customer and agent
    const customer = users.find(u => u.id === appointment.customerId);
    const agent = agents.find(a => a.id === appointment.agentId);
    
    // Both must be SMS verified for messaging
    return !!(customer?.smsVerified && agent?.smsVerified);
  }, [appointments, users, agents]);

  const sendMessage = useCallback((appointmentId: string, content: string) => {
    if (!currentUser || !content.trim()) return;
    if (!canMessage(appointmentId)) return;

    const newMessage: AppointmentMessage = {
      id: uuidv4(),
      appointmentId,
      senderId: currentUser.id,
      senderRole: currentUser.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, newMessage]);

    // Notify the other party
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      const recipientId = currentUser.role === 'agent' ? appointment.customerId : appointment.agentId;
      addNotification({
        userId: recipientId,
        type: 'booking_change',
        title: 'New Message',
        message: `You have a new message regarding your appointment.`,
        read: false,
        relatedId: appointmentId,
      });
    }
  }, [currentUser, canMessage, appointments, addNotification]);

  // Admin functions
  const resolveAlert = useCallback((id: string, resolution: string, resolvedBy: string) => {
    setAdminAlerts(prev => prev.map(a => 
      a.id === id 
        ? { ...a, status: 'resolved', resolution, resolvedBy, resolvedAt: new Date().toISOString() } 
        : a
    ));
  }, []);

  const createOverride = useCallback((appointmentId: string, newAgentId: string, reason: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    changeAgent(appointmentId, newAgentId);

    // Create alert record
    const newAlert: AdminAlert = {
      id: uuidv4(),
      type: 'manual_override',
      status: 'resolved',
      description: reason,
      appointmentId,
      agentId: newAgentId,
      createdAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString(),
      resolvedBy: currentUser?.id,
      resolution: `Agent changed to ${agents.find(a => a.id === newAgentId)?.name}`,
    };
    setAdminAlerts(prev => [...prev, newAlert]);
  }, [appointments, agents, currentUser, changeAgent]);

  // Mark appointment as done - viewing finished, property still available
  const markAppointmentDone = useCallback((id: string) => {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    const property = properties.find(p => p.id === appointment.propertyId);
    
    // Calculate end time - use current time if after start time, otherwise use start time + 1 hour
    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 5);
    const appointmentStartTime = appointment.startTime;
    
    // If current time is before start time, use start time + 1 hour as default duration
    let endTimeValue: string;
    if (currentTimeStr >= appointmentStartTime) {
      endTimeValue = currentTimeStr;
    } else {
      // Parse start time and add 1 hour
      const [hours, mins] = appointmentStartTime.split(':').map(Number);
      const endHour = Math.min(hours + 1, 23); // Cap at 23:xx
      endTimeValue = `${String(endHour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
    
    // Update appointment status to 'done' and set end time
    setAppointments(prev => prev.map(a => 
      a.id === id ? { 
        ...a, 
        status: 'done',
        endTime: endTimeValue
      } : a
    ));

    // Check if there are other active viewings for this property
    const otherActiveViewings = appointments.filter(a => 
      a.propertyId === appointment.propertyId &&
      a.id !== id &&
      !['cancelled', 'rejected', 'done', 'sold', 'completed'].includes(a.status)
    );

    // If no other active viewings, make property available again
    if (otherActiveViewings.length === 0) {
      updatePropertyStatus(appointment.propertyId, 'available');
      
      // Clear first viewer if this was the first viewer's appointment
      setProperties(prev => prev.map(p => 
        p.id === appointment.propertyId && p.firstViewerCustomerId === appointment.customerId
          ? { ...p, firstViewerCustomerId: undefined, firstViewerTimestamp: undefined }
          : p
      ));
    }

    // Notify customer about viewing completion
    addNotification({
      userId: appointment.customerId,
      type: 'viewing_done',
      title: 'Viewing Completed',
      message: `Your viewing for ${property?.title || 'a property'} has been completed. The property is now available for other bookings.`,
      read: false,
      relatedId: id,
    });

    // Notify queued customers that property is now available for booking
    const queuedAppointments = appointments.filter(a => 
      a.propertyId === appointment.propertyId &&
      a.id !== id &&
      a.customerId !== appointment.customerId &&
      ['pending', 'pending_approval'].includes(a.status)
    );

    queuedAppointments.forEach(queuedAppt => {
      addNotification({
        userId: queuedAppt.customerId,
        type: 'property_available',
        title: 'Property Available',
        message: `A prior viewing for ${property?.title || 'a property'} has completed. Your viewing can proceed.`,
        read: false,
        relatedId: queuedAppt.id,
      });
    });
  }, [appointments, properties, updatePropertyStatus, addNotification]);

  // Mark appointment as sold - property purchased and no longer available
  const markAppointmentSold = useCallback((id: string) => {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    const property = properties.find(p => p.id === appointment.propertyId);
    const agent = agents.find(a => a.id === appointment.agentId);
    
    // Calculate end time - use current time if after start time, otherwise use start time + 1 hour
    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 5);
    const appointmentStartTime = appointment.startTime;
    
    let endTimeValue: string;
    if (currentTimeStr >= appointmentStartTime) {
      endTimeValue = currentTimeStr;
    } else {
      const [hours, mins] = appointmentStartTime.split(':').map(Number);
      const endHour = Math.min(hours + 1, 23);
      endTimeValue = `${String(endHour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
    
    // Update appointment status to 'sold' and set end time
    setAppointments(prev => prev.map(a => 
      a.id === id ? { 
        ...a, 
        status: 'sold',
        endTime: endTimeValue
      } : a
    ));

    // Update property status to 'sold'
    updatePropertyStatus(appointment.propertyId, 'sold');

    // Update agent's sold properties and sales count
    if (agent) {
      setAgents(prev => prev.map(a => 
        a.id === appointment.agentId ? {
          ...a,
          salesCount: a.salesCount + 1,
          soldProperties: [...a.soldProperties, appointment.propertyId]
        } : a
      ));
    }

    // Cancel all other pending appointments for this property
    const otherAppointments = appointments.filter(a => 
      a.propertyId === appointment.propertyId &&
      a.id !== id &&
      !['cancelled', 'rejected', 'done', 'sold', 'completed'].includes(a.status)
    );

    otherAppointments.forEach(otherAppt => {
      setAppointments(prev => prev.map(a => 
        a.id === otherAppt.id ? { ...a, status: 'cancelled' } : a
      ));

      // Notify customers that property is no longer available
      addNotification({
        userId: otherAppt.customerId,
        type: 'property_sold',
        title: 'Property Sold',
        message: `The property "${property?.title || 'a property'}" has been sold. Your viewing has been cancelled.`,
        read: false,
        relatedId: otherAppt.id,
      });
    });

    // Notify the buyer (customer who completed the sale)
    addNotification({
      userId: appointment.customerId,
      type: 'property_sold',
      title: 'Congratulations!',
      message: `You have successfully purchased ${property?.title || 'a property'}. Our team will contact you for the next steps.`,
      read: false,
      relatedId: id,
    });
  }, [appointments, properties, agents, updatePropertyStatus, addNotification]);

  // Get properties available for customer booking (excludes sold properties)
  const getAvailablePropertiesForBooking = useCallback(() => {
    return properties.filter(p => p.status !== 'sold');
  }, [properties]);

  // Check if property has pending viewings that haven't been marked done
  const hasPendingViewingsForProperty = useCallback((propertyId: string, excludeCustomerId?: string): boolean => {
    return appointments.some(a => 
      a.propertyId === propertyId &&
      (excludeCustomerId ? a.customerId !== excludeCustomerId : true) &&
      ['pending', 'pending_approval', 'accepted', 'scheduled'].includes(a.status)
    );
  }, [appointments]);

  const value: AppContextType = {
    currentUser,
    setCurrentUser,
    login,
    logout,
    properties,
    getProperty,
    updatePropertyStatus,
    addProperty,
    updateProperty,
    markPropertySold,
    getSoldProperties,
    agents,
    getAgent,
    getAvailableAgents,
    getAvailableAgentsForCustomer,
    toggleAgentVacation,
    updateAgentAvailability,
    updateAgentSmsVerification,
    users,
    getUser,
    updateUserSmsVerification,
    updateUserProfile,
    updateAgentProfile,
    appointments,
    getAppointmentsByUser,
    getAppointmentsByProperty,
    createAppointment,
    updateAppointment,
    changeAgent,
    cancelAppointment,
    acceptAppointment,
    rejectAppointment,
    approveNewAgent,
    selectDifferentAgent,
    hasAgentConflict,
    getAgentsFreeForSlot,
    markAppointmentDone,
    markAppointmentSold,
    getAvailablePropertiesForBooking,
    hasPendingViewingsForProperty,
    getPurchasePriorityQueue,
    getCustomerPriorityPosition,
    isDateWithinBookingWindow,
    messages,
    getMessagesByAppointment,
    sendMessage,
    canMessage,
    notifications,
    getNotificationsByUser,
    markNotificationRead,
    addNotification,
    adminAlerts,
    resolveAlert,
    createOverride,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
