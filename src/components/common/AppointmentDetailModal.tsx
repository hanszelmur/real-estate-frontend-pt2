import { useState } from 'react';
import type { Appointment, Agent, Property, User } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTime, formatRelativeTime, getInitials } from '../../utils/helpers';

interface AppointmentDetailModalProps {
  appointment: Appointment;
  property: Property | undefined;
  agent: Agent | undefined;
  customer: User | undefined;
  onClose: () => void;
  mode: 'agent' | 'admin';
}

export default function AppointmentDetailModal({
  appointment,
  property,
  agent,
  customer,
  onClose,
  mode,
}: AppointmentDetailModalProps) {
  const {
    currentUser,
    acceptAppointment,
    rejectAppointment,
    updateAppointment,
    createOverride,
    hasAgentConflict,
    getAgentsFreeForSlot,
    canMessage,
    getMessagesByAppointment,
    sendMessage,
    markAppointmentDone,
    markAppointmentSold,
    markPropertySoldOrRented,
  } = useApp();

  const [showOverride, setShowOverride] = useState(false);
  const [overrideAgentId, setOverrideAgentId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [notes, setNotes] = useState(appointment.notes || '');
  const [showMessaging, setShowMessaging] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const [showSoldConfirm, setShowSoldConfirm] = useState(false);

  const messages = getMessagesByAppointment(appointment.id);
  const messagingEnabled = canMessage(appointment.id);
  const agentSmsVerified = agent?.smsVerified ?? false;
  const customerSmsVerified = customer?.smsVerified ?? false;

  // Get available agents for the appointment slot (for admin override)
  const availableAgentsForSlot = getAgentsFreeForSlot(
    appointment.date,
    appointment.startTime,
    appointment.endTime,
    appointment.id
  ).filter(a => a.id !== appointment.agentId);

  const handleAccept = () => {
    acceptAppointment(appointment.id);
    onClose();
  };

  const handleReject = () => {
    rejectAppointment(appointment.id, rejectReason);
    onClose();
  };

  const handleOverride = () => {
    if (!overrideAgentId || !overrideReason) return;
    
    // Check for double-booking
    if (hasAgentConflict(overrideAgentId, appointment.date, appointment.startTime, appointment.endTime, appointment.id)) {
      setErrorMessage('Cannot assign this agent - they have a conflicting appointment at this time.');
      return;
    }
    
    setErrorMessage(null);
    createOverride(appointment.id, overrideAgentId, overrideReason);
    setShowOverride(false);
    setOverrideAgentId('');
    setOverrideReason('');
    onClose();
  };

  const handleSaveNotes = () => {
    updateAppointment(appointment.id, { notes });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(appointment.id, newMessage);
      setNewMessage('');
    }
  };

  const handleMarkDone = () => {
    markAppointmentDone(appointment.id);
    onClose();
  };

  const handleMarkSold = () => {
    if (!property || !currentUser) return;
    
    // Determine if this is a rental or sale
    const status: 'sold' | 'rented' = property.listingType === 'rent' ? 'rented' : 'sold';
    
    // Use the new unified function
    markPropertySoldOrRented(property.id, status, currentUser.id);
    
    // Also mark the appointment as sold (using existing function for compatibility)
    markAppointmentSold(appointment.id);
    onClose();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'done': return 'bg-gray-100 text-gray-800';
      case 'sold': return 'bg-purple-100 text-purple-800';
      case 'rented': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Agent can only see customer contact info if:
  // 1. They are SMS verified AND
  // 2. Customer is SMS verified AND
  // 3. Appointment is accepted
  const canAgentSeeContact = mode === 'agent' && 
    appointment.status === 'accepted' && 
    agentSmsVerified && 
    customerSmsVerified;

  // Admin can always see contact info
  const canSeeContactInfo = mode === 'admin' || canAgentSeeContact;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-blue-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Appointment Details</h2>
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
            <div className="mb-6 flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeColor(appointment.status)}`}>
                {appointment.status}
              </span>
              <span className="text-sm text-gray-500">
                Booked {formatRelativeTime(appointment.createdAt)}
              </span>
            </div>

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
              <h3 className="text-sm font-medium text-blue-700 mb-2">Booking Time</h3>
              <p className="text-lg font-semibold text-blue-900">
                {formatDate(appointment.date)}
              </p>
              <p className="text-blue-800">
                {formatTime(appointment.startTime)}
              </p>
            </div>

            {/* Customer Info */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Customer Information</h3>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {customer ? getInitials(customer.name) : '?'}
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{customer?.name || appointment.customerName || 'Unknown Customer'}</p>
                  
                  {canSeeContactInfo ? (
                    <>
                      <p className="text-gray-600">
                        <span className="inline-block w-16 text-sm text-gray-500">Email:</span>
                        {customer?.email || appointment.customerEmail}
                      </p>
                      <p className="text-gray-600">
                        <span className="inline-block w-16 text-sm text-gray-500">Phone:</span>
                        {customer?.phone || appointment.customerPhone}
                      </p>
                    </>
                  ) : (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700">
                        {!agentSmsVerified && !customerSmsVerified ? (
                          'Contact info hidden. Both you and the customer need SMS verification to view contact details.'
                        ) : !agentSmsVerified ? (
                          'Contact info hidden. Verify your phone number via SMS to view.'
                        ) : !customerSmsVerified ? (
                          'Contact info hidden. Customer has not verified their phone number.'
                        ) : appointment.status !== 'accepted' ? (
                          'Contact info will be visible after you accept the appointment.'
                        ) : (
                          'Contact info unavailable.'
                        )}
                      </p>
                    </div>
                  )}

                  {/* SMS Verification Status Indicators */}
                  <div className="mt-2 flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      customerSmsVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {customerSmsVerified ? '✓' : '○'} SMS {customerSmsVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Info (for Admin) */}
            {mode === 'admin' && agent && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Assigned Agent</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {getInitials(agent.name)}
                    </div>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-gray-500">{agent.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowOverride(!showOverride);
                      setErrorMessage(null);
                    }}
                    className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                  >
                    Override Assignment
                  </button>
                </div>

                {/* Override Panel */}
                {showOverride && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-3">Manual Override</h4>
                    
                    {errorMessage && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{errorMessage}</p>
                      </div>
                    )}
                    
                    {availableAgentsForSlot.length === 0 ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          No agents are available for this time slot. All agents either have conflicting appointments or are on vacation.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-3">
                          <label className="block text-sm text-gray-700 mb-1">Select New Agent</label>
                          <select
                            value={overrideAgentId}
                            onChange={(e) => {
                              setOverrideAgentId(e.target.value);
                              setErrorMessage(null);
                            }}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm p-2 border"
                          >
                            <option value="">Select an available agent...</option>
                            {availableAgentsForSlot.map(a => (
                              <option key={a.id} value={a.id}>
                                {a.name} (Rating: {a.rating})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="block text-sm text-gray-700 mb-1">Reason for Override</label>
                          <input
                            type="text"
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm p-2 border"
                            placeholder="Enter reason..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setShowOverride(false)}
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
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notes Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border"
                rows={3}
                placeholder="Add notes about this appointment..."
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Notes
                </button>
              </div>
            </div>

            {/* Messaging Section */}
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
                      {agentSmsVerified && !customerSmsVerified && ' Customer verification pending.'}
                    </p>
                  </div>
                )}

                {showMessaging && messagingEnabled && (
                  <div className="border rounded-lg">
                    <div className="max-h-48 overflow-y-auto p-3 space-y-2 bg-gray-50">
                      {messages.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4">No messages yet</p>
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

            {/* Agent Actions */}
            {mode === 'agent' && appointment.status === 'pending' && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Actions</h3>
                {showRejectConfirm ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 mb-3">Are you sure you want to reject this appointment?</p>
                    <div className="mb-3">
                      <label className="block text-sm text-gray-700 mb-1">Reason (optional)</label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm text-sm p-2 border"
                        placeholder="Enter reason..."
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowRejectConfirm(false)}
                        className="flex-1 px-3 py-2 text-sm text-gray-600 bg-white border rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAccept}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Accept Appointment
                    </button>
                    <button
                      onClick={() => setShowRejectConfirm(true)}
                      className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Accepted appointment - Done/Sold actions */}
            {mode === 'agent' && appointment.status === 'accepted' && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Viewing Actions</h3>
                <p className="text-sm text-gray-600 mb-4">
                  When the viewing is complete, mark it as &quot;Done&quot; to make the property available again, 
                  or &quot;Sold&quot; if the customer is purchasing this property.
                </p>
                
                {showDoneConfirm ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 mb-3">
                      Mark this viewing as done? The property will become available for new bookings.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowDoneConfirm(false)}
                        className="flex-1 px-3 py-2 text-sm text-gray-600 bg-white border rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleMarkDone}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Confirm Done
                      </button>
                    </div>
                  </div>
                ) : showSoldConfirm ? (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-700 mb-3">
                      Mark this property as {property?.listingType === 'rent' ? 'rented' : 'sold'}? The property will be removed from listings 
                      and all other pending viewings will be cancelled.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowSoldConfirm(false)}
                        className="flex-1 px-3 py-2 text-sm text-gray-600 bg-white border rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleMarkSold}
                        className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        Confirm {property?.listingType === 'rent' ? 'Rental' : 'Sale'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDoneConfirm(true)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Mark as Done
                    </button>
                    <button
                      onClick={() => setShowSoldConfirm(true)}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Mark as {property?.listingType === 'rent' ? 'Rented' : 'Sold'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Done status info */}
            {mode === 'agent' && appointment.status === 'done' && (
              <div className="mt-6 pt-4 border-t">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    ✓ This viewing has been completed. The property is available for new bookings.
                  </p>
                </div>
              </div>
            )}

            {/* Sold status info */}
            {mode === 'agent' && appointment.status === 'sold' && (
              <div className="mt-6 pt-4 border-t">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700">
                    ✓ This property has been sold! Congratulations on the successful sale.
                  </p>
                </div>
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
