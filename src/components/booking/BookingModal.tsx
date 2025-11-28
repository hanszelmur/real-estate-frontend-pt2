import { useState } from 'react';
import type { Property, Agent, AgentAvailability } from '../../types';
import { useApp, BOOKING_WINDOW_DAYS } from '../../context/AppContext';
import { formatDate, formatTime, randomSelect } from '../../utils/helpers';
import AgentCard from '../common/AgentCard';

interface BookingModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
}

type BookingStep = 'agent' | 'time' | 'confirm';

export default function BookingModal({ property, onClose, onSuccess }: BookingModalProps) {
  const { 
    currentUser, 
    getAvailableAgents, 
    createAppointment, 
    hasAgentConflict, 
    users, 
    updateAgentAvailability, 
    addNotification, 
    isDateWithinBookingWindow, 
    getCustomerPriorityPosition,
    isStartTimeAvailable,
    getSlotWaitlist,
    isSlotHighDemand,
    checkSecondsAvailability
  } = useApp();
  const [step, setStep] = useState<BookingStep>('agent');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AgentAvailability | null>(null);
  const [autoAssign, setAutoAssign] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const availableAgents = getAvailableAgents();

  // Get available START TIMES for selected agent (start-time-only selection)
  const getAvailableStartTimes = (agent: Agent): AgentAvailability[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return agent.availability.filter(slot => {
      const slotDate = new Date(slot.date);
      if (slotDate < today) return false;
      if (slot.isBooked) return false;
      
      // Enforce 7-day rolling window
      if (!isDateWithinBookingWindow(slot.date)) return false;
      
      // Check for unavailable periods and conflicts using start time only
      if (!isStartTimeAvailable(agent.id, slot.date, slot.startTime)) return false;
      
      // For exclusive properties, the slot is still "available" - they'll be added to waitlist
      // For non-exclusive properties, allow booking even if slot is taken (group viewing)
      
      // Check for double-booking - ensure agent doesn't have conflicting appointments with other customers
      const hasConflict = hasAgentConflict(agent.id, slot.date, slot.startTime, undefined);
      return !hasConflict;
    });
  };

  // Group slots by date
  const groupSlotsByDate = (slots: AgentAvailability[]): Record<string, AgentAvailability[]> => {
    return slots.reduce((acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    }, {} as Record<string, AgentAvailability[]>);
  };

  // Check if a slot has existing bookings (for exclusive properties)
  const getExistingBookingsForSlot = (slot: AgentAvailability): number => {
    if (!selectedAgent) return 0;
    const waitlist = getSlotWaitlist(property.id, selectedAgent.id, slot.date, slot.startTime);
    return waitlist.length;
  };

  // Get the position customer would be in the waitlist
  const getWaitlistPositionForSlot = (slot: AgentAvailability): number => {
    return getExistingBookingsForSlot(slot) + 1;
  };

  // Check if a slot is high demand (recent booking activity)
  const isSlotHighDemandForDisplay = (slot: AgentAvailability): boolean => {
    if (!selectedAgent) return false;
    return isSlotHighDemand(property.id, selectedAgent.id, slot.date, slot.startTime);
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setAutoAssign(false);
    setSelectedSlot(null);
    setBookingError(null);
  };

  const handleAutoAssign = () => {
    // Find agents with available slots (not just not on vacation)
    const agentsWithSlots = availableAgents.filter(agent => getAvailableStartTimes(agent).length > 0);
    const randomAgent = randomSelect(agentsWithSlots);
    if (randomAgent) {
      setSelectedAgent(randomAgent);
      setAutoAssign(true);
      setSelectedSlot(null);
      setBookingError(null);
    } else {
      setBookingError('No agents have available slots at this time. Please try again later.');
    }
  };

  const handleSlotSelect = (slot: AgentAvailability) => {
    setSelectedSlot(slot);
    setBookingError(null);
  };

  const handleConfirm = () => {
    if (!selectedAgent || !selectedSlot || !currentUser) return;

    // Record the exact timestamp of booking attempt (seconds precision)
    const bookingAttemptTimestamp = new Date().toISOString();

    // Seconds-precision availability check before creating appointment
    const availabilityCheck = checkSecondsAvailability(selectedAgent.id, selectedSlot.date, selectedSlot.startTime);
    
    // Final check before creating appointment
    if (!isStartTimeAvailable(selectedAgent.id, selectedSlot.date, selectedSlot.startTime)) {
      setBookingError('This start time is no longer available. Please select a different time.');
      setSelectedSlot(null);
      setStep('time');
      return;
    }

    // Get customer info for the appointment
    const customer = users.find(u => u.id === currentUser.id);

    // Check race condition - determine if this customer gets purchase rights
    const hasPurchaseRights = !property.firstViewerCustomerId || property.firstViewerCustomerId === currentUser.id;

    // Check waitlist position for exclusive properties
    const waitlist = getSlotWaitlist(property.id, selectedAgent.id, selectedSlot.date, selectedSlot.startTime);
    const queuePosition = waitlist.length + 1;
    const isQueued = property.isExclusive && waitlist.length > 0;
    
    // Detect if this is a high-demand slot with contention
    const isHighDemand = availabilityCheck.contention || waitlist.length > 0;

    // Create the appointment with seconds-precision tracking
    const newAppointment = createAppointment({
      propertyId: property.id,
      customerId: currentUser.id,
      agentId: selectedAgent.id,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      // No endTime - agent controls when viewing ends
      status: isQueued ? 'queued' : 'pending', // Queued if exclusive slot is taken, otherwise pending
      hasViewingRights: !isQueued, // Only first in queue has viewing rights initially
      hasPurchaseRights: !isQueued && hasPurchaseRights,
      queuePosition: isQueued ? queuePosition : undefined,
      customerName: customer?.name,
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
      bookingAttemptTimestamp, // Seconds-precision timestamp
      wasHighDemandSlot: isHighDemand, // Track if this was a contested slot
    });

    // Mark the slot as booked only if this is the first booking
    if (!isQueued) {
      updateAgentAvailability(selectedAgent.id, selectedSlot.id, true, newAppointment.id);
    }

    // Notify customer about status with immediate feedback
    if (isQueued) {
      addNotification({
        userId: currentUser.id,
        type: 'slot_waitlisted',
        title: 'Added to Waitlist',
        message: `You are #${queuePosition} in line for the ${formatTime(selectedSlot.startTime)} slot on ${formatDate(selectedSlot.date)} at ${property.title}. You will be automatically promoted if customers ahead of you cancel.`,
        read: false,
        relatedId: newAppointment.id,
      });
    } else {
      // Add high-demand warning if applicable
      const highDemandMessage = isHighDemand 
        ? ' This is a popular time slot - we recommend confirming with the agent quickly.'
        : '';
      
      addNotification({
        userId: currentUser.id,
        type: 'booking_confirmed',
        title: '✓ Booking Confirmed',
        message: `Your viewing request for ${property.title} at ${formatTime(selectedSlot.startTime)} has been submitted successfully. The agent will confirm shortly.${highDemandMessage}`,
        read: false,
        relatedId: newAppointment.id,
      });
    }

    onSuccess();
  };

  const renderAgentStep = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Select an Agent</h3>
      
      {bookingError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{bookingError}</p>
        </div>
      )}
      
      {/* Auto-assign option */}
      <div className="mb-4">
        <button
          onClick={handleAutoAssign}
          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
            autoAssign
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Auto-assign Agent</p>
              <p className="text-sm text-gray-500">Let the system choose the best available agent</p>
            </div>
          </div>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white text-sm text-gray-500">Or choose an agent</span>
        </div>
      </div>

      {/* Agent list */}
      <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
        {availableAgents.map(agent => {
          const slotsAvailable = getAvailableStartTimes(agent).length;
          return (
            <div key={agent.id} className="relative">
              <AgentCard
                agent={agent}
                selected={selectedAgent?.id === agent.id && !autoAssign}
                onSelect={slotsAvailable > 0 ? handleAgentSelect : undefined}
                showSelectButton={slotsAvailable > 0}
              />
              {slotsAvailable === 0 && (
                <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center rounded-lg">
                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">No available slots</span>
                </div>
              )}
              {slotsAvailable > 0 && (
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  {slotsAvailable} times
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={() => setStep('time')}
          disabled={!selectedAgent}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderTimeStep = () => {
    if (!selectedAgent) return null;

    const availableSlots = getAvailableStartTimes(selectedAgent);
    const groupedSlots = groupSlotsByDate(availableSlots);

    return (
      <div>
        <h3 className="text-lg font-semibold mb-2">Select a Start Time</h3>
        <p className="text-sm text-gray-500 mb-2">
          Available times with {selectedAgent.name}
        </p>
        
        {/* 7-Day Window Notice */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Booking Window:</strong> Appointments can only be scheduled within the next {BOOKING_WINDOW_DAYS} days.
          </p>
        </div>

        {/* Exclusive Property Notice */}
        {property.isExclusive && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700">
              <strong>Exclusive Viewing:</strong> This property has exclusive viewings. If your selected time is taken, you'll be added to the waitlist.
            </p>
          </div>
        )}

        {bookingError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{bookingError}</p>
          </div>
        )}

        {Object.keys(groupedSlots).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No available times for this agent within the {BOOKING_WINDOW_DAYS}-day window.</p>
            <p className="text-sm mt-1">All times may be booked or blocked.</p>
            <button
              onClick={() => setStep('agent')}
              className="mt-2 text-blue-600 hover:underline"
            >
              Choose a different agent
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {Object.entries(groupedSlots).map(([date, slots]) => (
              <div key={date}>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {formatDate(date)}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(slot => {
                    const existingBookings = getExistingBookingsForSlot(slot);
                    const wouldBeQueued = property.isExclusive && existingBookings > 0;
                    const waitlistPosition = getWaitlistPositionForSlot(slot);
                    const isHighDemand = isSlotHighDemandForDisplay(slot);
                    
                    return (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotSelect(slot)}
                        className={`p-2 text-sm rounded-md border transition-colors relative ${
                          selectedSlot?.id === slot.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : wouldBeQueued
                            ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                            : isHighDemand
                            ? 'border-orange-300 bg-orange-50 hover:border-orange-400'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {isHighDemand && !wouldBeQueued && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                          </span>
                        )}
                        <div className="font-medium">{formatTime(slot.startTime)}</div>
                        {wouldBeQueued && (
                          <div className="text-xs text-yellow-700 mt-1">
                            #{waitlistPosition} in line
                          </div>
                        )}
                        {isHighDemand && !wouldBeQueued && (
                          <div className="text-xs text-orange-600 mt-1">
                            🔥 High demand
                          </div>
                        )}
                        {!property.isExclusive && existingBookings > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Group ({existingBookings + 1})
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setStep('agent')}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Back
          </button>
          <button
            onClick={() => setStep('confirm')}
            disabled={!selectedSlot}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderConfirmStep = () => {
    if (!selectedAgent || !selectedSlot) return null;

    // Check waitlist status for exclusive properties
    const waitlist = getSlotWaitlist(property.id, selectedAgent.id, selectedSlot.date, selectedSlot.startTime);
    const isQueued = property.isExclusive && waitlist.length > 0;
    const queuePosition = waitlist.length + 1;

    // Check if customer will have purchase rights
    const willHavePurchaseRights = !isQueued && (!property.firstViewerCustomerId || property.firstViewerCustomerId === currentUser?.id);
    
    // Get current priority position (0 means they'll be first, otherwise their position in queue)
    const currentPosition = currentUser ? getCustomerPriorityPosition(property.id, currentUser.id) : 0;
    const purchasePriorityPosition = currentPosition > 0 ? currentPosition : 1;
    
    // Professional priority text
    const getPriorityText = () => {
      if (isQueued) {
        return `You will be #${queuePosition} in the waitlist for this time slot.`;
      } else if (willHavePurchaseRights) {
        return 'You will hold the first right to purchase this property.';
      } else if (purchasePriorityPosition === 2) {
        return 'You will be second in line for purchase rights.';
      } else if (purchasePriorityPosition === 3) {
        return 'You will be third in line for purchase rights.';
      } else {
        return `You will be ${purchasePriorityPosition}${getOrdinalSuffix(purchasePriorityPosition)} in line for purchase rights.`;
      }
    };
    
    const getOrdinalSuffix = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };

    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Confirm Booking</h3>

        {bookingError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{bookingError}</p>
          </div>
        )}

        {/* Waitlist Notice for Exclusive Properties */}
        {isQueued && (
          <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 mt-0.5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Waitlist Position: #{queuePosition}
                </p>
                <p className="text-sm mt-1 text-yellow-700">
                  This exclusive slot is taken. You'll be added to the waitlist and notified automatically if promoted.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Priority Information (for non-queued bookings) */}
        {!isQueued && (
          <div className={`mb-4 p-4 rounded-lg ${willHavePurchaseRights ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-start">
              <svg className={`w-5 h-5 mt-0.5 mr-2 ${willHavePurchaseRights ? 'text-green-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {willHavePurchaseRights ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <div>
                <p className={`text-sm font-medium ${willHavePurchaseRights ? 'text-green-800' : 'text-blue-800'}`}>
                  {willHavePurchaseRights ? 'Priority Purchase Rights' : 'Queue Position'}
                </p>
                <p className={`text-sm mt-1 ${willHavePurchaseRights ? 'text-green-700' : 'text-blue-700'}`}>
                  {getPriorityText()}
                </p>
                {!willHavePurchaseRights && !isQueued && (
                  <p className="text-xs text-blue-600 mt-2">
                    Priority is determined by booking timestamp. If customers ahead of you cancel, you will be promoted.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
          <div>
            <p className="text-sm text-gray-500">Property</p>
            <p className="font-medium">{property.title}</p>
            {property.isExclusive && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                Exclusive Viewing
              </span>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Agent</p>
            <p className="font-medium">{selectedAgent.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Viewing Date & Start Time</p>
            <p className="font-medium">
              {formatDate(selectedSlot.date)} at {formatTime(selectedSlot.startTime)}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> {isQueued 
              ? 'You will be added to the waitlist. If the customer ahead of you cancels, you will be automatically promoted and notified.'
              : 'Your booking will be submitted as pending. The agent will confirm your appointment shortly. You can cancel at any time from your dashboard.'
            }
          </p>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setStep('time')}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-md ${
              isQueued 
                ? 'bg-yellow-600 hover:bg-yellow-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isQueued ? 'Join Waitlist' : 'Submit Booking'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 py-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'agent' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                }`}>
                  1
                </div>
                <div className="w-8 h-0.5 bg-gray-200"></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'time' ? 'bg-blue-600 text-white' : step === 'confirm' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <div className="w-8 h-0.5 bg-gray-200"></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
              </div>
            </div>

            {step === 'agent' && renderAgentStep()}
            {step === 'time' && renderTimeStep()}
            {step === 'confirm' && renderConfirmStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
