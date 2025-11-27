import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Property, Agent, Appointment, Notification, AdminAlert, UserRole } from '../types';
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

  // Appointments
  appointments: Appointment[];
  getAppointmentsByUser: (userId: string, role: UserRole) => Appointment[];
  getAppointmentsByProperty: (propertyId: string) => Appointment[];
  createAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  changeAgent: (appointmentId: string, newAgentId: string) => void;
  cancelAppointment: (id: string) => void;

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
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'cancelled' } : a
    ));
  }, []);

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
    appointments,
    getAppointmentsByUser,
    getAppointmentsByProperty,
    createAppointment,
    updateAppointment,
    changeAgent,
    cancelAppointment,
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
