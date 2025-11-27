import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTimeRange, formatRelativeTime, getInitials } from '../../utils/helpers';

export default function AdminDashboard() {
  const {
    currentUser,
    appointments,
    properties,
    agents,
    adminAlerts,
    resolveAlert,
    createOverride,
  } = useApp();

  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [overrideAgentId, setOverrideAgentId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [resolutionText, setResolutionText] = useState<string>('');
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);

  // Redirect if not logged in as admin
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const getProperty = (id: string) => properties.find(p => p.id === id);
  const getAgent = (id: string) => agents.find(a => a.id === id);

  const pendingAlerts = adminAlerts.filter(a => a.status === 'pending');
  const resolvedAlerts = adminAlerts.filter(a => a.status === 'resolved');
  const activeAppointments = appointments.filter(a => a.status === 'scheduled');

  const handleOverride = () => {
    if (selectedAppointment && overrideAgentId && overrideReason) {
      createOverride(selectedAppointment, overrideAgentId, overrideReason);
      setSelectedAppointment(null);
      setOverrideAgentId('');
      setOverrideReason('');
    }
  };

  const handleResolveAlert = (alertId: string) => {
    if (resolutionText) {
      resolveAlert(alertId, resolutionText, currentUser.id);
      setResolvingAlertId(null);
      setResolutionText('');
    }
  };

  const alertTypeColors: Record<string, string> = {
    complaint: 'bg-red-100 text-red-800',
    timeout: 'bg-orange-100 text-orange-800',
    manual_override: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage assignments, overrides, and alerts</p>
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
                <h2 className="text-xl font-semibold text-gray-900">Active Assignments</h2>
                <p className="text-sm text-gray-500 mt-1">Override agent assignments if needed</p>
              </div>
              <div className="p-6">
                {activeAppointments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No active appointments</p>
                ) : (
                  <div className="space-y-4">
                    {activeAppointments.map(appointment => {
                      const property = getProperty(appointment.propertyId);
                      const agent = getAgent(appointment.agentId);
                      
                      return (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{property?.title}</h4>
                              <p className="text-sm text-gray-500">
                                {formatDate(appointment.date)} at {formatTimeRange(appointment.startTime, appointment.endTime)}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm mr-2">
                                {agent ? getInitials(agent.name) : '?'}
                              </div>
                              <span className="text-sm font-medium">{agent?.name}</span>
                            </div>
                          </div>

                          {selectedAppointment === appointment.id ? (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <h5 className="font-medium text-sm mb-2">Manual Override</h5>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">New Agent</label>
                                  <select
                                    value={overrideAgentId}
                                    onChange={(e) => setOverrideAgentId(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                                  >
                                    <option value="">Select agent...</option>
                                    {agents
                                      .filter(a => a.id !== appointment.agentId && !a.isOnVacation)
                                      .map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
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
                                    onClick={() => {
                                      setSelectedAppointment(null);
                                      setOverrideAgentId('');
                                      setOverrideReason('');
                                    }}
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-md"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleOverride}
                                    disabled={!overrideAgentId || !overrideReason}
                                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                                  >
                                    Apply Override
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedAppointment(appointment.id)}
                              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                            >
                              Override Assignment
                            </button>
                          )}
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
                      <span className="text-sm">{agent.name}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
