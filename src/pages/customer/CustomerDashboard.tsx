import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTimeRange, getInitials } from '../../utils/helpers';
import CustomerAppointmentModal from '../../components/common/CustomerAppointmentModal';
import type { Appointment } from '../../types';

type TabStatus = 'all' | 'accepted' | 'pending' | 'rejected';

export default function CustomerDashboard() {
  const { 
    currentUser, 
    appointments, 
    properties, 
    agents, 
    getNotificationsByUser,
    markNotificationRead
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Redirect if not logged in as customer
  if (!currentUser || currentUser.role !== 'customer') {
    return <Navigate to="/login" replace />;
  }

  const customerAppointments = appointments.filter(a => a.customerId === currentUser.id);
  const customerNotifications = getNotificationsByUser(currentUser.id);
  const unreadNotifications = customerNotifications.filter(n => !n.read);

  const getProperty = (id: string) => properties.find(p => p.id === id);
  const getAgent = (id: string) => agents.find(a => a.id === id);

  // Count appointments by status
  const acceptedCount = customerAppointments.filter(a => a.status === 'accepted' || a.status === 'scheduled').length;
  const pendingCount = customerAppointments.filter(a => a.status === 'pending' || a.status === 'pending_approval').length;
  const rejectedCount = customerAppointments.filter(a => a.status === 'rejected').length;

  // Filter appointments based on active tab
  const filteredAppointments = customerAppointments.filter(a => {
    if (activeTab === 'all') return a.status !== 'cancelled' && a.status !== 'completed';
    if (activeTab === 'accepted') return a.status === 'accepted' || a.status === 'scheduled';
    if (activeTab === 'pending') return a.status === 'pending' || a.status === 'pending_approval';
    if (activeTab === 'rejected') return a.status === 'rejected';
    return true;
  });

  // Sort by date (soonest first)
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  const pastAppointments = customerAppointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'pending_approval': return 'bg-orange-100 text-orange-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting Confirmation';
      case 'pending_approval': return 'Approval Required';
      case 'accepted': return 'Confirmed';
      case 'rejected': return 'Declined';
      case 'scheduled': return 'Scheduled';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const tabs = [
    { id: 'all' as TabStatus, label: 'All', count: customerAppointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed').length },
    { id: 'accepted' as TabStatus, label: 'Accepted', count: acceptedCount },
    { id: 'pending' as TabStatus, label: 'Pending', count: pendingCount },
    { id: 'rejected' as TabStatus, label: 'Rejected', count: rejectedCount },
  ];

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
            {/* Status Tabs */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-4 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-600'
                            : tab.id === 'pending' && pendingCount > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : tab.id === 'rejected' && rejectedCount > 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Appointments List */}
              <div className="p-6">
                {sortedAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 mb-4">
                      {activeTab === 'all' && 'No appointments yet'}
                      {activeTab === 'accepted' && 'No confirmed appointments'}
                      {activeTab === 'pending' && 'No pending appointments'}
                      {activeTab === 'rejected' && 'No declined appointments'}
                    </p>
                    <Link
                      to="/properties"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Browse Properties
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedAppointments.map(appointment => {
                      const property = getProperty(appointment.propertyId);
                      const agent = getAgent(appointment.agentId);

                      return (
                        <div 
                          key={appointment.id} 
                          onClick={() => setSelectedAppointment(appointment)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            appointment.status === 'pending_approval' 
                              ? 'border-orange-300 bg-orange-50 hover:border-orange-400' 
                              : appointment.status === 'rejected'
                              ? 'border-red-200 bg-red-50 hover:border-red-300'
                              : 'hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg text-gray-900">
                                {property?.title}
                              </h4>
                              <p className="text-gray-600 text-sm">{property?.address}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusBadgeColor(appointment.status)}`}>
                                {getStatusLabel(appointment.status)}
                              </span>
                              {!appointment.hasPurchaseRights && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  Viewing Only
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Date & Time</p>
                              <p className="font-medium">
                                {formatDate(appointment.date)}
                                <br />
                                {formatTimeRange(appointment.startTime, appointment.endTime)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Agent</p>
                              <div className="flex items-center mt-1">
                                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs mr-2">
                                  {agent ? getInitials(agent.name) : '?'}
                                </div>
                                <span className="font-medium">{agent?.name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action hint */}
                          {appointment.status === 'pending_approval' && (
                            <div className="mt-3 pt-3 border-t border-orange-200">
                              <p className="text-sm text-orange-700 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Click to approve new agent or select different
                              </p>
                            </div>
                          )}

                          {appointment.status === 'rejected' && (
                            <div className="mt-3 pt-3 border-t border-red-200">
                              <p className="text-sm text-red-700 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Click to view options
                              </p>
                            </div>
                          )}

                          {(appointment.status === 'accepted' || appointment.status === 'scheduled' || appointment.status === 'pending') && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-sm text-blue-600">Click to view details & chat</p>
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
                        <div 
                          key={appointment.id} 
                          onClick={() => setSelectedAppointment(appointment)}
                          className="flex items-center justify-between py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
                        >
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

            {/* SMS Verification Status */}
            {!currentUser.smsVerified && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h2>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                    <span className="text-yellow-800 text-sm">Phone Not Verified</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    Verify your phone to enable messaging with agents.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <CustomerAppointmentModal
          appointment={selectedAppointment}
          property={getProperty(selectedAppointment.propertyId)}
          agent={getAgent(selectedAppointment.agentId)}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}
