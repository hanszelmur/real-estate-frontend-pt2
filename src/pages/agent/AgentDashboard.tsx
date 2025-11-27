import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Agent, AgentAvailability } from '../../types';
import { formatDate, formatTimeRange, generateStars } from '../../utils/helpers';
import NotificationItem from '../../components/common/NotificationItem';

export default function AgentDashboard() {
  const {
    currentUser,
    appointments,
    properties,
    toggleAgentVacation,
    updateAgentAvailability,
    getNotificationsByUser,
    markNotificationRead,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Redirect if not logged in as agent
  if (!currentUser || currentUser.role !== 'agent') {
    return <Navigate to="/login" replace />;
  }

  const agent = currentUser as Agent;
  const agentNotifications = getNotificationsByUser(agent.id);
  const unreadNotifications = agentNotifications.filter(n => !n.read);

  // Get agent's appointments
  const agentAppointments = appointments.filter(a => a.agentId === agent.id && a.status === 'scheduled');
  
  // Get property info
  const getProperty = (id: string) => properties.find(p => p.id === id);

  // Group availability by date
  const groupedAvailability: Record<string, AgentAvailability[]> = {};
  agent.availability.forEach(slot => {
    if (!groupedAvailability[slot.date]) {
      groupedAvailability[slot.date] = [];
    }
    groupedAvailability[slot.date].push(slot);
  });

  const dates = Object.keys(groupedAvailability).sort().slice(0, 14);

  const toggleSlotAvailability = (slotId: string, isBooked: boolean) => {
    updateAgentAvailability(agent.id, slotId, !isBooked);
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
              </div>
              <div className="p-6">
                {agentAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">No upcoming appointments</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agentAppointments.map(appointment => {
                      const property = getProperty(appointment.propertyId);
                      
                      return (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">{property?.title}</h4>
                              <p className="text-gray-600 text-sm">{property?.address}</p>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Scheduled
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar / Availability */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">My Availability</h2>
                <p className="text-sm text-gray-500 mt-1">Click a slot to toggle availability</p>
              </div>
              <div className="p-6">
                {/* Date tabs */}
                <div className="flex overflow-x-auto space-x-2 pb-4 mb-4 border-b">
                  {dates.map(date => {
                    const d = new Date(date);
                    const isSelected = selectedDate === date;
                    const daySlots = groupedAvailability[date] || [];
                    const hasBooking = daySlots.some(s => s.isBooked && s.bookingId);
                    
                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-center transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : hasBooking
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <p className="text-xs font-medium">
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-lg font-bold">{d.getDate()}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Time slots */}
                {selectedDate ? (
                  <div>
                    <h3 className="font-medium mb-3">{formatDate(selectedDate)}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(groupedAvailability[selectedDate] || []).map(slot => {
                        const hasAppointment = appointments.some(
                          a => a.agentId === agent.id && a.date === slot.date && 
                               a.startTime === slot.startTime && a.status === 'scheduled'
                        );
                        
                        return (
                          <button
                            key={slot.id}
                            onClick={() => !hasAppointment && toggleSlotAvailability(slot.id, slot.isBooked)}
                            disabled={hasAppointment}
                            className={`p-3 rounded-lg text-sm transition-colors ${
                              hasAppointment
                                ? 'bg-red-100 text-red-800 cursor-not-allowed'
                                : slot.isBooked
                                ? 'bg-gray-200 text-gray-500'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            <p className="font-medium">{formatTimeRange(slot.startTime, slot.endTime)}</p>
                            <p className="text-xs mt-1">
                              {hasAppointment ? 'Booked' : slot.isBooked ? 'Blocked' : 'Available'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Select a date to view time slots</p>
                )}
              </div>
            </div>
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
                    <p className="text-sm text-gray-500 mb-2">Recent Sales</p>
                    <ul className="text-sm space-y-1">
                      {agent.soldProperties.slice(0, 3).map((propId, index) => (
                        <li key={index} className="text-gray-700">• Property #{propId}</li>
                      ))}
                    </ul>
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
          </div>
        </div>
      </div>
    </div>
  );
}
