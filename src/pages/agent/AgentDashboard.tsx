import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Agent, Appointment } from '../../types';
import { formatDate, formatTimeRange, generateStars, formatCurrency } from '../../utils/helpers';
import { formatDate, formatTimeRange, formatRelativeTime, generateStars, formatCurrency } from '../../utils/helpers';
import NotificationItem from '../../components/common/NotificationItem';
import AppointmentDetailModal from '../../components/common/AppointmentDetailModal';

type DashboardTab = 'appointments' | 'sold';

export default function AgentDashboard() {
  const {
    currentUser,
    appointments,
    properties,
    users,
    toggleAgentVacation,
    updateAgentSmsVerification,
    getNotificationsByUser,
    markNotificationRead,
    getPurchasePriorityQueue,
    getSoldProperties,
  } = useApp();

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('appointments');
  const [showQueueForProperty, setShowQueueForProperty] = useState<string | null>(null);

  // Redirect if not logged in as agent
  if (!currentUser || currentUser.role !== 'agent') {
    return <Navigate to="/login" replace />;
  }

  const agent = currentUser as Agent;
  const agentNotifications = getNotificationsByUser(agent.id);
  const unreadNotifications = agentNotifications.filter(n => !n.read);

  // Get agent's appointments (pending, accepted, scheduled)
  const agentAppointments = appointments.filter(a => 
    a.agentId === agent.id && 
    (a.status === 'scheduled' || a.status === 'pending' || a.status === 'accepted')
  ).sort((a, b) => {
    // Sort by date and time
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  // Separate pending and accepted/scheduled appointments
  const pendingAppointments = agentAppointments.filter(a => a.status === 'pending');
  const confirmedAppointments = agentAppointments.filter(a => a.status === 'accepted' || a.status === 'scheduled');
  
  // Get sold properties by this agent
  const soldProperties = getSoldProperties().filter(p => agent.soldProperties.includes(p.id));

  // Get unique properties with active appointments
  const propertiesWithQueue = [...new Set(appointments
    .filter(a => !['cancelled', 'rejected'].includes(a.status) && a.agentId === agent.id)
    .map(a => a.propertyId)
  )];
  
  // Get property info
  const getProperty = (id: string) => properties.find(p => p.id === id);
  const getCustomer = (id: string) => users.find(u => u.id === id);

  const handleSmsVerify = () => {
    // DEMO: In a production app, this would trigger an SMS verification flow
    // with OTP code sent to the agent's phone number and validation.
    // For this demo, verification is set to true immediately.
    updateAgentSmsVerification(agent.id, true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'done': return 'bg-gray-100 text-gray-800';
      case 'sold': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {agent.name}</p>
          </div>
          
          {/* Vacation Toggle */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Vacation Mode</span>
            <button
              onClick={() => toggleAgentVacation(agent.id)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                agent.isOnVacation ? 'bg-yellow-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  agent.isOnVacation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            {agent.isOnVacation && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                On Vacation
              </span>
            )}
          </div>
        </div>

        {agent.isOnVacation && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Vacation Mode Active:</strong> You are currently hidden from customer agent selection. 
              Toggle off to become available for new bookings.
            </p>
          </div>
        )}

        {/* SMS Verification Banner */}
        {!agent.smsVerified && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-blue-800 font-medium">Verify Your Phone Number</p>
              <p className="text-blue-600 text-sm">SMS verification is required to enable messaging with customers and view their contact info.</p>
            </div>
            <button
              onClick={handleSmsVerify}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
            >
              Verify Now
            </button>
          </div>
        )}

        {/* Dashboard Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`flex-1 py-4 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'appointments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>Appointments</span>
                {(pendingAppointments.length + confirmedAppointments.length) > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'appointments' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {pendingAppointments.length + confirmedAppointments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('sold')}
                className={`flex-1 py-4 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'sold'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>Sold Properties</span>
                {soldProperties.length > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'sold' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {soldProperties.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointments Tab Content */}
            {activeTab === 'appointments' && (
              <>
                {/* Pending Appointments - Require Action */}
                {pendingAppointments.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md border-2 border-yellow-400">
                    <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-yellow-800">
                          Action Required ({pendingAppointments.length})
                        </h2>
                        <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-sm rounded-full font-medium">
                          Pending Approval
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">Accept or reject these booking requests</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {pendingAppointments.map(appointment => {
                      const property = getProperty(appointment.propertyId);
                      
                      return (
                        <div 
                          key={appointment.id} 
                          className="border-2 border-yellow-200 rounded-lg p-4 hover:border-yellow-400 cursor-pointer transition-colors"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">{property?.title}</h4>
                              <p className="text-gray-600 text-sm">{property?.address}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusBadgeColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Date</p>
                              <p className="font-medium">{formatDate(appointment.date)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Time</p>
                              <p className="font-medium">{formatTimeRange(appointment.startTime, appointment.endTime)}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-yellow-700">Click to view details and respond</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Confirmed Appointments */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
              </div>
              <div className="p-6">
                {confirmedAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">No confirmed appointments</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {confirmedAppointments.map(appointment => {
                      const property = getProperty(appointment.propertyId);
                      
                      return (
                        <div 
                          key={appointment.id} 
                          className="border rounded-lg p-4 hover:border-blue-400 cursor-pointer transition-colors"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">{property?.title}</h4>
                              <p className="text-gray-600 text-sm">{property?.address}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusBadgeColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Date</p>
                              <p className="font-medium">{formatDate(appointment.date)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Time</p>
                              <p className="font-medium">{formatTimeRange(appointment.startTime, appointment.endTime)}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-blue-600">Click to view details</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Link to Calendar */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">My Availability</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your schedule and time slots</p>
                </div>
                <Link
                  to="/agent/calendar"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Open Calendar
                </Link>
              </div>
            </div>
              </>
            )}

            {/* Sold Properties Tab Content */}
            {activeTab === 'sold' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Sold Properties</h2>
                  <p className="text-sm text-gray-500 mt-1">Properties you&apos;ve successfully sold</p>
                </div>
                <div className="p-6">
                  {soldProperties.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-gray-500 mb-2">No sold properties yet</p>
                      <p className="text-sm text-gray-400">Complete viewings and mark properties as sold to see them here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {soldProperties.map(property => (
                        <div key={property.id} className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg text-gray-900">{property.title}</h4>
                              <p className="text-gray-600 text-sm">{property.address}, {property.city}</p>
                            </div>
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                              SOLD
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Price</p>
                              <p className="font-medium text-purple-700">{formatCurrency(property.price)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Bedrooms</p>
                              <p className="font-medium">{property.bedrooms}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Area</p>
                              <p className="font-medium">{property.sqft} sqm</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

            {/* Purchase Priority Queue */}
            {propertiesWithQueue.length > 0 && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Purchase Priority Queue</h2>
                  <p className="text-sm text-gray-500 mt-1">View customer priority order by property</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {propertiesWithQueue.map(propertyId => {
                      const property = getProperty(propertyId);
                      const queue = getPurchasePriorityQueue(propertyId);
                      const isExpanded = showQueueForProperty === propertyId;
                      
                      return (
                        <div key={propertyId} className="border rounded-lg">
                          <button
                            onClick={() => setShowQueueForProperty(isExpanded ? null : propertyId)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 rounded-lg"
                          >
                            <div className="text-left">
                              <h4 className="font-medium">{property?.title || 'Unknown Property'}</h4>
                              <p className="text-sm text-gray-500">{queue.length} customer{queue.length !== 1 ? 's' : ''} in queue</p>
                            </div>
                            <svg 
                              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {isExpanded && queue.length > 0 && (
                            <div className="px-4 pb-4">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-gray-600">#</th>
                                    <th className="px-3 py-2 text-left text-gray-600">Customer</th>
                                    <th className="px-3 py-2 text-left text-gray-600">Booked</th>
                                    <th className="px-3 py-2 text-left text-gray-600">Viewing</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {queue.map((appt, index) => {
                                    const customer = getCustomer(appt.customerId);
                                    return (
                                      <tr 
                                        key={appt.id} 
                                        className={`border-t ${index === 0 ? 'bg-green-50' : ''}`}
                                      >
                                        <td className="px-3 py-2">
                                          {index === 0 ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              1st
                                            </span>
                                          ) : (
                                            <span className="text-gray-600">{index + 1}</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 font-medium">
                                          {customer?.name || appt.customerName || 'Unknown'}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500">
                                          {formatRelativeTime(appt.createdAt)}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500">
                                          {formatDate(appt.date)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              <p className="mt-3 text-xs text-gray-500">
                                Priority is determined by booking timestamp (earliest first).
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metrics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">My Metrics</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Properties Sold</p>
                  <p className="text-3xl font-bold text-blue-800">{agent.salesCount}</p>
                </div>

                {agent.soldProperties.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">My Sold Properties</p>
                    <div className="space-y-2">
                      {getSoldProperties()
                        .filter(p => p.soldByAgentId === agent.id)
                        .slice(0, 3)
                        .map((prop) => (
                          <div key={prop.id} className="p-2 bg-gray-50 rounded-lg text-sm">
                            <p className="font-medium">{prop.title}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-green-600">{prop.salePrice ? formatCurrency(prop.salePrice) : formatCurrency(prop.price)}</span>
                              {prop.soldDate && (
                                <span className="text-xs text-gray-400">{formatDate(prop.soldDate)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">My Rating</h2>
              
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-yellow-500">{agent.rating.toFixed(1)}</p>
                <p className="text-yellow-500 text-lg">{generateStars(agent.rating)}</p>
              </div>

              {agent.latestRatings.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Latest Reviews</p>
                  <div className="space-y-3">
                    {agent.latestRatings.slice(0, 3).map(rating => (
                      <div key={rating.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{rating.customerName}</span>
                          <span className="text-yellow-500 text-sm">{generateStars(rating.rating)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{rating.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                {unreadNotifications.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadNotifications.length}
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {agentNotifications.length === 0 ? (
                  <p className="p-6 text-gray-500 text-center">No notifications</p>
                ) : (
                  agentNotifications.slice(0, 5).map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markNotificationRead}
                    />
                  ))
                )}
              </div>
            </div>

            {/* SMS Verification Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h2>
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                agent.smsVerified ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${
                    agent.smsVerified ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></span>
                  <span className={agent.smsVerified ? 'text-green-800' : 'text-yellow-800'}>
                    Phone {agent.smsVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                {!agent.smsVerified && (
                  <button
                    onClick={handleSmsVerify}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          property={getProperty(selectedAppointment.propertyId)}
          agent={agent}
          customer={getCustomer(selectedAppointment.customerId)}
          onClose={() => setSelectedAppointment(null)}
          mode="agent"
        />
      )}
    </div>
  );
}
