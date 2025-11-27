import { useState } from 'react';
import type { Property, Agent, AgentAvailability } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDate, formatTimeRange, randomSelect } from '../../utils/helpers';
import AgentCard from '../common/AgentCard';

interface BookingModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
}

type BookingStep = 'agent' | 'time' | 'confirm';

export default function BookingModal({ property, onClose, onSuccess }: BookingModalProps) {
  const { currentUser, getAvailableAgents, createAppointment, hasAgentConflict, users, updateAgentAvailability, addNotification } = useApp();
  const [step, setStep] = useState<BookingStep>('agent');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AgentAvailability | null>(null);
  const [autoAssign, setAutoAssign] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const availableAgents = getAvailableAgents();

  // Get available time slots for selected agent (with double-booking prevention)
  const getAvailableSlots = (agent: Agent): AgentAvailability[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return agent.availability.filter(slot => {
      const slotDate = new Date(slot.date);
      if (slotDate < today) return false;
      if (slot.isBooked) return false;
      
      // Check for double-booking - ensure agent doesn't have conflicting appointments
      const hasConflict = hasAgentConflict(agent.id, slot.date, slot.startTime, slot.endTime);
      return !hasConflict;
    }).slice(0, 24); // Show next 4 days of slots
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

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setAutoAssign(false);
    setSelectedSlot(null);
    setBookingError(null);
  };

  const handleAutoAssign = () => {
    // Find agents with available slots (not just not on vacation)
    const agentsWithSlots = availableAgents.filter(agent => getAvailableSlots(agent).length > 0);
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

    // Final double-booking check before creating appointment
    if (hasAgentConflict(selectedAgent.id, selectedSlot.date, selectedSlot.startTime, selectedSlot.endTime)) {
      setBookingError('This time slot is no longer available. Please select a different time.');
      setSelectedSlot(null);
      setStep('time');
      return;
    }

    // Get customer info for the appointment
    const customer = users.find(u => u.id === currentUser.id);

    // Check race condition - determine if this customer gets purchase rights
    const hasPurchaseRights = !property.firstViewerCustomerId || property.firstViewerCustomerId === currentUser.id;

    // Create the appointment - auto-accept if slot is available (agent can reject later)
    const newAppointment = createAppointment({
      propertyId: property.id,
      customerId: currentUser.id,
      agentId: selectedAgent.id,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      status: 'pending', // Starts as pending, agent can accept/reject
      hasViewingRights: true,
      hasPurchaseRights,
      customerName: customer?.name,
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
    });

    // Mark the slot as booked
    updateAgentAvailability(selectedAgent.id, selectedSlot.id, true, newAppointment.id);

    // Notify customer about pending status
    addNotification({
      userId: currentUser.id,
      type: 'booking_pending',
      title: 'Booking Submitted',
      message: `Your viewing request for ${property.title} has been submitted. The agent will confirm shortly.`,
      read: false,
      relatedId: newAppointment.id,
    });

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
          const slotsAvailable = getAvailableSlots(agent).length;
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
                  {slotsAvailable} slots
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

    const availableSlots = getAvailableSlots(selectedAgent);
    const groupedSlots = groupSlotsByDate(availableSlots);

    return (
      <div>
        <h3 className="text-lg font-semibold mb-2">Select a Time</h3>
        <p className="text-sm text-gray-500 mb-4">
          Available times with {selectedAgent.name}
        </p>

        {bookingError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{bookingError}</p>
          </div>
        )}

        {Object.keys(groupedSlots).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No available slots for this agent.</p>
            <p className="text-sm mt-1">All slots may be booked or blocked.</p>
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
                <div className="grid grid-cols-2 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot)}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        selectedSlot?.id === slot.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {formatTimeRange(slot.startTime, slot.endTime)}
                    </button>
                  ))}
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

    // Check if customer will have purchase rights
    const willHavePurchaseRights = !property.firstViewerCustomerId || property.firstViewerCustomerId === currentUser?.id;

    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Confirm Booking</h3>

        {bookingError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{bookingError}</p>
          </div>
        )}

        {!willHavePurchaseRights && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm text-yellow-800 font-medium">Viewing Only</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Another customer has priority purchase rights for this property. You may view but cannot purchase unless they decline.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
          <div>
            <p className="text-sm text-gray-500">Property</p>
            <p className="font-medium">{property.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Agent</p>
            <p className="font-medium">{selectedAgent.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date & Time</p>
            <p className="font-medium">
              {formatDate(selectedSlot.date)} at {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Your booking will be submitted as pending. The agent will confirm your appointment shortly.
            You can change your agent at any time from your dashboard.
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
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Submit Booking
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
