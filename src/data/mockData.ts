import type { Property, Agent, User, Appointment, Notification, AdminAlert, AgentAvailability } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate dates
const today = new Date();
const formatDate = (date: Date): string => date.toISOString().split('T')[0];
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Generate availability slots for an agent
const generateAvailability = (startDays: number, numDays: number, bookedSlots: number[] = []): AgentAvailability[] => {
  const slots: AgentAvailability[] = [];
  const times = [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
  ];
  
  let slotIndex = 0;
  for (let d = startDays; d < startDays + numDays; d++) {
    const date = formatDate(addDays(today, d));
    times.forEach((time) => {
      slots.push({
        id: uuidv4(),
        date,
        startTime: time.start,
        endTime: time.end,
        isBooked: bookedSlots.includes(slotIndex),
      });
      slotIndex++;
    });
  }
  return slots;
};

// Sample agents
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Maria Santos',
    email: 'maria.santos@tesproperties.ph',
    phone: '+63 912 345 6789',
    role: 'agent',
    rating: 4.8,
    salesCount: 15,
    soldProperties: ['prop-sold-1', 'prop-sold-2'],
    isOnVacation: false,
    smsVerified: true,
    availability: generateAvailability(1, 14, [2, 5, 12]),
    latestRatings: [
      { id: 'rating-1', customerId: 'cust-1', customerName: 'John D.', rating: 5, comment: 'Excellent service!', date: formatDate(addDays(today, -5)) },
      { id: 'rating-2', customerId: 'cust-2', customerName: 'Sarah M.', rating: 4, comment: 'Very helpful and professional', date: formatDate(addDays(today, -10)) },
    ],
  },
  {
    id: 'agent-2',
    name: 'Jose Reyes',
    email: 'jose.reyes@tesproperties.ph',
    phone: '+63 923 456 7890',
    role: 'agent',
    rating: 4.5,
    salesCount: 12,
    soldProperties: ['prop-sold-3'],
    isOnVacation: false,
    smsVerified: true,
    availability: generateAvailability(1, 14, [0, 8, 15]),
    latestRatings: [
      { id: 'rating-3', customerId: 'cust-3', customerName: 'Mike T.', rating: 5, comment: 'Great experience!', date: formatDate(addDays(today, -3)) },
      { id: 'rating-4', customerId: 'cust-4', customerName: 'Lisa W.', rating: 4, comment: 'Very knowledgeable', date: formatDate(addDays(today, -8)) },
    ],
  },
  {
    id: 'agent-3',
    name: 'Ana Cruz',
    email: 'ana.cruz@tesproperties.ph',
    phone: '+63 934 567 8901',
    role: 'agent',
    rating: 4.9,
    salesCount: 20,
    soldProperties: ['prop-sold-4', 'prop-sold-5', 'prop-sold-6'],
    isOnVacation: true, // On vacation - won't appear in customer choices
    smsVerified: false,
    availability: generateAvailability(1, 14, []),
    latestRatings: [
      { id: 'rating-5', customerId: 'cust-5', customerName: 'Robert K.', rating: 5, comment: 'Best agent ever!', date: formatDate(addDays(today, -2)) },
    ],
  },
  {
    id: 'agent-4',
    name: 'Carlos Garcia',
    email: 'carlos.garcia@tesproperties.ph',
    phone: '+63 945 678 9012',
    role: 'agent',
    rating: 4.3,
    salesCount: 8,
    soldProperties: [],
    isOnVacation: false,
    smsVerified: true,
    availability: generateAvailability(1, 14, [3, 9]),
    latestRatings: [
      { id: 'rating-6', customerId: 'cust-6', customerName: 'Emma S.', rating: 4, comment: 'Good service', date: formatDate(addDays(today, -7)) },
    ],
  },
];

