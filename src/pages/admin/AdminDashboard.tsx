import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTimeRange, formatRelativeTime, getInitials, formatCurrency } from '../../utils/helpers';
import type { Appointment } from '../../types';
import AppointmentDetailModal from '../../components/common/AppointmentDetailModal';

export default function AdminDashboard() {
  const {
    currentUser,
    appointments,
    properties,
    agents,
    users,
    adminAlerts,
    resolveAlert,
    getAgentsFreeForSlot,
    hasAgentConflict,
    createOverride,
    getSoldProperties,
    getPurchasePriorityQueue,
  } = useApp();

  const [selectedAppointmentForOverride, setSelectedAppointmentForOverride] = useState<string | null>(null);
  const [selectedAppointmentForDetail, setSelectedAppointmentForDetail] = useState<Appointment | null>(null);
  const [overrideAgentId, setOverrideAgentId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [resolutionText, setResolutionText] = useState<string>('');
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Redirect if not logged in as admin
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const getProperty = (id: string) => properties.find(p => p.id === id);
  const getAgent = (id: string) => agents.find(a => a.id === id);
  const getCustomer = (id: string) => users.find(u => u.id === id);

  const pendingAlerts = adminAlerts.filter(a => a.status === 'pending');
  const resolvedAlerts = adminAlerts.filter(a => a.status === 'resolved');
  
  // Get all active appointments (not cancelled or completed)
  const activeAppointments = appointments.filter(a => 
    a.status === 'scheduled' || a.status === 'pending' || a.status === 'accepted'
  );
  
  // Filter appointments based on status
  const filteredAppointments = filterStatus === 'all' 
    ? activeAppointments 
    : activeAppointments.filter(a => a.status === filterStatus);

  const handleOverride = (appointmentId: string) => {
    if (!overrideAgentId || !overrideReason) return;
    
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    // Check for double-booking
    if (hasAgentConflict(overrideAgentId, appointment.date, appointment.startTime, appointment.endTime, appointmentId)) {
      setOverrideError('Cannot assign this agent - they have a conflicting appointment at this time.');
      return;
    }

    setOverrideError(null);
    createOverride(appointmentId, overrideAgentId, overrideReason);
    setSelectedAppointmentForOverride(null);
    setOverrideAgentId('');
    setOverrideReason('');
  };

  const handleResolveAlert = (alertId: string) => {
    if (resolutionText) {
      resolveAlert(alertId, resolutionText, currentUser.id);
      setResolvingAlertId(null);
      setResolutionText('');
    }
  };

  // Get available agents for a specific appointment slot
  const getAvailableAgentsForAppointment = (appointment: Appointment) => {
    return getAgentsFreeForSlot(
      appointment.date,
      appointment.startTime,
      appointment.endTime,
      appointment.id
    ).filter(a => a.id !== appointment.agentId);
  };

  const alertTypeColors: Record<string, string> = {
    complaint: 'bg-red-100 text-red-800',
    timeout: 'bg-orange-100 text-orange-800',
    manual_override: 'bg-purple-100 text-purple-800',
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage assignments, overrides, and global availability control</p>
            </div>
            <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm">
              Internal Admin Panel
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alert Panel */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Alerts</h2>
                {pendingAlerts.length > 0 && (
                  <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                    {pendingAlerts.length} Pending
                  </span>
                )}
              </div>
              <div className="p-6">
                {pendingAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-green-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500">No pending alerts</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAlerts.map(alert => (
                      <div key={alert.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${alertTypeColors[alert.type]}`}>
                              {alert.type.replace('_', ' ')}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">
                              {formatRelativeTime(alert.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{alert.description}</p>
                        
                        {resolvingAlertId === alert.id ? (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Resolution Notes
                            </label>
                            <textarea
                              value={resolutionText}
                              onChange={(e) => setResolutionText(e.target.value)}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                              rows={2}
                              placeholder="Enter resolution details..."
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                              <button
                                onClick={() => setResolvingAlertId(null)}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleResolveAlert(alert.id)}
                                disabled={!resolutionText}
                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                              >
                                Mark Resolved
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResolvingAlertId(alert.id)}
                            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                          >
                            Resolve Alert
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Management */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">All Appointments</h2>
                    <p className="text-sm text-gray-500 mt-1">Click on any appointment to view details or override assignment</p>
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
              <div className="p-6">
                {filteredAppointments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No appointments found</p>
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map(appointment => {
                      const property = getProperty(appointment.propertyId);
                      const agent = getAgent(appointment.agentId);
                      const customer = getCustomer(appointment.customerId);
                      const availableAgentsForSlot = getAvailableAgentsForAppointment(appointment);
                      
                      return (
                        <div 
                          key={appointment.id} 
                          className="border rounded-lg p-4 hover:border-blue-400 cursor-pointer transition-colors"
                          onClick={() => setSelectedAppointmentForDetail(appointment)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{property?.title}</h4>
                              <p className="text-sm text-gray-500">
                                {formatDate(appointment.date)} at {formatTimeRange(appointment.startTime, appointment.endTime)}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Customer: {customer?.name || appointment.customerName || 'Unknown'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusBadgeColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                              <div className="flex items-center mt-2">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs mr-1">
                                  {agent ? getInitials(agent.name) : '?'}
                                </div>
                                <span className="text-sm">{agent?.name}</span>
                              </div>
                            </div>
                          </div>

                          {selectedAppointmentForOverride === appointment.id && (
                            <div 
                              className="mt-3 p-3 bg-gray-50 rounded-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <h5 className="font-medium text-sm mb-2">Manual Override</h5>
                              
                              {overrideError && (
                                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <p className="text-sm text-red-700">{overrideError}</p>
                                </div>
                              )}
                              
                              {availableAgentsForSlot.length === 0 ? (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <p className="text-sm text-red-700">
                                    No agents are available for this time slot. All agents either have conflicting appointments or are on vacation.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm text-gray-700 mb-1">
                                      New Agent (Only showing agents free for this slot)
                                    </label>
                                    <select
                                      value={overrideAgentId}
                                      onChange={(e) => {
                                        setOverrideAgentId(e.target.value);
                                        setOverrideError(null);
                                      }}
                                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                                    >
                                      <option value="">Select available agent...</option>
                                      {availableAgentsForSlot.map(a => (
                                        <option key={a.id} value={a.id}>
                                          {a.name} (Rating: {a.rating})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-700 mb-1">Reason</label>
                                    <input
                                      type="text"
                                      value={overrideReason}
                                      onChange={(e) => setOverrideReason(e.target.value)}
                                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                                      placeholder="Reason for override..."
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAppointmentForOverride(null);
                                        setOverrideAgentId('');
                                        setOverrideReason('');
                                        setOverrideError(null);
                                      }}
                                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOverride(appointment.id);
                                      }}
                                      disabled={!overrideAgentId || !overrideReason}
                                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                                    >
                                      Apply Override
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointmentForDetail(appointment);
                              }}
                              className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                            >
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointmentForOverride(
                                  selectedAppointmentForOverride === appointment.id ? null : appointment.id
                                );
                                setOverrideAgentId('');
                                setOverrideReason('');
                                setOverrideError(null);
                              }}
                              className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                            >
                              {selectedAppointmentForOverride === appointment.id ? 'Cancel Override' : 'Override'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-red-800">Pending Alerts</span>
                  <span className="text-2xl font-bold text-red-600">{pendingAlerts.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-800">Pending Bookings</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {appointments.filter(a => a.status === 'pending').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800">Active Appointments</span>
                  <span className="text-2xl font-bold text-blue-600">{activeAppointments.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800">Available Agents</span>
                  <span className="text-2xl font-bold text-green-600">
                    {agents.filter(a => !a.isOnVacation).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Resolved Alerts */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Resolutions</h2>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {resolvedAlerts.length === 0 ? (
                  <p className="p-6 text-gray-500 text-center">No resolved alerts yet</p>
                ) : (
                  resolvedAlerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="p-4 border-b last:border-b-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${alertTypeColors[alert.type]}`}>
                          {alert.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {alert.resolvedAt && formatRelativeTime(alert.resolvedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.resolution}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Agent Status */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Agent Status</h2>
              </div>
              <div className="p-4 space-y-3">
                {agents.map(agent => (
                  <div key={agent.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm mr-2">
                        {getInitials(agent.name)}
                      </div>
                      <div>
                        <span className="text-sm block">{agent.name}</span>
                        <span className={`text-xs ${agent.smsVerified ? 'text-green-600' : 'text-gray-400'}`}>
                          {agent.smsVerified ? '✓ SMS Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      agent.isOnVacation 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {agent.isOnVacation ? 'On Vacation' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sold Properties */}
            {getSoldProperties().length > 0 && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Sold Properties</h2>
                </div>
                <div className="p-4 space-y-3">
                  {getSoldProperties().map(property => {
                    const soldByAgent = agents.find(a => a.id === property.soldByAgentId);
                    return (
                      <div key={property.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm">{property.title}</p>
                        <p className="text-xs text-gray-500">{property.address}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-green-600 font-medium">
                            {property.salePrice ? formatCurrency(property.salePrice) : formatCurrency(property.price)}
                          </span>
                          {soldByAgent && (
                            <span className="text-xs text-gray-500">
                              Sold by {soldByAgent.name}
                            </span>
                          )}
                        </div>
                        {property.soldDate && (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(property.soldDate)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Property Purchase Queues */}
            {properties.filter(p => p.status === 'pending').length > 0 && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Purchase Queues</h2>
                </div>
                <div className="p-4 space-y-3">
                  {properties.filter(p => p.status === 'pending').map(property => {
                    const queue = getPurchasePriorityQueue(property.id);
                    return (
                      <div key={property.id} className="p-3 bg-blue-50 rounded-lg">
                        <p className="font-medium text-sm">{property.title}</p>
                        <p className="text-xs text-gray-500">{queue.length} customer{queue.length !== 1 ? 's' : ''} in queue</p>
                        {queue.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {queue.slice(0, 3).map((appt, idx) => {
                              const customer = getCustomer(appt.customerId);
                              return (
                                <div key={appt.id} className="flex items-center text-xs">
                                  <span className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center text-white ${
                                    idx === 0 ? 'bg-green-500' : 'bg-gray-400'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span>{customer?.name || 'Unknown'}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointmentForDetail && (
        <AppointmentDetailModal
          appointment={selectedAppointmentForDetail}
          property={getProperty(selectedAppointmentForDetail.propertyId)}
          agent={getAgent(selectedAppointmentForDetail.agentId)}
          customer={getCustomer(selectedAppointmentForDetail.customerId)}
          onClose={() => setSelectedAppointmentForDetail(null)}
          mode="admin"
        />
      )}
    </div>
  );
}
