import { useState } from 'react';
import type { Appointment, Agent, Property } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTimeRange, formatRelativeTime, getInitials } from '../../utils/helpers';

interface CustomerAppointmentModalProps {
  appointment: Appointment;
  property: Property | undefined;
  agent: Agent | undefined;
  onClose: () => void;
}

export default function CustomerAppointmentModal({
  appointment,
  property,
  agent,
  onClose,
}: CustomerAppointmentModalProps) {
  const {
    currentUser,
    approveNewAgent,
    selectDifferentAgent,
    getAvailableAgentsForCustomer,
    canMessage,
    getMessagesByAppointment,
    sendMessage,
  } = useApp();

  const [showSelectAgent, setShowSelectAgent] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [showMessaging, setShowMessaging] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const messages = getMessagesByAppointment(appointment.id);
  const messagingEnabled = canMessage(appointment.id);
  const agentSmsVerified = agent?.smsVerified ?? false;
  const customerSmsVerified = currentUser?.smsVerified ?? false;

  // Get available agents for selection (excluding current and blacklisted)
  const excludeAgentIds = [
    appointment.agentId,
    ...(appointment.previousAgentId ? [appointment.previousAgentId] : [])
  ];
  const availableAgents = currentUser 
    ? getAvailableAgentsForCustomer(
        currentUser.id,
        appointment.date,
        appointment.startTime,
        appointment.endTime,
        excludeAgentIds
      )
    : [];

  const handleApproveAgent = () => {
    approveNewAgent(appointment.id);
    onClose();
  };

  const handleSelectDifferentAgent = () => {
    if (selectedAgentId) {
      selectDifferentAgent(appointment.id, selectedAgentId);
      onClose();
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(appointment.id, newMessage);
      setNewMessage('');
    }
  };

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
      case 'pending': return 'Awaiting Agent Confirmation';
      case 'pending_approval': return 'New Agent Assigned - Your Approval Required';
      case 'accepted': return 'Confirmed';
      case 'rejected': return 'Declined';
      case 'scheduled': return 'Scheduled';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
          role="button"
          aria-label="Close modal"
          tabIndex={-1}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-blue-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 id="modal-title" className="text-xl font-semibold text-white">Appointment Details</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* Status Banner */}
            <div className="mb-6">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(appointment.status)}`}>
                {getStatusLabel(appointment.status)}
              </span>
              <span className="ml-3 text-sm text-gray-500">
                Booked {formatRelativeTime(appointment.createdAt)}
              </span>
            </div>

            {/* Pending Approval Notice */}
            {appointment.status === 'pending_approval' && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-orange-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-orange-800">Action Required</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Your previous agent declined this viewing. A new agent ({agent?.name}) has been assigned.
                      Please approve this agent or select a different one.
                    </p>
                    {appointment.rejectionReason && (
                      <p className="text-sm text-orange-600 mt-2">
                        <strong>Reason:</strong> {appointment.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rejected Notice */}
            {appointment.status === 'rejected' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-red-800">Viewing Declined</h4>
                    <p className="text-sm text-red-700 mt-1">
                      {availableAgents.length > 0 
                        ? 'The agent was unable to accommodate your viewing. You can select a different agent below.'
                        : 'No agents are currently available for this time slot. Please book a different time.'}
                    </p>
                    {appointment.rejectionReason && (
                      <p className="text-sm text-red-600 mt-2">
                        <strong>Reason:</strong> {appointment.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Property Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Property</h3>
              <h4 className="text-lg font-semibold">{property?.title || 'Unknown Property'}</h4>
              <p className="text-gray-600">{property?.address}, {property?.city}</p>
              {property && (
                <p className="text-sm text-gray-500 mt-1">
                  {property.bedrooms} bed • {property.bathrooms} bath • {property.sqft} sqm
                </p>
              )}
            </div>

            {/* Booking Time */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-700 mb-2">Viewing Time</h3>
              <p className="text-lg font-semibold text-blue-900">
                {formatDate(appointment.date)}
              </p>
              <p className="text-blue-800">
                {formatTimeRange(appointment.startTime, appointment.endTime)}
              </p>
            </div>

            {/* Agent Info */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Assigned Agent</h3>
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {agent ? getInitials(agent.name) : '?'}
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{agent?.name || 'Unknown Agent'}</p>
                  {agent && (
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-500 text-sm">★ {agent.rating.toFixed(1)}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-gray-500 text-sm">{agent.salesCount} sales</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Agent Actions for pending_approval or rejected status */}
            {(appointment.status === 'pending_approval' || (appointment.status === 'rejected' && availableAgents.length > 0)) && (
              <div className="mb-6">
                {appointment.status === 'pending_approval' && (
                  <div className="flex space-x-3 mb-4">
                    <button
                      onClick={handleApproveAgent}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Approve {agent?.name}
                    </button>
                    <button
                      onClick={() => setShowSelectAgent(!showSelectAgent)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Select Different Agent
                    </button>
                  </div>
                )}

                {(showSelectAgent || appointment.status === 'rejected') && availableAgents.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">Available Agents</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                      {availableAgents.map(a => (
                        <button
                          key={a.id}
                          onClick={() => setSelectedAgentId(a.id)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                            selectedAgentId === a.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                              {getInitials(a.name)}
                            </div>
                            <div>
                              <p className="font-medium">{a.name}</p>
                              <p className="text-sm text-gray-500">
                                ★ {a.rating.toFixed(1)} • {a.salesCount} sales
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSelectDifferentAgent}
                      disabled={!selectedAgentId}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm Selection
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Messaging Section - Only for accepted/scheduled */}
            {(appointment.status === 'accepted' || appointment.status === 'scheduled') && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-500">Messages</h3>
                  <button
                    onClick={() => setShowMessaging(!showMessaging)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showMessaging ? 'Hide' : 'Show'} Messages
                  </button>
                </div>

                {!messagingEnabled && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Messaging requires both customer and agent to verify their phone via SMS.
                      {!agentSmsVerified && !customerSmsVerified && ' Neither party has verified yet.'}
                      {!agentSmsVerified && customerSmsVerified && ' Agent verification pending.'}
                      {agentSmsVerified && !customerSmsVerified && ' Please verify your phone to enable messaging.'}
                    </p>
                  </div>
                )}

                {showMessaging && messagingEnabled && (
                  <div className="border rounded-lg">
                    <div className="max-h-48 overflow-y-auto p-3 space-y-2 bg-gray-50">
                      {messages.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4">No messages yet. Start a conversation!</p>
                      ) : (
                        messages.map(msg => (
                          <div
                            key={msg.id}
                            className={`p-2 rounded-lg max-w-[80%] ${
                              msg.senderId === currentUser?.id
                                ? 'bg-blue-100 ml-auto'
                                : 'bg-white'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatRelativeTime(msg.createdAt)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t bg-white flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Race Logic Notice */}
            {!appointment.hasPurchaseRights && appointment.status !== 'cancelled' && appointment.status !== 'rejected' && (
              <div className="mb-6 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                <strong>Note:</strong> Another customer has priority purchase rights for this property. 
                You may view but cannot purchase unless they decline.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