// Sample properties in Davao, Philippines
export const mockProperties: Property[] = [
  {
    id: 'prop-1',
    title: 'Modern Villa in Lanang',
    description: 'Stunning modern villa with panoramic views of Davao Gulf. Features open-plan living, infinity pool, and lush tropical gardens. Perfect for families seeking luxury living in a prime location.',
    address: '123 Lanang Boulevard',
    city: 'Davao City',
    price: 25000000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 350,
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    status: 'available',
    features: ['Swimming Pool', 'Garden', 'Garage', 'Security System', 'Ocean View'],
  },
  {
    id: 'prop-2',
    title: 'Cozy Townhouse in Matina',
    description: 'Charming townhouse in a quiet residential area. Close to schools, malls, and hospitals. Ideal for young families or professionals looking for a convenient location.',
    address: '456 Matina Crossing',
    city: 'Davao City',
    price: 8500000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 150,
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
    status: 'available',
    features: ['Parking', 'Balcony', 'Near Schools', 'Gated Community'],
  },
  {
    id: 'prop-3',
    title: 'Executive Condo in Abreeza',
    description: 'High-end condominium unit in the heart of Davao\'s premier business and lifestyle district. Walk to Abreeza Mall, restaurants, and offices.',
    address: 'Unit 1205, Abreeza Residences',
    city: 'Davao City',
    price: 12000000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 95,
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    status: 'available',
    features: ['Gym Access', 'Pool', 'Concierge', 'City View', 'Parking'],
  },
  {
    id: 'prop-4',
    title: 'Beachfront Property in Samal',
    description: 'Rare beachfront lot with existing cottage in the beautiful Island Garden City of Samal. Perfect for resort development or private beach house.',
    address: 'Barangay Peñaplata, Samal Island',
    city: 'Island Garden City of Samal',
    price: 45000000,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 800,
    imageUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
    status: 'available',
    features: ['Beachfront', 'Large Lot', 'Island Living', 'Investment Potential'],
  },
  {
    id: 'prop-5',
    title: 'Family Home in Buhangin',
    description: 'Spacious family home in a well-established neighborhood. Large backyard, multiple living areas, and close to major thoroughfares.',
    address: '789 Buhangin Proper',
    city: 'Davao City',
    price: 15000000,
    bedrooms: 5,
    bathrooms: 3,
    sqft: 280,
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    status: 'pending',
    firstViewerCustomerId: 'customer-1',
    firstViewerTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    features: ['Large Backyard', 'Garage', 'Near Highway', 'Quiet Neighborhood'],
  },
  {
    id: 'prop-6',
    title: 'Starter Home in Catalunan',
    description: 'Affordable starter home perfect for first-time buyers. Recently renovated with modern fixtures. Ready for immediate occupancy.',
    address: '321 Catalunan Pequeño',
    city: 'Davao City',
    price: 4500000,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 80,
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    status: 'available',
    features: ['Newly Renovated', 'Affordable', 'Ready to Move In'],
  },
];

// Sample users
export const mockUsers: User[] = [
  { id: 'customer-1', name: 'Juan Dela Cruz', email: 'juan@email.com', role: 'customer', phone: '+63 901 234 5678', smsVerified: true },
  { id: 'customer-2', name: 'Maria Garcia', email: 'maria.g@email.com', role: 'customer', phone: '+63 902 345 6789', smsVerified: false },
  { id: 'admin-1', name: 'Admin User', email: 'admin@tesproperties.ph', role: 'admin', phone: '+63 999 888 7777', smsVerified: true },
];

// Sample appointments
export const mockAppointments: Appointment[] = [
  {
    id: 'apt-1',
    propertyId: 'prop-5',
    customerId: 'customer-1',
    agentId: 'agent-1',
    date: formatDate(addDays(today, 2)),
    startTime: '10:00',
    endTime: '11:00',
    status: 'accepted',
    hasViewingRights: true,
    hasPurchaseRights: true, // First viewer
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    customerName: 'Juan Dela Cruz',
    customerEmail: 'juan@email.com',
    customerPhone: '+63 901 234 5678',
    notes: 'Customer interested in long-term investment.',
  },
  {
    id: 'apt-2',
    propertyId: 'prop-5',
    customerId: 'customer-2',
    agentId: 'agent-2',
    date: formatDate(addDays(today, 3)),
    startTime: '14:00',
    endTime: '15:00',
    status: 'pending',
    hasViewingRights: true,
    hasPurchaseRights: false, // Second viewer - viewing only
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    customerName: 'Maria Garcia',
    customerEmail: 'maria.g@email.com',
    customerPhone: '+63 902 345 6789',
  },
];

// Sample notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'agent-1',
    type: 'booking_new',
    title: 'New Booking',
    message: 'You have a new property viewing scheduled for Family Home in Buhangin',
    read: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    relatedId: 'apt-1',
  },
  {
    id: 'notif-2',
    userId: 'customer-2',
    type: 'viewing_only',
    title: 'Viewing Rights Notice',
    message: 'Another customer has priority purchase rights for Family Home in Buhangin. You may view the property, but cannot purchase unless they decline.',
    read: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    relatedId: 'prop-5',
  },
  {
    id: 'notif-3',
    userId: 'agent-2',
    type: 'booking_new',
    title: 'New Booking',
    message: 'You have a new property viewing scheduled for Family Home in Buhangin',
    read: true,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    relatedId: 'apt-2',
  },
];

// Sample admin alerts
export const mockAdminAlerts: AdminAlert[] = [
  {
    id: 'alert-1',
    type: 'timeout',
    status: 'pending',
    description: 'Customer has not confirmed appointment within 24 hours',
    appointmentId: 'apt-old-1',
    customerId: 'customer-old',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-2',
    type: 'complaint',
    status: 'pending',
    description: 'Customer reported agent was late to scheduled viewing',
    appointmentId: 'apt-old-2',
    customerId: 'customer-1',
    agentId: 'agent-4',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Company info
export const companyInfo = {
  name: 'TES Properties',
  tagline: 'Your Trusted Partner in Davao Real Estate',
  description: 'TES Properties is a leading real estate company based in Davao City, Philippines. We specialize in residential and commercial properties across the Davao region, offering personalized service and deep local expertise.',
  address: '123 J.P. Laurel Avenue, Bajada, Davao City, Philippines 8000',
  phone: '+63 82 123 4567',
  email: 'info@tesproperties.ph',
  hours: 'Monday - Saturday: 8:00 AM - 5:00 PM',
  established: 2010,
  socialMedia: {
    facebook: 'https://facebook.com/tesproperties',
    instagram: 'https://instagram.com/tesproperties',
  },
};
