import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTimeRange, getInitials } from '../../utils/helpers';
import AgentCard from '../../components/common/AgentCard';
import type { Agent } from '../../types';

export default function CustomerDashboard() {
  const { 
    currentUser, 
    appointments, 
    properties, 
    agents, 
    getAvailableAgents,
    changeAgent,
    cancelAppointment,
    getNotificationsByUser,
    markNotificationRead
  } = useApp();

  const [changingAgentFor, setChangingAgentFor] = useState<string | null>(null);
  const [selectedNewAgent, setSelectedNewAgent] = useState<Agent | null>(null);

  // Redirect if not logged in as customer
  if (!currentUser || currentUser.role !== 'customer') {
    return <Navigate to="/login" replace />;
  }

  const customerAppointments = appointments.filter(a => a.customerId === currentUser.id);
  const customerNotifications = getNotificationsByUser(currentUser.id);
  const unreadNotifications = customerNotifications.filter(n => !n.read);
  const availableAgents = getAvailableAgents();

  const getProperty = (id: string) => properties.find(p => p.id === id);
  const getAgent = (id: string) => agents.find(a => a.id === id);

  const handleChangeAgent = (appointmentId: string) => {
    if (selectedNewAgent) {
      changeAgent(appointmentId, selectedNewAgent.id);
      setChangingAgentFor(null);
      setSelectedNewAgent(null);
    }
  };

  const handleCancelAppointment = (appointmentId: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      cancelAppointment(appointmentId);
    }
  };

  const activeAppointments = customerAppointments.filter(a => a.status === 'scheduled');
  const pastAppointments = customerAppointments.filter(a => a.status !== 'scheduled');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {currentUser.name}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Appointments */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Viewings</h2>
              </div>
              <div className="p-6">
                {activeAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 mb-4">No upcoming viewings scheduled</p>
                    <Link
                      to="/properties"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Browse Properties
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeAppointments.map(appointment => {
                      const property = getProperty(appointment.propertyId);
                      const agent = getAgent(appointment.agentId);

                      return (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <Link
                                to={`/properties/${appointment.propertyId}`}
                                className="font-semibold text-lg text-blue-600 hover:underline"
                              >
                                {property?.title}
                              </Link>
                              <p className="text-gray-600 text-sm">{property?.address}</p>
                            </div>
                            {!appointment.hasPurchaseRights && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Viewing Only
                              </span>
                            )}
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Date & Time</p>
                              <p className="font-medium">
                                {formatDate(appointment.date)}
                                <br />
                                {formatTimeRange(appointment.startTime, appointment.endTime)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Agent</p>
                              <div className="flex items-center mt-1">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm mr-2">
                                  {agent ? getInitials(agent.name) : '?'}
                                </div>
                                <span className="font-medium">{agent?.name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Race Logic Notice */}
                          {!appointment.hasPurchaseRights && (
                            <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                              <strong>Note:</strong> Another customer has priority purchase rights. 
                              You may view but cannot purchase unless they decline.
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setChangingAgentFor(appointment.id);
                                setSelectedNewAgent(null);
                              }}
                              className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                            >
                              Change Agent
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                            >
                              Cancel
                            </button>
                          </div>

                          {/* Change Agent Modal */}
                          {changingAgentFor === appointment.id && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium mb-3">Select New Agent</h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                                {availableAgents
                                  .filter(a => a.id !== appointment.agentId)
                                  .map(agent => (
                                    <AgentCard
                                      key={agent.id}
                                      agent={agent}
                                      selected={selectedNewAgent?.id === agent.id}
                                      onSelect={setSelectedNewAgent}
                                    />
                                  ))}
                              </div>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setChangingAgentFor(null)}
                                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleChangeAgent(appointment.id)}
                                  disabled={!selectedNewAgent}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Confirm Change
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Past Viewings</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {pastAppointments.map(appointment => {
                      const property = getProperty(appointment.propertyId);
                      
                      return (
                        <div key={appointment.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                          <div>
                            <p className="font-medium">{property?.title}</p>
                            <p className="text-sm text-gray-500">{formatDate(appointment.date)}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                            appointment.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status}
                          </span>
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
              <div className="max-h-96 overflow-y-auto">
                {customerNotifications.length === 0 ? (
                  <p className="p-6 text-gray-500 text-center">No notifications</p>
                ) : (
                  customerNotifications.slice(0, 5).map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 ${!notification.read ? 'bg-blue-50' : ''}`}
                    >
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationRead(notification.id)}
                          className="text-xs text-blue-600 mt-2"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/properties"
                  className="block w-full py-2 px-4 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Browse Properties
                </Link>
                <Link
                  to="/about"
                  className="block w-full py-2 px-4 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
