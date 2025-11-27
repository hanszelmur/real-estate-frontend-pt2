import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Property, Agent, Appointment, Notification, AdminAlert, UserRole, AppointmentMessage } from '../types';
import { mockUsers, mockProperties, mockAgents, mockAppointments, mockNotifications, mockAdminAlerts } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';

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

  // Agents
  agents: Agent[];
  getAgent: (id: string) => Agent | undefined;
  getAvailableAgents: () => Agent[];
  toggleAgentVacation: (agentId: string) => void;
  updateAgentAvailability: (agentId: string, slotId: string, isBooked: boolean, bookingId?: string) => void;
  updateAgentSmsVerification: (agentId: string, verified: boolean) => void;

  // Users
  users: User[];
  getUser: (id: string) => User | undefined;
  updateUserSmsVerification: (userId: string, verified: boolean) => void;

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
  hasAgentConflict: (agentId: string, date: string, startTime: string, endTime: string, excludeAppointmentId?: string) => boolean;
  getAgentsFreeForSlot: (date: string, startTime: string, endTime: string, excludeAppointmentId?: string) => Agent[];

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

  // Agent functions
  const getAgent = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  const getAvailableAgents = useCallback(() => {
    return agents.filter(a => !a.isOnVacation);
  }, [agents]);

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
    
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'cancelled' } : a
    ));

    // Notify agent about cancellation
    const property = properties.find(p => p.id === appointment.propertyId);
    addNotification({
      userId: appointment.agentId,
      type: 'booking_cancel',
      title: 'Booking Cancelled',
      message: `The viewing for ${property?.title || 'a property'} has been cancelled.`,
      read: false,
      relatedId: id,
    });
  }, [appointments, properties, addNotification]);

  // Double-booking prevention: check if agent has conflict for given time slot
  const hasAgentConflict = useCallback((
    agentId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): boolean => {
    const conflictingAppointments = appointments.filter(a => {
      // Exclude cancelled/rejected appointments and the current appointment being changed
      if (a.status === 'cancelled' || a.status === 'rejected') return false;
      if (excludeAppointmentId && a.id === excludeAppointmentId) return false;
      if (a.agentId !== agentId) return false;
      if (a.date !== date) return false;
      
      // Check for time overlap
      const aStart = a.startTime;
      const aEnd = a.endTime;
      // Overlap exists if: start < otherEnd AND end > otherStart
      return startTime < aEnd && endTime > aStart;
    });
    
    return conflictingAppointments.length > 0;
  }, [appointments]);

  // Get agents who are free for a specific slot
  const getAgentsFreeForSlot = useCallback((
    date: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Agent[] => {
    return agents.filter(agent => {
      if (agent.isOnVacation) return false;
      
      // Check if agent has availability for this slot
      const hasSlotAvailable = agent.availability.some(slot => 
        slot.date === date && 
        slot.startTime === startTime && 
        slot.endTime === endTime && 
        !slot.isBooked
      );
      
      // Check for conflicts
      const hasConflict = hasAgentConflict(agent.id, date, startTime, endTime, excludeAppointmentId);
      
      return hasSlotAvailable && !hasConflict;
    });
  }, [agents, hasAgentConflict]);

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

  // Reject appointment
  const rejectAppointment = useCallback((id: string, reason?: string) => {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'rejected' } : a
    ));

    // Notify customer about rejection
    const property = properties.find(p => p.id === appointment.propertyId);
    addNotification({
      userId: appointment.customerId,
      type: 'booking_rejected',
      title: 'Booking Declined',
      message: `Your viewing request for ${property?.title || 'a property'} was declined.${reason ? ` Reason: ${reason}` : ''} Please select a different time or agent.`,
      read: false,
      relatedId: id,
    });
  }, [appointments, properties, addNotification]);

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

  const value: AppContextType = {
    currentUser,
    setCurrentUser,
    login,
    logout,
    properties,
    getProperty,
    updatePropertyStatus,
    agents,
    getAgent,
    getAvailableAgents,
    toggleAgentVacation,
    updateAgentAvailability,
    updateAgentSmsVerification,
    users,
    getUser,
    updateUserSmsVerification,
    appointments,
    getAppointmentsByUser,
    getAppointmentsByProperty,
    createAppointment,
    updateAppointment,
    changeAgent,
    cancelAppointment,
    acceptAppointment,
    rejectAppointment,
    hasAgentConflict,
    getAgentsFreeForSlot,
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
